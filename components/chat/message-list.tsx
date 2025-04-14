import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User } from "lucide-react"

type Message = {
  id: string
  content: string
  sender: "user" | "agent"
  timestamp: Date
}

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-start gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          {message.sender === "agent" && (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={`rounded-2xl px-4 py-3 max-w-[80%] ${
              message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            <p className="text-sm">{message.content}</p>
            <p className="text-xs opacity-70 mt-1">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {message.sender === "user" && (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
    </div>
  )
}
