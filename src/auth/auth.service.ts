import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from 'src/mailer/mailer.service';

import { encrypt, compare } from 'src/lib/bcrypt';
import { generateCode } from 'src/lib/speakeasy';

import { SignupDto } from './dto/signup.dto';
import { ConfirmEmailDto } from './dto/confirmEmail.dto';
import { SendEmailDto } from './dto/sendEmail.dto';
import { SigninDto } from './dto/signin.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';

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

  async confirmEmail(confirmEmailDto: ConfirmEmailDto) {
    const { email, code } = confirmEmailDto;

    const match = speakeasy.totp.verify({
      secret: this.configService.get('JWT_SECRET')!,
      digits: 5,
      step: 60 * 15,
      encoding: 'base32',
      token: code,
    });

    if (!match) throw new Error('invalid code');

    const user = await this.prismaService.user.update({
      where: {
        email: email,
      },
      data: {
        state: 'active',
      },
    });

    return {
      message: 'Email confirmé avec success !',
      user: {
        id: user.id,
        lastname: user.lastname,
        firstname: user.firstname,
        username: user.username,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        status: user.state,
      },
    };
  }

  async resendEmail(sendEmailDto: SendEmailDto) {
    const { email } = sendEmailDto;
    const code = generateCode();
    await this.mailService.sendSignupConfirmation(email, code);
    return {
      message: 'Email envoyé avec success',
    };
  }

  async googleAccount(req: Request | any) {
    const { email, firstName, lastName, picture } = req.user;

    const existsUserWithPassword = await this.prismaService.user.findUnique({
      where: {
        email,
        NOT: {
          password: null,
        },
      },
    });

    if (existsUserWithPassword)
      throw new ConflictException("L'email est déjà associé à un compte");

    const existsUserWithoutPassword = await this.prismaService.user.findUnique({
      where: {
        email,
        password: null,
      },
    });

    if (existsUserWithoutPassword) {
      const user = await this.prismaService.user.findFirst({
        where: {
          email: email,
        },
        select: {
          id: true,
          lastname: true,
        },
      });

      const payload = {
        sub: user?.id,
        email: email,
      };
      const token = this.JwtService.sign(payload, {
        expiresIn: '30d',
        secret: this.configService.get('JWT_SECRET'),
      });

      return {
        token,
        message: 'Compte crée avec success',
        email,
      };
    }

    const user = await this.prismaService.user.create({
      data: {
        email: email.toLowerCase(),
        lastname: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        firstname: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        state: 'active',
      },
    });

    const payload = {
      sub: user?.id,
      email: email,
    };
    const token = this.JwtService.sign(payload, {
      expiresIn: '30d',
      secret: this.configService.get('JWT_SECRET'),
    });

    return {
      token,
      message: 'Compte crée avec success',
      email,
    };
  }

  async signin(signinDto: SigninDto) {
    const {email, password} = signinDto;

    const user = await this.prismaService.user.findUnique({
      where: { email, state: 'active' },
    });
    
    if (!user) throw new NotFoundException("Utilisateur non trouvé");
    if (!user.password) throw new ConflictException("Connetez-vous via Google");

    const match = await compare(password, user.password);
    if (!match) throw new UnauthorizedException('Le mot de passe ne correspond pas');
    const payload = {
      sub: user.id,
      email: user.email,
    };
    const token = this.JwtService.sign(payload, {
      expiresIn: '30d',
      secret: this.configService.get('JWT_SECRET'),
    });

    return {
      token,
      message: 'User connected!',
      user: {
        id: user.id,
        lastname: user.lastname,
        firstname: user.firstname,
        email: user.email,
        status: user.state,
      },
    };
  }

  async forgetPassword(sendEmailDto: SendEmailDto) {
    const {email} = sendEmailDto;

    const user = await this.prismaService.user.findUnique({
      where: { email, state: 'active' },
    });

    if (!user) throw new NotFoundException("Utilisateur non trouvé");
    if (!user.password) throw new ConflictException("Connetez-vous via Google");

    const payload = {
      sub: user.id,
      email: user.email,
    };
    const token = this.JwtService.sign(payload, {
      expiresIn: '1d',
      secret: this.configService.get('JWT_SECRET'),
    });
    const url = `http://localhost:3000/new-password?email=${email}&token=${token}`;

    await this.mailService.sendLinkNewPassword(email, url);

    return {
      mesage: 'Email envoyer avec success !'
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, password, token } = resetPasswordDto;

    const user = await this.prismaService.user.findUnique({
      where: { email, state: 'active' },
    });

    if (!user) throw new NotFoundException("Utilisateur non trouvé");
    if (!user.password) throw new ConflictException("Connetez-vous via Google");
    const hashedPassword = await encrypt(password);

    const updateUser = await this.prismaService.user.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      token,
      email: updateUser.email,
      message: 'Mot de passe changé avec succes'
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const { email, password, newPassword } = changePasswordDto;

    const user = await this.prismaService.user.findUnique({
      where: { email, state: 'active' },
    });

    if (!user) throw new NotFoundException("Utilisateur non trouvé");
    if (!user.password) throw new ConflictException("Connetez-vous via Google");
    if (user.password !== password) throw new UnauthorizedException("Mot de passe incorrect");

    const hashedPassword = await encrypt(password);
    const updateUser = await this.prismaService.user.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      email: updateUser.email,
      message: 'Mot de passe changé avec succes'
    }
  }

  async getProfile(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email, state: 'active' },
    });
    if (!user) throw new NotFoundException("Utilisateur non trouvé");

    return {
      message: "Voici vos information",
      user: {
        id: user.id,
        lastname: user.lastname,
        firstname: user.firstname,
        email: user.email,
        username: user.username,
        photo: user.photo,
        birthDay: user.dateOfBirth,
      }
    }
  }
}
