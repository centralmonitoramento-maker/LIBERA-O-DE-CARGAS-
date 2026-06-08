import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Mic, 
  Square, 
  Trash2, 
  Download, 
  FileText, 
  X, 
  File, 
  Volume2, 
  Play, 
  Pause, 
  Filter, 
  Check, 
  ArrowDown, 
  Users
} from 'lucide-react';
import { db, sanitizeFirestoreData } from '../firebase';
import { User } from '../types';

interface FeedbackMessage {
  id: string;
  text?: string;
  senderName: string;
  senderUsername: string;
  senderRole: 'expedition' | 'central' | 'audit' | 'analysis' | 'portaria';
  senderRoleLabel: string;
  timestamp: string;
  audio?: string; // base64 string
  audioDuration?: number; // duration in seconds
  attachment?: string; // base64 string
  attachmentName?: string;
  attachmentType?: string;
  areaTarget: 'all' | 'expedition' | 'central' | 'audit' | 'analysis' | 'portaria';
}

interface FeedbackChatProps {
  currentUser: User | null;
}

// Map roles to human-friendly Portuguese labels and unique colors
export const ROLE_DETAILS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  expedition: { 
    label: 'Expedição', 
    bg: 'bg-indigo-50 dark:bg-indigo-950/40', 
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-100 dark:border-indigo-900/40'
  },
  central: { 
    label: 'Central de Monitoramento', 
    bg: 'bg-amber-50 dark:bg-amber-950/40', 
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-100 dark:border-amber-900/40'
  },
  audit: { 
    label: 'Auditoria', 
    bg: 'bg-rose-50 dark:bg-rose-950/40', 
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-100 dark:border-rose-900/40'
  },
  analysis: { 
    label: 'Análise de Risco', 
    bg: 'bg-slate-100 dark:bg-slate-800', 
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700'
  },
  portaria: { 
    label: 'Portaria / Gate', 
    bg: 'bg-emerald-50 dark:bg-emerald-950/40', 
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-100 dark:border-emerald-900/40'
  }
};

const generateMessageId = (): string => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'msg-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
};

export const FeedbackChat: React.FC<FeedbackChatProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [filterTarget, setFilterTarget] = useState<'all' | 'my-area'>('all');
  const [areaTarget, setAreaTarget] = useState<FeedbackMessage['areaTarget']>('all');
  
  // Real-time unread counter
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string>(() => {
    return localStorage.getItem('cargoradar_chat_last_read') || new Date().toISOString();
  });

  // Attachments State
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentType, setAttachmentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Players Management
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // UI state layout refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Load real-time feedback messages
  useEffect(() => {
    const q = query(
      collection(db, 'feedbacks'),
      orderBy('timestamp', 'asc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: FeedbackMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push(doc.data() as FeedbackMessage);
      });
      setMessages(msgs);

      // Automatically compute unread count when chat is closed
      if (!isOpen) {
        const unread = msgs.filter(m => m.timestamp > lastReadTimestamp && m.senderUsername !== currentUser?.username);
        setUnreadCount(unread.length);
      }
    }, (error) => {
      console.error('Erro ao escutar mensagens de feedback:', error);
    });

    return () => unsubscribe();
  }, [isOpen, lastReadTimestamp, currentUser?.username]);

  // Handle Mark as Read when opening the chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      const now = new Date().toISOString();
      setLastReadTimestamp(now);
      localStorage.setItem('cargoradar_chat_last_read', now);
      
      // Fast scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  // Scroll to bottom whenever new messages pop up while open
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);

  // File Upload Conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 8 * 1024 * 1024) {
        alert('O arquivo selecionado excede o limite seguro de 8MB para envio.');
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment(reader.result as string);
        setAttachmentName(file.name);
        setAttachmentType(file.type);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Erro ao carregar anexo.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentName('');
    setAttachmentType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Recording audio
  const startRecording = async () => {
    if (playingAudioId) {
      stopAudio();
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Turn off stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar o seu microfone. Verifique as permissões do seu navegador.');
    }
  };

  const stopRecordingAndKeep = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    // Discard chunks and base64
    audioChunksRef.current = [];
    setAudioBase64(null);
    setRecordingDuration(0);
  };

  // Submit message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const trimText = inputText.trim();
    if (!trimText && !audioBase64 && !attachment) return;

    const senderRole = currentUser.role || 'expedition';
    const roleDetails = ROLE_DETAILS_MAP[senderRole] || { label: 'Colaborador' };

    const newMsg: FeedbackMessage = {
      id: generateMessageId(),
      text: trimText || undefined,
      senderName: currentUser.fullName || currentUser.username,
      senderUsername: currentUser.username,
      senderRole,
      senderRoleLabel: roleDetails.label,
      timestamp: new Date().toISOString(),
      areaTarget,
      ...(audioBase64 ? { audio: audioBase64, audioDuration: recordingDuration } : {}),
      ...(attachment ? { 
        attachment, 
        attachmentName: attachmentName || 'Anexo', 
        attachmentType: attachmentType || 'application/octet-stream' 
      } : {})
    };

    try {
      // Optimistic locally
      setMessages((prev) => [...prev, newMsg]);

      // Write to Firebase Firestore
      await setDoc(doc(db, 'feedbacks', newMsg.id), sanitizeFirestoreData(newMsg));
      
      // Reset inputs
      setInputText('');
      setAttachment(null);
      setAttachmentName('');
      setAttachmentType('');
      setAudioBase64(null);
      setRecordingDuration(0);
      setAreaTarget('all');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Smooth scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.error('Falha ao enviar mensagem de feedback:', err);
      alert('Erro de envio. Conexão oscilando ou instável.');
    }
  };

  // Custom audio player control
  const togglePlayAudio = (id: string, base64Audio: string) => {
    if (playingAudioId === id) {
      stopAudio();
    } else {
      playAudio(id, base64Audio);
    }
  };

  const playAudio = (id: string, base64Audio: string) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(base64Audio);
    activeAudioRef.current = audio;
    setPlayingAudioId(id);

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const prg = (audio.currentTime / audio.duration) * 100;
        setAudioProgress((prev) => ({ ...prev, [id]: prg }));
      }
    });

    audio.addEventListener('ended', () => {
      setPlayingAudioId(null);
      setAudioProgress((prev) => ({ ...prev, [id]: 0 }));
    });

    audio.play().catch((err) => {
      console.error('Falha ao reproduzir áudio:', err);
      setPlayingAudioId(null);
    });
  };

  const stopAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      setPlayingAudioId(null);
    }
  };

  const formatAudioTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered messages
  const filteredMessages = useMemo(() => {
    if (!currentUser) return [];
    if (filterTarget === 'all') return messages;

    // Filter directed/sent by my role or targeting all
    const userRole = currentUser.role;
    return messages.filter((m) => {
      const isFromMe = m.senderUsername === currentUser.username;
      const isToMe = m.areaTarget === 'all' || m.areaTarget === userRole;
      return isFromMe || isToMe;
    });
  }, [messages, filterTarget, currentUser]);

  if (!currentUser) return null;

  return (
    <>
      {/* Persistent Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-full bg-primary-navy text-white flex items-center justify-center shadow-2xl border-2 border-primary-gold hover:scale-105 hover:bg-slate-900 active:scale-95 transition-all cursor-pointer group`}
          title="Central de Feedback Integrado"
        >
          <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-mono font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center animate-bounce shadow-lg border border-white">
              {unreadCount}
            </span>
          )}

          {/* Micro active feedback pulse */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border border-white flex items-center justify-center">
            <span className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75"></span>
          </span>
        </button>
      </div>

      {/* Floating Chat Panel Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 md:right-8 w-[92vw] sm:w-[450px] h-[75vh] max-h-[640px] bg-white rounded-3xl border border-slate-200/80 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          
          {/* Header Banner */}
          <div className="bg-primary-navy p-4 text-white flex items-center justify-between border-b border-primary-navy/40 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-inner border border-primary-gold animate-pulse">
                <MessageSquare className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-primary-gold">Feedbacks Interativos</h3>
                <p className="text-[10px] font-bold text-slate-300">Comunicação e Alertas de Gate</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 text-slate-600">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Filtros:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setFilterTarget('all')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-all cursor-pointer ${
                  filterTarget === 'all' 
                    ? 'bg-primary-navy text-white shadow-xs' 
                    : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Todos ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTarget('my-area')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-all cursor-pointer ${
                  filterTarget === 'my-area' 
                    ? 'bg-primary-navy text-white shadow-xs' 
                    : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Minha Área
              </button>
            </div>
          </div>

          {/* Chat Messages List Panel */}
          <div 
            ref={listContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 relative"
          >
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 text-slate-300 stroke-1 animate-bounce" />
                <p className="text-xs font-black uppercase tracking-wider">Histórico limpo</p>
                <p className="text-[10px] font-medium max-w-xs text-slate-400/90 leading-relaxed">
                  Inicie a comunicação! Selecione a área de destino, fale em tempo real ou anexe um documento de evidência.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderUsername === currentUser.username;
                const roleMeta = ROLE_DETAILS_MAP[msg.senderRole] || { label: 'Colaborador', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    {/* User and Role headers */}
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap shrink-0">
                      <span className="text-[10px] font-black text-slate-700">{msg.senderName}</span>
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[8px] font-black uppercase border ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border} leading-none`}>
                        {roleMeta.label}
                      </span>
                      {msg.areaTarget !== 'all' && (
                        <span className="inline-flex rounded bg-rose-50 border border-rose-100 text-[8px] font-black uppercase text-rose-700 px-1 py-0.5 leading-none">
                          ➜ {ROLE_DETAILS_MAP[msg.areaTarget]?.label || msg.areaTarget}
                        </span>
                      )}
                    </div>

                    {/* Chat Bubble Body Box */}
                    <div className={`p-3 rounded-2xl border shadow-xs relative leading-snug break-words w-full ${
                      isMe 
                        ? 'bg-slate-900 border-slate-900 text-slate-100 rounded-tr-none' 
                        : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      {/* Attached File Preview inside bubble */}
                      {msg.attachment && (
                        <div className={`mb-2 p-2 rounded-xl border flex items-center justify-between gap-3 text-left ${
                          isMe 
                            ? 'bg-slate-800 border-slate-700 text-slate-200' 
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {msg.attachmentType?.startsWith('image/') ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                                <img src={msg.attachment} alt="Anexo" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200">
                                <FileText className="w-5 h-5 text-red-600" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[10px] font-black truncate">{msg.attachmentName}</p>
                              <p className="text-[8px] tracking-wider uppercase font-bold text-slate-400">Anexo Enviado</p>
                            </div>
                          </div>
                          
                          <a 
                            href={msg.attachment} 
                            download={msg.attachmentName}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isMe 
                                ? 'bg-slate-750 border-slate-700 text-slate-200 hover:bg-slate-700' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Baixar anexo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Transmitted Audio message block */}
                      {msg.audio && (
                        <div className={`mb-2 py-2 px-3 rounded-xl border flex items-center gap-3 ${
                          isMe 
                            ? 'bg-slate-850 border-slate-700/60' 
                            : 'bg-slate-50 border-slate-150'
                        }`}>
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(msg.id, msg.audio!)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                              isMe 
                                ? 'bg-primary-gold text-slate-900 border border-primary-gold hover:opacity-90' 
                                : 'bg-primary-navy text-white border border-primary-navy hover:opacity-95'
                            }`}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            {/* Audio Wave Bar representing customized track progress */}
                            <div className="h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden relative">
                              <div 
                                style={{ width: `${audioProgress[msg.id] || 0}%` }}
                                className={`h-full absolute left-0 top-0 transition-all duration-100 ${
                                  isMe ? 'bg-primary-gold' : 'bg-primary-navy'
                                }`}
                              />
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-0.5">
                                <Volume2 className="w-2.5 h-2.5" /> Mensagem de Áudio
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-500">
                                {msg.audioDuration ? formatAudioTime(msg.audioDuration) : 'Áudio'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Main Message Text */}
                      {msg.text && (
                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>

                    {/* Footer sending indicator timestamp */}
                    <span className="text-[8px] font-mono font-medium text-slate-400/90 mt-1 uppercase tracking-tight">
                      {timeStr}
                    </span>
                  </div>
                );
              })
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Pending Draft Attachments/Audio preview panel */}
          {(attachment || audioBase64) && (
            <div className="p-3 bg-slate-100 border-t border-slate-200 max-h-36 overflow-y-auto space-y-2 animate-in fade-in duration-200">
              {attachment && (
                <div className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold truncate text-[11px] text-slate-700">{attachmentName}</p>
                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Pronto para Enviar</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={removeAttachment}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {audioBase64 && (
                <div className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Volume2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] text-slate-700">Áudio Gravado ({recordingDuration}s)</p>
                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Pronto para Enviar</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => playAudio('draft', audioBase64)}
                      className="p-1 text-slate-500 hover:text-slate-800 transition"
                      title="Ouvir rascunho"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setAudioBase64(null);
                        setRecordingDuration(0);
                      }}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Form Controls Section */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 relative bg-linear-to-b from-white to-slate-50"
          >
            {/* Targeted Area Selector Row */}
            <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-100 pb-2">
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                Direcionar feedback a:
              </span>
              <select
                value={areaTarget}
                onChange={(e) => setAreaTarget(e.target.value as FeedbackMessage['areaTarget'])}
                className="text-[10px] font-black text-slate-700 bg-slate-100 hover:bg-slate-150 border border-slate-200 rounded-lg px-2 py-0.5 uppercase tracking-wide focus:outline-hidden transition-all"
              >
                <option value="all">TODAS AS ÁREAS</option>
                <option value="expedition">➜ EXPEDIÇÃO</option>
                <option value="central">➜ CENTRAL</option>
                <option value="audit">➜ AUDITORIA</option>
                <option value="analysis">➜ ANÁLISE</option>
                <option value="portaria">➜ PORTARIA</option>
              </select>
            </div>

            {/* Input field and actions row */}
            <div className="flex items-center gap-2 relative">
              {/* Attachment Triggers */}
              <div className="flex items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-slate-450 hover:text-primary-navy hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Anexar arquivo / foto"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Voice Audio Recording trigger */}
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecordingAndKeep}
                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-250 animate-pulse transition cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Parar gravação e salvar"
                  >
                    <Square className="w-4 h-4 fill-current text-red-600" />
                    <span className="text-[10px] font-black font-mono">{formatAudioTime(recordingDuration)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-slate-450 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                    title="Gravar mensagem de voz"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                {/* Discrad active recording */}
                {isRecording && (
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl ml-1 transition cursor-pointer"
                    title="Descartar gravação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Message Input Box */}
              <input
                type="text"
                placeholder={isRecording ? 'Gravando áudio...' : 'Mensagem ou feedback...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isRecording}
                className="flex-1 px-3.5 py-2 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-primary-gold focus:ring-2 focus:ring-primary-gold/15 transition-all text-slate-800 placeholder:text-slate-450 placeholder:font-bold"
              />

              {/* Trigger Submit Message Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !audioBase64 && !attachment) || isRecording}
                className={`p-2.5 rounded-xl border border-primary-navy shadow-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                  (inputText.trim() || audioBase64 || attachment) && !isRecording
                    ? 'bg-primary-navy text-white hover:scale-105 hover:bg-slate-900 active:scale-95'
                    : 'bg-slate-150 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
