export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const LEONARDO_API_KEY = process.env.VITE_LEONARDO_API_KEY

  if (!LEONARDO_API_KEY) {
    return res.status(500).json({ error: 'API key tidak dikonfigurasi' })
  }

  try {
    const response = await fetch(
      'https://cloud.leonardo.ai/api/rest/v1/me',
      {
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${LEONARDO_API_KEY}`
        }
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}