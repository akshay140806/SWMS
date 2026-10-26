import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  Package,
  MapPin,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Languages,
  Settings as SettingsIcon,
  CheckCircle,
  Key,
  ExternalLink,
  Sliders,
  ChevronDown,
  Globe
} from 'lucide-react';
import api from '../lib/api';

// Gentle UI Audio Chimes via Web Audio API (No external sound files required)
function playTone(type = 'start') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      // Ascending chime for listening
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'success') {
      // Warm chord for response
      osc.frequency.setValueAtTime(659, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    // AudioContext blocked by autoplay policy
  }
}

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(() => localStorage.getItem('warex_voice_muted') === 'true');
  
  // Multilingual & Voice Persona Controls
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('warex_voice_lang') || 'auto');
  const [voicePersona, setVoicePersona] = useState(() => localStorage.getItem('warex_voice_persona') || 'nova');
  const [voiceSpeed, setVoiceSpeed] = useState(() => parseFloat(localStorage.getItem('warex_voice_speed') || '1.02'));
  const [voicePitch, setVoicePitch] = useState(() => parseFloat(localStorage.getItem('warex_voice_pitch') || '1.05'));
  
  // Gemini API Key state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState(null);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your WareX AI Copilot for ANS Vasi Provisions. I have live real-time access to your complete inventory, stock, orders, storage bins, and financials. Speak or type any question in English, தமிழ் (Tamil), or हिन्दी (Hindi).',
      spoken: 'Hello! I am your WareX AI Copilot for ANS Vasi Provisions. Ask me any question about your warehouse operations, stock, or orders.',
      cards: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isProcessing]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('warex_voice_muted', speechMuted);
    if (speechMuted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechMuted]);

  useEffect(() => {
    localStorage.setItem('warex_voice_lang', selectedLang);
  }, [selectedLang]);

  useEffect(() => {
    localStorage.setItem('warex_voice_persona', voicePersona);
    localStorage.setItem('warex_voice_speed', voiceSpeed);
    localStorage.setItem('warex_voice_pitch', voicePitch);
  }, [voicePersona, voiceSpeed, voicePitch]);

  // Stop speech when assistant is closed
  useEffect(() => {
    if (!isOpen && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // Helper: Find matching voice for Persona and Language
  const selectVoiceForText = (text, langCode = 'en') => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Detect language of text if not provided
    const isTamil = langCode === 'ta' || /[\u0B80-\u0BFF]/.test(text);
    const isHindi = langCode === 'hi' || /[\u0900-\u097F]/.test(text);
    const isTelugu = langCode === 'te' || /[\u0C00-\u0C7F]/.test(text);

    if (isTamil) {
      const tamilVoice = voices.find((v) => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
      if (tamilVoice) return { voice: tamilVoice, rate: 0.98, pitch: 1.0 };
    }

    if (isHindi) {
      const hindiVoice = voices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('kalpana'));
      if (hindiVoice) return { voice: hindiVoice, rate: 1.0, pitch: 1.0 };
    }

    if (isTelugu) {
      const teluguVoice = voices.find((v) => v.lang.startsWith('te') || v.name.toLowerCase().includes('telugu'));
      if (teluguVoice) return { voice: teluguVoice, rate: 0.98, pitch: 1.0 };
    }

    // Persona-based English selection
    let voice = null;
    let rate = voiceSpeed;
    let pitch = voicePitch;

    if (voicePersona === 'nova') {
      // Nova: Crystal clear, modern female neural voice
      voice = voices.find(
        (v) =>
          (v.name.includes('Google UK English Female') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Zira') ||
            v.name.includes('Jenny')) &&
          v.lang.startsWith('en')
      );
      pitch = 1.06;
      rate = 1.04;
    } else if (voicePersona === 'rishi') {
      // Rishi: Authentic Indian English grounded voice
      voice = voices.find(
        (v) =>
          (v.lang === 'en-IN' ||
            v.name.includes('India') ||
            v.name.includes('Rishi') ||
            v.name.includes('Heera') ||
            v.name.includes('Ravi')) &&
          v.lang.startsWith('en')
      );
      pitch = 0.98;
      rate = 1.0;
    } else if (voicePersona === 'aura') {
      // Aura: Warm, relaxed, velvet voice
      voice = voices.find(
        (v) =>
          (v.name.includes('Google US English') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria') ||
            v.name.includes('Aria')) &&
          v.lang.startsWith('en')
      );
      pitch = 1.08;
      rate = 1.02;
    }

    if (!voice) {
      voice = voices.find((v) => v.lang.startsWith('en-IN')) || voices.find((v) => v.lang.startsWith('en'));
    }

    return { voice, rate, pitch };
  };

  // Modern Speech Synthesis Readout
  const speakText = (text, langCode = 'en') => {
    if (speechMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceConfig = selectVoiceForText(text, langCode);

      if (voiceConfig?.voice) {
        utterance.voice = voiceConfig.voice;
      }
      utterance.rate = voiceConfig?.rate || voiceSpeed;
      utterance.pitch = voiceConfig?.pitch || voicePitch;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      playTone('success');
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  };

  // Toggle Microphone / Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use the input box to type your customized question.');
      return;
    }

    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set recognition language based on user selection
      if (selectedLang === 'ta') {
        recognition.lang = 'ta-IN';
      } else if (selectedLang === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (selectedLang === 'te') {
        recognition.lang = 'te-IN';
      } else if (selectedLang === 'en_us') {
        recognition.lang = 'en-US';
      } else {
        recognition.lang = 'en-IN'; // Default Indian English / Multi
      }

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        playTone('start');
      };

      recognition.onresult = (event) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
        if (event.results[0].isFinal) {
          handleSendQuery(current);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Recognition start error:', err);
      setIsListening(false);
    }
  };

  // Submit Query to Gemini 3.8 Live & 3.5 Live Translate Backend
  const handleSendQuery = async (queryText) => {
    const prompt = (queryText || inputText || transcript).trim();
    if (!prompt || isProcessing) return;

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setInputText('');
    setTranscript('');

    const userMsg = {
      id: Date.now() + '-user',
      role: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const res = await api.post('/ai/voice-assist', {
        prompt,
        language: selectedLang
      });
      const data = res.data;

      const assistantMsg = {
        id: Date.now() + '-assistant',
        role: 'assistant',
        text: data.displayText || data.spokenReply,
        spoken: data.spokenReply,
        cards: data.cards || [],
        action: data.action,
        source: data.source || 'Gemini 3.8 Live',
        language: data.language || 'en',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);

      if (data.spokenReply) {
        speakText(data.spokenReply, data.language || 'en');
      }
    } catch (err) {
      console.error('Voice assist error:', err);
      setIsProcessing(false);
      const errMsg = {
        id: Date.now() + '-err',
        role: 'assistant',
        text: 'Sorry, I had trouble retrieving live records. Please try again.',
        spoken: 'Sorry, I had trouble checking the warehouse records.',
        cards: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
      speakText('Sorry, I had trouble checking the warehouse records.');
    }
  };

  // Save Gemini Key Handler
  const handleSaveGeminiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsSavingKey(true);
    setKeyStatus(null);
    try {
      const res = await api.post('/ai/set-key', { apiKey: apiKeyInput.trim() });
      setKeyStatus({ ok: true, msg: 'Gemini 3.8 Live activated successfully!' });
      setIsSavingKey(false);
    } catch (e) {
      setKeyStatus({ ok: false, msg: e.response?.data?.error || 'Verification failed. Please check the key.' });
      setIsSavingKey(false);
    }
  };


  return (
    <>
      {/* Floating Trigger Button (Bottom-Right Dock) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-xl border border-indigo-200 dark:border-indigo-900/60 text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer hover:shadow-2xl transition-all hover:scale-105 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gemini 3.8 Live</span>
            <span className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-[10px] text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
              Live Translate
            </span>
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Open Gemini Voice Assistant"
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform active:scale-95 ${
            isListening
              ? 'bg-gradient-to-tr from-rose-500 via-pink-600 to-amber-500 ring-4 ring-rose-400/50 scale-110 animate-pulse'
              : isSpeaking
              ? 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-500 ring-4 ring-emerald-400/50 animate-bounce'
              : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 hover:ring-4 hover:ring-indigo-400/40 hover:scale-105'
          }`}
        >
          <span
            className={`absolute -inset-1 rounded-full opacity-70 blur-md bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 -z-10 ${
              isListening || isSpeaking ? 'animate-pulse' : ''
            }`}
          ></span>

          {isOpen ? (
            <X className="w-6 h-6" />
          ) : isListening ? (
            <Mic className="w-6 h-6 animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <Sparkles className="w-6 h-6 text-amber-200" />
          )}
        </button>
      </div>

      {/* Voice Assistant Panel / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[460px] max-h-[86vh] h-[660px] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-indigo-200/80 dark:border-slate-800 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6">
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base tracking-tight leading-none">
                    Gemini 3.8 Live
                  </h3>
                  <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-indigo-300 text-slate-900 font-extrabold px-1.5 py-0.2 rounded-md">
                    3.5 Translate
                  </span>
                </div>
                <div className="text-[11px] text-white/85 mt-1 flex items-center gap-1.5 font-medium">
                  {isListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block"></span>
                      <span className="text-rose-100 font-bold">Listening to you...</span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce inline-block"></span>
                      <span className="text-emerald-100 font-bold">Speaking answer aloud...</span>
                    </>
                  ) : isProcessing ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin inline-block"></span>
                      <span>Consulting warehouse ledger...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      <span>Voice: {voicePersona.toUpperCase()} • {selectedLang.toUpperCase()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Voice Configuration & Personas Button */}
              <button
                onClick={() => setShowConfig((c) => !c)}
                title="Voice Persona & Gemini Settings"
                className={`p-2 rounded-xl transition-all ${
                  showConfig ? 'bg-white text-indigo-700 shadow-md' : 'hover:bg-white/15 text-white/90 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Mute/Unmute Toggle */}
              <button
                onClick={() => setSpeechMuted((m) => !m)}
                title={speechMuted ? 'Unmute voice' : 'Mute voice'}
                className="p-2 rounded-xl hover:bg-white/15 text-white/90 hover:text-white transition-colors"
              >
                {speechMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-white/15 text-white/90 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Configuration Drawer: Voice Personas, Speed & Gemini Key */}
          {showConfig && (
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-indigo-200 dark:border-indigo-900/60 p-4 text-xs space-y-3.5 shadow-inner transition-all animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  AI Voice Persona & Multilingual Tuning
                </span>
                <button
                  onClick={() => setShowConfig(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px]"
                >
                  Done
                </button>
              </div>

              {/* Voice Persona Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Choose AI Voice:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'nova', name: '🌟 Nova', desc: 'Clear & Modern' },
                    { id: 'rishi', name: '⚡ Rishi', desc: 'Indian Accent' },
                    { id: 'aura', name: '💎 Aura', desc: 'Warm Velvet' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setVoicePersona(p.id);
                        speakText(`Voice changed to ${p.name}`);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        voicePersona === p.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/30'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Speed & Pitch Tuning */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                    <span>Speed:</span>
                    <strong className="text-indigo-600">{voiceSpeed}x</strong>
                  </div>
                  <input
                    type="range"
                    min="0.85"
                    max="1.25"
                    step="0.05"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                    <span>Tone Pitch:</span>
                    <strong className="text-indigo-600">{voicePitch}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.9"
                    max="1.2"
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Gemini 3.8 Live API Key Setting */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  Google Gemini Live API Key (Optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy... (leave empty for autonomous mode)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveGeminiKey}
                    disabled={isSavingKey || !apiKeyInput.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shrink-0"
                  >
                    {isSavingKey ? 'Verifying...' : 'Save & Activate'}
                  </button>
                </div>
                {keyStatus && (
                  <p
                    className={`mt-1.5 text-[11px] font-medium ${
                      keyStatus.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {keyStatus.msg}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Subheader: 3.5 Live Translate Language Selector Bar */}
          <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>3.5 Live Translate:</span>
            </div>

            <select
              value={selectedLang}
              onChange={(e) => {
                setSelectedLang(e.target.value);
                const langLabels = { auto: 'Auto Translate', ta: 'Tamil தமிழ்', hi: 'Hindi हिन्दी', en: 'Indian English', en_us: 'US English' };
                speakText(`Language set to ${langLabels[e.target.value] || e.target.value}`, e.target.value);
              }}
              className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="auto">🌐 Auto-Detect & Translate</option>
              <option value="ta">🇮🇳 தமிழ் (Tamil / Tanglish)</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi / Hinglish)</option>
              <option value="en">🇮🇳 English (India)</option>
              <option value="en_us">🇺🇸 English (US)</option>
            </select>
          </div>

          {/* Audio Visualizer Wave (Active when speaking or listening) */}
          {(isListening || isSpeaking) && (
            <div className="bg-slate-900/95 text-white px-4 py-2.5 flex items-center justify-between border-b border-indigo-900/40">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                {isListening ? 'Gemini Live Listening...' : 'Gemini 3.8 Voice Audio:'}
              </span>
              <div className="flex items-center gap-1 h-5">
                {[6, 14, 22, 10, 18, 12, 16].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${h}px`,
                      animationDuration: `${0.35 + (i % 3) * 0.15}s`
                    }}
                    className={`w-1 rounded-full ${
                      isListening ? 'bg-rose-400 animate-pulse' : 'bg-cyan-400 animate-bounce'
                    }`}
                  ></span>
                ))}
              </div>
            </div>
          )}

          {/* Live speech interim transcript banner */}
          {isListening && transcript && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 px-4 py-2 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
              <span className="italic truncate font-medium">"{transcript}"</span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}
              >
                <div
                  className={`relative p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[88%] shadow-sm ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {/* Markdown-like styling */}
                  <div className="whitespace-pre-wrap font-sans">
                    {m.text.split('\n').map((line, idx) => {
                      if (line.startsWith('• ')) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 my-0.5">
                            <span className="text-indigo-500 dark:text-indigo-400">•</span>
                            <span>{line.substring(2)}</span>
                          </div>
                        );
                      }
                      return <p key={idx} className={idx > 0 ? 'mt-1' : ''}>{line}</p>;
                    })}
                  </div>

                  {/* Replay Spoken Audio Button */}
                  {m.role === 'assistant' && m.spoken && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400">
                      <button
                        onClick={() => speakText(m.spoken, m.language || 'en')}
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Replay Voice</span>
                      </button>
                      {m.source && (
                        <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                          ⚡ {m.source}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* If assistant returned product stock cards, show them */}
                {m.cards && m.cards.length > 0 && (
                  <div className="mt-2.5 space-y-2 w-full max-w-[94%]">
                    {m.cards.map((prod) => (
                      <div
                        key={prod.id || prod.sku}
                        className="bg-white dark:bg-slate-800/95 border border-indigo-200 dark:border-indigo-900/60 p-3 rounded-2xl shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              {prod.category}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {prod.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">SKU: {prod.sku}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                              {prod.availableQuantity ?? prod.available}{' '}
                              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                {prod.unit}
                              </span>
                            </div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                prod.isLowStock
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {prod.isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>
                              Bin: <strong className="text-slate-900 dark:text-white">{prod.locationCode}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Package className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>
                              Zone: <strong className="text-slate-900 dark:text-white">{prod.locationZone}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400 text-[10px]">
                            Physical: {prod.totalQuantity ?? prod.total} | Damaged: {prod.damagedQuantity ?? 0}
                          </span>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/products/${prod.id}`);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                          >
                            <span>Open Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none max-w-[75%] text-xs text-slate-600 dark:text-slate-300 animate-pulse">
                <Sparkles className="w-4 h-4 text-cyan-500 animate-spin" />
                <span>Gemini 3.8 Live reasoning with warehouse ledger...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Voice & Text Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              {/* Big Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'Click to stop listening' : 'Click to speak to Gemini 3.8 Live'}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md transition-all ${
                  isListening
                    ? 'bg-rose-500 ring-4 ring-rose-300 dark:ring-rose-800 animate-pulse'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendQuery(inputText);
                }}
                placeholder={
                  isListening
                    ? 'Listening... Speak in English, தமிழ், or हिन्दी!'
                    : 'Ask any question about warehouse, stock, orders, locations...'
                }
                disabled={isProcessing}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendQuery(inputText)}
                disabled={!inputText.trim() || isProcessing}
                className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
