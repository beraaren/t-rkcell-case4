import { Controller, Get, Param } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Get('me/certificates')
  getMyCertificates(@CurrentUser() user: any) {
    return this.certificatesService.getMyCertificates(user.id);
  }

  @Public()
  @Get('certificates/:number/verify')
  verify(@Param('number') number: string) {
    return this.certificatesService.verify(number);
  }
}
