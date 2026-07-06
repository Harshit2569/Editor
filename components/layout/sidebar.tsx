"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Users, Trash2, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { name: "All Documents", href: "/dashboard", icon: FileText },
    { name: "Shared with me", href: "/dashboard/shared", icon: Users },
    { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
  ]

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-col h-full z-20">
      <div className="p-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          Editor
        </h2>
      </div>

     

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? "bg-zinc-800/80 text-white" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          {/* <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors text-sm font-medium">
            <Settings className="w-4 h-4" />
            Settings
          </button> */}
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
