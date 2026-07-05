import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

const DOCUMENT_TYPES = ['mutual-nda'] as const;

export class CreateDocumentDto {
  @IsOptional()
  @IsIn(DOCUMENT_TYPES)
  type?: (typeof DOCUMENT_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsObject()
  data: Record<string, string>;
}
