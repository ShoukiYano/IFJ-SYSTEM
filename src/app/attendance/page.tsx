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
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showShiftRequestModal, setShowShiftRequestModal] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      await fetchStatus();
      await fetchWeeklyShifts();
      await fetchRequests();
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

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/shifts/requests");
      if (res.ok) {
        const json = await res.json();
        setRequests(json);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePunch = async (extraData: any = {}) => {
    setPunching(true);
    try {
      const res = await fetch("/api/attendance/punch", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           attendanceRecordId: data?.record?.id,
           ...extraData
        })
      });
      const result = await res.json();
      if (res.ok) {
        setShowCheckOutModal(false);
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

  const onPunchClick = () => {
    if (isClockedIn) {
      setShowCheckOutModal(true);
    } else {
      handlePunch();
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
            onClick={onPunchClick}
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


      {/* 勤務スケジュール */}
      <div id="shifts" className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm overflow-hidden">
        <h3 className="text-slate-800 font-black flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-indigo-600" />
          勤務スケジュール
        </h3>
        
        {/* 当日シフト */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Today&apos;s Shift</p>
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
      <button 
        onClick={() => setShowShiftRequestModal(true)}
        className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
      >
        <Clock size={16} />
        シフト変更を申請する
      </button>

      {/* 申請状況一覧 (簡易) */}
      {requests.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recent Requests</p>
          <div className="space-y-2">
            {requests.map((r: any) => (
              <div key={r.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-700">
                    {format(new Date(r.targetDate), "M/d")} : {format(new Date(r.requestStartTime), "HH:mm")} - {format(new Date(r.requestEndTime), "HH:mm")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{r.reason}</div>
                </div>
                <div className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase ${
                  r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                  r.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {r.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 場所情報 (デモ) */}
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <MapPin size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          GPS Position: Standard (Tokyo Office)
        </span>
      </div>

      {showCheckOutModal && (
        <CheckOutModal 
          isOpen={showCheckOutModal}
          onClose={() => setShowCheckOutModal(false)}
          onConfirm={handlePunch}
          record={record}
          shift={shift}
          currentTime={currentTime}
          loading={punching}
        />
      )}

      {showShiftRequestModal && (
        <ShiftRequestModal
          isOpen={showShiftRequestModal}
          onClose={() => setShowShiftRequestModal(false)}
          onSuccess={() => {
            setShowShiftRequestModal(false);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}

function ShiftRequestModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/shifts/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: date,
          requestStartTime: `${date}T${startTime}:00`,
          requestEndTime: `${date}T${endTime}:00`,
          reason
        })
      });
      if (res.ok) {
        alert("シフト変更を申請しました");
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "申請に失敗しました");
      }
    } catch (err) {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 my-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900">シフト変更の申請</h3>
            <p className="text-slate-500 font-bold text-sm">希望する日時と理由を入力してください</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowRight className="rotate-180" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">対象日</label>
            <input 
              type="date" 
              required
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">希望開始時間</label>
              <input 
                type="time" 
                required
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">希望終了時間</label>
              <input 
                type="time" 
                required
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">申請理由</label>
            <textarea 
              required
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium focus:border-indigo-500 outline-none transition-all h-32"
              placeholder="例: 客先の要望により1時間前倒しで勤務するため"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "申請を提出する"}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full py-4 text-slate-400 font-black hover:text-slate-600 transition-all"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckOutModal({ onClose, onConfirm, record, shift, currentTime, loading }: any) {
  const [clockInTime, setClockInTime] = useState(format(new Date(record.clockIn), "HH:mm"));
  const [clockOutTime, setClockOutTime] = useState(format(currentTime, "HH:mm"));
  const [breakMinutes, setBreakMinutes] = useState(record.breakMinutes || 60);
  const [location, setLocation] = useState(record.location || "");
  const [note, setNote] = useState(record.note || "");
  const [content, setContent] = useState(record.workReport?.content || "");
  const [discrepancyReason, setDiscrepancyReason] = useState(record.workReport?.discrepancyReason || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 現在のレコードの日付をベースに、入力された時間を合成
    const baseDate = new Date(record.date);
    const [inH, inM] = clockInTime.split(":").map(Number);
    const [outH, outM] = clockOutTime.split(":").map(Number);

    const inDate = new Date(baseDate);
    inDate.setHours(inH, inM, 0, 0);

    const outDate = new Date(baseDate);
    outDate.setHours(outH, outM, 0, 0);
    // 終了時間が開始時間より前なら翌日とみなす
    if (outDate < inDate) {
      outDate.setDate(outDate.getDate() + 1);
    }

    onConfirm({
      clockIn: inDate.toISOString(),
      clockOut: outDate.toISOString(),
      breakMinutes,
      location,
      note,
      content,
      discrepancyReason
    });
  };

  // シフト差異判定（フロント側でも簡易チェック）
  const hasDiscrepancy = () => {
      if (!shift) return false;
      const [inH, inM] = clockInTime.split(":").map(Number);
      const [outH, outM] = clockOutTime.split(":").map(Number);
      const sIn = new Date(shift.startTime);
      const sOut = new Date(shift.endTime);
      
      const diffIn = Math.abs((inH * 60 + inM) - (sIn.getHours() * 60 + sIn.getMinutes()));
      const diffOut = Math.abs((outH * 60 + outM) - (sOut.getHours() * 60 + sOut.getMinutes()));
      return diffIn > 15 || diffOut > 15;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 my-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900">退勤打刻 - 稼働実績報告</h3>
            <p className="text-slate-500 font-bold text-sm">
              {format(new Date(record.date), "yyyy/MM/dd (E)", { locale: ja })} の稼働実績
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowRight className="rotate-180" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">開始時間</label>
              <input 
                type="time" 
                required
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">終了時間</label>
              <input 
                type="time" 
                required
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">休憩時間 (分)</label>
                <input 
                  type="number" 
                  required
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">稼働場所</label>
                <input 
                  type="text" 
                  placeholder="例: 客先常駐"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">業務内容</label>
            <textarea 
              required
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all h-24"
              placeholder="実施された具体的な作業内容を入力してください"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">備考・特記事項</label>
            <textarea 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium focus:border-indigo-500 outline-none transition-all h-20"
              placeholder="深夜作業、早出等の特記事項があれば入力してください"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {(hasDiscrepancy() || record.hasDiscrepancy) && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-xs font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <AlertCircle size={14} /> シフト差異の理由
                </label>
                <textarea 
                  required
                  className="w-full p-4 bg-rose-50/30 border-2 border-rose-100 rounded-2xl font-medium focus:border-rose-500 outline-none transition-all h-20"
                  placeholder="シフトと15分以上の差がある理由を入力してください"
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                />
              </div>
          )}

          {shift && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-indigo-700">
                  <Clock size={18} className="shrink-0 mt-0.5" />
                  <div className="text-xs font-bold leading-relaxed">
                      シフト予定: {format(new Date(shift.startTime), "HH:mm")} - {format(new Date(shift.endTime), "HH:mm")}
                  </div>
              </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "実績を報告して退勤する"}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full py-4 text-slate-400 font-black hover:text-slate-600 transition-all"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
