"use client";

import dynamic from 'next/dynamic';
import { Camera } from 'lucide-react';

const AppInterface = dynamic(() => import('@/components/AppInterface'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            <p className="text-muted-foreground text-sm">Initializing SAMBHAV...</p>
        </div>
    )
});

export default function Page() {
    return <AppInterface />;
}
