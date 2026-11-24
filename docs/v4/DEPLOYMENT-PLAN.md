# Развёртывание RitualGroup24 V4 в /opt/remember

Команды предназначены для согласованного окна обслуживания. Оператор выполняет серверные блоки последовательно в **одной сессии Bash**. Ошибка прерывает сессию. Путь к каталогу восстановления выводится до остановки сайта. При ошибке используйте [план отката](ROLLBACK-PLAN.md).

## 1. Передать согласованный релиз

После разрешения, на рабочей станции с подготовленным Git-индексом выполните команды ниже. Ветка релиза позволяет доставить код и файлы до запуска стандартного workflow. Push в `main` запускает его автоматически, в том числе миграции и замену контейнера.

~~~sh
git switch -c release/ritualgroup24-v4
git diff --cached --stat
git commit -m "Prepare RitualGroup24 V4 draft content import"
git lfs push origin release/ritualgroup24-v4
git push -u origin release/ritualgroup24-v4
git rev-parse HEAD
~~~

Передайте выведенный полный SHA оператору. ZIP служит копией для передачи. Импорт читает распакованный каталог, включая 17 JSON, 74 рабочих изображения, 54 OG и 6 исходников кадрирования.

## 2. Проверить сервер, скачать файлы и собрать образ при работающем сайте

~~~bash
set -Eeuo pipefail
umask 077
cd /opt/remember
test "$(git rev-parse --show-toplevel)" = "$PWD"
test "$(git branch --show-current)" = main
test -z "$(git status --porcelain --untracked-files=no)"
read -r -p 'Полный согласованный SHA V4: ' RELEASE_SHA
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]
git fetch origin refs/heads/release/ritualgroup24-v4
test "$(git rev-parse FETCH_HEAD)" = "$RELEASE_SHA"
OLD_SHA=$(git rev-parse HEAD)
test "$OLD_SHA" != "$RELEASE_SHA"
git merge-base --is-ancestor "$OLD_SHA" "$RELEASE_SHA"
git log --oneline "$OLD_SHA..$RELEASE_SHA"
git diff --stat "$OLD_SHA" "$RELEASE_SHA" -- migrations docker-compose.yml .github/workflows
git diff --exit-code "$OLD_SHA" "$RELEASE_SHA" -- docker-compose.yml .github/workflows/deploy.yml
git lfs version
test -r .env
APP_ID=$(docker compose ps -q app)
DB_ID=$(docker compose ps -q db)
test -n "$APP_ID" && test -n "$DB_ID" || exit 1
test "$(docker inspect -f '{{.State.Health.Status}}' "$APP_ID")" = healthy
test "$(docker inspect -f '{{.State.Health.Status}}' "$DB_ID")" = healthy
curl -fsS http://127.0.0.1:3000/api/health
docker compose exec -T app node -e 'if (process.env.SEO_INDEXING_ENABLED === "true") process.exit(1)'
MEDIA_VOL=$(docker inspect -f '{{range .Mounts}}{{if and (eq .Destination "/app/media") (eq .Type "volume")}}{{.Name}}{{end}}{{end}}' "$APP_ID")
test -n "$MEDIA_VOL"
docker volume inspect "$MEDIA_VOL" --format '{{.Name}}'
OLD_IMAGE=$(docker inspect -f '{{.Image}}' "$APP_ID")
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OLD_TAG="rollback-v4-$STAMP"
TAG=$(git rev-parse --short=12 "$RELEASE_SHA")
B="$HOME/remember-backups/v4-$STAMP"
mkdir -p "$(dirname "$B")"
mkdir -m 700 "$B"
printf 'Каталог для отката: %s\n' "$B"
declare -p OLD_SHA RELEASE_SHA OLD_IMAGE OLD_TAG TAG STAMP MEDIA_VOL DB_ID > "$B/release.bash"
docker tag "$OLD_IMAGE" "remember-app:$OLD_TAG"
docker compose exec -T db psql -XAt -v ON_ERROR_STOP=1 -U payload -d funeral_site -c 'SELECT current_database(), pg_size_pretty(pg_database_size(current_database()))'
df -h "$B" /opt/remember
docker system df
~~~

Оцените свободное место на файловых системах Docker и копий. Проверьте список коммитов. В самом V4 новых SQL-миграций нет. Новый параметр представления находится внутри JSON Lexical. Последняя зарегистрированная миграция проекта — `20261124_162717_seo_module`.

~~~bash
git merge --ff-only "$RELEASE_SHA"
git lfs pull origin
git lfs fsck --objects HEAD
PKG=content-import/RitualGroup24-V4-final
printf '%s  %s\n' '38c10f27c5b36abd727a2700534dc032bc5039e53ac3951f4a56f1f009cf5ac0' "$PKG.zip" | sha256sum -c -
test "$(find "$PKG" -maxdepth 1 -type f -name '*.json' | wc -l)" -eq 17
test "$(find "$PKG/images" -type f -name '*.webp' | wc -l)" -eq 74
test "$(find "$PKG/og" -type f -name '*.webp' | wc -l)" -eq 54
test "$(find "$PKG/source-images" -type f -name '*.webp' | wc -l)" -eq 6
APP_IMAGE_TAG="$TAG" docker compose build app
IMAGE=$(docker image inspect -f '{{.Id}}' "remember-app:$TAG")
docker run --rm --network none "$IMAGE" npm run content:check
~~~

Последняя команда проверяет поставку внутри готового образа, включая байты изображений. Ожидается `offline dry-run` с 54 страницами, 10 категориями, 44 услугами и 128 Media.

## 3. Подготовить параметры и согласованную копию базы и файлов

Сервис `db` использует PostgreSQL 16 на порту 5432 внутри контейнера. Импортёр принимает только явно заданный loopback URI. Одноразовый контейнер использует сетевое пространство текущего `db`, так что его `127.0.0.1:5432` ведёт в этот экземпляр. Порты и настройки работающих сервисов остаются штатными. Для миграций Compose использует обычный адрес `db:5432`.

~~~bash
run_app() {
  APP_IMAGE_TAG="$TAG" docker compose run --rm --no-deps -T -e PAYLOAD_DROP_DATABASE=false app "$@"
}
IMPORT_ENV=$(mktemp /dev/shm/remember-v4.XXXXXXXX)
trap 'rm -f -- "$IMPORT_ENV"' EXIT
run_app node -e '
  const e = process.env, u = new URL(e.DATABASE_URL), site = e.SITE_URL || e.NEXT_PUBLIC_SITE_URL
  if (!["postgres:", "postgresql:"].includes(u.protocol) || u.hostname !== "db" ||
      u.port !== "5432" || u.pathname !== "/funeral_site" || u.username !== "payload" ||
      !u.password || u.search || u.hash || e.SEO_INDEXING_ENABLED === "true" ||
      new URL(site).protocol !== "https:" || !e.PAYLOAD_SECRET || e.PAYLOAD_SECRET.length < 32) process.exit(1)
  u.hostname = "127.0.0.1"
  for (const [key, value] of Object.entries({CONTENT_IMPORT_DATABASE_URL:u.href,
       PAYLOAD_SECRET:e.PAYLOAD_SECRET, SITE_URL:site})) {
    if (/[\r\n\0]/.test(value)) process.exit(1)
    console.log(key + "=" + value)
  }' > "$IMPORT_ENV"
test "$(wc -l < "$IMPORT_ENV")" -eq 3
import_v4() {
  test "$(docker compose ps -q db)" = "$DB_ID" || return 1
  local access=$1
  shift
  local mount="type=volume,src=$MEDIA_VOL,dst=/app/media,volume-nocopy"
  local flags=()
  case "$access" in
    read) mount="$mount,readonly"; flags+=(-e 'PGOPTIONS=-c default_transaction_read_only=on');;
    write) ;;
    *) return 2;;
  esac
  docker run --rm --name "remember-v4-job-$STAMP" --network "container:$DB_ID" \
    --mount "$mount" --env-file "$IMPORT_ENV" -e NODE_ENV=production \
    -e SEO_INDEXING_ENABLED=false -e CONTENT_IMPORT_MEDIA_DIR=/app/media \
    "${flags[@]}" "$IMAGE" npm run "$@"
}
~~~

Согласуйте остановку приложения и остальных писателей в БД и медиатом. С этого шага и до старта приложения сайт временно недоступен. Текущий контейнер приложения сохраняется остановленным.

~~~bash
docker compose stop app
test "$(docker inspect -f '{{.State.Running}}' "$APP_ID")" = false
test -z "$(docker ps -q --filter "volume=$MEDIA_VOL")"
connections=$(docker compose exec -T db psql -XAt -v ON_ERROR_STOP=1 -U payload -d postgres \
  -c "SELECT count(*) FROM pg_stat_activity WHERE datname='funeral_site' AND backend_type='client backend'")
test "$connections" = 0
docker compose exec -T db pg_dump -U payload -d funeral_site --format=custom > "$B/postgres.dump"
docker run --rm --user 0:0 --network none \
  --mount "type=volume,src=$MEDIA_VOL,dst=/snapshot,readonly,volume-nocopy" \
  "$OLD_IMAGE" tar -C /snapshot -czf - . > "$B/media.tar.gz"
test -s "$B/postgres.dump"
test -s "$B/media.tar.gz"
docker compose exec -T db pg_restore --list < "$B/postgres.dump" > "$B/postgres.contents"
tar -tzf "$B/media.tar.gz" > "$B/media.contents"
(cd "$B" && sha256sum postgres.dump media.tar.gz > SHA256SUMS && sha256sum -c SHA256SUMS)
~~~

Сохраните пару и контрольные суммы в принятом защищённом хранилище резервных копий. Список объектов и SHA проверяют читаемость и целостность архивов. Проверку восстановления выполняют на отдельной базе и томе. Адрес внешнего хранилища задаёт оператор.

## 4. Проверить миграции и выполнить dry-run на существующей базе

~~~bash
run_app npm run payload:migrate:status | tee "$B/migrations-before.log"
~~~

Если все семь миграций уже применены, переходите сразу к dry-run. Если есть ожидающие, сверьте имена и SQL с фактической историей схемы. Начальная миграция, помеченная ожидающей при уже существующих таблицах Payload, или неизвестная миграция требуют разбора. Только для согласованного списка ожидающих выполните следующий блок.

~~~bash
run_app npm run payload:migrate | tee "$B/migrations-apply.log"
run_app npm run payload:migrate:status | tee "$B/migrations-after.log"
~~~

После подтверждения статуса всех миграций сохраните состояние существующих строк и выполните проверку. Для dry-run PostgreSQL открывает транзакции в режиме чтения, а медиатом примонтирован только для чтения.

~~~bash
inventory() {
  local target=$1
  docker compose exec -T db psql -XAtq -v ON_ERROR_STOP=1 -U payload -d funeral_site <<'SQL' | LC_ALL=C sort > "$target"
SELECT 'page ' || id || ' ' || md5(to_jsonb(t)::text) FROM pages t
UNION ALL SELECT 'service ' || id || ' ' || md5(to_jsonb(t)::text) FROM services t
UNION ALL SELECT 'category ' || id || ' ' || md5(to_jsonb(t)::text) FROM service_categories t
UNION ALL SELECT 'media ' || id || ' ' || md5(to_jsonb(t)::text) FROM media t;
SQL
}
public_ids() {
  docker compose exec -T db psql -XAtq -v ON_ERROR_STOP=1 -U payload -d funeral_site <<'SQL' | LC_ALL=C sort
SELECT 'page ' || id FROM pages WHERE _status = 'published'
UNION ALL SELECT 'service ' || id FROM services WHERE _status = 'published'
UNION ALL SELECT 'category ' || id FROM service_categories WHERE active IS TRUE;
SQL
}
inventory "$B/existing.before"
public_ids > "$B/public.before"
import_v4 read content:check -- --database | tee "$B/dry-run.log"
grep -Fq '"mode":"database dry-run"' "$B/dry-run.log"
~~~

Ожидается `mode: database dry-run`. В `existing` видны совпадения с текущей базой. Категории сопоставляются по точному названию, Pages и Services по slug, Media по имени и контрольной сумме. `mediaNeeded` показывает число требуемых привязок к разным файлам. Сверьте найденное с ожидаемым каталогом. При несовместимой связи, различии файлов или неожиданном количестве совпадений остановитесь до импорта. Если схема и данные ещё не изменялись, сайт можно вернуть по первому сценарию отката.

## 5. Импортировать и вернуть приложение в работу

Только после проверки dry-run выполните **один** вызов записи. Штатный режим пропускает существующие документы. Новые Pages и Services получают статус draft, новые категории — active=false. Media доступны по действующим правилам медиатеки.

~~~bash
import_v4 write content:import | tee "$B/import.log"
import_v4 read content:check -- --database | tee "$B/postcheck.log"
inventory "$B/existing.after"
LC_ALL=C comm -23 "$B/existing.before" "$B/existing.after" > "$B/changed-existing"
test ! -s "$B/changed-existing"
public_ids > "$B/public.after"
cmp "$B/public.before" "$B/public.after"
docker run --rm -i --network none "$IMAGE" node -e '
  const fs = require("node:fs"), assert = require("node:assert/strict")
  const rows = fs.readFileSync(0, "utf8").split(/\r?\n/).filter(s => s.startsWith("{")).map(s => {try{return JSON.parse(s)}catch{return {}}})
  const a=rows.find(r => r.mode === "apply"), c=rows.find(r => r.mode === "database dry-run")
  assert.ok(a && c); assert.deepEqual(a.updated, {})
  assert.equal(c.existing.pages,54); assert.equal(c.existing.categories,10)
  assert.equal(c.existing.services,44); assert.equal(c.mediaNeeded,0)
' < <(cat "$B/import.log" "$B/postcheck.log")
~~~

Отчёт `created/skipped` зависит от наполнения базы. После прерывания медиа могли сохраниться до транзакции графа. Перед повтором установите, что прежний процесс завершён, и повторите dry-run. При оставшемся `.v4-import.lock` проверьте отсутствие других писателей и сохраните файл блокировки для разбора. Конфликт файлов или связей требует решения оператора. Полный откат описан отдельно.

С запуском приложения возможны новые заявки и редакторские записи. Зафиксируйте этот момент перед командой запуска.

~~~bash
date -u +%FT%TZ > "$B/app-start-attempted"
APP_IMAGE_TAG="$TAG" docker compose up -d --no-deps --force-recreate --pull never app
CURRENT=$(docker compose ps -q app)
test "$(docker inspect -f '{{.Image}}' "$CURRENT")" = "$IMAGE"
for i in $(seq 1 40); do
  if [ "$(docker inspect -f '{{.State.Health.Status}}' "$CURRENT")" = healthy ]; then break; fi
  sleep 5
done
test "$(docker inspect -f '{{.State.Health.Status}}' "$CURRENT")" = healthy
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/robots.txt > "$B/robots.txt"
grep -Exq 'Disallow: /[[:space:]]*' "$B/robots.txt"
curl -fsS http://127.0.0.1:3000/sitemap.xml > "$B/sitemap.xml"
grep -q '<urlset' "$B/sitemap.xml"
if grep -q '<loc>' "$B/sitemap.xml"; then exit 1; fi
rm -f -- "$IMPORT_ENV"
trap - EXIT
docker compose ps
~~~

Сохраните SHA и тег образа вместе с журналом. Для будущего пересоздания приложения до синхронизации веток используйте `APP_IMAGE_TAG="$TAG"`. Локальная `main` на VPS теперь указывает на согласованный релиз. Обновление удалённой `main` запустит отдельный штатный деплой. Согласуйте его отдельно и сохраняйте прямое продолжение истории. Просмотр в админке возможен после запуска. Активация категорий, публикация и изменение индексации остаются отдельными действиями владельца.
