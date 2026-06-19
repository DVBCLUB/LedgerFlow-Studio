import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PackageOpen,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import type { TabType } from '../../app/companyNavigation';

interface ERPCommandCenterProps {
  onNavigate: (tab: TabType) => void;
}

const priorities = [
  { title: 'Chốt phạm vi bản phát hành kế tiếp', owner: 'Product', due: 'Hôm nay', tone: 'amber' },
  { title: 'Theo dõi 3 khách hàng đang chờ demo', owner: 'Sales', due: 'Hôm nay', tone: 'cyan' },
  { title: 'Đối chiếu chi phí công cụ tháng này', owner: 'Finance', due: '20/06', tone: 'emerald' },
];

const productRows = [
  { name: 'LedgerFlow Hub', stage: 'Beta nội bộ', progress: 78, status: 'Đang phát triển' },
  { name: 'Kế toán đa ngành', stage: 'Thiết kế nghiệp vụ', progress: 54, status: 'Cần rà soát' },
  { name: 'AI Operations', stage: 'Thử nghiệm', progress: 42, status: 'Đang thử nghiệm' },
];

const pipeline = [
  { stage: 'Lead mới', count: 12, value: '180 triệu' },
  { stage: 'Đã hẹn demo', count: 5, value: '95 triệu' },
  { stage: 'Đang đề xuất', count: 3, value: '68 triệu' },
  { stage: 'Sắp chốt', count: 2, value: '42 triệu' },
];

export default function ERPCommandCenter({ onNavigate }: ERPCommandCenterProps) {
  return (
    <div className="erp-dashboard">
      <section className="erp-page-heading">
        <div>
          <p className="erp-eyebrow">Thứ sáu, 19 tháng 6</p>
          <h2>Chào buổi chiều, Founder</h2>
          <span>Những việc quan trọng nhất của công ty được gom tại đây.</span>
        </div>
        <button className="erp-primary-button" onClick={() => onNavigate('approval_workflow')}>
          <CheckCircle2 size={16} /> Xem việc cần duyệt
        </button>
      </section>

      <section className="erp-metric-grid" aria-label="Chỉ số điều hành">
        <article className="erp-metric">
          <div className="erp-metric__icon is-emerald"><CircleDollarSign size={18} /></div>
          <div><span>Doanh thu dự kiến tháng</span><strong>68,4 triệu</strong><small className="is-positive"><TrendingUp size={13} /> 12,5% so với tháng trước</small></div>
        </article>
        <article className="erp-metric">
          <div className="erp-metric__icon is-cyan"><UsersRound size={18} /></div>
          <div><span>Cơ hội đang theo dõi</span><strong>22</strong><small>5 lịch demo trong tuần</small></div>
        </article>
        <article className="erp-metric">
          <div className="erp-metric__icon is-violet"><PackageOpen size={18} /></div>
          <div><span>Sản phẩm đang hoạt động</span><strong>3</strong><small>1 bản phát hành cần chốt</small></div>
        </article>
        <article className="erp-metric">
          <div className="erp-metric__icon is-amber"><AlertCircle size={18} /></div>
          <div><span>Việc cần xử lý</span><strong>7</strong><small>2 việc quá hạn</small></div>
        </article>
      </section>

      <div className="erp-dashboard-grid">
        <section className="erp-panel erp-panel--wide">
          <header className="erp-panel__header">
            <div><h3>Ưu tiên hôm nay</h3><p>Tập trung vào công việc tạo tác động trực tiếp.</p></div>
            <button onClick={() => onNavigate('roadmap')}>Mở dự án <ArrowRight size={14} /></button>
          </header>
          <div className="erp-priority-list">
            {priorities.map((item) => (
              <article key={item.title}>
                <span className={`erp-priority-dot is-${item.tone}`} />
                <div><strong>{item.title}</strong><small>{item.owner}</small></div>
                <time><Clock3 size={13} /> {item.due}</time>
                <button aria-label={`Mở ${item.title}`}><ArrowRight size={15} /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="erp-panel">
          <header className="erp-panel__header"><div><h3>Lịch sắp tới</h3><p>Trong 48 giờ tiếp theo</p></div><CalendarDays size={18} /></header>
          <div className="erp-agenda">
            <article><time>16:30</time><div><strong>Rà soát bản phát hành</strong><small>Product Studio</small></div></article>
            <article><time>09:00</time><div><strong>Demo khách hàng An Phát</strong><small>Ngày mai · Sales</small></div></article>
            <article><time>14:00</time><div><strong>Đối chiếu dòng tiền</strong><small>Ngày mai · Finance</small></div></article>
          </div>
        </section>

        <section className="erp-panel erp-panel--wide">
          <header className="erp-panel__header">
            <div><h3>Danh mục sản phẩm</h3><p>Tiến độ theo bản phát hành gần nhất.</p></div>
            <button onClick={() => onNavigate('guerrilla')}>Product Studio <ArrowRight size={14} /></button>
          </header>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead><tr><th>Sản phẩm</th><th>Giai đoạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {productRows.map((row) => (
                  <tr key={row.name}>
                    <td><strong>{row.name}</strong></td><td>{row.stage}</td>
                    <td><div className="erp-progress"><span style={{ width: `${row.progress}%` }} /></div><small>{row.progress}%</small></td>
                    <td><span className="erp-table-status">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="erp-panel">
          <header className="erp-panel__header"><div><h3>Pipeline kinh doanh</h3><p>Giá trị cơ hội dự kiến</p></div><button onClick={() => onNavigate('outbound_hub')}>CRM <ArrowRight size={14} /></button></header>
          <div className="erp-pipeline">
            {pipeline.map((item) => <article key={item.stage}><div><strong>{item.stage}</strong><small>{item.count} cơ hội</small></div><b>{item.value}</b></article>)}
          </div>
        </section>
      </div>
    </div>
  );
}
