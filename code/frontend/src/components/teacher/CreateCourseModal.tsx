import React, { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState(10);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!title) {
      alert('Vui lòng nhập tên khóa học!');
      return;
    }
    setLoading(true);
    try {
      await fetchApi(API_ENDPOINTS.COURSES.LIST, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          grade: Number(grade)
        }),
      });
      alert('Tạo khóa học thành công!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi tạo khóa học.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-card-bg rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-card-border flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tạo Khóa Học Mới</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên khóa học</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Toán học 10 Nâng cao"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả khóa học..."
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Khối Lớp</label>
            <input
              type="number"
              value={grade}
              onChange={e => setGrade(Number(e.target.value))}
              min={1}
              max={12}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-card-border flex justify-end gap-3 bg-gray-50 dark:bg-card-bg">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Tạo mới
          </button>
        </div>
      </div>
    </div>
  );
}
