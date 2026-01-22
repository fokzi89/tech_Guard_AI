'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  FileText,
  MessageSquare,
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { ThemeToggle } from '@/app/components/ui/theme-toggle'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: ('super_admin' | 'org_admin' | 'technician')[]
}

interface VerticalNavProps {
  userRole: 'super_admin' | 'org_admin' | 'technician'
  userName: string
  orgName?: string
  onSignOut: () => void
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'org_admin', 'technician']
  },
  {
    label: 'Organizations',
    href: '/dashboard/admin/organizations',
    icon: Building2,
    roles: ['super_admin']
  },
  {
    label: 'Organization',
    href: '/dashboard/organization',
    icon: Building2,
    roles: ['org_admin']
  },
  {
    label: 'Members',
    href: '/dashboard/organization/members',
    icon: Users,
    roles: ['org_admin']
  },
  {
    label: 'Settings',
    href: '/dashboard/organization/settings',
    icon: Settings,
    roles: ['org_admin']
  },
  {
    label: 'Troubleshoot',
    href: '/dashboard/troubleshoot',
    icon: MessageSquare,
    roles: ['technician']
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['technician']
  }
]

export function VerticalNav({ userRole, userName, orgName, onSignOut }: VerticalNavProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole))

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <Menu className="h-6 w-6 text-foreground" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Vertical Navigation */}
      <nav
        className={`
          fixed top-0 left-0 h-screen w-64 bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out z-40
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">TechGuard AI</h1>
              {orgName && (
                <p className="text-xs text-muted-foreground truncate">{orgName}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                  transition-colors duration-150
                  ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* User Profile & Actions */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>

          {/* User Info */}
          <div className="px-2 py-3 rounded-lg bg-accent/50">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {userRole.replace('_', ' ')}
            </p>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
              text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Spacer for fixed nav on larger screens */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  )
}
