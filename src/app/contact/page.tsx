import Link from "next/link";

export default function ContactPage() {
	return (
		<main className="contact-page">
			<div className="contact-shell">
				<header className="contact-header">
					<Link href="/" className="brand-link">
						BOTX IA
					</Link>

					<nav className="top-nav">
						<Link href="/" className="nav-link">
							Home
						</Link>
						<Link href="/login" className="nav-link">
							Login
						</Link>
						<Link href="/register" className="nav-link nav-link--primary">
							Register
						</Link>
					</nav>
				</header>

				<section className="contact-card">
					<div className="section-badge">Contact</div>
					<h1>Let&apos;s talk about the project</h1>
					<p>
						If you want to ask about the demo, the architecture, or the academic delivery, you can use this section as the system&apos;s informational contact area.
					</p>

					<div className="contact-grid">
						<div className="contact-box">
							<span>Email</span>
							<strong>contacto@botxia-demo.com</strong>
						</div>

						<div className="contact-box">
							<span>Location</span>
							<strong>La Plata, Buenos Aires</strong>
						</div>

						<div className="contact-box">
							<span>Project</span>
							<strong>Educational simulation of licenses and a synthetic engine</strong>
						</div>

						<div className="contact-box">
							<span>Status</span>
							<strong>Academic demo active</strong>
						</div>
					</div>

					<div className="contact-actions">
						<Link href="/register" className="hero-btn hero-btn--primary">
							Create account
						</Link>
						<Link href="/" className="hero-btn hero-btn--ghost">
							Back to home
						</Link>
					</div>
				</section>
			</div>
		</main>
	);
}