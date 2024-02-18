import { Controller, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get('cron')
  async cron(@Req() req, @Res() res) {
    if (
      req.headers['authorization'] !==
      `Bearer ${this.configService.get<string>('CRON_SECRET')}`
    ) {
      return res.status(401).end('Unauthorized');
    }
    await this.appService.handleCron();
    return res.send('OK');
  }
}
