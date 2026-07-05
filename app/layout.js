import './globals.css';

export const metadata = {
  title: 'Raw Deal Verifier | REI Platform',
  description:
    'Analyze real estate deals against Bible underwriting standards',
  keywords: ['real estate', 'underwriting', 'analysis', 'investment'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav className="navbar">
            <div className="container">
              <div className="logo">
                <h1>REI Raw Deal Verifier</h1>
              </div>
              <p className="tagline">Bible v11.24 Underwriting Standards</p>
            </div>
          </nav>
        </header>

        <main className="container">
          {children}
        </main>

        <footer>
          <p>&copy; 2026 Good People Good Homes. All rights reserved.</p>
          <p>
            <small>
              This analysis tool uses Bible v11.24 locked constants for
              underwriting standards.
            </small>
          </p>
        </footer>
      </body>
    </html>
  );
}
