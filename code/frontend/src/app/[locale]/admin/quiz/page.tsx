"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Search, Plus, UploadCloud, Download, MoreVertical } from "lucide-react";

const questions = [
  { id: 1, stem: "What is the time complexity of binary searc...", subject: "Computer Science", subjectColor: "bg-blue-100 text-blue-700", type: "Multiple Choice", difficulty: "Medium", diffColor: "text-emerald-500", date: "Oct 24, 2023" },
  { id: 2, stem: "The derivative of e^x is always e^x,...", subject: "Mathematics", subjectColor: "bg-indigo-100 text-indigo-700", type: "True / False", difficulty: "Easy", diffColor: "text-emerald-500", date: "Oct 22, 2023" },
  { id: 3, stem: "Explain the significance of the Schrödinger...", subject: "Physics", subjectColor: "bg-purple-100 text-purple-700", type: "Short Answer", difficulty: "Hard", diffColor: "text-red-500", date: "Oct 20, 2023" },
];

export default function QuestionBankPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Question Bank</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage and organize assessment items across all subjects.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-lg text-sm font-medium text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <UploadCloud className="w-4 h-4" /> Import Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
        {/* Filters */}
        <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between overflow-x-auto scrollbar-hide gap-4">
          <div className="flex items-center gap-3">
            <select className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[140px]">
              <option>All Subjects</option>
              <option>Computer Science</option>
              <option>Mathematics</option>
              <option>Physics</option>
            </select>
            <select className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[140px]">
              <option>Any Difficulty</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <select className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[140px]">
              <option>Any Type</option>
              <option>Multiple Choice</option>
              <option>True / False</option>
              <option>Short Answer</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Showing 1-10 of 1,245 questions
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-card-border text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" /></th>
                <th className="px-6 py-4">Question Stem</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Last Modified</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-card-border">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" /></td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{q.stem}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${q.subjectColor} dark:bg-opacity-20`}>
                      {q.subject}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">{q.type}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-current ${q.diffColor}`}></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.difficulty}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{q.date}</div>
                    <div className="text-xs text-gray-500">2023</div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-100 dark:border-card-border p-4 flex items-center justify-between text-sm">
          <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Previous
          </button>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-medium shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">3</button>
            <span className="px-2 text-gray-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">125</button>
          </div>
          <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
