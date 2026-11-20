'use client';

import { notify } from '@/lib/toast';
import { useState, useEffect, useMemo } from 'react';
import { parentService, ParentDashboardData } from '@/services/parent.service';
import { formatClassLabel } from '@/services/users.service';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  Search,
  Star,
  GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Teacher, Message, Proposal } from '@/types';

export default function ParentContactPage() {
  const t = useTranslations('ParentUI.Contact');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<
    ParentDashboardData['students']
  >([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null,
  );
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Proposal state
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalStudentId, setProposalStudentId] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [sendingProposal, setSendingProposal] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      parentService.getTeachers(),
      parentService.getProposals(),
      parentService.getDashboard(),
    ])
      .then(([tData, pData, dashData]) => {
        if (!active) return;
        const teacherList = tData?.teachers || [];
        const studentList = dashData?.students || [];
        setTeachers(teacherList);
        setProposals(Array.isArray(pData) ? pData : []);
        setLinkedStudents(studentList);
        if (teacherList.length > 0) {
          setSelectedTeacherId(teacherList[0].id);
        }
        if (studentList.length > 0) {
          setProposalStudentId(studentList[0].student.id);
        }
      })
      .catch((error) => {
        console.error('Error fetching parent contact data:', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Note: activeTeacherId message loading is handled below filteredTeachers

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();

    const mapped = teachers
      .map((teacher) => {
        const roles = teacher.studentRoles || [];
        const matchedRole =
          studentFilter === 'ALL'
            ? null
            : roles.find((r) => r.studentId === studentFilter) || null;

        // If filtering for a specific child and this teacher does not teach that child, exclude
        if (studentFilter !== 'ALL' && !matchedRole) {
          return null;
        }

        const isHomeroomInScope =
          studentFilter === 'ALL'
            ? Boolean(teacher.isHomeroom)
            : Boolean(matchedRole?.isHomeroom);

        const homeroomBadgeLabel =
          studentFilter === 'ALL'
            ? teacher.homeroomClassNames &&
              teacher.homeroomClassNames.length > 0
              ? `GVCN ${teacher.homeroomClassNames.join(', ')}`
              : 'GVCN'
            : matchedRole?.homeroomClassName
              ? `GVCN ${matchedRole.homeroomClassName}`
              : 'GVCN';

        const displayRoleSummary =
          studentFilter === 'ALL'
            ? teacher.roleSummary || ''
            : matchedRole?.summary || '';

        return {
          ...teacher,
          isHomeroomInScope,
          homeroomBadgeLabel,
          displayRoleSummary,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((teacher) => {
        if (!q) return true;
        return (
          teacher.fullName.toLowerCase().includes(q) ||
          teacher.displayRoleSummary.toLowerCase().includes(q) ||
          (teacher.email || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isHomeroomInScope !== b.isHomeroomInScope) {
          return a.isHomeroomInScope ? -1 : 1;
        }
        return a.fullName.localeCompare(b.fullName, 'vi');
      });

    return mapped;
  }, [teachers, teacherSearch, studentFilter]);

  const effectiveSelectedTeacher = useMemo(() => {
    const inFiltered = filteredTeachers.find(
      (item) => item.id === selectedTeacherId,
    );
    return inFiltered || filteredTeachers[0] || null;
  }, [filteredTeachers, selectedTeacherId]);

  const activeTeacherId = effectiveSelectedTeacher?.id || null;

  useEffect(() => {
    if (!activeTeacherId) return;
    let active = true;
    const fetchMsgs = () => {
      parentService
        .getMessages(activeTeacherId)
        .then((msgs) => {
          if (active && Array.isArray(msgs)) {
            setMessages(msgs);
          }
        })
        .catch(() => {
          console.error('Failed to load messages');
        });
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeTeacherId]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTeacherId || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await parentService.sendMessage(activeTeacherId, newMessage.trim());
      setNewMessage('');
      const msgs = await parentService.getMessages(activeTeacherId);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch {
      notify('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleSendProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTeacherId || !proposalTitle.trim() || !proposalContent.trim()) {
      return;
    }

    setSendingProposal(true);
    try {
      await parentService.createProposal(
        activeTeacherId,
        proposalTitle.trim(),
        proposalContent.trim(),
        proposalStudentId || undefined,
      );
      setProposalTitle('');
      setProposalContent('');
      notify('Gửi đề xuất thành công! Giáo viên sẽ nhận thông báo ngay.');

      const pData = await parentService.getProposals();
      setProposals(Array.isArray(pData) ? pData : []);
    } catch {
      notify('Không thể gửi đề xuất. Vui lòng thử lại.');
    } finally {
      setSendingProposal(false);
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar: Teacher List */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">{t('teacherTitle')}</CardTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {filteredTeachers.length}
              </span>
            </div>

            {linkedStudents.length > 1 && (
              <select
                value={studentFilter}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setStudentFilter(nextVal);
                  if (nextVal !== 'ALL') {
                    setProposalStudentId(nextVal);
                  }
                }}
                aria-label="Lọc giáo viên theo con"
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">
                  Tất cả các con ({linkedStudents.length})
                </option>
                {linkedStudents.map(({ student }) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} (
                    {formatClassLabel(student.className, student.grade)})
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Tìm tên GV, môn..."
                className="h-9 pl-8 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 max-h-[540px] overflow-y-auto">
            {filteredTeachers.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">
                {teachers.length === 0
                  ? t('noTeacher')
                  : 'Không tìm thấy giáo viên phù hợp.'}
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredTeachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => setSelectedTeacherId(teacher.id)}
                    className={`flex items-start gap-3 p-3.5 border-b border-gray-100 dark:border-gray-800 transition-colors text-left ${
                      activeTeacherId === teacher.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {teacher.avatarUrl ? (
                        <Image
                          src={teacher.avatarUrl}
                          alt={teacher.fullName}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {teacher.fullName}
                        </p>
                        {teacher.isHomeroomInScope && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shrink-0">
                            <Star className="w-2.5 h-2.5" />{' '}
                            {teacher.homeroomBadgeLabel}
                          </span>
                        )}
                      </div>
                      {teacher.displayRoleSummary ? (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium line-clamp-2 leading-snug">
                          {teacher.displayRoleSummary}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 truncate">
                          {teacher.email}
                        </p>
                      )}
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
                {t('tabMessage')}
              </TabsTrigger>
              <TabsTrigger value="proposals" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {t('tabFeedback')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4 h-[600px] flex flex-col">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b dark:border-gray-800 shrink-0 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <span>
                          {effectiveSelectedTeacher
                            ? effectiveSelectedTeacher.fullName
                            : t('chatTitle')}
                        </span>
                        {effectiveSelectedTeacher?.isHomeroomInScope && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {effectiveSelectedTeacher.homeroomBadgeLabel}
                          </span>
                        )}
                      </CardTitle>
                      {effectiveSelectedTeacher?.displayRoleSummary && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {effectiveSelectedTeacher.displayRoleSummary}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50 dark:bg-slate-900">
                  {!activeTeacherId || messages.length === 0 ? (
                    <div className="m-auto text-center space-y-1 text-gray-400">
                      <p className="text-sm">{t('noMessages')}</p>
                      {effectiveSelectedTeacher && (
                        <p className="text-xs">
                          Tin nhắn gửi tới {effectiveSelectedTeacher.fullName}{' '}
                          sẽ hiển thị ngay trên chuông thông báo và hộp thư Cổng
                          Giáo viên.
                        </p>
                      )}
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.senderId !== activeTeacherId;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <span
                              className={`text-[10px] mt-1 block ${
                                isMe ? 'text-indigo-200' : 'text-gray-400'
                              }`}
                            >
                              {format(new Date(msg.createdAt), 'HH:mm - dd/MM')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
                <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-card-bg shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder={t('inputPlaceholder')}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={!activeTeacherId || sendingMessage}
                      className="flex-1 rounded-full px-4"
                    />
                    <Button
                      type="submit"
                      disabled={
                        !activeTeacherId ||
                        sendingMessage ||
                        !newMessage.trim()
                      }
                      className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 p-0 flex items-center justify-center"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
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
                    <CardDescription>
                      {effectiveSelectedTeacher
                        ? `Gửi yêu cầu chính thức tới ${effectiveSelectedTeacher.fullName}`
                        : 'Gửi yêu cầu chính thức tới giáo viên'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendProposal} className="space-y-4">
                      {linkedStudents.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">
                            Áp dụng cho học sinh
                          </label>
                          <select
                            value={proposalStudentId}
                            onChange={(e) =>
                              setProposalStudentId(e.target.value)
                            }
                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                          >
                            {linkedStudents.map(({ student }) => (
                              <option key={student.id} value={student.id}>
                                {student.fullName} —{' '}
                                {formatClassLabel(
                                  student.className,
                                  student.grade,
                                )}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề</label>
                        <Input
                          placeholder="Ví dụ: Xin nghỉ ốm ngày 20/11..."
                          value={proposalTitle}
                          onChange={(e) => setProposalTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Nội dung chi tiết
                        </label>
                        <Textarea
                          placeholder="Nhập nội dung yêu cầu, lý do cụ thể..."
                          value={proposalContent}
                          onChange={(e) => setProposalContent(e.target.value)}
                          required
                          rows={5}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!activeTeacherId || sendingProposal}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {sendingProposal ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Gửi Yêu cầu
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lịch sử Đề xuất</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[440px] overflow-y-auto">
                    <div className="space-y-4">
                      {proposals.length === 0 ? (
                        <div className="text-gray-500 text-sm">
                          Chưa có đề xuất nào.
                        </div>
                      ) : (
                        proposals.map((p) => (
                          <div
                            key={p.id}
                            className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 space-y-2"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {p.title}
                              </h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                                  p.status === 'APPROVED'
                                    ? 'bg-green-100 text-green-700'
                                    : p.status === 'REJECTED'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {p.status === 'APPROVED'
                                  ? 'Đã duyệt'
                                  : p.status === 'REJECTED'
                                    ? 'Từ chối'
                                    : 'Chờ duyệt'}
                              </span>
                            </div>
                            {p.student?.fullName && (
                              <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                <GraduationCap className="w-3 h-3" /> HS:{' '}
                                {p.student.fullName}
                              </div>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                              {p.content}
                            </p>
                            <p className="text-xs text-gray-400 pt-1 flex items-center justify-between gap-2">
                              <span>Gửi tới: {p.teacher?.fullName}</span>
                              <span>
                                {format(
                                  new Date(p.createdAt),
                                  'dd/MM/yyyy HH:mm',
                                )}
                              </span>
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
