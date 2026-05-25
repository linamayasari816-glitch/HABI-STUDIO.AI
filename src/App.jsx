import { useState } from 'react';

// Daftar model yang didukung dengan kategori dan ID backend
const MODEL_LIST = [
  // Image Models (V1 Endpoint)
  { id: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', name: 'Leonardo Diffusion XL', category: 'Image' },
  { id: '1e60896f-3c26-4296-8ecc-53e2afecc132', name: 'Leonardo Vision XL', category: 'Image' },
  { id: '5c232a9e-9061-4777-980b-ddc8e65647c3', name: 'Leonardo Kino XL', category: 'Image' },
  { id: '2067ae52-33fd-4a82-bb92-c2c55e7d2786', name: 'Leonardo Anime XL', category: 'Image' },
  { id: 'cd2b2a15-9760-4174-a5ff-4d2925057376', name: 'AlbedoBase XL', category: 'Image' },
  { id: 'b5d207b1-4d9f-4ce5-b2b3-3b42e5f5b0d8', name: 'Stable Diffusion 1.5', category: 'Image' },
  { id: 'e316348f-7773-490e-adcd-46757c738eb7', name: 'Stable Diffusion 2.1', category: 'Image' },
  { id: 'd69c8275-1f4e-4a49-9b75-bb67a2c5c4ec', name: 'PhotoReal V2', category: 'Image' },
  { id: 'aa77f04e-3eec-4034-9c07-d0f619684628', name: 'Leonardo Lightning XL', category: 'Image' },

  // Image Models (V2 Endpoint)
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana', category: 'Image V2' },
  { id: 'gpt-image-1.5', name: 'GPT Image-1.5', category: 'Image V2' },
  { id: 'ideogram-3.0', name: 'Ideogram 3.0', category: 'Image V2' },
  { id: 'seedream-4.0', name: 'Seedream 4.0', category: 'Image V2' },
  { id: 'seedream-4.5', name: 'Seedream 4.5', category: 'Image V2' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', category: 'Image V2' },

  // Video Models (V2 Endpoint)
  { id: 'kling-3.0', name: 'Kling 3.0', category: 'Video' },
  { id: 'kling-2.5', name: 'Kling 2.5 Turbo', category: 'Video' },
  { id: 'kling-2.6', name: 'Kling 2.6', category: 'Video' },
  { id: 'kling-o1', name: 'Kling O1', category: 'Video' },
  { id: 'kling-o3', name: 'Kling O3', category: 'Video' },

  // Video Models (Image-to-Video Endpoint)
  { id: 'VEO3_1', name: 'Veo 3.1', category: 'Video' },
  { id: 'VEO3_1FAST', name: 'Veo 3.1 Fast', category: 'Video' },
  { id: 'VEO3', name: 'Veo 3.0', category: 'Video' },
  { id: 'KLING2_1', name: 'Kling 2.1 Pro', category: 'Video' },
  { id: 'sora-2', name: 'Sora 2', category: 'Video' },
  { id: 'seedance-1.0', name: 'Seedance 1.0', category: 'Video' },
  { id: 'seedance-1.0-pro', name: 'Seedance 1.0 Pro', category: 'Video' },
  { id: 'seedance-1.0-pro-fast', name: 'Seedance 1.0 Pro Fast', category: 'Video' },
  { id: 'motion-2.0', name: 'Motion 2.0', category: 'Video' },
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODEL_LIST[0].id);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Prompt harus diisi');
      return;
    }
    setLoading(true);
    setError('');
    setImageUrl(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelId: selectedModel }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal generate gambar');
      }
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Kelompokkan model untuk dropdown
  const imageModels = MODEL_LIST.filter(m => m.category.startsWith('Image'));
  const videoModels = MODEL_LIST.filter(m => m.category === 'Video');

  return (
    <div className="app-container">
      <h1>🎨 Leonardo AI - All Models Hub</h1>

      <div className="input-group">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="model-select"
        >
          <optgroup label="🖼️ Image Models (Standard)">
            {imageModels.filter(m => m.category === 'Image').map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </optgroup>
          <optgroup label="🖼️ Image Models (V2)">
            {imageModels.filter(m => m.category === 'Image V2').map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </optgroup>
          <optgroup label="🎬 Video Models">
            {videoModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </optgroup>
        </select>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Masukkan prompt..."
          className="prompt-input"
        />
        <button onClick={generateImage} disabled={loading} className="generate-btn">
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {imageUrl && (
        <div className="image-result">
          <img src={imageUrl} alt="Generated" />
        </div>
      )}
    </div>
  );
}

export default App;