# DozaCraft — сайт и защищённая панель управления

Это статический сайт для GitHub Pages + отдельный Cloudflare Worker API. Пароль и секрет подписи сессии **не находятся в публичных файлах**. Вход выдаёт HttpOnly cookie на 7 дней; cookie подписывается HMAC и проверяется сервером. Настройки версий хранятся в Cloudflare KV и видны всем посетителям сайта.

## 1. Публикация сайта на GitHub Pages

1. Загрузи `index.html`, `style.css`, `script.js`, `config.js`, папку `assets` и этот README в корень репозитория сайта.
2. В `config.js` замени `YOUR-USERNAME` и `YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev` на реальные адреса.
3. В GitHub открой **Settings → Pages**, выбери `Deploy from a branch`, `main`, `/ (root)`.
4. `SITE_ORIGIN` должен быть точным origin сайта без завершающего слеша. Для пользовательского сайта обычно `https://USERNAME.github.io`; для проектного сайта `https://USERNAME.github.io/REPO` — origin всё равно только `https://USERNAME.github.io`.

## 2. Настройка Cloudflare Worker API

1. В Cloudflare создай **Workers & Pages → KV**, затем namespace, например `DOZACRAFT_CONFIG`.
2. Скопируй его ID в `wrangler.toml` вместо `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.
3. Измени `SITE_ORIGIN` в `wrangler.toml` на origin GitHub Pages (без пути и без `/` в конце).
4. Установи Wrangler (`npm install -g wrangler`) и войди (`wrangler login`). Из этой папки выполни `wrangler deploy`.
5. В настройках Worker → **Settings → Variables and Secrets** добавь секреты:
   - `ADMIN_USERNAME` — имя владельца, указанное ниже.
   - `ADMIN_PASSWORD` — пароль, указанный ниже (можно сменить).
   - `SESSION_SECRET` — длинная случайная строка не менее 32 байт. Сгенерировать можно командой `openssl rand -hex 32`.
6. Проверь, что KV binding называется ровно `CONFIG_KV`.
7. Скопируй адрес Worker вида `https://dozacraft-admin-api.<твой-поддомен>.workers.dev` в `apiUrl` файла `config.js` и опубликуй обновление сайта.

## Учётная запись

Используй логин и пароль, выданные владельцу отдельно в инструкции к этой сборке. Добавь их как секреты Worker `ADMIN_USERNAME` и `ADMIN_PASSWORD`. Не записывай пароль в этот README, HTML, JavaScript или публичный репозиторий.

## Как работает вход

- Сайт не может самостоятельно определить владельца. Worker сравнивает логин и пароль с секретами, хранящимися на стороне Cloudflare.
- После входа сервер устанавливает cookie `HttpOnly; Secure; SameSite=None` с HMAC-подписью и сроком 7 дней. JavaScript не может прочитать эту cookie.
- Выход удаляет cookie. Истёкшую сессию нужно создать заново.
- Публичный `GET /api/config` отдаёт только конфигурацию сайта. `PUT /api/config` разрешён лишь при валидной сессии.
- Запросы принимаются только с `SITE_ORIGIN`. Не ставь `*` в CORS.

## Важно

- Сама панель не заработает с серверной авторизацией, пока Worker не развернут, секреты не добавлены, KV не привязан и `apiUrl` не заменён на реальный адрес.
- Не публикуй `.dev.vars`, реальные секреты, пароль или `SESSION_SECRET` в GitHub.
- Это парольная админка для одного владельца. Для повышенной защиты добавь Cloudflare Turnstile/rate limiting на endpoint входа и включи 2FA на аккаунте Cloudflare/GitHub.
