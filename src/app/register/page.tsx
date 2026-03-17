"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

function validatePassword(password: string) {
	const hasUpper = /[A-Z]/.test(password);
	const hasLower = /[a-z]/.test(password);
	const hasNumber = /\d/.test(password);
	const hasSpecial = /[^A-Za-z0-9]/.test(password);

	if (password.length < 8) return "Password must be at least 8 characters long";
	if (!hasUpper) return "Password must include at least one uppercase letter";
	if (!hasLower) return "Password must include at least one lowercase letter";
	if (!hasNumber) return "Password must include at least one number";
	if (!hasSpecial) return "Password must include at least one special character";
	return "";
}

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");

		const passwordError = validatePassword(form.password);
		if (passwordError) {
			setError(passwordError);
			setLoading(false);
			return;
		}

		if (form.password !== form.confirmPassword) {
			setError("Passwords do not match");
			setLoading(false);
			return;
		}

		const res = await fetch("/api/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				firstName: form.firstName,
				lastName: form.lastName,
				email: form.email,
				password: form.password,
			}),
		});

		const data = await res.json();
		setLoading(false);

		if (!res.ok) {
			setError(data.error || "Could not register");
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

				<h1>Create account</h1>
				<p>Simple registration to access the dashboard.</p>

				<input
					placeholder="First name"
					value={form.firstName}
					onChange={(e) => setForm({ ...form, firstName: e.target.value })}
					required
				/>
				<input
					placeholder="Last name"
					value={form.lastName}
					onChange={(e) => setForm({ ...form, lastName: e.target.value })}
					required
				/>
				<input
					type="email"
					placeholder="Email"
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
					required
				/>
				<input
					type="password"
					placeholder="Password"
					value={form.password}
					onChange={(e) => setForm({ ...form, password: e.target.value })}
					required
				/>
				<input
					type="password"
					placeholder="Confirm password"
					value={form.confirmPassword}
					onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
					required
				/>

				{error && <div className="error-box">{error}</div>}

				<button className="btn btn-primary" disabled={loading}>
					{loading ? "Creating..." : "Sign up"}
				</button>
			</form>
		</div>
	);
}