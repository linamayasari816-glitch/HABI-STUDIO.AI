import axios from 'axios';

export default async function handler(req, res) {
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
      } else if (generations && generations[0]?.status === 'FAILED') {
        return res.status(500).json({ error: 'Generasi gagal di server Leonardo.' });
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Leonardo API Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data?.error || error.message || 'Gagal generate gambar.',
    });
  }
}