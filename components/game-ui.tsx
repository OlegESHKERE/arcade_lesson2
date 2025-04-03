"use client"

import { Button } from "@/components/ui/button"
import { Pause, Play } from "lucide-react"

interface GameUIProps {
  score: number
  level: number
  lives: number
  isPaused: boolean
  onPauseToggle: () => void
}

export default function GameUI({ score, level, lives, isPaused, onPauseToggle }: GameUIProps) {
  return (
    <div className="flex items-center justify-between p-2 mb-2 bg-slate-800 rounded-lg shadow-md border border-slate-700">
      <div className="flex items-center space-x-6">
        <div className="text-white">
          <span className="text-xs text-slate-400">SCORE</span>
          <div className="text-xl font-bold">{score}</div>
        </div>
        <div className="text-white">
          <span className="text-xs text-slate-400">LEVEL</span>
          <div className="text-xl font-bold">{level}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="text-white mr-4">
          <span className="text-xs text-slate-400">LIVES</span>
          <div className="flex space-x-1">
            {Array.from({ length: lives }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-red-500 rounded-full"></div>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onPauseToggle}
          className="bg-slate-700 border-slate-600 hover:bg-slate-600"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

