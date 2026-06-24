import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Search, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  Calculator, 
  TrendingUp, 
  Badge, 
  FileText, 
  ArrowRight, 
  Zap, 
  Globe, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  ExternalLink,
  ChevronDown,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import * as XLSX from 'xlsx';

// Define Interfaces for Keyword Discovery
interface SuggestKeyword {
  keyword: string;
  searchVolume: 'high' | 'medium' | 'low'; // >2000, 500-2000, <500
  searchVolumeNum: number;
  competition: 'high' | 'medium' | 'low';
  intent: 'informational' | 'commercial' | 'transactional';
  painPoint: string;
  softwareIdea: string;
  monetization: string;
  guerrillaScore: number;
  longtailVariants: string[];
}

// Define Interface for Product Mapping design
interface ProductBlueprint {
  productName: string;
  tagline: string;
  coreFeatures: string[];
  techStack: {
    frontend: string;
    backend: string;
    deployment: string;
  };
  pricingTiers: {
    name: string;
    price: number;
    features: string[];
  }[];
  keywordMapping: {
    primaryKeyword: string;
    landingPageTitle: string;
    metaDescription: string;
  };
  distributionChannels: string[];
  day1LaunchPlan: string;
  mrrTarget: {
    month3: number;
    month6: number;
    month12: number;
  };
  guerrillaHacks: string[];
}

// Define Interface for Landing Page Structure
interface LandingPageDesign {
  seo: {
    title: string;
    metaDescription: string;
    h1: string;
    slug: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    ctaButton: string;
    trustBadge: string;
  };
  painSection: {
    heading: string;
    pains: string[];
  };
  featuresSection: {
    heading: string;
    features: {
      icon: string;
      title: string;
      desc: string;
    }[];
  };
  socialProof: {
    testimonials: {
      name: string;
      role: string;
      quote: string;
    }[];
  };
  pricingSection: {
    heading: string;
    guarantee: string;
  };
  faqSection: {
    questions: {
      q: string;
      a: string;
    }[];
  };
  footerCTA: string;
  blogIdeas: string[];
}

export default function GoogleKeywordStrategy() {
  const { activeIdea } = useStore();
  const [activeTab, setActiveTab] = useState<'discovery' | 'mapper' | 'landing' | 'calculator'>('discovery');
  
  // Tab 1 States (Discovery)
  const [nicheInput, setNicheInput] = useState<string>('kế toán hộ kinh doanh');
  const [targetAudience, setTargetAudience] = useState<string>('Hộ kinh doanh');
  const [budgetTarget, setBudgetTarget] = useState<number>(99000); // VNĐ/tháng

  // Sync state when activeIdea changes dynamically
  useEffect(() => {
    if (activeIdea) {
      setNicheInput(activeIdea.nicheAudience);
      setTargetAudience(activeIdea.type === 'game' ? 'Game thủ / Học sinh sinh viên' : 'Chủ shop bán hàng / Hộ kinh doanh');
      setBudgetTarget(activeIdea.pricePoint);
      setProductNameInput(activeIdea.title.split(' - ')[0]);
      setCalcPrice(activeIdea.pricePoint);
      
      if (activeIdea.type === 'game') {
        setPrimaryKeywordInput('game di động sài gòn vui nhộn');
      } else if (activeIdea.id === 'idea_saas_vietqr' || activeIdea.title.toLowerCase().includes('vietqr')) {
        setPrimaryKeywordInput('phần mềm đối soát vietqr tự động');
      } else {
        setPrimaryKeywordInput('công cụ tự động hóa ' + activeIdea.type);
      }
    }
  }, [activeIdea]);
  const [loadingDiscovery, setLoadingDiscovery] = useState<boolean>(false);
  const [discoveredKeywords, setDiscoveredKeywords] = useState<SuggestKeyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortField, setSortField] = useState<'score' | 'vol' | 'keyword'>('score');
  const [copiedKeywordText, setCopiedKeywordText] = useState<string | null>(null);

  // Tab 2 States (Product Mapper)
  const [loadingMapper, setLoadingMapper] = useState<boolean>(false);
  const [blueprintResult, setBlueprintResult] = useState<ProductBlueprint | null>(null);
  const [savedToHub, setSavedToHub] = useState<boolean>(false);

  // Tab 3 States (Landing Page)
  const [productNameInput, setProductNameInput] = useState<string>('LedgerFlow Auto-Ledger');
  const [primaryKeywordInput, setPrimaryKeywordInput] = useState<string>('phần mềm kế toán hộ kinh doanh');
  const [loadingLanding, setLoadingLanding] = useState<boolean>(false);
  const [landingDesign, setLandingDesign] = useState<LandingPageDesign | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string>('seo');
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<string | null>(null);

  // Tab 4 States (Calculator)
  const [calcVolume, setCalcVolume] = useState<number>(3100);
  const [calcCTR, setCalcCTR] = useState<number>(3); // 3% 
  const [calcConv, setCalcConv] = useState<number>(8); // 8% trial to paid
  const [calcPrice, setCalcPrice] = useState<number>(99000); // 99k
  const [calcChurn, setCalcChurn] = useState<number>(5); // 5% monthly churn
  const [calcRankWeeks, setCalcRankWeeks] = useState<number>(12); // Weeks to rank #3

  // Load selected keywords initially or provide presets
  useEffect(() => {
    if (discoveredKeywords.length > 0 && selectedKeywords.length === 0) {
      // Pick top-scoring keyword as default chosen
      const best = [...discoveredKeywords].sort((a,b) => b.guerrillaScore - a.guerrillaScore)[0];
      if (best) {
        setSelectedKeywords([best.keyword]);
      }
    }
  }, [discoveredKeywords]);

  // Synchronize inputs between tabs beautifully
  useEffect(() => {
    if (blueprintResult) {
      setProductNameInput(blueprintResult.productName);
      setPrimaryKeywordInput(blueprintResult.keywordMapping.primaryKeyword);
    }
  }, [blueprintResult]);

  // ================= TAB 1: KEYWORD DISCOVERY FETCH =================
  const handleKeywordDiscovery = async () => {
    setLoadingDiscovery(true);
    setDiscoveredKeywords([]);
    try {
      const prompt = `Bạn là chuyên gia nghiên cứu từ khóa Google SEO và tư vấn tăng tốc tăng trưởng thị trường micro-SaaS tại Việt Nam.
Hãy phân tích và kiến lập danh sách 15 từ khóa Google tiếng Việt có tiềm năng hái tiền cao nhất phù hợp:
- Ngành/Ý tưởng gốc: "${nicheInput}"
- Đối tượng mục tiêu: "${targetAudience}"
- Giá trị phần mềm muốn bán: ${budgetTarget.toLocaleString('vi-VN')} VNĐ/tháng

Bạn PHẢI trả về ĐÚNG cấu trúc mảng JSON các đối tượng mà tuyệt đối không viết thêm bất kỳ từ giải thích nào trước hoặc sau khối JSON. Khối JSON phải khớp 100% định dạng mảng dưới đây để client parse được:
[
  {
    "keyword": "từ khóa đầy đủ ví dụ: phần mềm kế toán hộ kinh doanh miễn phí",
    "searchVolume": "high" hoặc "medium" hoặc "low",
    "searchVolumeNum": từ 300 đến 1000000 (lượt tìm kiếm/tháng thực tế ước lượng),
    "competition": "low" hoặc "medium" hoặc "high",
    "intent": "transactional" hoặc "commercial" hoặc "informational",
    "painPoint": "nỗi đau hay lo lắng cốt lõi của người gõ từ khóa này",
    "softwareIdea": "ý tưởng micro-SaaS hoặc mini-tool 0đ thiết thực xử lý triệt để nỗi đau đó",
    "monetization": "luồng thu tiền tối giản cụ thể (VD: bán gói 35k/tháng nạp VietQR)",
    "guerrillaScore": số từ 1 đến 10 (chấm điểm khả thi độc lực khởi sự 0đ: cao nhất là 10, thấp là 1),
    "longtailVariants": ["biến thể từ khóa dài 1", "biến thể 2", "biến thể 3"]
  }
]`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'Bạn là chuyên gia phân tích dữ liệu Google Search và tư vấn micro-SaaS tối giản tại Việt Nam. Bạn luôn cung cấp JSON sạch 100%, tuyệt đối không bọc markdown ```json ... ```.'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        let cleanText = String(data.text || data.content || data.output || '').trim();
        // Remove markdown wrapper if any
        if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
        if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
        cleanText = cleanText.trim();
        
        try {
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed)) {
            setDiscoveredKeywords(parsed);
          } else {
            throw new Error('Đầu ra không phải là mảng XML/JSON.');
          }
        } catch (e) {
          console.warn("JSON error, falling back to simulator:", e);
          triggerDiscoveryFallback();
        }
      } else {
        triggerDiscoveryFallback();
      }
    } catch (err) {
      console.warn("API/Fetch error, falling back to simulator:", err);
      triggerDiscoveryFallback();
    } finally {
      setLoadingDiscovery(false);
    }
  };

  const triggerDiscoveryFallback = () => {
    // Generate intelligent local simulator fallback based on input
    const cleanNiche = nicheInput.toLowerCase();
    const mockKeywords: SuggestKeyword[] = [
      {
        keyword: `phần mềm ${cleanNiche} tốt nhất`,
        searchVolume: 'medium',
        searchVolumeNum: 2400,
        competition: 'low',
        intent: 'commercial',
        painPoint: 'Khách tìm kiếm công cụ uy tín, giao diện đơn giản nhất có thể để triển khai nhanh gọn.',
        softwareIdea: `Giải pháp ${nicheInput} tối giản dạng Web/PWA, cài đặt trong 1 phút không cài app rườm rà.`,
        monetization: `Bán gói Pro hằng tháng giá khoảng ${(budgetTarget * 0.8).toLocaleString('vi-VN')}đ tích hợp nạp QR tự động.`,
        guerrillaScore: 8.7,
        longtailVariants: [`phần mềm ${cleanNiche} dễ dùng`, `phần mềm ${cleanNiche} cho người mới`, `top app ${cleanNiche}`]
      },
      {
        keyword: `${cleanNiche} miễn phí`,
        searchVolume: 'high',
        searchVolumeNum: 5800,
        competition: 'medium',
        intent: 'informational',
        painPoint: 'Chưa có tiền, sợ mua nhầm ứng dụng cồng kềnh khó dùng, muốn test hiệu năng trước.',
        softwareIdea: `Cung cấp phiên bản Free-Forever sử dụng SQLite cục bộ lưu trình duyệt cực an toàn, nạp điện toán đám mây thu phí nhỏ.`,
        monetization: `Gốc miễn phí, upsell tính năng Xuất Báo Cáo Tài Chính Động giá ${budgetTarget.toLocaleString('vi-VN')}đ / lần.`,
        guerrillaScore: 9.3,
        longtailVariants: [`app ${cleanNiche} free`, `web ${cleanNiche} miễn phí không đăng ký`, `template excel ${cleanNiche}`]
      },
      {
        keyword: `hướng dẫn ${cleanNiche} tự động`,
        searchVolume: 'low',
        searchVolumeNum: 1600,
        competition: 'low',
        intent: 'transactional',
        painPoint: 'Tốn hàng giờ hạch toán ròng rã, hay say xỉn nhập sai lệch số liệu tài sản.',
        softwareIdea: `AI Agent tự động hóa import dữ liệu đầu vào đơn hàng và phát hiện cân bằng kép tức thời.`,
        monetization: `Gửi email tự động đối soát hằng ngày mức giá ${(budgetTarget * 1.2).toLocaleString('vi-VN')}đ/tháng.`,
        guerrillaScore: 9.1,
        longtailVariants: [`cach lam ${cleanNiche} nhanh`, `tool import excel tự động ${cleanNiche}`, `phần mềm đối soát tự động`]
      },
      {
        keyword: `chi phí ${cleanNiche} rẻ nhất`,
        searchVolume: 'medium',
        searchVolumeNum: 3100,
        competition: 'low',
        intent: 'transactional',
        painPoint: 'Doanh thu nhỏ lẻ, không chịu nổi chi phí đầu tư cao 4tr/năm của các ông lớn phần mềm.',
        softwareIdea: `Lập trình tối giản 0đ serverless, áp dụng Lifetime Deal thanh toán 1 lần duy nhất dùng vĩnh viễn.`,
        monetization: `Cam kết rẻ nhất thị trường: Chỉ thanh toán gói khởi điểm ${budgetTarget.toLocaleString('vi-VN')}đ hằng quý.`,
        guerrillaScore: 9.4,
        longtailVariants: [`phần mềm ${cleanNiche} giá cực rẻ`, `${cleanNiche} trọn gói 1 lần`, `bảng giá phần mềm ${cleanNiche}`]
      },
      {
        keyword: `mẫu file ${cleanNiche} cho ${targetAudience.toLowerCase()}`,
        searchVolume: 'medium',
        searchVolumeNum: 1900,
        competition: 'low',
        intent: 'commercial',
        painPoint: 'Thay vì dùng app, họ quen dùng Excel nhưng lo sợ đổ vỡ liên kết dòng khi chia sẻ hoặc máy hỏng.',
        softwareIdea: `Phần mềm lai Web-Excel: Import file excel cũ vào render một dashboard biểu đồ quản trị sắc bén dạng Web vẹn toàn.`,
        monetization: `Bán file template tích hợp API đồng bộ đám mây giá 199.000 VNĐ một lần thanh toán.`,
        guerrillaScore: 8.5,
        longtailVariants: [`file excel ${cleanNiche} của bộ tài chính`, `tải mẫu excel ${cleanNiche}`, `mẫu quản trị thu chi`]
      },
      {
        keyword: `app ${cleanNiche} bảo mật trên điện thoại`,
        searchVolume: 'medium',
        searchVolumeNum: 2200,
        competition: 'medium',
        intent: 'commercial',
        painPoint: 'Sợ lộ dữ liệu công nợ kinh doanh cho các bên thứ ba bóc tách quảng cáo.',
        softwareIdea: `Ứng dụng lưu dữ liệu cục bộ an toàn, khóa vân tay và mã hóa mật mật độ cao trong local storage trình duyệt.`,
        monetization: `Thu phí Cloud backup tùy chọn qua MBBank VietQR giá ${budgetTarget.toLocaleString('vi-VN')}đ.`,
        guerrillaScore: 8.9,
        longtailVariants: [`ở đâu lưu ${cleanNiche} bảo mật`, `phần mềm offline ${cleanNiche}`, `app không dùng internet`]
      }
    ];
    setDiscoveredKeywords(mockKeywords);
  };

  // Toggle keyword selection
  const handleToggleKeyword = (kw: string) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
    } else {
      setSelectedKeywords([...selectedKeywords, kw]);
    }
  };

  // Sort and filter discovered keywords
  const getSortedAndFilteredKeywords = () => {
    let result = [...discoveredKeywords];
    
    // Search filter
    if (searchFilter.trim() !== '') {
      result = result.filter(item => 
        item.keyword.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.softwareIdea.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Sort sorting field
    result.sort((a, b) => {
      if (sortField === 'score') {
        return b.guerrillaScore - a.guerrillaScore;
      } else if (sortField === 'vol') {
        return b.searchVolumeNum - a.searchVolumeNum;
      } else {
        return a.keyword.localeCompare(b.keyword);
      }
    });

    return result;
  };

  // Export to Excel helper using xlsx library
  const handleExportExcel = () => {
    if (discoveredKeywords.length === 0) return;
    
    const formatted = getSortedAndFilteredKeywords().map(item => ({
      'Từ Khóa': item.keyword,
      'Lượt Tìm Kiếm / Tháng (Ước tính)': item.searchVolumeNum,
      'Độ Cạnh Tranh SEO': item.competition === 'high' ? 'Cao' : item.competition === 'medium' ? 'Trung bình' : 'Thấp',
      'Ý Định Tìm Kiếm': item.intent === 'transactional' ? 'Mua hàng trực tiếp' : item.intent === 'commercial' ? 'So sánh thương mại' : 'Thông tin chung',
      'Nỗi Đau Người Tìm': item.painPoint,
      'Ý Tưởng Phần Mềm 0đ': item.softwareIdea,
      'Chiến Lược Giá Thu Tiền': item.monetization,
      'Điểm Khả Thi Du Kích (1-10)': item.guerrillaScore
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Từ Khóa Bán SaaS Việt');
    
    XLSX.writeFile(workbook, `ledgerflow_google_keywords_${nicheInput.replace(/\s+/g, '_')}.xlsx`);
  };

  // ================= TAB 2: PRODUCT MAPPER FETCH =================
  const handleProductMapping = async () => {
    if (selectedKeywords.length === 0) {
      alert('Vui lòng chọn ít nhất 1 từ khóa ở Tab 1 trước khi khởi sự thiết kế sản phẩm!');
      return;
    }

    setLoadingMapper(true);
    setBlueprintResult(null);
    setSavedToHub(false);

    try {
      const prompt = `Bạn là cố vấn thiết kế sản phẩm micro-SaaS du kích sừng sỏ nhất Việt Nam.
Từ mảng nhóm từ khóa Google đã chọn lọc: [${selectedKeywords.join(', ')}]
Hãy xây dựng bản thiết kế blueprint chi tiết cho một sản phẩm phần mềm tinh gọn để bán hiệu quả cho tệp khách hàng tìm kiếm từ khóa đó.

Yêu cầu ĐẦU RA 100% khớp lược đồ JSON sạch, tuyệt đối không chèn chữ giải thích ngoài khối JSON:
{
  "productName": "tên sản phẩm phần mềm cực sắc bén tiếng Việt ngắn gọn, ví dụ: AutoLedger VN",
  "tagline": "slogan gây chú ý, dưới 10 chữ diễn tả lợi ích tuyệt đối",
  "coreFeatures": ["tính năng 1", "tính năng 2", "tính năng 3"] (tối đa đúng 3 tính năng có thể lập trình trong 3 ngày),
  "techStack": {
    "frontend": "Ví dụ: React + Tailwind CSS hoặc Chrome Extension",
    "backend": "Ví dụ: LocalStorage + SQLite WASM không tốn tiền cơ sở dữ liệu server",
    "deployment": "Ví dụ: Vercel / Cloudflare Pages 0đ duy trì"
  },
  "pricingTiers": [
    {"name": "Free", "price": 0, "features": ["tính năng free"]},
    {"name": "Gói Tháng (Pro)", "price": 99000, "features": ["tính năng pro"]},
    {"name": "Gói Năm (VIP)", "price": 599000, "features": ["tính năng vip"]}
  ],
  "keywordMapping": {
    "primaryKeyword": "từ khóa chính để SEO trang đích",
    "landingPageTitle": "Tiêu đề thẻ Title SEO chứa từ khóa gợi cảm ứng",
    "metaDescription": "meta description tối ưu hóa dưới 155 ký tự có chứa từ khóa"
  },
  "distributionChannels": ["kênh phân phối miễn phí 1 (VD: Seeding group zalo kế toán)", "kênh 2"],
  "day1LaunchPlan": "kế hoạch hành động cụ thể cho Ngày thứ nhất ra mắt đạt doanh thu",
  "mrrTarget": {
    "month3": 15000000,
    "month6": 45000000,
    "month12": 150000000
  },
  "guerrillaHacks": [
    "hack marketing 0đ số 1",
    "hack 2",
    "hack 3"
  ]
}`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'Bạn luôn trả về duy nhất khối JSON sạch, không chèn markdown code blocks hay giải thích bên ngoài.'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        let cleanText = String(data.text || data.content || data.output || '').trim();
        if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
        if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
        cleanText = cleanText.trim();

        try {
          const parsed = JSON.parse(cleanText);
          setBlueprintResult(parsed);
          // Auto fill calculators
          setCalcVolume(2400); 
          if (parsed.pricingTiers && parsed.pricingTiers[1]) {
            setCalcPrice(parsed.pricingTiers[1].price);
          }
        } catch (e) {
          console.warn("JSON error, falling back to mapper fallback:", e);
          triggerMapperFallback();
        }
      } else {
        triggerMapperFallback();
      }
    } catch (err) {
      console.warn("API error, falling back to mapper fallback:", err);
      triggerMapperFallback();
    } finally {
      setLoadingMapper(false);
    }
  };

  const triggerMapperFallback = () => {
    const mainKw = selectedKeywords[0] || nicheInput;
    const cleanKwClass = mainKw.charAt(0).toUpperCase() + mainKw.slice(1);
    
    const mockBlueprint: ProductBlueprint = {
      productName: `${cleanKwClass.split(' ')[0]}Flow - Trực Tuyến Tối Giản`,
      tagline: `Tự động hóa sổ sách bán hàng, rũ bỏ phiền phức hóa đơn rườm rà.`,
      coreFeatures: [
        'Import file Excel sao kê ngân hàng render tức thì đồ thị hạch toán lãi lỗ.',
        'Đồng bộ hóa đơn thuế điện tử của tổng cụ thuế tự động không cần gõ tay.',
        'Lưu cơ sở dữ liệu SQLite WASM tuyệt mật ngay trên máy khách không cần đám mây.'
      ],
      techStack: {
        frontend: 'Vite React + Tailwind CSS (Edge UI)',
        backend: 'WASM SQLite Local + API nạp QR MBBank đối soát tự động',
        deployment: 'Cloudflare Pages miễn phí duy trì, chịu lực cao'
      },
      pricingTiers: [
        { name: 'Miễn phí (Local)', price: 0, features: ['Lưu trữ cục bộ bảo mật', 'Import Excel sao kê dạng cơ bản', 'Ghi chép sổ cái Nợ Có'] },
        { name: 'Gói Bản Quyền Pro', price: budgetTarget > 0 ? budgetTarget : 99000, features: ['Sao lưu đám mây Supabase an tâm', 'AI tự biên nhận dạng hóa đơn nhập khẩu', 'Kết nối VietQR đối soát nạp rút thực tế'] },
        { name: 'Gói Thẩm Định Doanh Nghiệp', price: (budgetTarget > 0 ? budgetTarget : 99000) * 5, features: ['Gồm 5 tài khoản nhân sự kết nối đồng bộ', 'Mẫu báo cáo kế toán VAT / Thuế TNCN tích hợp', 'Hỗ trợ kỹ thuật 24/7 trực tiếp qua Telegram'] }
      ],
      keywordMapping: {
        primaryKeyword: mainKw,
        landingPageTitle: `Phần mềm ${mainKw} tốt nhất hiện nay - ${cleanKwClass.split(' ')[0]}Flow`,
        metaDescription: `Sử dụng phần mềm sổ sách ${mainKw} chuyên dụng, tự động tải hóa đơn điện tử không tốn chi phí ròng. Đăng ký nhận ngay Lifetime Deal hời.`
      },
      distributionChannels: [
        `Tạo video ngắn TikTok/Youtube Shorts hướng dặt giải quyết nỗi đau tìm kiếm cho từ khóa: "${mainKw}"`,
        `Seeding thảo luận hữu ích trong các Group Facebook về ${targetAudience} chia sẻ template mẫu rồi đính link app.`
      ],
      day1LaunchPlan: `Tạo 1 tài khoản và đăng tải sản phẩm của bạn lên các hội nhóm khởi nghiệp công nghệ Việt Nam cùng chương trình Lifetime Deal bản quyền giá rẻ cực mặn để kiếm 10 khách hàng đầu tiên.`,
      mrrTarget: {
        month3: 12500000,
        month6: 38000000,
        month12: 120000000
      },
      guerrillaHacks: [
        `Đặt tên URL thân thiện chứa từ khóa chính giúp thăng hạng tự nhiên lên top #1 Google không tốn 1đ quảng cáo Google Ads.`,
        `Cung cấp bộ Widget tích hợp mini hoàn toàn miễn phí trên website cá nhân để làm mồi phễu lấy thông tin email.`,
        `Sử dụng Bot Telegram thông báo khi có dòng giao dịch ngân hàng mới để chăm sóc nâng cấp khách hàng Pro.`
      ]
    };

    setBlueprintResult(mockBlueprint);
    // Autofill calculator from fallback pricing
    setCalcPrice(mockBlueprint.pricingTiers[1].price);
  };

  const handleSaveToGuerrillaHub = () => {
    if (!blueprintResult) return;
    
    try {
      const stored = localStorage.getItem('guerrilla_unexpected_ideas');
      const currentList = stored ? JSON.parse(stored) : [];
      
      const newId = `idea_keyword_${Date.now()}`;
      const newIdea = {
        id: newId,
        title: blueprintResult.productName + ` (${blueprintResult.keywordMapping.primaryKeyword})`,
        type: 'saas' as const,
        nicheAudience: targetAudience,
        pricePoint: blueprintResult.pricingTiers[1].price,
        speedRating: 9,
        costRating: 10, // 0d serverless
        marketPain: 9,
        viralPotential: 8,
        description: `${blueprintResult.tagline} Được tối ưu hóa tuyệt đối cho nhóm từ khóa Google SEO: ${selectedKeywords.join(', ')}.`,
        guerrillaScore: 9.2,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        aiBlueprint: `### 🚀 BẢN THIẾT KẾ CHIẾN THUẬT TỐI ƯU TỪ KHÓA GOOGLE - ${blueprintResult.productName.toUpperCase()}
        
## 1. DATA SCIENCE & BIG DATA (Bộ Dữ Liệu)
- **Star Schema**: Lưu trữ nhật ký tối ưu cho từ khóa chính \`${blueprintResult.keywordMapping.primaryKeyword}\`.
- **Phân Tích**: Giám sát phễu chuyển đổi từ Click chuột Google -> Đăng ký dung thử -> Chuyển đổi nạp tiền Pro.

## 2. BUSINESS ANALYSIS (Nghiệp vụ hạch toán)
- **Nỗi đau khách hàng**: Tìm kiếm liên thông đến từ khóa nghiệp vụ.
- **Tính năng cốt lõi**:
${blueprintResult.coreFeatures.map(f => `- ${f}`).join('\n')}

## 3. FINANCIAL ACCOUNTING (Mô hình kinh tế)
- **Định giá**: Gói tháng Pro chỉ ${blueprintResult.pricingTiers[1].price.toLocaleString('vi-VN')} VNĐ hời, kích thích chuyển đổi.
- **Hạ tầng 0đ**: ${blueprintResult.techStack.deployment} + cơ sở ${blueprintResult.techStack.backend}.

## 4. PROGRAMMING STACK (Công nghệ phát triển)
- **Frontend**: ${blueprintResult.techStack.frontend}
- **Vận hành**: Chạy tĩnh 100% không tốn chi phí ròng rã, bảo đảm tốc độ tuyệt vời SEO đạt điểm 100 LightHouse.

## 5. MACHINE LEARNING & AI
- **Trí khôn sản phẩm**: ${blueprintResult.guerrillaHacks[1] || 'Tích hợp AI đối soát và phân hạch kế toán thông minh.'}`
      };
      
      localStorage.setItem('guerrilla_unexpected_ideas', JSON.stringify([newIdea, ...currentList]));
      setSavedToHub(true);
      alert(`🎉 Đồng bộ thành công! Sản phẩm "${blueprintResult.productName}" đã được đưa vào Phân hệ "Sản Phẩm Du Kích (Guerrilla Hub)" của LedgerFlow Studio để bạn triển khai mượt mà hằng ngày.`);
    } catch (e) {
      console.error('Lỗi lưu vào hub:', e);
      alert('Không thể sao lưu mộc. Vui lòng thử lại.');
    }
  };

  // ================= TAB 3: SEO LANDING PAGE FETCH =================
  const handleGenerateLandingPage = async () => {
    setLoadingLanding(true);
    setLandingDesign(null);

    try {
      const prompt = `Bạn là cây viết nội dung copywriting SEO xuất sắc chuyên viết trang đích (Landing Page) bán phần mềm SaaS cho thị trường Việt Nam.
Sản phẩm: "${productNameInput}"
Nhóm từ khóa chính cần tối ưu hóa lên TOP GOOGLE: "${primaryKeywordInput}"
Đối tượng khách hàng phục vụ: "${targetAudience}"
Giá gói Pro đề xuất: ${calcPrice.toLocaleString('vi-VN')} VNĐ/tháng

Hãy viết toàn bộ nội dung của trang đích SEO có cấu trúc JSON sạch, tuyệt đối không chèn chữ giải thích ngoài khối JSON:
{
  "seo": {
    "title": "Thẻ title tối ưu <60 ký tự có chứa từ khóa",
    "metaDescription": "Thẻ Description tối ưu <155 ký tự kích thích tỷ lệ Click (CTR)",
    "h1": "Tiêu đề hạch tâm H1 đầu trang chứa từ khóa tự nhiên",
    "slug": "url-slug-seo-viet-nam"
  },
  "hero": {
    "headline": "Tiêu đề Hero cuốn hút, đánh trực tiếp vào nỗi đau tài chính",
    "subheadline": "Mô tả lợi ích tuyệt đối 2 câu rõ ràng, dễ hiểu cho người mới",
    "ctaButton": "Thông điệp nút bấm kêu gọi hành động (VD: Trải Nghiệm Offline Miễn Phí)",
    "trustBadge": "Cam kết thuyết phục ví dụ: 500+ Hộ Kinh Doanh Việt Đã Tin Dùng"
  },
  "painSection": {
    "heading": "Tiêu đề phần lột tả nỗi đau giấy tờ/phần mềm cũ",
    "pains": ["nỗi đau tiền bạc tệ hại 1", "nỗi đau cồng kềnh 2", "nỗi đau mất thời gian 3"]
  },
  "featuresSection": {
    "heading": "Tiêu đề giải pháp tính năng",
    "features": [
      {"icon": "emoji icon 1", "title": "tên tiện ích 1", "desc": "lợi ích thực tế thu về"},
      {"icon": "emoji icon 2", "title": "tên tiện ích 2", "desc": "lợi ích thực tế thu về"},
      {"icon": "emoji icon 3", "title": "tên tiện ích 3", "desc": "lợi ích thực tế thu về"}
    ]
  },
  "socialProof": {
    "testimonials": [
      {"name": "Nguyễn Văn A", "role": "Chủ tiệm bán lẻ tạp hóa nhỏ", "quote": "Đánh giá chân thực bộc bạch sự sung sướng từ khi dùng ứng dụng dọn rác đơn hàng."},
      {"name": "Trần Thị B", "role": "Kế toán viên tự do freelance", "quote": "Báo cáo nạp tự động nhanh khủng khiếp, tôi ghi điểm tuyệt đối trong mắt sếp tổng."}
    ]
  },
  "pricingSection": {
    "heading": "Định vị giá hời không đắn đo",
    "guarantee": "Hoàn tiền 100% trong 14 ngày nếu không giảm được 90% giờ thủ công"
  },
  "faqSection": {
    "questions": [
      {"q": "Câu hỏi bảo mật dữ liệu ở đâu?", "a": "Trả lời về giải pháp bảo mật tuyệt đối tại máy cục bộ (SQLite WASM)."},
      {"q": "Tôi có cần đóng tiền duy trì server không?", "a": "Trả lời hoàn toàn không vì hệ thống lai tĩnh miễn phí trọn đời."}
    ]
  },
  "footerCTA": "Tiêu đề kêu gọi chốt hạ cuối trang kèm bảo hành",
  "blogIdeas": [
    "Ý tưởng bài viết blog bổ trợ chuẩn SEO vệ tinh 1",
    "Ý tưởng bài blog 2",
    "Ý tưởng bài blog 3",
    "Ý tưởng bài blog 4",
    "Ý tưởng bài blog 5"
  ]
}`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'Bạn luôn kết xuất JSON sạch hoàn chỉnh 100% khớp cấu trúc, không viết thêm text linh tinh.'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        let cleanText = String(data.text || data.content || data.output || '').trim();
        if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
        if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
        cleanText = cleanText.trim();

        try {
          const parsed = JSON.parse(cleanText);
          setLandingDesign(parsed);
        } catch (e) {
          console.warn("JSON error, falling back to landing fallback:", e);
          triggerLandingFallback();
        }
      } else {
        triggerLandingFallback();
      }
    } catch (err) {
      console.warn("API error, falling back to landing fallback:", err);
      triggerLandingFallback();
    } finally {
      setLoadingLanding(false);
    }
  };

  const triggerLandingFallback = () => {
    const mockLanding: LandingPageDesign = {
      seo: {
        title: `Tải Phần Mềm ${primaryKeywordInput} Dễ Dùng Nhất - ${productNameInput}`,
        metaDescription: `Review phần mềm hạch toán kinh doanh tự động ${primaryKeywordInput}. Giao diện việt hóa, bảo mật ngoại tuyến hoàn toàn trọn trọn đơn giản.`,
        h1: `Phần Mềm ${productNameInput} Tối Ưu Cho Việc ${primaryKeywordInput}`,
        slug: productNameInput.toLowerCase().replace(/\s+/g, '-')
      },
      hero: {
        headline: `Giải Quyết 90% Nghiệp Vụ Giấy Tờ Với Phần Mềm ${productNameInput}`,
        subheadline: `Cài đặt chạy tức thì ngay trên trình duyệt điện thoại và máy tính. Lưu trữ cục bộ bảo mật, thu hút tài lộc tức thời cho ${targetAudience.toLowerCase()}.`,
        ctaButton: `Trải Nghiệm Trực Tuyến Bản Free Ngay`,
        trustBadge: `🛡️ SQLite WASM Bảo Mật Tuyệt Đối & 1,600+ Hộ Kinh Doanh Đã Tin Dùng`
      },
      painSection: {
        heading: `Bạn Có Đang Mệt Mỏi Vì Những Sổ Sách Hỗn Độn?`,
        pains: [
          'Sổ chi tiêu ghi tay dễ rách nát, hay mất mát dữ liệu khách hàng nợ tiền.',
          'Phần mềm nước ngoài đắt đỏ, không thấu hiểu đồng tiền VNĐ và hóa đơn tài chính.',
          'Tốn 2 giờ đồng hồ mỗi tối ngồi mọ mẫm công thức Excel phức tạp dễ sai số.'
        ]
      },
      featuresSection: {
        heading: `Sức Mạnh Đột Phá Giúp Bạn Giải Trừ Gánh Nặng Kế Toán`,
        features: [
          { icon: '📊', title: 'Tự Động Xuất Báo Cáo', desc: 'Thao tác kéo thả file Excel ngân hàng ra ngay biểu đồ dòng tiền sắc nét trong 1 giây.' },
          { icon: '📲', title: 'Đối Soát Quét Mã MBBank', desc: 'Sắp xếp hóa đơn, kiểm tra mã tham chiếu đối chiếu tự động 0% sai lệch.' },
          { icon: '💾', title: 'Offline-First Siêu Độc', desc: 'Hoạt động hoàn chỉnh 100% khi mất mạng, không sợ rò rỉ hay sập server điện tử.' }
        ]
      },
      socialProof: {
        testimonials: [
          { name: 'Chị Mai (Quỳnh Mai Store)', role: 'Chủ shop bán sỉ quần áo tại Chợ An Đông', quote: 'Lúc đầu tôi lo phần mềm phức tạp khó dùng, nhưng app này thiết kế tinh xảo mộc mạc lắm, xài 3 ngày là rành rẽ.' },
          { name: 'Anh Tuấn', role: 'Freelancer Kế Toán Thuế tại Hà Nội', quote: 'Tôi đang nhận làm sổ cho 10 hộ kinh doanh lẻ, có app đồng bộ đám mây này giúp tôi tiết kiệm 80% thời gian chạy hằng đêm.' }
        ]
      },
      pricingSection: {
        heading: `Mức Đầu Tư Hời Chỉ Bằng 1 Ly Cà Phê Hằng Tuần`,
        guarantee: `Cam kết hoàn tiền bản quyền tuyệt đối trong vòng 14 ngày nếu không làm bạn sung sướng rỡ ràng!`
      },
      faqSection: {
        questions: [
          { q: 'Phần mềm này hoạt động như thế nào?', a: 'Sử dụng công nghệ SQLite WebAssembly độc lập của LedgerFlow, phần mềm chạy gọn gàng trên trình duyệt Edge/Chrome của bạn mà không cần cài đặt nặng nề.' },
          { q: 'Dữ liệu tài chính của tôi có an toàn không?', a: 'Cực kỳ an tâm. Toàn bộ doanh số ghi nhận nằm trong thiết bị của bạn. Chỉ đồng bộ lên đám mây sịn sò khi bạn chủ động nhấn nút sync bảo mật.' }
        ]
      },
      footerCTA: `Bắt Đầu Đưa Công Việc Kinh Doanh Vào Quỹ Đạo Chuyên Nghiệp Ngay`,
      blogIdeas: [
        `Cách làm sổ sách hạch toán đơn giản nhất cho ${targetAudience.toLowerCase()} năm 2026`,
        `Tại sao bạn nên tránh dùng mẫu excel kế toán rườm rà dễ hỏng`,
        `Thủ tục đăng ký kinh doanh và liên thông hóa đơn VAT mới nhất`,
        `Review phần mềm hạch toán ${primaryKeywordInput} chạy offline bảo mật`,
        `Mẹo tiết kiệm 2 tiếng dọn dẹp số liệu sao kê ngân hàng cực nhanh`
      ]
    };
    setLandingDesign(mockLanding);
  };

  const handleExportMarkdown = () => {
    if (!landingDesign) return;

    const mdContent = `---
title: "${landingDesign.seo.title}"
description: "${landingDesign.seo.metaDescription}"
slug: "${landingDesign.seo.slug}"
layout: "landing_page_bootstrap"
---

# ${landingDesign.seo.h1}

## HERO SECTION
- **Tiêu đề gây bão**: ${landingDesign.hero.headline}
- **Mô tả chi tiết**: ${landingDesign.hero.subheadline}
- **CTA**: ${landingDesign.hero.ctaButton}
- **Minh chứng tin cậy**: ${landingDesign.hero.trustBadge}

---

## 🛑 NỖI ĐAU CỦA THỊ TRƯỜNG: ${landingDesign.painSection.heading}
${landingDesign.painSection.pains.map((p, i) => `${i+1}. ${p}`).join('\n')}

---

## ✨ GIẢI PHÁP TÍNH NĂNG ĐỘT PHÁ: ${landingDesign.featuresSection.heading}
${landingDesign.featuresSection.features.map(f => `### ${f.icon} ${f.title}\n${f.desc}`).join('\n\n')}

---

## 💬 KHÁCH HÀNG THỰC TẾ NÓI GÌ?
${landingDesign.socialProof.testimonials.map(t => `> "${t.quote}"\n> — **${t.name}** (${t.role})`).join('\n\n')}

---

## 💰 CHÍNH SÁCH ĐỊNH GIÁ & CAM KẾT: ${landingDesign.pricingSection.heading}
- **Giá trị gói tháng Pro**: ${calcPrice.toLocaleString('vi-VN')} VNĐ / tháng
- **Chính sách bảo hành**: ${landingDesign.pricingSection.guarantee}

---

## ❓ CÂU HỎI THƯỜNG GẶP (FAQ)
${landingDesign.faqSection.questions.map(q => `### Q: ${q.q}\nA: ${q.a}`).join('\n\n')}

---

## 📝 5 Ý TƯỞNG BÀI VIẾT BLOG VỆ TINH ĐỂ SEO LÊN TOP:
${landingDesign.blogIdeas.map((idea, i) => `${i+1}. Tên bài: "${idea}" (Tối ưu cho từ khóa: "${primaryKeywordInput}")`).join('\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${landingDesign.seo.slug}_landing_page.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTextSection = (text: string, indexKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionIndex(indexKey);
    setTimeout(() => setCopiedSectionIndex(null), 1500);
  };

  // ================= TAB 4: CALCULATOR LOGIC =================
  const getCalculatorData = () => {
    const monthlyVisitors = calcVolume * (calcCTR / 100);
    const newTrials = monthlyVisitors * (calcConv / 100);
    const churn = calcChurn / 100;
    
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    // Scenarios data building
    return months.map(m => {
      // Realistic Growth with cumulative users taking churn into consideration
      // cumulative_users_m = cumulative_users_m-1 * (1 - churn) + newTrials
      let realisticUsers = 0;
      let conservativeUsers = 0;
      let optimisticUsers = 0;
      
      const consCTR = calcCTR / 3;
      const consConv = calcConv / 2;
      const consTrials = (calcVolume * (consCTR / 100)) * (consConv / 100);
      
      const optCTR = calcCTR * 2.2;
      const optConv = calcConv * 1.5;
      const optTrials = (calcVolume * (optCTR / 100)) * (optConv / 100);

      for (let prev = 1; prev <= m; prev++) {
        realisticUsers = realisticUsers * (1 - churn) + newTrials;
        conservativeUsers = conservativeUsers * (1 - (churn + 0.02)) + consTrials;
        optimisticUsers = optimisticUsers * (1 - (churn - 0.015)) + optTrials;
      }

      // We align MRR computation
      return {
        month: `Tháng ${m}`,
        'Khách quan (Realistic)': Math.round(realisticUsers * calcPrice),
        'Thận trọng (Conservative)': Math.round(conservativeUsers * (calcPrice * 0.9)),
        'Tối ưu (Optimistic)': Math.round(optimisticUsers * (calcPrice * 1.15)),
        realisticUsers: Math.floor(realisticUsers),
        conservativeUsers: Math.floor(conservativeUsers),
        optimisticUsers: Math.floor(optimisticUsers)
      };
    });
  };

  const calcData = getCalculatorData();
  const realisticMonth12MRR = calcData[11]['Khách quan (Realistic)'];
  const realisticCumulativeUsers = calcData[11].realisticUsers;
  const CACCost = 30000; // Estimated 30.000 VNĐ to acquire one customer via SEO seeding
  const estimatedPaybackWeeks = Math.max(1, Math.round((CACCost * calcVolume * 0.05) / (realisticMonth12MRR || 1) * 4));

  return (
    <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 shadow-xl space-y-6">
      
      {/* HEADER SECTION WITH GRADIENT */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase font-mono">
              Phân Hệ Tăng Trưởng
            </div>
            <span className="text-[11px] text-slate-500 font-bold font-mono">GOOGLE CORE-SEO v1.0</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            Chiến Lược Sổ Sách &amp; Bán SaaS Qua Từ Khóa Google
          </h2>
          <p className="text-slate-400 text-xs font-semibold">
            Đi tắt đón đầu lưu lượng truy vấn tự nhiên, may đo giải pháp phù hợp sát sườn từ khóa hái ra tiền 0đ.
          </p>
        </div>
      </div>

      {/* INTERNAL FOUR NAVIGATION TABS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-900">
        <button
          onClick={() => setActiveTab('discovery')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'discovery' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10' 
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>1. Nghiên Cứu Từ Khóa</span>
        </button>

        <button
          onClick={() => setActiveTab('mapper')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'mapper' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10' 
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>2. Ánh Xạ Sản Phẩm</span>
        </button>

        <button
          onClick={() => setActiveTab('landing')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'landing' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10' 
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>3. Sinh Landing Page</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'calculator' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10' 
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>4. Máy Tính Doanh Thu</span>
        </button>
      </div>

      {/* ======================= TAB 1 DETAILED SCREEN ======================= */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          <div className="bg-[#070b13]/80 p-5 rounded-2xl border border-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono uppercase">
              <Sparkles className="w-4 h-4 animate-slow" />
              <span>Cấu hình nghiên cứu phễu tích hợp từ khóa Google</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1">CHỦ ĐỀ/NGÀNH NGHỀ MỤC TIÊU</label>
                <input
                  type="text"
                  value={nicheInput}
                  onChange={(e) => setNicheInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-500 placeholder-slate-600"
                  placeholder="Ví dụ: quản lý kho, hạch toán xây dựng..."
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1 font-mono">ĐỐI TƯỢNG BAN ĐẦU</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="Hộ kinh doanh">Hộ Kinh Doanh Việt Nam (Mới)</option>
                  <option value="SME/Công ty nhỏ">Công Ty SME Vừa &amp; Nhỏ</option>
                  <option value="Freelancer chuyên nghiệp">Freelancer &amp; Kế Toán Tự Do</option>
                  <option value="Startup bootstrap">Indie App &amp; Startup Bootstrap</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 font-mono font-bold">GIÁ PHẦN MỀM THÁNG TARGET</label>
                  <span className="text-[11px] text-amber-400 font-bold font-mono">{budgetTarget.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <input
                  type="range"
                  min="35000"
                  max="500000"
                  step="5000"
                  value={budgetTarget}
                  onChange={(e) => setBudgetTarget(Number(e.target.value))}
                  className="w-full accent-purple-500 h-1 rounded bg-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleKeywordDiscovery}
                disabled={loadingDiscovery}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loadingDiscovery ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang cào &amp; phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Quét Google SEO &amp; Khám Phá</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DISCOVERY KEYWORD RESULTS AREA */}
          {discoveredKeywords.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/65 p-3 rounded-xl border border-slate-900">
                <div className="flex items-center gap-2 flex-1 w-full min-w-0">
                  <Search className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Lọc nhanh từ khóa phát hiện..."
                    className="bg-transparent text-xs text-slate-100 placeholder-slate-650 outline-none w-full font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <span className="text-[10px] text-slate-550 font-bold uppercase font-mono">Sắp xếp:</span>
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-900 gap-1">
                    {[
                      { id: 'score', label: 'Điểm Khả thi' },
                      { id: 'vol', label: 'Lưu lượng' },
                      { id: 'keyword', label: 'Từ khóa A-Z' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSortField(opt.id as any)}
                        className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer ${
                          sortField === opt.id ? 'bg-slate-900 text-purple-400' : 'text-slate-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExportExcel}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-bold text-[10.5px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Xuất Excel</span>
                  </button>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/20 shadow-lg">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#070b13] text-[9.5px] text-slate-500 uppercase font-mono border-b border-slate-900">
                    <tr>
                      <th className="py-3 px-4"></th>
                      <th className="py-3 px-4">Từ khóa tìm kiếm (Google)</th>
                      <th className="py-3 px-4 text-center">Volume/Tháng</th>
                      <th className="py-3 px-4 text-center">Cạnh tranh</th>
                      <th className="py-3 px-4 text-center">Y&nbsp;Định</th>
                      <th className="py-3 px-4">Giải Pháp Micro-SaaS Lập Trình 0đ</th>
                      <th className="py-3 px-4 text-center">Điểm Du Kích</th>
                      <th className="py-3 px-4 text-right">Lựa chọn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {getSortedAndFilteredKeywords().map((item, index) => {
                      const isSelected = selectedKeywords.includes(item.keyword);
                      return (
                        <tr 
                          key={index} 
                          className={`hover:bg-slate-900/30 transition-colors ${
                            isSelected ? 'bg-purple-950/10 border-l-2 border-l-purple-500' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleKeyword(item.keyword)}
                              className="accent-purple-500 cursor-pointer rounded"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white max-w-[200px]">
                            <div className="space-y-1">
                              <span className="block truncate" title={item.keyword}>{item.keyword}</span>
                              <div className="flex gap-1 flex-wrap">
                                {item.longtailVariants?.slice(0, 2).map((v, vidx) => (
                                  <span key={vidx} className="bg-slate-950 text-slate-500 text-[8.5px] px-1.5 py-0.5 rounded border border-slate-900 font-mono">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span className="text-slate-250 block">{(item.searchVolumeNum || 1000).toLocaleString('vi-VN')}</span>
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded inline-block mt-1 ${
                              item.searchVolume === 'high' ? 'bg-red-950/20 text-rose-455 border border-rose-900/30' :
                              item.searchVolume === 'medium' ? 'bg-amber-950/20 text-amber-455 border border-amber-900/30' :
                              'bg-indigo-950/20 text-indigo-405 border border-indigo-900/30'
                            }`}>
                              {item.searchVolume}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${
                              item.competition === 'high' ? 'bg-rose-950/20 text-rose-500' :
                              item.competition === 'medium' ? 'bg-amber-950/25 text-amber-500' :
                              'bg-emerald-950/20 text-emerald-400'
                            }`}>
                              {item.competition === 'high' ? '🟢 Cao' : item.competition === 'medium' ? '🟡 Trung bình' : '🟢 Thấp'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                              item.intent === 'transactional' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40' :
                              item.intent === 'commercial' ? 'bg-purple-950/30 text-purple-400 border border-purple-900/40' :
                              'bg-slate-950 text-slate-400 border border-slate-900'
                            }`}>
                              {item.intent}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 space-y-1.5">
                            <p className="font-bold text-slate-100 leading-tight block">{item.softwareIdea}</p>
                            <p className="text-[10.5px] text-slate-450 italic leading-snug">
                              💸 <strong className="text-slate-350">Monetize:</strong> {item.monetization}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-snug">
                              💔 <strong className="text-slate-450">Nỗi đau:</strong> {item.painPoint}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-black">
                            <span className={`text-base block ${
                              item.guerrillaScore >= 9.0 ? 'text-emerald-400' :
                              item.guerrillaScore >= 8.0 ? 'text-purple-400' :
                              'text-amber-400'
                            }`}>
                              {item.guerrillaScore}
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block mt-0.5">Khả thi</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleToggleKeyword(item.keyword)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all border ${
                                isSelected 
                                  ? 'bg-purple-600 border-purple-500 text-white shadow-md' 
                                  : 'bg-slate-950 hover:bg-slate-900 border-slate-900 hover:border-slate-800 text-slate-400'
                              }`}
                            >
                              {isSelected ? 'Đã Chọn' : 'Chọn Gõ'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ACTION BOTTOM ROW */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/30 p-4 rounded-xl border border-slate-900">
                <span className="text-[11px] text-slate-400 font-semibold italic text-center md:text-left">
                  💡 Hệ thống phát hiện <strong className="text-purple-400">{selectedKeywords.length} từ khóa</strong> được chọn. Nhấn Nút "Chuyển Sang Bước 2" để chuyển đổi số và may đo sản phẩm micro-SaaS tương thích.
                </span>
                
                <button
                  disabled={selectedKeywords.length === 0}
                  onClick={() => {
                    setActiveTab('mapper');
                    handleProductMapping();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
                >
                  <span>Chuyển Thiết kế Sản phẩm</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/5 p-12 rounded-2xl border border-slate-900/60 text-center space-y-4">
              <Search className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400">Chưa bắt đầu cào từ khóa nào</p>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  Vui lòng chọn hoặc tự nhập từ khóa lĩnh vực ngách của bạn ở ô trên, chọn phân khúc Target và click "Quét Google SEO" để triệu hồi 15 ngách hái tiền du kích.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: PRODUCT MAPPER DETAIL ======================= */}
      {activeTab === 'mapper' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CONFIGURATION LIST / SELECTED LABELS */}
          <div className="bg-[#070b13]/85 p-5 rounded-2xl border border-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
              <Zap className="w-4 h-4 fill-emerald-500/10" />
              <span>Thùng chứa từ khóa của bạn để liên kết sản phẩm</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 p-3 bg-slate-950 rounded-xl border border-slate-1000 min-h-[45px]">
                {selectedKeywords.length > 0 ? (
                  selectedKeywords.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 bg-purple-950/30 text-purple-400 border border-purple-900/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button 
                        onClick={() => handleToggleKeyword(tag)}
                        className="text-purple-500 hover:text-rose-400 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-650 text-xs italic font-medium p-1">
                    Cảnh báo rỗng: Vui lòng quay lại Tab 1 để chọn từ khóa chính.
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                onClick={() => setActiveTab('discovery')}
                className="text-xs text-purple-400 font-bold hover:underline"
              >
                &lsaquo; Quay lại thêm từ khóa khác
              </button>

              <button
                onClick={handleProductMapping}
                disabled={loadingMapper}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loadingMapper ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Cổng phân tích thiết kế...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-slate-950" />
                    <span>Thiết Kế Sản Phẩm Tối Giản</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* BLUEPRINT RESULT DISPLAY */}
          {blueprintResult ? (
            <div className="space-y-6">
              
              {/* COMPACT MINI BANNER */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-950 border border-purple-900/40 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute right-6 top-6 opacity-5 pointer-events-none">
                  <Zap className="w-32 h-32 text-purple-400" />
                </div>
                <div className="space-y-1.5 relative z-10 select-text">
                  <span className="bg-amber-400 text-slate-950 text-[9px] px-2 py-0.5 rounded-full font-black uppercase font-mono tracking-widest inline-block">
                    Micro-SaaS Blueprint
                  </span>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    🚀 {blueprintResult.productName}
                  </h3>
                  <p className="text-purple-400 font-bold text-xs italic">
                    &ldquo; {blueprintResult.tagline} &rdquo;
                  </p>
                </div>
              </div>

              {/* BENTO GRID SPECIFICATION CARDS */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* CARD 1: TÍNH NĂNG MVP CỐT LÕI */}
                <div className="bg-[#070b13]/85 p-5.5 rounded-xl border border-slate-900 space-y-4">
                  <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono block border-b border-slate-900 pb-2">
                    🛠️ Tính năng cốt lõi (Làm trong 3 ngày)
                  </span>
                  <div className="space-y-4">
                    {blueprintResult.coreFeatures.map((feat, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">{idx+1}</span>
                        <p className="text-slate-300 text-xs font-semibold leading-relaxed">{feat}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARD 2: STACK CÔNG NGHỆ 0Đ PHÍ DUY TRÌ */}
                <div className="bg-[#070b13]/85 p-5.5 rounded-xl border border-slate-900 space-y-4">
                  <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono block border-b border-slate-900 pb-2">
                    💻 Stack 0đ &amp; Hạ Tầng Biên
                  </span>
                  <div className="space-y-3.5 text-xs text-slate-350">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono text-[9px] block">UI FRONTEND RÚT GỌN</span>
                      <p className="font-bold text-white text-xs">{blueprintResult.techStack.frontend}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono text-[9px] block">BACKEND &amp; LOCAL STORAGE</span>
                      <p className="font-bold text-purple-400 text-xs">{blueprintResult.techStack.backend}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono text-[9px] block">MÁY CHỦ HOSTING</span>
                      <p className="font-bold text-emerald-400 text-xs">{blueprintResult.techStack.deployment}</p>
                    </div>
                  </div>
                </div>

                {/* CARD 3: SEO METADATA & PHỄU CHUYỂN ĐỔI */}
                <div className="bg-[#070b13]/85 p-5.5 rounded-xl border border-slate-900 space-y-4">
                  <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono block border-b border-slate-900 pb-2">
                    🎯 Kế Hoạch Bản Đồ SEO &amp; Từ Khóa
                  </span>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono text-[9px] block">TỪ KHÓA ĐẦU PHỄU</span>
                      <p className="font-bold text-amber-400 bg-amber-950/10 px-2 py-1 rounded inline-block text-[11px] font-mono border border-amber-900/20">
                        #{blueprintResult.keywordMapping.primaryKeyword}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono text-[9px] block">SEO H1 HEADING</span>
                      <p className="font-bold text-slate-300 leading-snug">{blueprintResult.keywordMapping.landingPageTitle}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono text-[9px] block">META DESCRIPTION (CTR BOOST)</span>
                      <p className="text-slate-400 leading-snug text-[10.5px] italic">&ldquo; {blueprintResult.keywordMapping.metaDescription} &rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLE: PRICING TIERS CO-MAPPED */}
              <div className="bg-[#070b13]/85 p-5.5 rounded-2xl border border-slate-900 space-y-4">
                <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono block border-b border-slate-900 pb-2">
                  💳 Gói Định Giá Bán Lẻ Thu Hẹp Cho SME Việt
                </span>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {blueprintResult.pricingTiers.map((tier, tidx) => (
                    <div key={tidx} className="bg-slate-950/80 p-4.5 rounded-xl border border-slate-900 space-y-3 last:border-purple-900/50">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-extrabold uppercase text-slate-400">{tier.name}</span>
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[8.5px] rounded border border-purple-500/20 font-bold uppercase">GÓI {tidx+1}</span>
                      </div>
                      <div className="py-2">
                        <span className="text-2xl font-black text-white">{tier.price.toLocaleString('vi-VN')}</span>
                        <span className="text-[10px] text-slate-500 font-semibold ml-1">đ {tidx === 0 ? '' : tidx === 2 ? '/Năm' : '/Tháng'}</span>
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-slate-900 text-xs">
                        {tier.features.map((f, fidx) => (
                          <div key={fidx} className="flex gap-2 items-center text-slate-400">
                            <span className="text-emerald-500 text-base leading-none">&bull;</span>
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: ACQUISITION & GROWTH MRR PROJECTIONS */}
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Left Area: Growth Hacking channels */}
                <div className="lg:col-span-5 bg-[#070b13]/85 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono block border-b border-slate-900 pb-2">
                    🚀 Tác Chiến Ngày Đầu Tiên (Distribution Plan)
                  </span>
                  
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                      <span className="text-emerald-400 font-bold block mb-1">KÊNH CHIẾN HỮU 0Đ</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 font-medium">
                        {blueprintResult.distributionChannels.map((ch, idx) => (
                          <li key={idx}>{ch}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-1">
                      <span className="text-amber-400 font-bold block">KẾ HOẠCH NGÀY ĐẦU TIÊN (DAY 1)</span>
                      <p className="text-slate-400 font-medium leading-relaxed">{blueprintResult.day1LaunchPlan}</p>
                    </div>

                    <div className="bg-purple-950/10 p-3 rounded-lg border border-purple-900/25 space-y-1">
                      <span className="text-purple-400 font-bold block">GUERRILLA HACKS (3 MẸO BỨT PHÁ)</span>
                      <ol className="list-decimal pl-4 text-slate-400 space-y-1 font-medium">
                        {blueprintResult.guerrillaHacks.map((hack, idx) => (
                          <li key={idx} className="leading-snug">{hack}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Right Area: Chart Recharts MRR Targets */}
                <div className="lg:col-span-7 bg-[#070b13]/85 p-5 rounded-2xl border border-slate-900 space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono block border-b border-slate-900 pb-2">
                      📈 Mục Tiêu Doanh Thu MRR 12 Tháng Đầu Phễu
                    </span>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Số liệu dự báo tăng trưởng MRR (Doanh thu đều hàng tháng) dựa trên tối ưu hóa SEO tự nhiên.
                    </p>
                  </div>

                  <div className="h-[180px] w-full pt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { name: 'Tháng 1', mrr: 0 },
                          { name: 'Tháng 3', mrr: blueprintResult.mrrTarget.month3 },
                          { name: 'Tháng 6', mrr: blueprintResult.mrrTarget.month6 },
                          { name: 'Tháng 12', mrr: blueprintResult.mrrTarget.month12 }
                        ]}
                        margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="mrrTargetGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                        <XAxis dataKey="name" stroke="#475569" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                        <YAxis stroke="#475569" tickFormatter={(val) => `${val/1000000}M`} style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }}
                          formatter={(value) => [`${Number(value).toLocaleString('vi-VN')} đ`, 'Mục tiêu MRR']}
                        />
                        <Area type="monotone" dataKey="mrr" stroke="#a78bfa" strokeWidth={2.5} fillOpacity={1} fill="url(#mrrTargetGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-900 text-xs">
                    <div>
                      <span className="text-slate-500 text-[9px] block">MỤC TIÊU M3</span>
                      <span className="font-extrabold text-slate-200">{blueprintResult.mrrTarget.month3.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block">MỤC TIÊU M6</span>
                      <span className="font-extrabold text-purple-400">{blueprintResult.mrrTarget.month6.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block">MỤC TIÊU M12</span>
                      <span className="font-extrabold text-emerald-400">{blueprintResult.mrrTarget.month12.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* ACTIONS CONTROL GROUP */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-900">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-350">Có 2 lựa chọn tích hợp tiếp theo dành cho Solo Founder:</p>
                  <p className="text-[10.5px] text-slate-500 italic">May đo trang đích SEO Ready bóc tách trực tuyến HOẶC Đưa trực tiếp vào Phân Hệ Quản lý để lập lịch.</p>
                </div>

                <div className="flex gap-2 flex-wrap w-full sm:w-auto justify-end">
                  <button
                    onClick={handleSaveToGuerrillaHub}
                    disabled={savedToHub}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-purple-450 hover:text-purple-400 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>{savedToHub ? 'Đã liên kết Guerrilla Hub' : 'Đưa vào Guerrilla Hub'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('landing');
                      handleGenerateLandingPage();
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-505 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
                  >
                    <span>Tạo Landing Page SEO</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-950/5 p-12 rounded-2xl border border-slate-900/60 text-center space-y-4">
              <Zap className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400">Chưa sinh bản thiết kế sản phẩm súc tích</p>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  Hãy nhấn nút "Khởi Tạo Thiết Kế Sản Phẩm" sau khi đã tích lũy các từ khóa vàng ở Tab 1 để liên kết hạch toán.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: LANDING PAGE GENERATOR SCREEN ======================= */}
      {activeTab === 'landing' && (
        <div className="space-y-6">
          
          {/* CONTROL PRE-SET INPUT FIELDS */}
          <div className="bg-[#070b13]/85 p-5 rounded-2xl border border-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase font-mono">
              <FileText className="w-4 h-4" />
              <span>Cấu hình nội dung tối ưu SEO Copywriting</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1">TÊN SẢN PHẨM PHẦN MỀM</label>
                <input
                  type="text"
                  value={productNameInput}
                  onChange={(e) => setProductNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none"
                  placeholder="LedgerFlow Auto-Ledger"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1 font-mono">TỪ KHÓA CHÍNH (PRIMARY SEO KEYWORD)</label>
                <input
                  type="text"
                  value={primaryKeywordInput}
                  onChange={(e) => setPrimaryKeywordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-bold text-amber-200 focus:outline-none focus:border-amber-500"
                  placeholder="phần mềm kế toán hộ kinh doanh tốt nhất"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={handleGenerateLandingPage}
                disabled={loadingLanding}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {loadingLanding ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>AI Đang Soạn Landing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Sinh Nội Dung SEO Landing</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SPLIT EXPERIMENTAL ROW DISPLAY */}
          {landingDesign ? (
            <div className="grid lg:grid-cols-12 gap-8 select-text">
              
              {/* LEFT COLUMN: INTERACTIVE VISUAL PREVIEW OF LANDING */}
              <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-900 container-fluid space-y-12">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">🖥️ BẢN PREVIEW TRANG ĐÍCH THỰC TẾ (Rendered View)</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8.5px] rounded border border-emerald-500/20 font-bold font-mono">SEO SAFE</span>
                </div>

                {/* Simulated landing header browser bar */}
                <div className="space-y-8 max-w-2xl mx-auto text-center py-6">
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20 font-bold tracking-wider inline-block">
                    {landingDesign.hero.trustBadge}
                  </span>
                  
                  <h1 className="text-3xl font-black text-white tracking-tight leading-tight md:text-4xl">
                    {landingDesign.hero.headline}
                  </h1>

                  <p className="text-slate-400 font-semibold text-sm leading-relaxed max-w-lg mx-auto">
                    {landingDesign.hero.subheadline}
                  </p>

                  <div className="p-1 inline-block bg-slate-900 rounded-xl">
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase rounded-lg shadow-lg">
                      {landingDesign.hero.ctaButton}
                    </button>
                  </div>
                </div>

                {/* Simulated Pain Point Section */}
                <div className="space-y-4 py-6 border-t border-slate-900">
                  <h3 className="text-lg font-bold text-center text-white">
                    {landingDesign.painSection.heading}
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {landingDesign.painSection.pains.map((pain, pidx) => (
                      <div key={pidx} className="bg-[#070b13] p-4 rounded-xl border border-rose-950/20 space-y-2">
                        <span className="text-rose-500 font-bold text-xs uppercase font-mono block">Nỗi đau {pidx+1}</span>
                        <p className="text-slate-400 text-[11px] font-semibold leading-relaxed">{pain}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Feature Section */}
                <div className="space-y-5 py-6 border-t border-slate-900">
                  <h3 className="text-lg font-bold text-center text-white">
                    {landingDesign.featuresSection.heading}
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {landingDesign.featuresSection.features.map((feat, fidx) => (
                      <div key={fidx} className="bg-[#070b13] p-4 rounded-xl border border-slate-900 space-y-2.5">
                        <span className="text-2xl block leading-none">{feat.icon || '✨'}</span>
                        <h4 className="font-bold text-white text-xs">{feat.title}</h4>
                        <p className="text-slate-400 text-[11.5px] font-medium leading-relaxed">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Professional Testimonial Section */}
                <div className="space-y-5 py-6 border-t border-slate-900">
                  <h3 className="text-sm uppercase tracking-wide text-slate-500 font-mono font-bold text-center">Người dùng thật nói gì?</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {landingDesign.socialProof.testimonials.map((t, idx) => (
                      <div key={idx} className="bg-[#070b13]/55 p-4 rounded-lg border border-slate-900 space-y-3 relative">
                        <span className="absolute top-1 left-2 text-slate-800 text-3xl font-black font-serif leading-none">&ldquo;</span>
                        <p className="text-slate-300 text-[11px] italic font-semibold leading-relaxed relative z-10">{t.quote}</p>
                        <div className="pt-2 border-t border-slate-900 text-[10.5px]">
                          <span className="font-black text-white block">{t.name}</span>
                          <span className="text-slate-500 font-semibold">{t.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="space-y-5 py-6 border-t border-slate-900">
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 font-mono font-bold text-center">Câu Hỏi Thường Gặp</h3>
                  <div className="space-y-3.5 max-w-xl mx-auto">
                    {landingDesign.faqSection.questions.map((faq, idx) => (
                      <div key={idx} className="bg-[#070b13]/40 p-3 rounded-lg space-y-1 text-xs">
                        <span className="font-extrabold text-white">Q: {faq.q}</span>
                        <span className="block text-slate-400 font-medium leading-relaxed pl-3 border-l border-purple-900/30">A: {faq.a}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer simple */}
                <div className="border-t border-slate-900 pt-5 text-center text-[10px] text-slate-600 font-bold">
                  <span>Trang đích tối ưu cho từ khóa &ldquo;{primaryKeywordInput}&rdquo;. Thăng hạng từ nhiên trên bảng vàng Google.</span>
                </div>
              </div>

              {/* RIGHT COLUMN: ACCORDION RAW COPYWRITING FOR EASIER COPY */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-550 font-black uppercase tracking-wider font-mono">📋 Khối nội dung chi tiết</span>
                    <button
                      onClick={handleExportMarkdown}
                      className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/80 text-purple-350 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải file Markdown .md</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-450">
                    Bản sao chép nhanh nội dung bóc tách chuẩn SEO để đưa vào website vệ tinh:
                  </p>
                </div>

                {/* ACCORDION GROUP CONTAINER */}
                <div className="bg-[#070b13]/70 rounded-2xl border border-slate-900 divide-y divide-slate-900 overflow-hidden">
                  
                  {/* Item 1: SEO Header Meta */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveAccordion(activeAccordion === 'seo' ? '' : 'seo')}
                      className="w-full text-left p-3.5 text-xs font-bold text-slate-350 flex justify-between items-center hover:bg-slate-900/20 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-purple-400" />
                        <span>1. Thẻ Meta SEO (Header tags)</span>
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeAccordion === 'seo' && (
                      <div className="p-3.5 bg-slate-950/80 space-y-3.5 text-xs border-t border-slate-900">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>TITLE BLOCK (GOOGLE CARD)</span>
                            <button onClick={() => handleCopyTextSection(landingDesign.seo.title, 'seo_title')} className="hover:text-purple-400 flex items-center gap-0.5">
                              {copiedSectionIndex === 'seo_title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>Copy</span>
                            </button>
                          </div>
                          <p className="p-2 bg-slate-950 border border-slate-900 rounded font-semibold text-white font-mono">{landingDesign.seo.title}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>META DESCRIPTION</span>
                            <button onClick={() => handleCopyTextSection(landingDesign.seo.metaDescription, 'seo_desc')} className="hover:text-purple-400 flex items-center gap-0.5">
                              {copiedSectionIndex === 'seo_desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>Copy</span>
                            </button>
                          </div>
                          <p className="p-2 bg-slate-950 border border-slate-900 rounded text-slate-400 leading-normal font-medium">{landingDesign.seo.metaDescription}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item 2: Hero headline */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveAccordion(activeAccordion === 'hero' ? '' : 'hero')}
                      className="w-full text-left p-3.5 text-xs font-bold text-slate-350 flex justify-between items-center hover:bg-slate-900/20 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>2. Headline / Mô tả Hero và nút CTA</span>
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeAccordion === 'hero' && (
                      <div className="p-3.5 bg-slate-950/80 space-y-3.5 text-xs border-t border-slate-900">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>TIÊU ĐỀ HEADING H1</span>
                            <button onClick={() => handleCopyTextSection(landingDesign.hero.headline, 'hero_head')} className="hover:text-purple-400 flex items-center gap-0.5">
                              {copiedSectionIndex === 'hero_head' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>Copy</span>
                            </button>
                          </div>
                          <p className="p-2 bg-slate-950 border border-slate-900 rounded font-black text-white">{landingDesign.hero.headline}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>LỢI ÍCH SUB-HEADLINE</span>
                            <button onClick={() => handleCopyTextSection(landingDesign.hero.subheadline, 'hero_sub')} className="hover:text-purple-400 flex items-center gap-0.5">
                              {copiedSectionIndex === 'hero_sub' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>Copy</span>
                            </button>
                          </div>
                          <p className="p-2 bg-slate-950 border border-slate-900 rounded text-slate-400 font-medium leading-relaxed">{landingDesign.hero.subheadline}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item 3: Pain Section */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveAccordion(activeAccordion === 'pain' ? '' : 'pain')}
                      className="w-full text-left p-3.5 text-xs font-bold text-slate-300 flex justify-between items-center hover:bg-slate-900/20 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                        <span>3. Lột tả nỗi đau người gõ phím</span>
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeAccordion === 'pain' && (
                      <div className="p-3.5 bg-slate-950/80 space-y-3 text-xs border-t border-slate-900 select-text">
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span>3 NỖI ĐAU SÁT SƯỜN</span>
                          <button onClick={() => handleCopyTextSection(landingDesign.painSection.pains.join('\n'), 'pain_text')} className="hover:text-purple-400 flex items-center gap-0.5">
                            {copiedSectionIndex === 'pain_text' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy All</span>
                          </button>
                        </div>
                        <div className="space-y-2 pt-1 font-semibold">
                          {landingDesign.painSection.pains.map((p, i) => (
                            <p key={i} className="p-2 bg-slate-950 border border-slate-900 rounded text-rose-400">{i+1}. {p}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item 4: FAQ Questions */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveAccordion(activeAccordion === 'faq' ? '' : 'faq')}
                      className="w-full text-left p-3.5 text-xs font-bold text-slate-300 flex justify-between items-center hover:bg-slate-900/20 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                        <span>4. Câu hỏi thường gặp FAQ &amp; Câu trả lời</span>
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeAccordion === 'faq' && (
                      <div className="p-3.5 bg-slate-950/80 space-y-3 text-xs border-t border-slate-900 select-text">
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span>MẬU THOẠI HỎI ĐÁP</span>
                          <button onClick={() => handleCopyTextSection(JSON.stringify(landingDesign.faqSection.questions, null, 2), 'faq_json')} className="hover:text-purple-400 flex items-center gap-0.5">
                            {copiedSectionIndex === 'faq_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy JSON</span>
                          </button>
                        </div>
                        <div className="space-y-3.5 pt-1">
                          {landingDesign.faqSection.questions.map((faq, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <span className="font-extrabold text-amber-400 block">Q: {faq.q}</span>
                              <span className="block p-2 bg-[#020617] rounded text-slate-400 font-medium leading-relaxed">A: {faq.a}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RELEVANT VỆ TINH BLOGS FOR SEO CAMPAIGN */}
                <div className="bg-[#070b13]/85 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono block border-b border-slate-900 pb-2">
                    📄 5 Ý Tưởng Bài Viết Blog Vệ Tinh Trực Chiến (SEO cluster)
                  </span>
                  
                  <div className="space-y-3 text-xs font-semibold leading-relaxed">
                    {landingDesign.blogIdeas.map((idea, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-slate-300">
                        <span className="w-5 h-5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-[10.5px] font-mono shrink-0 font-bold">{idx+1}</span>
                        <div>
                          <p className="font-bold text-white leading-normal">&ldquo; {idea} &rdquo;</p>
                          <span className="text-[10px] text-slate-500 italic font-medium block mt-1">Từ khóa nhúng: &ldquo;{primaryKeywordInput}&rdquo;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-slate-950/10 p-12 rounded-2xl border border-slate-900/60 text-center space-y-4">
              <FileText className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400">Chưa sinh nội dung trang đích SEO</p>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  Vui lòng chọn từ khóa đầu phễu và click "Sinh Nội Dung SEO Landing" để AI bóc tách bài đăng thuyết phục nhất hái ra tiền.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 4: CALCULATOR INTERACTIVE SCREEN ======================= */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          
          <div className="grid lg:grid-cols-12 gap-8 select-text">
            
            {/* Left Area: Inputs sliders */}
            <div className="lg:col-span-4 bg-[#070b13]/85 p-5.5 rounded-2xl border border-slate-900 space-y-5">
              <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono block border-b border-slate-900 pb-2">
                ⚙️ Chỉ Số Phễu Chuyển Đổi Thực Tế
              </span>

              <div className="space-y-4 text-xs font-semibold">
                
                {/* Traffic Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-bold block flex items-center gap-1">1. LƯU LƯỢNG GOOGLE TRAFFIC</span>
                    <span className="text-purple-400 font-extrabold font-mono">{calcVolume.toLocaleString('vi-VN')} / Tháng</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="100"
                    value={calcVolume}
                    onChange={(e) => setCalcVolume(Number(e.target.value))}
                    className="w-full accent-purple-500 h-1 rounded bg-slate-950 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 italic leading-snug font-medium block">
                    Ước tính tổng lưu lượng tìm kiếm hàng tháng cho mảng từ khóa đã chọn.
                  </span>
                </div>

                {/* Organic CTR */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-bold block flex items-center gap-1">2. TỶ LỆ CLICK ORGANIC (CTR)</span>
                    <span className="text-amber-400 font-extrabold font-mono">{calcCTR} % / Top #3</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={calcCTR}
                    onChange={(e) => setCalcCTR(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 rounded bg-slate-950 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 italic leading-snug font-medium block">
                    Khuyên dùng 3% đối với thứ hạng SEO cao trong trang 1 Google.
                  </span>
                </div>

                {/* Trial -> Paid Conversion */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-bold block flex items-center gap-1">3. TỶ LỆ DÙNG THỰC -&rsaquo; PRO</span>
                    <span className="text-emerald-400 font-extrabold font-mono">{calcConv} %</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={calcConv}
                    onChange={(e) => setCalcConv(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1 rounded bg-slate-950 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 italic leading-snug font-medium block">
                    Tỷ lệ người dùng thử đăng ký trả phí sau 14 ngày.
                  </span>
                </div>

                {/* Monthly fee pricing */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-bold block flex items-center gap-1">4. ĐỊNH GIÁ / THÁNG (VND)</span>
                    <span className="text-purple-400 font-extrabold font-mono">{calcPrice.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <input
                    type="range"
                    min="19000"
                    max="499000"
                    step="5000"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(Number(e.target.value))}
                    className="w-full accent-purple-500 h-1 rounded bg-slate-950 cursor-pointer"
                  />
                </div>

                {/* Churn rate */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-bold block flex items-center gap-1">5. TỶ LỆ HỦY GÓI (CHURN RATE)</span>
                    <span className="text-rose-500 font-extrabold font-mono">{calcChurn} % / Tháng</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={calcChurn}
                    onChange={(e) => setCalcChurn(Number(e.target.value))}
                    className="w-full accent-rose-500 h-1 rounded bg-slate-950 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right Area: KPI cards and multi-series Recharts projections line */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* CUMULATIVE KPI METRICS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#070b13]/85 p-4 rounded-xl border border-slate-900">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">REALISTIC Month 12 MRR</span>
                  <p className="text-xl font-black mt-1 mb-0.5 text-white">{realisticMonth12MRR.toLocaleString('vi-VN')} VNĐ</p>
                  <p className="text-[10px] text-slate-400 font-medium">Doanh thu đều đặn hàng tháng dự báo.</p>
                </div>

                <div className="bg-[#070b13]/85 p-4 rounded-xl border border-slate-900">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tổng Users Đạt Được</span>
                  <p className="text-xl font-black mt-1 mb-0.5 text-purple-400">{realisticCumulativeUsers.toLocaleString('vi-VN')} Khách</p>
                  <p className="text-[10px] text-slate-400 font-medium font-semibold">Tích lũy lũy kế sau 12 tháng hạch toán.</p>
                </div>

                <div className="bg-[#070b13]/85 p-4 rounded-xl border border-slate-900">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider font-mono">Payback Period (SEO)</span>
                  <p className="text-xl font-black mt-1 mb-0.5 text-emerald-400">~ {estimatedPaybackWeeks} Tuần</p>
                  <p className="text-[10px] text-slate-400 font-medium">Thời gian hòa vốn chi phí phân hữu du kích.</p>
                </div>
              </div>

              {/* AREA MULTI-SCENARIOS GRAPH */}
              <div className="bg-[#070b13]/85 p-5 rounded-2xl border border-slate-900 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono">📊 Phân tích 3 Kịch Bản Doanh Thu (Conservative vs Realistic vs Optimistic)</span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8.5px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold font-mono">MRR SPREAD</span>
                </div>

                <div className="h-[220px] w-full pt-2 select-text">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={calcData}
                      margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                      <XAxis dataKey="month" stroke="#475569" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                      <YAxis stroke="#475569" tickFormatter={(val) => `${val/1000000}M`} style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }}
                        formatter={(value) => [`${Number(value).toLocaleString('vi-VN')} đ`]}
                      />
                      <Legend style={{ fontSize: '10px' }} />
                      
                      <Area type="monotone" name="Conservative (Thận trọng)" dataKey="Thận trọng (Conservative)" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#consGrad)" />
                      <Area type="monotone" name="Realistic (Khách quan)" dataKey="Khách quan (Realistic)" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#realGrad)" />
                      <Area type="monotone" name="Optimistic (Tối ưu)" dataKey="Tối ưu (Optimistic)" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#optGrad)" strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 text-xs italic leading-relaxed text-slate-400 font-semibold text-center font-mono">
                  💡 Nhận xét: &ldquo; Với giá trị đầu phễu tự nhiên SEO an toàn, kể cả trong kịch bản thận trọng nhất, bạn vẫn có khả năng gieo mầm thành công hạch toán ròng đều lớn hơn <strong className="text-amber-400">{(calcData[11]['Thận trọng (Conservative)']).toLocaleString('vi-VN')}đ</strong> vào cuối kỳ hạn 1 năm mà không chịu bất cứ rủi ro tài chính nào.&rdquo;
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
