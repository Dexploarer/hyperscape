export default function Page() {
  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-4xl font-bold mb-4 tracking-tight text-neon-primary">
        ADMIN PANEL COMMAND CENTER
      </h1>
      <div className="glass-panel p-6 rounded-lg max-w-2xl">
        <p className="text-xl mb-4">
          Visual World Editor & Server Configuration
        </p>
        <div className="flex gap-4">
          <button className="glass-button px-4 py-2 rounded text-neon-secondary font-mono tracking-wider uppercase">
            Initialize Session
          </button>
        </div>
      </div>
    </main>
  );
}
