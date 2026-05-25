// api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('➡️ Fungsi dipanggil');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, modelId } = req.body;
  console.log('Prompt:', prompt, 'Model ID:', modelId);

  if (!prompt || !modelId) {
    return res.status(400).json({ error: 'Prompt dan Model ID harus diisi.' });
  }

  const API_KEY = process.env.LEONARDO_API_KEY;
  if (!API_KEY) {
    console.error('❌ API Key tidak ditemukan');
    return res.status(500).json({ error: 'Server error: API Key tidak dikonfigurasi.' });
  }

  // ===== DAFTAR MODEL YANG VALID (DENGAN ROUTING) =====
  // Model V2 Image (pakai endpoint /v2/generations, parameter "model")
  const V2_IMAGE_MODELS = [
    'gemini-2.5-flash-image', // Nano Banana
    'gpt-image-1.5',
    'ideogram-3.0',
    'seedream-4.0',
    'seedream-4.5',
  ];

  // Model V1 Image standar (pakai endpoint /v1/generations, parameter "modelId")
  const V1_IMAGE_MODELS = [
    '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', // Leonardo Diffusion XL
    '1e60896f-3c26-4296-8ecc-53e2afecc132', // Leonardo Vision XL
    '5c232a9e-9061-4777-980b-ddc8e65647c3', // Leonardo Kino XL
    '2067ae52-33fd-4a82-bb92-c2c55e7d2786', // Leonardo Anime XL
    'cd2b2a15-9760-4174-a5ff-4d2925057376', // AlbedoBase XL
    'b5d207b1-4d9f-4ce5-b2b3-3b42e5f5b0d8', // Stable Diffusion 1.5
    'e316348f-7773-490e-adcd-46757c738eb7', // Stable Diffusion 2.1
    'd69c8275-1f4e-4a49-9b75-bb67a2c5c4ec', // PhotoReal V2
  ];

  try {
    let response;
    let generationId;

    if (V2_IMAGE_MODELS.includes(modelId)) {
      // Endpoint V2 untuk model seperti Nano Banana
      console.log('Menggunakan endpoint V2');
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
          timeout: 15000,
        }
      );
    } else {
      // Endpoint V1 untuk model standar
      console.log('Menggunakan endpoint V1');
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
          timeout: 15000,
        }
      );
    }

    generationId = response.data?.sdGenerationJob?.generationId || response.data?.generationId;
    if (!generationId) {
      console.error('❌ Tidak ada generationId:', response.data);
      return res.status(500).json({ error: 'Gagal mendapatkan ID generasi.' });
    }

    // Polling hasil
    let imageUrl = null;
    for (let i = 0; i < 30; i++) {
      console.log(`Polling ke-${i + 1}...`);
      const pollRes = await axios.get(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
          timeout: 10000,
        }
      );
      const gen = pollRes.data?.generations_by_pk?.generated_images?.[0];
      if (gen && gen.status === 'COMPLETE' && gen.url) {
        imageUrl = gen.url;
        break;
      } else if (gen && gen.status === 'FAILED') {
        return res.status(500).json({ error: `Generasi gagal: ${gen.failure_reason || 'tidak diketahui'}` });
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'Timeout menunggu gambar.' });
    }

    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
    return res.status(500).json({ error: errorMessage });
  }
}