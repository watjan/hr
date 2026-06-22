import { CompanySettings, EmployeeSalary, LeaveRequest, ChequePayer, ChequePayee } from './types';

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  name: "บริษัทอภิวัฒน์เครื่องครัว จำกัด",
  taxId: "0105568123456",
  email: "apiwatkitchenware@gmail.com",
  phone: "02-415-9999",
  address: "99/1-5 ถนนพระราม 2 แขวงท่าข้าม เขตบางขุนเทียน กรุงเทพมหานคร 10150",
  website: "www.apiwatkitchenware.com",
  socialMedia: "@apiwatkitchenware",
  departments: [
    { id: "dept-1", name: "ฝ่ายบริหารและสำนักงาน (Management & Admin)", code: "ADM", employeeCount: 2 },
    { id: "dept-2", name: "ฝ่ายผลิตและการชุบโลหะ (Production & Metal Plating)", code: "PROD", employeeCount: 2 },
    { id: "dept-3", name: "ฝ่ายการตลาดและการขาย (Sales & Marketing)", code: "MKT", employeeCount: 1 },
    { id: "dept-4", name: "ฝ่ายบัญชีและการเงิน (Accounting & Finance)", code: "ACC", employeeCount: 1 },
    { id: "dept-5", name: "ฝ่ายคลังสินค้าและการจัดส่ง (Warehouse & Logistics)", code: "LOG", employeeCount: 1 },
  ]
};

export const INITIAL_EMPLOYEES: EmployeeSalary[] = [
  {
    id: "emp-1",
    employeeId: "APW-001",
    name: "นายอัญญิกา แสนงาม",
    departmentId: "dept-5",
    position: "ผู้จัดการฝ่ายคลังและผลิต (Warehouse Manager)",
    baseSalary: 42000,
    bonus: 5000,
    deduction: 1500,
    paymentStatus: "paid",
    bankAccount: "123-4-56789-0",
    bankName: "ธนาคารกสิกรไทย",
    paymentPeriod: "1",
    salaryType: "monthly",
    createdAt: "2024-03-01T08:00:00.000Z",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    startDate: "2024-03-01"
  },
  {
    id: "emp-2",
    employeeId: "APW-002",
    name: "นางสาวชนากานต์ สิริชัย",
    departmentId: "dept-1",
    position: "หัวหน้าทีมควบคุมคุณภาพ (QA Leader)",
    baseSalary: 28000,
    bonus: 2000,
    deduction: 500,
    paymentStatus: "paid",
    bankAccount: "987-6-54321-0",
    bankName: "ธนาคารไทยพาณิชย์",
    paymentPeriod: "1",
    salaryType: "monthly",
    createdAt: "2024-06-15T10:00:00.000Z",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    startDate: "2024-06-15"
  },
  {
    id: "emp-3",
    employeeId: "APW-003",
    name: "นายสมชาย คำดี",
    departmentId: "dept-2",
    position: "ช่างเชื่อมโลหะระดับสูง (Senior Welder)",
    baseSalary: 15000,
    bonus: 1200,
    deduction: 200,
    paymentStatus: "pending",
    bankAccount: "456-2-11223-9",
    bankName: "ธนาคารกรุงเทพ",
    paymentPeriod: "2",
    salaryType: "daily",
    createdAt: "2025-01-10T11:30:00.000Z",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
    startDate: "2025-01-10"
  },
  {
    id: "emp-4",
    employeeId: "APW-004",
    name: "นายวิภาส อุทัยแสน",
    departmentId: "dept-2",
    position: "พนักงานวิศวกรรมบำรุงรักษา (Maintenance Technician)",
    baseSalary: 23500,
    bonus: 1000,
    deduction: 0,
    paymentStatus: "paid",
    bankAccount: "112-2-33445-5",
    bankName: "ธนาคารกรุงไทย",
    paymentPeriod: "1",
    salaryType: "monthly",
    createdAt: "2025-02-01T14:15:00.000Z",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    startDate: "2025-02-01"
  },
  {
    id: "emp-5",
    employeeId: "APW-005",
    name: "นางสาวรัตติกาล แสนอรุณ",
    departmentId: "dept-3",
    position: "พนักงานแอดมินฝ่ายขาย (Sales Admin)",
    baseSalary: 18500,
    bonus: 3000,
    deduction: 400,
    paymentStatus: "hold",
    bankAccount: "332-1-45678-9",
    bankName: "ธนาคารกรุงศรีอยุธยา",
    paymentPeriod: "2",
    salaryType: "monthly",
    createdAt: "2025-05-20T09:00:00.000Z",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    startDate: "2025-05-20"
  },
  {
    id: "emp-6",
    employeeId: "APW-006",
    name: "นางสาวกัลยา อบอุ่น",
    departmentId: "dept-1",
    position: "เจ้าหน้าที่ฝ่ายบุคคล (HR Officer)",
    baseSalary: 32000,
    bonus: 1500,
    deduction: 0,
    paymentStatus: "paid",
    bankAccount: "444-5-66778-9",
    bankName: "ธนาคารกสิกรไทย",
    paymentPeriod: "1",
    salaryType: "monthly",
    createdAt: "2020-08-01T16:45:00.000Z",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    startDate: "2020-08-01"
  },
  {
    id: "emp-7",
    employeeId: "APW-007",
    name: "นายวรุตม์ มั่นคง",
    departmentId: "dept-4",
    position: "หัวหน้าฝ่ายบัญชี (Senior Accountant)",
    baseSalary: 40000,
    bonus: 8000,
    deduction: 150,
    paymentStatus: "paid",
    bankAccount: "555-6-77889-0",
    bankName: "ธนาคารไทยพาณิชย์",
    paymentPeriod: "2",
    salaryType: "monthly",
    createdAt: "2019-11-12T13:00:00.000Z",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    startDate: "2019-11-12"
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "req-1",
    employeeId: "emp-2",
    employeeName: "นางสาวชนากานต์ สิริชัย",
    type: "sick",
    startDate: "2026-06-25",
    endDate: "2026-06-26",
    durationDays: 2,
    reason: "ไข้หวัดใหญ่ มีไข้สูง ปวดหัวรุนแรง",
    status: "approved"
  },
  {
    id: "req-2",
    employeeId: "emp-4",
    employeeName: "นายวิภาส อุทัยแสน",
    type: "personal",
    startDate: "2026-06-15",
    endDate: "2026-06-15",
    durationDays: 1,
    reason: "ติดต่อราชการทำบัตรประชาชนใหม่",
    status: "approved"
  },
  {
    id: "req-3",
    employeeId: "emp-3",
    employeeName: "นายสมชาย คำดี",
    type: "late",
    startDate: "2026-06-17",
    endDate: "2026-06-17",
    durationDays: 0,
    durationMinutes: 45,
    reason: "อุบัติเหตุรถไฟฟ้าขัดข้องสายสีเขียว",
    status: "approved"
  },
  {
    id: "req-4",
    employeeId: "emp-5",
    employeeName: "นางสาวรัตติกาล แสงอรุณ",
    type: "vacation",
    startDate: "2026-06-22",
    endDate: "2026-06-25",
    durationDays: 4,
    reason: "พักผ่อนต่างจังหวัดกับครอบครัว",
    status: "pending"
  }
];

export const INITIAL_PAYERS: ChequePayer[] = [
  { id: 'pyr-1', name: 'บริษัท สยาม คิทเช่น จำกัด', taxId: '0105560123456', phone: '02-123-4567', email: 'siamkitchen@example.com', address: '123 ถ.หลักเมือง แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร' },
  { id: 'pyr-2', name: 'หจก. อร่อยดีดี ดิสทริบิวชั่น', taxId: '0105562001122', phone: '081-332-2110', email: 'aroy_dd@example.com', address: '45/8 ถ.อ่อนนุช แขวงประเวศ เขตประเวศ กรุงเทพมหานคร' },
  { id: 'pyr-3', name: 'ร้านอาหาร แซ่บสตรีทฟู้ด', taxId: '0305560000345', phone: '095-888-7766', email: 'sab_street@example.com', address: '99 หมู่ 3 ต.บึงน้ำรักษ์ อ.ธัญบุรี จ.ปทุมธานี' },
  { id: 'pyr-4', name: 'หจก. ยูนิเวอร์แซล โลหะกิจ', taxId: '0105558000456', phone: '02-777-8899', email: 'universal_metal@example.com', address: '10/12 ถ.พระราม 2 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพมหานคร' }
];

export const INITIAL_PAYEES: ChequePayee[] = [
  { id: 'pye-1', name: 'บริษัท สเตนเลสไทย พาวเวอร์', taxId: '0105560111222', phone: '02-543-2100', email: 'stainless_thai@example.com', address: '55/9 ถ.หนองจอก แขวงกระทุ่มราย เขตหนองจอก กรุงเทพมหานคร' },
  { id: 'pye-2', name: 'บจก. บางกอก แก๊ส อินเตอร์', taxId: '0105559000123', phone: '02-888-1111', email: 'bkk_gas@example.com', address: '12-14 ถ.จรัญสนิทวงศ์ แขวงบ้านช่างหล่อ เขตบางกอกน้อย กรุงเทพมหานคร' },
  { id: 'pye-3', name: 'บริษัท เฟอร์นิเจอร์ โมเดิร์น ซัพพลาย บจก.', taxId: '0105559876543', phone: '02-987-6543', email: 'modern_furn@example.com', address: '45/6 ถ.รามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร' }
];
