import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CreditCard, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Building,
  CheckCircle2,
  XCircle,
  Clock3,
  TrendingDown,
  Activity,
  Coins
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend, 
  ResponsiveContainer 
} from 'recharts';
import { CompanySettings, EmployeeSalary, LeaveRequest } from '../types';

interface DashboardOverviewProps {
  companySettings: CompanySettings;
  employees: EmployeeSalary[];
  leaveRequests: LeaveRequest[];
  onNavigate: (tab: string) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
  dbConnected?: boolean;
  onOpenSyncHub?: () => void;
}

export default function DashboardOverview({
  companySettings,
  employees,
  leaveRequests,
  onNavigate,
  onApproveLeave,
  onRejectLeave,
  dbConnected = false,
  onOpenSyncHub
}: DashboardOverviewProps) {
  
  // Calculate stats
  const totalEmployees = employees.length;
  
  const getNetSalary = (emp: any) => {
    const sso = emp.socialSecurity !== undefined ? emp.socialSecurity : Math.min(750, Math.round(emp.baseSalary * 0.05));
    return emp.baseSalary + emp.bonus - emp.deduction - sso;
  };

  const [chartMode, setChartMode] = useState<'cumulative' | 'absolute'>('cumulative');
  const [selectedYears, setSelectedYears] = useState<number[]>([2024, 2025, 2026]);

  const toggleYearSelection = (year: number) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        setSelectedYears(selectedYears.filter(y => y !== year));
      }
    } else {
      setSelectedYears([...selectedYears, year].sort());
    }
  };

  const getAnnualSalaryData = () => {
    const yearsToShow = [2024, 2025, 2026];
    const monthsThai = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    // Initialize monthly values
    const data = monthsThai.map((monthName, idx) => {
      const monthNum = idx + 1;
      const row: any = { month: monthName };
      
      yearsToShow.forEach(year => {
        // Calculate total for this absolute month
        let monthlyTotal = 0;
        employees.forEach(emp => {
          let isActive = true;
          if (emp.startDate) {
            const parts = emp.startDate.split('-');
            const startY = parseInt(parts[0], 10);
            const startM = parseInt(parts[1], 10);
            if (!isNaN(startY) && !isNaN(startM)) {
              if (year < startY || (year === startY && monthNum < startM)) {
                isActive = false;
              }
            }
          }
          if (isActive) {
            monthlyTotal += getNetSalary(emp);
          }
        });
        row[`${year}_absolute`] = monthlyTotal;
      });
      return row;
    });

    // Convert absolute monthly totals to cumulative totals
    yearsToShow.forEach(year => {
      let accumulated = 0;
      data.forEach(row => {
        accumulated += row[`${year}_absolute`];
        row[`${year}`] = accumulated; // Cumulative column
      });
    });

    return data;
  };

  const chartData = getAnnualSalaryData();

  // Helper to get total for last month of year (cumulative total or absolute total)
  const getYearSummaryValue = (year: number, mode: 'cumulative' | 'absolute') => {
    if (mode === 'cumulative') {
      return chartData[11]?.[`${year}`] || 0;
    } else {
      return chartData.reduce((sum, row) => sum + (row[`${year}_absolute`] || 0), 0);
    }
  };

  const totalPayroll = employees.reduce((acc, emp) => {
    return acc + getNetSalary(emp);
  }, 0);
  
  const averageSalary = totalEmployees > 0 ? (totalPayroll / totalEmployees) : 0;
  
  const pendingPayments = employees.filter(emp => emp.paymentStatus === 'pending').length;
  const holdPayments = employees.filter(emp => emp.paymentStatus === 'hold').length;
  
  const pendingLeaves = leaveRequests.filter(req => req.status === 'pending').length;
  const activeLeavesToday = leaveRequests.filter(req => {
    if (req.status !== 'approved') return false;
    // Simple filter simulating today's date coverage
    const today = "2026-06-19";
    return req.type !== 'late' && req.startDate <= today && req.endDate >= today;
  }).length;

  const lateRecordsCount = leaveRequests.filter(req => req.type === 'late' && req.status === 'approved').length;

  // Department worker mapping
  const deptStats = companySettings.departments.map(dept => {
    const count = employees.filter(emp => emp.departmentId === dept.id).length;
    const deptPayroll = employees
      .filter(emp => emp.departmentId === dept.id)
      .reduce((sum, emp) => sum + getNetSalary(emp), 0);
    return {
      ...dept,
      actualWorkerCount: count,
      payroll: deptPayroll
    };
  });

  // Latest leave requests list
  const recentRequests = [...leaveRequests]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <span className="bg-blue-500/20 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-400/20">
            {companySettings.taxId ? `Tax ID: ${companySettings.taxId}` : 'ยังไม่ระบุเลขผู้เสียภาษี'}
          </span>
          <h2 className="text-2xl font-bold mt-2">{companySettings.name}</h2>
          <p className="text-blue-205 text-sm mt-1 text-blue-100">
            {companySettings.address}
          </p>
          
          {/* Firestore Connection Ribbon on Dashboard */}
          <div className="flex items-center gap-2 mt-3.5 bg-black/20 backdrop-blur-sm p-1.5 px-3 rounded-xl border border-white/5 w-fit">
            <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-xs font-semibold text-slate-100">
              สถานะประบบฐานข้อมูลคลาวด์: {dbConnected ? 'เชื่อมต่อออนไลน์ (Google Firebase)' : 'กำลังทำงานขัดข้อง / ออฟไลน์'}
            </span>
            {onOpenSyncHub && (
              <button
                onClick={onOpenSyncHub}
                className="text-[10px] bg-white/15 hover:bg-white/25 active:bg-white/35 text-white font-extrabold px-2 py-0.5 rounded transition-all ml-1.5 select-none cursor-pointer"
              >
                จัดการฐานข้อมูล ➔
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button 
            id="go-to-settings-btn"
            onClick={() => onNavigate('settings')} 
            className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border border-white/10"
          >
            <Building className="w-4 h-4" />
            ตั้งค่าข้อมูลบริษัท
          </button>
        </div>
      </div>

      {/* Grid STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: Employees */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-500">พนักงานทั้งหมด</span>
            <div className="text-3xl font-extrabold text-blue-900">{totalEmployees} <span className="text-sm font-normal text-slate-500">คน</span></div>
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
              แบ่งออกเป็น {companySettings.departments.length} แผนก
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-100/80 rounded-xl flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        {/* STAT 2: Expenses */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-500">งบประมาณเงินเดือนรวม</span>
            <div className="text-2xl font-extrabold text-blue-900">
              ฿{totalPayroll.toLocaleString()}
            </div>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
              เฉลี่ย ฿{Math.round(averageSalary).toLocaleString()} / คน
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-100/80 rounded-xl flex items-center justify-center text-indigo-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </motion.div>

        {/* STAT 3: Pending Approvals */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-500">การจ่ายเงินเดือนงวดนี้</span>
            <div className="text-3xl font-extrabold text-amber-600">
              {pendingPayments} <span className="text-xs font-normal text-slate-500">รอจ่าย</span>
              {holdPayments > 0 && <span className="text-sm text-red-500 ml-1">({holdPayments} ระงับ)</span>}
            </div>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">
              จ่ายแล้ว {employees.filter(e => e.paymentStatus === 'paid').length} / {totalEmployees} คน
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-100/80 rounded-xl flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>

        {/* STAT 4: Absenteeism */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-500">สถานะคำขอล่าสุด</span>
            <div className="text-3xl font-extrabold text-blue-600">
              {pendingLeaves} <span className="text-sm font-normal text-slate-500">คำขอรออนุมัติ</span>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
              วันนี้ลา {activeLeavesToday} คน · สายสะสม {lateRecordsCount} ครั้ง
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-100/80 rounded-xl flex items-center justify-center text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Visual Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Department Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">สัดส่วนพนักงานและเงินเดือนรายแผนก</h3>
              <span className="text-xs text-blue-600 font-medium">แยกตามโครงสร้างองค์กร</span>
            </div>
            
            <div className="space-y-4">
              {deptStats.map((dept, index) => {
                const percent = totalEmployees > 0 ? (dept.actualWorkerCount / totalEmployees) * 100 : 0;
                return (
                  <div key={dept.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-indigo-500' :
                          index === 2 ? 'bg-sky-400' : 'bg-cyan-500'
                        }`} />
                        {dept.name} ({dept.code})
                      </span>
                      <span>{dept.actualWorkerCount} คน ({Math.round(percent)}%)</span>
                    </div>
                    
                    {/* Visual Bar */}
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-indigo-500' :
                          index === 2 ? 'bg-sky-400' : 'bg-cyan-500'
                        }`}
                      />
                    </div>
                    
                    {/* Payroll for this dept */}
                    <div className="flex justify-between text-[11px] text-slate-400 pl-4 font-mono">
                      <span>ยอดจ่ายรวม: ฿{dept.payroll.toLocaleString()}</span>
                      <span>เฉลี่ย: ฿{dept.actualWorkerCount > 0 ? Math.round(dept.payroll / dept.actualWorkerCount).toLocaleString() : 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>* ยึดตามพนักงานที่สังกัดจริงในระบบ</span>
            <button 
              onClick={() => onNavigate('employees')}
              className="text-blue-600 hover:underline font-semibold"
            >
              แก้ไขบุคลากร →
            </button>
          </div>
        </div>

        {/* Right: Salary Overview & Payments breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">ความคืบหน้าการโอนเงินเดือนและสวัสดิการ</h3>
              <span className="text-xs text-blue-600 font-medium font-semibold bg-blue-50 px-2.5 py-1 rounded-full">รอบการจ่ายเงินเดือนปัจจุบัน</span>
            </div>

            {/* Simulated Donut with pure SVG & HTML for React 19 safety */}
            <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-slate-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Paid Segment (Dark Blue) */}
                  {totalEmployees > 0 && (
                    <motion.path
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{ 
                        strokeDasharray: `${(employees.filter(e => e.paymentStatus === 'paid').length / totalEmployees) * 100} 100` 
                      }}
                      transition={{ duration: 1 }}
                      className="text-blue-600"
                      strokeWidth="4"
                      strokeDasharray="0 100"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                  {/* Pending Segment (Amber) */}
                  {totalEmployees > 0 && (
                    <motion.path
                      initial={{ strokeDasharray: "0 100", strokeDashoffset: 0 }}
                      animate={{ 
                        strokeDasharray: `${(employees.filter(e => e.paymentStatus === 'pending').length / totalEmployees) * 100} 100`,
                        strokeDashoffset: -((employees.filter(e => e.paymentStatus === 'paid').length / totalEmployees) * 100)
                      }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="text-amber-500"
                      strokeWidth="4"
                      strokeDasharray="0 100"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                {/* Center Text */}
                <div className="absolute text-center">
                  <span className="text-xl font-bold text-slate-800">
                    {totalEmployees > 0 ? Math.round((employees.filter(e => e.paymentStatus === 'paid').length / totalEmployees) * 100) : 0}%
                  </span>
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">โอนสำเร็จแล้ว</p>
                </div>
              </div>

              {/* Indicator Legends */}
              <div className="flex-1 space-y-2.5 w-full">
                {/* Paid */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 block" />
                    <span className="text-xs font-semibold text-slate-700">จ่ายเงินเดือนเสร็จสิ้น</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {employees.filter(e => e.paymentStatus === 'paid').length} คน (฿{employees.filter(e => e.paymentStatus === 'paid').reduce((s, e) => s + getNetSalary(e), 0).toLocaleString()})
                  </span>
                </div>

                {/* Pending */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/55 border border-amber-100/50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 block" />
                    <span className="text-xs font-semibold text-slate-700">อยู่ระหว่างรอจ่าย</span>
                  </div>
                  <span className="text-xs font-bold text-amber-700">
                    {employees.filter(e => e.paymentStatus === 'pending').length} คน (฿{employees.filter(e => e.paymentStatus === 'pending').reduce((s, e) => s + getNetSalary(e), 0).toLocaleString()})
                  </span>
                </div>

                {/* Hold */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/55 border border-rose-100/50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 block" />
                    <span className="text-xs font-semibold text-slate-700">ระงับระงับการโอน</span>
                  </div>
                  <span className="text-xs font-bold text-rose-700">
                    {employees.filter(e => e.paymentStatus === 'hold').length} คน (฿{employees.filter(e => e.paymentStatus === 'hold').reduce((s, e) => s + getNetSalary(e), 0).toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>* คำนวณเป็นยอดสุทธิ (เงินเดือน + โบนัส - ยอดหักอื่น ๆ - ประกันสังคม)</span>
            <button 
              onClick={() => onNavigate('employees')}
              className="text-blue-600 hover:underline font-semibold"
            >
              ตรวจสอบบัญชีธนาคาร →
            </button>
          </div>
        </div>
      </div>

      {/* โมดูลวิเคราะห์ข้อมูลค่าใช้จ่ายและเงินเดือนพนักงานรายปี (Annual Salary & Cumulative Expense Analytics) */}
      <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">วิเคราะห์แนวโน้มงบประมาณและข้อมูลเงินเดือนสะสมรายปี</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              แสดงพฤติกรรมการจ่ายเงินเดือนและแนวโน้มสะสม ณ สิ้นปีเปรียบเทียบในแต่ละปีงบประมาณของบริษัทอภิวัฒน์เครื่องครัว
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartMode === 'cumulative'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                กราฟเส้นแบบสะสม (Cumulative)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('absolute')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartMode === 'absolute'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ยอดจ่ายรายเดือนเดี่ยว (Absolute)
              </button>
            </div>

            {/* Year Selector Toggles */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {[2024, 2025, 2026].map(year => {
                const isActive = selectedYears.includes(year);
                const colorClass = 
                  year === 2026 ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-extrabold" :
                  year === 2025 ? "border-sky-200 bg-sky-50 text-sky-700 font-extrabold" :
                  "border-amber-200 bg-amber-50 text-amber-700 font-extrabold";
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => toggleYearSelection(year)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      isActive 
                        ? colorClass
                        : "border-slate-200 hover:bg-slate-100 text-slate-400 font-semibold"
                    }`}
                  >
                    {year + 543}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend block */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold pl-1 text-slate-600 justify-start">
          {selectedYears.includes(2026) && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 rounded-full bg-emerald-500 block" style={{ backgroundColor: '#10b981' }} />
              <span>ปี 2569 (2026) : ฿{getYearSummaryValue(2026, chartMode).toLocaleString()}</span>
            </div>
          )}
          {selectedYears.includes(2025) && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 rounded-full bg-sky-500 block" style={{ backgroundColor: '#0284c7' }} />
              <span>ปี 2568 (2025) : ฿{getYearSummaryValue(2025, chartMode).toLocaleString()}</span>
            </div>
          )}
          {selectedYears.includes(2024) && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 rounded-full bg-amber-500 block bg-dashed" style={{ borderBottom: '1.5px dashed #d97706', width: '14px', height: '0', display: 'inline-block' }} />
              <span className="ml-1">ปี 2567 (2024) : ฿{getYearSummaryValue(2024, chartMode).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Chart Frame */}
        <div className="h-[280px] sm:h-[320px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(val) => `฿${(val / 1000).toLocaleString()}k`}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                formatter={(value: any) => [`฿${Number(value).toLocaleString()} บาท`, chartMode === 'cumulative' ? "ยอดสะสมสูงสุด" : "ยอดจ่ายประจำเดือน"]}
                labelFormatter={(label) => `เดือน: ${label}`}
                contentStyle={{ backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                itemStyle={{ color: '#38bdf8', fontWeight: 700 }}
              />
              
              {selectedYears.includes(2024) && (
                <Line
                  type="monotone"
                  dataKey={chartMode === 'cumulative' ? "2024" : "2024_absolute"}
                  name="ปี 2567"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#d97706', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {selectedYears.includes(2025) && (
                <Line
                  type="monotone"
                  dataKey={chartMode === 'cumulative' ? "2025" : "2025_absolute"}
                  name="ปี 2568"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {selectedYears.includes(2026) && (
                <Line
                  type="monotone"
                  dataKey={chartMode === 'cumulative' ? "2026" : "2026_absolute"}
                  name="ปี 2569"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-metric sub row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Growth / Increase Rate */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">มูลค่าเติบโตงบรายปี (YoY)</span>
              <span className="text-sm font-extrabold text-slate-800">
                +{((getYearSummaryValue(2026, 'cumulative') - getYearSummaryValue(2025, 'cumulative')) / (getYearSummaryValue(2025, 'cumulative') || 1) * 100).toFixed(1)}% 
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">ปี 2569 เปรียบเทียบ ปี 2568</p>
            </div>
          </div>

          {/* Card 2: Average Monthly Payroll */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider font-semibold">รายจ่ายเฉลี่ยรายเดือน (2569)</span>
              <span className="text-sm font-extrabold text-blue-800">
                ฿{(getYearSummaryValue(2026, 'absolute') / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">รวมเงินเดือน โบนัส และหักประกันสังคม</p>
            </div>
          </div>

          {/* Card 3: Year-end Project Projection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider font-semibold">ความคุ้มค่าเฉลี่ยต่อพนักงาน</span>
              <span className="text-sm font-extrabold text-indigo-800">
                ฿{(totalPayroll / (totalEmployees || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} / คน
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">ประเมินตามประวัติตัวจริงในฐานข้อมูลคลาวน์</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave and Attendance overview */}
      <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-base">รายการ ลา / มาสาย ล่าสุดที่รอส่งผล</h3>
            <p className="text-xs text-slate-500">คำขอบันทึกเวลาการทำงานที่ต้องจัดการอนุมัติ</p>
          </div>
          <button 
            onClick={() => onNavigate('leave')}
            className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          >
            ไปหน้าจัดการบันทึกเวลา ➜
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="p-3.5">ชื่อพนักงาน</th>
                <th className="p-3.5">ประเภท</th>
                <th className="p-3.5">วันที่แจ้ง</th>
                <th className="p-3.5">ระยะเวลา</th>
                <th className="p-3.5">เหตุผล</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5 text-right">ดำเนินการด่วน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentRequests.map((req) => {
                const getLeaveTypeBadge = (t: string) => {
                  switch (t) {
                    case 'sick': return <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-medium">ลาป่วย (Sick)</span>;
                    case 'personal': return <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium">ลากิจ (Personal)</span>;
                    case 'vacation': return <span className="bg-teal-100 text-teal-700 text-xs px-2.5 py-0.5 rounded-full font-medium">ลาพักร้อน (Vacation)</span>;
                    case 'late': return <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-medium">มาสาย (Late)</span>;
                    default: return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">อื่นๆ (Other)</span>;
                  }
                };

                return (
                  <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3.5 font-medium text-slate-800">{req.employeeName}</td>
                    <td className="p-3.5">{getLeaveTypeBadge(req.type)}</td>
                    <td className="p-3.5 text-slate-600 font-mono text-xs">
                      {req.startDate}{req.endDate !== req.startDate && ` ถึง ${req.endDate}`}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {req.type === 'late' ? `${req.durationMinutes} นาที` : `${req.durationDays} วัน`}
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-[200px] truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="p-3.5">
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 font-semibold px-2.5 py-0.5 rounded-full text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 font-semibold px-2.5 py-0.5 rounded-full text-xs">
                          <XCircle className="w-3.5 h-3.5" /> ปฏิเสธ
                        </span>
                      )}
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 font-semibold px-2.5 py-0.5 rounded-full text-xs animate-pulse">
                          <Clock3 className="w-3.5 h-3.5" /> รอตัดสินใจ
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            id={`approve-btn-${req.id}`}
                            onClick={() => onApproveLeave(req.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shadow-sm"
                          >
                            อนุมัติ
                          </button>
                          <button
                            id={`reject-btn-${req.id}`}
                            onClick={() => onRejectLeave(req.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all"
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">ทำรายการแล้ว</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentRequests.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              ไม่มีกิจกรรมหรือคำขอล่าสุดในขณะนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
