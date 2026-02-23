"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, ChevronLeft, Loader2, Calendar } from "lucide-react";
import { formatCurrency, calculateTax } from "@/lib/utils";

export default function NewQuotationPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignees, setAssignees] = useState<any[]>([]);
  
  const [quotation, setQuotation] = useState({
    clientId: "",
    quotationNumber: "", // 手動指定用
    registrationNumber: "", // 適格請求書発行事業者番号
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
    subject: "",
    templateType: "STANDARD",
    notes: "",
    taxRate: 0.10,
    items: [
      { 
        description: "", serviceMonth: "", personName: "", 
        quantity: 1, unit: "式", unitPrice: 0, amount: 0,
        minHours: 140, maxHours: 180, overtimeRate: 0, deductionRate: 0,
        overtimeAmount: 0, deductionAmount: 0
      }
    ],
  });

  useEffect(() => {
    fetch("/api/clients").then(res => res.json()).then((data: any[]) => setClients(data));
    fetch("/api/company")
      .then(res => res.json())
      .then(data => {
        if (data?.registrationNumber) {
          setQuotation(prev => ({ ...prev, registrationNumber: data.registrationNumber }));
        }
      });
  }, []);

  useEffect(() => {
    if (quotation.clientId) {
      fetch(`/api/assignees?clientId=${quotation.clientId}`)
        .then(res => res.json())
        .then(data => setAssignees(Array.isArray(data) ? data : []))
        .catch(err => console.error("Fetch assignees error:", err));
    } else {
      setAssignees([]);
    }
  }, [quotation.clientId]);

  const handleAddItem = () => {
    setQuotation({
      ...quotation,
      items: [...quotation.items, { 
        description: "", serviceMonth: "", personName: "", 
        quantity: 1, unit: "h", unitPrice: 0, amount: 0,
        minHours: 140, maxHours: 180, overtimeRate: 0, deductionRate: 0,
        overtimeAmount: 0, deductionAmount: 0
      }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = quotation.items.filter((_, i) => i !== index);
    setQuotation({ ...quotation, items: newItems });
  };

  // 再計算ロジック
  const calculateItemAmount = (item: any, templateType: string) => {
    if (templateType === "SES") {
      const hours = Number(item.quantity) || 0;
      const min = Number(item.minHours) || 0;
      const max = Number(item.maxHours) || 0;
      const otRate = Number(item.overtimeRate) || 0;
      const deRate = Number(item.deductionRate) || 0;

      const overtimeAmount = hours > max ? (hours - max) * otRate : 0;
      const deductionAmount = hours < min ? (min - hours) * deRate : 0;
      const amount = Number(item.unitPrice) + overtimeAmount - deductionAmount;
      return { ...item, overtimeAmount, deductionAmount, amount };
    } else {
      const amount = Number(item.quantity) * Number(item.unitPrice);
      return { ...item, amount };
    }
  };

  useEffect(() => {
    setQuotation(prev => ({
      ...prev,
      items: prev.items.map(item => calculateItemAmount(item, prev.templateType))
    }));
  }, [quotation.templateType]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...quotation.items];
    const updatedItem = { ...newItems[index], [field]: value };
    newItems[index] = calculateItemAmount(updatedItem, quotation.templateType);
    setQuotation({ ...quotation, items: newItems });
  };

  const subtotal = quotation.items.reduce((acc: number, item: any) => acc + item.amount, 0);
  const tax = Math.floor(subtotal * quotation.taxRate);
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!quotation.clientId) return alert("取引先を選択してください");
    
    setLoading(true);
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quotation),
    });

    if (res.ok) {
      window.location.href = "/quotations";
    } else {
      alert("作成に失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <a href="/quotations" className="p-2 hover:bg-slate-200 rounded-full transition-colors font-bold">
            <ChevronLeft size={24} />
          </a>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">見積書を新規作成</h1>
        </div>
        <button 
          onClick={handleSubmit} disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          見積書を保存
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* 基本情報 */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">見積書番号 (空欄で自動採番)</label>
                <input 
                  type="text" placeholder="EST-..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={quotation.quotationNumber}
                  onChange={e => setQuotation({ ...quotation, quotationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">登録番号</label>
                <input 
                  type="text" placeholder="T..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={quotation.registrationNumber}
                  onChange={e => setQuotation({ ...quotation, registrationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">取引先</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={quotation.clientId}
                  onChange={e => setQuotation({ ...quotation, clientId: e.target.value })}
                >
                  <option value="">取引先を選択してください</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">件名 (任意)</label>
                <input 
                  type="text" placeholder="プロジェクト名など"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  value={quotation.subject}
                  onChange={e => setQuotation({ ...quotation, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">発行日</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  value={quotation.issueDate}
                  onChange={e => setQuotation({ ...quotation, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">有効期限</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  value={quotation.expiryDate}
                  onChange={e => setQuotation({ ...quotation, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">テンプレート</label>
                <select 
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-800"
                  value={quotation.templateType}
                  onChange={e => setQuotation({ ...quotation, templateType: e.target.value })}
                >
                  <option value="STANDARD">標準テンプレート</option>
                  <option value="SES">SES用テンプレート</option>
                </select>
              </div>
            </div>
          </section>

          {/* 明細 */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {quotation.templateType === "SES" ? (
                    <>
                      <th className="px-6 py-3 w-28">年月</th>
                      <th className="px-3 py-3 w-32">該当者</th>
                      <th className="px-3 py-3">内容</th>
                      <th className="px-3 py-3 w-20">時間</th>
                      <th className="px-3 py-3 w-16">単位</th>
                      <th className="px-3 py-3 w-32">単価</th>
                      <th className="px-3 py-3 w-32 text-right">金額</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3">内容</th>
                      <th className="px-3 py-3 w-20">数量</th>
                      <th className="px-3 py-3 w-16">単位</th>
                      <th className="px-3 py-3 w-32">単価</th>
                      <th className="px-3 py-3 w-32 text-right">金額</th>
                    </>
                  )}
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {quotation.items.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr className={quotation.templateType === "SES" ? "border-b-0" : ""}>
                      {quotation.templateType === "SES" ? (
                        <>
                          <td className="px-6 py-3">
                            <input 
                              type="text" placeholder="2024年8月"
                              className="w-full border-none bg-transparent focus:ring-0 text-sm p-0"
                              value={item.serviceMonth || ""}
                              onChange={e => handleItemChange(index, "serviceMonth", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="relative">
                              <input 
                                type="text" list={`assignees-${index}`} placeholder="山田太郎"
                                className="w-full border-none bg-transparent focus:ring-0 text-sm p-0"
                                value={item.personName || ""}
                                onChange={e => handleItemChange(index, "personName", e.target.value)}
                              />
                              <datalist id={`assignees-${index}`}>
                                {assignees.map((a: any) => (
                                  <option key={a.id} value={a.name} />
                                ))}
                              </datalist>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <input 
                              type="text" placeholder="精算"
                              className="w-full border-none bg-transparent focus:ring-0 text-sm p-0"
                              value={item.description}
                              onChange={e => handleItemChange(index, "description", e.target.value)}
                            />
                          </td>
                        </>
                      ) : (
                        <td className="px-6 py-3">
                          <input 
                            type="text" placeholder="作業内容など"
                            className="w-full border-none bg-transparent focus:ring-0 text-sm p-0"
                            value={item.description}
                            onChange={e => handleItemChange(index, "description", e.target.value)}
                          />
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <input 
                          type="number"
                          className="w-full border-none bg-transparent focus:ring-0 text-sm p-0 text-center"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input 
                          type="text"
                          className="w-full border-none bg-transparent focus:ring-0 text-sm p-0 text-center"
                          value={item.unit}
                          onChange={e => handleItemChange(index, "unit", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input 
                          type="number"
                          className="w-full border-none bg-transparent focus:ring-0 text-sm p-0 text-right"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(index, "unitPrice", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-bold tabular-nums">
                        {formatCurrency(Number(item.amount) || 0)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => handleRemoveItem(index)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {quotation.templateType === "SES" && (
                      <tr className="bg-blue-50/20">
                        <td colSpan={8} className="px-6 py-2">
                          <div className="flex items-center gap-8 text-[10px] font-bold text-blue-600/70 uppercase">
                            <div className="flex items-center gap-2">
                              <span>精算幅:</span>
                              <input 
                                type="number" className="w-16 bg-white border border-blue-100 rounded px-1"
                                value={item.minHours} onChange={e => handleItemChange(index, "minHours", e.target.value)}
                              />
                              <span>-</span>
                              <input 
                                type="number" className="w-16 bg-white border border-blue-100 rounded px-1"
                                value={item.maxHours} onChange={e => handleItemChange(index, "maxHours", e.target.value)}
                              />
                              <span>h</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>単価:</span>
                              <div className="flex items-center gap-1">
                                <label>超過</label>
                                <input 
                                  type="number" className="w-20 bg-white border border-blue-100 rounded px-1 text-right"
                                  value={item.overtimeRate} onChange={e => handleItemChange(index, "overtimeRate", e.target.value)}
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <label>控除</label>
                                <input 
                                  type="number" className="w-20 bg-white border border-blue-100 rounded px-1 text-right"
                                  value={item.deductionRate} onChange={e => handleItemChange(index, "deductionRate", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="ml-auto space-x-4">
                              {(Number(item.overtimeAmount) || 0) > 0 && <span className="text-emerald-600">超過: +{formatCurrency(Number(item.overtimeAmount) || 0)}</span>}
                              {(Number(item.deductionAmount) || 0) > 0 && <span className="text-rose-600">控除: -{formatCurrency(Number(item.deductionAmount) || 0)}</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <button 
              onClick={handleAddItem}
              className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> 明細行を追加
            </button>
          </section>
        </div>

        {/* サマリー */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-500 uppercase mb-6 tracking-widest border-b pb-2">見積合計</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">小計</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">消費税 (10%)</span>
                <span className="font-mono">{formatCurrency(tax)}</span>
              </div>
              <div className="pt-4 border-t flex justify-between items-end">
                <span className="text-xs font-bold text-slate-900 uppercase">合計金額</span>
                <span className="text-2xl font-black text-blue-600 tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">備考</h2>
            <textarea 
              rows={4} placeholder="見積の条件や有効期限など"
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none text-sm resize-none"
              value={quotation.notes}
              onChange={e => setQuotation({ ...quotation, notes: e.target.value })}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
