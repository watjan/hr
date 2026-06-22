import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ค้นหา config เพื่อทำงานเริ่มต้น
let config = {};
const configPath = join(process.cwd(), 'firebase-applet-config.json');

if (existsSync(configPath)) {
  try {
    const raw = readFileSync(configPath, 'utf8');
    config = JSON.parse(raw);
    console.log('📌 อ่านข้อมูลการเชื่อมต่อจาก "firebase-applet-config.json" เรียบร้อยแล้ว!');
  } catch (e) {
    console.error('❌ ไม่สามารถอ่านไฟล์ config ได้:', e);
  }
} else {
  console.log('⚠️ ไม่พบ "firebase-applet-config.json" กรุณาเตรียมข้อมูลผ่าน Environment Variables หรือสร้างไฟล์ดังกล่าวก่อนรัน');
}

// โหลดค่า config จาก ENV ที่อาจตั้งค่าไว้ (ลำดับความสำคัญสูงสุด)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: process.env.VITE_FIREBASE_APP_ID || config.appId
};

const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || config.firestoreDatabaseId;

// ตรวจสอบความถูกต้องของ Connection
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('\n❌ เกิดข้อผิดพลาด: ข้อมูลเชื่อมต่อ Firebase ไม่ครบถ้วน!');
  console.log('กรุณาเตรียมไฟล์ "firebase-applet-config.json" หรือตั้งค่า Environment Variables ให้ครบถ้วนในเครื่องเป้าหมาย\n');
  process.exit(1);
}

console.log('⚙️ กำลังเชื่อมต่อกับฐานข้อมูล Firestore...');
console.log(`- Project ID: ${firebaseConfig.projectId}`);
console.log(`- Database ID: ${databaseId || '(default)'}`);

const app = initializeApp(firebaseConfig);
const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

const COLLECTION_NAME = 'sapphire_hr';

// === ชุดข้อมูลจำลองเริ่มต้นสำหรับติดตั้งฐานข้อมูลใหม่ (Initial Database Seed Data) ===

const INITIAL_COMPANY_SETTINGS = {
  name: "บริษัทอภิวัฒน์เครื่องครัว จำกัด",
  code: "APW-KITCHEN",
  taxId: "0105568123456",
  address: "99/1-5 ถนนพระราม 2 แขวงท่าข้าม เขตบางขุนเทียน กรุงเทพมหานคร 10150",
  phone: "02-415-9999",
  email: "apiwatkitchenware@gmail.com",
  website: "www.apiwatkitchenware.com",
  ssoRate: 5,
  minSSO: 83,
  maxSSO: 750,
  authorizedSignatory: "นายอภิวัฒน์ เกียรติสกุล"
};

const INITIAL_EMPLOYEES = [
  {
    id: 'emp-1',
    shId: 'APW-001',
    name: 'นายอัญญิกา แสนงาม',
    role: 'ผู้จัดการฝ่ายผลิต (Production Manager)',
    salaryType: 'monthly',
    baseSalary: 42000,
    bonus: 5000,
    deduction: 1500,
    ssoEnabled: true,
    startDate: '2024-03-01',
    bankAccount: '123-4-56789-0',
    address: '88/12 ถ.ชัยพฤกษ์ ต.ปากเกร็ด อ.ปากเกร็ด จ.นนทบุรี 11120',
    phone: '081-234-5678',
    email: 'anyika.s@apiwatkitchenware.com',
    status: 'working'
  },
  {
    id: 'emp-2',
    shId: 'APW-002',
    name: 'น.ส.ชนากานต์ สิริชัย',
    role: 'หัวหน้าทีมควบคุมคุณภาพ (QA Leader)',
    salaryType: 'monthly',
    baseSalary: 28000,
    bonus: 2000,
    deduction: 500,
    ssoEnabled: true,
    startDate: '2024-06-15',
    bankAccount: '987-6-54321-0',
    address: '45 หมู่ 3 ซอยเพชรเกษม 48 แขวงบางแวก เขตภาษีเจริญ กรุงเทพฯ 10160',
    phone: '089-876-5432',
    email: 'chanakan.s@apiwatkitchenware.com',
    status: 'working'
  },
  {
    id: 'emp-3',
    shId: 'APW-003',
    name: 'นายสมชาย คำดี',
    role: 'ช่างเชื่อมโลหะระดับสูง (Senior Welder)',
    salaryType: 'daily',
    baseSalary: 750, // อัตราค่าจ้างรายวัน ต่อวัน
    bonus: 1200,
    deduction: 200,
    ssoEnabled: true,
    startDate: '2025-01-10',
    bankAccount: '456-2-11223-9',
    address: '12/4 ซอยประชาอุทิศ 90 ต.บ้านคลองสวน อ.พระสมุทรเจดีย์ จ.สมุทรปราการ 10290',
    phone: '085-555-4433',
    email: 'somchai.k@example.com',
    status: 'working'
  },
  {
    id: 'emp-4',
    shId: 'APW-004',
    name: 'นายวิภาส อุทัยแสน',
    role: 'พนักงานวิศวกรรมบำรุงรักษา (Maintenance Technician)',
    salaryType: 'monthly',
    baseSalary: 23500,
    bonus: 1000,
    deduction: 0,
    ssoEnabled: true,
    startDate: '2025-02-01',
    bankAccount: '112-2-33445-5',
    address: '9/9 ถ.เอกชัย แขวงบางบอน เขตบางบอน กรุงเทพมหานคร 10150',
    phone: '083-999-8811',
    email: 'wiphas.u@example.com',
    status: 'working'
  },
  {
    id: 'emp-5',
    shId: 'APW-005',
    name: 'น.ส.รัตติกาล แสงอรุณ',
    role: 'พนักงานแอดมินฝ่ายขาย (Sales Admin)',
    salaryType: 'monthly',
    baseSalary: 18500,
    bonus: 3000,
    deduction: 400,
    ssoEnabled: true,
    startDate: '2025-05-20',
    bankAccount: '332-1-45678-9',
    address: '9902 ถ.กาญจนาภิเษก แขวงบางแค เขตบางแค กรุงเทพมหานคร 10160',
    phone: '095-123-4567',
    email: 'rattikan.s@example.com',
    status: 'working'
  }
];

const INITIAL_LEAVE_REQUESTS = [
  {
    id: "req-1",
    employeeId: "emp-2",
    employeeName: "น.ส.ชนากานต์ สิริชัย",
    leaveType: "sick",
    startDate: "2026-06-25",
    endDate: "2026-06-26",
    totalDays: 2,
    reason: "มีไข้หวัดใหญ่และเจ็บคออย่างรุนแรง แพทย์สั่งหยุดพักผ่อนใบรับรองแพทย์แนบแล้ว",
    status: "approved"
  },
  {
    id: "req-2",
    employeeId: "emp-4",
    employeeName: "นายวิภาส อุทัยแสน",
    leaveType: "vacation",
    startDate: "2026-07-10",
    endDate: "2026-07-12",
    totalDays: 3,
    reason: "ลากิจพักร้อนท่องเที่ยวประจำปีกิจการทางบ้าน",
    status: "pending"
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
  ]
};

const DEFAULT_ATTENDANCE = [
  { id: '2026-06-19_emp-1', date: '2026-06-19', employeeId: 'emp-1', status: 'present', note: 'มาทำงานเช้าตรงเวลา' },
  { id: '2026-06-19_emp-2', date: '2026-06-19', employeeId: 'emp-2', status: 'present', note: 'ตอกบัตร 08:15' }
];

const DEFAULT_SALES = [
  { id: "sale-1", date: "2026-06-20", rawSales: 145000, vatAmount: 10150, netSales: 134850, cashier: "ธีรเดช ตันติเวชกุล", billCount: 18, status: "completed" },
  { id: "sale-2", date: "2026-06-21", rawSales: 168000, vatAmount: 11760, netSales: 156240, cashier: "ธีรเดช ตันติเวชกุล", billCount: 22, status: "completed" }
];

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
  }
];

const INITIAL_PAYERS = [
  { id: 'pyr-1', name: 'บริษัท สยาม คิทเช่น จำกัด', taxId: '0105560123456', phone: '02-123-4567', email: 'siamkitchen@example.com', address: '123 ถ.หลักเมือง แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร' },
  { id: 'pyr-2', name: 'หจก. อร่อยดีดี ดิสทริบิวชั่น', taxId: '0105562001122', phone: '081-332-2110', email: 'aroy_dd@example.com', address: '45/8 ถ.อ่อนนุช แขวงประเวศ เขตประเวศ กรุงเทพมหานคร' }
];

const INITIAL_PAYEES = [
  { id: 'pye-1', name: 'บริษัท สเตนเลสไทย พาวเวอร์', taxId: '0105560111222', phone: '02-543-2100', email: 'stainless_thai@example.com', address: '55/9 ถ.หนองจอก แขวงกระทุ่มราย เขตหนองจอก กรุงเทพมหานคร' }
];

const seedData = [
  { key: 'users', payload: DEFAULT_USERS },
  { key: 'role_permissions', payload: DEFAULT_PERMISSIONS },
  { key: 'company_settings', payload: INITIAL_COMPANY_SETTINGS },
  { key: 'employees', payload: INITIAL_EMPLOYEES },
  { key: 'leave_requests', payload: INITIAL_LEAVE_REQUESTS },
  { key: 'daily_attendance', payload: DEFAULT_ATTENDANCE },
  { key: 'daily_sales', payload: DEFAULT_SALES },
  { key: 'cheques_data', payload: DEFAULT_CHEQUES },
  { key: 'payroll_registries', payload: [] },
  { key: 'cheque_payers', payload: INITIAL_PAYERS },
  { key: 'cheque_payees', payload: INITIAL_PAYEES }
];

async function runSeeder() {
  console.log('\n======================================================');
  console.log('🚀 เริ่มต้นการติดตั้งตารางและนำเข้าชุดข้อมูลเริ่มต้นลงในระบบฐานข้อมูลคลาวน์');
  console.log('======================================================\n');

  let successCount = 0;

  for (const item of seedData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, item.key);
      console.log(`📦 เขียนตารางข้อมูลคลาวน์: "${item.key}"...`);
      await setDoc(docRef, {
        updatedAt: new Date().toISOString(),
        payload: item.payload
      });
      console.log(`✅ สำเร็จ! เขียนข้อมูลคลาวน์ "${item.key}" เรียบร้อยแล้ว`);
      successCount++;
    } catch (e) {
      console.error(`❌ เกิดข้อผิดพลาดในการเขียนข้อมูลคลาวน์ "${item.key}":`, e.message);
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 ดำเนินการเสร็จสิ้น! ติดตั้งเรียบร้อยทั้งสิ้น ${successCount} / ${seedData.length} ตาราง`);
  console.log('💡 คุณสามารถเข้าสู่ระบบหน้ารายการหลักโดยเชื่อมต่อสู่ Firebase ชุดนี้ได้ทันที');
  console.log('======================================================\n');
}

runSeeder().catch(err => {
  console.error('❌ เกิดข้อผิดพลาดและต้องหยุดการรันตัวติดตั้งเดโม:', err);
});
