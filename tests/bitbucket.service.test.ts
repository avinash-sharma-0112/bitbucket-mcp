import assert from 'node:assert/strict';
import test from 'node:test';
import type { AxiosInstance } from 'axios';
import { BitbucketService } from '../src/services/bitbucket.service.js';

test('listPullRequestComments returns comment author and creation time', async () => {
  const getCalls: string[] = [];
  const client = {
    get: async (url: string) => {
      getCalls.push(url);
      return {
        data: {
          values: [
            {
              id: 101,
              content: { raw: 'Looks good.' },
              user: { display_name: 'Ada Lovelace' },
              created_on: '2026-05-12T10:05:00.000+00:00',
            },
            {
              id: 102,
              content: { raw: 'Please rename this variable.' },
              user: { display_name: 'Grace Hopper' },
              created_on: '2026-05-12T10:07:00.000+00:00',
              inline: { path: 'src/server.ts', from: 12, to: 14 },
            },
          ],
        },
      };
    },
  } as unknown as AxiosInstance;

  const service = new BitbucketService(client);

  const comments = await service.listPullRequestComments('acme', 'backend-api', 42);

  assert.deepEqual(comments, [
    {
      id: 101,
      content: 'Looks good.',
      author: 'Ada Lovelace',
      created_on: '2026-05-12T10:05:00.000+00:00',
    },
    {
      id: 102,
      content: 'Please rename this variable.',
      author: 'Grace Hopper',
      created_on: '2026-05-12T10:07:00.000+00:00',
      inline: { path: 'src/server.ts', from: 12, to: 14 },
    },
  ]);
  assert.deepEqual(getCalls, ['/repositories/acme/backend-api/pullrequests/42/comments']);
});
