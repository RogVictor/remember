# Чат сайта и Telegram

Виджет появляется на публичных страницах при заполненных настройках чата. Сервер выдаёт случайный 256-битный токен в HttpOnly cookie на 90 дней (Secure в production). В БД хранится SHA-256 токена. Администратор Payload видит диалоги, историю, даты, статус, поля имени и телефона. Посетителю достаточно текста обращения. Закрытый диалог доступен для чтения, администратор может открыть его снова.

## Бот и группа

1. Создайте отдельного бота командой `/newbot` у @BotFather. Внесите токен в серверный `.env` как `TELEGRAM_CHAT_BOT_TOKEN`. Существующие `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` относятся к формам заявок.
2. Создайте закрытую группу, добавьте операторов и бота. Разрешите боту отправлять сообщения. Оставьте включённым Privacy Mode. Для обычного Reply на сообщение бота прав администратора не требуется. Операторы должны писать от своего аккаунта. [Telegram Bots FAQ](https://core.telegram.org/bots/faq#what-messages-will-my-bot-get)
3. До регистрации webhook попросите каждого оператора послать в группу команду `/start@имя_бота`. На доверенном компьютере с Node 22+ и токеном в окружении выполните следующую команду. Она выводит только ID из полученных групповых команд.

```sh
node --input-type=module -e 'const r=await fetch("https://api.telegram.org/bot"+process.env.TELEGRAM_CHAT_BOT_TOKEN+"/getUpdates");const d=await r.json();if(!d.ok)process.exit(1);for(const {message:m} of d.result)if(m?.chat?.id<0 && m?.text?.startsWith("/start@"))console.log(m.chat.id,m.from.id)'
```

4. Укажите отрицательный ID группы в `TELEGRAM_CHAT_GROUP_ID`, числовые ID проверенных операторов через запятую в `TELEGRAM_CHAT_OPERATOR_IDS`. Сгенерируйте `TELEGRAM_CHAT_WEBHOOK_SECRET` командой `openssl rand -hex 32`. Храните значение в серверном окружении. Приложение получает переменные через уже настроенный Compose `env_file`.
5. После выпуска приложения зарегистрируйте HTTPS webhook. Следующий пример предназначен для POSIX shell с экспортированными `TELEGRAM_CHAT_BOT_TOKEN`, `TELEGRAM_CHAT_WEBHOOK_SECRET` и `SITE_URL=https://ritualgroup24.ru`. Путь обрабатывает Next.js через существующий прокси. Для запросов посетителя приложение использует доверенный `X-Real-IP`, как и форма заявок. [Telegram Bot API](https://core.telegram.org/bots/api#setwebhook)

```sh
node --input-type=module <<'JS'
const { TELEGRAM_CHAT_BOT_TOKEN: token, TELEGRAM_CHAT_WEBHOOK_SECRET: secret, SITE_URL } = process.env
if (!token || !secret || !SITE_URL?.startsWith('https://')) process.exit(1)
const base = 'https://api.telegram.org/bot' + token + '/'
const url = new URL('/api/chat/webhook', SITE_URL).href
const set = await fetch(base + 'setWebhook', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ url, secret_token: secret, allowed_updates: ['message'] })
}).then(r => r.json())
if (!set.ok) throw new Error('Telegram отказал в регистрации')
const info = await fetch(base + 'getWebhookInfo').then(r => r.json())
if (!info.ok || info.result.url !== url) throw new Error('Проверьте адрес webhook')
console.log('Webhook зарегистрирован. Ожидают доставки:', info.result.pending_update_count)
JS
```

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
