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
    <header className="w-full z-40 bg-black border-b-2 border-white">
      <div className="container mx-auto flex items-center justify-between py-3 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Logo theme="dark" size="md" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-2" suppressHydrationWarning>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link href={item.href}>
                      <Button variant="ghost" className="text-sm font-bold uppercase text-white hover:bg-gray-800 transition-all">
                        {item.title}
                      </Button>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3 ml-6 border-l-2 border-white pl-6" suppressHydrationWarning>
            {user ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 border-2 border-white bg-black hover:bg-gray-800 transition-all">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-8 h-8 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <span className="text-black text-sm font-bold">
                        {(user.name || user.email)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-bold uppercase text-white">{user.name || user.email.split('@')[0]}</span>
                </Link>
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="border-2 border-white text-white text-sm font-bold uppercase hover:bg-gray-800 transition-all bg-black"
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-sm font-bold uppercase text-white hover:bg-gray-800 transition-all">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-white text-black text-sm font-bold uppercase hover:bg-gray-100 transition-all border-2 border-white">
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
            className="text-white hover:bg-gray-800 transition-all border-2 border-white p-2"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden border-t-2 border-white bg-black">
          <div className="container mx-auto py-4 px-6 flex flex-col gap-4" suppressHydrationWarning>
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-white font-bold uppercase text-sm hover:bg-gray-800 py-2 px-2 transition-all"
              >
                {item.title}
              </Link>
            ))}
            <div className="border-t-2 border-white pt-4 flex flex-col gap-3" suppressHydrationWarning>
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 border-2 border-white bg-black hover:bg-gray-800 transition-all">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'User'}
                        className="w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white flex items-center justify-center">
                        <span className="text-black text-base font-bold">
                          {(user.name || user.email)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase text-white">{user.name || user.email.split('@')[0]}</span>
                      <span className="text-xs text-gray-400">View profile</span>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onLogout?.();
                      setOpen(false);
                    }}
                    className="border-2 border-white text-white text-sm font-bold uppercase hover:bg-gray-800 w-full transition-all bg-black"
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button
                      variant="ghost"
                      className="text-white font-bold uppercase text-sm hover:bg-gray-800 w-full transition-all"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    <Button className="bg-white text-black text-sm font-bold uppercase hover:bg-gray-100 w-full transition-all border-2 border-white">
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
