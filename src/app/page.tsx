import Chat from "@/app/components/Chat";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Coinbase Agent Chat</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interact with the Coinbase Developer Platform AgentKit
          </p>
        </div>
        <Chat />
      </main>
    </div>
  );
}
