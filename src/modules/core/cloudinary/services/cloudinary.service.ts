import { Inject, Injectable } from '@nestjs/common';
import { v2 as CloudinaryType } from 'cloudinary';
import { CLOUDINARY } from '../cloudinary.provider';

export interface VideoStreamUrls {
  publicId: string;
  hlsUrl: string;
  mp4Url: string;
}

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinaryType,
  ) {}

  /**
   * Uploads a video buffer to Cloudinary and returns its public id.
   * Pipes the in-memory Multer buffer straight into Cloudinary's upload stream,
   * mirroring the memoryStorage pattern used by the existing FileModule.
   */
  async uploadVideo(
    file: Express.Multer.File,
    folder = 'interviews',
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder },
        (error, result) => {
          if (error || !result) {
            return reject(
              error ?? new Error('Cloudinary upload returned no result'),
            );
          }
          resolve(result.public_id);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Generates optimized streaming URLs for a stored video.
   *
   * Accepts either a raw Cloudinary public id (e.g. `interviews/abc123`) or a
   * full Cloudinary delivery URL (the value persisted in
   * CandidatePerformance.videoUrl). Returns:
   *  - hlsUrl: adaptive-bitrate HLS manifest (`sp_auto` streaming profile) — the
   *    preferred optimized stream for a video player.
   *  - mp4Url: quality-optimized MP4 fallback for browsers without HLS support.
   *
   * If the stored value is a non-Cloudinary absolute URL (e.g. a legacy local
   * recording), it is passed through unchanged for both outputs.
   */
  getStreamUrls(publicIdOrUrl: string): VideoStreamUrls {
    const publicId = this.extractPublicId(publicIdOrUrl);

    if (!publicId) {
      // Not a Cloudinary asset — surface the original URL untouched.
      return {
        publicId: publicIdOrUrl,
        hlsUrl: publicIdOrUrl,
        mp4Url: publicIdOrUrl,
      };
    }

    const hlsUrl = this.cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'm3u8',
      streaming_profile: 'auto',
      secure: true,
    });

    const mp4Url = this.cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'mp4',
      transformation: [{ quality: 'auto' }],
      secure: true,
    });

    return { publicId, hlsUrl, mp4Url };
  }

  /**
   * Resolves a Cloudinary public id from either a bare id or a delivery URL.
   * Returns null when the input is a non-Cloudinary absolute URL so callers can
   * fall back to a pass-through.
   */
  private extractPublicId(value: string): string | null {
    if (!value) return null;

    const isAbsoluteUrl = /^https?:\/\//i.test(value);
    if (!isAbsoluteUrl) {
      // Already a bare public id.
      return value;
    }

    const isCloudinaryUrl = /res\.cloudinary\.com|\/video\/upload\//i.test(
      value,
    );
    if (!isCloudinaryUrl) return null;

    // Strip everything up to and including `/upload/`, an optional transformation
    // segment is left in place only if it precedes the version; we drop the
    // leading version (`v1234567890/`) and the file extension.
    const afterUpload = value.split('/upload/')[1];
    if (!afterUpload) return null;

    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const withoutExtension = withoutVersion.replace(/\.[a-z0-9]+$/i, '');

    return withoutExtension || null;
  }
}
