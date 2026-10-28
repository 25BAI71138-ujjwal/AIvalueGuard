import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Sliders, Sparkles, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

export type AmbientPreset = 'natural' | 'cyber-cyan' | 'golden-ember' | 'deep-violet' | 'noir';

const PRESET_STYLES: Record<AmbientPreset, { label: string; filter: string }> = {
  natural: {
    label: 'Natural Fluid',
    filter: 'none'
  },
  'cyber-cyan': {
    label: 'Cyber Cyan',
    filter: 'hue-rotate(190deg) saturate(1.35) contrast(1.1)'
  },
  'golden-ember': {
    label: 'Golden Ember',
    filter: 'sepia(0.55) saturate(1.4) hue-rotate(-20deg)'
  },
  'deep-violet': {
    label: 'Deep Violet',
    filter: 'hue-rotate(260deg) saturate(1.3) contrast(1.15)'
  },
  noir: {
    label: 'Obsidian Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(0.95)'
  }
};

export const AmbientVideoBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [useFallbackUrl, setUseFallbackUrl] = useState(false);
  const [dimness, setDimness] = useState(10); // 10% dim ensures the 3D fluid model is crystal clear and vivid
  const [preset, setPreset] = useState<AmbientPreset>('natural');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isControlsHidden, setIsControlsHidden] = useState(false);

  // Exact URLs provided by user and local files from C:\Users\Ujjwal\Downloads\exposomes-ambient-background-video
  const primarySrc = '/videos/background.mp4';
  const fallbackSrc = 'https://v1.pinimg.com/videos/mc/720p/da/4e/f8/da4ef837f9daabc70f086751eeb8f9a2.mp4';
  const posterSrc = '/videos/poster.jpg';

  const handleVideoError = () => {
    console.warn('Local background video failed to load, switching to user CDN URL:', fallbackSrc);
    setUseFallbackUrl(true);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    videoRef.current.muted = newMute;
    setIsMuted(newMute);
  };

  const currentFilter = PRESET_STYLES[preset]?.filter || 'none';

  return (
    <>
      {/* Fixed Fullscreen Ambient Background Layer */}
      <div 
        className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-[#03060c]"
        aria-hidden="true"
      >
        {/* Crystal-Clear Ambient Video */}
        <video
          ref={videoRef}
          src={useFallbackUrl ? fallbackSrc : primarySrc}
          poster={posterSrc}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onError={handleVideoError}
          className="w-full h-full object-cover transition-all duration-500 ease-out contrast-[1.08] saturate-[1.15] brightness-[1.05]"
          style={{
            filter: currentFilter !== 'none' ? currentFilter : undefined,
          }}
        />

        {/* Dynamic Light Dimming Overlay (User-Adjustable, Default Ultra-Clear 10%) */}
        <div
          className="absolute inset-0 transition-opacity duration-300 ease-in-out pointer-events-none"
          style={{
            backgroundColor: '#03060c',
            opacity: dimness / 100,
          }}
        />

        {/* Soft edge-only vignette (leaves center 3D model 100% crisp) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, transparent 65%, rgba(3, 6, 12, 0.45) 100%)',
          }}
        />
      </div>

      {/* Floating Ambient Background Pill Controller (Bottom-Right, Unobtrusive) */}
      {!isControlsHidden && (
        <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 text-xs font-mono select-none transition-all">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
            title={isPlaying ? "Pause Ambient Video" : "Play Ambient Video"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-cyan-400" />}
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
            title={isMuted ? "Unmute Video Audio" : "Mute Video Audio"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-slate-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold transition border ${
              isMenuOpen 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
            }`}
            title="Ambient Video Controls"
          >
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>Ambient</span>
          </button>

          <button
            onClick={() => setIsControlsHidden(true)}
            className="p-1 rounded-full text-slate-500 hover:text-slate-300 transition"
            title="Hide Ambient Control Pill"
          >
            <EyeOff className="h-3 w-3" />
          </button>

          {/* Expanded Settings Popup */}
          {isMenuOpen && (
            <div className="absolute bottom-12 right-0 w-64 p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/95 text-slate-200 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-xs text-white flex items-center gap-1.5 font-heading tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Ambient Background
                </span>
                <span className="text-[10px] text-cyan-300 font-mono">Exposomes</span>
              </div>

              {/* Dimness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Overlay Darkness</span>
                  <span className="font-mono text-white">{dimness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={dimness}
                  onChange={(e) => setDimness(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Color Filter Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block">Color Theme</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(PRESET_STYLES) as AmbientPreset[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setPreset(key)}
                      className={`px-2 py-1 rounded-lg text-[10px] text-left transition truncate border ${
                        preset === key
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 font-semibold'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      {PRESET_STYLES[key].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1 border-t border-white/10 text-[9px] text-slate-500 flex items-center justify-between">
                <span>Direct GPU Video Stream</span>
                <span className="text-emerald-400 font-mono">Active</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating unhide button when hidden */}
      {isControlsHidden && (
        <button
          onClick={() => setIsControlsHidden(false)}
          className="fixed bottom-3 right-3 z-50 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-white/10 text-slate-400 hover:text-white shadow-lg transition"
          title="Show Ambient Controls"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );
};

export default AmbientVideoBackground;
