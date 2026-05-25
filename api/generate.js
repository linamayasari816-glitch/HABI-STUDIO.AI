// api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  // Log awal untuk debugging
  console.log('➡️ Fungsi dipanggil');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, modelId } = req.body;

  if (!prompt || !modelId) {
    return res.status(400).json({ error: 'Prompt dan Model ID harus diisi.' });
  }

  // *** PENGECEKAN PENTING: API KEY ***
  const API_KEY = process.env.LEONARDO_API_KEY;
  if (!API_KEY) {
    console.error('❌ LEONARDO_API_KEY tidak ditemukan di environment variable!');
    return res.status(500).json({ 
      error: 'Konfigurasi server salah: API Key tidak ditemukan. Hubungi admin.' 
    });
  }
  console.log('🔑 API Key ditemukan (panjang:', API_KEY.length, 'karakter)');

  // Fungsi polling (tidak ada perubahan)
  const pollForResult = async (generationId) => {
    console.log(`⏳ Mulai polling untuk generationId: ${generationId}`);
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await axios.get(
          `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        );
        const generations = result.data?.generations_by_pk?.generated_images;
        if (generations && generations.length > 0) {
          const gen = generations[0];
          console.log(`Status generasi: ${gen.status}`);
          if (gen.status === 'COMPLETE' && gen.url) {
            return gen.url;
          } else if (gen.status === 'FAILED') {
            throw new Error(`Generasi gagal. Alasan: ${gen.failure_reason || 'tidak diketahui'}`);
          }
        }
      } catch (pollingError) {
        console.error('Polling error:', pollingError.response?.data || pollingError.message);
        if (pollingError.response?.status === 401) {
          throw new Error('API Key tidak valid untuk mengakses generasi ini.');
        }
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Timeout: Gambar/video tidak kunjung selesai setelah 60 detik.');
  };

  try {
    let response;
    let generationId;

    // ===== DAFTAR MODEL =====
    const v2ImageModels = ['gemini-2.5-flash-image', 'gpt-image-1.5', 'ideogram-3.0', 'seedream-4.0', 'seedream-4.5', 'nano-banana-pro'];
    const v2VideoModels = ['kling-3.0', 'kling-2.5', 'kling-2.6', 'kling-o1', 'kling-o3', 'sora-2'];
    const v1VideoModels = ['VEO3_1', 'VEO3_1FAST', 'VEO3', 'KLING2_1', 'seedance-1.0', 'seedance-1.0-pro', 'seedance-1.0-pro-fast', 'motion-2.0'];

    // ===== ROUTING =====
    if (v2ImageModels.includes(modelId)) {
      console.log(`➡️ ROUTING: Model ${modelId} → Endpoint V2 Image`);
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
        { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
      );
    } else if (v2VideoModels.includes(modelId)) {
      console.log(`➡️ ROUTING: Model ${modelId} → Endpoint V2 Video`);
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
        { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
      );
    } else if (v1VideoModels.includes(modelId)) {
      console.log(`➡️ ROUTING: Model ${modelId} → Endpoint Image-to-Video V1`);
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
        { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log(`➡️ ROUTING: Model ${modelId} → Endpoint V1 Standard`);
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v1/generations',
        {
          prompt: prompt,
          modelId: modelId,
          width: 512,
          height: 512,
          num_images: 1,
        },
        { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Response status:', response.status);

    generationId = response.data?.sdGenerationJob?.generationId || response.data?.generationId;
    if (!generationId) {
      console.error('❌ Tidak ada generationId di response:', JSON.stringify(response.data));
      throw new Error('Server tidak mengembalikan ID generasi.');
    }

    const imageUrl = await pollForResult(generationId);
    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error('❌ FULL ERROR:', {
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
    });

    const errorMessage = error.response?.data?.error 
                      || error.response?.data?.message
                      || error.message
                      || 'Gagal generate gambar.';

    return res.status(500).json({ error: errorMessage });
  }
}