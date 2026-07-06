import { Sidebar } from "@/components/layout/sidebar"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar user={session.user} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[500px] bg-violet-900/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="flex-1 overflow-auto z-10 p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
