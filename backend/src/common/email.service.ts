import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration, IntegrationType, IntegrationStatus } from '../modules/integrations/entities/integration.entity';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(Integration)
    private integrationsRepository: Repository<Integration>,
  ) {}

  private async getSmtpConfig(): Promise<any> {
    const integration = await this.integrationsRepository.findOne({
      where: { type: IntegrationType.SMTP },
    });

    if (!integration || integration.status !== IntegrationStatus.ACTIVE) {
      this.logger.warn('SMTP integration is not active or not configured');
      return null;
    }

    return integration.config;
  }

  private async createTransporter() {
    const config = await this.getSmtpConfig();
    if (!config) return null;

    return nodemailer.createTransport({
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
    });
  }

  async send(options: EmailOptions): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = await this.createTransporter();

      if (!transporter) {
        this.logger.warn('SMTP is not configured — falling back to console output');
        this.logger.log(`[DEV EMAIL] To: ${options.to}`);
        this.logger.log(`[DEV EMAIL] Subject: ${options.subject}`);
        this.logger.log(`[DEV EMAIL] HTML: ${options.html.substring(0, 500)}...`);
        return { success: false, message: 'SMTP is not configured' };
      }

      const config = await this.getSmtpConfig();
      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent to ${options.to} (Message ID: ${info.messageId})`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  generatePasswordResetEmail(name: string, resetCode: string, expiryMinutes: number = 60): string {
    return `
      <div style="margin: 0; padding: 0; background: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f2f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header with Brand -->
                <tr>
                  <td style="background: linear-gradient(135deg, #006a34 0%, #1c8445 50%, #0b5327 100%); padding: 40px; text-align: center;">
                    <img src="https://adaptivecbc.co.ke/logo.png" alt="Adaptive CBC" style="height: 56px; margin-bottom: 16px;" onerror="this.style.display='none'" />
                    <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Password Reset</h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; font-weight: 500;">Secure your Adaptive CBC account</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Hello ${name},</p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 32px;">We received a request to reset your password. Use the code below to proceed with resetting your password. This code expires in <strong>${expiryMinutes} minutes</strong>.</p>

                    <!-- Reset Code Box -->
                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
                      <p style="color: #166534; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px;">Your Reset Code</p>
                      <p style="color: #006a34; font-size: 42px; font-weight: 900; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${resetCode}</p>
                    </div>

                    <!-- Security Notice -->
                    <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                      <p style="color: #92400e; font-size: 13px; font-weight: 600; margin: 0 0 8px;">⚠️ Security Notice</p>
                      <p style="color: #78350f; font-size: 13px; line-height: 1.6; margin: 0;">If you did not request a password reset, please ignore this email. Your account remains secure. Do not share this code with anyone.</p>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">If you need help, contact our support team at <a href="mailto:support@adaptivecbc.co.ke" style="color: #006a34; font-weight: 600;">support@adaptivecbc.co.ke</a></p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: #f8fafc; padding: 28px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px; font-weight: 600;">Adaptive CBC Learning Platform</p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">Empowering Kenyan Education &bull; This is an automated email. Please do not reply.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  generateContentRejectionEmail(
    name: string,
    contentTitle: string,
    reasonsText: string,
    additionalComments: string | undefined,
    recommendations: string,
  ): string {
    const reasonsHtml = reasonsText
      .split('\n')
      .map(line => `<li style="margin-bottom: 8px;">${line.replace(/^\d+\.\s*/, '')}</li>`)
      .join('');

    const commentsHtml = additionalComments
      ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 13px; font-weight: 700; margin: 0 0 8px;">Reviewer Comments</p>
          <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0;">${additionalComments}</p>
        </div>
      `
      : '';

    const recommendationsHtml = recommendations
      ? `
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #22c55e; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #166534; font-size: 13px; font-weight: 700; margin: 0 0 12px;">Recommendations for Improvement</p>
          <div style="color: #15803d; font-size: 13px; line-height: 1.7; white-space: pre-line;">${recommendations}</div>
        </div>
      `
      : '';

    return `
      <div style="margin: 0; padding: 0; background: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f2f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 40px; text-align: center;">
                    <img src="https://adaptivecbc.co.ke/logo.png" alt="Adaptive CBC" style="height: 56px; margin-bottom: 16px;" onerror="this.style.display='none'" />
                    <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Content Review Update</h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; font-weight: 500;">Your submission requires revision</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Hello ${name},</p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">Thank you for contributing to the Adaptive CBC Digital Library. After review, your submission <strong>"${contentTitle}"</strong> requires revision before it can be published. This is part of our commitment to maintaining high-quality, curriculum-aligned learning materials for all users.</p>

                    <!-- Content Title -->
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                      <p style="color: #991b1b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Submission</p>
                      <p style="color: #7f1d1d; font-size: 15px; font-weight: 600; margin: 0;">${contentTitle}</p>
                    </div>

                    <!-- Rejection Reasons -->
                    <div style="margin-bottom: 24px;">
                      <p style="color: #334155; font-size: 13px; font-weight: 700; margin: 0 0 12px;">Reasons for Revision</p>
                      <ul style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 20px;">
                        ${reasonsHtml}
                      </ul>
                    </div>

                    ${commentsHtml}
                    ${recommendationsHtml}

                    <!-- Next Steps -->
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                      <p style="color: #1e40af; font-size: 13px; font-weight: 700; margin: 0 0 8px;">Next Steps</p>
                      <p style="color: #1e3a8a; font-size: 13px; line-height: 1.6; margin: 0;">You can revise your content and resubmit it through your Digital Library dashboard. Address each of the points listed above to improve the chances of approval. If you have questions, contact our support team.</p>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">Need help? Contact us at <a href="mailto:support@adaptivecbc.co.ke" style="color: #006a34; font-weight: 600;">support@adaptivecbc.co.ke</a></p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: #f8fafc; padding: 28px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px; font-weight: 600;">Adaptive CBC Learning Platform</p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">Empowering Kenyan Education &bull; This is an automated email. Please do not reply.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}
