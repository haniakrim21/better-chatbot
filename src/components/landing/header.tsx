"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LandingHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b"
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-bold text-xl tracking-tight">
          Nabd
        </Link>

        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link
            href="#features"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
