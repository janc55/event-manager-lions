import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ParticipantsService } from '../participants/participants.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly participantsService: ParticipantsService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    await this.participantsService.findOne(createPaymentDto.participantId);

    const paidAmount = createPaymentDto.paidAmount ?? 0;
    const payment = this.paymentsRepository.create({
      participantId: createPaymentDto.participantId,
      concept: createPaymentDto.concept,
      expectedAmount: createPaymentDto.expectedAmount,
      paidAmount,
      balance: Number(createPaymentDto.expectedAmount) - Number(paidAmount),
      status: this.resolveStatus(createPaymentDto.expectedAmount, paidAmount),
      notes: createPaymentDto.notes,
    });

    return this.paymentsRepository.save(payment);
  }

  async attachVoucher(id: string, filePath: string): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.voucherFile = filePath;
    return this.paymentsRepository.save(payment);
  }

  async review(
    id: string,
    reviewPaymentDto: ReviewPaymentDto,
    user: JwtPayload,
  ): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = reviewPaymentDto.status;
    payment.notes = reviewPaymentDto.notes ?? payment.notes;
    payment.reviewedById = user.sub;
    payment.reviewedAt = new Date();

    if (reviewPaymentDto.status === PaymentStatus.WAIVED) {
      payment.balance = 0;
    }

    return this.paymentsRepository.save(payment);
  }

  async accountStatus(participantId: string) {
    await this.participantsService.findOne(participantId);
    const payments = await this.paymentsRepository.find({
      where: { participantId },
      order: { createdAt: 'DESC' },
    });

    const expectedAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.expectedAmount),
      0,
    );
    const paidAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.paidAmount),
      0,
    );
    const balance = payments.reduce((sum, payment) => sum + Number(payment.balance), 0);

    return {
      participantId,
      expectedAmount,
      paidAmount,
      balance,
      status:
        balance <= 0
          ? PaymentStatus.PAID
          : paidAmount > 0
            ? PaymentStatus.PARTIAL
            : PaymentStatus.PENDING,
      payments,
    };
  }

  findAll(): Promise<Payment[]> {
    return this.paymentsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Pago no encontrado.');
    }

    return payment;
  }

  private resolveStatus(expectedAmount: number, paidAmount: number): PaymentStatus {
    if (paidAmount <= 0) {
      return PaymentStatus.PENDING;
    }

    if (paidAmount < expectedAmount) {
      return PaymentStatus.PARTIAL;
    }

    return PaymentStatus.PAID;
  }
}
