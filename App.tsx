import React, { useState, useEffect, useRef } from 'react';
import { Task, List } from './types';
import { TaskView } from './components/TaskView';
import { VoiceControl } from './components/VoiceControl';
import { ImportView } from './components/ImportView';
import { PaginationDots } from './components/PaginationDots';
import { GeminiLiveService } from './services/geminiLiveService';

export default function App() {
    // Mode State
    const [isImporting, setIsImporting] = useState(true);
    const [importText, setImportText] = useState('');
    
    // Multi-List State
    const [lists, setLists] = useState<List[]>([]);
    const [currentListIndex, setCurrentListIndex] = useState(0);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const serviceRef = useRef<GeminiLiveService | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initializer
    useEffect(() => {
        serviceRef.current = new GeminiLiveService();
        return () => {
            serviceRef.current?.disconnect();
        };
    }, []);

    // Handle horizontal scroll snapping to update index
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const width = scrollContainerRef.current.clientWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex !== currentListIndex) {
            setCurrentListIndex(newIndex);
        }
    };

    // Service Callbacks Logic
    useEffect(() => {
        const service = serviceRef.current;
        if (!service) return;

        service.onTasksUpdate = (newTasksStrings) => {
            if (isImporting) {
                setImportText(newTasksStrings.join('\n'));
            } else {
                setLists(prev => {
                    const newLists = [...prev];
                    newLists[currentListIndex].tasks = newTasksStrings.map((str, idx) => ({
                        id: `task-${Date.now()}-${idx}`,
                        text: str,
                        status: idx === 0 ? 'active' : 'pending'
                    }));
                    return newLists;
                });
            }
        };

        service.onNextStep = () => {
            if (isImporting) {
                handleFinishImport();
            } else {
                setLists(prev => {
                    if (prev.length === 0) return prev;
                    const newLists = [...prev];
                    const currentTasks = [...newLists[currentListIndex].tasks];
                    const activeIndex = currentTasks.findIndex(t => t.status === 'active');
                    
                    if (activeIndex !== -1) {
                        currentTasks[activeIndex] = { ...currentTasks[activeIndex], status: 'completed' };
                        if (activeIndex + 1 < currentTasks.length) {
                            currentTasks[activeIndex + 1] = { ...currentTasks[activeIndex + 1], status: 'active' };
                        }
                    }
                    newLists[currentListIndex].tasks = currentTasks;
                    return newLists;
                });
            }
        };

        service.onUncheckTask = () => {
            if (isImporting) return;
            setLists(prev => {
                if (prev.length === 0) return prev;
                const newLists = [...prev];
                const currentTasks = [...newLists[currentListIndex].tasks];
                const activeIndex = currentTasks.findIndex(t => t.status === 'active');
                
                // If we have an active task, the one to "uncheck" is the previous one (which is completed)
                if (activeIndex > 0) {
                    currentTasks[activeIndex] = { ...currentTasks[activeIndex], status: 'pending' };
                    currentTasks[activeIndex - 1] = { ...currentTasks[activeIndex - 1], status: 'active' };
                } 
                // If everything is completed, uncheck the very last one
                else if (activeIndex === -1 && currentTasks.length > 0) {
                    const lastIdx = currentTasks.length - 1;
                    currentTasks[lastIdx] = { ...currentTasks[lastIdx], status: 'active' };
                }
                
                newLists[currentListIndex].tasks = currentTasks;
                return newLists;
            });
        };

        service.onPrevStep = () => {
            if (isImporting) return;
            setLists(prev => {
                if (prev.length === 0) return prev;
                const newLists = [...prev];
                const currentTasks = [...newLists[currentListIndex].tasks];
                const activeIndex = currentTasks.findIndex(t => t.status === 'active');
                
                if (activeIndex > 0) {
                    currentTasks[activeIndex] = { ...currentTasks[activeIndex], status: 'pending' };
                    currentTasks[activeIndex - 1] = { ...currentTasks[activeIndex - 1], status: 'active' };
                }
                newLists[currentListIndex].tasks = currentTasks;
                return newLists;
            });
        };

        service.onReadDetails = () => {
            console.log("Gemini is reading details...");
        };

        service.onError = (msg) => {
            setError(msg);
            setIsListening(false);
        };

        service.onDisconnect = () => setIsListening(false);
    }, [isImporting, currentListIndex, lists.length]);

    const toggleVoice = async () => {
        if (!serviceRef.current) return;

        if (isListening) {
            serviceRef.current.disconnect();
            setIsListening(false);
        } else {
            setError(undefined);
            setIsListening(true);
            
            const initialContext: Task[] = isImporting 
                ? importText.split('\n').filter(Boolean).map((t, i) => ({ id: `${i}`, text: t, status: 'pending' }))
                : lists[currentListIndex]?.tasks || [];
                
            await serviceRef.current.connect(initialContext);
        }
    };

    const handleFinishImport = () => {
        const lines = importText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return;

        const newList: List = {
            id: `list-${Date.now()}`,
            name: `List ${lists.length + 1}`,
            tasks: lines.map((line, idx) => ({
                id: `task-${idx}-${Date.now()}`,
                text: line,
                status: idx === 0 ? 'active' : 'pending'
            }))
        };

        setLists(prev => [...prev, newList]);
        setCurrentListIndex(lists.length);
        setImportText('');
        setIsImporting(false);
        
        if (isListening) {
            serviceRef.current?.disconnect();
            setIsListening(false);
        }
    };

    return (
        <div className="relative h-full w-full flex flex-col bg-sticky-yellow text-ink font-hand overflow-hidden select-none">
            {/* Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-repeat z-0" 
                 style={{ backgroundImage: `url('https://picsum.photos/200/200?grayscale')` }}></div>
            
            {isImporting ? (
                <ImportView 
                    text={importText} 
                    setText={setImportText} 
                    onImport={handleFinishImport}
                    isListening={isListening}
                    onToggleVoice={toggleVoice}
                />
            ) : (
                <div className="relative h-full w-full flex flex-col z-10">
                    {/* Centered Header Layout */}
                    <header className="relative flex items-center justify-center px-6 pt-8 pb-2 min-h-[80px]">
                        <button 
                            onClick={() => setIsImporting(true)}
                            className="absolute left-6 flex size-12 items-center justify-center rounded-full hover:bg-black/5 transition-colors text-ink/40 hover:text-ink"
                        >
                            <span className="material-symbols-outlined text-3xl">arrow_back</span>
                        </button>
                        
                        <div className="z-20">
                            <PaginationDots count={lists.length} currentIndex={currentListIndex} />
                        </div>
                        
                        <VoiceControl isActive={isListening} onClick={toggleVoice} error={error} />
                    </header>

                    {/* Horizontal List Scroller */}
                    <div 
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
                    >
                        {lists.map((list) => (
                            <TaskView key={list.id} tasks={list.tasks} />
                        ))}
                    </div>

                    {/* Bottom Hint */}
                    <footer className="h-16 flex items-start justify-center opacity-20 text-sm tracking-widest font-display">
                        <p>Say "Next task"</p>
                    </footer>
                </div>
            )}
        </div>
    );
}