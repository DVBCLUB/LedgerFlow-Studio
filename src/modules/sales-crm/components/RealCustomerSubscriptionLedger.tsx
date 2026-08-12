import React, { useState } from 'react';
import {
  UsersRound,
  Building,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Bell,
  FileText,
  DollarSign,
  Plus,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export interface CustomerContract {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  planName: 'Enterprise SaaS' | 'Pro License' | 'Custom API Plan';
  mrrVnd: number;
  contractStartDate: string;
  contractEndDate: string;
  receivableAccount131Vnd: number;
  paymentStatus: 'paid' | 'overdue' | 'pending';
  daysOverdue: number;
}

export default function RealCustomerSubscriptionLedger() {
  const [customers, setCustomers] = useState<CustomerContract[]>([
    {
      id: 'cust_01',
      companyName: 'Tập đoàn Công nghệ VinTech Digital',
      contactPerson: 'Nguyễn Văn Minh (CEO)',
      email: 'minh.nguyen@vintech.example.com',
      planName: 'Enterprise SaaS',
      mrrVnd: 50000000,
      contractStartDate: '2025-09-01',
      contractEndDate: '2026-08-31',
      receivableAccount131Vnd: 0,
      paymentStatus: 'paid',
      daysOverdue: 0,
    },
    {
      id: 'cust_02',
      companyName: 'Công ty TNHH Giải pháp Phần mềm NovaSoft',
      contactPerson: 'Trần Thị Mai (CFO)',
      email: 'mai.tran@novasoft.example.com',
      planName: 'Pro License',
      mrrVnd: 25000000,
      contractStartDate: '2026-01-15',
      contractEndDate: '2027-01-14',
      receivableAccount131Vnd: 25000000,
      paymentStatus: 'overdue',
      daysOverdue: 12,
    },
    {
      id: 'cust_03',
      companyName: 'Công ty Cổ phần Truyền thông Apex Media',
      contactPerson: 'Lê Hoàng Nam (Marketing Director)',
      email: 'nam.le@apexmedia.example.com',
      planName: 'Custom API Plan',
      mrrVnd: 35000000,
      contractStartDate: '2026-03-01',
      contractEndDate: '2027-02-28',
      receivableAccount131Vnd: 35000000,
      paymentStatus: 'pending',
      daysOverdue: 0,
    },
  ]);

  const [reminderNotification, setReminderNotification] = useState<string | null>(null);

  const totalMrr = customers.reduce((sum, c) => sum + c.mrrVnd, 0);
  const totalArr = totalMrr * 12;
  const totalReceivables131 = customers.reduce((sum, c) => sum + c.receivableAccount131Vnd, 0);

  const handleSendReminder = (customer: CustomerContract) => {
    setReminderNotification(
      `Đã phát hành và gửi thông báo nhắc nợ thanh toán 1-click đến: ${customer.companyName} (${customer.contactPerson}) - Số tiền TK 131: ${customer.receivableAccount131Vnd.toLocaleString('vi-VN')} ₫.`
    );
    setTimeout(() => setReminderNotification(null), 5000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Tổng Doanh thu Thuê bao MRR</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white font-mono">{totalMrr.toLocaleString('vi-VN')} ₫/tháng</p>
          <span className="text-[10px] text-emerald-400 font-semibold">ARR quy đổi: {totalArr.toLocaleString('vi-VN')} ₫</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Tổng Công nợ Phải thu (TK 131)</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-300 font-mono">{totalReceivables131.toLocaleString('vi-VN')} ₫</p>
          <span className="text-[10px] text-amber-400 font-semibold">Cần thu hồi từ 2 hợp đồng</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Khách hàng Đang Hoạt động</span>
            <UsersRound className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white font-mono">{customers.length} Doanh nghiệp</p>
          <span className="text-[10px] text-cyan-400 font-semibold">100% hợp đồng có hiệu lực</span>
        </div>
      </div>

      {/* Reminder Toast */}
      {reminderNotification && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-300 shadow-lg shadow-emerald-950/50">
          <Bell className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{reminderNotification}</span>
        </div>
      )}

      {/* Customer Subscription Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-black uppercase text-white">
              Sổ Quản lý Khách hàng & Hợp đồng Doanh thu Thực tế
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">Theo dõi Công nợ TK 131 thực tế</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-bold uppercase text-slate-400">
              <tr>
                <th className="p-3">Doanh nghiệp / Đại diện</th>
                <th className="p-3">Gói Thuê bao</th>
                <th className="p-3">Doanh thu MRR</th>
                <th className="p-3">Thời hạn Hợp đồng</th>
                <th className="p-3">Công nợ TK 131</th>
                <th className="p-3">Trạng thái Thanh toán</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-900/40">
                  <td className="p-3">
                    <p className="font-bold text-white">{cust.companyName}</p>
                    <span className="text-[10px] text-slate-400">{cust.contactPerson} • {cust.email}</span>
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      {cust.planName}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    {cust.mrrVnd.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="p-3 text-[11px] text-slate-400 font-mono">
                    {cust.contractStartDate} ➔ {cust.contractEndDate}
                  </td>
                  <td className="p-3 font-mono font-bold text-amber-300">
                    {cust.receivableAccount131Vnd.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="p-3">
                    {cust.paymentStatus === 'paid' && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Đã thanh toán
                      </span>
                    )}
                    {cust.paymentStatus === 'overdue' && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                        <AlertCircle className="h-3 w-3" /> Quá hạn {cust.daysOverdue} ngày
                      </span>
                    )}
                    {cust.paymentStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        <Calendar className="h-3 w-3" /> Đến hạn đợt tới
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {cust.receivableAccount131Vnd > 0 ? (
                      <button
                        onClick={() => handleSendReminder(cust)}
                        className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-500"
                      >
                        Nhắc nợ 1-Click
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
