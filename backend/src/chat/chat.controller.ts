import { Body, Controller, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { NdaChatRequestDto } from './dto/nda-chat-request.dto';
import { RouteRequestDto } from './dto/route-request.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('nda')
  sendNdaMessage(@Body() dto: NdaChatRequestDto) {
    return this.chatService.handleNdaTurn(dto.messages);
  }

  @Post('route')
  routeToDocumentType(@Body() dto: RouteRequestDto) {
    return this.chatService.routeToDocumentType(dto.message);
  }

  @Post('documents/:type')
  sendDocumentMessage(
    @Param('type') type: string,
    @Body() dto: NdaChatRequestDto,
  ) {
    return this.chatService.handleDocumentTurn(type, dto.messages);
  }
}
