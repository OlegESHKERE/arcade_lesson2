import GameContainer from "@/components/game-container"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900">
      <h1 className="text-4xl font-bold text-center text-white mb-6">Space Defenders</h1>
      <GameContainer />
    </main>
  )
}

