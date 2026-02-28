"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Users, FileText, Save, Trash2, Loader2, CheckCircle2, Plus, Mail, Key, Settings, Database, Download } from "lucide-react";
import Link from "next/link";

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "TENANT_ADMIN"
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchTenant();
    fetchUsers();
    fetchBackups();
  }, []);

  const fetchTenant = async () => {
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
      } else {
        alert("テナントの取得に失敗しました");
        router.push("/admin/tenants");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchBackups = async () => {
    setBackupsLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}/backups`);
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!confirm("現在のデータのスナップショットを作成しますか？")) return;
    setCreatingBackup(true);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}/backups`, {
        method: "POST",
      });
      if (res.ok) {
        fetchBackups();
      } else {
        alert("バックアップの作成に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setNewUser({ email: "", name: "", password: "", role: "TENANT_ADMIN" });
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "ユーザー作成に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenant),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("更新に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("本当にこのテナントを削除しますか？\n関連するすべてのデータ（ユーザー、取引先、請求書など）が永久に削除されます。")) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/tenants");
      } else {
        alert("削除に失敗しました");
      }
    } catch (error) {
      alert("通信エラーが発生しました");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8">読み込み中...</div>;
  if (!tenant) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/tenants" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft size={20} />
          テナント一覧に戻る
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{tenant.name}</h1>
            <p className="text-slate-500 mt-1">ID: {tenant.id}</p>
          </div>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="text-rose-600 flex items-center gap-2 text-sm font-bold hover:bg-rose-50 px-3 py-2 rounded-lg transition"
          >
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            テナントを完全に削除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 mb-2"><Users size={20} /></div>
          <div className="text-2xl font-black text-slate-800">{tenant._count?.users || 0}</div>
          <div className="text-xs font-bold text-slate-500 uppercase">登録ユーザー</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 mb-2"><Building2 size={20} /></div>
          <div className="text-2xl font-black text-slate-800">{tenant._count?.clients || 0}</div>
          <div className="text-xs font-bold text-slate-500 uppercase">取引先数</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 mb-2"><FileText size={20} /></div>
          <div className="text-2xl font-black text-slate-800">{tenant._count?.invoices || 0}</div>
          <div className="text-xs font-bold text-slate-500 uppercase">発行済み請求書</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">テナント基本設定</h2>
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 size={18} />
              保存しました
            </div>
          )}
        </div>
        <form onSubmit={handleUpdate} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">テナント名</label>
              <input 
                required
                type="text"
                value={tenant.name}
                onChange={e => setTenant({...tenant, name: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">サブドメイン</label>
              <input 
                type="text"
                value={tenant.subdomain || ""}
                onChange={e => setTenant({...tenant, subdomain: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">適格請求書登録番号</label>
              <input 
                type="text"
                value={tenant.registrationNumber || ""}
                onChange={e => setTenant({...tenant, registrationNumber: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">メールアドレス</label>
              <input 
                type="email"
                value={tenant.email || ""}
                onChange={e => setTenant({...tenant, email: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">有効化設定</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={tenant.isActive === true}
                  onChange={() => setTenant({...tenant, isActive: true})}
                  className="size-4 text-indigo-600"
                />
                <span className="text-sm font-medium">有効</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={tenant.isActive === false}
                  onChange={() => setTenant({...tenant, isActive: false})}
                  className="size-4 text-rose-600"
                />
                <span className="text-sm font-medium">無効（ログイン不可）</span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              設定を保存する
            </button>
          </div>
        </form>
      </div>

      {/* ユーザー管理セクション */}
      <div className="mt-12 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            所属ユーザー管理
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ユーザー追加フォーム */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-8">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" />
                新規ユーザー追加
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">メールアドレス</label>
                  <input 
                    required
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    placeholder="example@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">氏名</label>
                  <input 
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    placeholder="山田 太郎"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">パスワード</label>
                  <input 
                    required
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">ロール</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="TENANT_ADMIN">テナント管理者</option>
                    <option value="TENANT_USER">一般ユーザー</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={creatingUser}
                  className="w-full bg-slate-800 text-white py-2 rounded-xl font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2"
                >
                  {creatingUser && <Loader2 size={18} className="animate-spin" />}
                  ユーザーを追加する
                </button>
              </form>
            </div>
          </div>

          {/* ユーザー一覧 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">氏名 / メール</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ロール</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                        ユーザー情報を読み込み中...
                      </td>
                    </tr>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{user.name || "未設定"}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            user.role === 'TENANT_ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {user.role === 'TENANT_ADMIN' ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-indigo-600 transition">
                            <Settings size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        管理ユーザーが登録されていません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* バックアップ管理セクション */}
      <div className="mt-16 space-y-8 pb-20">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Database size={24} className="text-indigo-600" />
            データバックアップ (スナップショット)
          </h2>
          <button 
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {creatingBackup ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            今すぐバックアップを作成
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-500 uppercase">ファイル名</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase">サイズ</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase">作成日時</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backupsLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">読み込み中...</td>
                </tr>
              ) : backups.length > 0 ? (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-800">{backup.filename}</td>
                    <td className="px-6 py-4 text-slate-500">{(backup.size / 1024).toFixed(1)} KB</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(backup.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 font-bold hover:underline flex items-center justify-end gap-1 ml-auto">
                        <Download size={14} /> ダウンロード
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">バックアップ履歴がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
