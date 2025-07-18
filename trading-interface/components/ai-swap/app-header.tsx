"use client";

// import { Link, useLocation } from "react-router-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const DEFAULT_AGENT_ID = "acc5e818-17b3-0509-8411-89882fdb9ce3";

  const navItems = [
    { name: "Chat", path: `/app/chat/${DEFAULT_AGENT_ID}` },
    { name: "Analytics", path: "/app/analytics" },
    { name: "Portfolio", path: "/app/portfolio" },
    { name: "Settings", path: "/app/settings" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.svg"
            alt="AI Agent Logo"
            className="h-6 w-6"
            width={1024}
            height={1024}
          />
          <span className="text-white font-semibold">Vistia</span>
        </Link>

        {/* Mobile Menu Button - Centered */}
        <div className="lg:hidden absolute left-1/2 -translate-x-1/2">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#7f00ff] hover:bg-[#7f00ff]/10 hover:text-[#7f00ff]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-sm transition-colors px-6 ${
                pathname.includes(item.path.split("/")[2])
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-14 z-40 bg-[#121212] lg:hidden min-h-[calc(100vh-3.5rem)]">
            <nav className="flex flex-col items-center py-8 gap-8 bg-[#121212] h-full">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-lg font-medium transition-colors ${
                    pathname.includes(item.path.split("/")[2])
                      ? "text-[#7f00ff]"
                      : "text-muted-foreground hover:text-[#7f00ff]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
