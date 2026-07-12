'use client';

import { useState, useEffect } from 'react';
import { parentService } from '@/services/parent.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Teacher, Message, Proposal } from '@/types';

export default function ParentContactPage() {
  const t = useTranslations("ParentUI.Contact");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Proposal state
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [sendingProposal, setSendingProposal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tData = await parentService.getTeachers();
        setTeachers(tData.teachers);
        if (tData.teachers.length > 0) {
          setSelectedTeacherId(tData.teachers[0].id);
        }

        const pData = await parentService.getProposals();
        setProposals(pData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTeacherId) {
      loadMessages(selectedTeacherId);
      // Optional: Set up an interval for polling here
      const interval = setInterval(() => loadMessages(selectedTeacherId), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTeacherId]);

  async function loadMessages(teacherId: string) {
    try {
      const msgs = await parentService.getMessages(teacherId);
      setMessages(msgs);
    } catch {
      console.error('Failed to load messages');
    }
  };

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeacherId || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await parentService.sendMessage(selectedTeacherId, newMessage);
      setNewMessage('');
      await loadMessages(selectedTeacherId);
    } catch {
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  async function handleSendProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeacherId || !proposalTitle.trim() || !proposalContent.trim()) return;

    setSendingProposal(true);
    try {
      await parentService.createProposal(selectedTeacherId, proposalTitle, proposalContent);
      setProposalTitle('');
      setProposalContent('');
      alert('Gửi đề xuất thành công!');
      
      const pData = await parentService.getProposals();
      setProposals(pData);
    } catch {
      alert('Failed to send proposal');
    } finally {
      setSendingProposal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar: Teacher List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t("teacherTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {teachers.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">{t("noTeacher")}</div>
            ) : (
              <div className="flex flex-col">
                {teachers.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => setSelectedTeacherId(teacher.id)}
                    className={`flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 transition-colors ${
                      selectedTeacherId === teacher.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {teacher.avatarUrl ? (
                        <Image src={teacher.avatarUrl} alt="Avatar" fill className="object-cover" sizes="40px" />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{teacher.fullName}</p>
                      <p className="text-xs text-gray-500 truncate w-32">{teacher.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="md:col-span-3">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {t("tabMessage")}
              </TabsTrigger>
              <TabsTrigger value="proposals" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {t("tabFeedback")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-4 h-[600px] flex flex-col">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b dark:border-gray-800 shrink-0">
                  <CardTitle>{t("chatTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50 dark:bg-slate-900">
                  {messages.length === 0 ? (
                    <div className="m-auto text-gray-400">{t("noMessages")}</div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.senderId !== selectedTeacherId;
                      return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <span className={`text-[10px] mt-1 block ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                              {format(new Date(msg.createdAt), 'HH:mm - dd/MM')}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
                <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-card-bg shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input 
                      placeholder={t("inputPlaceholder")} 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      disabled={!selectedTeacherId || sendingMessage}
                      className="flex-1 rounded-full px-4"
                    />
                    <Button type="submit" disabled={!selectedTeacherId || sendingMessage || !newMessage.trim()} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 p-0 flex items-center justify-center">
                      {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="proposals" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Gửi Đề xuất mới</CardTitle>
                    <CardDescription>Gửi yêu cầu chính thức tới giáo viên</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendProposal} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề</label>
                        <Input 
                          placeholder="Ví dụ: Xin nghỉ ốm ngày 20/11..." 
                          value={proposalTitle}
                          onChange={e => setProposalTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nội dung chi tiết</label>
                        <Textarea 
                          placeholder="Nhập nội dung yêu cầu, lý do cụ thể..." 
                          value={proposalContent}
                          onChange={e => setProposalContent(e.target.value)}
                          required
                          rows={6}
                        />
                      </div>
                      <Button type="submit" disabled={!selectedTeacherId || sendingProposal} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        {sendingProposal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Gửi Yêu cầu
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lịch sử Đề xuất</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px] overflow-y-auto">
                    <div className="space-y-4">
                      {proposals.length === 0 ? (
                        <div className="text-gray-500 text-sm">Chưa có đề xuất nào.</div>
                      ) : (
                        proposals.map(p => (
                          <div key={p.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{p.title}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                p.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                p.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {p.status === 'APPROVED' ? 'Đã duyệt' : p.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{p.content}</p>
                            <p className="text-xs text-gray-400 mt-3 flex items-center justify-between">
                              <span>Gửi tới: {p.teacher?.fullName}</span>
                              <span>{format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
