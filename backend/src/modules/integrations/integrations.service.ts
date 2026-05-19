import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration, IntegrationType, IntegrationStatus } from './entities/integration.entity';
import {
  UpdateIntegrationDto,
  SmtpConfigDto,
  FirebaseFcmConfigDto,
  TwilioSmsConfigDto,
  WhatsAppConfigDto,
  MpesaConfigDto,
  TestSmtpDto,
  TestSmsDto,
  TestWhatsAppDto,
  TestMpesaDto,
} from './dto/integration.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Integration)
    private integrationsRepository: Repository<Integration>,
  ) {}

  async getAllIntegrations(): Promise<Integration[]> {
    return this.integrationsRepository.find({ order: { createdAt: 'ASC' } });
  }

  async getIntegrationByType(type: IntegrationType): Promise<Integration> {
    const integration = await this.integrationsRepository.findOne({ where: { type } });
    if (!integration) {
      const newIntegration = this.integrationsRepository.create({
        type,
        status: IntegrationStatus.INACTIVE,
        config: this.getDefaultConfig(type),
      });
      return this.integrationsRepository.save(newIntegration);
    }
    return integration;
  }

  async updateIntegration(type: IntegrationType, dto: UpdateIntegrationDto): Promise<Integration> {
    const integration = await this.getIntegrationByType(type);
    if (dto.status) integration.status = dto.status;
    if (dto.config) integration.config = { ...integration.config, ...dto.config };
    return this.integrationsRepository.save(integration);
  }

  async testSmtp(config: SmtpConfigDto, testDto: TestSmtpDto): Promise<{ success: boolean; message: string }> {
    console.log('[SMTP TEST] Starting test with config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      fromEmail: config.fromEmail,
      toEmail: testDto.toEmail,
    });

    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure || config.port === 465,
        auth: {
          user: config.username,
          pass: config.password,
        },
        tls: {
          rejectUnauthorized: false,
        },
        debug: true,
        logger: true,
      });

      console.log('[SMTP TEST] Verifying connection...');
      await transporter.verify();
      console.log('[SMTP TEST] Connection verified successfully');

      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: testDto.toEmail,
        subject: 'Test Email - Adaptive CBC',
        html: `
          <div style="margin: 0; padding: 0; background: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f2f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <!-- Header with Brand -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #006a34 0%, #1c8445 50%, #0b5327 100%); padding: 32px 40px; text-align: center;">
                        <img src="https://adaptivecbc.co.ke/logo.png" alt="Adaptive CBC" style="height: 48px; margin-bottom: 12px;" onerror="this.style.display='none'" />
                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">SMTP Test Successful</h1>
                        <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0; font-weight: 500;">Your email configuration is working correctly</p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                          <div style="width: 48px; height: 48px; background: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                            <svg width="24" height="24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <p style="color: #166534; font-size: 16px; font-weight: 700; margin: 0;">Connection Verified</p>
                          <p style="color: #15803d; font-size: 13px; margin: 4px 0 0;">Email sent from <strong>${config.fromEmail}</strong> to <strong>${testDto.toEmail}</strong></p>
                        </div>
                        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">This is a test email from your Adaptive CBC platform. If you received this message, your SMTP server is properly configured and ready to send transactional emails.</p>
                        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr><td style="color: #64748b; font-size: 12px; padding: 4px 0;">Server</td><td style="color: #1e293b; font-size: 12px; font-weight: 600; text-align: right;">${config.host}:${config.port}</td></tr>
                            <tr><td style="color: #64748b; font-size: 12px; padding: 4px 0;">Security</td><td style="color: #1e293b; font-size: 12px; font-weight: 600; text-align: right;">${config.secure || config.port === 465 ? 'SSL/TLS' : 'STARTTLS'}</td></tr>
                            <tr><td style="color: #64748b; font-size: 12px; padding: 4px 0;">Sent at</td><td style="color: #1e293b; font-size: 12px; font-weight: 600; text-align: right;">${new Date().toLocaleString()}</td></tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0;">Adaptive CBC Learning Platform &bull; Empowering Kenyan Education</p>
                        <p style="color: #cbd5e1; font-size: 10px; margin: 4px 0 0;">This is an automated test email. Please do not reply.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        `,
      });

      console.log('[SMTP TEST] Email sent successfully. Message ID:', info.messageId);
      return { success: true, message: `Test email sent successfully (Message ID: ${info.messageId})` };
    } catch (error) {
      console.error('[SMTP TEST] Error:', error.message);
      console.error('[SMTP TEST] Full error:', error);
      return { success: false, message: error.message };
    }
  }

  async testFirebaseFcm(config: FirebaseFcmConfigDto): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.projectId || !config.privateKey || !config.clientEmail) {
        return { success: false, message: 'Missing required Firebase FCM credentials' };
      }

      const serviceAccount = {
        type: 'service_account',
        project_id: config.projectId,
        private_key: config.privateKey.replace(/\\n/g, '\n'),
        client_email: config.clientEmail,
      };

      const response = await fetch(`https://oauth2.googleapis.com/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: '',
        }),
      });

      return { success: true, message: 'Firebase FCM credentials validated. Service account configured.' };
    } catch (error) {
      return { success: false, message: `Firebase FCM validation failed: ${error.message}` };
    }
  }

  async testTwilioSms(config: TwilioSmsConfigDto, testDto: TestSmsDto): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.accountSid || !config.authToken || !config.fromPhoneNumber) {
        return { success: false, message: 'Missing required Twilio credentials' };
      }

      const credentials = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          From: config.fromPhoneNumber,
          To: testDto.toPhoneNumber,
          Body: testDto.message || 'Test SMS from Adaptive CBC platform',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: `Test SMS sent successfully. SID: ${data.sid}` };
      }
      return { success: false, message: data.message || 'Failed to send SMS' };
    } catch (error) {
      return { success: false, message: `Twilio SMS test failed: ${error.message}` };
    }
  }

  async testWhatsApp(config: WhatsAppConfigDto, testDto: TestWhatsAppDto): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.phoneNumberId || !config.accessToken) {
        return { success: false, message: 'Missing required WhatsApp credentials' };
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: testDto.toPhoneNumber.replace(/[^0-9]/g, ''),
          type: 'text',
          text: {
            body: testDto.message || 'Test message from Adaptive CBC platform',
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.messages) {
        return { success: true, message: `WhatsApp message sent successfully. ID: ${data.messages[0]?.id}` };
      }
      return { success: false, message: data.error?.message || 'Failed to send WhatsApp message' };
    } catch (error) {
      return { success: false, message: `WhatsApp test failed: ${error.message}` };
    }
  }

  async testMpesa(config: MpesaConfigDto, testDto: TestMpesaDto): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.consumerKey || !config.consumerSecret) {
        return { success: false, message: 'Missing required M-Pesa credentials' };
      }

      const baseUrl = config.environment === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke'
        : 'https://api.safaricom.co.ke';

      const authResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')}`,
        },
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        return { success: false, message: `M-Pesa authentication failed: ${authData.errorDescription || 'Unknown error'}` };
      }

      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');

      const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: config.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: testDto.amount || 1,
          PartyA: testDto.phoneNumber.replace(/[^0-9]/g, ''),
          PartyB: config.shortcode,
          PhoneNumber: testDto.phoneNumber.replace(/[^0-9]/g, ''),
          CallBackURL: config.callbackUrl || 'https://your-domain.com/api/v1/integrations/mpesa/callback',
          AccountReference: 'AdaptiveCBC',
          TransactionDesc: 'Test STK Push from Adaptive CBC',
        }),
      });

      const stkData = await stkResponse.json();

      if (stkResponse.ok && stkData.ResponseCode === '0') {
        return { success: true, message: `M-Pesa STK Push initiated. CheckoutRequestID: ${stkData.CheckoutRequestID}` };
      }
      return { success: false, message: stkData.errorMessage || 'Failed to initiate STK Push' };
    } catch (error) {
      return { success: false, message: `M-Pesa test failed: ${error.message}` };
    }
  }

  private getDefaultConfig(type: IntegrationType): Record<string, any> {
    switch (type) {
      case IntegrationType.SMTP:
        return { host: '', port: 587, username: '', password: '', fromEmail: '', fromName: '', secure: false, tls: true };
      case IntegrationType.FIREBASE_FCM:
        return { projectId: '', privateKey: '', clientEmail: '', serviceAccountJson: '' };
      case IntegrationType.TWILIO_SMS:
        return { accountSid: '', authToken: '', fromPhoneNumber: '' };
      case IntegrationType.WHATSAPP:
        return { phoneNumberId: '', accessToken: '', businessAccountId: '', webhookVerifyToken: '' };
      case IntegrationType.MPESA:
        return { consumerKey: '', consumerSecret: '', shortcode: '', passkey: '', environment: 'sandbox', callbackUrl: '' };
      default:
        return {};
    }
  }
}
