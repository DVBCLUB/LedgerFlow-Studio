import React, { useState, useEffect } from 'react';
import { ROADMAP_WEEKS } from '../data/roadmap';
import { SQL_SCHEMAS } from '../data/sqlSchemas';
import { WeekTask, SQLTable } from '../types';
import { 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Copy, 
  Terminal, 
  Eye, 
  HelpCircle, 
  FileText, 
  Database, 
  ShieldAlert, 
  CheckSquare,
  Play,
  RefreshCw,
  Check
} from 'lucide-react';

export default function WebAccountingRoadmap() {
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [allSchemas, setAllSchemas] = useState<SQLTable[]>(SQL_SCHEMAS);
  const [selectedTable, setSelectedTable] = useState<SQLTable>(SQL_SCHEMAS[0]);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SQL playground states
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryExecuting, setQueryExecuting] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Load checks and custom registered schemas
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fastrack_checked_tasks');
      if (saved) {
        setCheckedTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const stored = localStorage.getItem('fastrack_custom_registered_tables');
      if (stored) {
        const parsed: any[] = JSON.parse(stored);
        const customSchemas: SQLTable[] = parsed.map(item => ({
          name: `${item.tableName} (Bảng tự nạp)`,
          type: 'other',
          description: item.description,
          columns: item.columns,
          sqlDef: item.sqlDef
        }));
        setAllSchemas([...SQL_SCHEMAS, ...customSchemas]);
      }
    } catch (e) {
      console.error('Lỗi nạp cấu trúc tự tùy chỉnh: ', e);
    }
  }, []);

  // Update preloaded SQL query when selectedTable changes
  useEffect(() => {
    const tabName = selectedTable.name.split(' (')[0].trim();
    if (tabName === 'expenses') {
      setSqlQuery('SELECT expense_no, description, total_amount, payment_status FROM expenses WHERE total_amount > 20000000;');
    } else if (tabName === 'projects') {
      setSqlQuery('SELECT code, name, budget, start_date FROM projects WHERE budget >= 1000000000;');
    } else if (tabName === 'audit_logs') {
      setSqlQuery("SELECT table_name, action, ip_address, created_at FROM audit_logs WHERE action = 'UPDATE';");
    } else if (tabName === 'payroll_details') {
      setSqlQuery('SELECT employee_id, working_days, gross_salary, net_salary FROM payroll_details WHERE working_days > 23;');
    } else {
      setSqlQuery(`SELECT * FROM ${tabName} LIMIT 5;`);
    }
    setQueryResult(null);
    setQueryError(null);
  }, [selectedTable]);

  const toggleTask = (taskId: string) => {
    const updated = { ...checkedTasks, [taskId]: !checkedTasks[taskId] };
    setCheckedTasks(updated);
    try {
      localStorage.setItem('fastrack_checked_tasks', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Lỗi sao chép: ', err);
    });
  };

  const handleExecuteSQL = () => {
    if (!sqlQuery.trim()) return;
    setQueryExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    setTimeout(() => {
      setQueryExecuting(false);
      try {
        const qClean = sqlQuery.trim().replace(/\s+/g, ' ');
        const qLower = qClean.toLowerCase();
        
        // Validate SQL
        if (!qLower.startsWith('select')) {
          throw new Error('Chỉ hỗ trợ câu lệnh SELECT truy vấn (Chế độ Đọc - Read-Only) để đảm bảo an toàn học tập.');
        }

        const tabNameCandidate = selectedTable.name.split(' (')[0].trim();
        if (!qLower.includes(tabNameCandidate.toLowerCase())) {
          throw new Error(`Tên bảng không tồn tại trong câu lệnh hoặc không khớp bảng hiện hoạt! Hãy truy vấn từ bảng "${tabNameCandidate}".`);
        }

        // Mock database records
        const mockDb: Record<string, any[]> = {
          expenses: [
            { id: 1, expense_no: 'PC-2026-001', expense_date: '2026-05-10', project_id: 1, description: 'Cát đá công trình đường Láng', quantity: 15, unit: 'm3', unit_price: 1600000, before_tax: 24000000, tax_rate: 10, total_amount: 26400000, payment_status: 'paid' },
            { id: 2, expense_no: 'PC-2026-002', expense_date: '2026-05-12', project_id: 2, description: 'Sắt thép móng sàn Đà Nẵng', quantity: 10, unit: 'tấn', unit_price: 15500000, before_tax: 155000000, tax_rate: 8, total_amount: 167400000, payment_status: 'unpaid' },
            { id: 3, expense_no: 'PC-2026-003', expense_date: '2026-05-15', project_id: 1, description: 'Bê tông cốt thép Cầu Giấy', quantity: 200, unit: 'm3', unit_price: 2100000, before_tax: 420000000, tax_rate: 8, total_amount: 453600000, payment_status: 'paid' },
            { id: 4, expense_no: 'PC-2026-004', expense_date: '2026-05-18', project_id: 3, description: 'Sơn bả trong ngoài Hải Phòng', quantity: 45, unit: 'thùng', unit_price: 850000, before_tax: 38250000, tax_rate: 10, total_amount: 42075000, payment_status: 'unpaid' }
          ],
          projects: [
            { id: 1, code: 'CT001', name: 'Nhà dân Cầu Giấy', budget: 450000000, start_date: '2026-03-10', end_date: '2026-09-10', status: 'active' },
            { id: 2, code: 'CT-METRO', name: 'Căn hộ Khách sạn Đà Nẵng', budget: 1200000000, start_date: '2026-01-15', end_date: '2026-11-20', status: 'active' },
            { id: 3, code: 'CT-PORT', name: 'Khu công nghiệp Hải Phòng', budget: 3500000000, start_date: '2026-04-01', end_date: '2027-04-01', status: 'active' }
          ],
          audit_logs: [
            { id: 1, table_name: 'expenses', record_id: 1, action: 'CREATE', old_data: '{}', new_data: '{"id":1, "total":26400000}', user_id: 1, ip_address: '192.168.1.5', created_at: '2026-05-10 10:25:01' },
            { id: 2, table_name: 'expenses', record_id: 2, action: 'UPDATE', old_data: '{"status":"unpaid"}', new_data: '{"status":"paid"}', user_id: 2, ip_address: '192.168.1.18', created_at: '2026-05-12 11:32:44' },
            { id: 3, table_name: 'payroll_details', record_id: 5, action: 'CREATE', old_data: '{}', new_data: '{"employee_id":102}', user_id: 1, ip_address: '192.168.1.5', created_at: '2026-05-15 09:15:30' }
          ],
          payroll_details: [
            { id: 1, period_id: 1, employee_id: 101, working_days: 24.5, basic_salary: 15000000, allowances: 7000000, gross_salary: 22000000, bhxh_employee: 2310000, bhxh_employer: 5170000, taxable_income: 11000000, pit_amount: 850000, net_salary: 18840000 },
            { id: 2, period_id: 1, employee_id: 102, working_days: 26.0, basic_salary: 25000000, allowances: 10000000, gross_salary: 35000000, bhxh_employee: 3675000, bhxh_employer: 8225000, taxable_income: 24000000, pit_amount: 3200000, net_salary: 28125000 },
            { id: 3, period_id: 1, employee_id: 103, working_days: 22.0, basic_salary: 10000000, allowances: 4000000, gross_salary: 14000000, bhxh_employee: 1470000, bhxh_employer: 3290000, taxable_income: 3000000, pit_amount: 150000, net_salary: 12380000 }
          ]
        };

        // Live injection of custom tables registered into the Relational Mock Sandbox
        try {
          const stored = localStorage.getItem('fastrack_custom_registered_tables');
          if (stored) {
            const parsed: any[] = JSON.parse(stored);
            parsed.forEach(item => {
              mockDb[item.tableName] = item.rows;
            });
          }
        } catch (e) {
          console.error(e);
        }

        const targetData = mockDb[tabNameCandidate] || [];
        
        // Extract columns to display (SELECT <cols> FROM)
        const selectMatch = qClean.match(/select\s+([\s\S]+?)\s+from/i);
        if (!selectMatch) {
          throw new Error('Cú pháp không chuẩn: Hãy chắc chắn có cấu trúc SELECT <cột> FROM..');
        }

        const rawCols = selectMatch[1].trim();
        let columnsToDisplay: string[] = [];

        if (rawCols === '*') {
          columnsToDisplay = selectedTable.columns.map(c => c.name);
        } else {
          columnsToDisplay = rawCols.split(',').map(c => c.trim().toLowerCase());
          // Check if columns exist in selectedTable schema
          const validColNames = selectedTable.columns.map(c => c.name.toLowerCase());
          columnsToDisplay.forEach(col => {
            if (!validColNames.includes(col)) {
              throw new Error(`Cột "${col}" không tồn tại trong thiết kế sơ đồ của bảng "${tabNameCandidate}"!`);
            }
          });
        }

        // Logical filters based on query keywords
        let finalRows = [...targetData];
        const whereMatch = qClean.match(/where\s+([\s\S]+?)(?:limit|$)/i);
        
        if (whereMatch) {
          const clause = whereMatch[1].trim().toLowerCase();
          
          if (tabNameCandidate === 'expenses') {
            if (clause.includes('total_amount > 20000000') || clause.includes('total_amount>20000000')) {
              finalRows = targetData.filter(r => r.total_amount > 20000000);
            } else if (clause.includes('payment_status') && clause.includes('paid')) {
              finalRows = targetData.filter(r => r.payment_status === 'paid');
            }
          } else if (tabNameCandidate === 'projects') {
            if (clause.includes('budget >= 1000000000') || clause.includes('budget>=1000000000')) {
              finalRows = targetData.filter(r => r.budget >= 1000000000);
            }
          } else if (tabNameCandidate === 'audit_logs') {
            if (clause.includes("action = 'update'") || clause.includes("action='update'")) {
              finalRows = targetData.filter(r => r.action === 'UPDATE');
            }
          } else if (tabNameCandidate === 'payroll_details') {
            if (clause.includes('working_days > 23') || clause.includes('working_days>23')) {
              finalRows = targetData.filter(r => r.working_days > 23);
            }
          }
        }

        // Limit clause handling
        const limitMatch = qLower.match(/limit\s+(\d+)/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]);
          finalRows = finalRows.slice(0, limit);
        }

        // Map final rows matching selected columns
        const formattedRows = finalRows.map(r => {
          const formattedRow: Record<string, any> = {};
          columnsToDisplay.forEach(colName => {
            const actualKey = Object.keys(r).find(k => k.toLowerCase() === colName.toLowerCase());
            formattedRow[colName] = actualKey ? r[actualKey] : null;
          });
          return formattedRow;
        });

        setQueryResult({
          columns: columnsToDisplay,
          rows: formattedRows
        });

      } catch (err: any) {
        setQueryError(err.message || 'Lỗi xử lý cú pháp SQL.');
      }
    }, 400);
  };

  // Percent calculator
  const allTasks = ROADMAP_WEEKS.flatMap(w => w.tasks);
  const completedTasks = allTasks.filter(t => checkedTasks[t.id]);
  const totalCompletionPercent = allTasks.length > 0 
    ? Math.round((completedTasks.length / allTasks.length) * 100) 
    : 0;

  const currentWeekData = ROADMAP_WEEKS.find(w => w.week === activeWeek) || ROADMAP_WEEKS[0];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: ACTIVE WEEK STEPS & CHECKLIST */}
      <div className="lg:col-span-2 space-y-6">
        {/* Progress header */}
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex justify-between items-center gap-4 shadow-lg">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Tiến trình triển khai dự án</span>
            <h3 className="text-md font-bold text-white mt-1">Đường tới MVP Kế Toán Web</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-emerald-400">{totalCompletionPercent}%</span>
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
              <div className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-350" style={{ width: `${totalCompletionPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Weekly selectors */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {ROADMAP_WEEKS.map(w => (
            <button
              key={w.week}
              onClick={() => setActiveWeek(w.week)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border shrink-0 flex items-center gap-2 ${
                activeWeek === w.week 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Tuần {w.week}: {w.phase}
            </button>
          ))}
        </div>

        {/* Selected week details & Checklist */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-purple-400 font-bold tracking-widest uppercase mb-1">Giai Đoạn {currentWeekData.week}</span>
              <span className="text-xs text-slate-500 font-medium">Bản đồ thực hành A-Z</span>
            </div>
            <h4 className="text-base font-bold text-white mt-1 mb-2">{currentWeekData.title}</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">{currentWeekData.description}</p>
          </div>

          <div className="space-y-3.5 pr-1">
            <p className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-500 shrink-0" />
              Checklist đầu việc (Lưu tự động):
            </p>
            <div className="space-y-2.5">
              {currentWeekData.tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    checkedTasks[task.id] 
                      ? 'bg-emerald-500/5 border-emerald-500/25' 
                      : 'bg-slate-950 border-slate-850/80 hover:border-slate-800'
                  }`}
                >
                  <button 
                    className={`w-5 h-5 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      checkedTasks[task.id] 
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                        : 'border-slate-700'
                    }`}
                  >
                    {checkedTasks[task.id] && <span className="font-extrabold text-[12px]">✓</span>}
                  </button>
                  <div>
                    <span className={`text-xs font-bold transition-all ${checkedTasks[task.id] ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {task.text}
                    </span>
                    {task.subText && (
                      <span className="block text-[11px] text-slate-500 mt-1">{task.subText}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational advice & verification criteria */}
          <div className="grid md:grid-cols-2 gap-4 border-t border-slate-850 pt-5 text-xs">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850/80 space-y-1">
              <span className="font-bold text-slate-300 block text-purple-400 flex items-center gap-1">💡 Chuyên gia khuyên:</span>
              <p className="text-slate-400 text-[11px] leading-relaxed font-medium">{currentWeekData.tip}</p>
            </div>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850/80 space-y-1">
              <span className="font-bold text-slate-300 block text-emerald-400 flex items-center gap-1">✅ Tiêu chí hoàn thành:</span>
              <p className="text-slate-400 text-[11px] leading-relaxed font-medium">{currentWeekData.completionVerify}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: INTERACTIVE SQL SCHEMA EXPLORER & QUERY PLAYGROUND */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">Relational DB Schemas</h3>
              <p className="text-slate-400 text-[10px] font-semibold">Cơ sở dữ liệu SQLite / Postgres chuẩn kế toán</p>
            </div>
          </div>

          {/* Table list to select */}
          <div className="flex flex-col gap-1 select-none">
            {allSchemas.map(table => (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table)}
                className={`w-full text-left p-2.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between ${
                  selectedTable.name === table.name 
                    ? 'bg-purple-600/15 border-purple-500/30 text-purple-400 shadow-md' 
                    : 'bg-slate-950 border-transparent hover:bg-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{table.name}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
              </button>
            ))}
          </div>

          {/* Table Columns & SQL code */}
          <div className="space-y-4 pt-1">
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Mô tả bảng</span>
              <p className="text-slate-400 text-[11px] leading-relaxed font-semibold">{selectedTable.description}</p>
            </div>

            {/* Column properties */}
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Các cột trường ròng:</span>
              <div className="divide-y divide-slate-850">
                {selectedTable.columns.map(col => (
                  <div key={col.name} className="py-1.5 flex flex-col gap-0.5 select-text">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200">{col.name}</span>
                      <span className="font-mono text-purple-400 text-[10px] font-semibold">{col.type} {col.constraints}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{col.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SQL definition block to Copy */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 relative font-mono text-[11px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SQL DDL Definition</span>
                <button
                  onClick={() => copyToClipboard(selectedTable.sqlDef, 'sqlDef')}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white hover:border-purple-500/50 transition-all text-[10px] font-medium"
                >
                  <Copy className="w-3 h-3" />
                  {copiedId === 'sqlDef' ? 'Đã sao chép' : 'Sao chép DDL'}
                </button>
              </div>
              <pre className="text-slate-300 max-h-[120px] overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 rounded bg-[#03060c] p-2 border border-slate-850/80 leading-relaxed font-semibold">
                {selectedTable.sqlDef}
              </pre>
            </div>

            {/* SQL PLAYGROUND TESTING LAB (NEW) */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3.5">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                <Terminal className="w-3.5 h-3.5 shrink-0" />
                Hộp cát Truy Vấn SQL SELECT
              </span>
              
              <div className="space-y-1.5">
                <textarea
                  rows={3}
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM expenses..."
                  className="w-full bg-[#02050b] border border-slate-850 p-2.5 rounded-lg text-[11px] font-mono font-semibold text-slate-200 placeholder-slate-650 focus:outline-none focus:border-purple-500"
                />
                
                <button
                  onClick={handleExecuteSQL}
                  disabled={queryExecuting || !sqlQuery.trim()}
                  className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/15 uppercase tracking-wider"
                >
                  {queryExecuting ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 shrink-0" />
                  )}
                  {queryExecuting ? 'Đang thực thi...' : 'Chạy thử truy vấn SQL'}
                </button>
              </div>

              {/* Playground Results Visual Console */}
              {queryError && (
                <div className="bg-rose-500/5 text-rose-400 border border-rose-500/15 p-2.5 rounded-lg text-[10px] leading-relaxed font-semibold flex items-start gap-1.5">
                  <AlertCircleAndCheck className="w-4 h-4 shrink-0 mt-0.5" isError={true} />
                  <span>{queryError}</span>
                </div>
              )}

              {queryResult && (
                <div className="space-y-2 max-h-[170px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-1 bg-[#020409] rounded-lg border border-slate-850/80 animate-fade-in">
                  <div className="flex justify-between items-center px-1 text-[8.5px] text-slate-500 font-bold tracking-widest uppercase">
                    <span>Kết quả truy vấn ({queryResult.rows.length} dòng)</span>
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                      Success
                    </span>
                  </div>
                  
                  {queryResult.rows.length === 0 ? (
                    <p className="text-[10px] text-slate-500 py-4 text-center italic">Không tìm thấy dòng nào thỏa mãn điều kiện WHERE.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[9.5px]/none font-mono">
                        <thead>
                          <tr className="border-b border-slate-850 text-slate-500 text-[8px] uppercase tracking-wider bg-slate-900/40">
                            {queryResult.columns.map(col => (
                              <th key={col} className="px-2 py-1.5 font-extrabold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {queryResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-900/30">
                              {queryResult.columns.map(col => {
                                const val = row[col];
                                return (
                                  <td key={col} className="px-2 py-1.5 text-slate-300 font-semibold truncate max-w-[120px]">
                                    {typeof val === 'number' && val > 1000 
                                      ? new Intl.NumberFormat('vi-VN').format(val) 
                                      : String(val ?? 'NULL')}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal small helper component for sandbox error and alerts
function AlertCircleAndCheck({ className, isError }: { className?: string; isError?: boolean }) {
  if (isError) {
    return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    );
  }
  return <Check className={className} />;
}
