import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { generateFakeWallet, getMachineState } from "../../../../lib/machine";
import { getMarketPrices } from "../../../../lib/market";
import { rateLimit } from "../../../../lib/rate-limit";

const DISCOVERY_BLOCK_SIZE = 100_000;
const DISCOVERY_CHANCE_PER_BLOCK = 0.2;
const RECENT_WALLETS_LIMIT = 10;

function formatDurationCompact(totalSeconds: number) {
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
		return "~0s";
	}

	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);

	if (days > 0) return `~${days}d ${hours}h`;
	if (hours > 0) return `~${hours}h ${minutes}m`;
	if (minutes > 0) return `~${minutes}m ${seconds}s`;

	return `~${seconds}s`;
}

function buildNextDiscoveryEta(totalAttempts: number, keysPerMinute: number) {
	if (!Number.isFinite(keysPerMinute) || keysPerMinute <= 0) {
		return "Inactive";
	}

	const attemptsPerSecond = keysPerMinute / 60;

	if (attemptsPerSecond <= 0) {
		return "Inactive";
	}

	const attemptsIntoCurrentBlock = totalAttempts % DISCOVERY_BLOCK_SIZE;
	const attemptsUntilNextRoll =
		attemptsIntoCurrentBlock === 0
			? DISCOVERY_BLOCK_SIZE
			: DISCOVERY_BLOCK_SIZE - attemptsIntoCurrentBlock;

	const expectedRollsToSuccess = 1 / DISCOVERY_CHANCE_PER_BLOCK;
	const expectedAdditionalAttemptsAfterNextRoll =
		Math.max(0, expectedRollsToSuccess - 1) * DISCOVERY_BLOCK_SIZE;

	const expectedAttempts = attemptsUntilNextRoll + expectedAdditionalAttemptsAfterNextRoll;
	const expectedSeconds = Math.ceil(expectedAttempts / attemptsPerSecond);

	return formatDurationCompact(expectedSeconds);
}

function formatClock(totalSeconds: number) {
	const safe = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const seconds = safe % 60;

	if (hours > 0) {
		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export async function GET() {
	try {
		const session = await getCurrentUserFromCookie();

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const machineLimit = rateLimit(`machine:${session.userId}`, 30, 60 * 1000);

		if (!machineLimit.ok) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const [user, license] = await Promise.all([
			prisma.user.findUnique({
				where: { id: session.userId },
			}),
			prisma.license.findUnique({
				where: { userId: session.userId },
			}),
		]);

		if (!user || !license) {
			return NextResponse.json(
				{ error: "User or license not found" },
				{ status: 404 }
			);
		}

		const now = new Date();

		if (
			license.status === "ACTIVE" &&
			license.expiresAt &&
			license.expiresAt <= now
		) {
			await prisma.license.update({
				where: { id: license.id },
				data: { status: "EXPIRED", machineEnabled: false },
			});

			license.status = "EXPIRED";
			license.machineEnabled = false;
		}

		const isActive = Boolean(
			license.status === "ACTIVE" &&
				license.machineEnabled &&
				license.activatedAt &&
				license.expiresAt &&
				license.expiresAt > now
		);

		let totalAttempts = 0;
		let uptimeSeconds = 0;

		let newWallet: null | {
			id: string;
			network: string;
			address: string;
			balanceCrypto: number;
			balanceUsd: number;
			priceSnapshotUsd: number | null;
			foundAt: string;
		} = null;

		if (isActive && license.activatedAt) {
			const elapsedMs = Math.max(
				0,
				now.getTime() - new Date(license.activatedAt).getTime()
			);

			uptimeSeconds = Math.floor(elapsedMs / 1000);

			const keysPerMinute = Math.max(0, license.keysPerMinute ?? 0);
			const attemptsPerSecond = keysPerMinute / 60;

			totalAttempts = Math.floor(uptimeSeconds * attemptsPerSecond);

			if (user.scanAttempts !== totalAttempts) {
				await prisma.user.update({
					where: { id: user.id },
					data: { scanAttempts: totalAttempts },
				});
			}

			const currentProcessedBlock = Math.floor(
				totalAttempts / DISCOVERY_BLOCK_SIZE
			);

			const lastProcessedBlock = Math.max(
				0,
				license.lastProcessedMilestone ?? 0
			);

			if (currentProcessedBlock > lastProcessedBlock) {
				let prices: Awaited<ReturnType<typeof getMarketPrices>> | null = null;

				for (
					let block = lastProcessedBlock + 1;
					block <= currentProcessedBlock;
					block++
				) {
					const roll = Math.random();

					if (roll > DISCOVERY_CHANCE_PER_BLOCK) {
						continue;
					}

					if (!prices) {
						prices = await getMarketPrices();
					}

					const wallet = generateFakeWallet(prices);

					const existing = await prisma.foundWallet.findFirst({
						where: {
							userId: session.userId,
							address: wallet.address,
						},
					});

					if (existing) {
						continue;
					}

					const usdPrice = Number(prices[wallet.network] ?? 0);

					if (!Number.isFinite(usdPrice) || usdPrice <= 0) {
						continue;
					}

					const balanceCrypto = Number(wallet.balance);
					const balanceUsd = Number((balanceCrypto * usdPrice).toFixed(2));

					if (!Number.isFinite(balanceCrypto) || balanceCrypto <= 0) {
						continue;
					}

					if (!Number.isFinite(balanceUsd) || balanceUsd <= 0) {
						continue;
					}

					const created = await prisma.foundWallet.create({
						data: {
							userId: session.userId,
							network: wallet.network,
							address: wallet.address,
							balanceCrypto,
							balanceUsd,
							priceSnapshotUsd: usdPrice,
							status: "AVAILABLE",
						},
					});

					newWallet = {
						id: created.id,
						network: created.network,
						address: created.address,
						balanceCrypto: created.balanceCrypto,
						balanceUsd: created.balanceUsd,
						priceSnapshotUsd: created.priceSnapshotUsd,
						foundAt: new Date(created.foundAt).toLocaleString(),
					};
				}

				await prisma.license.update({
					where: { id: license.id },
					data: { lastProcessedMilestone: currentProcessedBlock },
				});
			}
		}

		const [recentWallets, totalFoundWallets] = await Promise.all([
			prisma.foundWallet.findMany({
				where: { userId: session.userId },
				orderBy: { foundAt: "desc" },
				take: RECENT_WALLETS_LIMIT,
			}),
			prisma.foundWallet.count({
				where: { userId: session.userId },
			}),
		]);

		const state = getMachineState({
			hasActiveLicense: isActive,
			keysPerMinute: isActive ? license.keysPerMinute : 0,
			activatedAt: isActive ? license.activatedAt : null,
			expiresAt: isActive ? license.expiresAt : null,
			totalAttempts,
		});

		return NextResponse.json({
			...state,
			attemptsPerMinute: isActive ? license.keysPerMinute ?? 0 : 0,
			totalAttempts,
			uptimeSeconds,
			uptimeHours: Number((uptimeSeconds / 3600).toFixed(2)),
			uptimeText: formatClock(uptimeSeconds),
			nextDiscoveryEta: isActive
				? buildNextDiscoveryEta(totalAttempts, license.keysPerMinute ?? 0)
				: "Inactive",
			serverNow: now.toISOString(),
			totalFoundWallets,
			wallet: newWallet,
			recentWallets: recentWallets.map((item) => ({
				id: item.id,
				network: item.network,
				address: item.address,
				balanceCrypto: item.balanceCrypto,
				balanceUsd: item.balanceUsd,
				priceSnapshotUsd: item.priceSnapshotUsd,
				foundAt: new Date(item.foundAt).toLocaleString(),
			})),
			license: {
				active: isActive,
				expiresAt: license.expiresAt
					? new Date(license.expiresAt).toLocaleString()
					: null,
				tier: license.tier,
				priceUsd: license.priceUsd,
				keysPerMinute: license.keysPerMinute,
				status: license.status,
			},
		});
	} catch (error) {
		console.error("machine/state error", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}