import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getMarketPrices } from "../../../lib/market";

export async function GET() {
	const session = await getCurrentUserFromCookie();

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const findings = await prisma.foundWallet.findMany({
		where: { userId: session.userId },
		orderBy: { foundAt: "desc" },
	});

	const prices = await getMarketPrices();

	const enriched = findings.map((item) => {
		const livePrice = prices[item.network as keyof typeof prices] ?? 0;

		let liveUsd = 0;

		if (livePrice > 0) {
			liveUsd = Number((item.balanceCrypto * livePrice).toFixed(2));
		} else if (item.balanceUsd > 0) {
			liveUsd = Number(item.balanceUsd.toFixed(2));
		} else if ((item.priceSnapshotUsd ?? 0) > 0) {
			liveUsd = Number((item.balanceCrypto * (item.priceSnapshotUsd ?? 0)).toFixed(2));
		}

		return {
			...item,
			balanceUsd: liveUsd,
		};
	});

	return NextResponse.json({ findings: enriched });
}