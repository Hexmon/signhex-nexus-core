# CHAT FE Stage Log

## S0 - Contract ingestion + scaffolding
- Completed: Yes
- What changed:
  - Reviewed `CHAT_FRONTEND_IMPLEMENTATION_GUIDE.md` and extracted route/env/error/event contract.
  - Added docs scaffold (`CHAT_FE_GAP_REPORT.md`, this stage log).
  - Updated `src/lib/chatSocket.ts` env fallback order and `/chat` namespace URL resolution.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - App boot + chat route opens (code-level validation complete).
- Next stage: S1

## S1 - API alignment + auth + error normalization
- Completed: Yes
- What changed:
  - Replaced chat domain with contract `/chat/*` endpoints in `src/api/domains/chat.ts`.
  - Added chat contract types and normalized chat error shape in `src/api/types.ts`.
  - Added chat endpoint member path in `src/api/endpoints.ts`.
  - Kept bearer auth via shared `apiClient` token provider.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Network auth/header checks pending environment run.
- Next stage: S2

## S2 - Conversation list + routing + unread badges
- Completed: Yes
- What changed:
  - Added `/chat` + deep-link routes and `/conversations` compatibility routes in `src/App.tsx`.
  - Updated sidebar navigation to `/chat` and added `/notifications` entry.
  - Implemented grouped conversation list UI in `src/components/chat/ConversationList.tsx`.
  - Rebuilt `src/pages/Conversations.tsx` to use URL as source of selected conversation.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Grouping/unread/archive badge code path implemented; runtime verification pending backend data.
- Next stage: S3

## S3 - Messages timeline + read receipts + tombstones
- Completed: Yes
- What changed:
  - Implemented cursor/infinite messages and thread hooks with `afterSeq` in `useChatQueries.ts`.
  - Added `MessageList` + `MessageItem` with tombstone semantics.
  - Added throttled read receipt updates (`POST /read`) from active conversation state.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - End-to-end receipt behavior pending backend runtime test.
- Next stage: S4

## S4 - Realtime + cache sync + typing + reconnect catch-up
- Completed: Yes
- What changed:
  - Added `useChatRealtime.ts` event wiring for `chat:message:new/updated/deleted`, `chat:conversation:updated`, `chat:typing`.
  - Added reconnect resubscribe + REST catch-up by `afterSeq`.
  - Hook integrated into `Conversations.tsx`.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Two-browser realtime test pending manual run.
- Next stage: S5

## S5 - Threads
- Completed: Yes
- What changed:
  - Added `src/components/chat/ThreadPanel.tsx`.
  - Added thread routing handling `/chat/:conversationId/thread/:threadRootId` in page and routes.
  - Implemented thread reply with `replyTo` + optional also-send-main toggle.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Thread deep-link and reply functional checks pending backend runtime.
- Next stage: S6

## S6 - Reactions + edit/delete + guardrails
- Completed: Yes
- What changed:
  - Reactions/edit/delete hooks and message actions wired.
  - Added archived/muted/banned error handling banners and composer disable behavior.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Archived/muted flows pending runtime validation with contract error responses.
- Next stage: S7

## S7 - Group/forum management
- Completed: Yes
- What changed:
  - Added `CreateConversationModal`, `InviteMembersModal`, `ConversationSettingsPanel`.
  - Wired create, invite, settings patch, archive/unarchive, hard delete flows in page.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Invite policy behavior should be validated against backend-enforced rules.
- Next stage: S8

## S8 - Moderation UI + banned handling
- Completed: Yes
- What changed:
  - Added `ModerationControls.tsx` and moderation mutation wiring.
  - Added blocked/muted UX state and action guardrails in chat surface.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Ban/mute/unmute/unban contract checks pending backend runtime.
- Next stage: S9

## S9 - Notifications + deep-linking
- Completed: Yes
- What changed:
  - Added `src/pages/Notifications.tsx`.
  - Added route + sidebar nav integration.
  - Added mark-read/mark-all-read handling and conversation deep-linking.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Notification payload-specific deep link runtime validation pending.
- Next stage: S10

## S10 - Integrated QA + optional e2e
- Completed: Partial
- What changed:
  - Added `docs/CHAT_FE_QA_CHECKLIST.md` manual checklist.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Full checklist execution pending.
- Next stage: Release candidate after full manual QA.

## A1 - Final contract compliance audit + strict subscribe rejection
- Completed: Yes
- What changed:
  - Added `chat:subscribe` ACK parsing in `src/hooks/chat/useChatRealtime.ts`.
  - Added active-conversation rejection callback handling in `src/pages/Conversations.tsx`.
  - If active conversation is rejected, UI now:
    - routes to `/chat`,
    - shows toast/banner `"Access removed / banned / not a member"`,
    - clears active local pending-send state.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - ACK-driven forced fallback path implemented; runtime multi-user verification pending backend environment.
- Next stage: A2

## A2 - UX hardening (focus, mentions, reliability, windowing, timestamps, reusable banner)
- Completed: Yes
- What changed:
  - Added `src/lib/chatTime.ts` and centralized chat timestamp formatting.
  - Added `src/lib/chatErrors.ts` and centralized chat error-to-UX mapping.
  - Added reusable `src/components/chat/ChatStatusBanner.tsx` and wired in main chat + thread panel.
  - Added mentions autocomplete in `Composer` with contract-safe insertion `@<uuid>`.
  - Added mention rendering in `MessageItem` with safe fallback to `@<uuid>`.
  - Added deep-link focus support via `focusMessageId` and message not-loaded callout in `MessageList`.
  - Added pending/failed send queue with retry/discard UX in chat timeline.
  - Added jump-to-latest button, new-message divider, and message windowing (`N=300`).
  - Added keyboard/a11y improvements (Enter send, Shift+Enter newline, Esc thread close, aria labels).
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Focus deep-link, mentions insertion/render fallback, retry/discard, status banners, and jump-to-latest flows implemented; runtime end-to-end verification pending backend environment.
- Next stage: A3

## A3 - Automated E2E baseline (Playwright)
- Completed: Yes (implementation), execution conditional
- What changed:
  - Added Playwright dev dependencies in `package.json`.
  - Added scripts:
    - `test:chat-e2e`
    - `test:chat-e2e:headed`
  - Added `playwright.config.ts` with Vite webServer bootstrap and env-based base URL.
  - Added `tests/chat.e2e.spec.ts` with core chat + admin scenario coverage and env-driven skip logic.
  - Hardened skip behavior to suite-level guards so missing credentials skip before browser launch.
  - Updated QA checklist with Playwright runbook and env requirements.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
  - `npm run test:chat-e2e` ✅ command passed with `4 skipped` (missing `E2E_USER_*` and `E2E_ADMIN_*` env credentials)
- Manual smoke:
  - N/A in this workspace for credential-dependent flows.
- Next stage: A4

## A4 - Final integrated audit + release report
- Completed: Yes
- What changed:
  - Ran security grep checks:
    - token/log scan (`rg`) -> no token logging issues introduced in chat implementation.
    - `dangerouslySetInnerHTML` scan for chat surfaces -> no unsafe render path found.
  - Re-ran final `lint/build`.
  - Finalized docs with current execution constraints and known limitations.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
  - `npm run test:chat-e2e` ✅ command passed with credential-based skips
- Manual smoke:
  - Full backend-integrated manual checklist execution still pending environment credentials and multi-user setup.

## Release Decision (A4)
- Decision: **GO (conditional)** for merge-to-integration branch.
- Conditions:
  - Run full manual checklist with real backend users/roles.
  - Run Playwright suite with configured E2E credential env vars.
- Known limitations:
  - Thread deep-link focus is best-effort; exact historical message targeting depends on loaded pages.
  - Moderation panel still uses manual `userId` entry (member picker deferred).

## D1 - Delta types/endpoints/domain alignment (pins/bookmarks/policies/alsoToChannel)
- Completed: Yes
- What changed:
  - Added delta chat types for settings, pins, bookmarks, and WS payloads in `src/api/types.ts`.
  - Added chat endpoints for pins/bookmarks in `src/api/endpoints.ts`.
  - Extended chat domain in `src/api/domains/chat.ts`:
    - pin/unpin/list pins
    - create/list/delete bookmarks
    - patch conversation settings
    - send `alsoToChannel` only when `replyTo` exists.
  - Added query-key scaffolding in `src/hooks/chat/useChatQueries.ts`.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - API console smoke pending runtime backend checks.
- Next stage: D2

## D2 - Pin/Unpin actions + pins panel
- Completed: Yes
- What changed:
  - Added pin hooks (`usePins`, `usePinMessage`, `useUnpinMessage`) in `useChatQueries.ts`.
  - Replaced `Pin (soon)` placeholder with real Pin/Unpin actions in `MessageItem.tsx`.
  - Added new `PinsPanel.tsx`.
  - Added settings drawer tabs (`Settings | Pins | Bookmarks`) in `ConversationSettingsPanel.tsx`.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Pin/unpin end-to-end pending backend runtime validation.
- Next stage: D3

## D3 - Bookmarks panel + create/delete
- Completed: Yes
- What changed:
  - Added bookmark hooks (`useBookmarks`, `useCreateBookmark`, `useDeleteBookmark`) in `useChatQueries.ts`.
  - Added `BookmarksPanel.tsx` with LINK/FILE create flows and MESSAGE deep-link open support.
  - Added message-level bookmark action in `MessageItem.tsx` and page wiring in `Conversations.tsx`.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - LINK/FILE/MESSAGE bookmark runtime checks pending backend environment.
- Next stage: D4

## D4 - Conversation policies + enforcement UX
- Completed: Yes
- What changed:
  - Extended settings UI with mention/edit/delete policy controls in `ConversationSettingsPanel.tsx`.
  - Added policy defaults + normalization path (`settings` vs `metadata.settings`) in `Conversations.tsx`.
  - Added policy-aware edit/delete button gating in message actions.
  - Added mention-policy send guard in `Composer.tsx` for `@everyone/@channel/@here`.
  - Extended centralized chat error mapping for policy-related backend codes in `src/lib/chatErrors.ts`.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Policy enforcement scenarios pending backend role-based runtime checks.
- Next stage: D5

## D5 - Thread replies alsoToChannel + visibility rules
- Completed: Yes
- What changed:
  - Fixed thread reply behavior: now single send with `{ replyTo, alsoToChannel }` (no duplicate second message).
  - Updated send cache merge (`useSendChatMessage`) and realtime merge (`useChatRealtime`) to keep thread-only replies out of main timeline unless explicit `also_to_channel/alsoToChannel=true`.
  - Updated `ThreadPanel.tsx` contract payload to `alsoToChannel`.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Thread visibility (thread-only vs also-to-channel) pending two-client runtime verification.
- Next stage: D6

## D6 - Realtime delta events + docs/checklists
- Completed: Yes
- What changed:
  - Added WS handlers in `useChatRealtime.ts` for:
    - `chat:pin:update`
    - `chat:bookmark:update`
    - `chat:conversation:updated` settings harmonization.
  - Added pins/bookmarks/settings wiring in `Conversations.tsx` + settings tabs.
  - Updated stage log, gap report, and QA checklist for delta coverage.
- Tests:
  - `npm run lint` ✅
  - `npm run build` ✅
- Manual smoke:
  - Multi-client realtime sync validation pending backend environment.
- Next stage: Delta release candidate
