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

## Composer + Attachments
1. Send plain text message.
2. Upload file from AttachmentPicker upload tab and send.
3. Drag/drop file directly into composer and send.
4. Verify send payload includes only `attachmentMediaIds`.
5. Verify 413/415/403 upload errors show friendly messages.
6. Verify message with `<script>` renders as plain text safely.

## Threads
1. Click Reply on message; thread panel opens.
2. Send reply with `replyTo`.
3. Enable “also send to main chat” and verify both messages appear.
4. Open deep link thread route and verify same thread loads.

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
