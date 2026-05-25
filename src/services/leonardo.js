const LEONARDO_API_KEY = import.meta.env.VITE_LEONARDO_API_KEY

const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1'

// Headers
const getHeaders = () => ({
  'accept': 'application/json',
  'content-type': 'application/json',
  'authorization': `Bearer ${LEONARDO_API_KEY}`
})

// Model list yang tersedia
export const LEONARDO_MODELS = [
  {
    id: 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
    name: 'Leonardo Phoenix 1.0',
    description: 'Model terbaik, general purpose',
    category: 'Flagship'
  },
  {
    id: 'aa77f04e-3eec-4034-9570-3e2e1f589935',
    name: 'Leonardo Phoenix 0.9',
    description: 'Balanced quality & speed',
    category: 'Flagship'
  },
  {
    id: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
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
    id: 'b63f7119-31dc-4540-969b-2a9df997e173',
    name: 'Absolute Reality v1.6',
    description: 'Photorealistic images',
    category: 'Realistic'
  },
  {
    id: '2067ae52-33fd-4a82-bb92-c0c130811ef8',
    name: 'AlbedoBase XL',
    description: 'High detail photorealistic',
    category: 'Realistic'
  }
]

// Generate Image
export const generateImage = async ({
  prompt,
  modelId = 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
  width = 1024,
  height = 1024,
  numImages = 1,
  guidanceScale = 7,
  promptMagic = false,
  negative_prompt = ''
}) => {
  try {
    // Step 1: Create generation
    const createRes = await fetch(`${BASE_URL}/generations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        prompt,
        modelId,
        width,
        height,
        num_images: numImages,
        guidance_scale: guidanceScale,
        prompt_magic: promptMagic,
        negative_prompt: negative_prompt || undefined,
        num_inference_steps: 10
      })
    })

    if (!createRes.ok) {
      const err = await createRes.json()
      throw new Error(err.message || 'Gagal membuat generasi')
    }

    const createData = await createRes.json()
    const generationId = createData.sdGenerationJob?.generationId

    if (!generationId) throw new Error('Tidak dapat ID generasi')

    // Step 2: Poll untuk hasil
    return await pollGeneration(generationId)

  } catch (error) {
    console.error('Leonardo API Error:', error)
    throw error
  }
}

// Poll sampai selesai
const pollGeneration = async (generationId, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000) // tunggu 2 detik

    const res = await fetch(`${BASE_URL}/generations/${generationId}`, {
      headers: getHeaders()
    })

    if (!res.ok) throw new Error('Gagal mengambil hasil')

    const data = await res.json()
    const generation = data.generations_by_pk

    if (!generation) throw new Error('Data generasi tidak ditemukan')

    const status = generation.status

    if (status === 'COMPLETE') {
      return generation.generated_images
    } else if (status === 'FAILED') {
      throw new Error('Generasi gagal')
    }

    // Masih PENDING, lanjut polling
    console.log(`Polling ${i + 1}/${maxAttempts} - Status: ${status}`)
  }

  throw new Error('Timeout: Generasi terlalu lama')
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Get user info
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