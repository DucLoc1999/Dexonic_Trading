// Google OAuth Configuration
// Add your Google OAuth credentials here

export const GOOGLE_AUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id-here",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "your-google-client-secret-here",
  redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/callback",
  // Google API Key for additional services
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "your-google-api-key-here",
}

// Google API Services Configuration
export const GOOGLE_API_CONFIG = {
  translateApiUrl: "https://translation.googleapis.com/language/translate/v2",
  languageApiUrl: "https://language.googleapis.com/v1/documents:analyzeEntities",
}

// Google OAuth Scopes
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
]

// Google OAuth URLs
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
export const GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

// Helper function to generate Google OAuth URL
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_AUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_AUTH_CONFIG.redirectUri,
    scope: GOOGLE_SCOPES.join(" "),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

// Helper function to exchange code for tokens
export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_AUTH_CONFIG.clientId,
      client_secret: GOOGLE_AUTH_CONFIG.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: GOOGLE_AUTH_CONFIG.redirectUri,
    }),
  })

  return response.json()
}

// Helper function to get user info from Google
export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch(`${GOOGLE_USER_INFO_URL}?access_token=${accessToken}`)
  return response.json()
}

// Helper function to make Google API calls
export async function callGoogleAPI(endpoint: string, data: any) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-goog-api-key": GOOGLE_AUTH_CONFIG.apiKey,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Google API call failed: ${response.statusText}`)
  }

  return response.json()
}

// Helper function for Google Translate API
export async function translateText(text: string, targetLanguage = "en") {
  const data = {
    q: text,
    target: targetLanguage,
    format: "text",
  }

  return callGoogleAPI(`${GOOGLE_API_CONFIG.translateApiUrl}?key=${GOOGLE_AUTH_CONFIG.apiKey}`, data)
}

// Helper function for Google Language Analysis API
export async function analyzeText(text: string) {
  const data = {
    document: {
      type: "PLAIN_TEXT",
      content: text,
    },
    encodingType: "UTF8",
  }

  return callGoogleAPI(`${GOOGLE_API_CONFIG.languageApiUrl}?key=${GOOGLE_AUTH_CONFIG.apiKey}`, data)
}
