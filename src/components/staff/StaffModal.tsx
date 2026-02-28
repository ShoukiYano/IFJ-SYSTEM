"use client";

import React, { useState, useEffect } from "react";
import { X, Save, User, Calendar, RefreshCcw } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff?: any; // If provided, we are in edit mode
}

export default function StaffModal({ isOpen, onClose, onSuccess, staff }: StaffModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "PROPER" as "PROPER" | "BP",
    area: "KANTO" as "KANSAI" | "KANTO",
    manager: "",
    clientId: "",
    unitPrice: 0,
    minHours: 140,
    maxHours: 180,
    contractStartDate: new Date().toISOString().split("-").slice(0, 2).join("-"), // Default to current YYYY-MM
    renewalInterval: 3,
    paymentTerms: "",
    settlementUnit: 15,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          console.error("Expected array for clients, got:", data);
          setClients([]);
        }
      })
      .catch((err) => {
        console.error("Fetch clients error:", err);
        setClients([]);
      });
  }, []);

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || "",
        type: staff.type || "PROPER",
        area: staff.area || "KANTO",
        manager: staff.manager || "",
        clientId: staff.clientId || "",
        unitPrice: Number(staff.unitPrice) || 0,
        minHours: staff.minHours || 140,
        maxHours: staff.maxHours || 180,
        contractStartDate: staff.contractStartDate ? new Date(staff.contractStartDate).toISOString().split("-").slice(0, 2).join("-") : "",
        renewalInterval: staff.renewalInterval || 3,
        paymentTerms: staff.paymentTerms || "",
        settlementUnit: staff.settlementUnit || 15,
      });
    } else {
      setFormData({
        name: "",
        type: "PROPER",
        area: "KANTO",
        manager: "",
        clientId: "",
        unitPrice: 0,
        minHours: 140,
        maxHours: 180,
        contractStartDate: new Date().toISOString().split("-").slice(0, 2).join("-"),
        renewalInterval: 3,
        paymentTerms: "",
        settlementUnit: 15,
      });
    }
  }, [staff, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = staff ? `/api/staff/${staff.id}` : "/api/staff";
      const method = staff ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          contractStartDate: formData.contractStartDate ? `${formData.contractStartDate}-01T00:00:00Z` : null,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`保存に失敗しました: ${errorData.error}`);
      }
    } catch (err) {
      alert("通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <User className="text-blue-600" size={24} />
            {staff ? "要員情報の編集" : "要員の新規登録"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="staff-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">名前</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">区分</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="PROPER">プロパー</option>
                  <option value="BP">BP (ビジネスパートナー)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">エリア</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value as any })}
                >
                  <option value="KANTO">関東</option>
                  <option value="KANSAI">関西</option>
                  <option value="NAGOYA">名古屋</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">担当者 (Manager)</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">支払いサイト (例: 15日, 45日)</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="例: 45日サイト"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">所属取引先</label>
              <select
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                <option value="">選択してください</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">単価 (円)</label>
              <input
                type="number"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">精算幅 (下限h)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.minHours}
                  onChange={(e) => setFormData({ ...formData, minHours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">精算幅 (上限h)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.maxHours}
                  onChange={(e) => setFormData({ ...formData, maxHours: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">精算単位 (分)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="15"
                  value={formData.settlementUnit}
                  onChange={(e) => setFormData({ ...formData, settlementUnit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-4">
              <h3 className="text-sm font-black text-blue-800 flex items-center gap-2">
                <Calendar size={16} /> 契約更新設定
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-blue-600 uppercase mb-1.5 block">契約開始年月</label>
                  <input
                    type="month"
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.contractStartDate}
                    onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-600 uppercase mb-1.5 block flex items-center gap-1">
                    <RefreshCcw size={10} /> 更新間隔
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.renewalInterval}
                    onChange={(e) => setFormData({ ...formData, renewalInterval: parseInt(e.target.value) })}
                  >
                    <option value={1}>毎月</option>
                    <option value={2}>2ヶ月毎</option>
                    <option value={3}>3ヶ月毎</option>
                    <option value={6}>6ヶ月毎</option>
                    <option value={12}>1年毎</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            form="staff-form"
            disabled={isSubmitting}
            className="px-8 py-2.5 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} /> {staff ? "更新する" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}
