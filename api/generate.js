// api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  // Log awal: ini harus muncul di Vercel Runtime Logs
  console.log('MASUK FUNGSI /api/generate');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    console.log('Method bukan POST, keluar.');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    console.error('Gagal parse body:', e);
    return res.status(400).json({ error: 'Body tidak valid.' });
  }

  const { prompt, modelId } = body;
  console.log('Prompt:', prompt);
  console.log('Model ID:', modelId);

  if (!prompt || !modelId) {
    console.log('Prompt atau modelId kosong.');
    return res.status(400).json({ error: 'Prompt dan Model ID harus diisi.' });
  }

  // Cek API Key
  const API_KEY = process.env.LEONARDO_API_KEY;
  if (!API_KEY) {
    console.log('API KEY TIDAK DITEMUKAN!');
    return res.status(500).json({ error: 'Server error: API Key tidak dikonfigurasi.' });
  }
  console.log('API KEY ditemukan, panjang:', API_KEY.length);

  try {
    // Pakai endpoint standar dulu untuk tes: modelId langsung dikirim
    console.log('Mengirim request ke Leonardo API V1...');
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
        timeout: 15000, // 15 detik timeout
      }
    );

    console.log('Response status:', response.status);
    const generationId = response.data?.sdGenerationJob?.generationId || response.data?.generationId;
    if (!generationId) {
      console.error('Tidak ada generationId di response:', response.data);
      return res.status(500).json({ error: 'Gagal mendapatkan ID generasi.' });
    }

    // Polling hasil
    let imageUrl = null;
    for (let i = 0; i < 20; i++) {
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
        console.log('Gambar berhasil didapat:', imageUrl);
        break;
      } else if (gen && gen.status === 'FAILED') {
        console.error('Generasi gagal:', gen.failure_reason);
        return res.status(500).json({ error: `Generasi gagal: ${gen.failure_reason || 'tidak diketahui'}` });
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!imageUrl) {
      console.error('Polling timeout.');
      return res.status(500).json({ error: 'Timeout menunggu gambar.' });
    }

    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error saat request ke Leonardo:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    }
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
    return res.status(500).json({ error: errorMessage });
  }
}