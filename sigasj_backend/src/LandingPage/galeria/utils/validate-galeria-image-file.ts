import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { extname } from 'path';
import {
  GALERIA_ALLOWED_MIME_TYPES,
  GALERIA_MAX_IMAGE_SIZE_BYTES,
  GALERIA_MIME_TO_EXTENSIONS,
  type GaleriaAllowedMimeType,
} from '../constants/galeria-image-upload-rules';

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

function hasWebpMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  );
}

function matchesMagicBytes(
  mimeType: GaleriaAllowedMimeType,
  buffer: Buffer,
): boolean {
  switch (mimeType) {
    case 'image/jpeg':
      return hasJpegMagicBytes(buffer);
    case 'image/png':
      return hasPngMagicBytes(buffer);
    case 'image/webp':
      return hasWebpMagicBytes(buffer);
    default:
      return false;
  }
}

function isAllowedMimeType(
  mimeType: string,
): mimeType is GaleriaAllowedMimeType {
  return (GALERIA_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Valida formato, tamaño, extensión y firma del archivo antes de persistirlo.
 */
export function validateGaleriaImageFile(file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('Debe enviar un archivo de imagen.');
  }

  if (!file.buffer?.length) {
    throw new BadRequestException('El archivo de imagen está vacío o incompleto.');
  }

  if (file.size > GALERIA_MAX_IMAGE_SIZE_BYTES) {
    throw new BadRequestException(
      'La imagen supera el tamaño máximo permitido de 5 MB.',
    );
  }

  if (!isAllowedMimeType(file.mimetype)) {
    throw new BadRequestException(
      'Formato no permitido. Use JPG, PNG o WebP.',
    );
  }

  const extension = extname(file.originalname).toLowerCase();
  const allowedExtensions = GALERIA_MIME_TO_EXTENSIONS[file.mimetype];

  if (!extension || !allowedExtensions.includes(extension)) {
    throw new BadRequestException(
      'La extensión del archivo no coincide con un formato permitido.',
    );
  }

  if (!matchesMagicBytes(file.mimetype, file.buffer)) {
    throw new BadRequestException(
      'El contenido del archivo no corresponde a una imagen válida.',
    );
  }
}
