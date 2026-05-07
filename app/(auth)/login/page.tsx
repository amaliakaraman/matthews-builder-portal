import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { BrandLogo } from "@/components/brand/brand-logo";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 surface-deep">
      <section className="hidden lg:flex flex-col justify-between p-12">
        <BrandLogo variant="white" />
        <div className="max-w-md">
          <p className="text-xs uppercase tracking-[0.18em] text-platinum/70 mb-3">
            Citizen Builder Program
          </p>
          <h1 className="font-display text-5xl font-black text-white leading-[1.05] tracking-tight">
            One front door for every internal app at Matthews.
          </h1>
          <p className="mt-6 text-platinum/80 max-w-sm">
            Register a new build, walk the classification wizard, and track
            every project's milestones in one place. Replaces Wrike for
            Citizen Builder tracking.
          </p>
        </div>
        <p className="text-xs text-platinum/60">
          Internal use only. Matthews™ confidential.
        </p>
      </section>
      <section className="flex flex-col justify-center bg-white p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden mb-10">
            <BrandLogo variant="blue" />
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-matthews-deep/60 mb-2">
            Welcome
          </p>
          <h2 className="font-display text-3xl font-black text-matthews-deep tracking-tight">
            Sign in to Builder Portal
          </h2>
          <p className="mt-3 text-sm text-matthews-deep/70">
            We'll send you a one-time magic link. Use your Matthews email.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
