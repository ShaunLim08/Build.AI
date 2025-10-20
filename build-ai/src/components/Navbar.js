'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Don't show navbar on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthPage) {
      fetchUser();
    }
  }, [pathname, isAuthPage]);

  if (isAuthPage) return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/buildailogo.png"
              alt="Build.AI Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-semibold text-foreground">
              Build.AI
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-9 w-32 animate-pulse rounded-lg bg-muted"></div>
            ) : user ? (
              // Logged in - Show welcome message, profile, and sign out
              <div className="flex items-center space-x-4">
                {/* Welcome Message */}
                <span className="hidden sm:inline text-sm font-medium text-foreground">
                  Welcome, {user.name}
                </span>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-accent"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      ></div>

                      {/* Menu */}
                      <div className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-lg border border-border bg-card shadow-xl">
                        <div className="border-b border-border px-4 py-3">
                          <p className="text-sm font-semibold text-card-foreground mb-1">Profile Information</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Username:</span>
                              <span className="font-medium text-card-foreground">{user.name}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">User ID:</span>
                              <span className="font-mono text-card-foreground">{user._id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Sign Out Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="text-sm font-medium text-error border-error hover:bg-error/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            ) : (
              // Not logged in - Show login/register buttons
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="text-sm font-semibold">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
