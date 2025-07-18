'use server';

import { cookies } from "next/headers";
import { loadChat } from "@/utils/chat-store";
import { verifySession } from "@/utils/session";

export async function getTradingAgentsData() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("user_session");

    console.log("Server action - Session found:", !!session);
    console.log("Server action - Session value:", session?.value ? "exists" : "null");

    if (!session) {
      return { 
        success: false, 
        error: "No session found - please sign in first", 
        requiresAuth: true,
        debug: "No user_session cookie found"
      };
    }

    const { valid, data } = await verifySession(session.value);
    
    console.log("Server action - Session verification result:", { valid, hasUserId: !!data?.userId });

    if (!valid || !data?.userId) {
      return { 
        success: false, 
        error: "Invalid session - please sign in again", 
        requiresAuth: true,
        debug: `Session valid: ${valid}, has userId: ${!!data?.userId}`
      };
    }

    console.log("Server action - Data:", data);

    const userId = data.userId;
    const messages = await loadChat(userId);

    console.log("Server action - Successfully loaded data for userId:", userId);

    return {
      success: true,
      userId,
      messages,
      requiresAuth: false,
      debug: "Successfully authenticated and loaded chat data"
    };
  } catch (error) {
    console.error("Error in getTradingAgentsData:", error);
    return { 
      success: false, 
      error: "Failed to load trading agents data", 
      requiresAuth: true,
      debug: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function checkAuthStatus() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("user_session");

    if (!session) {
      return { authenticated: false, debug: "No session cookie" };
    }

    const { valid, data } = await verifySession(session.value);
    return { 
      authenticated: valid && !!data?.userId,
      userId: data?.userId,
      debug: `Valid: ${valid}, has userId: ${!!data?.userId}`
    };
  } catch (error) {
    console.error("Error in checkAuthStatus:", error);
    return { 
      authenticated: false, 
      debug: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 