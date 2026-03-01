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
} from "lucide-react";

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
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  // ─── 1. システム概要 ───
  {
    id: "overview",
    title: "システム概要・基本の流れ",
    icon: Lightbulb,
    color: "blue",
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 leading-relaxed">
          IFJ-SYSTEM は、SES ビジネス（エンジニア派遣）に特化した請求書・見積書管理システムです。<br />
          取引先（エンジニアの派遣先）と、エンジニア（稼働者）の情報を一元管理し、毎月の請求業務を効率化します。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { num: "1", color: "bg-blue-600", icon: Users, title: "取引先登録", desc: "請求先企業とエンジニアを登録" },
            { num: "2", color: "bg-violet-600", icon: FileText, title: "見積書作成", desc: "必要に応じて見積書を発行" },
            { num: "3", color: "bg-slate-800", icon: PlusCircle, title: "請求書作成", desc: "SES / 標準テンプレートで作成" },
            { num: "4", color: "bg-emerald-600", icon: Download, title: "PDF出力", desc: "請求書・注文書などをダウンロード" },
          ].map(item => (
            <div key={item.num} className={`${item.color} text-white p-5 rounded-2xl relative overflow-hidden`}>
              <div className="absolute -right-3 -bottom-3 opacity-10"><item.icon size={64} /></div>
              <div className="text-xs font-bold opacity-60 mb-1">STEP {item.num}</div>
              <div className="font-black text-base mb-1">{item.title}</div>
              <p className="text-[11px] opacity-80">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">画面一覧</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {[
                { page: "ダッシュボード", path: "/", desc: "売上統計・最近の請求書・契約更新アラート" },
                { page: "見積書管理", path: "/quotations", desc: "見積書の作成・編集・PDF出力" },
                { page: "請求書管理", path: "/invoices", desc: "請求書の検索・一覧・ステータス管理" },
                { page: "取引先管理", path: "/clients", desc: "取引先企業・エンジニア情報・契約期間管理" },
                { page: "操作マニュアル", path: "/manual", desc: "このページ" },
                { page: "システム設定", path: "/settings", desc: "会社情報・登録番号・実績承認番号の設定" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-800 w-36">{row.page}</td>
                  <td className="px-3 py-3"><code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-blue-600">{row.path}</code></td>
                  <td className="px-3 py-3 text-slate-500 text-xs">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    content: (
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

        {/* 契約更新アラート */}
        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><AlertTriangle size={16} /> 契約更新アラート</h3>
          <p className="text-sm text-slate-600">
            取引先管理でエンジニアに「契約終了日」を登録しておくと、終了日の<strong>2ヶ月前から</strong>ダッシュボード上部に警告カードが表示されます。
            カードの <ChevronRight size={12} className="inline" /> から取引先管理へ直接ジャンプできます。
          </p>
        </div>
      </div>
    ),
  },

  // ─── 3. 取引先・要員管理 ───
  {
    id: "clients",
    title: "取引先・要員管理",
    icon: Users,
    color: "emerald",
    content: (
      <div className="space-y-8">
        <p className="text-slate-600">請求先企業と、そこに派遣しているエンジニア（要員）の情報を管理します。</p>

        {/* 取引先登録 */}
        <div className="space-y-3">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><PlusCircle size={18} className="text-emerald-500" /> 取引先（企業）を登録する</h3>
          <div className="space-y-3">
            <Step num={1}>左サイドバーの「取引先管理」をクリックします。</Step>
            <Step num={2}>右上の <Badge color="green">+ 新規取引先</Badge> ボタンをクリックします。</Step>
            <Step num={3}>モーダルが開くので、<strong>会社名</strong>（必須）、住所、電話番号、メールアドレスを入力します。</Step>
            <Step num={4}>「保存」ボタンで登録完了です。</Step>
          </div>
        </div>

        {/* 要員管理（個別） */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Users size={18} className="text-emerald-500" /> 要員を個別登録する</h3>
          <div className="space-y-3">
            <Step num={1}>取引先の詳細画面（または要員一覧の「新規登録」）から行います。</Step>
            <Step num={2}><strong>区分</strong>（プロパー/BP）と<strong>エリア</strong>（関東/関西/名古屋）を選択します。</Step>
            <Step num={3}>単価や精算幅を設定しておくと、請求書作成時に自動的に反映されます。</Step>
            <Step num={4}>契約終了日を設定すると、2ヶ月前からダッシュボードにアラートが表示されます。</Step>
          </div>
          <Tip>要員を登録しておくと、SES請求書作成時に担当者名を選択リストから選べるようになります。</Tip>
        </div>

        {/* Excelインポート */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700 flex items-center gap-2 text-lg"><Upload size={20} className="text-emerald-600" /> Excel一括インポート</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            大量の要員データを一度に登録・更新できます。規定のフォーマットに合わせてExcelを作成してください。
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <ListChecks size={16} className="text-blue-500" /> 推奨される列構成 (左から順)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] border-b border-slate-200 pb-1">
                  <span className="font-mono text-slate-400">列B</span>
                  <span className="font-bold">名前 (フルネーム)</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-200 pb-1">
                  <span className="font-mono text-slate-400">列C</span>
                  <span className="font-bold">区分 (プロパー / BP)</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-200 pb-1">
                  <span className="font-mono text-slate-400">列D</span>
                  <span className="font-bold">エリア (関東 / 関西 / 名古屋)</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-200 pb-1">
                  <span className="font-mono text-slate-400">列E</span>
                  <span className="font-bold">取引先名</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] border-b border-slate-200 pb-1">
                  <span className="font-mono text-slate-400">列H</span>
                  <span className="font-bold">単価 (数値のみ)</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-200 pb-1">
                  <span className="font-mono text-slate-400">列J</span>
                  <span className="font-bold">精算下限 (例: 140)</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-200 pb-1">
                  <span className="font-mono text-slate-400">列K</span>
                  <span className="font-bold">精算上限 (例: 180)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-700">✅ インポートの仕組みと注意点</h4>
            <div className="space-y-3">
              <Step num={1}><strong>重複の自動防止</strong>：既に登録済みの名前と同一の要員は、二重登録を避けるため自動的にスキップされます。</Step>
              <Step num={2}><strong>取引先の自動紐付け</strong>：Excel内の取引先名がマスタに存在しない場合、システムが自動的に新しい取引先を作成します。</Step>
              <Step num={3}><strong>型変換</strong>：「プロパー」という文字が含まれていれば自社社員、それ以外はBPとして取り込まれます。</Step>
              <Step num={4}><strong>データの成型</strong>：数値項目（単価や時間）に「円」や「h」などの文字が入っていても、システム側で自動的に除去して数値として読み取ります。</Step>
            </div>
          </div>

          <Warn>
            Excelの1行目はヘッダーとして読み飛ばされます。データは2行目から入力してください。
          </Warn>
        </div>

        {/* 一括削除 */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-black text-slate-700 flex items-center gap-2"><Trash2 size={18} className="text-rose-500" /> 要員の一括削除</h3>
          <div className="space-y-3">
            <Step num={1}>要員一覧の左端にあるチェックボックスで対象を選択します。</Step>
            <Step num={2}>ヘッダーのチェックボックスをクリックすると、現在表示されている全要員を選択できます。</Step>
            <Step num={3}>右上の <Badge color="rose">選択中(N)を削除</Badge> ボタンをクリックします。</Step>
            <Step num={4}>確認ダイアログが表示されるので、問題なければ実行します。</Step>
          </div>
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
    content: (
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
    content: (
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
    content: (
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
      </div>
    ),
  },

  // ─── 7. 請求書詳細・PDF ───
  {
    id: "invoice-detail",
    title: "請求書詳細 — PDF・注文書出力",
    icon: Printer,
    color: "emerald",
    content: (
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

  // ─── 8. 見積書 ───
  {
    id: "quotation",
    title: "見積書管理",
    icon: FileText,
    color: "amber",
    content: (
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

  // ─── 9. システム設定 ───
  {
    id: "settings",
    title: "システム設定",
    icon: Settings,
    color: "slate",
    content: (
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
    content: (
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
            a: "現在のバージョンでは復元機能はありません。削除前に PDF でバックアップすることをお勧めします。",
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
  const [active, setActive] = useState<string>("overview");

  const currentSection = SECTIONS.find(s => s.id === active)!;

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
          {SECTIONS.map(sec => {
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
          {currentSection.content}
        </div>

        {/* 前後ナビ */}
        <div className="flex justify-between mt-16 pt-8 border-t border-slate-200 max-w-2xl">
          {(() => {
            const idx = SECTIONS.findIndex(s => s.id === active);
            const prev = SECTIONS[idx - 1];
            const next = SECTIONS[idx + 1];
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
