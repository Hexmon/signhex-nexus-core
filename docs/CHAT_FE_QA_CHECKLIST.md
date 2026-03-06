# Chat FE QA Checklist

Date: 2026-03-05
Contract source: `CHAT_FRONTEND_IMPLEMENTATION_GUIDE.md`

## Environment
1. Set `.env`:
   - `VITE_API_BASE_URL=http://<backend-host>:3000`
   - `VITE_WS_BASE_URL=http://<backend-host>:3000`
2. Login with valid user and verify bearer token is present.

## Routing + Navigation
1. Open `/chat`.
2. Verify redirect/selection behavior for first conversation.
3. Open `/chat/:conversationId` directly.
4. Open `/chat/:conversationId/thread/:threadRootId` directly.
5. Verify `/conversations` compatibility path still opens chat surface.

## Conversation List
1. Verify grouping into Forums / Private Groups / DMs.
2. Verify unread badges and archived badge render.
3. Verify search filter matches title/topic/id/preview.

## Messaging Timeline
1. Load messages and verify order by `seq` ascending.
2. Verify day separators render.
3. Verify unread marker placement around `last_read_seq` boundary.
4. Verify deleted message tombstone shows and body/attachments/reactions are hidden.
5. Verify cursor-forward behavior:
   - initial request uses `afterSeq=0&limit=50`,
   - no fake `Load older` from server UI is shown,
   - `Check for new messages` is available.
6. Click `Check for new messages` when no new events exist and verify empty response (`items.length=0`) with `Up to date` indicator.
7. If deep-linked `focusMessageId` is missing, verify callout explains older-pagination is required (no fake backfill).

## Composer + Attachments
1. Send plain text message.
2. Upload file from AttachmentPicker upload tab and send.
3. Drag/drop file directly into composer and send.
4. Verify send payload includes only `attachmentMediaIds`.
5. Verify 413/415/403 upload errors show friendly messages.
6. Verify message with `<script>` renders as plain text safely.

## Threads
1. Click Reply on message; thread panel opens.
2. Send reply with `replyTo` and toggle off “Also send to main chat”:
   - verify reply appears in thread only, not in main channel timeline.
3. Send reply with `replyTo` and toggle on “Also send to main chat”:
   - verify same reply appears in both thread and channel timeline.
4. Open deep link thread route and verify same thread loads.
5. Click `Check for new` in thread panel and verify it fetches replies with `seq > lastSeenSeq`.

## Pins
1. Pin a message from message actions.
2. Open details drawer -> Pins tab and verify pinned message appears.
3. Unpin from message actions or Pins tab and verify removal.
4. Pin a message then delete it; verify Pins tab shows safe deleted placeholder.

## Bookmarks
1. Open details drawer -> Bookmarks tab.
2. Create LINK bookmark and verify open-in-new-tab works.
3. Create FILE bookmark and verify media preview resolves.
4. Create MESSAGE bookmark from message action and verify deep-link opens target conversation with focus.
5. Delete bookmark and verify list updates.

## Policies (mention/edit/delete)
1. In details drawer -> Settings tab, update:
   - mention policy (`everyone/channel/here`)
   - edit policy
   - delete policy
2. For mention policy:
   - member blocked on restricted `@everyone/@channel/@here`
   - admin allowed where configured `ADMINS_ONLY`
3. For edit/delete policies:
   - `DISABLED` blocks action with policy toast
   - `ADMINS_ONLY` blocks member and allows admin
   - `OWN` allows own messages only (plus admin override where backend applies)

## Reactions / Edit / Delete
1. Add reaction and verify count updates.
2. Remove reaction and verify count decrements.
3. Edit own message and verify edited state.
4. Delete own message and verify tombstone.

## Realtime
1. Open same conversation in two browsers.
2. Send message in A and verify near-real-time render in B.
3. Trigger typing in A and verify transient typing indicator in B.
4. Disconnect/reconnect browser and verify catch-up messages fetched by `afterSeq`.
5. Verify reconnect catch-up uses only `afterSeq=lastSeenSeq` and does not refetch full history.
6. Verify no duplicate messages after WS events and a manual `Check for new messages`.
7. Pin/unpin in A and verify pins updates in B (`chat:pin:update`).
8. Add/remove bookmark in A and verify bookmarks update in B (`chat:bookmark:update`).
9. Update conversation settings in A and verify policy state refreshes in B (`chat:conversation:updated`).

## Read Receipts
1. Open conversation with unread messages.
2. Verify `POST /chat/conversations/:id/read` is sent with `lastReadSeq`.
3. Refresh and verify unread count decreases.

## Lifecycle + Permissions
1. Archive conversation; verify composer/actions disabled and banner shown.
2. Unarchive and verify write actions restored.
3. For muted user: verify send/edit/delete/react blocked and muted banner shown.
4. For banned user: verify conversation is blocked with banned message.
5. DM confidentiality: non-participant admin should fail list/read/subscribe/send.

## Group / Forum Management
1. Create `GROUP_CLOSED` with members.
2. Create `FORUM_OPEN`.
3. Invite members with allowed policy.
4. Switch invite policy and verify UI reflects restriction.
5. Hard delete (super admin) and verify removed from list.

## Moderation
1. Apply MUTE, verify blocked mutating actions for target user.
2. Apply UNMUTE, verify actions restored.
3. Apply BAN, verify blocked access/read/subscribe.
4. Apply UNBAN, verify restored access.

## Notifications
1. Open `/notifications`.
2. Verify DM / MENTION / THREAD_REPLY items render from `data`.
3. Click notification and verify chat deep-link opens target conversation.
4. Mark individual read and mark all read; verify unread count updates.

## Regression Smoke (non-chat)
1. Open `/dashboard` and verify widgets load.
2. Open `/media` and verify upload/list preview works.
3. Open `/users` and verify list loads.
4. Open `/schedule` and verify queue loads.

## Playwright E2E Gate
1. Install browser dependencies if needed:
   - `npx playwright install`
2. Configure env (as available):
   - `E2E_BASE_URL` optional (`http://localhost:5173` default)
   - `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` (required for auth suites)
   - `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` (required for admin suites)
   - `E2E_TARGET_USER_ID` (optional moderation target for mute/ban checks)
3. Run:
   - `npm run test:chat-e2e`
   - or `npm run test:chat-e2e:headed`
4. Expected behavior:
   - suites skip with explicit messages when required creds are not present,
   - auth and admin flows run when env is configured.
