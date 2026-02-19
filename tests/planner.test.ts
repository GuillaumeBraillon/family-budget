import { describe, it, expect } from "vitest";
import { hasExtraAmounts, hasStandardAmounts } from "../hooks/usePlanner";

describe("usePlanner helpers", () => {
  describe("hasExtraAmounts", () => {
    it("returns true when global flag is set", () => {
      expect(hasExtraAmounts(true, [])).toBe(true);
    });

    it("returns true when a tag is marked extra", () => {
      expect(hasExtraAmounts(false, [{ tagId: "t1", amount: 50, isExtra: true } as any])).toBe(true);
    });

    it("returns false when nothing is extra", () => {
      expect(hasExtraAmounts(false, [{ tagId: "t1", amount: 50 } as any])).toBe(false);
    });
  });

  describe("hasStandardAmounts", () => {
    it("returns false when global extra is set", () => {
      expect(hasStandardAmounts(true, 100, [])).toBe(false);
    });

    it("returns true when no tags are present", () => {
      expect(hasStandardAmounts(false, 100, [])).toBe(true);
    });

    it("returns true when tags don't cover full amount", () => {
      expect(hasStandardAmounts(false, 115, [{ tagId: "t1", amount: 70, isExtra: true } as any])).toBe(true);
    });

    it("returns false when tags marked extra sum equals total", () => {
      expect(hasStandardAmounts(false, 100, [{ tagId: "t1", amount: 100, isExtra: true } as any])).toBe(false);
    });
  });
});
