const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY

export async function extractFileContent(fileUrl) {
  if (!fileUrl) return null

  let res
  try {
    res = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${INSFORGE_API_KEY}` }
    })
  } catch {
    return null
  }

  if (!res.ok) return null

  const contentType = res.headers.get('content-type') || ''
  const buffer = Buffer.from(await res.arrayBuffer())

  if (contentType.includes('text/plain') || fileUrl.toLowerCase().endsWith('.txt')) {
    return buffer.toString('utf-8').trim() || null
  }

  // PDF
  try {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text?.trim() || null
  } catch {
    return null
  }
}
