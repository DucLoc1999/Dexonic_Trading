import { type NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL("/?error=auth_cancelled", request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (tokens.error) {
      return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url))
    }

    // Get user information
    const userInfo = await getGoogleUserInfo(tokens.access_token)

    // Here you would typically save the user to your database
    // For now, we'll redirect with user data in the URL (not recommended for production)
    const userData = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      image: userInfo.picture,
    }

    // In production, set secure HTTP-only cookies instead
    const response = NextResponse.redirect(new URL("/auth/success", request.url))
    response.cookies.set("user", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}
