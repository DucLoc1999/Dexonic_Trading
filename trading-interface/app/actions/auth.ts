'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/supabase/server';
import { createSessionCookie, SESSION_EXPIRY, verifySession } from '@/utils/session';

// Create a simple in-memory store with expiration
const signatureStore = new Map<string, { address: string; expires: number }>();

// Limit store to 10,000 signatures
if (signatureStore.size > 10000) {
  // Get oldest entries and delete them
  const entries = Array.from(signatureStore.entries());
  entries.sort((a, b) => a[1].expires - b[1].expires);

  // Delete oldest 1000 entries
  for (let i = 0; i < 1000 && i < entries.length; i++) {
    signatureStore.delete(entries[i][0]);
  }
}

// Cleanup function that runs periodically
function cleanupExpiredSignatures() {
  const now = Date.now();
  for (const [signature, data] of Array.from(signatureStore.entries())) {
    if (data.expires < now) {
      signatureStore.delete(signature);
    }
  }
}

// Set up periodic cleanup (every minute)
if (typeof global !== 'undefined') {
  // Only run this in Node.js environment, not during build
  setInterval(cleanupExpiredSignatures, 60 * 1000);
}

async function createOrGetUser(walletAddress: string) {
  try {
    console.log('Creating/getting user for wallet address:', walletAddress);
    
    // First try to get existing user
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected for new users
      console.error('Error selecting user:', selectError);
      throw new Error(`Database select error: ${selectError.message}`);
    }

    // If user exists, return their ID
    if (existingUser) {
      console.log('Found existing user:', existingUser.id);
      return existingUser.id;
    }

    console.log('Creating new user for wallet address:', walletAddress);

    // If user doesn't exist, create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ wallet_address: walletAddress })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting user:', insertError);
      throw new Error(`Failed to create user: ${insertError.message}`);
    }

    console.log('Created new user:', newUser.id);
    return newUser.id;
  } catch (error) {
    console.error('createOrGetUser error:', error);
    throw error;
  }
}

export async function verifySignature(message: string, signature: string) {
  try {
    // Check if Supabase is properly configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      throw new Error('Database configuration error');
    }

    // Extract the address from the message
    const addressMatch = message.match(/Address:\s*(0x[a-fA-F0-9]{64})/);
    if (!addressMatch || !addressMatch[1]) {
      throw new Error('Could not extract address from message');
    }
    const address = addressMatch[1];

    console.log('Original signature:', signature);
    console.log('Signature type:', typeof signature);

    // For Aptos, the signature from wallet adapter is a JSON object
    let signatureData;
    try {
      signatureData = JSON.parse(signature);
      console.log('Parsed signature data:', signatureData);
    } catch {
      // If it's not JSON, treat it as a raw signature
      signatureData = { signature };
      console.log('Using raw signature');
    }

    // Extract the actual signature
    const actualSignature = signatureData.signature || signature;
    console.log('Actual signature:', actualSignature);
    console.log('Actual signature length:', actualSignature.length);
    
    // More flexible validation - Aptos signatures can vary in format
    // Some are 64 bytes (128 hex chars), some might be different
    if (!actualSignature || actualSignature.length < 64) {
      throw new Error(`Invalid signature length: ${actualSignature.length}`);
    }

    // For now, we'll trust the signature since it comes from the wallet
    // In a production environment, you'd want to verify it cryptographically
    // This is a simplified approach for development

    // Check if this signature has been used before
    if (signatureStore.has(actualSignature)) {
      throw new Error('Signature has already been used');
    }

    // Store the signature with 5-minute expiration
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    signatureStore.set(actualSignature, { address, expires: expiresAt });

    // Create or get user after successful verification
    const userId = await createOrGetUser(address);

    const sessionToken = await createSessionCookie({
      userId,
      address: address,
    });

    const cookieStore = await cookies();
    cookieStore.set('user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_EXPIRY,
    });

    return { success: true };
  } catch (error) {
    console.error('Signature verification error:', error);
    throw error;
  }
}

export async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('user_session');

  if (!session) {
    return null;
  }

  const { valid, data } = await verifySession(session.value);

  if (valid && data) {
    return data;
  } else {
    return null;
  }
}

export async function checkAddressHasSession(address: string) {
  try {
    // Check if the user exists in the database
    const { data: user } = await supabase.from('users').select('id').eq('wallet_address', address).single();

    if (!user) {
      return false;
    }

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function autoAuthenticateAddress(address: string) {
  try {
    // First check if the user exists
    const { data: user } = await supabase.from('users').select('id').eq('wallet_address', address).single();

    if (!user) {
      return { success: false };
    }

    // Create a session for this user without requiring signature
    const sessionToken = await createSessionCookie({
      userId: user.id,
      address: address,
    });

    const cookieStore = await cookies();
    cookieStore.set('user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_EXPIRY,
    });

    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete('user_session');
  return { success: true };
}
