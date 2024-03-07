import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from 'src/mailer/mailer.service';

import { encrypt } from 'src/lib/bcrypt';
import { generateCode } from 'src/lib/speakeasy';

import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailerService,
    private readonly JwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async signup(signupDto: SignupDto) {
    const { email, password, lastname, firstname } = signupDto;

    const existsUserActive = await this.prismaService.user.findUnique({
      where: { email, state: 'active' },
    });

    if (existsUserActive)
      throw new ConflictException("L'email est déjà associé à un compte");

    const existsUserNotActive = await this.prismaService.user.findUnique({
      where: { email, state: 'pending' },
    });

    if (existsUserNotActive) {
      throw new ConflictException(
        "L'email est associé à un compte non confirmé. Vérifiez votre email",
      );
    }

    const hashedPassword = await encrypt(password);
    const user = await this.prismaService.user.create({
      data: {
        email: email.toLowerCase(),
        lastname: lastname.charAt(0).toUpperCase() + lastname.slice(1),
        password: hashedPassword,
        firstname: firstname.charAt(0).toUpperCase() + firstname.slice(1),
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
    };
    
    const token = this.JwtService.sign(payload, {
      expiresIn: '30d',
      secret: this.configService.get('JWT_SECRET'),
    });

    const code = generateCode();
    await this.mailService.sendSignupConfirmation(email, code);

    return {
      token,
      message: 'Email de confirmation envoyé avec success !',
      user: {
        id: user.id,
        lastname: user.lastname,
        firstname: user.firstname,
        email: user.email,
        status: user.state,
      },
    };
  }
}
