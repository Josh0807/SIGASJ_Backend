import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { TipoArchivoTransparencia } from '../enums/tipo-archivo-transparencia.enum';
import { TransparenciaFileUploadService } from './transparencia-file-upload.service';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const PDF_BUFFER = Buffer.from('%PDF-1.4\n');

function createMockFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'archivo',
    originalname: 'informe.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: PDF_BUFFER.length,
    buffer: PDF_BUFFER,
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
    ...overrides,
  };
}

describe('TransparenciaFileUploadService', () => {
  let service: TransparenciaFileUploadService;
  let tempRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'sigasj-transparencia-'));
    originalCwd = process.cwd();
    process.chdir(tempRoot);
    service = new TransparenciaFileUploadService();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempRoot, { recursive: true, force: true });
  });

  it('guarda un PDF válido con nombre único y URL pública', async () => {
    const result = await service.saveFile(createMockFile());

    expect(result.archivoUrl).toMatch(
      /^\/uploads\/transparencia\/[0-9a-f-]{36}\.pdf$/,
    );
    expect(result.tipoArchivo).toBe(TipoArchivoTransparencia.PDF);

    const stored = await readFile(
      join(tempRoot, 'uploads/transparencia', result.fileName),
    );
    expect(stored.equals(PDF_BUFFER)).toBe(true);
  });

  it('guarda una imagen PNG válida', async () => {
    const result = await service.saveFile(
      createMockFile({
        originalname: 'certificado.png',
        mimetype: 'image/png',
        buffer: PNG_BUFFER,
        size: PNG_BUFFER.length,
      }),
    );

    expect(result.tipoArchivo).toBe(TipoArchivoTransparencia.PNG);
    expect(result.archivoUrl.endsWith('.png')).toBe(true);
  });

  it('rechaza formatos MIME no permitidos', async () => {
    await expect(
      service.saveFile(
        createMockFile({
          mimetype: 'image/webp',
          originalname: 'foto.webp',
          buffer: Buffer.from('RIFF'),
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza archivos que superan el tamaño máximo', async () => {
    await expect(
      service.saveFile(
        createMockFile({
          size: 11 * 1024 * 1024,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('elimina el archivo anterior al reemplazarlo', async () => {
    const first = await service.saveFile(createMockFile());
    const second = await service.replaceFile(
      first.archivoUrl,
      createMockFile({ originalname: 'nuevo.pdf' }),
    );

    expect(second.archivoUrl).not.toBe(first.archivoUrl);

    await expect(
      readFile(join(tempRoot, 'uploads/transparencia', first.fileName)),
    ).rejects.toThrow();
  });
});
