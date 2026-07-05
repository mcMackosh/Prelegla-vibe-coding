import { afterEach, describe, expect, it, vi } from "vitest";
import { getDocumentType, listDocumentTypes } from "@/lib/templates";

describe("templates API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listDocumentTypes fetches the catalog list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "mutual-nda", name: "Mutual NDA", description: "", status: "available" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listDocumentTypes();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/templates"));
    expect(result).toEqual([{ id: "mutual-nda", name: "Mutual NDA", description: "", status: "available" }]);
  });

  it("getDocumentType fetches a single parsed template", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "mutual-nda",
        name: "Mutual NDA",
        description: "",
        status: "available",
        clauses: [],
        fields: [],
        attribution: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getDocumentType("mutual-nda");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/templates/mutual-nda"));
  });

  it("throws with the server's message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Unknown document type: bogus" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDocumentType("bogus")).rejects.toThrow("Unknown document type: bogus");
  });
});
