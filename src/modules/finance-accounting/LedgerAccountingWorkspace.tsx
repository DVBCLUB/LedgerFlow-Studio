import React, { useState } from 'react';
import AccountingVietnam from './AccountingVietnam';
import AccountingVietnamDeepDivePanel from './AccountingVietnamDeepDivePanel';
import CustomDataWorkbench from '../analytics-models-sandbox/CustomDataWorkbench';
import InvoiceSplitViewDemo from './components/InvoiceSplitViewDemo';
import RealVoucherApprovalCenter from './components/RealVoucherApprovalCenter';
import { Beaker, BookOpen, Database, ScanLine, FileCheck2, FileText } from 'lucide-react';
import FinancialReportsVN from './FinancialReportsVN';
import AdvisoryBoardReport from './AdvisoryBoardReport';
import FounderReviewChecklist from './FounderReviewChecklist';
import DoubleEntryPostingPanel from './DoubleEntryPostingPanel';

export default function LedgerAccountingWorkspace() {
  const [activeTab, setActiveTab] = useState<'voucher' | 'invoice' | 'deepdive' | 'workbench' | 'lab' | 'reports' | 'posting'>('voucher');

  const tabs = [
    { id: 'voucher' as const, label: 'Trung tâm Hạch toán & Phê duyệt', icon: FileCheck2, desc: 'Lập chứng từ Nợ/Có kép VAS 200/133 & Luồng phê duyệt 6 bước.' },
    { id: 'invoice' as const, label: 'Xử lý Chứng từ AI OCR', icon: ScanLine, desc: 'Split view AI OCR đối chiếu hóa đơn gốc.' },
    { id: 'deepdive' as const, label: 'Chế độ Kế toán VAS', icon: BookOpen, desc: 'Quy định Thông tư 200/133, thuế suất VAT và hàng tồn kho.' },
    { id: 'workbench' as const, label: 'Bàn làm việc dữ liệu', icon: Database, desc: 'Công cụ làm việc và phân tích dữ liệu tùy biến.' },
    { id: 'lab' as const, label: 'Phòng Lab & Mô phỏng', icon: Beaker, desc: 'Mô phỏng tài chính, what-if và chấm điểm ý tưởng.' },
    { id: 'reports' as const, label: 'Báo cáo tài chính', icon: FileText, desc: 'Bảng cân đối B01, KQKD B02, lưu chuyển tiền tệ B03 & phân tích.' },
    { id: 'posting' as const, label: 'Bút toán kép', icon: FileCheck2, desc: 'Hạch toán Nợ/Có kép tự động theo VAS 200/133.' }
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in text-text-primary">
      {/* Premium Tab Selector */}
      <div className="bg-bg-surface p-1.5 rounded-2xl border border-border-primary flex text-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer border ${
                isActive 
                  ? 'bg-info/15 border-info/30 text-info shadow-md shadow-cyan-500/5' 
                  : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Renders */}
      <div className="transition-all duration-300">
        {activeTab === 'voucher' && (
          <div className="animate-fade-in">
            <RealVoucherApprovalCenter />
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="animate-fade-in">
            <AccountingVietnam />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-fade-in space-y-5">
            <FinancialReportsVN />
            <AdvisoryBoardReport />
            <FounderReviewChecklist />
          </div>
        )}

        {activeTab === 'posting' && (
          <div className="animate-fade-in">
            <DoubleEntryPostingPanel />
          </div>
        )}

        {activeTab === 'deepdive' && (
          <div className="animate-fade-in">
            <AccountingVietnamDeepDivePanel />
          </div>
        )}

        {activeTab === 'workbench' && (
          <div className="animate-fade-in">
            <CustomDataWorkbench />
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="animate-fade-in">
            <InvoiceSplitViewDemo />
          </div>
        )}
      </div>
    </div>
  );
}
