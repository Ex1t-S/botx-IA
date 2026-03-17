const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function randomBlock(length = 6) {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

function makeCode(prefix) {
	return `BOTX-${prefix}-${randomBlock(6)}`;
}

async function main() {
	const licenses = [
		...Array.from({ length: 10 }, () => ({
			code: makeCode("ST"),
			tier: "STARTER",
			priceUsd: 50,
			keysPerMinute: 1000,
			durationDays: 7,
			rank: 1,
			status: "AVAILABLE",
		})),
		...Array.from({ length: 10 }, () => ({
			code: makeCode("PR"),
			tier: "PRO",
			priceUsd: 200,
			keysPerMinute: 10000,
			durationDays: 7,
			rank: 2,
			status: "AVAILABLE",
		})),
		...Array.from({ length: 10 }, () => ({
			code: makeCode("UL"),
			tier: "ULTRA",
			priceUsd: 500,
			keysPerMinute: 35000,
			durationDays: 7,
			rank: 3,
			status: "AVAILABLE",
		})),
	];

	for (const license of licenses) {
		await prisma.licenseInventory.create({ data: license });
	}

	console.log("Licencias creadas correctamente");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});