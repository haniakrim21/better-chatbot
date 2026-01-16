"use client";

import { motion } from "framer-motion";
import { Bot, Zap, Shield, Globe } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Advanced AI Models",
    description:
      "Access state-of-the-art language models tailored for your specific use cases.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Experience real-time responses with optimized latency and high availability.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Enterprise-grade security ensuring your data remains protected and private.",
  },
  {
    icon: Globe,
    title: "Global Scale",
    description:
      "Deploy agents that can converse in multiple languages and contexts seamlessly.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Nabd?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built for developers and businesses who demand the best in AI
            interactions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
