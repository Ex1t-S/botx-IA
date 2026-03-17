import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
	try {
		const session = await getCurrentUserFromCookie();

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const code = body?.code;

		if (!code || typeof code !== "string") {
			return NextResponse.json({ error: "Enter a license code" }, { status: 400 });
		}

		const normalizedCode = code.trim().toUpperCase();

		const inventory = await prisma.licenseInventory.findUnique({
			where: { code: normalizedCode }
		});

		if (!inventory) {
			return NextResponse.json({ error: "Invalid license" }, { status: 400 });
		}

		if (
			inventory.status !== "AVAILABLE" &&
			inventory.assignedToUserId &&
			inventory.assignedToUserId !== session.userId
		) {
			return NextResponse.json(
				{ error: "This license has already been used by another user" },
				{ status: 400 }
			);
		}

		const userLicense = await prisma.license.findUnique({
			where: { userId: session.userId }
		});

		if (!userLicense) {
			return NextResponse.json(
				{ error: "License not found for user" },
				{ status: 404 }
			);
		}

		const activatedAt = new Date();
		const expiresAt = new Date(
			activatedAt.getTime() + inventory.durationDays * 24 * 60 * 60 * 1000
		);

		await prisma.$transaction([
			prisma.user.update({
				where: { id: session.userId },
				data: {
					scanAttempts: 0
				}
			}),
			prisma.license.update({
				where: { id: userLicense.id },
				data: {
					code: inventory.code,
					tier: inventory.tier,
					priceUsd: inventory.priceUsd,
					keysPerMinute: inventory.keysPerMinute,
					machineEnabled: true,
					activatedAt,
					expiresAt,
					status: "ACTIVE",
					lastProcessedMilestone: 0,
					inventoryId: inventory.id
				}
			}),
			prisma.licenseInventory.update({
				where: { id: inventory.id },
				data: {
					status: "USED",
					assignedToUserId: session.userId,
					activatedAt,
					expiresAt
				}
			})
		]);

		return NextResponse.json({
			message: `License activated for ${inventory.durationDays} days`,
			license: {
				code: inventory.code,
				tier: inventory.tier,
				priceUsd: inventory.priceUsd,
				keysPerMinute: inventory.keysPerMinute,
				expiresAt: expiresAt.toLocaleString()
			}
		});
	} catch (error) {
		console.error("license/activate error", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}