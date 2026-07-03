import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
