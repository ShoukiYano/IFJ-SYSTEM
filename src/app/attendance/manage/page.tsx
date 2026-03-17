"use client";

import { useState, useEffect } from "react";
import { Users, Clock, AlertTriangle, CheckCircle, Search, Filter, ArrowUpRight, MoreVertical, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AttendanceManagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role === "TENANT_USER") {
        router.push("/attendance");
        return;
      }
      fetchSummary();
    }
  }, [session, status, router]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/summary");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: string, note?: string) => {
    if (!selectedRecord) return;
    setReviewing(true);
    try {
      const res = await fetch(`/api/attendance/${selectedRecord.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note })
      });
      if (res.ok) {
        setSelectedRecord(null);
        await fetchSummary();
      } else {
        alert("更新に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 animate-pulse font-bold">状況を読み込んでいます...</div>;
  }

  const { summary, staffs } = data || { summary: {}, staffs: [] };

  const filteredStaffs = staffs.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">勤怠モニタリング</h1>
          <p className="text-slate-500 font-medium">本日の稼働状況を一目で把握できます</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 font-bold text-slate-600 flex items-center gap-2">
          <Clock size={18} className="text-indigo-600" />
          {format(new Date(), "yyyy年MM月dd日")}
        </div>
      </div>

      {/* サマリーパネル */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="社員数" value={summary.totalStaff} icon={Users} color="bg-slate-500" />
        <StatCard title="出勤済み" value={summary.clockedInCount} icon={CheckCircle} color="bg-emerald-500" subtitle={`退勤 ${summary.clockedOutCount}名`} />
        <StatCard title="未打刻(要確認)" value={summary.missingPunchInCount} icon={AlertTriangle} color={summary.missingPunchInCount > 0 ? "bg-rose-600" : "bg-slate-400"} />
        <StatCard title="承認待ち報告" value={summary.pendingReportsCount} icon={FileText} color="bg-indigo-500" />
      </div>

      {/* 従業員リスト */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-900">従業員稼働状況</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="従業員名で検索..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-6 py-3 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500 outline-none w-full md:w-64 transition-all font-medium text-sm"
              />
            </div>
            <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all border border-transparent">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">従業員</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">本人打刻</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">シフト予定</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">ステータス</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStaffs.map((staff: any) => (
                <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-4 ring-indigo-50">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-900">{staff.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{staff.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {staff.todayRecord?.clockIn ? (
                      <div className="space-y-0.5">
                        <div className="text-sm font-black text-slate-700">
                          {format(new Date(staff.todayRecord.clockIn), "HH:mm")} - {staff.todayRecord.clockOut ? format(new Date(staff.todayRecord.clockOut), "HH:mm") : "--:--"}
                        </div>
                        {staff.todayRecord.hasDiscrepancy && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500 uppercase">
                            <AlertTriangle size={10} /> Discrepancy
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-300 block">未打刻</span>
                        {staff.todayShift && new Date(staff.todayShift.startTime) < new Date() && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black border border-rose-100 animate-pulse">
                            <AlertTriangle size={10} /> 未出勤 (遅刻疑い)
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {staff.todayShift ? (
                      <div className="text-sm font-bold text-slate-500">
                        {format(new Date(staff.todayShift.startTime), "HH:mm")} - {format(new Date(staff.todayShift.endTime), "HH:mm")}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-300">なし</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge 
                      status={staff.todayRecord?.status || "DATED"} 
                      onClick={() => staff.todayRecord && setSelectedRecord({ ...staff.todayRecord, staffName: staff.name })}
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 承認モーダル */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">業務報告の確認</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{selectedRecord.staffName}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-600 font-black text-xl">
                 ×
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">報告内容</label>
                <div className="bg-slate-50 p-5 rounded-2xl text-slate-700 font-medium leading-relaxed whitespace-pre-wrap border border-slate-100">
                  {selectedRecord.workReport?.content || "報告内容がありません"}
                </div>
              </div>

              {selectedRecord.hasDiscrepancy && (
                <div>
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">シフト差異理由</label>
                  <div className="bg-rose-50/50 p-5 rounded-2xl text-rose-700 font-bold leading-relaxed border border-rose-100">
                    {selectedRecord.workReport?.discrepancyReason || "理由が未入力です"}
                  </div>
                </div>
              )}

              {selectedRecord.status === "REMANDED" && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">過去の差戻しメモ</label>
                  <div className="text-sm text-slate-500 italic px-1 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">{selectedRecord.note || "メモなし"}</div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  const reason = prompt("差戻し理由を入力してください");
                  if (reason !== null) handleReview("REMANDED", reason);
                }}
                disabled={reviewing || selectedRecord.status === "APPROVED"}
                className="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all disabled:opacity-30"
              >
                差戻し
              </button>
              <button 
                onClick={() => handleReview("APPROVED")}
                disabled={reviewing || selectedRecord.status === "APPROVED"}
                className="py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-30"
              >
                {reviewing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "承認する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-default">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{value}</div>
        {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subtitle}</p>}
      </div>
      <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shadow-slate-200 group-hover:-translate-y-1 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const configs: any = {
    DATED: { label: "未出勤", class: "bg-slate-100 text-slate-600" },
    STAMPED: { label: "稼働中", class: "bg-emerald-100 text-emerald-700 font-black" },
    SUBMITTED: { label: "承認待ち", class: "bg-indigo-100 text-indigo-700 font-black border-2 border-indigo-200 animate-pulse" },
    APPROVED: { label: "承認済み", class: "bg-blue-100 text-blue-700" },
    REMANDED: { label: "差戻し", class: "bg-rose-100 text-rose-700" },
  };

  const config = configs[status] || configs.DATED;
  return (
    <span 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.class} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
    >
      {config.label}
    </span>
  );
}
