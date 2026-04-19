import { describe, it, expect } from "vitest";
import { formatCountdown } from "../countdown";

describe("formatCountdown", () => {
  it("formats days/hours/minutes/seconds from ms", () => {
    // 1 day + 1 hour + 1 minute + 1 second = 86400 + 3600 + 60 + 1 = 90061 seconds = 90061000 ms
    expect(formatCountdown(90061000)).toEqual({ d: 1, h: 1, m: 1, s: 1 });
  });
  it("zeroes out negative ms", () => {
    expect(formatCountdown(-1)).toEqual({ d: 0, h: 0, m: 0, s: 0 });
  });
  it("handles exactly zero", () => {
    expect(formatCountdown(0)).toEqual({ d: 0, h: 0, m: 0, s: 0 });
  });
  it("handles under-a-second ms", () => {
    expect(formatCountdown(500)).toEqual({ d: 0, h: 0, m: 0, s: 0 });
  });
  it("handles multiple days", () => {
    expect(formatCountdown(3 * 86400000)).toEqual({ d: 3, h: 0, m: 0, s: 0 });
  });
});
