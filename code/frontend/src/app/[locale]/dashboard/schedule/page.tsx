"use client";

import { notify } from "@/lib/toast";
import { API_ENDPOINTS } from "@/constants/api";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Video,
  X,
  Link as LinkIcon,
  Info,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { calendarService, CalendarEvent } from "@/services/calendar.service";
import { fetchApi } from "@/lib/api-client";

function getStartOfWeek(refDate: Date): Date {
  const d = new Date(refDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function SchedulePage() {
  const t = useTranslations("User.Schedule");
  const tModal = useTranslations("User.EventModal");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Real dynamic week calendar strip
  const [weekStart, setWeekStart] = useState<Date>(() =>
    getStartOfWeek(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Create event modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("CLASS");
  const [newDate, setNewDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [newStartTime, setNewStartTime] = useState("19:00");
  const [newEndTime, setNewEndTime] = useState("20:30");
  const [newDescription, setNewDescription] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const data = await calendarService.getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    calendarService
      .getEvents()
      .then((data) => {
        if (active) setEvents(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + idx);
      return d;
    });
  }, [weekStart]);

  const monthHeading = useMemo(() => {
    return weekStart.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [weekStart]);

  const displayedEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((ev) => isSameDay(new Date(ev.startTime), selectedDate));
  }, [events, selectedDate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetchApi<any[]>(API_ENDPOINTS.CALENDAR.OCR, {
        method: "POST",
        body: formData,
      });
      if (response && response.length > 0) {
        for (const ev of response) {
          await fetchApi(API_ENDPOINTS.CALENDAR.LIST, {
            method: "POST",
            body: JSON.stringify(ev),
          });
        }
        notify(`Đã trích xuất và lưu ${response.length} lịch học!`);
        try {
          sessionStorage.removeItem("eduai_dashboard_snapshot_v1");
        } catch {
          // ignore
        }
        await loadEvents();
      } else {
        notify("Không tìm thấy lịch học nào trong ảnh");
      }
    } catch (error) {
      console.error(error);
      notify("Lỗi khi quét ảnh (OCR)");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    setSavingEvent(true);
    try {
      const startIso = new Date(`${newDate}T${newStartTime}:00`).toISOString();
      const endIso = new Date(`${newDate}T${newEndTime}:00`).toISOString();
      await fetchApi(API_ENDPOINTS.CALENDAR.LIST, {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
          startTime: startIso,
          endTime: endIso,
          description: newDescription.trim() || undefined,
        }),
      });
      setNewTitle("");
      setNewDescription("");
      setIsCreateOpen(false);
      notify("Đã thêm lịch học thành công!");
      try {
        sessionStorage.removeItem("eduai_dashboard_snapshot_v1");
      } catch {
        // ignore
      }
      await loadEvents();
    } catch (err: any) {
      notify(err?.message || "Không thể thêm lịch học.");
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Xóa sự kiện này khỏi lịch học của em?")) return;
    setDeletingId(eventId);
    try {
      await fetchApi(`${API_ENDPOINTS.CALENDAR.LIST}/${eventId}`, {
        method: "DELETE",
      });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSelectedEvent(null);
      try {
        sessionStorage.removeItem("eduai_dashboard_snapshot_v1");
      } catch {
        // ignore
      }
      notify("Đã xóa lịch học.");
    } catch (err: any) {
      notify(err?.message || "Không thể xóa sự kiện.");
    } finally {
      setDeletingId(null);
    }
  };

  const dayNames = [
    t("mon"),
    t("tue"),
    t("wed"),
    t("thu"),
    t("fri"),
    t("sat"),
    t("sun"),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {t("title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <label className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer">
            <Video className="w-4 h-4" />
            {uploading ? "Đang OCR..." : "Quét Lịch (OCR)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t("addSchedule")}
          </button>
        </div>
      </div>

      {/* Real Dynamic Week Calendar Strip */}
      <div className="bg-white dark:bg-card-bg p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg capitalize">
              {monthHeading}
            </h2>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 rounded-full hover:bg-blue-100"
              >
                Hiện tất cả ({events.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const prev = new Date(weekStart);
                prev.setDate(prev.getDate() - 7);
                setWeekStart(prev);
              }}
              aria-label="Tuần trước"
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setWeekStart(getStartOfWeek(today));
                setSelectedDate(null);
              }}
              className="px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setWeekStart(next);
              }}
              aria-label="Tuần sau"
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((dayDate, idx) => {
            const isToday = isSameDay(dayDate, new Date());
            const isSelected = Boolean(
              selectedDate && isSameDay(dayDate, selectedDate),
            );
            const hasEvents = events.some((ev) =>
              isSameDay(new Date(ev.startTime), dayDate),
            );
            return (
              <button
                key={dayDate.toISOString()}
                type="button"
                onClick={() =>
                  setSelectedDate(isSelected ? null : dayDate)
                }
                className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md"
                    : isToday
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                <span className="text-[10px] font-medium uppercase mb-1">
                  {dayNames[idx]}
                </span>
                <span className="text-base sm:text-lg font-bold">
                  {dayDate.getDate()}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    hasEvents
                      ? isSelected
                        ? "bg-white"
                        : "bg-blue-500"
                      : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-card-bg p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-6 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          {selectedDate
            ? `Lịch học ngày ${selectedDate.toLocaleDateString("vi-VN")}`
            : t("todaySchedule")}
        </h2>

        <div className="space-y-4">
          {displayedEvents.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-8 text-sm">
              {selectedDate
                ? "Không có sự kiện nào trong ngày này."
                : "Chưa có lịch học nào. Nhấn \"Thêm lịch mới\" hoặc \"Quét Lịch (OCR)\" để bắt đầu!"}
            </p>
          )}
          {loading && (
            <p className="text-gray-500 text-center py-8 text-sm">
              Đang tải lịch học...
            </p>
          )}
          {displayedEvents.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedEvent(item)}
              className="p-4 rounded-2xl border-l-4 border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {new Date(item.startTime).toLocaleDateString("vi-VN")} •{" "}
                  {new Date(item.startTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {item.endTime
                    ? ` – ${new Date(item.endTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    {item.type}
                  </span>
                  {item.description && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {item.description}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteEvent(item.id);
                }}
                disabled={deletingId === item.id}
                title="Xóa lịch"
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-bg w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Thêm lịch học mới
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Tên môn / Sự kiện *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Ôn tập Toán học kỳ II..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Loại lịch
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm"
                  >
                    <option value="CLASS">Lớp học (CLASS)</option>
                    <option value="EXAM">Kiểm tra (EXAM)</option>
                    <option value="ASSIGNMENT">Bài tập (ASSIGNMENT)</option>
                    <option value="MEETING">Tự học / Nhóm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Ngày *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Giờ kết thúc
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Phòng học, tài liệu cần chuẩn bị..."
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {savingEvent && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu lịch học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-bg w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="h-20 bg-blue-100 dark:bg-blue-900/30 relative">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 bg-white/70 dark:bg-black/30 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">
                  {new Date(selectedEvent.startTime).toLocaleString("vi-VN")}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {selectedEvent.title}
                </h2>
              </div>

              {selectedEvent.description && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> {tModal("notes")}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {selectedEvent.locationUrl && (
                  <a
                    href={selectedEvent.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" /> {tModal("joinClass")}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  disabled={deletingId === selectedEvent.id}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
