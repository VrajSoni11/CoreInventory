import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, ClipboardList, History, Settings,
  ChevronDown, LogOut, User, Menu, Package2, AlertTriangle, BarChart2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Products', icon: Package, to: '/products' },
  {
    label: 'Operations', icon: ClipboardList, children: [
      { label: 'Receipts', icon: ArrowDownToLine, to: '/operations/receipts' },
      { label: 'Deliveries', icon: ArrowUpFromLine, to: '/operations/deliveries' },
      { label: 'Transfers', icon: ArrowLeftRight, to: '/operations/transfers' },
      { label: 'Adjustments', icon: AlertTriangle, to: '/operations/adjustments' },
    ]
  },
  { label: 'Analysis', icon: BarChart2, to: '/analysis' },
  { label: 'Move History', icon: History, to: '/history' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

function NavItem({ item, collapsed }) {
  const [open, setOpen] = useState(true)

  if (item.children) {
    return (
      <div>
        <button onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium">
          <item.icon size={18} className="shrink-0" />
          {!collapsed && <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </>}
        </button>
        {open && !collapsed && (
          <div className="ml-6 mt-1 space-y-0.5 border-l border-white/5 pl-3">
            {item.children.map(child => (
              <NavLink key={child.to} to={child.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                    isActive ? 'text-brand-500 bg-brand-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}>
                <child.icon size={15} className="shrink-0" />
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive ? 'text-brand-500 bg-brand-500/10 border border-brand-500/20' : 'text-white/50 hover:text-white hover:bg-white/5'
        }`}>
      <item.icon size={18} className="shrink-0" />
      {!collapsed && item.label}
    </NavLink>
  )
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/30 rounded-lg flex items-center justify-center shrink-0">
          <Package2 size={16} className="text-brand-500" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-sm tracking-tight">
            Core<span className="text-brand-500">Inventory</span>
          </span>
        )}
      </div>

      {/* Nav - scrollable if needed but fixed */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => <NavItem key={item.label} item={item} collapsed={collapsed} />)}
      </nav>

      {/* Profile */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <div className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-200">
            <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center shrink-0 text-brand-500 text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-white/30 text-xs truncate">{user?.role}</p>
              </div>
            )}
            {!collapsed && <ChevronDown size={14} className={`text-white/30 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />}
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#16213e] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
              <NavLink to="/profile" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                <User size={15} /> My Profile
              </NavLink>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/5 transition-colors">
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    // KEY FIX: h-screen overflow-hidden on root so sidebar never scrolls with content
    <div className="h-screen bg-brand-900 flex overflow-hidden">

      {/* Desktop Sidebar - fixed height, never scrolls */}
      <aside className={`hidden lg:flex flex-col bg-[#0f0f23] border-r border-white/5 transition-all duration-300 shrink-0 h-full relative ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0f0f23] border border-white/10 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors z-10">
          <ChevronDown size={11} className={`transition-transform duration-300 ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-[#0f0f23] border-r border-white/5 flex flex-col h-full">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content area - scrolls independently */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f23] shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="text-white font-bold text-sm">Core<span className="text-brand-500">Inventory</span></span>
          <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center text-brand-500 text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Page content - only this scrolls */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}