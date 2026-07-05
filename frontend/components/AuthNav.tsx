"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/session";

export default function AuthNav() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // localStorage isn't available during SSR, so this reads the external session
    // state after mount rather than during render (avoids a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(getSession()?.email ?? null);
  }, []);

  function handleSignOut() {
    clearSession();
    setEmail(null);
    router.push("/");
  }

  if (email) {
    return (
      <nav className="flex shrink-0 items-center gap-4 text-sm font-medium">
        <span className="hidden text-ink/60 sm:inline">{email}</span>
        <Link href="/create" className="text-brand-700 hover:text-brand-900">
          Document Types
        </Link>
        <Link href="/documents" className="text-brand-700 hover:text-brand-900">
          My Documents
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-brand-100 px-3 py-1.5 text-brand-700 hover:bg-brand-50"
        >
          Sign out
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex shrink-0 items-center gap-6 text-sm font-medium">
      <Link href="/create" className="text-brand-700 hover:text-brand-900">
        Document Types
      </Link>
      <Link href="/signin" className="text-brand-700 hover:text-brand-900">
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-md bg-brand-800 px-3 py-1.5 text-white shadow-sm hover:bg-brand-900"
      >
        Sign up
      </Link>
    </nav>
  );
}
