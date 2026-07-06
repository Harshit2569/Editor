import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Register | Editor",
  description: "Create a new account",
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px]" />
      
      <div className="w-full max-w-[400px] z-10">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create an account
          </h1>
          <p className="text-sm text-zinc-400">
            Enter your details to get started
          </p>
        </div>
        
        <RegisterForm />
        
        <p className="px-8 text-center text-sm text-zinc-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="hover:text-white underline underline-offset-4 decoration-zinc-500 hover:decoration-white transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
