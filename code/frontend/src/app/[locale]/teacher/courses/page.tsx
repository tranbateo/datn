"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api-client";

import { Filter, Plus, GraduationCap, Users, CheckCircle2, MoreHorizontal, Upload } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

const trendDataUp = [
  { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 }, { value: 25 }, { value: 22 }, { value: 30 }
];

const trendDataDown = [
  { value: 30 }, { value: 28 }, { value: 25 }, { value: 26 }, { value: 22 }, { value: 20 }, { value: 18 }
];

const trendDataStable = [
  { value: 20 }, { value: 21 }, { value: 20 }, { value: 22 }, { value: 21 }, { value: 20 }, { value: 21 }
];

const courses = [
  {
    id: 1,
    title: "Advanced Machine Learning Algorithms",
    instructor: "Dr. Sarah Chen",
    category: "Data Science",
    enrollment: 1245,
    enrollmentTrend: "+15%",
    lessons: 24,
    trend: trendDataUp,
    trendColor: "#10B981", // Emerald
  },
  {
    id: 2,
    title: "UX Research Methodologies",
    instructor: "Prof. James Wilson",
    category: "Design",
    enrollment: 892,
    enrollmentTrend: "-2%",
    lessons: 12,
    trend: trendDataStable,
    trendColor: "#9CA3AF", // Gray
  },
  {
    id: 3,
    title: "Intro to Python for Data Analysis",
    instructor: "Dr. Sarah Chen",
    category: "Computer Science",
    enrollment: 3104,
    enrollmentTrend: "-4%",
    lessons: 36,
    trend: trendDataDown,
    trendColor: "#F43F5E", // Rose
  }
];

export default function TeacherCourseManagement() {
  const t = useTranslations("Teacher.Courses");
  const [coursesData, setCoursesData] = useState(courses);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchApi('/courses');
        if (data && data.length > 0) {
          const formatted = data.map((c: any) => ({
            id: c.id,
            title: c.title,
            instructor: c.teacher?.fullName || c.teacher?.email || 'Unknown',
            category: 'Development', // placeholder
            enrollment: Math.floor(Math.random() * 1000) + 100,
            enrollmentTrend: '+5%',
            lessons: c.lessons?.length || 0,
            trend: trendDataStable,
            trendColor: '#10B981',
          }));
          setCoursesData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter className="w-4 h-4" /> {t('filter')}
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('newCourse')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('totalActive')}</p>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white">124</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            ↗ +12% this term
          </span>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('totalEnrollments')}</p>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white">8,492</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            ↗ +5.4% this term
          </span>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('avgCompletion')}</p>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white">68%</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <span className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
            ↘ -2% this term
          </span>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 min-w-[140px]">
              <option>All Categories</option>
              <option>Data Science</option>
              <option>Design</option>
              <option>Computer Science</option>
            </select>
            <select className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 min-w-[160px]">
              <option>Sort by: Most Recent</option>
              <option>Most Popular</option>
              <option>Highest Rated</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing 1-10 of 124 courses
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs">{t('courseTitle')}</th>
                <th className="px-6 py-4 font-semibold text-xs">{t('category')}</th>
                <th className="px-6 py-4 font-semibold text-xs">{t('enrollment')}</th>
                <th className="px-6 py-4 font-semibold text-xs">{t('lessons')}</th>
                <th className="px-6 py-4 font-semibold text-xs">{t('trend')}</th>
                <th className="px-6 py-4 font-semibold text-xs text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading courses...</td>
                </tr>
              ) : coursesData.map((course) => (
                <CourseRow key={course.id} course={course} />
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 mt-auto flex items-center justify-between text-sm">
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
            &lt; Previous
          </button>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-700 text-white font-medium shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-600 dark:text-gray-400 transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-600 dark:text-gray-400 transition-colors">3</button>
            <span className="px-2 text-gray-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-600 dark:text-gray-400 transition-colors">12</button>
          </div>
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseRow({ course }: { course: any }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await fetchApi(`/documents/upload/${course.id}`, {
        method: 'POST',
        body: formData,
      });
      alert('Tải lên thành công! AI đã học thuộc tài liệu.');
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi tải tài liệu');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold font-mono border border-blue-100 dark:border-blue-800/50">
            {"{ }"}
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-base">{course.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{course.instructor}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          {course.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="font-bold text-gray-900 dark:text-white text-base">{course.enrollment.toLocaleString()}</div>
        <div className={`text-xs font-medium ${course.enrollmentTrend.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {course.enrollmentTrend.startsWith('+') ? '↗' : '↘'} {course.enrollmentTrend}
        </div>
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium text-base">
        {course.lessons}
      </td>
      <td className="px-6 py-4">
        <div className="w-24 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={course.trend}>
              <defs>
                <linearGradient id={`color-${course.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={course.trendColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={course.trendColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={course.trendColor} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#color-${course.id})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <input 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors mr-2"
          title="Tải lên tài liệu PDF"
        >
          {uploading ? (
            <span className="text-xs font-medium">Đang tải...</span>
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}
