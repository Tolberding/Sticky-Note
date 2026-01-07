import React from 'react';

interface VoiceControlProps {
    isActive: boolean;
    onClick: () => void;
    error?: string;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ isActive, onClick, error }) => {
    return (
        <div className="absolute top-8 right-6 z-50">
            <button 
                onClick={onClick}
                className={`group relative flex items-center justify-center size-14 rounded-full transition-all duration-300 
                    ${isActive ? 'animate-breathe' : 'hover:bg-black/5'}
                `}
            >
                {/* Status Ring */}
                <div className={`absolute inset-0 size-full rounded-full border-2 transition-colors duration-500
                    ${isActive ? 'border-ink-red' : 'border-ink/10'}
                `}></div>
                
                {/* Icon */}
                <span className={`material-symbols-outlined transition-colors duration-300 
                    ${isActive ? 'text-ink-red' : 'text-ink/30 group-hover:text-ink'} 
                    relative z-10
                `} style={{ fontSize: '28px' }}>
                    {isActive ? 'mic' : 'mic'}
                </span>

                {isActive && (
                    <div className="absolute inset-0 rounded-full bg-ink-red/5 animate-ping -z-10"></div>
                )}
            </button>
            {error && (
                <div className="absolute top-full right-0 mt-2 bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded w-24 text-center shadow-sm">
                    {error}
                </div>
            )}
        </div>
    );
};