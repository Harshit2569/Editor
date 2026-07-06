import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-full h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-violet-900/10 blur-[120px] rounded-full pointer-events-none" />
      {children}
    </div>
  )
}
