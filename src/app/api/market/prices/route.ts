import { NextResponse } from "next/server";

let cachedPrices = {
	BTC: 0,
	LTC: 0,
	ETH: 0,
	SOL: 0,
};

let lastFetch = 0;
const CACHE_MS = 60_000;

export async function GET() {
	try {
		const now = Date.now();

		if (now - lastFetch < CACHE_MS && Object.values(cachedPrices).some((v) => v > 0)) {
			return NextResponse.json(cachedPrices);
		}

		const res = await fetch(
			"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum,solana&vs_currencies=usd",
			{
				cache: "no-store",
				headers: {
					accept: "application/json",
				},
			}
		);

		if (!res.ok) {
			return NextResponse.json(cachedPrices);
		}

		const data = await res.json();

		cachedPrices = {
			BTC: Number(data.bitcoin?.usd ?? cachedPrices.BTC ?? 0),
			LTC: Number(data.litecoin?.usd ?? cachedPrices.LTC ?? 0),
			ETH: Number(data.ethereum?.usd ?? cachedPrices.ETH ?? 0),
			SOL: Number(data.solana?.usd ?? cachedPrices.SOL ?? 0),
		};

		lastFetch = now;

		return NextResponse.json(cachedPrices);
	} catch {
		return NextResponse.json(cachedPrices);
	}
}