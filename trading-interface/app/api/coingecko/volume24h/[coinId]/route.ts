import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    if (!process.env.NEXT_PUBLIC_COINGECKO_API_KEY) {
        console.log("CoinGecko API key is not set");
        return;
    }
    const coinId: string = request.url.split("/").pop() || "";
    const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true`
    );
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // console.log("final volume data in api:", data[coinId]);
    return NextResponse.json(data[coinId]);
}