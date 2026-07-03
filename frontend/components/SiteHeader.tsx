import Link from "next/link";

export default function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-800 font-serif text-base font-semibold text-accent-400">
            L
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-brand-900">
            LegalFlow
          </span>
        </Link>
        {children}
      </div>
    </header>
  );
}
