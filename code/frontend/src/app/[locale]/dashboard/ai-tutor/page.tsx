"use client";
import { notify } from "@/lib/toast";

import { API_ENDPOINTS } from '@/constants/api';
import { useState, useRef, useEffect } from "react";
import { Search, Edit, Send, Mic, ChevronLeft, Bot, User, Flag, X, BookOpen, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { fetchApi, fetchApiStream } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";

interface Citation {
  documentId: string;
  fileName: string;
  page?: number | null;
  snippet?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt?: string;
}

interface ChatSessionItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

// Minimal types for SpeechRecognition
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

export default function AITutorPage() {
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [feedbackMsgId, setFeedbackMsgId] = useState<string | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState("AI_ERROR");
  const [feedbackContent, setFeedbackContent] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("User.AITutor");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadSessions = async () => {
    try {
      const data = await fetchApi<ChatSessionItem[]>("/chat/sessions");
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectSession = async (id: string) => {
    setSessionId(id);
    setShowHistory(false);
    setLoading(true);
    try {
      const data = await fetchApi<{ id: string; messages: any[] }>(`/chat/session/${id}`);
      if (data?.messages) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            citations: Array.isArray(m.citations) ? m.citations : undefined,
            createdAt: m.createdAt,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithSpeech = window as unknown as WindowWithSpeech;
      const SpeechRecognitionConstructor = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        recognitionRef.current = new SpeechRecognitionConstructor();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'vi-VN';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputText(prev => prev ? prev + ' ' + transcript : transcript);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Failed to start recording", e);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    const aiMsgId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: "",
    }]);

    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const session = await fetchApi<{ id: string; title: string; createdAt: string }>(API_ENDPOINTS.CHAT.SESSION, {
          method: 'POST',
          body: JSON.stringify({ 
            title: userMessage.content.substring(0, 50)
          }),
        });
        currentSessionId = session.id;
        setSessionId(session.id);
        setSessions(prev => [{ id: session.id, title: session.title, createdAt: session.createdAt }, ...prev]);
      }

      const response = await fetchApiStream(`/chat/session/${currentSessionId}/message-stream`, {
        method: 'POST',
        body: JSON.stringify({
          content: userMessage.content,
          role: 'user'
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No reader available");

      let done = false;
      let aiText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  aiText += data.content;
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === aiMsgId
                        ? { ...msg, content: aiText, citations: data.citations || msg.citations }
                        : msg
                    )
                  );
                } else if (data.citations) {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === aiMsgId ? { ...msg, citations: data.citations } : msg
                    )
                  );
                }
              } catch {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errMessage = error?.message || "Xin lỗi, đã xảy ra lỗi trong quá trình kết nối với AI. Vui lòng thử lại sau.";
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, content: errMessage } : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMsgId) return;
    try {
      await fetchApi('/chat/feedback', {
        method: 'POST',
        body: JSON.stringify({
          category: feedbackCategory,
          content: feedbackContent || "Báo cáo tin nhắn AI",
        }),
      });
      notify('Cảm ơn bạn đã phản hồi!');
    } catch (error) {
      console.error(error);
      notify('Có lỗi xảy ra khi gửi phản hồi.');
    } finally {
      setFeedbackMsgId(null);
      setFeedbackContent('');
    }
  };

  const filteredSessions = sessions.filter((s) =>
    !historySearch || s.title?.toLowerCase().includes(historySearch.toLowerCase()),
  );

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] md:h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-[#0f111a]">
      
      {/* Mobile Header for switching views */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-card-bg border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"
        >
          {showHistory ? <ChevronLeft className="w-4 h-4" /> : null}
          {showHistory ? t('backToChat') : t('chatHistory')}
        </button>
      </div>

      <div className="flex w-full h-full overflow-hidden">
        
        {/* --- LEFT COLUMN: HISTORY SIDEBAR --- */}
        <div className={`${showHistory ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-72 lg:w-80 flex-shrink-0 bg-white dark:bg-card-bg border-r border-gray-200 dark:border-gray-800 transition-all z-20`}>
          <div className="p-4 flex justify-between items-center">
            <button 
              onClick={() => {
                setSessionId(null);
                setMessages([]);
                setShowHistory(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Edit className="w-4 h-4" /> {t('newChat', { fallback: 'Cuộc trò chuyện mới' })}
            </button>
          </div>
          
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={t('searchHistory')} 
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800/50 border border-transparent focus:border-blue-500 rounded-lg text-sm outline-none transition-colors dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                Chưa có lịch sử trò chuyện
              </div>
            ) : (
              filteredSessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess.id)}
                  className={`p-3 rounded-lg cursor-pointer text-sm flex items-center gap-2.5 transition-colors truncate ${
                    sessionId === sess.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sess.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- MAIN CHAT AREA --- */}
        <div className={`${showHistory ? 'hidden' : 'flex'} md:flex flex-col flex-1 bg-white dark:bg-[#0f111a]`}>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
              
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full mt-16 sm:mt-24 text-center px-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-blue-600/20 text-white">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                    Gia sư AI (RAG Trường học)
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-lg text-sm sm:text-base leading-relaxed mb-8">
                    Đặt câu hỏi về bài giảng, đề cương và tài liệu của lớp bạn. Mọi câu trả lời từ tài liệu đều đi kèm trích dẫn nguồn minh bạch (BR-RAG-001).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                    {[
                      "Tóm tắt nội dung trọng tâm của tài liệu môn học mới nhất trong lớp",
                      "Giải thích chi tiết công thức và cho ví dụ minh họa dễ hiểu",
                      "Tạo 5 câu hỏi trắc nghiệm ôn tập nhanh theo bài học hôm nay",
                      "Hướng dẫn cách phân tích dạng bài tập thường gặp trong đề kiểm tra",
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(suggestion)}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 hover:bg-blue-50/60 dark:bg-slate-900/60 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800 transition-all text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                      >
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-[#1a1d2d] border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>

                            {/* Citations block (BR-RAG-001) */}
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-2 not-prose">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  <BookOpen className="w-3.5 h-3.5" /> Nguồn tài liệu tham khảo:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {msg.citations.map((cit, cIdx) => (
                                    <div
                                      key={cIdx}
                                      className="text-xs bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg px-2.5 py-1.5 text-blue-800 dark:text-blue-300"
                                      title={cit.snippet || ''}
                                    >
                                      <span className="font-semibold">{cit.fileName}</span>
                                      {cit.page ? <span className="ml-1 opacity-75">(Trang {cit.page})</span> : null}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-4 flex justify-end">
                              <button 
                                onClick={() => setFeedbackMsgId(msg.id)}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                                title="Báo cáo câu trả lời này"
                              >
                                <Flag className="w-3.5 h-3.5" /> Báo lỗi
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white dark:bg-[#1a1d2d] border border-gray-100 dark:border-gray-800 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Fixed Input Area at bottom of flex container */}
          <div className="w-full bg-white dark:bg-[#0f111a] border-t border-gray-100 dark:border-gray-800 pt-4 pb-4 px-4 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#1a1d2d] border border-gray-200 dark:border-gray-700 rounded-3xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <button 
                  onClick={toggleRecording}
                  className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                    isRecording 
                      ? 'bg-rose-100 text-rose-500 dark:bg-rose-900/30' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                </button>
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={isRecording ? 'Đang nghe...' : t('askQuestion', { fallback: 'Hỏi gia sư AI bất cứ điều gì...' })} 
                  className="w-full max-h-32 bg-transparent border-none focus:ring-0 resize-none py-3 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 overflow-y-auto"
                  style={{ minHeight: '48px' }}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || loading}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed m-1"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">{t('aiWarning', { fallback: 'AI có thể mắc sai lầm. Vui lòng kiểm tra lại thông tin quan trọng.' })}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card-bg rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Báo lỗi AI</h3>
              <button onClick={() => setFeedbackMsgId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại lỗi</label>
                <select 
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white focus:border-blue-500"
                >
                  <option value="AI_ERROR">AI trả lời không đúng nội dung</option>
                  <option value="CONTENT_ERROR">Sai kiến thức chuyên môn</option>
                  <option value="SYSTEM_BUG">Lỗi hệ thống hiển thị</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chi tiết (Tùy chọn)</label>
                <textarea 
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Mô tả lỗi gặp phải..."
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white focus:border-blue-500 resize-none h-24"
                />
              </div>
              <button 
                onClick={handleSubmitFeedback}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
