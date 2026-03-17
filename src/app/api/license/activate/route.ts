import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { rateLimit } from "../../../../lib/rate-limit";
import { isAllowedOrigin } from "../../../../lib/request";

function normalizeCode(value: unknown) {
	return String(value || "").trim().toUpperCase();
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

		const limit = rateLimit(`license-activate:${session.userId}`, 10, 15 * 60 * 1000);
		if (!limit.ok) {
			return NextResponse.json({ error: "Too many activation attempts" }, { status: 429 });
		}

		const body = await req.json();
		const normalizedCode = normalizeCode(body?.code);

		if (!normalizedCode) {
			return NextResponse.json({ error: "Enter a license code" }, { status: 400 });
		}

		if (normalizedCode.length < 6 || normalizedCode.length > 64) {
			return NextResponse.json({ error: "Invalid license" }, { status: 400 });
		}

		const result = await prisma.$transaction(async (tx) => {
			const inventory = await tx.licenseInventory.findUnique({
				where: { code: normalizedCode }
			});

			if (!inventory) {
				return { error: "Invalid license", status: 400 as const };
			}

			if (
				inventory.status !== "AVAILABLE" &&
				inventory.assignedToUserId &&
				inventory.assignedToUserId !== session.userId
			) {
				return {
					error: "This license has already been used by another user",
					status: 400 as const
				};
			}

			const userLicense = await tx.license.findUnique({
				where: { userId: session.userId }
			});

			if (!userLicense) {
				return { error: "License not found for user", status: 404 as const };
			}

			if (inventory.status === "AVAILABLE") {
				const claimed = await tx.licenseInventory.updateMany({
					where: {
						id: inventory.id,
						status: "AVAILABLE"
					},
					data: {
						status: "USED",
						assignedToUserId: session.userId
					}
				});

				if (claimed.count !== 1) {
					return { error: "This license is no longer available", status: 409 as const };
				}
			}

			const activatedAt = new Date();
			const expiresAt = new Date(
				activatedAt.getTime() + inventory.durationDays * 24 * 60 * 60 * 1000
			);

			await tx.user.update({
				where: { id: session.userId },
				data: {
					scanAttempts: 0
				}
			});

			await tx.license.update({
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
			});

			await tx.licenseInventory.update({
				where: { id: inventory.id },
				data: {
					status: "USED",
					assignedToUserId: session.userId,
					activatedAt,
					expiresAt
				}
			});

			return {
				ok: true,
				message: `License activated for ${inventory.durationDays} days`,
				license: {
					code: inventory.code,
					tier: inventory.tier,
					priceUsd: inventory.priceUsd,
					keysPerMinute: inventory.keysPerMinute,
					expiresAt: expiresAt.toLocaleString()
				}
			};
		});

		if ("error" in result) {
			return NextResponse.json({ error: result.error }, { status: result.status });
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("license/activate error", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}