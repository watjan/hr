export interface Department {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
}

export interface CompanySettings {
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  socialMedia: string;
  departments: Department[];
}

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  name: string;
  departmentId: string;
  position: string;
  baseSalary: number;
  bonus: number;
  deduction: number;
  paymentStatus: 'paid' | 'pending' | 'hold';
  bankAccount: string;
  bankName: string;
  socialSecurity?: number;
  paymentPeriod?: '1' | '2'; // '1' = งวดที่ 1 (วันที่ 1-15 ของทุกเดือน), '2' = งวดที่ 2 (วันที่ 16-31 ของทุกเดือน)
  salaryType?: 'monthly' | 'daily'; // 'monthly' = รายเดือน, 'daily' = รายวัน
  createdAt?: string;
  avatar?: string;       // รูปโปรไฟล์พนักงาน (URL หรือ base64)
  startDate?: string;    // วันเริ่มเข้าทำงาน (รูปแบบ YYYY-MM-DD)
  workedDays?: number;   // จำนวนวันทำงาน สำหรับพนักงานรายวัน
  branch?: string;       // สาขา เช่น 'สำนักงานใหญ่', 'สาขาควนขนุน', 'สาขาพัทลุง'
  cancelLineSend?: boolean; // ปิดการส่ง LINE สำหรับสลิปพนักงานท่านนี้ (ยกเลิกส่ง)
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sick' | 'personal' | 'vacation' | 'late' | 'other';
  startDate: string;
  endDate: string;
  durationDays: number; // For leave
  durationMinutes?: number; // For late
  reason: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
}

export type AttendanceStatus = 'present' | 'leave' | 'late' | 'absent' | 'swap_holiday' | 'holiday';

export interface CompanyHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // ชื่อวันหยุด เช่น "วันขึ้นปีใหม่"
  description?: string;
}

export interface DailyAttendance {
  id: string; // date_employeeId combination is perfect, or just auto id
  date: string; // YYYY-MM-DD
  employeeId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface DailySale {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  orderCount: number;
  paymentMethod: 'โอนเงินดิจิทัล' | 'เงินสด' | 'บัตรเครดิต' | 'อื่นๆ';
  note?: string;
  creator?: string; // พนักงานผู้บันทึก
}

export interface Cheque {
  id: string;
  chequeNumber: string; // เลขที่เช็ค
  bankName: string; // ธนาคาร
  branch: string; // สาขา
  chequeDate: string; // วันที่ครบกำหนด/สั่งจ่ายบนเช็ค (YYYY-MM-DD)
  amount: number; // จำนวนเงิน
  partyName: string; // ชื่อลูกค้า (ขารับ) หรือ ชื่อผู้ค้า/คู่ค้า (ขาจ่าย)
  type: 'incoming' | 'outgoing'; // ขารับ หรือ ขาจ่าย
  status: 'pending_receipt' | 'pending_deposit' | 'cleared' | 'bounced' | 'cancelled'; 
  // pending_receipt = ยังไม่รับ/ค้างรับ (สำหรับขารับ) หรือ ยังไม่จ่าย/ค้างจ่าย (สำหรับขาจ่าย)
  // pending_deposit = ได้รับเช็คแล้ว/รอขึ้นเงิน (สำหรับขารับ) หรือ ออกเช็คแล้ว/รอผู้มีสิทธิ์มาเบิก (สำหรับขาจ่าย)
  // cleared = เช็คผ่านแล้ว/ขึ้นเงินแล้ว (เช็ครับแล้ว)
  // bounced = เช็คเด้ง/ปฏิเสธการจ่าย
  // cancelled = ยกเลิกเช็ค
  note?: string;
  updatedAt?: string;
}

export interface ChequePayer {
  id: string;
  name: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
}

export interface ChequePayee {
  id: string;
  name: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
}

export type UserRole = 'admin' | 'hr' | 'accountant' | 'sales' | 'employee';

export interface UserSession {
  username: string;
  displayName: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  loginTime: string;
  employeeId?: string; // Reference to Employee ID if logged in as an employee
}

export interface TestUser {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
  department: string;
  avatarUrl: string;
  desc: string;
  color?: string;
  allowedTabs?: string[];
}

export interface DailyCashLog {
  id: string;
  date: string; // YYYY-MM-DD
  sales1: number; // ยอดขายที่ 1
  sales2: number; // ยอดขายที่ 2
  reserve: number; // ยอดเตรียมเงิน (สำรองตั้งต้น)
  transferKhonLaKhrueng: number; // โอนคนละครึ่ง
  transferKBank: number; // โอนกสิกรไทย
  transferSCB: number; // โอนไทยพาณิชย์
  expense: number; // รายจ่ายวันนี้ / ยอดจ่ายเงิน
  actualCashCounted: number; // ยอดนับได้จริง
  creator: string; // ผู้บันทึก
  note?: string; // หมายเหตุ
}

export interface SupplierPartner {
  id: string; // e.g., "SPL-001"
  name: string; // ชื่อคู่ค้า / บริษัทคู่ค้า
  contactName?: string; // ผู้ติดต่อประสานงาน
  phone?: string; // เบอร์โทรศัพท์
  email?: string; // อีเมล
  address?: string; // ที่อยู่
  productCategory: string; // หมวดหมู่สินค้าที่จัดส่ง (เช่น "สแตนเลสสตีล", "แก๊สหุงต้ม", "บรรจุภัณฑ์", "เครื่องครัวนำเข้า", "บริการขนส่ง/โลจิสติกส์")
  deliveryStatus: 'active' | 'inactive'; // สถานะคู่ค้า (กำลังส่งของ / ระงับชั่วคราว)
  rating: number; // คะแนนประเมินคู่ค้า (1-5 ดาว)
  paymentTerms?: string; // เงื่อนไขชำระเงิน (เช่น "เครดิต 30 วัน", "เงินสด", "มัดจำ 50%")
  totalDeliveriesCount: number; // จำนวนรอบส่งของสะสม
  outstandingBalance?: number; // ยอดเงินคงค้างค่ายกยอด/ค่าสินค้า
  lastDeliveryDate?: string; // วันที่ส่งของล่าสุด (YYYY-MM-DD)
}

export interface DeliveryLog {
  id: string; // "DLV-001"
  supplierId: string; // ไอดีคู่ค้า
  supplierName: string; // ชื่อคู่ค้า
  deliveryDate: string; // วันที่ส่งของ (YYYY-MM-DD)
  billNo?: string; // เลขที่ใบส่งของ/ใบกำกับภาษี
  amount: number; // ยอดเงินตามบิลจัดส่ง
  deliveryStatus: 'delivered' | 'pending' | 'shipping' | 'delayed' | 'cancelled'; // สถานะส่งของ ('ส่งสำเร็จแล้ว' | 'รอคิวส่ง' | 'กำลังจัดส่ง' | 'จัดส่งล่าช้า' | 'ยกเลิก')
  receiverName: string; // พนักงานผู้รับของ
  note?: string; // หมายเหตุเพิ่มเติม
}





