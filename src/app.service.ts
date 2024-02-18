import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/core';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

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
