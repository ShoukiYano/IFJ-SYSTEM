"use client";

import React, { useState } from "react";
import {
  Book,
  ChevronRight,
  ChevronDown,
  FileText,
  Users,
  Calendar,
  Download,
  Copy,
  AlertTriangle,
  Lightbulb,
  Info,
  Settings,
  BarChart2,
  Archive,
  Search,
  Filter,
  CheckSquare,
  Zap,
  Hash,
  Clock,
  Upload,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Printer,
  ListChecks,
  Mail,
  Lock,
  Link,
  LayoutDashboard,
  Shield,
  History,
  Megaphone,
  TrendingUp,
  Building2,
  FileUp,
} from "lucide-react";
import { useSession } from "next-auth/react";

// -------- サブコンポーネント --------

const Badge = ({ children, color = "blue" }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

const Step = ({ num, children }: { num: number; children: React.ReactNode }) => (
  <div className="flex gap-3 items-start">
    <div className="shrink-0 w-7 h-7 bg-blue-600 text-white text-xs font-black rounded-full flex items-center justify-center mt-0.5">
      {num}
    </div>
    <div className="text-sm text-slate-700 leading-relaxed pt-1">{children}</div>
  </div>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-3 items-start bg-blue-50 border border-blue-100 rounded-xl p-4 my-4">
    <Lightbulb size={16} className="text-blue-500 shrink-0 mt-0.5" />
    <p className="text-xs text-blue-800 leading-relaxed">{children}</p>
  </div>
);

const Warn = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl p-4 my-4">
    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
    <p className="text-xs text-amber-800 leading-relaxed">{children}</p>
  </div>
);

const KeyLabel = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-block bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-700 mx-0.5">
    {children}
  </kbd>
);

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  content: (features: any) => React.ReactNode;
  feature?: "invoice" | "attendance";
}

const SECTIONS: Section[] = [
  // ─── 1. システム概要 ───
  {
    id: "overview",
    title: "システム概要・基本の流れ",
    icon: Lightbulb,
    color: "blue",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600 leading-relaxed">
          IFJ-SYSTEM は、SES ビジネス（エンジニア派遣）に特化した請求書・見積書管理システムです。<br />
          取引先（エンジニアの派遣先）と、エンジニア（稼働者）の情報を一元管理し、毎月の請求業務を効率化します。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { color: "bg-blue-600", icon: Users, title: "マスタ登録", desc: "取引先と要員（エンジニア）を登録" },
            { color: "bg-violet-600", icon: Clock, title: "勤怠・シフト", desc: "予定の登録と日次の打刻承認", feature: "attendance" },
            { color: "bg-slate-800", icon: PlusCircle, title: "請求書作成", desc: "月次実績をもとに請求書を発行", feature: "invoice" },
            { color: "bg-emerald-600", icon: Download, title: "明細・PDF出力", desc: "請求書や注文書のPDFをダウンロード", feature: "invoice" },
          ].filter(item => {
            if (item.feature === "invoice" && !features.hasInvoiceFeature) return false;
            if (item.feature === "attendance" && !features.hasAttendanceFeature) return false;
            return true;
          }).map((item, index) => (
            <div key={index} className={`${item.color} text-white p-5 rounded-2xl relative overflow-hidden`}>
              <div className="absolute -right-3 -bottom-3 opacity-10"><item.icon size={64} /></div>
              <div className="text-xs font-bold opacity-60 mb-1">STEP {index + 1}</div>
              <div className="font-black text-base mb-1">{item.title}</div>
              <p className="text-[11px] opacity-80">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">画面構成（カテゴリー別）</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                <th className="px-5 py-2 text-left">カテゴリー</th>
                <th className="px-3 py-2 text-left">画面名</th>
                <th className="px-3 py-2 text-left">主な機能</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: "メイン", page: "ダッシュボード", desc: "売上統計・最近の請求書・通知の確認" },
                { cat: "請求システム", page: "見積書管理", desc: "見積書の作成・PDF出力", feature: "invoice" },
                { cat: "請求システム", page: "請求書管理", desc: "請求書の検索・一覧・ステータス管理", feature: "invoice" },
                { cat: "勤怠システム", page: "勤怠管理", desc: "日次・月次の勤怠入力と管理", feature: "attendance" },
                { cat: "勤怠システム", page: "勤怠集計", desc: "月次の実績確認・締め作業", feature: "attendance" },
                { cat: "勤怠システム", page: "シフト管理", desc: "予定（シフト）の登録と承認", feature: "attendance" },
                { cat: "マスタ管理", page: "要員管理", desc: "エンジニア情報の登録・契約期間管理" },
                { cat: "マスタ管理", page: "取引先管理", desc: "請求先企業の基本情報管理" },
                { cat: "その他", page: "ユーザー管理", desc: "ログインユーザーと権限の設定" },
                { cat: "その他", page: "操作ログ", desc: "システム内の操作履歴の確認" },
                { cat: "その他", page: "システム設定", desc: "自社情報・登録番号・銀行口座の設定" },
              ].filter(row => {
                if (row.feature === "invoice" && !features.hasInvoiceFeature) return false;
                if (row.feature === "attendance" && !features.hasAttendanceFeature) return false;
                return true;
              }).map((row, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3"><Badge color="slate">{row.cat}</Badge></td>
                  <td className="px-3 py-3 font-bold text-slate-800 text-xs">{row.page}</td>
                  <td className="px-3 py-3 text-slate-500 text-[11px]">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-600 text-white p-6 rounded-2xl space-y-3 shadow-xl shadow-blue-600/10">
          <h3 className="font-black flex items-center gap-2 text-lg">
            <LayoutDashboard size={20} />
            新しいナビゲーションの使い方
          </h3>
          <p className="text-sm opacity-90 leading-relaxed">
            サイドバーがカテゴリーごとに整理され、より使いやすくなりました。
          </p>
          <ul className="text-xs space-y-2 opacity-80">
            <li className="flex items-center gap-2">
              <ChevronRight size={14} className="shrink-0" />
              カテゴリー名（例：請求システム）をクリックすると、詳細メニューが展開されます。
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight size={14} className="shrink-0" />
              現在開いているページが含まれるカテゴリーは、自動的に展開された状態で表示されます。
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight size={14} className="shrink-0" />
              各テナントの設定で無効化されている機能（例：勤怠管理を使わない等）のカテゴリーは、自動的に非表示になります。
            </li>
          </ul>
        </div>
      </div>
    ),
  },

  // ─── 2. ダッシュボード ───
  {
    id: "dashboard",
    title: "ダッシュボード",
    icon: BarChart2,
    color: "violet",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">ログイン直後に表示されるホーム画面です。売上状況の把握と請求書への素早いアクセスが可能です。</p>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📊 表示される情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "総売上額（累計）", desc: "登録済み全請求書の合計金額" },
              { title: "発行済み請求書数", desc: "登録されている請求書の総件数" },
              { title: "未入金・保留", desc: "PAID 以外のステータスの件数" },
            ].map(c => (
              <div key={c.title} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="font-bold text-sm text-slate-700 mb-1">{c.title}</div>
                <div className="text-xs text-slate-500">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* フィルタ機能 */}
        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Filter size={16} /> 最近の請求書 — 絞り込み</h3>
          <div className="space-y-3">
            <Step num={1}>「最近の請求書」セクション右上の<strong>「発行年月」</strong>入力（月選択）に対象年月を指定します。</Step>
            <Step num={2}><strong>「請求先」</strong>のドロップダウンから取引先を選択します。</Step>
            <Step num={3}>両方指定すると AND 条件で絞り込まれます。どちらか一方だけでも OK です。</Step>
            <Step num={4}>発行年月の隣の <strong>✕</strong> をクリックするとフィルタをリセットできます。</Step>
          </div>
          <Tip>フィルタを変更するたびにサーバーへ自動でリクエストが飛ぶので、「検索ボタン」は不要です。</Tip>
        </div>

        {/* 一括ZIP */}
        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Archive size={16} /> 一括 ZIP ダウンロード</h3>
          <div className="space-y-3">
            <Step num={1}>テーブルのチェックボックスで対象の請求書を選択します。</Step>
            <Step num={2}>右上の <Badge>📥 選択 (N件) ZIP</Badge> ボタンをクリックします。</Step>
            <Step num={3}>自動的に各請求書の PDF が生成され、ZIP でまとめてダウンロードされます。</Step>
          </div>
          <Tip>チェックなしの場合は「発行年月」フィルタで指定した月の全請求書を ZIP 化します。</Tip>
        </div>

        {/* 定型請求の一括生成 */}
        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><ListChecks size={16} /> 定型請求の一括生成（自動下書き作成）</h3>
          <div className="space-y-3">
            <Step num={1}>「請求書管理」ページへ移動し、右上の <Badge color="white">定型請求を一括作成</Badge> ボタンをクリックします。</Step>
            <Step num={2}>対象年月（例：翌月分）を選択します。画面には対象となる取引先一覧が表示されます。</Step>
            <Step num={3}>「一括生成を実行する」をクリックします。</Step>
            <Step num={4}>各取引先の「最新の請求書」をベースに、日付やサービス年月が自動更新された新しい「下書き」が作成されます。</Step>
          </div>
          <Tip>取引先マスタで「定型請求対象」をONにしている企業が対象となります。</Tip>
          <Warn>最新の請求書が存在しない取引先はスキップされます。初回は手動で作成してください。</Warn>
        </div>
          <div className="h-px bg-slate-100" />

        <div className="space-y-3 border-t border-slate-100 pt-6">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Megaphone size={16} className="text-indigo-600" /> お知らせ・通知機能</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            全ユーザー共通のお知らせはダッシュボード上部のメガホンアイコン、またはお知らせパネルに表示されます。
            管理者からの重要な指示や、システムのメンテナンス情報などを確認してください。
          </p>
        </div>

        <div className="bg-blue-600 text-white p-6 rounded-2xl space-y-3 shadow-xl shadow-blue-600/10">
          <h3 className="font-black flex items-center gap-2 text-lg">
            <TrendingUp size={20} />
            売上・稼働のリアルタイム反映
          </h3>
          <p className="text-sm opacity-90 leading-relaxed">
            ダッシュボードのグラフや「リアルタイム稼働状況」パネルは、データの更新（請求書発行や打刻）に伴い即座に変化します。
          </p>
        </div>
      </div>
    ),
  },

  // ─── 3. マスタ管理（取引先・要員） ───
  {
    id: "clients",
    title: "取引先管理",
    icon: Building2,
    color: "emerald",
    content: (features) => (
      <div className="space-y-4">
        <p className="text-slate-600">請求先となる企業情報を管理します。</p>
        <div className="space-y-3">
          <Step num={1}>右上の <Badge color="green">+ 新規取引先</Badge> ボタンで登録を開始します。</Step>
          <Step num={2}>会社名、住所、振込先、締め日・支払日などを設定します。</Step>
          <Step num={3}>締め日・支払日を設定すると、請求書作成時に支払期限が自動計算されます。</Step>
          <Step num={4}>「定型請求対象」をONにすると、ダッシュボードでの一括生成機能の対象になります。</Step>
        </div>
      </div>
    ),
  },
  {
    id: "staff",
    title: "要員管理",
    icon: Users,
    color: "blue",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">SES要員や自社エンジニアの情報を管理します。</p>
        <div className="space-y-3 border-b border-slate-100 pb-4">
          <h3 className="font-black text-slate-700">👤 要員の個別登録</h3>
          <Step num={1}>右上の <Badge color="blue">新規登録</Badge> から行います。</Step>
          <Step num={2}>区分（プロパー/BP）、エリア（関東/関西/名古屋）を指定します。</Step>
          <Step num={3}>各要員に「単価」と「標準精算幅」を設定しておくと、請求書作成時に自動反映されます。</Step>
          <Step num={4}>「契約開始日」と「更新間隔」を入力すると、ダッシュボードに更新アラートが表示されます。</Step>
        </div>

        <div className="space-y-3 border-b border-slate-100 pb-4">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><FileUp size={16} /> Excel一括インポート</h3>
          <p className="text-xs text-slate-500 leading-relaxed">指定の形式で作成されたExcelを読み込み、複数の要員を一括で登録・更新できます。既存のエンジニア名と一致する場合は、二重登録を避けるためスキップまたは更新されます。</p>
          <Step num={1}><Badge color="green">Excelインポート</Badge> をクリックし、ファイルを選択します。</Step>
          <Step num={2}>読み込みプレビューを確認し、「実行」をクリックします。</Step>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Trash2 size={16} /> 一括削除</h3>
          <p className="text-xs text-slate-500">左端のチェックボックスで複数名を選択し、一括で削除できます。</p>
        </div>
      </div>
    ),
  },

  // ─── 4. 請求書 — 新規作成 ───
  {
    id: "invoice-create",
    title: "請求書 — 新規作成",
    icon: PlusCircle,
    color: "blue",
    feature: "invoice",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">「請求書管理」→「新規作成」、またはダッシュボードの「新規作成」ボタンから作成できます。</p>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📝 基本情報の入力</h3>
          <div className="space-y-3">
            <Step num={1}><strong>請求先</strong>のドロップダウンから取引先を選択します。</Step>
            <Step num={2}><strong>発行日</strong>を入力します（デフォルトは今日）。支払期限は自動計算されます。</Step>
            <Step num={3}><strong>テンプレート</strong>を選択します：<Badge>STANDARD</Badge>（標準請求書）または <Badge color="violet">SES</Badge>（エンジニア派遣専用）。</Step>
            <Step num={4}>件名・登録番号・適格事業者番号などを必要に応じて入力します。</Step>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🗂️ テンプレートの違い</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2"><Badge>STANDARD</Badge><span className="font-bold text-sm">標準テンプレート</span></div>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>品目・数量・単価・金額を一行ずつ入力</li>
                <li>商品販売・サービス請求など汎用</li>
              </ul>
            </div>
            <div className="border border-violet-200 rounded-xl p-4 space-y-2 bg-violet-50/30">
              <div className="flex items-center gap-2"><Badge color="blue">SES</Badge><span className="font-bold text-sm">SESテンプレート</span></div>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>担当者名・稼働月・稼働時間を入力</li>
                <li>精算幅（min/max 時間）の設定</li>
                <li>稼働時間入力時に超過・控除ステータスをリアルタイム表示</li>
                <li>超過・控除単価の自動計算ボタン付き</li>
                <li>CSV インポート対応</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📋 明細行の追加・削除</h3>
          <div className="space-y-3">
            <Step num={1}><Badge color="green">+ 明細行を追加</Badge> ボタンで行を追加します。</Step>
            <Step num={2}>各行に品目名・数量・単価を入力すると、金額が自動で計算されます。</Step>
            <Step num={3}>行の右端のゴミ箱アイコン <Trash2 size={12} className="inline text-rose-500" /> をクリックして行を削除できます。</Step>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">💾 保存・送信</h3>
          <div className="space-y-3">
            <Step num={1}><Badge color="slate">下書き保存</Badge> で一旦保存しておき、後で編集できます。</Step>
            <Step num={2}>内容が確定したら <Badge color="blue">作成（送付待ち）</Badge> で送付待ちステータスに変更します。</Step>
            <Step num={3}>入金確認後に「支払済」ステータスへ変更します。</Step>
          </div>
          <Tip>支払期限は発行日と取引先の締め日・支払日設定から自動計算されます。</Tip>
        </div>
      </div>
    ),
  },

  // ─── 5. SES精算幅・自動計算 ───
  {
    id: "ses",
    title: "SES請求書 — 精算幅・自動計算",
    icon: Zap,
    color: "violet",
    feature: "invoice",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">SES テンプレートでは、稼働時間と精算幅（基準時間帯）をもとに超過・控除金額を自動計算できます。稼働時間を入力するだけでリアルタイムに金額が確認できます。</p>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🔧 精算幅の設定</h3>
          <div className="space-y-3">
            <Step num={1}>SES 明細行に <strong>精算幅（最小時間 〜 最大時間）</strong> を入力します（例：140 〜 180 h）。</Step>
            <Step num={2}><strong>単価（基本費用）</strong> を入力します（例：500,000 円）。</Step>
            <Step num={3}><strong>稼働時間</strong>（数量列）を入力します。</Step>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">⚡ リアルタイム 稼働ステータス表示</h3>
          <p className="text-sm text-slate-600">稼働時間（数量）を入力するたびに、精算幅の下にステータスバッジが即座に更新されます。</p>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 font-bold text-slate-500">状態</th>
                  <th className="text-left px-4 py-2 font-bold text-slate-500">表示</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-500">稼働時間 = 0</td>
                  <td className="px-4 py-3 text-slate-400">稼働時間を入力してください</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-500">単価未設定</td>
                  <td className="px-4 py-3 text-slate-400">単価を入力すると超過・控除が自動計算されます</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3">精算範囲内</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      ✓ 精算範囲内（XXXh）
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3">精算幅超過</td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      ▲ 超過 X.XXh
                    </span>
                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">超過 +○○円</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">精算幅下回り</td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      ▼ 控除 X.XXh
                    </span>
                    <span className="text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-bold">控除 −○○円</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Tip>ボタン操作不要です。数量欄を変更するたびに即座に更新されます。</Tip>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🛠️ 超過・控除単価の自動計算ボタン</h3>
          <div className="space-y-3">
            <Step num={1}>精算幅と単価を入力した状態で、<Badge color="blue">精算幅から自動計算</Badge> ボタンをクリックします。</Step>
            <Step num={2}>以下の計算式で単価が自動設定されます：</Step>
          </div>
          <div className="bg-slate-900 text-emerald-400 rounded-xl p-4 font-mono text-xs space-y-1 my-2">
            <div>超過単価 = floor( 単価 ÷ 最大時間 )</div>
            <div>控除単価 = floor( 単価 ÷ 最小時間 )</div>
          </div>
          <Tip>単価を設定するだけで、以後の稼働時間入力時に超過・控除金額が自動計算されます。</Tip>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🔢 単価の切り捨てボタン</h3>
          <p className="text-sm text-slate-600 mb-2">超過単価・控除単価欄の下に切り捨てボタンが3種類あります。</p>
          <div className="flex gap-3 flex-wrap">
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold">1円未満切り捨て</div>
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold">10円未満切り捨て</div>
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold">100円未満切り捨て</div>
          </div>
          <Tip>例：自動計算で 2,857 円になった超過単価を「100円未満切り捨て」すると 2,800 円になり、取引先と合意した金額に合わせられます。</Tip>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Upload size={16} /> 勤怠データ読込 (CSV/Excel)</h3>
          <div className="space-y-3">
            <Step num={1}>勤怠システムから出力した <strong>CSV</strong> または <strong>Excel (.xlsx / .xls)</strong> ファイルを用意します。</Step>
            <Step num={2}>請求書作成・編集画面の右上にある <Badge color="slate">勤怠データ読込 (CSV/Excel)</Badge> ボタンをクリックします。</Step>
            <Step num={3}>ファイルを選択します。<strong>Excel の場合、複数のシート（企業別）が含まれていれば選択モーダルが表示されます。</strong></Step>
            <Step num={4}>対象の企業（シート）を選択すると、名前、稼働時間、年月、単価、精算幅が自動で反映されます。</Step>
            <Step num={5}>単価と精算幅が読み込まれた場合、超過・控除単価も自動的に計算・設定されます。</Step>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">対応項目 (自動認識キーワード)</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div><strong>名前</strong>：名前, 氏名, Name</div>
              <div><strong>時間</strong>：時間, 稼働時間, Hours</div>
              <div><strong>年月</strong>：年月, Month</div>
              <div><strong>単価</strong>：単価, Price, Rate</div>
              <div><strong>精算幅</strong>：精算幅, Range</div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">※精算幅は <code>140-180</code> のような形式で読み取り可能です。</p>
          </div>
          <Tip>
            Excel のシート名を企業名にしておくと、インポート時のシート選択が非常にスムーズになります。<br />
            例：シート名「A株式会社」を選択 → 氏名や稼働時間が自動で展開
          </Tip>
        </div>
      </div>
    ),
  },

  // ─── 6. 請求書一覧・検索 ───
  {
    id: "invoice-list",
    title: "請求書管理 — 一覧・検索・操作",
    icon: Search,
    color: "slate",
    feature: "invoice",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">「請求書管理」ページで全請求書を一覧表示・絞り込み・ステータス変更できます。</p>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🔍 絞り込み検索</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { label: "キーワード", desc: "請求書番号・取引先名で検索" },
              { label: "発行日（範囲）", desc: "開始日〜終了日で絞り込み" },
              { label: "金額（範囲）", desc: "最小金額〜最大金額で絞り込み" },
              { label: "ステータス", desc: "下書き / 送付待ち / 支払済 を選択" },
            ].map(f => (
              <div key={f.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="font-bold text-slate-700 mb-0.5">{f.label}</div>
                <div className="text-slate-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📋 各行のアクション</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-4 py-3">
              <Eye size={16} className="text-slate-400 shrink-0" />
              <span><strong>詳細表示</strong>：請求書番号をクリックすると詳細画面へ遷移</span>
            </div>
            <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-4 py-3">
              <Edit size={16} className="text-blue-400 shrink-0" />
              <span><strong>編集</strong>：鉛筆アイコンから内容の修正が可能</span>
            </div>
            <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-4 py-3">
              <Printer size={16} className="text-slate-400 shrink-0" />
              <span><strong>印刷 / PDF プレビュー</strong>：プリンタアイコンからプレビュー画面へ</span>
            </div>
            <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-4 py-3">
              <Copy size={16} className="text-emerald-400 shrink-0" />
              <span><strong>複製</strong>：コピーアイコンで内容を複製した新規請求書を作成</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><CheckSquare size={16} /> ステータスの一括変更</h3>
          <div className="space-y-3">
            <Step num={1}>テーブル左端のチェックボックスで複数の請求書を選択します。</Step>
            <Step num={2}>テーブル上部に表示される <Badge color="slate">ステータス一括変更</Badge> を選択します。</Step>
            <Step num={3}>変更したいステータスを選択して適用します。</Step>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📊 CSV エクスポート</h3>
          <div className="space-y-3">
            <Step num={1}>一覧画面右上の <Badge color="slate">CSV エクスポート</Badge> ボタンをクリックします。</Step>
            <Step num={2}>現在の絞り込み条件でフィルタリングされた全請求書が CSV でダウンロードされます。</Step>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Trash2 size={16} className="text-rose-500" /> 請求書の一括削除</h3>
          <div className="space-y-3">
            <Step num={1}>テーブル左端のチェックボックスで削除したい請求書を選択します。</Step>
            <Step num={2}>上部の選択バーに表示される <Badge color="rose">削除</Badge> ボタンをクリックします。</Step>
            <Step num={3}>確認ダイアログが表示されるので「OK」を押すと削除されます。</Step>
          </div>
          <Warn>削除した請求書は復元できません。事前に PDF でバックアップすることをお勧めします。</Warn>
        </div>
      </div>
    ),
  },

  // ─── 7. 請求書詳細・PDF ───
  {
    id: "invoice-detail",
    title: "請求書詳細 — PDF・注文書出力",
    icon: Printer,
    color: "emerald",
    feature: "invoice",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">請求書の行をクリックすると詳細画面が開き、PDF や関連書類を出力できます。</p>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📄 PDF のダウンロード</h3>
          <div className="space-y-3">
            <Step num={1}>請求書詳細画面を開きます。</Step>
            <Step num={2}><Badge color="blue">PDF ダウンロード</Badge> ボタンをクリックします。</Step>
            <Step num={3}>登録番号・適格事業者番号を含む請求書 PDF が生成されます。</Step>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📦 注文書・注文請書の出力</h3>
          <div className="space-y-3">
            <Step num={1}>詳細画面の <Badge color="slate">注文書 PDF</Badge> ボタンをクリックします。</Step>
            <Step num={2}>請求書の内容をもとに「注文書」が自動生成されます。</Step>
            <Step num={3}><Badge color="slate">注文請書 PDF</Badge> から自社発行の注文請書も出力できます。</Step>
          </div>
          <Tip>注文書・注文請書には会社情報（設定画面で登録）が自動的に差し込まれます。</Tip>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🔁 請求書を複製する</h3>
          <div className="space-y-3">
            <Step num={1}>詳細画面の <Badge color="slate">複製</Badge> ボタンをクリックします。</Step>
            <Step num={2}>内容が全てコピーされた新規下書きが作成されます。</Step>
            <Step num={3}>発行日などを変更して保存します。</Step>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🗑️ 請求書を削除する</h3>
          <div className="space-y-3">
            <Step num={1}>詳細画面の <Badge color="rose">削除</Badge> ボタンをクリックします。</Step>
            <Step num={2}>確認ダイアログで「削除」を選択します。</Step>
          </div>
          <Warn>削除した請求書は復元できません。誤って削除しないようご注意ください。</Warn>
        </div>
      </div>
    ),
  },

  // ─── 7.5. メール送信・ダウンロードリンク ───
  {
    id: "email-send",
    title: "請求書メール送信・ダウンロードリンク",
    icon: Mail,
    color: "blue",
    feature: "invoice",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">
          請求書を直接メールで送信できます。受信者はリンクにアクセスするだけで、パスワード付きZIPとして請求書PDFをダウンロードできます。
        </p>

        {/* メール送信の手順 */}
        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Mail size={18} className="text-blue-500" /> メールを送信する</h3>
          <div className="space-y-3">
            <Step num={1}>請求書一覧または詳細画面の <Badge color="blue">メール送信</Badge> ボタンをクリックします。</Step>
            <Step num={2}>宛先メールアドレスを確認・入力します（取引先のメールアドレスが自動で入力されます）。</Step>
            <Step num={3}>テンプレートを選択すると件名・本文が自動で入力されます。</Step>
            <Step num={4}>「担当者名（署名に表示）」欄に担当者の名前を入力します（省略可）。</Step>
            <Step num={5}><Badge color="blue">メールを送信する</Badge> をクリックします。</Step>
          </div>
          <Tip>本文は自由に編集できます。送信ボタンを押すと、ダウンロードリンクと署名が末尾に自動で追加されます。</Tip>
        </div>

        {/* ダウンロードリンクの仕組み */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Link size={18} className="text-blue-500" /> ダウンロードリンクの仕組み</h3>
          <p className="text-sm text-slate-600">
            送信ごとに新しいURL・パスワードが自動発行され、メール本文に記載されます。
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-600">
            <div>--------------------------------------------------</div>
            <div>請求書の表示・ダウンロードはこちらからお願いいたします。</div>
            <div>URL: https://example.com/public/invoices/xxxx</div>
            <div>パスワード: <span className="text-blue-600 font-bold">abc12345</span></div>
            <div>--------------------------------------------------</div>
            <div className="text-slate-400">※このURLおよびパスワードの有効期限は本日から7日間です。</div>
          </div>
          <Warn>リンクの有効期限は<strong>送信日から7日間</strong>です。再送すると新しいリンクと新しいパスワードが発行されます。古いリンクは無効になります。</Warn>
        </div>

        {/* 受信者のダウンロード手順 */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Lock size={18} className="text-emerald-500" /> 受信者のダウンロード手順</h3>
          <div className="space-y-3">
            <Step num={1}>メール内のURLをブラウザで開きます（ログイン不要）。</Step>
            <Step num={2}>メールに記載のパスワードを入力して「認証する」をクリックします。</Step>
            <Step num={3}>「請求書ZIPをダウンロード」ボタンをクリックします。</Step>
            <Step num={4}>ZIPファイルがダウンロードされ、画面に<strong>ZIPの解凍パスワード</strong>が表示されます。</Step>
            <Step num={5}>ZIPを解凍する際に表示されたパスワードを入力するとPDFが取り出せます。</Step>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="font-bold text-sm text-blue-800 mb-2">🔑 セキュリティ構造</div>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li><strong>1段階目</strong>：URLアクセス用パスワード（メール記載）</li>
                <li><strong>2段階目</strong>：ZIP解凍用パスワード（ダウンロード時に自動生成）</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="font-bold text-sm text-amber-800 mb-2">⚠️ ZIPパスワードの注意</div>
              <p className="text-xs text-amber-700">ZIPの解凍パスワードは<strong>ダウンロード時の1回のみ</strong>表示されます。受信者にメモするよう案内してください。</p>
            </div>
          </div>
        </div>

        {/* 名刺署名 */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700">🪪 メール署名（名刺）の自動付加</h3>
          <p className="text-sm text-slate-600">送信時に自社情報が名刺形式でメール末尾に自動付加されます。</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-600 space-y-0.5">
            <div>━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            <div>会社名：<span className="text-slate-400">システム設定の会社名</span></div>
            <div>住所：〒<span className="text-slate-400">郵便番号</span></div>
            <div>　　　<span className="text-slate-400">住所</span></div>
            <div>担当者：<span className="text-slate-400">入力した担当者名</span></div>
            <div>連絡先：<span className="text-slate-400">電話番号</span></div>
            <div>━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          </div>
          <Tip>担当者名は送信モーダルの「担当者名（署名に表示）」欄で都度入力します。空欄にすると担当者行が省略されます。会社名・住所・電話番号は<strong>システム設定</strong>の自社基本情報から自動で取得されます。</Tip>
        </div>
      </div>
    ),
  },

  // ─── 8. 見積書 ───
  {
    id: "attendance-monitoring",
    title: "勤怠管理 — モニタリング・承認",
    icon: Clock,
    color: "blue",
    feature: "attendance",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">スタッフのリアルタイムな打刻状況を確認し、日次の承認業務を行います。</p>
        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2">📱 打刻モニタリング</h3>
          <p className="text-sm text-slate-600">「勤怠管理」画面のメインパネルでは、スタッフ全員の現在の出勤・休憩・退勤状況がライブ更新されます。</p>
          <ul className="text-xs space-y-1 list-disc list-inside text-slate-500">
            <li>遅刻・未打刻の可能性があるスタッフは強調表示されます。</li>
            <li>スタッフ名をクリックすると、個別の詳細履歴を確認できます。</li>
          </ul>
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700 flex items-center gap-2">✅ 打刻報告の承認</h3>
          <p className="text-sm text-slate-600">スタッフからの打刻報告（申請）が「承認待ち」タブに表示されます。</p>
          <Step num={1}>報告内容（出退勤時間、勤務区分、備考など）を確認します。</Step>
          <Step num={2}>問題なければ <Badge color="blue">承認</Badge> をクリック、修正が必要な場合は <Badge color="rose">差戻し</Badge> を行います。</Step>
        </div>
      </div>
    ),
  },
  {
    id: "attendance-summary",
    title: "勤怠集計 — 月次締め操作",
    icon: ListChecks,
    color: "emerald",
    feature: "attendance",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">月間の稼働実績を確定し、請求書作成のためのデータを準備します。</p>
        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📊 稼働時間の集計</h3>
          <div className="space-y-3">
            <Step num={1}>「勤怠集計」で対象となる年月を選択します。</Step>
            <Step num={2}>各スタッフの総稼働時間、精算幅に対する過不足（超過・控除）が自動計算されます。</Step>
            <Step num={3}>個別の行をクリックすると、日ごとの詳細内訳を確認できます。</Step>
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700">🔒 月次確定の流れ</h3>
          <div className="space-y-3">
            <Step num={1}>全ての打刻が本人申請・管理者承認されていることを確認します。</Step>
            <Step num={2}>「月次確定」ボタン（または一括承認）をクリックすると、その月のデータがロックされます。</Step>
          </div>
          <Tip>集計結果は <Badge color="slate">Excel出力</Badge> が可能です。出力したファイルは請求書の「勤怠データ読込」でそのまま利用できます。</Tip>
        </div>
      </div>
    ),
  },
  {
    id: "attendance-shifts",
    title: "シフト管理 — 予定登録",
    icon: Calendar,
    color: "amber",
    feature: "attendance",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">将来の勤務スケジュールや、休暇の予定を管理します。</p>
        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🏠 スケジュールの登録</h3>
          <div className="space-y-3">
            <Step num={1}>「シフト管理」ページのカレンダーから日付を選択します。</Step>
            <Step num={2}>勤務時間（開始・終了）と休憩時間を入力し、保存します。</Step>
            <Step num={3}><Badge color="amber">標準シフトをコピー</Badge> 機能を使うと、月全体の平日分を一括で埋めることができます。</Step>
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700">📣 変更申請への対応</h3>
          <p className="text-sm text-slate-600">スタッフが自身の予定（シフト）を変更申請した場合、管理者に通知が届きます。管理画面上で「承認」を行うとスケジュールが正式に更新されます。</p>
        </div>
      </div>
    ),
  },
  {
    id: "quotation",
    title: "見積書管理",
    icon: FileText,
    color: "amber",
    feature: "invoice",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">「見積書管理」ページで見積書の作成・管理が可能です。</p>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">➕ 見積書を作成する</h3>
          <div className="space-y-3">
            <Step num={1}>「見積書管理」→「新規作成」をクリックします。</Step>
            <Step num={2}>取引先・見積日・有効期限を入力します。</Step>
            <Step num={3}>明細行に品目・数量・単価を入力します（請求書と同じ操作です）。</Step>
            <Step num={4}>「保存」ボタンで登録します。</Step>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📄 見積書の PDF 出力</h3>
          <div className="space-y-3">
            <Step num={1}>見積書一覧または詳細画面で <Badge color="amber">PDF ダウンロード</Badge> をクリックします。</Step>
            <Step num={2}>会社情報が自動反映された見積書 PDF が生成されます。</Step>
          </div>
        </div>

        <Tip>見積書から請求書を直接作成する機能は現在開発中です。しばらくお待ちください。</Tip>
      </div>
    ),
  },

  // ─── 9. ユーザー管理・操作ログ ───
  {
    id: "user-management",
    title: "ユーザー管理・権限設定",
    icon: Shield,
    color: "slate",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">システムを利用できるユーザーアカウントと、それぞれの権限を管理します。</p>
        <div className="space-y-3">
          <h3 className="font-black text-slate-700">👥 ユーザーの招待・追加</h3>
          <Step num={1}>「ユーザー管理」画面で <Badge color="slate">+ ユーザー追加</Badge> をクリックします。</Step>
          <Step num={2}>名前、メールアドレス、パスワード、および<strong>ロール（権限）</strong>を選択します。</Step>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-bold text-sm text-slate-700">🔐 ロールの種類</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5"><Badge color="blue">ADMIN</Badge> 管理者</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">全ての機能（請求作成、勤怠承認、ユーザー管理、システム設定）を利用できます。</p>
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5"><Badge color="slate">USER</Badge> 一般ユーザー</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">自身の勤怠入力やシフト管理、見積書作成などが可能です（一部制限あり）。</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "audit-logs",
    title: "操作ログ — 監査履歴",
    icon: History,
    color: "slate",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">データの作成・更新・削除など、誰がいつ何を行ったかの履歴を時系列で確認できます。</p>
        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2">🔍 履歴の確認</h3>
          <Step num={1}>「その他」メニューから「操作ログ」を選択します。</Step>
          <Step num={2}>ログ一覧から、特定のアクション（例：請求書削除）やユーザーを特定できます。</Step>
        </div>
        <Tip>不正防止やトラブル時の原因究明に役立ててください。ログは自動記録され、変更することはできません。</Tip>
      </div>
    ),
  },
  {
    id: "mail-templates",
    title: "メールテンプレート設定",
    icon: Mail,
    color: "indigo",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">請求書送付時などに使用するメールの件名・本文を自由に編集できます。</p>
        <div className="space-y-3">
          <h3 className="font-black text-slate-700">📝 テンプレートの編集</h3>
          <Step num={1}>「システム設定」内の「メールテンプレート」を選択します。</Step>
          <Step num={2}>編集したい項目を選び、内容を書き換えて保存します。</Step>
          <p className="text-xs text-slate-500 leading-relaxed mt-2">
            <code>{"{{clientName}}"}</code> や <code>{"{{invoiceNumber}}"}</code> などの変数を使用すると、送信時に自動的に情報が差し込まれます。
          </p>
        </div>
      </div>
    ),
  },

  // ─── 10. システム設定 ───
  {
    id: "settings",
    title: "システム設定",
    icon: Settings,
    color: "slate",
    content: (features) => (
      <div className="space-y-6">
        <p className="text-slate-600">PDF や請求書に印字される自社情報を設定します。最初に必ず設定してください。</p>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">🏢 会社情報の設定</h3>
          <div className="space-y-3">
            <Step num={1}>左サイドバーの「システム設定」をクリックします。</Step>
            <Step num={2}>以下の情報を入力します：</Step>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "会社名", desc: "PDF に印字される正式名称" },
              { label: "郵便番号・住所", desc: "請求書の送付元住所" },
              { label: "電話番号", desc: "PDF の連絡先に表示" },
              { label: "適格事業者登録番号", desc: "インボイス制度対応のための番号" },
              { label: "実績承認番号", desc: "必要な場合のみ入力" },
              { label: "銀行口座情報", desc: "請求書下部の振込先欄に表示" },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="font-bold text-xs text-slate-700">{item.label}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
          <Step num={3}>入力後、「保存」ボタンをクリックします。</Step>
          <Tip>会社情報は全ての PDF（請求書・見積書・注文書）に反映されます。変更すると過去の PDF 再生成時にも反映されます。</Tip>
        </div>
      </div>
    ),
  },

  // ─── 10. よくある質問 ───
  {
    id: "faq",
    title: "よくある質問（FAQ）",
    icon: Info,
    color: "rose",
    content: (features) => (
      <div className="space-y-4">
        {[
          {
            q: "請求書番号はどのように採番されますか？",
            a: "新規作成時に自動採番されます（形式：INV-YYYYMM-XXXX）。手動で番号を指定することも可能です。",
          },
          {
            q: "支払期限はどう決まりますか？",
            a: "発行日と取引先設定の「締め日」「支払日」から自動計算されます。祝日・週末は次の営業日に繰り越されます。",
          },
          {
            q: "削除した請求書は復元できますか？",
            a: "はい、可能です。「請求書一覧」画面にある「ゴミ箱」ボタンから、削除済みの請求書を確認・復元できます。",
          },
          {
            q: "複数ユーザーで利用できますか？",
            a: "アカウントは1つのみ対応しています。複数アカウント対応は今後のアップデートで予定しています。",
          },
          {
            q: "PDF が文字化けする・表示されない場合は？",
            a: "ブラウザキャッシュをクリアして再試行してください。それでも解決しない場合はシステム管理者にお問い合わせください。",
          },
          {
            q: "消費税率を変更できますか？",
            a: "請求書作成・編集画面の「税率」欄で変更できます（デフォルト：10%）。",
          },
        ].map((item, i) => (
          <details key={i} className="group border border-slate-200 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="text-sm">{item.q}</span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 text-sm text-slate-600 leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    ),
  },
];

// -------- メインページ --------

export default function ManualPage() {
  const { data: session } = useSession();
  const [active, setActive] = useState<string>("overview");

  const features = {
    hasInvoiceFeature: (session?.user as any)?.hasInvoiceFeature !== false,
    hasAttendanceFeature: (session?.user as any)?.hasAttendanceFeature === true,
  };

  const filteredSections = SECTIONS.filter(sec => {
    if (sec.feature === "invoice" && !features.hasInvoiceFeature) return false;
    if (sec.feature === "attendance" && !features.hasAttendanceFeature) return false;
    return true;
  });

  const currentSection = filteredSections.find(s => s.id === active) || filteredSections[0];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-600 text-white",
    violet: "bg-violet-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-500 text-white",
    slate: "bg-slate-700 text-white",
    rose: "bg-rose-600 text-white",
  };

  const accentMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    violet: "bg-violet-50 text-violet-600 border-violet-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
  };

  return (
    <div className="flex gap-0 max-w-6xl mx-auto">
      {/* サイドナビ */}
      <div className="w-56 shrink-0 sticky top-0 h-screen overflow-y-auto py-8 pr-4">
        <div className="flex items-center gap-2 mb-6 pl-1">
          <Book size={20} className="text-blue-600" />
          <span className="text-lg font-black text-slate-800 tracking-tight">マニュアル</span>
        </div>
        <nav className="space-y-1">
          {filteredSections.map(sec => {
            const isActive = sec.id === active;
            return (
              <button
                key={sec.id}
                onClick={() => setActive(sec.id)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                  ? `${colorMap[sec.color]} shadow-sm`
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <sec.icon size={16} className="shrink-0" />
                <span className="leading-tight">{sec.title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 py-8 pl-8 border-l border-slate-200 min-h-screen">
        <div className="mb-8">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold mb-3 ${accentMap[currentSection.color]}`}>
            <currentSection.icon size={16} />
            {currentSection.title}
          </div>
          <div className="h-px bg-slate-100" />
        </div>
        <div className="max-w-2xl">
          {currentSection.content(features)}
        </div>

        {/* 前後ナビ */}
        <div className="flex justify-between mt-16 pt-8 border-t border-slate-200 max-w-2xl">
          {(() => {
            const idx = filteredSections.findIndex(s => s.id === active);
            const prev = filteredSections[idx - 1];
            const next = filteredSections[idx + 1];
            return (
              <>
                {prev ? (
                  <button onClick={() => setActive(prev.id)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    <ChevronRight size={16} className="rotate-180" /> {prev.title}
                  </button>
                ) : <div />}
                {next ? (
                  <button onClick={() => setActive(next.id)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    {next.title} <ChevronRight size={16} />
                  </button>
                ) : <div />}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
