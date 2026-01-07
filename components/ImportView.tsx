import React from 'react';

interface ImportViewProps {
    text: string;
    setText: (text: string) => void;
    onImport: () => void;
    isListening: boolean;
    onToggleVoice: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ 
    text, 
    setText, 
    onImport, 
    isListening, 
    onToggleVoice 
}) => {
    return (
        <div className="relative flex h-full w-full flex-col font-kalam bg-sticky-yellow z-40 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-6 pb-2 z-20">
                <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors text-ink/60">
                    <span className="material-symbols-outlined text-2xl font-bold">close</span>
                </button>
                <h1 className="text-2xl font-bold tracking-wide text-ink flex-1 text-center pr-10">
                    Import a List
                </h1>
            </header>
            
            <main className="flex-1 flex flex-col items-center justify-between w-full px-6 py-4 pb-32 overflow-hidden">
                
                {/* URL Input - Compact Top */}
                <div className="w-full flex flex-col items-center opacity-40 focus-within:opacity-100 hover:opacity-80 transition-all duration-300 group">
                    <div className="bg-white/40 p-2 rounded-lg -rotate-1 shadow-sm mb-1 group-focus-within:rotate-0 transition-transform">
                        <span className="material-symbols-outlined text-3xl">link</span>
                    </div>
                    <input 
                        className="bg-transparent border-none text-center text-xl font-bold text-ink placeholder-ink/40 focus:ring-0 outline-none p-0 w-full font-kalam" 
                        placeholder="Paste URL..." 
                        type="url"
                    />
                    <p className="text-xs font-hand opacity-70">from a website</p>
                </div>

                {/* Main Text Input - Flexible Center */}
                <div className="flex-1 w-full flex flex-col items-center justify-center py-4">
                    <div className="w-full max-w-sm relative">
                        <div className="absolute inset-0 bg-yellow-400/10 blur-3xl rounded-full scale-110 opacity-50 pointer-events-none"></div>
                        <div className="relative flex flex-col items-center">
                            <textarea 
                                autoFocus
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="w-full bg-transparent border-none text-center text-3xl sm:text-4xl font-bold text-ink marker-placeholder focus:ring-0 outline-none resize-none leading-tight p-0 h-40 sm:h-48 overflow-visible font-kalam" 
                                placeholder="Type or paste your list here..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Secondary Options - Compact Row */}
                <div className="w-full flex justify-around items-end gap-4 pb-4">
                    <button className="flex flex-col items-center opacity-40 hover:opacity-80 transition-all duration-300 group focus:outline-none">
                        <div className="bg-white/40 p-2.5 rounded-lg rotate-1 shadow-sm mb-1 group-hover:rotate-0 transition-transform">
                            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                        </div>
                        <p className="text-lg font-bold text-ink font-kalam leading-tight">From photo</p>
                    </button>

                    <button className="flex flex-col items-center opacity-40 hover:opacity-80 transition-all duration-300 group focus:outline-none">
                        <div className="bg-white/40 p-2.5 rounded-lg -rotate-1 shadow-sm mb-1 group-hover:rotate-0 transition-transform">
                            <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                        </div>
                        <p className="text-lg font-bold text-ink font-kalam leading-tight">From code</p>
                    </button>
                </div>
            </main>

            {/* Sticky Action Bar */}
            <div className="absolute bottom-0 left-0 w-full p-6 pb-8 bg-gradient-to-t from-sticky-yellow from-60% to-transparent z-50 flex justify-center items-end h-32 pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <button 
                        onClick={onToggleVoice}
                        className={`flex shrink-0 items-center justify-center size-14 rounded-full transition-all duration-300 border-2
                            ${isListening 
                                ? 'border-ink-red bg-ink-red text-white animate-pulse shadow-md' 
                                : 'border-ink/5 bg-white/40 text-ink/40 hover:bg-white/60 hover:text-ink hover:border-ink/20'}
                        `}
                        title="Dictate list"
                    >
                        <span className="material-symbols-outlined text-3xl">mic</span>
                    </button>

                    <button 
                        onClick={onImport}
                        disabled={!text.trim()}
                        className={`flex items-center gap-2 px-8 h-14 rounded-full border-2 border-ink/10 bg-white/40 backdrop-blur-md transition-all text-xl font-bold group shadow-sm
                            ${text.trim() ? 'hover:border-ink/50 hover:bg-white/80 opacity-100 cursor-pointer shadow-md' : 'opacity-50 cursor-not-allowed'}
                        `}
                    >
                        <span>Make it Sticky</span>
                        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">auto_awesome</span>
                    </button>
                </div>
            </div>
        </div>
    );
};