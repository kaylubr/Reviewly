import { PDFParse } from 'pdf-parse';

const ALLOWED_EXTENSIONS = ['.pdf', '.txt'];

export function uploadExtension(filename: string): string | null {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.find((extension) => lower.endsWith(extension)) ?? null;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText({ pageJoiner: '' });
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  if (uploadExtension(filename) === '.pdf') {
    return extractPdfText(buffer);
  }

  return buffer.toString('utf8');
}
