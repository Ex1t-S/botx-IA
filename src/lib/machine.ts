import { fakeWords } from "./fakeWords";

type SupportedNetwork = "BTC" | "ETH" | "SOL" | "LTC";

function pickRandom<T>(arr: T[]) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number, decimals = 6) {
	return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function generatePhrase() {
	return Array.from({ length: 12 }, () => pickRandom(fakeWords));
}

function generateFakeBTCAddress() {
	const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	let result = "bc1q";
	for (let i = 0; i < 30; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

function generateFakeETHAddress() {
	const chars = "abcdef0123456789";
	let result = "0x";
	for (let i = 0; i < 40; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

function generateFakeSOLAddress() {
	const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	let result = "";
	for (let i = 0; i < 44; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

function generateFakeLTCAddress() {
	const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	let result = "ltc1q";
	for (let i = 0; i < 30; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

function pickNetwork(): SupportedNetwork {
	const roll = Math.random();

	if (roll < 0.2) return "BTC";
	if (roll < 0.5) return "ETH";
	if (roll < 0.85) return "SOL";
	return "LTC";
}

function generateUsdTarget() {
	const roll = Math.random();

	if (roll < 0.55) return randomFloat(5, 25, 2);
	if (roll < 0.88) return randomFloat(25, 70, 2);
	if (roll < 0.97) return randomFloat(70, 150, 2);
	return randomFloat(150, 500, 2);
}

export function generateFakeWallet(prices: Record<string, number>) {
	const network = pickNetwork();

	let address = "";
	if (network === "BTC") address = generateFakeBTCAddress();
	if (network === "ETH") address = generateFakeETHAddress();
	if (network === "SOL") address = generateFakeSOLAddress();
	if (network === "LTC") address = generateFakeLTCAddress();

	const usdTarget = generateUsdTarget();
	const price = Number(prices[network] ?? 0);

	let balance = 0;

	if (Number.isFinite(price) && price > 0) {
		balance = Number((usdTarget / price).toFixed(6));
	} else {
		if (network === "BTC") balance = randomFloat(0.00008, 0.004);
		if (network === "ETH") balance = randomFloat(0.003, 0.12);
		if (network === "SOL") balance = randomFloat(0.05, 5);
		if (network === "LTC") balance = randomFloat(0.01, 3);
	}

	return {
		id: crypto.randomUUID(),
		network,
		address,
		balance,
		foundAt: new Date().toLocaleString()
	};
}

type MachineStateParams = {
	hasActiveLicense: boolean;
	keysPerMinute: number;
	activatedAt?: Date | null;
	expiresAt?: Date | null;
	totalAttempts?: number;
};

export function getMachineState({
	hasActiveLicense,
	keysPerMinute,
	activatedAt,
	expiresAt,
	totalAttempts = 0
}: MachineStateParams) {
	const phrase = generatePhrase();

	const statuses = [
		"Initializing simulation node...",
		"Generating synthetic phrase candidates...",
		"Evaluating fake keyspace...",
		"Checking demo wallet balances...",
		"Processing synthetic scan session..."
	];

	if (!hasActiveLicense || !activatedAt || !expiresAt) {
		return {
			phrase,
			attemptsPerTick: 0,
			attemptsPerMinute: 0,
			totalAttempts: 0,
			uptimeHours: 0,
			uptimeText: "0d 0h 0m",
			status: "Machine offline - valid license required",
			nextDiscoveryEta: "Unavailable",
			wallet: null
		};
	}

	const now = new Date();
	const uptimeMs = Math.max(now.getTime() - activatedAt.getTime(), 0);
	const totalMinutes = Math.floor(uptimeMs / 60000);
	const uptimeHours = Math.floor(totalMinutes / 60);

	const days = Math.floor(totalMinutes / 1440);
	const hours = Math.floor((totalMinutes % 1440) / 60);
	const minutes = totalMinutes % 60;

	const milestoneSize = 10_000_000;
	const currentMilestone = Math.floor(totalAttempts / milestoneSize);
	const nextMilestone = (currentMilestone + 1) * milestoneSize;
	const remainingAttempts = Math.max(0, nextMilestone - totalAttempts);
	const etaMinutes = Math.ceil(remainingAttempts / Math.max(1, keysPerMinute));
	const etaHours = Math.max(1, Math.round(etaMinutes / 60));

	return {
		phrase,
		attemptsPerTick: Math.max(1, Math.floor(keysPerMinute / 12)),
		attemptsPerMinute: keysPerMinute,
		totalAttempts,
		uptimeHours,
		uptimeText: `${days}d ${hours}h ${minutes}m`,
		status: pickRandom(statuses),
		nextDiscoveryEta: `~${etaHours} hours`,
		wallet: null
	};
}