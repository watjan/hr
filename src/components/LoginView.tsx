import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  User, 
  Lock, 
  Key, 
  AlertCircle, 
  Building2, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle,
  HelpCircle,
  Briefcase,
  UserCheck,
  Send,
  Users
} from 'lucide-react';
import { UserRole, UserSession, EmployeeSalary, TestUser } from '../types';
import { INITIAL_EMPLOYEES } from '../mockData';

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

const PRESET_USERS: TestUser[] = [
  {
    username: 'admin',
    password: 'admin123',
    displayName: 'อภิวัฒน์ เกียรติสกุล',
    role: 'admin',
    department: 'ฝ่ายบริหาร (Management)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    desc: 'เข้าถึงสิทธิ์ผู้เข้าดูแลระบบ (Full Admin Access) สามารถดูและแก้ไขได้ทุกโมดูล',
    color: 'from-amber-550 to-orange-600 bg-amber-500/10 border-amber-550/30 text-amber-600 dark:text-amber-400',
    allowedTabs: ['แดชบอร์ด', 'ตั้งค่าระบบ', 'ทะเบียนพนักงาน', 'เงินเดือน', 'บันทึกเวลา/มาสาย/การลา', 'ยอดขาย', 'เช็คธนาคาร']
  },
  {
    username: 'hr',
    password: 'hr123',
    displayName: 'นพเก้า มิ่งขวัญศิริ',
    role: 'hr',
    department: 'ทรัพยากรบุคคล (HR Dept)',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    desc: 'งานบริหารจัดการพนักงาน บันทึกการเข้างาน-เวลามาสาย แจ้งใบลา และสลิปเงินเดือนเบื้องต้น',
    color: 'from-emerald-550 to-teal-600 bg-emerald-500/10 border-emerald-550/30 text-emerald-600 dark:text-emerald-400',
    allowedTabs: ['แดชบอร์ด', 'ทะเบียนพนักงาน', 'เงินเดือน (ดู)', 'บันทึกเวลา/มาสาย/การลา']
  },
  {
    username: 'accountant',
    password: 'acc123',
    displayName: 'ศรุตรา เลียบคงเกียรติ',
    role: 'accountant',
    department: 'บัญชีและการเงิน (Accounting)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    desc: 'สำหรับฝ่ายบัญชี จัดการสถิติยอดรายวัน รายเดือน สิทธิและสารสนเทศระบบควบคุมเรื่องเช็ครับ-จ่าย',
    color: 'from-indigo-550 to-purple-600 bg-indigo-500/10 border-indigo-550/30 text-indigo-650 dark:text-indigo-450',
    allowedTabs: ['แดชบอร์ด', 'เงินเดือนพนักงาน', 'ยอดขาย (Sales)', 'เช็คขารับ-เช็คขาจ่าย']
  },
  {
    username: 'sales',
    password: 'sales123',
    displayName: 'ธีรเดช ตันติเวชกุล',
    role: 'sales',
    department: 'พนักงานขายหน้าร้าน (Sales Representative)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    desc: 'จำกัดขอบเขตงานเฉพาะตรวจสอบบันทึกยอดขายรายวันและคำนวณสถิติยอดรวมเป้าหมายรายปี',
    color: 'from-blue-550 to-sky-600 bg-blue-500/10 border-blue-550/30 text-blue-600 dark:text-blue-400',
    allowedTabs: ['แดชบอร์ด', 'บันทึกยอดขายรายวัน (Sales)']
  },
];

export default function LoginView({ onLogin }: LoginViewProps) {
  // Login modes: 'management' | 'employee'
  const [loginMode, setLoginMode] = useState<'management' | 'employee'>('employee'); // default to employee space as highlighted in the user request
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [selectedPresetUser, setSelectedPresetUser] = useState<TestUser | null>(null);
  const [localUsers, setLocalUsers] = useState<TestUser[]>([]);
  
  // Employees list for visual lookup
  const [employeeList, setEmployeeList] = useState<EmployeeSalary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSalary | null>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeePassword, setEmployeePassword] = useState('123456'); // Simple standard passcode default

  // On mount, load simulation content
  useEffect(() => {
    // 1. Management users
    const saved = localStorage.getItem('sapphire_users');
    if (saved) {
      try {
        setLocalUsers(JSON.parse(saved));
      } catch (e) {
        setLocalUsers(PRESET_USERS);
        localStorage.setItem('sapphire_users', JSON.stringify(PRESET_USERS));
      }
    } else {
      setLocalUsers(PRESET_USERS);
      localStorage.setItem('sapphire_users', JSON.stringify(PRESET_USERS));
    }

    // 2. Employees registry for lookup
    const savedEmployees = localStorage.getItem('hr_employees');
    if (savedEmployees) {
      try {
        const parsed = JSON.parse(savedEmployees);
        setEmployeeList(parsed);
        if (parsed.length > 0) {
          setSelectedEmployee(parsed[0]);
        }
      } catch (e) {
        setEmployeeList(INITIAL_EMPLOYEES);
        if (INITIAL_EMPLOYEES.length > 0) {
          setSelectedEmployee(INITIAL_EMPLOYEES[0]);
        }
      }
    } else {
      setEmployeeList(INITIAL_EMPLOYEES);
      if (INITIAL_EMPLOYEES.length > 0) {
        setSelectedEmployee(INITIAL_EMPLOYEES[0]);
      }
    }
  }, []);

  // Handler for Management Form login
  const handleManagementLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('❌ กรุณากรอกบัญชีล็อกอินและรหัสผ่าน');
      return;
    }

    const matchedUser = localUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (matchedUser) {
      triggerSuccess(matchedUser);
    } else {
      setErrorMessage('❌ รหัสผ่านไม่ถูกต้อง หรือไม่มีชื่อผู้ใช้งานนี้ในระบบจัดการ');
    }
  };

  // Handler for Employee Portal login
  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedEmployee) {
      setErrorMessage('❌ กรุณาเลือกชื่อพนักงานที่ประสงค์ล็อกอินเพื่อยื่นเอกสารการลา');
      return;
    }

    if (!employeePassword.trim()) {
      setErrorMessage('❌ กรุณากรอกรหัสผ่านควบคุมพนักงาน (รหัสเริ่มต้นของทุกคนคือ 123456)');
      return;
    }

    // Accept standard passcode 123456 or EmployeeId for fast testing
    if (employeePassword.trim() === '123456' || employeePassword.trim() === selectedEmployee.employeeId) {
      // successful login as employee
      setSuccessAnimation(true);
      
      const session: UserSession = {
        username: selectedEmployee.employeeId.toLowerCase(),
        displayName: selectedEmployee.name,
        role: 'employee',
        department: selectedEmployee.position, // display position
        avatarUrl: selectedEmployee.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        loginTime: new Date().toLocaleTimeString('th-TH'),
        employeeId: selectedEmployee.id // capture ID reference
      };

      setTimeout(() => {
        onLogin(session);
      }, 1200);
    } else {
      setErrorMessage('❌ รหัสผ่านพนักงานไม่ถูกต้อง (กรอกรหัสเริ่มต้น "123456" เพื่อเข้าสู่ระบบอย่างง่าย)');
    }
  };

  const triggerSuccess = (u: TestUser) => {
    setSuccessAnimation(true);
    const session: UserSession = {
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      department: u.department,
      avatarUrl: u.avatarUrl,
      loginTime: new Date().toLocaleTimeString('th-TH')
    };

    setTimeout(() => {
      onLogin(session);
    }, 1200);
  };

  const selectPreset = (u: TestUser) => {
    setSelectedPresetUser(u);
    setUsername(u.username);
    setPassword(u.password);
    setErrorMessage('');
  };

  // Filter employees list for easy lookup
  const filteredEmployeesList = employeeList.filter(emp => 
    emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) || 
    emp.employeeId.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] rounded-full bg-indigo-900/25 blur-[140px] pointer-events-none" />
      
      {/* Top Professional Brand Banner */}
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9.5 h-9.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white text-sm font-extrabold tracking-wide">บริษัทอภิวัฒน์เครื่องครัว จำกัด</h1>
            <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest block font-mono">Sapphire HR Enterprise</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>ระบบรักษาความปลอดภัยเฉพาะทางองค์กร (Security Core Enabled)</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Dynamic Text Intro & Tab Switcher Info (5 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Portal Version 26.2 Dedicated
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-[1.2]">
              ยินดีต้อนรับสู่ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">ระบบบริหารงานบุคคล</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              ศูนย์บริการสารสนเทศแบบรวบยอด คีย์ข้อมูลยอดขาย ตรวจบัญชีเคลียร์เช็คของฝ่ายบัญชี 
              รวมถึงพอร์ทัลเพื่ออำนวยการยื่นใบคำร้องการลาป่วย ลากิจ ท่องเที่ยว สะดวกสบายสำหรับพนักงานทุกระดับ
            </p>
          </div>

          {/* Quick Tab Switcher Actions */}
          <div className="bg-slate-950/70 p-1.5 border border-slate-850 rounded-2xl space-y-1.5 shadow-lg">
            <p className="text-[10px] font-black uppercase text-indigo-400 px-2 mt-1 tracking-wider">เลือกช่องทางยืนยันตนเข้าใช้งาน:</p>
            
            <button
              type="button"
              onClick={() => {
                setLoginMode('employee');
                setErrorMessage('');
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between border cursor-pointer transition-all ${
                loginMode === 'employee'
                  ? 'bg-blue-600/10 border-blue-500 text-blue-300'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4.5 h-4.5 text-blue-400" />
                <div className="min-w-0">
                  <h4 className="text-xs font-black">1. หน้าพนักงานทั่วไปยื่นใบขอลา</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">พนักงานลาป่วย ลากิจ ส่งเอกสารหลักฐานผ่านระบบ</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('management');
                setErrorMessage('');
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between border cursor-pointer transition-all ${
                loginMode === 'management'
                  ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4.5 h-4.5 text-indigo-400" />
                <div className="min-w-0">
                  <h4 className="text-xs font-black">2. ฝ่ายบริหาร / ผู้จัดการระบบ</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">ฝ่ายบุคคล, ฝ่ายบัญชีการเงิน, บันทึกยอดขาย, คุมเช็ค</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Quick note on standard password */}
          <div className="p-3.5 bg-slate-950/45 border border-slate-850/80 rounded-xl text-[10.5px] text-slate-500 leading-relaxed font-semibold">
            📢 <strong>คำชี้แจงสำหรับพนักงาน:</strong> ทุกคนในทะเบียนบริษัทสามารถใช้ชื่อพนักงานเพื่อเข้าสู่ระบบพนักงานได้ทันที โดยระบุรหัสพาสเวิร์ดเริ่มต้นคือ <span className="text-blue-400 font-mono">123456</span> เพื่อยื่นใบลาด้วยตนเองได้อย่างอิสระ
          </div>
        </div>

        {/* Right Side: The Form Card with beautiful inner layout (8 Cols) */}
        <div className="lg:col-span-8 relative">
          
          <AnimatePresence mode="wait">
            
            {/* EMPLOYEE PORTAL LOGIN INTERFACE */}
            {loginMode === 'employee' && (
              <motion.div
                key="employee-login-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/35 text-blue-400 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">พอร์ทัลล็อกอินเฉพาะพนักงานเพื่อขออนุมัติลา</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">กรุณาคลิกเลือกบัญชีใบหน้าของคุณด้านล่างเพื่อทำการเข้าระบบพนักงาน</p>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs font-bold leading-relaxed">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Left subgrid: Employee list selector (7 cols) */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-black flex items-center gap-1.5 uppercase tracking-wide">
                        <Users className="w-3.5 h-3.5 text-indigo-400" /> ค้นหา & คลิกเลือกชื่อพนักงานของคุณ:
                      </label>
                      <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md font-mono">
                        {filteredEmployeesList.length} รายชื่อ
                      </span>
                    </div>

                    {/* Simple search bar inside */}
                    <input 
                      type="text"
                      placeholder="พิมพ์ค้นหาชื่อ หรือรหัสพนักงาน..."
                      value={employeeSearchTerm}
                      onChange={e => setEmployeeSearchTerm(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-medium"
                    />

                    {/* Scrollable grid picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {filteredEmployeesList.map((emp) => {
                        const isChosen = selectedEmployee?.id === emp.id;
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setErrorMessage('');
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                              isChosen 
                                ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/30' 
                                : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
                            }`}
                          >
                            <img 
                              src={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                              alt={emp.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover shrink-0 select-none"
                            />
                            <div className="min-w-0">
                              <h4 className="text-[11px] text-slate-200 font-black truncate">{emp.name}</h4>
                              <p className="text-[9px] text-slate-500 font-mono truncate">{emp.employeeId} • {emp.position.split(' ')[0]}</p>
                            </div>
                          </button>
                        );
                      })}

                      {filteredEmployeesList.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-slate-500 text-xs font-semibold">
                          ไม่พบพนักงานในระบบคำขอคีย์ข้อมูล
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right subgrid: Selected employee pass fields (5 cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between bg-slate-900/40 p-4 border border-slate-850 rounded-xl space-y-4">
                    {selectedEmployee ? (
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        
                        {/* Chosen Indicator details */}
                        <div className="text-center space-y-1.5 pb-3 border-b border-slate-800/80">
                          <img 
                            src={selectedEmployee.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                            alt={selectedEmployee.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover mx-auto select-none border border-slate-700"
                          />
                          <div>
                            <h4 className="text-xs font-black text-slate-100">{selectedEmployee.name}</h4>
                            <span className="text-[10px] text-blue-400 font-bold tracking-wider uppercase font-mono">{selectedEmployee.employeeId}</span>
                          </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">กรอกรหัสพนักงาน (Passcode):</label>
                          <div className="relative">
                            <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                            <input
                              type="password"
                              placeholder="รหัสเริ่มต้น 123456"
                              value={employeePassword}
                              onChange={e => {
                                setEmployeePassword(e.target.value);
                                setErrorMessage('');
                              }}
                              className="w-full text-xs p-2 pl-8.5 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none text-white font-mono font-black"
                            />
                          </div>
                        </div>

                        {/* Login Button */}
                        <button
                          type="button"
                          onClick={handleEmployeeLogin}
                          disabled={successAnimation}
                          className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 rounded-lg text-white font-black text-[11px] tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all pr-4 shadow-sm"
                        >
                          {successAnimation ? (
                            <span>เข้าระบบพนักงานสำเร็จ...</span>
                          ) : (
                            <>
                              <span>ล็อกอินพนักงานเพื่อขอลา</span>
                              <Send className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>

                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-xs font-medium my-auto">
                        📍 โปรดเลือกชื่อเพื่อนร่วมงานจากกล่องซ้ายเพื่อลงบันทึกใบสมัครยื่นลา
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* MANAGEMENT LOGIN INTERFACE */}
            {loginMode === 'management' && (
              <motion.div
                key="management-login-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl"
              >
                
                {/* Left col inside Card: Presets account rapid pickers (7 cols) */}
                <div className="lg:col-span-7 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-950">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      บัญชีบริหารจัดการทดสอบสิทธิ์ (Quick Role Pick)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {localUsers.map((user) => {
                      const isSelected = selectedPresetUser?.username === user.username;
                      return (
                        <button
                          key={user.username}
                          type="button"
                          onClick={() => selectPreset(user)}
                          className={`p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer group ${
                            isSelected 
                              ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500/40' 
                              : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={user.avatarUrl} 
                              alt={user.displayName}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0 select-none"
                            />
                            <div className="min-w-0">
                              <h4 className="text-[10.5px] text-white font-black truncate">{user.displayName}</h4>
                              <span className="text-[8.5px] uppercase font-black px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300">
                                {user.role}
                              </span>
                            </div>
                          </div>
                          <p className="text-[9.5px] text-slate-400 mt-1.5 font-medium leading-relaxed group-hover:text-slate-350 line-clamp-2">
                            {user.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right col inside Card: Manual Form parameters inputs (5 cols) */}
                <form onSubmit={handleManagementLogin} className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="text-center pb-2 border-b border-slate-900">
                      <h4 className="text-xs font-black text-white">ลงชื่อเข้าฝ่ายจัดจัดการ (Credentials)</h4>
                      <p className="text-[10px] text-slate-500">สำหรับไอดีฝ่ายบริหาร งานบุคคล การเงิน</p>
                    </div>

                    {errorMessage && (
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-1.5 text-rose-400 text-[11px] font-bold leading-relaxed">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Username input */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">ชื่อบัญล็อกอิน (Username):</label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="เช่น admin หรือ hr"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value.trim());
                            setErrorMessage('');
                          }}
                          className="w-full text-xs p-2 pl-8.5 bg-slate-900 border border-slate-850 rounded-lg focus:outline-none text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Password input */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">รหัสเข้ารักษาปลอดภัย (Password):</label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="กรอกรหัสผ่านลับ"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrorMessage('');
                          }}
                          className="w-full text-xs p-2 pl-8.5 pr-8 bg-slate-900 border border-slate-850 rounded-lg focus:outline-none text-white font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={successAnimation}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 rounded-xl text-white font-black text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md mt-4 shadow-indigo-500/10 active:scale-98"
                  >
                    {successAnimation ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400 animate-bounce" />
                        <span>กำลังเดินทางเชื่อมระบบ...</span>
                      </>
                    ) : (
                      <>
                        <span>เข้าสู่ระบบรักษาความปลอดภัย</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* Footer system credit line */}
      <div className="px-6 py-4 bg-slate-950/60 text-slate-500 text-[10px] sm:text-xs flex flex-col sm:flex-row justify-between items-center z-10 border-t border-slate-800 relative select-none">
        <p className="font-semibold text-slate-500">
          © {new Date().getFullYear()} บริษัทอภิวัฒน์เครื่องครัว จำกัด • ระบบ Sapphire HR Platform สงวนสิทธิ์ความปลอดภัยสูงสุด
        </p>
        <p className="font-mono text-[9px] text-slate-600 font-bold mt-1.5 sm:mt-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
          Cloud Secure Engine Client • stable: 2026-production
        </p>
      </div>

    </div>
  );
}
