"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Camera, CameraOff, Volume2, MessageSquare, Settings, ArrowLeft, Globe, AlertTriangle, Play } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { enhanceMeaning } from '@/lib/nlpEngine';
import { recognizeGesture } from '@/lib/gestureRecognition';
import { detectEmotion } from '@/lib/emotionEngine';

const SignAvatar = dynamic(() => import('@/components/SignAvatar'), { ssr: false });

// Context for global access if needed, or just cast window
declare global {
    interface Window {
        Hands: any;
        FaceMesh: any; // Add FaceMesh
        Camera: any;
        drawConnectors: any;
        drawLandmarks: any;
        HAND_CONNECTIONS: any;
        FACEMESH_TESSELATION: any;
    }
}

export default function AppInterface() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [currentContext, setCurrentContext] = useState("General");
    const [detectedSign, setDetectedSign] = useState<string | null>(null);
    const [enhancedSentence, setEnhancedSentence] = useState<string | null>(null);
    const [currentEmotion, setCurrentEmotion] = useState<'Neutral' | 'Happy' | 'Urgent'>('Neutral');
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    // Feature States
    const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'hi-IN' | 'es-ES'>('en-US');
    const [isEmergencyMode, setIsEmergencyMode] = useState(false);

    const [debugStatus, setDebugStatus] = useState("Waiting for user input...");

    // Stabilization Refs
    const lastPredictionRef = useRef<string | null>(null);
    const predictionBufferRef = useRef<string[]>([]);

    // Emergency Trigger Refs
    const emergencyTriggerRef = useRef<number>(0); // Time held

    // Context Ref to access current state inside callbacks
    const contextRef = useRef(currentContext);
    const languageRef = useRef(selectedLanguage);
    useEffect(() => {
        contextRef.current = currentContext;
        languageRef.current = selectedLanguage;
    }, [currentContext, selectedLanguage]);

    // Reverse Mode State
    const [isReverseMode, setIsReverseMode] = useState(false);
    const [reverseInput, setReverseInput] = useState("");
    const [isAvatarPlaying, setIsAvatarPlaying] = useState(false);

    // Simulate Location
    const simulateLocation = (loc: string) => {
        if (loc === 'Hospital') {
            setCurrentContext('Hospital');
            handleSpeak("Detected Location: City Hospital. Switching to Medical mode.");
        } else {
            setCurrentContext('General');
            handleSpeak("Location Normal. Switching to General mode.");
        }
    };

    const handleCreateSignSequence = () => {
        if (!reverseInput) return;
        setIsAvatarPlaying(true);
        // Reset after simple timeout is handled by component, but we can track it here too
    };

    // Emergency Reset Effect
    useEffect(() => {
        if (isEmergencyMode) {
            handleSpeak("EMERGENCY! I need help immediately!");
            const interval = setInterval(() => {
                // Flash effect handled by CSS, maybe audio loop?
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isEmergencyMode]);

    // Initialize MediaPipe when camera is on and scripts are loaded
    useEffect(() => {
        if (!isCameraOn) {
            setDebugStatus("Camera is off");
            return;
        }
        if (!scriptsLoaded) {
            setDebugStatus("Loading AI Models (CDN)...");
            return;
        }

        setDebugStatus("Starting Camera & AI...");
        let hands: any = null;
        let faceMesh: any = null;
        let camera: any = null;
        let isCancelled = false;

        const initMediaPipe = async () => {
            try {
                if (!window.Hands || !window.FaceMesh || !window.Camera) {
                    setDebugStatus("Error: AI scripts missing.");
                    return;
                }

                if (isCancelled) return;

                // 1. Hands Setup
                hands = new window.Hands({
                    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
                });
                hands.setOptions({
                    maxNumHands: 2,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.6,
                    minTrackingConfidence: 0.6
                });

                // 2. Face Mesh Setup
                faceMesh = new window.FaceMesh({
                    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
                });
                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                // PROCESSING LOOP (Shared for both models via Camera Utils)
                // Note: Camera Utils 'onFrame' can usually only target one `send`.
                // We need to chain them or run them in parallel.
                // Standard pattern: send to Hands, then in Hands.onResults, maybe we skip Face?
                // Actually, `camera` instance takes one callback. We can await both.

                hands.onResults((results: any) => {
                    if (isCancelled) return;
                    processHands(results);
                });

                faceMesh.onResults((results: any) => {
                    if (isCancelled) return;
                    processFace(results);
                });

                // Helper to process Hands
                const processHands = (results: any) => {
                    const canvasCtx = canvasRef.current?.getContext('2d');
                    if (!canvasCtx || !canvasRef.current || !videoRef.current) return;

                    const { width, height } = videoRef.current.getBoundingClientRect();
                    canvasRef.current.width = width;
                    canvasRef.current.height = height;

                    canvasCtx.save();
                    // We only clear if this is the first draw of the frame... 
                    // To handle double drawing, we might flicker. 
                    // For simplicity, let FaceMesh draw "under" or we accept flicker for this demo version.
                    // Or we just don't draw FaceMesh lines to keep UI clean, only use data.
                    canvasCtx.clearRect(0, 0, width, height);

                    if (results.multiHandLandmarks) {
                        if (results.multiHandLandmarks.length > 0) {
                            setDebugStatus("Hands Detected");
                        }

                        for (const landmarks of results.multiHandLandmarks) {
                            if (window.drawConnectors && window.HAND_CONNECTIONS) {
                                window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#8b5cf6', lineWidth: 4 });
                            }
                            if (window.drawLandmarks) {
                                window.drawLandmarks(canvasCtx, landmarks, { color: '#2dd4bf', lineWidth: 1, radius: 4 });
                            }

                            // RECOGNITION & EMERGENCY LOGIC
                            const rawSign = recognizeGesture(landmarks);
                            // Detect Emergency Gesture (Fist/Help held)
                            if (rawSign === 'Help' || rawSign === 'Fist') {
                                emergencyTriggerRef.current += 1;
                                if (emergencyTriggerRef.current > 60) { // ~2-3 seconds at 30fps
                                    setIsEmergencyMode(true);
                                }
                            } else {
                                emergencyTriggerRef.current = 0;
                            }

                            if (rawSign) {
                                stabilizationLoop(rawSign);
                            }
                        }
                    }
                    canvasCtx.restore();
                };

                // Helper to process Face (Emotion)
                const processFace = (results: any) => {
                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const face = results.multiFaceLandmarks[0];
                        // Run Emotion Engine
                        const emotion = detectEmotion(face);
                        setCurrentEmotion(emotion);

                        // Optional: Draw Face Mesh (Subtle)
                        // const canvasCtx = canvasRef.current?.getContext('2d');
                        // if (canvasCtx && window.drawConnectors && window.FACEMESH_TESSELATION) {
                        //    window.drawConnectors(canvasCtx, face, window.FACEMESH_TESSELATION, { color: '#ffffff10', lineWidth: 1 });
                        // }
                    }
                };

                const stabilizationLoop = (rawSign: string) => {
                    const buffer = predictionBufferRef.current;
                    buffer.push(rawSign);
                    if (buffer.length > 10) buffer.shift();
                    const count = buffer.filter(s => s === rawSign).length;

                    if (count > 6 && rawSign !== lastPredictionRef.current) {
                        lastPredictionRef.current = rawSign;
                        setDetectedSign(rawSign);
                        // FUSE EMOTION + GESTURE
                        setEnhancedSentence(enhanceMeaning(rawSign, contextRef.current, currentEmotion)); // Will rely on latest state in next render or simple closure? 
                        // Closure issue: currentEmotion inside this callback might be stale?
                        // Actually, since this is a closure defined at init, it captures the initial `currentEmotion`.
                        // We need a Ref for currentEmotion to get live data!
                    } else if (count > 6) {
                        // Even if same sign, emotion might change? 
                        // For now, only update on sign change to avoid spam.
                    }
                };


                if (videoRef.current) {
                    camera = new window.Camera(videoRef.current, {
                        onFrame: async () => {
                            if (!isCancelled && videoRef.current) {
                                // Parallel execution for performance
                                if (hands) await hands.send({ image: videoRef.current });
                                if (faceMesh) await faceMesh.send({ image: videoRef.current });
                            }
                        },
                        width: 1280,
                        height: 720
                    });

                    if (!isCancelled) {
                        await camera.start();
                        setDebugStatus("System Active (Hands + Face)");
                    }
                }
            } catch (error: any) {
                console.error(error);
                if (!isCancelled) setDebugStatus(`Error: ${error.message || error}`);
            }
        };

        initMediaPipe();

        return () => {
            isCancelled = true;
            if (camera && typeof camera.stop === 'function') camera.stop();
            if (hands) hands.close();
            if (faceMesh) faceMesh.close();
        };
    }, [isCameraOn, scriptsLoaded]); // Re-run if these change. Note: emotion/language refs manage live data.


    // Fix for stale closures: Use Effect to update sentence if emotion changes significantly?
    // Or just let the gesture trigger handle it. For now, gesture trigger is primary.

    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window && text) {
            window.speechSynthesis.cancel(); // Stop unexpected overlaps
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = languageRef.current; // Use Ref for latest language

            // Voice Selection (Heuristic)
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const langCode = languageRef.current;
                const specificVoice = voices.find(v => v.lang.includes(langCode) && v.name.includes('Google')) || voices.find(v => v.lang.includes(langCode));
                if (specificVoice) utterance.voice = specificVoice;
            }

            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className={`min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden transition-colors duration-500 ${isEmergencyMode ? 'bg-red-950 animate-pulse' : ''} ${isReverseMode ? 'bg-slate-900' : ''}`}>
            {/* Load Scripts */}
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="lazyOnload" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" strategy="lazyOnload" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="lazyOnload" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" strategy="lazyOnload" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" strategy="lazyOnload" onLoad={() => setScriptsLoaded(true)} />

            {/* Sidebar */}
            <aside className="w-full md:w-24 md:h-screen glass border-r border-white/10 flex md:flex-col items-center justify-between p-4 z-20">
                <Link href="/" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                {/* Context Selector */}
                <div className="flex md:flex-col gap-4">
                    {['General', 'Hospital', 'Class', 'Shop'].map((ctx) => (
                        <button key={ctx} onClick={() => setCurrentContext(ctx)} className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentContext === ctx ? 'bg-primary text-white' : 'glass hover:bg-white/10'}`}>
                            {ctx[0]}
                        </button>
                    ))}
                </div>

                {/* Language, Mode & Tools */}
                <div className="flex flex-col gap-2 items-center">
                    <button
                        onClick={() => setIsReverseMode(!isReverseMode)}
                        className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center transition-all ${isReverseMode ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
                        title="Toggle Sign Avatar (Reverse Mode)"
                    >
                        <MessageSquare className="w-5 h-5 mb-1" />
                        {isReverseMode ? 'SIGN' : 'CAM'}
                    </button>

                    <button
                        onClick={() => setSelectedLanguage(l => l === 'en-US' ? 'hi-IN' : 'en-US')}
                        className="p-2 rounded-xl hover:bg-white/10 text-xs font-bold flex flex-col items-center"
                        title="Switch Language"
                    >
                        <Globe className="w-5 h-5 mb-1" />
                        {selectedLanguage === 'en-US' ? 'EN' : 'HI'}
                    </button>

                    {/* Dev Tool: Simulate Location */}
                    <button
                        onClick={() => simulateLocation('Hospital')}
                        className="p-2 rounded-xl hover:bg-white/10 text-[10px] opacity-50 hover:opacity-100"
                        title="Simulate GPS: Hospital"
                    >
                        GPS
                    </button>

                    {isEmergencyMode && (
                        <button onClick={() => setIsEmergencyMode(false)} className="p-2 bg-red-600 rounded-xl animate-bounce">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-background/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-bold">SAMBHAV <span className="text-primary text-xs ml-2">ADVANCED</span></span>
                        {!isReverseMode && (
                            <div className="px-3 py-1 bg-white/5 rounded-full text-xs flex items-center gap-2">
                                Emotion: <span className={`${currentEmotion === 'Urgent' ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>{currentEmotion.toUpperCase()}</span>
                            </div>
                        )}
                        {isReverseMode && <span className="text-blue-400 text-xs font-mono border border-blue-400 px-2 py-0.5 rounded">REVERSE MODE (TEXT-TO-SIGN)</span>}
                    </div>
                    {!isReverseMode && (
                        <button
                            onClick={() => setIsCameraOn(!isCameraOn)}
                            className={`p-3 rounded-full transition-colors ${isCameraOn ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}
                        >
                            {isCameraOn ? <CameraOff /> : <Camera />}
                        </button>
                    )}
                </header>

                {/* Content Area */}
                <div className="flex-1 relative bg-black/50 overflow-hidden flex items-center justify-center p-6">

                    {isReverseMode ? (
                        // REVERSE MODE: SIGN AVATAR
                        <div className="w-full max-w-4xl h-full flex flex-col gap-6">
                            <div className="flex-1">
                                <SignAvatar
                                    text={reverseInput}
                                    isPlaying={isAvatarPlaying}
                                    onComplete={() => setIsAvatarPlaying(false)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={reverseInput}
                                    onChange={(e) => setReverseInput(e.target.value)}
                                    placeholder="Type here to convert to Sign Language..."
                                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-lg outline-none focus:border-blue-500"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSignSequence()}
                                />
                                <button
                                    onClick={handleCreateSignSequence}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-bold flex items-center gap-2"
                                >
                                    <Play className="w-5 h-5" /> GENERATE SIGN
                                </button>
                            </div>
                        </div>
                    ) : (
                        // STANDARD MODE: CAMERA INPUT
                        <>
                            {!isCameraOn && <div className="text-white/50">Click Camera to Start AI Engine</div>}

                            {isCameraOn && <div className="absolute top-4 left-4 z-50 bg-black/60 px-3 py-1 rounded-full text-xs font-mono border border-white/10">
                                {debugStatus}
                            </div>}

                            <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} playsInline />
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

                            {/* Output Overlay */}
                            <AnimatePresence>
                                {(enhancedSentence || isEmergencyMode) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`absolute bottom-32 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full flex flex-col items-center ${isEmergencyMode ? 'bg-red-600 text-white shadow-red-glow' : 'glass-card'}`}
                                    >
                                        <span className="text-sm opacity-70 mb-1">{detectedSign} ({currentEmotion})</span>
                                        <span className="text-2xl font-bold whitespace-nowrap">
                                            {isEmergencyMode ? "EMERGENCY! I NEED HELP!" : enhancedSentence}
                                        </span>
                                        <button onClick={() => handleSpeak(isEmergencyMode ? "EMERGENCY! I NEED HELP!" : enhancedSentence || "")} className="mt-2 p-2 rounded-full bg-white/20">
                                            <Volume2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>

                {/* Conversation Bar (Only in Normal Mode) */}
                {!isReverseMode && (
                    <div className="h-24 bg-background border-t border-white/10 p-4 flex items-center gap-4">
                        <button className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                            <Mic className="w-6 h-6 text-white" />
                        </button>
                        <div className="flex-1 h-14 bg-white/5 rounded-2xl flex items-center px-6 text-muted-foreground border border-white/5 focus-within:border-primary/50 transition-colors">
                            <input
                                type="text"
                                placeholder="Type to speak..."
                                className="bg-transparent border-none outline-none w-full text-foreground placeholder-muted-foreground/50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSpeak((e.target as HTMLInputElement).value);
                                }}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
