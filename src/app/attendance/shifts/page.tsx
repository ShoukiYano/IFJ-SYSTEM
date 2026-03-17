"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Users, ChevronLeft, ChevronRight, Save, Loader2, Copy, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isWeekend, startOfWeek, endOfWeek } from "date-fns";
import { ja } from "date-fns/locale";

export default function ShiftManagePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [staffs, setStaffs] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 編集中のシフト（一時保存用）
  const [pendingShifts, setPendingShifts] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, shRes] = await Promise.all([
        fetch("/api/staff"),
        fetch(`/api/shifts?start=${startOfMonth(currentMonth).toISOString()}&end=${endOfMonth(currentMonth).toISOString()}`)
      ]);
      
      if (sRes.ok && shRes.ok) {
        const sData = await sRes.json();
        const shData = await shRes.json();
        setStaffs(sData);
        setShifts(shData);
        setPendingShifts([]); // クリア
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetDefault = (staffId: string) => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });

    const newShifts = days
      .filter(day => !isWeekend(day)) // 平日のみ
      .map(day => ({
        staffId,
        date: day,
        startTime: new Date(day.setHours(9, 0, 0, 0)),
        endTime: new Date(day.setHours(18, 0, 0, 0)),
        type: "WORKING"
      }));

    setPendingShifts(prev => [
      ...prev.filter(ps => ps.staffId !== staffId),
      ...newShifts
    ]);
  };

  const handleSave = async () => {
    if (pendingShifts.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/shifts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shifts: pendingShifts })
      });
      if (res.ok) {
        alert("保存しました");
        fetchData();
      } else {
        alert("保存に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 font-black text-slate-400 animate-pulse">カレンダーを生成中...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">シフト管理</h1>
          <p className="text-slate-500 font-medium">要員ごとの勤務予定を一括で編成します</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-black text-slate-700 min-w-[120px] text-center">
              {format(currentMonth, "yyyy年 M月")}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving || pendingShifts.length === 0}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-30"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {pendingShifts.length > 0 ? `変更内容を保存 (${pendingShifts.length})` : "保存"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky left-0 bg-slate-50/50 z-10 w-64 border-r border-slate-100">従業員名 / アクション</th>
                {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(day => (
                  <th key={day.toISOString()} className={`p-4 text-center border-r border-slate-100 min-w-[48px] ${isWeekend(day) ? 'bg-slate-100/30' : ''}`}>
                    <div className="text-[10px] font-black text-slate-400 uppercase">{format(day, "E", { locale: ja })}</div>
                    <div className={`text-sm font-black mt-1 ${isToday(day) ? 'text-indigo-600 ring-2 ring-indigo-50 rounded-full inline-block w-7 h-7 leading-7 bg-white' : 'text-slate-600'}`}>
                      {format(day, "d")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffs.map(staff => (
                <tr key={staff.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="p-6 sticky left-0 bg-white group-hover:bg-slate-50/30 z-10 border-r border-slate-100 shadow-xl shadow-transparent group-hover:shadow-slate-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                          {staff.name.charAt(0)}
                        </div>
                        <span className="font-black text-slate-800 text-sm whitespace-nowrap">{staff.name}</span>
                      </div>
                      <button 
                        onClick={() => handleSetDefault(staff.id)}
                        className="p-2 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                        title="平日に標準シフト(9-18)を適用"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(day => {
                    const shift = shifts.find(s => s.staffId === staff.id && format(new Date(s.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
                    const pending = pendingShifts.find(ps => ps.staffId === staff.id && format(new Date(ps.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
                    const active = pending || shift;

                    return (
                      <td key={`${staff.id}-${day.toISOString()}`} className={`p-1 border-r border-slate-100 text-center ${isWeekend(day) ? 'bg-slate-100/10' : ''}`}>
                        {active ? (
                          <div className={`p-2 rounded-xl text-[10px] font-black tracking-tighter shadow-sm transition-all animate-in zoom-in-90 ${pending ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {format(new Date(active.startTime), "HH:mm")}
                            <div className="border-t border-white/20 my-0.5"></div>
                            {format(new Date(active.endTime), "HH:mm")}
                          </div>
                        ) : (
                          <div className="size-full min-h-[48px] flex items-center justify-center text-slate-200 group-hover:text-slate-300 cursor-copy hover:bg-indigo-50 rounded-xl transition-all" onClick={() => {
                            const newShift = {
                              staffId: staff.id,
                              date: day,
                              startTime: new Date(day.setHours(9, 0, 0, 0)),
                              endTime: new Date(day.setHours(18, 0, 0, 0)),
                              type: "WORKING"
                            };
                            setPendingShifts(prev => [...prev, newShift]);
                          }}>
                            +
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm">
          <CalendarIcon size={24} />
        </div>
        <div>
          <h4 className="font-black text-indigo-900">効率的なシフト入力</h4>
          <p className="text-indigo-700 text-sm mt-1">
            氏名横の <Copy size={14} className="inline mx-1" /> アイコンをクリックすると、その月の平日に標準勤務（9:00 - 18:00）を一括入力できます。
            空欄の「+」をクリックして個別に登録することも可能です。青色のセルは未保存の変更を示します。
          </p>
        </div>
      </div>
    </div>
  );
}
