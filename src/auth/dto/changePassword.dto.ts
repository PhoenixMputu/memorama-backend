import { IsEmail, IsNotEmpty } from 'class-validator';
export class ChangePasswordDto {
  @IsEmail()
  readonly email: string;
  @IsNotEmpty()
  readonly password: string;
  @IsNotEmpty()
  readonly newPassword: string;
}