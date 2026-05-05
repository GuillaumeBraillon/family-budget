import { describe, it, expect } from "vitest";
import { hasExtraAmounts, hasStandardAmounts } from "../hooks/usePlanner";
import type { TagAmount } from "../types";

const ta = (tagId: string, amount: number, isExtra = false): TagAmount => ({ tagId, amount, isExtra });

describe("usePlanner helpers", () => {
  describe("hasExtraAmounts", () => {
    it("returns true when global flag is set", () => {
      expect(hasExtraAmounts(true, [])).toBe(true);
    });

    it("returns true when global flag set even with no tags", () => {
      expect(hasExtraAmounts(true, undefined)).toBe(true);
    });

    it("returns true when a tag is marked extra", () => {
      expect(hasExtraAmounts(false, [ta("t1", 50, true)])).toBe(true);
    });

    it("returns true when one of several tags is extra", () => {
      expect(hasExtraAmounts(false, [ta("t1", 30, false), ta("t2", 20, true)])).toBe(true);
    });

    it("returns false when nothing is extra", () => {
      expect(hasExtraAmounts(false, [ta("t1", 50, false)])).toBe(false);
    });

    it("returns false when tagAmounts is empty array", () => {
      expect(hasExtraAmounts(false, [])).toBe(false);
    });

    it("returns false when tagAmounts is undefined", () => {
      expect(hasExtraAmounts(false, undefined)).toBe(false);
    });

    it("priorité global : global=true remplace tout même si aucun tag extra", () => {
      expect(hasExtraAmounts(true, [ta("t1", 100, false)])).toBe(true);
    });
  });

  describe("hasStandardAmounts", () => {
    it("returns false when global extra is set", () => {
      expect(hasStandardAmounts(true, 100, [])).toBe(false);
    });

    it("returns false when global extra and tags present", () => {
      expect(hasStandardAmounts(true, 100, [ta("t1", 50, true)])).toBe(false);
    });

    it("returns true when no tags are present", () => {
      expect(hasStandardAmounts(false, 100, [])).toBe(true);
    });

    it("returns true when tagAmounts is undefined", () => {
      expect(hasStandardAmounts(false, 100, undefined)).toBe(true);
    });

    it("returns true when tags don't cover full amount (reste non taggé)", () => {
      expect(hasStandardAmounts(false, 115, [ta("t1", 70, true)])).toBe(true);
    });

    it("returns true when all tags are standard", () => {
      expect(hasStandardAmounts(false, 100, [ta("t1", 60, false), ta("t2", 40, false)])).toBe(true);
    });

    it("returns false when all tags are extra and sum = total", () => {
      expect(hasStandardAmounts(false, 100, [ta("t1", 100, true)])).toBe(false);
    });

    it("returns false when multiple extra tags sum = total exactly", () => {
      expect(hasStandardAmounts(false, 100, [ta("t1", 60, true), ta("t2", 40, true)])).toBe(false);
    });

    it("retourne true si opération mixte (tag extra + tag standard)", () => {
      // 70€ extra + 30€ standard → has standard = true
      expect(hasStandardAmounts(false, 100, [ta("t1", 70, true), ta("t2", 30, false)])).toBe(true);
    });

    it("retourne false si le reste non-extra est exactement 0 (100% extra)", () => {
      // Cas pur : tous les tags sont extra et couvrent exactement le total
      expect(hasStandardAmounts(false, 100, [ta("t1", 100, true)])).toBe(false);
    });

    it("retourne true si le reste non-extra est légèrement > 0.01", () => {
      // Extra = 99.98, restant = 0.02 → 0.02 > 0.01 = true → Standard présent
      expect(hasStandardAmounts(false, 100, [ta("t1", 99.98, true)])).toBe(true);
    });
  });
});
