"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Save, FileText, ChevronLeft, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [quotation, setQuotation] = useState<any>(null);
  const [assignees, setAssignees] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, quotationRes] = await Promise.all([
          fetch("/api/clients"),
          fetch(`/api/quotations/${params.id}`)
        ]);
        const clientsData = await clientsRes.json();
        const quotationData = await quotationRes.json();
        
        setClients(clientsData);
        setQuotation({
          ...quotationData,
          issueDate: quotationData.issueDate.split("T")[0],
          expiryDate: quotationData.expiryDate ? quotationData.expiryDate.split("T")[0] : "",
        });

        // Fetch initial assignees
        if (quotationData.clientId) {
          const assigneesRes = await fetch(`/api/assignees?clientId=${quotationData.clientId}`);
          if (assigneesRes.ok) {
            const assigneesData = await assigneesRes.json();
            setAssignees(assigneesData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (quotation?.clientId) {
      fetch(`/api/assignees?clientId=${quotation.clientId}`)
        .then(res => res.json())
        .then(data => setAssignees(Array.isArray(data) ? data : []))
        .catch(err => console.error("Fetch assignees error:", err));
    } else {
      setAssignees([]);
    }
  }, [quotation?.clientId]);

  const handleAddItem = () => {
    setQuotation({
      ...quotation,
      items: [...quotation.items, { 
        description: "", serviceMonth: "", personName: "", 
        quantity: 1, unit: quotation.templateType === "SES" ? "h" : "式", 
        unitPrice: 0, amount: 0,
        minHours: 140, maxHours: 180, overtimeRate: 0, deductionRate: 0,
        overtimeAmount: 0, deductionAmount: 0
      }],
    });
  };

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

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...quotation.items];
    const updatedItem = { ...newItems[index], [field]: value };
    newItems[index] = calculateItemAmount(updatedItem, quotation.templateType);
    setQuotation({ ...quotation, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if (quotation.items.length === 1) return;
    const newItems = quotation.items.filter((_: any, i: number) => i !== index);
    setQuotation({ ...quotation, items: newItems });
  };

  const calculateSubtotal = () => quotation?.items.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0) || 0;
  const subtotal = calculateSubtotal();
  const tax = Math.floor(subtotal * (quotation?.taxRate || 0.1));

  const handleSubmit = async () => {
    const res = await fetch(`/api/quotations/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify(quotation),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      router.push(`/quotations/${params.id}`);
    } else {
      const errorData = await res.json();
      alert(`保存に失敗しました: ${errorData.error}\n${errorData.details ? JSON.stringify(errorData.details) : ""}`);
    }
  };

  if (loading || !quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-3xl font-black text-slate-900">見積書の編集</h1>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* 基本設定 */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
              <FileText size={20} className="text-blue-600" /> 基本情報
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">見積書番号</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={quotation.quotationNumber}
                  onChange={e => setQuotation({ ...quotation, quotationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">登録番号</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="T..."
                  value={quotation.registrationNumber || ""}
                  onChange={e => setQuotation({ ...quotation, registrationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">見積先</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={quotation.clientId}
                  onChange={e => setQuotation({ ...quotation, clientId: e.target.value })}
                >
                  <option value="">選択してください</option>
                  {Array.isArray(clients) && clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">件名 (任意)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  placeholder="例：2024年8月分 業務委託費用"
                  value={quotation.subject || ""}
                  onChange={e => setQuotation({ ...quotation, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">発行日</label>
                <input 
                  type="date" 
                  value={quotation.issueDate}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  onChange={e => setQuotation({ ...quotation, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">有効期限</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  value={quotation.expiryDate || ""}
                  onChange={e => setQuotation({ ...quotation, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">テンプレート</label>
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
          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
              <Plus size={20} className="text-blue-600" /> 明細項目
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase px-2">
                {quotation.templateType === "SES" ? (
                  <>
                    <div className="col-span-2">年月</div>
                    <div className="col-span-2">内容 (該当者等)</div>
                    <div className="col-span-2">備考</div>
                    <div className="col-span-1 text-center">時間</div>
                    <div className="col-span-1 text-center">単位</div>
                    <div className="col-span-2 text-right">単価</div>
                    <div className="col-span-2 text-right px-2">金額</div>
                  </>
                ) : (
                  <>
                    <div className="col-span-6">内容 / 項目</div>
                    <div className="col-span-1">数量</div>
                    <div className="col-span-1">単位</div>
                    <div className="col-span-2 text-right">単価</div>
                    <div className="col-span-2 text-right px-2">金額</div>
                  </>
                )}
              </div>
              {quotation.items.map((item: any, index: number) => (
                <div key={index} className="space-y-2 pb-4 border-b border-slate-50 last:border-0 group relative">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {quotation.templateType === "SES" ? (
                      <>
                        <div className="col-span-2">
                          <input 
                            type="text" placeholder="2024年8月"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded text-sm"
                            value={item.serviceMonth || ""}
                            onChange={e => handleItemChange(index, "serviceMonth", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <input 
                              type="text" list={`assignees-${index}`} placeholder="該当者：山田太郎"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded text-sm"
                              value={item.personName || ""}
                              onChange={e => handleItemChange(index, "personName", e.target.value)}
                            />
                            <datalist id={`assignees-${index}`}>
                              {assignees.map((a: any) => (
                                <option key={a.id} value={a.name} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <input 
                            type="text" placeholder="システムエンジニアリング"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded text-sm"
                            value={item.description}
                            onChange={e => handleItemChange(index, "description", e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-6">
                        <input 
                          type="text" placeholder="UIデザイン制作"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded focus:border-blue-500 outline-none text-sm"
                          value={item.description}
                          onChange={e => handleItemChange(index, "description", e.target.value)}
                        />
                      </div>
                    )}
                    <div className="col-span-1">
                      <input 
                        type="number" 
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-100 rounded text-sm text-center"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <input 
                        type="text" 
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-100 rounded text-sm text-center"
                        value={item.unit || "式"}
                        onChange={e => handleItemChange(index, "unit", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-100 rounded text-sm text-right"
                        value={item.unitPrice}
                        onChange={e => handleItemChange(index, "unitPrice", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 text-right font-bold text-slate-800 tabular-nums px-2 pr-10">
                      {formatCurrency(Number(item.amount) || 0)}
                    </div>
                    
                    <button 
                      onClick={() => handleRemoveItem(index)}
                      className="absolute right-0 top-1.5 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {quotation.templateType === "SES" && (
                    <div className="grid grid-cols-12 gap-4 items-center bg-blue-50/30 p-2 rounded-lg ml-2 border border-blue-100/50">
                      <div className="col-span-4 flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase">
                        <span>精算幅:</span>
                        <input 
                          type="number" className="w-16 px-1 py-0.5 bg-white border border-blue-100 rounded text-center"
                          value={item.minHours} onChange={e => handleItemChange(index, "minHours", e.target.value)}
                        />
                        <span>-</span>
                        <input 
                          type="number" className="w-16 px-1 py-0.5 bg-white border border-blue-100 rounded text-center"
                          value={item.maxHours} onChange={e => handleItemChange(index, "maxHours", e.target.value)}
                        />
                        <span>h</span>
                      </div>
                      <div className="col-span-4 flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase">
                        <span>単価:</span>
                        <label>超過</label>
                        <input 
                          type="number" className="w-16 px-1 py-0.5 bg-white border border-blue-100 rounded text-right"
                          value={item.overtimeRate} onChange={e => handleItemChange(index, "overtimeRate", e.target.value)}
                        />
                        <label>控除</label>
                        <input 
                          type="number" className="w-16 px-1 py-0.5 bg-white border border-blue-100 rounded text-right"
                          value={item.deductionRate} onChange={e => handleItemChange(index, "deductionRate", e.target.value)}
                        />
                      </div>
                      <div className="col-span-4 text-right text-[10px] font-bold space-x-4">
                        {(Number(item.overtimeAmount) || 0) > 0 && (
                          <span className="text-emerald-600">超過: +{formatCurrency(Number(item.overtimeAmount) || 0)}</span>
                        )}
                        {(Number(item.deductionAmount) || 0) > 0 && (
                          <span className="text-rose-600">控除: -{formatCurrency(Number(item.deductionAmount) || 0)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button 
                onClick={handleAddItem}
                className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-sm hover:translate-x-1 transition-transform"
              >
                <Plus size={16} /> 行を追加する
              </button>
            </div>

            {/* 合計 */}
            <div className="mt-12 flex justify-end">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>小計</span>
                  <span className="tabular-nums font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>消費税 (10%)</span>
                  <span className="tabular-nums font-bold">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-slate-900 border-t pt-2">
                  <span className="font-bold">合計 (税込)</span>
                  <span className="text-2xl font-black text-blue-600 underline decoration-slate-200 underline-offset-8">
                    {formatCurrency(subtotal + tax)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 備考 & 保存 */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex-1 w-full">
              <h2 className="text-xs font-bold text-slate-700 uppercase mb-4 tracking-wider">備考欄</h2>
              <textarea 
                className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                value={quotation.notes || ""}
                onChange={e => setQuotation({ ...quotation, notes: e.target.value })}
              />
            </section>
            
            <div className="w-full md:w-64 space-y-4">
              <button 
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1"
              >
                <Save size={20} /> 変更を保存する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
