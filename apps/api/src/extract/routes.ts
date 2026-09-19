import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/guard';
import { extractText, uploadExtension } from './document-text';

export async function extractRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/extract', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: 'No file was uploaded' });
    }

    const file = await request.file();

    if (!file) {
      return reply.code(400).send({ error: 'No file was uploaded' });
    }

    if (!uploadExtension(file.filename)) {
      return reply.code(415).send({ error: 'Only PDF and TXT files are supported' });
    }

    const buffer = await file.toBuffer();

    let extracted: string;

    try {
      extracted = (await extractText(buffer, file.filename)).trim();
    } catch {
      return reply.code(422).send({ error: 'That file could not be read as a document' });
    }

    if (!extracted) {
      return reply.code(422).send({
        error: 'No readable text was found in that file. A scanned document has no text to extract.',
      });
    }

    return { text: extracted, characters: extracted.length };
  });
}
