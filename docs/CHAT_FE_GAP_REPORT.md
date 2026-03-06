# CHAT FE Gap Report

Last updated: 2026-03-05
Source of truth: `CHAT_FRONTEND_IMPLEMENTATION_GUIDE.md`

## Already Implemented
- Contract-aligned chat REST domain in `src/api/domains/chat.ts` using `/api/v1/chat/*` via `endpoints.chat`.
- Chat models and event/error types in `src/api/types.ts`.
- React Query chat hooks in `src/hooks/chat/useChatQueries.ts` for list/messages/thread/send/edit/delete/react/read + conversation lifecycle + moderation.
- Socket URL fallback + on-prem compatibility in `src/lib/chatSocket.ts` (`VITE_WS_BASE_URL -> VITE_WS_URL -> VITE_API_BASE_URL -> window.location.origin`) and `withCredentials: true`.
- Socket namespace `/chat` with handshake token auth setup.
- Chat realtime cache sync hook in `src/hooks/chat/useChatRealtime.ts` for message/conversation/typing events and reconnect catch-up.
- Slack-like chat shell in `src/pages/Conversations.tsx` with:
  - grouped conversation list (Forums / Groups / DMs),
  - message timeline + unread marker + tombstones,
  - composer + direct attachment upload + drag/drop,
  - thread panel with reply flow,
  - reaction/edit/delete,
  - settings + invite + create conversation + moderation controls,
  - archived/muted/banned/ratelimit/media error code UI handling.
- Notification center page with chat deep-linking: `src/pages/Notifications.tsx`.

## Closed Gaps
- Legacy `/conversations/*` for chat feature path usage replaced by `/chat/*` in active chat surface.
- Send payload keys aligned to contract (`text`, `replyTo`, `attachmentMediaIds`).
- Cursor model switched from page/limit to `afterSeq` in chat hooks.
- Chat error normalization introduced and wired to UX banners/toasts.
- Routing added for `/chat`, `/chat/:conversationId`, `/chat/:conversationId/thread/:threadRootId` while keeping `/conversations` compatibility routes.
- WS subscribe ACK rejection now handled with active-conversation fallback UX:
  - immediate route to `/chat`,
  - toast/banner: `Access removed / banned / not a member`,
  - active conversation local state cleanup (pending queue reset).
- Notification deep-link now supports message focus query (`focusMessageId`) and best-effort focus handling in chat timeline.
- Mentions UX implemented with autocomplete insertion as `@<uuid>` and safe rendering fallback to `@<uuid>` when user directory mapping is unavailable.
- Message reliability UX implemented with pending/failed local queue and retry/discard actions.
- Jump-to-latest and new-message marker added for scrolled-up users.
- Message windowing added (`N=300`) with explicit load-older controls.
- Chat timestamp formatting centralized via `src/lib/chatTime.ts` and applied across chat surfaces.
- Centralized chat error-to-UX mapping added in `src/lib/chatErrors.ts`.
- Reusable sticky status banner added in `src/components/chat/ChatStatusBanner.tsx` and reused in main/thread views.
- Delta features integrated from `CHAT_FRONTEND_DELTA_GUIDE_PINS_BOOKMARKS_POLICIES.md`:
  - Pins: domain + hooks + message actions + pins panel + WS sync.
  - Bookmarks: domain + hooks + create/list/delete UI + WS sync.
  - Policies: mention/edit/delete controls in settings + centralized error mapping.
  - Thread replies: `alsoToChannel` payload support and thread-only visibility guard in query+WS cache merges.

## Remaining / Partial Gaps
- Thread deep-link message focus/scroll-to-message best-effort is not yet implemented.
- Moderation controls currently use manual `userId` input (member picker can be improved).
- Playwright suite command executes and skips correctly when env credentials are absent; full authenticated run is still pending configured E2E creds.
- Delta manual QA matrix is pending runtime verification against backend (pins/bookmarks/policy scenarios across roles and multi-client realtime).

## Risk Notes
- Backend payload variations (attachments as IDs vs objects) are handled defensively, but final QA should confirm exact runtime shapes in all chat routes.
- No backend capability endpoint exists; FE gating still depends on state/role/invite policy + API error handling by design.
- Vite build does not type-check; recommend adding `tsc --noEmit` in CI for stricter regression detection.
