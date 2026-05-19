import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
import { randomBytes } from 'crypto';
import { EmailService } from '../../common/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await this.usersService.validatePassword(user, password))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException(`Account is suspended. Reason: ${user.suspensionReason || 'Contact support'}`);
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        secondaryRoles: user.secondaryRoles,
        onboardingStatus: user.onboardingStatus,
        kycStatus: user.kycStatus,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        institutionId: user.institutionId,
        avatar: user.avatar,
        grade: user.grade,
        phone: user.phone,
        term: user.term,
        stream: user.stream,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    const tokens = await this.generateTokens(user);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        secondaryRoles: user.secondaryRoles,
        onboardingStatus: user.onboardingStatus,
        kycStatus: user.kycStatus,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        institutionId: user.institutionId,
        avatar: user.avatar,
        grade: user.grade,
        phone: user.phone,
        term: user.term,
        stream: user.stream,
      },
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('JWT_SECRET', 'cbc_jwt_secret_key_2024_adaptive'),
      });

      const user = await this.usersService.findOne(payload.sub);
      const isValid = await this.usersService.validateRefreshToken(user, refreshTokenDto.refreshToken);

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      return { message: 'If the email exists, a reset code has been sent' };
    }

    const resetToken = randomBytes(3).toString('hex').toUpperCase();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    const emailHtml = this.emailService.generatePasswordResetEmail(
      user.firstName,
      resetToken,
      60,
    );

    const emailResult = await this.emailService.send({
      to: user.email,
      subject: 'Reset Your Password - Adaptive CBC',
      html: emailHtml,
    });

    if (!emailResult.success) {
      this.logger.warn(`Password reset email failed for ${user.email}: ${emailResult.message}`);
      if (process.env.NODE_ENV !== 'development') {
        throw new BadRequestException('Failed to send reset code. Please try again or contact support.');
      }
    }

    return {
      message: 'If the email exists, a reset code has been sent',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.updatePassword(user.id, resetPasswordDto.newPassword);
    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1d'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}