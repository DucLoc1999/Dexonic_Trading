"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ChatButtonProps {
  user: {
    id: string
    name: string
    email: string
    image: string
  } | null
}

export function ChatButton({ user }: ChatButtonProps) {
  const router = useRouter()

  // Don't show chat button if user is not authenticated
  if (!user) {
    return null
  }

  const handleChatClick = () => {
    router.push("/chat")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleChatClick}
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
      >
        <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
      </Button>
    </div>
  )
}
