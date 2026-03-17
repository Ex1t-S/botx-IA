import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { generateFakeWallet, getMachineState } from "../../../../lib/machine";
import { getMarketPrices } from "../../../../lib/market";

const MILESTONE_SIZE = 10_000_000;

export async function GET() {
	try {
		const session = await getCurrentUserFromCookie();

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const [user, license] = await Promise.all([
			prisma.user.findUnique({
				where: { id: session.userId }
			}),
			prisma.license.findUnique({
				where: { userId: session.userId }
			})
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
				data: {
					status: "EXPIRED",
					machineEnabled: false
				}
			});
		}

		const isActive = Boolean(
			license.status === "ACTIVE" &&
			license.machineEnabled &&
			license.activatedAt &&
			license.expiresAt &&
			license.expiresAt > now
		);

		let totalAttempts = 0;
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
			const elapsedMs =
				now.getTime() - new Date(license.activatedAt).getTime();
			const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

			totalAttempts =
				elapsedMinutes * Math.max(0, license.keysPerMinute ?? 0);

			if (user.scanAttempts !== totalAttempts) {
				await prisma.user.update({
					where: { id: user.id },
					data: {
						scanAttempts: totalAttempts
					}
				});
			}

			const currentMilestone = Math.floor(totalAttempts / MILESTONE_SIZE);
			const lastProcessedMilestone = Math.max(
				0,
				license.lastProcessedMilestone ?? 0
			);

			if (currentMilestone > lastProcessedMilestone) {
				const prices = await getMarketPrices();

				for (
					let milestone = lastProcessedMilestone + 1;
					milestone <= currentMilestone;
					milestone++
				) {
					const wallet = generateFakeWallet(prices);

					const existing = await prisma.foundWallet.findFirst({
						where: {
							userId: session.userId,
							address: wallet.address
						}
					});

					if (existing) {
						continue;
					}

					const usdPrice = Number(prices[wallet.network] ?? 0);

					if (!Number.isFinite(usdPrice) || usdPrice <= 0) {
						continue;
					}

					const balanceCrypto = Number(wallet.balance);
					const balanceUsd = Number(
						(balanceCrypto * usdPrice).toFixed(2)
					);

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
							status: "AVAILABLE"
						}
					});

					newWallet = {
						id: created.id,
						network: created.network,
						address: created.address,
						balanceCrypto: created.balanceCrypto,
						balanceUsd: created.balanceUsd,
						priceSnapshotUsd: created.priceSnapshotUsd,
						foundAt: new Date(created.foundAt).toLocaleString()
					};
				}

				await prisma.license.update({
					where: { id: license.id },
					data: {
						lastProcessedMilestone: currentMilestone
					}
				});
			}
		}

		const allWallets = await prisma.foundWallet.findMany({
			where: { userId: session.userId },
			orderBy: { foundAt: "desc" }
		});

		const state = getMachineState({
			hasActiveLicense: isActive,
			keysPerMinute: isActive ? license.keysPerMinute : 0,
			activatedAt: isActive ? license.activatedAt : null,
			expiresAt: isActive ? license.expiresAt : null,
			totalAttempts
		});

		return NextResponse.json({
			...state,
			totalAttempts,
			wallet: newWallet,
			recentWallets: allWallets.map((item) => ({
				id: item.id,
				network: item.network,
				address: item.address,
				balanceCrypto: item.balanceCrypto,
				balanceUsd: item.balanceUsd,
				priceSnapshotUsd: item.priceSnapshotUsd,
				foundAt: new Date(item.foundAt).toLocaleString()
			})),
			license: {
				active: isActive,
				expiresAt: license.expiresAt
					? new Date(license.expiresAt).toLocaleString()
					: null,
				tier: license.tier,
				priceUsd: license.priceUsd,
				keysPerMinute: license.keysPerMinute,
				status: license.status
			}
		});
	} catch (error) {
		console.error("machine/state error", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}