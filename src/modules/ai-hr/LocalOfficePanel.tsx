import React, { useState, useEffect } from 'react';
import { FileText, Bot, Download, Eye, Loader2, Sparkles, FolderDown } from 'lucide-react';

interface LocalFile {
  name: string;
  size: number;
  createdAt: string;
}

export default function LocalOfficePanel() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  
  const [viewFile, setViewFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/local-office/files').then(r => r.json());
      if (res.success) setFiles(res.files);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchFiles();
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/local-office/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, title })
      }).then(r => r.json());

      if (res.success) {
        setPrompt('');
        setTitle('');
        await fetchFiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewFile = async (filename: string) => {
    try {
      const res = await fetch(`/api/local-office/files/${filename}`).then(r => r.json());
      if (res.success) {
        setFileContent(res.content);
        setViewFile(filename);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 mt-8 border-t border-slate-800 pt-8 text-left">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderDown className="h-6 w-6 text-emerald-400" /> AI Local Office (Quản lý File)
        </h2>
        <p className="text-xs text-slate-400 mt-1">Cấp quyền cho AI Đọc/Ghi báo cáo trực tiếp vào ổ cứng máy tính của bạn.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Khung Giao Việc (Phân tích) */}
        <form onSubmit={handleAnalyze} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" /> Yêu cầu AI Viết Báo Cáo
          </h3>
          
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tên báo cáo</label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none" 
              placeholder="VD: Bao_cao_doanh_thu_Q1" 
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nội dung yêu cầu (Prompt)</label>
            <textarea 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              required
              rows={3} 
              className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none" 
              placeholder="Ví dụ: Đọc dữ liệu bán hàng tháng này và viết một báo cáo dài 3 trang phân tích rủi ro..." 
            />
          </div>

          <button 
            type="submit" 
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            Bắt đầu phân tích & Ghi File
          </button>
        </form>

        {/* Khung Danh sách File (Kết quả) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-amber-300" /> Thư mục /exports (Local Disk)
          </h3>
          
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] pr-1">
            {isLoading ? (
              <div className="text-center text-xs text-slate-500 py-4"><Loader2 className="h-4 w-4 animate-spin inline-block" /></div>
            ) : files.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-10 italic">Chưa có file báo cáo nào được sinh ra.</div>
            ) : files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(2)} KB • {new Date(file.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleViewFile(file.name)}
                  className="p-2 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal / Khung xem nội dung File */}
      {viewFile && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 mt-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" /> {viewFile}
            </h3>
            <button onClick={() => setViewFile(null)} className="text-xs font-bold text-slate-400 hover:text-white">Đóng</button>
          </div>
          <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto p-4 bg-black/40 rounded-xl border border-slate-800">
            {fileContent}
          </pre>
        </div>
      )}
    </div>
  );
}
