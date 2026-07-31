"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

interface LoginFormProps {
  register: any;
  errors: any;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  serverError: string;
  isSubmitting: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
}

export default function LoginForm({
  register,
  errors,
  showPassword,
  setShowPassword,
  serverError,
  isSubmitting,
  onSubmit,
}: LoginFormProps) {
  return (
    <div className="mx-auto w-full max-w-[420px]">
      {/* Heading */}
      <h2 className="text-[44px] font-bold leading-none text-[#14213D]">
        Welcome
      </h2>

      <p className="mt-3 text-[17px] leading-7 text-[#D9A653]">
        Sign in to your Vantara AI orchestration dashboard.
      </p>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        {/* Email */}
        <div>
          <label className="mb-3 block text-sm font-semibold text-[#14213D]">
            Email
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              type="email"
              placeholder="hr@example.com"
              {...register("email")}
              className="h-12 rounded-xl border border-gray-300 bg-white pl-12 pr-4 text-[15px] shadow-sm transition-all duration-300 focus:border-[#D9A653] focus:ring-2 focus:ring-[#D9A653]/20"
            />
          </div>

          {errors.email && (
            <p className="mt-2 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-3 block text-sm font-semibold text-[#14213D]">
            Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className="h-12 rounded-xl border border-gray-300 bg-white pl-12 pr-12 text-[15px] shadow-sm transition-all duration-300 focus:border-[#D9A653] focus:ring-2 focus:ring-[#D9A653]/20"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-[#D9A653]"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="mt-2 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              {...register("remember")}
              className="rounded border-gray-300"
            />
            Remember me
          </label>

          <button
            type="button"
            className="font-medium text-[#D9A653] transition-colors hover:text-[#B8860B]"
          >
            Forgot password?
          </button>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        {/* Sign In Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-14 w-full rounded-xl bg-[#D9A653] text-[16px] font-semibold text-[#14213D] shadow-lg shadow-[#D9A653]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#C99833]"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}