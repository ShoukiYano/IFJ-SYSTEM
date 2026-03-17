"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, AlertCircle, CheckCircle2, Loader2, ArrowRight, Calendar, FileText } from "lucide-react";
import { format, isSunday, isSaturday } from "date-fns";
import { ja } from "date-fns/locale";

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [data, setData] = useState<any>(null);
  const [weeklyShifts, setWeeklyShifts] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const init = async () => {
      await fetchStatus();
      await fetchWeeklyShifts();
      setLoading(false);
    };
    init();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/attendance/today");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchWeeklyShifts = async () => {
    try {
      const res = await fetch("/api/shifts/me");
      if (res.ok) {
        const json = await res.json();
        setWeeklyShifts(json);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePunch = async () => {
    setPunching(true);
    try {
      const res = await fetch("/api/attendance/punch", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        await fetchStatus();
      } else {
        alert(result.error || "打刻に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setPunching(false);
    }
  };

  const handleReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    const discrepancyReason = formData.get("discrepancyReason") as string;

    setPunching(true);
    try {
      const res = await fetch("/api/attendance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceRecordId: data.record.id,
          content,
          discrepancyReason
        })
      });
      if (res.ok) {
        alert("業務報告を提出しました");
        await fetchStatus();
      } else {
        const result = await res.json();
        alert(result.error || "提出に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setPunching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
          ステータスを確認中...
        </p>
      </div>
    );
  }

  const { record, shift, isPreviousReportMissing, lastWorkingDate } = data || {};
  const isClockedIn = record?.clockIn && !record?.clockOut;
  const isFinished = record?.clockOut;
  const needsReport = record?.status === "STAMPED" && isFinished;

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* タイム表示 */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200 border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-2">
          {format(currentTime, "yyyy年MM月dd日 (E)", { locale: ja })}
        </p>
        <div className="text-6xl font-black text-slate-900 tracking-tighter">
          {format(currentTime, "HH:mm")}
          <span className="text-2xl text-slate-300 ml-1 font-medium">{format(currentTime, "ss")}</span>
        </div>
      </div>

      {/* アラート: 前日の報告漏れ */}
      {isPreviousReportMissing && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm self-start">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <p className="font-black text-rose-900 leading-tight">前日の業務報告が未提出です</p>
            <p className="text-rose-700 text-sm">
              {lastWorkingDate ? format(new Date(lastWorkingDate), "M月d日") : "前回"}の報告を完了させるまで、本日の出勤打刻はできません。
            </p>
            <button className="flex items-center gap-1 text-rose-600 font-bold text-xs mt-2 hover:underline">
              報告画面へ移動する <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 打刻アクション */}
      <div className="grid grid-cols-1 gap-4">
        {!isFinished ? (
          <button
            onClick={handlePunch}
            disabled={punching || (isPreviousReportMissing && !isClockedIn)}
            className={`
              relative overflow-hidden h-32 rounded-[2rem] flex flex-col items-center justify-center transition-all
              ${isClockedIn 
                ? "bg-slate-900 text-white shadow-xl shadow-slate-300 active:scale-95" 
                : "bg-white text-slate-800 border-2 border-slate-200 hover:border-indigo-600 active:bg-slate-50 disabled:opacity-50 disabled:active:scale-100"
              }
            `}
          >
            {punching ? (
              <Loader2 className="animate-spin" size={32} />
            ) : (
              <>
                <Clock size={32} className={isClockedIn ? "text-indigo-400" : "text-slate-400"} />
                <span className="text-xl font-black mt-2">
                  {isClockedIn ? "退勤打刻" : "出勤打刻"}
                </span>
                {isClockedIn && record.clockIn && (
                  <span className="text-[10px] font-bold uppercase opacity-60 mt-1">
                    Clock-in: {format(new Date(record.clockIn), "HH:mm")}
                  </span>
                )}
              </>
            )}
          </button>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 h-32 rounded-[2rem] flex flex-col items-center justify-center text-emerald-800 animate-in zoom-in duration-300">
            <CheckCircle2 size={32} />
            <span className="text-xl font-black mt-2">本日の業務終了</span>
            <span className="text-[10px] font-bold uppercase opacity-60 mt-1">
               {format(new Date(record.clockIn), "HH:mm")} - {format(new Date(record.clockOut), "HH:mm")}
            </span>
          </div>
        )}
      </div>

      {/* 業務報告入力フォーム */}
      {needsReport && (
        <div className="bg-white rounded-[2rem] border-2 border-indigo-600 p-8 shadow-xl animate-in slide-in-from-bottom-8">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            業務実績の報告
          </h3>
          <form onSubmit={handleReport} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">業務内容</label>
              <textarea
                name="content"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium min-h-[120px]"
                placeholder="実施した作業内容を入力してください"
                defaultValue={record.workReport?.content}
              />
            </div>

            {record.hasDiscrepancy && (
              <div className="space-y-2">
                <label className="text-xs font-black text-rose-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <AlertCircle size={14} /> シフト差異の理由
                </label>
                <textarea
                  name="discrepancyReason"
                  required
                  className="w-full p-4 bg-rose-50/30 border border-rose-100 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all font-medium h-20"
                  placeholder="シフトと15分以上の差がある理由を入力してください"
                  defaultValue={record.workReport?.discrepancyReason}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={punching}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {punching ? <Loader2 className="animate-spin mx-auto" size={20} /> : "報告を提出する"}
            </button>
          </form>
        </div>
      )}

      {/* 提出済みメッセージ */}
      {isFinished && record.status === 'SUBMITTED' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 text-center shadow-sm">
          <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">報告提出済み</h3>
          <p className="text-slate-500 text-sm">本日の業務報告は正常に提出されました。<br/>お疲れ様でした！</p>
        </div>
      )}

      {/* 勤務スケジュール */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm overflow-hidden">
        <h3 className="text-slate-800 font-black flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-indigo-600" />
          勤務スケジュール
        </h3>
        
        {/* 当日シフト */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Today's Shift</p>
          {shift ? (
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-full bg-indigo-600/5 -skew-x-12 translate-x-12"></div>
              <div className="relative">
                <div className="text-2xl font-black text-slate-800 tracking-tighter">
                  {format(new Date(shift.startTime), "HH:mm")} - {format(new Date(shift.endTime), "HH:mm")}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{shift.type}</span>
                  {shift.location && <span className="text-[10px] font-medium text-slate-400">@ {shift.location}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
              本日のシフトはありません
            </div>
          )}
        </div>

        {/* 週間シフト */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Next 7 Days</p>
          {weeklyShifts.length > 0 ? (
            <div className="space-y-2">
              {weeklyShifts.filter((s: any) => format(new Date(s.date), "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center font-black">
                      <span className="text-[10px] text-slate-400 leading-none">{format(new Date(s.date), "M/d")}</span>
                      <span className={`text-xs ${isSunday(new Date(s.date)) ? 'text-rose-500' : isSaturday(new Date(s.date)) ? 'text-indigo-500' : 'text-slate-600'}`}>
                        {format(new Date(s.date), "E", { locale: ja })}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700">
                        {format(new Date(s.startTime), "HH:mm")} - {format(new Date(s.endTime), "HH:mm")}
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 uppercase">{s.type}</div>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-300 text-xs italic">
              以降の予定は見つかりませんでした
            </div>
          )}
        </div>
      </div>

      {/* シフト変更申請ボタン */}
      <button className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 mb-10">
        <Clock size={16} />
        シフト変更を申請する
      </button>

      {/* 場所情報 (デモ) */}
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <MapPin size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          GPS Position: Standard (Tokyo Office)
        </span>
      </div>
    </div>
  );
}
