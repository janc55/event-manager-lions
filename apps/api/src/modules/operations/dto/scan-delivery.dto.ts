import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ScanDeliveryDto {
  @ApiProperty()
  @IsString()
  qrCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
