import { Video, Clock } from 'lucide-react'

export default function VideoGenerator() {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Video size={28} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2">AI Video Generator</h2>
      <p className="text-gray-400 mb-4">
        Segera hadir! Integrasi dengan Google Veo & Grok
      </p>
      <div className="flex items-center justify-center gap-2 text-yellow-400">
        <Clock size={16} />
        <span className="text-sm">Coming Soon</span>
      </div>
    </div>
  )
}