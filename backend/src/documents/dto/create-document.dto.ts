import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  // Validated against the real catalog (TemplatesService) in DocumentsService,
  // rather than a hardcoded list here, now that KAN-6 supports all 11 types.
  @IsOptional()
  @IsString()
  type?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsObject()
  data: Record<string, string>;
}
