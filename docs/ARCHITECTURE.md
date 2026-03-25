# Архитектура SDD Navigator

Документ описывает, как устроены слои приложения, разделение Server/Client Components и потоки данных.

## 1. Модель Next.js App Router

### Server Components по умолчанию

Любой файл в `app/**` без директивы `"use client"` — **Server Component**. Он выполняется на сервере: можно безопасно использовать секреты (не попадают в бандл клиента), нельзя использовать браузерные API и React-хуки состояния.

### Client Components

Ставьте `"use client"` только там, где нужны:

- `useState`, `useEffect`, контекст потребителей
- браузерные API (`window`, `localStorage`, подписки)
- обработчики событий в интерактивных виджетах

Чем меньше клиентского кода на уровне layout — тем меньше JS у пользователя и проще избегать ошибок гидратации.

## 2. Иерархия layout

```
app/layout.tsx                    (Server)
  └─ ClientProviders             (Client)
       └─ AppThemeProvider
            └─ AppShell
                 └─ AuthSessionProvider
                      └─ QueryProvider
                           └─ children (страницы)

app/(dashboard)/layout.tsx        (Server)  ← metadata сегмента
  └─ DashboardLayoutClient       (Client) ← sidebar, header, main
       └─ page.tsx / …
```

**Почему так:**

- **metadata** (title, description) экспортируется только из Server Components — поэтому дашборд-оболочка разбита на `layout.tsx` (сервер) и `dashboard-layout-client.tsx` (клиент).
- Корневой layout остаётся серверным: шрифты, `className` на `<html>`, единая точка входа для SEO.

## 3. ClientProviders

Файл: `components/providers/client-providers.tsx`.

Отвечает за:

1. **Восстановление Zustand persist** после монтирования: `useUiStore.persist.rehydrate()` и `usePreferencesStore.persist.rehydrate()`. В сторах включён `skipHydration: true`, чтобы первый HTML с сервера и первый кадр на клиенте опирались на **начальное** состояние, а данные из `localStorage` подтягивались сразу после монтирования — без рассинхрона гидратации из-за сайдбара / переключателя режима списка.

2. **MSW (только development):** динамический `import("@/mocks/browser")` внутри `useEffect`, один вызов `startMswWorker()`. На сервере и в production этот код не выполняется.

## 4. Данные и кэш

| Слой | Назначение |
|------|------------|
| `lib/api/client.ts` | Axios: baseURL, таймаут, Bearer, нормализация ошибок, ретраи 5xx |
| `lib/api/endpoints.ts` | Тонкие функции под каждый REST-эндпоинт |
| `lib/api/hooks.ts` | `useQuery` / `useInfiniteQuery`: staleTime, ключи, условные запросы |

Серверные компоненты в этом проекте почти не делают fetch к вашему бизнес-API; основной потребитель — клиент через React Query.

## 5. Глобальный UI-стейт (Zustand)

| Store | Persist | Примечание |
|-------|---------|------------|
| `uiStore` | Да | Сайдбар, тема (предпочтение), активные фильтры дашборда |
| `preferencesStore` | Да | Режим списка: пагинация / infinite scroll |
| `filterStore` | Нет | Фильтры дашборда (синхронизация с UI) |
| `notificationStore` | Нет | Внутриприложенные уведомления |

## 6. Тема (next-themes)

- `AppThemeProvider` задаёт `attribute="class"`, `storageKey="sdd-theme"`.
- `ThemeSync` синхронизирует значение из `uiStore.themePreference` с `setTheme` из next-themes.
- Переключатель в `Header` использует **отложенный** показ иконки Sun/Moon (через `useSyncExternalStore` / клиентский снимок), чтобы сервер и клиент не рисовали разное дерево.

## 7. Маршрутизация и защита

- **`middleware.ts`**: для перечисленных путей проверяется JWT; публичный маршрут — `/login`.
- **NextAuth**: маршрут `app/api/auth/[...nextauth]/route.ts`.

## 8. Обработка ошибок на страницах

В дашборде основной контент страниц обёрнут в **`ErrorBoundary`** (`components/error-boundary.tsx`) внутри клиентского layout — падение виджета не роняет всю оболочку.

## 9. Производительность

- Тяжёлые страницы/виджеты могут подгружаться через `next/dynamic` и `Suspense` (см. отчёты, карту покрытия, графики на дашборде).
- `output: "standalone"` в `next.config.ts` — для компактного Docker-образа.

---

При изменении архитектуры обновляйте этот файл и корневой `README.md`, чтобы он оставался источником правды для новых разработчиков.
