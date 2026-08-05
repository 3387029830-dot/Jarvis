import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import process from 'node:process';
import { setTimeout } from 'node:timers';

const port = 4317;

const server = createServer((request, response) => {
  if (
    request.method !== 'POST' ||
    (request.url !== '/v1/chat/completions' &&
      request.url !== '/v1/audio/transcriptions' &&
      request.url !== '/v1/t2a_v2')
  ) {
    response.writeHead(404).end();
    return;
  }
  if (!request.headers.authorization?.startsWith('Bearer ')) {
    response.writeHead(401, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: { message: 'Missing bearer token.' } }));
    return;
  }
  if (request.url === '/v1/audio/transcriptions') {
    const chunks = [];
    let receivedBytes = 0;
    request.on('data', (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes <= 18 * 1024 * 1024) {
        chunks.push(chunk);
      }
    });
    request.on('end', () => {
      if (receivedBytes > 18 * 1024 * 1024) {
        response.writeHead(413).end();
        return;
      }
      const body = Buffer.concat(chunks).toString('utf8');
      if (!body.includes('name="file"') || !body.includes('name="model"')) {
        response.writeHead(400, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: { message: 'Invalid multipart payload.' } }));
        return;
      }
      if (!body.includes('jarvis-local-fake-stt')) {
        response.writeHead(404, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: { message: 'Unknown local fake STT model.' } }));
        return;
      }
      setTimeout(() => {
        if (!response.destroyed) {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(
            JSON.stringify({
              text: '这是本地假 Provider 返回的确定性中文语音转录。',
              usage: { seconds: 0.8 },
            }),
          );
        }
      }, 220);
    });
    return;
  }

  if (request.url === '/v1/t2a_v2') {
    let ttsBody = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      ttsBody += chunk;
    });
    request.on('end', () => {
      let payload;
      try {
        payload = JSON.parse(ttsBody);
      } catch {
        response.writeHead(400).end();
        return;
      }
      if (
        !['speech-2.8-turbo', 'speech-2.8-hd'].includes(payload.model) ||
        !payload.voice_setting?.voice_id
      ) {
        response.writeHead(422, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            base_resp: { status_code: 1004, status_msg: 'Invalid local fake TTS configuration.' },
          }),
        );
        return;
      }
      setTimeout(() => {
        if (!response.destroyed) {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(
            JSON.stringify({
              base_resp: { status_code: 0, status_msg: 'success' },
              data: { audio: '49443304000000000000', status: 2 },
              extra_info: {
                audio_length: 240,
                audio_size: 10,
                usage_characters: String(payload.text ?? '').length,
              },
              trace_id: 'jarvis-local-fake-tts',
            }),
          );
        }
      }, 160);
    });
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
