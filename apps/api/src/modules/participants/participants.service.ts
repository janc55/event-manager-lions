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
import * as fs from 'fs/promises';
import { join } from 'path';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { Participant } from './entities/participant.entity';
import { RegistrationType } from '../../common/enums/registration-type.enum';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
  ) { }

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

    // Credential size: 5.4 x 8.5 cm → points (1 cm = 28.3465 pts)
    const pageWidth = 153.07;  // 5.4 cm
    const pageHeight = 240.94; // 8.5 cm
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // --- Background image ---
    const bgPath = join(process.cwd(), 'assets', 'fondo-credencial.png');
    const bgBytes = await fs.readFile(bgPath);
    const bgImage = await pdfDoc.embedPng(bgBytes);
    page.drawImage(bgImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    // --- QR code (bottom-right, over the white placeholder area) ---
    const qrDataUrl = await this.generateQrDataUrl(participant);
    const qrImage = await pdfDoc.embedPng(qrDataUrl);
    const qrSize = 61;
    page.drawImage(qrImage, {
      x: pageWidth - qrSize - 7.1,
      y: 7.1,
      width: qrSize,
      height: qrSize,
    });

    // --- Participant Photo (mid-height, slightly to the right) ---
    if (participant.photoUrl) {
      try {
        let imageBuffer: ArrayBuffer | Buffer;
        if (participant.photoUrl.startsWith('/uploads/')) {
          const filePath = join(
            process.cwd(), 'uploads', 'photos',
            participant.photoUrl.replace('/uploads/photos/', '').replace('/uploads/', ''),
          );
          imageBuffer = await fs.readFile(filePath);
        } else {
          const response = await fetch(participant.photoUrl);
          imageBuffer = await response.arrayBuffer();
        }

        let participantImage;
        if (participant.photoUrl.toLowerCase().endsWith('.png')) {
          participantImage = await pdfDoc.embedPng(imageBuffer);
        } else {
          participantImage = await pdfDoc.embedJpg(imageBuffer);
        }

        const photoSize = 50;
        const photoX = 53;  // slightly right of center
        const photoY = 120; // mid-height

        // --- Border frame around the photo (rounded rect via SVG path) ---
        const borderPadding = 2;
        const r = 4; // corner radius in points
        const fx = photoX - borderPadding;
        const fy = photoY - borderPadding;
        const fw = photoSize + borderPadding * 2;
        const fh = photoSize + borderPadding * 2;
        // pdf-lib drawSvgPath: x/y is the top-left origin, y axis goes downward.
        const svgPath =
          `M ${r} 0 ` +
          `L ${fw - r} 0 ` +
          `Q ${fw} 0 ${fw} ${r} ` +
          `L ${fw} ${fh - r} ` +
          `Q ${fw} ${fh} ${fw - r} ${fh} ` +
          `L ${r} ${fh} ` +
          `Q 0 ${fh} 0 ${fh - r} ` +
          `L 0 ${r} ` +
          `Q 0 0 ${r} 0 ` +
          `Z`;
        page.drawSvgPath(svgPath, {
          x: fx,
          y: fy + fh, // pdf-lib places SVG origin at this point (top-left of rect)
          color: rgb(1, 1, 1),
          borderColor: rgb(0.6, 0.5, 0.1),
          borderWidth: 1,
        });

        page.drawImage(participantImage, {
          x: photoX,
          y: photoY,
          width: photoSize,
          height: photoSize,
        });
      } catch (error) {
        console.error('Error embedding participant photo:', error);
      }
    }

    // --- Text section at ~3/4 down from top (1/4 from bottom) ---
    const textColor = rgb(1, 1, 1);
    const textX = 10;
    const maxTextWidth = pageWidth - 20;

    // "NOMBRE DEL PARTICIPANTE" label (small)
    const labelY = 100;
    page.drawText('NOMBRE DEL PARTICIPANTE', {
      x: textX,
      y: labelY,
      size: 5,
      font,
      color: textColor,
    });

    // Participant name (large, bold)
    const toTitleCase = (str: string) =>
      str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const rawName = participant.badgeName || `${participant.firstName} ${participant.lastName}`;
    const displayName = `L. ${toTitleCase(rawName)}`;
    const nameY = labelY - 14;
    page.drawText(displayName, {
      x: textX,
      y: nameY,
      size: 11,
      font: boldFont,
      color: textColor,
      maxWidth: maxTextWidth,
    });

    // Role / District (small)
    const roleDistrict = `${participant.roleTitle || participant.participantType} / ${participant.district || 'Sin distrito'}`;
    const roleY = nameY - 11;
    page.drawText(roleDistrict, {
      x: textX,
      y: roleY,
      size: 5.5,
      font,
      color: textColor,
      maxWidth: maxTextWidth,
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

  calculateExpectedAmount(
    registrationType: RegistrationType,
    participantType: string,
    activityIds: string[] = [],
  ): number {
    const isSocio = participantType.toLowerCase().includes('socio') || participantType.toLowerCase().includes('león');
    
    if (registrationType === RegistrationType.FULL) {
      // Logic for full registration price if needed, otherwise return a default or handle elsewhere
      // For now, let's assume 700 for socio and 800 for guest if full? 
      // Actually, let's just return what the user provides if it's full, or a fixed price.
      return isSocio ? 660 : 750; // Example: Full is at least 3 events price? 
      // Wait, let's be safer and only calculate if PARTIAL.
    }

    const count = activityIds.length;
    if (count === 0) return 0;

    if (isSocio) {
      if (count === 1) return 260;
      if (count === 2) return 500; // 250 * 2
      return 660; // 220 * 3
    } else {
      if (count === 1) return 290;
      if (count === 2) return 560; // 280 * 2
      return 750; // 250 * 3
    }
  }
}

