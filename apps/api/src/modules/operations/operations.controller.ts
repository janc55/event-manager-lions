import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ScanActivityAttendanceDto } from './dto/scan-activity-attendance.dto';
import { ScanDeliveryDto } from './dto/scan-delivery.dto';
import { ScanGeneralAttendanceDto } from './dto/scan-general-attendance.dto';
import { OperationsService } from './operations.service';

@ApiTags('operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post('scan/general-attendance')
  scanGeneralAttendance(
    @Body() dto: ScanGeneralAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.operationsService.scanGeneralAttendance(dto.qrCode, user);
  }

  @Post('scan/activity-attendance')
  scanActivityAttendance(
    @Body() dto: ScanActivityAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.operationsService.scanActivityAttendance(dto.qrCode, dto.activityId, user);
  }

  @Post('scan/material-delivery')
  scanMaterialDelivery(@Body() dto: ScanDeliveryDto, @CurrentUser() user: JwtPayload) {
    return this.operationsService.scanMaterialDelivery(dto.qrCode, user, dto.notes);
  }

  @Post('scan/snack-delivery')
  scanSnackDelivery(@Body() dto: ScanDeliveryDto, @CurrentUser() user: JwtPayload) {
    return this.operationsService.scanSnackDelivery(dto.qrCode, user, dto.notes);
  }

  @Get('attendance')
  attendanceReport() {
    return this.operationsService.attendanceReport();
  }

  @Get('deliveries')
  deliveryReport() {
    return this.operationsService.deliveryReport();
  }
}
