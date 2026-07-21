import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  RefreshCw, 
  Sun, 
  Contrast, 
  Sparkles, 
  Eye, 
  Sliders, 
  Maximize2, 
  FlipHorizontal, 
  X, 
  Check,
  EyeOff
} from 'lucide-react';

interface ImageEnhanceZoomProps {
  src: string;
  alt?: string;
  onClose: () => void;
  title?: string;
}

type PresetType = 'normal' | 'improve_reading' | 'dark_photo' | 'extreme_contrast' | 'seal_focus';

export const ImageEnhanceZoom: React.FC<ImageEnhanceZoomProps> = ({ 
  src, 
  alt = 'Visualização Ampliada', 
  onClose,
  title = 'Visualização de Evidência'
}) => {
  // Navigation & Zoom States
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Image Filter Adjustment States
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [grayscale, setGrayscale] = useState(false);
  const [invert, setInvert] = useState(false);
  const [sharpen, setSharpen] = useState(false);

  // UI Control Panel Toggles
  const [activePreset, setActivePreset] = useState<PresetType>('normal');
  const [showSliders, setShowSliders] = useState(false);

  // Dragging Ref States
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Touch gesture state for mobile pinch-to-zoom
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1);

  // Reset function
  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setFlipped(false);
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setGrayscale(false);
    setInvert(false);
    setSharpen(false);
    setActivePreset('normal');
  }, []);

  // Set Preset values
  const applyPreset = useCallback((preset: PresetType) => {
    setActivePreset(preset);
    switch (preset) {
      case 'normal':
        setBrightness(100);
        setContrast(100);
        setSaturate(100);
        setGrayscale(false);
        setInvert(false);
        setSharpen(false);
        break;
      case 'improve_reading':
        setBrightness(110);
        setContrast(170);
        setSaturate(50);
        setGrayscale(true);
        setInvert(false);
        setSharpen(true);
        break;
      case 'dark_photo':
        setBrightness(175);
        setContrast(150);
        setSaturate(130);
        setGrayscale(false);
        setInvert(false);
        setSharpen(true);
        break;
      case 'extreme_contrast':
        setBrightness(110);
        setContrast(220);
        setSaturate(0);
        setGrayscale(true);
        setInvert(true);
        setSharpen(true);
        break;
      case 'seal_focus':
        setBrightness(100);
        setContrast(140);
        setSaturate(200);
        setGrayscale(false);
        setInvert(false);
        setSharpen(true);
        break;
    }
  }, []);

  // Standard Mouse Zooming via Buttons
  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 10));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

  // Rotate functions
  const rotateCw = () => setRotation(prev => (prev + 90) % 360);
  const rotateCcw = () => setRotation(prev => (prev - 90 + 360) % 360);

  // Mouse drag to pan logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return; // Only pan when zoomed
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    // Boundary constraints (approximate based on scale)
    const maxOffset = (scale - 1) * 200;
    setPosition({
      x: Math.max(-maxOffset - 400, Math.min(maxOffset + 400, newX)),
      y: Math.max(-maxOffset - 400, Math.min(maxOffset + 400, newY))
    });
  }, [isDragging, scale, position]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    let newScale = scale + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    newScale = Math.max(1, Math.min(newScale, 10));
    setScale(newScale);

    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Touch drag & Pinch to zoom logic for mobile inspect
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single finger drag
      if (scale <= 1) return;
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      // Dual finger pinch
      setIsDragging(false);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      touchStartDist.current = dist;
      touchStartScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.current.x;
      const newY = touch.clientY - dragStart.current.y;
      setPosition({ x: newX, y: newY });
    } else if (e.touches.length === 2 && touchStartDist.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const scaleRatio = dist / touchStartDist.current;
      let newScale = touchStartScale.current * scaleRatio;
      newScale = Math.max(1, Math.min(newScale, 10));
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = null;
  };

  // Setup global event listeners for mouse up & move so panning is smooth even if the mouse leaves the viewport
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard shortcut bindings for professional image inspection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Movement step adjusted for scale
      const step = 40;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setPosition(prev => ({ ...prev, y: prev.y + step }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setPosition(prev => ({ ...prev, y: prev.y - step }));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setPosition(prev => ({ ...prev, x: prev.x + step }));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setPosition(prev => ({ ...prev, x: prev.x - step }));
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        rotateCw();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, handleReset, onClose]);

  // Dynamic filter style calculation
  const filterStyle = {
    filter: `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturate}%)
      grayscale(${grayscale ? 100 : 0}%)
      invert(${invert ? 100 : 0}%)
      ${sharpen ? 'url(#sharpen-filter)' : ''}
    `.trim().replace(/\s+/g, ' '),
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.2s ease'
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col justify-between z-[210] p-4 text-white animate-in fade-in duration-300">
      {/* SVG Convolution matrix filter definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="sharpen-filter">
            <feConvolveMatrix 
              order="3" 
              kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" 
              preserveAlpha="true"
            />
          </filter>
        </defs>
      </svg>

      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md rounded-2xl">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest text-primary-gold flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            {title}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Dica: Use Rolar para Zoom, Arraste para Pan, 'R' para Rotacionar ou 'Espaço' para Resetar
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 hover:text-red-400 text-slate-300 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
          title="Fechar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image Stage Container */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 flex items-center justify-center overflow-hidden relative my-4 rounded-2xl border border-slate-800 bg-slate-950/40 select-none ${scale > 1 ? 'cursor-grab' : 'cursor-default'} ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <img 
          ref={imgRef}
          src={src} 
          alt={alt} 
          style={filterStyle}
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl pointer-events-none" 
          referrerPolicy="no-referrer"
        />

        {/* Floating Zoom Indicator */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-750 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest text-primary-gold">
          ZOOM: {Math.round(scale * 100)}%
        </div>

        {/* Preset Notification HUD indicator */}
        {activePreset !== 'normal' && (
          <div className="absolute top-4 right-4 bg-emerald-600/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[9px] font-black tracking-widest text-white uppercase animate-pulse flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Preset: {activePreset === 'improve_reading' ? 'Leitura Otimizada' : 
                     activePreset === 'dark_photo' ? 'Foto Escura' : 
                     activePreset === 'extreme_contrast' ? 'Negativo' : 'Cor do Lacre'}
          </div>
        )}
      </div>

      {/* Controller Controls Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-3xl w-full max-w-4xl mx-auto space-y-4 shadow-2xl">
        
        {/* Row 1: Workflow Presets */}
        <div className="flex flex-wrap items-center gap-2 justify-center border-b border-slate-800/50 pb-3">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mr-2">Filtros Inteligentes:</span>
          
          <button
            onClick={() => applyPreset('normal')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activePreset === 'normal' ? 'bg-primary-gold text-slate-950' : 'bg-slate-800 hover:bg-slate-755 text-slate-300'}`}
          >
            Normal (Reset)
          </button>
          
          <button
            onClick={() => applyPreset('improve_reading')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activePreset === 'improve_reading' ? 'bg-amber-500 text-white shadow-lg shadow-amber-950/40' : 'bg-slate-800 hover:bg-slate-755 text-slate-300'}`}
            title="Ideal para ler placas embaçadas ou foscas"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Leitura Otimizada
          </button>

          <button
            onClick={() => applyPreset('dark_photo')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activePreset === 'dark_photo' ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40' : 'bg-slate-800 hover:bg-slate-755 text-slate-300'}`}
            title="Aumenta brilho e realce de sombras em fotos noturnas"
          >
            <Sun className="w-3.5 h-3.5" />
            Foto Escura / Noturna
          </button>

          <button
            onClick={() => applyPreset('extreme_contrast')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activePreset === 'extreme_contrast' ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-755 text-slate-300'}`}
            title="Inverte cores e maximiza contraste para letras brancas no fundo preto"
          >
            <Contrast className="w-3.5 h-3.5" />
            Negativo Alto-Contraste
          </button>

          <button
            onClick={() => applyPreset('seal_focus')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activePreset === 'seal_focus' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-755 text-slate-300'}`}
            title="Saturação extra para diferenciar cores de lacres"
          >
            <Eye className="w-3.5 h-3.5" />
            Contraste de Lacre
          </button>
        </div>

        {/* Row 2: Standard Transforms & Sliders Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Main Action Group (Zoom & Rotation) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={zoomOut}
              disabled={scale <= 1}
              className="p-2.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all text-slate-300 hover:text-white cursor-pointer border-0 flex items-center justify-center"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={zoomIn}
              className="p-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl transition-all text-slate-300 hover:text-white cursor-pointer border-0 flex items-center justify-center"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1" />

            <button
              onClick={rotateCcw}
              className="p-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl transition-all text-slate-300 hover:text-white cursor-pointer border-0 flex items-center justify-center"
              title="Rotacionar Anti-Horário"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={rotateCw}
              className="p-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl transition-all text-slate-300 hover:text-white cursor-pointer border-0 flex items-center justify-center"
              title="Rotacionar Horário (R)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlipped(prev => !prev)}
              className="p-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl transition-all text-slate-300 hover:text-white cursor-pointer border-0 flex items-center justify-center"
              title="Espelhar Horizontalmente"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1" />

            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-800 hover:bg-slate-755 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer border-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
              title="Restaurar Padrão (Espaço)"
            >
              <RefreshCw className="w-4 h-4" />
              Resetar
            </button>
          </div>

          {/* Toggle Manual Adjustments */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSliders(!showSliders)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-0 flex items-center gap-2 ${showSliders ? 'bg-primary-gold text-slate-950 shadow-md shadow-primary-gold/10' : 'bg-slate-800 hover:bg-slate-750 text-slate-300'}`}
            >
              <Sliders className="w-4 h-4" />
              Ajustes Manuais
            </button>
          </div>
        </div>

        {/* Expandable Manual Filters Section */}
        {showSliders && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-950/45 rounded-2xl border border-slate-800/80 animate-in slide-in-from-bottom-2 duration-250">
            
            {/* Brilho & Contraste Sliders */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                  <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-400" /> Brilho</span>
                  <span className="text-primary-gold">{brightness}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="250" 
                  value={brightness} 
                  onChange={(e) => {
                    setBrightness(Number(e.target.value));
                    setActivePreset('normal');
                  }}
                  className="w-full accent-primary-gold cursor-pointer bg-slate-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                  <span className="flex items-center gap-1"><Contrast className="w-3.5 h-3.5 text-blue-400" /> Contraste</span>
                  <span className="text-primary-gold">{contrast}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="300" 
                  value={contrast} 
                  onChange={(e) => {
                    setContrast(Number(e.target.value));
                    setActivePreset('normal');
                  }}
                  className="w-full accent-primary-gold cursor-pointer bg-slate-800 h-1.5 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Saturação Sliders */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                  <span>Saturação / Cores</span>
                  <span className="text-primary-gold">{saturate}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="300" 
                  value={saturate} 
                  onChange={(e) => {
                    setSaturate(Number(e.target.value));
                    setActivePreset('normal');
                  }}
                  className="w-full accent-primary-gold cursor-pointer bg-slate-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={grayscale} 
                    onChange={(e) => {
                      setGrayscale(e.target.checked);
                      setActivePreset('normal');
                    }}
                    className="rounded border-slate-700 text-primary-gold focus:ring-primary-gold/45 bg-slate-800 w-4 h-4"
                  />
                  <span className="text-[10px] font-black uppercase text-slate-300">P&B (Preto e Branco)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={invert} 
                    onChange={(e) => {
                      setInvert(e.target.checked);
                      setActivePreset('normal');
                    }}
                    className="rounded border-slate-700 text-primary-gold focus:ring-primary-gold/45 bg-slate-800 w-4 h-4"
                  />
                  <span className="text-[10px] font-black uppercase text-slate-300">Inverter Negativo</span>
                </label>
              </div>
            </div>

            {/* Convolution Edge Detection Sharpening Toggle */}
            <div className="border-l border-slate-800/80 pl-6 flex flex-col justify-center space-y-2">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="sharpen-toggle"
                  checked={sharpen} 
                  onChange={(e) => {
                    setSharpen(e.target.checked);
                    setActivePreset('normal');
                  }}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/45 bg-slate-800 w-5 h-5 cursor-pointer mt-0.5"
                />
                <div className="space-y-1">
                  <label htmlFor="sharpen-toggle" className="text-[11px] font-black uppercase text-emerald-400 tracking-tight flex items-center gap-1 cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5" />
                    Nitidez Extrema por Hardware
                  </label>
                  <p className="text-[9px] text-slate-400 font-medium leading-normal">
                    Aplica matriz de convolução 3x3 na GPU para realçar bordas e tornar letras e números embaçados legíveis.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
