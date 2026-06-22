import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  HeartHandshake, 
  Plane, 
  FileCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
  X,
  User,
  Activity,
  Check,
  CheckSquare,
  Square,
  UserCheck,
  RefreshCw,
  FileText,
  Sliders,
  Filter,
  CheckSquare2,
  CalendarDays
} from 'lucide-react';
import { LeaveRequest, EmployeeSalary, DailyAttendance, AttendanceStatus } from '../types';

interface AttendanceViewProps {
  leaveRequests: LeaveRequest[];
  employees: EmployeeSalary[];
  onAddLeave: (req: LeaveRequest) => void;
  onUpdateLeave: (req: LeaveRequest) => void;
  onDeleteLeave: (id: string) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
}

export default function AttendanceView({
  leaveRequests,
  employees,
  onAddLeave,
  onUpdateLeave,
  onDeleteLeave,
  onApproveLeave,
  onRejectLeave
}: AttendanceViewProps) {
  
  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Sub-tab / menu selection: 'requests' | 'checklist'
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'checklist'>('checklist'); // default to checklist so users see the brand new feature immediately!
  const [selectedChecklistDate, setSelectedChecklistDate] = useState<string>('2026-06-19');
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [checklistDeptFilter, setChecklistDeptFilter] = useState<string>('all');
  const [showAutoSaveToast, setShowAutoSaveToast] = useState<boolean>(false);

  // Load daily attendance from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hr_daily_attendance');
    if (saved) {
      try {
        setDailyAttendance(JSON.parse(saved));
      } catch (e) {
        setDailyAttendance([]);
      }
    } else {
      // Create polished default records for today 2016-06-19
      const defaults: DailyAttendance[] = [
        { id: '2026-06-19_emp-1', date: '2026-06-19', employeeId: 'emp-1', status: 'present', note: 'มาทำงานเช้าตรงเวลา' },
        { id: '2026-06-19_emp-2', date: '2026-06-19', employeeId: 'emp-2', status: 'present', note: 'ตอกบัตร 08:15' },
        { id: '2026-06-19_emp-3', date: '2026-06-19', employeeId: 'emp-3', status: 'late', note: 'สาย 10 นาทีเนื่องจาก BTS ชัดข้อง' },
        { id: '2026-06-19_emp-4', date: '2026-06-19', employeeId: 'emp-4', status: 'leave', note: 'ลากิจฉุกเฉิน ทำทันตกรรมประสาทฟัน' },
        { id: '2026-06-19_emp-5', date: '2026-06-19', employeeId: 'emp-5', status: 'present', note: 'มาทำงานเช้าตรงเวลา' },
        { id: '2026-06-19_emp-6', date: '2026-06-19', employeeId: 'emp-6', status: 'absent', note: 'ขาดงาน ไม่ตอบกลับแชทไลน์' },
        { id: '2026-06-19_emp-7', date: '2026-06-19', employeeId: 'emp-7', status: 'swap_holiday', note: 'สลับแลกวันหยุดกับวันอาทิตย์นี้' },
      ];
      setDailyAttendance(defaults);
      localStorage.setItem('hr_daily_attendance', JSON.stringify(defaults));
    }
  }, []);

  // Sync to localstorage helper
  const saveDailyAttendance = (updated: DailyAttendance[]) => {
    setDailyAttendance(updated);
    localStorage.setItem('hr_daily_attendance', JSON.stringify(updated));
    if (typeof (window as any).triggerSapphireLocalUpdate === 'function') {
      (window as any).triggerSapphireLocalUpdate('daily_attendance', updated);
    }
    
    // flash simple auto save feedback
    setShowAutoSaveToast(true);
    const t = setTimeout(() => setShowAutoSaveToast(false), 1500);
    return () => clearTimeout(t);
  };

  // Listen for storage change events to trigger UI update (especially after dynamic cloud restore)
  useEffect(() => {
    const handleSyncReset = () => {
      const saved = localStorage.getItem('hr_daily_attendance');
      if (saved) {
        try {
          setDailyAttendance(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('sapphire_storage_updated', handleSyncReset);
    return () => window.removeEventListener('sapphire_storage_updated', handleSyncReset);
  }, []);

  const handleUpdateAttendanceStatus = (employeeId: string, date: string, status: AttendanceStatus, note?: string) => {
    const recordId = `${date}_${employeeId}`;
    const existsIndex = dailyAttendance.findIndex(item => item.id === recordId);
    let updated = [...dailyAttendance];

    if (existsIndex >= 0) {
      updated[existsIndex] = {
        ...updated[existsIndex],
        status,
        note: note !== undefined ? note : updated[existsIndex].note
      };
    } else {
      updated.push({
        id: recordId,
        date,
        employeeId,
        status,
        note: note || ''
      });
    }
    saveDailyAttendance(updated);
  };

  const handleUpdateAttendanceNote = (employeeId: string, date: string, note: string) => {
    const recordId = `${date}_${employeeId}`;
    const existsIndex = dailyAttendance.findIndex(item => item.id === recordId);
    let updated = [...dailyAttendance];

    if (existsIndex >= 0) {
      updated[existsIndex] = {
        ...updated[existsIndex],
        note
      };
    } else {
      updated.push({
        id: recordId,
        date,
        employeeId,
        status: 'present', // fallback to present
        note
      });
    }
    saveDailyAttendance(updated);
  };

  const handleMarkAllStatus = (status: AttendanceStatus) => {
    let updated = [...dailyAttendance];
    employees.forEach(emp => {
      const recordId = `${selectedChecklistDate}_${emp.id}`;
      const existsIndex = updated.findIndex(item => item.id === recordId);
      if (existsIndex >= 0) {
        updated[existsIndex] = {
          ...updated[existsIndex],
          status
        };
      } else {
        updated.push({
          id: recordId,
          date: selectedChecklistDate,
          employeeId: emp.id,
          status,
          note: ''
        });
      }
    });
    saveDailyAttendance(updated);
  };

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);

  // Form Inputs State
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [typeInput, setTypeInput] = useState<'sick' | 'personal' | 'vacation' | 'late' | 'other'>('sick');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [durationDaysInput, setDurationDaysInput] = useState(1);
  const [durationMinutesInput, setDurationMinutesInput] = useState(30);
  const [reasonInput, setReasonInput] = useState('');
  const [statusInput, setStatusInput] = useState<'approved' | 'pending' | 'rejected'>('pending');

  // Stats Counters (Approved only)
  const sickDays = leaveRequests
    .filter(r => r.type === 'sick' && r.status === 'approved')
    .reduce((sum, r) => sum + r.durationDays, 0);

  const personalDays = leaveRequests
    .filter(r => r.type === 'personal' && r.status === 'approved')
    .reduce((sum, r) => sum + r.durationDays, 0);

  const vacationDays = leaveRequests
    .filter(r => r.type === 'vacation' && r.status === 'approved')
    .reduce((sum, r) => sum + r.durationDays, 0);

  const totalLateMinutes = leaveRequests
    .filter(r => r.type === 'late' && r.status === 'approved')
    .reduce((sum, r) => sum + (r.durationMinutes || 0), 0);

  // Filter conditions
  const filteredRequests = leaveRequests.filter(req => {
    const matchesSearch = req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || req.type === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === 'all' || req.status === selectedStatusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingRequest(null);
    setEmployeeIdInput(employees[0]?.id || '');
    setTypeInput('sick');
    // Set to today's date placeholder
    const today = "2026-06-19";
    setStartDateInput(today);
    setEndDateInput(today);
    setDurationDaysInput(1);
    setDurationMinutesInput(30);
    setReasonInput('');
    setStatusInput('pending');
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (req: LeaveRequest) => {
    setEditingRequest(req);
    setEmployeeIdInput(req.employeeId);
    setTypeInput(req.type);
    setStartDateInput(req.startDate);
    setEndDateInput(req.endDate);
    setDurationDaysInput(req.durationDays);
    setDurationMinutesInput(req.durationMinutes || 30);
    setReasonInput(req.reason);
    setStatusInput(req.status);
    setIsModalOpen(true);
  };

  // Delete Action
  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบคำขอบันทึกเวลาของ "${name}" ทิ้งถาวรหรือไม่?`)) {
      onDeleteLeave(id);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeIdInput || !startDateInput || !reasonInput.trim()) {
      alert("กรุณากรอกข้อมูลวันที่และระบุเหตุผลในการทำรายการ");
      return;
    }

    // Lookup full employee name for historical snapshots
    const selectedEmp = employees.find(emp => emp.id === employeeIdInput);
    const empName = selectedEmp ? selectedEmp.name : 'ไม่ระบุชื่อพนักงาน';

    const payload: LeaveRequest = {
      id: editingRequest ? editingRequest.id : `req-${Date.now()}`,
      employeeId: employeeIdInput,
      employeeName: empName,
      type: typeInput,
      startDate: startDateInput,
      endDate: typeInput === 'late' ? startDateInput : endDateInput,
      durationDays: typeInput === 'late' ? 0 : Number(durationDaysInput),
      durationMinutes: typeInput === 'late' ? Number(durationMinutesInput) : undefined,
      reason: reasonInput,
      status: statusInput
    };

    if (editingRequest) {
      onUpdateLeave(payload);
    } else {
      onAddLeave(payload);
    }

    setIsModalOpen(false);
  };

  // Auto-sync duration input on date changes (Bonus UI polish!)
  const handleDateChange = (start: string, end: string) => {
    setStartDateInput(start);
    setEndDateInput(end);
    if (start && end && typeInput !== 'late') {
      const sDate = new Date(start);
      const eDate = new Date(end);
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (!isNaN(diffDays) && diffDays > 0) {
        setDurationDaysInput(diffDays);
      }
    }
  };

  // Counts for the selected date on checklist
  const dayRecords = dailyAttendance.filter(item => item.date === selectedChecklistDate);
  const presentCount = employees.filter(emp => {
    const record = dayRecords.find(r => r.employeeId === emp.id);
    return !record || record.status === 'present';
  }).length;

  const leaveCount = dayRecords.filter(r => r.status === 'leave').length;
  const lateCount = dayRecords.filter(r => r.status === 'late').length;
  const absentCount = dayRecords.filter(r => r.status === 'absent').length;
  const swapCount = dayRecords.filter(r => r.status === 'swap_holiday').length;

  // Get unique departments present in employees list
  const uniqueDepts = Array.from(new Set(employees.map(emp => emp.departmentId || ''))).filter(Boolean);

  const getDeptFriendlyName = (deptId: string) => {
    switch (deptId) {
      case 'dept-hr': return 'ฝ่ายบุคคล (HR)';
      case 'dept-it': return 'ฝ่ายเทคโนโลยี (IT)';
      case 'dept-mkt': return 'ฝ่ายการตลาด (Marketing)';
      case 'dept-sales': return 'ฝ่ายขาย (Sales)';
      case 'dept-acc': return 'ฝ่ายบัญชี (Accounting)';
      default: return deptId.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-blue-100 gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            ระบบบันทึกเวลา พนักงานลา มาสาย ขาด สลับวันหยุด
          </h2>
          <p className="text-xs text-slate-500 mt-1">บริหารจัดการเวลาและติ๊กสถานะลงเวลาเข้างานประจำวัน สะดวกใช้งานง่ายด้วยปฏิทิน และแบบฟอร์มตรวจสอบประวัติ</p>
        </div>
        {activeSubTab === 'requests' && (
          <button 
            id="add-leave-trigger-btn"
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ml-auto sm:ml-0"
          >
            <Plus className="w-4.5 h-4.5" />
            สร้างคำร้องขอลาใหม่
          </button>
        )}
      </div>

      {/* Segmented Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row border border-slate-200 bg-slate-55 bg-slate-50/50 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveSubTab('checklist')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'checklist' 
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-150/40'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          ตารางติ๊กสถานะ ขาด/ลา/มาสาย/สลับวันหยุด รายวัน (Daily Checklist)
        </button>
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'requests' 
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-150/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          ประวัติคำขอนุมัติการลา & บันทึกเวลาลาสะสม (Leave Requests)
        </button>
      </div>

      {activeSubTab === 'checklist' ? (
        <div className="space-y-6">
          {/* Stats Bar and Date Selector */}
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/20 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div className="space-y-2 max-w-sm">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-wider block">📅 เลือกวันที่ลงบันทึกเวลาทำงาน</label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <CalendarDays className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    type="date"
                    value={selectedChecklistDate}
                    onChange={e => setSelectedChecklistDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-blue-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-xs cursor-pointer"
                  />
                </div>
                {showAutoSaveToast && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[11px] text-emerald-750 bg-emerald-50 border border-emerald-150 font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    💾 บันทึกระบบสำเร็จ!
                  </motion.span>
                )}
              </div>
            </div>

            {/* Quick Summary of Ticks */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full xl:w-auto">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">มาทำงานปกติ (Present)</span>
                <span className="text-lg font-black text-emerald-800 font-mono">{presentCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">ลางาน (Leave)</span>
                <span className="text-lg font-black text-amber-800 font-mono">{leaveCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-orange-700 block">มาทำงานสาย (Late)</span>
                <span className="text-lg font-black text-orange-850 font-mono">{lateCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-red-50/60 border border-red-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">ขาดงาน (Absent)</span>
                <span className="text-lg font-black text-rose-800 font-mono">{absentCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-2.5 text-center shadow-2xs col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">สลับวันหยุด (Swap)</span>
                <span className="text-lg font-black text-purple-800 font-mono">{swapCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
            </div>
          </div>

          {/* Checklist Controls Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-105 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={checklistDeptFilter}
                onChange={e => setChecklistDeptFilter(e.target.value)}
                className="text-xs md:text-sm border border-slate-205 rounded-lg px-2.5 py-1.8 text-slate-750 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">📂 กรองแสดงทุกฝ่ายบริษัท</option>
                {uniqueDepts.map(dept => (
                  <option key={dept} value={dept}>{getDeptFriendlyName(dept)}</option>
                ))}
              </select>
            </div>

            {/* Quick Actions (Mark all as...) */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider md:mr-1">ติ๊กแบบทันใจ:</span>
              <button
                onClick={() => {
                  if(confirm("คุณต้องการตั้งค่า 'มาทำงานปกติ' ให้กับพนักงานทุกคนที่แสดงผลอยู่ประจำวันนี้ใช่หรือไม่?")) {
                    handleMarkAllStatus('present');
                  }
                }}
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-white text-xs rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-500/10"
              >
                ✓ ตั้งมาปกติทุกคน
              </button>
              <button
                onClick={() => {
                  if(confirm("คุณต้องการตั้งค่า 'สลับวันหยุด' ให้กับพนักงานทุกคนประจำวันนี้ใช่หรือไม่?")) {
                    handleMarkAllStatus('swap_holiday');
                  }
                }}
                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 font-semibold text-white text-xs rounded-lg transition-colors cursor-pointer shadow-sm shadow-purple-500/10"
              >
                ⇅ ตั้งสลับวันหยุดทุกคน
              </button>
              <button
                onClick={() => {
                  if(confirm("ต้องการคัดลอก/เคลียร์ล้างสถานะงานของวันนี้ทั้งหมดเพื่อเช็คใหม่หรือไม่?")) {
                    // Filter out this day completely from dailyAttendance
                    const filtered = dailyAttendance.filter(item => item.date !== selectedChecklistDate);
                    saveDailyAttendance(filtered);
                  }
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                ⟲ ล้างข้อมูลวันนี้
              </button>
              <button
                onClick={() => {
                  if (confirm("คุณต้องการรีเซ็ตข้อมูลจำนวนวัน 'ขาดงาน' และ 'สลับวันหยุด' ทั้งหมดในประวัติของพนักงานทุกคนให้กลับมาเป็น 0 ใช่หรือไม่? (ระบบจะเก็บเฉพาะข้อมูลบันทึกประเภทอื่นไว้)")) {
                    const updated = dailyAttendance.filter(item => item.status !== 'absent' && item.status !== 'swap_holiday');
                    saveDailyAttendance(updated);
                    alert("✓ รีเซ็ตสถิติสะสม 'ขาดงาน' และ 'สลับวันหยุด' ทั้งหมดสำหรับพนักงานทุกคนให้กลับเป็น 0 เรียบร้อยแล้ว!");
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="ล้างวันสะสม ขาด และ สลับวัน ของทุกคนเป็น 0"
              >
                🔄 รีเซ็ต ขาด/สลับวัน เป็น 0
              </button>
            </div>
          </div>

          {/* Checklist Grid Table */}
          <div className="bg-white rounded-2xl border border-blue-105 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/50 text-slate-700 text-xs font-bold uppercase border-b border-slate-100">
                    <td className="p-4 w-12 text-center rounded-tl-2xl">#</td>
                    <th className="p-4 w-60">ข้อมูลพนักงาน</th>
                    <th className="p-4 text-center">ติ๊กเลือกสถานะลงเวลาทำงาน (คลิกสลับเพื่อแก้ไขได้ตลอดเวลา)</th>
                    <th className="p-4 min-w-[200px] rounded-tr-2xl">หมายเหตุ / เหตุชี้แจงส่วนบุคคล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {employees
                    .filter(emp => checklistDeptFilter === 'all' || emp.departmentId === checklistDeptFilter)
                    .map((emp, index) => {
                      const record = dayRecords.find(r => r.employeeId === emp.id);
                      const currentStatus: AttendanceStatus = record ? record.status : 'present';
                      const currentNote = record ? record.note : '';

                      // Calculate historic totals in checklist
                      const empHistory = dailyAttendance.filter(r => r.employeeId === emp.id);
                      const totalLeaves = empHistory.filter(r => r.status === 'leave').length;
                      const totalLates = empHistory.filter(r => r.status === 'late').length;
                      const totalAbsents = empHistory.filter(r => r.status === 'absent').length;
                      const totalSwaps = empHistory.filter(r => r.status === 'swap_holiday').length;

                      // Setup preset colors for visual toggles
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {emp.avatar ? (
                                <img 
                                  src={emp.avatar} 
                                  alt={emp.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                  {emp.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-slate-800 text-sm block">{emp.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">{emp.employeeId} • {getDeptFriendlyName(emp.departmentId || '')}</span>
                                
                                <div className="flex flex-wrap items-center gap-1 mt-1 text-[9px] font-bold">
                                  <span className="text-slate-400 font-black">สถิติสะสม:</span>
                                  <span className="bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-100">ลา {totalLeaves} วัน</span>
                                  <span className="bg-orange-50 text-orange-700 px-1 py-0.5 rounded border border-orange-100">สาย {totalLates} วัน</span>
                                  <span className="bg-rose-50 text-rose-700 px-1 py-0.5 rounded border border-rose-100">ขาด {totalAbsents} วัน</span>
                                  <span className="bg-purple-50 text-purple-700 px-1 py-0.5 rounded border border-purple-100">สลับ {totalSwaps} วัน</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Checklist toggles */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* 1. Present มาทำงานปกติ */}
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendanceStatus(emp.id, selectedChecklistDate, 'present')}
                                className={`px-3 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" style={{ backgroundColor: currentStatus === 'present' ? '#fff' : '#10b981' }} />
                                มาปกติ
                              </button>

                              {/* 2. Leave ติ๊กลา */}
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendanceStatus(emp.id, selectedChecklistDate, 'leave')}
                                className={`px-3 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'leave'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/10'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                ลา
                              </button>

                              {/* 3. Late มาสาย */}
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendanceStatus(emp.id, selectedChecklistDate, 'late')}
                                className={`px-3 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'late'
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-550/10'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                มาสาย
                              </button>

                              {/* 4. Absent ขาดงาน */}
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendanceStatus(emp.id, selectedChecklistDate, 'absent')}
                                className={`px-3 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/10'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                ขาด
                              </button>

                              {/* 5. Swap Holiday สลับวันหยุด */}
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendanceStatus(emp.id, selectedChecklistDate, 'swap_holiday')}
                                className={`px-3 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'swap_holiday'
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/10'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <RefreshCw className="w-3 h-3 shrink-0" />
                                สลับวันหยุด
                              </button>
                            </div>
                          </td>

                          {/* Notes comment box */}
                          <td className="p-4">
                            <input
                              type="text"
                              value={currentNote}
                              placeholder="ระบุความเห็นเพิ่มเติมพิเศษ เช่น 'ลากิจรับลูก', 'สลับหยุกเสาร์นี้'..."
                              onChange={e => handleUpdateAttendanceNote(emp.id, selectedChecklistDate, e.target.value)}
                              className="w-full text-xs px-3 py-1.8 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        ไม่มีพนักงานในรายชื่อระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mini Attendance Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/30 p-4 rounded-xl border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">ลาป่วยสะสม (อนุมัติแล้ว)</span>
                <span className="text-2xl font-black text-rose-700 font-mono">{sickDays} <span className="text-sm font-semibold text-slate-400">วัน</span></span>
              </div>
              <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">ลากิจสะสม (อนุมัติแล้ว)</span>
                <span className="text-2xl font-black text-indigo-700 font-mono">{personalDays} <span className="text-sm font-semibold text-slate-400">วัน</span></span>
              </div>
              <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100/30 p-4 rounded-xl border border-teal-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">พักร้อนสะสม (อนุมัติแล้ว)</span>
                <span className="text-2xl font-black text-teal-700 font-mono">{vacationDays} <span className="text-sm font-semibold text-slate-400">วัน</span></span>
              </div>
              <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                <Plane className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-4 rounded-xl border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">มาสายสะสม (อนุมัติแล้ว)</span>
                <span className="text-2xl font-black text-amber-700 font-mono">
                  {totalLateMinutes} <span className="text-sm font-semibold text-slate-400">นาที</span>
                </span>
              </div>
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Interactive Filter Bar */}
          <div className="bg-white p-4 font-semibold text-slate-800 rounded-xl border border-blue-105 flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="ค้นหาข้อมูล คีย์เวิร์ด หรือชื่อพนักงาน..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs md:text-sm pl-9 pr-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
              />
            </div>

            {/* Filter Type */}
            <div className="w-full md:w-44">
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="w-full text-xs md:text-sm border border-slate-202 rounded-lg px-2.5 py-1.8 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">ดูประเภทบันทึกทั้งหมด</option>
                <option value="sick">ลากิจทางการแพทย์ (ลาป่วย)</option>
                <option value="personal">ลากิจทั่วไป (ลากิจ)</option>
                <option value="vacation">ลาพักร้อนประจำปี</option>
                <option value="late">ล่วงเลยเวลาทำงาน (มาสาย)</option>
                <option value="other">หมวดหมู่รายงานอื่นๆ</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="w-full md:w-44">
              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="w-full text-xs md:text-sm border border-slate-202 rounded-lg px-2.5 py-1.8 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">ดูทุกสถานะพิจารณา</option>
                <option value="approved">อนุมัติแล้ว (Approved)</option>
                <option value="pending">รอการตรวจทาน (Pending)</option>
                <option value="rejected">คำขอถูกปฏิเสธ (Rejected)</option>
              </select>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="bg-white rounded-2xl border border-blue-105 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 rounded-tl-2xl">ชื่อพนักงาน</th>
                    <th className="p-4">ประเภทบันทึก</th>
                    <th className="p-4">วัน / เวลา</th>
                    <th className="p-4 text-center">สิทธิ์รวมวันเวลา</th>
                    <th className="p-4 mb-2">เหตุผลการขอรายการ</th>
                    <th className="p-4 text-center">สถานะสิทธิ์</th>
                    <th className="p-4 text-center rounded-tr-2xl">จัดดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRequests.map((req) => {
                    const getLeaveTypeBadge = (t: string) => {
                      switch (t) {
                        case 'sick': return <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold">ลาป่วย (Sick)</span>;
                        case 'personal': return <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">ลากิจ (Personal)</span>;
                        case 'vacation': return <span className="bg-teal-100 text-teal-700 text-xs px-2.5 py-1 rounded-full font-bold">ลาพักร้อน (Vacation)</span>;
                        case 'late': return <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold">มาสาย (Late)</span>;
                        default: return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">อื่นๆ (Other)</span>;
                      }
                    };

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">{req.employeeName}</td>
                        <td className="p-4">{getLeaveTypeBadge(req.type)}</td>
                        <td className="p-4 font-mono text-xs text-slate-600 font-semibold">
                          {req.startDate}{req.endDate !== req.startDate && ` ถึง ${req.endDate}`}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-700">
                          {req.type === 'late' ? (
                            <span className="text-amber-700">{req.durationMinutes} นาที</span>
                          ) : (
                            <span className="text-blue-800">{req.durationDays} วัน</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 max-w-[220px] truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="p-4 text-center">
                          {req.status === 'approved' && (
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> อนุมัติสิทธิ์
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="bg-red-50 text-red-600 border border-red-100 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ
                            </span>
                          )}
                          {req.status === 'pending' && (
                            <span className="bg-amber-50 text-amber-600 border border-amber-100 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                              <Clock3 className="w-3.5 h-3.5" /> รอการอนุมัติ
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  id={`quick-app-${req.id}`}
                                  onClick={() => onApproveLeave(req.id)}
                                  className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-2 py-1 font-bold shadow-sm transition-colors"
                                  title="อนุมัติทันที"
                                >
                                  อนุมัติ
                                </button>
                                <button
                                  id={`quick-rej-${req.id}`}
                                  onClick={() => onRejectLeave(req.id)}
                                  className="text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-2 py-1 border border-red-200 font-bold transition-colors"
                                  title="ไม่อนุมัติ"
                                >
                                  ปฏิเสธ
                                </button>
                              </>
                            )}
                            <button
                              id={`edit-leave-${req.id}`}
                              onClick={() => handleOpenEditModal(req)}
                              className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg border border-transparent hover:border-blue-105"
                              title="แก้ไขใบคำขอ"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-leave-${req.id}`}
                              onClick={() => handleDeleteClick(req.id, req.employeeName)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-105"
                              title="ลบบันทึก"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        ไม่พบรายการ ลา หรือ มาสาย ตามหมวดหมู่ที่เลือกใช้ในคลังข้อมูล
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CREATE & EDIT ATTENDANCE MODAL WRAPER */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-blue-100 shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-blue-50/60">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Activity className="w-4.5 h-4.5 text-blue-600" />
                  {editingRequest ? 'แก้ไขใบลา & รายงายการทำงาน' : 'ออกบันทึกการ ลา หรือ มาสาย พนักงาน'}
                </h4>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-5.5 space-y-4">
                
                {/* Employee Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">เลือกพนักงานที่ทำเรื่อง *</label>
                  <select
                    value={employeeIdInput}
                    onChange={e => setEmployeeIdInput(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Attendance Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">เลือกประเภทรายการ *</label>
                    <select
                      value={typeInput}
                      onChange={e => setTypeInput(e.target.value as any)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="sick">ลาป่วย (Sick Leave)</option>
                      <option value="personal">ลากิจ (Personal Leave)</option>
                      <option value="vacation">ลาพักร้อนปีการสำรวจ</option>
                      <option value="late">บันทึกมาสาย (Late Entry)</option>
                      <option value="other">กรณีรายงานอื่นๆ</option>
                    </select>
                  </div>

                  {/* Status Picker */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">สิทธิ์คำขออนุมัติ</label>
                    <select
                      value={statusInput}
                      onChange={e => setStatusInput(e.target.value as any)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="pending">รออนุมัติประเมินผล (Pending)</option>
                      <option value="approved">อนุมัติคำขอสิทธิ์เรียบร้อย (Approved)</option>
                      <option value="rejected">ปฏิเสธคำขอบันทึก (Rejected)</option>
                    </select>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">วันที่เริ่มต้นสะสม *</label>
                    <input 
                      type="date"
                      required
                      value={startDateInput}
                      onChange={e => handleDateChange(e.target.value, endDateInput)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {typeInput !== 'late' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">สิ้นสุดสิทธิ์วันที่ *</label>
                      <input 
                        type="date"
                        required
                        value={endDateInput}
                        min={startDateInput}
                        onChange={e => handleDateChange(startDateInput, e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Duration Picker contingent on Leave type vs Late type */}
                {typeInput === 'late' ? (
                  <div className="space-y-1 bg-amber-50/45 p-3 rounded-xl border border-amber-150">
                    <label className="text-xs font-bold text-amber-800 block">ระยะเวลามาสายรวม (นาที) *</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      value={durationMinutesInput}
                      onChange={e => setDurationMinutesInput(Number(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.8 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 bg-blue-50/30 p-3 rounded-xl border border-blue-150/40">
                    <label className="text-xs font-semibold text-blue-800 block">จำนวนวันที่ลาคำนวณจริงสะสม *</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      value={durationDaysInput}
                      onChange={e => setDurationDaysInput(Number(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.8 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                    <span className="text-[10px] text-zinc-400 block pt-0.5">ระบบคำนวณวันทำการขั้นต้นโดยประมาณถัดประยุกต์ใช้ปฏิทิน</span>
                  </div>
                )}

                {/* Reason Text */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">เหตุผลชี้แจงในการขอทำรายการ *</label>
                  <textarea 
                    rows={2.5}
                    required
                    maxLength={150}
                    placeholder="เช่น ปัญหาส่วนตัวด่วน หรือประวัติไข้หนาวสะท้าน"
                    value={reasonInput}
                    onChange={e => setReasonInput(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Buttons footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                  >
                    ยกเลิกแบบฟอร์ม
                  </button>
                  <button 
                    id="submit-attendance-btn"
                    type="submit" 
                    className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:shadow-xs"
                  >
                    <FileCheck className="w-4 h-4" />
                    ยืนยันการบันทึกข้อมูล
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
