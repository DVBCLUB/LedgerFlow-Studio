import React, { useState, useMemo } from 'react';
import { Target, Sparkles, Check, HelpCircle, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

type ProductType = 'saas' | 'game' | 'academy';

interface MetricOption {
  id: string;
  label: string;
  why: string;
  danger: string;
  defaultVal: number;
  unit: string;
  formula: string;
}

const TEMPLATES: Record<ProductType, {
  title: string;
  desc: string;
  metrics: MetricOption[];
}> = {
  saas: {
    title: 'Phần mềm dịch vụ (SaaS)',
    desc: 'Tập trung vào giá trị lặp lại bền vững và sự tương tác thường xuyên.',
    metrics: [
      { id: 'mrr', label: 'Doanh thu lặp lại hàng tháng (MRR)', why: 'Đo lường trực tiếp sự phát triển quy mô tài chính lặp lại.', danger: 'Dễ bị nhiễu do tỷ lệ khách hàng hủy gói (churn rate) cao.', defaultVal: 50000000, unit: 'đ', formula: 'Tổng số KH active × Phí gói tháng' },
      { id: 'dau', label: 'Người dùng hoạt động hàng ngày (DAU)', why: 'Đo mức độ gắn kết thường xuyên của khách hàng với phần mềm.', danger: 'DAU tăng nhưng doanh thu chưa chắc tăng nếu tỷ lệ nâng cấp gói thấp.', defaultVal: 500, unit: 'users', formula: 'Lượng người dùng mở app ít nhất 1 lần/ngày' },
      { id: 'time_saved', label: 'Tổng số giờ tiết kiệm cho khách hàng', why: 'Đo lường giá trị thực tế khách hàng nhận được khi dùng tool.', danger: 'Rất khó đo lường chuẩn xác nếu không có sự hợp tác khảo sát.', defaultVal: 120, unit: 'giờ', formula: 'Lượt thao tác thành công × Số phút tiết kiệm được' }
    ]
  },
  game: {
    title: 'Game & Giáo dục tương tác',
    desc: 'Tập trung vào trải nghiệm giải trí, giữ chân và kích thích tương tác.',
    metrics: [
      { id: 'retention_d7', label: 'Tỷ lệ giữ chân ngày 7 (D7 Retention)', why: 'Chỉ số vàng chứng minh game đủ hay để người chơi quay lại.', danger: 'Có thể bị ảnh hưởng bởi chiến dịch thu hút ban đầu quá ồ ạt.', defaultVal: 35, unit: '%', formula: 'Số người chơi ngày thứ 7 / Số người tải ngày 1 × 100' },
      { id: 'avg_playtime', label: 'Thời gian chơi trung bình (Playtime/Session)', why: 'Đo lường chiều sâu và độ cuốn hút của màn chơi.', danger: 'Thời gian chơi dài chưa chắc mang lại doanh thu nếu không có ads/in-app purchase.', defaultVal: 25, unit: 'phút', formula: 'Tổng thời gian chơi / Số session chơi' },
      { id: 'daily_active_gamers', label: 'Daily Active Gamers', why: 'Đo độ lớn cộng đồng người chơi tích cực hàng ngày.', danger: 'Đốt nhiều chi phí CAC để kéo người chơi mới nhưng rớt rụng nhanh.', defaultVal: 1500, unit: 'người', formula: 'Số người chơi có ít nhất 1 lượt chơi/ngày' }
    ]
  },
  academy: {
    title: 'Học viện & Case Study Hub',
    desc: 'Tập trung vào kết quả học tập thực tế và sự lan tỏa kiến thức.',
    metrics: [
      { id: 'completion_rate', label: 'Tỷ lệ hoàn thành Case Study', why: 'Đo lường độ hữu ích của case học tập đối với người học.', danger: 'Người học có thể bấm hoàn thành nhanh mà chưa thực sự tiếp thu kiến thức.', defaultVal: 75, unit: '%', formula: 'Số học viên hoàn thành hết quiz / Tổng số học viên bắt đầu × 100' },
      { id: 'prompt_runs', label: 'Lượt chạy Prompt giả lập thành công', why: 'Đo mức độ thực hành và ứng dụng AI agent của học viên.', danger: 'Chạy nhiều nhưng không đúc rút được lý thuyết vận hành.', defaultVal: 2400, unit: 'lượt', formula: 'Tổng số request được gửi đến AI Gateway học tập' },
      { id: 'nps', label: 'Chỉ số đo lường sự hài lòng (NPS)', why: 'Chứng minh học viên sẵn sàng giới thiệu khóa học/lab cho người khác.', danger: 'Tập mẫu phản hồi quá nhỏ có thể gây sai lệch kết quả.', defaultVal: 8, unit: '/10', formula: '(Tỷ lệ người thích - Tỷ lệ người ghét)' }
    ]
  }
};

export default function NorthStarMetricBuilder() {
  const [productType, setProductType] = useState<ProductType>('saas');
  const [selectedMetricId, setSelectedMetricId] = useState<string>('mrr');
  const [customTarget, setCustomTarget] = useState<number>(100);

  const activeTemplate = TEMPLATES[productType];

  const activeMetric = useMemo(() => {
    return activeTemplate.metrics.find(m => m.id === selectedMetricId) || activeTemplate.metrics[0];
  }, [activeTemplate, selectedMetricId]);

  const handleTypeChange = (type: ProductType) => {
    setProductType(type);
    const defaultMetric = TEMPLATES[type].metrics[0];
    setSelectedMetricId(defaultMetric.id);
    setCustomTarget(defaultMetric.defaultVal);
  };

  const formattedVal = (val: number, unit: string) => {
    if (unit === 'đ') return `${new Intl.NumberFormat('vi-VN').format(val)}đ`;
    return `${val} ${unit}`;
  };

  return (
    <Card className="text-left">
      <div className="flex items-center gap-3 border-b border-border-primary pb-4 mb-5">
        <div className="p-2 bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary/25 rounded-xl">
          <Target className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">North Star Metric Builder</h3>
          <p className="text-[11px] text-text-secondary font-semibold leading-relaxed">Định vị và thiết lập chỉ số tối quan trọng để giữ tập trung, tránh phình tính năng vô nghĩa.</p>
        </div>
      </div>

      {/* Product Type Selector */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-bg-primary rounded-xl border border-border-secondary mb-5">
        {(Object.keys(TEMPLATES) as ProductType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
              productType === type
                ? 'bg-indigo-600 border-accent-tertiary text-text-primary shadow-md shadow-indigo-600/10'
                : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {type === 'saas' ? 'SaaS / Tool' : type === 'game' ? 'Game / Web App' : 'Academy / Hub'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Metric Options */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl bg-bg-surface p-4 border border-border-secondary/60 mb-2">
            <h4 className="text-xs font-bold text-text-primary">{activeTemplate.title}</h4>
            <p className="text-[11px] text-text-secondary mt-1 font-semibold">{activeTemplate.desc}</p>
          </div>

          <div className="space-y-3">
            {activeTemplate.metrics.map((metric) => {
              const isSelected = selectedMetricId === metric.id;
              return (
                <button
                  key={metric.id}
                  onClick={() => {
                    setSelectedMetricId(metric.id);
                    setCustomTarget(metric.defaultVal);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/20 border-accent-tertiary/80'
                      : 'bg-bg-primary border-border-secondary hover:bg-bg-surface text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-text-primary">{metric.label}</span>
                    {isSelected && (
                      <span className="p-0.5 rounded-full bg-accent-tertiary/20 border border-accent-tertiary/40 text-accent-tertiary">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-secondary mt-2 font-semibold leading-relaxed">
                    <strong className="text-text-primary">Lợi ích:</strong> {metric.why}
                  </p>
                  <p className="text-[10px] text-error mt-1 font-semibold leading-relaxed">
                    <strong className="text-error">Cạm bẫy:</strong> {metric.danger}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Custom target input & Output preview */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-bg-primary rounded-xl p-5 border border-border-secondary/80">
          <div className="space-y-4 text-left">
            <div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Chỉ số ngôi sao đang chọn</span>
              <h4 className="text-xs font-bold text-text-primary mt-1.5 leading-relaxed">{activeMetric.label}</h4>
            </div>

            <div>
              <label className="block">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Mục tiêu kỳ vọng (Target)</span>
                <input
                  type="number"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border-primary bg-bg-surface px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-indigo-400"
                />
              </label>
            </div>

            <div className="border-t border-border-primary pt-3">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Định nghĩa công thức tính</span>
              <code className="mt-1.5 block rounded-lg bg-black/40 p-3 text-[10px] font-bold text-indigo-300 leading-relaxed">
                {activeMetric.formula}
              </code>
            </div>

            <div className="rounded-xl border border-border-primary bg-bg-primary p-3 text-center">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Mục tiêu của bạn</span>
              <p className="text-xl font-bold text-accent-tertiary font-mono mt-1.5">
                {formattedVal(customTarget, activeMetric.unit)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-accent-tertiary/90 border border-accent-tertiary/10 bg-accent-tertiary/5 p-2 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 shrink-0 animate-bounce" />
            <span>Mỗi sản phẩm chỉ nên có duy nhất 1 North Star.</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
