import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies, headers } from 'next/headers';
import { createRequestLogger } from '@/lib/logger';

export async function POST(request: Request) {
  console.log('--- RUNNING LATEST VERSION OF GENERATE-SOAL ---');
  const logger = createRequestLogger('generate-soal', request);
  
  try {
    logger.info('Menerima permintaan generate soal baru');
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string;
    const difficulty = formData.get('difficulty') as string;
    const questionType = formData.get('questionType') as string;
    const questionCount = parseInt(formData.get('questionCount') as string);

    // Get authentication token from Authorization header (priority) or cookies
    const headersList = headers();
    const authorizationHeader = headersList.get('authorization');
    const cookieStore = cookies();
    
    let authToken = '';
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      logger.info('Menggunakan token dari Authorization header');
      authToken = authorizationHeader.split(' ')[1];
    } else {
      logger.info('Mencari token dari cookies');
      authToken = cookieStore.get('authToken')?.value || '';
    }

    if (!authToken) {
      logger.warn('Permintaan tanpa token autentikasi', { statusCode: 401 });
      return Response.json(
        { error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    }

    // Headers for API requests with authentication
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`
    };

    // Make sure only one source is provided
    if (file && category) {
      const errorMsg = 'Harap pilih salah satu: file atau kategori';
      logger.warn(errorMsg, { hasFile: !!file, hasCategory: !!category });
      throw new Error(errorMsg);
    }
    if (!file && !category) {
      const errorMsg = 'Harap sertakan file atau kategori';
      logger.warn(errorMsg);
      throw new Error(errorMsg);
    }

    let prompt = '';

    // Handle file content first
    if (file) {
      try {
        logger.info('Memproses file upload', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });

        // Validate file type and size
        const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
          const errorMsg = 'Format file tidak didukung. Gunakan TXT, PDF, DOC, atau DOCX.';
          logger.warn(errorMsg, { fileType: file.type, fileName: file.name });
          throw new Error(errorMsg);
        }

        // Batasi ukuran file maksimum menjadi 8MB
        const maxFileSize = 8 * 1024 * 1024; // 8MB
        if (file.size > maxFileSize) {
          const errorMsg = 'Ukuran file terlalu besar. Maksimal 8MB.';
          logger.warn(errorMsg, { fileSize: file.size, maxFileSize });
          throw new Error(errorMsg);
        }

        // Buat prompt untuk AI langsung tanpa ekstraksi file terlebih dahulu
        prompt = `Anda adalah seorang guru yang membuat soal dari materi pembelajaran.

        Berikut adalah isi file ${file.name} yang perlu Anda baca dan pahami.
        File ini berisi materi pembelajaran yang perlu Anda jadikan dasar untuk membuat soal.
        
        Buatlah ${questionCount} soal berdasarkan materi pembelajaran dengan format JSON berikut:
        {
          "questions": [
            {
              "question": "pertanyaan soal",
              ${questionType === 'MCQ' ? `"options": {
                "A": "pilihan A",
                "B": "pilihan B",
                "C": "pilihan C",
                "D": "pilihan D"
              },` : ''}
              "answer": ${questionType === 'MCQ' ? '"A/B/C/D"' : '"jawaban lengkap"'},
              "explanation": "penjelasan jawaban"
            }
          ]
        }

        Ketentuan:
        1. Uji pemahaman konsep dari materi yang diberikan
        2. Gunakan bahasa Indonesia yang jelas
        3. Tingkat kesulitan: ${difficulty}
        4. Hanya gunakan informasi dari materi yang diberikan
        5. Berikan jawaban yang benar dan penjelasan yang lengkap
        6. PENTING: Response harus dalam format JSON yang valid sesuai contoh di atas`;

        // Extract text from file for additional context to prompt
        try {
          // Konversi file ke teks untuk ditambahkan ke prompt
          const buffer = await file.arrayBuffer();
          const fileContent = new TextDecoder().decode(new Uint8Array(buffer));
          
          // Tambahkan konten file ke prompt sebagai konteks, dengan batasan karakter
          const maxLength = 15000; // Batasi panjang teks
          prompt += `\n\nBerikut adalah konten dari file:\n\n${fileContent.slice(0, maxLength)}`;
          
          if (fileContent.length > maxLength) {
            prompt += '\n\n[Konten file terlalu panjang dan telah dipotong]';
          }
        } catch (error) {
          logger.error('Tidak dapat mengekstrak teks dari file', { error });
        }
      } catch (error) {
        logger.error('File processing error', { error });
        throw new Error('Gagal memproses file. Pastikan file dalam format yang benar dan tidak rusak.');
      }
    }
    
    // Handle category-based generation
    if (category) {
      prompt = `Anda adalah seorang guru yang membuat soal tentang ${category}.

      Buatlah ${questionCount} soal dengan format JSON berikut:
      {
        "questions": [
          {
            "question": "pertanyaan soal",
            ${questionType === 'MCQ' ? `"options": {
              "A": "pilihan A",
              "B": "pilihan B",
              "C": "pilihan C",
              "D": "pilihan D"
            },` : ''}
            "answer": ${questionType === 'MCQ' ? '"A/B/C/D"' : '"jawaban lengkap"'},
            "explanation": "penjelasan jawaban"
          }
        ]
      }

      Ketentuan:
      1. Buat soal tentang ${category}
      2. Gunakan bahasa Indonesia yang jelas
      3. Tingkat kesulitan: ${difficulty}
      4. Pastikan soal relevan dengan topik
      5. Berikan jawaban yang benar dan penjelasan yang lengkap
      6. PENTING: Response harus dalam format JSON yang valid sesuai contoh di atas`;
    }

    // Process with AI model
    logger.debug('Environment Variables:', {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '***' : 'Not set',
      NODE_ENV: process.env.NODE_ENV,
      API_GATEWAY_URL: process.env.API_GATEWAY_URL
    });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      logger.error('Google API Key tidak ditemukan di environment variables');
      throw new Error('Konfigurasi sistem belum lengkap. Silakan hubungi administrator.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Set safety settings
    const generationConfig = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    };

    logger.info('Mengirim permintaan ke AI', {
      model: 'gemini-1.5-flash',
      config: generationConfig,
      promptLength: prompt.length
    });

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const response = await result.response;
      const text = response.text();
      logger.debug('Menerima respons dari AI', { responseLength: text.length });
      
      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          logger.error('Format respons AI tidak valid', { 
            responsePreview: text.substring(0, 500) 
          });
          throw new Error('Respons AI tidak valid. Silakan coba lagi.');
        }

        const jsonStr = jsonMatch[0];
        let jsonResponse;
        
        try {
          jsonResponse = JSON.parse(jsonStr);
        } catch (parseError) {
          logger.error('Gagal parsing JSON dari respons AI', { 
            error: parseError,
            jsonPreview: jsonStr.substring(0, 200) 
          });
          throw new Error('Format JSON tidak valid. Silakan coba lagi.');
        }
        
        // Validate response structure
        if (!jsonResponse?.questions?.length) {
          logger.error('Struktur respons AI tidak valid', { 
            response: jsonResponse 
          });
          throw new Error('Struktur respons tidak valid. Silakan coba lagi.');
        }

        // Format questions consistently
        const fileName = file ? file.name : 'category';
        const questions = jsonResponse.questions.map((q: any) => ({
          question: q.question,
          options: questionType === 'MCQ' ? q.options : null,
          answer: q.answer,
          explanation: q.explanation || '',
          category: category || `Content from ${fileName}`,
          difficulty,
          type: questionType,
          status: 'DRAFT'
        }));

        logger.info('Berhasil membuat soal', { 
          questionCount: questions.length,
          questionType,
          difficulty
        });

        // SIMPAN KE DATABASE LANGSUNG (tidak menggunakan timeout)
        try {
          const gateway = process.env.API_GATEWAY_URL || 'http://api-gateway:3000';
          logger.info('Mengirim soal ke manage-soal-service', {
            questionCount: questions.length,
            targetService: 'manage-soal-service'
          });
          
          const requestBody = {
            questions,
            category: category || `Content from ${fileName}`,
            difficulty,
            type: questionType,
            questionCount
          };
          
          logger.debug('Detail koneksi ke manage-soal-service', {
            endpoint: `${gateway}/api/v1/manage-soal/questions`,
            hasAuthToken: !!authToken,
            tokenLength: authToken?.length
          });
          
          // Coba kirim langsung (tidak menggunakan setTimeout)
          const response = await fetch(
            `${gateway}/api/v1/manage-soal/questions`, 
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              },
              body: JSON.stringify(requestBody)
            }
          );
          
          const responseText = await response.text();
          if (response.ok) {
            logger.info('Berhasil menyimpan soal ke database', {
              savedCount: responseText ? JSON.parse(responseText)?.length || 0 : 0,
              status: response.status
            });
          } else {
            logger.warn('Gagal menyimpan soal, mencoba koneksi alternatif', {
              status: response.status,
              error: responseText,
              attempt: 'primary'
            });
            
            // Coba akses langsung sebagai fallback
            logger.info('Mencoba koneksi langsung ke service...');
            const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
            
            const directResponse = await fetch(
              `${apiGatewayUrl}/api/v1/manage-soal/questions`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`,
                  'Cache-Control': 'no-cache, no-store, must-revalidate'
                },
                body: JSON.stringify(requestBody)
              }
            );
            
            const directText = await directResponse.text();
            if (directResponse.ok) {
              logger.info('Berhasil menyimpan soal melalui URL alternatif', {
                status: directResponse.status,
                savedCount: directText ? JSON.parse(directText)?.length || 0 : 0
              });
            } else {
              logger.error('Gagal koneksi alternatif', {
                status: directResponse.status,
                error: directText,
                attempt: 'fallback'
              });
              
              // Tambahkan pesan error ke respons API
              return Response.json({ 
                success: false,
                message: 'Soal berhasil dibuat tetapi gagal disimpan ke database. Silakan coba lagi.',
                error: directText,
                questions: questions
              }, { status: 500 });
            }
          }
        } catch (error) {
          logger.error('Error saat menyimpan soal', { error });
          // Tambahkan pesan error ke respons API
          return Response.json({ 
            success: false,
            message: 'Soal berhasil dibuat tetapi gagal disimpan ke database. Silakan coba lagi.',
            error: error instanceof Error ? error.message : String(error),
            questions: questions
          }, { status: 500 });
        }

        // LANGSUNG KEMBALIKAN RESPONSE KE USER
        return Response.json({ 
          success: true,
          message: 'Soal berhasil dibuat.',
          questions: questions
        });
      } catch (error) {
        logger.error('Kesalahan saat memproses respons AI', { 
          error,
          textPreview: text?.substring(0, 500) 
        });
        return Response.json(
          { error: error instanceof Error ? error.message : 'Gagal memproses respons AI. Silakan coba lagi.' },
          { status: 500 }
        );
      }
    } catch (aiError) {
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown error';
      const errorStack = aiError instanceof Error ? aiError.stack : undefined;
      
      logger.error('Kesalahan generasi AI', { 
        errorMessage: aiError instanceof Error ? aiError.message : String(aiError),
        errorStack: aiError instanceof Error ? aiError.stack : undefined,
        // The raw error object might contain more details from the Google SDK
        rawError: JSON.stringify(aiError, Object.getOwnPropertyNames(aiError))
      });
      
      return Response.json(
        { 
          error: 'Gagal membuat soal dengan AI. Silakan coba lagi atau gunakan kata kunci yang berbeda.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Kesalahan dalam proses generate soal', { error });
    return Response.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat soal' },
      { status: 500 }
    );
  }
}