import { afterEach, describe, expect, it, vi } from "vitest";
import { getDocument, listDocuments, saveDocument } from "@/lib/documents";
import { clearSession, setSession } from "@/lib/session";
import { EMPTY_FORM_DATA } from "@/lib/types";

describe("documents API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession();
  });

  it("throws when there is no session", async () => {
    await expect(listDocuments()).rejects.toThrow("You must be signed in to do that");
  });

  it("listDocuments sends the bearer token and returns the parsed list", async () => {
    setSession("jwt-token", "a@b.com");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, type: "mutual-nda", title: "Acme x Globex", createdAt: "2026-01-01" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listDocuments();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/documents"),
      expect.objectContaining({ headers: { Authorization: "Bearer jwt-token" } })
    );
    expect(result).toEqual([{ id: 1, type: "mutual-nda", title: "Acme x Globex", createdAt: "2026-01-01" }]);
  });

  it("getDocument fetches a single document by id", async () => {
    setSession("jwt-token", "a@b.com");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, type: "mutual-nda", title: "Acme x Globex", createdAt: "2026-01-01", data: EMPTY_FORM_DATA }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getDocument(1);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/documents/1"),
      expect.objectContaining({ headers: { Authorization: "Bearer jwt-token" } })
    );
  });

  it("saveDocument posts the title and data", async () => {
    setSession("jwt-token", "a@b.com");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, type: "mutual-nda", title: "Acme x Globex", createdAt: "2026-01-01" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await saveDocument("Acme x Globex", EMPTY_FORM_DATA);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/documents"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer jwt-token" },
        body: JSON.stringify({ type: "mutual-nda", title: "Acme x Globex", data: EMPTY_FORM_DATA }),
      })
    );
  });

  it("throws with the server's message when the response is not ok", async () => {
    setSession("jwt-token", "a@b.com");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Document not found" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDocument(999)).rejects.toThrow("Document not found");
  });
});
