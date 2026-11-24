# Откат RitualGroup24 V4

Выберите момент ошибки. **До изменения БД и Media** достаточно вернуть прежний исходный код и контейнер. **После миграции или начала записи** для точного возврата нужна согласованная пара PostgreSQL и Media. **После запуска приложения** могли поступить новые заявки, сообщения и правки. В этом случае сначала сохраните текущее состояние, затем согласуйте с владельцем перенос новых данных. Восстановление старого дампа до такого разбора приводит к потере новых записей из рабочего каталога.

Все команды запускаются на том же сервере в Bash. При наличии параллельного workflow или контейнера импорта сначала дождитесь его завершения и выясните результат. Проверяйте вывод каждого блока.

## 1. Выбрать релиз и зафиксировать исходные параметры

~~~bash
set -Eeuo pipefail
umask 077
cd /opt/remember
read -r -p 'Полный путь к каталогу копий v4 из журнала релиза: ' B
B=$(realpath -e "$B")
[[ "$B" == "$HOME"/remember-backups/v4-* ]]
test -O "$B/release.bash"
source "$B/release.bash"
test "$(docker compose ps -q db)" = "$DB_ID"
test "$(docker image inspect -f '{{.Id}}' "remember-app:$OLD_TAG")" = "$OLD_IMAGE"
test "$(git branch --show-current)" = main
test -z "$(git status --porcelain --untracked-files=no)"
head_sha=$(git rev-parse HEAD)
[[ "$head_sha" = "$OLD_SHA" || "$head_sha" = "$RELEASE_SHA" ]]
test -z "$(docker ps -q --filter "name=^/remember-v4-job-$STAMP$")"
restore_code() {
  if [[ "$(git rev-parse HEAD)" = "$RELEASE_SHA" ]]; then
    git reset --keep "$OLD_SHA" || return 1
  fi
  test "$(git rev-parse HEAD)" = "$OLD_SHA"
}
start_previous() {
  APP_IMAGE_TAG="$OLD_TAG" docker compose up -d --no-deps --force-recreate --pull never app || return 1
  local app
  app=$(docker compose ps -q app)
  test "$(docker inspect -f '{{.Image}}' "$app")" = "$OLD_IMAGE" || return 1
  for i in $(seq 1 40); do
    if [ "$(docker inspect -f '{{.State.Health.Status}}' "$app")" = healthy ]; then break; fi
    sleep 5
  done
  test "$(docker inspect -f '{{.State.Health.Status}}' "$app")" = healthy || return 1
  curl -fsS http://127.0.0.1:3000/api/health
}
~~~

## 2. Ошибка скачивания, сборки, резервного копирования или dry-run

Этот путь применим, если миграции и запись импорта **ещё не начинались**. Если старый контейнер продолжает работать, достаточно восстановить исходники и проверить health. Если он был остановлен, запустите старый образ. Неполные копии после ошибки пометьте в журнале.

~~~bash
restore_code
app=$(docker compose ps -q app)
if [[ -z "$app" || "$(docker inspect -f '{{.Image}}' "$app")" != "$OLD_IMAGE" ]]; then
  start_previous
else
  curl -fsS http://127.0.0.1:3000/api/health
fi
~~~

## 3. После записи. Сохранить состояние в момент отказа

Если приложение уже принимало трафик, при совместимой схеме возможен возврат только образа по шагу 2 после согласования совместимости. Импортированные черновики в этом случае сохранятся. Для восстановления **данных** остановите приложение и все внешние процессы записи в согласованное время. Заявки и чат временно недоступны.

~~~bash
(cd "$B" && sha256sum -c SHA256SUMS)
APP=$(docker compose ps --all -q app)
actual_media=$(docker inspect -f '{{range .Mounts}}{{if and (eq .Destination "/app/media") (eq .Type "volume")}}{{.Name}}{{end}}{{end}}' "$APP")
test "$actual_media" = "$MEDIA_VOL"
docker compose stop app
test -z "$(docker ps -q --filter "volume=$MEDIA_VOL")"
connections=$(docker compose exec -T db psql -XAt -v ON_ERROR_STOP=1 -U payload -d postgres \
  -c "SELECT count(*) FROM pg_stat_activity WHERE datname='funeral_site' AND backend_type='client backend'")
test "$connections" = 0
R="$B/recovery-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 700 "$R"
docker compose exec -T db pg_dump -U payload -d funeral_site -Fc > "$R/at-failure.dump"
docker run --rm --network none --user 0:0 \
  --mount "type=volume,src=$MEDIA_VOL,dst=/snapshot,readonly,volume-nocopy" \
  "$OLD_IMAGE" tar -C /snapshot -czf - . > "$R/at-failure-media.tar.gz"
docker compose exec -T db pg_restore --list < "$R/at-failure.dump" > "$R/at-failure.contents"
tar -tzf "$R/at-failure-media.tar.gz" > "$R/at-failure-media.contents"
(cd "$R" && sha256sum at-failure.dump at-failure-media.tar.gz > SHA256SUMS && sha256sum -c SHA256SUMS)
~~~

## 4. Восстановить в отдельные базу и том, затем переключить

Восстановление в отдельные базу и том позволяет проверить снимок даже после возобновления трафика. Файл `app-start-attempted` отмечает момент, с которого возможны новые пользовательские записи.

~~~bash
SUFFIX=$(date -u +%Y%m%d%H%M%S)
RESTORED="remember_v4_restore_$SUFFIX"
QUARANTINE="remember_v4_previous_$SUFFIX"
STAGED_VOL="remember-v4-restored-media-$SUFFIX"
SAVED_VOL="remember-v4-previous-media-$SUFFIX"
for v in "$STAGED_VOL" "$SAVED_VOL"; do
  if docker volume inspect "$v" >/dev/null 2>&1; then exit 1; fi
  docker volume create "$v"
done
printf '%s\n' "$RESTORED" "$QUARANTINE" "$STAGED_VOL" "$SAVED_VOL" > "$R/recovery-names"
docker compose exec -T db createdb -U payload -T template0 -O payload "$RESTORED"
docker compose exec -T db pg_restore -U payload --exit-on-error --single-transaction \
  -d "$RESTORED" < "$B/postgres.dump"
docker compose exec -T db psql -XAt -v ON_ERROR_STOP=1 -U payload -d "$RESTORED" \
  -c 'SELECT current_database(), count(*) FROM users'
docker run --rm -i --network none --user 0:0 \
  --mount "type=volume,src=$STAGED_VOL,dst=/restore,volume-nocopy" \
  "$OLD_IMAGE" tar -C /restore -xzpf - < "$B/media.tar.gz"
~~~

Убедитесь, что восстановленный набор соответствует снимку и достаточно места для второй копии медиа. Если приложение уже пытались запустить, сравните состояние в момент отказа с восстановленной базой и томом. Проверьте заявки, переписку, версии документов, новые загрузки и прочие записи после снимка. Перенесите согласованные изменения в `$RESTORED` и `$STAGED_VOL`, если они есть. При расхождениях, которые ещё не разобраны, оставьте рабочие данные на месте. Для этого случая блок переключения запрашивает отдельное подтверждение оператора.

При переключении рабочая БД получает временное имя, а восстановленная — штатное имя `funeral_site`. Исходная база сохраняется. Файлы рабочего тома переносятся в отдельный том для разбора. Штатное имя тома Compose и права из резервной копии сохраняются.

~~~bash
if [[ -e "$B/app-start-attempted" ]]; then
  read -r -p 'После сверки новых записей с владельцем введите имя подготовленной базы для переключения: ' approved
  test "$approved" = "$RESTORED"
  date -u +%FT%TZ > "$R/post-traffic-reconciliation-confirmed"
fi
test -z "$(docker compose ps -q app)"
test -z "$(docker ps -q --filter "volume=$MEDIA_VOL")"
docker compose exec -T db psql -X -v ON_ERROR_STOP=1 -U payload -d postgres \
  -v old="$QUARANTINE" -v restored="$RESTORED" <<'SQL'
BEGIN;
ALTER DATABASE funeral_site RENAME TO :"old";
ALTER DATABASE :"restored" RENAME TO funeral_site;
COMMIT;
SQL
docker run --rm --network none --user 0:0 \
  --mount "type=volume,src=$MEDIA_VOL,dst=/live,volume-nocopy" \
  --mount "type=volume,src=$SAVED_VOL,dst=/saved,volume-nocopy" \
  --mount "type=volume,src=$STAGED_VOL,dst=/restored,readonly,volume-nocopy" \
  "$OLD_IMAGE" sh -ec '
    test -z "$(ls -A /saved)"
    for f in /live/* /live/.[!.]* /live/..?*; do
      [ -e "$f" ] || [ -L "$f" ] || continue
      mv "$f" /saved/
    done
    cp -ap /restored/. /live/
    chown "$(stat -c %u:%g /restored)" /live
    chmod "$(stat -c %a /restored)" /live
  '
restore_code
start_previous
docker compose ps
~~~

При сбое между переключением базы и копированием медиа оставьте приложение остановленным. Используйте имена из `recovery-names` и обе пары архивов. Нельзя повторять переключение имён после уже завершённой транзакции. Сохраняйте резервный образ, архивы, переименованную базу и оба дополнительных тома до приёмки восстановления. Удаление снимков оформите отдельно по принятому сроку хранения.
