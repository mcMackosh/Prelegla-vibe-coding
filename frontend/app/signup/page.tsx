"use client";

import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signUp } from "@/lib/auth";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Sign up</h1>
      <AuthForm submitLabel="Sign up" onSubmit={signUp} />
      <p className="mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
