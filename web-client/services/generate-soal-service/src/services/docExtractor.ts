import mammoth from 'mammoth';

export async function extractDocContent(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting DOC content:', error);
    throw new Error('Failed to extract DOC content');
  }
}
