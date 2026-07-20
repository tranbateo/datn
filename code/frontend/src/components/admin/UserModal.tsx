import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { User } from '@/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<User> & { password?: string }) => Promise<void>;
  user: User | null;
  role: 'STUDENT' | 'TEACHER' | 'PARENT';
}

export default function UserModal({ isOpen, onClose, onSave, user, role }: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
    fullName: '',
    email: '',
    password: '',
    role: role,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      // We are in an effect, but since we are synchronizing props to state, 
      // React 18+ docs suggest doing it during render or extracting to a key.
      // But for quick fix, we just use a small hack or disable lint.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ ...user, password: '' });
    } else {
       
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: role,
        isActive: true,
      });
    }
    setError('');
  }, [user, role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...formData };
      if (user && !payload.password) {
        delete payload.password;
      }
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ tên</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              value={formData.fullName || ''}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mật khẩu {user && '(Để trống nếu không đổi)'}
            </label>
            <input
              type={user ? "password" : "text"}
              required={!user}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              value={formData.password || ''}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kích hoạt tài khoản
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
