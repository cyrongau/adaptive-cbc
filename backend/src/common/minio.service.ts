import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucket: string;
  private endpoint: string;
  private port: number;
  private publicEndpoint: string; // externally reachable URL for presigned links

  constructor(private configService: ConfigService) {
    this.endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    this.port = parseInt(this.configService.get<string>('MINIO_PORT', '9003'));
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'adaptive-cbc-files');
    this.publicEndpoint = this.configService.get<string>('MINIO_PUBLIC_ENDPOINT', `${this.endpoint}:${this.port}`);

    this.client = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.configService.get<string>('MINIO_SECURE', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin123'),
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created MinIO bucket: ${this.bucket}`);
      }
    } catch (err) {
      this.logger.warn(`MinIO init warning: ${err.message}`);
    }
  }

  /**
   * Upload a buffer/stream to MinIO.
   * @param objectName  Full path within the bucket, e.g. "products/uuid-timestamp.jpg"
   * @param data        Buffer or Readable stream
   * @param size        Byte length (-1 for unknown stream size)
   * @param contentType MIME type
   * @returns The objectName (key) stored in MinIO
   */
  async uploadObject(
    objectName: string,
    data: Buffer | Readable,
    size: number,
    contentType: string,
  ): Promise<string> {
    await this.client.putObject(this.bucket, objectName, data, size, { 'Content-Type': contentType });
    return objectName;
  }

  /**
   * Upload a Multer file buffer directly.
   * Returns the public URL (presigned or permanent depending on bucket policy).
   */
  async uploadFile(
    folder: string,
    filename: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ objectName: string; url: string }> {
    const objectName = `${folder}/${filename}`;
    await this.uploadObject(objectName, buffer, buffer.length, mimetype);
    const url = await this.getPresignedUrl(objectName, 24 * 365); // 1-year link
    return { objectName, url };
  }

  /**
   * Generate a presigned GET URL, with internal→external host rewriting.
   * @param objectName Key in the bucket
   * @param expiryHours How long the link is valid
   */
  async getPresignedUrl(objectName: string, expiryHours = 24): Promise<string> {
    const expirySecs = expiryHours * 3600;
    let url = await this.client.presignedGetObject(this.bucket, objectName, expirySecs);

    // Rewrite internal docker hostname to the externally-reachable public endpoint
    const internalHost = `${this.endpoint}:${this.port}`;
    if (this.publicEndpoint && url.includes(internalHost)) {
      url = url.replace(internalHost, this.publicEndpoint);
    }

    return url;
  }

  async removeObject(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectName);
  }
}
