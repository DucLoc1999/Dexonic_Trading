"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Send, Settings, Smile, Paperclip, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GunChatService } from "@/lib/gun-chat"

interface Message {
  id: string
  text: string
  user: {
    id: string
    name: string
    image: string
  }
  timestamp: number
  type: "text" | "system"
}

interface ChatUser {
  id: string
  name: string
  image: string
  online: boolean
  lastSeen: number
}

interface ChatWindowProps {
  user: {
    id: string
    name: string
    email: string
    image: string
  }
  onClose: () => void
}

export function ChatWindow({ user, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const [currentRoom, setCurrentRoom] = useState("general")
  const [isConnecting, setIsConnecting] = useState(true)
  const [chatService, setChatService] = useState<GunChatService | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Available chat rooms
  const rooms = [
    { id: "general", name: "General", icon: "💬" },
    { id: "trading", name: "Trading", icon: "📈" },
    { id: "defi", name: "DeFi", icon: "🏦" },
    { id: "aptos", name: "Aptos", icon: "🚀" },
  ]

  useEffect(() => {
    // Initialize GUN chat service
    const initChat = async () => {
      try {
        const service = new GunChatService()
        await service.initialize(user)
        setChatService(service)

        // Subscribe to messages
        service.onMessage((message: Message) => {
          setMessages((prev) => [...prev, message])
        })

        // Subscribe to user presence
        service.onUserPresence((users: ChatUser[]) => {
          setOnlineUsers(users)
        })

        // Join default room
        await service.joinRoom(currentRoom)
        setIsConnecting(false)

        // Add welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: `Welcome to AptosSwap Chat! 🎉`,
          user: {
            id: "system",
            name: "System",
            image: "/placeholder.svg?height=32&width=32",
          },
          timestamp: Date.now(),
          type: "system",
        }
        setMessages([welcomeMessage])
      } catch (error) {
        console.error("Failed to initialize chat:", error)
        setIsConnecting(false)
      }
    }

    initChat()

    // Cleanup on unmount
    return () => {
      if (chatService) {
        chatService.disconnect()
      }
    }
  }, [user])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    // Focus input when chat opens
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatService) return

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
      timestamp: Date.now(),
      type: "text",
    }

    try {
      await chatService.sendMessage(currentRoom, message)
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const switchRoom = async (roomId: string) => {
    if (!chatService || roomId === currentRoom) return

    try {
      await chatService.leaveRoom(currentRoom)
      await chatService.joinRoom(roomId)
      setCurrentRoom(roomId)
      setMessages([]) // Clear messages when switching rooms

      // Add room switch message
      const switchMessage: Message = {
        id: Date.now().toString(),
        text: `Joined #${rooms.find((r) => r.id === roomId)?.name} room`,
        user: {
          id: "system",
          name: "System",
          image: "/placeholder.svg?height=32&width=32",
        },
        timestamp: Date.now(),
        type: "system",
      }
      setMessages([switchMessage])
    } catch (error) {
      console.error("Failed to switch room:", error)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="fixed bottom-6 right-20 z-50 w-96 h-[600px] bg-black/90 backdrop-blur-md border border-yellow-500/20 rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-yellow-500/20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-semibold">{rooms.find((r) => r.id === currentRoom)?.name}</span>
            <span className="text-lg">{rooms.find((r) => r.id === currentRoom)?.icon}</span>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
            {onlineUsers.length} online
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-yellow-400 p-1">
            <Settings className="w-4 h-4" />
          </Button>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-yellow-400 p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Room Tabs */}
      <div className="flex space-x-1 p-2 border-b border-yellow-500/10">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => switchRoom(room.id)}
            className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
              currentRoom === room.id
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50"
            }`}
          >
            <span className="mr-1">{room.icon}</span>
            {room.name}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {isConnecting ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Connecting to chat...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${message.type === "system" ? "justify-center" : ""}`}
                  >
                    {message.type === "system" ? (
                      <div className="bg-gray-800/50 rounded-lg px-3 py-1">
                        <p className="text-gray-400 text-sm text-center">{message.text}</p>
                      </div>
                    ) : (
                      <>
                        <img
                          src={message.user.image || "/placeholder.svg"}
                          alt={message.user.name}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-medium text-sm">{message.user.name}</span>
                            <span className="text-gray-400 text-xs">{formatTime(message.timestamp)}</span>
                          </div>
                          <p className="text-gray-300 text-sm break-words">{message.text}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-yellow-500/20">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message #${rooms.find((r) => r.id === currentRoom)?.name.toLowerCase()}...`}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-500/50 pr-20"
                  disabled={isConnecting}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-yellow-400 p-1">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-yellow-400 p-1">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isConnecting}
                className="bg-yellow-500 hover:bg-yellow-600 text-black p-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Online Users Sidebar */}
        <div className="w-20 border-l border-yellow-500/20 p-2">
          <div className="text-xs text-gray-400 mb-2 text-center">Online</div>
          <div className="space-y-2">
            {onlineUsers.slice(0, 8).map((chatUser) => (
              <div
                key={chatUser.id}
                className="relative group cursor-pointer"
                title={`${chatUser.name} - ${chatUser.online ? "Online" : formatLastSeen(chatUser.lastSeen)}`}
              >
                <img src={chatUser.image || "/placeholder.svg"} alt={chatUser.name} className="w-8 h-8 rounded-full" />
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                    chatUser.online ? "bg-green-400" : "bg-gray-500"
                  }`}
                ></div>
              </div>
            ))}
            {onlineUsers.length > 8 && (
              <div className="text-xs text-gray-400 text-center">+{onlineUsers.length - 8}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
