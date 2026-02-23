"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, UserPlus, Edit2, Calendar } from "lucide-react";

interface Assignee {
  id: string;
  name: string;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: any; // If provided, we are in edit mode
}

export default function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tel: "",
    address: "",
    department: "",
    manager: "",
    honorific: "御中",
    zipCode: "",
    closingDay: 31,
    paymentMonthOffset: 1,
    paymentDay: 31,
  });
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [newAssignee, setNewAssignee] = useState({
    name: "",
    contractStartDate: "",
    contractEndDate: "",
  });
  const [editingAssigneeId, setEditingAssigneeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        tel: client.tel || "",
        address: client.address || "",
        department: client.department || "",
        manager: client.manager || "",
        honorific: client.honorific || "御中",
        zipCode: client.zipCode || "",
        closingDay: client.closingDay || 31,
        paymentMonthOffset: client.paymentMonthOffset || 1,
        paymentDay: client.paymentDay || 31,
      });
      fetchAssignees(client.id);
    } else {
      setFormData({
        name: "",
        email: "",
        tel: "",
        address: "",
        department: "",
        manager: "",
        honorific: "御中",
        zipCode: "",
        closingDay: 31,
        paymentMonthOffset: 1,
        paymentDay: 31,
      });
      setAssignees([]);
    }
  }, [client, isOpen]);

  const fetchAssignees = async (clientId: string) => {
    try {
      const res = await fetch(`/api/assignees?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignees(data.map((a: any) => ({
          ...a,
          contractStartDate: a.contractStartDate ? a.contractStartDate.split('T')[0] : "",
          contractEndDate: a.contractEndDate ? a.contractEndDate.split('T')[0] : "",
        })));
      }
    } catch (err) {
      console.error("Fetch assignees error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
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

  const handleAddAssignee = async () => {
    if (!newAssignee.name.trim() || !client) return;
    try {
      const res = await fetch("/api/assignees", {
        method: "POST",
        body: JSON.stringify({ 
          name: newAssignee.name, 
          clientId: client.id,
          contractStartDate: newAssignee.contractStartDate || null,
          contractEndDate: newAssignee.contractEndDate || null,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNewAssignee({ name: "", contractStartDate: "", contractEndDate: "" });
        fetchAssignees(client.id);
      }
    } catch (err) {
      console.error("Add assignee error:", err);
    }
  };

  const handleUpdateAssignee = async (a: Assignee) => {
    try {
      const res = await fetch(`/api/assignees/${a.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: a.name,
          contractStartDate: a.contractStartDate || null,
          contractEndDate: a.contractEndDate || null,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setEditingAssigneeId(null);
        fetchAssignees(client!.id);
      }
    } catch (err) {
      console.error("Update assignee error:", err);
    }
  };

  const handleDeleteAssignee = async (id: string) => {
    if (!confirm("この該当者を削除してもよろしいですか？")) return;
    try {
      const res = await fetch(`/api/assignees/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAssignees(client!.id);
      }
    } catch (err) {
      console.error("Delete assignee error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-800">
            {client ? "取引先情報の編集" : "取引先の新規登録"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">会社名 / 屋号</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">敬称</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.honorific}
                  onChange={e => setFormData({ ...formData, honorific: e.target.value })}
                >
                  <option value="御中">御中 (法人)</option>
                  <option value="様">様 (個人/担当者)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">郵便番号</label>
                <input 
                  type="text" placeholder="123-4567"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.zipCode}
                  onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">住所</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">電話番号</label>
                <input 
                  type="tel"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.tel}
                  onChange={e => setFormData({ ...formData, tel: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">メールアドレス</label>
                <input 
                  type="email"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t">
                <div className="md:col-span-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" /> 請求周期・支払条件
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">請求書の支払期限を自動計算するための設定です。</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">締め日</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={formData.closingDay}
                    onChange={e => setFormData({ ...formData, closingDay: parseInt(e.target.value) })}
                  >
                    {[...Array(30)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}日</option>
                    ))}
                    <option value={31}>月末</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">支払期限 (月)</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={formData.paymentMonthOffset}
                    onChange={e => setFormData({ ...formData, paymentMonthOffset: parseInt(e.target.value) })}
                  >
                    <option value={0}>当月</option>
                    <option value={1}>翌月</option>
                    <option value={2}>翌々月</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">支払期限 (日)</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={formData.paymentDay}
                    onChange={e => setFormData({ ...formData, paymentDay: parseInt(e.target.value) })}
                  >
                    {[...Array(30)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}日</option>
                    ))}
                    <option value={31}>月末</option>
                  </select>
                </div>
              </div>
            </div>
          </form>

          {client && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" /> 該当者（Assignee）の管理
              </h3>
              <p className="text-xs text-slate-500 mb-4">請求書作成時に選択肢として表示される担当者と契約期間を登録します。</p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">氏名</label>
                    <input 
                      type="text" placeholder="例：山田 太郎"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                      value={newAssignee.name}
                      onChange={e => setNewAssignee({ ...newAssignee, name: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">契約開始</label>
                    <input 
                      type="date"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs"
                      value={newAssignee.contractStartDate}
                      onChange={e => setNewAssignee({ ...newAssignee, contractStartDate: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">契約終了</label>
                    <div className="flex gap-2">
                      <input 
                        type="date"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs"
                        value={newAssignee.contractEndDate}
                        onChange={e => setNewAssignee({ ...newAssignee, contractEndDate: e.target.value })}
                      />
                      <button 
                        onClick={handleAddAssignee}
                        className="p-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        title="追加"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {assignees.map(a => (
                  <div key={a.id} className="flex flex-col bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-center">
                      {editingAssigneeId === a.id ? (
                        <input 
                          type="text"
                          className="px-2 py-1 bg-blue-50 border border-blue-200 rounded outline-none text-sm font-bold flex-1 mr-4"
                          value={a.name}
                          onChange={e => {
                            const updated = assignees.map(item => item.id === a.id ? { ...item, name: e.target.value } : item);
                            setAssignees(updated);
                          }}
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-700">{a.name}</span>
                      )}
                      
                      <div className="flex items-center gap-1">
                        {editingAssigneeId === a.id ? (
                          <button 
                            onClick={() => handleUpdateAssignee(a)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="保存"
                          >
                            <Save size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setEditingAssigneeId(a.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 placeholder-opacity-100"
                            title="編集"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteAssignee(a.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">契約期間:</span>
                        {editingAssigneeId === a.id ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="date"
                              className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px]"
                              value={a.contractStartDate || ""}
                              onChange={e => {
                                const updated = assignees.map(item => item.id === a.id ? { ...item, contractStartDate: e.target.value } : item);
                                setAssignees(updated);
                              }}
                            />
                            <span className="text-[10px]">-</span>
                            <input 
                              type="date"
                              className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px]"
                              value={a.contractEndDate || ""}
                              onChange={e => {
                                const updated = assignees.map(item => item.id === a.id ? { ...item, contractEndDate: e.target.value } : item);
                                setAssignees(updated);
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">
                            {a.contractStartDate ? a.contractStartDate.replace(/-/g, '/') : '未設定'} - {a.contractEndDate ? a.contractEndDate.replace(/-/g, '/') : '未設定'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {assignees.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">該当者は登録されていません。</p>
                )}
              </div>
            </div>
          )}
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
            form="client-form"
            disabled={isSubmitting}
            className="px-8 py-2.5 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} /> {client ? "更新する" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}
