import { afterEach, describe, expect, it, vi } from "vitest";
import { sendNdaChatMessage } from "@/lib/chat";

describe("chat API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts messages to /chat/nda and returns the parsed response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Got it.", fields: { partyAName: "Acme Corp." } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendNdaChatMessage([{ role: "user", content: "Party A is Acme Corp." }]);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/chat/nda"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ reply: "Got it.", fields: { partyAName: "Acme Corp." } });
  });

  it("throws with the server's message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "The AI assistant returned an error" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendNdaChatMessage([{ role: "user", content: "hi" }])).rejects.toThrow(
      "The AI assistant returned an error"
    );
  });
});
