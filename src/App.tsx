function App() {
  return (
    <div className="min-h-dvh bg-surface text-body font-sans flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-display text-4xl">
        The Dream <span className="text-primary">Tea</span>m
      </h1>
      <p className="font-script text-xl">feat. Marin</p>
      <div className="flex gap-4">
        <span className="bg-primary text-white px-3 py-1 rounded">bg-primary</span>
        <span className="bg-surface text-body border border-body/20 px-3 py-1 rounded">bg-surface</span>
      </div>
    </div>
  )
}

export default App
