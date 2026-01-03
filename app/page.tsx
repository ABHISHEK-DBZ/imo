"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mic, Sparkles, WifiOff } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[url('/bg-grid.svg')] bg-repeat opacity-90">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />

      <main className="container px-4 z-10 flex flex-col items-center text-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-primary-foreground/80 border border-white/10 mb-4">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>AI-Powered Communication Bridge</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight font-heading">
            SAMBHAV
          </h1>
          <p className="text-3xl md:text-5xl font-light text-muted-foreground">
            Bridging <span className="text-gradient font-semibold">Silence</span> and <span className="text-gradient font-semibold">Society</span>
          </p>

          <p className="max-w-2xl mx-auto text-lg text-muted-foreground/80 leading-relaxed">
            A real-time, context-aware bridge that translates Sign Language to Natural Voice and back.
            Empowering millions to communicate freely, anywhere, anytime.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mt-8"
        >
          <Link
            href="/app"
            className="group relative px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-2xl flex items-center gap-3 overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)]"
          >
            <span className="relative z-10">Start Communicating</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>

          <button className="px-8 py-4 glass text-foreground font-medium rounded-2xl hover:bg-white/5 transition-colors">
            Learn More
          </button>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
          {[
            {
              icon: <Sparkles className="w-6 h-6 text-purple-400" />,
              title: "Context Aware",
              desc: "Understands environment (Hospital, School) to generate meaningful sentences."
            },
            {
              icon: <WifiOff className="w-6 h-6 text-blue-400" />,
              title: "Offline Capable",
              desc: "Works without internet using Edge AI processing for accessibility anywhere."
            },
            {
              icon: <Mic className="w-6 h-6 text-emerald-400" />,
              title: "Two-Way Voice",
              desc: "Sign to Voice and Voice to Sign conversion for seamless conversation."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="glass-card p-6 rounded-3xl text-left hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

