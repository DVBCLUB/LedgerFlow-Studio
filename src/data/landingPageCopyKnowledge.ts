// Landing Page Copy Knowledge - LedgerFlow Studio marketing upgrade.

export interface CopyFormula {
  id: string;
  name: string;
  structure: string[];
  bestFor: string;
  viExample: string;
}

export const COPY_FORMULAS: CopyFormula[] = [
  {
    id: 'pas',
    name: 'PAS - Problem -> Agitate -> Solution',
    structure: ['Van de nguoi dung dang gap', 'Hau qua neu khong xu ly', 'Giai phap nho, ro, co the thu ngay'],
    bestFor: 'Hero section, email subject line, Facebook ad headline',
    viExample: 'Bao cao sep mat ca buoi sang? Moi thang ban dang ton 12+ gio gom Excel va Zalo. LedgerFlow gom du lieu, canh bao diem thieu va tao daily brief trong vai phut.',
  },
  {
    id: 'fab',
    name: 'FAB - Feature -> Advantage -> Benefit',
    structure: ['Tinh nang cu the', 'Loi the so voi cach cu', 'Loi ich thuc te cho nguoi dung'],
    bestFor: 'Feature section, pricing page, comparison table',
    viExample: 'Dashboard tam ung theo thoi gian thuc -> thay ngay ai dang giu bao nhieu -> founder va ke toan khong bi hoi don cuoi thang.',
  },
  {
    id: 'before_after',
    name: 'Before -> After -> Bridge',
    structure: ['Trang thai hien tai', 'Trang thai mong muon', 'Cay cau dua nguoi dung den ket qua'],
    bestFor: 'Hero section, testimonial framing, case study intro',
    viExample: 'Truoc: ho so, chi phi, lead va viec noi bo nam rai rac. Sau: moi sang co mot ban daily brief de quyet dinh. LedgerFlow la cau noi giua du lieu tho va hanh dong.',
  },
  {
    id: 'aida',
    name: 'AIDA - Attention -> Interest -> Desire -> Action',
    structure: ['Hook thu hut', 'Ly do khien ho tiep tuc doc', 'Ket qua ho muon dat', 'CTA ro rang'],
    bestFor: 'Full landing page, newsletter, long-form ad',
    viExample: 'Mot cong ty nho co the van hanh nhu mot team lon neu co he dieu hanh dung. Product, marketing, sales, finance va AI staff cung nam trong mot workspace. Mo demo offline-first trong 15 phut.',
  },
  {
    id: '4u',
    name: '4U - Useful, Urgent, Unique, Ultra-specific',
    structure: ['Huu ich', 'Cap thiet', 'Khac biet', 'Cu the bang so lieu/thoi gian/ket qua'],
    bestFor: 'Headline, push notification, CTA strip',
    viExample: 'Giam 9 gio/thang tong hop bao cao - daily brief thay 6 file roi rac - offline-first - bat dau bang du lieu mau trong 15 phut.',
  },
];

export interface HeroSection {
  id: string;
  template: string;
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  socialProof: string;
  targetPersona: string;
}

export const HERO_TEMPLATES: HeroSection[] = [
  {
    id: 'hero_operator',
    template: 'Operator / CEO Daily Brief',
    headline: 'Moi sang, nhin thay 5 viec can quyet dinh',
    subheadline: 'LedgerFlow gom san pham, marketing, sales, finance, ke toan, AI staff va sandbox vao mot Company OS nhe. Du lieu co the chay offline-first, nguoi duyet van la nguoi quyet dinh cuoi.',
    ctaPrimary: 'Mo demo Company OS',
    ctaSecondary: 'Xem daily brief mau',
    socialProof: 'Phu hop solo founder, team san pham nho va SME can van hanh gon.',
    targetPersona: 'Founder / operator / CEO cong ty phan mem nho',
  },
  {
    id: 'hero_accounting',
    template: 'Accounting product line',
    headline: 'Tu du lieu roi rac thanh brief ke toan ro rang',
    subheadline: 'Mo phong quy trinh TT200/133, VAT, ton kho, tam ung va ho so kiem soat. Khong thay the nguoi lam ke toan, chi giup chuan bi diem can kiem tra va hanh dong tiep theo.',
    ctaPrimary: 'Thu phong lab ke toan',
    ctaSecondary: 'Xem checklist SME',
    socialProof: 'Dung cho dich vu, thuong mai, san xuat va template xay dung khi can.',
    targetPersona: 'Ke toan truong, ke toan dich vu, business owner',
  },
  {
    id: 'hero_growth',
    template: 'Growth / Marketing-first',
    headline: 'Marketing co he thong, khong phai spam',
    subheadline: 'Tao landing copy, email sequence, battle card va PLG playbook tu du lieu tinh huong. AI chi soan thao qua gateway, founder duyet truoc khi gui.',
    ctaPrimary: 'Tao landing copy',
    ctaSecondary: 'Xem battle cards',
    socialProof: 'LocalStorage-first cho thu nghiem, de nang cap backend sau.',
    targetPersona: 'Growth operator / marketer / founder',
  },
];

export interface SocialProofTemplate {
  type: 'testimonial' | 'stat' | 'case_study' | 'logo';
  template: string;
  guidance: string;
}

export const SOCIAL_PROOF_TEMPLATES: SocialProofTemplate[] = [
  {
    type: 'testimonial',
    template: '"[Ket qua cu the] sau [thoi gian] dung LedgerFlow. Truoc day toi [van de]. Bay gio [cai thien]." - [Ten], [Vai tro], [Nganh]',
    guidance: 'Luon co ket qua do luong duoc. Tranh loi khen chung chung nhu "rat tot" hoac "tien loi".',
  },
  {
    type: 'stat',
    template: '[Con so]% [doi tuong] dat [ket qua] trong [thoi gian] dau su dung',
    guidance: 'Chi dung so lieu tu pilot, survey hoac du lieu that. Neu la mo phong, gan nhan ro la mo phong.',
  },
  {
    type: 'case_study',
    template: 'Cong ty [nganh], [quy mo] - Van de: [pain]. Giai phap: [workflow]. Ket qua: [metric thay doi].',
    guidance: 'Case study nen ngan, co truoc/sau, co screenshot hoac dashboard mau neu co.',
  },
  {
    type: 'logo',
    template: 'Trusted by [nhom khach hang/nganh] dang van hanh [quy trinh] moi tuan',
    guidance: 'Khong dung logo that neu chua duoc phep. Co the dung nhom nganh an danh.',
  },
];

export interface CTAVariant {
  id: string;
  text: string;
  context: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  riskReduction: string;
}

export const CTA_VARIANTS: CTAVariant[] = [
  { id: 'cta01', text: 'Mo demo offline-first - khong can the tin dung', context: 'Hero, pricing, demo entry', urgencyLevel: 'low', riskReduction: 'Khong cam ket, khong can upload du lieu nhay cam' },
  { id: 'cta02', text: 'Xem daily brief 3 phut voi du lieu mau', context: 'Warm traffic', urgencyLevel: 'low', riskReduction: 'Xem gia tri truoc khi cau hinh' },
  { id: 'cta03', text: 'Tai checklist van hanh Company OS', context: 'Top of funnel', urgencyLevel: 'low', riskReduction: 'Lead magnet khong rang buoc' },
  { id: 'cta04', text: 'Tao landing copy dau tien trong 15 phut', context: 'Marketing module', urgencyLevel: 'medium', riskReduction: 'Dung template co san, co the sua tay' },
  { id: 'cta05', text: 'Nhan bao cao mau cho nganh cua ban', context: 'Segmented landing page', urgencyLevel: 'medium', riskReduction: 'Gia tri ngay, khong can mua goi' },
  { id: 'cta06', text: 'Dat lich review pilot tuan nay', context: 'High-intent closing', urgencyLevel: 'high', riskReduction: 'Chi dung khi thuc su co slot review gioi han' },
];

export interface LandingPageSection {
  order: number;
  name: string;
  mustHave: string[];
  avoid: string;
}

export const LANDING_PAGE_SECTIONS: LandingPageSection[] = [
  { order: 1, name: 'Hero', mustHave: ['Headline ro pain', 'Subheadline noi ket qua', 'CTA chinh', 'Social proof nho'], avoid: 'Noi qua nhieu ve lich su cong ty truoc khi noi van de cua nguoi dung' },
  { order: 2, name: 'Problem', mustHave: ['3-5 pain points cu the', 'Ngon ngu cua khach hang', 'He qua neu khong xu ly'], avoid: 'Dung tu chuyen mon qua nhieu hoac dong khung mot nganh duy nhat' },
  { order: 3, name: 'Solution', mustHave: ['Feature -> benefit', 'Screenshot hoac mo phong', 'Toi da 3 diem noi bat'], avoid: 'Liet ke tinh nang ma khong noi ket qua' },
  { order: 4, name: 'Workflow', mustHave: ['Buoc 1-2-3', 'Ai duyet', 'Du lieu nam dau'], avoid: 'Hua tu dong hoa het ma khong co human approval' },
  { order: 5, name: 'Social Proof', mustHave: ['Quote hoac pilot stat', 'Vai tro nguoi dung', 'Ket qua do duoc'], avoid: 'Testimonial mo ho khong co ngu canh' },
  { order: 6, name: 'Pricing / Risk reversal', mustHave: ['Goi ro rang', 'Trial/demo', 'FAQ tien va du lieu'], avoid: 'An gia hoac bat goi dien khi offer don gian' },
  { order: 7, name: 'Final CTA', mustHave: ['Lap lai CTA chinh', 'Tom tat value prop', 'Giam rui ro'], avoid: 'Ket trang khong co hanh dong tiep theo' },
];

export const AI_COPY_PROMPT = (params: {
  section: string;
  formula: string;
  persona: string;
  mainPain: string;
  mainBenefit: string;
  tone: string;
}) => `Ban la copywriter B2B SaaS cho thi truong Viet Nam.

Viet copy cho section "${params.section}" cua landing page LedgerFlow Studio.

Context san pham:
- LedgerFlow la Company OS / Simulation Lab cho cong ty phan mem nho, SME va cac product line ke toan.
- Khong dong khung thanh ERP xay dung.
- Khong hua thay the ke toan chuyen nghiep, tu van phap ly hoac nguoi duyet cuoi.
- Neu co AI, AI chi soan thao/phan tich, con nguoi duyet truoc khi publish.

Formula ap dung: ${params.formula}
Persona: ${params.persona}
Pain chinh: ${params.mainPain}
Benefit chinh: ${params.mainBenefit}
Tone: ${params.tone}

Yeu cau:
- Tieng Viet tu nhien, khong dich may
- Tranh superlative khong co bang chung
- Neu dung so lieu, ghi ro la du lieu pilot hoac mo phong
- Output format:
  HEADLINE: [1 cau, toi da 12 tu]
  SUBHEADLINE: [2-3 cau]
  BODY: [3-5 cau hoac 3 bullet]
  CTA: [1 cau hanh dong]
  A/B VARIANT: [1 bien the khac]`;
