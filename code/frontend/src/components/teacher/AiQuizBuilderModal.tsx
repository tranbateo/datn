import React, { useState } from 'react';
import { X, Sparkles, Loader2, Save } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface AiQuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (questions: any[]) => void;
}

export default function AiQuizBuilderModal({ isOpen, onClose, onSuccess }: AiQuizBuilderModalProps) {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [duration, setDuration] = useState(15);
  const [isGraduation, setIsGraduation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!title || !courseId) {
      alert('Vui lòng nhập Tên đề thi và ID khóa học!');
      return;
    }
    setLoading(true);
    setPreviewData(null);
    try {
      const data = await fetchApi(API_ENDPOINTS.QUIZ.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          topic,
          numQuestions: Number(numQuestions)
        }),
      });
      setPreviewData(data as any);
    } catch (err) {
      console.error(err);
      alert('Tạo quiz thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (previewData) {
      setSaving(true);
      try {
        await fetchApi(API_ENDPOINTS.TEACHER.QUIZZES_AI_BUILD, {
          method: 'POST',
          body: JSON.stringify({
            title,
            courseId,
            topic,
            numQuestions: Number(numQuestions),
            duration: Number(duration),
            isGraduation,
            questions: previewData
          }),
        });
        onSuccess(previewData);
        onClose();
      } catch (err) {
        console.error(err);
        alert('Lưu quiz thất bại. Vui lòng thử lại.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-card-bg rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-card-border flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Quiz Builder</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tạo câu hỏi từ tài liệu đã học</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!previewData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đề thi *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="VD: Kiểm tra 15 phút"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Khóa học (Course ID) *</label>
                  <input
                    type="text"
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    placeholder="Nhập ID khóa học"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chủ đề (Topic) - Optional</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Ví dụ: Đại số tuyến tính..."
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian (Phút)</label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng câu hỏi</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={numQuestions}
                    onChange={e => setNumQuestions(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <label className="relative inline-flex items-center cursor-pointer gap-3">
                    <div className="relative">
                      <input type="checkbox" className="sr-only peer" checked={isGraduation} onChange={(e) => setIsGraduation(e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Đề thi Vượt cấp (Graduation)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xem trước câu hỏi:</h3>
              {previewData.map((q, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <p className="font-medium text-gray-900 dark:text-white"><span className="text-blue-600 font-bold">Câu {i + 1}:</span> {q.content}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt: string, j: number) => (
                      <div key={j} className={`px-3 py-2 rounded-lg text-sm border ${q.correctOption === opt ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Giải thích:</span> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-card-border flex justify-end gap-3 bg-gray-50 dark:bg-card-bg">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Hủy
          </button>
          {!previewData ? (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Đang tạo...' : 'Tạo câu hỏi'}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-md shadow-green-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Đang lưu...' : 'Lưu & Sử dụng'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
