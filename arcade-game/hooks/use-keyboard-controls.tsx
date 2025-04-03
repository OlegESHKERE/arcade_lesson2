"use client"

import { useState, useEffect } from "react"

export function useKeyboardControls() {
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    shoot: false,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        setKeys((prev) => ({ ...prev, left: true }))
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        setKeys((prev) => ({ ...prev, right: true }))
      }
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        setKeys((prev) => ({ ...prev, shoot: true }))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        setKeys((prev) => ({ ...prev, left: false }))
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        setKeys((prev) => ({ ...prev, right: false }))
      }
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        setKeys((prev) => ({ ...prev, shoot: false }))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return keys
}

