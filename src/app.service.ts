import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    try {
      // Get the TRY sell price
      const response = await fetch(this.configService.get<string>('GH_URL'));
      const data: { p: string } = await response.json();
      const p = parseInt(data.p.replace(',', '')) / 10;
      const price = p + parseInt(this.configService.get<string>('FEE'));
      console.log({ price });

      await fetch(this.configService.get<string>('API_URL'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price }),
      });
    } catch (error) {
      console.log({ error });
    }
  }
}
