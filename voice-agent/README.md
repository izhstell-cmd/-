# Голосовой AI-агент для холодных звонков (Twilio + OpenAI)

Минимальный сервер, который отвечает на входящий звонок Twilio голосом (русский), ведёт короткий диалог и может инициировать исходящие звонки по CSV.

## Возможности
- Входящий вебхук `/voice` отвечает голосом (Twilio `<Say>` на русском)
- Простой диалог с распознаванием речи (`<Gather input="speech">`)
- Интеграция с OpenAI (если есть `OPENAI_API_KEY`), иначе fallback-логика
- Скрипт обзвона по CSV (`src/dialer.js`)

## Установка
1. Перейдите в папку и установите зависимости:
   ```bash
   cd voice-agent
   npm install
   cp .env.example .env
   ```
2. Заполните `.env`:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
   - `OPENAI_API_KEY` (опционально)
   - `PORT` (по умолчанию 3001)

## Запуск сервера
```bash
npm run dev
```
Сервер слушает `http://localhost:3001`. Для теста вебхуков с интернета используйте туннель (один из вариантов):
- `ngrok http 3001`
- `cloudflared tunnel --url http://localhost:3001`

В Twilio Console укажите для номера голосовой вебхук: `POST https://<public-url>/voice`

## Обзвон по CSV
1. Подготовьте CSV (см. `contacts.example.csv`).
2. Запустите обзвон (пример):
   ```bash
   node src/dialer.js --from "+10000000000" \
     --csv contacts.example.csv \
     --url https://<public-url>/voice \
     --rate 12
   ```
   Опции:
   - `--from` — ваш номер Twilio (E.164)
   - `--csv` — путь к csv
   - `--url` — публичный URL до `/voice`
   - `--rate` — звонков в минуту (по умолчанию 12)
   - `--status` — необязательный URL для статусов звонков

## Примечания
- Состояние диалога хранится в памяти процесса (Map), для продакшна используйте БД/кэш.
- Текст озвучивается через Twilio `<Say language="ru-RU" voice="Polly-Tatyana">`.
- Логика завершения примитивная; доработайте под свой сценарий.