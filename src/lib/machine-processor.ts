import { prisma } from "./prisma";
import { generateFakeWallet } from "./machine";
import { getMarketPrices } from "./market";

const DISCOVERY_BLOCK_SIZE = 100_000;
const DISCOVERY_CHANCE_PER_BLOCK = 0.2;

type ProcessedLicense = {
	id: string;
	userId: string;
	activatedAt: Date | null;
	expiresAt: Date | null;
	keysPerMinute: number;
	lastProcessedMilestone: number;
	status: string;
	machineEnabled: boolean;
};

function isLicenseActive(license: {
	status: string;
	machineEnabled: boolean;
	activatedAt: Date | null;
	expiresAt: Date | null;
}) {
	const now = new Date();

	return Boolean(
		license.status === "ACTIVE" &&
		license.machineEnabled &&
		license.activatedAt &&
		license.expiresAt &&
		license.expiresAt > now
	);
}

export async function processActiveMachines() {
	const now = new Date();

	await prisma.license.updateMany({
		where: {
			status: "ACTIVE",
			expiresAt: { lte: now },
		},
		data: {
			status: "EXPIRED",
			machineEnabled: false,
		},
	});

	const licenses: ProcessedLicense[] = await prisma.license.findMany({
		where: {
			status: "ACTIVE",
			machineEnabled: true,
			activatedAt: { not: null },
			expiresAt: { gt: now },
		},
		select: {
			id: true,
			userId: true,
			activatedAt: true,
			expiresAt: true,
			keysPerMinute: true,
			lastProcessedMilestone: true,
			status: true,
			machineEnabled: true,
		},
	});

	if (licenses.length === 0) {
		return {
			processedUsers: 0,
			foundWallets: 0,
		};
	}

	const prices = await getMarketPrices();
	let foundWallets = 0;

	for (const license of licenses) {
		if (!isLicenseActive(license)) {
			continue;
		}

		const activatedAt = new Date(license.activatedAt!);
		const uptimeSeconds = Math.floor((now.getTime() - activatedAt.getTime()) / 1000);
		const attemptsPerSecond = Math.max(0, license.keysPerMinute / 60);
		const totalAttempts = Math.floor(uptimeSeconds * attemptsPerSecond);

		await prisma.user.update({
			where: { id: license.userId },
			data: { scanAttempts: totalAttempts },
		});

		const currentProcessedBlock = Math.floor(totalAttempts / DISCOVERY_BLOCK_SIZE);
		const lastProcessedBlock = Math.max(0, license.lastProcessedMilestone ?? 0);

		if (currentProcessedBlock <= lastProcessedBlock) {
			continue;
		}

		for (let block = lastProcessedBlock + 1; block <= currentProcessedBlock; block++) {
			const roll = Math.random();

			if (roll > DISCOVERY_CHANCE_PER_BLOCK) {
				continue;
			}

			const wallet = generateFakeWallet(prices);

			const existing = await prisma.foundWallet.findFirst({
				where: {
					userId: license.userId,
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

			await prisma.foundWallet.create({
				data: {
					userId: license.userId,
					network: wallet.network,
					address: wallet.address,
					balanceCrypto,
					balanceUsd,
					priceSnapshotUsd: usdPrice,
					status: "AVAILABLE",
				},
			});

			foundWallets++;
		}

		await prisma.license.update({
			where: { id: license.id },
			data: {
				lastProcessedMilestone: currentProcessedBlock,
			},
		});
	}

	return {
		processedUsers: licenses.length,
		foundWallets,
	};
}