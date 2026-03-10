"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import IconButton from "../ui/IconButton";
import ProfileModal from "./ProfileModal";

export default function NavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Get the current page info based on pathname
  const getPageInfo = () => {
    const fullPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const path = fullPath || 'dashboard';

    switch (path) {
      case 'dashboard':
      case '':
        return {
          title: 'Dashboard',
          description: 'Your leads. Your tasks. Your momentum — in one view.'
        };
      case 'deals':
        return {
          title: 'Deals',
          description: 'Track and manage all your commercial opportunities in one place.'
        };
      case 'todo':
        return {
          title: 'To-Do',
          description: 'Organize and follow all your daily actions, from client calls to internal steps.'
        };
      case 'meetings':
        return {
          title: 'Meetings',
          description: 'Schedule and manage all your meetings and appointments.'
        };
      case 'contact/customers':
        return {
          title: 'Customers',
          description: 'Keep track of every customer interaction, from onboarding to retention.'
        };
      case 'contact/companies':
        return {
          title: 'Companies',
          description: 'Keep track of every company interaction, from onboarding to retention.'
        };
      case 'prospects':
        return {
          title: 'Prospects',
          description: 'Manage and track all your prospect interactions, from first contact to qualification.'
        };
      case 'settings/workspace':
        return {
          title: 'Workspace Settings',
          description: 'Manage your workspace settings.'
        };
      case 'settings/users':
        return {
          title: 'User Settings',
          description: 'Manage all users of the platform.'
        };
      case 'settings/email':
        return {
          title: 'Email Settings',
          description: 'Configure email settings.'
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Your leads. Your tasks. Your momentum — in one view.'
        };
    }
  };

  const pageInfo = getPageInfo();

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth" });
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = session?.user?.name;
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    const email = session?.user?.email;
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="flex items-center h-[84px] w-full justify-between px-8 py-4 border-b border-white/20 luxury-glass relative z-40">
        <div className="flex flex-col w-full h-[52px] gap-[4px]">
          <h1 className="text-xl font-semibold leading-[28px] text-[var(--foreground)]">{pageInfo.title}</h1>
          <p className="text-sm leading-[20px] text-[var(--brand-gray)]">{pageInfo.description}</p>
        </div>

        <div className="flex items-center h-[40px] gap-4">
          <div className="flex items-center gap-3">
            <IconButton icon={
              <img src="/icons/NotificationIcon.svg"
                alt="Notification"
                className="h-6 w-6" />}
            />
            <IconButton icon={
              <img src="/icons/MessageIcon.svg"
                alt="Message"
                className="h-6 w-6" />}
            />
          </div>

          <div className="h-[40px] w-px bg-[var(--border-gray)]"></div>

          <div className="flex items-center gap-2 relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-white/40 transition-all duration-300 floating-luxury"
            >
              <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm shadow-lg border border-white/20">
                {getUserInitials()}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-gray-900 leading-tight">
                  {session?.user?.name || 'User'}
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  {session?.user?.role || 'User'}
                </span>
              </div>
              <img src="/icons/Down-Arrow.svg" alt="Menu" className="h-4 w-4 opacity-50" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-3 w-56 luxury-glass floating-luxury rounded-2xl shadow-2xl z-50 border border-white/30 overflow-hidden backdrop-blur-2xl">
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-5 py-3 text-left text-sm font-bold text-gray-800 hover:bg-white/50 flex items-center gap-3 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 007-7z" />
                      </svg>
                    </div>
                    <span>My Profile</span>
                  </button>
                  <div className="mx-4 my-1 h-px bg-white/20"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50/50 flex items-center gap-3 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={session?.user ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        } : null}
        onUpdate={() => {
          setIsProfileModalOpen(false);
        }}
      />
    </>
  );
}
