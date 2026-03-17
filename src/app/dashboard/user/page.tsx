"use client";

import { useEffect, useState } from "react";

export default function UserPage() {
	const [user, setUser] = useState<null | {
		firstName: string;
		lastName: string;
		email: string;
	}>(null);

	useEffect(() => {
		fetch("/api/auth/me", { cache: "no-store" })
			.then((res) => res.json())
			.then((data) => setUser(data.user));
	}, []);

	return (
		<div className="dashboard-page">
			<div className="page-header">
				<h1>User</h1>
				<p>Basic account information.</p>
			</div>

			<div className="panel user-card">
				<div className="user-row">
					<span>First name</span>
					<strong>{user?.firstName || "-"}</strong>
				</div>
				<div className="user-row">
					<span>Last name</span>
					<strong>{user?.lastName || "-"}</strong>
				</div>
				<div className="user-row">
					<span>Email</span>
					<strong>{user?.email || "-"}</strong>
				</div>
			</div>
		</div>
	);
}