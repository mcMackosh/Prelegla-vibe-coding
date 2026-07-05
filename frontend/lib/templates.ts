const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type Segment =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "link"; text: string; url: string }
  | { type: "field"; key: string; label: string; possessive: boolean };

export type Clause = {
  title?: string;
  body: Segment[];
  children: Clause[];
};

export type TemplateField = {
  key: string;
  label: string;
};

export type DocumentTypeSummary = {
  id: string;
  name: string;
  description: string;
  status: "available" | "planned";
};

export type DocumentTypeDetail = DocumentTypeSummary & {
  clauses: Clause[];
  fields: TemplateField[];
  attribution: Segment[];
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? "Request failed");
  }
  return response.json();
}

export async function listDocumentTypes(): Promise<DocumentTypeSummary[]> {
  const response = await fetch(`${API_URL}/templates`);
  return parseResponse(response);
}

export async function getDocumentType(id: string): Promise<DocumentTypeDetail> {
  const response = await fetch(`${API_URL}/templates/${id}`);
  return parseResponse(response);
}
