import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { rateLimit } from "../../../../lib/rate-limit";
import { isAllowedOrigin } from "../../../../lib/request";

const NETWORK_OPTIONS: Record<string, { key: string; feeCrypto: number }[]> = {
	BTC: [
		{ key: "BTC", feeCrypto: 0.0002 },
		{ key: "LIGHTNING", feeCrypto: 0.00001 },
	],
	LTC: [{ key: "LTC", feeCrypto: 0.001 }],
	ETH: [
		{ key: "ERC20", feeCrypto: 0.0035 },
		{ key: "ARBITRUM", feeCrypto: 0.0007 },
		{ key: "BASE", feeCrypto: 0.0005 },
	],
	SOL: [{ key: "SOL", feeCrypto: 0.0008 }],
};

function getWithdrawalPolicy(tier: string | null | undefined) {
	if (tier === "ULTRA") {
		return {
			mode: "DAILY",
			estimatedProcessing: "1 to 12 hours",
		};
	}

	return {
		mode: "WEEKLY",
		estimatedProcessing: "1 to 3 days",
	};
}

function normalizeString(value: unknown) {
	return String(value || "").trim();
}

export async function POST(req: Request) {
	try {
		if (!isAllowedOrigin(req)) {
			return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
		}

		const session = await getCurrentUserFromCookie();

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const limit = rateLimit(`withdrawal:${session.userId}`, 8, 15 * 60 * 1000);
		if (!limit.ok) {
			return NextResponse.json({ error: "Too many withdrawal requests" }, { status: 429 });
		}

		const body = await req.json();
		const foundWalletId = normalizeString(body.foundWalletId);
		const receiveAddress = normalizeString(body.receiveAddress);
		const network = normalizeString(body.network).toUpperCase();

		if (!foundWalletId || !receiveAddress || !network) {
			return NextResponse.json({ error: "Missing data to request the withdrawal" }, { status: 400 });
		}

		if (receiveAddress.length < 8 || receiveAddress.length > 120) {
			return NextResponse.json({ error: "Invalid receiving address" }, { status: 400 });
		}

		const userLicense = await prisma.license.findUnique({
			where: { userId: session.userId },
		});

		const foundWallet = await prisma.foundWallet.findFirst({
			where: {
				id: foundWalletId,
				userId: session.userId,
			},
		});

		if (!foundWallet) {
			return NextResponse.json({ error: "Finding not found" }, { status: 404 });
		}

		if (foundWallet.status !== "AVAILABLE") {
			return NextResponse.json({ error: "This finding has already been requested or processed" }, { status: 400 });
		}

		const validNetworks = NETWORK_OPTIONS[foundWallet.network] || [];
		const selectedNetwork = validNetworks.find((n) => n.key === network);

		if (!selectedNetwork) {
			return NextResponse.json({ error: "Invalid withdrawal network for this asset" }, { status: 400 });
		}

		const recentDuplicate = await prisma.withdrawalRequest.findFirst({
			where: {
				userId: session.userId,
				foundWalletId: foundWallet.id,
				receiveAddress,
				network,
				createdAt: {
					gte: new Date(Date.now() - 5 * 60 * 1000),
				},
			},
		});

		if (recentDuplicate) {
			return NextResponse.json({ error: "Duplicate request detected" }, { status: 409 });
		}

		const netCrypto = Math.max(0, foundWallet.balanceCrypto - selectedNetwork.feeCrypto);
		const usdRatio =
			foundWallet.balanceCrypto > 0 ? netCrypto / foundWallet.balanceCrypto : 0;
		const netUsd = Number((foundWallet.balanceUsd * usdRatio).toFixed(2));

		const policy = getWithdrawalPolicy(userLicense?.tier);

		const result = await prisma.$transaction(async (tx) => {
			const withdrawal = await tx.withdrawalRequest.create({
				data: {
					userId: session.userId,
					foundWalletId: foundWallet.id,
					network,
					receiveAddress,
					amountCrypto: netCrypto,
					amountUsd: netUsd,
					status: "PENDING",
					estimatedProcessing: policy.estimatedProcessing,
				},
			});

			await tx.foundWallet.update({
				where: { id: foundWallet.id },
				data: { status: "REQUESTED" },
			});

			return withdrawal;
		});

		return NextResponse.json({
			message:
				policy.mode === "DAILY"
					? "Daily withdrawal request created. Estimated processing time: 1 to 12 hours."
					: "Weekly withdrawal request created. Estimated processing time: 1 to 3 days.",
			withdrawal: result,
		});
	} catch (error) {
		console.error("withdrawls/request error", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}