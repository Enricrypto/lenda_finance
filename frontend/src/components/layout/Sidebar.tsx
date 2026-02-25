"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Icon } from "@iconify/react"
import { NAV_ITEMS } from "@/lib/constants"
import LendaLogo from "@/components/landing/LendaLogo"

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??"

  return (
    <aside className='w-64 bg-background border-r border-white/6 flex-col hidden md:flex h-full fixed left-0 top-0 z-30'>
      {/* Logo */}
      <div className='h-16 flex items-center px-6 border-b border-white/6'>
        <LendaLogo size="sm" textColor="text-white" />
      </div>

      {/* Navigation */}
      <nav className='flex-1 overflow-y-auto py-6 px-3 space-y-1'>
        <p className='px-3 text-xs font-medium text-zinc-600 uppercase tracking-wider mb-2'>
          Platform
        </p>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-white/8 text-white"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <Icon
                icon={item.icon}
                className={`w-5 h-5 ${isActive ? "text-cyan-400" : "text-zinc-600"}`}
              />
              <span className='text-sm font-medium'>{item.label}</span>
            </Link>
          )
        })}

        <div className='pt-6'>
          <p className='px-3 text-xs font-medium text-zinc-600 uppercase tracking-wider mb-2'>
            Management
          </p>
          <Link
            href='/settings'
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === "/settings"
                ? "bg-white/8 text-white"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <Icon
              icon='mdi:cog'
              className={`w-5 h-5 ${
                pathname === "/settings" ? "text-cyan-400" : "text-zinc-600"
              }`}
            />
            <span className='text-sm font-medium'>Settings</span>
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className='p-4 border-t border-white/6'>
        <div className='flex items-center gap-3 p-2 rounded-lg bg-white/4 border border-white/6'>
          <div className='w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-medium text-xs'>
            {initials}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-white truncate'>
              {session?.user?.name || "Loading..."}
            </p>
            <p className='text-xs text-zinc-500 truncate'>
              {session?.user?.email || ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className='text-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors'
            title='Sign out'
          >
            <Icon icon='mdi:logout' className='w-4 h-4' />
          </button>
        </div>
      </div>
    </aside>
  )
}
