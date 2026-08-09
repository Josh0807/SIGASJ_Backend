import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { GaleriaImageUploadService } from './galeria-image-upload.service';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

function createMockFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'imagen',
    originalname: 'foto.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: PNG_BUFFER.length,
    buffer: PNG_BUFFER,
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
    ...overrides,
  };
}

describe('GaleriaImageUploadService', () => {
  let service: GaleriaImageUploadService;
  let tempRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'sigasj-galeria-'));
    originalCwd = process.cwd();
    process.chdir(tempRoot);
    service = new GaleriaImageUploadService();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempRoot, { recursive: true, force: true });
  });

  it('guarda una imagen válida con nombre único y URL pública', async () => {
    const result = await service.saveImage(createMockFile());

    expect(result.imagenUrl).toMatch(
      /^\/uploads\/galeria\/[0-9a-f-]{36}\.png$/,
    );
    expect(result.fileName.endsWith('.png')).toBe(true);

    const stored = await readFile(
      join(tempRoot, 'uploads/galeria', result.fileName),
    );
    expect(stored.equals(PNG_BUFFER)).toBe(true);
  });

  it('rechaza formatos MIME no permitidos', async () => {
    await expect(
      service.saveImage(
        createMockFile({
          mimetype: 'application/pdf',
          originalname: 'documento.pdf',
          buffer: Buffer.from('%PDF-1.4'),
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza archivos que superan el tamaño máximo', async () => {
    await expect(
      service.saveImage(
        createMockFile({
          size: 6 * 1024 * 1024,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('elimina la imagen anterior al reemplazarla', async () => {
    const first = await service.saveImage(createMockFile());
    const second = await service.replaceImage(
      first.imagenUrl,
      createMockFile({ originalname: 'nueva.png' }),
    );

    expect(second.imagenUrl).not.toBe(first.imagenUrl);

    await expect(
      readFile(join(tempRoot, 'uploads/galeria', first.fileName)),
    ).rejects.toThrow();
  });
});
