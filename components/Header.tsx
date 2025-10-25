"use client";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuItem,
} from "@/components/ui/navigation-menu";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

interface HeaderProps {
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  } | null;
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isOpen, setOpen] = useState(false);

  const navigationItems = [
    {
      title: "Home",
      href: "/",
    },
  ];

  return (
    <header className="w-full z-40 bg-white border-b border-black">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Logo theme="light" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-2" suppressHydrationWarning>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link href={item.href}>
                      <Button variant="ghost" className="text-black hover:bg-gray-100">
                        {item.title}
                      </Button>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3 ml-6 border-l border-gray-300 pl-6" suppressHydrationWarning>
            {user ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-base font-bold">
                        {(user.name || user.email)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-base font-medium text-black">{user.name || user.email.split('@')[0]}</span>
                </Link>
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="border-black text-black hover:bg-gray-100"
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-black hover:bg-gray-100">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button
            variant="ghost"
            onClick={() => setOpen(!isOpen)}
            className="text-black hover:bg-gray-100"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-300 bg-white">
          <div className="container mx-auto py-4 px-6 flex flex-col gap-4" suppressHydrationWarning>
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-black hover:text-gray-600 py-2"
              >
                {item.title}
              </Link>
            ))}
            <div className="border-t border-gray-300 pt-4 flex flex-col gap-3" suppressHydrationWarning>
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 border border-gray-300 bg-gray-50 hover:bg-gray-100">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-base font-bold">
                          {(user.name || user.email)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-black">{user.name || user.email.split('@')[0]}</span>
                      <span className="text-xs text-gray-600">View profile</span>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onLogout?.();
                      setOpen(false);
                    }}
                    className="border-black text-black hover:bg-gray-100 w-full"
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button
                      variant="ghost"
                      className="text-black hover:bg-gray-100 w-full"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    <Button className="bg-black text-white hover:bg-gray-800 w-full">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
