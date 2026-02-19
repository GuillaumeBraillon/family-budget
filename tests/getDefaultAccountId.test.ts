import { describe, it, expect } from "vitest";
import { getDefaultAccountId } from "../hooks/accounts/getDefaultAccountId";
import { AccountType } from "../types";

describe("getDefaultAccountId", () => {
  it("returns empty string when no accounts", () => {
    expect(getDefaultAccountId([], true)).toBe("");
  });

  it("prefers joint account when present", () => {
    const accounts = [
      { id: "a1", isJoint: false, type: AccountType.SAVINGS, name: "A", ownerId: "p1", currentBalance: 0 },
      { id: "j1", isJoint: true, type: AccountType.CHECKING, name: "Joint", ownerId: "p2", currentBalance: 0 },
    ];
    expect(getDefaultAccountId(accounts as any, true)).toBe("j1");
  });

  it("when filterChecking=true prefers checking account if no joint", () => {
    const accounts = [
      { id: "s1", isJoint: false, type: AccountType.SAVINGS, name: "S", ownerId: "p1", currentBalance: 0 },
      { id: "c1", isJoint: false, type: AccountType.CHECKING, name: "C", ownerId: "p2", currentBalance: 0 },
    ];
    expect(getDefaultAccountId(accounts as any, true)).toBe("c1");
  });

  it("falls back to first account when no joint and filterChecking=false", () => {
    const accounts = [
      { id: "s1", isJoint: false, type: AccountType.SAVINGS, name: "S", ownerId: "p1", currentBalance: 0 },
      { id: "c1", isJoint: false, type: AccountType.CHECKING, name: "C", ownerId: "p2", currentBalance: 0 },
    ];
    expect(getDefaultAccountId(accounts as any, false)).toBe("s1");
  });
});
