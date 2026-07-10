"use client";

import { APP_ROUTES } from '@/constants/routes';
/* eslint-disable @next/next/no-img-element */

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { X, Zap, Camera, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function OCRScanPage() {
  const t = useTranslations('User.OCR');
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(true);

  // Simulate scanning process
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsScanning(false);
      // Automatically go back or show result after "scan" completes
      setTimeout(() => {
        router.push(APP_ROUTES.SCHEDULE);
      }, 1500);
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={() => router.push(APP_ROUTES.SCHEDULE)}
          className="p-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg drop-shadow-md">{t('title')}</h1>
        <button className="p-3 text-yellow-400 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-colors">
          <Zap className="w-5 h-5" fill="currentColor" />
        </button>
      </div>

      {/* Camera Viewfinder Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
        
        {/* Placeholder image simulating camera feed */}
        <img 
          src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600&h=800" 
          alt="Camera feed"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />

        {/* Scan Frame Overlay */}
        <div className="relative w-[85%] max-w-sm aspect-[3/4] border-2 border-white/20 rounded-3xl overflow-hidden z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
          
          {/* Scanning Animation Line */}
          {isScanning && (
            <div className="absolute inset-x-0 h-1 bg-blue-500 shadow-[0_0_20px_4px_rgba(59,130,246,0.5)] animate-scan"></div>
          )}

          {/* Corner Marks */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl m-[-2px]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl m-[-2px]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl m-[-2px]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl m-[-2px]"></div>
          
          {/* Overlay text when processing */}
          {!isScanning && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-white font-bold">{t('processing')}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-0 inset-x-0 p-8 pb-12 flex justify-center items-center gap-12 z-10 bg-gradient-to-t from-black/80 to-transparent">
        <button className="p-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all">
          <ImageIcon className="w-6 h-6" />
        </button>
        
        {/* Shutter button */}
        <button className="w-20 h-20 rounded-full border-4 border-white/30 p-1 group flex-shrink-0">
          <div className="w-full h-full bg-white rounded-full group-hover:scale-95 transition-transform"></div>
        </button>
        
        <button className="p-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all">
          <Camera className="w-6 h-6" />
        </button>
      </div>

      <style jsx>{`
        .animate-scan {
          animation: scan 3s ease-in-out infinite alternate;
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
