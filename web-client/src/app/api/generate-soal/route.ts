import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string;
    const difficulty = formData.get('difficulty') as string;
    const questionType = formData.get('questionType') as string;
    const questionCount = parseInt(formData.get('questionCount') as string);

    // Get authentication token from cookies
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
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
      throw new Error('Harap pilih salah satu: file atau kategori');
    }
    if (!file && !category) {
      throw new Error('Harap sertakan file atau kategori');
    }

    let prompt = '';

    // Handle file content first
    if (file) {
      try {
        // Log file information for debugging
        console.log('File info:', {
          name: file.name,
          type: file.type,
          size: file.size
        });

        // Validate file type and size
        const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
          throw new Error('Format file tidak didukung. Gunakan TXT, PDF, DOC, atau DOCX.');
        }

        // Batasi ukuran file maksimum menjadi 8MB
        if (file.size > 8 * 1024 * 1024) { // 8MB limit
          throw new Error('Ukuran file terlalu besar. Maksimal 8MB.');
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
          console.log('Tidak dapat mengekstrak teks dari file, melanjutkan dengan prompt saja');
        }
      } catch (error) {
        console.error('File processing error:', error);
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
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Set safety settings
    const generationConfig = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    };

    console.log('Sending prompt to AI...');

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const response = await result.response;
      const text = response.text();
      console.log('Raw text length:', text.length);
      
      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No valid JSON found in response:', text);
          throw new Error('Respons AI tidak valid. Silakan coba lagi.');
        }

        const jsonStr = jsonMatch[0];
        let jsonResponse;
        
        try {
          jsonResponse = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Raw JSON string:', jsonStr);
          throw new Error('Format JSON tidak valid. Silakan coba lagi.');
        }
        
        // Validate response structure
        if (!jsonResponse?.questions?.length) {
          console.error('Invalid response structure:', jsonResponse);
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

        console.log('Berhasil mengekstrak dan memformat soal');
        console.log(`Jumlah soal yang dibuat: ${questions.length}`);

        // SIMPAN KE DATABASE LANGSUNG (tidak menggunakan timeout)
        try {
          const gateway = process.env.API_GATEWAY_URL || 'http://api-gateway:3000';
          console.log(`[INFO] Mengirim ${questions.length} soal ke manage-soal-service...`);
          
          const requestBody = {
            questions,
            category: category || `Content from ${fileName}`,
            difficulty,
            type: questionType,
            questionCount
          };
          
          console.log(`[INFO] Endpoint target: ${gateway}/api/v1/manage-soal/questions`);
          console.log(`[INFO] Token digunakan: ${authToken ? 'Ya (panjang: ' + authToken.length + ')' : 'Tidak'}`);
          
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
            console.log('[INFO] Berhasil menyimpan soal ke manage-soal-service');
            try {
              const jsonResponse = JSON.parse(responseText);
              console.log(`[INFO] Response: Saved ${jsonResponse.length || 0} questions`);
              console.log(`[INFO] Detail respons:`, jsonResponse);
            } catch (e) {
              console.log(`[INFO] Response (raw): ${responseText}`);
            }
          } else {
            console.error(`[ERROR] Gagal menyimpan soal ke manage-soal-service. Status: ${response.status}`);
            console.error(`[ERROR] Response error: ${responseText}`);
            
            // Coba akses langsung sebagai fallback
            console.log('[INFO] Mencoba koneksi langsung ke service...');
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
              console.log('[INFO] Berhasil menyimpan soal melalui URL alternatif');
              console.log(`[INFO] Direct response: ${directText}`);
            } else {
              console.error(`[ERROR] Gagal koneksi alternatif. Status: ${directResponse.status}`);
              console.error(`[ERROR] Direct response error: ${directText}`);
              
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
          console.error('[ERROR] Error saat menyimpan soal:', error);
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
        console.error('Processing error:', error);
        console.error('Raw text excerpt:', text.substring(0, 500));
        return Response.json(
          { error: error instanceof Error ? error.message : 'Gagal memproses respons AI. Silakan coba lagi.' },
          { status: 500 }
        );
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      return Response.json(
        { error: 'Gagal membuat soal dengan AI. Silakan coba lagi atau gunakan kata kunci yang berbeda.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generate error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat soal' },
      { status: 500 }
    );
  }
}