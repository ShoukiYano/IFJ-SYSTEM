"use client";

import React, { useState, useEffect } from "react";
import { Plus, Mail, Phone, MapPin, Edit2, Trash2, Users } from "lucide-react";
import ClientModal from "@/components/clients/ClientModal";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch clients error:", err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("本当にこの取引先を削除しますか？\n(関連する請求書はそのまま残ります)")) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClients();
      } else {
        alert("削除に失敗しました");
      }
    } catch (err) {
      alert("通信エラーが発生しました");
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">取引先マスタ</h1>
          <p className="text-slate-500 mt-1">請求先企業の詳細および所属エンジニアを管理します。</p>
        </div>
        <button 
          onClick={() => {
            setEditingClient(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={20} /> 新規登録
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.map((client: any) => (
          <div key={client.id} className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-bold text-xl text-slate-800 leading-tight">
                {client.name} <span className="text-sm font-normal text-slate-400 ml-1">{client.honorific}</span>
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(client)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="編集"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(client.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="削除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              {client.email && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg"><Mail size={16} className="text-slate-400" /></div>
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.tel && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg"><Phone size={16} className="text-slate-400" /></div>
                  <span>{client.tel}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg"><MapPin size={16} className="text-slate-400 mt-0.5" /></div>
                  <span className="flex-1 leading-relaxed">{client.address}</span>
                </div>
              )}
            </div>
            
            {client.staffs && client.staffs.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  <Users size={12} /> 所属要員 ({client.staffs.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.staffs.map((staff: any) => (
                    <span 
                      key={staff.id} 
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        staff.type === 'PROPER' 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}
                    >
                      {staff.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
              <span>登録日: {new Date(client.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold">取引先が登録されていません</p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              最初の取引先を登録する
            </button>
          </div>
        )}
      </div>

      <ClientModal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
        onSuccess={fetchClients}
        client={editingClient}
      />
    </div>
  );
}
