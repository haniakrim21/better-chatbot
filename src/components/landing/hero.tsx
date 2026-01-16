"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-48 md:pb-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-muted/50 backdrop-blur-sm"
          >
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">New Generation AI</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent max-w-4xl"
          >
            Experience the Future of <br className="hidden md:block" />
            Intelligent Conversation
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Unlock the power of advanced AI with Nabd. Seamlessly integrate,
            customize, and deploy intelligent agents that understand your needs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center"
          >
            <Button
              asChild
              size="lg"
              className="h-12 px-8 text-base rounded-full"
            >
              <Link href="/sign-in">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base rounded-full"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-50" />
      <div className="absolute bottom-0 right-0 -z-10 w-[600px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full opacity-30" />
    </section>
  );
}
