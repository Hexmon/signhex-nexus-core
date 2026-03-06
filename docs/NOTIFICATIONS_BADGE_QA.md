# Notifications Badge QA Checklist

1. Boot
- Login and open protected app shell.
- Verify `GET /api/v1/notifications/unread-count` is called with `Authorization: Bearer`.
- Verify header bell badge renders with `unread_total`.

2. WS initial sync
- Verify socket connects to `/notifications` namespace.
- Verify count updates on `notifications:count`.

3. Realtime change
- Trigger a notification (DM/mention/thread reply).
- Verify badge updates without page refresh.

4. Mark read
- Mark a single unread notification as read.
- Verify badge decrements once.
- Repeat mark-read on same item and verify no extra decrement.

5. Mark all read
- Click mark-all.
- Verify badge becomes `0` and hides.

6. Delete unread notification
- Delete an unread notification.
- Verify badge decrements.

7. Reconnect
- Disconnect WS server/network temporarily.
- Verify badge keeps last known count.
- Reconnect and verify sync via `notifications:sync` ack or REST fallback.

8. Unauthorized
- Revoke token and trigger unread-count call.
- Verify existing auth flow redirects to login.

9. On-prem HTTP
- Run with `VITE_WS_BASE_URL=http://host:3000`.
- Verify no forced `https`/`wss` behavior.

