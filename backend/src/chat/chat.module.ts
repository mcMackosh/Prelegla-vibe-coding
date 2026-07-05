import { Module } from '@nestjs/common';
import { TemplatesModule } from '../templates/templates.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [TemplatesModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
