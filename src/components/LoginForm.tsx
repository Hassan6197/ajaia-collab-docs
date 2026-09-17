"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "./Banner";

const DEMO_USERS = [
  { email: "ada@ajaia.dev", name: "Ada Lovelace (owner of shared Product brief)" },
  { email: "alan@ajaia.dev", name: "Alan Turing (sees Product brief as shared)" },
  { email: "grace@ajaia.dev", name: "Grace Hopper" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("ada@ajaia.dev");
  const [password, setPassword] = useState("docs1234");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Could not sign in.");
        return;
      }
      router.push("/docs");
      router.refresh();
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Banner message={error} />
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-base font-normal text-stone-900 outline-none ring-teal-700/30 focus:ring-2"
          autoComplete="username"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-base font-normal text-stone-900 outline-none ring-teal-700/30 focus:ring-2"
          autoComplete="current-password"
          required
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Seeded accounts (password: docs1234)</p>
        <ul className="mt-2 space-y-1">
          {DEMO_USERS.map((user) => (
            <li key={user.email}>
              <button
                type="button"
                className="text-left text-teal-800 underline-offset-2 hover:underline"
                onClick={() => {
                  setEmail(user.email);
                  setPassword("docs1234");
                }}
              >
                {user.email}
              </button>
              <span className="text-stone-500"> — {user.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
