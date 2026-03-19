"use client";

import { useState, useEffect } from "react";
import { format, addMonths, startOfMonth, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck,
  Download,
  Search,
  ArrowRight,
  Filter,
  Calendar,
  X,
  MessageSquare
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function AttendanceSummaryPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "TENANT_ADMIN" || role === "SYSTEM_ADMIN";
  const hasAttendanceFeature = (session?.user as any)?.hasAttendanceFeature === true;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // 詳細表示用
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [dailyDetails, setDailyDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const res = await fetch(`/api/attendance/monthly-summary?month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [currentMonth, isAdmin]);

  const handleApproveMonth = async (staffId: string) => {
    if (!confirm("今月の勤怠実績をすべて承認してもよろしいですか？")) return;
    
    setProcessingId(staffId);
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const res = await fetch("/api/attendance/monthly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, month: monthStr, action: "APPROVE" })
      });
      
      if (res.ok) {
        fetchData();
        setSelectedStaff(null);
      } else {
        alert("承認処理に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemandMonth = async (staffId: string) => {
    const reason = prompt("差し戻しの理由を入力してください：");
    if (reason === null) return;
    
    setProcessingId(staffId);
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const res = await fetch("/api/attendance/monthly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, month: monthStr, action: "REMAND" })
      });
      
      if (res.ok) {
        fetchData();
        setSelectedStaff(null);
      } else {
        alert("差戻し処理に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setProcessingId(null);
    }
  };

  const fetchDailyDetails = async (staffId: string) => {
    setLoadingDetails(true);
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const res = await fetch(`/api/attendance/bulk?staffId=${staffId}&month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setDailyDetails(data);
      }
    } catch (error) {
      console.error("Failed to fetch daily details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openDetail = (staff: any) => {
    setSelectedStaff(staff);
    fetchDailyDetails(staff.staffId);
  };

  const handleExportCSV = (staff: any) => {
    const monthStr = format(currentMonth, "yyyy-MM");
    window.location.href = `/api/attendance/summary/export?staffId=${staff.staffId}&month=${monthStr}`;
  };

  if (!isAdmin || !hasAttendanceFeature) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
        <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-800">アクセス権限がないか、機能が有効ではありません</h2>
        <p className="text-slate-500 mt-2 font-bold">管理者権限および勤怠管理機能の有効化が必要です。</p>
      </div>
    );
  }

  const filteredData = summaryData.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.clientName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileCheck className="text-indigo-600" size={36} />
            勤怠集計・締め
          </h1>
          <p className="text-slate-500 mt-2 font-bold">月間の勤務実績を確認し、一括承認とレポート出力を行います。</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <button 
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-indigo-600"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="px-6 py-2 text-xl font-black text-slate-800 min-w-[160px] text-center">
            {format(currentMonth, "yyyy年 M月", { locale: ja })}
          </div>
          <button 
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-indigo-600"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* 検索・統計カード */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-2 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center px-6">
           <Search className="text-slate-300 mr-4" size={20} />
           <input 
             type="text" 
             placeholder="従業員名、クライアントで検索..."
             className="w-full py-4 text-lg font-bold text-slate-700 outline-none placeholder:text-slate-300"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex items-center justify-between text-white">
           <div>
             <div className="text-[10px] font-black uppercase opacity-70 tracking-widest">対象人数</div>
             <div className="text-3xl font-black">{filteredData.length} <span className="text-sm">名</span></div>
           </div>
           <Users size={32} className="opacity-20" />
        </div>
      </div>

      {/* 集計テーブル */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-r border-slate-100">従業員 / 客先</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-r border-slate-100 text-center">出勤日数</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-r border-slate-100 text-center">合計時間</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-r border-slate-100 text-center">時間判定</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-r border-slate-100 text-center">承認ステータス</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-black animate-pulse">データを集計中...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400 font-bold">
                    対象のデータが見つかりません。
                  </td>
                </tr>
              ) : filteredData.map(staff => (
                <tr key={staff.staffId} className="group hover:bg-slate-50/50 transition-all">
                  <td className="p-6 border-r border-slate-100">
                    <div className="font-black text-slate-800 text-lg">{staff.name}</div>
                    <div className="text-xs font-bold text-slate-400 mt-0.5">{staff.clientName || "客先未設定"}</div>
                  </td>
                  <td className="p-6 border-r border-slate-100 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-800">{staff.daysWorked}</span>
                        <span className="text-xs font-bold text-slate-400">/ {staff.daysShifted}</span>
                        <span className="text-[10px] font-black text-slate-400 ml-0.5">日</span>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">出勤実績</div>
                    </div>
                  </td>
                  <td className="p-6 border-r border-slate-100 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-3xl font-black text-indigo-600">{staff.totalHours}</span>
                        <span className="text-[10px] font-black text-indigo-400 ml-0.5">時間</span>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">合計稼働</div>
                    </div>
                  </td>
                  <td className="p-6 border-r border-slate-100 text-center">
                    <div className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-2xl text-[10px] font-black tracking-widest border shadow-sm",
                      staff.hourStatus === "NORMAL" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      staff.hourStatus === "OVERTIME" ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {staff.hourStatus === "NORMAL" ? "適正範囲" :
                       staff.hourStatus === "OVERTIME" ? "超過" : "不足"}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 mt-2">
                       目安: {staff.minHours}h - {staff.maxHours}h
                    </div>
                  </td>
                  <td className="p-6 border-r border-slate-100 text-center">
                    <div className={cn(
                      "flex items-center justify-center gap-1.5",
                      staff.approvalStatus === "APPROVED" ? "text-emerald-500" :
                      staff.approvalStatus === "SUBMITTED" ? "text-indigo-600" :
                      staff.approvalStatus === "REMANDED" ? "text-rose-500" :
                      "text-slate-400"
                    )}>
                      {staff.approvalStatus === "APPROVED" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                      <span className="text-xs font-black tracking-widest">
                        {staff.approvalStatus === "APPROVED" ? "承認済み" :
                         staff.approvalStatus === "SUBMITTED" ? "提出済み" :
                         staff.approvalStatus === "REMANDED" ? "差戻し中" : "未承認"}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                         onClick={() => handleExportCSV(staff)}
                         disabled={staff.approvalStatus !== "APPROVED"}
                         className={cn(
                           "p-4 rounded-2xl transition-all flex items-center gap-2 font-black text-xs",
                           staff.approvalStatus === "APPROVED" 
                             ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                             : "bg-slate-50 text-slate-200 cursor-not-allowed"
                         )}
                      >
                        <Download size={16} />
                        CSV出力
                      </button>
                      
                      {staff.approvalStatus !== "APPROVED" ? (
                        <button 
                          onClick={() => handleApproveMonth(staff.staffId)}
                          disabled={processingId === staff.staffId}
                          className="bg-indigo-600 text-white p-4 px-6 rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                          {processingId === staff.staffId ? (
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                             <FileCheck size={16} />
                          )}
                          今月分を承認
                        </button>
                      ) : (
                        <button className="bg-emerald-50 text-emerald-600 p-4 px-6 rounded-2xl font-black text-xs border border-emerald-100 flex items-center gap-2 cursor-default">
                          <CheckCircle2 size={16} />
                          完了
                        </button>
                      )}
                      
                      <button 
                        onClick={() => openDetail(staff)}
                        className="p-3 text-slate-400 hover:text-indigo-600 transition-all"
                      >
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* モーダルヘッダー */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 font-black text-xl">
                  {selectedStaff.name.substring(0, 1)}
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900">{selectedStaff.name} <span className="text-sm font-bold text-slate-400 ml-2">勤務詳細確認</span></h2>
                   <p className="text-slate-500 font-bold text-sm tracking-tight">{format(currentMonth, "yyyy年 M月", { locale: ja })} ・ {selectedStaff.clientName || "客先未設定"}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-4 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all">
                <X size={24} />
              </button>
            </div>

            {/* モーダルコンテンツ (テーブル) */}
            <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 text-[10px] font-black uppercase text-slate-500 border-r border-slate-100 w-24">日付</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-500 border-r border-slate-100 text-center">予定</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-500 border-r border-slate-100 text-center">実績 (出退勤)</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-500 border-r border-slate-100 text-center">休憩</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-500 border-r border-slate-100">作業報告</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-center w-24">状態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingDetails ? (
                       <tr><td colSpan={6} className="p-20 text-center">
                         <div className="flex flex-col items-center gap-2">
                           <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                           <p className="text-slate-400 font-black animate-pulse">詳細を読み込み中...</p>
                         </div>
                       </td></tr>
                    ) : dailyDetails.length === 0 ? (
                       <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold">データが見つかりません。</td></tr>
                    ) : dailyDetails.map((day: any) => {
                       const record = day.record;
                       const shift = day.active;
                       return (
                        <tr key={day.date} className="hover:bg-slate-50/30 transition-all">
                          <td className="p-4 border-r border-slate-100">
                             <div className="font-black text-slate-700">{format(new Date(day.date), "d日(E)", { locale: ja })}</div>
                          </td>
                          <td className="p-4 border-r border-slate-100 text-center">
                             {shift ? (
                               <div className="text-[10px] font-black text-slate-400 bg-slate-50 rounded px-2 py-1 inline-block">
                                 {format(new Date(shift.startTime), "HH:mm")} - {format(new Date(shift.endTime), "HH:mm")}
                               </div>
                             ) : "-"}
                          </td>
                          <td className="p-4 border-r border-slate-100 text-center">
                             {record?.clockIn ? (
                               <div className="flex flex-col items-center">
                                 <span className="text-sm font-black text-indigo-600">
                                   {format(new Date(record.clockIn), "HH:mm")} - {record.clockOut ? format(new Date(record.clockOut), "HH:mm") : "??"}
                                 </span>
                                 {record.hasDiscrepancy && (
                                   <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1 rounded mt-0.5 tracking-tighter">差異あり</span>
                                 )}
                               </div>
                             ) : <span className="text-slate-300 font-bold">--:--</span>}
                          </td>
                          <td className="p-4 border-r border-slate-100 text-center">
                             <div className="text-xs font-bold text-slate-500">{record?.breakMinutes ?? "-"} <span className="text-[9px] opacity-40">m</span></div>
                          </td>
                          <td className="p-4 border-r border-slate-100">
                             <div className="flex items-start gap-2 max-w-[300px]">
                               {record?.workReport?.content ? (
                                 <>
                                   <MessageSquare size={14} className="text-indigo-300 mt-1 flex-shrink-0" />
                                   <p className="text-xs text-slate-600 leading-normal line-clamp-2" title={record.workReport.content}>
                                     {record.workReport.content}
                                   </p>
                                 </>
                               ) : "-"}
                             </div>
                          </td>
                          <td className="p-4 text-center">
                             <div className={cn(
                               "text-[9px] font-black uppercase tracking-widest",
                               record?.status === "APPROVED" ? "text-emerald-500" :
                               record?.status === "SUBMITTED" ? "text-indigo-500" :
                               record?.status === "REMANDED" ? "text-rose-500" :
                               "text-slate-400"
                             )}>
                               {record?.status === "APPROVED" ? "完了" :
                                record?.status === "SUBMITTED" ? "提出済" :
                                record?.status === "REMANDED" ? "差戻し" :
                                record?.status === "STAMPED" ? "作成中" : "未着手"}
                             </div>
                          </td>
                        </tr>
                       )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="text-center">
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">合計実働時間</div>
                      <div className="text-2xl font-black text-indigo-600 leading-tight">{selectedStaff.totalHours} <span className="text-sm">時間</span></div>
                   </div>
                   <div className="h-8 w-px bg-slate-200"></div>
                   <div className="text-center">
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">出勤日数</div>
                      <div className="text-2xl font-black text-slate-800 leading-tight">{selectedStaff.daysWorked} <span className="text-xs opacity-60">/ {selectedStaff.daysShifted}日</span></div>
                   </div>
                </div>

               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleRemandMonth(selectedStaff.staffId)}
                    disabled={processingId === selectedStaff.staffId}
                    className="p-4 px-8 rounded-2xl font-black text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                     <AlertCircle size={16} />
                     全体を差戻し
                  </button>
                  <button 
                    onClick={() => handleApproveMonth(selectedStaff.staffId)}
                    disabled={processingId === selectedStaff.staffId || selectedStaff.approvalStatus === "APPROVED"}
                    className={cn(
                      "p-4 px-10 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2",
                      selectedStaff.approvalStatus === "APPROVED" 
                        ? "bg-slate-50 text-slate-300 shadow-none cursor-default" 
                        : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5"
                    )}
                  >
                     {processingId === selectedStaff.staffId ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     ) : (
                        <FileCheck size={16} />
                     )}
                     今月分を一括承認
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="font-black text-amber-900">月次締めのヒント</h4>
          <p className="text-amber-700 text-sm mt-1 leading-relaxed">
            全従業員の実績報告が「提出済み」になっていることを確認してから、一括承認を行ってください。
            承認が完了すると、給与計算用のCSVデータを出力できるようになります。
            差戻しが必要な場合は、右側の矢印ボタンから各日の詳細を確認してください。
          </p>
        </div>
      </div>
    </div>
  );
}
