import { createServer } from 'node:http';
import process from 'node:process';
import { setTimeout } from 'node:timers';

const port = 4317;

const server = createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/v1/chat/completions') {
    response.writeHead(404).end();
    return;
  }
  if (!request.headers.authorization?.startsWith('Bearer ')) {
    response.writeHead(401, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: { message: 'Missing bearer token.' } }));
    return;
  }
  let body = '';
  request.setEncoding('utf8');
  request.on('data', (chunk) => {
    body += chunk;
  });
  request.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (payload.model !== 'jarvis-local-fake') {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: { message: 'Unknown local fake model.' } }));
      return;
    }
    response.writeHead(200, {
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'content-type': 'text/event-stream',
    });
    const chunks = [
      '这是本地测试 Provider 返回的',
      '确定性中文流式回答。',
      '它验证真实网络、SSE 与取消路径，不代表第三方模型质量。',
    ];
    chunks.forEach((content, index) => {
      setTimeout(
        () => {
          if (!response.destroyed) {
            response.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
          }
        },
        180 * (index + 1),
      );
    });
    setTimeout(
      () => {
        if (!response.destroyed) {
          response.write(
            `data: ${JSON.stringify({
              choices: [],
              usage: { completion_tokens: 31, prompt_tokens: 47, total_tokens: 78 },
            })}\n\n`,
          );
          response.end('data: [DONE]\n\n');
        }
      },
      180 * (chunks.length + 1),
    );
  });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(
    `Jarvis local fake Provider: http://localhost:${port}/v1\nModel: jarvis-local-fake\n`,
  );
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
