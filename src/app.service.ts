import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import chromium from 'chrome-aws-lambda';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private configService: ConfigService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const browser = await chromium.puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--hide-scrollbars',
        '--disable-web-security',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--disable-extensions'],
    });
    const page = await browser.newPage();

    try {
      await page.goto('https://bonbast.com', { waitUntil: 'networkidle0' });

      // Get the TRY sell price
      const try1 = await page.$('#try1');
      const content = await try1.getProperty('textContent');
      const text: string = await content.jsonValue();
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
