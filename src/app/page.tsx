import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
	return (
		<main className="hero-page">
			<div className="hero-bg hero-bg--one" />
			<div className="hero-bg hero-bg--two" />
			<div className="hero-noise" />

			<div className="hero-brand-logo-wrap">
	<Image
		src="/images/botxia-logo.png"
		alt="BOTX IA"
		fill
		className="hero-brand-logo"
		priority
	/>
</div>

			<div className="hero-shell">
				<header className="hero-header">
					<div />
					<nav className="top-nav">
						<Link href="/contact" className="nav-link">
							Contact
						</Link>
						<Link href="/login" className="nav-link">
							Login
						</Link>
						<Link href="/register" className="nav-link nav-link--primary">
							Register
						</Link>
					</nav>
				</header>

				<section className="hero-main">
					<div className="hero-copy">
						<div className="section-badge">AI-powered dormant wallet search</div>

						<h1 className="hero-title">
							Intelligent exploration
							<br />
							of private keys from
							<br />
							<span>forgotten wallets</span>
						</h1>

						<p className="hero-text">
							BOTX IA is a cryptocurrency wallet private key search platform that combines
							brute force with artificial intelligence to detect patterns and locate wallets
							that have been left dormant or forgotten.
						</p>

						<div className="hero-stats">
							<div className="hero-stat">
								<span>Mode</span>
								<strong>Brute Force + AI</strong>
							</div>

							<div className="hero-stat">
								<span>Licenses</span>
								<strong>STARTER-PLUS-ULTRA</strong>
							</div>

							<div className="hero-stat">
								<span>Engine</span>
								<strong>Kiling 2.0</strong>
							</div>
						</div>
					</div>

					<div className="hero-panel">
						<div className="scan-card">
							<div className="scan-header">
								<span className="scan-dot" />
								<p>Kiling 2.0 exploration engine</p>
							</div>

							<div className="scan-grid">
								<span>lorvex</span>
								<span>tanori</span>
								<span>pelmuk</span>
								<span>zafrin</span>
								<span>morlek</span>
								<span>vintar</span>
								<span>xelmon</span>
								<span>parvok</span>
								<span>niltre</span>
								<span>zormia</span>
								<span>caldrix</span>
								<span>fernox</span>
							</div>

							<div className="scan-status">
								<div className="scan-line">
									<span>Status</span>
									<strong>License required</strong>
								</div>

								<div className="scan-line">
									<span>Visual finding ETA</span>
									<strong>Activate license</strong>
								</div>

								<div className="scan-line">
									<span>Attempts / cycle per minute</span>
									<strong>Depends on plan</strong>
								</div>
							</div>
						</div>

						<div className="info-card">
							<h3>License plans</h3>
							<p>Starter — USD 50 — 1,000 keys/min</p>
							<p>Pro — USD 200 — 10,000 keys/min</p>
							<p>Ultra — USD 500 — 35,000 keys/min</p>
							<p>
The wallets and balances found are for the exclusive use of the user, and their use is the user's sole responsibility.
							</p>

							<Link href="/contact" className="inline-link">
								View contact →
							</Link>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}