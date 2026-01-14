import React, { useState, useRef, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageItem, PageFilters } from '../types';
import { Sliders, Sun, Moon, Contrast, ArrowRight, RotateCcw, CheckSquare, PenTool, X, Save, Eraser, Highlighter, Pencil, Plus } from 'lucide-react';

// --- Sortable Item Component ---
interface SortableItemProps {
  id: string;
  page: PageItem;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, page, onClick, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  // Construct CSS Filters for Preview
  const brightnessVal = 1 + (page.filters.whiteness / 100);
  const contrastVal = 1 + (page.filters.blackness / 100);
  const filterString = `
    grayscale(${page.filters.grayscale ? 1 : 0}) 
    invert(${page.filters.invert ? 1 : 0}) 
    brightness(${brightnessVal}) 
    contrast(${contrastVal})
  `;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      className={`relative group aspect-[1/1.4] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${page.isSelected ? 'border-indigo-500 shadow-md scale-[1.02]' : 'border-transparent opacity-50 grayscale'}`}
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 z-20 flex gap-2">
         {/* Edit Button */}
         {page.isSelected && (
            <button 
                onClick={onEdit}
                className="w-6 h-6 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors"
                title="Doodle"
            >
                <PenTool size={12} />
            </button>
         )}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${page.isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-transparent'}`}>
            <CheckSquare size={14} />
        </div>
      </div>
      
      {/* Drag Handle Overlay */}
      <div {...listeners} className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 z-20 cursor-grab active:cursor-grabbing" />

      {/* Main Image */}
      <img 
        src={page.thumbnailDataUrl} 
        alt={`Page ${page.originalPageIndex + 1}`} 
        className="w-full h-full object-cover pointer-events-none bg-white absolute top-0 left-0"
        style={{ filter: filterString }}
      />
      
      {/* Doodle Overlay (Preview) */}
      {page.drawingDataUrl && (
          <img 
            src={page.drawingDataUrl} 
            className="w-full h-full object-cover pointer-events-none absolute top-0 left-0 z-10" 
          />
      )}

      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white font-medium z-20">
        Pg {page.originalPageIndex + 1}
      </div>
    </div>
  );
};


// --- Doodle Modal Component ---

interface DoodleModalProps {
    page: PageItem;
    onClose: () => void;
    onSave: (drawingDataUrl: string) => void;
}

const DoodleModal: React.FC<DoodleModalProps> = ({ page, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pencil' | 'marker' | 'eraser'>('pencil');
    const [color, setColor] = useState('#000000');
    const [markerSize, setMarkerSize] = useState(15);
    
    // Setup Canvas on Mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Match dimensions to the source image
        canvas.width = page.width;
        canvas.height = page.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load existing drawing if any
        if (page.drawingDataUrl) {
            const img = new Image();
            img.src = page.drawingDataUrl;
            img.onload = () => ctx.drawImage(img, 0, 0);
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [page]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Configure Tool
        if (tool === 'pencil') {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 * scaleX;
            ctx.globalAlpha = 0.8;
            ctx.globalCompositeOperation = 'source-over';
        } else if (tool === 'marker') {
            ctx.strokeStyle = color;
            ctx.lineWidth = markerSize * scaleX;
            ctx.globalAlpha = 0.4; // Transparency for highlighter effect
            ctx.globalCompositeOperation = 'source-over';
        } else if (tool === 'eraser') {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 20 * scaleX;
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'destination-out';
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleSave = () => {
        if (canvasRef.current) {
            onSave(canvasRef.current.toDataURL());
        }
        onClose();
    };

    // Filter string for background image to match Workshop settings
    const brightnessVal = 1 + (page.filters.whiteness / 100);
    const contrastVal = 1 + (page.filters.blackness / 100);
    const filterString = `
        grayscale(${page.filters.grayscale ? 1 : 0}) 
        invert(${page.filters.invert ? 1 : 0}) 
        brightness(${brightnessVal}) 
        contrast(${contrastVal})
    `;

    // Palette
    const presetColors = ['#000000', '#52525B', '#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-4xl h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-fade-in">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><PenTool size={18} /> Doodle Studio</h3>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500"><X size={20} /></button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700"><Save size={18} /> Save</button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex flex-col md:flex-row gap-4 justify-between items-center overflow-x-auto">
                    
                    <div className="flex gap-4">
                        <button onClick={() => setTool('pencil')} className={`p-3 rounded-xl flex flex-col items-center gap-1 min-w-[60px] ${tool === 'pencil' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-2 ring-indigo-500' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}`}>
                            <Pencil size={18} />
                            <span className="text-[10px] font-bold">Pencil</span>
                        </button>

                        <button onClick={() => setTool('marker')} className={`p-3 rounded-xl flex flex-col items-center gap-1 min-w-[60px] ${tool === 'marker' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-2 ring-indigo-500' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}`}>
                            <Highlighter size={18} />
                            <span className="text-[10px] font-bold">Marker</span>
                        </button>
                        
                        <div className="w-px h-10 bg-gray-300 dark:bg-zinc-700 mx-1" />

                        <button onClick={() => setTool('eraser')} className={`p-3 rounded-xl flex flex-col items-center gap-1 min-w-[60px] ${tool === 'eraser' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}`}>
                            <Eraser size={18} />
                            <span className="text-[10px] font-bold">Eraser</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                         {tool === 'marker' && (
                             <div className="flex items-center gap-2 bg-white dark:bg-black p-2 rounded-lg border border-gray-200 dark:border-zinc-700">
                                 <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                                 <input 
                                    type="range" 
                                    min="5" max="50" 
                                    value={markerSize}
                                    onChange={(e) => setMarkerSize(Number(e.target.value))}
                                    className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                 />
                                 <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                             </div>
                         )}

                         {(tool === 'pencil' || tool === 'marker') && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {presetColors.map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 shadow-sm ${color === c ? 'border-gray-900 dark:border-white scale-125' : 'border-transparent hover:scale-110'} transition-transform`}
                                        style={{ 
                                            backgroundColor: c,
                                            // Ensure white color is visible against the background
                                            borderColor: c === '#FFFFFF' && color !== c ? '#e4e4e7' : undefined
                                        }}
                                        title={c}
                                    />
                                ))}
                                
                                {/* Custom Color Picker */}
                                <label className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-transparent cursor-pointer hover:scale-110 transition-transform bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 overflow-hidden group" title="Custom Color">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                    />
                                    {/* Show selection indicator if custom color is active and not in presets */}
                                    {!presetColors.includes(color) && (
                                        <div className="w-full h-full border-2 border-gray-900 dark:border-white rounded-full" />
                                    )}
                                    <Plus size={12} className="text-white drop-shadow-md" />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gray-200 dark:bg-black overflow-auto flex items-center justify-center p-8 relative">
                    <div 
                        className="relative shadow-2xl" 
                        style={{ width: 'fit-content', height: 'fit-content' }}
                    >
                         {/* Background Image Reference */}
                        <img 
                            src={page.thumbnailDataUrl} 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '60vh', 
                                display: 'block',
                                filter: filterString
                            }} 
                            className="pointer-events-none select-none"
                        />
                        
                        {/* Drawing Canvas */}
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};


// --- Main Component ---

interface Step2Props {
  pages: PageItem[];
  setPages: React.Dispatch<React.SetStateAction<PageItem[]>>;
  onNext: () => void;
}

export const Step2_Workshop: React.FC<Step2Props> = ({ pages, setPages, onNext }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const selectedCount = pages.filter(p => p.isSelected).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const toggleSelection = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, isSelected: !p.isSelected } : p));
  };

  const handleEditOpen = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setEditingPageId(id);
  };

  const handleDoodleSave = (dataUrl: string) => {
      if (editingPageId) {
          setPages(prev => prev.map(p => p.id === editingPageId ? { ...p, drawingDataUrl: dataUrl } : p));
      }
  };

  // Filter Actions
  const updateFilters = (key: keyof PageFilters, value: any) => {
    setPages(prev => prev.map(p => {
      if (!p.isSelected) return p;
      return {
        ...p,
        filters: { ...p.filters, [key]: value }
      };
    }));
  };

  const resetFilters = () => {
    setPages(prev => prev.map(p => {
        if (!p.isSelected) return p;
        return {
            ...p,
            filters: { invert: false, grayscale: false, whiteness: 0, blackness: 0 },
            drawingDataUrl: null // Also clear drawings on reset? Maybe optional, but simpler here.
        };
    }));
  };

  const toggleSelectAll = () => {
      const allSelected = pages.every(p => p.isSelected);
      setPages(prev => prev.map(p => ({ ...p, isSelected: !allSelected })));
  };

  const firstSelected = pages.find(p => p.isSelected);
  const currentWhiteness = firstSelected?.filters.whiteness || 0;
  const currentBlackness = firstSelected?.filters.blackness || 0;

  const editingPage = pages.find(p => p.id === editingPageId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto animate-fade-in pb-20">
      
      {/* Modal */}
      {editingPage && (
          <DoodleModal 
            page={editingPage} 
            onClose={() => setEditingPageId(null)} 
            onSave={handleDoodleSave}
          />
      )}

      {/* --- Sidebar: Enhancement Suite --- */}
      <div className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1">
        <div className="sticky top-8 bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sliders size={20} className="text-indigo-600" />
              Workshop
            </h3>
            <span className="text-xs font-mono px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-gray-500">
              {selectedCount} Selected
            </span>
          </div>

          {selectedCount === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>Select pages to apply filters.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => updateFilters('invert', !firstSelected?.filters.invert)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${firstSelected?.filters.invert ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 dark:bg-zinc-800 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                >
                  <Moon size={24} className="mb-2" />
                  <span className="text-xs font-medium">Invert</span>
                </button>
                <button 
                  onClick={() => updateFilters('grayscale', !firstSelected?.filters.grayscale)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${firstSelected?.filters.grayscale ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 dark:bg-zinc-800 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                >
                  <Contrast size={24} className="mb-2" />
                  <span className="text-xs font-medium">Grayscale</span>
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-2"><Sun size={14} /> Whiteness</span>
                    <span>{currentWhiteness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={currentWhiteness}
                    onChange={(e) => updateFilters('whiteness', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[10px] text-gray-400">Boosts background brightness to remove noise.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-2"><Contrast size={14} /> Blackness</span>
                    <span>{currentBlackness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={currentBlackness}
                    onChange={(e) => updateFilters('blackness', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[10px] text-gray-400">Deepens text contrast for readability.</p>
                </div>
              </div>

              {/* Global Actions */}
              <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
                <button 
                    onClick={resetFilters}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-2 transition-colors"
                >
                    <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-zinc-800">
             <button 
                onClick={onNext}
                disabled={selectedCount === 0}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={20} />
              </button>
          </div>
        </div>
      </div>

      {/* --- Main Grid --- */}
      <div className="flex-1 order-1 lg:order-2">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Arrange & Doodle</h2>
            <button 
                onClick={toggleSelectAll}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
                {pages.every(p => p.isSelected) ? 'Deselect All' : 'Select All'}
            </button>
        </div>

        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {pages.map((page) => (
                <SortableItem 
                    key={page.id} 
                    id={page.id} 
                    page={page} 
                    onClick={() => toggleSelection(page.id)} 
                    onEdit={(e) => handleEditOpen(e, page.id)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
                <div className="aspect-[1/1.4] rounded-xl overflow-hidden shadow-2xl ring-4 ring-indigo-500 opacity-90 cursor-grabbing">
                     <img 
                        src={pages.find(p => p.id === activeId)?.thumbnailDataUrl} 
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
