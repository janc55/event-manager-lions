import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('participants')
  participants() {
    return this.reportsService.participants();
  }

  @Get('payments')
  payments() {
    return this.reportsService.payments();
  }

  @Get('attendance')
  attendance() {
    return this.reportsService.attendance();
  }

  @Get('activities/:id/attendance')
  activityAttendance(@Param('id') id: string) {
    return this.reportsService.activityAttendance(id);
  }

  @Get('deliveries')
  deliveries() {
    return this.reportsService.deliveries();
  }
}
