"use client"

import { useState, useEffect } from "react"
import GameCanvas from "./game-canvas"
import GameUI from "./game-ui"
import GameOver from "./game-over"

export default function GameContainer() {
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [highScore, setHighScore] = useState(0)

  useEffect(() => {
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem("spaceDefendersHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }
  }, [])

  const incrementScore = (points: number) => {
    setScore((prev) => prev + points)
  }

  const incrementLevel = () => {
    setLevel((prev) => prev + 1)
  }

  const decrementLives = () => {
    setLives((prev) => {
      const newLives = prev - 1
      if (newLives <= 0) {
        handleGameOver()
      }
      return newLives
    })
  }

  const handleGameOver = () => {
    setIsGameOver(true)
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("spaceDefendersHighScore", score.toString())
    }
  }

  const resetGame = () => {
    setScore(0)
    setLevel(1)
    setLives(3)
    setIsGameOver(false)
  }

  const togglePause = () => {
    setIsPaused((prev) => !prev)
  }

  return (
    <div className="relative w-full max-w-2xl">
      {isGameOver ? (
        <GameOver score={score} highScore={highScore} onRestart={resetGame} />
      ) : (
        <>
          <GameUI score={score} level={level} lives={lives} isPaused={isPaused} onPauseToggle={togglePause} />
          <GameCanvas
            incrementScore={incrementScore}
            incrementLevel={incrementLevel}
            decrementLives={decrementLives}
            level={level}
            isPaused={isPaused}
            isGameOver={isGameOver}
          />
        </>
      )}
    </div>
  )
}

