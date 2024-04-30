import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

import { SignupDto } from './dto/signup.dto';
import { ConfirmEmailDto } from './dto/confirmEmail.dto';

import { AuthService } from './auth.service';
import { generateDate } from 'src/lib/functions';
import { SendEmailDto } from './dto/sendEmail.dto';
import { GoogleOAuthGuard } from './guard/google-oauth.guard';
import { SigninDto } from './dto/signin.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';

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
    try {
      const { token } = confirmEmailDto;
      const result = await this.authService.confirmEmail(confirmEmailDto);
      res.cookie('email', result.user.email, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.cookie('auth-cookie', token, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.json(result);
    } catch (error) {
      console.log('Erreur', error);
      res.status(500).send('Il y a eu une erreur');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('resend-email')
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.authService.resendEmail(sendEmailDto);
  }

  @Get('google-auth')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {}

  @Get('callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req: any, @Res() res: any | Response) {
    try {
      const result = await this.authService.googleAccount(req);
      res.cookie('email', result.email, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.cookie('auth-cookie', result.token, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.redirect('http://localhost:3000');
    } catch (error) {
      console.error('Erreur lors de la redirection Google OAuth:', error);
      res
        .status(500)
        .send(
          'Cette adresse email a déjà un compte avec un mot de passe. Veuillez vous connecter avec votre mot de passe. <a href="http://localhost:8000/signin">Se connecter</a>',
        );
    }
  }

  @Post('signin')
  async signin(
    @Body() signinDto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.signin(signinDto);
      res.cookie('email', result.user.email, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.cookie('auth-cookie', result.token, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.json(result);
    } catch (error) {
      console.log('Erreur', error);
      res.status(error.response.statusCode).send(error.message);
    }
  }

  @Post('forget-password')
  forgetPassword(@Body() sendEmailDto: SendEmailDto) {
    return this.authService.forgetPassword(sendEmailDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const result = await this.authService.resetPassword(resetPasswordDto);
      res.cookie('email', result.email, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.cookie('auth-cookie', result.token, {
        expires: generateDate(30),
        httpOnly: true,
        secure: false,
        sameSite: false,
      });
      res.json(result);
    } catch (error) {
      console.log('Erreur', error);
      res.status(error.response.statusCode).send(error.message);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('account')
  async getProfile(@Req() req: Request, @Res() res: Response) {
    try {
      const emailCookie = req.cookies['email'];
      const result = await this.authService.getProfile(emailCookie);
      res.json(result)
    } catch (error) {
      console.log('Erreur', error);
      res.status(500).send(error.message);
    }
  }
}
