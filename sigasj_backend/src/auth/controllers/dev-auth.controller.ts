import {
  Controller,
  ForbiddenException,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { RolUsuario } from '../enums/rol-usuario.enum';

class DevTokenDto {
  @ApiProperty({ enum: RolUsuario, default: RolUsuario.ADMINISTRADORA })
  @IsEnum(RolUsuario)
  @IsOptional()
  rol?: RolUsuario;

  @ApiProperty({ required: false, default: 1, description: 'idUsuario (sub del JWT)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  idUsuario?: number;
}

/**
 * Solo desarrollo local: emite un JWT para probar Swagger /admin.
 * No usar en producción.
 */
@ApiTags('Auth (dev)')
@Controller('auth')
export class DevAuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('dev-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEV] Obtener Bearer token de prueba',
    description:
      'Copia el accessToken en Authorize de Swagger (Bearer). Deshabilitado si NODE_ENV=production.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: 'eyJ...',
        tokenType: 'Bearer',
        rol: 'Administradora',
        idUsuario: 1,
      },
    },
  })
  issueDevToken(@Body() body: DevTokenDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Emisión de tokens de desarrollo no disponible en producción.',
      );
    }

    const rol = body.rol ?? RolUsuario.ADMINISTRADORA;
    const idUsuario = body.idUsuario ?? 1;

    const accessToken = this.jwtService.sign({
      sub: idUsuario,
      rol,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      rol,
      idUsuario,
    };
  }
}
