const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ✅ Ambil API key - support berbagai nama variable
const getApiKey = () => {
  return process.env.LEONARDO_API_KEY || 
         process.env.VITE_LEONARDO_API_KEY ||
         process.env.LEONARDO_API_KEY_SECRET ||
         null
}

const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1'

// ✅ Model ID VALID dari docs.leonardo.ai/docs/list-of-models
const VALID_MODELS = [
  'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
  'b24e16ff-06e3-43eb-8d33-4416c2d75876',
  'aa77f04e-3eec-4034-9570-3e2e1f589935',
  '1e60896f-3c26-4296-8ecc-53e2afecc132',
  '2067ae52-33fd-4a82-bb92-c0c130811ef8',
  'e71a1c2f-4f80-4800-934f-2c68979d1cc6',
  '1aa0f478-ccbe-4490-af15-18ecfc421028',
  'b63f7119-31dc-4540-969b-2a9df997e173',
  '291be633-cb24-434f-898f-e662799936ad',
]

const DEFAULT_MODEL = 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ✅ Cek API Key
  const LEONARDO_API_KEY = getApiKey()
  
  console.log('🔑 API Key check:', LEONARDO_API_KEY ? 
    `Found: ${LEONARDO_API_KEY.substring(0, 8)}...` : 
    'NOT FOUND'
  )
  console.log('📋 Available env vars:', 
    Object.keys(process.env).filter(k => 
      k.includes('LEONARDO') || k.includes('API')
    )
  )

  if (!LEONARDO_API_KEY) {
    return res.status(500).json({ 
      error: 'API key tidak dikonfigurasi',
      hint: 'Tambahkan LEONARDO_API_KEY di Vercel Environment Variables',
      envVarsFound: Object.keys(process.env).filter(k => 
        k.includes('LEONARDO')
      )
    })
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

    // Validasi model ID
    const finalModelId = VALID_MODELS.includes(modelId) 
      ? modelId 
      : DEFAULT_MODEL

    console.log('🚀 Generating image...')
    console.log('  Prompt:', prompt)
    console.log('  Model:', finalModelId)
    console.log('  Size:', `${width}x${height}`)

    // Build request body
    const requestBody = {
      prompt: prompt.trim(),
      modelId: finalModelId,
      width: Number(width),
      height: Number(height),
      num_images: Number(num_images),
    }

    if (negative_prompt && negative_prompt.trim()) {
      requestBody.negative_prompt = negative_prompt.trim()
    }

    console.log('📦 Sending to Leonardo:', JSON.stringify(requestBody))

    // STEP 1: Create generation
    const createRes = await fetch(`${BASE_URL}/generations`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${LEONARDO_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    const createData = await createRes.json()
    console.log('📬 Leonardo response status:', createRes.status)
    console.log('📬 Leonardo response data:', JSON.stringify(createData))

    if (!createRes.ok) {
      return res.status(createRes.status).json({
        error: createData.error || 'Leonardo API error',
        detail: createData,
        modelUsed: finalModelId
      })
    }

    const generationId = createData?.sdGenerationJob?.generationId

    if (!generationId) {
      return res.status(500).json({
        error: 'Tidak mendapat generation ID',
        response: createData
      })
    }

    console.log('✅ Generation ID:', generationId)

    // STEP 2: Poll untuk hasil
    for (let i = 0; i < 30; i++) {
      await sleep(2000)
      
      console.log(`⏳ Poll ${i + 1}/30...`)

      const pollRes = await fetch(
        `${BASE_URL}/generations/${generationId}`,
        {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${LEONARDO_API_KEY}`
          }
        }
      )

      const pollData = await pollRes.json()
      const generation = pollData?.generations_by_pk

      if (!generation) continue

      const status = generation.status
      console.log('  Status:', status)

      if (status === 'COMPLETE') {
        const images = generation.generated_images
        console.log(`✅ Done! ${images.length} image(s) generated`)
        
        return res.status(200).json({
          success: true,
          images: images,
          generationId: generationId,
          model: finalModelId
        })
      }

      if (status === 'FAILED') {
        return res.status(500).json({
          error: 'Generasi gambar gagal di server Leonardo'
        })
      }
    }

    return res.status(408).json({
      error: 'Timeout: Generasi terlalu lama. Silakan coba lagi.'
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return res.status(500).json({
      error: error.message || 'Internal server error'
    })
  }
}