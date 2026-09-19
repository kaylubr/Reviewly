import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { requireEnv } from '../env';
import { first } from '../lib/rows';

const TEST_DOMAIN = '@extract-slice.reviewly.test';
const BOUNDARY = '----reviewlytestboundary';

let app: FastifyInstance;
let client: Client;
let cookie: string;

function buildPdf(text: string): Buffer {
  const stream = text ? `BT /F1 24 Tf 72 700 Td (${text}) Tj ET` : '';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  objects.forEach((body, index) => {
    offsets[index] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

function multipart(filename: string, content: Buffer, contentType: string) {
  const head = Buffer.from(
    `--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${BOUNDARY}--\r\n`);

  return {
    payload: Buffer.concat([head, content, tail]),
    headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
  };
}

async function upload(filename: string, content: Buffer, contentType: string) {
  const body = multipart(filename, content, contentType);
  return app.inject({
    method: 'POST',
    url: '/api/extract',
    headers: { ...body.headers, cookie },
    payload: body.payload,
  });
}

beforeAll(async () => {
  app = buildApp({ logger: false });
  await app.ready();
  client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();

  const signUp: LightMyRequestResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up',
    payload: { email: `extractor-${randomUUID()}${TEST_DOMAIN}`, password: 'hunter2' },
  });
  const sessionCookie = first(signUp.cookies);
  cookie = `${sessionCookie.name}=${sessionCookie.value}`;
});

afterAll(async () => {
  await client.query('delete from users where email like $1', [`%${TEST_DOMAIN}`]);
  await client.end();
  await app.close();
});

describe('POST /api/extract', () => {
  it('requires a session', async () => {
    const body = multipart('notes.txt', Buffer.from('hello'), 'text/plain');
    const response = await app.inject({
      method: 'POST',
      url: '/api/extract',
      headers: body.headers,
      payload: body.payload,
    });

    expect(response.statusCode).toBe(401);
  });

  it('extracts text from a txt upload', async () => {
    const content = 'Mitosis produces two cells.';
    const response = await upload('notes.txt', Buffer.from(`  ${content}  `), 'text/plain');

    expect(response.statusCode).toBe(200);
    expect(response.json().text).toBe(content);
    expect(response.json().characters).toBe(content.length);
  });

  it('extracts text from a pdf upload', async () => {
    const response = await upload('notes.pdf', buildPdf('Hello Reviewly Cell Division'), 'application/pdf');

    expect(response.statusCode).toBe(200);
    expect(response.json().text).toBe('Hello Reviewly Cell Division');
  });

  it('rejects a pdf with no extractable text', async () => {
    const response = await upload('scan.pdf', buildPdf(''), 'application/pdf');

    expect(response.statusCode).toBe(422);
    expect(response.json().error).toContain('No readable text');
  });

  it('rejects an empty txt upload', async () => {
    const response = await upload('empty.txt', Buffer.from('   \n  '), 'text/plain');

    expect(response.statusCode).toBe(422);
  });

  it('rejects a file type it cannot read', async () => {
    const response = await upload('essay.docx', Buffer.from('not really a docx'), 'application/msword');

    expect(response.statusCode).toBe(415);
    expect(response.json().error).toBe('Only PDF and TXT files are supported');
  });

  it('rejects a request with no file attached', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/extract',
      headers: { cookie },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects a file over the size limit', async () => {
    const oversize = Buffer.alloc(21 * 1024 * 1024, 'a');
    const response = await upload('huge.txt', oversize, 'text/plain');

    expect(response.statusCode).toBe(413);
    expect(response.json().error).toBe('File is too large. Maximum 20 MB allowed.');
  });
});
