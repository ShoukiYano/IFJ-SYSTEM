"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, User, Building2, Calendar, RefreshCcw, FileUp, FileDown } from "lucide-react";
import StaffModal from "@/components/staff/StaffModal";
import StaffImportModal from "@/components/staff/StaffImportModal";
import { formatCurrency } from "@/lib/utils";

export default function StaffListPage() {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const fetchStaffs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaffs(data);
      }
    } catch (err) {
      console.error("Fetch staff error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("この要員を削除してもよろしいですか？")) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchStaffs();
      }
    } catch (err) {
      alert("削除に失敗しました");
    }
  };

  const filteredStaffs = staffs.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">要員管理</h1>
            <p className="text-slate-500 mt-1">SES要員や自社要員の情報を管理します。</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
            >
              <FileUp size={20} />
              Excelインポート
            </button>
            <button 
              onClick={() => {
                setEditingStaff(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              <Plus size={20} />
              新規登録
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="名前や取引先で検索..."
                className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">区分</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">エリア</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">担当者</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">名前</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">取引先</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">単価</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">精算幅</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">契約更新</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">読み込み中...</td>
                  </tr>
                ) : filteredStaffs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">該当する要員が見つかりません。</td>
                  </tr>
                ) : (
                  filteredStaffs.map((staff, index) => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">{index + 1}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                          staff.type === 'PROPER' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {staff.type === 'PROPER' ? 'プロパー' : 'BP'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          staff.area === 'KANSAI' ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'
                        }`}>
                          {staff.area === 'KANSAI' ? '関西' : '関東'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{staff.manager || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{staff.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 size={14} className="text-slate-400" />
                          {staff.client?.name || "未設定"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right tabular-nums">
                        {formatCurrency(Number(staff.unitPrice))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {staff.minHours || "-"}-{staff.maxHours || "-"}h
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" /> {staff.contractStartMonth}月開始
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {staff.renewalInterval === 1 ? '毎月更新' : `${staff.renewalInterval}ヶ月毎`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingStaff(staff);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="編集"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(staff.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="削除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StaffModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStaffs}
        staff={editingStaff}
      />
      <StaffImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchStaffs}
      />
    </div>
  );
}
