import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    if (!process.env.NEXT_PUBLIC_COINGECKO_API_KEY) {
        console.log("CoinGecko API key is not set");
        return;
    }
    const coinId: string = request.url.split("/").pop() || "";
    console.log("coinId for chart data:", coinId);
    const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1`
    );
    const data = await response.json();
    // console.log("final chart data in api:", data);
    return NextResponse.json(data);
} 