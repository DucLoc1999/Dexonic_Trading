"use client"

// Mock GUN Chat Service for demonstration
// In a real implementation, this would use the actual GUN database

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

export class GunChatService {
  private user: any = null
  private currentRoom = ""
  private messageCallbacks: ((message: Message) => void)[] = []
  private presenceCallbacks: ((users: ChatUser[]) => void)[] = []
  private mockUsers: ChatUser[] = []
  private heartbeatInterval: NodeJS.Timeout | null = null

  async initialize(user: any) {
    this.user = user

    // Mock online users
    this.mockUsers = [
      {
        id: user.id,
        name: user.name,
        image: user.image,
        online: true,
        lastSeen: Date.now(),
      },
      {
        id: "user2",
        name: "Alice Trader",
        image: "/placeholder.svg?height=32&width=32",
        online: true,
        lastSeen: Date.now() - 300000, // 5 minutes ago
      },
      {
        id: "user3",
        name: "Bob DeFi",
        image: "/placeholder.svg?height=32&width=32",
        online: true,
        lastSeen: Date.now() - 600000, // 10 minutes ago
      },
      {
        id: "user4",
        name: "Carol APT",
        image: "/placeholder.svg?height=32&width=32",
        online: false,
        lastSeen: Date.now() - 3600000, // 1 hour ago
      },
    ]

    // Start heartbeat for presence
    this.startHeartbeat()

    // Simulate initial presence update
    setTimeout(() => {
      this.presenceCallbacks.forEach((callback) => callback(this.mockUsers))
    }, 1000)
  }

  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback)
  }

  onUserPresence(callback: (users: ChatUser[]) => void) {
    this.presenceCallbacks.push(callback)
  }

  async joinRoom(roomId: string) {
    this.currentRoom = roomId

    // Simulate receiving some messages after joining
    setTimeout(() => {
      if (roomId === "general") {
        this.simulateMessage("Welcome to the general chat! Feel free to discuss anything Aptos related.", "user2")
      } else if (roomId === "trading") {
        this.simulateMessage("APT is looking bullish today! 📈", "user3")
      } else if (roomId === "defi") {
        this.simulateMessage("New liquidity pools are live on Liquidswap!", "user2")
      } else if (roomId === "aptos") {
        this.simulateMessage("The Aptos ecosystem is growing fast! 🚀", "user3")
      }
    }, 2000)
  }

  async leaveRoom(roomId: string) {
    // Mock leave room logic
    console.log(`Left room: ${roomId}`)
  }

  async sendMessage(roomId: string, message: Message) {
    // Simulate message being sent
    this.messageCallbacks.forEach((callback) => callback(message))

    // Simulate a response from another user after a delay
    setTimeout(
      () => {
        this.simulateRandomResponse(message.text)
      },
      2000 + Math.random() * 3000,
    )
  }

  private simulateMessage(text: string, userId: string) {
    const mockUser = this.mockUsers.find((u) => u.id === userId)
    if (!mockUser) return

    const message: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      user: {
        id: mockUser.id,
        name: mockUser.name,
        image: mockUser.image,
      },
      timestamp: Date.now(),
      type: "text",
    }

    this.messageCallbacks.forEach((callback) => callback(message))
  }

  private simulateRandomResponse(originalMessage: string) {
    const responses = [
      "Interesting point! 🤔",
      "I agree with that analysis",
      "Thanks for sharing!",
      "What do you think about the recent updates?",
      "The market is definitely moving fast",
      "Great insight! 👍",
      "I've been watching that too",
      "Any thoughts on the next move?",
    ]

    const randomUser = this.mockUsers.filter((u) => u.id !== this.user.id && u.online)[
      Math.floor(Math.random() * this.mockUsers.filter((u) => u.id !== this.user.id && u.online).length)
    ]

    if (randomUser) {
      const response = responses[Math.floor(Math.random() * responses.length)]
      this.simulateMessage(response, randomUser.id)
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      // Update user presence
      this.mockUsers = this.mockUsers.map((user) => ({
        ...user,
        online: user.id === this.user.id ? true : Math.random() > 0.3, // 70% chance to be online
        lastSeen: user.id === this.user.id ? Date.now() : user.lastSeen,
      }))

      this.presenceCallbacks.forEach((callback) => callback(this.mockUsers))
    }, 30000) // Update every 30 seconds
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this.messageCallbacks = []
    this.presenceCallbacks = []
  }
}
