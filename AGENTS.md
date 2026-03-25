# Памятка для AI-агентов и ассистентов (SDD Navigator)

Краткие правила работы с этим репозиторием. Подробности — в **[README.md](./README.md)**, **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** и **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)**.

## Next.js

Версия в проекте — **Next.js 16** (App Router, Turbopack в dev). Часть API отличается от обучающих материалов по Next.js 13–14; перед нестандартными изменениями сверяйтесь с официальной документацией для вашей версии пакета.

## Где что лежит

| Область | Путь |
|---------|------|
| Страницы и маршруты | `app/` |
| Клиентские провайдеры (тема, сессия, Query, MSW bootstrap) | `components/providers/client-providers.tsx` |
| REST-клиент и хуки | `lib/api/` |
| Zustand | `lib/store/` |
| MSW браузер (только dev) | `mocks/` |
| MSW + Jest | `__tests__/mocks/`, `jest.setup.ts` |
| NextAuth HTTP | `app/api/auth/[...nextauth]/route.ts` |
| Защита маршрутов | `middleware.ts` |

## Жёсткие ограничения

- **Не использовать `any`.** Явные типы или `unknown` + сужение.
- **Не запускать MSW на сервере** и не вставлять скрипты воркера в React-дерево. Только клиент, `useEffect`, динамический `import` (как в `ClientProviders`).
- **Metadata** только в **Server** layout — не делайте `export const metadata` в файлах с `"use client"`.
- **Persist Zustand:** для сторов с влиянием на первую отрисовку используется `skipHydration` + `rehydrate` в `ClientProviders`; не убирайте без замены стратегии (риск hydration mismatch).
- Минимально инвазивные диффы: не рефакторить «заодно» несвязанный код.

## После изменений в API or env

- Обновить **`types/index.ts`**, **`lib/api/endpoints.ts`**, при необходимости **`mocks/handlers.ts`** и **README**.
- Новые переменные окружения — в **`.env.example`** и таблицу в **README**.

## Команды проверки

`npm run lint` · `npm run typecheck` · `npm run test:coverage` · `npm run build`
