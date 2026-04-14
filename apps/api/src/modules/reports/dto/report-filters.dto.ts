import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportFiltersDto {
  @ApiPropertyOptional({ description: 'Filtrar por país' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Filtrar por distrito' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Filtrar por club' })
  @IsOptional()
  @IsString()
  club?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de participante' })
  @IsOptional()
  @IsString()
  participantType?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado (participant status)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado de pago' })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional({ description: 'Fecha desde' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Término de búsqueda' })
  @IsOptional()
  @IsString()
  search?: string;
}