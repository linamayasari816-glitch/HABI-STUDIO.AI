const LEONARDO_API_KEY = import.meta.env.VITE_LEONARDO_API_KEY

const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1'

const getHeaders = () => ({
  'accept': 'application/json',
  'content-type': 'application/json',
  'authorization': `Bearer ${LEONARDO_API_KEY}`
})

// ✅ MODEL ID RESMI DARI LEONARDO.AI DOCS
export const LEONARDO_MODELS = [
  {
    id: 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
    name: 'Leonardo Phoenix 1.0',
    description: 'Model terbaik, general purpose',
    category: 'Flagship'
  },
  {
    id: '6b645e3a-d64f-4341-a6d8-7a3690fbf042',
    name: 'Leonardo Phoenix 0.9',
    description: 'Balanced quality & speed',
    category: 'Flagship'
  },
  {
    id: 'aa77f04e-3eec-4034-9570-3e2e1f589935',
    name: 'Leonardo Lightning XL',
    description: 'Ultra fast generation',
    category: 'Fast'
  },
  {
    id: '1e60896f-3c26-4296-8ecc-53e2afecc132',
    name: 'Leonardo Diffusion XL',
    description: 'High quality XL images',
    category: 'Quality'
  },
  {
    id: '2067ae52-33fd-4a82-bb92-c0c130811ef8',
    name: 'AlbedoBase XL',
    description: 'High detail photorealistic',
    category: 'Realistic'
  },
  {
    id: 'e71a1c2f-4f80-4800-934f-2c68979d1cc6',
    name: 'Anime Pastel Dream',
    description: 'Gaya anime & ilustrasi',
    category: 'Anime'
  },
  {
    id: '1aa0f478-ccbe-4490-af15-18ecfc421028',
    name: 'DreamShaper v7',
    description: 'Artistic & realistic blend',
    category: 'Artistic'
  },
  {
    id: 'ac614f96-1082-45bf-be9d-757f2d31c174',
    name: 'DreamShaper v6',
    description: 'Classic artistic style',
    category: 'Artistic'
  },
  {
    id: 'b63f7119-31dc-4540-969b-2a9df997e173',
    name: 'Absolute Reality v1.6',
    description: 'Photorealistic images',
    category: 'Realistic'
  },
  {
    id: '291be633-cb24-434f-898f-e662799936ad',
    name: 'Leonardo Diffusion',
    description: 'Classic Leonardo model',
    category: 'Classic'
  }
]

// ✅ Generate Image - FIXED VERSION
export const generateImage = async ({
  prompt,
  modelId = 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
  width = 1024,
  height = 1024,
  numImages = 1,
  negative_prompt = ''
}) => {
  try {
    console.log('🚀 Starting generation with model:', modelId)
    console.log('📝 Prompt:', prompt)

    // ✅ Build body - hanya kirim field yang diperlukan
    const body = {
      prompt: prompt,
      modelId: modelId,
      width: width,
      height: height,
      num_images: numImages,
    }

    // Tambah negative prompt hanya jika ada isinya
    if (negative_prompt && negative_prompt.trim()) {
      body.negative_prompt = negative_prompt.trim()
    }

    console.log('📦 Request body:', JSON.stringify(body))

    // Step 1: Create generation
    const createRes = await fetch(`${BASE_URL}/generations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    })

    const createData = await createRes.json()
    console.log('📬 Create response:', createData)

    if (!createRes.ok) {
      throw new Error(
        createData.error || 
        createData.message || 
        `HTTP Error ${createRes.status}`
      )
    }

    const generationId = createData.sdGenerationJob?.generationId

    if (!generationId) {
      console.error('Full response:', createData)
      throw new Error('Tidak mendapat ID generasi dari server')
    }

    console.log('✅ Generation ID:', generationId)

    // Step 2: Poll hasil
    return await pollGeneration(generationId)

  } catch (error) {
    console.error('❌ Leonardo API Error:', error)
    throw error
  }
}

// Poll sampai selesai
const pollGeneration = async (generationId, maxAttempts = 30) => {
  console.log('🔄 Polling generation:', generationId)
  
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000)

    const res = await fetch(
      `${BASE_URL}/generations/${generationId}`,
      { headers: getHeaders() }
    )

    if (!res.ok) {
      throw new Error('Gagal mengambil hasil generasi')
    }

    const data = await res.json()
    const generation = data.generations_by_pk

    if (!generation) {
      throw new Error('Data generasi tidak ditemukan')
    }

    const status = generation.status
    console.log(`⏳ Poll ${i + 1}/${maxAttempts} - Status: ${status}`)

    if (status === 'COMPLETE') {
      console.log('✅ Generation complete!', generation.generated_images)
      return generation.generated_images
    } else if (status === 'FAILED') {
      throw new Error('Generasi gambar gagal di server Leonardo')
    }
    // PENDING → lanjut polling
  }

  throw new Error('Timeout: Generasi terlalu lama (60 detik)')
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Get user info & token balance
export const getUserInfo = async () => {
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      headers: getHeaders()
    })
    if (!res.ok) throw new Error('Gagal ambil info user')
    return await res.json()
  } catch (error) {
    console.error('Get user error:', error)
    throw error
  }
}