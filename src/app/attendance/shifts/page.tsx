"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Users, ChevronLeft, ChevronRight, Save, Loader2, Copy, Trash2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isWeekend, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ShiftManagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [staffs, setStaffs] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 編集中のシフト（一時保存用）
  const [pendingShifts, setPendingShifts] = useState<any[]>([]);
  const [shiftRequests, setShiftRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  // 編集モーダル用
  const [editingCell, setEditingCell] = useState<{ staffId: string; date: Date; shift: any } | null>(null);

  // 一括編集用
  const [bulkEditStaff, setBulkEditStaff] = useState<any | null>(null);

  const role = (session?.user as any)?.role;
  const isAdmin = role && role !== "TENANT_USER";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = `start=${startOfMonth(currentMonth).toISOString()}&end=${endOfMonth(currentMonth).toISOString()}`;
      const shRes = await fetch(`/api/shifts?${q}`);
      
      if (isAdmin) {
        const sRes = await fetch("/api/staff");
        if (sRes.ok && shRes.ok) {
          const sData = await sRes.json();
          const shData = await shRes.json();
          setStaffs(sData);
          setShifts(shData);
        }
      } else {
        // TENANT_USER: 自分自身の情報を staffs にセットする（テーブル構造を維持するため）
        if (shRes.ok && session?.user) {
          const shData = await shRes.json();
          setShifts(shData);
          setStaffs([{
            id: (session.user as any).staffId || "current-user", // API/Context 側で staffId が渡されている前提、なければ仮
            name: session.user.name || "自分",
          }]);
        }
      }
      setPendingShifts([]); // クリア

      if (isAdmin) {
        // 申請一覧も取得
        const reqRes = await fetch("/api/shifts/requests?status=PENDING");
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setShiftRequests(reqData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, isAdmin, session]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, fetchData]);

  const handleSetDefault = (staffId: string) => {
    const staff = staffs.find(s => s.id === staffId);
    if (staff) setBulkEditStaff(staff);
  };

  const handleBulkUpdateShift = (startTime: string, endTime: string) => {
    if (!bulkEditStaff) return;

    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });

    const startParts = startTime.split(":");
    const endParts = endTime.split(":");

    const newShifts = days
      .filter(day => !isWeekend(day)) // 平日のみ
      .map(day => {
        const baseDate = new Date(day);
        return {
          staffId: bulkEditStaff.id,
          date: day,
          startTime: new Date(new Date(baseDate).setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0)),
          endTime: new Date(new Date(baseDate).setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0)),
          type: "WORKING"
        };
      });

    setPendingShifts(prev => [
      ...prev.filter(ps => ps.staffId !== bulkEditStaff.id),
      ...newShifts
    ]);
    setBulkEditStaff(null);
  };

  const openEditModal = (staffId: string, date: Date, currentShift: any) => {
    if (!isAdmin) return; // 一般ユーザーは編集不可
    setEditingCell({ staffId, date, shift: currentShift });
  };

  const handleUpdateShift = (startTime: string, endTime: string) => {
    if (!editingCell) return;
    
    const baseDate = new Date(editingCell.date);
    const startParts = startTime.split(":");
    const endParts = endTime.split(":");
    
    const newShift = {
      staffId: editingCell.staffId,
      date: editingCell.date,
      startTime: new Date(new Date(baseDate).setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0)),
      endTime: new Date(new Date(baseDate).setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0)),
      type: "WORKING"
    };

    setPendingShifts(prev => [
      ...prev.filter(ps => !(ps.staffId === editingCell.staffId && format(new Date(ps.date), "yyyy-MM-dd") === format(editingCell.date, "yyyy-MM-dd"))),
      newShift
    ]);
    setEditingCell(null);
  };

  const handleDeleteShift = () => {
    if (!editingCell) return;

    setPendingShifts(prev => [
        ...prev.filter(ps => !(ps.staffId === editingCell.staffId && format(new Date(ps.date), "yyyy-MM-dd") === format(editingCell.date, "yyyy-MM-dd"))),
        { staffId: editingCell.staffId, date: editingCell.date, isDeleted: true } // 削除フラグ
    ]);
    setEditingCell(null);
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

  const handleProcessRequest = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    let rejectionReason = "";
    if (status === "REJECTED") {
      rejectionReason = prompt("却下する理由を入力してください") || "";
      if (!rejectionReason) return;
    }

    try {
      const res = await fetch(`/api/shifts/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason })
      });
      if (res.ok) {
        alert(status === "APPROVED" ? "承認しました" : "棄却しました");
        fetchData();
      } else {
        alert("処理に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    }
  };

  if (loading) return <div className="p-8 font-black text-slate-400 animate-pulse">シフトを取得中...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* ヘッダーセクション */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">シフト管理</h1>
          <p className="text-slate-500 font-medium">{isAdmin ? "要員ごとの勤務予定を一括で編成します" : "自身の勤務スケジュールを確認できます"}</p>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button 
              onClick={() => setShowRequests(!showRequests)}
              className={`px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 relative ${showRequests ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-100 text-slate-600 shadow-sm'}`}
            >
              <AlertCircle size={20} />
              申請を確認
              {shiftRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                  {shiftRequests.length}
                </span>
              )}
            </button>
          )}

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

          {isAdmin && (
            <button 
              onClick={handleSave}
              disabled={saving || pendingShifts.length === 0}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-30"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {pendingShifts.length > 0 ? `変更内容を保存 (${pendingShifts.length})` : "保存"}
            </button>
          )}
        </div>
      </div>

      {isAdmin && showRequests && (
        <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-amber-900 flex items-center gap-2">
              <AlertCircle className="text-amber-500" />
              シフト変更申請の確認
            </h3>
            <span className="text-xs font-bold text-amber-700">{shiftRequests.length} 件の未処理申請</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shiftRequests.length > 0 ? (
              shiftRequests.map((r: any) => (
                <div key={r.id} className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                      {r.staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-slate-800">{r.staff.name}</div>
                      <div className="text-[10px] text-amber-600 font-bold uppercase">{format(new Date(r.targetDate), "yyyy/MM/dd (E)", { locale: ja })}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Proposed</div>
                      <div className="text-lg font-black text-slate-900">
                        {format(new Date(r.requestStartTime), "HH:mm")} - {format(new Date(r.requestEndTime), "HH:mm")}
                      </div>
                    </div>
                    {r.currentStartTime && (
                      <div className="text-right">
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current</div>
                        <div className="text-xs font-bold text-slate-400 line-through">
                          {format(new Date(r.currentStartTime), "HH:mm")} - {format(new Date(r.currentEndTime), "HH:mm")}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-50">{r.reason}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleProcessRequest(r.id, "APPROVED")}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      承認する
                    </button>
                    <button 
                      onClick={() => handleProcessRequest(r.id, "REJECTED")}
                      className="flex-1 bg-white border border-slate-200 text-slate-400 py-3 rounded-2xl text-xs font-black hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
                    >
                      棄却
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-amber-600 bg-white/50 rounded-3xl border border-dashed border-amber-200">
                <p className="font-bold">現在、未処理のシフト変更申請はありません</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* メインテーブルコンテンツ（管理者・一般ユーザー共通） */}
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
                          {staff.name?.charAt(0) || "U"}
                        </div>
                        <span className="font-black text-slate-800 text-sm whitespace-nowrap">{staff.name}</span>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => handleSetDefault(staff.id)}
                          className="p-2 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                          title="平日に標準シフト(9-18)を適用"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(day => {
                    // 全員分表示するか自分分のみ表示するかは API 側で制御されている
                    const shift = shifts.find(s => s.staffId === staff.id && format(new Date(s.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
                    const pending = pendingShifts.find(ps => ps.staffId === staff.id && format(new Date(ps.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
                    const active = pending || shift;

                    return (
                      <td 
                        key={`${staff.id}-${day.toISOString()}`} 
                        className={`p-1 border-r border-slate-100 text-center ${isWeekend(day) ? 'bg-slate-100/10' : ''}`}
                        onClick={() => {
                          if (isAdmin) {
                            if (active?.isDeleted) {
                               openEditModal(staff.id, day, null);
                            } else {
                               openEditModal(staff.id, day, active);
                            }
                          }
                        }}
                      >
                        {active && !active.isDeleted ? (
                          <div className={`p-2 rounded-xl text-[10px] font-black tracking-tighter shadow-sm transition-all animate-in zoom-in-90 ${isAdmin ? 'cursor-pointer' : ''} ${pending ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {format(new Date(active.startTime), "HH:mm")}
                            <div className="border-t border-white/20 my-0.5"></div>
                            {format(new Date(active.endTime), "HH:mm")}
                          </div>
                        ) : (
                          <div className={cn("size-full min-h-[48px] flex items-center justify-center text-slate-200 group-hover:text-slate-300 transition-all", isAdmin && "cursor-copy hover:bg-indigo-50 rounded-xl")}>
                            {isAdmin ? "+" : ""}
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
      
      {isAdmin && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h4 className="font-black text-indigo-900">効率的なシフト入力</h4>
            <p className="text-indigo-700 text-sm mt-1">
              氏名横の <Copy size={14} className="inline mx-1" /> アイコンをクリックすると、**時間を指定して**その月の平日にシフトを一括入力できます。
              空欄の「+」をクリックして個別に登録することも可能です。青色のセルは未保存の変更を示します。
            </p>
          </div>
        </div>
      )}

      {editingCell && isAdmin && (
        <EditModal 
          isOpen={!!editingCell}
          onClose={() => setEditingCell(null)}
          onSave={handleUpdateShift}
          onDelete={handleDeleteShift}
          staffName={staffs.find(s => s.id === editingCell.staffId)?.name}
          date={editingCell.date}
          currentShift={editingCell.shift}
        />
      )}

      {bulkEditStaff && isAdmin && (
        <BulkEditModal
          isOpen={!!bulkEditStaff}
          onClose={() => setBulkEditStaff(null)}
          onSave={handleBulkUpdateShift}
          staffName={bulkEditStaff.name}
          month={format(currentMonth, "yyyy年 M月")}
        />
      )}
    </div>
  );
}

function EditModal({ isOpen, onClose, onSave, onDelete, staffName, date, currentShift }: any) {
    const [start, setStart] = useState(currentShift ? format(new Date(currentShift.startTime), "HH:mm") : "09:00");
    const [end, setEnd] = useState(currentShift ? format(new Date(currentShift.endTime), "HH:mm") : "18:00");

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-[2rem] w-full max-sm shadow-2xl p-8 space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">シフトの編集</h3>
                    <p className="text-slate-500 text-sm font-bold">{staffName} | {format(date, "M/d(E)", { locale: ja })}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">開始時間</label>
                        <input 
                            type="time" 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-lg"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">終了時間</label>
                        <input 
                            type="time" 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-lg"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button 
                        onClick={() => onSave(start, end)}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                    >
                        反映する
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={onDelete}
                            className="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all"
                        >
                            削除
                        </button>
                        <button 
                            onClick={onClose}
                            className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black hover:bg-slate-100 transition-all"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BulkEditModal({ isOpen, onClose, onSave, staffName, month }: any) {
    const [start, setStart] = useState("09:00");
    const [end, setEnd] = useState("18:00");

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200">
                <div className="space-y-2">
                    <div className="size-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                        <Copy size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">平日の一括登録</h3>
                    <p className="text-slate-500 font-bold">
                        {staffName} さんの <span className="text-indigo-600">{month}</span> の平日に、以下の時間を一括で反映します。
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">開始時間</label>
                        <input 
                            type="time" 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">終了時間</label>
                        <input 
                            type="time" 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                        ※土日・祝日は除外されます。すでに登録されている平日のシフトは、この時間で上書きされます。
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button 
                        onClick={() => onSave(start, end)}
                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
                    >
                        平日に一括反映する
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-4 text-slate-400 font-black hover:text-slate-600 transition-all"
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
}
