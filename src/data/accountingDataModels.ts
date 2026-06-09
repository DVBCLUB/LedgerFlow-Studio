/**
 * Accounting & Construction Data Models
 * Shared data structures for project cost tables, vendors, expenses, advances, settlements,
 * VAT invoices, inventory, fuel tracking, validation rules, reconciliation checks, KPIs
 */

// ============= ACCOUNTING & CONSTRUCTION DOMAIN ENTITIES =============

export interface ProjectCost {
  id: string;
  projectId: string;
  costType: 'Material' | 'Labor' | 'Equipment' | 'Transport' | 'Other';
  description: string;
  plannedAmount: number;      // VNĐ
  actualAmount: number;       // VNĐ
  variance: number;           // actualAmount - plannedAmount
  date: string;               // YYYY-MM-DD
  dueDate: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Reconciled';
}

export interface Vendor {
  id: string;
  name: string;
  taxId: string;              // Mã số thuế
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  bankAccount: string;
  bankName: string;
  totalPurchases: number;     // Tổng giá trị mua hàng
  status: 'Active' | 'Inactive' | 'Blacklist';
}

export interface Expense {
  id: string;
  projectId: string;
  vendorId: string;
  expenseType: 'Material' | 'Labor' | 'Service' | 'Equipment' | 'Advance' | 'Other';
  description: string;
  invoiceNo: string;          // Số hóa đơn
  invoiceDate: string;        // Ngày hóa đơn
  grossAmount: number;        // Số tiền chưa trừ thuế
  taxRate: number;            // Tỷ lệ thuế (%)
  taxAmount: number;          // Tiền thuế
  netAmount: number;          // Số tiền sau trừ thuế (grossAmount - taxAmount)
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Check' | 'Credit';
  documentStatus: 'Complete' | 'Incomplete' | 'Missing';
  reconciliationStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Discrepancy';
}

export interface Advance {
  id: string;
  projectId: string;
  vendorId: string;
  advanceAmount: number;      // VNĐ
  advanceDate: string;
  advanceReason: string;      // Lý do ứng trước
  settlementAmount: number;   // Số tiền thanh toán cuối cùng
  settlementDate: string | null;
  status: 'Active' | 'Settled' | 'Partial';
  remainingBalance: number;
}

export interface Settlement {
  id: string;
  projectId: string;
  vendorId: string;
  settlementNo: string;       // Số phiếu thanh toán
  settlementDate: string;
  relatedAdvances: string[];  // IDs of advances being settled
  invoices: string[];         // IDs of expense invoices
  totalInvoiceAmount: number;
  advanceAmount: number;
  deductAmount: number;       // Tiền khấu trừ (nếu có)
  netPayment: number;         // Tiền thanh toán thực tế
  paymentDate: string;
  reconciliationStatus: 'Pending' | 'Verified' | 'Approved' | 'Paid';
}

export interface VATInvoice {
  id: string;
  invoiceNo: string;          // Ký hiệu + số hóa đơn theo quy định Việt Nam
  invoiceDate: string;
  issuedDate: string;         // Ngày phát hành
  buyerTaxId: string;         // Mã số thuế người mua
  sellerTaxId: string;        // Mã số thuế người bán
  description: string;
  itemCount: number;
  subtotal: number;           // Tiền hàng chưa thuế
  vatRate: number;            // Tỷ lệ GTGT (%)
  vatAmount: number;          // Tiền thuế GTGT
  total: number;              // Tổng cộng tiền hàng + thuế
  serialNumber: string;       // Số seri hóa đơn
  recordingStatus: 'Recorded' | 'Not Recorded' | 'Adjusted';
  reconciliationStatus: 'Match' | 'Discrepancy' | 'Pending';
}

export interface InventoryItem {
  id: string;
  projectId: string;
  itemCode: string;
  itemName: string;
  category: 'Material' | 'Spare Part' | 'Tool' | 'Other';
  unit: string;               // Đơn vị (m, kg, cái, ...)
  openingQuantity: number;
  purchaseQuantity: number;
  usedQuantity: number;
  wasteQuantity: number;      // Hao hụt
  closingQuantity: number;
  unitCost: number;           // VNĐ/unit
  totalValue: number;         // closingQuantity * unitCost
  lastUpdated: string;
  storageLocation: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface FuelTracking {
  id: string;
  projectId: string;
  date: string;
  fuelType: 'Diesel' | 'Gasoline' | 'Electric' | 'LPG';
  quantityLiter: number;
  costPerLiter: number;
  totalCost: number;
  vehicleId: string;
  vehicleType: string;        // Loại xe
  mileageStart: number;
  mileageEnd: number;
  mileageDelta: number;
  fuelEfficiency: number;     // km/liter
  notes: string;
  approverName: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

export interface Employee {
  id: string;
  fullName: string;
  position: string;           // Chức danh
  department: string;         // Phòng ban
  baseSalary: number;         // VNĐ/tháng
  hireDate: string;
  taxIdNo: string;            // CMND/CCCD
  bankAccount: string;
  bankName: string;
  phone: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface Payroll {
  id: string;
  employeeId: string;
  payrollMonth: string;       // YYYY-MM
  baseSalary: number;
  allowances: number;         // Phụ cấp
  bonus: number;              // Thưởng
  grossSalary: number;        // Lương brutto
  taxInsurance: number;       // Bảo hiểm + thuế
  personalIncomeTax: number;
  netSalary: number;          // Lương thực nhận
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'Cash';
  status: 'Draft' | 'Approved' | 'Paid';
}

// ============= VALIDATION RULES =============

export interface ValidationRule {
  id: string;
  name: string;
  entityType: string;         // 'Expense' | 'Invoice' | 'Settlement' | 'Inventory' | 'Payroll'
  ruleLogic: string;          // Mô tả logic kiểm tra
  severity: 'Info' | 'Warning' | 'Error';
  autoCorrect: boolean;       // Có tự động sửa được không
}

export const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'vat_rate_valid',
    name: 'VAT Rate Valid',
    entityType: 'Expense',
    ruleLogic: 'taxRate must be 0, 5, 8, or 10 percent per Vietnam tax regulation',
    severity: 'Error',
    autoCorrect: true
  },
  {
    id: 'invoice_number_format',
    name: 'Invoice Number Format',
    entityType: 'VATInvoice',
    ruleLogic: 'invoiceNo must match pattern: PREFIX/YYYY/NNNNNN',
    severity: 'Error',
    autoCorrect: false
  },
  {
    id: 'gross_net_calculation',
    name: 'Gross to Net Calculation',
    entityType: 'Expense',
    ruleLogic: 'netAmount = grossAmount - (grossAmount * taxRate / 100)',
    severity: 'Error',
    autoCorrect: true
  },
  {
    id: 'settlement_coverage',
    name: 'Settlement Must Cover Invoices',
    entityType: 'Settlement',
    ruleLogic: 'sumOfInvoices + advanceAmount >= netPayment',
    severity: 'Warning',
    autoCorrect: false
  },
  {
    id: 'inventory_balance',
    name: 'Inventory Balance Check',
    entityType: 'InventoryItem',
    ruleLogic: 'closingQuantity = openingQuantity + purchaseQuantity - usedQuantity - wasteQuantity',
    severity: 'Error',
    autoCorrect: true
  },
  {
    id: 'fuel_efficiency_check',
    name: 'Fuel Efficiency Sanity Check',
    entityType: 'FuelTracking',
    ruleLogic: 'fuelEfficiency must be between 3 and 20 km/liter for typical vehicles',
    severity: 'Warning',
    autoCorrect: false
  },
  {
    id: 'payment_date_sequence',
    name: 'Payment Date Sequence',
    entityType: 'Expense',
    ruleLogic: 'paymentDate >= invoiceDate (not allowed to pay before invoice issued)',
    severity: 'Error',
    autoCorrect: false
  },
  {
    id: 'vendor_status_active',
    name: 'Vendor Status Active',
    entityType: 'Expense',
    ruleLogic: 'vendor.status must be Active to process new expenses',
    severity: 'Error',
    autoCorrect: false
  }
];

// ============= RECONCILIATION CHECKS =============

export interface ReconciliationCheck {
  id: string;
  name: string;
  checkType: 'Bank Reconciliation' | 'Inventory Reconciliation' | 'AP Reconciliation' | 'Revenue Reconciliation';
  description: string;
  expectedMatch: boolean;
  tolerance: number;          // Sai số cho phép (%)
}

export const RECONCILIATION_CHECKS: ReconciliationCheck[] = [
  {
    id: 'bank_recon',
    name: 'Bank Statement Reconciliation',
    checkType: 'Bank Reconciliation',
    description: 'Match bank statement with ledger transactions',
    expectedMatch: true,
    tolerance: 0
  },
  {
    id: 'ap_aging',
    name: 'Accounts Payable Aging',
    checkType: 'AP Reconciliation',
    description: 'Review supplier invoices past due over 30/60/90 days',
    expectedMatch: false,
    tolerance: 5
  },
  {
    id: 'inventory_count',
    name: 'Physical Inventory Count vs System',
    checkType: 'Inventory Reconciliation',
    description: 'Verify physical count matches system records',
    expectedMatch: true,
    tolerance: 2
  },
  {
    id: 'revenue_match',
    name: 'Revenue Recognition vs Delivery',
    checkType: 'Revenue Reconciliation',
    description: 'Ensure revenue recorded only when goods/services delivered',
    expectedMatch: true,
    tolerance: 0
  }
];

// ============= KPI FORMULAS =============

export interface KPIFormula {
  id: string;
  name: string;
  category: 'Cost Control' | 'Cash Flow' | 'Efficiency' | 'Compliance';
  formula: string;
  interpretation: string;
  targetRange: string;        // e.g. "0-5% variance is healthy"
}

export const KPI_FORMULAS: KPIFormula[] = [
  {
    id: 'cost_variance',
    name: 'Cost Variance %',
    category: 'Cost Control',
    formula: '(ActualCost - PlannedCost) / PlannedCost * 100',
    interpretation: 'Negative = under budget (good), Positive = over budget (needs attention)',
    targetRange: '-5% to +5%'
  },
  {
    id: 'advance_ratio',
    name: 'Advance to Total Purchase %',
    category: 'Cash Flow',
    formula: 'TotalAdvances / TotalPurchases * 100',
    interpretation: 'High ratio indicates significant upfront cash requirements',
    targetRange: '20-40% is typical'
  },
  {
    id: 'settlement_cycle',
    name: 'Settlement Cycle Days',
    category: 'Efficiency',
    formula: 'AVG(SettlementDate - InvoiceDate) in days',
    interpretation: 'Number of days between invoice and final payment',
    targetRange: '30-60 days'
  },
  {
    id: 'inventory_turnover',
    name: 'Inventory Turnover Rate',
    category: 'Efficiency',
    formula: 'TotalUsedQuantity / AverageInventoryQuantity',
    interpretation: 'How many times inventory is used/replaced in period',
    targetRange: 'Higher is better (depends on industry)'
  },
  {
    id: 'vat_collection',
    name: 'VAT Collection Efficiency %',
    category: 'Compliance',
    formula: 'RecordedVATInvoices / TotalInvoices * 100',
    interpretation: 'Percentage of invoices properly recorded in VAT system',
    targetRange: '98-100% (high compliance required)'
  },
  {
    id: 'fuel_cost_per_km',
    name: 'Fuel Cost per KM',
    category: 'Cost Control',
    formula: 'TotalFuelCost / TotalMileage',
    interpretation: 'Operating cost efficiency metric for fleet',
    targetRange: 'Compare to industry benchmarks'
  },
  {
    id: 'payroll_timeliness',
    name: 'Payroll Payment Timeliness %',
    category: 'Compliance',
    formula: 'OnTimePayments / TotalPayrolls * 100',
    interpretation: 'Percentage of payrolls paid on scheduled date',
    targetRange: '100% (critical compliance)'
  },
  {
    id: 'cash_burn_rate',
    name: 'Daily Cash Burn Rate',
    category: 'Cash Flow',
    formula: '(TotalExpenses - TotalRevenue) / ProjectDuration in days',
    interpretation: 'Average daily cash consumption',
    targetRange: 'Monitor against budget'
  }
];

// ============= RISK ALERTS =============

export interface RiskAlert {
  id: string;
  triggerCondition: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  remedialAction: string;
}

export const RISK_ALERTS: RiskAlert[] = [
  {
    id: 'cost_overrun',
    triggerCondition: 'Actual Cost > 115% of Planned Cost',
    severity: 'High',
    remedialAction: 'Review cost drivers, negotiate with vendors, adjust project scope'
  },
  {
    id: 'advance_overdue',
    triggerCondition: 'Advance not settled > 90 days',
    severity: 'Medium',
    remedialAction: 'Pursue settlement with vendor, verify goods/services received'
  },
  {
    id: 'vendor_blacklist',
    triggerCondition: 'Vendor has 3+ payment delays or quality issues',
    severity: 'High',
    remedialAction: 'Move vendor to blacklist, find alternative suppliers'
  },
  {
    id: 'inventory_loss',
    triggerCondition: 'Waste Quantity > 5% of Purchases',
    severity: 'Medium',
    remedialAction: 'Investigate material handling, storage, or theft issues'
  },
  {
    id: 'vat_discrepancy',
    triggerCondition: 'Recorded VAT vs Claimed VAT discrepancy > 2%',
    severity: 'Critical',
    remedialAction: 'Audit VAT records, correct ledger, file amended returns if needed'
  },
  {
    id: 'cash_crisis',
    triggerCondition: 'Projected Cash < 10% of Monthly Expenses',
    severity: 'Critical',
    remedialAction: 'Accelerate receivables, defer non-critical expenses, arrange financing'
  },
  {
    id: 'compliance_gap',
    triggerCondition: 'VAT Collection Efficiency < 95%',
    severity: 'High',
    remedialAction: 'Complete missing invoices, correct serial number gaps, file correction'
  },
  {
    id: 'fuel_anomaly',
    triggerCondition: 'Fuel Efficiency < 3 or > 20 km/liter',
    severity: 'Medium',
    remedialAction: 'Service vehicle, review driving patterns, investigate theft/fraud'
  }
];

// ============= EXAMPLE DATA TEMPLATES =============

export const EXAMPLE_PROJECT_COSTS: ProjectCost[] = [
  {
    id: 'cost-001',
    projectId: 'proj-demo-01',
    costType: 'Material',
    description: 'Gạch ốp lát Vietceramic Grade A',
    plannedAmount: 120000000,
    actualAmount: 125000000,
    variance: 5000000,
    date: '2026-05-15',
    dueDate: '2026-06-15',
    status: 'Approved'
  },
  {
    id: 'cost-002',
    projectId: 'proj-demo-01',
    costType: 'Labor',
    description: 'Nhân công xây dựng 50 ngày',
    plannedAmount: 50000000,
    actualAmount: 48000000,
    variance: -2000000,
    date: '2026-05-20',
    dueDate: '2026-06-20',
    status: 'Approved'
  }
];

export const EXAMPLE_VENDORS: Vendor[] = [
  {
    id: 'vendor-001',
    name: 'Công ty Vật liệu Xây Dựng Á Châu',
    taxId: '0102145667',
    contactPerson: 'Nguyễn Văn A',
    phone: '0912345678',
    email: 'contact@asianmat.vn',
    address: '123 Đường Lê Văn Lương, Hà Nội',
    bankAccount: '123456789',
    bankName: 'Vietcombank',
    totalPurchases: 450000000,
    status: 'Active'
  }
];

export const EXAMPLE_VAT_INVOICES: VATInvoice[] = [
  {
    id: 'vat-001',
    invoiceNo: 'HD/2026/0001',
    invoiceDate: '2026-05-15',
    issuedDate: '2026-05-16',
    buyerTaxId: '0312654881',
    sellerTaxId: '0102145667',
    description: 'Hóa đơn GTGT cung cấp vật liệu xây dựng',
    itemCount: 1,
    subtotal: 120000000,
    vatRate: 10,
    vatAmount: 12000000,
    total: 132000000,
    serialNumber: '001',
    recordingStatus: 'Recorded',
    reconciliationStatus: 'Match'
  }
];

export const EXAMPLE_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-001',
    projectId: 'proj-demo-01',
    itemCode: 'MAT-001',
    itemName: 'Gạch ốp lát Vietceramic',
    category: 'Material',
    unit: 'cái',
    openingQuantity: 0,
    purchaseQuantity: 5000,
    usedQuantity: 4800,
    wasteQuantity: 120,
    closingQuantity: 80,
    unitCost: 24000,
    totalValue: 1920000,
    lastUpdated: '2026-05-20',
    storageLocation: 'Warehouse A',
    status: 'Low Stock'
  }
];

export const EXAMPLE_FUEL_LOG: FuelTracking[] = [
  {
    id: 'fuel-001',
    projectId: 'proj-demo-01',
    date: '2026-05-15',
    fuelType: 'Diesel',
    quantityLiter: 50,
    costPerLiter: 21500,
    totalCost: 1075000,
    vehicleId: 'VH-001',
    vehicleType: 'Excavator Cat 336',
    mileageStart: 2500,
    mileageEnd: 2650,
    mileageDelta: 150,
    fuelEfficiency: 3.0,
    notes: 'Kiểm toán khoảng cách hoạt động',
    approverName: 'Trần Dev',
    approvalStatus: 'Approved'
  }
];
