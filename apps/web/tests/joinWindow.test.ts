import { describe, expect, it } from "vitest";
import { canJoinSlot } from "../src/lib/joinWindow";
describe("Live session join window", () => {
  const start = "2026-10-01T10:00:00Z",
    end = "2026-10-01T11:00:00Z";
  it("opens exactly fifteen minutes before the session", () => {
    expect(canJoinSlot(start, end, Date.parse("2026-10-01T09:45:00Z"))).toBe(
      true,
    );
    expect(canJoinSlot(start, end, Date.parse("2026-10-01T09:44:59Z"))).toBe(
      false,
    );
  });
  it("closes after the fifteen minute grace period", () => {
    expect(canJoinSlot(start, end, Date.parse("2026-10-01T11:15:00Z"))).toBe(
      true,
    );
    expect(canJoinSlot(start, end, Date.parse("2026-10-01T11:15:01Z"))).toBe(
      false,
    );
  });
  it("rejects malformed dates", () =>
    expect(canJoinSlot("invalid", end)).toBe(false));
});
