// api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, modelId } = req.body;
  const API_KEY = process.env.LEONARDO_API_KEY;

  if (!prompt || !modelId) {
    return res.status(400).json({ error: 'Prompt dan Model ID harus diisi.' });
  }

  // Fungsi untuk polling hasil generasi
  const pollForResult = async (generationId, isVideo = false) => {
    const maxAttempts = 30; // Maksimal 30 kali cek (60 detik)
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await axios.get(
          `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        );
        
        const generations = result.data?.generations_by_pk?.generated_images;
        if (generations && generations.length > 0) {
          const gen = generations[0];
          if (gen.status === 'COMPLETE' && gen.url) {
            return gen.url;
          } else if (gen.status === 'FAILED') {
            throw new Error('Generasi gagal di server Leonardo.');
          }
        }
      } catch (pollingError) {
        // Abaikan error polling sementara, lanjutkan mencoba
        console.warn('Polling attempt failed, retrying...', pollingError.message);
      }
      
      // Tunggu 2 detik sebelum mencoba lagi
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Timeout: Gambar/video tidak kunjung selesai.');
  };

  try {
    let response;
    let generationId;

    // === ROUTING BERDASARKAN MODEL ===

    // 1. MODEL V2 IMAGE (Nano Banana, GPT Image, Ideogram, Seedream)
    const v2ImageModels = ['gemini-2.5-flash-image', 'gpt-image-1.5', 'ideogram-3.0', 'seedream-4.0', 'seedream-4.5', 'nano-banana-pro'];
    if (v2ImageModels.includes(modelId)) {
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v2/generations', // Endpoint V2
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
      generationId = response.data?.sdGenerationJob?.generationId || response.data?.generationId;
    }

    // 2. MODEL VIDEO V2 (Kling 3.0, Kling 2.5, dll.)
    const v2VideoModels = ['kling-3.0', 'kling-2.5', 'kling-2.6', 'kling-o1', 'kling-o3', 'sora-2'];
    else if (v2VideoModels.includes(modelId)) {
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v2/generations', // Endpoint V2
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
      generationId = response.data?.sdGenerationJob?.generationId || response.data?.generationId;
    }

    // 3. MODEL IMAGE-TO-VIDEO V1 (Veo 3.1, Veo 3.0, Kling 2.1, Seedance, Motion)
    const v1VideoModels = ['VEO3_1', 'VEO3_1FAST', 'VEO3', 'KLING2_1', 'seedance-1.0', 'seedance-1.0-pro', 'seedance-1.0-pro-fast', 'motion-2.0'];
    else if (v1VideoModels.includes(modelId)) {
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v1/generations-image-to-video', // Endpoint Image-to-Video
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
      generationId = response.data?.sdGenerationJob?.generationId || response.data?.generationId;
    }

    // 4. MODEL STANDARD V1 (Leonardo Diffusion, Stable Diffusion, dll.)
    else {
      response = await axios.post(
        'https://cloud.leonardo.ai/api/rest/v1/generations', // Endpoint V1 standar
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
      generationId = response.data?.sdGenerationJob?.generationId || response.data?.generationId;
    }

    // Jika tidak ada generationId, lempar error
    if (!generationId) {
      console.error('Response tidak mengandung generationId:', response.data);
      throw new Error('Server Leonardo tidak mengembalikan ID generasi.');
    }

    // Polling untuk mendapatkan hasil
    const isVideo = [...v2VideoModels, ...v1VideoModels].includes(modelId);
    const imageUrl = await pollForResult(generationId, isVideo);

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error('Leonardo API Error:', error.response?.data || error.message);
    
    // Cek apakah error dari server Leonardo
    const serverError = error.response?.data?.error || error.response?.data?.message;
    return res.status(500).json({
      error: serverError || error.message || 'Gagal generate gambar.',
    });
  }
}