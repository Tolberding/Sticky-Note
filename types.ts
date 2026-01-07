export type TaskStatus = 'pending' | 'active' | 'completed';

export interface Task {
    id: string;
    text: string;
    status: TaskStatus;
    details?: string;
}

export interface List {
    id: string;
    name: string;
    tasks: Task[];
}

export interface ToolCall {
    functionCalls: {
        id: string;
        name: string;
        args: any;
    }[];
}

export interface AudioConfig {
    sampleRate: number;
}