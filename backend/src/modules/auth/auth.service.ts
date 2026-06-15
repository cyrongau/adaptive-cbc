import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { SetupTotpDto, VerifyTotpDto, ParentLoginDto, InstitutionLoginDto } from './dto/totp.dto';
import { User } from '../users/entities/user.entity';
import { randomBytes, randomInt } from 'crypto';
import { EmailService } from '../../common/email.service';
import { RelationshipsService } from '../relationships/relationships.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';
import * as speakeasy from 'speakeasy';

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
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

  async setupTotp(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `Adaptive CBC (${userId.slice(0, 8)})`,
      length: 20,
    });

    await this.usersRepository.update(userId, { totpSecret: secret.base32 });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  async verifyTotp(userId: string, token: string) {
    const user = await this.usersService.findOne(userId);
    if (!user.totpSecret) {
      throw new BadRequestException('TOTP not set up. Call setup first.');
    }

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      throw new BadRequestException('Invalid TOTP token');
    }

    await this.usersRepository.update(userId, { isTotpEnabled: true });
    return { message: 'TOTP enabled successfully' };
  }

  async parentLogin(dto: ParentLoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== 'parent' && user.role !== 'teacher' && user.role !== 'tutor') {
      throw new UnauthorizedException('This login is for parents and staff only');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException(`Account is suspended. Reason: ${user.suspensionReason || 'Contact support'}`);
    }

    await this.sendOtp(user.email);
    return { isTwoFactorPending: true, tempEmail: user.email, authLevel: 'LEVEL_2_PARENT' };
  }

  async institutionLogin(dto: InstitutionLoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== 'institution_admin' && user.role !== 'super_admin') {
      throw new UnauthorizedException('This login is for institution administrators only');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException(`Account is suspended. Reason: ${user.suspensionReason || 'Contact support'}`);
    }

    if (user.isTotpEnabled && user.totpSecret) {
      if (!dto.totpToken) {
        return { requiresTotp: true, tempEmail: user.email };
      }

      const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: dto.totpToken,
      });

      if (!verified) {
        throw new UnauthorizedException('Invalid TOTP code');
      }

      const tokens = await this.generateTokensWithLevel(user, 'LEVEL_3_INSTITUTION');
      await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
      return { tokens, user: this.sanitizeUser(user) };
    }

    await this.sendOtp(user.email);
    return { isTwoFactorPending: true, tempEmail: user.email, authLevel: 'LEVEL_3_INSTITUTION' };
  }

  async getParentProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    const children = await this.relationshipsService.getChildrenForParent(userId);
    const childProfiles = await Promise.all(
      children.map(async (r) => {
        const childUser = await this.usersService.findOne(r.userId);
        const child = await this.usersRepository.findOne({ where: { id: r.userId } });
        return {
          id: child?.id,
          firstName: child?.firstName,
          lastName: child?.lastName,
          grade: child?.grade,
          status: r.verificationStatus,
        };
      }),
    );

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isTotpEnabled: user.isTotpEnabled,
      children: childProfiles,
    };
  }

  async updateParentProfile(userId: string, updates: { firstName?: string; lastName?: string; phone?: string }) {
    const user = await this.usersService.findOne(userId);
    if (updates.firstName) user.firstName = updates.firstName;
    if (updates.lastName) user.lastName = updates.lastName;
    if (updates.phone) user.phone = updates.phone;
    return this.usersRepository.save(user);
  }

  async generateTokensWithLevel(user: User, authLevel: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      secondaryRoles: user.secondaryRoles || [],
      authLevel,
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

  private sanitizeUser(user: User) {
    return {
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
      isTotpEnabled: user.isTotpEnabled,
    };
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
