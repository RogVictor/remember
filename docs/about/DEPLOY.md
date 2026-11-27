# Выпуск страницы /about

## Схема и среда

В рабочем репозитории используются Next.js App Router, PostgreSQL, Payload CMS и обычные CSS-файлы. Docker устанавливает зависимости из `package-lock.json` через npm. Секции хранятся в штатной версионируемой записи `site-seo` с уникальным маршрутом `/about`. Slug `about` зарезервирован в `src/seo/routes.ts`. Страница использует общий Header, Footer, каталог и форму. React cache дедуплицирует чтения внутри запроса. Публичные чтения используют `noStore()`, `draft: false` и `overrideAccess: false`. Опубликованные изменения видны со следующего запроса, включая изменение статуса услуги или страницы, замену файла, настройки организации и SEO.

Служебный контекст серверного рендера разрешает прочитать поля секций и реквизитов для фильтрации на сервере. Публичный REST их не раскрывает. Отдельная коллекция `public-documents` хранит PDF в подкаталоге постоянного тома `/app/media/documents`. Публичное чтение и выдача файла зависят от разрешения на скачивание. Картинки остаются в Media. Переменная `PAYLOAD_MEDIA_DIR` позволяет направить обе коллекции в отдельный каталог для тестов.

Миграция `20261126_221152_about_page` создаёт таблицы блоков и вложенных строк для документа и его версий, коллекцию PDF, индексы и внешние ключи. Добавляет поля подтверждения и реквизитов в CompanySettings. Два новых текстовых поля существующей настройки получают предоставленные владельцем наименования. Подтверждение изначально выключено. Старые поля, записи каталога, slug, SEO и связи сохраняются.

Разовый seed использует Local API и транзакцию PostgreSQL. Advisory lock сериализует одновременные запуски. При существующей SEO-записи seed сохраняет её поля и статус последней версии. Если есть черновик, начальные секции попадут в этот черновик. При новом документе seed публикует согласованные тексты и метаданные. После инициализации маркер защищает даже намеренно очищенный список секций. Для уже редактируемой страницы со своими секциями seed пропускает наполнение. Удаление всей системной записи позволит явной команде seed снова создать её. Чтобы временно закрыть страницу, достаточно снять её с публикации.

Для первого экрана seed ищет существующий Media по имени из пакета V4. При отсутствии сверяет SHA-256 и загружает иллюстрацию кабинета из Git LFS. Услуги определяются по опубликованным записям целевой базы. Результат dry-run показывает пары и пропуски. Все изменения содержимого после выпуска выполняются в админке.

## Порядок первого выпуска

Workflow `.github/workflows/deploy.yml` срабатывает при push в main. При обновлении с образа, в котором ещё отсутствует `scripts/about/seed.mjs`, он применяет миграции и seed перед переключением контейнера. Последующие релизы пропускают наполнение. Для первого запуска или ручного выпуска используйте последовательность ниже в Bash из `/opt/remember`. Согласуйте окно и резервную копию медиа до запуска workflow. Ручной выпуск и workflow выполняют по отдельности.

1. Подготовьте утверждённый checkout и материализуйте LFS командой `git lfs pull`. Зафиксируйте текущий образ и соберите новый образ при работающем сайте.

```bash
cd /opt/remember
export APP_IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
previous="$(docker inspect -f '{{.Image}}' "$(docker compose ps -q app)")"
docker image tag "$previous" "remember-app:before-about-$APP_IMAGE_TAG"
docker compose build app
```

2. В согласованное окно приостановите запись и загрузки. Сделайте согласованные копии базы и медиа. Проверьте архивы и пробное восстановление на отдельном стенде.

```bash
umask 077
mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
docker compose exec -T db pg_dump -U payload -d funeral_site -Fc > "backups/about-$stamp.dump"
docker compose exec -T app tar -C /app/media -czf - . > "backups/about-media-$stamp.tar.gz"
docker compose exec -T db pg_restore --list < "backups/about-$stamp.dump" > /dev/null
tar -tzf "backups/about-media-$stamp.tar.gz" > /dev/null
```

3. Выполните миграцию из **нового** образа, затем dry-run. Сверьте соответствия услуг, статус черновика и целевую базу до применения seed.

```bash
docker compose run --rm --no-deps app npm run payload:migrate:status
docker compose run --rm --no-deps app npm run payload:migrate
docker compose run --rm --no-deps app npm run about:seed -- --dry-run
docker compose run --rm --no-deps app npm run about:seed -- --apply
docker compose run --rm --no-deps app npm run about:seed -- --dry-run
```

4. Последний вызов должен показать `already-initialized`. Если инициализирован черновик прежней SEO-записи, согласуйте публикацию с владельцем. Запустите образ и проверьте приложение.

```bash
docker compose up -d --no-deps app
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS -A Googlebot https://ritualgroup24.ru/about > /tmp/remember-about-release.html
curl -fsS https://ritualgroup24.ru/robots.txt
curl -fsS https://ritualgroup24.ru/sitemap.xml
```

Откройте админку, проверьте запись `/about`, изображение и форму без отправки реальной заявки. Сверьте H1, Title, canonical, robots, граф AboutPage и число записей /about в sitemap с настройками индексации. При `SEO_INDEXING_ENABLED` со значением, отличным от `true`, весь сайт отдаёт noindex, а sitemap пуст.

## Откат

Для отката приложения переключите тег на сохранённый образ. Аддитивная схема совместима со старым приложением. Новые тексты и файлы останутся в хранилище. Обратная миграция удаляет **новые** таблицы блоков, их версии, записи PDF и колонки реквизитов. После начала работы редакторов она приведёт к потере этих данных. Если требуется восстановление данных, используйте проверенные резервные копии, отдельную базу и отдельный том медиа. Сначала проверьте восстановленный экземпляр, затем согласуйте переключение. [Общий регламент развёртывания](../production-deployment.md)

## Повторение проверок

Для `npm run test:about` нужна свежая мигрированная PostgreSQL-база на loopback с именем `remember_about_test` либо таким же префиксом и суффиксом через подчёркивание. Задайте `DATABASE_URL` и тот же `ABOUT_TEST_DATABASE_URL`, отдельную `PAYLOAD_MEDIA_DIR`, тестовый `PAYLOAD_SECRET`, `NODE_ENV=production`, `SITE_URL=https://integration.invalid`, `SEO_INDEXING_ENABLED=true`. Используйте тестовое окружение с отключёнными уведомлениями. Выполните `npm run payload:migrate`, `npm run build`, затем `npm run test:about`. Тест сам запускает Next на свободном локальном порту.

Для теста перехода со старой версии укажите отдельную пустую базу `remember_about_legacy_test` и отдельный каталог медиа. Команда `node --import=./scripts/payload-cli-loader.mjs tests/about-migration.mjs` создаст предыдущую схему, добавит старые записи, применит новый релиз и проверит их сохранность.
