import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CreditCard, 
  DollarSign, 
  PiggyBank, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  X,
  PlusCircle,
  FileCheck,
  UserCheck,
  ShieldCheck,
  Scissors,
  Printer,
  FileText,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';
import { EmployeeSalary, Department, CompanySettings } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PayrollViewProps {
  employees: EmployeeSalary[];
  departments: Department[];
  onAddEmployee: (emp: EmployeeSalary) => void;
  onUpdateEmployee: (emp: EmployeeSalary) => void;
  onDeleteEmployee: (id: string) => void;
  companySettings?: CompanySettings;
}

export interface RegistryRow {
  employeeId: string;
  name: string;
  gender: 'ชาย' | 'หญิง';
  nationality: string;
  baseSalary: number;
  dailyRate: number;
  workedDays: number;
  workedAmount: number;
  overtimePay: number;
  deductionDesc: string;
  deductionAmount: number;
  totalEarnings: number;
  tax: number;
  socialSecurity: number;
  otherBenefits: number;
  totalDeductions: number;
  netPay: number;
  signed: boolean;
}

export default function PayrollView({
  employees,
  departments,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  companySettings
}: PayrollViewProps) {
  
  // NEW: Wage Roster Collapsible and State Hub
  const [isRegistryMenuOpen, setIsRegistryMenuOpen] = useState(false);
  const [activeRegistryPeriod, setActiveRegistryPeriod] = useState<'1' | '2' | null>(null);
  const [registryMonth, setRegistryMonth] = useState<number>(() => {
    const current = new Date();
    return current.getMonth() + 1;
  });
  const [registryYear, setRegistryYear] = useState<number>(() => {
    const current = new Date();
    return current.getFullYear();
  });
  const [registryRowsMap, setRegistryRowsMap] = useState<Record<string, RegistryRow[]>>(() => {
    const raw = localStorage.getItem('sapphire_payroll_registries');
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeSalary | null>(null);
  const [activeSlipEmployee, setActiveSlipEmployee] = useState<EmployeeSalary | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeSalary | null>(null);

  // PDF download state & ref
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Warning notification state for restricted payslip access based on status
  const [warningAlert, setWarningAlert] = useState<{
    show: boolean;
    title: string;
    message: string;
    status: 'pending' | 'hold';
    employeeName: string;
  } | null>(null);

  // --- NEW: Wage Registry/Roster Methods & Helpers ---
  const currentPeriodKey = activeRegistryPeriod ? `${registryYear}_${registryMonth}_${activeRegistryPeriod}` : '';

  const getActivePeriodRows = (): RegistryRow[] => {
    if (!currentPeriodKey) return [];
    return registryRowsMap[currentPeriodKey] || [];
  };

  const handleInitializePeriod = () => {
    if (!activeRegistryPeriod) return;
    const key = `${registryYear}_${registryMonth}_${activeRegistryPeriod}`;
    
    const initializedRows: RegistryRow[] = employees.map(emp => {
      let detectedGender: 'ชาย' | 'หญิง' = 'ชาย';
      if (emp.name.match(/(นางสาว|น\.ส\.|นาง|หญิง|เด็กหญิง|คุณแม่|เจ๊|คุณหญิง)/)) {
        detectedGender = 'หญิง';
      }
      
      const isDaily = emp.salaryType === 'daily';
      const normalSSO = emp.socialSecurity !== undefined ? emp.socialSecurity : Math.min(750, Math.round((isDaily ? emp.baseSalary * 30 : emp.baseSalary) * 0.05));
      const workedDays = 15;
      const dailyRate = isDaily ? emp.baseSalary : Math.round(emp.baseSalary / 30);
      const workedAmount = dailyRate * workedDays;
      const overtimePay = emp.paymentPeriod === activeRegistryPeriod ? emp.bonus : 0;
      const deductionAmount = emp.paymentPeriod === activeRegistryPeriod ? emp.deduction : 0;
      const otherBenefits = 0;
      const tax = 0;
      const ssoHalf = Math.round(normalSSO / 2);
      
      const totalEarnings = workedAmount + overtimePay + otherBenefits;
      const totalDeductions = tax + ssoHalf + deductionAmount;
      const netPay = totalEarnings - totalDeductions;

      return {
        employeeId: emp.employeeId || emp.id,
        name: emp.name,
        gender: detectedGender,
        nationality: 'ไทย',
        baseSalary: emp.baseSalary,
        dailyRate: dailyRate,
        workedDays: workedDays,
        workedAmount: workedAmount,
        overtimePay: overtimePay,
        deductionDesc: deductionAmount > 0 ? 'หักขาดงาน' : 'ไม่มี',
        deductionAmount: deductionAmount,
        totalEarnings: totalEarnings,
        tax: tax,
        socialSecurity: ssoHalf,
        otherBenefits: otherBenefits,
        totalDeductions: totalDeductions,
        netPay: netPay,
        signed: emp.paymentStatus === 'paid'
      };
    });

    const newMap = { ...registryRowsMap, [key]: initializedRows };
    setRegistryRowsMap(newMap);
    localStorage.setItem('sapphire_payroll_registries', JSON.stringify(newMap));
    window.dispatchEvent(new Event('sapphire_storage_updated'));
  };

  useEffect(() => {
    if (activeRegistryPeriod) {
      const key = `${registryYear}_${registryMonth}_${activeRegistryPeriod}`;
      if (!registryRowsMap[key] || registryRowsMap[key].length === 0) {
        handleInitializePeriod();
      }
    }
  }, [activeRegistryPeriod, registryMonth, registryYear, employees]);

  useEffect(() => {
    const handleSyncReset = () => {
      const raw = localStorage.getItem('sapphire_payroll_registries');
      try {
        if (raw) {
          setRegistryRowsMap(JSON.parse(raw));
        }
      } catch (e) {
        console.error('Error reloading payroll registries', e);
      }
    };
    window.addEventListener('sapphire_storage_updated', handleSyncReset);
    return () => window.removeEventListener('sapphire_storage_updated', handleSyncReset);
  }, []);

  const handleUpdateRowCell = (index: number, field: keyof RegistryRow, value: any) => {
    if (!activeRegistryPeriod) return;
    const key = `${registryYear}_${registryMonth}_${activeRegistryPeriod}`;
    const currentRows = registryRowsMap[key] ? [...registryRowsMap[key]] : [];
    if (!currentRows[index]) return;

    const updatedRow = { ...currentRows[index] };
    
    if (field === 'baseSalary' || field === 'dailyRate' || field === 'workedDays' || field === 'workedAmount' || field === 'overtimePay' || field === 'deductionAmount' || field === 'tax' || field === 'socialSecurity' || field === 'otherBenefits') {
      updatedRow[field] = Number(value) || 0;
    } else if (field === 'signed') {
      updatedRow[field] = Boolean(value);
    } else {
      (updatedRow as any)[field] = value;
    }

    if (field === 'baseSalary') {
      const empInfo = employees.find(e => e.employeeId === updatedRow.employeeId || e.id === updatedRow.employeeId);
      const isDaily = empInfo?.salaryType === 'daily';
      updatedRow.dailyRate = isDaily ? updatedRow.baseSalary : Math.round(updatedRow.baseSalary / 30);
      updatedRow.workedAmount = updatedRow.dailyRate * updatedRow.workedDays;
    } else if (field === 'dailyRate' || field === 'workedDays') {
      updatedRow.workedAmount = Math.round(updatedRow.dailyRate * updatedRow.workedDays);
    }

    updatedRow.totalEarnings = updatedRow.workedAmount + updatedRow.overtimePay + updatedRow.otherBenefits;
    updatedRow.totalDeductions = updatedRow.tax + updatedRow.socialSecurity + updatedRow.deductionAmount;
    updatedRow.netPay = updatedRow.totalEarnings - updatedRow.totalDeductions;

    currentRows[index] = updatedRow;
    const newMap = { ...registryRowsMap, [key]: currentRows };
    setRegistryRowsMap(newMap);
    localStorage.setItem('sapphire_payroll_registries', JSON.stringify(newMap));
  };

  // Form Inputs State
  const [empIdInput, setEmpIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [deptIdInput, setDeptIdInput] = useState('');
  const [positionInput, setPositionInput] = useState('');
  const [baseSalaryInput, setBaseSalaryInput] = useState(25000);
  const [bonusInput, setBonusInput] = useState(0);
  const [deductionInput, setDeductionInput] = useState(0);
  const [socialSecurityInput, setSocialSecurityInput] = useState(750);
  const [autoSSO, setAutoSSO] = useState(true);
  const [paymentPeriodInput, setPaymentPeriodInput] = useState<'1' | '2'>('1');
  const [salaryTypeInput, setSalaryTypeInput] = useState<'monthly' | 'daily'>('monthly');
  const [workedDaysInput, setWorkedDaysInput] = useState<number>(15);
  const [statusInput, setStatusInput] = useState<'paid' | 'pending' | 'hold'>('pending');
  const [bankNameInput, setBankNameInput] = useState('ธนาคารกสิกรไทย');
  const [bankAccountInput, setBankAccountInput] = useState('');
  const [createdAtInput, setCreatedAtInput] = useState(new Date().toISOString().substring(0, 10));
  const [branchInput, setBranchInput] = useState('สำนักงานใหญ่');

  // Helper helper to get base value (takes into account worked days if daily salary type)
  const getEmpBaseVal = (emp: EmployeeSalary) => {
    if (emp.salaryType === 'daily') {
      const days = emp.workedDays !== undefined ? emp.workedDays : 15;
      return emp.baseSalary * days;
    }
    return emp.baseSalary;
  };

  // Helper helper to get SSO value dynamically (fallback is 5% capped at 750)
  const getEmpSSO = (emp: EmployeeSalary) => {
    if (emp.socialSecurity !== undefined) return emp.socialSecurity;
    const baseVal = getEmpBaseVal(emp);
    return Math.min(750, Math.round(baseVal * 0.05));
  };

  // Helper to generate a pay slip document number: [งวด][เดือน][ปี][ลำดับ]
  // e.g. 10669-001 (Period 1, June B.E. 2569, Sequence 001)
  const getSlipDocNo = (emp: EmployeeSalary) => {
    const date = emp.createdAt ? new Date(emp.createdAt) : new Date();
    const period = emp.paymentPeriod || '1';
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    // Thai Buddhist calendar year is Gregorian year + 543
    const thYear = date.getFullYear() + 543;
    const yearStr = String(thYear).slice(-2); // last 2 digits, e.g., "69" for 2569
    
    // Sequence is 1-based index in the global employees list
    const index = employees.findIndex(e => e.id === emp.id);
    const seqStr = String(index !== -1 ? index + 1 : 1).padStart(3, '0');
    
    return `${period}${monthStr}${yearStr}-${seqStr}`;
  };

  // Synchronize SSO when base salary, salary type, or worked days change and autoSSO is true
  useEffect(() => {
    if (autoSSO) {
      const calculatedBase = salaryTypeInput === 'daily' ? baseSalaryInput * workedDaysInput : baseSalaryInput;
      setSocialSecurityInput(Math.min(750, Math.round(calculatedBase * 0.05)));
    }
  }, [baseSalaryInput, salaryTypeInput, workedDaysInput, autoSSO]);

  // Calculations for KPI Cards
  const totalBase = employees.reduce((sum, e) => sum + getEmpBaseVal(e), 0);
  const totalBonus = employees.reduce((sum, e) => sum + e.bonus, 0);
  const totalSSO = employees.reduce((sum, e) => sum + getEmpSSO(e), 0);
  const totalDeductions = employees.reduce((sum, e) => sum + e.deduction, 0);
  const totalNet = totalBase + totalBonus - totalDeductions - totalSSO;
  
  // Filtering and sorting employees (newest to oldest)
  const filteredEmployees = employees
    .filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            getSlipDocNo(emp).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = selectedDeptFilter === 'all' || emp.departmentId === selectedDeptFilter;
      const matchesStatus = selectedStatusFilter === 'all' || emp.paymentStatus === selectedStatusFilter;
      const matchesPeriod = selectedPeriodFilter === 'all' || emp.paymentPeriod === selectedPeriodFilter;
      
      const empDate = emp.createdAt ? new Date(emp.createdAt) : null;
      const matchesMonth = selectedMonthFilter === 'all' || (empDate ? String(empDate.getMonth() + 1) === selectedMonthFilter : false);
      const matchesYear = selectedYearFilter === 'all' || (empDate ? String(empDate.getFullYear()) === selectedYearFilter : false);
      
      return matchesSearch && matchesDept && matchesStatus && matchesPeriod && matchesMonth && matchesYear;
    })
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA || b.id.localeCompare(a.id);
    });

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setEmpIdInput(`EMP${String(employees.length + 1).padStart(3, '0')}`);
    setNameInput('');
    setDeptIdInput(departments[0]?.id || '');
    setPositionInput('');
    setBaseSalaryInput(25000);
    setWorkedDaysInput(15);
    setBonusInput(0);
    setDeductionInput(0);
    setSocialSecurityInput(750);
    setAutoSSO(true);
    setPaymentPeriodInput('1');
    setSalaryTypeInput('monthly');
    setStatusInput('pending');
    setBankNameInput('ธนาคารกสิกรไทย');
    setBankAccountInput('');
    setCreatedAtInput(new Date().toISOString().substring(0, 10));
    setBranchInput('สำนักงานใหญ่');
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (emp: EmployeeSalary) => {
    setEditingEmployee(emp);
    setEmpIdInput(emp.employeeId);
    setNameInput(emp.name);
    setDeptIdInput(emp.departmentId);
    setPositionInput(emp.position);
    setBaseSalaryInput(emp.baseSalary);
    setWorkedDaysInput(emp.workedDays !== undefined ? emp.workedDays : 15);
    setBonusInput(emp.bonus);
    setDeductionInput(emp.deduction);
    const ssoVal = emp.socialSecurity !== undefined ? emp.socialSecurity : Math.min(750, Math.round(emp.baseSalary * 0.05));
    setSocialSecurityInput(ssoVal);
    setAutoSSO(emp.socialSecurity === undefined || ssoVal === Math.min(750, Math.round(emp.baseSalary * 0.05)));
    setPaymentPeriodInput(emp.paymentPeriod || '1');
    setSalaryTypeInput(emp.salaryType || 'monthly');
    setStatusInput(emp.paymentStatus);
    setBankNameInput(emp.bankName);
    setBankAccountInput(emp.bankAccount);
    setCreatedAtInput(emp.createdAt ? new Date(emp.createdAt).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
    setBranchInput(emp.branch || 'สำนักงานใหญ่');
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  const handleViewPaySlip = (emp: EmployeeSalary) => {
    if (emp.paymentStatus === 'pending') {
      setWarningAlert({
        show: true,
        title: 'สินทรัพย์ยังไม่สามารถเข้าตรวจรับ',
        message: 'รอโอนจ่าย', // user explicitly asked for this exact message text
        status: 'pending',
        employeeName: emp.name
      });
      return;
    }
    
    if (emp.paymentStatus === 'hold') {
      setWarningAlert({
        show: true,
        title: 'ระงับใบสำคัญจ่ายชั่วคราว',
        message: 'รอดำเนินการอยู่', // user explicitly asked for this exact message text
        status: 'hold',
        employeeName: emp.name
      });
      return;
    }

    // Default 'paid' status can open the slip
    setActiveSlipEmployee(emp);
  };

  const downloadSlipPdf = async () => {
    if (!activeSlipEmployee || !printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = printRef.current;
      
      // Use scale for clarity
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      let renderWidth = pdfWidth - 16; // 8mm margin
      let renderHeight = renderWidth / ratio;
      
      if (renderHeight > pdfHeight - 16) {
        renderHeight = pdfHeight - 16;
        renderWidth = renderHeight * ratio;
      }
      
      const xOffset = (pdfWidth - renderWidth) / 2;
      const yOffset = (pdfHeight - renderHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
      
      const docNo = getSlipDocNo(activeSlipEmployee);
      const fileName = `สลิปเงินเดือน_A4_พนักงาน_${activeSlipEmployee.name}_${docNo}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !positionInput.trim() || !bankAccountInput.trim()) {
      alert("กรุณากรอกข้อมูลพนักงานที่มีเครื่องหมายดอกจันให้ครบถ้วน");
      return;
    }

    const payload: EmployeeSalary = {
      id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
      employeeId: empIdInput,
      name: nameInput,
      departmentId: deptIdInput,
      position: positionInput,
      baseSalary: Number(baseSalaryInput),
      workedDays: Number(workedDaysInput),
      bonus: Number(bonusInput),
      deduction: Number(deductionInput),
      socialSecurity: Number(socialSecurityInput),
      paymentStatus: statusInput,
      bankAccount: bankAccountInput,
      bankName: bankNameInput,
      paymentPeriod: paymentPeriodInput,
      salaryType: salaryTypeInput,
      branch: branchInput,
      createdAt: new Date(createdAtInput + 'T12:00:00').toISOString()
    };

    if (editingEmployee) {
      onUpdateEmployee(payload);
    } else {
      onAddEmployee(payload);
    }

    setIsModalOpen(false);
  };

  const getDeptName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'ไม่ระบุแผนก';
  };

  const renderSlipCopy = (emp: EmployeeSalary, copyLabel: string, copyWatermark: string) => {
    const baseVal = getEmpBaseVal(emp);
    const netSalary = baseVal + emp.bonus - emp.deduction - getEmpSSO(emp);
    return (
      <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 text-slate-800 text-xs relative overflow-hidden shadow-xs">
        {/* Subtle Watermark BG */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[48px] uppercase font-black text-slate-100/15 pointer-events-none tracking-widest leading-none text-center select-none rotate-12">
          {copyWatermark}
        </div>

        {/* Copy Indicator */}
        <div className="flex justify-between items-center bg-blue-50/70 border border-blue-100 p-2 rounded-lg text-[10px] text-blue-800 font-extrabold uppercase tracking-widest mb-3">
          <span>{copyLabel}</span>
          <span className="text-[9px] text-blue-600 bg-white border border-blue-200 px-1.5 py-0.2 rounded">{companySettings?.name || "บริษัทอภิวัฒน์เครื่องครัว จำกัด"}</span>
        </div>

        {/* Header Block / Logo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2 mb-3 w-full">
          <div>
            <h4 className="text-sm font-black text-slate-850 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block" />
              {companySettings?.name || "บริษัทอภิวัฒน์เครื่องครัว จำกัด"}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">ใบสำคัญจ่ายเงินตอบแทน / PAYSLIP (A4 ครึ่งใบ)</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] bg-slate-200 font-mono font-bold px-2 py-0.5 rounded text-slate-700">
              Doc No: {getSlipDocNo(emp)}
            </span>
            <p className="text-[9px] text-slate-400 font-bold mt-1">วันที่ออกสลิป: {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')}</p>
          </div>
        </div>

        {/* Employee Info Block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-100 text-[11px] mb-3">
          <div>
            <span className="text-slate-400 font-semibold block text-[9px] uppercase">รหัสพนักงาน</span>
            <span className="font-mono font-black text-slate-800">{emp.employeeId}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[9px] uppercase">ชื่อผู้รับเงิน / Employee Name</span>
            <span className="font-bold text-slate-800">{emp.name}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[9px] uppercase">ตำแหน่ง / ฝ่าย</span>
            <span className="font-bold text-slate-600">{emp.position} ({getDeptName(emp.departmentId)})</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[9px] uppercase">รอบจ่ายค่าจ้าง / Period</span>
            <span className="font-bold text-blue-700">
              {emp.paymentPeriod === '2' ? 'งวดที่ 2 (16-31)' : 'งวดที่ 1 (1-15)'} ของเดือน
            </span>
          </div>
        </div>

        {/* Two Columns Table (Earnings vs Deductions) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-3 mb-3">
          {/* Column Earnings */}
          <div className="space-y-1.5">
            <h5 className="text-[9px] font-black text-slate-450 uppercase tracking-widest border-b pb-1">รายรับ / EARNINGS</h5>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600 font-semibold">
                {emp.salaryType === 'daily' 
                  ? `ค่าจ้างรายวัน (Daily: ฿${emp.baseSalary} x ${emp.workedDays || 15} วัน)` 
                  : 'เงินเดือนประจำ (Base Salary)'}
              </span>
              <span className="font-mono font-bold text-slate-800">฿{baseVal.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-emerald-700 font-bold">เงินรางวัลพิเศษ / โบนัส (Bonus)</span>
              <span className="font-mono font-bold text-emerald-600">฿{emp.bonus.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-100 font-extrabold text-slate-800">
              <span>รวมรายรับ (Gross Income)</span>
              <span className="font-mono">฿{(baseVal + emp.bonus).toLocaleString()}.00</span>
            </div>
          </div>

          {/* Column Deductions */}
          <div className="space-y-1.5">
            <h5 className="text-[9px] font-black text-slate-450 uppercase tracking-widest border-b pb-1">รายจ่าย / DEDUCTIONS</h5>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600 font-semibold">กองทุนประกันสังคม (SSO Benefit 5%)</span>
              <span className="font-mono font-bold text-slate-800">฿{getEmpSSO(emp).toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-rose-600 font-bold">ภาษีหักอื่นๆ (Deduction)</span>
              <span className="font-mono font-bold text-rose-500">฿{emp.deduction.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-100 font-extrabold text-slate-800">
              <span>รวมหักทั้งสิ้น (Total Deductions)</span>
              <span className="font-mono text-rose-500">฿{(getEmpSSO(emp) + emp.deduction).toLocaleString()}.00</span>
            </div>
          </div>
        </div>

        {/* Net Salary Paid Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100 gap-2 mb-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">ยอดจ่ายสุทธิหลังหักภาษี (NET PAYABLE TO BANK)</span>
            <span className="text-slate-450 text-[10px] font-semibold">โอนผ่านธนาคาร: {emp.bankName} เลขที่ A/C ** {emp.bankAccount}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-blue-800 font-mono">฿{netSalary.toLocaleString()}.00</span>
          </div>
        </div>

        {/* Dual Signatures */}
        <div className="grid grid-cols-2 gap-4 pt-1.5">
          <div className="text-center pt-2 border-t border-dashed border-slate-205 text-[9px] text-slate-400">
            <p className="mb-4 text-slate-400 font-bold">ลงชื่อ ............................................................ ผู้รับเงิน (Staff Signature)</p>
            <p className="font-semibold text-slate-500">วันที่: &nbsp; &nbsp; &nbsp; / &nbsp; &nbsp; &nbsp; / &nbsp; &nbsp; &nbsp;</p>
          </div>
          <div className="text-center pt-2 border-t border-dashed border-slate-205 text-[9px] text-slate-400">
            <p className="mb-4 text-slate-400 font-bold">ลงชื่อ ............................................................ นายจ้าง (Authorized Sign)</p>
            <p className="font-semibold text-slate-500">วันที่: &nbsp; &nbsp; &nbsp; / &nbsp; &nbsp; &nbsp; / &nbsp; &nbsp; &nbsp;</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-blue-100 gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            บัญชีและการจ่ายเงินเดือน (Payroll Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1">คำนวณฐานเงินเดือน ตรวจสอบรายการโบนัส รายการหัก ณ ที่จ่าย และจัดการออกสลิปโอนเงินตอบแทน</p>
        </div>
        <button 
          id="add-employee-trigger-btn"
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ml-auto sm:ml-0"
        >
          <Plus className="w-4.5 h-4.5" />
          เพิ่มบุคลากร / เงินเดือน
        </button>
      </div>

      {/* สมุดทะเบียนจ่ายค่าจ้างแบบพับได้ (Collapsible Payroll Ledger Registry) */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-0.5">
        <button
          type="button"
          onClick={() => {
            setIsRegistryMenuOpen(!isRegistryMenuOpen);
            if (!activeRegistryPeriod) {
              setActiveRegistryPeriod('1');
            }
          }}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-900 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-all text-white focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/25 text-blue-400 rounded-xl border border-blue-500/20">
              <FileSpreadsheet className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-wide flex items-center gap-2">
                ทะเบียนสมุดรายรับ-รายจ่ายจ่ายค่าจ้างพนักงานรายปักษ์ (Semi-Monthly Payroll Register Ledger)
                <span className="hidden sm:inline-flex bg-emerald-500/15 border border-emerald-500/40 text-[10px] text-emerald-400 font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                  Cloud Live Ledger
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                เลือกงวดชำระเบี้ยตอบแทน งวดที่ 1 (1-15 ของเดือน) หรือ งวดที่ 2 (16-31 ของเดือน) และประมวลข้อมูลสรุปส่งออกราชการ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold hidden md:inline bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
              {isRegistryMenuOpen ? "คลิกเพื่อซ่อนสมุด" : "คลิกเพื่อเปิดดูทะเบียน"}
            </span>
            <div className={`w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center transition-transform ${isRegistryMenuOpen ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isRegistryMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-5 overflow-hidden"
            >
              {/* Controls Configuration header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select month of period */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-450 tracking-wider block">เลือกเดือนประมวลทะเบียน</label>
                    <select
                      value={registryMonth}
                      onChange={e => setRegistryMonth(Number(e.target.value))}
                      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i+1} value={i+1}>
                          {["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"][i]} ({i+1})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select year of period */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-450 tracking-wider block">เลือกปี พ.ศ.</label>
                    <select
                      value={registryYear}
                      onChange={e => setRegistryYear(Number(e.target.value))}
                      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value={2025}>พ.ศ. 2568 (2025)</option>
                      <option value={2026}>พ.ศ. 2569 (2026)</option>
                      <option value={2027}>พ.ศ. 2570 (2027)</option>
                    </select>
                  </div>

                  {/* Submenu choice select buttons */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-450 tracking-wider block">งวดการคำนวณเบี้ย (Period Registry)</label>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveRegistryPeriod('1')}
                        className={`text-xs px-3.5 py-1 border border-transparent rounded-lg font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeRegistryPeriod === '1'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
                        งวดที่ 1 (วันที่ 1 - 15)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveRegistryPeriod('2')}
                        className={`text-xs px-3.5 py-1 border border-transparent rounded-lg font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeRegistryPeriod === '2'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block shrink-0" />
                        งวดที่ 2 (วันที่ 16 - 31)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('คุณต้องการรีเซ็ตข้อมูลทะเบียนของงวดการจ่ายนี้กลับไปเป็นตามข้อมูลบุคลากรฐานหลักทั้งหมดใช่หรือไม่? ค่าที่ตกแต่งเพิ่มเติมจะหายไป')) {
                        handleInitializePeriod();
                      }
                    }}
                    className="text-[10px] font-bold text-slate-400 border border-slate-800 bg-slate-950/20 hover:text-white hover:bg-slate-900 hover:border-slate-700 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                  >
                    🔄 รีสตาร์ท / ดึงทับโครงใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="text-[10px] font-black text-white bg-blue-700 hover:bg-blue-600 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/15"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    พิมพ์รายงานหน้านี้ (A4 print)
                  </button>
                </div>
              </div>

              {/* SHEET BODY WRAPPER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase font-black text-blue-400 tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                    ทะเบียนจ่ายค่าจ้างพนักงาน ฝ่ายปฏิบัติการและออฟฟิศ - ประจำงวดที่ {activeRegistryPeriod} (ประจำวันที่ {activeRegistryPeriod === '1' ? '1 - 15' : '16 - 31'} เดือน{["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"][(registryMonth || 1) - 1]} พ.ศ. {registryYear + 543})
                  </span>
                  <span className="text-[10px] text-slate-500 font-extrabold font-mono">
                    จำนวนรายชื่อ: {getActivePeriodRows().length} ท่าน
                  </span>
                </div>

                {/* THE EXCEL-LIKE SPREADSHEET LEDGER */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto" style={{ maxHeight: '420px' }}>
                    <table className="w-full text-xs text-slate-350 border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 sticky top-0 z-10 text-[10px] font-extrabold uppercase">
                          <th className="p-2 text-center border-r border-slate-850">ลำดับ</th>
                          <th className="p-2 text-left border-r border-slate-850 min-w-44">ชื่อ-สกุล</th>
                          <th className="p-2 text-center border-r border-slate-850">เพศ</th>
                          <th className="p-2 text-center border-r border-slate-850">สัญชาติ</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-28">เงินเดือนปกติ</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-24">เฉลี่ยวันละ</th>
                          <th className="p-2 text-center border-r border-slate-850 min-w-28">วันทำงาน/รายการเงิน</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-28">จำนวนเงินได้หลัก</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-24">ค่าล่วงเวลา (OT)</th>
                          <th className="p-2 text-left border-r border-slate-850 min-w-36">รายการหักระบุ</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-24">รวมเงินได้พึงมี</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-20">ภาษี ณ ที่จ่าย</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-24">ประกันสังคม 5%</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-24">ผลตอบแทนอื่นๆ</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-24 font-bold text-rose-400">รวมยอดรายหัก</th>
                          <th className="p-2 text-right border-r border-slate-850 min-w-28 text-emerald-400 bg-emerald-950/20 font-black">รวมจ่ายสุทธิ (Net)</th>
                          <th className="p-2 text-center min-w-28 text-blue-300">ลงลายมือชื่อพนักงาน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300">
                        {getActivePeriodRows().length === 0 ? (
                          <tr>
                            <td colSpan={17} className="p-8 text-center text-slate-500 font-bold">
                              ⚠️ ไม่พบข้อมูลพนักงานสำหรับงวดและเดือนที่ระบุ กรุณาคลิก "รีสตาร์ท / ดึงทับโครงใหม่" เพื่อริเริ่มข้อมูลตารางทันที
                            </td>
                          </tr>
                        ) : (
                          getActivePeriodRows().map((row, idx) => {
                            return (
                              <tr key={idx} className="hover:bg-slate-850/40 transition-colors text-[11px]">
                                {/* 1. ลำดับ */}
                                <td className="p-1.5 text-center font-bold font-mono border-r border-slate-850 bg-slate-950/40 text-slate-400">
                                  {idx + 1}
                                </td>

                                {/* 2. ชื่อ-สกุล */}
                                <td className="p-1.5 font-bold text-white border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={row.name}
                                    onChange={e => handleUpdateRowCell(idx, 'name', e.target.value)}
                                    className="w-full bg-transparent text-white font-extrabold focus:bg-slate-800 focus:outline-none px-1 py-0.5 rounded border border-transparent hover:border-slate-800"
                                  />
                                </td>

                                {/* 3. เพศ */}
                                <td className="p-1.5 text-center border-r border-slate-850">
                                  <select
                                    value={row.gender}
                                    onChange={e => handleUpdateRowCell(idx, 'gender', e.target.value)}
                                    className="bg-slate-800/80 border border-slate-750 p-1 rounded text-[10px] font-bold px-1 py-0.5 text-white cursor-pointer"
                                  >
                                    <option value="ชาย">👨 ชาย</option>
                                    <option value="หญิง">👩 หญิง</option>
                                  </select>
                                </td>

                                {/* 4. สัญชาติ */}
                                <td className="p-1.5 text-center border-r border-slate-850">
                                  <select
                                    value={row.nationality}
                                    onChange={e => handleUpdateRowCell(idx, 'nationality', e.target.value)}
                                    className="bg-slate-800/80 border border-slate-750 p-1 rounded text-[10px] font-bold px-1 py-0.5 text-white cursor-pointer"
                                  >
                                    <option value="ไทย">🇹🇭 ไทย</option>
                                    <option value="เมียนมา">🇲🇲 เมียนมา</option>
                                    <option value="กัมพูชา">🇰🇭 กัมพูชา</option>
                                    <option value="ลาว">🇱🇦 ลาว</option>
                                  </select>
                                </td>

                                {/* 5. เงินเดือน */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850">
                                  <input
                                    type="number"
                                    value={row.baseSalary}
                                    onChange={e => handleUpdateRowCell(idx, 'baseSalary', Number(e.target.value))}
                                    className="w-full text-right bg-transparent text-slate-300 font-bold focus:bg-slate-800 focus:outline-none px-1 py-0.5 rounded border border-transparent hover:border-slate-800"
                                  />
                                </td>

                                {/* 6. วันละ */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850 text-slate-400">
                                  <input
                                    type="number"
                                    value={row.dailyRate}
                                    onChange={e => handleUpdateRowCell(idx, 'dailyRate', Number(e.target.value))}
                                    className="w-full text-right bg-transparent text-slate-400 font-medium focus:bg-slate-800 focus:outline-none px-1 py-0.5 rounded border border-transparent hover:border-slate-800"
                                  />
                                </td>

                                {/* 7. รายการเงิน/จำนวนวันทำงาน */}
                                <td className="p-1.5 text-center font-mono border-r border-slate-850">
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      value={row.workedDays}
                                      onChange={e => handleUpdateRowCell(idx, 'workedDays', Number(e.target.value))}
                                      className="w-12 text-center bg-slate-800/50 text-white font-extrabold focus:bg-slate-850 rounded border border-slate-750"
                                    />
                                    <span className="text-[10px] text-slate-500">วัน</span>
                                  </div>
                                </td>

                                {/* 8. จำนวนเงิน ได้จากการคูณ */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850 font-bold text-blue-300 font-bold">
                                  ฿{row.workedAmount.toLocaleString()}
                                </td>

                                {/* 9. ค่าล่วงเวลา (OT) */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850">
                                  <input
                                    type="number"
                                    value={row.overtimePay}
                                    onChange={e => handleUpdateRowCell(idx, 'overtimePay', Number(e.target.value))}
                                    className="w-full text-right bg-transparent text-emerald-400 font-bold focus:bg-slate-800 focus:outline-none px-1 py-0.5 rounded border border-transparent hover:border-slate-800"
                                  />
                                </td>

                                {/* 10. รายการหัก (ระบุ / จำนวนเงินหัก) */}
                                <td className="p-1.5 border-r border-slate-850">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="text"
                                      value={row.deductionDesc}
                                      onChange={e => handleUpdateRowCell(idx, 'deductionDesc', e.target.value)}
                                      placeholder="สาเหตุหัก"
                                      className="w-full text-[9px] bg-slate-850 text-slate-300 focus:bg-slate-850 border border-slate-750 rounded px-1"
                                    />
                                    <div className="flex items-center justify-end">
                                      <span className="text-[8px] text-slate-500 mr-1">฿</span>
                                      <input
                                        type="number"
                                        value={row.deductionAmount}
                                        onChange={e => handleUpdateRowCell(idx, 'deductionAmount', Number(e.target.value))}
                                        className="w-16 text-right bg-transparent text-rose-400 font-bold focus:bg-slate-850 border border-transparent hover:border-slate-850 rounded"
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* 11. รวมเงินได้พึงมี */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850 font-bold text-slate-200">
                                  ฿{row.totalEarnings.toLocaleString()}
                                </td>

                                {/* 12. ภาษี พ.ง.ด. */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850">
                                  <input
                                    type="number"
                                    value={row.tax}
                                    onChange={e => handleUpdateRowCell(idx, 'tax', Number(e.target.value))}
                                    className="w-full text-right bg-transparent text-rose-350 focus:bg-slate-850 border border-transparent hover:border-slate-800 rounded text-rose-300 font-medium"
                                  />
                                </td>

                                {/* 13. ประกันสังคม */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850">
                                  <input
                                    type="number"
                                    value={row.socialSecurity}
                                    onChange={e => handleUpdateRowCell(idx, 'socialSecurity', Number(e.target.value))}
                                    className="w-full text-right bg-transparent text-rose-350 focus:bg-slate-850 border border-transparent hover:border-slate-800 rounded text-rose-300 font-medium"
                                  />
                                </td>

                                {/* 14. ผลตอบแทนอื่นๆ */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850">
                                  <input
                                    type="number"
                                    value={row.otherBenefits}
                                    onChange={e => handleUpdateRowCell(idx, 'otherBenefits', Number(e.target.value))}
                                    className="w-full text-right bg-transparent text-indigo-300 focus:bg-slate-850 border border-transparent hover:border-slate-800 rounded font-medium"
                                  />
                                </td>

                                {/* 15. รวมรายจ่ายยอดหัก */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850 font-bold text-rose-400 bg-rose-950/10">
                                  ฿{row.totalDeductions.toLocaleString()}
                                </td>

                                {/* 16. รวมจ่ายสุทธิ */}
                                <td className="p-1.5 text-right font-mono border-r border-slate-850 font-black text-emerald-400 bg-emerald-950/30">
                                  ฿{row.netPay.toLocaleString()}
                                </td>

                                {/* 17. ลายมือชื่อพนักงาน */}
                                <td className="p-1.5 text-center bg-slate-950/30">
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={row.signed}
                                        onChange={e => handleUpdateRowCell(idx, 'signed', e.target.checked)}
                                        className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-opacity-40"
                                      />
                                      <span className="text-[9px] text-slate-400 font-bold">โอนปักษ์นี้</span>
                                    </label>
                                    {row.signed ? (
                                      <span className="text-[8px] font-black tracking-widest text-[#dc2626] border-2 border-dashed border-[#dc2626]/70 rounded px-1 py-0.5 bg-white/20 uppercase inline-block rotate-[-5deg] scale-90" style={{ fontFamily: "sans-serif" }}>
                                        PAID / จ่ายแล้ว
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-slate-500 italic block border-b border-dashed border-slate-700 w-20 mx-auto pt-1 h-4"></span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {/* STATS TOTALS FOOTER AT BOTTOM AS A PERFECT EXCEL RECORD */}
                      {getActivePeriodRows().length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-950 text-slate-200 font-black border-t-2 border-slate-850 text-[10.5px]">
                            <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-slate-400">
                              📊 รวมยอดตามงวด (Grand Totals):
                            </td>
                            {/* Base salary sum */}
                            <td className="p-2 text-right font-mono text-slate-350">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.baseSalary, 0).toLocaleString()}
                            </td>
                            <td className="p-2 text-right border-l border-slate-900 border-r border-slate-900"></td>
                            <td className="p-2 text-right"></td>
                            {/* Worked amount sum */}
                            <td className="p-2 text-right font-mono text-blue-300 border-l border-slate-900 border-r border-slate-900 font-bold">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.workedAmount, 0).toLocaleString()}
                            </td>
                            {/* OT sum */}
                            <td className="p-2 text-right font-mono text-emerald-400 border-r border-slate-900 font-bold">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.overtimePay, 0).toLocaleString()}
                            </td>
                            <td className="p-2 text-right"></td>
                            {/* Earnings sum */}
                            <td className="p-2 text-right font-mono text-slate-200 border-l border-slate-900 border-r border-slate-900 font-bold font-bold">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.totalEarnings, 0).toLocaleString()}
                            </td>
                            {/* Tax sum */}
                            <td className="p-2 text-right font-mono text-rose-350 border-r border-slate-900">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.tax, 0).toLocaleString()}
                            </td>
                            {/* SSO sum */}
                            <td className="p-2 text-right font-mono text-rose-350 border-r border-slate-900">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.socialSecurity, 0).toLocaleString()}
                            </td>
                            {/* Benefits sum */}
                            <td className="p-2 text-right font-mono text-indigo-300 border-r border-slate-900">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.otherBenefits, 0).toLocaleString()}
                            </td>
                            {/* Total deductions sum */}
                            <td className="p-2 text-right font-mono text-rose-400 bg-rose-950/15 border-r border-slate-900">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.totalDeductions, 0).toLocaleString()}
                            </td>
                            {/* NET pay sum */}
                            <td className="p-2 text-right font-mono text-emerald-400 bg-emerald-950/30 text-[12px] font-black">
                              ฿{getActivePeriodRows().reduce((acc, r) => acc + r.netPay, 0).toLocaleString()}
                            </td>
                            <td className="p-2 text-center text-[10px] text-slate-400 font-bold">
                              โอนจริง {getActivePeriodRows().filter(r => r.signed).length} ท่าน
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between text-slate-400 text-[10px] sm:text-xs gap-3 font-sans">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="font-extrabold text-blue-400 block">• คำแนะนำการใช้งานสมุดสรุปลงเวลากรมสวัสดิการและคุ้มครองแรงงาน:</span>
                    <p className="font-medium text-slate-400 text-[10px] leading-relaxed">
                      ตารางด้านบนถูกสร้างมาเพื่อให้สอดคล้องกับข้อกำหนดมาตราการจัดทะเบียนเงินได้และสมุดจ่ายค่าจ้างตามกฎหมายแรงงานไทย ท่านสามารถแก้ไข ชื่อพนักงาน เพศ สัญชาติ วันอัตราปกติ จำนวนวันที่มาทำงานจริง ระบุรายการแจ้งหัก และเซ็ตสถานะโอนเงินลงมือชื่อเพื่อใช้ส่งเป็นหลักฐานประกอบชำระภาษี/พ.ง.ด. ได้ในแต่ละปีบัญชี
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center justify-end gap-2">
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded font-bold">
                      💾 บันทึกแบบเรียลไทม์เรียบร้อย
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini Payroll Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">ฐานเงินเดือนพนักงานรวม</span>
            <span className="text-xl font-extrabold text-blue-900">฿{totalBase.toLocaleString()}</span>
          </div>
          <div className="w-9 h-9 bg-blue-200/50 rounded-lg flex items-center justify-center text-blue-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">ค่าตอบแทนพิเศษ / โบนัส</span>
            <span className="text-xl font-extrabold text-indigo-900">฿{totalBonus.toLocaleString()}</span>
          </div>
          <div className="w-9 h-9 bg-indigo-200/50 rounded-lg flex items-center justify-center text-indigo-700">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 rounded-xl border border-rose-100 flex flex-col justify-between">
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">ยอดเงินหักรวมสะสม</span>
              <span className="text-xl font-extrabold text-red-900">฿{(totalDeductions + totalSSO).toLocaleString()}</span>
            </div>
            <div className="w-9 h-9 bg-rose-200/50 rounded-lg flex items-center justify-center text-red-700">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 font-medium border-t border-rose-100/60 pt-1 flex justify-between">
            <span>ประกันสังคม สปส.: <b>฿{totalSSO.toLocaleString()}</b></span>
            <span>หักอื่น ๆ: <b>฿{totalDeductions.toLocaleString()}</b></span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-xl text-white flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold text-blue-100 block uppercase">รายจ่ายสุทธิยอดโอน (Net)</span>
            <span className="text-xl font-extrabold">฿{totalNet.toLocaleString()}</span>
          </div>
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-white">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="bg-white p-4.5 rounded-xl border border-blue-100 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ค้นหาด้วยชื่อพนักงาน, รหัสประจำตัว หรือเลขที่ใบสำคัญจ่าย..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs md:text-sm pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 lg:flex gap-3">
            {/* Year Filter */}
            <div className="w-full lg:w-36">
              <select
                value={selectedYearFilter}
                onChange={e => setSelectedYearFilter(e.target.value)}
                className="w-full text-xs md:text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">🗓️ เลือกปีทั้งหมด</option>
                <option value="2025">ปี พ.ศ. 2568</option>
                <option value="2026">ปี พ.ศ. 2569</option>
                <option value="2027">ปี พ.ศ. 2570</option>
              </select>
            </div>

            {/* Month Filter */}
            <div className="w-full lg:w-40">
              <select
                value={selectedMonthFilter}
                onChange={e => setSelectedMonthFilter(e.target.value)}
                className="w-full text-xs md:text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-750 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">📅 เลือกเดือนทั้งหมด</option>
                <option value="1">มกราคม (Jan)</option>
                <option value="2">กุมภาพันธ์ (Feb)</option>
                <option value="3">มีนาคม (Mar)</option>
                <option value="4">เมษายน (Apr)</option>
                <option value="5">พฤษภาคม (May)</option>
                <option value="6">มิถุนายน (Jun)</option>
                <option value="7">กรกฎาคม (Jul)</option>
                <option value="8">สิงหาคม (Aug)</option>
                <option value="9">กันยายน (Sep)</option>
                <option value="10">ตุลาคม (Oct)</option>
                <option value="11">พฤศจิกายน (Nov)</option>
                <option value="12">ธันวาคม (Dec)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Dept Filter */}
          <div>
            <select
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="w-full text-xs md:text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">กรองทุกแผนก</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full text-xs md:text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">กรองทุกสถานะโอน</option>
              <option value="paid">จ่ายเงินเสร็จสิ้น</option>
              <option value="pending">รออนุมัติจ่าย</option>
              <option value="hold">ระงับชั่วคราว</option>
            </select>
          </div>

          {/* Period Cycle Filter */}
          <div>
            <select
              value={selectedPeriodFilter}
              onChange={e => setSelectedPeriodFilter(e.target.value)}
              className="w-full text-xs md:text-sm border border-blue-200 bg-blue-50/25 rounded-lg px-3 py-2 text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">🗓️ กรองทุกงวดจ่ายเงินเดือน</option>
              <option value="1">งวดที่ 1 (วันที่ 1-15 ของทุกเดือน)</option>
              <option value="2">งวดที่ 2 (วันที่ 16-31 ของทุกเดือน)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 rounded-tl-2xl">รหัส</th>
                <th className="p-4">พนักงาน</th>
                <th className="p-4">สังกัดแผนก / ตำแหน่ง</th>
                <th className="p-4 text-right">เงินเดือนเริ่มต้น</th>
                <th className="p-4 text-right">โบนัส (+)</th>
                <th className="p-4 text-right text-rose-650">ประกันสังคม สปส. (-)</th>
                <th className="p-4 text-right">ส่วนหักอื่น ๆ (-)</th>
                <th className="p-4 text-right text-blue-900 font-bold">สุทธิ (Net)</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-center rounded-tr-2xl">จัดการแก้ไข</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEmployees.map((emp) => {
                const ssoVal = getEmpSSO(emp);
                const baseVal = getEmpBaseVal(emp);
                const netAmount = baseVal + emp.bonus - emp.deduction - ssoVal;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-500 font-mono text-xs">{emp.employeeId}</span>
                        <span className="text-[10px] text-blue-620 text-blue-600 font-bold font-mono mt-0.5" title="เลขที่ใบสำคัญจ่าย (งวด/ดด/ปป-ลำดับ)">
                          📄 {getSlipDocNo(emp)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 leading-snug">{emp.name}</span>
                          {emp.paymentPeriod === '2' ? (
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200/50">
                              งวด 2 (16-31)
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200/50">
                              งวด 1 (1-15)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">
                          {emp.bankName} เลขบัญชี {emp.bankAccount}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full inline-block w-fit">
                          {getDeptName(emp.departmentId)}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold mt-1 pl-1">{emp.position}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-slate-700">
                          ฿{baseVal.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {emp.salaryType === 'daily' ? `฿${emp.baseSalary}/วัน (☀️ ${emp.workedDays || 15} วัน)` : 'บ./เดือน (🗓️รายเดือน)'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-600 font-semibold">
                      +{emp.bonus > 0 ? `฿${emp.bonus.toLocaleString()}` : '0'}
                    </td>
                    <td className="p-4 text-right font-mono text-red-500 font-semibold">
                      {ssoVal > 0 ? `-฿${ssoVal.toLocaleString()}` : '0'}
                    </td>
                    <td className="p-4 text-right font-mono text-rose-500 font-semibold">
                      {emp.deduction > 0 ? `-฿${emp.deduction.toLocaleString()}` : '0'}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-blue-900">
                      ฿{netAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      {emp.paymentStatus === 'paid' && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 shadow-xs">
                          <CheckCircle className="w-3.5 h-3.5" /> จ่ายแล้ว
                        </span>
                      )}
                      {emp.paymentStatus === 'pending' && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> รอโอนจ่าย
                        </span>
                      )}
                      {emp.paymentStatus === 'hold' && (
                        <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> ระงับโอน
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`pay-slip-${emp.id}`}
                          onClick={() => handleViewPaySlip(emp)}
                          className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 p-1.5 rounded-lg border border-transparent hover:border-blue-100 text-xs font-semibold flex items-center gap-1"
                          title="ดูสลิปเงินเดือน"
                        >
                          <FileSpreadsheet className="w-4.5 h-4.5" />
                        </button>
                        <button
                          id={`edit-emp-${emp.id}`}
                          onClick={() => handleOpenEditModal(emp)}
                          className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg border border-transparent hover:border-blue-100"
                          title="แก้ไขข้อมูลบุคลากร"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          id={`delete-emp-${emp.id}`}
                          onClick={() => setEmployeeToDelete(emp)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-100"
                          title="ลบบุคลากร"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลบุคลากรหรืออัตราเงินเดือนตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT EMPLOYEE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-blue-100 shadow-2xl w-full max-w-2xl overflow-hidden my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4.5 border-b border-slate-100 bg-blue-50/70">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  {editingEmployee ? `แก้ไขพนักงาน: ${nameInput}` : 'เพิ่มข้อมูลบุคลากร / กำหนดเงินเดือนใหม่'}
                </h4>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                
                {/* Visual Section: Profiler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Row 1 */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">รหัสพนักงาน (ID Code) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น EMP008"
                      value={empIdInput}
                      onChange={e => setEmpIdInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">ชื่อ - นามสกุล *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น นายอภิเดช ธรรมศิลป์"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">สังกัดแผนกย่อย *</label>
                    <select
                      value={deptIdInput}
                      onChange={e => setDeptIdInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">ตำแหน่งงาน *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น Content Creator / Backend Developer"
                      value={positionInput}
                      onChange={e => setPositionInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                {/* Financial Sections */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-4">
                  <span className="text-xs font-bold text-blue-900 block border-b border-blue-100 pb-1.5 uppercase tracking-wide">
                    ตั้งค่ารายรับ - รายหัก ประกันสังคม และภาษี
                  </span>

                  <div className={`grid grid-cols-1 ${salaryTypeInput === 'daily' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3`}>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">ประเภทอัตราจ้าง *</label>
                      <select
                        value={salaryTypeInput}
                        onChange={e => {
                          const val = e.target.value as 'monthly' | 'daily';
                          setSalaryTypeInput(val);
                          if (val === 'daily') {
                            setBaseSalaryInput(500);
                            setWorkedDaysInput(15);
                          } else {
                            setBaseSalaryInput(25000);
                            setWorkedDaysInput(30);
                          }
                        }}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="monthly">รายเดือน</option>
                        <option value="daily">รายวัน</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">
                        {salaryTypeInput === 'daily' ? 'ค่าจ้างรายวัน/วัน *' : 'เงินเดือนพื้นฐาน/เดือน *'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">฿</span>
                        <input 
                          type="number" 
                          required
                          min={0}
                          value={baseSalaryInput}
                          onChange={e => setBaseSalaryInput(Number(e.target.value))}
                          className="w-full text-sm pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono font-semibold" 
                        />
                      </div>
                    </div>

                    {salaryTypeInput === 'daily' && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">จำนวนวันทำงาน *</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            required
                            min={1}
                            max={31}
                            value={workedDaysInput}
                            onChange={e => setWorkedDaysInput(Number(e.target.value))}
                            className="w-full text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono font-semibold" 
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">โบนัส / สวัสดิการพิเศษ *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-bold">฿</span>
                        <input 
                          type="number" 
                          required
                          min={0}
                          value={bonusInput}
                          onChange={e => setBonusInput(Number(e.target.value))}
                          className="w-full text-sm pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono font-semibold text-emerald-600 bg-emerald-50/20" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between pb-0.5">
                        <label className="text-xs font-semibold text-slate-600">ประกันสังคม สปส. *</label>
                        <label className="text-[10px] text-blue-600 font-bold flex items-center gap-1 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={autoSSO} 
                            onChange={e => setAutoSSO(e.target.checked)} 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          ออโต้ 5%
                        </label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-red-500 font-bold">฿</span>
                        <input 
                          type="number" 
                          required
                          min={0}
                          disabled={autoSSO}
                          value={socialSecurityInput}
                          onChange={e => setSocialSecurityInput(Number(e.target.value))}
                          className={`w-full text-sm pl-7 pr-3 py-1.5 border rounded-lg text-right font-mono font-semibold ${autoSSO ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'text-slate-800 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'}`} 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">ค่าปรับ / ส่วนหักอื่น ๆ *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-rose-600 font-bold">฿</span>
                        <input 
                          type="number" 
                          required
                          min={0}
                          value={deductionInput}
                          onChange={e => setDeductionInput(Number(e.target.value))}
                          className="w-full text-sm pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono font-semibold text-rose-500 bg-rose-50/20" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Net preview box */}
                  <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">คำนวณเงินโอนสุทธิเบื้องต้น (หักประกันสังคมแล้ว):</span>
                    <span className="text-base font-extrabold text-blue-900 font-mono">
                      ฿{(Number(baseSalaryInput) + Number(bonusInput) - Number(deductionInput) - Number(socialSecurityInput)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Bank Details, Bank Name, Cycle Period & Date */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">สาขาปฏิบัติงาน *</label>
                    <select
                      value={branchInput}
                      onChange={e => setBranchInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                    >
                      <option value="สำนักงานใหญ่">🏢 สำนักงานใหญ่</option>
                      <option value="สาขาควนขนุน">📍 สาขาควนขนุน</option>
                      <option value="สาขาพัทลุง">📍 สาขาพัทลุง</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">งวดการจ่ายเงินเดือน *</label>
                    <select
                      value={paymentPeriodInput}
                      onChange={e => setPaymentPeriodInput(e.target.value as '1' | '2')}
                      className="w-full text-sm border border-blue-200 bg-blue-50/20 rounded-lg px-3 py-2 text-blue-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">งวดที่ 1 (วันที่ 1-15)</option>
                      <option value="2">งวดที่ 2 (วันที่ 16-31)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">วันที่ทำการจ่ายเงิน *</label>
                    <input 
                      type="date"
                      required
                      value={createdAtInput}
                      onChange={e => setCreatedAtInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">สถาบันธนาคารโอนเงิน</label>
                    <select
                      value={bankNameInput}
                      onChange={e => setBankNameInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย (K-Bank)</option>
                      <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
                      <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
                      <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย (KTB)</option>
                      <option value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต (TTB)</option>
                      <option value="ธนาคารออมสิน">ธนาคารออมสิน (GSB)</option>
                      <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                      <option value="เงินสด">💵 จ่ายเป็นเงินสด (Cash)</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600">เลขที่บัญชีธนาคาร (ระบุจ่ายสด/เว้นขีดข้ามได้) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น 123-4-56789-0"
                      value={bankAccountInput}
                      onChange={e => setBankAccountInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono font-bold" 
                    />
                  </div>
                </div>

                {/* Payroll Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">สถานะการจ่ายเงินเดือน *</label>
                  <select
                    value={statusInput}
                    onChange={e => setStatusInput(e.target.value as 'paid' | 'pending' | 'hold')}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    <option value="pending">⏳ รอการจ่ายเงิน (Pending Approval)</option>
                    <option value="paid">✅ ชำระเงินเรียบร้อยแล้ว (Transfer Paid)</option>
                    <option value="hold">❌ ระงับชั่วคราวเพื่อตรวจสอบ (Hold / Audit Needed)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    id="submit-payroll-btn"
                    type="submit" 
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:shadow-xs cursor-pointer font-bold animate-pulse"
                  >
                    {editingEmployee ? 'บันทึกแก้ไข' : 'บันทึกพนักงานใหม่'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAY SLIP DRAMATIC DETAILED PREVIEW */}
      <AnimatePresence>
        {activeSlipEmployee && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-blue-200 shadow-2xl w-full max-w-3xl overflow-hidden text-slate-800 flex flex-col max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Slip Header container */}
              <div className="bg-blue-800 px-6 py-4 text-white flex items-center justify-between border-b border-blue-900 shadow-xs shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-700/60 rounded-xl">
                    <Printer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-200 font-extrabold uppercase tracking-widest block">แม่แบบสลิปเงินเดือน A4 แบ่งครึ่ง / A4 DUAL-PANE COPIES</span>
                    <h3 className="text-sm font-black text-white">ใบสำคัญจ่ายเงินตอบแทนคู่สำเนา (Carbon Payslip Template)</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSlipEmployee(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-blue-100 hover:text-white transition-colors cursor-pointer"
                  title="ปิดเครื่องมือพิมพ์"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Simulated A4 Document standard sheet layout */}
              <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-100 space-y-6 scrollbar-thin">
                
                {/* Paper sheet */}
                <div ref={printRef} className="bg-white p-5 sm:p-7 rounded-xl shadow-lg border border-slate-200 w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
                  
                  {/* Part 1 Label indicator */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] uppercase font-black tracking-widest text-blue-805 font-semibold">ส่วนที่ 1: สำหรับพนักงาน (ต้นฉบับ / Original Staff Receipt)</span>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">ต้นฉบับสลิปเงินเดือน</span>
                  </div>

                  {/* Render copy 1 */}
                  {renderSlipCopy(activeSlipEmployee, "ต้นฉบับสำหรับพนักงาน (Staff Copy)", "ORIGINAL RECEIPT")}

                  {/* Perforated Tear Line */}
                  <div className="relative py-4 flex items-center justify-center select-none">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed border-slate-350" />
                    </div>
                    <div className="relative bg-white border border-slate-200/80 rounded-full px-4 py-1 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-black shadow-xs z-10 scale-90 sm:scale-100">
                      <Scissors className="w-3.5 h-3.5 text-slate-400 rotate-90 shrink-0" />
                      <span>---------------- รอยประรอยตัดสำหรับฉีกพับแยกสลิปเงินเดือนภายนอก (Fold/Tear Line) ----------------</span>
                    </div>
                  </div>

                  {/* Part 2 Label indicator */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-250">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 font-semibold">ส่วนที่ 2: สำหรับฝ่ายบุคคล / คลังคู่สำเนา (สำเนาคาร์บอน / Duplicate Copy)</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">สำเนาเหมือนต้นฉบับทุกประการ</span>
                  </div>

                  {/* Render copy 2 */}
                  {renderSlipCopy(activeSlipEmployee, "สำเนาสำหรับฝ่ายบุคคล/บริษัท (Company Copy)", "DUPLICATE RECORD")}

                </div>

                {/* Print Hint Card */}
                <div className="bg-blue-50/60 border border-blue-100/80 p-3 rounded-lg max-w-3xl mx-auto flex items-start gap-2 text-[11px] text-blue-850">
                  <span className="text-blue-500 text-lg">💡</span>
                  <p className="leading-relaxed font-bold">
                    <strong>คำแนะนำการพิมพ์:</strong> สลิปถูกจัดวางตามรูปแบบฟอร์มขนาด A4 มาตรฐาน (กว้าง x สูง) แบ่งกึ่งกลางแนวนอน ทำให้ได้เอกสารใบเสร็จขนาด 5.5 x 8.5 นิ้ว จำนวนสองใบที่พิมพ์ออกมาได้หน้าคู่อย่างประหยัดในกระดาษเดียว เหมาะสำหรับการฉีกแบ่งและบันทึกแฟ้มสำนักงาน
                  </p>
                </div>
              </div>

              {/* Close Button Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">จัดเตรียมโดยระบบสารสนเทศอัตโนมัติของ{companySettings?.name || "บริษัทอภิวัฒน์เครื่องครัว จำกัด"}</span>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button 
                    disabled={isGeneratingPdf}
                    onClick={() => setActiveSlipEmployee(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ปิดส่วนนี้
                  </button>
                  <button 
                    disabled={isGeneratingPdf}
                    onClick={downloadSlipPdf}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:shadow-md cursor-pointer transition-colors disabled:opacity-50"
                    title="ดาวน์โหลดไฟล์ PDF ใบเสร็จรับเงิน A4 สองคู่สำเนา"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
                        <span>กำลังสร้างไฟล์ PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" /> ดาวน์โหลด PDF (ใช้งานได้จริง)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODIFIED ALERTS (REQUIREMENT 4) */}
      <AnimatePresence>
        {employeeToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-800 border border-red-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-red-50 p-5 text-red-800 flex items-center gap-3 border-b border-red-100">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-650" />
                </div>
                <div>
                  <h3 className="text-base font-bold">แจ้งเตือนยืนยันการลบพนักงาน</h3>
                  <p className="text-[11px] text-red-700">ลบพนักงานออกจากระบบจัดเก็บข้อมูลเงินเดือนถาวร</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-650 leading-relaxed">
                  คุณแน่ใจหรือไม่ว่าต้องการดำเนินการลบพนักงาน <strong className="text-slate-900 font-bold">"{employeeToDelete.name}"</strong> (รหัส: <code className="text-red-600 font-mono font-bold bg-red-50 px-1 py-0.5 rounded">{employeeToDelete.employeeId}</code>)?
                </p>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/70 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-850 leading-normal">
                    <strong>คำเตือนหลัก:</strong> ข้อมูลบัญชีรับเงินเดือน, ยอดสะสม, ประวัติการลงเวลาทำงาน และ<strong>คำขอลาที่ค้างตรวจสอบทั้งหมด</strong>จะถูกถอนและลบออกถาวรทันทีเพื่อความสอดคล้องตรงกันของฐานข้อมูลและระบบคลาวด์
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEmployeeToDelete(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  ยืนยันการลบพนักงานถาวร
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WARNING ALERT FOR PENDING/HOLD PAYSLIP INQUIRY */}
      <AnimatePresence>
        {warningAlert && warningAlert.show && (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-800 border ${
                warningAlert.status === 'pending' ? 'border-amber-200' : 'border-rose-200'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className={`p-5 flex items-center gap-3 border-b ${
                warningAlert.status === 'pending' 
                  ? 'bg-amber-50 text-amber-850 border-amber-100/70' 
                  : 'bg-rose-50/80 text-rose-850 border-rose-100/70'
              }`}>
                <div className={`p-2 rounded-lg ${
                  warningAlert.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  <AlertCircle className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">แจ้งเตือนระบบการทำรายการ</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">ของพนักงาน: {warningAlert.employeeName}</p>
                </div>
              </div>

              <div className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black tracking-wide border shadow-xs ${
                    warningAlert.status === 'pending'
                      ? 'bg-amber-100 text-amber-850 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: warningAlert.status === 'pending' ? '#d97706' : '#dc2626' }} />
                    {warningAlert.message}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium px-2">
                  {warningAlert.status === 'pending' ? (
                    <>สถานะการโอนจ่ายรายนี้คือ <strong>"รอโอนจ่าย"</strong> จึงไม่สามารถเปิดดูเอกสารใบสำคัญจ่ายได้ชั่วคราว กรุณาแก้ไขสถานะเป็นดำเนินการโอนเสร็จสิ้นก่อน</>
                  ) : (
                    <>สถานะรายการนี้ถูก <strong>"ระงับการโอน"</strong> ระบบมีความจำเป็นต้องระงับการแสดงใบสำคัญจ่ายเพื่อความปลอดภัย โดยขณะนี้อยู่ในระหว่าง <strong>"รอดำเนินการอยู่"</strong></>
                  )}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setWarningAlert(null)}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-black transition-colors cursor-pointer w-full shadow-sm ${
                    warningAlert.status === 'pending'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/10'
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  ตกลง / ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
