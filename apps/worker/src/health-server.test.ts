import { request } from 'node:http';

import { describe, expect, it } from 'vitest';

import { startHealthServer } from './health-server.js';

function get(port: number, path: string) {
  return new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
    const current = request({ host: '127.0.0.1', port, path }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({ statusCode: response.statusCode ?? 0, body });
      });
    });
    current.on('error', reject);
    current.end();
  });
}

describe('startHealthServer', () => {
  it('在 health 路径返回运行状态', async () => {
    const health = await startHealthServer({ port: 0 });

    try {
      await expect(get(health.port, '/health')).resolves.toEqual({
        statusCode: 200,
        body: '{"status":"ok"}',
      });
    } finally {
      await health.close();
    }
  });

  it('拒绝未知路径', async () => {
    const health = await startHealthServer({ port: 0 });

    try {
      await expect(get(health.port, '/not-found')).resolves.toEqual({
        statusCode: 404,
        body: 'Not Found',
      });
    } finally {
      await health.close();
    }
  });
});
