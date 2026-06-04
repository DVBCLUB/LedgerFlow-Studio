export interface StatItem {
  label: string;
  value: string;
  desc: string;
  color: string;
}

export const STATS: StatItem[] = [
  { label: "Quy mô DNNVV VN (SMEs)", value: "98%", desc: "DNNVV chiếm lĩnh thị trường", color: "text-blue-400" },
  { label: "Mức MRR Solo kỳ vọng", value: "35M - 120M+ VND", desc: "Từ 10 - 20 khách hàng duy trì", color: "text-emerald-400" },
  { label: "Biên lợi nhuận gộp", value: "70% - 90%", desc: "Mô hình sản phẩm hóa tối ưu", color: "text-purple-400" },
  { label: "Onboarding tối ưu", value: "< 10 ngày", desc: "Đưa giải pháp dữ liệu vào chạy thật", color: "text-amber-400" }
];
