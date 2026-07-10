"use client";
/* eslint-disable react/no-unescaped-entities */

import { useState } from "react";
import { Settings, Bot, Shield, Trophy, Save, Key, Sliders, CheckCircle2, Globe, Building, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("ai");
  const t = useTranslations("Admin.Settings");

  const tabs = [
    { id: "general", label: t('general'), icon: Settings },
    { id: "ai", label: t('ai'), icon: Bot },
    { id: "rbac", label: t('rbac'), icon: Shield },
    { id: "gamification", label: t('gamification'), icon: Trophy },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Save className="w-4 h-4" /> {t('saveChanges')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActive 
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm p-6 sm:p-8">
            
            {/* --- AI Configuration Tab --- */}
            {activeTab === "ai" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-500" /> Default AI Model
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose the primary large language model (LLM) used by the AI Tutor.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    {/* Model Option 1 */}
                    <div className="border-2 border-blue-600 dark:border-blue-500 rounded-xl p-4 cursor-pointer relative bg-blue-50/50 dark:bg-blue-900/10">
                      <div className="absolute top-3 right-3 text-blue-600 dark:text-blue-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-gray-900 dark:text-white mb-1">GPT-4 Turbo</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">OpenAI • High Accuracy</div>
                    </div>
                    {/* Model Option 2 */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="font-bold text-gray-900 dark:text-white mb-1">Gemini 1.5 Pro</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Google • Fast & Multimodal</div>
                    </div>
                    {/* Model Option 3 */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="font-bold text-gray-900 dark:text-white mb-1">Claude 3 Opus</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Anthropic • Best Reasoning</div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-500" /> Model Parameters
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fine-tune the AI's response behavior.</p>
                  
                  <div className="space-y-6 mt-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Temperature (Creativity)</label>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">0.7</span>
                      </div>
                      <input type="range" min="0" max="100" defaultValue="70" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600" />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Precise & Analytical</span>
                        <span>Creative & Fluid</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Max Response Tokens</label>
                      <select 
                        defaultValue="2048"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      >
                        <option value="1024">1024 tokens (~750 words)</option>
                        <option value="2048">2048 tokens (~1500 words)</option>
                        <option value="4096">4096 tokens (~3000 words)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-500" /> System Prompt (Persona)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Define the base personality and rules for the AI Tutor.</p>
                  
                  <textarea 
                    rows={4} 
                    className="mt-4 w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y font-mono leading-relaxed"
                    defaultValue="You are an expert AI Tutor for high school students. Always explain concepts step-by-step. Do not provide direct answers to homework; instead, guide the student to discover the answer themselves."
                  ></textarea>
                </div>
              </div>
            )}

            {/* --- General Tab --- */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Organization Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Platform Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" defaultValue="EduAI Premium" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" defaultValue="support@eduai.edu.vn" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Default Language</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none">
                        <option value="vi">Tiếng Việt (vi)</option>
                        <option value="en">English (en)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- Gamification Tab --- */}
            {activeTab === "gamification" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gamification & Rewards Engine</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure how students earn points and compete.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Enable Leaderboards</div>
                      <div className="text-sm text-gray-500">Allow students to see their rank based on XP.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Streak System</div>
                      <div className="text-sm text-gray-500">Award bonus XP for consecutive days of login and study.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
                
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">XP Reward Matrix</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Lesson Completion</label>
                      <input type="number" defaultValue="50" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Perfect Quiz Score</label>
                      <input type="number" defaultValue="100" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- RBAC Tab --- */}
            {activeTab === "rbac" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Role-Based Access Control</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage what different user types can see and do.</p>
                </div>
                
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Permission</th>
                        <th className="px-4 py-3 font-semibold text-center">Admin</th>
                        <th className="px-4 py-3 font-semibold text-center">Teacher</th>
                        <th className="px-4 py-3 font-semibold text-center">Student</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">Manage System Settings</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-center">-</td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">Upload AI Content</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center">-</td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">View Global Analytics</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-center">-</td>
                      </tr>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">Chat with AI Tutor</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
