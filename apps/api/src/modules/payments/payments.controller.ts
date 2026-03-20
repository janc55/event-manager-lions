import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Post(':id/voucher')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/vouchers',
        filename: (_req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(
            file.originalname,
          )}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  attachVoucher(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    return this.paymentsService.attachVoucher(id, file?.path ?? '');
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN)
  review(
    @Param('id') id: string,
    @Body() reviewPaymentDto: ReviewPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.review(id, reviewPaymentDto, user);
  }

  @Get(':participantId/account-status')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  accountStatus(@Param('participantId') participantId: string) {
    return this.paymentsService.accountStatus(participantId);
  }
}
