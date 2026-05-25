// ✅ MODEL ID VALID DARI DOCS RESMI LEONARDO.AI
// Source: https://docs.leonardo.ai/docs/list-of-models

export const LEONARDO_MODELS = [
  {
    id: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
    name: 'Leonardo Phoenix 1.0',
    description: 'Model terbaik, paling canggih',
    category: 'Flagship',
    recommended: true
  },
  {
    id: 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
    name: 'Leonardo Phoenix 0.9',
    description: 'Balanced quality & speed',
    category: 'Flagship',
    recommended: false
  },
  {
    id: 'aa77f04e-3eec-4034-9570-3e2e1f589935',
    name: 'Leonardo Lightning XL',
    description: 'Ultra fast generation',
    category: 'Fast',
    recommended: false
  },
  {
    id: '1e60896f-3c26-4296-8ecc-53e2afecc132',
    name: 'Leonardo Diffusion XL',
    description: 'High quality XL images',
    category: 'Quality',
    recommended: false
  },
  {
    id: '2067ae52-33fd-4a82-bb92-c0c130811ef8',
    name: 'AlbedoBase XL',
    description: 'High detail photorealistic',
    category: 'Realistic',
    recommended: false
  },
  {
    id: 'e71a1c2f-4f80-4800-934f-2c68979d1cc6',
    name: 'Anime Pastel Dream',
    description: 'Gaya anime & ilustrasi',
    category: 'Anime',
    recommended: false
  },
  {
    id: '1aa0f478-ccbe-4490-af15-18ecfc421028',
    name: 'DreamShaper v7',
    description: 'Artistic & realistic blend',
    category: 'Artistic',
    recommended: false
  },
  {
    id: 'b63f7119-31dc-4540-969b-2a9df997e173',
    name: 'Absolute Reality v1.6',
    description: 'Fotorealistik tinggi',
    category: 'Realistic',
    recommended: false
  },
  {
    id: '291be633-cb24-434f-898f-e662799936ad',
    name: 'Leonardo Diffusion',
    description: 'Model Leonardo klasik',
    category: 'Classic',
    recommended: false
  }
]

// Generate image via Vercel API route
export const generateImage = async ({
  prompt,
  modelId = 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
  width = 1024,
  height = 1024,
  numImages = 1,
  negative_prompt = ''
}) => {
  console.log('🎨 Calling generate API...')
  console.log('Model ID:', modelId)
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      modelId,
      width,
      height,
      num_images: numImages,
      negative_prompt
    })
  })

  const data = await response.json()
  console.log('📬 API Response:', data)

  if (!response.ok) {
    throw new Error(data.error || `HTTP Error ${response.status}`)
  }

  if (!data.images || data.images.length === 0) {
    throw new Error('Tidak ada gambar yang dihasilkan')
  }

  return data.images
}

// Get user info
export const getUserInfo = async () => {
  const response = await fetch('/api/user-info')
  if (!response.ok) throw new Error('Gagal ambil info user')
  return response.json()
}