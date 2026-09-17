import { LoginForm } from "@/components/LoginForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">Ajaia Docs</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">Sign in to your documents</h1>
      <p className="mt-2 mb-8 text-sm text-stone-600">
        Lightweight Google Docs–style editor for the Ajaia assessment. Use a seeded account — no email or paid auth.
      </p>
      <LoginForm />
    </main>
  );
}
