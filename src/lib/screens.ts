import type { ScreenGroup, ScreenOverviewItem } from "@/api/types";

export function maskCertificateSerial(serial?: string | null): string {
  if (!serial) return "N/A";
  if (serial.length <= 4) return serial;
  return `***${serial.slice(-4)}`;
}

function normalizeSearchValue(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

export function matchesScreenSearch(screen: ScreenOverviewItem, search: string): boolean {
  const query = normalizeSearchValue(search);
  if (!query) return true;

  return [screen.name, screen.location, screen.id].some((value) =>
    normalizeSearchValue(value).includes(query)
  );
}

export function matchesScreenGroupSearch(
  group: ScreenGroup,
  search: string,
  screenNamesById: Map<string, string>,
): boolean {
  const query = normalizeSearchValue(search);
  if (!query) return true;

  const memberNames = (group.screen_ids ?? [])
    .map((screenId) => normalizeSearchValue(screenNamesById.get(screenId)))
    .filter(Boolean);

  return [group.name, group.description, ...memberNames].some((value) =>
    normalizeSearchValue(value).includes(query)
  );
}
