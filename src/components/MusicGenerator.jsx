import { Music, Clock } from 'lucide-react'

export default function MusicGenerator() {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Music size={28} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2">AI Music Generator</h2>
      <p className="text-gray-400 mb-4">
        Segera hadir! Integrasi dengan Suno AI
      </p>
      <div className="flex items-center justify-center gap-2 text-yellow-400">
        <Clock size={16} />
        <span className="text-sm">Coming Soon</span>
      </div>
    </div>
  )
}