export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Multi-Brand AI Agent System
        </h1>
        <p className="text-center text-lg mb-8">
          Cline-Powered Multi-Brand AI Agent System Dashboard
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">SaithavyS</h2>
            <p>Personal brand management and content generation</p>
          </div>
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Partly Office</h2>
            <p>Professional services and business content</p>
          </div>
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">G Prismo</h2>
            <p>Technology and innovation content</p>
          </div>
        </div>
      </div>
    </main>
  )
}
