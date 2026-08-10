import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Express } from 'express';
import { mkdir, rename, unlink, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import {
  GALERIA_PUBLIC_URL_PREFIX,
  GALERIA_UPLOAD_SUBDIR,
} from '../constants/galeria-image-upload-rules';
import type { GaleriaImageUploadResult } from '../interfaces/galeria-image-upload-result.interface';
import { validateGaleriaImageFile } from '../utils/validate-galeria-image-file';

@Injectable()
export class GaleriaImageUploadService {
  private readonly logger = new Logger(GaleriaImageUploadService.name);

  private readonly uploadDir = join(process.cwd(), GALERIA_UPLOAD_SUBDIR);

  /**
   * Valida y persiste una imagen de galería. Escribe primero en archivo temporal
   * y renombra al final para evitar archivos incompletos si falla la carga.
   */
  async saveImage(
    file: Express.Multer.File,
  ): Promise<GaleriaImageUploadResult> {
    validateGaleriaImageFile(file);

    await mkdir(this.uploadDir, { recursive: true });

    const extension = extname(file.originalname).toLowerCase();
    const fileName = `${randomUUID()}${extension}`;
    const finalPath = join(this.uploadDir, fileName);
    const tempPath = `${finalPath}.tmp`;

    try {
      await writeFile(tempPath, file.buffer);
      await rename(tempPath, finalPath);
    } catch (error) {
      await this.safeUnlink(tempPath);
      this.logger.error('No fue posible guardar la imagen de galería.', error);
      throw new InternalServerErrorException(
        'No fue posible almacenar la imagen. Intente nuevamente.',
      );
    }

    return {
      fileName,
      imagenUrl: `${GALERIA_PUBLIC_URL_PREFIX}/${fileName}`,
    };
  }

  /** Elimina una imagen previamente almacenada a partir de su URL pública. */
  async deleteImage(imagenUrl: string): Promise<void> {
    const fileName = this.extractFileName(imagenUrl);
    if (!fileName) {
      return;
    }

    await this.safeUnlink(join(this.uploadDir, fileName));
  }

  /** Reemplaza una imagen existente por una nueva, eliminando la anterior. */
  async replaceImage(
    currentImagenUrl: string,
    file: Express.Multer.File,
  ): Promise<GaleriaImageUploadResult> {
    const uploaded = await this.saveImage(file);

    try {
      await this.deleteImage(currentImagenUrl);
    } catch (error) {
      await this.safeUnlink(join(this.uploadDir, uploaded.fileName));
      this.logger.error(
        'No fue posible reemplazar la imagen de galería.',
        error,
      );
      throw new InternalServerErrorException(
        'No fue posible reemplazar la imagen. Intente nuevamente.',
      );
    }

    return uploaded;
  }

  private extractFileName(imagenUrl: string): string | null {
    const prefix = `${GALERIA_PUBLIC_URL_PREFIX}/`;
    if (!imagenUrl.startsWith(prefix)) {
      return null;
    }

    const fileName = imagenUrl.slice(prefix.length);
    return fileName.length > 0 ? fileName : null;
  }

  private async safeUnlink(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch {
      // Ignorar si el archivo temporal o destino ya no existe.
    }
  }
}
