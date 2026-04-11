import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4">
      {/* Logo + Text */}
      <div className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="Try out logo" width={32} height={32} className="rounded-md" />
        <span className="text-gray-900 font-semibold text-lg tracking-tight">Try out</span>
      </div>

      {/* Center links */}
      <div className="hidden md:flex items-center gap-8">
        {['Features', 'Pricing', 'Contact'].map((item) => (
          <a
            key={item}
            href="#"
            className="text-gray-500 hover:text-gray-900 text-sm transition-colors duration-200"
          >
            {item}
          </a>
        ))}
      </div>

      {/* CTA */}
      <Link href="/auth" className="px-5 py-2 rounded-full bg-gray-400/20 backdrop-blur-xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-800 text-sm font-semibold hover:bg-gray-400/30 transition-all duration-200">
        Get Started
      </Link>
    </nav>
  );
}
