import { afterEach, describe, expect, it, vi } from "vitest";
import { sendDocumentChatMessage, sendNdaChatMessage, sendRouteMessage } from "@/lib/chat";

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

  it("sendDocumentChatMessage posts to /chat/documents/:type", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Got it.", fields: { customer: "Acme Corp." } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendDocumentChatMessage("cloud-service-agreement", [
      { role: "user", content: "Customer is Acme Corp." },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/chat/documents/cloud-service-agreement"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ reply: "Got it.", fields: { customer: "Acme Corp." } });
  });

  it("sendRouteMessage posts to /chat/route and returns the matched type", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ documentTypeId: "mutual-nda", reply: "Sounds like an NDA." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendRouteMessage("I need an NDA");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/chat/route"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ documentTypeId: "mutual-nda", reply: "Sounds like an NDA." });
  });
});
