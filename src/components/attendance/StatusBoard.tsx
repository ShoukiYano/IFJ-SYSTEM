"use client";

import React, { useEffect, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, PlayCircle, MinusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function StatusBoard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/attendance/admin/today");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60000); // 1分ごとに更新
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="h-64 bg-slate-50 animate-pulse rounded-3xl" />;
  }

  const counts = {
    WORKING: data.filter(s => s.status === "WORKING").length,
    LATE: data.filter(s => s.status === "LATE").length,
    WAITING: data.filter(s => s.status === "WAITING").length,
    FINISHED: data.filter(s => s.status === "FINISHED").length,
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <Clock className="text-indigo-600" size={20} />
          リアルタイム稼働状況
        </h3>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
          Live Update
        </div>
      </div>

      <div className="p-4 bg-slate-50/50 grid grid-cols-4 gap-2 border-b border-slate-50">
        <div className="bg-white p-3 rounded-2xl flex flex-col items-center">
          <div className="text-[9px] font-black text-indigo-500 uppercase">Working</div>
          <div className="text-xl font-black text-indigo-700">{counts.WORKING}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl flex flex-col items-center">
          <div className="text-[9px] font-black text-rose-500 uppercase">Late</div>
          <div className="text-xl font-black text-rose-700">{counts.LATE}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl flex flex-col items-center">
          <div className="text-[9px] font-black text-amber-500 uppercase">Waiting</div>
          <div className="text-xl font-black text-amber-700">{counts.WAITING}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl flex flex-col items-center">
          <div className="text-[9px] font-black text-emerald-500 uppercase">Done</div>
          <div className="text-xl font-black text-emerald-700">{counts.FINISHED}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[400px]">
        {data.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-bold italic">No active staff today</div>
        ) : data.filter(s => s.status !== "FREE").map((staff: any) => (
          <div key={staff.staffId} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <User size={16} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800">{staff.name}</div>
                <div className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">{staff.clientName || "-"}</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {staff.status === "WORKING" && (
                <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ring-1 ring-indigo-200">
                  <PlayCircle size={10} className="animate-pulse" />
                  <span className="text-[9px] font-black">稼働中</span>
                  <span className="text-[9px] font-bold opacity-60">
                    {staff.record?.clockIn ? format(new Date(staff.record.clockIn), "HH:mm") : "-"}
                  </span>
                </div>
              )}
              {staff.status === "LATE" && (
                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200">
                  <AlertCircle size={10} />
                  <span className="text-[9px] font-black">出勤遅れ</span>
                  <span className="text-[9px] font-bold opacity-60">予定: {format(new Date(staff.shift.startTime), "HH:mm")}</span>
                </div>
              )}
              {staff.status === "WAITING" && (
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-200">
                  <Clock size={10} />
                  <span className="text-[9px] font-black">準備中</span>
                  <span className="text-[9px] font-bold opacity-60">{format(new Date(staff.shift.startTime), "HH:mm")}〜</span>
                </div>
              )}
              {staff.status === "FINISHED" && (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                  <CheckCircle2 size={10} />
                  <span className="text-[9px] font-black">終了済</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
