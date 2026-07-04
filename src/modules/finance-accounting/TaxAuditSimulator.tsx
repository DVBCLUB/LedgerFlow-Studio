import React, { useState, useMemo } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, FileText, Download, Sparkles, HelpCircle } from 'lucide-react';

type CaseId = 'mercedes' | 'cash' | 'runaway' | 'laptop' | 'interest';

type AuditCase = {
  id: CaseId;
  title: string;
  amount: string;
  description: string;
  evidence: string;
  correctAnswer: string; // The correct red flag category
  correctReason: string; // Detail law references (TT200, Luật thuế TNDN, ND132)
};

const CASES: AuditCase[] = [
  {
    id: 'mercedes',
    title: 'Khấu hao xe Mercedes E300 của Ban Giám Đốc',
    amount: '2.500.000.000 đ',
    description: 'Công ty mua xe Mercedes E300 5 chỗ nguyên giá 2,5 tỷ đồng đưa đón CEO. Kế toán trích khấu hao toàn bộ giá trị 2,5 tỷ đồng và đưa hết vào chi phí quản lý được trừ thuế TNDN trong năm.',
    evidence: 'Hóa đơn GTGT ngày 10/02/2026 mua xe ô tô dưới 9 chỗ, biên bản trích khấu hao thời gian 8 năm, tờ khai tự quyết toán thuế TNDN.',
    correctAnswer: 'depreciation_limit',
    correctReason: 'Theo Luật Thuế TNDN hiện hành (Thông tư 78/2014/TT-BTC & Thông tư 96/2015/TT-BTC), đối với ô tô từ 9 chỗ ngồi trở xuống (trừ xe kinh doanh vận chuyển hành khách, du lịch, khách sạn), phần trích khấu hao tương ứng với nguyên giá vượt trên 1,6 tỷ đồng sẽ không được tính vào chi phí được trừ khi xác định thu nhập chịu thuế TNDN. Do đó, phần khấu hao tương ứng với 900 triệu đồng vượt mức phải bị loại.'
  },
  {
    id: 'cash',
    title: 'Thanh toán tiền mặt cho hóa đơn mua nguyên vật liệu',
    amount: '24.500.000 đ',
    description: 'Mua nguyên vật liệu nhập kho trị giá 24,5 triệu đồng (đã bao gồm 10% VAT). Kế toán thanh toán bằng tiền mặt trực tiếp cho nhà cung cấp, lưu phiếu chi kèm hóa đơn mua hàng.',
    evidence: 'Hóa đơn GTGT số 0019483 trị giá 24,5 triệu đồng, phiếu chi tiền mặt số PC-0294, phiếu nhập kho vật liệu.',
    correctAnswer: 'cash_payment_limit',
    correctReason: 'Theo Luật Thuế GTGT và thuế TNDN (Thông tư 219/2013/TT-BTC), các hóa đơn mua hàng hóa, dịch vụ từng lần có giá trị từ 20 triệu đồng trở lên (đã bao gồm VAT) bắt buộc phải thanh toán không dùng tiền mặt (chuyển khoản qua tài khoản ngân hàng của bên mua sang bên bán đăng ký với cơ quan thuế) thì mới được khấu trừ thuế VAT đầu vào và tính chi phí được trừ. Giao dịch này trả tiền mặt 24,5 triệu nên sẽ bị loại toàn bộ VAT đầu vào (2,22M) và chi phí mua hàng khỏi chi phí được trừ.'
  },
  {
    id: 'runaway',
    title: 'Hóa đơn mua thiết bị văn phòng của doanh nghiệp bỏ trốn',
    amount: '45.000.000 đ',
    description: 'Công ty mua bàn ghế và máy tính văn phòng trị giá 45 triệu của Công ty TNHH Khánh An. Tuy nhiên, rà soát trên trang web của Tổng cục Thuế phát hiện Công ty Khánh An đã bỏ trốn khỏi địa chỉ kinh doanh trước thời điểm xuất hóa đơn.',
    evidence: 'Hóa đơn GTGT ngày 15/03/2026 của Công ty Khánh An, thông báo trạng thái người nộp thuế "Không hoạt động tại địa chỉ đã đăng ký" ngày 01/03/2026.',
    correctAnswer: 'runaway_invoice',
    correctReason: 'Sử dụng hóa đơn của doanh nghiệp đã bỏ trốn, ngừng hoạt động trước ngày lập hóa đơn được coi là hành vi sử dụng hóa đơn bất hợp pháp (Nghị định 125/2020/NĐ-CP). Doanh nghiệp sẽ bị loại toàn bộ chi phí này khi tính thuế TNDN, không được khấu trừ VAT đầu vào, và có nguy cơ bị truy thu thuế hoặc phạt hành chính về tội trốn thuế nếu không chứng minh được hàng hóa thực tế có thật.'
  },
  {
    id: 'laptop',
    title: 'Hạch toán một lần 10 máy tính xách tay văn phòng',
    amount: '150.000.000 đ',
    description: 'Mua 10 máy tính xách tay mới cho phòng marketing tổng cộng 150 triệu đồng. Kế toán ghi nhận toàn bộ 150 triệu vào chi phí quản lý doanh nghiệp trong tháng mua để nhanh chóng giảm thuế TNDN quý hiện tại.',
    evidence: 'Hóa đơn GTGT mua máy tính, phiếu bàn giao tài sản thiết bị, sổ chi tiết tài khoản 642.',
    correctAnswer: 'immediate_expense',
    correctReason: 'Theo Thông tư 200/2014/TT-BTC & Thông tư 45/2013/TT-BTC, công cụ dụng cụ hoặc thiết bị không đủ tiêu chuẩn ghi nhận tài sản cố định (dưới 30 triệu đồng/cái) nhưng có giá trị lớn và thời gian sử dụng trên 1 năm phải được hạch toán vào tài khoản 242 (Chi phí trả trước) và phân bổ dần vào chi phí sản xuất kinh doanh theo thời gian sử dụng thực tế (tối đa không quá 3 năm/36 tháng). Việc hạch toán 100% vào chi phí 1 tháng là sai nguyên tắc phù hợp.'
  },
  {
    id: 'interest',
    title: 'Chi phí lãi vay của doanh nghiệp có giao dịch liên kết',
    amount: '80.000.000.000 đ',
    description: 'Công ty phát sinh khoản vay từ công ty mẹ ở nước ngoài với tổng lãi vay phát sinh trong năm là 80 tỷ đồng. EBITDA (lợi nhuận trước thuế, lãi vay và khấu hao) năm đó đạt 100 tỷ đồng. Kế toán tính toàn bộ 80 tỷ đồng này vào chi phí lãi vay hợp lý.',
    evidence: 'Hợp đồng vay vốn liên kết, sổ chi tiết tài khoản 635, bảng tính EBITDA năm tài chính.',
    correctAnswer: 'related_party_interest',
    correctReason: 'Theo Nghị định 132/2020/NĐ-CP về quản lý thuế đối với doanh nghiệp có giao dịch liên kết, tổng chi phí lãi vay được trừ khi xác định thu nhập chịu thuế TNDN không được vượt quá 30% tổng EBITDA cộng lãi vay cộng khấu hao. Với EBITDA là 100 tỷ, chi phí lãi vay khống chế tối đa là 30 tỷ đồng. Phần chi phí lãi vay vượt hạn mức (80 tỷ - 30 tỷ = 50 tỷ đồng) không được trừ thuế trong kỳ, nhưng được chuyển sang kỳ tính thuế tiếp theo nếu đủ điều kiện.'
  }
];

export default function TaxAuditSimulator() {
  const [selectedCaseId, setSelectedCaseId] = useState<CaseId>('mercedes');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [checked, setChecked] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [casesSolved, setCasesSolved] = useState<Record<CaseId, boolean>>({
    mercedes: false,
    cash: false,
    runaway: false,
    laptop: false,
    interest: false
  });
  const [copied, setCopied] = useState(false);

  const selectedCase = useMemo(() => {
    return CASES.find((c) => c.id === selectedCaseId)!;
  }, [selectedCaseId]);

  const handleCheck = () => {
    if (!selectedAnswer || checked) return;
    
    const isCorrect = selectedAnswer === selectedCase.correctAnswer;
    if (isCorrect && !casesSolved[selectedCase.id]) {
      setScore((prev) => prev + 20);
      setCasesSolved((prev) => ({ ...prev, [selectedCase.id]: true }));
    }
    setChecked(true);
  };

  const handleNextCase = (id: CaseId) => {
    setSelectedCaseId(id);
    setSelectedAnswer('');
    setChecked(false);
  };

  // Compile final report pack
  const auditReport = useMemo(() => {
    let report = '=== BÁO CÁO KIỂM TOÁN RỦI RO THUẾ DOANH NGHIỆP (MÔ PHỎNG) ===\n\n';
    CASES.forEach((c) => {
      const solved = casesSolved[c.id];
      report += `[Case] ${c.title}\n`;
      report += `Giá trị giao dịch: ${c.amount}\n`;
      report += `Trạng thái kiểm tra: ${solved ? 'ĐÃ PHÁT HIỆN SAI PHẠM (RED FLAG ✓)' : 'CHƯA RÀ SOÁT / BỎ SÓT'}\n`;
      report += `Tóm tắt luật định: ${c.correctReason}\n\n`;
      report += '--------------------------------------------------\n\n';
    });
    report += `Tổng điểm phát hiện rủi ro của Auditor: ${score}/100`;
    return report;
  }, [casesSolved, score]);

  const handleCopyReport = async () => {
    await navigator.clipboard.writeText(auditReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-success/25 bg-bg-primary p-5 text-text-primary space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <span className="rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-[9px] font-bold uppercase text-success">Internal Audit Lab</span>
          <h3 className="mt-1 text-lg font-bold text-text-primary">Vietnamese Tax Red-Flag Auditor</h3>
          <p className="text-xs font-semibold text-text-secondary">Đóng vai kiểm toán viên rà soát chứng từ kế toán, phát hiện các rủi ro về thuế và thực thi quy định Thông tư 200/Luật Thuế.</p>
        </div>
        <div className="rounded-full bg-success/15 border border-success/20 px-3 py-1 text-xs font-bold text-success">
          Auditing Score: {score} / 100
        </div>
      </div>

      {/* Case Navigator */}
      <div className="flex flex-wrap gap-2">
        {CASES.map((c) => {
          const isActive = selectedCaseId === c.id;
          const isSolved = casesSolved[c.id];
          return (
            <button
              key={c.id}
              onClick={() => handleNextCase(c.id)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-emerald-300 text-slate-950 border-emerald-300'
                  : 'bg-bg-surface border-border-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
              <span>{c.id.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr] text-left">
        
        {/* Case Info and Red Flag Tagging */}
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4 space-y-4">
          <div>
            <span className="text-[9px] text-text-muted font-bold block uppercase">Chi tiết chứng từ & giao dịch</span>
            <h4 className="text-sm font-bold text-text-primary mt-1">{selectedCase.title}</h4>
            <div className="mt-2 text-xs font-bold text-error bg-error/10 border border-error/20 px-3 py-1 rounded inline-block">
              Giá trị: {selectedCase.amount}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary leading-6 bg-bg-primary p-3 rounded-xl border border-border-primary">
              <strong>Tình huống:</strong> {selectedCase.description}
            </p>
            <p className="text-xs font-semibold text-text-secondary leading-6 pl-1">
              <strong>Bằng chứng kiểm toán:</strong> {selectedCase.evidence}
            </p>
          </div>

          {/* Red Flag Option selector */}
          <div className="space-y-2">
            <span className="text-[9px] text-text-muted font-bold block uppercase">Gắn cờ đỏ rủi ro (Red Flag)</span>
            <div className="grid gap-2">
              {[
                { id: 'depreciation_limit', label: 'Vượt hạn mức trích khấu hao ô tô 1,6 tỷ (Luật thuế TNDN)' },
                { id: 'cash_payment_limit', label: 'Thanh toán tiền mặt hóa đơn trên 20 triệu (Luật thuế GTGT & TNDN)' },
                { id: 'runaway_invoice', label: 'Sử dụng hóa đơn bất hợp pháp từ doanh nghiệp bỏ trốn' },
                { id: 'immediate_expense', label: 'Hạch toán một lần chi phí công cụ dài hạn không phân bổ (Thông tư 200)' },
                { id: 'related_party_interest', label: 'Vượt hạn mức khống chế chi phí lãi vay liên kết 30% EBITDA' },
              ].map((opt) => {
                const isSelected = selectedAnswer === opt.id;
                return (
                  <button
                    key={opt.id}
                    disabled={checked}
                    onClick={() => setSelectedAnswer(opt.id)}
                    className={`w-full rounded-xl border p-3 text-left text-xs font-semibold leading-5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-success/10 border-success/40 text-success'
                        : 'bg-bg-primary border-border-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCheck}
              disabled={!selectedAnswer || checked}
              className="flex-1 rounded-xl bg-emerald-400 hover:bg-success text-slate-950 py-2.5 text-xs font-bold transition cursor-pointer disabled:opacity-40"
            >
              Kiểm tra lỗi rủi ro
            </button>
          </div>
        </div>

        {/* Audit feedback / Regulation Reference */}
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-border-secondary pb-2">
              <span className="text-[10px] font-bold text-text-muted uppercase">Cơ sở pháp lý & Phân tích chuyên sâu</span>
            </div>

            {checked ? (
              <div className="mt-4 space-y-4 animate-fade-in text-xs font-semibold">
                <div className={`p-3 rounded-xl flex items-center gap-2.5 border ${
                  selectedAnswer === selectedCase.correctAnswer
                    ? 'bg-success/10 border-success/20 text-success'
                    : 'bg-error/10 border-error/20 text-error'
                }`}>
                  {selectedAnswer === selectedCase.correctAnswer ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <div>
                        <strong>Phát hiện chính xác!</strong>
                        <p className="text-[10px] text-text-secondary mt-0.5">Bạn đã tìm thấy lỗi Red Flag của giao dịch này.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-error shrink-0" />
                      <div>
                        <strong>Sai sót kiểm toán!</strong>
                        <p className="text-[10px] text-text-secondary mt-0.5">Bạn chọn nhầm loại lỗi rủi ro. Hãy đọc phân tích bên dưới.</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Giải thích nghiệp vụ & Luật áp dụng</span>
                  <p className="p-3 bg-bg-primary rounded-xl border border-border-secondary text-text-secondary leading-6">
                    {selectedCase.correctReason}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <ShieldAlert className="w-8 h-8 text-text-muted mx-auto" />
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  Hãy phân tích chứng từ bên trái, gắn cờ lỗi Red Flag phù hợp nhất và nhấn **Kiểm tra** để xem phân tích chi tiết.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border-secondary pt-3">
            <button
              onClick={handleCopyReport}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border-secondary bg-bg-primary py-2.5 text-xs font-bold text-text-secondary hover:border-emerald-300 hover:text-text-primary transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {copied ? 'Đã sao chép báo cáo' : 'Xuất báo cáo kiểm toán thuế'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
