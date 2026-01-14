import React, { useState } from 'react';
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
import { Sliders, Sun, Moon, Contrast, ArrowRight, RotateCcw, CheckSquare } from 'lucide-react';

// --- Sortable Item Component ---
interface SortableItemProps {
  id: string;
  page: PageItem;
  onClick: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, page, onClick }) => {
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
      onClick={() => {
        // Prevent drag start on simple click
        onClick();
      }}
    >
      <div className="absolute top-2 right-2 z-20">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${page.isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-transparent'}`}>
            <CheckSquare size={14} />
        </div>
      </div>
      
      {/* Drag Handle Overlay - only activates drag listeners */}
      <div {...listeners} className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 z-20 cursor-grab active:cursor-grabbing" />

      <img 
        src={page.thumbnailDataUrl} 
        alt={`Page ${page.originalPageIndex + 1}`} 
        className="w-full h-full object-cover pointer-events-none bg-white"
        style={{ filter: filterString }}
      />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white font-medium">
        Pg {page.originalPageIndex + 1}
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

  // Enhancement Suite State (Applied to currently selected items)
  // We use a temporary state for the UI sliders, which applies to ALL selected items
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
            filters: { invert: false, grayscale: false, whiteness: 0, blackness: 0 }
        };
    }));
  };

  const toggleSelectAll = () => {
      const allSelected = pages.every(p => p.isSelected);
      setPages(prev => prev.map(p => ({ ...p, isSelected: !allSelected })));
  };

  // Get common filter state from first selected item (for UI consistency)
  const firstSelected = pages.find(p => p.isSelected);
  const currentWhiteness = firstSelected?.filters.whiteness || 0;
  const currentBlackness = firstSelected?.filters.blackness || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto animate-fade-in pb-20">
      
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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Arrange Pages</h2>
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
                <SortableItem key={page.id} id={page.id} page={page} onClick={() => toggleSelection(page.id)} />
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
