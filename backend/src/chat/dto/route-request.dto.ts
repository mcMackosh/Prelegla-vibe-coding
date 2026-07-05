import { IsNotEmpty, IsString } from 'class-validator';

export class RouteRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
