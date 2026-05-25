// api/generate.js
import axios from 'axios';

// Daftar lengkap model yang tersedia (nama display & model ID)
const MODEL_LIST = {
  // Image Models
  '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3': 'Leonardo Diffusion XL',
  '1e60896f-3c26-4296-8ecc-53e2afecc132': 'Leonardo Vision XL',
  '5c232a9e-9061-4777-980b-ddc8e65647c3': 'Leonardo Kino XL',
  '2067ae52-33fd-4a82-bb92-c2c55e7d2786': 'Leonardo Anime XL',
  'aa77f04e-3eec-4034-9c07-d0f619684628': 'Leonardo Lightning XL',
  'cd2b2a15-9760-4174-a5ff-4d2925057376': 'AlbedoBase XL',
  'b5d207b1-4d9f-4ce5-b2b3-3b42e5f5b0d8': 'Stable Diffusion 1.5',
  'e316348f-7773-490e-adcd-46757c738eb7': 'Stable Diffusion 2.1',
  'd69c8275-1f4e-4a49-9b75-bb67a2c5c4ec': 'PhotoReal V2',
  '8b1e621b-5b2d-4b2f-8e1e-8e0f1b6e7f7d': 'Alchemy V2',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1b': 'Lucid Origin',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1c': 'Lucid Realism',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1d': 'Phoenix 0.9',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1e': 'Phoenix 1.0',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1f': 'FLUX Dev',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b20': 'FLUX Schnell',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b21': 'FLUX.1 Kontext [pro]',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b22': 'FLUX.2 Pro',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b23': 'GPT Image-1.5',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b24': 'Ideogram 3.0',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b25': 'Nano Banana',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b26': 'Nano Banana Pro',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b27': 'Seedream 4.0',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b28': 'Seedream 4.5',

  // Video Models
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b29': 'Veo 3.0',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b30': 'Veo 3.1',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b31': 'Veo 3.1 Fast',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b32': 'Sora 2',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b33': 'Kling 2.1 Pro',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b34': 'Kling 2.5 Turbo',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b35': 'Kling 2.6',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b36': 'Kling 3.0',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b37': 'Kling O1',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b38': 'Kling O3',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b39': 'Seedance 1.0',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b40': 'Seedance 1.0 Pro',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b41': 'Seedance 1.0 Pro Fast',
  'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b42': 'Motion 2.0',
};

export default async function handler(req, res) {
  // Hanya izinkan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, modelId } = req.body;
  if (!prompt || !modelId) {
    return res.status(400).json({ error: 'Prompt dan Model ID harus diisi.' });
  }

  const API_KEY = process.env.LEONARDO_API_KEY;

  try {
    const response = await axios.post(
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

    const generationId = response.data.sdGenerationJob.generationId;

    // Polling gambar hingga siap
    let imageUrl = null;
    while (!imageUrl) {
      const result = await axios.get(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );
      const generations = result.data.generations_by_pk.generated_images;
      if (generations && generations.length > 0 && generations[0].url) {
        imageUrl = generations[0].url;
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Gagal generate gambar.' });
  }
}