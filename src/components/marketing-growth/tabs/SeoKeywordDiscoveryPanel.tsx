import { ArrowRight, Download, Search, Sparkles } from 'lucide-react';

type SearchVolume = 'high' | 'medium' | 'low';
type Competition = 'high' | 'medium' | 'low';
type Intent = 'informational' | 'commercial' | 'transactional';
type SortField = 'score' | 'vol' | 'keyword';

export interface SeoDiscoveryKeyword {
  keyword: string;
  searchVolume: SearchVolume;
  searchVolumeNum: number;
  competition: Competition;
  intent: Intent;
  softwareIdea: string;
  monetization: string;
  painPoint: string;
  guerrillaScore: number;
  longtailVariants?: string[];
}

interface SeoKeywordDiscoveryPanelProps {
  nicheInput: string;
  setNicheInput: (value: string) => void;
  targetAudience: string;
  setTargetAudience: (value: string) => void;
  budgetTarget: number;
  setBudgetTarget: (value: number) => void;
  loadingDiscovery: boolean;
  onDiscover: () => void;
  discoveredKeywords: SeoDiscoveryKeyword[];
  selectedKeywords: string[];
  searchFilter: string;
  setSearchFilter: (value: string) => void;
  sortField: SortField;
  setSortField: (value: SortField) => void;
  sortedKeywords: SeoDiscoveryKeyword[];
  onExportExcel: () => void;
  onToggleKeyword: (keyword: string) => void;
  onMoveToMapper: () => void;
}

const sortOptions: Array<{ id: SortField; label: string }> = [
  { id: 'score', label: 'Diem kha thi' },
  { id: 'vol', label: 'Luu luong' },
  { id: 'keyword', label: 'Tu khoa A-Z' },
];

export default function SeoKeywordDiscoveryPanel({
  nicheInput,
  setNicheInput,
  targetAudience,
  setTargetAudience,
  budgetTarget,
  setBudgetTarget,
  loadingDiscovery,
  onDiscover,
  discoveredKeywords,
  selectedKeywords,
  searchFilter,
  setSearchFilter,
  sortField,
  setSortField,
  sortedKeywords,
  onExportExcel,
  onToggleKeyword,
  onMoveToMapper,
}: SeoKeywordDiscoveryPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-slate-900 bg-[#070b13]/80 p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-purple-400">
          <Sparkles className="h-4 w-4 animate-slow" />
          <span>Cau hinh nghien cuu pheu tich hop tu khoa Google</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">CHU DE / NGANH NGHE MUC TIEU</label>
            <input
              type="text"
              value={nicheInput}
              onChange={(event) => setNicheInput(event.target.value)}
              className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100 placeholder-slate-600 focus:border-purple-500 focus:outline-none"
              placeholder="Vi du: quan ly kho, ke toan dich vu..."
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">DOI TUONG BAN DAU</label>
            <select
              value={targetAudience}
              onChange={(event) => setTargetAudience(event.target.value)}
              className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="Hộ kinh doanh">Ho kinh doanh Viet Nam</option>
              <option value="SME/Công ty nhỏ">Cong ty SME vua va nho</option>
              <option value="Freelancer chuyên nghiệp">Freelancer va ke toan tu do</option>
              <option value="Startup bootstrap">Indie app va startup bootstrap</option>
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500">GIA PHAN MEM THANG TARGET</label>
              <span className="font-mono text-[11px] font-bold text-amber-400">{budgetTarget.toLocaleString('vi-VN')} VND</span>
            </div>
            <input
              type="range"
              min="35000"
              max="500000"
              step="5000"
              value={budgetTarget}
              onChange={(event) => setBudgetTarget(Number(event.target.value))}
              className="h-1 w-full cursor-pointer rounded bg-slate-900 accent-purple-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onDiscover}
            disabled={loadingDiscovery}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {loadingDiscovery ? <span>Dang cao va phan tich...</span> : <><Sparkles className="h-4 w-4 text-emerald-300" /><span>Quet Google SEO va Kham Pha</span></>}
          </button>
        </div>
      </div>

      {discoveredKeywords.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-900 bg-slate-950/65 p-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                placeholder="Loc nhanh tu khoa phat hien..."
                className="w-full bg-transparent text-xs font-medium text-slate-100 outline-none placeholder-slate-650"
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-slate-550">Sap xep:</span>
              <div className="flex gap-1 rounded-lg border border-slate-900 bg-slate-950 p-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSortField(option.id)}
                    className={`cursor-pointer rounded px-2 py-1 text-[10px] font-bold ${
                      sortField === option.id ? 'bg-slate-900 text-purple-400' : 'text-slate-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onExportExcel}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[10.5px] font-bold text-emerald-400 transition-all hover:bg-slate-800"
              >
                <Download className="h-3 w-3" />
                <span>Xuat Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/20 shadow-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-900 bg-[#070b13] text-[9.5px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3" />
                  <th className="px-4 py-3">Tu khoa tim kiem</th>
                  <th className="px-4 py-3 text-center">Volume/thang</th>
                  <th className="px-4 py-3 text-center">Canh tranh</th>
                  <th className="px-4 py-3 text-center">Y dinh</th>
                  <th className="px-4 py-3">Giai phap micro-SaaS</th>
                  <th className="px-4 py-3 text-center">Diem</th>
                  <th className="px-4 py-3 text-right">Lua chon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {sortedKeywords.map((item, index) => {
                  const isSelected = selectedKeywords.includes(item.keyword);
                  return (
                    <tr key={`${item.keyword}-${index}`} className={`transition-colors hover:bg-slate-900/30 ${isSelected ? 'border-l-2 border-l-purple-500 bg-purple-950/10' : ''}`}>
                      <td className="px-4 py-3.5 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => onToggleKeyword(item.keyword)} className="cursor-pointer rounded accent-purple-500" />
                      </td>
                      <td className="max-w-[200px] px-4 py-3.5 font-bold text-white">
                        <span className="block truncate" title={item.keyword}>{item.keyword}</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.longtailVariants?.slice(0, 2).map((variant) => (
                            <span key={variant} className="rounded border border-slate-900 bg-slate-950 px-1.5 py-0.5 text-[8.5px] text-slate-500">{variant}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold">
                        <span className="block text-slate-250">{(item.searchVolumeNum || 1000).toLocaleString('vi-VN')}</span>
                        <span className="mt-1 inline-block rounded border border-slate-800 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-slate-400">{item.searchVolume}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold">{item.competition}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="rounded border border-slate-900 bg-slate-950 px-2 py-0.5 text-[9px] font-black uppercase text-slate-400">{item.intent}</span>
                      </td>
                      <td className="space-y-1.5 px-4 py-3.5">
                        <p className="font-bold leading-tight text-slate-100">{item.softwareIdea}</p>
                        <p className="text-[10.5px] italic leading-snug text-slate-450"><strong>Monetize:</strong> {item.monetization}</p>
                        <p className="text-[10px] leading-snug text-slate-500"><strong>Noi dau:</strong> {item.painPoint}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-black">
                        <span className={`block text-base ${item.guerrillaScore >= 9 ? 'text-emerald-400' : item.guerrillaScore >= 8 ? 'text-purple-400' : 'text-amber-400'}`}>
                          {item.guerrillaScore}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onToggleKeyword(item.keyword)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-[10.5px] font-black transition-all ${
                            isSelected ? 'border-purple-500 bg-purple-600 text-white shadow-md' : 'border-slate-900 bg-slate-950 text-slate-400 hover:border-slate-800 hover:bg-slate-900'
                          }`}
                        >
                          {isSelected ? 'Da chon' : 'Chon'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-900 bg-slate-950/30 p-4 md:flex-row">
            <span className="text-center text-[11px] font-semibold italic text-slate-400 md:text-left">
              He thong phat hien <strong className="text-purple-400">{selectedKeywords.length} tu khoa</strong> duoc chon.
            </span>
            <button
              type="button"
              disabled={selectedKeywords.length === 0}
              onClick={onMoveToMapper}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40"
            >
              <span>Chuyen thiet ke san pham</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-900/60 bg-slate-950/5 p-12 text-center">
          <Search className="mx-auto h-12 w-12 animate-pulse text-slate-700" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-400">Chua bat dau cao tu khoa nao</p>
            <p className="mx-auto max-w-lg text-xs text-slate-500">
              Chon hoac nhap linh vuc ngach, phan khuc target, roi quet Google SEO de tao danh sach co hoi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
