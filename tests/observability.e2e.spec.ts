import { expect, test, type Page, type Route } from "@playwright/test";

const operatorUser = {
  id: "operator-user-id",
  email: "operator@hexmon.local",
  first_name: "Operator",
  last_name: "User",
  role_id: "role-operator",
  role: "OPERATOR",
};

const rolesPayload = {
  items: [
    {
      id: "role-operator",
      name: "OPERATOR",
      description: "Operator",
      permissions: {
        inherits: [],
        grants: [
          { action: "read", subject: "Dashboard" },
          { action: "read", subject: "Screen" },
        ],
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

const observabilityOverview = {
  generated_at: "2026-03-12T12:00:00.000Z",
  deployment_mode: "production",
  current_state_source: "backend_and_prometheus",
  fleet: {
    total_players: 18,
    active_players: 16,
    inactive_players: 1,
    offline_players: 1,
    reachable_players: 14,
    configured_player_targets: 18,
  },
  alerts: {
    available: true,
    firing: 1,
    highest_severity: "warning",
    status: "degraded",
  },
  machines: [
    {
      id: "vm2",
      name: "VM2 Backend Machine",
      role: "backend",
      status: "healthy",
      scrape_status: {
        reachable_targets: 3,
        expected_targets: 3,
      },
      resources: {
        cpu_percent: 24,
        memory_percent: 57,
        disk_percent: 62,
      },
      services: [
        { id: "backend", label: "Backend API", status: "up" },
        { id: "node", label: "Host Exporter", status: "up" },
        { id: "cadvisor", label: "Container Metrics", status: "up" },
      ],
      grafana: {
        dashboard_url: "/grafana/d/signhex-vm2-backend",
      },
    },
    {
      id: "vm3",
      name: "VM3 CMS Machine",
      role: "cms",
      status: "degraded",
      scrape_status: {
        reachable_targets: 2,
        expected_targets: 3,
      },
      resources: {
        cpu_percent: 18,
        memory_percent: 51,
        disk_percent: 74,
      },
      services: [
        { id: "node", label: "Host Exporter", status: "up" },
        { id: "nginx", label: "Nginx Exporter", status: "up" },
        { id: "grafana", label: "Grafana Metrics", status: "down" },
      ],
      grafana: {
        dashboard_url: "/grafana/d/signhex-vm3-cms",
      },
    },
  ],
  grafana: {
    enabled: true,
    embed_enabled: true,
    base_path: "/grafana",
    links: {
      backend_service: "/grafana/d/signhex-backend-service",
      players_fleet: "/grafana/d/signhex-players-fleet",
      machines: {
        vm2: "/grafana/d/signhex-vm2-backend",
        vm3: "/grafana/d/signhex-vm3-cms",
      },
    },
  },
};

const bootstrapOperatorSession = async (page: Page) => {
  await page.addInitScript((user) => {
    window.sessionStorage.setItem(
      "persist:signhex",
      JSON.stringify({
        auth: JSON.stringify({
          token: "cms-token",
          user,
          csrfToken: "csrf-token",
        }),
        _persist: JSON.stringify({
          version: 1,
          rehydrated: true,
        }),
      }),
    );
    document.cookie = "csrf_token=csrf-token; path=/";
  }, operatorUser);
};

const installApiMocks = async (page: Page) => {
  await page.route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;
    const method = route.request().method();

    if (pathname === "/api/v1/auth/logout" && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    if (pathname === "/api/v1/roles" && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(rolesPayload),
      });
    }

    if (pathname === "/api/v1/notifications/unread-count" && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unread_total: 0 }),
      });
    }

    if (pathname === "/api/v1/settings/branding" && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          app_name: "Signhex CMS",
          logo_media_id: null,
          icon_media_id: null,
          favicon_media_id: null,
          logo_url: null,
          icon_url: null,
          favicon_url: null,
        }),
      });
    }

    if (pathname === "/api/v1/settings/appearance" && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          theme_mode: "light",
          accent_preset: "amber",
          sidebar_mode: "expanded",
        }),
      });
    }

    if (pathname === "/api/v1/observability/overview" && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(observabilityOverview),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
};

test.describe("Observability page", () => {
  test("shows backend and CMS observability data for operators", async ({
    page,
  }) => {
    await bootstrapOperatorSession(page);
    await installApiMocks(page);

    await page.goto("/observability");

    await expect(
      page.getByRole("heading", { name: "Observability", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("VM2 Backend Machine")).toBeVisible();
    await expect(page.getByText("VM3 CMS Machine")).toBeVisible();
    await expect(page.getByText("Alertmanager summary")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Open Server VM Dashboard/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Open CMS VM Dashboard/i }),
    ).toBeVisible();
    await expect(page.getByText("Screen-level observability")).toBeVisible();
  });
});
