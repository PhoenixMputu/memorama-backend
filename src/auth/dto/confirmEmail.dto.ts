import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
export class ConfirmEmailDto {
  @IsEmail()
  readonly email: string;
  @IsNotEmpty()
  readonly code: string;
  @IsNotEmpty()
  readonly token: string;
}
