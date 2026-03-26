import { describe, expect, it } from "vitest";
import type { ScreenGroup, ScreenOverviewItem } from "@/api/types";
import {
  maskCertificateSerial,
  matchesScreenGroupSearch,
  matchesScreenSearch,
} from "@/lib/screens";

describe("screen helpers", () => {
  it("masks certificate serials except for the last four characters", () => {
    expect(maskCertificateSerial(null)).toBe("N/A");
    expect(maskCertificateSerial("1234")).toBe("1234");
    expect(maskCertificateSerial("ABCDEF1234")).toBe("***1234");
  });

  it("matches screens by name, location, and id", () => {
    const screen: ScreenOverviewItem = {
      id: "screen-001",
      name: "Lobby Display",
      location: "First Floor",
      status: "ACTIVE",
    };

    expect(matchesScreenSearch(screen, "")).toBe(true);
    expect(matchesScreenSearch(screen, "lobby")).toBe(true);
    expect(matchesScreenSearch(screen, "floor")).toBe(true);
    expect(matchesScreenSearch(screen, "001")).toBe(true);
    expect(matchesScreenSearch(screen, "kitchen")).toBe(false);
  });

  it("matches screen groups by name, description, and member screen names", () => {
    const group: ScreenGroup = {
      id: "group-1",
      name: "Retail Cluster",
      description: "Front-of-store displays",
      screen_ids: ["screen-1", "screen-2"],
    };
    const screenNamesById = new Map<string, string>([
      ["screen-1", "Entrance Display"],
      ["screen-2", "Checkout Display"],
    ]);

    expect(matchesScreenGroupSearch(group, "", screenNamesById)).toBe(true);
    expect(matchesScreenGroupSearch(group, "retail", screenNamesById)).toBe(true);
    expect(matchesScreenGroupSearch(group, "front-of-store", screenNamesById)).toBe(true);
    expect(matchesScreenGroupSearch(group, "checkout", screenNamesById)).toBe(true);
    expect(matchesScreenGroupSearch(group, "warehouse", screenNamesById)).toBe(false);
  });
});
