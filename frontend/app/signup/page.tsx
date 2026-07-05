"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import AuthNav from "@/components/AuthNav";
import SiteHeader from "@/components/SiteHeader";
import { AuthCredentials, signUp } from "@/lib/auth";
import { setSession } from "@/lib/session";

export default function SignUpPage() {
  const router = useRouter();

  async function handleSignUp(credentials: AuthCredentials) {
    const result = await signUp(credentials);
    setSession(result.accessToken, result.email);
    router.push("/");
    return result;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader>
        <AuthNav />
      </SiteHeader>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
          <h1 className="mb-6 font-serif text-2xl font-semibold text-brand-900">Sign up</h1>
          <AuthForm submitLabel="Sign up" onSubmit={handleSignUp} />
        </div>
        <p className="mt-4 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-brand-700 hover:text-brand-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
