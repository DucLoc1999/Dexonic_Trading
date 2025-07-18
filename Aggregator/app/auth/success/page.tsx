"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function AuthSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home after 2 seconds
    const timer = setTimeout(() => {
      router.push("/")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20 max-w-md w-full">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to AptosSwap!</h2>
          <p className="text-gray-300 mb-4">Your account has been successfully created.</p>
          <p className="text-sm text-gray-400">Redirecting you to the homepage...</p>
        </CardContent>
      </Card>
    </div>
  )
}
