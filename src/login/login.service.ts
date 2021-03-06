import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../user/user.service';
import { IUser } from '../user/interfaces/user.interface';
import { JwtPayload } from './interfaces/jwt.payload';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LoginService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private async validate(loginDto: LoginDto): Promise<IUser> {
    return await this.userService.findByEmail(loginDto.email);
  }

  public async login(
    loginDto: LoginDto,
  ): Promise<any | { status: number; message: string }> {
    return this.validate(loginDto).then(userData => {
      if (!userData) {
        throw new UnauthorizedException();
      }

      const passwordIsValid = bcrypt.compareSync(
        loginDto.password,
        userData.password,
      );

      if (!passwordIsValid == true) {
        return {
          message: 'Authentication failed. Wrong password',
          status: 400,
        };
      }

      const payload = {
        email: userData.email,
        id: userData.id,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        expiresIn: 3600,
        accessToken: accessToken,
        user: payload,
        status: 200,
      };
    });
  }

  public async validateUserByJwt(payload: JwtPayload) {
    // This will be used when the user has already logged in and has a JWT
    const user = await this.userService.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException();
    }
    return this.createJwtPayload(user);
  }

  protected createJwtPayload(user) {
    const data: JwtPayload = {
      email: user.email,
    };

    const jwt = this.jwtService.sign(data);

    return {
      expiresIn: 3600,
      token: jwt,
    };
  }
}