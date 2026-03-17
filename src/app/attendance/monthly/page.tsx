"use client";

import { useState, useEffect, useCallback } from "react";
import { Calculator, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Filter } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { ja } from "date-fns/locale";

export default function MonthlyAttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const res = await fetch(`/api/attendance/monthly-summary?month=${monthStr}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const totals = data.reduce((acc, curr) => ({
    hours: acc.hours + curr.totalHours,
    shortage: acc.shortage + (curr.status === "SHORTAGE" ? 1 : 0),
    over: acc.over + (curr.status === "OVERTIME" ? 1 : 0),
  }), { hours: 0, shortage: 0, over: 0 });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">月次実績集計</h1>
          <p className="text-slate-500 font-medium">月末締め作業や請求作成のための稼働確認を行います</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
              <ChevronLeft size={20} />
            </button>
            <span className="px-6 font-black text-slate-700 min-w-[140px] text-center">
              {format(currentMonth, "yyyy年 M月")}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2">
            <Download size={20} />
            CSV出力
          </button>
        </div>
      </div>

      {/* サマリーパネル */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">総稼働時間</p>
            <div className="text-3xl font-black text-slate-900 tabular-nums">{totals.hours.toFixed(1)}<span className="text-sm ml-1 text-slate-400">h</span></div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-slate-400"><Calculator size={24} /></div>
        </div>
        <div className={`bg-white p-8 rounded-[2rem] border shadow-sm flex items-center justify-between ${totals.shortage > 0 ? 'border-rose-100' : 'border-slate-100'}`}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">精算幅不足</p>
            <div className={`text-3xl font-black tabular-nums ${totals.shortage > 0 ? 'text-rose-500' : 'text-slate-900'}`}>{totals.shortage}<span className="text-sm ml-1 text-slate-400">名</span></div>
          </div>
          <div className={`p-4 rounded-2xl ${totals.shortage > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}><TrendingDown size={24} /></div>
        </div>
        <div className={`bg-white p-8 rounded-[2rem] border shadow-sm flex items-center justify-between ${totals.over > 0 ? 'border-amber-100' : 'border-slate-100'}`}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">精算幅超過</p>
            <div className={`text-3xl font-black tabular-nums ${totals.over > 0 ? 'text-amber-500' : 'text-slate-900'}`}>{totals.over}<span className="text-sm ml-1 text-slate-400">名</span></div>
          </div>
          <div className={`p-4 rounded-2xl ${totals.over > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}><TrendingUp size={24} /></div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">要員・取引先</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">稼働日数</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">精算幅(h)</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">合計稼働(h)</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">判定</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">推定単価</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic font-medium">集計データを読み込み中...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic font-medium">該当するデータがありません</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row.staffId} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900">{row.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{row.clientName || "直取引"}</div>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-600 tabular-nums">{row.daysWorked}日</td>
                    <td className="px-8 py-6 text-sm text-slate-400 font-mono italic">{row.minHours} - {row.maxHours}</td>
                    <td className="px-8 py-6">
                      <div className="text-lg font-black text-slate-900 tabular-nums">{row.totalHours.toFixed(1)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusLabel status={row.status} />
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-900">
                      ¥{(row.unitPrice).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const configs: any = {
    NORMAL: { label: "適正", class: "bg-emerald-100 text-emerald-700" },
    SHORTAGE: { label: "不足", class: "bg-rose-100 text-rose-700 shadow-sm shadow-rose-100 ring-2 ring-rose-50", icon: TrendingDown },
    OVERTIME: { label: "超過", class: "bg-amber-100 text-amber-700 shadow-sm shadow-amber-100 ring-2 ring-amber-50", icon: TrendingUp },
  };

  const config = configs[status] || configs.NORMAL;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.class}`}>
      {Icon && <Icon size={12} />}
      {config.label}
    </span>
  );
}
