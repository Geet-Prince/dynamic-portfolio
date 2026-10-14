import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <Link href="/" className="mb-6 font-mono text-sm font-semibold text-ink">
        geetprince<span className="text-accent-blue">.me</span> <span className="text-subtle">/ admin</span>
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Welcome back.</h1>
      <p className="mb-6 mt-2 text-sm text-muted">Sign in to manage your portfolio — zero code required.</p>
      <LoginForm />
    </main>
  );
}
