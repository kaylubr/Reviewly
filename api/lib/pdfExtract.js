import { createRequire } from 'module'
import { logger } from './logger.js'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY

/**
 * Download a file from InsForge storage and extract its text content.
 * Supports PDF and plain-text files.
 * Returns extracted text, or null if extraction failed.
 */
export async function extractFileContent(fileUrl) {
  if (!fileUrl) return null

  logger.info('pdfExtract', `Downloading file: ${fileUrl.substring(0, 80)}`)

  let res
  try {
    res = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${INSFORGE_API_KEY}` }
    })
  } catch (err) {
    logger.error('pdfExtract', `Fetch failed: ${err.message}`)
    return null
  }

  if (!res.ok) {
    logger.warn('pdfExtract', `Fetch returned ${res.status} for file URL`)
    return null
  }

  const contentType = res.headers.get('content-type') || ''
  const buffer = Buffer.from(await res.arrayBuffer())
  logger.debug('pdfExtract', `Downloaded ${buffer.length} bytes (type: ${contentType})`)

  // Plain text file
  if (contentType.includes('text/plain') || fileUrl.toLowerCase().endsWith('.txt')) {
    const text = buffer.toString('utf-8').trim()
    logger.info('pdfExtract', `Extracted ${text.length} chars from text file`)
    return text || null
  }

  // PDF file (default for InsForge storage which returns binary/octet-stream)
  try {
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    const text = result.text?.trim()
    logger.info('pdfExtract', `Extracted ${text?.length ?? 0} chars from PDF (${result.total} pages)`)
    return text || null
  } catch (err) {
    logger.error('pdfExtract', `PDF parse failed: ${err.message}`)
    return null
  }
}
