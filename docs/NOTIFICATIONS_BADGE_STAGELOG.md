# Notifications Badge Stage Log

## Stage B1 - Contract ingestion + API alignment
- Files changed:
  - `src/api/endpoints.ts`
  - `src/api/types.ts`
  - `src/api/domains/notifications.ts`
- Tests run:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual checks:
  - Not run in this pass (requires browser + backend runtime)
- Next stage:
  - B2 - Realtime socket + cache sync

## Stage B2 - Realtime socket + cache sync + reconnect
- Files changed:
  - `src/lib/notificationsSocket.ts`
  - `src/hooks/notifications/useNotificationUnreadCount.ts`
- Tests run:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual checks:
  - Not run in this pass (requires WS backend event emission)
- Next stage:
  - B3 - Header bell badge UX

## Stage B3 - Header bell badge UX
- Files changed:
  - `src/components/layout/AppHeader.tsx`
  - `src/pages/Notifications.tsx`
- Tests run:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual checks:
  - Not run in this pass (requires interactive login/session)
- Next stage:
  - B4 - Fallback polling + docs finalization

## Stage B4 - Polling fallback + validation
- Files changed:
  - `src/hooks/notifications/useNotificationUnreadCount.ts`
  - `docs/NOTIFICATIONS_BADGE_QA.md`
  - `docs/NOTIFICATIONS_BADGE_STAGELOG.md`
- Tests run:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual checks:
  - Not run in this pass
- Next stage:
  - Done (enterprise-ready notifications badge)

## Go/No-Go
- Status: **Go for integration testing**
- Notes:
  - Contract-aligned unread badge REST + WS path is implemented.
  - Manual runtime verification checklist is documented in `docs/NOTIFICATIONS_BADGE_QA.md`.
