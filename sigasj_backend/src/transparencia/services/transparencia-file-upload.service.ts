import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Express } from 'express';
import { randomUUID } from 'crypto';
import { mkdir, rename, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import {
  TRANSPARENCIA_PUBLIC_URL_PREFIX,
  TRANSPARENCIA_UPLOAD_SUBDIR,
} from '../constants/transparencia-file-upload-rules';
import type { TransparenciaFileUploadResult } from '../interfaces/transparencia-file-upload-result.interface';
import {
  resolveTransparenciaFileType,
  validateTransparenciaFile,
} from '../utils/validate-transparencia-file';

@Injectable()
export class TransparenciaFileUploadService {
  private readonly logger = new Logger(TransparenciaFileUploadService.name);

  private readonly uploadDir = join(process.cwd(), TRANSPARENCIA_UPLOAD_SUBDIR);

  /**
   * Valida y persiste un documento o imagen de transparencia.
   * Escribe primero en archivo temporal y renombra al final.
   */
  async saveFile(
    file: Express.Multer.File,
  ): Promise<TransparenciaFileUploadResult> {
    validateTransparenciaFile(file);

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
      this.logger.error(
        'No fue posible guardar el archivo de transparencia.',
        error,
      );
      throw new InternalServerErrorException(
        'No fue posible almacenar el archivo. Intente nuevamente.',
      );
    }

    return {
      fileName,
      archivoUrl: `${TRANSPARENCIA_PUBLIC_URL_PREFIX}/${fileName}`,
      tipoArchivo: resolveTransparenciaFileType(file),
    };
  }

  /** Elimina un archivo previamente almacenado a partir de su URL pública. */
  async deleteFile(archivoUrl: string): Promise<void> {
    const fileName = this.extractFileName(archivoUrl);
    if (!fileName) {
      return;
    }

    await this.safeUnlink(join(this.uploadDir, fileName));
  }

  /** Reemplaza un archivo existente por uno nuevo, eliminando el anterior. */
  async replaceFile(
    currentArchivoUrl: string,
    file: Express.Multer.File,
  ): Promise<TransparenciaFileUploadResult> {
    const uploaded = await this.saveFile(file);

    try {
      await this.deleteFile(currentArchivoUrl);
    } catch (error) {
      await this.safeUnlink(join(this.uploadDir, uploaded.fileName));
      this.logger.error(
        'No fue posible reemplazar el archivo de transparencia.',
        error,
      );
      throw new InternalServerErrorException(
        'No fue posible reemplazar el archivo. Intente nuevamente.',
      );
    }

    return uploaded;
  }

  private extractFileName(archivoUrl: string): string | null {
    const prefix = `${TRANSPARENCIA_PUBLIC_URL_PREFIX}/`;
    if (!archivoUrl.startsWith(prefix)) {
      return null;
    }

    const fileName = archivoUrl.slice(prefix.length);
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
