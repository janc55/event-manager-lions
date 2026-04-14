import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from 'exceljs';
import { Participant } from '../participants/entities/participant.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AttendanceRecord } from '../operations/entities/attendance-record.entity';
import { DeliveryRecord } from '../operations/entities/delivery-record.entity';
import { ReportFiltersDto } from './dto/report-filters.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(DeliveryRecord)
    private readonly deliveryRepository: Repository<DeliveryRecord>,
  ) {}

  private buildParticipantQueryBuilder(filters: ReportFiltersDto) {
    const qb = this.participantsRepository.createQueryBuilder('p');
    
    if (filters.country) {
      qb.andWhere('LOWER(p.country) = LOWER(:country)', { country: filters.country });
    }
    if (filters.district) {
      qb.andWhere('LOWER(p.district) = LOWER(:district)', { district: filters.district });
    }
    if (filters.club) {
      qb.andWhere('LOWER(p.club) LIKE LOWER(:club)', { club: `%${filters.club}%` });
    }
    if (filters.participantType) {
      qb.andWhere('LOWER(p.participantType) = LOWER(:participantType)', { participantType: filters.participantType });
    }
    if (filters.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(p.firstName) LIKE LOWER(:search) OR LOWER(p.lastName) LIKE LOWER(:search) OR LOWER(p.email) LIKE LOWER(:search) OR p.documentNumber LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    if (filters.fromDate) {
      qb.andWhere('p.createdAt >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }
    if (filters.toDate) {
      qb.andWhere('p.createdAt <= :toDate', { toDate: new Date(filters.toDate) });
    }
    
    return qb;
  }

  async participants(filters?: ReportFiltersDto) {
    const qb = this.buildParticipantQueryBuilder(filters || {});
    const items = await qb.getMany();

    const summary = {
      total: items.length,
      byStatus: items.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCountry: items.reduce((acc, p) => {
        acc[p.country] = (acc[p.country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: items.reduce((acc, p) => {
        acc[p.participantType] = (acc[p.participantType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      total: items.length,
      summary,
      items,
    };
  }

  async participantsSummary(filters?: ReportFiltersDto) {
    const qb = this.buildParticipantQueryBuilder(filters || {});
    
    const total = await qb.getCount();
    
    const statusCounts = await qb
      .select('p.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.status')
      .getRawMany();

    const countryCounts = await qb
      .select('p.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.country')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const typeCounts = await qb
      .select('p.participantType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.participantType')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
      byCountry: countryCounts.reduce((acc, item) => {
        acc[item.country] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
      byType: typeCounts.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async payments(filters?: ReportFiltersDto) {
    const qb = this.paymentsRepository.createQueryBuilder('pay')
      .leftJoinAndSelect('pay.participant', 'p');

    if (filters?.country) {
      qb.andWhere('LOWER(p.country) = LOWER(:country)', { country: filters.country });
    }
    if (filters?.district) {
      qb.andWhere('LOWER(p.district) = LOWER(:district)', { district: filters.district });
    }
    if (filters?.club) {
      qb.andWhere('LOWER(p.club) LIKE LOWER(:club)', { club: `%${filters.club}%` });
    }
    if (filters?.participantType) {
      qb.andWhere('LOWER(p.participantType) = LOWER(:participantType)', { participantType: filters.participantType });
    }
    if (filters?.paymentStatus) {
      qb.andWhere('pay.status = :paymentStatus', { paymentStatus: filters.paymentStatus });
    }
    if (filters?.search) {
      qb.andWhere(
        '(LOWER(p.firstName) LIKE LOWER(:search) OR LOWER(p.lastName) LIKE LOWER(:search) OR LOWER(p.email) LIKE LOWER(:search) OR p.documentNumber LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    if (filters?.fromDate) {
      qb.andWhere('pay.createdAt >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }
    if (filters?.toDate) {
      qb.andWhere('pay.createdAt <= :toDate', { toDate: new Date(filters.toDate) });
    }

    const items = await qb.getMany();

    const totalExpected = items.reduce((sum, item) => sum + Number(item.expectedAmount), 0);
    const totalPaid = items.reduce((sum, item) => sum + Number(item.paidAmount), 0);
    const totalBalance = items.reduce((sum, item) => sum + Number(item.balance), 0);

    const summary = {
      total: items.length,
      totalExpected,
      totalPaid,
      totalBalance,
      byStatus: items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      total: items.length,
      totalExpected,
      totalPaid,
      totalBalance,
      summary,
      items,
    };
  }

  async paymentsSummary(filters?: ReportFiltersDto) {
    const qb = this.paymentsRepository.createQueryBuilder('pay')
      .leftJoin('pay.participant', 'p');

    if (filters?.paymentStatus) {
      qb.andWhere('pay.status = :paymentStatus', { paymentStatus: filters.paymentStatus });
    }
    if (filters?.fromDate) {
      qb.andWhere('pay.createdAt >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }
    if (filters?.toDate) {
      qb.andWhere('pay.createdAt <= :toDate', { toDate: new Date(filters.toDate) });
    }

    const total = await qb.getCount();
    
    const totalExpected = await qb.clone().select('SUM(pay.expectedAmount)', 'total').getRawOne();
    const totalPaid = await qb.clone().select('SUM(pay.paidAmount)', 'total').getRawOne();
    const totalBalance = await qb.clone().select('SUM(pay.balance)', 'total').getRawOne();

    const statusCounts = await qb
      .select('pay.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('pay.status')
      .getRawMany();

    return {
      total,
      totalExpected: parseFloat(totalExpected?.total || 0),
      totalPaid: parseFloat(totalPaid?.total || 0),
      totalBalance: parseFloat(totalBalance?.total || 0),
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async attendance(filters?: ReportFiltersDto) {
    const qb = this.attendanceRepository.createQueryBuilder('att')
      .leftJoinAndSelect('att.participant', 'p')
      .leftJoinAndSelect('att.activity', 'act');

    if (filters?.country) {
      qb.andWhere('LOWER(p.country) = LOWER(:country)', { country: filters.country });
    }
    if (filters?.district) {
      qb.andWhere('LOWER(p.district) = LOWER(:district)', { district: filters.district });
    }
    if (filters?.fromDate) {
      qb.andWhere('att.scannedAt >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }
    if (filters?.toDate) {
      qb.andWhere('att.scannedAt <= :toDate', { toDate: new Date(filters.toDate) });
    }

    const items = await qb.getMany();

    const summary = {
      total: items.length,
      byType: items.reduce((acc, item) => {
        acc[item.attendanceType] = (acc[item.attendanceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byActivity: items.reduce((acc, item) => {
        const activityName = item.activity?.name || 'General';
        acc[activityName] = (acc[activityName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      total: items.length,
      summary,
      items,
    };
  }

  async attendanceSummary(filters?: ReportFiltersDto) {
    const qb = this.attendanceRepository.createQueryBuilder('att')
      .leftJoin('att.participant', 'p')
      .leftJoin('att.activity', 'act');

    if (filters?.fromDate) {
      qb.andWhere('att.scannedAt >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }
    if (filters?.toDate) {
      qb.andWhere('att.scannedAt <= :toDate', { toDate: new Date(filters.toDate) });
    }

    const total = await qb.getCount();

    const typeCounts = await qb
      .select('att.attendanceType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('att.attendanceType')
      .getRawMany();

    return {
      total,
      byType: typeCounts.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async activityAttendance(activityId: string, filters?: ReportFiltersDto) {
    const qb = this.attendanceRepository.createQueryBuilder('att')
      .leftJoinAndSelect('att.participant', 'p')
      .where('att.activityId = :activityId', { activityId });

    if (filters?.country) {
      qb.andWhere('LOWER(p.country) = LOWER(:country)', { country: filters.country });
    }
    if (filters?.district) {
      qb.andWhere('LOWER(p.district) = LOWER(:district)', { district: filters.district });
    }
    if (filters?.search) {
      qb.andWhere(
        '(LOWER(p.firstName) LIKE LOWER(:search) OR LOWER(p.lastName) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    const items = await qb.getMany();

    return {
      total: items.length,
      items,
    };
  }

  async deliveries(filters?: ReportFiltersDto) {
    const qb = this.deliveryRepository.createQueryBuilder('d')
      .leftJoinAndSelect('d.participant', 'p');

    if (filters?.country) {
      qb.andWhere('LOWER(p.country) = LOWER(:country)', { country: filters.country });
    }
    if (filters?.district) {
      qb.andWhere('LOWER(p.district) = LOWER(:district)', { district: filters.district });
    }
    if (filters?.fromDate) {
      qb.andWhere('d.deliveredAt >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }
    if (filters?.toDate) {
      qb.andWhere('d.deliveredAt <= :toDate', { toDate: new Date(filters.toDate) });
    }

    const items = await qb.getMany();

    const summary = {
      total: items.length,
      byType: items.reduce((acc, item) => {
        acc[item.deliveryType] = (acc[item.deliveryType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      total: items.length,
      summary,
      items,
    };
  }

  async deliveriesSummary(filters?: ReportFiltersDto) {
    const qb = this.deliveryRepository.createQueryBuilder('d')
      .leftJoin('d.participant', 'p');

    if (filters?.fromDate) {
      qb.andWhere('d.deliveredAt >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }
    if (filters?.toDate) {
      qb.andWhere('d.deliveredAt <= :toDate', { toDate: new Date(filters.toDate) });
    }

    const total = await qb.getCount();

    const typeCounts = await qb
      .select('d.deliveryType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('d.deliveryType')
      .getRawMany();

    return {
      total,
      byType: typeCounts.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async exportParticipantsCsv(filters?: ReportFiltersDto): Promise<string> {
    const data = await this.participants(filters);
    const headers = [
      'Codigo',
      'Nombre',
      'Apellido',
      'Nombre en Credencial',
      'Documento',
      'Pais',
      'Distrito',
      'Club',
      'Email',
      'Telefono',
      'Tipo',
      'Estado',
      'Numero Leon',
      'Fecha Registro'
    ];

    const rows = data.items.map(p => [
      p.registrationCode,
      p.firstName,
      p.lastName,
      p.badgeName || '',
      p.documentNumber || '',
      p.country,
      p.district || '',
      p.club || '',
      p.email,
      p.phone || '',
      p.participantType,
      p.status,
      p.lionNumber || '',
      p.createdAt.toISOString()
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  async exportPaymentsCsv(filters?: ReportFiltersDto): Promise<string> {
    const data = await this.payments(filters);
    const headers = [
      'Participante',
      'Email',
      'Concepto',
      'Monto Esperado',
      'Monto Pagado',
      'Saldo',
      'Estado',
      'Fecha Revision',
      'Revisado Por',
      'Notas'
    ];

    const rows = data.items.map(p => [
      `${p.participant.firstName} ${p.participant.lastName}`,
      p.participant.email,
      p.concept,
      String(p.expectedAmount),
      String(p.paidAmount),
      String(p.balance),
      p.status,
      p.reviewedAt ? p.reviewedAt.toISOString() : '',
      p.reviewedBy ? p.reviewedBy.fullName : '',
      p.notes || ''
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  async exportAttendanceCsv(filters?: ReportFiltersDto): Promise<string> {
    const data = await this.attendance(filters);
    const headers = [
      'Participante',
      'Email',
      'Tipo Asistencia',
      'Actividad',
      'Escaneado Por',
      'Fecha Hora'
    ];

    const rows = data.items.map(a => [
      `${a.participant.firstName} ${a.participant.lastName}`,
      a.participant.email,
      a.attendanceType,
      a.activity?.name || 'General',
      a.scannedBy ? a.scannedBy.fullName : '',
      a.scannedAt.toISOString()
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  async exportDeliveriesCsv(filters?: ReportFiltersDto): Promise<string> {
    const data = await this.deliveries(filters);
    const headers = [
      'Participante',
      'Email',
      'Tipo Entrega',
      'Escaneado Por',
      'Fecha Hora',
      'Notas'
    ];

    const rows = data.items.map(d => [
      `${d.participant.firstName} ${d.participant.lastName}`,
      d.participant.email,
      d.deliveryType,
      d.scannedBy ? d.scannedBy.fullName : '',
      d.deliveredAt.toISOString(),
      d.notes || ''
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  private arrayToCsv(rows: string[][]): string {
    return rows.map(row => 
      row.map(cell => {
        const escaped = String(cell).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      }).join(',')
    ).join('\n');
  }

  async exportParticipantsExcel(filters?: ReportFiltersDto): Promise<Buffer> {
    const data = await this.participants(filters);
    
    const workbook = new Workbook();
    workbook.creator = 'EventManager';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Participantes');

    sheet.columns = [
      { header: 'Codigo', key: 'registrationCode', width: 15 },
      { header: 'Nombre', key: 'firstName', width: 15 },
      { header: 'Apellido', key: 'lastName', width: 15 },
      { header: 'Nombre en Credencial', key: 'badgeName', width: 20 },
      { header: 'Documento', key: 'documentNumber', width: 15 },
      { header: 'Pais', key: 'country', width: 15 },
      { header: 'Distrito', key: 'district', width: 15 },
      { header: 'Club', key: 'club', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Telefono', key: 'phone', width: 15 },
      { header: 'Tipo', key: 'participantType', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Numero Leon', key: 'lionNumber', width: 15 },
      { header: 'Fecha Registro', key: 'createdAt', width: 20 },
    ];

    sheet.addRows(data.items.map(p => ({
      registrationCode: p.registrationCode,
      firstName: p.firstName,
      lastName: p.lastName,
      badgeName: p.badgeName || '',
      documentNumber: p.documentNumber || '',
      country: p.country,
      district: p.district || '',
      club: p.club || '',
      email: p.email,
      phone: p.phone || '',
      participantType: p.participantType,
      status: p.status,
      lionNumber: p.lionNumber || '',
      createdAt: p.createdAt,
    })));

    this.formatExcelHeader(sheet);

    if (data.summary) {
      const summarySheet = workbook.addWorksheet('Resumen');
      summarySheet.addRow(['Reporte de Participantes']).font = { size: 14, bold: true };
      summarySheet.addRow(['Fecha Generado', new Date().toLocaleString()]);
      summarySheet.addRow([]);
      summarySheet.addRow(['Total Participantes', data.total]);

      summarySheet.addRow([]).font = { bold: true };
      summarySheet.addRow(['Por Estado']);
      Object.entries(data.summary.byStatus || {}).forEach(([status, count]) => {
        summarySheet.addRow([status, count]);
      });

      summarySheet.addRow([]).font = { bold: true };
      summarySheet.addRow(['Por Tipo']);
      Object.entries(data.summary.byType || {}).forEach(([type, count]) => {
        summarySheet.addRow([type, count]);
      });

      summarySheet.addRow([]).font = { bold: true };
      summarySheet.addRow(['Por Pais']);
      Object.entries(data.summary.byCountry || {}).forEach(([country, count]) => {
        summarySheet.addRow([country, count]);
      });

      summarySheet.columns.forEach(col => col.width = 25);
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportPaymentsExcel(filters?: ReportFiltersDto): Promise<Buffer> {
    const data = await this.payments(filters);
    
    const workbook = new Workbook();
    workbook.creator = 'EventManager';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Pagos');

    sheet.columns = [
      { header: 'Participante', key: 'participant', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Concepto', key: 'concept', width: 20 },
      { header: 'Monto Esperado', key: 'expectedAmount', width: 15 },
      { header: 'Monto Pagado', key: 'paidAmount', width: 15 },
      { header: 'Saldo', key: 'balance', width: 15 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Fecha Revision', key: 'reviewedAt', width: 18 },
      { header: 'Revisado Por', key: 'reviewedBy', width: 20 },
      { header: 'Notas', key: 'notes', width: 30 },
    ];

    sheet.addRows(data.items.map(p => ({
      participant: `${p.participant.firstName} ${p.participant.lastName}`,
      email: p.participant.email,
      concept: p.concept,
      expectedAmount: p.expectedAmount,
      paidAmount: p.paidAmount,
      balance: p.balance,
      status: p.status,
      reviewedAt: p.reviewedAt || '',
      reviewedBy: p.reviewedBy ? p.reviewedBy.fullName : '',
      notes: p.notes || '',
    })));

    this.formatExcelHeader(sheet);

    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.addRow(['Reporte de Pagos']).font = { size: 14, bold: true };
    summarySheet.addRow(['Fecha Generado', new Date().toLocaleString()]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Registros', data.total]);
    summarySheet.addRow(['Total Esperado', data.totalExpected]);
    summarySheet.addRow(['Total Pagado', data.totalPaid]);
    summarySheet.addRow(['Total Saldo', data.totalBalance]);

    summarySheet.addRow([]).font = { bold: true };
    summarySheet.addRow(['Por Estado']);
    Object.entries(data.summary.byStatus || {}).forEach(([status, count]) => {
      summarySheet.addRow([status, count]);
    });

    summarySheet.columns.forEach(col => col.width = 25);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportAttendanceExcel(filters?: ReportFiltersDto): Promise<Buffer> {
    const data = await this.attendance(filters);
    
    const workbook = new Workbook();
    workbook.creator = 'EventManager';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Asistencia');

    sheet.columns = [
      { header: 'Participante', key: 'participant', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Tipo Asistencia', key: 'attendanceType', width: 15 },
      { header: 'Actividad', key: 'activity', width: 20 },
      { header: 'Escaneado Por', key: 'scannedBy', width: 20 },
      { header: 'Fecha Hora', key: 'scannedAt', width: 20 },
    ];

    sheet.addRows(data.items.map(a => ({
      participant: `${a.participant.firstName} ${a.participant.lastName}`,
      email: a.participant.email,
      attendanceType: a.attendanceType,
      activity: a.activity?.name || 'General',
      scannedBy: a.scannedBy ? a.scannedBy.fullName : '',
      scannedAt: a.scannedAt,
    })));

    this.formatExcelHeader(sheet);

    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.addRow(['Reporte de Asistencia']).font = { size: 14, bold: true };
    summarySheet.addRow(['Fecha Generado', new Date().toLocaleString()]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Asistencias', data.total]);

    summarySheet.addRow([]).font = { bold: true };
    summarySheet.addRow(['Por Tipo']);
    Object.entries(data.summary.byType || {}).forEach(([type, count]) => {
      summarySheet.addRow([type, count]);
    });

    summarySheet.addRow([]).font = { bold: true };
    summarySheet.addRow(['Por Actividad']);
    Object.entries(data.summary.byActivity || {}).forEach(([activity, count]) => {
      summarySheet.addRow([activity, count]);
    });

    summarySheet.columns.forEach(col => col.width = 25);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportDeliveriesExcel(filters?: ReportFiltersDto): Promise<Buffer> {
    const data = await this.deliveries(filters);
    
    const workbook = new Workbook();
    workbook.creator = 'EventManager';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Entregas');

    sheet.columns = [
      { header: 'Participante', key: 'participant', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Tipo Entrega', key: 'deliveryType', width: 15 },
      { header: 'Escaneado Por', key: 'scannedBy', width: 20 },
      { header: 'Fecha Hora', key: 'deliveredAt', width: 20 },
      { header: 'Notas', key: 'notes', width: 30 },
    ];

    sheet.addRows(data.items.map(d => ({
      participant: `${d.participant.firstName} ${d.participant.lastName}`,
      email: d.participant.email,
      deliveryType: d.deliveryType,
      scannedBy: d.scannedBy ? d.scannedBy.fullName : '',
      deliveredAt: d.deliveredAt,
      notes: d.notes || '',
    })));

    this.formatExcelHeader(sheet);

    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.addRow(['Reporte de Entregas']).font = { size: 14, bold: true };
    summarySheet.addRow(['Fecha Generado', new Date().toLocaleString()]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Entregas', data.total]);

    summarySheet.addRow([]).font = { bold: true };
    summarySheet.addRow(['Por Tipo']);
    Object.entries(data.summary.byType || {}).forEach(([type, count]) => {
      summarySheet.addRow([type, count]);
    });

    summarySheet.columns.forEach(col => col.width = 25);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private formatExcelHeader(sheet: any) {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
    sheet.getRow(1).alignment = { horizontal: 'center' };
  }
}