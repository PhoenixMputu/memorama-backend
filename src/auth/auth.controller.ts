import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { SignupDto } from './dto/signup.dto';
import { ConfirmEmailDto } from './dto/confirmEmail.dto';

import { AuthService } from './auth.service';
import { generateDate } from 'src/lib/functions';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('confirm-email')
  async confirmEmail(
    @Body() confirmEmailDto: ConfirmEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = confirmEmailDto;
    const result = await this.authService.confirmEmail(confirmEmailDto);

    res.cookie('auth-cookie', token, {
      expires: generateDate(30),
      httpOnly: true,
      secure: false,
    });
    res.json(result);
  }
}
