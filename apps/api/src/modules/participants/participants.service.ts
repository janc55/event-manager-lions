import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { Repository } from 'typeorm';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { Participant } from './entities/participant.entity';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
  ) {}

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    const email = createParticipantDto.email.toLowerCase();
    const duplicate = await this.participantsRepository.findOne({
      where: [{ email }, { documentNumber: createParticipantDto.documentNumber ?? '' }],
    });

    if (
      duplicate &&
      (duplicate.email === email ||
        (!!createParticipantDto.documentNumber &&
          duplicate.documentNumber === createParticipantDto.documentNumber))
    ) {
      throw new ConflictException('Participante duplicado detectado.');
    }

    const participant = this.participantsRepository.create({
      ...createParticipantDto,
      email,
      registrationCode: this.generateRegistrationCode(),
      qrCode: this.generateQrToken(),
    });

    return this.participantsRepository.save(participant);
  }

  findAll(): Promise<Participant[]> {
    return this.participantsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({ where: { id } });
    if (!participant) {
      throw new NotFoundException('Participante no encontrado.');
    }

    return participant;
  }

  async findByQrCode(qrCode: string): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      where: { qrCode },
    });

    if (!participant) {
      throw new NotFoundException('QR no encontrado.');
    }

    return participant;
  }

  async update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const participant = await this.findOne(id);

    Object.assign(participant, {
      ...updateParticipantDto,
      email: updateParticipantDto.email?.toLowerCase() ?? participant.email,
    });

    return this.participantsRepository.save(participant);
  }

  async regenerateQr(id: string): Promise<Participant> {
    const participant = await this.findOne(id);
    participant.qrCode = this.generateQrToken();
    return this.participantsRepository.save(participant);
  }

  async generateQrDataUrl(participant: Participant): Promise<string> {
    return QRCode.toDataURL(participant.qrCode);
  }

  async generateBadgePdf(id: string): Promise<Buffer> {
    const participant = await this.findOne(id);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([243, 396]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const qrDataUrl = await this.generateQrDataUrl(participant);
    const qrImage = await pdfDoc.embedPng(qrDataUrl);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: 243,
      height: 396,
      color: rgb(0.97, 0.96, 0.92),
    });

    page.drawText('75 Convencion Nacional', {
      x: 24,
      y: 360,
      size: 16,
      font: boldFont,
      color: rgb(0.12, 0.21, 0.34),
    });

    page.drawText('Club de Leones Bolivia', {
      x: 24,
      y: 340,
      size: 11,
      font,
      color: rgb(0.28, 0.28, 0.28),
    });

    page.drawText(participant.badgeName || `${participant.firstName} ${participant.lastName}`, {
      x: 24,
      y: 300,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: 195,
    });

    page.drawText(`Club: ${participant.club || 'No especificado'}`, {
      x: 24,
      y: 270,
      size: 10,
      font,
    });
    page.drawText(`Distrito: ${participant.district || 'No especificado'}`, {
      x: 24,
      y: 254,
      size: 10,
      font,
    });
    page.drawText(`Pais: ${participant.country}`, {
      x: 24,
      y: 238,
      size: 10,
      font,
    });
    page.drawText(`Rol: ${participant.roleTitle || participant.participantType}`, {
      x: 24,
      y: 222,
      size: 10,
      font,
      maxWidth: 160,
    });

    page.drawImage(qrImage, {
      x: 57,
      y: 55,
      width: 128,
      height: 128,
    });

    page.drawText(participant.registrationCode, {
      x: 58,
      y: 35,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    return Buffer.from(await pdfDoc.save());
  }

  private generateRegistrationCode(): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `LCB-${year}-${random}`;
  }

  private generateQrToken(): string {
    return `qr_${randomUUID()}`;
  }
}

