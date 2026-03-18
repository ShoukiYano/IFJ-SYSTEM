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
  const [isImpersonating, setIsImpersonating] = useState(false);
  
  // 編集中のシフト（一時保存用）
  const [pendingShifts, setPendingShifts] = useState<any[]>([]);
  const [shiftRequests, setShiftRequests] = useState<any[]>([]);
  const [myPendingRequests, setMyPendingRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [isBulkRegister, setIsBulkRegister] = useState(false);

  // 編集モーダル用
  const [editingCell, setEditingCell] = useState<{ staffId: string; date: Date; shift: any } | null>(null);
  
  // 申請モーダル用 (一般ユーザー)
  const [requestingCell, setRequestingCell] = useState<{ date: Date; currentShift: any } | null>(null);

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
            id: (session.user as any).staffId || "current-user",
            name: session.user.name || "自分",
          }]);

          // 一般ユーザー：自分の申請一覧も取得
          const reqRes = await fetch("/api/shifts/requests?status=PENDING");
          if (reqRes.ok) {
            const reqData = await reqRes.json();
            setMyPendingRequests(reqData);
          }
        }
      }
      setPendingShifts([]); // クリア

      if (isAdmin) {
        // 管理者：全申請の一覧を取得
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
    if (staff) {
      setBulkEditStaff(staff);
      if (!isAdmin) {
        setIsBulkRegister(true);
      }
    }
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

  const handleBulkRequestShift = async (startTime: string, endTime: string, reason: string) => {
    if (!bulkEditStaff) return;
    setSaving(true);
    try {
      const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
      });
      
      const weekdays = days.filter(day => !isWeekend(day));
      const requests = weekdays.map(day => {
        const baseDate = new Date(day);
        const startParts = startTime.split(":");
        const endParts = endTime.split(":");
        
        return {
          targetDate: day.toISOString(),
          requestStartTime: new Date(new Date(baseDate).setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0)).toISOString(),
          requestEndTime: new Date(new Date(baseDate).setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0)).toISOString(),
          reason
        };
      });

      const res = await fetch("/api/shifts/requests/bulk", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ requests })
      });

      if (res.ok) {
        alert("一括申請を送信しました。");
        fetchData();
        setBulkEditStaff(null);
      } else {
        const error = await res.json();
        alert(error.error || "一括申請に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (staffId: string, date: Date, currentShift: any) => {
    if (!isAdmin) return; // 一般ユーザーは編集不可
    setEditingCell({ staffId, date, shift: currentShift });
  };

  const handleUpdateShift = async (startTime: string, endTime: string) => {
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

    if (isAdmin) {
      setPendingShifts(prev => [
        ...prev.filter(ps => !(ps.staffId === editingCell.staffId && format(new Date(ps.date), "yyyy-MM-dd") === format(editingCell.date, "yyyy-MM-dd"))),
        newShift
      ]);
      setEditingCell(null);
    } else {
      // 一般ユーザー：直接保存
      setSaving(true);
      try {
        const res = await fetch("/api/shifts/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shifts: [newShift] })
        });
        if (res.ok) {
          alert("登録しました");
          fetchData();
          setEditingCell(null);
        } else {
          const err = await res.json();
          alert(err.error || "登録に失敗しました");
        }
      } catch (e) {
        alert("通信エラーが発生しました");
      } finally {
        setSaving(false);
      }
    }
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

  const handleRequestShift = async (startTime: string, endTime: string, reason: string) => {
    if (!requestingCell) return;
    setSaving(true);
    try {
      const res = await fetch("/api/shifts/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: requestingCell.date.toISOString(),
          requestStartTime: new Date(new Date(requestingCell.date).setHours(parseInt(startTime.split(":")[0]), parseInt(startTime.split(":")[1]), 0, 0)).toISOString(),
          requestEndTime: new Date(new Date(requestingCell.date).setHours(parseInt(endTime.split(":")[0]), parseInt(endTime.split(":")[1]), 0, 0)).toISOString(),
          reason
        })
      });
      if (res.ok) {
        alert("申請を送信しました。管理者の承認をお待ちください。");
        fetchData();
        setRequestingCell(null);
      } else {
        const error = await res.json();
        alert(error.error || "申請に失敗しました");
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
                      {!isAdmin ? (
                        <button 
                          onClick={() => handleSetDefault(staff.id)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-all flex items-center gap-1.5 whitespace-nowrap ml-4"
                          title="平日のシフトを一括で登録"
                        >
                          <Copy size={12} />
                          一括登録
                        </button>
                      ) : (
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
                    const shift = shifts.find(s => s.staffId === staff.id && format(new Date(s.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
                    const pending = pendingShifts.find(ps => ps.staffId === staff.id && format(new Date(ps.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
                    const myReq = !isAdmin ? myPendingRequests.find(r => format(new Date(r.targetDate), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")) : null;
                    const active = pending || shift || myReq;

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
                          } else {
                            // 自身の行であれば申請または直接登録
                            if (active && !active.isDeleted) {
                              setRequestingCell({ date: day, currentShift: active });
                            } else {
                              // 新規登録：編集モーダルを流用して直接保存を許可する
                              setEditingCell({ staffId: staff.id, date: day, shift: null });
                            }
                          }
                        }}
                      >
                        {active && !active.isDeleted ? (
                          <div className={cn(
                            "p-2 rounded-xl text-[10px] font-black tracking-tighter shadow-sm transition-all animate-in zoom-in-90 cursor-pointer",
                            pending ? "bg-indigo-600 text-white" : 
                            myReq ? "bg-amber-100 text-amber-700 border-2 border-amber-200" :
                            "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}>
                            {format(new Date(active.startTime || active.requestStartTime), "HH:mm")}
                            <div className={cn("my-0.5 border-t", pending ? "border-white/20" : "border-slate-200")}></div>
                            {format(new Date(active.endTime || active.requestEndTime), "HH:mm")}
                            {myReq && <div className="mt-1 text-[8px] opacity-70">申請中</div>}
                          </div>
                        ) : (
                          <div className={cn("size-full min-h-[48px] flex items-center justify-center text-slate-200 group-hover:text-slate-300 transition-all cursor-copy hover:bg-indigo-50 rounded-xl")}>
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

      {(editingCell && (isAdmin || (!isAdmin && !editingCell.shift))) && (
        <EditModal 
          isOpen={!!editingCell}
          onClose={() => setEditingCell(null)}
          onSave={handleUpdateShift}
          onDelete={isAdmin ? handleDeleteShift : undefined} // 一般ユーザーは直接削除不可
          staffName={staffs.find(s => s.id === editingCell.staffId)?.name}
          date={editingCell.date}
          currentShift={editingCell.shift}
          isEmployeeDirectRegister={!isAdmin}
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

      {isBulkRegister && bulkEditStaff && (
        <BulkEditModal
            isOpen={true}
            onClose={() => {
                setIsBulkRegister(false);
                setBulkEditStaff(null);
            }}
            onSave={async (start: string, end: string) => {
                // 一般ユーザー用の一括登録処理
                setSaving(true);
                try {
                    const days = eachDayOfInterval({
                        start: startOfMonth(currentMonth),
                        end: endOfMonth(currentMonth)
                    });
                    const startParts = start.split(":");
                    const endParts = end.split(":");
                    
                    const newShifts = days
                        .filter(day => !isWeekend(day))
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

                    const res = await fetch("/api/shifts/bulk", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ shifts: newShifts })
                    });
                    if (res.ok) {
                        alert("一括登録が完了しました。既存シフトのある日はスキップされました。");
                        fetchData();
                        setIsBulkRegister(false);
                        setBulkEditStaff(null);
                    } else {
                        const err = await res.json();
                        alert(err.error || "登録に失敗しました");
                    }
                } catch (e) {
                    alert("通信エラーが発生しました");
                } finally {
                    setSaving(false);
                }
            }}
            staffName={bulkEditStaff.name}
            month={format(currentMonth, "yyyy年 M月")}
            isEmployee={true}
        />
      )}


      {requestingCell && !isAdmin && (
        <RequestModal
          isOpen={!!requestingCell}
          onClose={() => setRequestingCell(null)}
          onSave={handleRequestShift}
          date={requestingCell.date}
          currentShift={requestingCell.currentShift}
        />
      )}
    </div>
  );
}

function RequestModal({ isOpen, onClose, onSave, date, currentShift }: any) {
    const [start, setStart] = useState(currentShift ? format(new Date(currentShift.startTime || currentShift.requestStartTime), "HH:mm") : "09:00");
    const [end, setEnd] = useState(currentShift ? format(new Date(currentShift.endTime || currentShift.requestEndTime), "HH:mm") : "18:00");
    const [reason, setReason] = useState(currentShift?.reason || "");

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-8 space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">シフトの変更申請</h3>
                    <p className="border-l-4 border-amber-400 pl-3 text-amber-700 text-xs font-bold bg-amber-50 py-2 rounded-r-lg">
                        既存のシフトを変更・削除する場合は申請が必要です。
                    </p>
                    <p className="text-slate-500 text-sm font-bold mt-2">{format(date, "yyyy/MM/dd(E)", { locale: ja })}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">希望開始時間</label>
                        <input 
                            type="time" 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-lg"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">希望終了時間</label>
                        <input 
                            type="time" 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-lg"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">申請理由</label>
                    <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm min-h-[100px] resize-none focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        placeholder="例：私用のため、10時から勤務希望です"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button 
                        onClick={() => onSave(start, end, reason)}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        変更申請を送信
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
    );
}

function EditModal({ isOpen, onClose, onSave, onDelete, staffName, date, currentShift, isEmployeeDirectRegister }: any) {
    const [start, setStart] = useState(currentShift ? format(new Date(currentShift.startTime), "HH:mm") : "09:00");
    const [end, setEnd] = useState(currentShift ? format(new Date(currentShift.endTime), "HH:mm") : "18:00");

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-8 space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">{isEmployeeDirectRegister ? "シフトの直接登録" : "シフトの編集"}</h3>
                    <p className="text-slate-500 text-sm font-bold">{staffName} | {format(date, "M/d(E)", { locale: ja })}</p>
                    {isEmployeeDirectRegister && (
                        <p className="text-indigo-600 text-xs font-bold bg-indigo-50 p-2 rounded-lg mt-2">
                           新規登録は申請不要で即時反映されます。
                        </p>
                    )}
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
                        {isEmployeeDirectRegister ? "登録する" : "反映する"}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        {onDelete && (
                            <button 
                                onClick={onDelete}
                                className="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all"
                            >
                                削除
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className={`py-4 bg-slate-50 text-slate-400 rounded-2xl font-black hover:bg-slate-100 transition-all ${!onDelete ? 'col-span-2' : ''}`}
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BulkEditModal({ isOpen, onClose, onSave, staffName, month, isEmployee }: any) {
    const [start, setStart] = useState("09:00");
    const [end, setEnd] = useState("18:00");

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200">
                <div className="space-y-2">
                    <div className="size-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                        <Copy size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{isEmployee ? "平日の一括登録" : "平日の一括登録（管理）"}</h3>
                    <p className="text-slate-500 font-bold">
                        {isEmployee ? "あなた" : staffName} の <span className="text-indigo-600">{month}</span> の平日に、以下の時間を一括で反映します。
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
function BulkRequestModal({ isOpen, onClose, onSave, staffName, month }: any) {
    const [start, setStart] = useState("09:00");
    const [end, setEnd] = useState("18:00");
    const [reason, setReason] = useState("");

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200">
                <div className="space-y-2">
                    <div className="size-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                        <Copy size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">平日の一括申請</h3>
                    <p className="text-slate-500 font-bold">
                        <span className="text-indigo-600">{month}</span> の平日に、以下の時間を一括で申請します。
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">希望開始時間</label>
                        <input 
                            type="time" 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">希望終了時間</label>
                        <input 
                            type="time" 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest tracking-widest">申請理由</label>
                    <textarea 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-sm min-h-[100px] resize-none focus:border-indigo-500 outline-none transition-all"
                        placeholder="例：標準的な勤務時間として一括申請します"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                        ※土日・祝日は除外されます。すでに登録されている平日のシフトがある場合、上書き申請となります。
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button 
                        onClick={() => onSave(start, end, reason)}
                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
                    >
                        平日に一括申請する
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
