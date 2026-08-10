import {
  ArgumentMetadata,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';

describe('ParseIntPipe — parámetro id', () => {
  const pipe = new ParseIntPipe();
  const metadata: ArgumentMetadata = {
    type: 'param',
    data: 'id',
    metatype: Number,
  };

  it('acepta id numérico válido', async () => {
    await expect(pipe.transform('12', metadata)).resolves.toBe(12);
  });

  it('rechaza id con formato inválido', async () => {
    await expect(pipe.transform('abc', metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(pipe.transform('1.5', metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(pipe.transform('', metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
