import Chat from "@/app/components/Chat";
import { MotionHeader } from "./components/MotionHeader";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <MotionHeader />
        <Chat />
      </main>
    </div>
  );
}
