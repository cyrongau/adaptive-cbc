import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
import { randomBytes, randomInt } from 'crypto';
import { EmailService } from '../../common/email.service';
import { RelationshipsService } from '../relationships/relationships.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private relationshipsService: RelationshipsService,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
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

    await this.sendOtp(user.email);
    return { isTwoFactorPending: true, tempEmail: user.email };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    if (registerDto.invitationToken && user.role === 'parent') {
      await this.relationshipsService.acceptInvitation(registerDto.invitationToken, user.id);
    }

    // Auto-link parent to any students who have this parent's email in their student register record
    if (user.role === 'parent') {
      await this.relationshipsService.autoLinkParentByEmail(user.id);
    }

    await this.sendOtp(user.email);
    return { isTwoFactorPending: true, tempEmail: user.email };
  }

  async sendOtp(email: string) {
    const code = process.env.NODE_ENV === 'development' ? '123456' : randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const otp = this.otpRepository.create({
      email,
      code,
      expiresAt,
    });
    await this.otpRepository.save(otp);

    const user = await this.usersService.findByEmail(email);
    const firstName = user ? user.firstName : 'User';

    const emailHtml = this.emailService.generateOtpEmail(firstName, code, 5);

    const emailResult = await this.emailService.send({
      to: email,
      subject: 'Your Verification Code - Adaptive CBC',
      html: emailHtml,
    });

    if (!emailResult.success) {
      this.logger.warn(`Failed to send OTP to ${email}: ${emailResult.message}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, code: string) {
    let isValidOtp = false;

    if (process.env.NODE_ENV === 'development' && (code === '123456' || code === '000000')) {
      isValidOtp = true;
    } else {
      const otp = await this.otpRepository.findOne({
        where: { email, code, isUsed: false },
        order: { createdAt: 'DESC' },
      });

      if (!otp) {
        throw new BadRequestException('Invalid OTP');
      }

      if (otp.expiresAt < new Date()) {
        throw new BadRequestException('OTP has expired');
      }

      otp.isUsed = true;
      await this.otpRepository.save(otp);
      isValidOtp = true;
    }

    if (isValidOtp) {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Auto-link parent to any students who have this parent's email in their student register record
      if (user.role === 'parent') {
        await this.relationshipsService.autoLinkParentByEmail(user.id);
      }

      const tokens = await this.generateTokens(user);
      await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
      return { user, tokens };
    }
    
    throw new BadRequestException('Invalid OTP');
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

  async autoLinkParent(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (user.role !== 'parent') {
      return { linked: 0, message: 'User is not a parent' };
    }
    return this.relationshipsService.autoLinkParentByEmail(userId);
  }

  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = email.includes('@')
      ? await this.usersService.findByEmail(email)
      : await this.usersService.findByPhone(email);
    if (!user) {
      return { message: 'If the account exists, a reset code has been sent' };
    }

    const resetToken = randomBytes(3).toString('hex').toUpperCase();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.usersService.setPasswordResetToken(user.id, resetToken, resetExpires);

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

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      secondaryRoles: user.secondaryRoles || [],
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
