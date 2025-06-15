import { extractDocContent } from './docExtractor';
import { extractPDFContent } from './pdfExtractor';

export async function processFile(buffer: Buffer, filename: string): Promise<string> {
  const fileExtension = filename.split('.').pop()?.toLowerCase();

  try {
    switch (fileExtension) {
      case 'pdf':
        return await extractPDFContent(buffer);
      case 'doc':
      case 'docx':
        return await extractDocContent(buffer);
      case 'txt':
        return buffer.toString('utf-8');
      default:
        throw new Error('Unsupported file type. Please use PDF, DOC, DOCX, or TXT files.');
    }
  } catch (error) {
    console.error(`Error processing ${fileExtension} file:`, error);
    throw new Error(`Failed to process ${fileExtension} file. Please check the file format and try again.`);
  }
}
