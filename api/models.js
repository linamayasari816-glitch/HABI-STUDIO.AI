// api/models.js
export default async function handler(req, res) {
  const response = await fetch(
    'https://cloud.leonardo.ai/api/rest/v1/platformModels',
    {
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${process.env.VITE_LEONARDO_API_KEY}`
      }
    }
  )
  const data = await response.json()
  res.json(data)
}