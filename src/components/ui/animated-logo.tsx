"use client";

import { motion, Variants } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AnimatedLogo() {
  const text = "Nabd";

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className="flex items-center gap-2 cursor-pointer"
      variants={container}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        variants={child}
        className="bg-primary text-primary-foreground p-1.5 rounded-lg"
      >
        <Sparkles className="w-5 h-5" />
      </motion.div>
      <div className="flex overflow-hidden font-bold text-2xl tracking-tighter">
        {text.split("").map((letter, index) => (
          <motion.span variants={child} key={index}>
            {letter}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
