import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { NdaChatRequestDto } from './dto/nda-chat-request.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('nda')
  sendNdaMessage(@Body() dto: NdaChatRequestDto) {
    return this.chatService.handleNdaTurn(dto.messages);
  }
}
