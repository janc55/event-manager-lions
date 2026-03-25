import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterParticipantDto {
    @ApiProperty()
    @IsString()
    @MaxLength(100)
    firstName: string;

    @ApiProperty()
    @IsString()
    @MaxLength(100)
    lastName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(120)
    badgeName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    documentNumber?: string;

    @ApiProperty()
    @IsString()
    @MaxLength(80)
    country: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(80)
    district?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(120)
    club?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(120)
    roleTitle?: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    @ApiProperty()
    @IsString()
    @MaxLength(60)
    participantType: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    specialRequirements?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    lionNumber?: string;

    // Payment fields
    @ApiProperty({ description: 'The amount paid as per the voucher' })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    paidAmount: number;

    @ApiProperty({ description: 'The total expected registration fee' })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    expectedAmount: number;
}
