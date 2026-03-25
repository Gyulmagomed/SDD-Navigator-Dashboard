# SDD Navigator Dashboard

Веб-приложение для мониторинга покрытия спецификаций (SDD — Software Design Document): KPI, тренды, список спецификаций, карта покрытия, отчёты и экспорт.

**Стек:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, TanStack Query, Zustand, NextAuth.js, Recharts, MSW (только разработка), Jest.

---

## Содержание

1. [Возможности](#возможности)
2. [Требования](#требования)
3. [Переменные окружения](#переменные-окружения)
4. [Быстрый старт](#быстрый-старт)
5. [Демо-вход](#демо-вход)
6. [Скрипты npm](#скрипты-npm)
7. [Структура проекта](#структура-проекта)
8. [Архитектура](#архитектура)
9. [Интеграция с API](#интеграция-с-api)
10. [Аутентификация](#аутентификация)
11. [Mock API (MSW)](#mock-api-msw)
12. [Тестирование](#тестирование)
13. [Docker](#docker)
14. [Vercel и безопасность](#vercel-и-безопасность)
15. [CI/CD](#cicd)
16. [Частые проблемы](#частые-проблемы)
17. [Дополнительная документация](#дополнительная-документация)

---

## Возможности

- Главный дашборд: KPI, график тренда, топ/хвост спецификаций, распределение покрытия
- Список спецификаций: фильтры, сортировка, пагинация / бесконечная прокрутка, массовый экспорт CSV
- Детальная страница: вкладки, treemap, история
- Карта покрытия: матрица спецификация × секция, drill-down, экспорт CSV
- Отчёты: PDF/CSV/JSON, история экспортов, UI расписания (без бэкенда)
- Тёмная/светлая тема, уведомления в шапке, глобальный поиск (Ctrl+K)

---

## Требования

| Компонент | Версия / примечание |
|-----------|---------------------|
| Node.js | 20.x рекомендуется (в Docker-образе — 18 Alpine) |
| npm | 10+ |
| Бэкенд | REST API по контракту ниже **или** только MSW в `npm run dev` для данных (логин — см. [Аутентификация](#аутентификация)) |

---

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните значения. Подробные комментарии — в самом `.env.example`.

| Переменная | Обязательно | Назначение |
|------------|-------------|------------|
| `NEXT_PUBLIC_API_URL` | Да* | Origin бэкенда без хвостового слэша (например `http://localhost:4000`). Axios и часть сценариев NextAuth ожидают этот URL. *При чистом MSW для данных URL всё равно нужен для согласования с хендлерами (`* /path`). |
| `NEXTAUTH_SECRET` | Да | Секрет подписи JWT сессии. Сгенерировать: `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Да | Публичный URL этого приложения (`http://localhost:3000` в dev). |
| `ANALYZE` | Нет | `true` вместе с `npm run analyze` — анализ бандла. |

Файл `.env.local` не коммитить.

---

## Быстрый старт

```bash
npm ci
cp .env.example .env.local
# Отредактируйте .env.local
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Защищённые маршруты без сессии перенаправляют на `/login` (см. `middleware.ts`).

---

## Демо-вход

В `app/api/auth/[...nextauth]/route.ts` настроен **учебный** Credentials-провайдер:

- **Email:** `test@test.com`
- **Пароль:** `123456`

В продакшене замените `authorize` на вызов вашего `/auth/login` или используйте готовый шаблон в `lib/auth.ts` (см. [Аутентификация](#аутентификация)).

---

## Скрипты npm

| Команда | Описание |
|---------|----------|
| `npm run dev` | Сервер разработки (Turbopack) |
| `npm run build` | Продакшен-сборка |
| `npm run start` | Запуск после `build` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest |
| `npm run test:coverage` | Jest с порогами покрытия |
| `npm run analyze` | Сборка с `@next/bundle-analyzer` (`ANALYZE=true`) |

Обновление скрипта воркера MSW после смены версии пакета:

```bash
npx msw init public --save
```

---

## Структура проекта

```
sdd-navigator/
├── app/                          # App Router
│   ├── (auth)/                   # Группа: только логин
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   ├── (dashboard)/              # Защищённые страницы
│   │   ├── layout.tsx            # Server Component + metadata
│   │   ├── dashboard-layout-client.tsx  # Клиент: sidebar, header, error boundary
│   │   ├── page.tsx              # Overview
│   │   ├── specifications/…
│   │   ├── coverage/page.tsx
│   │   └── reports/page.tsx
│   ├── api/auth/[...nextauth]/   # NextAuth HTTP handlers
│   ├── layout.tsx                # Корень: шрифты, metadata, ClientProviders
│   └── globals.css
├── components/
│   ├── dashboard/                # Виджеты дашборда
│   ├── specifications/
│   ├── coverage/
│   ├── reports/
│   ├── layout/                   # Sidebar, Header, Breadcrumbs
│   ├── providers/                # Тема, сессия, React Query, client-providers, MSW bootstrap
│   └── ui/                       # Базовые UI-примитивы
├── lib/
│   ├── api/                      # Axios, endpoints, React Query hooks
│   ├── store/                    # Zustand (ui, filters, notifications, preferences)
│   └── utils/                    # CSV, отчёты, хелперы дашборда
├── mocks/                        # MSW для браузера (только dev)
│   ├── handlers.ts
│   └── browser.ts
├── types/                        # Общие TypeScript-типы API
├── hooks/                        # Кастомные хуки
├── __tests__/                    # Юнит и интеграционные тесты + MSW Node
├── public/
│   └── mockServiceWorker.js      # Генерируется: npx msw init public
├── docs/                         # Подробности архитектуры и разработки
├── Dockerfile
├── docker-compose.yml
├── vercel.json                   # Заголовки безопасности
└── .github/workflows/ci.yml
```

---

## Архитектура

Кратко:

- **Корневой `app/layout.tsx`** — Server Component: `metadata`, шрифты, `<html>` / `<body>`. Дерево провайдеров вынесено в **`components/providers/client-providers.tsx`** (клиент).
- **`app/(dashboard)/layout.tsx`** — Server Component с `metadata` сегмента; вся интерактивная оболочка — в **`dashboard-layout-client.tsx`**.
- **Данные:** React Query в `lib/api/hooks.ts`, HTTP — `lib/api/client.ts` (Bearer, ретраи 5xx, `ApiClientError`).
- **Глобальный UI-стейт:** Zustand; `uiStore` и `preferencesStore` с `persist` + `skipHydration` и явным `rehydrate` в `ClientProviders`, чтобы избежать рассинхрона SSR и `localStorage`.

Подробнее: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## Интеграция с API

Клиент ожидает REST API (пути относительно `NEXT_PUBLIC_API_URL`):

| Метод | Путь | Назначение |
|--------|------|------------|
| GET | `/dashboard/stats` | Агрегированная статистика и тренд |
| GET | `/specifications` | Пагинированный список (query: фильтры, page, pageSize, sort) |
| GET | `/specifications/:id` | Одна спецификация |
| GET | `/coverage/:specId` | Метрики покрытия по секциям |
| POST | `/auth/login`, `/auth/refresh` | Если NextAuth ходит во внешний бэкенд (см. `lib/auth.ts`) |
| * | Экспорт отчёта | См. `lib/api/endpoints.ts` → `exportReport` |

Типы запросов/ответов: `types/index.ts`, параметры фильтрации — `FilterParams`.

В **`next.config.ts`** по желанию можно включить **rewrites** прокси `/api/:path*` → бэкенд (в репозитории блок может быть закомментирован — смотрите файл). Axios по умолчанию обращается **напрямую** к `NEXT_PUBLIC_API_URL`.

---

## Аутентификация

- **Текущая конфигурация в репозитории:** `app/api/auth/[...nextauth]/route.ts` — JWT-сессия, демо-учётные данные в `authorize`.
- **Расширяемый вариант под реальный бэкенд:** пример с `axios` к `/auth/login` и refresh — в **`lib/auth.ts`** (подключите его в `route.ts`, заменив инлайн-конфиг, если нужен единый источник правды).
- **Middleware:** `middleware.ts` проверяет JWT (`getToken`) и редиректит неавторизованных на `/login`.
- **Клиентские запросы к API:** токен подставляется в `lib/api/client.ts` через `getSession` (NextAuth).

`SessionProvider` в `components/providers/session-provider.tsx` с `refetchOnWindowFocus={false}` — меньше лишних запросов сессии.

---

## Mock API (MSW)

- В **разработке** (`NODE_ENV === "development"`) в `ClientProviders` динамически подключается **`mocks/browser.ts`**: один запуск `worker.start({ onUnhandledRequest: 'bypass' })`.
- Хендлеры — **`mocks/handlers.ts`** (MSW 1.x, `rest`), те же данные реэкспортируются в **`__tests__/mocks/server.ts`** для Jest.
- В **production** MSW **не** импортируется и не стартует.
- Неперехваченные запросы **пропускаются** (`bypass`) — реальные `auth` и прочие эндпоинты могут идти на бэкенд.

Подробнее: [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).

---

## Тестирование

- **Jest** + **Testing Library** + **MSW** (`setupServer` в `jest.setup.ts`).
- Команда **`npm run test:coverage`** проверяет пороги из `jest.config.ts`.
- Игнор модулей из **`.next/`** настроен, чтобы не было коллизий с артефактами сборки.

---

## Docker

Multi-stage Dockerfile: сборка `standalone`, запуск от непривилегированного пользователя, порт **3000**.

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t sdd-navigator .
docker run --rm -p 3000:3000 \
  -e NEXTAUTH_SECRET=<секрет_32+_символов> \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  sdd-navigator
```

Или: `docker compose up --build` (см. комментарии в `docker-compose.yml`).

---

## Vercel и безопасность

- В проектных настройках Vercel задайте те же переменные окружения, что и локально.
- **`vercel.json`** задаёт HSTS, `X-Frame-Options`, CSP и др. При жёстком CSP может понадобиться сузить/расширить `connect-src` под ваш домен API.

---

## CI/CD

Файл **`.github/workflows/ci.yml`**: на push/PR в `main` или `master` выполняются **lint → typecheck → test:coverage → build** (для сборки в CI задаются временные env).

Репозиторий должен иметь корень в папке **`sdd-navigator`** (рядом с `package.json`), иначе поправьте `working-directory` в workflow.

---

## Частые проблемы

| Симптом | Что проверить |
|---------|----------------|
| Hydration mismatch | Тема/локальное хранилище: см. `Header`, `ClientProviders` + persist `skipHydration`. Не выводите разный HTML на сервере и клиенте без `useSyncExternalStore` / отложенного рендера. |
| MSW не перехватывает | Совпадает ли `NEXT_PUBLIC_API_URL` с паттернами `rest.get("*/…")` в `mocks/handlers.ts`. Есть ли `public/mockServiceWorker.js` (`npx msw init public`). |
| Ошибки про `<script>` и MSW | MSW должен стартовать только в `useEffect` в браузере, не в теле Server Component. |
| 401 после логина | Bearer-токен в сессии и `lib/api/client.ts`; для демо-логина токен `"mock-token"` — бэкенд может его не принять; для реального API подключите `lib/auth.ts`. |

---

## Дополнительная документация

| Файл | Содержание |
|------|------------|
| [docs/README.md](./docs/README.md) | Оглавление папки `docs/` |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Слои, провайдеры, layout, стейт, SSR/CSR |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | MSW, тесты, отладка, соглашения по коду |
| [AGENTS.md](./AGENTS.md) | Подсказки для AI-агентов в этом репозитории |

---

## Лицензия

Приватный / тестовое задание
