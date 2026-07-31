"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";

import LoginLayout from "@/components/login/LoginLayout";
import LeftPanel from "@/components/login/LeftPanel";
import LoginForm from "@/components/login/LoginForm";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  const setAuth = useAuthStore((state) => state.login);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormData) => {
    setServerError("");

    try {
      const user = await login(values);

      setAuth(user);

      router.push("/dashboard");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Login failed"
      );
    }
  };

  return (
    <LoginLayout
      left={<LeftPanel />}
      right={
        <LoginForm
          register={register}
          errors={errors}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          serverError={serverError}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit(onSubmit)}
        />
      }
    />
  );
}