"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");

		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});

		const data = await res.json();
		setLoading(false);

		if (!res.ok) {
			setError(data.error || "Invalid credentials");
			return;
		}

		router.push("/dashboard");
	}

	return (
		<div className="auth-page">
			<form className="auth-card" onSubmit={handleSubmit}>
				<div className="auth-card__top">
					<Link href="/" className="nav-link">
						← Back to home
					</Link>
				</div>

				<h1>Sign in</h1>

				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>

				{error && <div className="error-box">{error}</div>}

				<button className="btn btn-primary" disabled={loading}>
					{loading ? "Signing in..." : "Log in"}
				</button>
			</form>
		</div>
	);
}