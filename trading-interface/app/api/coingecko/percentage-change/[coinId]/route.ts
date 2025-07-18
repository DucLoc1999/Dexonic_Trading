import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    if (!process.env.NEXT_PUBLIC_COINGECKO_API_KEY) {
        console.log("CoinGecko API key is not set");
        return;
    }
    const coinId: string = request.url.split("/").pop() || "";
    console.log("coinId:", coinId);
    const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`
    );
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const finalData = {
        id: data[0].id,
        symbol: data[0].symbol,
        name: data[0].name,
        price_change_percentage_1h_in_currency: data[0].price_change_percentage_1h_in_currency,
        price_change_percentage_24h_in_currency: data[0].price_change_percentage_24h_in_currency,
        price_change_percentage_7d_in_currency: data[0].price_change_percentage_7d_in_currency,
    };
    // console.log("final percentage change data in api:", finalData);
    return NextResponse.json(finalData);
}