// api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  // Log request untuk debugging
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, modelId } = req.body;
  const API_KEY = process.env.LEONARDO_API_KEY;

  if (!prompt || !modelId) {
    return res.status(400).json({ error: 'Prompt dan Model ID harus diisi.' });
  }

  // Fungsi polling yang lebih detail
  const pollForResult = async (generationId, isVideo = false) => {
    console.log(`Mulai polling untuk generationId: ${generationId}, isVideo: ${isVideo}`);
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await axios.get(
          `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        );
        console.log(`Polling attempt ${i + 1}: status ${result.status}`);
        
        const generations = result.data?.generations_by_pk?.generated_images;
        if (generations && generations.length > 0) {
          const gen = generations[0];
          console.log('Generation status:', gen.status);
          if (gen.status === 'COMPLETE' && gen.url) {
            return gen.url;
          } else if (gen.status === 'FAILED') {
            throw new Error(`Generasi gagal di server Leonardo. Alasan: ${gen.failure_reason || 'tidak diketahui'}`);
          }
        }
      } catch (pollingError) {
        console.error('Polling error:', pollingError.response?.data || pollingError.message);
        if (pollingError.response?.status === 401) {
          throw new Error('API Key tidak valid atau tidak memiliki akses ke generasi ini.');
        }
        // Jika bukan error fatal, lanjutkan polling
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Timeout: Gambar/video tidak kunjung selesai setelah 60 detik.');
  };

  try {
    let response;
    let generationId;

    // ===== ROUTING BARU BERDASARKAN MODEL (SUDAH DIPERBAIKI) =====
    
    // 1. MODEL V2 IMAGE (Semua model yang menggunakan endpoint V2)
    const v2ImageModels = [
      'gemini-2.5-flash-image', // Nano Banana
      'gpt-image-1.5',          // GPT Image-1.5
      'ideogram-3.0',           // Ideogram 3.0
      'seedream-4.0',           // Seedream 4.0
      'seedream-4.5',           // Seedream 4.5
      'nano-banana-pro',        // Nano Banana Pro
    ];
    
    // 2. MODEL V2 VIDEO (Kling terbaru, Sora 2 - semuanya endpoint V2)
    const v2VideoModels = [
      'kling-3.0',              // Kling 3.0
      'kling-2.5',              // Kling 2.5 Turbo
      'kling-2.6',              // Kling 2.6
      'kling-o1',               // Kling O1
      'kling-o3',               // Kling O3
      'sora-2',                 // Sora 2
    ];
    
    // 3. MODEL IMAGE-TO-VIDEO (Veo, Kling 2.1, Seedance, Motion - endpoint khusus)
    const v1VideoModels = [
      'VEO3_1',                 // Veo 3.1
      'VEO3_1FAST',             // Veo 3.1 Fast
      'VEO3',                   // Veo 3.0
      'KLING2_1',               // Kling 2.1 Pro
      'seedance-1.0',           // Seedance 1.0
      'seedance-1.0-pro',       // Seedance 1.0 Pro
      'seedance-1.0-pro-fast',  // Seedance 1.0 Pro Fast
      'motion-2.0',             // Motion 2.0
    ];

    // ROUTING DIMULAI
    if (v2ImageModels.includes(modelId)) {
      console.log(`✅ ROUTING: Model ${modelId} → Endpoint V2 Image`);
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v2/generations',
        {
          model: modelId,
          parameters: {
            prompt: prompt,
            width: 1024,
            height: 1024,
            quantity: 1,
            prompt_enhance: 'OFF',
          },
          public: false,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (v2VideoModels.includes(modelId)) {
      console.log(`✅ ROUTING: Model ${modelId} → Endpoint V2 Video`);
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v2/generations',
        {
          model: modelId,
          public: false,
          parameters: {
            prompt: prompt,
            duration: 5,
            width: 1920,
            height: 1080,
            mode: 'RESOLUTION_1080',
            motion_has_audio: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (v1VideoModels.includes(modelId)) {
      console.log(`✅ ROUTING: Model ${modelId} → Endpoint Image-to-Video V1`);
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v1/generations-image-to-video',
        {
          prompt: prompt,
          model: modelId,
          duration: 8,
          width: 1920,
          height: 1080,
          resolution: 'RESOLUTION_1080',
          isPublic: false,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      // 4. MODEL STANDARD V1 (Leonardo Diffusion, Stable Diffusion, dll.)
      console.log(`✅ ROUTING: Model ${modelId} → Endpoint V1 Standard`);
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v1/generations',
        {
          prompt: prompt,
          modelId: modelId,
          width: 512,
          height: 512,
          num_images: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data).substring(0, 500)); // potong agar tidak terlalu panjang

    generationId = response.data?.sdGenerationJob?.generationId || response.data?.generationId;
    if (!generationId) {
      console.error('Tidak ada generationId di response:', response.data);
      throw new Error('Server Leonardo tidak mengembalikan ID generasi. Response: ' + JSON.stringify(response.data));
    }

    const isVideo = [...v2VideoModels, ...v1VideoModels].includes(modelId);
    const imageUrl = await pollForResult(generationId, isVideo);

    return res.status(200).json({ imageUrl });

  } catch (error) {
    // Log error selengkap mungkin
    console.error('FULL ERROR:', {
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      responseHeaders: error.response?.headers,
    });

    // Kirim pesan error yang paling informatif ke frontend
    const errorMessage = error.response?.data?.error 
                      || error.response?.data?.message
                      || error.response?.data?.detail
                      || error.message
                      || 'Gagal generate gambar.';

    return res.status(500).json({
      error: errorMessage,
      // Sertakan detail tambahan untuk debugging (opsional, bisa dihapus nanti)
      debug: {
        status: error.response?.status,
        code: error.response?.data?.code,
      }
    });
  }
}