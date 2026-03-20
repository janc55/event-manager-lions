import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepository: Repository<AuditLogEntity>,
  ) {}

  create(data: Partial<AuditLogEntity>) {
    const log = this.auditRepository.create(data);
    return this.auditRepository.save(log);
  }

  findAll() {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
