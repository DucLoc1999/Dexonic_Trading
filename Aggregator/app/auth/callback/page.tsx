"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Processing authentication...")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code")
        const error = searchParams.get("error")

        if (error) {
          setStatus("error")
          setMessage("Authentication was cancelled or failed")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        if (!code) {
          setStatus("error")
          setMessage("No authorization code received")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        setMessage("Exchanging authorization code...")
        const tokens = await exchangeCodeForTokens(code)

        if (tokens.error) {
          setStatus("error")
          setMessage("Failed to get access token")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        setMessage("Getting user information...")
        const userInfo = await getGoogleUserInfo(tokens.access_token)

        const user = {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          image: userInfo.picture,
        }

        localStorage.setItem("user", JSON.stringify(user))
        setStatus("success")
        setMessage("Authentication successful! Redirecting...")

        setTimeout(() => router.push("/"), 2000)
      } catch (error) {
        console.error("Auth callback error:", error)
        setStatus("error")
        setMessage("An unexpected error occurred")
        setTimeout(() => router.push("/"), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20 max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            {status === "loading" && <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mx-auto" />}
            {status === "success" && (
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            {status === "error" && (
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            {status === "loading" && "Authenticating..."}
            {status === "success" && "Success!"}
            {status === "error" && "Error"}
          </h2>

          <p className="text-gray-300">{message}</p>
        </CardContent>
      </Card>
    </div>
  )
}
