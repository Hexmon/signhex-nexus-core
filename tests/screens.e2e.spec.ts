import { expect, test, type Page, type Route } from "@playwright/test";

type ScreenRecord = {
  id: string;
  name: string;
  location?: string | null;
  status: string;
  health_state?: string;
  health_reason?: string | null;
  auth_diagnostics?: {
    state?: string;
    reason?: string;
  } | null;
  active_pairing?: {
    id?: string;
    mode?: string | null;
    confirmed?: boolean;
    expires_at?: string | null;
  } | null;
  last_heartbeat_at?: string | null;
  active_items?: unknown[];
  upcoming_items?: unknown[];
};

type MockState = {
  screens: ScreenRecord[];
  groups: Array<{ id: string; name: string; screen_ids?: string[] }>;
  pairings: Array<Record<string, unknown>>;
  recoveryByDeviceId: Record<string, unknown>;
  confirmModeByCode: Record<string, "PAIRING" | "RECOVERY">;
};

const adminUser = {
  id: "admin-user-id",
  email: "admin@hexmon.local",
  first_name: "Admin",
  last_name: "User",
  role_id: "role-admin",
  role: "ADMIN",
};

const rolesPayload = {
  items: [
    {
      id: "role-admin",
      name: "ADMIN",
      description: "Administrator",
      permissions: {
        inherits: [],
        grants: [{ action: "manage", subject: "all" }],
      },
      is_system: true,
      created_at: "2026-03-12T00:00:00.000Z",
      updated_at: "2026-03-12T00:00:00.000Z",
    },
  ],
  page: 1,
  limit: 100,
  total: 1,
};

const login = async (page: Page) => {
  await page.goto("/login");
  await page.fill("#login-email", adminUser.email);
  await page.fill("#login-password", "ChangeMe123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
};

const buildOverview = (state: MockState) => ({
  server_time: "2026-03-12T12:00:00.000Z",
  screens: state.screens,
  groups: state.groups,
  now_playing: [],
  stats: {
    total_screens: state.screens.length,
    active_screens: state.screens.filter((screen) => screen.health_state === "ONLINE").length,
    offline_screens: state.screens.filter((screen) => screen.health_state === "OFFLINE").length,
    total_groups: state.groups.length,
  },
});

const installApiMocks = async (page: Page, state: MockState) => {
  await page.route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const { pathname, searchParams } = url;
    const method = route.request().method();

    if (pathname === "/api/v1/auth/login" && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "cms-token",
          csrf_token: "csrf-token",
          user: adminUser,
        }),
      });
    }

    if (pathname === "/api/v1/auth/logout" && method === "POST") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    }

    if (pathname === "/api/v1/roles" && method === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rolesPayload) });
    }

    if (pathname === "/api/v1/notifications/unread-count" && method === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ unread_total: 0 }) });
    }

    if (pathname === "/api/v1/screens/overview" && method === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(buildOverview(state)) });
    }

    if (pathname === "/api/v1/device-pairing" && method === "GET") {
      const pageNum = Number(searchParams.get("page") || 1);
      const limit = Number(searchParams.get("limit") || 10);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: state.pairings, page: pageNum, limit, total: state.pairings.length }),
      });
    }

    if (pathname === "/api/v1/device-pairing/confirm" && method === "POST") {
      const payload = route.request().postDataJSON() as { pairing_code?: string; name?: string; location?: string };
      const mode = payload.pairing_code ? state.confirmModeByCode[payload.pairing_code] ?? "PAIRING" : "PAIRING";
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: mode === "RECOVERY" ? "Recovery confirmed. Awaiting device completion." : "Pairing confirmed. Awaiting device completion.",
          pairing: {
            id: `pairing-${payload.pairing_code}`,
            device_id: mode === "RECOVERY" ? state.screens[0]?.id ?? "screen-1" : "device-new",
            pairing_code: payload.pairing_code,
            expires_at: "2026-03-12T13:00:00.000Z",
            confirmed_at: "2026-03-12T12:05:00.000Z",
          },
          recovery: {
            mode,
            recommended_action:
              mode === "RECOVERY" ? "WAIT_FOR_DEVICE_RECOVERY_COMPLETE" : "WAIT_FOR_DEVICE_COMPLETE",
          },
        }),
      });
    }

    if (pathname.startsWith("/api/v1/device-pairing/recovery/") && method === "GET") {
      const deviceId = pathname.split("/").pop()!;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(state.recoveryByDeviceId[deviceId] ?? {}),
      });
    }

    if (pathname.startsWith("/api/v1/device-pairing/recovery/") && method === "POST") {
      const deviceId = pathname.split("/").pop()!;
      const pairingCode = `REC-${deviceId.slice(0, 4).toUpperCase()}`;
      state.confirmModeByCode[pairingCode] = "RECOVERY";
      state.pairings = [
        {
          id: `pairing-${pairingCode}`,
          device_id: deviceId,
          pairing_code: pairingCode,
          used: false,
          used_at: null,
          expires_at: "2026-03-12T13:00:00.000Z",
          created_at: "2026-03-12T12:00:00.000Z",
          recovery: {
            mode: "RECOVERY",
            recommended_action: "WAIT_FOR_DEVICE_RECOVERY_COMPLETE",
          },
          specs: null,
        },
      ];
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: `pairing-${pairingCode}`,
          pairing_code: pairingCode,
          expires_at: "2026-03-12T13:00:00.000Z",
          expires_in: 900,
          recovery: {
            mode: "RECOVERY",
            recommended_action: "CONFIRM_RECOVERY",
            device_id: deviceId,
            screen: state.screens.find((screen) => screen.id === deviceId) ?? null,
          },
          diagnostics: {
            auth_state: "EXPIRED_CERTIFICATE",
            reason: "The latest device certificate has expired.",
            recommended_action: "RECOVER_IN_PLACE",
          },
        }),
      });
    }

    if (pathname.startsWith("/api/v1/screens/") && method === "DELETE") {
      const screenId = pathname.split("/").pop()!;
      state.screens = state.screens.filter((screen) => screen.id !== screenId);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: screenId,
          message: "Screen deleted with related data cleaned up",
          cleanup: {},
          storage_cleanup: { deleted: [], failed: [] },
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
};

test.describe("Screens operator flow", () => {
  test("renders screen health and recovery info and handles delete refresh", async ({ page }) => {
    const state: MockState = {
      screens: [
        {
          id: "screen-1",
          name: "Lobby Screen",
          location: "Reception",
          status: "ACTIVE",
          health_state: "RECOVERY_REQUIRED",
          health_reason: "Recovery pairing is in progress for this screen.",
          auth_diagnostics: {
            state: "EXPIRED_CERTIFICATE",
            reason: "The latest device certificate has expired.",
          },
          active_pairing: {
            id: "pairing-1",
            mode: "RECOVERY",
            confirmed: true,
            expires_at: "2026-03-12T13:00:00.000Z",
          },
          last_heartbeat_at: "2026-03-12T11:59:00.000Z",
          active_items: [],
          upcoming_items: [],
        },
      ],
      groups: [],
      pairings: [],
      recoveryByDeviceId: {},
      confirmModeByCode: {},
    };

    await installApiMocks(page, state);
    await login(page);

    await page.goto("/screens");
    await expect(page.getByRole("button", { name: "Pair Device" }).first()).toBeVisible();
    await expect(page.getByText("Lobby Screen")).toBeVisible();
    await expect(page.getByText(/Health: RECOVERY_REQUIRED/)).toBeVisible();
    await expect(page.getByText(/Auth: The latest device certificate has expired\./)).toBeVisible();
    await expect(page.getByText(/Recovery pending/)).toBeVisible();

    await page.getByRole("button", { name: "Delete Screen Lobby Screen" }).click();
    await expect(page.getByText("Lobby Screen")).toHaveCount(0);
  });

  test("supports first-time pairing confirmation from the Pair Device modal", async ({ page }) => {
    const state: MockState = {
      screens: [],
      groups: [],
      pairings: [],
      recoveryByDeviceId: {},
      confirmModeByCode: {
        PAIR123: "PAIRING",
      },
    };

    await installApiMocks(page, state);
    await login(page);

    await page.goto("/screens");
    await page.getByRole("button", { name: "Pair Device" }).first().click();
    await expect(page.getByRole("dialog", { name: /Pair Device/i })).toBeVisible();

    await page.getByLabel("Pairing Code *").fill("PAIR123");
    await page.getByLabel("Screen Name *").fill("Lobby Display");
    await page.getByLabel("Location (Optional)").fill("Reception");
    await page.getByRole("button", { name: /Confirm Pairing \/ Recovery/i }).click();

    await expect(page.getByRole("dialog", { name: /Pair Device/i })).toBeHidden();
  });

  test("supports same-device recovery flow from the screens page", async ({ page }) => {
    const deviceId = "screen-recovery-1";
    const state: MockState = {
      screens: [
        {
          id: deviceId,
          name: "Atrium Screen",
          location: "Atrium",
          status: "ACTIVE",
          health_state: "RECOVERY_REQUIRED",
          health_reason: "The screen requires credential recovery before it can authenticate again.",
          auth_diagnostics: {
            state: "EXPIRED_CERTIFICATE",
            reason: "The latest device certificate has expired.",
          },
          active_pairing: null,
          last_heartbeat_at: "2026-03-12T11:59:00.000Z",
          active_items: [],
          upcoming_items: [],
        },
      ],
      groups: [],
      pairings: [],
      recoveryByDeviceId: {
        [deviceId]: {
          device_id: deviceId,
          screen: {
            id: deviceId,
            name: "Atrium Screen",
            status: "ACTIVE",
          },
          active_pairing: null,
          certificate: {
            serial: "expired-serial",
            expires_at: "2026-03-12T10:00:00.000Z",
            revoked_at: null,
            is_revoked: false,
          },
          recovery: {
            auth_state: "EXPIRED_CERTIFICATE",
            reason: "The latest device certificate has expired.",
            recommended_action: "RECOVER_IN_PLACE",
          },
        },
      },
      confirmModeByCode: {},
    };

    await installApiMocks(page, state);
    await login(page);

    await page.goto("/screens");
    await page.getByRole("button", { name: "Recover Screen Atrium Screen" }).click();

    await expect(page.getByRole("dialog", { name: /Recover Screen/i })).toBeVisible();
    await expect(page.getByText(/EXPIRED_CERTIFICATE/)).toBeVisible();
    await page.getByRole("tab", { name: "Recover" }).click();
    await page.getByRole("button", { name: /Generate Recovery Code/i }).click();

    await expect(page.locator('input[value*="REC-"]')).toBeVisible();
    await page.getByRole("button", { name: /Use this code in Confirm/i }).click();
    await page.getByRole("button", { name: /Confirm Pairing \/ Recovery/i }).click();

    await expect(page.getByText(/screen can now complete credential recovery/i)).toBeVisible();
  });
});
