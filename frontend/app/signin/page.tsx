"use client";

import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import SiteHeader from "@/components/SiteHeader";
import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
          <h1 className="mb-6 font-serif text-2xl font-semibold text-brand-900">Sign in</h1>
          <AuthForm submitLabel="Sign in" onSubmit={signIn} />
        </div>
        <p className="mt-4 text-center text-sm text-ink/60">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-brand-700 hover:text-brand-900">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
