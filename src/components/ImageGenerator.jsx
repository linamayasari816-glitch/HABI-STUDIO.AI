import { useState } from 'react'
import { 
  Image, Wand2, Download, RefreshCw, 
  ChevronDown, Settings, Loader2, AlertCircle
} from 'lucide-react'
import { generateImage, LEONARDO_MODELS } from '../services/leonardo'

const SIZES = [
  { label: 'Square 1:1', width: 1024, height: 1024 },
  { label: 'Portrait 3:4', width: 768, height: 1024 },
  { label: 'Landscape 4:3', width: 1024, height: 768 },
  { label: 'Wide 16:9', width: 1024, height: 576 },
  { label: 'Tall 9:16', width: 576, height: 1024 },
]

const CATEGORY_COLORS = {
  'Flagship': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Fast': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Quality': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Anime': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Artistic': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Realistic': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState(LEONARDO_MODELS[0])
  const [selectedSize, setSelectedSize] = useState(SIZES[0])
  const [numImages, setNumImages] = useState(1)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [progress, setProgress] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Masukkan prompt terlebih dahulu!')
      return
    }

    setLoading(true)
    setError('')
    setImages([])
    setProgress('Mengirim permintaan...')

    try {
      setProgress('Membuat gambar... (bisa 10-30 detik)')
      
      const result = await generateImage({
        prompt: prompt.trim(),
        modelId: selectedModel.id,
        width: selectedSize.width,
        height: selectedSize.height,
        numImages,
        negative_prompt: negativePrompt
      })

      setImages(result)
      setProgress('')
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat generate')
      setProgress('')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (url, index) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `ai-image-${Date.now()}-${index}.jpg`
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Image size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Image Generator</h2>
            <p className="text-gray-400 text-sm">Powered by Leonardo.ai</p>
          </div>
        </div>

        {/* Model Selector */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Model AI</label>
          <div className="relative">
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className="w-full input-field flex items-center justify-between text-left"
            >
              <div>
                <div className="font-medium">{selectedModel.name}</div>
                <div className="text-xs text-gray-500">{selectedModel.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedModel.category]}`}>
                  {selectedModel.category}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </button>

            {showModelSelect && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-2xl max-h-64 overflow-y-auto">
                {LEONARDO_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model)
                      setShowModelSelect(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                      selectedModel.id === model.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-gray-400">{model.description}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[model.category]}`}>
                      {model.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prompt */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Deskripsikan gambar yang ingin dibuat... contoh: a beautiful sunset over mountains, photorealistic, 8k"
            className="input-field resize-none h-28"
            disabled={loading}
          />
        </div>

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <Settings size={14} />
          Pengaturan Lanjutan
          <ChevronDown size={14} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </button>

        {/* Advanced Settings */}
        {showSettings && (
          <div className="space-y-4 mb-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            {/* Size */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Ukuran Gambar</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size.label}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      selectedSize.label === size.label
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {size.label}
                    <div className="text-gray-400 text-xs">{size.width}×{size.height}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Num Images */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Jumlah Gambar: {numImages}
              </label>
              <input
                type="range"
                min="1"
                max="4"
                value={numImages}
                onChange={(e) => setNumImages(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span><span>2</span><span>3</span><span>4</span>
              </div>
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Negative Prompt</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Apa yang tidak ingin ada di gambar... contoh: blurry, ugly, watermark"
                className="input-field resize-none h-16 text-sm"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="btn-primary w-full text-lg py-4"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {progress || 'Generating...'}
            </>
          ) : (
            <>
              <Wand2 size={20} />
              Generate Gambar
            </>
          )}
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: numImages }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl shimmer" />
          ))}
        </div>
      )}

      {/* Results */}
      {images.length > 0 && !loading && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-300">
              {images.length} Gambar Dihasilkan ✨
            </h3>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              Generate Ulang
            </button>
          </div>

          <div className={`grid gap-4 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {images.map((img, i) => (
              <div key={img.id || i} className="relative group rounded-2xl overflow-hidden bg-gray-900">
                <img
                  src={img.url}
                  alt={`Generated ${i + 1}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleDownload(img.url, i)}
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    onClick={() => window.open(img.url, '_blank')}
                    className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                  >
                    <Image size={16} />
                    Lihat Full
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}