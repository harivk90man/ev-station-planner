import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <span>Built with</span>
          <span className="text-emerald-400">⚡</span>
          <span>by Hariharan</span>
        </div>
        <nav className="flex gap-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            Home
          </Link>
          <Link href="/calculator" className="hover:text-zinc-300 transition-colors">
            Calculator
          </Link>
          <a
            href="https://github.com/harivk90man/ev-station-planner"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition-colors"
          >
            GitHub
          </a>
        </nav>
        <p className="text-xs text-zinc-600">© 2026 EV Station Planner. All rights reserved.</p>
      </div>
    </footer>
  );
}
