"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setErrorMessage(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (!result) {
        setErrorMessage("Failed to process login. Try again.");
        return;
      }

      if (result.error) {
        setErrorMessage("Invalid credentials or network error.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Unable to login due to network issue.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold">SDD Navigator Login</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Sign in to access dashboard coverage metrics.
        </p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          {errorMessage ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
