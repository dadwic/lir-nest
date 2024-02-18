import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private configService: ConfigService) {
    console.log(configService.get<string>('FEE'));
    console.log(configService.get<string>('GH_URL'));
    this.logger.log(configService.get<string>('API_URL'));
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      // Get the TRY sell price
      const response = await fetch(this.configService.get<string>('GH_URL'));
      const data: { p: string } = await response.json();
      const p = parseInt(data.p.replace(',', '')) / 10;
      const price = p + parseInt(this.configService.get<string>('FEE'));

      if (price > 1500) {
        await fetch(this.configService.get<string>('API_URL'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price }),
        });
      }
      this.logger.debug('TRY sell price', price);
    } catch (error) {
      this.logger.error('Error while fetching TRY price', error);
    }
  }
}
