import React from 'react';
import { Upload, Grid, LayoutTemplate, Download } from 'lucide-react';
import { AppStep } from '../types';

interface StepperProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.UPLOAD, label: 'Collection', icon: Upload },
  { id: AppStep.WORKSHOP, label: 'Workshop', icon: Grid },
  { id: AppStep.LAYOUT, label: 'Blueprint', icon: LayoutTemplate },
  { id: AppStep.DOWNLOAD, label: 'Production', icon: Download },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12 px-4">
      <div className="relative flex justify-between items-center">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-zinc-800 -z-10 -translate-y-1/2 rounded-full" />
        
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center gap-2 bg-white dark:bg-[#0f0f0f] px-2 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-60'}`}
            >
              <div 
                className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-all duration-500
                  ${isActive || isCompleted 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none' 
                    : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-400'}
                `}
              >
                <step.icon size={20} />
              </div>
              <span className={`text-xs font-medium tracking-wide uppercase ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};