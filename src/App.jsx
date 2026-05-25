import { useState } from 'react'
import Navbar from './components/Navbar'
import ImageGenerator from './components/ImageGenerator'
import VideoGenerator from './components/VideoGenerator'
import MusicGenerator from './components/MusicGenerator'
import { Image, Video, Music } from 'lucide-react'

const tabs = [
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'music', label: 'Music', icon: Music },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('image')

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      {/* Hero */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Generator Studio
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Generate gambar, video, dan musik dengan kecerdasan buatan
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 px-4 mb-8">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === id ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {activeTab === 'image' && <ImageGenerator />}
        {activeTab === 'video' && <VideoGenerator />}
        {activeTab === 'music' && <MusicGenerator />}
      </div>
    </div>
  )
}