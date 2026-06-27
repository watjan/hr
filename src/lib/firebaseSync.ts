import { db } from '../firebase';
import { doc, setDoc, getDoc, getDocs, collection, getDocFromServer } from 'firebase/firestore';
import { INITIAL_COMPANY_SETTINGS, INITIAL_EMPLOYEES, INITIAL_LEAVE_REQUESTS, INITIAL_PAYERS, INITIAL_PAYEES } from '../mockData';

const COLLECTION_NAME = 'sapphire_hr';

// Default preset values for additional databases
const DEFAULT_CHEQUES = [
  {
    id: "chq-1",
    chequeNumber: "CHQ20260601",
    bankName: "ธนาคารกสิกรไทย (KBank)",
    amount: 150000,
    dueDate: "2026-06-25",
    payerName: "หจก. อรุณโรจน์วัสดุก่อสร้าง",
    type: "incoming",
    status: "pending",
    remark: "เงินมัดจำค่าเตาอบอุตสาหกรรมรุ่น AP-500",
    notified: false
  },
  {
    id: "chq-2",
    chequeNumber: "CHQ20260602",
    bankName: "ธนาคารไทยพาณิชย์ (SCB)",
    amount: 85200,
    dueDate: "2026-06-18",
    payerName: "บริษัท สยามแฮปปี้คิทเช่น จำกัด",
    type: "incoming",
    status: "cleared",
    remark: "ชำระงวดสุดท้าย ชุดเคาน์เตอร์ครัวสิทธิบัตร",
    notified: true
  },
  {
    id: "chq-3",
    chequeNumber: "CHQ20260603",
    bankName: "ธนาคารทหารไทยธนชาต (TTB)",
    amount: 320000,
    dueDate: "2026-06-30",
    payerName: "บริษัท ซัพพลายเออร์โฮมเมล จำกัด",
    type: "outgoing",
    status: "pending",
    remark: "จ่ายค่าแผ่นเหล็กสแตนเลสวัตถุดิบนำเข้าจากโปแลนด์",
    notified: false
  }
];

const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    displayName: 'อภิวัฒน์ เกียรติสกุล',
    role: 'admin',
    department: 'ฝ่ายบริหาร (Management)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    desc: 'เข้าถึงสิทธิ์ผู้เข้าดูแลระบบ (Full Admin Access) สามารถดูและแก้ไขได้ทุกโมดูล',
    color: 'from-amber-550 to-orange-600 bg-amber-500/10'
  },
  {
    username: 'hr',
    password: 'hr123',
    displayName: 'นพเก้า มิ่งขวัญศิริ',
    role: 'hr',
    department: 'ทรัพยากรบุคคล (HR Dept)',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    desc: 'งานบริหารจัดการพนักงาน บันทึกการเข้างาน-เวลามาสาย แจ้งใบลา และสลิปเงินเดือนเบื้องต้น',
    color: 'from-emerald-550 to-teal-600 bg-emerald-500/10'
  },
  {
    username: 'accountant',
    password: 'acc123',
    displayName: 'ศรุตรา เลียบคงเกียรติ',
    role: 'accountant',
    department: 'บัญชีและการเงิน (Accounting)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    desc: 'สำหรับฝ่ายบัญชี จัดการสถิติยอดรายวัน รายเดือน สิทธิและสารสนเทศระบบควบคุมเรื่องเช็ครับ-จ่าย',
    color: 'from-indigo-550 to-purple-600 bg-indigo-500/10'
  },
  {
    username: 'sales',
    password: 'sales123',
    displayName: 'ธีรเดช ตันติเวชกุล',
    role: 'sales',
    department: 'พนักงานขายหน้าร้าน (Sales Representative)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    desc: 'จำกัดขอบเขตงานเฉพาะตรวจสอบบันทึกยอดขายรายวันและคำนวณสถิติยอดรวมเป้าหมายรายปี',
    color: 'from-blue-550 to-sky-600 bg-blue-500/10'
  }
];

const DEFAULT_PERMISSIONS = {
  admin: [
    'dashboard', 'settings', 'registry', 'employees', 'leave',
    'sales-daily', 'sales-monthly', 'sales-yearly',
    'cheque-incoming', 'cheque-outgoing', 'users'
  ],
  hr: [
    'dashboard', 'registry', 'employees', 'leave', 'users'
  ],
  accountant: [
    'dashboard', 'employees', 'cheque-incoming', 'cheque-outgoing',
    'sales-daily', 'sales-monthly', 'sales-yearly', 'users'
  ],
  sales: [
    'dashboard', 'sales-daily', 'sales-monthly', 'sales-yearly', 'users'
  ]
};

const DEFAULT_ATTENDANCE = [
  { id: '2026-06-19_emp-1', date: '2026-06-19', employeeId: 'emp-1', status: 'present', note: 'มาทำงานเช้าตรงเวลา' },
  { id: '2026-06-19_emp-2', date: '2026-06-19', employeeId: 'emp-2', status: 'present', note: 'ตอกบัตร 08:15' },
  { id: '2026-06-19_emp-3', date: '2026-06-19', employeeId: 'emp-3', status: 'late', note: 'สาย 10 นาทีเนื่องจาก BTS ชัดข้อง' },
  { id: '2026-06-19_emp-4', date: '2026-06-19', employeeId: 'emp-4', status: 'leave', note: 'ลากิจฉุกเฉิน ทำทันตกรรมประสาทฟัน' },
  { id: '2026-06-19_emp-5', date: '2026-06-19', employeeId: 'emp-5', status: 'present', note: 'มาทำงานเช้าตรงเวลา' },
  { id: '2026-06-19_emp-6', date: '2026-06-19', employeeId: 'emp-6', status: 'absent', note: 'ขาดงาน ไม่ตอบกลับแชทไลน์' },
  { id: '2026-06-19_emp-7', date: '2026-06-19', employeeId: 'emp-7', status: 'swap_holiday', note: 'สลับแลกวันหยุดกับวันอาทิตย์นี้' }
];

const DEFAULT_SALES = [
  { id: "s-1", date: "2026-06-15", amount: 45000, orderCount: 18, method: "โอนเงินดิจิทัล", note: "จัดมินิแสดงโชว์วันจันทร์", creatorName: "แอดมินระบบ" },
  { id: "s-2", date: "2026-06-16", amount: 32000, orderCount: 12, method: "เงินสด", note: "ขายปลีกเตาอบหน้าร้าน", creatorName: "ศรุตรา พนักงาน" },
  { id: "s-3", date: "2026-06-17", amount: 58000, orderCount: 22, method: "บัตรเครดิต", note: "ลูกค้าบุฟเฟต์มาจัดอุปกรณ์ครัว", creatorName: "ธีรเดช บัญชี" },
  { id: "s-4", date: "2026-06-18", amount: 27500, orderCount: 9, method: "โอนเงินดิจิทัล", note: "สั่งซื้อผ่านช่องทางไลน์เพจบริษัท", creatorName: "แอดมินระบบ" },
  { id: "s-5", date: "2026-06-19", amount: 92000, orderCount: 35, method: "บัตรเครดิต", note: "เหมาหม้ออัดแรงดันเครื่องครัวอภิวัฒน์", creatorName: "ศรุตรา พนักงาน" }
];

/**
 * Assures local defaults are populated in local storage before upload.
 */
export function ensureLocalDefaultsInStorage(): void {
  if (!localStorage.getItem('hr_company_settings')) {
    localStorage.setItem('hr_company_settings', JSON.stringify(INITIAL_COMPANY_SETTINGS));
  }
  if (!localStorage.getItem('hr_employees')) {
    localStorage.setItem('hr_employees', JSON.stringify(INITIAL_EMPLOYEES));
  }
  if (!localStorage.getItem('hr_leave_requests')) {
    localStorage.setItem('hr_leave_requests', JSON.stringify(INITIAL_LEAVE_REQUESTS));
  }
  if (!localStorage.getItem('hr_cheques_data')) {
    localStorage.setItem('hr_cheques_data', JSON.stringify(DEFAULT_CHEQUES));
  }
  if (!localStorage.getItem('sapphire_users')) {
    localStorage.setItem('sapphire_users', JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem('sapphire_role_permissions')) {
    localStorage.setItem('sapphire_role_permissions', JSON.stringify(DEFAULT_PERMISSIONS));
  }
  if (!localStorage.getItem('hr_daily_attendance')) {
    localStorage.setItem('hr_daily_attendance', JSON.stringify(DEFAULT_ATTENDANCE));
  }
  if (!localStorage.getItem('sapphire_daily_sales')) {
    localStorage.setItem('sapphire_daily_sales', JSON.stringify(DEFAULT_SALES));
  }
  if (!localStorage.getItem('hr_cheque_payers')) {
    localStorage.setItem('hr_cheque_payers', JSON.stringify(INITIAL_PAYERS));
  }
  if (!localStorage.getItem('hr_cheque_payees')) {
    localStorage.setItem('hr_cheque_payees', JSON.stringify(INITIAL_PAYEES));
  }
}

/**
 * Validates connection to Firestore Cloud by fetching a test document from the server.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const docRef = doc(db, 'test', 'connection');
    await getDocFromServer(docRef);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Firebase] Firestore client is offline: Check credentials or network connectivity');
      return false;
    }
    // "Permission denied" or "Not found" means connection succeeded to the database instance, standard response
    return true;
  }
}

/**
 * Saves a single local state key-value to Firestore
 */
export async function saveKeyToCloud(key: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, key);
    // Standard Firestore doc payload
    await setDoc(docRef, {
      updatedAt: new Date().toISOString(),
      payload: data
    });
    console.log(`[Firebase] Saved ${key} successfully to Cloud.`);
  } catch (error) {
    console.error(`[Firebase] Error saving ${key} to Cloud:`, error);
    throw error;
  }
}

/**
 * Fetches a single local state key-value from Firestore
 */
export async function fetchKeyFromCloud(key: string): Promise<any | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().payload;
    }
    return null;
  } catch (error) {
    console.error(`[Firebase] Error fetching ${key} from Cloud:`, error);
    throw error;
  }
}

/**
 * Uploads all key datasets from local storage to Firestore cloud
 */
export async function uploadAllToCloud(): Promise<void> {
  const syncKeys = [
    { localKey: 'sapphire_users', cloudKey: 'users' },
    { localKey: 'sapphire_role_permissions', cloudKey: 'role_permissions' },
    { localKey: 'hr_company_settings', cloudKey: 'company_settings' },
    { localKey: 'hr_employees', cloudKey: 'employees' },
    { localKey: 'hr_leave_requests', cloudKey: 'leave_requests' },
    { localKey: 'hr_daily_attendance', cloudKey: 'daily_attendance' },
    { localKey: 'sapphire_daily_sales', cloudKey: 'daily_sales' },
    { localKey: 'hr_cheques_data', cloudKey: 'cheques_data' },
    { localKey: 'sapphire_payroll_registries', cloudKey: 'payroll_registries' },
    { localKey: 'hr_cheque_payers', cloudKey: 'cheque_payers' },
    { localKey: 'hr_cheque_payees', cloudKey: 'cheque_payees' },
    { localKey: 'sapphire_sales_annual_target', cloudKey: 'sales_annual_target' },
    { localKey: 'sapphire_billing_statements', cloudKey: 'billing_statements' }
  ];

  for (const item of syncKeys) {
    const rawVal = localStorage.getItem(item.localKey);
    if (rawVal) {
      try {
        const parsed = JSON.parse(rawVal);
        await saveKeyToCloud(item.cloudKey, parsed);
      } catch (e) {
        // If it's a string config or similar
        await saveKeyToCloud(item.cloudKey, rawVal);
      }
    }
  }
}

/**
 * Downloads all key datasets from Firestore and saves to local storage
 */
export async function downloadAllFromCloud(): Promise<Record<string, any>> {
  if (typeof window !== 'undefined') {
    (window as any).__is_downloading_from_cloud = true;
  }
  try {
    const syncKeys = [
      { localKey: 'sapphire_users', cloudKey: 'users' },
      { localKey: 'sapphire_role_permissions', cloudKey: 'role_permissions' },
      { localKey: 'hr_company_settings', cloudKey: 'company_settings' },
      { localKey: 'hr_employees', cloudKey: 'employees' },
      { localKey: 'hr_leave_requests', cloudKey: 'leave_requests' },
      { localKey: 'hr_daily_attendance', cloudKey: 'daily_attendance' },
      { localKey: 'sapphire_daily_sales', cloudKey: 'daily_sales' },
      { localKey: 'hr_cheques_data', cloudKey: 'cheques_data' },
      { localKey: 'sapphire_payroll_registries', cloudKey: 'payroll_registries' },
      { localKey: 'hr_cheque_payers', cloudKey: 'cheque_payers' },
      { localKey: 'hr_cheque_payees', cloudKey: 'cheque_payees' },
      { localKey: 'sapphire_sales_annual_target', cloudKey: 'sales_annual_target' },
      { localKey: 'sapphire_billing_statements', cloudKey: 'billing_statements' }
    ];

    const downloadedData: Record<string, any> = {};

    for (const item of syncKeys) {
      const cloudVal = await fetchKeyFromCloud(item.cloudKey);
      if (cloudVal !== null) {
        downloadedData[item.localKey] = cloudVal;
        localStorage.setItem(item.localKey, typeof cloudVal === 'object' ? JSON.stringify(cloudVal) : String(cloudVal));
      }
    }

    return downloadedData;
  } finally {
    if (typeof window !== 'undefined') {
      (window as any).__is_downloading_from_cloud = false;
    }
  }
}
