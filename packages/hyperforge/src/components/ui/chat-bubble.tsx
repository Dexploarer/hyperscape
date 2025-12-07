import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-neon-blue/20 text-white border border-neon-blue/50 rounded-br-none"
            : "bg-glass-bg backdrop-blur-md border border-glass-border text-gray-200 rounded-bl-none",
        )}
      >
        {content}
      </div>
    </div>
  );
}
