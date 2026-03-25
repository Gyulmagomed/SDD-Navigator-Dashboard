# Руководство разработчика

Практические заметки по локальной разработке, мокам, тестам и соглашениям.

## Локальный запуск

1. `npm ci`
2. Скопировать `.env.example` → `.env.local`, заполнить переменные (см. комментарии в `.env.example`).
3. `npm run dev`

Убедитесь, что `NEXT_PUBLIC_API_URL` согласован с тем, куда стучится Axios и с чем совпадают шаблоны MSW (`*/dashboard/stats` и т.д.).

## MSW (Mock Service Worker)

### Зачем

В **development** можно работать без реального бэкенда для **чтения** дашборда/спецификаций/покрытия: хендлеры в `mocks/handlers.ts` возвращают JSON в формате `ApiResponse<T>`.

### Как включено

- Старт только в браузере, в `useEffect`, из `components/providers/client-providers.tsx`.
- Условие: `process.env.NODE_ENV === "development"`.
- Реализация: `mocks/browser.ts` — `setupWorker` из пакета `msw` (версия 1.x), **один** общий `Promise` на `worker.start()`, опции:
  - `onUnhandledRequest: 'bypass'` — реальные запросы (например к вашему API или NextAuth) не ломают консоль.
  - `quiet: true` — меньше шума в логах.

### Файл воркера

После обновления MSW перегенерируйте скрипт:

```bash
npx msw init public --save
```

В `public/mockServiceWorker.js` лежит сервис-воркер; путь зафиксирован в `package.json` → `msw.workerDirectory`.

### Добавление хендлера

1. Откройте `mocks/handlers.ts`.
2. Добавьте `rest.get/post/...` с паттерном вида `"*/имя/ресурса"` (wildcard нужен, т.к. base URL может быть любым origin).
3. Тесты Jest используют **те же** хендлеры через `@/mocks/handlers` и `setupServer` в `__tests__/mocks/server.ts` — расширения попадут и в CI.

### Частые ошибки

| Проблема | Решение |
|----------|---------|
| Запросы не перехватываются | Проверить URL в Network: совпадает ли путь с паттерном; не забыть `*`. |
| Сообщение про `<script>` в React | Не вызывать `worker.start()` при рендере Server Component; только клиент + `useEffect`. |
| Двойной старт | Использовать общий промис в `startMswWorker()` (уже сделано в репозитории). |

## Аутентификация при разработке

Сейчас в `app/api/auth/[...nextauth]/route.ts` захардкожены демо-учётные данные. API-запросы с Bearer `mock-token` ваш бэкенд может отклонять — это ожидаемо. Варианты:

- Доработать MSW: добавить `rest.post('*/auth/login', …)` и согласовать с кастомным `authorize`, **или**
- Подключить реальный логин через `lib/auth.ts` и переменные окружения.

## Тестирование

```bash
npm test
npm run test:coverage
```

- Настройка Jest: `jest.config.ts`, подключение MSW: `jest.setup.ts`.
- Интеграционные тесты лежат в `__tests__/integration/`, моки сервера — `__tests__/mocks/`.
- Если после `npm run build` Jest ругается на коллизию модулей из `.next`, в конфиге уже есть `modulePathIgnorePatterns` для `.next/`.

## Качество кода

```bash
npm run lint
npm run typecheck
```

Проект ориентирован на отсутствие типа `any`; для сторонних коллбэков используйте сужение через `unknown` / явные типы.

## Соглашения

- **Импорты:** алиас `@/` (см. `tsconfig.json`).
- **Новые страницы дашборда:** добавить маршрут в `middleware.ts` matcher, если нужна защита JWT.
- **Новые env:** добавить в `.env.example` + таблицу в `README.md`.

## Полезные пути

| Задача | Файл |
|--------|------|
| HTTP-клиент | `lib/api/client.ts` |
| Эндпоинты | `lib/api/endpoints.ts` |
| Хуки данных | `lib/api/hooks.ts` |
| Типы API | `types/index.ts` |
| Обход без бэкенда (dev) | `mocks/handlers.ts` |
| Провайдеры приложения | `components/providers/client-providers.tsx` |
