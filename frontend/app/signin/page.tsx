"use client";

import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Sign in</h1>
      <AuthForm submitLabel="Sign in" onSubmit={signIn} />
      <p className="mt-4 text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
