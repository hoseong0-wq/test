import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
      <h1
        className="font-bangers text-5xl md:text-7xl text-gray-900 leading-none tracking-wide uppercase"
      >
        YouTube Thumbnails,
        <br />
        <span className="text-cyan-500">Made by AI</span>
      </h1>
      <p className="mt-6 text-gray-500 text-lg md:text-xl max-w-xl leading-relaxed">
        Enter your video topic and get a professional,
        <br />
        click-worthy thumbnail generated instantly.
      </p>
      <Link href="/auth" className="mt-10 px-8 py-3.5 rounded-full bg-gray-400/20 backdrop-blur-xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-800 font-semibold text-sm hover:bg-gray-400/30 transition-all duration-200">
        Start for Free
      </Link>
    </div>
  );
}
