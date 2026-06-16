import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { SetupTotpDto, VerifyTotpDto, ParentLoginDto, InstitutionLoginDto, UpdateParentProfileDto } from './dto/totp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
      ...(isProd ? {} : { domain: 'localhost' }), // Share cookie across ports in dev so WebSocket on :3002 can read it
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('social-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Firebase Social Auth (Google, Apple, Phone)' })
  async socialLogin(
    @Body('idToken') idToken: string,
    @Body('role') role: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!idToken) {
      throw new UnauthorizedException('No idToken provided');
    }
    const { user, tokens } = await this.authService.socialLogin(idToken, role);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP' })
  async sendOtp(@Body('email') email: string) {
    return this.authService.sendOtp(email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  async verifyOtp(
    @Body('email') email: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.verifyOtp(email, code);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    
    return {
      accessToken: tokens.accessToken,
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
      }
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    const token = req.cookies?.refreshToken || body?.refreshToken || '';
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const tokens = await this.authService.refreshTokens({ refreshToken: token });
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { accessToken: tokens.accessToken, message: 'Tokens refreshed' };
  }

  @Post('link-parent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-link parent to children via student register email match' })
  async linkParent(@Request() req) {
    const result = await this.authService.autoLinkParent(req.user.id);
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('accessToken', { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' });
    res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' });
    
    return this.authService.logout(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('totp/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate TOTP secret for authenticator app' })
  async setupTotp(@Request() req) {
    return this.authService.setupTotp(req.user.id);
  }

  @Post('totp/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP token and enable TOTP' })
  async verifyTotp(@Request() req, @Body() dto: VerifyTotpDto) {
    return this.authService.verifyTotp(req.user.id, dto.token);
  }

  @Post('parent-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parent/staff login with email and password' })
  async parentLogin(@Body() dto: ParentLoginDto) {
    return this.authService.parentLogin(dto);
  }

  @Post('institution-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Institution admin login with email, password, and optional TOTP' })
  async institutionLogin(@Body() dto: InstitutionLoginDto) {
    return this.authService.institutionLogin(dto);
  }

  @Get('parent/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get parent profile with linked children' })
  async getParentProfile(@Request() req) {
    return this.authService.getParentProfile(req.user.id);
  }

  @Patch('parent/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update parent profile' })
  async updateParentProfile(@Request() req, @Body() dto: UpdateParentProfileDto) {
    return this.authService.updateParentProfile(req.user.id, dto);
  }
}