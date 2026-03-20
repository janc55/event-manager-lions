import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ScanActivityAttendanceDto {
  @ApiProperty()
  @IsString()
  qrCode: string;

  @ApiProperty()
  @IsUUID()
  activityId: string;
}
