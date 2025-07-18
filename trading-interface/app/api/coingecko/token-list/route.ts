import { NextResponse } from "next/server";

export async function GET() {
    if (!process.env.NEXT_PUBLIC_COINGECKO_API_KEY) {
        console.log("CoinGecko API key is not set");
        return;
    }
    const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/list"
    );
    const data = await response.json();
    // console.log("final token list data in api:", data);
    return NextResponse.json(data);
}