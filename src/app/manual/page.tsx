"use client";

import React from "react";
import { 
  Book, 
  ChevronRight, 
  FileText, 
  Users, 
  Calendar, 
  Download, 
  Copy, 
  AlertTriangle,
  Lightbulb,
  Info
} from "lucide-react";

const ManualSection = ({ title, icon: Icon, children }: any) => (
  <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 last:mb-0">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
        <Icon size={24} />
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
    </div>
    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
      {children}
    </div>
  </section>
);

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="border border-slate-100 bg-slate-50 p-4 rounded-xl">
    <h4 className="font-bold text-slate-800 text-sm mb-1">{title}</h4>
    <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
  </div>
);

export default function ManualPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 pb-24">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Book className="text-blue-600" size={32} />
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">User Manual</h1>
        </div>
        <p className="text-slate-500 text-lg">システムを最大限に活用するためのガイドです。</p>
      </div>

      <ManualSection title="基本的な流れ" icon={Lightbulb}>
        <p className="mb-4">
          本システムは、見積書から請求書、さらに注文書・注文請書までを一貫して管理することを目的としています。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Users size={80} />
            </div>
            <div className="font-black text-xl mb-2">1. 取引先登録</div>
            <p className="text-blue-100 text-xs text-pretty">まずは「取引先管理」から請求先企業と所属エンジニアを登録します。</p>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <FileText size={80} />
            </div>
            <div className="font-black text-xl mb-2">2. 請求書作成</div>
            <p className="text-slate-400 text-xs text-pretty">「請求書管理」から新規作成。SES（エンジニア）向けテンプレートが便利です。</p>
          </div>
          <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Download size={80} />
            </div>
            <div className="font-black text-xl mb-2">3. 書類出力</div>
            <p className="text-emerald-100 text-xs text-pretty">完成した請求書からPDFを出力。関連する注文書・注文請書も同時に出力可能です。</p>
          </div>
        </div>
      </ManualSection>

      <ManualSection title="SES請求書の自動化機能" icon={Calendar}>
        <p className="mb-4">SES案件に特化した強力な自動化機能を搭載しています。</p>
        <div className="space-y-4">
          <FeatureCard 
            title="精算時間の自動計算" 
            description="稼働時間を入力するだけで、事前に設定した基準時間（例：140h-180h）に基づき超過・控除額を自動計算します。" 
          />
          <FeatureCard 
            title="CSV勤怠インポート" 
            description="勤怠システムから出力したCSVを読み込むことで、エンジニア全員分の稼働時間を一括で反映できます。" 
          />
          <FeatureCard 
            title="月始一括作成" 
            description="ダッシュボードの「月始一括作成」ボタンから、前月の全請求書をベースに翌月分の下書きを一括生成できます。" 
          />
        </div>
      </ManualSection>

      <ManualSection title="契約更新の管理" icon={AlertTriangle}>
        <p className="mb-4">
          「取引先管理」でエンジニア（該当者）ごとに契約期間を登録できます。
        </p>
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Info size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 mb-1">更新期限のアラート機能</h4>
              <p className="text-amber-700 text-sm leading-relaxed">
                契約終了日の2ヶ月前になると、ダッシュボード上部に自動的にアラートが表示されます。
                これにより、更新忘れや期限ぎりぎりの対応を防ぐことができます。
              </p>
            </div>
          </div>
        </div>
      </ManualSection>

      <ManualSection title="書類の変換・複製" icon={Copy}>
        <p className="mb-4">
          一度作成したデータを最大限に再利用できます。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <Download className="text-blue-600" size={18} />
              注文書・注文請書への変換
            </h4>
            <p className="text-xs text-slate-500">
              請求書詳細画面から、その内容に基づいた「注文書」と「注文請書」をPDF形式で即座にダウンロードできます。
            </p>
          </div>
          <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <Copy className="text-blue-600" size={18} />
              請求書の複製
            </h4>
            <p className="text-xs text-slate-500">
              既存の請求書を1クリックで複製し、内容を一部変更して新しい請求書を作成できます。
            </p>
          </div>
        </div>
      </ManualSection>

      <div className="mt-12 text-center">
        <p className="text-slate-400 text-sm italic">不明点がある場合は、システム管理者までお問い合わせください。</p>
      </div>
    </div>
  );
}
