"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MessageCircle,
  Users,
  Hash,
  Search,
  Send,
  Smile,
  Paperclip,
  X,
  Edit3,
  Save,
  Award,
  Calendar,
  DollarSign,
  Activity,
  Star,
  Trophy,
  Target,
  Zap,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
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

interface Transaction {
  id: string
  hash: string
  timestamp: string
  type: "swap" | "add_liquidity" | "remove_liquidity"
  status: "completed" | "pending" | "failed"
  inputToken: {
    symbol: string
    amount: string
    value: string
    logo: string
  }
  outputToken: {
    symbol: string
    amount: string
    value: string
    logo: string
  }
  dex: string
  fee: string
  priceImpact: string
}

interface UserStats {
  totalVolume: string
  totalTrades: number
  successRate: string
  avgTradeSize: string
  favoriteToken: string
  totalFees: string
  rank: number
  level: string
  xp: number
  nextLevelXp: number
}

interface UserProfile {
  id: string
  name: string
  email: string
  image: string
  bio: string
  joinDate: string
  verified: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<"chat" | "profile" | "stats">("chat")

  // Chat states
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const [currentRoom, setCurrentRoom] = useState("general")
  const [isConnecting, setIsConnecting] = useState(true)
  const [chatService, setChatService] = useState<GunChatService | null>(null)

  // Profile states
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount">("newest")

  // Available chat rooms
  const rooms = [
    { id: "general", name: "General", icon: "💬" },
    { id: "trading", name: "Trading", icon: "📈" },
    { id: "defi", name: "DeFi", icon: "🏦" },
    { id: "aptos", name: "Aptos", icon: "🚀" },
  ]

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem("user")
    if (!savedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(savedUser)
    setUser({
      ...userData,
      bio: userData.bio || "DeFi enthusiast exploring the Aptos ecosystem. Always looking for the best swap rates!",
      joinDate: userData.joinDate || "2024-01-15",
      verified: userData.verified || true,
    })
    setEditedBio(
      userData.bio || "DeFi enthusiast exploring the Aptos ecosystem. Always looking for the best swap rates!",
    )

    // Initialize chat and load user data
    initializeChat(userData)
    loadUserData()
  }, [router])

  const initializeChat = async (userData: any) => {
    try {
      const service = new GunChatService()
      await service.initialize(userData)
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
        text: `Welcome to AptosSwap Community Chat! 🎉`,
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

  const loadUserData = async () => {
    setLoading(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock user stats
    setUserStats({
      totalVolume: "2,456,789",
      totalTrades: 342,
      successRate: "98.5",
      avgTradeSize: "7,183",
      favoriteToken: "APT",
      totalFees: "1,234",
      rank: 1247,
      level: "Diamond",
      xp: 8750,
      nextLevelXp: 10000,
    })

    // Mock transaction data
    const mockTransactions: Transaction[] = [
      {
        id: "1",
        hash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
        timestamp: "2024-01-20T14:30:00Z",
        type: "swap",
        status: "completed",
        inputToken: {
          symbol: "APT",
          amount: "10.5",
          value: "$89.25",
          logo: "/placeholder.svg?height=24&width=24",
        },
        outputToken: {
          symbol: "USDC",
          amount: "89.12",
          value: "$89.12",
          logo: "/placeholder.svg?height=24&width=24",
        },
        dex: "Liquidswap",
        fee: "$0.27",
        priceImpact: "0.12%",
      },
      {
        id: "2",
        hash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        timestamp: "2024-01-20T12:15:00Z",
        type: "swap",
        status: "completed",
        inputToken: {
          symbol: "USDC",
          amount: "500.00",
          value: "$500.00",
          logo: "/placeholder.svg?height=24&width=24",
        },
        outputToken: {
          symbol: "WETH",
          amount: "0.2156",
          value: "$498.73",
          logo: "/placeholder.svg?height=24&width=24",
        },
        dex: "Econia",
        fee: "$1.25",
        priceImpact: "0.08%",
      },
      {
        id: "3",
        hash: "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
        timestamp: "2024-01-19T16:45:00Z",
        type: "add_liquidity",
        status: "completed",
        inputToken: {
          symbol: "APT",
          amount: "25.0",
          value: "$212.50",
          logo: "/placeholder.svg?height=24&width=24",
        },
        outputToken: {
          symbol: "USDC",
          amount: "212.50",
          value: "$212.50",
          logo: "/placeholder.svg?height=24&width=24",
        },
        dex: "Liquidswap",
        fee: "$0.64",
        priceImpact: "0.00%",
      },
    ]

    setTransactions(mockTransactions)
    setLoading(false)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatService) return

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      user: {
        id: user!.id,
        name: user!.name,
        image: user!.image,
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

  const switchRoom = async (roomId: string) => {
    if (!chatService || roomId === currentRoom) return

    try {
      await chatService.leaveRoom(currentRoom)
      await chatService.joinRoom(roomId)
      setCurrentRoom(roomId)
      setMessages([])

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

  const handleSaveBio = () => {
    if (user) {
      const updatedUser = { ...user, bio: editedBio }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setIsEditing(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedHash(id)
      setTimeout(() => setCopiedHash(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRankColor = (rank: number) => {
    if (rank <= 100) return "text-yellow-400"
    if (rank <= 1000) return "text-gray-300"
    return "text-orange-400"
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Diamond":
        return "from-blue-400 to-purple-600"
      case "Gold":
        return "from-yellow-400 to-yellow-600"
      case "Silver":
        return "from-gray-300 to-gray-500"
      default:
        return "from-orange-400 to-red-600"
    }
  }

  const filteredTransactions = transactions
    .filter((tx) => {
      if (filterType === "all") return true
      return tx.type === filterType
    })
    .filter((tx) => {
      if (!searchTerm) return true
      return (
        tx.inputToken.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.outputToken.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        case "amount":
          return (
            Number.parseFloat(b.inputToken.value.replace("$", "")) -
            Number.parseFloat(a.inputToken.value.replace("$", ""))
          )
        default:
          return 0
      }
    })

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-yellow-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-black/80 backdrop-blur-md border-b border-yellow-500/20 px-4 py-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-300 hover:text-yellow-400 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Dexonic Dex Aggregator
                </span>
              </Link>
              <div className="hidden md:block">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Community Chat
                </Badge>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex bg-gray-800/50 rounded-lg p-1">
                <Button
                  onClick={() => setActiveTab("chat")}
                  variant="ghost"
                  size="sm"
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${
                    activeTab === "chat" ? "bg-yellow-500/20 text-yellow-400" : "text-gray-400 hover:text-yellow-400"
                  }`}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
                <Button
                  onClick={() => setActiveTab("profile")}
                  variant="ghost"
                  size="sm"
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${
                    activeTab === "profile" ? "bg-yellow-500/20 text-yellow-400" : "text-gray-400 hover:text-yellow-400"
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button
                  onClick={() => setActiveTab("stats")}
                  variant="ghost"
                  size="sm"
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${
                    activeTab === "stats" ? "bg-yellow-500/20 text-yellow-400" : "text-gray-400 hover:text-yellow-400"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </Button>
              </div>

              {/* Mobile Tab Selector */}
              <div className="md:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as "chat" | "profile" | "stats")}
                  className="bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2 focus:border-yellow-500/50 focus:outline-none"
                >
                  <option value="chat">💬 Chat</option>
                  <option value="profile">👤 Profile</option>
                  <option value="stats">📊 Stats</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-6">
          {activeTab === "chat" && (
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
                {/* Chat Rooms Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20 h-full">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Hash className="w-5 h-5 mr-2 text-yellow-400" />
                        Rooms
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => switchRoom(room.id)}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                            currentRoom === room.id
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50"
                          }`}
                        >
                          <span className="text-lg">{room.icon}</span>
                          <span className="font-medium">{room.name}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Chat Messages */}
                <div className="lg:col-span-2">
                  <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20 h-full flex flex-col">
                    <CardHeader className="border-b border-yellow-500/20">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center">
                          <span className="text-lg mr-2">{rooms.find((r) => r.id === currentRoom)?.icon}</span>#
                          {rooms.find((r) => r.id === currentRoom)?.name}
                        </CardTitle>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {onlineUsers.length} online
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0">
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
                          </div>
                        )}
                      </ScrollArea>

                      {/* Message Input */}
                      <div className="p-4 border-t border-yellow-500/20">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 relative">
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendMessage()
                                }
                              }}
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
                    </CardContent>
                  </Card>
                </div>

                {/* Online Users */}
                <div className="lg:col-span-1">
                  <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20 h-full">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Users className="w-5 h-5 mr-2 text-yellow-400" />
                        Online ({onlineUsers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {onlineUsers.map((chatUser) => (
                        <div key={chatUser.id} className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={chatUser.image || "/placeholder.svg"}
                              alt={chatUser.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                                chatUser.online ? "bg-green-400" : "bg-gray-500"
                              }`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{chatUser.name}</p>
                            <p className="text-gray-400 text-xs">{chatUser.online ? "Online" : "Offline"}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="max-w-4xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Profile Info */}
                <div className="lg:col-span-1">
                  <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="relative inline-block mb-4">
                          <img
                            src={user.image || "/placeholder.svg"}
                            alt={user.name}
                            className="w-24 h-24 rounded-full border-4 border-yellow-500/20"
                          />
                          {user.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
                              <Check className="w-4 h-4 text-black" />
                            </div>
                          )}
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">{user.name}</h1>
                        <p className="text-gray-400 mb-2">{user.email}</p>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined {formatDate(user.joinDate)}
                        </Badge>
                      </div>

                      {/* Bio Section */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">About</h3>
                          {!isEditing && (
                            <Button
                              onClick={() => setIsEditing(true)}
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-yellow-400"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editedBio}
                              onChange={(e) => setEditedBio(e.target.value)}
                              className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-500/50 resize-none"
                              rows={4}
                              maxLength={200}
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400">{editedBio.length}/200</span>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => {
                                    setIsEditing(false)
                                    setEditedBio(user.bio)
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={handleSaveBio}
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-300 leading-relaxed">{user.bio}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rank & Level Card */}
                  {userStats && (
                    <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20 mt-6">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                          Ranking & Level
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Global Rank</span>
                            <div className="flex items-center space-x-2">
                              <Award className={`w-4 h-4 ${getRankColor(userStats.rank)}`} />
                              <span className={`font-bold ${getRankColor(userStats.rank)}`}>#{userStats.rank}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Level</span>
                            <Badge
                              className={`bg-gradient-to-r ${getLevelColor(userStats.level)} text-white font-bold`}
                            >
                              {userStats.level}
                            </Badge>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-400">Experience</span>
                              <span className="text-white">
                                {userStats.xp.toLocaleString()} / {userStats.nextLevelXp.toLocaleString()} XP
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {userStats.nextLevelXp - userStats.xp} XP to next level
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Transaction History */}
                <div className="lg:col-span-2">
                  <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <CardTitle className="text-white flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-yellow-400" />
                          Transaction History
                        </CardTitle>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Search transactions..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-500/50 w-full sm:w-48"
                            />
                          </div>

                          <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-gray-900/50 border border-gray-700 text-white rounded-md px-3 py-2 focus:border-yellow-500/50 focus:outline-none"
                          >
                            <option value="all">All Types</option>
                            <option value="swap">Swaps</option>
                            <option value="add_liquidity">Add Liquidity</option>
                            <option value="remove_liquidity">Remove Liquidity</option>
                          </select>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      {loading ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                          <p className="text-gray-400">Loading transactions...</p>
                        </div>
                      ) : filteredTransactions.length === 0 ? (
                        <div className="p-8 text-center">
                          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No transactions found</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-96">
                          <div className="divide-y divide-gray-800">
                            {filteredTransactions.map((tx) => (
                              <div key={tx.id} className="p-6 hover:bg-gray-900/30 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        tx.status === "completed"
                                          ? "bg-green-400"
                                          : tx.status === "pending"
                                            ? "bg-yellow-400"
                                            : "bg-red-400"
                                      }`}
                                    ></div>
                                    <Badge
                                      variant="outline"
                                      className={`${
                                        tx.type === "swap"
                                          ? "border-blue-500/30 text-blue-400"
                                          : tx.type === "add_liquidity"
                                            ? "border-green-500/30 text-green-400"
                                            : "border-orange-500/30 text-orange-400"
                                      }`}
                                    >
                                      {tx.type.replace("_", " ").toUpperCase()}
                                    </Badge>
                                    <span className="text-gray-400 text-sm">{formatDate(tx.timestamp)}</span>
                                  </div>
                                  <Badge className="bg-gray-800 text-gray-300 border-gray-700">{tx.dex}</Badge>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <img
                                        src={tx.inputToken.logo || "/placeholder.svg"}
                                        alt={tx.inputToken.symbol}
                                        className="w-6 h-6 rounded-full"
                                      />
                                      <div>
                                        <p className="text-white font-medium">
                                          {tx.inputToken.amount} {tx.inputToken.symbol}
                                        </p>
                                        <p className="text-gray-400 text-sm">{tx.inputToken.value}</p>
                                      </div>
                                    </div>

                                    <div className="text-gray-400">→</div>

                                    <div className="flex items-center space-x-2">
                                      <img
                                        src={tx.outputToken.logo || "/placeholder.svg"}
                                        alt={tx.outputToken.symbol}
                                        className="w-6 h-6 rounded-full"
                                      />
                                      <div>
                                        <p className="text-white font-medium">
                                          {tx.outputToken.amount} {tx.outputToken.symbol}
                                        </p>
                                        <p className="text-gray-400 text-sm">{tx.outputToken.value}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-gray-400 text-sm">Fee: {tx.fee}</p>
                                    <p className="text-gray-400 text-sm">Impact: {tx.priceImpact}</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-400 text-sm">Hash:</span>
                                    <code className="text-yellow-400 text-sm font-mono">
                                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                                    </code>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      onClick={() => copyToClipboard(tx.hash, tx.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-yellow-400 p-1"
                                    >
                                      {copiedHash === tx.id ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-yellow-400 p-1"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && userStats && (
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Volume</p>
                        <p className="text-3xl font-bold text-white">${userStats.totalVolume}</p>
                      </div>
                      <BarChart3 className="w-10 h-10 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Trades</p>
                        <p className="text-3xl font-bold text-white">{userStats.totalTrades}</p>
                      </div>
                      <Activity className="w-10 h-10 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Success Rate</p>
                        <p className="text-3xl font-bold text-white">{userStats.successRate}%</p>
                      </div>
                      <Target className="w-10 h-10 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Avg Trade Size</p>
                        <p className="text-3xl font-bold text-white">${userStats.avgTradeSize}</p>
                      </div>
                      <DollarSign className="w-10 h-10 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Favorite Token</p>
                        <p className="text-3xl font-bold text-white">{userStats.favoriteToken}</p>
                      </div>
                      <Star className="w-10 h-10 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Fees</p>
                        <p className="text-3xl font-bold text-white">${userStats.totalFees}</p>
                      </div>
                      <Zap className="w-10 h-10 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart Placeholder */}
              <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Trading Performance</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64 flex items-center justify-center bg-gray-900/30 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                      <p className="text-gray-400">Performance charts coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
