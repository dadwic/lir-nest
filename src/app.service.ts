import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private configService: ConfigService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      await page.goto('https://bonbast.com');

      // Get the TRY sell price
      const try1 = await page.$('#try1');
      const text = await (await try1.getProperty('textContent')).jsonValue();
      const price =
        parseInt(text) + parseInt(this.configService.get<string>('FEE'));

      await fetch(this.configService.get<string>('API_URL'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price }),
      });
      this.logger.debug('TRY sell price', price);
    } catch (error) {
      this.logger.error('Error while scraping job listings:', error);
    } finally {
      await browser.close();
    }
  }
}
