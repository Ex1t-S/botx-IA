export type PriceMap = {
	BTC: number;
	ETH: number;
	SOL: number;
	LTC: number;
};

const FALLBACK_PRICES: PriceMap = {
	BTC: 82000,
	ETH: 3800,
	SOL: 145,
	LTC: 85
};

function safeNumber(value: unknown, fallback: number) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getMarketPrices(): Promise<PriceMap> {
	try {
		const response = await fetch(
			"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,litecoin&vs_currencies=usd",
			{ cache: "no-store" }
		);

		if (!response.ok) {
			return FALLBACK_PRICES;
		}

		const data = await response.json();

		return {
			BTC: safeNumber(data?.bitcoin?.usd, FALLBACK_PRICES.BTC),
			ETH: safeNumber(data?.ethereum?.usd, FALLBACK_PRICES.ETH),
			SOL: safeNumber(data?.solana?.usd, FALLBACK_PRICES.SOL),
			LTC: safeNumber(data?.litecoin?.usd, FALLBACK_PRICES.LTC)
		};
	} catch (error) {
		console.error("market prices error", error);
		return FALLBACK_PRICES;
	}
}