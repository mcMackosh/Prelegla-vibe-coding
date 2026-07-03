import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMessageDto } from './chat-message.dto';

export class NdaChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  messages: ChatMessageDto[];
}
