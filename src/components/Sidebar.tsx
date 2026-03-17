"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
	{ href: "/dashboard", label: "Home" },
	{ href: "/dashboard/machine", label: "Machine" },
	{ href: "/dashboard/license", label: "License" },
	{ href: "/dashboard/findings", label: "Findings" },
	{ href: "/dashboard/withdrawals", label: "Withdrawals" },
	{ href: "/dashboard/user", label: "User" },
];

export default function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();

	async function logout() {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
	}

	return (
		<aside className="sidebar">
			<div>
				<div className="sidebar__brand">BOTX IA</div>
				<nav className="sidebar__nav">
					{items.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`sidebar__link ${pathname === item.href ? "is-active" : ""}`}
						>
							{item.label}
						</Link>
					))}
				</nav>
			</div>

			<button className="btn btn-secondary" onClick={logout}>Log out</button>
		</aside>
	);
}