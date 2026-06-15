import { useMemo, useRef, useState } from 'react';

interface SuggestedEntry {
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
}

interface InvoiceData {
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  invoiceSeries?: string | null;
  sellerName?: string | null;
  sellerTaxCode?: string | null;
  sellerAddress?: string | null;
  buyerName?: string | null;
  buyerTaxCode?: string | null;
  buyerAddress?: string | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
  suggestedEntries: SuggestedEntry[];
  confidence: number;
  rawText?: string;
}

type StoredReviewCard = {
  id: string;
  type: 'invoice_ocr_review';
  title: string;
  createdAt: string;
  invoice: InvoiceData;
};

const REVIEW_CARD_KEY = 'ledgerflow_invoice_ocr_review_cards';

function money(value?: number) {
  return `${Math.round(value || 0).toLocaleString('vi-VN')} ₫`;
}

function confidenceClass(confidence: number) {
  if (confidence >= 0.8) return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
  if (confidence >= 0.5) return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
  return 'border-rose-400/40 bg-rose-400/10 text-rose-200';
}

function normalizeMimeType(file: File): 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf' {
  if (file.type === 'image/png') return 'image/png';
  if (file.type === 'image/webp') return 'image/webp';
  if (file.type === 'application/pdf') return 'application/pdf';
  return 'image/jpeg';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Không đọc được file.'));
    reader.readAsDataURL(file);
  });
}

export default function InvoiceOCRTab() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'>('image/jpeg');
  const [dataUrl, setDataUrl] = useState('');
  const [result, setResult] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isImagePreview = useMemo(() => dataUrl.startsWith('data:image/'), [dataUrl]);
  const debitTotal = useMemo(() => (result?.suggestedEntries || []).reduce((sum, entry) => sum + (entry.amount || 0), 0), [result]);

  async function handleFile(file?: File) {
    if (!file) return;
    setError('');
    setMessage('');
    setResult(null);

    const normalizedMime = normalizeMimeType(file);
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(normalizedMime)) {
      setError('Chỉ hỗ trợ JPG, PNG, WEBP hoặc PDF.');
      return;
    }

    const url = await readFileAsDataUrl(file);
    setFileName(file.name);
    setMimeType(normalizedMime);
    setDataUrl(url);
  }

  async function runOCR() {
    if (!dataUrl) {
      setError('Chọn ảnh hoặc PDF hóa đơn trước.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/accounting/invoice-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error || 'OCR hóa đơn thất bại.');
      setResult(payload.result);
      setMessage('Đã OCR hóa đơn. Vui lòng review trước khi lưu/hạch toán.');
    } catch (err: any) {
      setError(err?.message || 'OCR hóa đơn thất bại.');
    } finally {
      setLoading(false);
    }
  }

  function saveReviewCard() {
    if (!result) return;
    const current: StoredReviewCard[] = JSON.parse(localStorage.getItem(REVIEW_CARD_KEY) || '[]');
    const card: StoredReviewCard = {
      id: `invoice-review-${Date.now()}`,
      type: 'invoice_ocr_review',
      title: `Review hóa đơn ${result.invoiceSeries || ''} ${result.invoiceNumber || ''}`.trim() || `Review hóa đơn ${new Date().toLocaleDateString('vi-VN')}`,
      createdAt: new Date().toISOString(),
      invoice: result,
    };
    localStorage.setItem(REVIEW_CARD_KEY, JSON.stringify([card, ...current].slice(0, 100)));
    setMessage('Đã lưu bản review hóa đơn vào local review inbox. Có thể dùng dữ liệu này để tạo WorkboardCard ở bước sau.');
  }

  function copyJson() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => setMessage('Đã copy JSON hóa đơn.'));
  }

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Invoice OCR + Auto Posting</p>
            <h3 className="mt-1 text-xl font-black text-white">Đọc hóa đơn VN và gợi ý định khoản</h3>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Upload ảnh/PDF hóa đơn, backend dùng Gemini Vision để bóc số HĐ, MST, tiền trước thuế, VAT, tổng tiền và dòng hạch toán VAS đề xuất. Frontend không gọi AI trực tiếp.
            </p>
          </div>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">P0 · Review trước khi lưu</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files?.[0]);
            }}
            className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-5"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-4 text-3xl">🧾</div>
              <div>
                <p className="text-sm font-black text-white">Kéo thả hóa đơn vào đây</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Hỗ trợ JPG, PNG, WEBP, PDF. File được gửi lên backend nội bộ.</p>
              </div>
              <button onClick={() => inputRef.current?.click()} className="rounded-2xl bg-cyan-400 px-5 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300">
                Chọn file hóa đơn
              </button>
            </div>
          </div>

          {fileName && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selected file</p>
                  <p className="mt-1 text-sm font-black text-white">{fileName}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{mimeType}</p>
                </div>
                <button onClick={runOCR} disabled={loading} className="rounded-2xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-40">
                  {loading ? 'Đang OCR...' : 'OCR hóa đơn'}
                </button>
              </div>
              {isImagePreview ? (
                <img src={dataUrl} alt="Invoice preview" className="mt-4 max-h-96 w-full rounded-2xl border border-slate-800 object-contain" />
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm font-semibold text-slate-400">PDF đã sẵn sàng để OCR. Preview PDF không render trong tab này.</div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {(message || error) && (
            <div className={`rounded-2xl border p-3 text-sm font-bold ${error ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>
              {error || message}
            </div>
          )}

          {!result ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-center text-sm font-semibold text-slate-500">
              Kết quả OCR sẽ hiện ở đây: thông tin hóa đơn, MST, VAT, tổng tiền và định khoản đề xuất.
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Extracted invoice</p>
                    <h4 className="mt-1 text-lg font-black text-white">{result.invoiceSeries || 'Ký hiệu ?'} · {result.invoiceNumber || 'Số HĐ ?'}</h4>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Ngày hóa đơn: {result.invoiceDate || 'Chưa đọc được'}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${confidenceClass(result.confidence)}`}>
                    Confidence {Math.round((result.confidence || 0) * 100)}%
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bên bán</p>
                    <p className="mt-1 text-sm font-black text-white">{result.sellerName || 'Chưa đọc được'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">MST: {result.sellerTaxCode || '?'}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{result.sellerAddress || ''}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bên mua</p>
                    <p className="mt-1 text-sm font-black text-white">{result.buyerName || 'Chưa đọc được'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">MST: {result.buyerTaxCode || '?'}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{result.buyerAddress || ''}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trước thuế</p>
                    <p className="mt-1 text-lg font-black text-white">{money(result.subtotal)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">VAT {Math.round((result.vatRate || 0) * 100)}%</p>
                    <p className="mt-1 text-lg font-black text-white">{money(result.vatAmount)}</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">Tổng thanh toán</p>
                    <p className="mt-1 text-lg font-black text-cyan-100">{money(result.total)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Suggested journal entries</p>
                    <h4 className="mt-1 text-base font-black text-white">Định khoản đề xuất</h4>
                  </div>
                  <p className="text-xs font-bold text-slate-500">Tổng dòng Nợ đề xuất: {money(debitTotal)}</p>
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-900 text-[10px] uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-3 py-2">TK Nợ</th>
                        <th className="px-3 py-2">TK Có</th>
                        <th className="px-3 py-2 text-right">Số tiền</th>
                        <th className="px-3 py-2">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {result.suggestedEntries.length ? result.suggestedEntries.map((entry, index) => (
                        <tr key={`${entry.debitAccount}-${entry.creditAccount}-${index}`} className="bg-slate-950/60">
                          <td className="px-3 py-2 font-black text-cyan-200">{entry.debitAccount}</td>
                          <td className="px-3 py-2 font-black text-amber-200">{entry.creditAccount}</td>
                          <td className="px-3 py-2 text-right font-black text-white">{money(entry.amount)}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-slate-400">{entry.description}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-3 py-6 text-center text-sm font-semibold text-slate-500">Chưa có dòng định khoản. Confidence thấp, cần nhập thủ công.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={saveReviewCard} className="rounded-2xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300">Xác nhận & lưu review</button>
                  <button onClick={copyJson} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 hover:text-cyan-200">Copy JSON</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
