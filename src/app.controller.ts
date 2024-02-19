import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get('api/cron/:secret')
  async cron(@Param() params, @Res() res) {
    if (params.secret !== this.configService.get<string>('CRON_SECRET')) {
      return res.status(401).end('Unauthorized');
    }
    await this.appService.handleCron();
    return res.send('OK');
  }

  @Get('api/cron')
  async vercel(@Req() req, @Res() res) {
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
