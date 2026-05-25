import { Sparkles, Github } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg">AI Studio</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 hidden sm:block">
            Powered by Leonardo.ai
          </span>
          <a 
            href="https://github.com" 
            target="_blank"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Github size={20} />
          </a>
        </div>
      </div>
    </nav>
  )
}
