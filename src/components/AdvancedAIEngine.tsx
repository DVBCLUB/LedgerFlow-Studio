import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Network, 
  ShieldAlert, 
  Terminal, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Activity, 
  Search, 
  Database, 
  Lock, 
  EyeOff, 
  DollarSign, 
  CornerDownRight, 
  Sparkles, 
  UserCheck, 
  ThumbsUp, 
  Ban, 
  Send,
  Sliders,
  HelpCircle,
  FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Model templates for WebLLM In-Browser Inference
const WEB_LLM_MODELS = [
  { id: 'gemma-2b-it', name: 'Gemma 2-2B-it (Google)', size: '1.45 GB', vram: '1.8 GB', desc: 'Mô hình siêu nhẹ, tối ưu hóa cho các nhiệm vụ tóm tắt kế toán và làm sạch dữ liệu.' },
  { id: 'llama-3-8b-q4', name: 'Llama 3-8B-Instruct (Quantized)', size: '4.20 GB', vram: '4.9 GB', desc: 'Mô hình đa dụng hiệu năng cao của Meta, hiểu biết sâu rộng về nghiệp vụ tài chính thế giới.' },
  { id: 'phi-3.5-mini', name: 'Phi-3.5-mini-Instruct (Microsoft)', size: '2.15 GB', vram: '2.4 GB', desc: 'Mô hình lý luận mạnh mẽ, xuất sắc trong lập luận toán học và viết mã SQL hạch toán.' }
];

// Presets for Offline WebLLM Chat
const OFFLINE_PROMPTS = [
  { label: 'Hạch toán bút toán cơ bản', text: 'Hãy viết cách định khoản nghiệp vụ: Chi tiền mặt 15,000,000 VNĐ mua máy in phục vụ bộ phận văn phòng.' },
  { label: 'Tư vấn phân bổ TSCĐ', text: 'Tài sản cố định trị giá 240,000,000 VNĐ, thời gian sử dụng 5 năm thì mỗi tháng trích khấu hao bao nhiêu tiền theo phương pháp đường thẳng?' },
  { label: 'Lọc kiểm tra thuế VAT', text: 'Làm thế nào để phát hiện hóa đơn đầu vào sai sót không nằm trong các mức thuế suất 0%, 5%, 8%, 10% bằng lệnh SQLite?' }
];

// Simulated response generator for WebLLM Offline Inference
const getWebLLMResponse = (prompt: string, modelId: string): string => {
  const p = prompt.toLowerCase();
  const modelName = WEB_LLM_MODELS.find(m => m.id === modelId)?.name || 'Local LLM';
  
  if (p.includes('định khoản') || p.includes('chi tiền mặt') || p.includes('hạch toán')) {
    return `[Sinh ra từ ${modelName} - Offline WebGPU Engine]
    
Nghiệp vụ mua máy in phục vụ văn phòng bằng tiền mặt giá trị 15,000,000 VNĐ:

1. Xác định tài sản: Máy in có giá trị nhỏ hơn 30 triệu đồng, do đó phân loại là Công cụ dụng cụ (CCDC) chứ không ghi nhận là Tài sản cố định (TSCĐ). Ghi nhận vào tài khoản chi phí hoặc phân bổ dần.

2. Định khoản hạch toán kép (Thông tư 200/2014/TT-BTC):
   - Nợ TK 242 (Chi phí trả trước - nếu phân bổ nhiều kỳ): 15,000,000 VNĐ
   - Có TK 1111 (Tiền mặt Việt Nam đồng): 15,000,000 VNĐ
   
   Trường hợp đưa thẳng vào chi phí trong kỳ của bộ phận quản lý doanh nghiệp:
   - Nợ TK 6422 (Chi phí quản lý doanh nghiệp - chi phí đồ dùng văn phòng): 15,000,000 VNĐ
   - Có TK 1111 (Tiền mặt Việt Nam đồng): 15,000,000 VNĐ

* Lưu ý: Vì chạy offline bằng WebGPU cục bộ ngay tại trình duyệt của bạn, dữ liệu nghiệp vụ này không rời khỏi thiết bị, bảo mật hóa đơn 100%!`;
  }
  
  if (p.includes('khấu hao') || p.includes('tscđ') || p.includes('phương pháp')) {
    return `[Sinh ra từ ${modelName} - Offline WebGPU Engine]

Phép toán khấu hao tài sản cố định chuẩn xác theo Thông tư 45/2013/TT-BTC:

1. Công thức khấu hao đường thẳng:
   - Nguyên giá TSCĐ: 240,000,000 VNĐ
   - Thời gian sử dụng: 5 năm = 60 tháng.
   
2. Tính toán mức trích khấu hao:
   - Mức khấu hao năm: 240,000,000 / 5 = 48,000,000 VNĐ/năm
   - Mức khấu hao tháng: 48,000,000 / 12 = 4,000,000 VNĐ/tháng

3. Định khoản hàng tháng:
   - Nợ TK 642 (Chi phí quản lý doanh nghiệp) hoặc 627 (Chi phí sản xuất chung): 4,000,000 VNĐ
   - Có TK 2141 (Hao mòn tài sản cố định hữu hình): 4,000,000 VNĐ

* Phép tính số học được xử lý ròng bằng kiểu dữ liệu INTEGER (Lượng hóa VNĐ) trực tiếp trong nhân WebLLM của trình duyệt, không gây sai lệch phần thập phân.`;
  }

  return `[Sinh ra từ ${modelName} - Offline WebGPU Engine]

Hệ thống ghi nhận câu lệnh cục bộ của bạn: "${prompt}"

Kết quả xử lý logic: 
- Đối soát dữ liệu cục bộ chuẩn xác, phù hợp các tiêu chí kiểm toán danh nghĩa Thông tư 200 & Luật Quản lý Thuế Việt Nam năm 2026.
- Đang kiểm tra cấu trúc sổ cái song song thông qua WebGPU Hardware Acceleration.
- Tốc độ hoàn tất: cực nhanh, hoàn toàn miễn phí và không tải truyền bất kỳ gói tin nhạy cảm nào lên Cloud.`;
};

// GraphRAG Entity Nodes Data
const GRAPHRAG_NODES = [
  { id: 'n_buyer', label: 'Cty Mua ABC', type: 'company', details: 'Bên mua hàng, MST: 0314782910, xếp hạng tín nhiệm AAA.', color: '#a855f7', x: 200, y: 150 },
  { id: 'n_seller', label: 'Cty Bán XYZ', type: 'company', details: 'Bên xuất hóa đơn, đối tác chiến lược cấp 1.', color: '#3b82f6', x: 500, y: 180 },
  { id: 'n_invoice', label: 'Hóa Đơn #0921', type: 'invoice', details: 'HĐ GTGT 8% VAT, Trị giá hàng: 100,000,000đ, Thuế: 8,000,000đ.', color: '#ec4899', x: 350, y: 120 },
  { id: 'n_bank_tx', label: 'Giao Dịch Vietcombank', type: 'transaction', details: 'Số tiền 108,000,000đ chuyển khoản thực tế khớp hóa đơn.', color: '#10b981', x: 340, y: 280 },
  { id: 'n_tax_dept', label: 'Chi cục Thuế Q1', type: 'authority', details: 'Cơ quan quản lý thuế trực tiếp kiểm duyệt XML.', color: '#f59e0b', x: 250, y: 60 },
  { id: 'n_accountant', label: 'Kế toán Trưởng', type: 'person', details: 'Người chịu trách nhiệm duyệt hạch toán đối soát kép.', color: '#06b6d4', x: 480, y: 80 }
];

// GraphRAG Edges Connections
const GRAPHRAG_EDGES = [
  { source: 'n_buyer', target: 'n_invoice', relation: 'NHẬN HÓA ĐƠN', desc: 'Hóa đơn đầu vào được đối soát' },
  { source: 'n_seller', target: 'n_invoice', relation: 'XUẤT BẢN XML', desc: 'Xuất hóa đơn theo TT78' },
  { source: 'n_buyer', target: 'n_bank_tx', relation: 'CHUYỂN KHOẢN', desc: 'Thanh toán tiền ngân hàng thực tế' },
  { source: 'n_bank_tx', target: 'n_invoice', relation: 'ĐỐI SOÁT KHỚP', desc: 'Số tiền khớp 108,000,000đ (tiền hàng + thuế)' },
  { source: 'n_invoice', target: 'n_tax_dept', relation: 'BÁO CÁO CỔNG TCT', desc: 'Đã ký số và được cơ quan thuế cấp mã' },
  { source: 'n_buyer', target: 'n_accountant', relation: 'ỦY QUYỀN DUYỆT', desc: 'Nhấn nút ký đồng bộ' },
  { source: 'n_seller', target: 'n_buyer', relation: 'QUAN HỆ MUA BÁN', desc: 'Hợp đồng thương mại nguyên tắc' }
];

// Simulated Gateway Telemetry Logs
const GATEWAY_STAT_DATA = [
  { name: '08:00', calls: 12, cached: 4, costSaved: 0.12 },
  { name: '09:00', calls: 35, cached: 18, costSaved: 0.54 },
  { name: '10:00', calls: 89, cached: 54, costSaved: 1.62 },
  { name: '11:00', calls: 145, cached: 102, costSaved: 3.06 },
  { name: '12:00', calls: 92, cached: 78, costSaved: 2.34 },
  { name: '13:00', calls: 110, cached: 95, costSaved: 2.85 },
  { name: '14:00', calls: 160, cached: 130, costSaved: 3.90 }
];

export default function AdvancedAIEngine() {
  const [activeTab, setActiveTab] = useState<'web_llm' | 'graph_rag' | 'gateway' | 'agentic_ui'>('web_llm');

  // ==================== 1. WEBLLM STATES ====================
  const [selectedModel, setSelectedModel] = useState('gemma-2b-it');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [localChatInput, setLocalChatInput] = useState('');
  const [localChatLog, setLocalChatLog] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([]);
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const [webGPUPerformance, setWebGPUPerformance] = useState<{ ram: string, vram: string, speed: string } | null>(null);

  // ==================== 2. GRAPHRAG STATES ====================
  const [selectedNode, setSelectedNode] = useState<any>(GRAPHRAG_NODES[2]); // Default is Invoice node
  const [searchGraphQuery, setSearchGraphQuery] = useState('');
  const [isSearchingGraph, setIsSearchingGraph] = useState(false);
  const [graphPathLog, setGraphPathLog] = useState<string[]>([]);
  const [ragExplanation, setRagExplanation] = useState<string>('');
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [highlightedEdges, setHighlightedEdges] = useState<number[]>([]);

  // ==================== 3. GATEWAY STATES ====================
  const [isCacheEnabled, setIsCacheEnabled] = useState(true);
  const [redactedInput, setRedactedInput] = useState(
    'Kính gửi Kế toán Việt Nam, nhờ anh/chị liên lạc với giám đốc Nguyễn Hữu Toàn (nguyenhuutoan@ledgerflow.vn - điện thoại: 0918.234.567) để thu hồi hóa đơn sai lệch của tài khoản ngân hàng Quân Đội MB 190-345-678-999 số tiền chuyển khoản là 250,000,000đ.'
  );
  const [redactedOutput, setRedactedOutput] = useState('');
  const [piiApplied, setPiiApplied] = useState(false);
  const [semanticCacheQuery, setSemanticCacheQuery] = useState('Hướng dẫn hạch toán chi phí tiếp khách chuẩn TT200');
  const [cacheResult, setCacheResult] = useState<{ status: 'hit' | 'miss', latency: string, cost: string, text: string } | null>(null);

  // ==================== 4. AGENTIC UI STATES ====================
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'error' | 'pending' | 'success'>('idle');
  const [agentStep, setAgentStep] = useState(0);
  const [agentLogs, setAgentLogs] = useState<Array<{ step: number, status: 'success' | 'running' | 'warning' | 'done', type: string, text: string }>>([]);
  const [agentThoughts, setAgentThoughts] = useState<string>('');
  const [approvalHistory, setApprovalHistory] = useState<string[]>([]);

  // Cleanup effect
  useEffect(() => {
    // Standard initialization rules
    setRedactedOutput(redactPII(redactedInput));
  }, []);

  // WebLLM simulation
  const handleLoadModel = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setIsLoaded(false);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setIsLoaded(true);
          const chosenModel = WEB_LLM_MODELS.find(m => m.id === selectedModel);
          setWebGPUPerformance({
            ram: (1.2 + Math.random() * 0.5).toFixed(1) + ' GB',
            vram: chosenModel?.vram || '2.0 GB',
            speed: (20 + Math.floor(Math.random() * 15)) + ' tokens/sec'
          });
          setLocalChatLog([{
            role: 'assistant',
            text: `👋 [WebLLM Offline Engine] Mô hình ${chosenModel?.name} đã được tải thành công vào RAM/VRAM của bạn thông qua tăng tốc phần cứng WebGPU!\n\nBạn có thể rút dây mạng, tắt Wi-Fi và thử gõ một phép hạch toán kế toán bên dưới. Trực tiếp, siêu bảo mật và 0đ chi phí API!`
          }]);
          return 100;
        }
        const step = Math.floor(Math.random() * 12) + 4;
        return Math.min(prev + step, 100);
      });
    }, 180);
  };

  const handleSendLocalMessage = () => {
    if (!localChatInput.trim() || isLocalGenerating) return;

    const userMsg = localChatInput;
    setLocalChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
    setLocalChatInput('');
    setIsLocalGenerating(true);

    // Simulated local streaming word-by-word
    setTimeout(() => {
      const fullResponse = getWebLLMResponse(userMsg, selectedModel);
      setLocalChatLog(prev => [...prev, { role: 'assistant', text: '' }]);
      
      let index = 0;
      const responseWords = fullResponse.split(' ');
      let currentText = '';

      const streamInterval = setInterval(() => {
        if (index >= responseWords.length) {
          clearInterval(streamInterval);
          setIsLocalGenerating(false);
          return;
        }
        currentText += responseWords[index] + ' ';
        setLocalChatLog(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', text: currentText.trim() };
          return next;
        });
        index++;
      }, 35); // word rate
    }, 400);
  };

  // Helper logic for PII Redaction
  const redactPII = (input: string): string => {
    let output = input;
    // Redact email
    output = output.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    // Redact phone number
    output = output.replace(/(\+?84|0)[3|5|7|8|9]\d[\s.-]?\d{3}[\s.-]?\d{3,4}/g, '[REDACTED_PHONE]');
    // Redact bank account numbers (pattern of typical accounts)
    output = output.replace(/\b\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g, '[REDACTED_BANK_ACCOUNT]');
    return output;
  };

  const handleApplyPiiFilter = () => {
    setPiiApplied(true);
    setRedactedOutput(redactPII(redactedInput));
    setTimeout(() => setPiiApplied(false), 2000);
  };

  // Semantic Cache handling
  const handleTestCache = () => {
    const isCachedQuery = semanticCacheQuery.toLowerCase().includes('tiếp khách') || 
                           semanticCacheQuery.toLowerCase().includes('khấu hao') || 
                           semanticCacheQuery.toLowerCase().includes('sổ cái');
    
    if (isCacheEnabled && isCachedQuery) {
      setCacheResult({
        status: 'hit',
        latency: '4ms (Tức thì)',
        cost: '$0.00000 (Bộ đệm)',
        text: 'Chi phí tiếp khách để được tính là chi phí hợp lệ được trừ khi tính thuế TNDN cần đảm bảo đầy đủ bộ chứng từ gồm: Hóa đơn đỏ hợp lệ (trên 20 triệu phải chuyển khoản), tờ trình xin phê duyệt thiết đãi khách hàng, danh sách khách hàng tham gia, bill thanh toán chi tiết món ăn đính kèm.'
      });
    } else {
      setCacheResult({
        status: 'miss',
        latency: '1,894ms (Mạng ngoài)',
        cost: '$0.00480 (Chi phí thật)',
        text: `[Kết quả gọi trực tiếp từ Gemini API phía sau AI Gateway] Với câu hỏi: "${semanticCacheQuery}", hệ thống Gateway phát hiện không có dữ liệu ngữ nghĩa tương đồng trong cache cục bộ. Đã định tuyến an toàn qua Cổng bảo mật và trả kết quả thành công hạch toán.`
      });
    }
  };

  // GraphRAG complex search simulation
  const handleSearchGraph = () => {
    if (!searchGraphQuery.trim()) return;
    setIsSearchingGraph(true);
    setHighlightedNodes([]);
    setHighlightedEdges([]);
    setGraphPathLog(['Bắt đầu phân tích truy vấn phức tạp...', 'Chuyển đổi câu hỏi thành Graph Embeddings...']);
    
    setTimeout(() => {
      const q = searchGraphQuery.toLowerCase();
      if (q.includes('sai lệch') || q.includes('vietcombank') || q.includes('hóa đơn') || q.includes('đối soát')) {
        // Paths: Buyer -> Bank_Tx -> Invoice -> Seller
        setHighlightedNodes(['n_buyer', 'n_bank_tx', 'n_invoice', 'n_seller']);
        setHighlightedEdges([0, 1, 2, 3]);
        setGraphPathLog([
          '🔍 Bước 1: Trích xuất các thực thể [Cty Mua ABC], [Giao dịch Vietcombank] qua Cơ sở dữ liệu Vector.',
          '🕸️ Bước 2: Truy quét Sơ đồ tri thức (Walk the Graph Relations) phát hiện liên kết "ĐỐI SOÁT KHỚP" nối tới [Hóa đơn #0921].',
          '🔗 Bước 3: Tìm thấy mối quan hệ "XUẤT BẢN XML" của [Cty Bán XYZ] đối ứng với hóa đơn.',
          '💡 Bước 4: Tổng hợp quan hệ nhân quả: Giao dịch ngân hàng 108 triệu khớp hoàn toàn với tổng tiền gốc + thuế VAT 8% của hóa đơn đầu vào, chứng minh tính minh bạch thương mại của đối tác XYZ.'
        ]);
        setRagExplanation(
          'Đồ thị cho thấy: Giao dịch Vietcombank số tiền 108,000,000đ từ người mua ABC hoàn toàn ăn khớp với hóa đơn #0921 do XYZ xuất (tiền gốc 100tr + VAT 8% = 108tr). Nhờ GraphRAG, AI không chỉ tìm từ khóa lẻ như "hóa đơn" mà kết nối thực thể thanh toán ngân hàng với hóa đơn thực tế nộp thuế trên cổng Tổng Cục Thuế.'
        );
      } else {
        // Default traversal path
        setHighlightedNodes(['n_invoice', 'n_tax_dept', 'n_accountant']);
        setHighlightedEdges([4, 5]);
        setGraphPathLog([
          '🔍 Bước 1: Trích xuất thực thể trung tâm [Hóa Đơn #0921]',
          '🕸️ Bước 2: Duyệt mối liên kết "BÁO CÁO CỔNG TCT" đến cơ quan [Chi cục Thuế Q1].',
          '💡 Bước 3: Đồ thị tri thức xác thực trạng thái hóa đơn điện tử hợp chuẩn, đã được ký duyệt báo cáo bởi Kế toán Trưởng.'
        ]);
        setRagExplanation(
          'Hệ thống GraphRAG trích xuất bối cảnh hóa đơn số #0921 hiện hữu nằm dưới sự kiểm duyệt của cơ quan Thuế Q1 và đã hoàn tất công đoạn xác thực điện tử bởi Kế toán Trưởng.'
        );
      }
      setIsSearchingGraph(false);
    }, 1200);
  };

  // Agentic UI Stepper Simulation
  const handleStartAgent = () => {
    setAgentStatus('running');
    setAgentStep(1);
    setAgentLogs([]);
    setAgentThoughts('Khởi tạo đặc vụ rà soát sai lệch sổ sách VAT niên độ 2026. Bắt đầu thu thập hóa đơn đầu vào...');
    
    // Step 1: XML Parsing
    setTimeout(() => {
      setAgentStep(2);
      setAgentLogs(prev => [...prev, {
        step: 1,
        status: 'success',
        type: 'parser',
        text: 'Nạp thành công 150 hóa đơn XML thuế suất từ Cổng Tổng Cục Thuế (chỉ số tuân thủ: 100%)'
      }]);
      setAgentThoughts('Tất cả hóa đơn XML đều hợp lệ cấu trúc. Bước tiếp theo: Đối sánh giao dịch tài khoản sao kê Vietcombank...');

      // Step 2: Bank statement matching
      setTimeout(() => {
        setAgentStep(3);
        setAgentLogs(prev => [...prev, {
          step: 2,
          status: 'success',
          type: 'matcher',
          text: 'Rà quét 2,500 giao dịch ngân hàng thực tế, khớp hoàn thành 148 hóa đơn tự động.'
        }]);
        setAgentThoughts('Gặp vấn đề tại hóa đơn số #0182: Số tiền gốc thanh toán lệch pha so với ngân hàng. Đang kiểm toán chi tiết dòng tiền bằng đoạn mã dọn dẹp...');

        // Step 3: Python Pandas crash (Failure-State design!)
        setTimeout(() => {
          setAgentStep(3); // Stay on step 3 for error representation
          setAgentStatus('error');
          setAgentLogs(prev => [...prev, {
            step: 3,
            status: 'warning',
            type: 'script',
            text: 'Mã Python Pandas báo lỗi: "AttributeError: float object has no attribute logical_and" do cột ngày tháng chứa giá trị null dị thường'
          }]);
          setAgentThoughts('🚨 SỰ CỐ PHÁT SINH: Định dạng ngày tháng trong hóa đơn thứ 149 không tương thích. Đang kích hoạt chế độ "Tự chữa lành" (Self-Healing Mode) bằng cách bypass giá trị null và ép kiểu dữ liệu...');

          // Step 4: Self-Healing mitigation to pending confirmation (Micro-Feedback)
          setTimeout(() => {
            setAgentStep(4);
            setAgentStatus('pending');
            setAgentLogs(prev => [...prev, {
              step: 3,
              status: 'done',
              type: 'healing',
              text: '🛡️ Tự sửa lỗi thành công! Bản vá lọc dữ liệu null đã được thực nghiệm. Phát hiện 2 lỗi làm tròn tiền lẻ chênh lệch: 120,000 VNĐ'
            }]);
            setAgentThoughts('Tôi đã tự động xử lý ngoại lệ dữ liệu null và hoàn chỉnh báo cáo sai lệch. Phát hiện dòng tiền chênh lệch 120,000 VNĐ tại Cty ABC. Để bảo toàn sổ sách kế toán cân đối, tôi đề xuất tự động lập Bút toán điểu chỉnh bù trừ vào chi phí khác (Tài khoản 811). Xin vui lòng phê duyệt duyệt hoặc can thiệp trước khi tôi đẩy trực tiếp vào cơ sở dữ liệu.');
          }, 1800);

        }, 1200);

      }, 1200);

    }, 1200);
  };

  const handleAgentApprove = (action: 'approve' | 'modify' | 'cancel') => {
    if (action === 'approve') {
      setAgentStatus('success');
      setAgentStep(5);
      setAgentLogs(prev => [...prev, {
        step: 4,
        status: 'success',
        type: 'approval',
        text: 'Người dùng phê duyệt bút toán điều chỉnh. Đã tự động hạch toán Nợ 811 - Có 1111: 120,000 VNĐ thành công!'
      }]);
      setAgentThoughts('Tác vụ rà soát hoàn tất mỹ mãn. Số liệu sổ sách và cơ quan thuế đã cân bằng 100%.');
      setApprovalHistory(prev => [...prev, `[${new Date().toLocaleTimeString()}] Đã duyệt bút toán điều chỉnh chi phí khác 120,000 VNĐ`]);
    } else if (action === 'modify') {
      setAgentStatus('idle');
      setAgentStep(0);
      setAgentLogs([]);
      alert('Đã hoàn trả trạng thái ban đầu của Đặc vụ AI để bạn điều chỉnh lại thông số đầu vào.');
    } else {
      setAgentStatus('idle');
      setAgentStep(0);
      setAgentLogs([]);
      setAgentThoughts('Đã hủy bỏ tác vụ kế toán theo yêu cầu người dùng.');
    }
  };

  return (
    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-6 text-left relative overflow-hidden select-text">
      {/* Visual background elements */}
      <div className="absolute right-0 top-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none"></div>
      
      {/* Branding Header Area */}
      <div className="border-b border-slate-900 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-505/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block font-mono">
                LedgerFlow AI Labs v4
              </span>
              <span className="text-[10.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                WebGPU Enabled
              </span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              🧠 Trung Tâm Thử Nghiệm AI Nâng Cao &amp; Đặc Vụ Tự Trầm (Advanced AI Systems Console)
            </h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-4xl">
              Không gian nghiên cứu, trải nghiệm thực tiễn các công nghệ đột phá trong kỷ nguyên trí tuệ nhân tạo: Trí tuệ máy học trên trình duyệt WebLLM, Tìm kiếm cấu trúc Đồ thị Tri thức GraphRAG, Bảo mật Cổng AI Enterprise Gateway, và Trực quan hóa suy nghĩ Đặc vụ tự phục hồi Agentic UI.
            </p>
          </div>
        </div>

        {/* Outer Tabs for 4 requested features */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-5">
          <button
            onClick={() => setActiveTab('web_llm')}
            className={`py-3 px-2 rounded-xl border text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'web_llm'
                ? 'bg-purple-600/15 border-purple-500 text-purple-300 shadow-lg'
                : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
            <span>1. Mô Hình Chạy Cục Bộ (WebLLM)</span>
          </button>

          <button
            onClick={() => setActiveTab('graph_rag')}
            className={`py-3 px-2 rounded-xl border text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'graph_rag'
                ? 'bg-blue-600/15 border-blue-500 text-blue-300 shadow-lg'
                : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            <Network className="w-4 h-4 text-blue-400 shrink-0" />
            <span>2. Đồ Thị Tri Thức (GraphRAG)</span>
          </button>

          <button
            onClick={() => setActiveTab('gateway')}
            className={`py-3 px-2 rounded-xl border text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'gateway'
                ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300 shadow-lg'
                : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>3. Cổng AI Gateway Bảo Mật</span>
          </button>

          <button
            onClick={() => setActiveTab('agentic_ui')}
            className={`py-3 px-2 rounded-xl border text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'agentic_ui'
                ? 'bg-amber-600/15 border-amber-500 text-amber-300 shadow-lg'
                : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400 shrink-0" />
            <span>4. Minh Bạch Đặc Vụ (Agentic UI)</span>
          </button>
        </div>
      </div>

      {/* =================================== TAB 1: WEBLLM IN-BROWSER INFERENCE =================================== */}
      {activeTab === 'web_llm' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Model Setup sidebar */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-black text-white">Cấu Hình Trực Cục Bộ</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">
                  Chọn LLM OpenSource hỗ trợ WebGPU:
                </label>
                <div className="space-y-2">
                  {WEB_LLM_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (!isDownloading && !isLocalGenerating) {
                          setSelectedModel(model.id);
                          setIsLoaded(false);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer block ${
                        selectedModel === model.id
                          ? 'bg-purple-900/10 border-purple-550 text-purple-300'
                          : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs">{model.name}</span>
                        <span className="text-[9px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-purple-400 font-black">{model.size}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed font-semibold">{model.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loader Trigger Button */}
              <div className="pt-2">
                <button
                  onClick={handleLoadModel}
                  disabled={isDownloading || isLoaded}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isLoaded
                      ? 'bg-emerald-950/20 border border-emerald-900 text-emerald-400'
                      : 'bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold shadow-md'
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                      Đang cài đặt... {downloadProgress}%
                    </>
                  ) : isLoaded ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Đã Nạp Mô Hình
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Nạp Mô Hình vào WebGPU RAM
                    </>
                  )}
                </button>
              </div>

              {/* Simulated Loading Bar */}
              {isDownloading && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full transition-all duration-150"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
                    <span>⚡ Initializing WebGPU...</span>
                    <span>Tốc độ: 48.5 MB/s</span>
                  </div>
                </div>
              )}

              {/* Hardware Performance stats card */}
              {isLoaded && webGPUPerformance && (
                <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-900 space-y-2">
                  <span className="text-[9px] text-purple-400 font-extrabold font-mono tracking-widest uppercase block">Đố soát phần cứng biên (On-Device Telemetry)</span>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-1.5 bg-slate-950 rounded border border-slate-850">
                      <span className="text-[8px] text-slate-500 block leading-none mb-1">LOCAL MEM</span>
                      <strong className="text-white text-[11px] font-black">{webGPUPerformance.ram}</strong>
                    </div>
                    <div className="p-1.5 bg-slate-950 rounded border border-slate-850">
                      <span className="text-[8px] text-slate-500 block leading-none mb-1">GPU VRAM</span>
                      <strong className="text-white text-[11px] font-black">{webGPUPerformance.vram}</strong>
                    </div>
                    <div className="p-1.5 bg-slate-950 rounded border border-slate-850">
                      <span className="text-[8px] text-slate-500 block leading-none mb-1">GENERATION</span>
                      <strong className="text-emerald-400 text-[10px] font-black">{webGPUPerformance.speed}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                <p className="text-[10px] text-purple-300 leading-normal font-semibold">
                  💡 <strong>In-Browser Inference</strong> khai thác tối đa sức mạnh chip đồ họa của chính máy bạn để chạy AI độc lập. Giúp doanh nghiệp bảo vệ bí mật hóa đơn tuyệt đối và xóa sổ hóa đơn ví API đám mây cực kỳ đắt đỏ.
                </p>
              </div>

            </div>

            {/* Offline Chatbox Area */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between min-h-[480px]">
              
              {/* Box Top Panel */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <h4 className="font-extrabold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Không Gian Chat Cục Bộ Offline (Bảo Mật Tuyệt Đối)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Nhập nghiệp vụ kế toán phát sinh để LLM suy luận tại chỗ qua GPU WebGPU.</p>
                </div>
                {!isLoaded && (
                  <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-lg text-[9px] font-bold font-mono animate-pulse">
                    ⚠️ CHƯA NẠP MODEL
                  </span>
                )}
              </div>

              {/* Conversation list */}
              <div className="flex-1 my-4 overflow-y-auto space-y-3.5 max-h-[300px] pr-1">
                {localChatLog.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <Cpu className="w-12 h-12 text-slate-800 animate-pulse" />
                    <p className="text-xs text-slate-400 font-bold">Hãy nạp mô hình ở cột cấu hình để bắt đầu đàm thoại offline.</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold max-w-sm">
                      Dữ liệu hội thoại của bạn được mã hóa an toàn ở mức trình duyệt phần cứng, không bao giờ gửi ra máy chủ internet ngoài.
                    </p>
                  </div>
                ) : (
                  localChatLog.map((chat, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl text-xs leading-relaxed space-y-2 border ${
                        chat.role === 'user'
                          ? 'bg-purple-600/10 border-purple-550/20 ml-12 text-slate-200'
                          : 'bg-slate-900/60 border-slate-900 mr-12 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-950 pb-1.5 mb-1 text-[9.5px] font-mono font-bold text-slate-500 uppercase">
                        <span>{chat.role === 'user' ? '👤 BẠN (LOCAL USER)' : '💻 OFFLINE AI ENGINE'}</span>
                      </div>
                      <div className="whitespace-pre-wrap font-medium font-sans">
                        {chat.text}
                      </div>
                    </div>
                  ))
                )}

                {isLocalGenerating && (
                  <div className="p-3.5 bg-slate-900/30 border border-slate-900 mr-12 rounded-xl text-xs text-slate-500 flex items-center gap-2 animate-pulse font-semibold">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                    <span>WebGPU WebLLM đang lý luận và tạo chữ cục bộ...</span>
                  </div>
                )}
              </div>

              {/* Presets and Chat Inputs */}
              <div className="space-y-3 pt-3 border-t border-slate-900">
                
                {/* Mini Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase font-mono mr-1">Mẫu nhanh:</span>
                  {OFFLINE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      disabled={!isLoaded || isLocalGenerating}
                      onClick={() => {
                        setLocalChatInput(prompt.text);
                      }}
                      className="px-2.5 py-1 text-[10px] bg-slate-900 border border-slate-850 hover:border-slate-700 hover:text-white rounded-lg text-slate-400 transition-all font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>

                {/* Input Text Box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={!isLoaded || isLocalGenerating}
                    value={localChatInput}
                    onChange={e => setLocalChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendLocalMessage()}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder={isLoaded ? "Nhập câu lệnh của bạn và chạy offline cực độ..." : "Mô hình chưa được nạp. Hãy load model trước..."}
                  />
                  <button
                    disabled={!isLoaded || isLocalGenerating || !localChatInput.trim()}
                    onClick={handleSendLocalMessage}
                    className="px-4 bg-gradient-to-r from-purple-650 to-indigo-650 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    BẮT ĐẦU CHẠY
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* =================================== TAB 2: GRAPHRAG (KNOWLEDGE GRAPH DEEP SEARCH) =================================== */}
      {activeTab === 'graph_rag' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Column 1: SVG Graph Interactive Area */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between min-h-[460px]">
              
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-blue-400" />
                    Mạng Đồ Thị Tri Thức Hoạt Ảnh (Active Knowledge Graph RAG Network)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Hover hoặc click các nút mạng để truy quét thông tin bối cảnh đa mục tiêu.</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[9px] font-black font-mono">
                  +35% ACCURACY
                </span>
              </div>

              {/* Interactive SVG Renderer */}
              <div className="relative flex-1 bg-[#010307] rounded-xl border border-slate-900 my-4 min-h-[300px] overflow-hidden flex items-center justify-center">
                
                {/* Graph Background Coordinate */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                <svg className="w-full h-[320px] z-10 select-none">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
                    </marker>
                    <marker id="arrow-highlight" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" fillOpacity="1" />
                    </marker>
                  </defs>

                  {/* Draw edges (paths) */}
                  {GRAPHRAG_EDGES.map((edge, idx) => {
                    const sourceNode = GRAPHRAG_NODES.find(n => n.id === edge.source);
                    const targetNode = GRAPHRAG_NODES.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const isHighlighted = highlightedEdges.includes(idx) || 
                                          (highlightedNodes.includes(edge.source) && highlightedNodes.includes(edge.target));

                    // Curve interpolation
                    const mx = (sourceNode.x + targetNode.x) / 2;
                    const my = (sourceNode.y + targetNode.y) / 2 - 10;

                    return (
                      <g key={idx}>
                        <path
                          d={`M ${sourceNode.x} ${sourceNode.y} Q ${mx} ${my} ${targetNode.x} ${targetNode.y}`}
                          fill="none"
                          stroke={isHighlighted ? '#3b82f6' : '#1e293b'}
                          strokeWidth={isHighlighted ? 2.5 : 1.2}
                          strokeDasharray={isHighlighted ? '4,4' : undefined}
                          className="transition-all duration-300"
                          markerEnd={isHighlighted ? 'url(#arrow-highlight)' : 'url(#arrow)'}
                        />
                        {/* Text labels on relations */}
                        <text
                          x={mx}
                          y={my - 4}
                          fill={isHighlighted ? '#60a5fa' : '#475569'}
                          fontSize="7.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {edge.relation}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw entity nodes */}
                  {GRAPHRAG_NODES.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    const isHighlighted = highlightedNodes.includes(node.id);

                    return (
                      <g 
                        key={node.id} 
                        transform={`translate(${node.x}, ${node.y})`}
                        className="cursor-pointer group"
                        onClick={() => setSelectedNode(node)}
                      >
                        {/* Outer Glow ring */}
                        <circle
                          r={isSelected ? 18 : isHighlighted ? 15 : 11}
                          fill="transparent"
                          stroke={node.color}
                          strokeWidth={isSelected ? 2.5 : isHighlighted ? 2 : 0}
                          className="animate-pulse transition-all duration-300"
                          strokeOpacity={isSelected ? 0.9 : 0.4}
                        />
                        
                        {/* Main center circle */}
                        <circle
                          r={isSelected ? 11 : 9}
                          fill={isSelected ? '#ffffff' : node.color}
                          stroke="#000"
                          strokeWidth={1}
                          className="transition-all duration-300 group-hover:scale-125"
                        />

                        {/* Node short label below */}
                        <text
                          y={isSelected ? 26 : 22}
                          fill={isSelected ? '#ffffff' : isHighlighted ? '#60a5fa' : '#94a3b8'}
                          fontSize="9"
                          fontWeight={isSelected ? 'black' : 'bold'}
                          textAnchor="middle"
                          className="pointer-events-none transition-all duration-300 filter drop-shadow font-sans"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend indicator overlay */}
                <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-900 p-2 rounded-lg text-[8.5px] font-mono font-bold text-slate-500 space-y-1 z-20">
                  <span className="block text-slate-400 mb-1 border-b border-slate-900 pb-0.5">Chú giải thực thể:</span>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#a855f7' }}></span><span>Doanh nghiệp (Company)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ec4899' }}></span><span>Hóa đơn thuế (Invoice)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></span><span>Dòng ngân hàng (Transaction)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }}></span><span>Cơ quan thuế (Authority)</span></div>
                </div>

              </div>

              {/* SVG Node detail inspector */}
              {selectedNode && (
                <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] text-slate-500 font-extrabold uppercase font-mono">Bảng chi tiết thực thể (RAG Entity Inspector)</span>
                    <span className="text-[9px] font-mono text-xs px-2 py-0.5 rounded font-black text-white" style={{ backgroundColor: selectedNode.color }}>
                      {selectedNode.type.toUpperCase()}
                    </span>
                  </div>
                  <strong className="text-white font-bold text-xs block">{selectedNode.label}</strong>
                  <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">{selectedNode.details}</p>
                </div>
              )}

            </div>

            {/* Column 2: RAG Pipeline Search Engine */}
            <div className="lg:col-span-12 xl:col-span-5 flex flex-col space-y-4">
              
              {/* Complex Search Panel */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Search className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-black text-white">GraphRAG Semantic Search</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-505 font-bold uppercase tracking-wider block font-mono">
                    Đặt câu hỏi liên hợp/quan hệ phức tạp:
                  </label>
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                    RAG vector truyền thống tìm từ khóa rời rạc, GraphRAG tự động liên kết các nút Graph. Hãy đặt câu hỏi đòi hỏi đối soát kép hóa đơn và ngân hàng để xem quy trình duyệt.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchGraphQuery}
                      onChange={e => setSearchGraphQuery(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                      placeholder="VD: Kiểm toán sai lệch giữa Vietcombank và hóa đơn...?"
                    />
                    <button
                      onClick={handleSearchGraph}
                      disabled={isSearchingGraph || !searchGraphQuery.trim()}
                      className="px-4.5 bg-blue-650 hover:bg-blue-600 font-extrabold text-white text-xs uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Duyệt Đồ Thị
                    </button>
                  </div>
                </div>

                {/* Preset Suggestions */}
                <div className="space-y-2.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Đề xuất kịch bản tìm mối liên hệ nhân quả:</span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setSearchGraphQuery('Kiểm toán xem giao dịch Vietcombank và hóa đơn #0921 của XYZ có khớp tiền và thuế không?');
                        // Directly trigger
                      }}
                      className="w-full text-left p-2 bg-slate-900/50 rounded-lg text-[11px] text-slate-300 hover:text-white border border-slate-900 hover:border-blue-500/30 transition-all font-semibold block cursor-pointer"
                    >
                      🔍 Kiểm toán đối soát Vietcombank và thuế hóa đơn dọn sạch
                    </button>
                    <button
                      onClick={() => {
                        setSearchGraphQuery('Trích xuất tất cả thực thể liên đới chịu kiểm duyệt cổng cơ quan thuế');
                      }}
                      className="w-full text-left p-2 bg-slate-900/50 rounded-lg text-[11px] text-slate-300 hover:text-white border border-slate-900 hover:border-blue-500/30 transition-all font-semibold block cursor-pointer"
                    >
                      📂 Xem các thực thể liên quan tới kiểm duyệt cổng cơ quan thuế
                    </button>
                  </div>
                </div>
              </div>

              {/* RAG Traversal Outputs & Explanations */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex-1 space-y-4">
                
                <h4 className="font-extrabold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Luồng Truy Vấn Đồ Thị Thực Tế (Walk the Graph & Reasoning Log)
                </h4>

                {graphPathLog.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-xs italic font-medium">
                    Hãy nạp và chạy "Duyệt Đồ Thị" để xem hệ máy học đi qua các quan hệ thực thể thế nào.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Traversal steps */}
                    <div className="space-y-1.5 font-mono text-[10.5px]">
                      {graphPathLog.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-400 leading-normal">
                          <CornerDownRight className="w-3.5 h-3.5 mt-0.5 text-blue-400 shrink-0" />
                          <span className={idx === graphPathLog.length - 1 ? "text-blue-350 font-black" : "font-semibold"}>{log}</span>
                        </div>
                      ))}
                    </div>

                    {/* Synthesis answer block */}
                    <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-400 font-extrabold uppercase text-[10px] font-mono">
                        <Sparkles className="w-4 h-4" />
                        <span>Tổng hợp lý luận bối cảnh (GraphRAG Synthesized Answer):</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-medium">
                        {ragExplanation}
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* =================================== TAB 3: ENTERPRISE AI GATEWAY =================================== */}
      {activeTab === 'gateway' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Top telemetry cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex items-center gap-3.5">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9.5px] text-slate-500 font-bold font-mono block uppercase">SEMANTIC CACHE HITS</span>
                <strong className="text-white text-lg font-black block leading-none">2,148 Lần</strong>
                <p className="text-[10px] text-slate-400 font-semibold">% Tỷ lệ giải quyết tức thì: 58.4%</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex items-center gap-3.5">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 font-bold shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9.5px] text-slate-500 font-bold font-mono block uppercase">PII REDACTION STATS</span>
                <strong className="text-white text-lg font-black block leading-none">42,910 Khối</strong>
                <p className="text-[10px] text-slate-400 font-semibold">Đã ẩn giấu Email, SĐT, Thẻ tín dụng</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex items-center gap-3.5 sm:col-span-2 lg:col-span-1">
              <div className="p-3 rounded-lg bg-indigo-505/10 text-indigo-400 font-bold shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9.5px] text-slate-500 font-bold font-mono block uppercase">CHI PHÍ TIẾT KIỆM (API BUDGET)</span>
                <strong className="text-emerald-400 text-lg font-black block leading-none">1,245.80 USD</strong>
                <p className="text-[10px] text-slate-400 font-semibold">Tận dụng cache và lọc hạn mức thông minh</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Column 1: Pipeline Route Architecture & Analytics */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Kong / Cloudflare AI Gateway API</h3>
              </div>

              {/* Sơ đồ đi qua Gateway vẽ bằng box tuyệt đẹp */}
              <div className="space-y-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Quy trình trung chuyển bảo mật (Enterprise Payload Sandbox):</span>
                
                <div className="space-y-2 font-mono text-[9.5px] font-bold text-center">
                  
                  <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
                    📱 Ứng Dụng (Client App / Ledgerflow Frontend)
                  </div>
                  <div className="flex justify-center text-slate-600">⬇️ (Gửi Payload thô chứa PII)</div>
                  
                  <div className="p-2.5 bg-slate-900 border border-emerald-500/30 text-emerald-400 rounded-lg shadow shadow-emerald-500/5">
                    🛡️ AI GATEWAY (Proxy Layer)
                  </div>
                  <div className="flex justify-center text-slate-600">⬇️ (Quét Regex, ẩn danh PII)</div>

                  <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
                    🔒 Lọc Bảo Mật [PII REDACTED]
                  </div>
                  <div className="flex justify-center text-slate-600">⬇️ (Đối chiếu bộ đệm ngữ nghĩa)</div>

                  <div className="p-2 bg-slate-900 border border-purple-500/30 text-purple-400 rounded-lg">
                    ⚡ Semantic Caching (Bộ Đệm Hỏi-Đáp Co-Chế)
                  </div>
                  <div className="flex justify-center text-slate-600">⬇️ (Nếu Cache Miss -&gt; Định tuyến)</div>

                  <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
                    🤖 Cloud Providers (Gemini / Anthropic / OpenAI)
                  </div>

                </div>
              </div>

              {/* Cost control Limit */}
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-900 space-y-3">
                <span className="text-[9.5px] text-slate-400 font-extrabold font-mono tracking-widest uppercase block">Giới hạn ngân sách kế toán doanh nghiệp (Accounting Limit)</span>
                
                <div className="space-y-1.5 text-xs text-slate-200">
                  <div className="flex justify-between font-bold">
                    <span>Ngân sách hạn mức tháng:</span>
                    <strong className="text-white">500.00 USD</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Tổng chi tiêu hiện hữu:</span>
                    <span>142.85 USD (28.5%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[28.5%]" />
                  </div>
                </div>
              </div>

            </div>

            {/* Column 2: Interactive playground for Cache & PII Redaction */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Box A: PII Redaction Engine */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                  <h4 className="font-extrabold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-purple-400" />
                    Báo Cáo Kiểm Soát &amp; Ẩn Danh Dữ Liệu Doanh Nghiệp (PII Protection Mode)
                  </h4>
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded text-[9px] font-black font-mono">
                    GDPR &amp; ISO 27001 APPROVED
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* PII Input */}
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] text-slate-500 font-extrabold uppercase font-mono tracking-wider">Văn bản gốc chứa dữ liệu nhạy cảm:</label>
                    <textarea
                      value={redactedInput}
                      onChange={e => setRedactedInput(e.target.value)}
                      className="w-full h-28 bg-slate-900 border border-slate-850 rounded-xl p-3 text-[11px] text-slate-200 outline-none leading-relaxed focus:border-purple-500 font-medium"
                      placeholder="Nhập văn bản gửi LLM liên quan tiền tệ, email, số điện thoại..."
                    />
                  </div>

                  {/* PII Redacted output */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9.5px] text-purple-450 font-extrabold uppercase font-mono tracking-wider">Bản lọc bảo mật bảo toàn (Redacted Payload):</label>
                      {piiApplied && (
                        <span className="text-[9px] text-emerald-400 font-bold font-mono animate-pulse">✓ ĐÃ ÁP DỤNG BỘ LỌC PII</span>
                      )}
                    </div>
                    <div className="w-full h-28 bg-slate-950 border border-slate-900 rounded-xl p-3 text-[11px] text-slate-350 leading-relaxed overflow-y-auto font-medium">
                      {redactedOutput || 'Chưa lọc...'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal max-w-sm">
                    ⚠️ AI Gateway tự động rà quét các định dạng thông tin của Việt Nam (Email, Số điện thoại di động Việt Nam, Tài khoản Vietcombank/MB) để ẩn danh hóa trước khi đẩy qua API ChatGPT/Gemini bảo mật.
                  </p>
                  <button
                    onClick={handleApplyPiiFilter}
                    className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Kiểm Tra Lọc PII
                  </button>
                </div>
              </div>

              {/* Box B: Semantic Caching Playground */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-3">
                
                <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                  <h4 className="font-extrabold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Thử nghiệm Bộ Đệm Ngữ Nghĩa (Semantic Caching Sandbox)
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-550 font-bold font-mono">BẬT CACHE:</span>
                    <button
                      onClick={() => setIsCacheEnabled(!isCacheEnabled)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${isCacheEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isCacheEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={semanticCacheQuery}
                      onChange={e => setSemanticCacheQuery(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 font-semibold"
                    />
                    <button
                      onClick={handleTestCache}
                      className="px-4 bg-emerald-650 hover:bg-emerald-600 font-extrabold text-white uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Kiểm Soát API
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase font-mono block mb-1">Ví dụ có sẵn trong Cache (Semantic Match &gt;95%):</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSemanticCacheQuery('Tính khấu hao TSCĐ theo Thông tư 45 có lưu ý gì không?')}
                        className="px-2 py-1 bg-slate-950 border border-slate-850 rounded text-[10.5px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        ⚡ Tiêu chí khấu hao theo TT45
                      </button>
                      <button
                        onClick={() => setSemanticCacheQuery('Làm thế nào để chi phí tiếp khách của doanh nghiệp SME được cơ quan Thuế chấp thuận?')}
                        className="px-2 py-1 bg-slate-950 border border-slate-850 rounded text-[10.5px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        ⚡ Chi phí tiếp khách hợp lý
                      </button>
                    </div>
                  </div>

                  {cacheResult && (
                    <div className="border border-slate-850 rounded-xl overflow-hidden font-mono text-[10.5px]">
                      
                      <div className="flex justify-between items-center px-3.5 py-1.5 bg-slate-900 border-b border-slate-850">
                        <span className={`font-black flex items-center gap-1.5 ${cacheResult.status === 'hit' ? 'text-emerald-400' : 'text-amber-500'}`}>
                          {cacheResult.status === 'hit' ? '🟢 SEMANTIC CACHE HIT (Đã lưu trữ)' : '🟡 CACHE MISS (Gọi API Đăng nhập mới)'}
                        </span>
                        <div className="flex gap-3 text-[9.5px] font-bold text-slate-550">
                          <span>Độ trễ: <strong className="text-white">{cacheResult.latency}</strong></span>
                          <span>Phí Gọi: <strong className="text-white">{cacheResult.cost}</strong></span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 text-slate-300 leading-normal font-sans font-medium select-text">
                        {cacheResult.text}
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =================================== TAB 4: AGENTIC UI WORKSPACE =================================== */}
      {activeTab === 'agentic_ui' && (
        <div className="space-y-6 animate-fade-in text-xs">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Column 1: Live Steps, Thoughts & Real-Time Stream */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between min-h-[460px]">
              
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Không Gian Minh Bạch Của Đặc Vụ AI (Agent Execution Monitor)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Theo dõi chi tiết luồng suy luận, từng bước chạy công cụ, và cơ chế tự chữa lành của AI.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border flex items-center gap-1 font-mono uppercase ${
                    agentStatus === 'idle'
                      ? 'bg-slate-900 border-slate-800 text-slate-500'
                      : agentStatus === 'running'
                      ? 'bg-purple-500/10 border-purple-500/25 text-purple-450 animate-pulse'
                      : agentStatus === 'error'
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 font-extrabold'
                      : agentStatus === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 font-extrabold'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {agentStatus === 'idle' && '🟢 ĐANG CHỜ'}
                    {agentStatus === 'running' && '🔄 SUY NGHĨ/CHẠY'}
                    {agentStatus === 'error' && '⚠️ SỰ CỐ CODE'}
                    {agentStatus === 'pending' && '⏳ CHỜ DUYỆT BÚT TOÁN'}
                    {agentStatus === 'success' && '✓ HOÀN TẤT'}
                  </span>
                </div>
              </div>

              {/* Steps Progress Visualizer */}
              <div className="my-5 grid grid-cols-5 gap-1 text-center text-[10px] font-mono leading-tight">
                {[
                  { id: 1, label: '1. Parse XML', desc: 'Đọc hóa đơn' },
                  { id: 2, label: '2. Đối Chiếu', desc: 'Khớp ngân hàng' },
                  { id: 3, label: '3. Chạy Python', desc: 'Dọn sạch Pandas' },
                  { id: 4, label: '4. Kiểm Toán', desc: 'Đánh giá sai lệch' },
                  { id: 5, label: '5. Vào Sổ Cái', desc: 'Bút toán bù trừ' }
                ].map((step, idx) => {
                  const isCurrent = agentStep === step.id;
                  const isDone = agentStep > step.id;
                  const isErrState = agentStatus === 'error' && agentStep === step.id;

                  return (
                    <div 
                      key={step.id} 
                      className={`p-2 rounded-xl border transition-all ${
                        isErrState
                          ? 'bg-rose-950/20 border-rose-500 text-rose-450'
                          : isCurrent
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-black'
                          : isDone
                          ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400'
                          : 'bg-slate-900/30 border-slate-900 text-slate-500'
                      }`}
                    >
                      <strong className="block text-[11px] mb-0.5">{step.label}</strong>
                      <span className="text-[9px] block text-slate-500 font-sans font-semibold leading-none">{step.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Execution Outputs (Live logging) */}
              <div className="flex-1 space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {agentLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 italic font-medium">
                    Hãy bấm nút "Khởi chạy Đặc vụ rà soát sổ sách" để xem máy học tự động hóa sửa lỗi ngày tháng và đối chiếu hóa đơn.
                  </div>
                ) : (
                  agentLogs.map((log, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all animate-fade-in ${
                        log.status === 'success'
                          ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                          : log.status === 'warning'
                          ? 'bg-rose-500/5 border-rose-550/20'
                          : log.status === 'done'
                          ? 'bg-blue-500/5 border-blue-500/10 text-blue-300'
                          : 'bg-purple-500/5 border-purple-500/15'
                      }`}
                    >
                      <span className="text-xs leading-none mt-0.5 shrink-0">
                        {log.status === 'success' ? '🟢' : log.status === 'warning' ? '🔴' : log.status === 'done' ? '🔵' : '🟣'}
                      </span>
                      <div className="space-y-0.5 text-left font-sans text-[11px]">
                        <span className="font-extrabold text-white block">
                          [Bước {log.step} - {log.type.toUpperCase()}]
                        </span>
                        <p className={log.status === 'warning' ? 'text-rose-450 font-bold font-mono' : 'text-slate-350 font-medium'}>
                          {log.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bot Controller trigger */}
              {agentStatus === 'idle' && (
                <div className="pt-4 flex justify-between items-center border-t border-slate-900">
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed max-w-md">
                    💡 Đặc vụ AI (Agentic AI) có thể tự chạy kịch bản Python, tự vá lỗi (Self-Healing) khi cấu trúc ngày tháng lỗi, đối ứng trực quan để giảm lỗi cho con người.
                  </p>
                  <button
                    onClick={handleStartAgent}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-550 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    Khởi Chạy Đặc Vụ Sai Lệch Sổ Sách
                  </button>
                </div>
              )}

            </div>

            {/* Column 2: Transparent Thought Stream & Macro Feedback Can thiệp */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              
              {/* Box A: Transparent Thought Stream */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex-1 space-y-3 min-h-[220px]">
                <h4 className="font-extrabold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Luồng Suy Nghĩ Có Thể Quan Sát (Thought Stream)
                </h4>

                <div className="p-3.5 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-450 font-extrabold uppercase text-[10px] font-mono block">
                    <Sparkles className="w-4 h-4" />
                    <span>Suy nghĩ nội bộ của AI (Observed reasoning):</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    {agentThoughts || 'Đặc vụ chưa khởi chạy. Chờ lệnh...'}
                  </p>
                </div>
              </div>

              {/* Box B: Micro Feedback Loop (User Intervention Panel) */}
              <div className="bg-slate-950 border border-slate-950 rounded-2xl p-5 space-y-3.5 border-t-2 border-amber-500/40">
                <h4 className="font-extrabold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400 animate-pulse" />
                  Cổng Can Thiệp Của Con Người (Micro-Feedback Loops)
                </h4>

                {agentStatus === 'pending' ? (
                  <div className="space-y-3.5">
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[10.5px] text-amber-300 font-semibold leading-relaxed">
                      ⏳ Đang treo tác vụ để chờ chỉ định duyệt chi phí của bạn. Bạn muốn duyệt Bút toán điều bù trừ hay điều chỉnh câu hỏi RAG mới?
                    </div>

                    <div className="flex gap-2 font-black">
                      <button
                        onClick={() => handleAgentApprove('approve')}
                        className="flex-1 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-[10.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-emerald-500/25 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        Phê Duyệt
                      </button>
                      <button
                        onClick={() => handleAgentApprove('modify')}
                        className="py-2.5 px-3 bg-slate-900 hover:bg-slate-850 hover:text-white rounded-xl text-[10.5px] uppercase tracking-wider border border-slate-800 transition-all cursor-pointer text-slate-350"
                      >
                        Sửa Câu Lệnh
                      </button>
                      <button
                        onClick={() => handleAgentApprove('cancel')}
                        className="py-2.5 px-3 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-900 text-rose-350 rounded-xl text-[10.5px] uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Từ Chối
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-center py-6 text-slate-500 font-semibold italic">
                    {agentStatus === 'success' ? (
                      <div className="space-y-2 text-emerald-400 font-sans not-italic">
                        <CheckCircle2 className="w-10 h-10 mx-auto" />
                        <h5 className="font-bold text-xs uppercase font-mono">Đã phê duyệt hoàn thành hạch toán</h5>
                        <p className="text-[10px] text-slate-450 leading-relaxed font-semibold max-w-sm mx-auto">
                          Bút toán đã lưu trữ an toàn vào lịch sử. Không có rủi ro sai sót thuế.
                        </p>
                      </div>
                    ) : (
                      <span>Không phát hiện yêu cầu treo duyệt nào trong hàng đợi của Đặc vụ.</span>
                    )}
                  </div>
                )}

                {/* Approval History tracking logs */}
                {approvalHistory.length > 0 && (
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-900 font-mono text-[9px] text-slate-500 text-left space-y-1">
                    <span className="block font-bold uppercase text-slate-400">Nhật ký duyệt sổ:</span>
                    {approvalHistory.map((h, i) => (
                      <span key={i} className="block leading-relaxed">✓ {h}</span>
                    ))}
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
