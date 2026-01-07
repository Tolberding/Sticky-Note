import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Task } from '../types';
import { base64ToUint8Array, float32ToInt16, arrayBufferToBase64, decodeAudioData } from '../utils/audioUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Define Tools
const updateTasksTool: FunctionDeclaration = {
    name: 'update_tasks',
    description: 'Update the full list of tasks. Use this for adding, removing, or reordering tasks based on user instruction.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            tasks: {
                type: Type.ARRAY,
                description: 'The new list of task strings in the desired order.',
                items: {
                    type: Type.STRING
                }
            }
        },
        required: ['tasks']
    }
};

const nextStepTool: FunctionDeclaration = {
    name: 'next_step',
    description: 'Mark the current active task as completed and move to the next task.',
    parameters: { type: Type.OBJECT, properties: {} }
};

const uncheckTaskTool: FunctionDeclaration = {
    name: 'uncheck_task',
    description: 'Mark a previously completed task as incomplete (active) again. Use this if the user says they made a mistake or need to go back.',
    parameters: { type: Type.OBJECT, properties: {} }
};

const prevStepTool: FunctionDeclaration = {
    name: 'prev_step',
    description: 'Move back to the previous task, marking it as active again.',
    parameters: { type: Type.OBJECT, properties: {} }
};

const readDetailsTool: FunctionDeclaration = {
    name: 'read_details',
    description: 'Read the details of the currently active task.',
    parameters: { type: Type.OBJECT, properties: {} }
};

const tools = [updateTasksTool, nextStepTool, uncheckTaskTool, prevStepTool, readDetailsTool];

const SYSTEM_INSTRUCTION = `You are a Voice-Driven Task Assistant. You manage a list of steps.
Your goal is to listen to the user and call the correct function to update the state.
The State: A list of steps with 'status' (pending, active, completed).

Rules:
1. If the user implies they are done (e.g., 'Got it', 'Okay', 'Check'), call next_step.
2. If the user says they made a mistake, aren't actually done, or want to uncheck something, call uncheck_task.
3. If they ask a question, answer it using your knowledge base, then ask if they are ready to proceed.
4. If they want to add or change the list structure, use update_tasks.

Always speak concisely and casually, like a helpful friend.`;

export class GeminiLiveService {
    private session: any = null;
    private inputAudioContext: AudioContext | null = null;
    private outputAudioContext: AudioContext | null = null;
    private inputSource: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private outputNode: GainNode | null = null;
    private nextStartTime = 0;
    
    // Callbacks
    public onTasksUpdate: ((tasks: string[]) => void) | null = null;
    public onNextStep: (() => void) | null = null;
    public onUncheckTask: (() => void) | null = null;
    public onPrevStep: (() => void) | null = null;
    public onReadDetails: (() => void) | null = null;
    public onError: ((error: string) => void) | null = null;
    public onConnect: (() => void) | null = null;
    public onDisconnect: (() => void) | null = null;

    constructor() {}

    async connect(initialTasks: Task[]) {
        if (this.session) return;

        this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        this.outputNode = this.outputAudioContext!.createGain();
        this.outputNode.connect(this.outputAudioContext!.destination);

        const currentTaskStrings = initialTasks.map(t => t.text);

        try {
            this.session = await ai.live.connect({
                model: MODEL_NAME,
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: [{ functionDeclarations: tools }],
                    systemInstruction: SYSTEM_INSTRUCTION,
                },
                callbacks: {
                    onopen: () => {
                        console.log('Gemini Live Connected');
                        if (this.onConnect) this.onConnect();
                        
                        if(this.session) {
                             this.session.send("Current state: " + JSON.stringify(currentTaskStrings));
                        }
                        this.startAudioStream();
                    },
                    onmessage: this.handleMessage.bind(this),
                    onclose: () => {
                        console.log('Gemini Live Closed');
                        if (this.onDisconnect) this.onDisconnect();
                        this.stopAudioStream();
                        this.session = null;
                    },
                    onerror: (e) => {
                        console.error('Gemini Live Error', e);
                        if (this.onError) this.onError(e.message || 'Unknown error');
                    }
                }
            });
        } catch (err: any) {
            console.error("Connection failed", err);
            if (this.onError) this.onError(err.message);
        }
    }

    private async handleMessage(message: LiveServerMessage) {
        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            this.playAudio(audioData);
        }

        const toolCall = message.toolCall;
        if (toolCall) {
            for (const call of toolCall.functionCalls) {
                console.log('Tool Call:', call.name, call.args);
                let result: any = { status: 'ok' };

                switch (call.name) {
                    case 'update_tasks':
                        const args = call.args as any;
                        if (this.onTasksUpdate && args.tasks) {
                            this.onTasksUpdate(args.tasks as string[]);
                        }
                        break;
                    case 'next_step':
                        if (this.onNextStep) this.onNextStep();
                        break;
                    case 'uncheck_task':
                        if (this.onUncheckTask) this.onUncheckTask();
                        break;
                    case 'prev_step':
                        if (this.onPrevStep) this.onPrevStep();
                        break;
                    case 'read_details':
                        if (this.onReadDetails) this.onReadDetails();
                        break;
                    default:
                        console.warn('Unknown tool call:', call.name);
                        result = { error: 'Unknown tool' };
                }

                if (this.session) {
                    this.session.sendToolResponse({
                        functionResponses: {
                            id: call.id,
                            name: call.name,
                            response: { result }
                        }
                    });
                }
            }
        }
    }

    private async startAudioStream() {
        if (!this.inputAudioContext) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
            this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                if (!this.session) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const int16Data = float32ToInt16(inputData);
                const base64Data = arrayBufferToBase64(int16Data.buffer);
                
                this.session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Data
                    }
                });
            };

            this.inputSource.connect(this.processor);
            this.processor.connect(this.inputAudioContext.destination);
        } catch (e) {
            console.error('Error starting audio stream', e);
            if (this.onError) this.onError('Could not access microphone');
        }
    }

    private stopAudioStream() {
        if (this.processor) {
            this.processor.disconnect();
            this.processor.onaudioprocess = null;
            this.processor = null;
        }
        if (this.inputSource) {
            this.inputSource.disconnect();
            this.inputSource = null;
        }
        if (this.inputAudioContext) {
            this.inputAudioContext.close();
            this.inputAudioContext = null;
        }
    }

    private async playAudio(base64Data: string) {
        if (!this.outputAudioContext || !this.outputNode) return;
        
        if (this.outputAudioContext.state === 'suspended') {
            await this.outputAudioContext.resume();
        }

        const audioBytes = base64ToUint8Array(base64Data);
        const buffer = await decodeAudioData(audioBytes, this.outputAudioContext, 24000);
        
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.outputNode);
        
        const currentTime = this.outputAudioContext.currentTime;
        const start = Math.max(currentTime, this.nextStartTime);
        source.start(start);
        this.nextStartTime = start + buffer.duration;
    }

    disconnect() {
        if (this.session) {
             try {
                (this.session as any).close();
             } catch(e) { /* ignore */ }
        }
        this.stopAudioStream();
        if (this.outputAudioContext) {
            this.outputAudioContext.close();
            this.outputAudioContext = null;
        }
        this.session = null;
    }
}