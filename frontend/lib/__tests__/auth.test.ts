import { afterEach, describe, expect, it, vi } from "vitest";
import { signIn, signUp } from "@/lib/auth";

describe("auth API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("signUp posts credentials to /auth/signup and returns the parsed response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: "signed-jwt", email: "a@b.com" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await signUp({ email: "a@b.com", password: "password123" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/signup"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ accessToken: "signed-jwt", email: "a@b.com" });
  });

  it("signIn throws with the server's message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: ["email must be an email"] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(signIn({ email: "bad", password: "short" })).rejects.toThrow(
      "email must be an email"
    );
  });
});
