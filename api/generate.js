import axios from 'axios'

const LEONARDO_API_KEY = process.env.VITE_LEONARDO_API_KEY
const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1'

// ✅ MODEL ID VALID DARI DOCS RESMI LEONARDO.AI
const VALID_MODELS = [
  'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', // Phoenix 1.0
  'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Phoenix 0.9
  'aa77f04e-3eec-4034-9570-3e2e1f589935', // Lightning XL
  '1e60896f-3c26-4296-8ecc-53e2afecc132', // Diffusion XL
  '2067ae52-33fd-4a82-bb92-c0c130811ef8', // AlbedoBase XL
  'e71a1c2f-4f80-4800-934f-2c68979d1cc6', // Anime Pastel Dream
  '1aa0f478-ccbe-4490-af15-18ecfc421028', // DreamShaper v7
  'b63f7119-31dc-4540-969b-2a9df997e173', // Absolute Reality v1.6
  '291be633-cb24-434f-898f-e662799936ad', // Leonardo Diffusion
]

const DEFAULT_MODEL = 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3' // Phoenix 1.0

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!LEONARDO_API_KEY) {
    return res.status(500).json({ error: 'API key tidak dikonfigurasi' })
  }

  try {
    const {
      prompt,
      modelId,
      width = 1024,
      height = 1024,
      num_images = 1,
      negative_prompt = ''
    } = req.body

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt tidak boleh kosong' })
    }

    // ✅ Validasi & gunakan model yang valid
    const finalModelId = VALID_MODELS.includes(modelId) 
      ? modelId 
      : DEFAULT_MODEL

    console.log('🚀 Generate request:')
    console.log('  Prompt:', prompt)
    console.log('  Model:', finalModelId)
    console.log('  Size:', width, 'x', height)

    // ✅ Build request body - HANYA field yang diperlukan
    const requestBody = {
      prompt: prompt.trim(),
      modelId: finalModelId,
      width: Number(width),
      height: Number(height),
      num_images: Number(num_images),
    }

    // Tambah negative prompt hanya jika ada
    if (negative_prompt && negative_prompt.trim()) {
      requestBody.negative_prompt = negative_prompt.trim()
    }

    console.log('📦 Request body:', JSON.stringify(requestBody))

    // STEP 1: Create generation
    const createResponse = await axios.post(
      `${BASE_URL}/generations`,
      requestBody,
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': `Bearer ${LEONARDO_API_KEY}`
        },
        timeout: 30000
      }
    )

    console.log('📬 Create response:', JSON.stringify(createResponse.data))

    const generationId = createResponse.data?.sdGenerationJob?.generationId

    if (!generationId) {
      console.error('❌ No generation ID:', createResponse.data)
      return res.status(500).json({ 
        error: 'Tidak mendapat generation ID',
        detail: createResponse.data
      })
    }

    console.log('✅ Generation ID:', generationId)

    // STEP 2: Poll hasil
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      await sleep(2000)
      attempts++

      console.log(`⏳ Poll ${attempts}/${maxAttempts}`)

      const pollResponse = await axios.get(
        `${BASE_URL}/generations/${generationId}`,
        {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${LEONARDO_API_KEY}`
          },
          timeout: 10000
        }
      )

      const generation = pollResponse.data?.generations_by_pk

      if (!generation) {
        console.error('❌ No generation data')
        continue
      }

      const status = generation.status
      console.log('  Status:', status)

      if (status === 'COMPLETE') {
        const images = generation.generated_images
        console.log('✅ Complete! Images:', images.length)
        return res.status(200).json({ 
          success: true,
          images: images,
          generationId: generationId
        })
      }

      if (status === 'FAILED') {
        return res.status(500).json({ 
          error: 'Generasi gagal di server Leonardo' 
        })
      }

      // Status PENDING → lanjut polling
    }

    return res.status(408).json({ 
      error: 'Timeout: Generasi terlalu lama. Coba lagi.' 
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    
    // Tangkap detail error dari Leonardo
    if (error.response) {
      console.error('Leonardo error response:', error.response.data)
      return res.status(error.response.status).json({
        error: error.response.data?.error || 'Leonardo API error',
        detail: error.response.data,
        status: error.response.status
      })
    }

    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}