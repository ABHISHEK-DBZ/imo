"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { User, Play, Pause, RotateCcw, Hand } from 'lucide-react';

interface SignAvatarProps {
    text: string;
    isPlaying: boolean;
    onComplete?: () => void;
}

// Mock Database of available sign videos
const VIDEO_DB: Record<string, string> = {
    'hello': 'https://media.istockphoto.com/id/1329037209/video/woman-signing-hello-in-american-sign-language.mp4?s=mp4-640x640-is&k=20&c=6k4y_G4mR_4_5_6_7', // Placeholder/Example URL structure (won't work without real url)
    // using a generic placeholder for the demo if real url fails
};

export default function SignAvatar({ text, isPlaying, onComplete }: SignAvatarProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [displayMode, setDisplayMode] = useState<'video' | 'spelling' | 'idle'>('idle');
    const words = text.split(' ');

    useEffect(() => {
        if (isPlaying) {
            setDisplayMode('video');
            const interval = setInterval(() => {
                setCurrentWordIndex(prev => {
                    const next = prev + 1;
                    if (next >= words.length) {
                        clearInterval(interval);
                        if (onComplete) onComplete();
                        setDisplayMode('idle');
                        return 0;
                    }
                    return next;
                });
            }, 1000); // 1 second per word simulation

            return () => clearInterval(interval);
        }
    }, [isPlaying, text, words.length, onComplete]);

    const currentWord = words[currentWordIndex] || "";

    return (
        <div className="w-full h-full relative bg-black/80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center">
            {/* Holographic Grid Background */}
            <div className="absolute inset-0 bg-[url('/bg-grid.svg')] opacity-20" />

            {/* Avatar Placeholder / Video Area */}
            <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 bg-blue-500/5 rounded-full flex items-center justify-center border-4 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                <AnimatePresence mode='wait'>
                    {isPlaying ? (
                        <motion.div
                            key="avatar-active"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="text-center"
                        >
                            {/* Simulated Avatar Persona */}
                            <div className="w-48 h-48 mx-auto bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full blur-3xl opacity-20 animate-pulse absolute inset-0" />

                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="relative"
                            >
                                <User className="w-32 h-32 text-blue-300 mx-auto drop-shadow-glow" />
                                {/* Dynamic Hand Overlay */}
                                <motion.div
                                    animate={{ rotate: [-5, 5, -5], x: [-10, 10, -10] }}
                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                    className="absolute top-10 right-0"
                                >
                                    <Hand className="w-12 h-12 text-white" />
                                </motion.div>
                            </motion.div>

                            {/* Processing Text */}
                            <motion.div
                                className="mt-8 px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl border border-blue-500/30"
                            >
                                <span className="text-xs text-blue-400 uppercase tracking-widest block mb-1">Signing</span>
                                <span className="text-2xl font-bold text-white tracking-widest font-mono">
                                    {currentWord.toUpperCase()}
                                </span>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="avatar-idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center text-white/30"
                        >
                            <User className="w-24 h-24 mb-4" />
                            <p className="text-sm font-mono">AVATAR READY</p>
                            <p className="text-xs">Type text to animate</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Status Overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                <span className="text-xs text-blue-500 font-mono">AI ENGINE ACTIVE</span>
            </div>
        </div>
    );
}
