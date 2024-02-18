import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/core';

function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleUpdate() {
    await fetch(this.configService.get<string>('API_URL'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ price: getRandomInt(1850, 1900) }),
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    try {
      // GitHub REST API
      const octokit = new Octokit({
        auth: this.configService.get<string>('GH_TOKEN'),
      });
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner: this.configService.get<string>('GH_OWNER'),
          repo: this.configService.get<string>('GH_REPO'),
          path: this.configService.get<string>('GH_PATH'),
          mediaType: {
            format: 'raw',
          },
        },
      );

      // Get the TRY sell price
      const data = JSON.parse(response.data.toString());
      const p = parseInt(data.p.replace(',', '')) / 10;
      const price = p + parseInt(this.configService.get<string>('FEE'));

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
