import { useState } from 'react';
import './App.css';

const MODEL_LIST = [
  // Image Models
  { id: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', name: 'Leonardo Diffusion XL', category: 'Image' },
  { id: '1e60896f-3c26-4296-8ecc-53e2afecc132', name: 'Leonardo Vision XL', category: 'Image' },
  { id: '5c232a9e-9061-4777-980b-ddc8e65647c3', name: 'Leonardo Kino XL', category: 'Image' },
  { id: '2067ae52-33fd-4a82-bb92-c2c55e7d2786', name: 'Leonardo Anime XL', category: 'Image' },
  { id: 'aa77f04e-3eec-4034-9c07-d0f619684628', name: 'Leonardo Lightning XL', category: 'Image' },
  { id: 'cd2b2a15-9760-4174-a5ff-4d2925057376', name: 'AlbedoBase XL', category: 'Image' },
  { id: 'b5d207b1-4d9f-4ce5-b2b3-3b42e5f5b0d8', name: 'Stable Diffusion 1.5', category: 'Image' },
  { id: 'e316348f-7773-490e-adcd-46757c738eb7', name: 'Stable Diffusion 2.1', category: 'Image' },
  { id: 'd69c8275-1f4e-4a49-9b75-bb67a2c5c4ec', name: 'PhotoReal V2', category: 'Image' },
  { id: '8b1e621b-5b2d-4b2f-8e1e-8e0f1b6e7f7d', name: 'Alchemy V2', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1b', name: 'Lucid Origin', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1c', name: 'Lucid Realism', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1d', name: 'Phoenix 0.9', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1e', name: 'Phoenix 1.0', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b1f', name: 'FLUX Dev', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b20', name: 'FLUX Schnell', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b21', name: 'FLUX.1 Kontext [pro]', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b22', name: 'FLUX.2 Pro', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b23', name: 'GPT Image-1.5', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b24', name: 'Ideogram 3.0', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b25', name: 'Nano Banana', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b26', name: 'Nano Banana Pro', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b27', name: 'Seedream 4.0', category: 'Image' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b28', name: 'Seedream 4.5', category: 'Image' },

  // Video Models
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b29', name: 'Veo 3.0', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b30', name: 'Veo 3.1', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b31', name: 'Veo 3.1 Fast', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b32', name: 'Sora 2', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b33', name: 'Kling 2.1 Pro', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b34', name: 'Kling 2.5 Turbo', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b35', name: 'Kling 2.6', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b36', name: 'Kling 3.0', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b37', name: 'Kling O1', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b38', name: 'Kling O3', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b39', name: 'Seedance 1.0', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b40', name: 'Seedance 1.0 Pro', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b41', name: 'Seedance 1.0 Pro Fast', category: 'Video' },
  { id: 'f3b1c1b1-1b1b-4b1b-8b1b-1b1b1b1b1b42', name: 'Motion 2.0', category: 'Video' },
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

  return (
    <div className="app-container">
      <h1>🎨 Leonardo AI - All Models Hub</h1>

      <div className="input-group">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="model-select"
        >
          {MODEL_LIST.map((model) => (
            <option key={model.id} value={model.id}>
              {model.category === 'Video' ? '🎬' : '🖼️'} {model.name}
            </option>
          ))}
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