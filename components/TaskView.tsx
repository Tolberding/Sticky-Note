import React from 'react';
import { Task } from '../types';

interface TaskViewProps {
    tasks: Task[];
}

export const TaskView: React.FC<TaskViewProps> = ({ tasks }) => {
    const activeIndex = tasks.findIndex(t => t.status === 'active');

    // Filter tasks for display sections
    const completedTasks = tasks.filter((_, i) => i < activeIndex);
    const activeTask = activeIndex >= 0 ? tasks[activeIndex] : null;
    const pendingTasks = tasks.filter((_, i) => i > activeIndex);
    
    const allCompleted = activeIndex === -1 && tasks.length > 0 && tasks.every(t => t.status === 'completed');

    return (
        <div className="flex-1 flex flex-col items-center justify-center w-full min-w-full px-10 snap-center select-none">
            {/* Completed Tasks (Top) */}
            <div className="flex flex-col items-center gap-4 mb-8 w-full transition-opacity duration-500 min-h-[80px] justify-end">
                {completedTasks.slice(-2).map((task) => (
                    <div key={task.id} className="relative group opacity-30">
                        <p className={`text-2xl text-ink font-hand transform ${Math.random() > 0.5 ? 'rotate-1' : '-rotate-1'} line-through decoration-ink/60 decoration-1`}>
                            {task.text}
                        </p>
                        <svg className="absolute -inset-x-2 top-1/2 -translate-y-1/2 w-[calc(100%+16px)] h-4 pointer-events-none overflow-visible opacity-40">
                            <path d="M0,8 Q20,2 40,8 T80,8 T120,4" fill="none" stroke="#2c2a1e" strokeLinecap="round" strokeWidth="1" className="scribble-path"></path>
                        </svg>
                    </div>
                ))}
            </div>

            {/* Active Task (Hero) */}
            <div className="w-full flex flex-col items-center min-h-[160px] justify-center">
                {activeTask ? (
                    <div className="w-full text-center relative z-10 animate-float">
                        <h1 className="text-[3.2rem] leading-tight font-bold text-ink tracking-tight transform -rotate-1 px-4">
                            {activeTask.text}
                        </h1>
                        {/* Underline */}
                        <svg className="w-40 h-3 mx-auto mt-3 opacity-40" fill="none" viewBox="0 0 200 15">
                            <path d="M10 10 Q 100 15 190 5" stroke="#2c2a1e" strokeLinecap="round" strokeWidth="4"></path>
                        </svg>
                    </div>
                ) : allCompleted ? (
                    <div className="w-full text-center py-6 animate-float">
                        <h1 className="text-[3rem] font-bold text-ink transform rotate-1">All Done! 🎉</h1>
                        <p className="text-ink/40 text-xl mt-2 font-hand">Everything checked off.</p>
                    </div>
                ) : (
                    <div className="opacity-20 italic text-2xl">No tasks yet</div>
                )}
            </div>

            {/* Pending Tasks (Bottom) */}
            <div className="flex flex-col items-center gap-4 mt-8 w-full transition-all duration-500 min-h-[120px]">
                {pendingTasks.slice(0, 3).map((task, idx) => (
                    <div key={task.id} className={`transform ${idx === 0 ? 'opacity-40' : idx === 1 ? 'opacity-20 scale-95' : 'opacity-10 scale-90'}`}>
                        <p className="text-2xl text-ink font-hand">
                            {task.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};