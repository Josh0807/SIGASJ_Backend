import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { extname } from 'path';
import {
  TRANSPARENCIA_ALLOWED_MIME_TYPES,
  TRANSPARENCIA_MAX_FILE_SIZE_BYTES,
  TRANSPARENCIA_MIME_TO_EXTENSIONS,
  type TransparenciaAllowedMimeType,
} from '../constants/transparencia-file-upload-rules';
import { TipoArchivoTransparencia } from '../enums/tipo-archivo-transparencia.enum';

function hasPdfMagicBytes(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-';
}

function hasJpegMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

function hasPngMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function matchesMagicBytes(
  mimeType: TransparenciaAllowedMimeType,
  buffer: Buffer,
): boolean {
  switch (mimeType) {
    case 'application/pdf':
      return hasPdfMagicBytes(buffer);
    case 'image/jpeg':
      return hasJpegMagicBytes(buffer);
    case 'image/png':
      return hasPngMagicBytes(buffer);
    default:
      return false;
  }
}

function isAllowedMimeType(
  mimeType: string,
): mimeType is TransparenciaAllowedMimeType {
  return (TRANSPARENCIA_ALLOWED_MIME_TYPES as readonly string[]).includes(
    mimeType,
  );
}

/** Resuelve el tipo de archivo persistido a partir de la extensión validada. */
export function resolveTransparenciaFileType(
  file: Express.Multer.File,
): TipoArchivoTransparencia {
  const extension = extname(file.originalname).toLowerCase();

  switch (extension) {
    case '.pdf':
      return TipoArchivoTransparencia.PDF;
    case '.jpg':
      return TipoArchivoTransparencia.JPG;
    case '.jpeg':
      return TipoArchivoTransparencia.JPEG;
    case '.png':
      return TipoArchivoTransparencia.PNG;
    default:
      throw new BadRequestException(
        'La extensión del archivo no coincide con un formato permitido.',
      );
  }
}

/**
 * Valida formato, tamaño, extensión y firma del archivo antes de persistirlo.
 */
export function validateTransparenciaFile(file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('Debe enviar un archivo.');
  }

  if (!file.buffer?.length) {
    throw new BadRequestException('El archivo está vacío o incompleto.');
  }

  if (file.size > TRANSPARENCIA_MAX_FILE_SIZE_BYTES) {
    throw new BadRequestException(
      'El archivo supera el tamaño máximo permitido de 10 MB.',
    );
  }

  if (!isAllowedMimeType(file.mimetype)) {
    throw new BadRequestException(
      'Formato no permitido. Use PDF, JPG, JPEG o PNG.',
    );
  }

  const extension = extname(file.originalname).toLowerCase();
  const allowedExtensions = TRANSPARENCIA_MIME_TO_EXTENSIONS[file.mimetype];

  if (!extension || !allowedExtensions.includes(extension)) {
    throw new BadRequestException(
      'La extensión del archivo no coincide con un formato permitido.',
    );
  }

  if (!matchesMagicBytes(file.mimetype, file.buffer)) {
    throw new BadRequestException(
      'El contenido del archivo no corresponde a un documento o imagen válida.',
    );
  }
}
