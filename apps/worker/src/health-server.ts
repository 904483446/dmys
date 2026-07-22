import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

type HealthServer = {
  port: number;
  close: () => Promise<void>;
};

export async function startHealthServer({ port }: { port: number }): Promise<HealthServer> {
  const server = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end('{"status":"ok"}');
      return;
    }

    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not Found');
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen({ host: '0.0.0.0', port }, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address() as AddressInfo;
  return {
    port: address.port,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}
