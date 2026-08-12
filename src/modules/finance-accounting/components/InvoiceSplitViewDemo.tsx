import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, Scan, Copy, Save, Upload, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export default function InvoiceSplitViewDemo() {
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  const mockRunOcr = () => {
    setIsOcrProcessing(true);
    setTimeout(() => {
      setOcrResult({
        invoiceNo: 'HD/2026/00459',
        invoiceDate: '2026-07-15',
        supplierName: 'Công ty TNHH Phần Mềm AI Việt Nam',
        taxCode: '0101234567',
        totalAmount: 15400000,
        taxAmount: 1400000,
        status: 'matched'
      });
      setIsOcrProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-3xl border border-border-primary bg-bg-surface overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border-primary flex justify-between items-center bg-slate-900/50">
        <div>
          <h2 className="text-lg font-black text-text-primary flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-400" />
            AI Invoice Processor (Split View)
          </h2>
          <p className="text-xs text-text-secondary mt-1">Đối chiếu hóa đơn gốc (trái) và dữ liệu trích xuất (phải)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-2">
            <Upload className="w-4 h-4" /> Tải lên hóa đơn
          </Button>
          <Button variant="primary" size="sm" onClick={mockRunOcr} disabled={isOcrProcessing} className="gap-2">
            <Scan className="w-4 h-4" /> {isOcrProcessing ? 'Đang trích xuất...' : 'Chạy AI Trích Xuất OCR'}
          </Button>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: PDF/Image Viewer */}
        <div className="w-1/2 border-r border-border-primary flex flex-col bg-slate-950">
          <div className="p-2 border-b border-white/5 flex justify-end gap-2 bg-slate-900/80">
            <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><ZoomIn className="w-4 h-4" /></button>
            <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><ZoomOut className="w-4 h-4" /></button>
            <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><RotateCw className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 p-6 flex justify-center overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.14)_1px,transparent_0)] bg-[length:16px_16px]">
            {/* Mock Invoice Paper */}
            <div className="bg-white text-slate-900 w-[400px] h-fit p-6 shadow-xl border border-slate-200 font-serif">
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                <h1 className="text-xl font-bold uppercase text-red-600">Hóa Đơn Giá Trị Gia Tăng</h1>
                <p className="text-sm font-semibold">Ngày 15 tháng 07 năm 2026</p>
                <p className="text-xs mt-1">Ký hiệu: HD/2026 - Số: 00459</p>
              </div>
              <div className="space-y-2 text-sm mb-6">
                <p><strong>Đơn vị bán:</strong> Công ty TNHH Phần Mềm AI Việt Nam</p>
                <p><strong>Mã số thuế:</strong> 0101234567</p>
                <p><strong>Địa chỉ:</strong> Quận 1, TP. HCM</p>
              </div>
              <table className="w-full text-xs text-left border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-900 p-1">STT</th>
                    <th className="border border-slate-900 p-1">Tên hàng hóa, dịch vụ</th>
                    <th className="border border-slate-900 p-1">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-1 text-center">1</td>
                    <td className="border border-slate-900 p-1">Phần mềm quản trị LedgerFlow</td>
                    <td className="border border-slate-900 p-1 text-right">14.000.000</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 text-sm text-right space-y-1">
                <p>Cộng tiền hàng: 14.000.000đ</p>
                <p>Tiền thuế GTGT (10%): 1.400.000đ</p>
                <p className="font-bold text-base mt-2">Tổng cộng: 15.400.000đ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Extracted Data / Data Entry Form */}
        <div className="w-1/2 flex flex-col bg-bg-primary overflow-y-auto">
          {isOcrProcessing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-indigo-400">
              <Scan className="w-12 h-12 animate-pulse mb-4" />
              <p className="font-bold animate-pulse">AI đang quét và trích xuất dữ liệu...</p>
            </div>
          ) : !ocrResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-bold">Nhấn "Chạy AI Trích Xuất" để phân tích hóa đơn</p>
            </div>
          ) : (
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Trạng thái đối chiếu</p>
                  <p className="text-lg font-black text-slate-200 mt-1">Trích xuất thành công</p>
                </div>
                <Badge variant="success" className="gap-1 px-3 py-1"><CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ (MISA check)</Badge>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số hóa đơn</label>
                    <input type="text" defaultValue={ocrResult.invoiceNo} className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm font-bold text-slate-200 focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày hóa đơn</label>
                    <input type="date" defaultValue={ocrResult.invoiceDate} className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm font-bold text-slate-200 focus:border-indigo-500 outline-none" />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nhà cung cấp</label>
                  <input type="text" defaultValue={ocrResult.supplierName} className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm font-bold text-slate-200 focus:border-indigo-500 outline-none" />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã số thuế</label>
                  <div className="flex gap-2">
                    <input type="text" defaultValue={ocrResult.taxCode} className="w-full mt-1 px-3 py-2 bg-slate-900 border border-emerald-500/30 rounded-lg text-sm font-bold text-emerald-400 focus:border-indigo-500 outline-none" />
                    <button className="mt-1 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors">Tra cứu</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiền trước thuế</label>
                    <div className="relative">
                      <input type="text" defaultValue="14.000.000" className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm font-bold text-slate-200 font-mono text-right focus:border-indigo-500 outline-none" />
                      <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">VNĐ</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thuế VAT (10%)</label>
                    <div className="relative">
                      <input type="text" defaultValue="1.400.000" className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm font-bold text-slate-200 font-mono text-right focus:border-indigo-500 outline-none" />
                      <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">VNĐ</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Tổng thanh toán</label>
                  <div className="relative">
                    <input type="text" defaultValue="15.400.000" className="w-full mt-1 px-3 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xl font-black text-indigo-400 font-mono tabular-nums text-right focus:border-indigo-500 outline-none" />
                    <span className="absolute left-3 top-4 text-xs font-bold text-indigo-500">VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <Button variant="secondary" className="px-6">Báo lỗi</Button>
                <Button variant="primary" className="px-6 gap-2">
                  <Save className="w-4 h-4" /> Lưu chứng từ
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
