# -*- coding: utf-8 -*-
path_file = r'c:\Users\TaiXIU\datn\datn\code\frontend\src\app\[locale]\admin\students\AdminStudentsClient.tsx'
with open(path_file, 'r', encoding='utf-8') as f:
    text = f.read()

crlf = '\r\n' in text
norm_text = text.replace('\r\n', '\n')

# 1. Update imports
old_import = """import { Search, Plus, Filter, Calendar, ChevronLeft, ChevronRight, TrendingUp, Users, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { fetchApi } from "@/lib/api-client";
import { Student, User } from '@/types';
import UserModal from "@/components/admin/UserModal";"""

new_import = """import { Search, Plus, Filter, Calendar, ChevronLeft, ChevronRight, TrendingUp, Users, MoreVertical, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { fetchApi } from "@/lib/api-client";
import { Student, User } from '@/types';
import UserModal from "@/components/admin/UserModal";
import SchoolImportModal from "@/components/admin/SchoolImportModal";"""

assert old_import in norm_text, "old_import not found"
norm_text = norm_text.replace(old_import, new_import, 1)

# 2. Add state
old_state = """  const [isModalOpen, setIsModalOpen] = useState(false);"""
new_state = """  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);"""

assert old_state in norm_text, "old_state not found"
norm_text = norm_text.replace(old_state, new_state, 1)

# 3. Add button in Header
old_btn = """            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> {t('addStudent')}
            </button>"""

new_btn = """            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Import Excel
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> {t('addStudent')}
            </button>"""

assert old_btn in norm_text, "old_btn not found"
norm_text = norm_text.replace(old_btn, new_btn, 1)

# 4. Render modal at the bottom
old_bottom = """      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser} 
        user={selectedUser} 
        role="STUDENT" 
      />
    </div>"""

new_bottom = """      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser} 
        user={selectedUser} 
        role="STUDENT" 
      />
      <SchoolImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => window.location.reload()} 
      />
    </div>"""

assert old_bottom in norm_text, "old_bottom not found"
norm_text = norm_text.replace(old_bottom, new_bottom, 1)

with open(path_file, 'w', encoding='utf-8') as f:
    f.write(norm_text.replace('\n', '\r\n') if crlf else norm_text)

print("AdminStudentsClient.tsx updated successfully!")

