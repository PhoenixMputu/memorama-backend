import { Module } from '@nestjs/common';
import { DomainService } from './domain.service';
import { DomainController } from './domain.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';

@Module({
  imports: [JwtModule.register({
    global: true,
    signOptions: {
      expiresIn: '30d'
    }
  })],
  controllers: [DomainController],
  providers: [DomainService, JwtStrategy],
  exports: [DomainService]
})
export class DomainModule {}
