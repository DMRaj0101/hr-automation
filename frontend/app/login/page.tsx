"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/common/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setServerError("");
    try {
      const user = await login(values);
      setAuth(user);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div
        className="flex min-h-screen flex-col text-white md:w-[44%]"
        style={{
          background: "linear-gradient(160deg, #1b2c52, #0A1226)",
          padding: 64,
          justifyContent: "space-between",
        }}
      >
        <Logo light />
        <div>
          <h1 className="max-w-md text-3xl font-bold leading-tight md:text-4xl">
            One system for every stage of the employee lifecycle.
          </h1>
          <div className="relative mt-12 space-y-8 pl-1">
            <div
              className="absolute top-1 bottom-1"
              style={{ left: 6, width: 2, background: "rgba(255,255,255,0.15)" }}
            />
            <div className="relative flex items-center gap-3">
              <span
                className="z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                style={{ backgroundColor: "#D9A653" }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                01
              </span>
              <span className="font-medium text-white">Onboarding</span>
            </div>
            <div className="relative flex items-center gap-3">
              <span
                className="z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                style={{ border: "2px solid rgba(255,255,255,0.4)", backgroundColor: "transparent" }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                02
              </span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Offboarding</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} Vantara. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-vantara-bg p-8">
        <div className="w-full max-w-[380px]">
          <h2 className="text-[36px] font-bold text-vantara-navy">Welcome</h2>
          <p className="mb-9 mt-2 text-[15px] text-vantara-text-muted">
            Sign in to access the Vantara orchestration dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-vantara-navy">
                Email
              </label>
              <Input
                type="email"
                placeholder="hr@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-vantara-navy">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold"
                  style={{ color: "#D9A653" }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-vantara-text-muted">
                <input type="checkbox" {...register("remember")} className="rounded border-vantara-border" />
                Remember me
              </label>
              <a href="#" className="text-vantara-gold hover:underline">
                Forgot password?
              </a>
            </div>

            {serverError && (
              <p className="text-sm text-red-600">{serverError}</p>
            )}

            <Button
              type="submit"
              className="w-full justify-center"
              disabled={isSubmitting}
              style={{ backgroundColor: "#D9A653", color: "#14213D" }}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-xs text-vantara-text-faint">
              Demo credentials: hr@example.com / VantaraHR#2026
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
