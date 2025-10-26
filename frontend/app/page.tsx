export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">BridgeAI</h1>
      <p className="mt-4 text-lg">Your AI-powered PR & Log Translator</p>
      <div className="mt-8">
        <a href="/dashboard" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Go to Dashboard
        </a>
      </div>
    </main>
  )
}
