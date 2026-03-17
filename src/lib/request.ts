export function getClientIp(req: Request) {
	const forwardedFor = req.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim();
	}

	const realIp = req.headers.get("x-real-ip");
	if (realIp) {
		return realIp.trim();
	}

	return "unknown";
}

export function isAllowedOrigin(req: Request) {
	const origin = req.headers.get("origin");
	const host = req.headers.get("host");

	if (!host) return false;
	if (!origin) return true;

	try {
		const originUrl = new URL(origin);
		return originUrl.host === host;
	} catch {
		return false;
	}
}