import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { parseTemplate, ParsedTemplate } from "./template-parser";

export type DocumentTypeSummary = {
  id: string;
  name: string;
  description: string;
  status: "available" | "planned";
};

export type DocumentTypeDetail = DocumentTypeSummary & ParsedTemplate;

type CatalogEntry = DocumentTypeSummary & { templateFile: string };

/**
 * catalog.json and templates/*.md live at the repo root, one level above backend/.
 * Resolved via process.cwd() (not __dirname) so this works identically whether the
 * process is started locally from backend/ (`npm run start:dev`) or in Docker, where
 * the image mirrors the same backend/-next-to-templates/ layout (see backend/Dockerfile).
 */
function repoRootPath(...segments: string[]): string {
  return path.resolve(process.cwd(), "..", ...segments);
}

@Injectable()
export class TemplatesService implements OnModuleInit {
  private catalog: CatalogEntry[] = [];
  private readonly parsedCache = new Map<string, ParsedTemplate>();

  onModuleInit() {
    const raw = fs.readFileSync(repoRootPath("catalog.json"), "utf-8");
    const parsed = JSON.parse(raw) as { documentTypes: CatalogEntry[] };
    this.catalog = parsed.documentTypes;
  }

  listDocumentTypes(): DocumentTypeSummary[] {
    return this.catalog.map(({ id, name, description, status }) => ({
      id,
      name,
      description,
      status,
    }));
  }

  getDocumentType(id: string): DocumentTypeDetail {
    const entry = this.catalog.find((doc) => doc.id === id);
    if (!entry) {
      throw new NotFoundException(`Unknown document type: ${id}`);
    }

    let parsedTemplate = this.parsedCache.get(id);
    if (!parsedTemplate) {
      const raw = fs.readFileSync(repoRootPath(entry.templateFile), "utf-8");
      parsedTemplate = parseTemplate(raw);
      this.parsedCache.set(id, parsedTemplate);
    }

    return {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      status: entry.status,
      ...parsedTemplate,
    };
  }
}
