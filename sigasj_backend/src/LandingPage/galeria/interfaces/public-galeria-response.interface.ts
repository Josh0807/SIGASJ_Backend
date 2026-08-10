import type { PublicGaleriaFotoDto } from '../dto/public-galeria-foto.dto';

export type PublicGaleriaResponse = {
  data: PublicGaleriaFotoDto[];
  total: number;
};
