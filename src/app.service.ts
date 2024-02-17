import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import puppeteer from 'puppeteer';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      await page.goto('https://bonbast.com');

      // Get the TRY sell price
      const try1 = await page.$('#try1');
      const price = await (await try1.getProperty('textContent')).jsonValue();

      this.logger.debug('TRY sell price', parseInt(price));
    } catch (error) {
      this.logger.error('Error while scraping job listings:', error);
    } finally {
      await browser.close();
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
