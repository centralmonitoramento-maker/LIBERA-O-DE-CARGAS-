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
  Users,
  Star,
  Search,
  ArrowLeft
} from 'lucide-react';
import { db, sanitizeFirestoreData, handleFirestoreError, OperationType } from '../firebase';
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
  isDirect?: boolean;
  userTarget?: string;
  userTargetName?: string;
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
  const [messages, setMessages] = useState<FeedbackMessage[]>(() => {
    try {
      const persisted = localStorage.getItem('cargoradar_feedback_messages');
      return persisted ? JSON.parse(persisted) : [];
    } catch {
      return [];
    }
  });
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

  // Contacts, Favorites and Target chat states
  const [currentTab, setCurrentTab] = useState<'messages' | 'contacts'>('messages');
  const [activeChat, setActiveChat] = useState<{ type: 'group' } | { type: 'direct'; user: User }>({ type: 'group' });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`cargoradar_favs_${currentUser?.username || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load real-time active users list for contact book
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as User;
        // Save only active users, and do not list current user
        if (data.status === 'active' && data.username !== currentUser.username) {
          list.push(data);
        }
      });
      setAllUsers(list);
    }, (error) => {
      console.warn('Erro ao escutar usuários para lista de contatos (usando cache local):', error);
      try {
        const cached = localStorage.getItem('cargoradar_users');
        if (cached) {
          const parsed = JSON.parse(cached) as User[];
          const list = parsed.filter(u => u.status === 'active' && u.username !== currentUser.username);
          setAllUsers(list);
        }
      } catch (cacheErr) {
        console.error('Erro ao responder com cache local de contatos:', cacheErr);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

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

      // Cache feedbacks locally
      try {
        localStorage.setItem('cargoradar_feedback_messages', JSON.stringify(msgs));
      } catch (err) {
        console.warn('Erro ao salvar feedbacks localmente:', err);
      }

      // Automatically compute unread count when chat is closed
      if (!isOpen && currentUser) {
        const userRole = currentUser.role;
        const unread = msgs.filter((m) => {
          if (m.timestamp <= lastReadTimestamp) return false;
          if (m.senderUsername === currentUser.username) return false;

          if (m.isDirect) {
            return m.userTarget === currentUser.username;
          } else {
            const isPublic = m.areaTarget === 'all';
            const isToMyRole = m.areaTarget === userRole;
            const isFromMyRole = m.senderRole === userRole;
            const isFromMe = m.senderUsername === currentUser.username;
            return isPublic || isToMyRole || isFromMyRole || isFromMe;
          }
        });
        setUnreadCount(unread.length);
      }
    }, (error) => {
      console.warn('Erro ao escutar mensagens de feedback (usando cache local):', error);
      
      try {
        const cached = localStorage.getItem('cargoradar_feedback_messages');
        if (cached) {
          const msgs = JSON.parse(cached) as FeedbackMessage[];
          setMessages(msgs);
        }
      } catch (cacheErr) {
        console.error('Erro ao ler cache de feedbacks:', cacheErr);
      }

      const errMsg = error instanceof Error ? error.message : String(error);
      const isQuotaOrLimit = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('limit');
      if (!isQuotaOrLimit) {
        handleFirestoreError(error, OperationType.LIST, 'feedbacks');
      }
    });

    return () => unsubscribe();
  }, [isOpen, lastReadTimestamp, currentUser]);

  // Toggle favorite usernames in local storage
  const toggleFavorite = (username: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(username);
      const updated = isFav ? prev.filter((u) => u !== username) : [...prev, username];
      localStorage.setItem(`cargoradar_favs_${currentUser?.username || 'default'}`, JSON.stringify(updated));
      return updated;
    });
  };

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
  }, [messages.length, isOpen, activeChat]);

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

    // Dynamic messaging schema structure targeting either a role area or a specific contact
    const newMsg: FeedbackMessage = {
      id: generateMessageId(),
      text: trimText || undefined,
      senderName: currentUser.fullName || currentUser.username,
      senderUsername: currentUser.username,
      senderRole,
      senderRoleLabel: roleDetails.label,
      timestamp: new Date().toISOString(),
      areaTarget: activeChat.type === 'direct' ? activeChat.user.role : areaTarget,
      ...(activeChat.type === 'direct' ? {
        isDirect: true,
        userTarget: activeChat.user.username,
        userTargetName: activeChat.user.fullName || activeChat.user.username
      } : {}),
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Smooth scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.error('Falha ao enviar mensagem de feedback:', err);
      handleFirestoreError(err, OperationType.CREATE, 'feedbacks');
      
      // Como o handleFirestoreError não lança erro em caso de cota excedida, podemos resetar os inputs aqui e seguir felizes localmente/offline
      setInputText('');
      setAttachment(null);
      setAttachmentName('');
      setAttachmentType('');
      setAudioBase64(null);
      setRecordingDuration(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
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

    if (activeChat.type === 'group') {
      // Group channels matching filters
      const groupMsgs = messages.filter((m) => {
        if (m.isDirect) return false;

        const isPublic = m.areaTarget === 'all';
        const isToMyRole = m.areaTarget === currentUser.role;
        const isFromMyRole = m.senderRole === currentUser.role;
        const isFromMe = m.senderUsername === currentUser.username;

        // Message visibility isolation: only public operational channels, or targeted to/from current role/user are received/displayed
        return isPublic || isToMyRole || isFromMyRole || isFromMe;
      });

      if (filterTarget === 'all') {
        return groupMsgs;
      } else {
        // Enforce localized category filter (Minha Área)
        return groupMsgs.filter((m) => m.areaTarget === currentUser.role || m.senderRole === currentUser.role);
      }
    } else {
      // Direct messaging 1-to-1 secure private conversation history
      const targetUser = activeChat.user;
      return messages.filter((m) => {
        if (!m.isDirect) return false;

        const isFromMeToTarget = m.senderUsername === currentUser.username && m.userTarget === targetUser.username;
        const isFromTargetToMe = m.senderUsername === targetUser.username && m.userTarget === currentUser.username;

        return isFromMeToTarget || isFromTargetToMe;
      });
    }
  }, [messages, activeChat, filterTarget, currentUser]);

  if (!currentUser) return null;

  return (
    <>
      {/* Persistent Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="chat-floating-trigger"
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
        <div id="chat-panel-container" className="fixed bottom-24 right-4 sm:right-6 md:right-8 w-[92vw] sm:w-[450px] h-[75vh] max-h-[640px] bg-white rounded-3xl border border-slate-200/80 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          
          {/* Header Banner */}
          <div className="bg-primary-navy p-4 text-white flex items-center justify-between border-b border-primary-navy/40 relative">
            {activeChat.type === 'direct' ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveChat({ type: 'group' })}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Voltar para Canais"
                >
                  <ArrowLeft className="w-5 h-5 animate-pulse" />
                </button>
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-900 border border-primary-gold relative">
                  {(activeChat.user.fullName || activeChat.user.username).substring(0, 2).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-primary-gold">
                    {activeChat.user.fullName || activeChat.user.username}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold text-slate-300 uppercase">
                      {ROLE_DETAILS_MAP[activeChat.user.role]?.label || activeChat.user.role}
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                    <span className="text-[8px] font-black text-primary-gold uppercase tracking-widest bg-slate-900/40 px-1 py-0.2 rounded border border-primary-gold">Conversa Direta</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-inner border border-primary-gold animate-pulse">
                  <MessageSquare className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-primary-gold">Feedbacks Interativos</h3>
                  <p className="text-[10px] font-bold text-slate-300">Comunicação e Alertas de Gate</p>
                </div>
              </div>
            )}

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

          {/* Tab Switcher - Only shown in Group channel mode */}
          {activeChat.type === 'group' && (
            <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 text-slate-600">
              <button
                type="button"
                onClick={() => setCurrentTab('messages')}
                className={`py-2.5 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all border-b-2 cursor-pointer ${
                  currentTab === 'messages'
                    ? 'border-primary-navy text-primary-navy bg-white font-black'
                    : 'border-transparent hover:bg-slate-50 text-slate-500'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Mensagens
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('contacts')}
                className={`py-2.5 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all border-b-2 cursor-pointer ${
                  currentTab === 'contacts'
                    ? 'border-primary-navy text-primary-navy bg-white font-black'
                    : 'border-transparent hover:bg-slate-50 text-slate-500'
                }`}
              >
                <Users className="w-4 h-4" />
                Contatos ({allUsers.length})
              </button>
            </div>
          )}

          {/* Tab Content 1: Chat Stream and History */}
          {(activeChat.type === 'direct' || currentTab === 'messages') ? (
            <>
              {/* Filter Bar (Only in group mode) */}
              {activeChat.type === 'group' && (
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
                      Todos
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
              )}

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
                      {activeChat.type === 'direct' 
                        ? `Não há mensagens privadas entre você e ${activeChat.user.fullName || activeChat.user.username}. Envie um texto ou áudio privado!`
                        : 'Inicie a comunicação operacional! Selecione a área de destino, fale em tempo real ou envie um anexo.'
                      }
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
                          {!msg.isDirect ? (
                            msg.areaTarget !== 'all' && (
                              <span className="inline-flex rounded bg-rose-50 border border-rose-100 text-[8px] font-black uppercase text-rose-700 px-1 py-0.5 leading-none shadow-2xs">
                                ➜ {ROLE_DETAILS_MAP[msg.areaTarget]?.label || msg.areaTarget}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex rounded bg-amber-50 border border-amber-200 text-[8px] font-black uppercase text-amber-700 px-1 py-0.5 leading-none shadow-2xs">
                              ⚙ DM Privada
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
                                    <img src={msg.attachment} alt="Anexo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                          className="p-1 text-slate-500 hover:text-slate-800 transition shadow-xs"
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
                {/* Dynamic Target Indicator / Selector Row */}
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-100 pb-2">
                  {activeChat.type === 'direct' ? (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      Conversando em canal privado criptografado com @{activeChat.user.username}
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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
                        className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-250 animate-pulse transition cursor-pointer flex items-center justify-center gap-1 shrink-0 bg-rose-50"
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

                    {/* Discard active recording */}
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
                    placeholder={
                      isRecording 
                        ? 'Gravando áudio...' 
                        : (activeChat.type === 'direct' 
                            ? `Mensagem privada para ${activeChat.user.fullName || activeChat.user.username}...` 
                            : 'Mensagem ou feedback operacional...'
                          )
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isRecording}
                    className="flex-1 px-3.5 py-2 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-primary-gold focus:ring-2 focus:ring-primary-gold/15 transition-all text-slate-800 placeholder:text-slate-450 placeholder:font-bold shadow-2xs"
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
            </>
          ) : (
            /* Tab Content 2: Contacts Book view */
            <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
              {/* Search Box */}
              <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar contatos por nome ou área..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-1.5 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-primary-gold focus:ring-2 focus:ring-primary-gold/15 transition-all text-slate-800 placeholder:text-slate-400 placeholder:font-bold"
                  />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 px-2.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 font-bold transition-all"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Contacts book list panel wrapper */}
              <div className="flex-1 p-3 space-y-4">
                {(() => {
                  const queryNormalized = searchQuery.toLowerCase().trim();
                  
                  // Filter contacts dynamically
                  const filtered = allUsers.filter((u) => {
                    const fullNameLower = (u.fullName || '').toLowerCase();
                    const usernameLower = (u.username || '').toLowerCase();
                    const roleLabel = ROLE_DETAILS_MAP[u.role]?.label || u.role;
                    return (
                      fullNameLower.includes(queryNormalized) ||
                      usernameLower.includes(queryNormalized) ||
                      roleLabel.toLowerCase().includes(queryNormalized)
                    );
                  });

                  const favUsers = filtered.filter((u) => favorites.includes(u.username));
                  const normalUsers = filtered.filter((u) => !favorites.includes(u.username));

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                        <Users className="w-10 h-10 text-slate-300 stroke-1" />
                        <p className="text-xs font-black uppercase tracking-wider">Nenhum membro ativo encontrado</p>
                        <p className="text-[10px] text-slate-400/90 leading-relaxed max-w-xs">
                          Tente digitar o nome completo ou use palavras-chave dos cargos (ex: portaria, auditoria).
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 overflow-x-hidden">
                      {/* Favorites subsection header */}
                      {favUsers.length > 0 && (
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <h4 className="text-[9px] font-black tracking-widest text-[#B58A3D] uppercase bg-slate-900 px-3 py-1 rounded-md inline-flex items-center gap-1 shadow-sm">
                            ★ Meus Favoritos ({favUsers.length})
                          </h4>
                          <div className="space-y-1 bg-amber-500/[0.04] border border-amber-300/30 rounded-2xl p-1.5 shadow-xs">
                            {favUsers.map((u) => {
                              const roleMeta = ROLE_DETAILS_MAP[u.role] || { label: u.role, bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
                              return (
                                <div
                                  key={u.id}
                                  className="flex items-center justify-between p-2.5 hover:bg-white rounded-xl transition-all gap-2 shadow-xs border border-transparent hover:border-amber-300/20"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                                      {(u.fullName || u.username).substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[11px] font-black text-slate-800 truncate leading-none">
                                          {u.fullName || u.username}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-400">
                                          @{u.username}
                                        </span>
                                      </div>
                                      <span className={`inline-block border text-[8px] font-black uppercase rounded mt-1.5 px-1 py-0.2 leading-none shrink-0 ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border}`}>
                                        {roleMeta.label}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Unfavorite Button */}
                                    <button
                                      type="button"
                                      onClick={() => toggleFavorite(u.username)}
                                      className="p-1 px-1.5 hover:bg-yellow-100 rounded-lg text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer"
                                      title="Remover dos Favoritos"
                                    >
                                      <Star className="w-4 h-4 fill-current text-primary-gold" />
                                    </button>

                                    {/* Direct Conversation Initiation Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveChat({ type: 'direct', user: u });
                                        setCurrentTab('messages');
                                      }}
                                      className="p-1.5 bg-primary-navy text-white hover:bg-slate-900 rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase flex items-center gap-1 px-3 cursor-pointer"
                                    >
                                      Conversar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* General Contacts subsection header */}
                      <div className="space-y-2">
                        {favUsers.length > 0 && normalUsers.length > 0 && (
                          <h4 className="text-[9px] font-black tracking-widest text-slate-400 uppercase pl-1">
                            Todos os Contatos ({normalUsers.length})
                          </h4>
                        )}
                        <div className="space-y-1 bg-white border border-slate-200/60 rounded-2xl p-1.5">
                          {normalUsers.map((u) => {
                            const roleMeta = ROLE_DETAILS_MAP[u.role] || { label: u.role, bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
                            return (
                              <div
                                key={u.id}
                                className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                                    {(u.fullName || u.username).substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[11px] font-black text-slate-800 truncate leading-none">
                                        {u.fullName || u.username}
                                      </span>
                                      <span className="text-[8px] font-bold text-slate-400">
                                        @{u.username}
                                      </span>
                                    </div>
                                    <span className={`inline-block border text-[8px] font-black uppercase rounded mt-1.5 px-1 py-0.2 leading-none shrink-0 ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border}`}>
                                      {roleMeta.label}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Favorite Button toggler */}
                                  <button
                                    type="button"
                                    onClick={() => toggleFavorite(u.username)}
                                    className="p-1 px-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#B58A3D] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                    title="Adicionar aos Favoritos"
                                  >
                                    <Star className="w-4 h-4 text-slate-300" />
                                  </button>

                                  {/* Direct Conversation Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveChat({ type: 'direct', user: u });
                                      setCurrentTab('messages');
                                    }}
                                    className="p-1.5 bg-slate-100 text-slate-700 hover:bg-primary-navy hover:text-white rounded-lg hover:scale-105 active:scale-95 transition-all text-[9.5px] font-black uppercase border border-slate-250 hover:border-primary-navy flex items-center gap-1 px-3 cursor-pointer"
                                  >
                                    Conversar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
