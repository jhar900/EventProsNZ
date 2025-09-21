export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Event Pros NZ</h1>
        <p className="text-xl text-center mb-8">
          New Zealand&apos;s Event Ecosystem
        </p>
        <div className="text-center">
          <p className="mb-4">🚀 Next.js 14 + Supabase + TypeScript</p>
          <p className="mb-4">✅ Database schema applied</p>
          <p className="mb-4">✅ Vercel deployment ready</p>
          <p className="mb-6 text-green-600 font-semibold">
            Ready for development!
          </p>
          <div className="space-x-4">
            <a
              href="/demo"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test External Services
            </a>
            <a
              href="/maps-demo"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Maps Demo
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
