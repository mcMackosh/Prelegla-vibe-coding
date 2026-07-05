import { afterEach, describe, expect, it } from "vitest";
import { clearSession, getSession, setSession } from "@/lib/session";

describe("session storage", () => {
  afterEach(() => {
    clearSession();
  });

  it("returns null when no session is stored", () => {
    expect(getSession()).toBeNull();
  });

  it("returns the stored token and email after setSession", () => {
    setSession("jwt-token", "a@b.com");
    expect(getSession()).toEqual({ token: "jwt-token", email: "a@b.com" });
  });

  it("returns null after clearSession", () => {
    setSession("jwt-token", "a@b.com");
    clearSession();
    expect(getSession()).toBeNull();
  });
});
