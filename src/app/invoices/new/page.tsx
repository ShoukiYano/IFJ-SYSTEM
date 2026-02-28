"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, FileText, ChevronLeft, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calculateDueDate, isHolidayOrWeekend, checkServiceMonthMismatch } from "@/lib/dateUtils";
import { AlertTriangle, Info, Calendar as CalendarIcon, Loader2, Building2 } from "lucide-react";
import * as XLSX from "xlsx";

export default function NewInvoicePage() {
  const [clients, setClients] = useState([]);
  const [invoice, setInvoice] = useState({
    clientId: "",
    invoiceNumber: "", // 手動指定用
    registrationNumber: "", // 適格請求書発行事業者番号
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    subject: "",
    templateType: "STANDARD",
    notes: "振込手数料は貴社にてご負担願います。",
    taxRate: 0.1,
    items: [{ 
      description: "", serviceMonth: "", personName: "", 
      quantity: 1, unit: "h", 
      unitPrice: 0, amount: 0,
      minHours: 140, maxHours: 180, overtimeRate: 0, deductionRate: 0,
      overtimeAmount: 0, deductionAmount: 0,
      staffId: "",
      warnings: [] as string[]
    }],
  });

  const [staffs, setStaffs] = useState<any[]>([]);

  const [assignees, setAssignees] = useState<any[]>([]);
  const [clientAverage, setClientAverage] = useState(0);
  const [showAnomalyWarning, setShowAnomalyWarning] = useState(false);

  // Excel直接インポート用の状態
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [workbookSheets, setWorkbookSheets] = useState<string[]>([]);
  const [pendingWorkbook, setPendingWorkbook] = useState<XLSX.WorkBook | null>(null);

  useEffect(() => {
    fetch("/api/clients").then(res => res.json()).then(setClients);
    fetch("/api/company")
      .then(res => res.json())
      .then(data => {
        if (data?.registrationNumber) {
          setInvoice(prev => ({ ...prev, registrationNumber: data.registrationNumber }));
        }
      });
  }, []);

  useEffect(() => {
    if (invoice.clientId) {
      fetch(`/api/assignees?clientId=${invoice.clientId}`)
        .then(res => res.json())
        .then(data => setAssignees(Array.isArray(data) ? data : []))
        .catch(err => console.error("Fetch assignees error:", err));

      fetch(`/api/staff?clientId=${invoice.clientId}`)
        .then(res => res.json())
        .then(data => setStaffs(Array.isArray(data) ? data : []))
        .catch(err => console.error("Fetch staffs error:", err));
    } else {
      setAssignees([]);
      setStaffs([]);
      setClientAverage(0);
    }
  }, [invoice.clientId]);

  useEffect(() => {
    if (invoice.clientId) {
      fetch(`/api/stats/average?clientId=${invoice.clientId}`)
        .then(res => res.json())
        .then(data => setClientAverage(data.average || 0))
        .catch(err => console.error(err));
    }
  }, [invoice.clientId]);

  // 支払期限の自動計算
  useEffect(() => {
    if (invoice.clientId && invoice.issueDate) {
      const client = (clients as any[]).find(c => c.id === invoice.clientId);
      if (client) {
        const calculatedDate = calculateDueDate(
          new Date(invoice.issueDate),
          client.closingDay || 31,
          client.paymentMonthOffset || 1,
          client.paymentDay || 31
        );
        const dateStr = calculatedDate.toISOString().split("T")[0];
        if (invoice.dueDate !== dateStr) {
          setInvoice(prev => ({ ...prev, dueDate: dateStr }));
        }
      }
    }
  }, [invoice.clientId, invoice.issueDate, clients]);

  const handleAddItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { 
        description: "", serviceMonth: "", personName: "", 
        quantity: 1, unit: invoice.templateType === "SES" ? "h" : "式", 
        unitPrice: 0, amount: 0,
        minHours: 140, maxHours: 180, overtimeRate: 0, deductionRate: 0,
        overtimeAmount: 0, deductionAmount: 0,
        staffId: "",
        warnings: [] as string[]
      }],
    });
  };

  // 再計算ロジックを関数化
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
      return { ...item, overtimeAmount, deductionAmount, amount, warnings: item.warnings || [] };
    } else {
      const amount = Number(item.quantity) * Number(item.unitPrice);
      return { ...item, amount, warnings: item.warnings || [] };
    }
  };

  // テンプレート変更時に全項目を再計算
  useEffect(() => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => calculateItemAmount(item, prev.templateType))
    }));
  }, [invoice.templateType]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...invoice.items];
    const currentItem = newItems[index];
    let updatedItem = { ...currentItem, [field]: value };
    
    // SESの場合、年月変更時に内容（稼働分）も同期させる
    if (invoice.templateType === "SES" && field === "serviceMonth") {
      const match = value.match(/(\d+)月/);
      if (match) {
        const month = parseInt(match[1], 10);
        updatedItem.description = `${month}月度稼働分`;
      }
    }

    // SES: unitPrice / minHours / maxHours が変わったら自動で rate を再計算
    if (invoice.templateType === "SES" && ["unitPrice", "minHours", "maxHours"].includes(field)) {
      const unitPrice = Number(field === "unitPrice" ? value : updatedItem.unitPrice) || 0;
      const min      = Number(field === "minHours"  ? value : updatedItem.minHours)  || 0;
      const max      = Number(field === "maxHours"  ? value : updatedItem.maxHours)  || 0;
      if (unitPrice > 0 && min > 0 && max > 0) {
        updatedItem.overtimeRate  = Math.floor(unitPrice / max);
        updatedItem.deductionRate = Math.floor(unitPrice / min);
      }
    }

    // 要員選択時の自動補完
    if (invoice.templateType === "SES" && field === "staffId" && value) {
      const selectedStaff = staffs.find(s => s.id === value);
      if (selectedStaff) {
        updatedItem.personName = selectedStaff.name;
        updatedItem.unitPrice = Number(selectedStaff.unitPrice);
        updatedItem.minHours = selectedStaff.minHours ?? 140;
        updatedItem.maxHours = selectedStaff.maxHours ?? 180;
        
        // 追加: 控除・超過単価の初期設定（マスタにあればそれを使用、なければ計算）
        const unitPrice = Number(selectedStaff.unitPrice) || 0;
        const min = Number(selectedStaff.minHours) || 140;
        const max = Number(selectedStaff.maxHours) || 180;

        updatedItem.overtimeRate = selectedStaff.excessAmount ? Number(selectedStaff.excessAmount) : Math.floor(unitPrice / max);
        updatedItem.deductionRate = selectedStaff.deductionAmount ? Number(selectedStaff.deductionAmount) : Math.floor(unitPrice / min);
        
        // 支払サイトなどの情報があれば活用（将来的な拡張用）
        if (selectedStaff.paymentTerms) {
          // メモ欄に追加するなどの処理も検討可能
        }
      }
    }

    newItems[index] = calculateItemAmount(updatedItem, invoice.templateType);
    
    // バリデーションチェック (サービス月の不整合)
    if (field === "serviceMonth" || field === "issueDate") {
      const isMismatch = checkServiceMonthMismatch(new Date(invoice.issueDate), updatedItem.serviceMonth);
      newItems[index].warnings = isMismatch ? ["サービス月が発行日と2ヶ月以上離れています"] : [];
    }

    setInvoice({ ...invoice, items: newItems });
  };

  const calculateSubtotal = () => invoice.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const subtotal = calculateSubtotal();
  const tax = Math.floor(subtotal * invoice.taxRate);

  // 異常値（桁間違い）チェック
  useEffect(() => {
    if (clientAverage > 0 && subtotal > clientAverage * 2) {
      setShowAnomalyWarning(true);
    } else {
      setShowAnomalyWarning(false);
    }
  }, [subtotal, clientAverage]);

  const handleSubmit = async () => {
    const res = await fetch("/api/invoices", {
      method: "POST",
      body: JSON.stringify(invoice),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      window.location.href = "/";
    } else {
      const errorData = await res.json();
      alert(`保存に失敗しました: ${errorData.error}\n${errorData.details ? JSON.stringify(errorData.details) : ""}`);
    }
  };

  const applyImportedData = (importedItems: any[]) => {
    if (importedItems.length === 0) {
      alert("有効な勤怠データが見つかりませんでした。");
      return;
    }

    const newItems = [...invoice.items];
    importedItems.forEach(imported => {
      // インポートされた名前の空白を除去して比較用に使用
      const cleanImportedName = (imported.name || "").replace(/\s/g, '');
      
      // マスタから一致する要員を探す（空白除去して比較）
      const matchedStaff = staffs.find(s => (s.name || "").replace(/\s/g, '') === cleanImportedName);

      const existingIdx = newItems.findIndex(item => {
        const cleanItemName = (item.personName || "").replace(/\s/g, '');
        return cleanItemName === cleanImportedName;
      });
      
      // 価格や精算幅の決定（インポートデータ優先、なければマスタ、それもなければデフォルト）
      const priceValue = imported.price ?? (matchedStaff ? Number(matchedStaff.unitPrice) : (existingIdx !== -1 ? newItems[existingIdx].unitPrice : 0));
      const minHours = imported.minHours ?? (matchedStaff?.minHours ? Number(matchedStaff.minHours) : (existingIdx !== -1 ? newItems[existingIdx].minHours : 140));
      const maxHours = imported.maxHours ?? (matchedStaff?.maxHours ? Number(matchedStaff.maxHours) : (existingIdx !== -1 ? newItems[existingIdx].maxHours : 180));
      
      const overtimeRate = matchedStaff?.excessAmount ? Number(matchedStaff.excessAmount) : Math.floor(priceValue / (maxHours || 1));
      const deductionRate = matchedStaff?.deductionAmount ? Number(matchedStaff.deductionAmount) : Math.floor(priceValue / (minHours || 1));

      const baseItem = {
        staffId: matchedStaff?.id || (existingIdx !== -1 ? newItems[existingIdx].staffId : ""),
        personName: matchedStaff?.name || imported.name, // マスタがあれば正式名称を使用
        quantity: imported.hours,
        unitPrice: priceValue,
        minHours,
        maxHours,
        overtimeRate,
        deductionRate,
        unit: "h",
      };

      if (existingIdx !== -1) {
        const updated = { ...newItems[existingIdx], ...baseItem };
        if (imported.month) updated.serviceMonth = imported.month;
        newItems[existingIdx] = calculateItemAmount(updated, invoice.templateType);
      } else {
        const sm = imported.month || invoice.items[0]?.serviceMonth || "";
        const match = sm.match(/(\d+)月/);
        const desc = match ? `${match[1]}月度稼働分` : "システムエンジニアリングサービス";
        
        const newItem = { 
          ...baseItem,
          description: desc,
          serviceMonth: sm,
          amount: 0,
          overtimeAmount: 0,
          deductionAmount: 0,
          warnings: [] as string[]
        };
        newItems.push(calculateItemAmount(newItem, invoice.templateType));
      }
    });

    // 空の初期行があれば削除（インポートしたデータがある場合）
    const filteredItems = newItems.filter((item, idx) => {
      if (idx === 0 && newItems.length > importedItems.length && !item.personName && item.unitPrice === 0) return false;
      return true;
    });

    setInvoice({ ...invoice, items: filteredItems });
    alert(`${importedItems.length}件のデータをインポートしました。`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        parseAndApplyCSV(text);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        if (workbook.SheetNames.length > 1) {
          setPendingWorkbook(workbook);
          setWorkbookSheets(workbook.SheetNames);
          setIsSheetModalOpen(true);
        } else {
          processExcelSheet(workbook, workbook.SheetNames[0]);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const parseAndApplyCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return;

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
    const nameIdx = headers.findIndex(h => h.includes("氏名") || h.includes("名前") || h.includes("Name"));
    const timeIdx = headers.findIndex(h => h.includes("稼働時間") || h.includes("合計") || h.includes("Hours") || h.includes("時間"));
    const monthIdx = headers.findIndex(h => h.includes("年月") || h.includes("Month"));
    const priceIdx = headers.findIndex(h => h.includes("単価") || h.includes("Price") || h.includes("Rate"));
    const rangeIdx = headers.findIndex(h => h.includes("清算幅") || h.includes("精算幅") || h.includes("Range"));

    if (nameIdx === -1 || timeIdx === -1) {
      alert("CSVの列が見つかりません。「名前」と「時間」の列が必要です。");
      return;
    }

    const importedItems = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length <= Math.max(nameIdx, timeIdx)) return null;
      return mapRowToItem(cols, nameIdx, timeIdx, monthIdx, priceIdx, rangeIdx);
    }).filter(Boolean);

    applyImportedData(importedItems);
  };

  const processExcelSheet = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (jsonData.length < 2) return;

    const headers = jsonData[0].map(h => String(h || "").trim());
    const nameIdx = headers.findIndex(h => h.includes("氏名") || h.includes("名前") || h.includes("Name"));
    const timeIdx = headers.findIndex(h => h.includes("稼働時間") || h.includes("合計") || h.includes("Hours") || h.includes("時間"));
    const monthIdx = headers.findIndex(h => h.includes("年月") || h.includes("Month"));
    const priceIdx = headers.findIndex(h => h.includes("単価") || h.includes("Price") || h.includes("Rate"));
    const rangeIdx = headers.findIndex(h => h.includes("清算幅") || h.includes("精算幅") || h.includes("Range"));

    if (nameIdx === -1 || timeIdx === -1) {
      alert("Excelの列が見つかりません。「名前」と「時間」の列が必要です。");
      return;
    }

    const importedItems = jsonData.slice(1).map(row => {
      if (row.length <= Math.max(nameIdx, timeIdx)) return null;
      const cols = row.map(v => String(v || ""));
      return mapRowToItem(cols, nameIdx, timeIdx, monthIdx, priceIdx, rangeIdx);
    }).filter(Boolean);

    applyImportedData(importedItems);
    setIsSheetModalOpen(false);
    setPendingWorkbook(null);
  };

  const mapRowToItem = (cols: string[], nameIdx: number, timeIdx: number, monthIdx: number, priceIdx: number, rangeIdx: number) => {
    const name = cols[nameIdx];
    const hours = Number(cols[timeIdx].replace(/[^\d.]/g, ''));
    
    let month = monthIdx !== -1 ? cols[monthIdx] : null;
    // Excelの日付数値（例: 45000〜）をチェック
    if (month && /^\d+(\.\d+)?$/.test(month) && Number(month) > 40000) {
      const num = Number(month);
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      month = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    }

    const price = priceIdx !== -1 ? Number(cols[priceIdx].replace(/[^\d.]/g, '')) : null;
    const range = rangeIdx !== -1 ? cols[rangeIdx] : null;

    if (!name || isNaN(hours)) return null;

    let minHours = 140;
    let maxHours = 180;
    if (range) {
      const parts = range.split(/[-~]/).map(p => Number(p.replace(/[^\d.]/g, '')));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        minHours = parts[0];
        maxHours = parts[1];
      }
    }
    return { name, hours, month, price, minHours, maxHours };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </a>
          <h1 className="text-3xl font-black text-slate-900">請求書作成</h1>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* 基本設定 */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
              <FileText size={20} className="text-blue-600" /> 基本情報
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">請求書番号 (空欄で自動採番)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="INV-..."
                  value={invoice.invoiceNumber}
                  onChange={e => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">登録番号</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="T..."
                  value={invoice.registrationNumber}
                  onChange={e => setInvoice({ ...invoice, registrationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">請求先</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={invoice.clientId}
                  onChange={e => setInvoice({ ...invoice, clientId: e.target.value })}
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
                  value={invoice.subject}
                  onChange={e => setInvoice({ ...invoice, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">請求日</label>
                <input 
                  type="date" 
                  value={invoice.issueDate}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  onChange={e => setInvoice({ ...invoice, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">支払期限</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${
                      invoice.dueDate && isHolidayOrWeekend(new Date(invoice.dueDate)).isHoliday 
                        ? "bg-amber-50 border-amber-200 text-amber-800" 
                        : "bg-slate-50 border-slate-200"
                    }`}
                    value={invoice.dueDate}
                    onChange={e => setInvoice({ ...invoice, dueDate: e.target.value })}
                  />
                  {invoice.dueDate && isHolidayOrWeekend(new Date(invoice.dueDate)).isHoliday && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                      <AlertTriangle size={12} />
                      注意: 指定日は {isHolidayOrWeekend(new Date(invoice.dueDate)).reason} です
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">テンプレート</label>
                <select 
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-800"
                  value={invoice.templateType}
                  onChange={e => setInvoice({ ...invoice, templateType: e.target.value })}
                >
                  <option value="STANDARD">標準テンプレート</option>
                  <option value="SES">SES用テンプレート</option>
                </select>
              </div>
            </div>
          </section>

          {/* 明細 */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Plus size={20} className="text-blue-600" /> 明細項目
              </h2>
              <div className="flex gap-2">
                <input 
                  type="file" id="csv-import" accept=".csv, .xlsx, .xls" className="hidden" 
                  onChange={handleImportFile}
                />
                <button 
                  onClick={() => document.getElementById('csv-import')?.click()}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-slate-400/20"
                >
                  <Upload size={14} /> 勤怠データ読込 (CSV/Excel)
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase px-2">
                {invoice.templateType === "SES" ? (
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
              {invoice.items.map((item, index) => (
                <div key={index} className="space-y-2 pb-4 border-b border-slate-50 last:border-0 group">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {invoice.templateType === "SES" ? (
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
                            <select 
                              className="w-full px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-sm font-bold text-blue-800"
                              value={item.staffId || ""}
                              onChange={e => handleItemChange(index, "staffId", e.target.value)}
                            >
                              <option value="">要員を選択</option>
                              {staffs.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.type === 'PROPER' ? 'プ' : 'BP'})</option>
                              ))}
                            </select>
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
                        value={item.unit}
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
                    <div className="col-span-2 text-right font-bold text-slate-800 tabular-nums px-2">
                      {formatCurrency(Number(item.amount) || 0)}
                    </div>
                  </div>

                  {invoice.templateType === "SES" && (
                    <div className="space-y-2 ml-2">
                      {/* 精算幅 */}
                      <div className="grid grid-cols-12 gap-2 items-center bg-blue-50/30 p-2 rounded-lg border border-blue-100/50">
                        <div className="col-span-5 flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase">
                          <span className="shrink-0">精算幅:</span>
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
                        <div className="col-span-7 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const unitPrice = Number(item.unitPrice) || 0;
                              const min = Number(item.minHours) || 1;
                              const max = Number(item.maxHours) || 1;
                              if (unitPrice > 0 && min > 0 && max > 0) {
                                const newItems = [...invoice.items];
                                newItems[index] = calculateItemAmount({
                                  ...newItems[index],
                                  overtimeRate: Math.floor(unitPrice / max),
                                  deductionRate: Math.floor(unitPrice / min),
                                }, invoice.templateType);
                                setInvoice({ ...invoice, items: newItems });
                              }
                            }}
                            className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                          >
                            精算幅から自動計算
                          </button>
                        </div>
                      </div>

                      {/* 超過・控除単価 + 切り捨てボタン */}
                      <div className="grid grid-cols-12 gap-2 items-start bg-blue-50/20 p-2 rounded-lg border border-blue-100/50">
                        {/* 超過単価 */}
                        <div className="col-span-6 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600">
                            <span>超過単価:</span>
                            <input 
                              type="number" className="w-20 px-1 py-0.5 bg-white border border-blue-100 rounded text-right text-[10px]"
                              value={item.overtimeRate} onChange={e => handleItemChange(index, "overtimeRate", e.target.value)}
                            />
                            <span className="text-slate-400">円</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 10, 100].map(unit => (
                              <button
                                key={unit}
                                type="button"
                                onClick={() => {
                                  const newItems = [...invoice.items];
                                  newItems[index] = calculateItemAmount({
                                    ...newItems[index],
                                    overtimeRate: Math.floor(Number(newItems[index].overtimeRate) / unit) * unit,
                                  }, invoice.templateType);
                                  setInvoice({ ...invoice, items: newItems });
                                }}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded hover:bg-slate-200 transition-colors border border-slate-200"
                              >
                                {unit}円未満
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* 控除単価 */}
                        <div className="col-span-6 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600">
                            <span>控除単価:</span>
                            <input 
                              type="number" className="w-20 px-1 py-0.5 bg-white border border-rose-100 rounded text-right text-[10px]"
                              value={item.deductionRate} onChange={e => handleItemChange(index, "deductionRate", e.target.value)}
                            />
                            <span className="text-slate-400">円</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 10, 100].map(unit => (
                              <button
                                key={unit}
                                type="button"
                                onClick={() => {
                                  const newItems = [...invoice.items];
                                  newItems[index] = calculateItemAmount({
                                    ...newItems[index],
                                    deductionRate: Math.floor(Number(newItems[index].deductionRate) / unit) * unit,
                                  }, invoice.templateType);
                                  setInvoice({ ...invoice, items: newItems });
                                }}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded hover:bg-slate-200 transition-colors border border-slate-200"
                              >
                                {unit}円未満
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 超過・控除金額リアルタイム表示 */}
                        {(() => {
                          const hours  = Number(item.quantity)  || 0;
                          const min    = Number(item.minHours)  || 0;
                          const max    = Number(item.maxHours)  || 0;
                          const otAmt  = Number(item.overtimeAmount)  || 0;
                          const deAmt  = Number(item.deductionAmount) || 0;
                          const hasRate = Number(item.overtimeRate) > 0 || Number(item.deductionRate) > 0;
                          const inRange = hours > 0 && hours >= min && hours <= max;
                          return (
                            <div className="col-span-12 pt-1.5 border-t border-blue-100/50 flex items-center justify-between gap-2 flex-wrap">
                              {/* 左側: 稼働ステータス */}
                              <div className="text-[10px] font-bold">
                                {hours === 0 ? (
                                  <span className="text-slate-400">稼働時間を入力してください</span>
                                ) : !hasRate ? (
                                  <span className="text-slate-400">単価を入力すると超過・控除が自動計算されます</span>
                                ) : inRange ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    ✓ 精算範囲内（{hours}h）
                                  </span>
                                ) : hours > max ? (
                                  <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                    ▲ 超過 {(hours - max).toFixed(2)}h
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    ▼ 控除 {(min - hours).toFixed(2)}h
                                  </span>
                                )}
                              </div>
                              {/* 右側: 金額 */}
                              <div className="flex items-center gap-3 text-[10px] font-bold tabular-nums">
                                {otAmt > 0 && (
                                  <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    超過 +{formatCurrency(otAmt)}
                                  </span>
                                )}
                                {deAmt > 0 && (
                                  <span className="text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                    控除 −{formatCurrency(deAmt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 警告表示 */}
                  {item.warnings && item.warnings.length > 0 && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-600 font-bold bg-amber-50 p-1.5 rounded-lg border border-amber-100 mx-2">
                      <AlertTriangle size={14} />
                      {item.warnings.join(", ")}
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
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600 underline decoration-slate-200 underline-offset-8">
                      {formatCurrency(subtotal + tax)}
                    </span>
                    {showAnomalyWarning && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <AlertTriangle size={16} />
                        警告: 過去の平均額を大幅に超えています（桁間違いの可能性）
                      </div>
                    )}
                  </div>
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
                value={invoice.notes}
                onChange={e => setInvoice({ ...invoice, notes: e.target.value })}
              />
            </section>
            
            <div className="w-full md:w-64 space-y-4">
              <button 
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1"
              >
                <Save size={20} /> 請求書を保存する
              </button>
              <button className="w-full bg-white text-slate-600 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors">
                下書き保存
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 複数シート選択モーダル */}
      {isSheetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-6 text-white text-center">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-black italic">どの企業（シート）を読み込みますか？</h3>
              <p className="text-blue-100 text-sm mt-1 opacity-90">
                Excelファイルから複数のシートが検出されました。
              </p>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {workbookSheets.map((sheet) => (
                  <button
                    key={sheet}
                    onClick={() => pendingWorkbook && processExcelSheet(pendingWorkbook, sheet)}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all text-left group"
                  >
                    <div className="p-2 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{sheet}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Excel Sheet</div>
                    </div>
                    <ChevronLeft size={16} className="text-slate-300 group-hover:text-blue-400 rotate-180 transition-all" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => {
                  setIsSheetModalOpen(false);
                  setPendingWorkbook(null);
                }}
                className="w-full py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 足りないアイコンの追加（既存のlucide-reactから）
import { FileSpreadsheet } from "lucide-react";
