import { PDFExtract } from 'pdf.js-extract';

export async function extractPDFContent(buffer: Buffer): Promise<string> {
  try {
    console.log(`Mulai ekstraksi PDF: ${buffer.length} bytes`);
    const startTime = Date.now();

    // Konfigurasi PDF Extractor
    const pdfExtract = new PDFExtract();
    
    // Buat promise dengan timeout
    const extractPromise = new Promise<string>((resolve, reject) => {
      pdfExtract.extractBuffer(buffer)
        .then(data => {
          console.log(`PDF berhasil diekstrak. Jumlah halaman: ${data.pages.length}`);
          
          // Combine all page content with proper spacing
          const content = data.pages.map((page, index) => {
            console.log(`Memproses halaman ${index + 1}/${data.pages.length}`);
            return page.content
              .sort((a, b) => {
                // Sort by y position first, then x
                if (Math.abs(a.y - b.y) > 5) {
                  return a.y - b.y;
                }
                return a.x - b.x;
              })
              .map(item => item.str)
              .join(' ');
          }).join('\n\n');
          
          const endTime = Date.now();
          console.log(`Ekstraksi PDF selesai dalam ${(endTime - startTime) / 1000} detik`);
          
          resolve(content);
        })
        .catch(err => {
          console.error('Error dalam ekstraksi PDF:', err);
          reject(new Error(`Failed to extract PDF content: ${err.message}`));
        });
    });
    
    // Gunakan timeout 3 menit
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('PDF extraction timed out after 3 minutes'));
      }, 3 * 60 * 1000);
    });
    
    // Race antara ekstraksi dan timeout
    return await Promise.race([extractPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
