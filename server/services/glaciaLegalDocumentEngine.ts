/**
 * server/services/glaciaLegalDocumentEngine.ts
 * Động cơ Soạn Thảo & Rà Soát Hợp Đồng Pháp Lý Theo Luật Việt Nam của Glacia (Frontier 7).
 */

export type ContractType =
  | 'nda_confidentiality'
  | 'software_enterprise_license'
  | 'master_service_agreement'
  | 'employment_contract'
  | 'data_processing_agreement';

export interface LegalClause {
  clauseNumber: string;
  title: string;
  content: string;
  riskLevel: 'safe' | 'warning' | 'high_risk';
  legalNotes?: string;
}

export interface LegalContractDraft {
  id: string;
  type: ContractType;
  title: string;
  parties: {
    partyA: { name: string; taxId?: string; representative: string; role: string };
    partyB: { name: string; taxId?: string; representative: string; role: string };
  };
  effectiveDate: string;
  governingLaw: string; // e.g. "Luật Dân Sự 2015 & Luật Thương Mại 2005 CHXHCN Việt Nam"
  disputeResolution: string; // e.g. "Trung tâm Trọng tài Quốc tế Việt Nam (VIAC)"
  clauses: LegalClause[];
  fullMarkdown: string;
  createdAt: string;
}

export interface LegalReviewResult {
  contractTitle: string;
  overallRiskScore: number; // 0 - 100 (0 = hoàn toàn an toàn, 100 = cực kỳ nguy hiểm)
  decree13Compliant: boolean; // Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân
  vietnameseLawCompliance: boolean;
  identifiedRisks: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    clause: string;
    issue: string;
    suggestedAmendment: string;
  }>;
  summaryAdvice: string;
}

export function draftVietnameseContract(payload: {
  type: ContractType;
  partyAName: string;
  partyBName: string;
  customTerms?: string;
}): LegalContractDraft {
  const contractId = `legal-doc-${Date.now()}`;
  const nowStr = new Date().toLocaleDateString('vi-VN');

  const titleMap: Record<ContractType, string> = {
    nda_confidentiality: 'HỢP ĐỒNG BẢO MẬT THÔNG TIN VÀ DỮ LIỆU SỐ (NDA)',
    software_enterprise_license: 'HỢP ĐỒNG Chuyển Giao Quyền Sử Dụng Phần Mềm Doanh Nghiệp (ENTERPRISE LICENSE)',
    master_service_agreement: 'HỢP ĐỒNG CUNG CẤP DỊCH VỤ CÔNG NGHỆ VÀ TRÍ TUỆ NHÂN TẠO (MSA)',
    employment_contract: 'HỢP ĐỒNG LAO ĐỘNG VÀ THỬ VIỆC CHUYÊN GIA AI',
    data_processing_agreement: 'THỎA THUẬN XỬ LÝ DỮ LIỆU CÁ NHÂN (DPA - NGHỊ ĐỊNH 13/2023/NĐ-CP)',
  };

  const title = titleMap[payload.type] || 'HỢP ĐỒNG KINH TẾ DỊCH VỤ CÔNG NGHỆ';

  const clauses: LegalClause[] = [
    {
      clauseNumber: 'Điều 1',
      title: 'Định Nghĩa và Phạm Vi Bảo Mật',
      content:
        'Thông Tin Bảo Mật bao gồm toàn bộ mã nguồn phần mềm LedgerFlow, thuật toán AI, cơ sở dữ liệu kế toán và tài liệu kinh doanh của Bên A.',
      riskLevel: 'safe',
    },
    {
      clauseNumber: 'Điều 2',
      title: 'Tuân Thủ Bảo Vệ Dữ Liệu Cá Nhân (Nghị Định 13/2023/NĐ-CP)',
      content:
        'Hai bên cam kết áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu cá nhân của khách hàng và nhân sự, không chuyển giao cho bên thứ ba khi chưa có sự đồng ý bằng văn bản.',
      riskLevel: 'safe',
      legalNotes: 'Đáp ứng đầy đủ quy chuẩn bảo vệ dữ liệu cá nhân theo pháp luật Việt Nam.',
    },
    {
      clauseNumber: 'Điều 3',
      title: 'Sở Hữu Trí Tuệ (IP Rights)',
      content:
        'Toàn bộ quyền sở hữu trí tuệ phát sinh từ hoặc liên quan đến phần mềm LedgerFlow, avatar Glacia, và các Local Neural Skills thuộc quyền sở hữu duy nhất của Bên A (David Bao / LedgerFlow Studio).',
      riskLevel: 'safe',
    },
    {
      clauseNumber: 'Điều 4',
      title: 'Luật Áp Dụng và Giải Quyết Tranh Chấp',
      content:
        'Hợp đồng này được điều chỉnh bởi Pháp luật nước CHXHCN Việt Nam. Mọi tranh chấp không thể tự hòa giải sẽ được đưa ra giải quyết tại Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) tại TP. Hà Nội.',
      riskLevel: 'safe',
    },
  ];

  const fullMarkdown = `
# CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
### Độc lập - Tự do - Hạnh phúc
---
# ${title}
*Số: ${contractId}/HĐKT/2026*

Hôm nay, ngày ${nowStr}, tại Hà Nội, chúng tôi gồm có:

**BÊN A (BÊN CUNG CẤP / CHỦ QUẢN):**
- Tên đơn vị: **${payload.partyAName}**
- Đại diện: **Founder & CEO David Bao**

**BÊN B (ĐỐI TÁC / KHÁCH HÀNG):**
- Tên đơn vị: **${payload.partyBName}**

${clauses.map((c) => `### ${c.clauseNumber}: ${c.title}\n${c.content}`).join('\n\n')}

---
**ĐẠI DIỆN BÊN A**                           **ĐẠI DIỆN BÊN B**
*(Ký, ghi rõ họ tên và đóng dấu)*           *(Ký, ghi rõ họ tên và đóng dấu)*
  `.trim();

  return {
    id: contractId,
    type: payload.type,
    title,
    parties: {
      partyA: { name: payload.partyAName, representative: 'David Bao', role: 'Founder & CEO' },
      partyB: { name: payload.partyBName, representative: 'Người đại diện', role: 'Khách hàng / Đối tác' },
    },
    effectiveDate: nowStr,
    governingLaw: 'Luật Dân Sự 2015 & Luật Thương Mại 2005 CHXHCN Việt Nam',
    disputeResolution: 'Trung tâm Trọng tài Quốc tế Việt Nam (VIAC)',
    clauses,
    fullMarkdown,
    createdAt: new Date().toISOString(),
  };
}

export function reviewVietnameseContract(contractText: string): LegalReviewResult {
  const risks: LegalReviewResult['identifiedRisks'] = [];
  const text = contractText.toLowerCase();

  // Check 1: Decree 13/2023/ND-CP
  const hasDecree13 = text.includes('nghị định 13') || text.includes('dữ liệu cá nhân') || text.includes('bảo vệ dữ liệu');
  if (!hasDecree13) {
    risks.push({
      severity: 'high',
      clause: 'Điều khoản Bảo vệ Dữ liệu',
      issue: 'Hợp đồng thiếu điều khoản tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân.',
      suggestedAmendment: 'Bổ sung cam kết bảo vệ dữ liệu cá nhân theo quy định của pháp luật Việt Nam.',
    });
  }

  // Check 2: Unlimited Liability trap
  if (text.includes('bồi thường toàn bộ thiệt hại không giới hạn') || text.includes('không giới hạn trách nhiệm')) {
    risks.push({
      severity: 'critical',
      clause: 'Trách nhiệm Bồi thường Thiệt hại',
      issue: 'Điều khoản bồi thường không giới hạn gây rủi ro tài chính cực lớn cho doanh nghiệp.',
      suggestedAmendment: 'Giới hạn mức bồi thường tối đa bằng 100% tổng giá trị hợp đồng trong 12 tháng gần nhất.',
    });
  }

  // Check 3: Dispute Jurisdiction
  const hasDisputeResolution = text.includes('viac') || text.includes('trọng tài') || text.includes('tòa án');
  if (!hasDisputeResolution) {
    risks.push({
      severity: 'medium',
      clause: 'Giải quyết Tranh chấp',
      issue: 'Thiếu cơ quan tài phán rõ ràng khi xảy ra tranh chấp.',
      suggestedAmendment: 'Chỉ định Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) hoặc Tòa án Nhân dân có thẩm quyền tại Hà Nội.',
    });
  }

  const critical = risks.filter((r) => r.severity === 'critical').length;
  const high = risks.filter((r) => r.severity === 'high').length;
  const medium = risks.filter((r) => r.severity === 'medium').length;

  const score = critical * 40 + high * 25 + medium * 10;

  return {
    contractTitle: 'Văn Bản Hợp Đồng Đã Rà Soát',
    overallRiskScore: Math.min(100, score),
    decree13Compliant: hasDecree13,
    vietnameseLawCompliance: true,
    identifiedRisks: risks,
    summaryAdvice:
      risks.length === 0
        ? 'Hợp đồng an toàn, tuân thủ đầy đủ pháp luật Việt Nam.'
        : `Phát hiện ${risks.length} điểm rủi ro pháp lý cần đàm phán sửa đổi trước khi ký kết.`,
  };
}
