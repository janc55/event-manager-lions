import { Controller, Get, Query, Param, UseGuards, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import ExcelJS from 'exceljs';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { ReportsService } from './reports.service';
import { ReportFiltersDto } from './dto/report-filters.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('participants')
  @ApiOperation({ summary: 'Obtener reporte de participantes' })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'club', required: false })
  @ApiQuery({ name: 'participantType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  participants(@Query() filters: ReportFiltersDto) {
    return this.reportsService.participants(filters);
  }

  @Get('participants/summary')
  @ApiOperation({ summary: 'Obtener resumen de participantes' })
  participantsSummary(@Query() filters: ReportFiltersDto) {
    return this.reportsService.participantsSummary(filters);
  }

  @Get('participants/export/csv')
  @ApiOperation({ summary: 'Exportar participantes a CSV' })
  @ApiProduces('text/csv')
  async exportParticipantsCsv(@Query() filters: ReportFiltersDto, @Res() res: Response) {
    const csv = await this.reportsService.exportParticipantsCsv(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=participantes.csv');
    res.send(csv);
  }

  @Get('participants/export/excel')
  @ApiOperation({ summary: 'Exportar participantes a Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportParticipantsExcel(@Query() filters: ReportFiltersDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportParticipantsExcel(filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=participantes.xlsx');
    res.send(buffer);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Obtener reporte de pagos' })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'club', required: false })
  @ApiQuery({ name: 'participantType', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  payments(@Query() filters: ReportFiltersDto) {
    return this.reportsService.payments(filters);
  }

  @Get('payments/summary')
  @ApiOperation({ summary: 'Obtener resumen de pagos' })
  paymentsSummary(@Query() filters: ReportFiltersDto) {
    return this.reportsService.paymentsSummary(filters);
  }

  @Get('payments/export/csv')
  @ApiOperation({ summary: 'Exportar pagos a CSV' })
  @ApiProduces('text/csv')
  async exportPaymentsCsv(@Query() filters: ReportFiltersDto, @Res() res: Response) {
    const csv = await this.reportsService.exportPaymentsCsv(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pagos.csv');
    res.send(csv);
  }

  @Get('payments/export/excel')
  @ApiOperation({ summary: 'Exportar pagos a Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportPaymentsExcel(@Query() filters: ReportFiltersDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportPaymentsExcel(filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=pagos.xlsx');
    res.send(buffer);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Obtener reporte de asistencia' })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  attendance(@Query() filters: ReportFiltersDto) {
    return this.reportsService.attendance(filters);
  }

  @Get('attendance/summary')
  @ApiOperation({ summary: 'Obtener resumen de asistencia' })
  attendanceSummary(@Query() filters: ReportFiltersDto) {
    return this.reportsService.attendanceSummary(filters);
  }

  @Get('attendance/export/csv')
  @ApiOperation({ summary: 'Exportar asistencia a CSV' })
  @ApiProduces('text/csv')
  async exportAttendanceCsv(@Query() filters: ReportFiltersDto, @Res() res: Response) {
    const csv = await this.reportsService.exportAttendanceCsv(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=asistencia.csv');
    res.send(csv);
  }

  @Get('attendance/export/excel')
  @ApiOperation({ summary: 'Exportar asistencia a Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportAttendanceExcel(@Query() filters: ReportFiltersDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportAttendanceExcel(filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=asistencia.xlsx');
    res.send(buffer);
  }

  @Get('activities/:id/attendance')
  @ApiOperation({ summary: 'Obtener asistencia de una actividad' })
  activityAttendance(
    @Param('id') id: string,
    @Query() filters: ReportFiltersDto,
  ) {
    return this.reportsService.activityAttendance(id, filters);
  }

  @Get('activities/:id/attendance/export/csv')
  @ApiOperation({ summary: 'Exportar asistencia de actividad a CSV' })
  @ApiProduces('text/csv')
  async exportActivityAttendanceCsv(
    @Param('id') id: string,
    @Query() filters: ReportFiltersDto,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.activityAttendance(id, filters);
    const headers = ['Participante', 'Email', 'Tipo Asistencia', 'Escaneado Por', 'Fecha Hora'];
    const rows = data.items.map(a => [
      `${a.participant.firstName} ${a.participant.lastName}`,
      a.participant.email,
      a.attendanceType,
      a.scannedBy ? a.scannedBy.fullName : '',
      a.scannedAt.toISOString()
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=asistencia_actividad.csv');
    res.send(csv);
  }

  @Get('activities/:id/attendance/export/excel')
  @ApiOperation({ summary: 'Exportar asistencia de actividad a Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportActivityAttendanceExcel(
    @Param('id') id: string,
    @Query() filters: ReportFiltersDto,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.activityAttendance(id, filters);
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EventManager';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Asistencia');
    sheet.columns = [
      { header: 'Participante', key: 'participant', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Tipo Asistencia', key: 'attendanceType', width: 15 },
      { header: 'Escaneado Por', key: 'scannedBy', width: 20 },
      { header: 'Fecha Hora', key: 'scannedAt', width: 20 },
    ];

    sheet.addRows(data.items.map(a => ({
      participant: `${a.participant.firstName} ${a.participant.lastName}`,
      email: a.participant.email,
      attendanceType: a.attendanceType,
      scannedBy: a.scannedBy ? a.scannedBy.fullName : '',
      scannedAt: a.scannedAt,
    })));

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=asistencia_actividad.xlsx');
    res.send(buffer);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Obtener reporte de entregas' })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  deliveries(@Query() filters: ReportFiltersDto) {
    return this.reportsService.deliveries(filters);
  }

  @Get('deliveries/summary')
  @ApiOperation({ summary: 'Obtener resumen de entregas' })
  deliveriesSummary(@Query() filters: ReportFiltersDto) {
    return this.reportsService.deliveriesSummary(filters);
  }

  @Get('deliveries/export/csv')
  @ApiOperation({ summary: 'Exportar entregas a CSV' })
  @ApiProduces('text/csv')
  async exportDeliveriesCsv(@Query() filters: ReportFiltersDto, @Res() res: Response) {
    const csv = await this.reportsService.exportDeliveriesCsv(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=entregas.csv');
    res.send(csv);
  }

  @Get('deliveries/export/excel')
  @ApiOperation({ summary: 'Exportar entregas a Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportDeliveriesExcel(@Query() filters: ReportFiltersDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportDeliveriesExcel(filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=entregas.xlsx');
    res.send(buffer);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener resumen general del evento' })
  async dashboard() {
    const [participants, payments, attendance, deliveries] = await Promise.all([
      this.reportsService.participants({}),
      this.reportsService.payments({}),
      this.reportsService.attendance({}),
      this.reportsService.deliveries({}),
    ]);

    return {
      totalParticipants: participants.total,
      participantsByStatus: participants.summary?.byStatus || {},
      participantsByCountry: participants.summary?.byCountry || {},
      participantsByType: participants.summary?.byType || {},
      totalPayments: payments.total,
      totalExpected: payments.totalExpected,
      totalPaid: payments.totalPaid,
      totalBalance: payments.totalBalance,
      paymentsByStatus: payments.summary?.byStatus || {},
      totalAttendance: attendance.total,
      attendanceByType: attendance.summary?.byType || {},
      attendanceByActivity: attendance.summary?.byActivity || {},
      totalDeliveries: deliveries.total,
      deliveriesByType: deliveries.summary?.byType || {},
    };
  }
}