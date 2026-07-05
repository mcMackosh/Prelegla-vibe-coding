import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(req.userId, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.documentsService.findAllForUser(req.userId);
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.documentsService.findOneForUser(req.userId, id);
  }
}
