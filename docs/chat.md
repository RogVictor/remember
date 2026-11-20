# Чат сайта и Telegram

Виджет появляется на публичных страницах при заполненных настройках чата. Сервер выдаёт случайный 256-битный токен в HttpOnly cookie на 90 дней (Secure в production). В БД хранится SHA-256 токена. Администратор Payload видит диалоги, историю, даты, статус, поля имени и телефона. Посетителю достаточно текста обращения. Закрытый диалог доступен для чтения, администратор может открыть его снова.

## Бот и группа

1. Создайте отдельного бота командой `/newbot` у @BotFather. Внесите токен в серверный `.env` как `TELEGRAM_CHAT_BOT_TOKEN`. Существующие `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` относятся к формам заявок.
2. Создайте закрытую группу, добавьте операторов и бота. Разрешите боту отправлять сообщения. Оставьте включённым Privacy Mode. Для обычного Reply на сообщение бота прав администратора не требуется. Операторы должны писать от своего аккаунта. [Telegram Bots FAQ](https://core.telegram.org/bots/faq#what-messages-will-my-bot-get)
3. До регистрации webhook попросите каждого оператора послать в группу команду `/start@имя_бота`. В работающем контейнере выполните следующую команду. Она выводит только ID из полученных групповых команд.

```sh
docker compose exec -T app node --input-type=module <<'JS'
import { requestTelegram } from './src/lib/telegram-api.mjs'
try {
  const response = await requestTelegram(process.env.TELEGRAM_CHAT_BOT_TOKEN, 'getUpdates')
  const data = await response.json()
  if (!response.ok || !data.ok) throw new Error()
  for (const { message } of data.result) {
    if (message?.chat?.id < 0 && message?.text?.startsWith('/start@')) console.log(message.chat.id, message.from.id)
  }
} catch {
  console.error('Не удалось получить обновления Telegram')
  process.exitCode = 1
}
JS
```

4. Укажите отрицательный ID группы в `TELEGRAM_CHAT_GROUP_ID`, числовые ID проверенных операторов через запятую в `TELEGRAM_CHAT_OPERATOR_IDS`. Сгенерируйте `TELEGRAM_CHAT_WEBHOOK_SECRET` командой `openssl rand -hex 32`. Храните значение в серверном окружении. Приложение получает переменные через уже настроенный Compose `env_file`.
5. При первичной настройке бота зарегистрируйте HTTPS webhook. Команда читает `TELEGRAM_CHAT_BOT_TOKEN`, `TELEGRAM_CHAT_WEBHOOK_SECRET` и `SITE_URL` из окружения контейнера. Путь обрабатывает Next.js через существующий обратный прокси. Для запросов посетителя приложение использует доверенный `X-Real-IP`, как и форма заявок. [Telegram Bot API](https://core.telegram.org/bots/api#setwebhook)

```sh
docker compose exec -T app node --input-type=module <<'JS'
import { requestTelegram } from './src/lib/telegram-api.mjs'
const { TELEGRAM_CHAT_BOT_TOKEN: token, TELEGRAM_CHAT_WEBHOOK_SECRET: secret, SITE_URL } = process.env
try {
  if (!token || !secret || !SITE_URL?.startsWith('https://')) throw new Error()
  const url = new URL('/api/chat/webhook', SITE_URL).href
  const set = await requestTelegram(token, 'setWebhook', { url, secret_token: secret, allowed_updates: ['message'] }).then(r => r.json())
  if (!set.ok) throw new Error()
  const info = await requestTelegram(token, 'getWebhookInfo').then(r => r.json())
  if (!info.ok || info.result.url !== url) throw new Error()
  console.log('Webhook зарегистрирован. Ожидают доставки:', info.result.pending_update_count)
} catch {
  console.error('Не удалось зарегистрировать или проверить webhook Telegram')
  process.exitCode = 1
}
JS
```

## Исходящий прокси и проверка на VPS

В серверном `.env` укажите `TELEGRAM_CHAT_PROXY_URL` в формате `http://user:password@proxy.example:3128` или `https://user:password@proxy.example:3128`. Схема определяет соединение с прокси. Для доступа к Telegram в обоих случаях используется CONNECT. Специальные символы логина и пароля кодируйте по правилам URL, например `@` как `%40`. Для прямого подключения оставьте переменную пустой. Настройка действует на Bot API чата и уведомлений о заявках. Уже зарегистрированный webhook продолжит принимать входящие запросы по прежнему адресу.

Если собираете образ на VPS из исходников, выполните из каталога Compose:

```sh
docker compose up -d --build app
docker compose exec -T app node scripts/telegram-check.mjs
curl -fsS http://127.0.0.1:3000/api/health
```

Если используете готовый образ, выполните команду проверки после штатного развёртывания новой версии. При успешной проверке `getMe` через прокси ожидается `{"mode":"proxy","status":200,"result":"ok"}`. Проверка выводит только режим, HTTP-статус при получении ответа и результат. При ошибке код завершения равен `1`. `invalid_proxy_configuration` означает ошибку в настройке URL, `invalid_bot_token` — отсутствующий или некорректный формат токена, `connection_failed` — сбой при установлении соединения или туннеля, `timeout` — истечение срока ожидания, `http_error` — ответ API с кодом вне диапазона 2xx. Доступ бота к группе и обработку Reply проверьте по шагам приёмки ниже.

## Ручное применение миграции

Сначала прогоните миграции на отдельной копии базы. На production штатный workflow собирает образ с тегом коммита, делает дамп и проверяет его через `pg_restore --list`. При первом выпуске чата workflow остановится **до переключения контейнера** и покажет тег. Это точка ручного согласования миграции. Убедитесь, что дамп можно восстановить в отдельную БД и что тег образа соответствует проверенному коммиту.

В каталоге Compose после разрешения владельца выполните команды ниже, подставив тег из workflow. Проверьте вывод первой команды перед второй. Ожидаемая новая запись — `20261119_233002_chat`. Если в ожидании другие миграции, сначала проверьте их отдельно.

```sh
export APP_IMAGE_TAG='<тег проверенного образа>'
docker compose run --rm --no-deps app npm run payload:migrate:status
docker compose run --rm --no-deps app npm run payload:migrate
docker compose run --rm --no-deps app npm run payload:migrate:status
```

Повторите workflow для того же коммита. Новая схема добавляет таблицы и связи. При возврате предыдущего приложения оставьте их в БД, чтобы сохранить обращения. Обратная миграция удаляет историю чатов.

На отдельной БД проверены применение, откат и повторное применение миграции чата. При откате общего пакета вместе со старой миграцией InfoArticles её прежний `down` завершился ошибкой при удалении уже снятого внешнего ключа. Учитывайте состав пакета при восстановлении. Для отката приложения штатный workflow переключает Docker-образ.

## Приёмка

- Откройте сайт на телефоне, отправьте уникальную несекретную фразу. Проверьте текст и номер диалога в группе. Нажмите **Ответить** именно на доставленное ботом сообщение.
- Убедитесь, что ответ появляется на сайте и сохраняется после перезагрузки. В отдельном приватном окне должна открываться своя история. Проверьте, что ответ другого разрешённого оператора попадает в тот же диалог.
- В Payload откройте «Диалоги» и соответствующие «Сообщения чата». У доставленного обращения заполнены Telegram Group и Telegram Message, поле Retry At пусто. При сбое Retry At содержит время следующей попытки.
- Для локального интеграционного теста используйте пустую выделенную БД на localhost с именем, заканчивающимся на `_chat_test`. Задайте `DATABASE_URL` и `CHAT_TEST_DATABASE_URL` этой базы, тестовые `PAYLOAD_SECRET`, HTTPS `SITE_URL` и `NODE_ENV=production`. Выполните `npm run payload:migrate`, `npm run build`, `npm run test:chat`. Тест запускает собранный Next.js на loopback, заменяет Telegram локальным HTTP-сервером и очищает созданную историю.

## Ограничения первой версии

Текстовые обращения до 2000 символов. Polling каждые 2,5 секунды при открытом чате на активной вкладке. Лимиты на минуту для одного IP — 12 операций создания/восстановления, 20 отправок, 240 чтений. Счётчики хранятся в процессе приложения и сбрасываются при перезапуске. Для нескольких реплик потребуется общий лимитер.

Очередь находится в PostgreSQL. Работающий процесс Next.js проверяет её каждые три секунды, в том числе когда посетитель ушёл. При ошибках интервал повторов растёт до пяти минут и учитывает Telegram retry_after. Ответы операторов дедуплицируются по update_id. Отправка в Telegram имеет семантику «как минимум один раз». Если Telegram принял сообщение, а сервер потерял подтверждение до записи message_id, возможна повторная копия в группе. Для Reply используйте последнюю доставленную копию. После потери cookie историю можно посмотреть через администратора.
