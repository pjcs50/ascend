import { Link, useLocation, Outlet } from 'react-router-dom'
import { motion } from 'motion/react'
import { LayoutGrid, CircleCheckBig, Users, NotebookPen, Sparkles, LogOut, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Command', icon: LayoutGrid },
  { to: '/habits', label: 'Habits', icon: CircleCheckBig },
  { to: '/people', label: 'People', icon: Users },
  { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/forge', label: 'Forge', icon: Sparkles },
]

function useIsActive() {
  const { pathname } = useLocation()
  return (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))
}

const spring = { type: 'spring', stiffness: 500, damping: 40 } as const

export function AppShell() {
  const signOut = useAuthStore((s) => s.signOut)
  const isActive = useIsActive()

  return (
    <div className="flex min-h-full bg-neutral-950 text-neutral-100">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-800/80 p-4 md:flex">
        <div className="font-logo select-none px-3 pb-6 pt-2 text-4xl leading-none text-neutral-100">
          ascend
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => {
            const active = isActive(n.to)
            const Icon = n.icon
            return (
              <Link
                key={n.to}
                to={n.to}
                className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-desktop"
                    className="absolute inset-0 rounded-lg bg-neutral-800"
                    transition={spring}
                  />
                )}
                <Icon
                  size={17}
                  className={`relative transition-colors ${active ? 'text-neutral-100' : 'text-neutral-500'}`}
                />
                <span
                  className={`relative transition-colors ${active ? 'text-neutral-100' : 'text-neutral-400'}`}
                >
                  {n.label}
                </span>
              </Link>
            )
          })}
        </nav>
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-300"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom bar (mobile) — frosted */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl md:hidden">
        {NAV.map((n) => {
          const active = isActive(n.to)
          const Icon = n.icon
          return (
            <Link
              key={n.to}
              to={n.to}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px]"
            >
              <Icon size={20} className={active ? 'text-neutral-100' : 'text-neutral-500'} />
              <span className={active ? 'text-neutral-100' : 'text-neutral-500'}>{n.label}</span>
              {active && (
                <motion.span
                  layoutId="nav-active-mobile"
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-neutral-100"
                  transition={spring}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
