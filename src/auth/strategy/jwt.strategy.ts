import { Request as RequestType } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { PrismaService } from 'src/prisma/prisma.service';

type Payload = {
  sub: number;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: RequestType) => {
          if (req && req.cookies) return req.cookies['auth-cookie'];
          return null;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET', { infer: true }),
      ignoreExpiration: false,
    });
  }

  async validate(payload: Payload) {
    const user = await this.prismaService.user.findUnique({
      where: { email: payload.email },
    });
    if (!user) throw new UnauthorizedException('Unauthorized !');
    Reflect.deleteProperty(user, 'password');
    return user;
  }
}