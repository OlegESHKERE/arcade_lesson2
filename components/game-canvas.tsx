"use client"

import { useRef, useEffect, useState } from "react"
import { useKeyboardControls } from "@/hooks/use-keyboard-controls"

// Game constants
const PLAYER_WIDTH = 50
const PLAYER_HEIGHT = 30
const PLAYER_SPEED = 5
const BULLET_WIDTH = 3
const BULLET_HEIGHT = 15
const BULLET_SPEED = 7
const ENEMY_WIDTH = 40
const ENEMY_HEIGHT = 30
const ENEMY_VERTICAL_SPACING = 50
const ENEMY_HORIZONTAL_SPACING = 60
const ENEMY_DROP_DISTANCE = 10
const ENEMY_FIRE_RATE = 0.005 // Chance of an enemy firing per frame
const POWER_UP_WIDTH = 20
const POWER_UP_HEIGHT = 20
const POWER_UP_SPEED = 2
const POWER_UP_DURATION = 10000 // 10 seconds

// Game types
type Bullet = {
  x: number
  y: number
  width: number
  height: number
}

type Enemy = {
  x: number
  y: number
  width: number
  height: number
  type: number
  health: number
}

type PowerUp = {
  x: number
  y: number
  width: number
  height: number
  type: "rapidFire" | "shield" | "multiShot"
}

type PowerUpActive = {
  type: "rapidFire" | "shield" | "multiShot"
  endTime: number
}

interface GameCanvasProps {
  incrementScore: (points: number) => void
  incrementLevel: () => void
  decrementLives: () => void
  level: number
  isPaused: boolean
  isGameOver: boolean
}

export default function GameCanvas({
  incrementScore,
  incrementLevel,
  decrementLives,
  level,
  isPaused,
  isGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const requestIdRef = useRef<number | null>(null)

  // Add this to the top of the component with the other refs
  const scoreIncrementRef = useRef<number>(0)

  // Game state
  const [playerX, setPlayerX] = useState(0)
  const [playerY, setPlayerY] = useState(0)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>([])
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [enemyDirection, setEnemyDirection] = useState(1) // 1 for right, -1 for left
  const [lastShotTime, setLastShotTime] = useState(0)
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [activePowerUps, setActivePowerUps] = useState<PowerUpActive[]>([])

  const { left, right, shoot } = useKeyboardControls()

  // Add this useRef to track game state changes
  const enemiesReachedBottomRef = useRef(false)

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const updateCanvasDimensions = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = 600
        setCanvasWidth(canvas.width)
        setCanvasHeight(canvas.height)
        setPlayerY(canvas.height - PLAYER_HEIGHT - 20)
        setPlayerX(canvas.width / 2 - PLAYER_WIDTH / 2)
      }
    }

    updateCanvasDimensions()
    window.addEventListener("resize", updateCanvasDimensions)

    // Initialize enemies
    initializeEnemies(level)

    return () => {
      window.removeEventListener("resize", updateCanvasDimensions)
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current)
      }
    }
  }, [level])

  // Game loop
  useEffect(() => {
    if (isPaused || isGameOver) return

    const render = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update player
      updatePlayer()

      // Update bullets
      updateBullets()

      // Update enemies - capture if enemies reached bottom
      const enemiesReachedBottom = updateEnemies()
      if (enemiesReachedBottom) {
        enemiesReachedBottomRef.current = true
      }

      // Update power-ups
      updatePowerUps()

      // Draw everything
      drawPlayer(ctx)
      drawBullets(ctx)
      drawEnemies(ctx)
      drawPowerUps(ctx)
      drawPowerUpIndicators(ctx)

      // Check collisions
      checkCollisions()

      // Check if level is completed
      if (enemies.length === 0) {
        incrementLevel()
        initializeEnemies(level + 1)
      }

      // Enemy shooting logic
      if (enemies.length > 0 && Math.random() < ENEMY_FIRE_RATE * (level * 0.5)) {
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)]
        fireEnemyBullet(randomEnemy)
      }

      requestIdRef.current = requestAnimationFrame(render)
    }

    requestIdRef.current = requestAnimationFrame(render)

    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current)
      }
    }
  }, [
    playerX,
    playerY,
    playerBullets,
    enemyBullets,
    enemies,
    enemyDirection,
    powerUps,
    activePowerUps,
    isPaused,
    isGameOver,
    level,
  ])

  // Add a separate useEffect to handle state updates outside the render phase
  useEffect(() => {
    // Check if enemies reached bottom and handle it
    if (enemiesReachedBottomRef.current) {
      decrementLives()
      initializeEnemies(level)
      enemiesReachedBottomRef.current = false
    }
  }, [enemies, decrementLives, level])

  // Add this useEffect after the other useEffect that handles enemiesReachedBottomRef
  useEffect(() => {
    // Check if we need to increment score
    if (scoreIncrementRef.current > 0) {
      incrementScore(scoreIncrementRef.current)
      scoreIncrementRef.current = 0
    }
  }, [incrementScore])

  // Handle keyboard input
  useEffect(() => {
    if (isPaused || isGameOver) return

    const handleKeyboard = () => {
      // Move player
      if (left && playerX > 0) {
        setPlayerX((prev) => prev - PLAYER_SPEED)
      }
      if (right && playerX < canvasWidth - PLAYER_WIDTH) {
        setPlayerX((prev) => prev + PLAYER_SPEED)
      }

      // Shooting
      if (shoot) {
        const now = Date.now()
        const fireRate = hasActivePowerUp("rapidFire") ? 150 : 300
        if (now - lastShotTime > fireRate) {
          if (hasActivePowerUp("multiShot")) {
            firePlayerBullet(playerX + PLAYER_WIDTH / 4, playerY)
            firePlayerBullet(playerX + PLAYER_WIDTH / 2, playerY)
            firePlayerBullet(playerX + (PLAYER_WIDTH * 3) / 4, playerY)
          } else {
            firePlayerBullet(playerX + PLAYER_WIDTH / 2, playerY)
          }
          setLastShotTime(now)
        }
      }
    }

    const interval = setInterval(handleKeyboard, 16) // ~60fps

    return () => clearInterval(interval)
  }, [left, right, shoot, playerX, playerY, canvasWidth, isPaused, isGameOver, lastShotTime, activePowerUps])

  // Create enemies based on level
  const initializeEnemies = (currentLevel: number) => {
    const newEnemies: Enemy[] = []
    const rows = Math.min(3 + Math.floor(currentLevel / 2), 6)
    const cols = Math.min(6 + Math.floor(currentLevel / 3), 10)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const enemyType = Math.min(Math.floor(currentLevel / 2), 3)
        const health = enemyType + 1

        newEnemies.push({
          x: col * ENEMY_HORIZONTAL_SPACING + 50,
          y: row * ENEMY_VERTICAL_SPACING + 50,
          width: ENEMY_WIDTH,
          height: ENEMY_HEIGHT,
          type: enemyType,
          health: health,
        })
      }
    }

    setEnemies(newEnemies)
    setEnemyDirection(1)
  }

  // Update player position
  const updatePlayer = () => {
    // Handled by keyboard controls
  }

  // Update bullets
  const updateBullets = () => {
    // Update player bullets
    setPlayerBullets((prevBullets) =>
      prevBullets
        .map((bullet) => ({
          ...bullet,
          y: bullet.y - BULLET_SPEED,
        }))
        .filter((bullet) => bullet.y + bullet.height > 0),
    )

    // Update enemy bullets
    setEnemyBullets((prevBullets) =>
      prevBullets
        .map((bullet) => ({
          ...bullet,
          y: bullet.y + BULLET_SPEED,
        }))
        .filter((bullet) => bullet.y < canvasHeight),
    )
  }

  // Replace the updateEnemies function with this version that uses a ref to track game state changes
  const updateEnemies = () => {
    if (enemies.length === 0) return

    let shouldChangeDirection = false
    let shouldMoveDown = false
    let enemiesReachedBottom = false

    // Check if enemies hit the edge
    enemies.forEach((enemy) => {
      if (
        (enemy.x + ENEMY_WIDTH + 5 >= canvasWidth && enemyDirection > 0) ||
        (enemy.x - 5 <= 0 && enemyDirection < 0)
      ) {
        shouldChangeDirection = true
        shouldMoveDown = true
      }

      // Check if enemies reached the bottom (player)
      if (enemy.y + ENEMY_HEIGHT >= playerY) {
        enemiesReachedBottom = true
      }
    })

    // Update enemy positions
    setEnemies((prevEnemies) =>
      prevEnemies.map((enemy) => ({
        ...enemy,
        x: enemy.x + (1 + level * 0.2) * enemyDirection,
        y: shouldMoveDown ? enemy.y + ENEMY_DROP_DISTANCE : enemy.y,
      })),
    )

    // Change direction if needed
    if (shouldChangeDirection) {
      setEnemyDirection((prev) => prev * -1)
    }

    // Handle enemies reaching bottom - but don't call setState directly
    if (enemiesReachedBottom) {
      // We'll handle this in useEffect
      return true
    }

    return false
  }

  // Update power-ups
  const updatePowerUps = () => {
    setPowerUps((prevPowerUps) =>
      prevPowerUps
        .map((powerUp) => ({
          ...powerUp,
          y: powerUp.y + POWER_UP_SPEED,
        }))
        .filter((powerUp) => powerUp.y < canvasHeight),
    )
  }

  // Create a player bullet
  const firePlayerBullet = (x: number, y: number) => {
    const newBullet: Bullet = {
      x: x - BULLET_WIDTH / 2,
      y: y,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
    }

    setPlayerBullets((prev) => [...prev, newBullet])
  }

  // Create an enemy bullet
  const fireEnemyBullet = (enemy: Enemy) => {
    const newBullet: Bullet = {
      x: enemy.x + enemy.width / 2 - BULLET_WIDTH / 2,
      y: enemy.y + enemy.height,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
    }

    setEnemyBullets((prev) => [...prev, newBullet])
  }

  // Check if rectangle 1 intersects with rectangle 2
  const checkCollision = (rect1: any, rect2: any) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  }

  // Check all collisions
  const checkCollisions = () => {
    // Player bullets vs enemies
    setPlayerBullets((prevBullets) => {
      let remainingBullets = [...prevBullets]

      setEnemies((prevEnemies) => {
        let modifiedEnemies = [...prevEnemies]

        remainingBullets = remainingBullets.filter((bullet) => {
          let bulletHit = false

          modifiedEnemies = modifiedEnemies
            .map((enemy) => {
              if (!bulletHit && checkCollision(bullet, enemy)) {
                bulletHit = true

                // Reduce enemy health
                const newHealth = enemy.health - 1

                // Replace the "Enemy destroyed" section in checkCollisions with this:
                if (newHealth <= 0) {
                  // Enemy destroyed - add to score ref instead of calling incrementScore directly
                  scoreIncrementRef.current += 10 * (enemy.type + 1)

                  // Chance to drop a power-up (20%)
                  if (Math.random() < 0.2) {
                    dropPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
                  }

                  // Remove enemy
                  return null
                }

                // Enemy damaged
                return { ...enemy, health: newHealth }
              }
              return enemy
            })
            .filter(Boolean) as Enemy[]

          return !bulletHit
        })

        return modifiedEnemies
      })

      return remainingBullets
    })

    // Enemy bullets vs player
    setEnemyBullets((prevBullets) => {
      const player = {
        x: playerX,
        y: playerY,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
      }

      let remainingBullets = [...prevBullets]
      let playerHit = false

      remainingBullets = remainingBullets.filter((bullet) => {
        if (checkCollision(bullet, player)) {
          if (!hasActivePowerUp("shield")) {
            playerHit = true
          }
          return false
        }
        return true
      })

      // Set a ref to handle the player hit outside the render cycle
      if (playerHit) {
        enemiesReachedBottomRef.current = true
      }

      return remainingBullets
    })

    // Player vs power-ups
    setPowerUps((prevPowerUps) => {
      const player = {
        x: playerX,
        y: playerY,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
      }

      const remainingPowerUps = prevPowerUps.filter((powerUp) => {
        if (checkCollision(powerUp, player)) {
          activatePowerUp(powerUp.type)
          return false
        }
        return true
      })

      return remainingPowerUps
    })
  }

  // Drop a power-up at the specified position
  const dropPowerUp = (x: number, y: number) => {
    const powerUpTypes: Array<"rapidFire" | "shield" | "multiShot"> = ["rapidFire", "shield", "multiShot"]
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]

    const newPowerUp: PowerUp = {
      x: x - POWER_UP_WIDTH / 2,
      y: y - POWER_UP_HEIGHT / 2,
      width: POWER_UP_WIDTH,
      height: POWER_UP_HEIGHT,
      type: randomType,
    }

    setPowerUps((prev) => [...prev, newPowerUp])
  }

  // Activate a power-up
  const activatePowerUp = (type: "rapidFire" | "shield" | "multiShot") => {
    const endTime = Date.now() + POWER_UP_DURATION

    setActivePowerUps((prev) => {
      // Remove any existing power-up of the same type
      const filtered = prev.filter((p) => p.type !== type)

      // Add the new power-up
      return [...filtered, { type, endTime }]
    })
  }

  // Check if a specific power-up is active
  const hasActivePowerUp = (type: "rapidFire" | "shield" | "multiShot") => {
    const now = Date.now()
    return activePowerUps.some((p) => p.type === type && p.endTime > now)
  }

  // Draw the player
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = hasActivePowerUp("shield") ? "#4facfe" : "#f43f5e"

    // Draw the ship body
    ctx.beginPath()
    ctx.moveTo(playerX + PLAYER_WIDTH / 2, playerY)
    ctx.lineTo(playerX + PLAYER_WIDTH, playerY + PLAYER_HEIGHT)
    ctx.lineTo(playerX, playerY + PLAYER_HEIGHT)
    ctx.closePath()
    ctx.fill()

    // Draw the cockpit
    ctx.fillStyle = "#60a5fa"
    ctx.fillRect(playerX + PLAYER_WIDTH / 2 - 5, playerY + 10, 10, 10)

    // Draw shield if active
    if (hasActivePowerUp("shield")) {
      ctx.strokeStyle = "#4facfe"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(playerX + PLAYER_WIDTH / 2, playerY + PLAYER_HEIGHT / 2, PLAYER_WIDTH / 1.5, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // Draw all bullets
  const drawBullets = (ctx: CanvasRenderingContext2D) => {
    // Draw player bullets
    ctx.fillStyle = "#22d3ee"
    playerBullets.forEach((bullet) => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
    })

    // Draw enemy bullets
    ctx.fillStyle = "#fb923c"
    enemyBullets.forEach((bullet) => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
    })
  }

  // Draw all enemies
  const drawEnemies = (ctx: CanvasRenderingContext2D) => {
    const colors = ["#818cf8", "#fb7185", "#34d399", "#f97316"]

    enemies.forEach((enemy) => {
      ctx.fillStyle = colors[enemy.type % colors.length]

      // Draw different enemy shapes based on type
      switch (enemy.type) {
        case 0: // Basic enemy
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
          break
        case 1: // Triangle enemy
          ctx.beginPath()
          ctx.moveTo(enemy.x + enemy.width / 2, enemy.y)
          ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height)
          ctx.lineTo(enemy.x, enemy.y + enemy.height)
          ctx.closePath()
          ctx.fill()
          break
        case 2: // Circle enemy
          ctx.beginPath()
          ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2)
          ctx.fill()
          break
        default: // Advanced enemy
          ctx.beginPath()
          ctx.moveTo(enemy.x, enemy.y + enemy.height / 2)
          ctx.lineTo(enemy.x + enemy.width / 3, enemy.y)
          ctx.lineTo(enemy.x + (enemy.width * 2) / 3, enemy.y)
          ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 2)
          ctx.lineTo(enemy.x + (enemy.width * 2) / 3, enemy.y + enemy.height)
          ctx.lineTo(enemy.x + enemy.width / 3, enemy.y + enemy.height)
          ctx.closePath()
          ctx.fill()
      }

      // Draw health indicator
      ctx.fillStyle = "#fff"
      for (let i = 0; i < enemy.health; i++) {
        ctx.fillRect(enemy.x + 5 + i * 7, enemy.y - 8, 5, 3)
      }
    })
  }

  // Draw all power-ups
  const drawPowerUps = (ctx: CanvasRenderingContext2D) => {
    powerUps.forEach((powerUp) => {
      let color = "#fff"

      switch (powerUp.type) {
        case "rapidFire":
          color = "#f43f5e" // Red
          break
        case "shield":
          color = "#4facfe" // Blue
          break
        case "multiShot":
          color = "#a855f7" // Purple
          break
      }

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.width / 2, 0, Math.PI * 2)
      ctx.fill()

      // Draw inner circle
      ctx.fillStyle = "#fff"
      ctx.beginPath()
      ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.width / 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  // Draw power-up indicators
  const drawPowerUpIndicators = (ctx: CanvasRenderingContext2D) => {
    const now = Date.now()
    const indicatorWidth = 50
    const indicatorHeight = 5
    const spacing = 10

    activePowerUps.forEach((powerUp, index) => {
      let color = "#fff"
      let label = ""

      switch (powerUp.type) {
        case "rapidFire":
          color = "#f43f5e" // Red
          label = "RAPID"
          break
        case "shield":
          color = "#4facfe" // Blue
          label = "SHIELD"
          break
        case "multiShot":
          color = "#a855f7" // Purple
          label = "MULTI"
          break
      }

      const timeLeft = powerUp.endTime - now
      const percentage = Math.max(0, timeLeft / POWER_UP_DURATION)

      // Draw label
      ctx.fillStyle = "#fff"
      ctx.font = "10px Arial"
      ctx.fillText(label, 10, canvasHeight - 30 - index * (indicatorHeight + spacing + 15))

      // Draw background
      ctx.fillStyle = "#333"
      ctx.fillRect(10, canvasHeight - 25 - index * (indicatorHeight + spacing + 15), indicatorWidth, indicatorHeight)

      // Draw progress
      ctx.fillStyle = color
      ctx.fillRect(
        10,
        canvasHeight - 25 - index * (indicatorHeight + spacing + 15),
        indicatorWidth * percentage,
        indicatorHeight,
      )
    })
  }

  return <canvas ref={canvasRef} className="bg-slate-800 rounded-lg shadow-xl border border-slate-700" />
}

