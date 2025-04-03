"use client"

import { Button } from "@/components/ui/button"

interface GameOverProps {
  score: number
  highScore: number
  onRestart: () => void
}

export default function GameOver({ score, highScore, onRestart }: GameOverProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700 min-h-[500px]">
      <h2 className="text-4xl font-bold text-red-500 mb-6">GAME OVER</h2>

      <div className="mb-8 text-center">
        <div className="text-white text-xl mb-2">
          Final Score: <span className="font-bold text-2xl">{score}</span>
        </div>
        <div className="text-slate-300">
          High Score: <span className="font-bold">{highScore}</span>
        </div>
      </div>

      {score === highScore && score > 0 && (
        <div className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-lg mb-6">🏆 New High Score! 🏆</div>
      )}

      <Button onClick={onRestart} className="bg-green-600 hover:bg-green-700 text-white">
        Play Again
      </Button>
    </div>
  )
}

