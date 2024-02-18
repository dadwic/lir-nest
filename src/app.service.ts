import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private configService: ConfigService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const isLocal = Boolean(this.configService.get<string>('IS_LOCAL'));
    if (!isLocal) chromium.setGraphicsMode = false;

    const browser = await puppeteer.launch({
      headless: true,
      ...(isLocal
        ? { channel: 'chrome', args: puppeteer.defaultArgs() }
        : {
            args: [
              ...chromium.args,
              '--hide-scrollbars',
              '--disable-web-security',
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(
              './bin/chromium-v121.0.0-pack.tar',
            ),
          }),
    });
    const page = await browser.newPage();

    try {
      await page.goto('https://bonbast.com');

      // Get the TRY sell price
      const try1 = await page.$('#try1');
      const text = await (await try1.getProperty('textContent')).jsonValue();
      const price =
        parseInt(text) + parseInt(this.configService.get<string>('FEE'));

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
      this.logger.error('Error while scraping job listings:', error);
    } finally {
      await browser.close();
    }
  }

  getHello(): string {
    return '<a href="https://www.rialir.com/lir/">https://www.rialir.com/lir/</a>';
  }
}
