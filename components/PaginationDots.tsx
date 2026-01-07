import React from 'react';

interface PaginationDotsProps {
    count: number;
    currentIndex: number;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({ count, currentIndex }) => {
    if (count <= 1) return <div className="h-2" />;
    
    return (
        <div className="flex gap-2 items-center justify-center py-2">
            {Array.from({ length: count }).map((_, i) => (
                <div 
                    key={i}
                    className={`size-1.5 rounded-full transition-all duration-300 ${
                        i === currentIndex ? 'bg-ink scale-125' : 'bg-ink/20'
                    }`}
                />
            ))}
        </div>
    );
};