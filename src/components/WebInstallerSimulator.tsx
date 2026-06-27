import React, { useState, useMemo, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Terminal, 
  Loader2, 
  Copy, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Globe, 
  Mail, 
  Lock, 
  User, 
  Check, 
  ChevronRight, 
  ArrowLeft,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WebInstallerSimulator() {
  const [step, setStep] = useState<number>(1);
  
  // Form States - Step 2 (General Config)
  const [siteName, setSiteName] = useState('ร้านอาหารอภิวัฒน์เครื่องครัว');
  const [adminEmail, setAdminEmail] = useState('apiwatkitchenware@gmail.com');
  const [adminUser, setAdminUser] = useState('admin_apiwat');
  const [adminPass, setAdminPass] = useState('Apiwat@2026');
  const [themeColor, setThemeColor] = useState('blue'); // blue, emerald, indigo, amber

  // Form States - Step 3 (Database Config)
  const [dbHost, setDbHost] = useState('127.0.0.1');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('apiwat_kitchenware_db');
  const [dbUser, setDbUser] = useState('apiwat_admin');
  const [dbPass, setDbPass] = useState('DBPassword@9988');

  // Interactive Testing states
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [dbTestLogs, setDbTestLogs] = useState<string[]>([]);
  const [dbTestResult, setDbTestResult] = useState<'success' | 'fail' | null>(null);

  // Installer state - Step 4
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [configType, setConfigType] = useState<'env' | 'json' | 'php'>('env');

  // Pre-installation Checks (Simulated Server Specs)
  const serverChecks = useMemo(() => [
    { name: 'PHP Version / Node.js Engine Check', status: 'pass', desc: 'Node.js v18.16.0 / PHP v8.2.4 detected' },
    { name: 'MySQL / MariaDB Client Library', status: 'pass', desc: 'MySQLi & PDO drivers active' },
    { name: 'Directory Write Permissions (/config, /uploads)', status: 'pass', desc: 'Writable (Permission 755)' },
    { name: 'SSL Security Certificate (HTTPS)', status: 'warning', desc: 'SSL active but using a development cert (Cloud Run Proxy verified)' },
    { name: 'Memory Limit Requirement (Min 256MB)', status: 'pass', desc: 'Allocated limit: 512MB' },
  ], []);

  // Simulating Database Connection Test
  const handleTestConnection = () => {
    setIsTestingConn(true);
    setDbTestLogs([]);
    setDbTestResult(null);

    const logs = [
      `[INFO] เริ่มการตรวจสอบเครือข่ายเซิร์ฟเวอร์ปลายทาง...`,
      `[INFO] ทำการเชื่อมต่อไปยังโฮสต์ฐานข้อมูล: ${dbHost}:${dbPort}`,
      `[DB] พยายามระบุสิทธิ์ของผู้ใช้ฐานข้อมูล: "${dbUser}"...`,
      `[DB] ตรวจสอบสิทธิ์การเข้าใช้งาน (Handshake Authentication)...`,
      `[DB] ดึงข้อมูลฐานข้อมูลเป้าหมาย: "${dbName}"...`,
      `[SUCCESS] ตรวจพบไดรเวอร์ MySQL/MariaDB สมบูรณ์`,
      `[SUCCESS] การแลกเปลี่ยนข้อมูล (Handshake) สำเร็จเสร็จสิ้น! สามารถเชื่อมต่อฐานข้อมูลได้เสร็จสมบูรณ์`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setDbTestLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsTestingConn(false);
        setDbTestResult('success');
      }
    }, 450);
  };

  // Simulating Actual Web Installation
  const handleStartInstallation = () => {
    setIsInstalling(true);
    setInstallProgress(0);
    setInstallLogs([]);

    const stepsLogs = [
      { prg: 5, msg: `[SYS] เริ่มต้นกระบวนการติดตั้งซอฟต์แวร์ลงบนเซิร์ฟเวอร์จำลอง...` },
      { prg: 15, msg: `[SYS] สร้างโฟลเดอร์สำหรับเขียนโครงสร้างระบบและล้างหน่วยความจำแคช...` },
      { prg: 28, msg: `[DB] กำลังเข้าถึงฐานข้อมูล "${dbName}" เพื่อสร้างตารางข้อมูลพื้นฐาน...` },
      { prg: 40, msg: `[DB] สร้างตาราง 'users' พร้อมกำหนดคีย์หลักและอินเด็กซ์ความปลอดภัยสำเร็จ` },
      { prg: 48, msg: `[DB] สร้างตาราง 'sales_records' และ 'cashflow_logs' สำหรับบันทึกยอดขายรายวัน` },
      { prg: 55, msg: `[DB] สร้างตาราง 'cheques' และกำหนดระบบเชื่อมโยงคีย์ความสัมพันธ์ต่างประเทศ` },
      { prg: 68, msg: `[AUTH] ทำการลงทะเบียนบัญชีผู้ควบคุมระบบเริ่มต้น: "${adminEmail}" (สิทธิ์ Admin)...` },
      { prg: 80, msg: `[CONF] เขียนไฟล์กำหนดค่าความปลอดภัย ".env" และ "config.json" ลงสารสนเทศระบบ...` },
      { prg: 92, msg: `[SYS] เพิ่มประสิทธิภาพฐานข้อมูลด้วยการรัน MySQL Index Optimization...` },
      { prg: 100, msg: `[SUCCESS] การติดตั้งระบบเสร็จสมบูรณ์ 100%! ทำการเปลี่ยนเส้นทางไปยังหน้าหลัก...` }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < stepsLogs.length) {
        const item = stepsLogs[currentStep];
        setInstallProgress(item.prg);
        setInstallLogs(prev => [...prev, item.msg]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsInstalling(false);
        setStep(5);
      }
    }, 700);
  };

  // Generate .env file string
  const generatedEnv = useMemo(() => {
    return `# ----------------------------------------------------
# ไฟล์กำหนดค่าความปลอดภัยแอปพลิเคชัน (Generated .env)
# ----------------------------------------------------
PORT=3000
NODE_ENV=production
APP_NAME="${siteName}"
APP_URL="https://localhost:3000"

# ระบบจัดการฐานข้อมูล (Database Configuration)
DB_HOST="${dbHost}"
DB_PORT=${dbPort}
DB_NAME="${dbName}"
DB_USER="${dbUser}"
DB_PASS="${dbPass}"

# บัญชีผู้ดูแลระบบสูงสุด (Super Administrator Profile)
ADMIN_USER="${adminUser}"
ADMIN_EMAIL="${adminEmail}"
ADMIN_PASS_HASH="${btoa(adminPass).substring(0, 16)}..." # เข้ารหัสผ่านเบื้องต้น

# กุญแจเข้ารหัสเซสชันและความปลอดภัยระดับสูง
SECRET_JWT_KEY="apiwat_jwt_secret_token_${Math.random().toString(36).substring(2, 10)}"
SESSION_LIFETIME_HOURS=12
`;
  }, [siteName, dbHost, dbPort, dbName, dbUser, dbPass, adminUser, adminEmail, adminPass]);

  // Generate config.json string
  const generatedJson = useMemo(() => {
    return `{
  "app": {
    "name": "${siteName}",
    "environment": "production",
    "themeColor": "${themeColor}",
    "debug": false
  },
  "database": {
    "host": "${dbHost}",
    "port": ${dbPort},
    "name": "${dbName}",
    "user": "${dbUser}",
    "pass": "********"
  },
  "admin": {
    "username": "${adminUser}",
    "email": "${adminEmail}"
  }
}`;
  }, [siteName, themeColor, dbHost, dbPort, dbName, dbUser, adminUser, adminEmail]);

  // Generate config.php string
  const generatedPhp = useMemo(() => {
    return `<?php
/**
 * ไฟล์กำหนดค่าการเชื่อมต่อฐานข้อมูล PHP (config.php)
 * สร้างขึ้นโดยอัตโนมัติจากระบบติดตั้งจำลอง
 */

define('DB_HOST', '${dbHost}');
define('DB_PORT', '${dbPort}');
define('DB_NAME', '${dbName}');
define('DB_USER', '${dbUser}');
define('DB_PASS', '${dbPass}');

define('APP_NAME', '${siteName}');
define('ADMIN_EMAIL', '${adminEmail}');

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die("ไม่สามารถเชื่อมต่อฐานข้อมูลได้: " . $e->getMessage());
}
`;
  }, [dbHost, dbPort, dbName, dbUser, dbPass, siteName, adminEmail]);

  // Copy to clipboard helper
  const handleCopy = (text: string, type: 'env' | 'config') => {
    navigator.clipboard.writeText(text);
    if (type === 'env') {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    }
  };

  // Download File helper
  const handleDownloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
      
      {/* Top Welcome Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ระบบช่วยเหลือ & จำลองการติดตั้งเว็บแอปพลิเคชัน</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              โปรแกรมจำลองการติดตั้งลงเซิร์ฟเวอร์จริง (Web Setup Installer Simulator)
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              ใช้ทดสอบการจำลองขั้นตอนติดตั้งแอปพลิเคชันจริง ตรวจสอบความถูกต้องของสเปคฐานข้อมูลเซิร์ฟเวอร์ ตลอดจนช่วยอำนวยความสะดวกในการสร้างชุดรหัสและไฟล์คอนฟิกสำเร็จรูปเพื่อนำไปรันจริงได้ทันที
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">ระดับขั้นตอนปัจจุบัน:</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                    step === s 
                      ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50 scale-110' 
                      : step > s 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column info panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Server className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">สถานะเซิร์ฟเวอร์ปัจจุบัน</h2>
            </div>

            <div className="space-y-3.5 text-xs">
              {serverChecks.map((check, i) => (
                <div key={i} className="space-y-1 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">{check.name}</span>
                    {check.status === 'pass' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[9.5px]">
                        ผ่าน (Pass)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-[9.5px]">
                        เตือน (Warn)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed pl-1">
                    {check.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block font-bold mb-1">เซิร์ฟเวอร์เป้าหมายของคุณพร้อมใช้งาน</span>
              <div className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> แนะนำระบบ PHP 8.1+ / Node.js 18+
              </div>
            </div>
          </div>

          <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-4 space-y-2">
            <span className="text-blue-400 text-xs font-black block uppercase tracking-wider">💡 ความปลอดภัยฐานข้อมูล</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ในระหว่างกระบวนการติดตั้งจำลอง รหัสผ่านทุกชุดจะถูกจัดการเพียงในฝั่งเบราว์เซอร์ของคุณเพื่อจำลองโครงสร้าง ไม่มีการแชร์รหัสจริงไปยังบุคคลอื่น ไฟล์กำหนดค่า (.env, config.json) ที่ได้จะมีความปลอดภัยสูงและพร้อมดาวน์โหลดนำไปบันทึก
            </p>
          </div>
        </div>

        {/* Right column main content wizard */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-850 rounded-2xl min-h-[500px] shadow-xl overflow-hidden relative">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: WELCOME SCREEN */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8 space-y-6"
              >
                <div className="text-center max-w-md mx-auto space-y-3 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner text-blue-400">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white">ยินดีต้อนรับสู่โปรแกรมช่วยการติดตั้ง</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ระบบจะช่วยจำลองและนำคุณเข้าสู่ขั้นตอนการตั้งค่าโครงสร้างเว็บ เพื่อความสะดวกในการติดตั้งระบบบนเซิร์ฟเวอร์ โฮสติ้ง หรือ Cloud ของคุณเอง
                  </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 block">สิ่งที่คุณต้องเตรียมไว้ล่วงหน้าก่อนการติดตั้งจริง:</span>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>ชื่อเว็บไซต์และข้อมูลบัญชีอีเมลสำหรับควบคุมสูงสุด</li>
                    <li>ข้อมูลการเข้าฐานข้อมูล (Database Name, User, Password, Port)</li>
                    <li>สิทธิ์การเขียนโฟลเดอร์ฝั่งเซิร์ฟเวอร์ปลายทาง</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-900">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    <span>ดำเนินการขั้นตอนถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: GENERAL APP & WEBSITE SETTINGS */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8 space-y-6"
              >
                <div className="border-b border-slate-900 pb-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Settings className="w-4.5 h-4.5 text-blue-400" />
                    <span>ขั้นตอนที่ 2: ตั้งค่าข้อมูลเว็บไซต์แอปพลิเคชัน</span>
                  </h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    กรุณากรอกชื่อร้าน/เว็บไซต์ รวมถึงข้อมูลที่อยู่บัญชีอีเมลสำหรับเข้าควบคุมระบบหลังบ้าน
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        ชื่อเว็บไซต์/ชื่อร้านค้า <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={siteName}
                          onChange={(e) => setSiteName(e.target.value)}
                          placeholder="เช่น ร้านอาหารอภิวัฒน์เครื่องครัว"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        อีเมลหลักแอดมินระบบ <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="เช่น admin@gmail.com"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        ชื่อผู้ใช้เข้าสู่ระบบแอดมิน (Username)
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={adminUser}
                          onChange={(e) => setAdminUser(e.target.value)}
                          placeholder="admin"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        รหัสผ่านสำหรับแอดมิน <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          placeholder="กรอกรหัสผ่านปลอดภัย"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-300">
                      โทนสีหลักของเว็บไซต์จำลอง
                    </label>
                    <div className="flex gap-4">
                      {[
                        { id: 'blue', name: 'น้ำเงินฟ้าคลาสสิก', class: 'bg-blue-600' },
                        { id: 'emerald', name: 'เขียวเอ็มเมอรัลด์', class: 'bg-emerald-600' },
                        { id: 'indigo', name: 'ม่วงครามอินดิโก้', class: 'bg-indigo-600' },
                        { id: 'amber', name: 'ส้มเหลืองอำพัน', class: 'bg-amber-600' }
                      ].map((item) => (
                        <label 
                          key={item.id} 
                          className="flex items-center gap-2 cursor-pointer bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300 select-none transition-all"
                        >
                          <input
                            type="radio"
                            name="theme-color"
                            value={item.id}
                            checked={themeColor === item.id}
                            onChange={() => setThemeColor(item.id)}
                            className="text-blue-500 focus:ring-0"
                          />
                          <span className={`w-3.5 h-3.5 rounded-full ${item.class}`}></span>
                          <span>{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-900">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-900 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ย้อนกลับ</span>
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    disabled={!siteName || !adminEmail || !adminPass}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>ไปตั้งค่าฐานข้อมูล</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DATABASE CONFIGURATION */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8 space-y-6"
              >
                <div className="border-b border-slate-900 pb-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Database className="w-4.5 h-4.5 text-blue-400" />
                    <span>ขั้นตอนที่ 3: ตั้งค่าและจำลองการเชื่อมต่อฐานข้อมูล (Database Connection)</span>
                  </h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    กรอกข้อมูลการโฮสฐานข้อมูล MySQL/MariaDB เพื่อรันระบบจำลองการ Ping เชื่อมต่อพอร์ตและทดสอบความถูกต้อง
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-300">โฮสต์ฐานข้อมูล (Database Host)</label>
                      <input
                        type="text"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        placeholder="เช่น 127.0.0.1 หรือ localhost"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">พอร์ตเชื่อมต่อ (Port)</label>
                      <input
                        type="number"
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        placeholder="3306"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">ชื่อฐานข้อมูล (DB Name)</label>
                      <input
                        type="text"
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        placeholder="เช่น apiwat_db"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">ผู้ใช้ฐานข้อมูล (DB User)</label>
                      <input
                        type="text"
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        placeholder="เช่น db_admin"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">รหัสผ่านฐานข้อมูล (DB Password)</label>
                      <input
                        type="text"
                        value={dbPass}
                        onChange={(e) => setDbPass(e.target.value)}
                        placeholder="กรอกรหัสผ่านฐานข้อมูล"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* TEST CONNECTION BUTTON AND TERMINAL LOG */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-200">ทดสอบการสืบค้นการเชื่อมโยงฐานข้อมูล</span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          รันระบบจำลองเพื่อตรวจสุขภาพและความเข้ากันได้ของสิทธิ์โฮสต์ฐานข้อมูล
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTestingConn || !dbHost || !dbName || !dbUser}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[11px] font-black border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isTestingConn ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                            <span>กำลัง Ping ทดสอบ...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                            <span>ทดสอบจำลองเชื่อมต่อฐานข้อมูล</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* TERMINAL LOG CONSOLE */}
                    {(dbTestLogs.length > 0 || isTestingConn) && (
                      <div className="bg-black/85 rounded-xl border border-slate-850 p-3 font-mono text-[10.5px] text-slate-300 space-y-1 max-h-40 overflow-y-auto select-none">
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500 border-b border-white/5 pb-1 mb-1">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Console Log : Database Testing Environment</span>
                        </div>
                        {dbTestLogs.map((log, index) => {
                          let color = 'text-slate-400';
                          if (log.includes('[SUCCESS]')) color = 'text-emerald-400';
                          if (log.includes('[DB]')) color = 'text-blue-400';
                          if (log.includes('[INFO]')) color = 'text-sky-300';
                          return (
                            <div key={index} className={`${color} leading-relaxed flex items-start gap-1`}>
                              <span className="text-[9px] text-slate-600 font-bold select-none">&gt;</span>
                              <span>{log}</span>
                            </div>
                          );
                        })}
                        
                        {dbTestResult === 'success' && (
                          <div className="pt-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            <span>สถานะการเชื่อมต่อ: สำเร็จเรียบร้อย! พร้อมดำเนินการติดตั้ง</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-900">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-900 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ย้อนกลับ</span>
                  </button>

                  <button
                    onClick={() => setStep(4)}
                    disabled={dbTestResult !== 'success'}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-500/25"
                  >
                    <span>ขั้นตอนถัดไป (รันติดตั้ง)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: INSTALLATION PROGRESS BAR */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8 space-y-6"
              >
                <div className="text-center max-w-md mx-auto space-y-3">
                  <h3 className="text-base font-black text-white">ขั้นตอนสุดท้าย: ดำเนินการติดตั้งระบบจำลอง</h3>
                  <p className="text-[11.5px] text-slate-400 leading-relaxed">
                    ระบบพร้อมทำการเขียนตารางฐานข้อมูลและตั้งค่าโครงสร้างเว็บเซิร์ฟเวอร์เสร็จสิ้นเพื่อผลิตไฟล์ .env และ config.json สำหรับติดตั้งจริง
                  </p>
                </div>

                {!isInstalling && installProgress === 0 ? (
                  <div className="flex justify-center py-6">
                    <button
                      onClick={handleStartInstallation}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-xl shadow-blue-500/10 flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Sparkles className="w-5 h-5 text-blue-200" />
                      <span>เริ่มกระบวนการติดตั้งลงเว็บแอป (Run Setup)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Progress slider bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                        <span>กำลังดำเนินการติดตั้ง...</span>
                        <span className="font-mono text-blue-400">{installProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${installProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Live Term Logs */}
                    <div className="bg-black border border-slate-850 rounded-xl p-4 font-mono text-[10px] text-slate-300 space-y-1.5 h-48 overflow-y-auto select-none">
                      <div className="flex items-center justify-between text-slate-500 border-b border-white/5 pb-1.5 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                          <span>System Installer Log Stream</span>
                        </span>
                        {isInstalling && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold animate-pulse">INSTALL_IN_PROGRESS</span>}
                      </div>

                      {installLogs.map((log, index) => {
                        let cl = 'text-slate-400';
                        if (log.includes('[SUCCESS]')) cl = 'text-emerald-400 font-bold';
                        if (log.includes('[DB]')) cl = 'text-blue-300';
                        if (log.includes('[AUTH]')) cl = 'text-indigo-300';
                        if (log.includes('[CONF]')) cl = 'text-amber-400';
                        return (
                          <div key={index} className={`${cl} leading-normal flex items-start gap-1`}>
                            <span className="text-slate-600 font-bold">&gt;&gt;</span>
                            <span>{log}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-900">
                  <button
                    onClick={() => setStep(3)}
                    disabled={isInstalling}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-900 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ย้อนกลับ</span>
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono self-center">
                    ระบบจำลองเซิร์ฟเวอร์เสมือน - ตรวจเช็คโครงสร้าง SQLite/MySQL
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 5: SUCCESS & FILE GENERATION DISPLAY */}
            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 md:p-8 space-y-6"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center max-w-xl mx-auto space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-md">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white">ติดตั้งระบบจำลองลงเซิร์ฟเวอร์เสร็จสมบูรณ์!</h3>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-normal">
                    ระบบได้ทดลองสร้างตารางและบันทึกผู้ใช้ แอดมินหลัก <strong className="text-emerald-400 font-mono font-bold">{adminEmail}</strong> ลงสู่ระบบจำลองแล้ว คุณสามารถคัดลอกไฟล์คอนฟิกสำเร็จรูปด้านล่างไปใช้บนเครื่องเซิร์ฟเวอร์จริงของคุณได้ทันที!
                  </p>
                </div>

                {/* FILE SWITCHING TABS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-xs font-black text-slate-300 flex items-center gap-1.5 uppercase">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <span>ไฟล์กำหนดค่าคอนฟิกสำเร็จรูป</span>
                    </span>
                    <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      {[
                        { id: 'env', label: '.env (สำหรับ Node/Docker)' },
                        { id: 'json', label: 'config.json (Node/Config)' },
                        { id: 'php', label: 'config.php (สำหรับ PHP Apache)' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setConfigType(item.id as any)}
                          className={`px-2.5 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${
                            configType === item.id 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative">
                    <div className="flex justify-between items-center bg-slate-950 px-4 py-2 border-b border-slate-800/80">
                      <span className="font-mono text-[10px] text-slate-500">
                        {configType === 'env' ? '.env' : configType === 'json' ? 'config.json' : 'config.php'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(
                            configType === 'env' ? generatedEnv : configType === 'json' ? generatedJson : generatedPhp, 
                            'env'
                          )}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedEnv ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>คัดลอกโค้ด</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownloadFile(
                            configType === 'env' ? '.env' : configType === 'json' ? 'config.json' : 'config.php',
                            configType === 'env' ? generatedEnv : configType === 'json' ? generatedJson : generatedPhp
                          )}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-blue-400" />
                          <span>ดาวน์โหลดไฟล์</span>
                        </button>
                      </div>
                    </div>

                    <pre className="p-4 overflow-x-auto font-mono text-[11px] text-slate-300 leading-relaxed max-h-72 select-text bg-slate-900/40">
                      <code>
                        {configType === 'env' && generatedEnv}
                        {configType === 'json' && generatedJson}
                        {configType === 'php' && generatedPhp}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => { setStep(1); setDbTestResult(null); setDbTestLogs([]); }}
                    className="px-5 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-900 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>จำลองตั้งค่าเริ่มต้นใหม่อีกครั้ง</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
