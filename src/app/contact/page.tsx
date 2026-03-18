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
						If you want to ask about the Botx IA, informational contact area.
					</p>

					<div className="contact-grid">
						<div className="contact-box">
							<span>Email</span>
							<strong>botxiabt@hotmail.com</strong>
						</div>

						<div className="contact-box">
						<span>Social media</span>

						<div className="social-links">
							<a
								href="https://www.instagram.com/botx_ia/"
								target="_blank"
								rel="noopener noreferrer"
								className="contact-link"
							>
								Instagram
							</a>

							<a
								href="https://x.com/botx_ia"
								target="_blank"
								rel="noopener noreferrer"
								className="contact-link"
							>
								Twitter / X
							</a>
						</div>
						</div>

						<div className="contact-box">
							<span>Location</span>
							<strong>United Arab Emirates</strong>
						</div>

						<div className="contact-box">
							<span>Project</span>
							<strong>botx ia phrase recovery seeds with brute force</strong>
						</div>

						<div className="contact-box">
							<span>Status</span>
							<strong>Killing 2.0 motor</strong>
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