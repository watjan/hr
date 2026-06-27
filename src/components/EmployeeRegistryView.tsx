import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Search, 
  X, 
  Check, 
  Tag, 
  Briefcase,
  Layers,
  Image as ImageIcon,
  AlertCircle,
  TrendingUp,
  Award,
  UserCheck,
  Coins,
  BarChart3,
  Cpu,
  Wifi
} from 'lucide-react';
import { EmployeeSalary, Department } from '../types';

interface EmployeeRegistryViewProps {
  employees: EmployeeSalary[];
  departments: Department[];
  onAddEmployee: (newEmp: EmployeeSalary) => void;
  onUpdateEmployee: (updatedEmp: EmployeeSalary) => void;
  onDeleteEmployee: (id: string) => void;
}

// 6 beautiful preset avatar images
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
];

export default function EmployeeRegistryView({
  employees,
  departments,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}: EmployeeRegistryViewProps) {
  // Filters & Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [viewMode, setViewMode] = useState<'visa-cards' | 'table'>('visa-cards');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeSalary | null>(null);
  const [deleteConfirmEmp, setDeleteConfirmEmp] = useState<EmployeeSalary | null>(null);

  // Form Fields State
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [position, setPosition] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('ธนาคารกสิกรไทย');
  const [paymentPeriod, setPaymentPeriod] = useState<'1' | '2'>('1');
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily'>('monthly');
  const [workedDays, setWorkedDays] = useState<number>(15);
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [useCustomAvatar, setUseCustomAvatar] = useState(false);
  const [branch, setBranch] = useState('สำนักงานใหญ่');

  // Filter & Search Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.departmentId === selectedDept;
    const matchesBranch = selectedBranch === 'all' || (emp.branch || 'สำนักงานใหญ่') === selectedBranch;
    return matchesSearch && matchesDept && matchesBranch;
  });

  // Handle Open Add Form
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setEmployeeId(`EMP${String(employees.length + 1).padStart(3, '0')}`);
    setName('');
    setDepartmentId(departments[0]?.id || '');
    setPosition('');
    setBaseSalary(25000); // Decent default
    setWorkedDays(15);
    setBankAccount('');
    setBankName('ธนาคารกสิกรไทย');
    setPaymentPeriod('1');
    setSalaryType('monthly');
    setStartDate(new Date().toISOString().substring(0, 10));
    setAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setCustomAvatarUrl('');
    setUseCustomAvatar(false);
    setBranch('สำนักงานใหญ่');
    setIsModalOpen(true);
  };

  // Handle Open Edit Form
  const handleOpenEdit = (emp: EmployeeSalary) => {
    setEditingEmployee(emp);
    setEmployeeId(emp.employeeId);
    setName(emp.name);
    setDepartmentId(emp.departmentId);
    setPosition(emp.position);
    setBaseSalary(emp.baseSalary);
    setWorkedDays(emp.workedDays !== undefined ? emp.workedDays : 15);
    setBankAccount(emp.bankAccount);
    setBankName(emp.bankName || 'ธนาคารกสิกรไทย');
    setPaymentPeriod(emp.paymentPeriod || '1');
    setSalaryType(emp.salaryType || 'monthly');
    setStartDate(emp.startDate || new Date().toISOString().substring(0, 10));
    setBranch(emp.branch || 'สำนักงานใหญ่');
    
    const isPreset = PRESET_AVATARS.includes(emp.avatar || '');
    if (emp.avatar) {
      if (isPreset) {
        setAvatar(emp.avatar);
        setUseCustomAvatar(false);
      } else {
        setCustomAvatarUrl(emp.avatar);
        setUseCustomAvatar(true);
      }
    } else {
      setAvatar(PRESET_AVATARS[0]);
      setUseCustomAvatar(false);
    }
    setIsModalOpen(true);
  };

  // Handle Submit (Create/Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim()) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    const finalAvatar = useCustomAvatar ? (customAvatarUrl.trim() || PRESET_AVATARS[0]) : avatar;

    const payload: EmployeeSalary = {
      id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
      employeeId,
      name,
      departmentId,
      position,
      baseSalary: Number(baseSalary),
      workedDays: Number(workedDays),
      bonus: editingEmployee ? editingEmployee.bonus : 0,
      deduction: editingEmployee ? editingEmployee.deduction : 0,
      paymentStatus: editingEmployee ? editingEmployee.paymentStatus : 'pending',
      bankAccount,
      bankName,
      paymentPeriod,
      salaryType,
      startDate,
      avatar: finalAvatar,
      branch,
      createdAt: editingEmployee?.createdAt || new Date().toISOString(),
      socialSecurity: editingEmployee?.socialSecurity
    };

    if (editingEmployee) {
      onUpdateEmployee(payload);
    } else {
      // Check duplicate ID
      const exists = employees.some(e => e.employeeId.toLowerCase() === employeeId.toLowerCase());
      if (exists) {
        if (!confirm("พบรหัสพนักงานซ้ำซ้อนในระบบ ยืนยันการลงทะเบียนด้วยรหัสพนักงานนี้หรือไม่?")) {
          return;
        }
      }
      onAddEmployee(payload);
    }

    setIsModalOpen(false);
  };

  // Handle Delete with explicit confirmation warning
  const handleDeleteClick = (emp: EmployeeSalary) => {
    setDeleteConfirmEmp(emp);
  };

  const executeDelete = (emp: EmployeeSalary) => {
    onDeleteEmployee(emp.id);
    setDeleteConfirmEmp(null);
  };

  const getDeptName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name.split(' (')[0] : 'ไม่ระบุแผนก';
  };

  const getCardTheme = (deptId: string) => {
    const deptName = getDeptName(deptId).toLowerCase();
    
    if (deptName.includes('บริหาร') || deptName.includes('ผู้บริหาร') || deptName.includes('admin') || deptName.includes('hr') || deptName.includes('ทรัพยากร')) {
      return {
        bg: 'bg-gradient-to-br from-blue-950 via-sky-900 to-indigo-900',
        text: 'text-sky-100',
        accent: 'text-sky-300',
        chipBorder: 'border-sky-500/30',
        hologram: 'from-cyan-400 via-blue-500 to-indigo-600',
        visaType: 'VISA PLATINUM',
        glow: 'shadow-blue-950/40',
        pattern: 'circuit'
      };
    }
    if (deptName.includes('บัญชี') || deptName.includes('การเงิน') || deptName.includes('account')) {
      return {
        bg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900',
        text: 'text-cyan-100',
        accent: 'text-cyan-400',
        chipBorder: 'border-cyan-500/30',
        hologram: 'from-teal-400 via-cyan-500 to-blue-600',
        visaType: 'VISA SIGNATURE',
        glow: 'shadow-cyan-950/35',
        pattern: 'grid'
      };
    }
    if (deptName.includes('ขาย') || deptName.includes('การตลาด') || deptName.includes('sale') || deptName.includes('market')) {
      return {
        bg: 'bg-gradient-to-br from-indigo-950 via-blue-900 to-sky-950',
        text: 'text-blue-100',
        accent: 'text-amber-300',
        chipBorder: 'border-blue-500/30',
        hologram: 'from-amber-400 via-sky-300 to-blue-600',
        visaType: 'VISA INFINITE',
        glow: 'shadow-indigo-950/40',
        pattern: 'waves'
      };
    }
    if (deptName.includes('ผลิต') || deptName.includes('โรงงาน') || deptName.includes('it') || deptName.includes('operation') || deptName.includes('ขนส่ง')) {
      return {
        bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950',
        text: 'text-slate-100',
        accent: 'text-sky-400',
        chipBorder: 'border-slate-500/30',
        hologram: 'from-cyan-500 via-indigo-400 to-sky-500',
        visaType: 'VISA PREMIUM',
        glow: 'shadow-slate-950/40',
        pattern: 'diagonal'
      };
    }
    return {
      bg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900',
      text: 'text-blue-100',
      accent: 'text-slate-300',
      chipBorder: 'border-blue-500/30',
      hologram: 'from-sky-400 via-cyan-400 to-blue-500',
      visaType: 'VISA BUSINESS',
      glow: 'shadow-blue-950/40',
      pattern: 'dots'
    };
  };

  const formatMemberSince = (dateStr?: string) => {
    if (!dateStr) return '01/26';
    try {
      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).substring(2);
      return `${mm}/${yy}`;
    } catch {
      return '01/26';
    }
  };

  const formatBankAccount = (acc?: string) => {
    if (!acc) return '•••• •••• ••••';
    const clean = acc.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      return `${clean.substring(0, 3)}-${clean.charAt(3)}-${clean.substring(4, 9)}-${clean.charAt(9)}`;
    }
    return acc;
  };

  const generateUniqueCardNumber = (empId: string, employeeId: string) => {
    // Generate deterministic yet unique random-looking sequences using hash
    let hash1 = 0;
    let hash2 = 0;
    const combined = (empId || '') + (employeeId || '');
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash1 = (hash1 << 5) - hash1 + char;
      hash1 |= 0;
      hash2 = (hash2 << 7) - hash2 + char + i;
      hash2 |= 0;
    }
    const s1 = Math.abs(hash1).toString().padEnd(8, '7');
    const s2 = Math.abs(hash2).toString().padEnd(8, '3');
    
    // Card starts with 4 (Visa)
    const part1 = "4" + s1.substring(0, 3);
    const part2 = s1.substring(3, 7);
    const part3 = s2.substring(0, 4);
    const part4 = s2.substring(4, 8);
    
    return `${part1}  ${part2}  ${part3}  ${part4}`;
  };

  // คำนวณสถิติทะเบียนประวัติและพนักงานเชิงรุกแบบรีลไทม์ (Real-time Demographics Dashboard)
  const statsTotalCount = employees.length;
  const statsMonthlyCount = employees.filter(emp => emp.salaryType !== 'daily').length;
  const statsDailyCount = employees.filter(emp => emp.salaryType === 'daily').length;

  const totalBaseMonthlyBudget = employees.reduce((acc, emp) => {
    // ถ้ารายวัน ให้คูณประมาณการณ์จำนวนวันทำงานเพื่อประเมินงดจ่าย
    const days = emp.workedDays !== undefined ? emp.workedDays : 26;
    const monthlyAmt = emp.salaryType === 'daily' ? emp.baseSalary * days : emp.baseSalary;
    return acc + monthlyAmt;
  }, 0);

  const statsAverageBaseSalary = statsTotalCount > 0 
    ? Math.round(employees.reduce((acc, emp) => acc + emp.baseSalary, 0) / statsTotalCount) 
    : 0;

  // ตรวจสอบพนักงานใหม่ที่เข้าทำงานในปีปัจจุบัน 2568-2569 (2025-2026)
  const statsNewHiresCount = employees.filter(emp => {
    if (!emp.startDate) return false;
    const parts = emp.startDate.split('-');
    const year = parseInt(parts[0], 10);
    return year === 2026 || year === 2025;
  }).length;

  return (
    <div className="space-y-6">
      {/* Upper Status Line */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 rounded-xl border border-blue-50 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            ข้อมูลพนักงานทั้งหมดในทะเบียนปัจจุบัน ({filteredEmployees.length} คน)
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">จัดการข้อมูลโปรไฟล์ประวัติ รูปถ่ายพนักงาน วันเริ่มงาน และรายละเอียดการรับเงินเดิอนประกอบการประมวลผล</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          ลงทะเบียนพนักงานใหม่
        </button>
      </div>

      {/* ส่วนรายงานสารสนเทศสถิติข้อมูลกําลังพลแบบเรียลไทม์ (Employee Demographics Dashboard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* การ์ด 1: จำนวนกำลังคนรวม */}
        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-550" style={{ backgroundColor: '#2563eb' }} />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider block text-slate-500">จำนวนบุคลากรรวม</span>
              <span className="text-lg sm:text-2xl font-black text-slate-800 mt-1 block">
                {statsTotalCount} <span className="text-xs font-bold text-slate-500">คน</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
            <span className="text-emerald-700 flex items-center gap-0.5 font-bold">
              <UserCheck className="w-3.5 h-3.5 inline" /> รายเดือน: {statsMonthlyCount}
            </span>
            <span className="text-indigo-600 flex items-center gap-0.5 ml-1 font-bold">
              • รายวัน: {statsDailyCount}
            </span>
          </div>
        </div>

        {/* การ์ด 2: พนักงานเข้าใหม่ */}
        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-555" style={{ backgroundColor: '#10b981' }} />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider block text-slate-500">พนักงานเข้าใหม่ (2568-2569)</span>
              <span className="text-lg sm:text-2xl font-black text-slate-800 mt-1 block">
                +{statsNewHiresCount} <span className="text-xs font-bold text-slate-500">คน</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-500" /> 
            พร้อมคุ้มครองสิทธิ์ประกันสังคมสะสม
          </div>
        </div>

        {/* การ์ด 3: ยอดเงินรวมมูลฐานรายเดือน */}
        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-555" style={{ backgroundColor: '#6366f1' }} />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider block text-slate-500">งบเงินเดือนมูลฐานโดยประมาณ</span>
              <span className="text-lg sm:text-2xl font-mono font-black text-indigo-700 mt-1 block">
                ฿{totalBaseMonthlyBudget.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
            เฉลี่ยตามงวดจ่าย: ประจำเดือน
          </div>
        </div>

        {/* การ์ด 4: เงินเดือนมูลฐานเฉลี่ยต่อคน */}
        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-555" style={{ backgroundColor: '#f59e0b' }} />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider block text-slate-500">ฐานอัตราจ้างเฉลี่ยต่อคน</span>
              <span className="text-lg sm:text-2xl font-mono font-black text-amber-700 mt-1 block">
                ฿{statsAverageBaseSalary.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
            ฐานสำหรับจัดสรรสวัสดิการพนักงาน
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col xl:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัสพนักงาน, ชื่อ-นามสกุล, หรือตำแหน่งงาน..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs md:text-sm pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/10"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="w-full sm:w-48">
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full text-xs md:text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold h-10"
            >
              <option value="all">📁 แสดงแผนกทั้งหมด</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-44">
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="w-full text-xs md:text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold h-10"
            >
              <option value="all">📍 แสดงสาขาทั้งหมด</option>
              <option value="สำนักงานใหญ่">🏢 สำนักงานใหญ่</option>
              <option value="สาขาควนขนุน">📍 สาขาควนขนุน</option>
              <option value="สาขาพัทลุง">📍 สาขาพัทลุง</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-100/80 p-1 rounded-lg flex items-center justify-between h-10">
            <button
              type="button"
              onClick={() => setViewMode('visa-cards')}
              className={`flex-1 h-full px-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'visa-cards'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>บัตร (Visa)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex-1 h-full px-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ตาราง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employee List Grid & Table */}
      {viewMode === 'visa-cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-400">
              <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto">
                <Users className="w-10 h-10 text-slate-300" />
                <p className="font-semibold text-slate-500">ไม่พบข้อมูลพนักงานตามตัวกรองดังกล่าว</p>
                <p className="text-[11px] text-slate-400">แก้คำค้นหาหรือคลิกปุ่มลงทะเบียนพนักงานใหม่เพื่อเริ่มต้นได้ทันที</p>
              </div>
            </div>
          ) : (
            filteredEmployees.map(emp => {
              const hasPresetAvatar = emp.avatar && emp.avatar.startsWith('http');
              const theme = getCardTheme(emp.departmentId);
              const formattedSince = formatMemberSince(emp.startDate);
              const formattedAcc = formatBankAccount(emp.bankAccount);
              const deptName = getDeptName(emp.departmentId);

              return (
                <motion.div
                  key={emp.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 aspect-[1.586/1] w-full min-w-[260px] max-w-full ${theme.bg} ${theme.glow} border border-white/10 flex flex-col justify-between p-3.5 text-white select-none group`}
                >
                  {/* Gloss Overlays / Shimmer */}
                  <div className="bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-60 pointer-events-none absolute inset-0 z-10" />
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full blur-xl pointer-events-none" />

                  {/* Graphic Patterns Overlay */}
                  {theme.pattern === 'grid' && (
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff07_1px,transparent_1px)] bg-[size:10px_10px] opacity-70 pointer-events-none" />
                  )}
                  {theme.pattern === 'dots' && (
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-[size:6px_6px] opacity-80 pointer-events-none" />
                  )}
                  {theme.pattern === 'circuit' && (
                    <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="stroke-white" strokeWidth="0.75" fill="none">
                        <path d="M 0,20 L 40,20 L 60,40 L 120,40 M 80,40 L 95,55 L 150,55" />
                        <circle cx="120" cy="40" r="1.5" fill="white" />
                        <circle cx="150" cy="55" r="1.5" fill="white" />
                        <path d="M 200,10 L 180,30 L 140,30 L 130,40" />
                        <circle cx="200" cy="10" r="1.5" fill="white" />
                      </svg>
                    </div>
                  )}
                  {theme.pattern === 'waves' && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="stroke-white" strokeWidth="0.75" fill="none">
                        <path d="M 0,30 Q 50,10 100,40 T 200,20 T 300,50" />
                        <path d="M 0,50 Q 60,25 120,60 T 240,40 T 360,70" opacity="0.4" />
                      </svg>
                    </div>
                  )}
                  {theme.pattern === 'diagonal' && (
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[size:14px_14px] opacity-80 pointer-events-none" />
                  )}

                  {/* Top Bar of the Card */}
                  <div className="flex justify-between items-start z-10 w-full">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[7.5px] sm:text-[8px] font-black text-sky-300 tracking-wide truncate block leading-none">
                        บริษัท อภิวัฒน์เครื่องครัว จำกัด
                      </span>
                      <div className="flex items-center gap-1 opacity-80 mt-0.5">
                        <CreditCard className="w-2.5 h-2.5 text-sky-400" />
                        <span className="text-[7px] font-black tracking-widest text-slate-300 uppercase font-sans">
                          STAFF CARD
                        </span>
                      </div>
                    </div>
                    <span className="text-[7.5px] px-1.5 py-0.2 rounded bg-white/10 border border-white/15 text-slate-100 font-extrabold font-sans shrink-0">
                      {emp.branch || 'สำนักงานใหญ่'}
                    </span>
                  </div>

                  {/* Middle Content of the Card (Chip, Photo, Numbers) */}
                  <div className="flex gap-3.5 items-center my-0.5 z-10">
                    {/* Security Portrait Photo */}
                    <div className="relative shrink-0">
                      {hasPresetAvatar ? (
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          referrerPolicy="no-referrer"
                          className="w-13 h-17 rounded-lg object-cover border border-white/20 shadow-sm ring-2 ring-white/5"
                        />
                      ) : (
                        <div className="w-13 h-17 rounded-lg bg-gradient-to-b from-slate-100 to-slate-200 border border-white/20 text-slate-700 flex items-center justify-center font-black text-xl shadow-sm ring-2 ring-white/5">
                          {emp.name.charAt(0)}
                        </div>
                      )}
                      
                      {/* Interactive Gold/Rainbow Security Stamp overlay */}
                      <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-gradient-to-r from-teal-300 via-pink-400 to-amber-300 opacity-90 border border-white/30 shadow-xs flex items-center justify-center text-[6px] font-black text-white select-none leading-none scale-90">
                        OK
                      </div>
                    </div>

                    {/* Gold Chip, Contactless Signal, Card Numbers */}
                    <div className="flex-1 flex flex-col justify-between h-15">
                      <div className="flex justify-between items-center">
                        {/* Golden Electronic Chip */}
                        <div className="w-7.5 h-5.5 rounded-sm bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-amber-300/40 relative overflow-hidden p-0.5 shadow-sm">
                          <div className="grid grid-cols-3 gap-0.5 h-full opacity-40">
                            <div className="border-r border-b border-amber-800/20"></div>
                            <div className="border-r border-b border-amber-800/20"></div>
                            <div className="border-b border-amber-800/20"></div>
                            <div className="border-r border-amber-800/20"></div>
                            <div className="border-r border-amber-800/20"></div>
                            <div className="border-amber-800/20"></div>
                          </div>
                        </div>

                        {/* Contactless symbol */}
                        <div className="rotate-90 text-slate-300/60 mr-1">
                          <Wifi className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Monospace Embossed Card Number Style */}
                      <div className="mt-1">
                        <p className="text-[11px] sm:text-[11.5px] font-bold font-mono tracking-[0.14em] text-white text-shadow-xs">
                          {generateUniqueCardNumber(emp.id, emp.employeeId)}
                        </p>
                        <p className="text-[8px] text-slate-300 font-bold font-mono uppercase tracking-wider mt-0.5 leading-none">
                          ID: {emp.employeeId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Panel */}
                  <div className="flex justify-between items-end border-t border-white/5 pt-1.5 z-10">
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-[10.5px] font-black tracking-wide truncate text-white uppercase leading-none">
                        {emp.name}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-extrabold text-sky-300 uppercase">
                            {theme.visaType}
                          </span>
                          <span className="text-[8px] text-amber-300 font-bold truncate bg-amber-400/10 px-1 rounded border border-amber-400/10">
                            แผนก{deptName}
                          </span>
                        </div>
                        <p className="text-[8px] text-slate-300 truncate leading-none mt-0.5">
                          ตำแหน่ง: {emp.position}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-right leading-none">
                          <span className="text-[6.5px] text-slate-400 font-black block">SINCE</span>
                          <span className="text-[8.5px] font-bold font-mono text-slate-100">{formattedSince}</span>
                        </div>

                        {/* Visa Hologram Orb */}
                        <div className="relative w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 opacity-95 shadow-xs flex items-center justify-center font-extrabold text-[7.5px] text-white/95 tracking-tighter italic leading-none">
                          VISA
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Translucent Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col justify-center items-center gap-2.5 p-3">
                    <div className="text-center space-y-0.5">
                      <p className="font-black text-xs text-white leading-none mb-1">{emp.name}</p>
                      <p className="text-[10px] text-slate-300 leading-none">{deptName} • {emp.position}</p>
                      
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[9px] font-extrabold text-sky-300">
                        <span>เงินเดือน: ฿{emp.baseSalary.toLocaleString()}</span>
                        <span>({emp.salaryType === 'daily' ? 'รายวัน' : 'รายเดือน'})</span>
                      </div>

                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {emp.bankName} • {formattedAcc}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(emp);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(emp);
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-all shadow-md shadow-rose-500/20 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-500 font-bold text-xs">
                  <th className="p-4 w-28">รูปพนักงาน</th>
                  <th className="p-4">รหัสพนักงาน / ชื่อ</th>
                  <th className="p-4">แผนก & ตำแหน่ง</th>
                  <th className="p-4">วันเริ่มทำงาน (Hire Date)</th>
                  <th className="p-4 text-right">เงินเดือนมูลฐาน</th>
                  <th className="p-4">ข้อมูลบัญชีรับเงิน</th>
                  <th className="p-4 text-center w-28">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-12 text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-10 h-10 text-slate-300" />
                        <p className="font-semibold text-slate-500">ไม่พบข้อมูลพนักงานตามตัวกรองดังกล่าว</p>
                        <p className="text-[11px] text-slate-400">แก้คำค้นหาหรือคลิกปุ่มลงทะเบียนพนักงานใหม่เพื่อเริ่มต้นได้ทันที</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const hasPresetAvatar = emp.avatar && emp.avatar.startsWith('http');
                    return (
                        <tr key={emp.id} className="hover:bg-slate-50/25 transition-colors">
                          {/* 1. Picture (รูป) */}
                          <td className="p-4">
                            <div className="relative group">
                              {hasPresetAvatar ? (
                                <img 
                                  src={emp.avatar} 
                                  alt={emp.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-base shadow-2xs">
                                  {emp.name.charAt(0)}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-blue-600 rounded-full text-[9px] text-white flex items-center justify-center shadow-xs border border-white">
                                ✓
                              </div>
                            </div>
                          </td>

                          {/* 2. Employee ID & Name (ชื่อรหัสพนักงาน) */}
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-[10px] text-blue-600 font-extrabold uppercase bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded w-max mb-1">
                                {emp.employeeId}
                              </span>
                              <span className="font-semibold text-slate-800 text-sm">{emp.name}</span>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-medium">งวดจ่าย: งวดที่ {emp.paymentPeriod || '1'}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-indigo-50 text-indigo-700 border border-indigo-100 font-sans">
                                  {emp.branch || 'สำนักงานใหญ่'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Department and Position */}
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                                {getDeptName(emp.departmentId)}
                              </span>
                              <span className="text-slate-400 mt-0.5 font-medium">{emp.position}</span>
                            </div>
                          </td>

                          {/* 3. Date of Entry (วันเข้างาน) */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              <span>
                                {emp.startDate ? new Date(emp.startDate).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : 'ไม่ระบุมูลฐาน'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 pl-5">
                              {emp.startDate ? `(ทำงานมาแล้ว ${Math.max(1, Math.round((new Date().getTime() - new Date(emp.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))} เดือน)` : 'ไม่มีประวัติวันเริ่ม'}
                            </span>
                          </td>

                          {/* 4. Salary (เงินเดือน) */}
                          <td className="p-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-extrabold text-indigo-700 text-sm font-mono">
                                {emp.baseSalary.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                {emp.salaryType === 'daily' ? `บาท / วัน (${emp.workedDays || 15} วัน)` : 'บาท / เดือน'}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5 ${
                                emp.salaryType === 'daily' 
                                  ? 'bg-purple-50 text-purple-700 border border-purple-150' 
                                  : 'bg-blue-50 text-blue-700 border border-blue-150'
                              }`}>
                                {emp.salaryType === 'daily' ? '☀️ รายวัน' : '🗓️ รายเดือน'}
                              </span>
                            </div>
                          </td>

                          {/* 5. Bank Account (เลขที่บัญชี) */}
                          <td className="p-4">
                            <div className="flex flex-col text-slate-700 font-medium">
                              <span className="flex items-center gap-1 font-bold">
                                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                {emp.bankName}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-500 mt-1">
                                {emp.bankAccount || 'ยังไม่ระบุเลขบัญชี'}
                              </span>
                            </div>
                          </td>

                          {/* Operations */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                title="แก้ไขพนักงาน"
                                onClick={() => handleOpenEdit(emp)}
                                className="p-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 hover:border-amber-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="ลบพนักงาน"
                                onClick={() => handleDeleteClick(emp)}
                                className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingEmployee ? '📝 แก้ไขข้อมูลพนักงานในระบบ' : '✨ ลงทะเบียนพนักงานใหม่ในฐานระบบ'}
                  </h3>
                  <p className="text-[10px] text-slate-400">กรุณากรอกบันทึกข้อมูลหลักเพื่อให้พร้อมนำไปคำนวณเงินเดือนในระบบ</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
              
              {/* Profile Avatar Selection Section */}
              <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100/50 space-y-3">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  เลือกรูปโปรไฟล์พนักงาน (Profile Avatar) *
                </label>
                
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Selected / Current Avatar Display */}
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-blue-500 overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
                    <img 
                      src={useCustomAvatar ? (customAvatarUrl || PRESET_AVATARS[0]) : avatar} 
                      alt="Selected avatar" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // fallback if error link
                        (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                      }}
                    />
                  </div>

                  <div className="space-y-2 flex-1 min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setUseCustomAvatar(false)}
                        className={`text-[10px] px-2.5 py-1 rounded-sm font-bold ${!useCustomAvatar ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        ใช้รูปพรีเซ็ตโรงงาน
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseCustomAvatar(true)}
                        className={`text-[10px] px-2.5 py-1 rounded-sm font-bold ${useCustomAvatar ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        ระบุ URL ลิงก์รูปภาพเอง
                      </button>
                    </div>

                    {!useCustomAvatar ? (
                      <div className="flex items-center gap-2">
                        {PRESET_AVATARS.map((url, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setAvatar(url)}
                            className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${avatar === url ? 'border-blue-650 ring-2 ring-blue-500/30' : 'border-transparent opacity-75 hover:opacity-100'}`}
                          >
                            <img src={url} alt="preset avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input 
                        type="url"
                        placeholder="วางที่อยู่ URL ลิงก์รูปภาพจากอินเทอร์เน็ตที่นี่..."
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* General details group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">รหัสพนักงานประจำตัว *</label>
                  <input
                    type="text"
                    required
                    placeholder="ตัวอย่างเช่น EMP001"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">ชื่อ - นามสกุลจริง *</label>
                  <input
                    type="text"
                    required
                    placeholder="อย่างเช่น นายชัยสิทธิ์ ทวีเวช"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">แผนกงานในพอร์ทัล *</label>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">ตำแหน่งพนักงาน *</label>
                  <input
                    type="text"
                    required
                    placeholder="ตัวอย่างเช่น UI Developer, HR Assistant"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">ประเภทอัตราจ้าง *</label>
                  <select
                    value={salaryType}
                    onChange={e => {
                      const val = e.target.value as 'monthly' | 'daily';
                      setSalaryType(val);
                      if (val === 'daily') {
                        setBaseSalary(500);
                      } else {
                        setBaseSalary(25000);
                      }
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                  >
                    <option value="monthly">🗓️ พนักงานรายเดือน (Monthly)</option>
                    <option value="daily">☀️ พนักงานรายวัน (Daily)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">
                    {salaryType === 'daily' ? 'อัตราค่าจ้างรายวัน (บาท / วัน) *' : 'อัตราเงินเดือนมูลฐาน (บาท / เดือน) *'}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      required
                      min={0}
                      value={baseSalary || ''}
                      onChange={e => setBaseSalary(Number(e.target.value))}
                      className="w-full text-xs pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold font-mono text-slate-700"
                    />
                  </div>
                </div>

                {salaryType === 'daily' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">จำนวนวันทำงานเริ่มต้น *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={31}
                      value={workedDays}
                      onChange={e => setWorkedDays(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold font-mono text-slate-700"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">วันเริ่มบรรจุเข้าปฏิบัติงาน *</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">งวดนโยบายการจ่ายเงิน *</label>
                  <select
                    value={paymentPeriod}
                    onChange={e => setPaymentPeriod(e.target.value as '1' | '2')}
                    className="w-full text-xs border border-blue-100 rounded-lg px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/20 font-bold"
                  >
                    <option value="1">งวดที่ 1 (วันที่ 1 - 15)</option>
                    <option value="2">งวดที่ 2 (วันที่ 16 - 31)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">สาขาปฏิบัติงาน *</label>
                  <select
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                  >
                    <option value="สำนักงานใหญ่">🏢 สำนักงานใหญ่</option>
                    <option value="สาขาควนขนุน">📍 สาขาควนขนุน</option>
                    <option value="สาขาพัทลุง">📍 สาขาพัทลุง</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">ระบุธนาคารผู้โอน *</label>
                  <select
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย (KBank)</option>
                    <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
                    <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
                    <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย (KTB)</option>
                    <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                    <option value="ธนาคารออมสิน">ธนาคารออมสิน (GSB)</option>
                    <option value="ธนาคารธ.ก.ส">ธนาคารธ.ก.ส (BAAC)</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600">เลขที่บัญชีธนาคารรับเงินเดือน *</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="ตัวอย่างเช่น 111-2-33445-5"
                      value={bankAccount}
                      onChange={e => setBankAccount(e.target.value)}
                      className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold font-mono"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingEmployee ? 'บันทึกการแก้ไข' : 'ลงทะเบียนและประหยัดข้อมูล'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM BEAUTIFUL DELETION CONFIRMATION DIALOG MODAL FOR EMPLOYEES */}
      <AnimatePresence>
        {deleteConfirmEmp !== null && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-700"
            >
              {/* Header icon alert */}
              <div className="p-5 border-b border-rose-100 flex items-center gap-3 select-none bg-rose-50/70">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-950">ยืนยันการลบรายชื่อพนักงาน</h3>
                  <p className="text-[10px] text-rose-600 font-bold">ข้อมูลพอร์ทัลและทะเบียนพนักงานทั้งหมดจะถูกลบออกถาวร</p>
                </div>
              </div>

              {/* Details layout */}
              <div className="p-5 space-y-3 font-semibold text-xs leading-relaxed text-slate-705 text-slate-700">
                <div className="flex items-start gap-2.5 bg-rose-50/30 border border-rose-100/50 p-2.5 rounded-lg text-rose-800 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>คำเตือนที่สำคัญ:</strong> การดำเนินการนี้จะลบข้อมูลประวัติของพนักงานอย่างถาวร รวมทั้งข้อมูลการจ่ายเงินเดือน (Payroll), ประวัติการลงเวลาทำงาน (Attendance) และ<strong>คำขอลาที่ค้างตรวจสอบทั้งหมด</strong>ของพนักงานท่านนี้ทันทีเพื่อรักษาความเสถียรและความตรงกันของระบบฐานข้อมูลคลาวน์
                  </p>
                </div>

                <p>
                  คุณแน่ใจหรือไม่ว่าต้องการทำการลบและปลดรายชื่อ <strong className="text-slate-950 font-extrabold">{deleteConfirmEmp.name}</strong> ออกจากฐานทะเบียนระบบ?
                </p>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 font-mono text-[11px] text-slate-600">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                    <span>รหัสพนักงาน:</span>
                    <strong className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{deleteConfirmEmp.employeeId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>ตำแหน่งงาน:</span>
                    <strong className="text-slate-950">{deleteConfirmEmp.position}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>แผนกงาน:</span>
                    <strong className="text-slate-950">{getDeptName(deleteConfirmEmp.departmentId)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>อัตราเงินเดิอน:</span>
                    <strong className="text-indigo-700">฿{deleteConfirmEmp.baseSalary.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Buttons controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px] select-none">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmEmp(null)}
                  className="py-2 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer font-bold"
                >
                  ยกเลิกบัญชี
                </button>
                <button
                  type="button"
                  onClick={() => executeDelete(deleteConfirmEmp)}
                  className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer font-black shadow-xs animate-pulse"
                >
                  ยืนยันลบพนักงาน
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
