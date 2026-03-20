'use client';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-cactus-500 to-cactus-400 text-white px-6 py-3 flex items-center gap-3 shadow-md sticky top-0 z-50">
      <span className="text-2xl">🌵</span>
      <div>
        <h1 className="text-lg font-bold tracking-tight leading-tight">Sticker Cactus</h1>
        <p className="text-xs opacity-80">Name Drop Tool</p>
      </div>
      <span className="ml-2 bg-white/20 px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-wide">
        INTERNAL
      </span>
    </header>
  );
}
