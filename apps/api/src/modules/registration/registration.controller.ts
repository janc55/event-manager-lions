import {
    Body,
    Controller,
    Post,
    UploadedFiles,
    UseInterceptors,
    UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { RegisterParticipantDto } from './dto/register-participant.dto';
import { RegistrationService } from './registration.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Registration')
@Controller('registration')
@UseGuards(ApiKeyGuard)
@ApiHeader({
    name: 'x-api-key',
    description: 'API Key for registration access',
    required: true,
})
export class RegistrationController {
    constructor(private readonly registrationService: RegistrationService) { }

    @Post('register')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'photo', maxCount: 1 },
                { name: 'voucher', maxCount: 1 },
            ],
            {
                storage: diskStorage({
                    destination: (req, file, cb) => {
                        const folder = file.fieldname === 'photo' ? 'photos' : 'vouchers';
                        const dest = join(__dirname, '..', '..', '..', 'uploads', folder);
                        cb(null, dest);
                    },
                    filename: (req, file, cb) => {
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                        const ext = extname(file.originalname);
                        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
                    },
                }),
            },
        ),
    )
    async register(
        @Body() registerDto: RegisterParticipantDto,
        @UploadedFiles()
        files: { photo?: Express.Multer.File[]; voucher?: Express.Multer.File[] },
    ) {
        return this.registrationService.register(
            registerDto,
            files.photo?.[0],
            files.voucher?.[0],
        );
    }
}
