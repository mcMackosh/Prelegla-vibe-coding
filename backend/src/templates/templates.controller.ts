import { Controller, Get, Param } from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll() {
    return this.templatesService.listDocumentTypes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.getDocumentType(id);
  }
}
