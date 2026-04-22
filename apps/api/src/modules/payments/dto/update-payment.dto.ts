import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePaymentDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    concept?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    expectedAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    paidAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}
