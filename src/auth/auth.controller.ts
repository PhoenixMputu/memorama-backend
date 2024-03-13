import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

import { SignupDto } from './dto/signup.dto';
import { ConfirmEmailDto } from './dto/confirmEmail.dto';

import { AuthService } from './auth.service';
import { generateDate } from 'src/lib/functions';
import { SendEmailDto } from './dto/sendEmail.dto';

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
    @Req() req: Request
  ) {
    try {
      const { token } = confirmEmailDto;
      const result = await this.authService.confirmEmail(confirmEmailDto);

      res.cookie('auth-cookie', token, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.json(result);
    } catch (error) {
      console.log("Erreur",error);
      res.status(500).send(error.message);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('resend-email')
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.authService.resendEmail(sendEmailDto)
  }
}
