
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Volume2, Info, Loader2 } from 'lucide-react';
import { SYSTEM_INSTRUCTION_LIVE } from '../constants';

const VoiceConsultant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Manually implement decode following guideline example
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Manually implement encode following guideline example
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Implement decoding logic for raw PCM as per guidelines
  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const startSession = async () => {
    setStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Create a new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION_LIVE,
        },
        callbacks: {
          onopen: () => {
            setStatus('listening');
            setIsActive(true);

            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // Initiate sendRealtimeInput after live.connect call resolves
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              const buffer = await decodeAudioData(
                decode(audioData),
                outputAudioContextRef.current!,
                24000,
                1
              );
              
              const source = outputAudioContextRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContextRef.current!.destination);
              
              // Schedule each new audio chunk to start at this time for gapless playback
              const startAt = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
              source.start(startAt);
              nextStartTimeRef.current = startAt + buffer.duration;
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (err) => {
            console.error('Session error:', err);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus('idle');
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setStatus('idle');
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-screen max-w-2xl mx-auto text-center">
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">HealthDost Voice Assistant</h1>
        <p className="text-slate-500">Multilingual voice consultation for immediate comfort and guidance.</p>
      </div>

      <div className="relative mb-12">
        {/* Animated Rings */}
        {status === 'listening' && (
          <div className="absolute inset-0 -m-8 flex items-center justify-center">
            <div className="w-48 h-48 bg-teal-200/50 rounded-full animate-ping opacity-75"></div>
            <div className="absolute w-40 h-40 bg-teal-300/30 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
          </div>
        )}
        {status === 'speaking' && (
          <div className="absolute inset-0 -m-8 flex items-center justify-center">
            <div className="w-48 h-48 bg-blue-200/50 rounded-full animate-pulse opacity-75"></div>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={isActive ? stopSession : startSession}
          disabled={status === 'connecting'}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${
            isActive 
              ? 'bg-rose-600 text-white shadow-rose-200' 
              : 'bg-teal-600 text-white shadow-teal-200'
          }`}
        >
          {status === 'connecting' ? (
            <Loader2 className="animate-spin" size={48} />
          ) : isActive ? (
            <MicOff size={48} />
          ) : (
            <Mic size={48} />
          )}
        </button>
      </div>

      <div className="mb-12">
        <div className={`text-xl font-bold mb-2 ${
          status === 'listening' ? 'text-teal-600' : 
          status === 'speaking' ? 'text-blue-600' : 'text-slate-400'
        }`}>
          {status === 'connecting' && 'Connecting to Gemini...'}
          {status === 'listening' && 'Listening to you...'}
          {status === 'speaking' && 'HealthDost is speaking...'}
          {status === 'idle' && 'Click the microphone to start'}
        </div>
        <p className="text-sm text-slate-400 max-w-xs mx-auto">
          {isActive ? 'Speak naturally in Hindi or English. HealthDost will understand you.' : 'The AI will help guide you through your health concerns using voice.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
          <Volume2 className="text-blue-500" size={24} />
          <span className="text-xs font-bold text-slate-500 uppercase">Speaker Mode</span>
          <span className="text-sm font-medium text-slate-900">Active</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
          <Info className="text-amber-500" size={24} />
          <span className="text-xs font-bold text-slate-500 uppercase">AI Disclaimer</span>
          <span className="text-sm font-medium text-slate-900 leading-tight">Screening Only</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceConsultant;
