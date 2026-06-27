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
import { LeaveRequest, EmployeeSalary, DailyAttendance, AttendanceStatus, CompanyHoliday } from '../types';

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
  
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Sub-tab / menu selection: 'requests' | 'checklist' | 'holidays' | 'statistics'
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'checklist' | 'holidays' | 'statistics'>('checklist'); // default to checklist
  const [selectedChecklistDate, setSelectedChecklistDate] = useState<string>(getTodayString());
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>([]);
  const [checklistDeptFilter, setChecklistDeptFilter] = useState<string>('all');
  const [showAutoSaveToast, setShowAutoSaveToast] = useState<boolean>(false);

  // States for Year-wise Employee Attendance & Leave Statistics
  const [selectedStatYear, setSelectedStatYear] = useState<number>(2026);
  const [selectedStatEmployeeId, setSelectedStatEmployeeId] = useState<string | null>(null);
  const [statSearchTerm, setStatSearchTerm] = useState<string>('');
  const [selectedLogTypeFilter, setSelectedLogTypeFilter] = useState<'all' | 'absent' | 'late' | 'leave' | 'present'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Resolve status and note for a given employee and date, linking with approved leave requests and holidays in real time
  const getResolvedAttendance = (empId: string, date: string) => {
    // 1. Explicit manual daily attendance record
    const explicitRecord = dailyAttendance.find(r => r.employeeId === empId && r.date === date);
    if (explicitRecord) {
      return {
        id: explicitRecord.id,
        status: explicitRecord.status,
        note: explicitRecord.note || '',
        isManual: true,
        source: 'attendance' as const,
        leaveType: undefined
      };
    }

    // 2. Approved leave request
    const approvedLeave = leaveRequests.find(r => 
      r.employeeId === empId && 
      r.status === 'approved' &&
      r.startDate <= date && 
      r.endDate >= date
    );
    if (approvedLeave) {
      let typeLabel = 'ลางาน';
      if (approvedLeave.type === 'sick') typeLabel = 'ลาป่วย';
      else if (approvedLeave.type === 'personal') typeLabel = 'ลากิจ';
      else if (approvedLeave.type === 'vacation') typeLabel = 'ลาพักร้อน';
      else if (approvedLeave.type === 'late') typeLabel = 'ตอกบัตรมาสาย (อนุมัติ)';
      else if (approvedLeave.type === 'other') typeLabel = 'ลาอื่นๆ';
      
      const status: AttendanceStatus = approvedLeave.type === 'late' ? 'late' : 'leave';

      return {
        id: `auto_${date}_${empId}`,
        status,
        note: `[ใบลาอนุมัติ] ${typeLabel}: ${approvedLeave.reason}`,
        isManual: false,
        source: 'leave_request' as const,
        leaveRequestId: approvedLeave.id,
        leaveType: approvedLeave.type
      };
    }

    // 3. Company Holiday
    const isHoliday = companyHolidays.some(h => h.date === date);
    if (isHoliday) {
      return {
        id: `holiday_${date}_${empId}`,
        status: 'holiday' as AttendanceStatus,
        note: 'วันหยุดบริษัทประจำปี',
        isManual: false,
        source: 'company_holiday' as const,
        leaveType: undefined
      };
    }

    // 4. Default: present
    return {
      id: `fallback_${date}_${empId}`,
      status: 'present' as AttendanceStatus,
      note: '',
      isManual: false,
      source: 'fallback' as const,
      leaveType: undefined
    };
  };

  // Helper to calculate high-fidelity employee statistics matching resolved calendar days
  const getEmployeeHistoricalStats = (empId: string, year: number) => {
    // Collect all dates relevant to this employee in this year
    const datesSet = new Set<string>();

    // 1. Manual daily attendance dates
    dailyAttendance.forEach(a => {
      if (a.employeeId === empId && a.date && new Date(a.date).getFullYear() === year) {
        datesSet.add(a.date);
      }
    });

    // 2. Approved leave dates
    leaveRequests.forEach(r => {
      if (r.employeeId === empId && r.status === 'approved' && r.startDate) {
        const startYear = new Date(r.startDate).getFullYear();
        if (startYear === year) {
          let current = new Date(r.startDate);
          const end = new Date(r.endDate);
          while (current <= end) {
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            if (yyyy === year) {
              datesSet.add(dateStr);
            }
            current.setDate(current.getDate() + 1);
          }
        }
      }
    });

    // 3. Company Holidays
    companyHolidays.forEach(h => {
      if (h.date && new Date(h.date).getFullYear() === year) {
        datesSet.add(h.date);
      }
    });

    // Resolve status for each unique date of the year
    const resolvedRecords = Array.from(datesSet).map(dateStr => {
      return {
        date: dateStr,
        resolved: getResolvedAttendance(empId, dateStr)
      };
    });

    const present = resolvedRecords.filter(r => r.resolved.status === 'present').length;
    const late = resolvedRecords.filter(r => r.resolved.status === 'late').length;
    const absent = resolvedRecords.filter(r => r.resolved.status === 'absent').length;
    const leave = resolvedRecords.filter(r => r.resolved.status === 'leave').length;
    const swapHoliday = resolvedRecords.filter(r => r.resolved.status === 'swap_holiday').length;
    const holiday = resolvedRecords.filter(r => r.resolved.status === 'holiday').length;

    const totalTrackedDays = resolvedRecords.length;
    const scoreDays = present + swapHoliday + holiday + leave;
    const attendanceRate = totalTrackedDays > 0 
      ? Math.round((scoreDays / totalTrackedDays) * 100) 
      : 100;

    return {
      present,
      late,
      absent,
      leave,
      swapHoliday,
      holiday,
      totalTrackedDays,
      attendanceRate
    };
  };

  // States for Holiday Form
  const [isHolidayFormOpen, setIsHolidayFormOpen] = useState(false);
  const [holidayDateVal, setHolidayDateVal] = useState(getTodayString());
  const [holidayNameVal, setHolidayNameVal] = useState('');
  const [holidayDescVal, setHolidayDescVal] = useState('');
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);

  // Load holidays from localStorage
  useEffect(() => {
    const savedHols = localStorage.getItem('hr_company_holidays');
    if (savedHols) {
      try {
        setCompanyHolidays(JSON.parse(savedHols));
      } catch (e) {
        setCompanyHolidays([]);
      }
    } else {
      const defaults: CompanyHoliday[] = [
        { id: 'hol-1', date: '2026-01-01', name: 'วันขึ้นปีใหม่ (New Year\'s Day)', description: 'วันหยุดเฉลิมฉลองขึ้นปีใหม่สากล' },
        { id: 'hol-2', date: '2026-04-13', name: 'วันสงกรานต์ (Songkran Festival)', description: 'วันปีใหม่ไทย ประเพณีเล่นน้ำสงกรานต์' },
        { id: 'hol-3', date: '2026-04-14', name: 'วันครอบครัว (Family Day)', description: 'วันหยุดเทศกาลสงกรานต์เพิ่มเติม' },
        { id: 'hol-4', date: '2026-05-01', name: 'วันแรงงานแห่งชาติ (National Labour Day)', description: 'วันหยุดขอบคุณพี่น้องผู้แรงงานไทยทุกภาคส่วน' },
        { id: 'hol-5', date: '2026-06-03', name: 'วันเฉิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี', description: 'วันหยุดราชการไทย' },
        { id: 'hol-6', date: '2026-06-19', name: 'วันหยุดพิเศษประจำบริษัท (Beauty Susan Foundation Day)', description: 'ฉลองวันสถาปนาก่อตั้ง บจก. บิวตี้ ซูซัน' },
        { id: 'hol-7', date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10', description: 'วันหยุดราชการไทย' },
        { id: 'hol-8', date: '2026-12-05', name: 'วันชาติ และวันพ่อแห่งชาติ', description: 'วันคล้ายวันพระบรมราชสมภพ ร.9' },
      ];
      setCompanyHolidays(defaults);
      localStorage.setItem('hr_company_holidays', JSON.stringify(defaults));
    }
  }, []);

  const saveCompanyHolidays = (updated: CompanyHoliday[]) => {
    setCompanyHolidays(updated);
    localStorage.setItem('hr_company_holidays', JSON.stringify(updated));
    if (typeof (window as any).triggerSapphireLocalUpdate === 'function') {
      (window as any).triggerSapphireLocalUpdate('company_holidays', updated);
    }
  };

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
      // Create polished default records for today
      const todayStr = getTodayString();
      const defaults: DailyAttendance[] = [
        { id: `${todayStr}_emp-1`, date: todayStr, employeeId: 'emp-1', status: 'present', note: 'มาทำงานเช้าตรงเวลา' },
        { id: `${todayStr}_emp-2`, date: todayStr, employeeId: 'emp-2', status: 'present', note: 'ตอกบัตร 08:15' },
        { id: `${todayStr}_emp-3`, date: todayStr, employeeId: 'emp-3', status: 'late', note: 'สาย 10 นาทีเนื่องจาก BTS ขัดข้อง' },
        { id: `${todayStr}_emp-4`, date: todayStr, employeeId: 'emp-4', status: 'leave', note: 'ลากิจฉุกเฉิน ทำทันตกรรมประสาทฟัน' },
        { id: `${todayStr}_emp-5`, date: todayStr, employeeId: 'emp-5', status: 'present', note: 'มาทำงานเช้าตรงเวลา' },
        { id: `${todayStr}_emp-6`, date: todayStr, employeeId: 'emp-6', status: 'absent', note: 'ขาดงาน ไม่ตอบกลับแชทไลน์' },
        { id: `${todayStr}_emp-7`, date: todayStr, employeeId: 'emp-7', status: 'swap_holiday', note: 'สลับแลกวันหยุดกับวันอาทิตย์นี้' },
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
        status: getResolvedAttendance(employeeId, date).status, // use dynamic resolved status!
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

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDateVal || !holidayNameVal.trim()) {
      alert("กรุณากรอกวันที่สะสมและระบุชื่อวันหยุดด้วยค่ะ");
      return;
    }
    const newHol: CompanyHoliday = {
      id: editingHolidayId || `hol-${Date.now()}`,
      date: holidayDateVal,
      name: holidayNameVal.trim(),
      description: holidayDescVal.trim()
    };

    let updated = [...companyHolidays];
    if (editingHolidayId) {
      const idx = updated.findIndex(h => h.id === editingHolidayId);
      if (idx >= 0) {
        updated[idx] = newHol;
      }
    } else {
      updated.push(newHol);
    }

    saveCompanyHolidays(updated);
    
    // reset form
    setHolidayNameVal('');
    setHolidayDescVal('');
    setEditingHolidayId(null);
    setIsHolidayFormOpen(false);
  };

  const handleEditHolidayClick = (hol: CompanyHoliday) => {
    setEditingHolidayId(hol.id);
    setHolidayDateVal(hol.date);
    setHolidayNameVal(hol.name);
    setHolidayDescVal(hol.description || '');
    setIsHolidayFormOpen(true);
  };

  const handleDeleteHolidayClick = (id: string) => {
    if (confirm("คุณแน่ใจว่าต้องการลบวันหยุดนี้ออกจากปฏิทิน ใช่หรือไม่? (พนักงานที่ลงบันทึกในวันนี้ยังคงเก็บสถานะเดิม)")) {
      const updated = companyHolidays.filter(h => h.id !== id);
      saveCompanyHolidays(updated);
    }
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
    const today = getTodayString();
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

  // Counts for the selected date on checklist, combining manual ticks and approved leaves dynamically
  const resolvedCheckedList = employees.map(emp => ({
    emp,
    resolved: getResolvedAttendance(emp.id, selectedChecklistDate)
  }));

  const presentCount = resolvedCheckedList.filter(item => item.resolved.status === 'present').length;
  const leaveCount = resolvedCheckedList.filter(item => item.resolved.status === 'leave').length;
  const lateCount = resolvedCheckedList.filter(item => item.resolved.status === 'late').length;
  const absentCount = resolvedCheckedList.filter(item => item.resolved.status === 'absent').length;
  const swapCount = resolvedCheckedList.filter(item => item.resolved.status === 'swap_holiday').length;
  const holidayCount = resolvedCheckedList.filter(item => item.resolved.status === 'holiday').length;
  const activeHoliday = companyHolidays.find(h => h.date === selectedChecklistDate);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-slate-50/50 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveSubTab('checklist')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'checklist' 
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-150/40'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-center shrink-0" />
          <span>บันทึกสถานะงานรายวัน (Checks)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'requests' 
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-150/40'
          }`}
        >
          <FileText className="w-4 h-4 text-center shrink-0" />
          <span>ใบคำขอลาระบบระบบ (Requests)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('holidays')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'holidays' 
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-150/40'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-center shrink-0" />
          <span>วันหยุดบริษัทประจำปี (Holidays)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('statistics')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'statistics' 
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-150/40'
          }`}
        >
          <Activity className="w-4 h-4 text-center shrink-0" />
          <span>สถิติและประวัติการลารายปี (Statistics)</span>
        </button>
      </div>

      {activeSubTab === 'checklist' && (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full xl:w-auto">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">มาปกติ (Present)</span>
                <span className="text-lg font-black text-emerald-800 font-mono">{presentCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">ลางาน (Leave)</span>
                <span className="text-lg font-black text-amber-800 font-mono">{leaveCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-orange-700 block">มาสาย (Late)</span>
                <span className="text-lg font-black text-orange-850 font-mono">{lateCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-red-50/60 border border-red-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">ขาดงาน (Absent)</span>
                <span className="text-lg font-black text-rose-800 font-mono">{absentCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">สลับวันหยุด (Swap)</span>
                <span className="text-lg font-black text-purple-800 font-mono">{swapCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">วันหยุด (Holiday)</span>
                <span className="text-lg font-black text-rose-850 font-mono">{holidayCount} <span className="text-[10px] font-normal text-slate-400">คน</span></span>
              </div>
            </div>
          </div>

          {activeHoliday && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-teal-150 p-4.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h4 className="font-black text-sm text-slate-800">วันนี้ตรงกับปฏิทินวันหยุด: <span className="text-teal-600 font-extrabold">{activeHoliday.name}</span></h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{activeHoliday.description || 'ระบุเป็นวันหยุดราชการหรือกรณีพิเศษประจำตารางบริษัท'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`คุณต้องการปรับสถานะพนักงานทุกคนประจำวันที่ ${selectedChecklistDate} ให้เป็น "วันหยุด" หรือไม่?`)) {
                    handleMarkAllStatus('holiday');
                  }
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-teal-500/15 shrink-0 flex items-center gap-1.5 border-0"
              >
                <CheckSquare2 className="w-4 h-4" />
                ระบุสถานะ "วันหยุด" ให้พนักงานทุกคน (ออโต้)
              </button>
            </div>
          )}

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
                  if(confirm("คุณต้องการตั้งค่า 'วันหยุด' ให้กับพนักงานทุกคนที่แสดงผลประจำวันนี้ใช่หรือไม่?")) {
                    handleMarkAllStatus('holiday');
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 font-semibold text-white text-xs rounded-lg transition-colors cursor-pointer shadow-sm shadow-rose-500/10"
              >
                🌴 ตั้งวันหยุดทุกคน
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
                      const resolved = getResolvedAttendance(emp.id, selectedChecklistDate);
                      const currentStatus: AttendanceStatus = resolved.status;
                      const currentNote = resolved.note;
                      const isLinkedToLeave = resolved.source === 'leave_request';
                      const leaveType = resolved.leaveType;

                      // Calculate historic totals in checklist using high-fidelity getEmployeeHistoricalStats
                      const hist = getEmployeeHistoricalStats(emp.id, Number(selectedChecklistDate.split('-')[0]) || 2026);
                      const totalLeaves = hist.leave;
                      const totalLates = hist.late;
                      const totalAbsents = hist.absent;
                      const totalSwaps = hist.swapHoliday;
                      const totalHolidays = hist.holiday;

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
                                  <span className="bg-rose-50 text-rose-700 px-1 py-0.5 rounded border border-rose-100">หยุด {totalHolidays} วัน</span>
                                </div>

                                {isLinkedToLeave && (
                                  <div className="mt-1.5 text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200 rounded-lg px-2 py-0.8 flex items-center gap-1.5 font-bold shadow-3xs max-w-fit animate-pulse">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                    <span>🔗 เชื่อมโยงสถิติใบลา: {leaveType === 'sick' ? 'ลาป่วย (Sick)' : leaveType === 'personal' ? 'ลากิจ (Personal)' : leaveType === 'vacation' ? 'ลาพักร้อน (Vacation)' : 'ลาสะสม'} (อนุมัติแล้ว/เชื่อมรายวันออโต้)</span>
                                  </div>
                                )}
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
                                className={`px-2.5 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
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
                                className={`px-2.5 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'leave'
                                    ? isLinkedToLeave && leaveType !== 'late'
                                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-1 ring-amber-400 ring-offset-1 font-black animate-scaleIn'
                                      : 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/10'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                {isLinkedToLeave && leaveType !== 'late' ? 'อนุมัติลา 🔗' : 'ลา'}
                              </button>

                              {/* 3. Late มาสาย */}
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendanceStatus(emp.id, selectedChecklistDate, 'late')}
                                className={`px-2.5 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'late'
                                    ? isLinkedToLeave && leaveType === 'late'
                                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-1 ring-orange-400 ring-offset-1 font-black animate-scaleIn'
                                      : 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-550/10'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {isLinkedToLeave && leaveType === 'late' ? 'สาย (อนุมัติ) 🔗' : 'มาสาย'}
                              </button>

                              {/* 4. Absent ขาดงาน */}
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendanceStatus(emp.id, selectedChecklistDate, 'absent')}
                                className={`px-2.5 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
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
                                className={`px-2.5 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'swap_holiday'
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/10'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <RefreshCw className="w-3 h-3 shrink-0" />
                                สลับวันหยุด
                              </button>

                              {/* 6. Holiday วันหยุด */}
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendanceStatus(emp.id, selectedChecklistDate, 'holiday')}
                                className={`px-2.5 py-1.8 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                                  currentStatus === 'holiday'
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                วันหยุด
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
      )}

      {activeSubTab === 'requests' && (
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

      {activeSubTab === 'holidays' && (
        <div className="space-y-6">
          {/* Holiday Statistics & Add Button */}
          <div className="bg-gradient-to-r from-red-50/80 via-white to-pink-50/20 p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-rose-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-rose-600" />
                ปฏิทินวันหยุดประจำปีบริษัท / วันทำงานและหยุดราชการ (Holiday Planner)
              </h3>
              <p className="text-slate-500 text-xs font-medium">กำหนดวันหยุดทางการของบริษัทเพื่อให้ระบบตารางบันทึกเวลารับรู้และแจ้งเตือนผู้บริหาร</p>
            </div>
            
            <button
              onClick={() => {
                setEditingHolidayId(null);
                setHolidayDateVal(selectedChecklistDate);
                setHolidayNameVal('');
                setHolidayDescVal('');
                setIsHolidayFormOpen(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer border-0"
            >
              <Plus className="w-4 h-4" />
              เพิ่มวันหยุดใหม่ (Add Holiday)
            </button>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">จำนวนวันหยุดที่กำหนดปีนี้</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {companyHolidays.length} <span className="text-xs font-normal text-slate-400">วัน</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">วันหยุดที่ระบุไว้ในระบบ</span>
                <span className="text-sm font-bold text-slate-700 block truncate">
                  {(() => {
                    const futures = companyHolidays
                      .filter(h => h.date >= '2026-01-01')
                      .sort((a,b) => a.date.localeCompare(b.date));
                    return futures.length > 0 ? `${futures[0].name} (${futures[0].date})` : 'ไม่มีวันหยุดในปฏิทิน';
                  })()}
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                <CheckSquare2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">สถานะวันทำงานหยุดเสร็จสมบูรณ์</span>
                <span className="text-xs font-bold text-teal-750 block">เชื่อมโยงตารางบันทึกเวลา รายฝ่าย สำเร็จ</span>
              </div>
            </div>
          </div>

          {/* Holidays Collection Table / Cards */}
          <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-sm">
            <div className="p-4 bg-rose-50/40 border-b border-rose-100 flex justify-between items-center">
              <span className="text-xs font-black text-slate-700">รายชื่อวันหยุดราชการ / วันหยุดบริษัท ประจำปฏิทิน</span>
              <span className="text-[10px] bg-rose-100 text-rose-850 font-bold px-2 py-0.5 rounded-full">อ้างอิงสิทธิตามกฎหมายแรงงาน</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-600 text-xs font-bold uppercase border-b border-slate-100">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4 w-40">วันที่หยุด</th>
                    <th className="p-4">รายละเอียดวันหยุด / เทศกาล</th>
                    <th className="p-4 w-40 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {companyHolidays
                    .sort((a,b) => a.date.localeCompare(b.date))
                    .map((hol, index) => {
                      const isToday = hol.date === selectedChecklistDate;
                      return (
                        <tr key={hol.id} className={`hover:bg-rose-50/10 transition-colors ${isToday ? 'bg-rose-50/30 font-bold' : ''}`}>
                          <td className="p-4 text-center text-slate-400 font-mono">{index + 1}</td>
                          <td className="p-4 font-mono text-slate-700">
                            {(() => {
                              const [y, m, d] = hol.date.split('-');
                              return `${d}/${m}/${Number(y) + 543}`;
                            })()}
                            {isToday && (
                              <span className="ml-1.5 px-2 py-0.5 bg-rose-600 text-white rounded-full text-[9px] font-black">วันนี้</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-800 text-sm block">{hol.name}</span>
                            <span className="text-slate-400 text-xs font-medium block mt-0.5">{hol.description || '— ไม่มีคำอธิบาย —'}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditHolidayClick(hol)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-750 hover:text-slate-900 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 border-0"
                              >
                                <Edit className="w-3 h-3 text-slate-500" />
                                แก้ไข
                              </button>
                              <button
                                onClick={() => handleDeleteHolidayClick(hol.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border-0"
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {companyHolidays.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                        ยังไม่มีวันหยุดกำหนดในปฏิทินปีนี้ กดปุ่ม "เพิ่มวันหยุดใหม่" เพื่อเริ่มต้นค่ะ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Holiday Help Card */}
          <div className="bg-blue-50/40 p-4.5 rounded-2xl border border-blue-100 text-slate-650 text-xs space-y-1.5 leading-relaxed">
            <h4 className="font-black text-blue-900 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              💡 ข้อมูลความเข้าใจเกี่ยวกับวันหยุดประจำระบบลงเวลา
            </h4>
            <p>1. เมื่อวันที่ในตารางบันทึกเวลา (Daily Checklist) ตรงกับ <b>วันหยุด</b> ที่ระบุไว้ในหน้านี้ ระบบจะแสดงกระดานแจ้งเตือนสีเขียวเพื่อสะกิดเตือนให้ผู้ทำหน้าที่บุคคลทราบทันที</p>
            <p>2. คุณสามารถกดปุ่มด่วน <b>"ปรับสถานะเป็นวันหยุดให้ทุกคนทันที"</b> ในกระดานแจ้งเตือน เพื่อข้ามการติ๊กพนักงานทุกคนเป็นวันหยุดแบบอัตโนมัติ ช่วยลดเวลาทำรายการเป็นศูนย์</p>
          </div>
        </div>
      )}

      {/* --- EXTRA STATS COMPUTATIONS & STATS SUBVIEW --- */}
      {(() => {
        // Get all unique years from data
        const availableYears = (() => {
          const yearsSet = new Set<number>([2026, 2025, 2024]);
          dailyAttendance.forEach(a => {
            if (a.date) {
              const yr = new Date(a.date).getFullYear();
              if (!isNaN(yr)) yearsSet.add(yr);
            }
          });
          leaveRequests.forEach(r => {
            if (r.startDate) {
              const yr = new Date(r.startDate).getFullYear();
              if (!isNaN(yr)) yearsSet.add(yr);
            }
          });
          return Array.from(yearsSet).sort((a, b) => b - a);
        })();

        // Map department id to name
        const getDeptName = (deptId: string) => {
          const depts: Record<string, string> = {
            'dept-1': 'ฝ่ายบริหาร / แอดมินทั่วไป',
            'dept-2': 'ฝ่ายบัญชีและการเงิน',
            'dept-3': 'ฝ่ายขายและการตลาด (Sales & Mktg)',
            'dept-4': 'ฝ่ายผลิตอาหารแปรรูปแช่แข็ง',
            'dept-5': 'ฝ่ายควบคุมคุณภาพ (QA/QC)',
            'dept-6': 'ฝ่ายโรงงานและฝ่ายวิศวกรซ่อมบำรุง',
            'dept-7': 'ฝ่ายจัดซื้อและสโตร์สต๊อกกลาง',
            'dept-8': 'ฝ่ายขนส่งเดลิเวอรี่และกระจายสินค้า'
          };
          return depts[deptId] || deptId || 'แผนกทั่วไป';
        };

        // Format Thai Date
        const formatThaiDate = (dateStr: string) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return dateStr;
          const thMonths = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
          ];
          return `${date.getDate()} ${thMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
        };

        // Compute stats for all employees using high-fidelity getEmployeeHistoricalStats helper (fully connected)
        const yearlyEmployeeStats = employees.map(emp => {
          const hist = getEmployeeHistoricalStats(emp.id, selectedStatYear);

          const empLeaves = leaveRequests.filter(r => 
            r.employeeId === emp.id && 
            r.status === 'approved' && 
            r.startDate && 
            new Date(r.startDate).getFullYear() === selectedStatYear
          );

          const sickLeaveDays = empLeaves
            .filter(r => r.type === 'sick')
            .reduce((sum, r) => sum + (r.durationDays || 1), 0);

          const personalLeaveDays = empLeaves
            .filter(r => r.type === 'personal')
            .reduce((sum, r) => sum + (r.durationDays || 1), 0);

          const vacationLeaveDays = empLeaves
            .filter(r => r.type === 'vacation')
            .reduce((sum, r) => sum + (r.durationDays || 1), 0);

          const otherLeaveDays = empLeaves
            .filter(r => r.type !== 'sick' && r.type !== 'personal' && r.type !== 'vacation')
            .reduce((sum, r) => sum + (r.durationDays || 1), 0);

          const totalApprovedLeaveDays = sickLeaveDays + personalLeaveDays + vacationLeaveDays + otherLeaveDays;

          return {
            employee: emp,
            present: hist.present,
            late: hist.late,
            absent: hist.absent,
            leaveChecked: hist.leave,
            swapHoliday: hist.swapHoliday,
            holiday: hist.holiday,
            sickLeaveDays,
            personalLeaveDays,
            vacationLeaveDays,
            otherLeaveDays,
            totalApprovedLeaveDays,
            totalTrackedDays: hist.totalTrackedDays,
            attendanceRate: hist.attendanceRate
          };
        });

        // Computed Overall Metrics for Stats Panel Cards (aggregated from connected employee statistics)
        const overallStats = (() => {
          let checkedDays = 0;
          let presentStr = 0;
          let lateStr = 0;
          let absentStr = 0;
          let leaveCheckedStr = 0;

          yearlyEmployeeStats.forEach(stat => {
            checkedDays += stat.totalTrackedDays;
            presentStr += stat.present;
            lateStr += stat.late;
            absentStr += stat.absent;
            leaveCheckedStr += stat.leaveChecked;
          });

          const approvedLeaves = leaveRequests.filter(r => 
            r.status === 'approved' && 
            r.startDate && 
            new Date(r.startDate).getFullYear() === selectedStatYear
          );

          const sickTotal = approvedLeaves.filter(r => r.type === 'sick').reduce((sum, r) => sum + (r.durationDays || 1), 0);
          const personalTotal = approvedLeaves.filter(r => r.type === 'personal').reduce((sum, r) => sum + (r.durationDays || 1), 0);
          const vacationTotal = approvedLeaves.filter(r => r.type === 'vacation').reduce((sum, r) => sum + (r.durationDays || 1), 0);
          const otherTotal = approvedLeaves.filter(r => r.type !== 'sick' && r.type !== 'personal' && r.type !== 'vacation').reduce((sum, r) => sum + (r.durationDays || 1), 0);

          return {
            checkedDays,
            presentStr,
            lateStr,
            absentStr,
            leaveCheckedStr,
            sickTotal,
            personalTotal,
            vacationTotal,
            otherTotal,
            totalLeavesTotal: sickTotal + personalTotal + vacationTotal + otherTotal
          };
        })();

        const filteredYearlyStats = yearlyEmployeeStats.filter(stat => {
          const q = statSearchTerm.toLowerCase();
          return (
            stat.employee.name.toLowerCase().includes(q) ||
            stat.employee.employeeId.toLowerCase().includes(q) ||
            stat.employee.position.toLowerCase().includes(q)
          );
        });

        const selectedEmployeeLog = (() => {
          if (!selectedStatEmployeeId) return [];

          const list: Array<{
            date: string;
            type: string;
            label: string;
            description: string;
            source: 'daily_attendance' | 'leave_request';
            rawStatus?: string;
            duration?: string;
          }> = [];

          // 1) Add daily checks
          const empAttendance = dailyAttendance.filter(a => 
            a.employeeId === selectedStatEmployeeId && 
            a.date && 
            new Date(a.date).getFullYear() === selectedStatYear
          );

          empAttendance.forEach(a => {
            let logType = 'attendance_present';
            let label = 'มาปฏิบัติงานปกติ';
            if (a.status === 'late') {
              logType = 'attendance_late';
              label = 'มาสาย';
            } else if (a.status === 'absent') {
              logType = 'attendance_absent';
              label = 'ขาดงาน';
            } else if (a.status === 'leave') {
              logType = 'attendance_leave';
              label = 'ลงลาหยุดประจำวัน';
            } else if (a.status === 'swap_holiday') {
              logType = 'attendance_swap';
              label = 'สลับแลกวันทำงาน / วันหยุด';
            } else if (a.status === 'holiday') {
              logType = 'attendance_holiday';
              label = 'วันหยุดประจำบริษัท';
            }

            // Check dynamic resolution to see if it is linked to a system approved leave request or is overridden
            const resolved = getResolvedAttendance(selectedStatEmployeeId, a.date);
            let finalDesc = a.note || 'ลงสถานะปฏิบัติงานประจำวันปกติ';
            if (resolved.source === 'leave_request') {
              const thType = resolved.leaveType === 'sick' ? 'ลาป่วย' : resolved.leaveType === 'personal' ? 'ลากิจ' : resolved.leaveType === 'vacation' ? 'ลาพักร้อน' : 'ล่าช้า';
              finalDesc = `🔗 [ระบบเชื่อมโยงใบลาอัตโนมัติ] ${finalDesc} (ประมวลผลดึงจากใบ${thType}ที่ได้รับการอนุมัติ เพื่อสถิติที่ตรงกัน)`;
            } else {
              // Check if they had an approved leave covering this date but it was manually overridden in daily checklist
              const coveredApprovedLeave = leaveRequests.find(r => 
                r.employeeId === selectedStatEmployeeId &&
                r.status === 'approved' &&
                a.date >= r.startDate && 
                a.date <= r.endDate
              );
              if (coveredApprovedLeave) {
                const thType = coveredApprovedLeave.type === 'sick' ? 'ลาป่วย' : coveredApprovedLeave.type === 'personal' ? 'ลากิจ' : coveredApprovedLeave.type === 'vacation' ? 'ลาพักร้อน' : 'ล่าช้า';
                finalDesc = `✏️ [ปรับปรุงแก้ไขสถิติตามจริง] ${finalDesc} (ปกติตรงกับใบ${thType}ที่อนุมัติ แต่ระบบตรวจพบว่าติ๊กแก้ไขสถานะรายวันเป็นอื่นเพื่อประเมินสถานะปฏิบัติงานจริง)`;
              }
            }

            list.push({
              date: a.date,
              type: logType,
              label,
              description: finalDesc,
              source: 'daily_attendance',
              rawStatus: a.status
            });
          });

          // 2) Add approved leaves
          const empLeaves = leaveRequests.filter(r => 
            r.employeeId === selectedStatEmployeeId && 
            r.status === 'approved' && 
            r.startDate && 
            new Date(r.startDate).getFullYear() === selectedStatYear
          );

          empLeaves.forEach(r => {
            let logType = 'leave_other';
            let label = 'ลาอื่นได้รับการอนุมัติ';
            if (r.type === 'sick') {
              logType = 'leave_sick';
              label = 'ลาป่วย (ได้รับอนุมัติ)';
            } else if (r.type === 'personal') {
              logType = 'leave_personal';
              label = 'ลากิจ (ได้รับอนุมัติ)';
            } else if (r.type === 'vacation') {
              logType = 'leave_vacation';
              label = 'ลาพักร้อนประจำปี';
            }

            const dateStr = r.startDate === r.endDate ? r.startDate : `${r.startDate} ถึง ${r.endDate}`;
            const durationStr = r.durationDays ? `${r.durationDays} วัน` : '';

            list.push({
              date: r.startDate,
              type: logType,
              label,
              description: `เหตุผลความจำเป็น: "${r.reason}" [ครอบคลุมช่วง: ${dateStr}]`,
              source: 'leave_request',
              rawStatus: r.status,
              duration: durationStr
            });
          });

          return list.sort((a, b) => b.date.localeCompare(a.date));
        })();

        const filteredEmployeeLog = selectedEmployeeLog.filter(log => {
          if (selectedLogTypeFilter !== 'all') {
            if (selectedLogTypeFilter === 'present' && !log.type.includes('present')) return false;
            if (selectedLogTypeFilter === 'late' && !log.type.includes('late')) return false;
            if (selectedLogTypeFilter === 'absent' && !log.type.includes('absent')) return false;
            if (selectedLogTypeFilter === 'leave' && !log.type.includes('leave')) return false;
          }
          if (logSearchQuery.trim()) {
            const q = logSearchQuery.toLowerCase();
            return (
              log.label.toLowerCase().includes(q) ||
              log.description.toLowerCase().includes(q) ||
              log.date.includes(q)
            );
          }
          return true;
        });

        // Render current view
        if (activeSubTab !== 'statistics') return null;

        return (
          <div className="space-y-6">
            {selectedStatEmployeeId === null ? (
              /* --- VIEW 1: OVERVIEW TABLE OF ALL EMPLOYEES --- */
              <div className="space-y-6">
                {/* Year Selection and Search Bar */}
                <div className="bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/30 p-5 rounded-2xl border border-blue-150/40 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-blue-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                      รายงานสรุปข้อมูลและหน้าต่างสถิติการลารายพนักงานสะสมประจำปี
                    </h3>
                    <p className="text-slate-500 text-xs font-medium">คำนวณและประเมินอัตราวินัยการเข้าเข้างาน ขาด ลา มาสาย และสถิติการลางานรวมของบริษัท</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Select Year */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-2xs">
                      <span className="text-xs font-bold text-slate-500 shrink-0">เลือกปีประเมิน:</span>
                      <select
                        value={selectedStatYear}
                        onChange={e => {
                          setSelectedStatYear(Number(e.target.value));
                          setSelectedStatEmployeeId(null);
                        }}
                        className="border-0 bg-transparent text-xs font-bold text-slate-800 focus:outline-none focus:ring-0 cursor-pointer p-0"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>
                            ปี พ.ศ. {year + 543} (ค.ศ. {year})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        className="pl-9 pr-4 py-1.8 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400 w-full sm:w-56 shadow-2xs"
                        placeholder="ค้นหารหัส, ชื่อพนักงาน, ตำแหน่ง..."
                        value={statSearchTerm}
                        onChange={e => setStatSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Overall Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 text-base flex items-center justify-center font-bold">📅</div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 block">วันลงบันทึกเวลารวม</span>
                      <h4 className="text-lg font-black text-slate-800 font-mono mt-0.5">{overallStats.checkedDays} ครั้ง</h4>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 text-base flex items-center justify-center font-bold">⚠️</div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 block">อัตราขาดงานประเมินสะสม</span>
                      <h4 className="text-lg font-black text-rose-700 font-mono mt-0.5">{overallStats.absentStr} ครั้ง</h4>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 text-base flex items-center justify-center font-bold">⏰</div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 block">ผู้ล่วงเวลาตอกบัตรมาสาย</span>
                      <h4 className="text-lg font-black text-amber-700 font-mono mt-0.5">{overallStats.lateStr} ครั้ง</h4>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 text-base flex items-center justify-center font-bold">📝</div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 block">วันลาเอกสารผ่านอนุมัติ</span>
                      <h4 className="text-lg font-black text-teal-850 font-mono mt-0.5">{overallStats.totalLeavesTotal} วันลา</h4>
                    </div>
                  </div>
                </div>

                {/* Table list */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                          <th className="p-4 pl-5">ข้อมูลบุคลากร</th>
                          <th className="p-4 text-center">มาปกติ (Present)</th>
                          <th className="p-4 text-center">มาสาย (Late)</th>
                          <th className="p-4 text-center">ขาดงาน (Absent)</th>
                          <th className="p-4 text-center">ใบลาผ่านระบบสะสม</th>
                          <th className="p-4 text-center">อัตราทำงานที่ติ๊กชื่อ</th>
                          <th className="p-4 text-right pr-6">เข้าตรวจสอบเชิงลึก</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {filteredYearlyStats.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                              ไม่พบพนักงานในระบบ หรือยังไม่มีการประเมินเวลากรอบปีนี้
                            </td>
                          </tr>
                        ) : (
                          filteredYearlyStats.map(stat => {
                            const isLowAttendance = stat.attendanceRate < 80;
                            return (
                              <tr key={stat.employee.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0 border border-blue-200 overflow-hidden">
                                      {stat.employee.avatar ? (
                                        <img src={stat.employee.avatar} alt={stat.employee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <User className="w-4.5 h-4.5" />
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-slate-900">{stat.employee.name}</h4>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-0.5">
                                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded font-bold">{stat.employee.employeeId}</span>
                                        <span>•</span>
                                        <span>{stat.employee.position}</span>
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-400 block mt-0.5">{getDeptName(stat.employee.departmentId)}</span>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4 text-center font-mono font-black text-emerald-700">
                                  <span className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    {stat.present} วัน
                                  </span>
                                </td>

                                <td className="p-4 text-center font-mono font-bold">
                                  <span className={`${stat.late > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-400 bg-slate-50 border border-slate-100'} px-2 py-0.5 rounded-full`}>
                                    {stat.late} ครั้ง
                                  </span>
                                </td>

                                <td className="p-4 text-center font-mono font-bold">
                                  <span className={`${stat.absent > 0 ? 'bg-rose-50 text-rose-850 border border-rose-250 animate-pulse' : 'text-slate-400 bg-slate-50 border border-slate-100'} px-2 py-0.5 rounded-full`}>
                                    {stat.absent} ครั้ง
                                  </span>
                                </td>

                                <td className="p-4 text-center">
                                  <div className="inline-flex flex-col items-center">
                                    <span className="font-mono font-black text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                      {stat.totalApprovedLeaveDays} วัน
                                    </span>
                                    <span className="text-[9px] text-zinc-400 mt-0.5">
                                      ป่วย {stat.sickLeaveDays} | กิจ {stat.personalLeaveDays} | ร้อน {stat.vacationLeaveDays}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-4 text-center">
                                  <div className="inline-flex items-center gap-2">
                                    <span className={`font-mono font-extrabold ${isLowAttendance ? 'text-rose-600' : 'text-emerald-700'}`}>
                                      {stat.attendanceRate}%
                                    </span>
                                    <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                      <div className={`h-full rounded-full ${isLowAttendance ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, stat.attendanceRate)}%` }} />
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4 text-right pr-6">
                                  <button
                                    onClick={() => {
                                      setSelectedStatEmployeeId(stat.employee.id);
                                      setSelectedLogTypeFilter('all');
                                      setLogSearchQuery('');
                                    }}
                                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 rounded-lg font-bold flex items-center gap-1 ml-auto transition-colors cursor-pointer border-0"
                                  >
                                    <span>เช็คประวัติ</span>
                                    <Activity className="w-3 h-3 text-slate-500" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* --- VIEW 2: INDIVIDUAL DETAILED PORTFOLIO TIMELINE --- */
              (() => {
                const selectedStat = yearlyEmployeeStats.find(s => s.employee.id === selectedStatEmployeeId);
                if (!selectedStat) return null;
                const emp = selectedStat.employee;

                return (
                  <div className="space-y-6">
                    {/* Header profile banner */}
                    <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shrink-0 border border-white/20 overflow-hidden shadow-inner">
                          {emp.avatar ? (
                            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black">{emp.name}</h3>
                            <span className="font-mono bg-white/20 text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full uppercase">{emp.employeeId}</span>
                          </div>
                          <p className="text-blue-105 mt-0.5 text-xs text-blue-100 font-semibold">ตำแหน่ง: {emp.position} • {getDeptName(emp.departmentId)}</p>
                          <p className="text-blue-200 text-[10px] font-black uppercase mt-0.5 tracking-wide">สถิติสะสมปฏิทินของพนักงานและบันทึกเวลายืดอายุใบลา ปี {selectedStatYear + 543}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedStatEmployeeId(null)}
                        className="bg-white text-slate-800 hover:bg-slate-100 active:bg-slate-200 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer border-0"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                        ปิดหน้าระเบียงความถี่
                      </button>
                    </div>

                    {/* Numeric breakdown cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-150 text-center shadow-3xs">
                        <span className="text-[10px] font-bold text-emerald-800 block">มาทำงานปกติ (Present)</span>
                        <h4 className="text-2xl font-black text-emerald-800 font-mono mt-1">{selectedStat.present}</h4>
                        <span className="text-[9px] text-emerald-600 block mt-0.5">วันนัดทำจริง</span>
                      </div>

                      <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-150 text-center shadow-3xs">
                        <span className="text-[10px] font-bold text-amber-800 block">ตอกบัตรมาสาย (Late)</span>
                        <h4 className="text-2xl font-black text-amber-800 font-mono mt-1">{selectedStat.late}</h4>
                        <span className="text-[9px] text-amber-600 block mt-0.5">ครั้งลงทะเบียน</span>
                      </div>

                      <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-150 text-center shadow-3xs">
                        <span className="text-[10px] font-bold text-rose-800 block">ขาดงานสะสม (Absent)</span>
                        <h4 className="text-2xl font-black text-rose-800 font-mono mt-1">{selectedStat.absent}</h4>
                        <span className="text-[9px] text-rose-600 block mt-0.5">ครั้งนับโทษงาน</span>
                      </div>

                      <div className="bg-sky-50/50 p-3.5 rounded-xl border border-sky-150 text-center shadow-3xs">
                        <span className="text-[10px] font-bold text-sky-800 block">ประวัติลาป่วย (Sick)</span>
                        <h4 className="text-2xl font-black text-sky-850 font-mono mt-1">{selectedStat.sickLeaveDays}</h4>
                        <span className="text-[9px] text-sky-600 block mt-0.5">วันลาได้รับอนุมัติ</span>
                      </div>

                      <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-150 text-center shadow-3xs">
                        <span className="text-[10px] font-bold text-purple-800 block">วันลากิจหลัก (Personal)</span>
                        <h4 className="text-2xl font-black text-purple-850 font-mono mt-1">{selectedStat.personalLeaveDays}</h4>
                        <span className="text-[9px] text-purple-600 block mt-0.5">วันทำงานปกติ</span>
                      </div>

                      <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-150 text-center shadow-3xs">
                        <span className="text-[10px] font-bold text-teal-850 block">ลาพักร้อนปี (Vacation)</span>
                        <h4 className="text-2xl font-black text-teal-900 font-mono mt-1">{selectedStat.vacationLeaveDays}</h4>
                        <span className="text-[9px] text-teal-700 block mt-0.5">ใช้โควตารวม</span>
                      </div>
                    </div>

                    {/* Timeline Data List Log of events */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                      {/* Timeline filters bar */}
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="text-xs font-bold text-slate-800">ไทม์ไลน์บันทึกเหตุการณ์ปี พ.ศ. {selectedStatYear + 543}</span>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">พบบันทึกตรงตามเงื่อนไข {filteredEmployeeLog.length} รายการ</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                            {(['all', 'present', 'late', 'absent', 'leave'] as const).map(type => (
                              <button
                                key={type}
                                onClick={() => setSelectedLogTypeFilter(type)}
                                className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer border-0 ${
                                  selectedLogTypeFilter === type
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                                }`}
                              >
                                {type === 'all' && 'ทั้งหมด'}
                                {type === 'present' && '🔴 มาทำงาปกติ'}
                                {type === 'late' && '⏰ สาย'}
                                {type === 'absent' && '❌ ขาด'}
                                {type === 'leave' && '📋 ลารวม'}
                              </button>
                            ))}
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={logSearchQuery}
                              onChange={e => setLogSearchQuery(e.target.value)}
                              placeholder="ค้นหาข้อความ/วันที่..."
                              className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 w-36 shadow-3xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display Log Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-slate-650 text-[10px] font-bold uppercase tracking-wider">
                              <th className="p-3.5 pl-5 text-center w-28 bg-slate-100/10">วันที่ลงบันทึก</th>
                              <th className="p-3.5 text-center w-40">สถานภาพ</th>
                              <th className="p-3.5">รายละเอียดชี้แจง / โน้ตลงระบบ</th>
                              <th className="p-3.5 text-center w-28">ระยะเวลาจริง</th>
                              <th className="p-3.5 text-right pr-6 w-44">อ้างอิงเอกสารหลัก</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredEmployeeLog.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-10 text-center text-slate-400 font-bold bg-slate-50/20">
                                  ยังไม่มีบันทึก ขาด ลา มาสาย ที่ตรงตามตัวเลือกในปฏิทินนี้
                                </td>
                              </tr>
                            ) : (
                              filteredEmployeeLog.map((log, index) => {
                                let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                                if (log.type === 'attendance_present') badgeColor = "bg-emerald-50 text-emerald-800 border border-emerald-250";
                                else if (log.type === 'attendance_late') badgeColor = "bg-amber-50 text-amber-800 border border-amber-250";
                                else if (log.type === 'attendance_absent') badgeColor = "bg-rose-50 text-rose-800 border border-rose-250 animate-pulse font-bold";
                                else if (log.type === 'leave_sick') badgeColor = "bg-sky-50 text-sky-800 border border-sky-150 font-bold";
                                else if (log.type === 'leave_personal') badgeColor = "bg-purple-50 text-purple-800 border border-purple-150 font-bold";
                                else if (log.type === 'leave_vacation') badgeColor = "bg-teal-50 text-teal-800 border border-teal-150 font-bold";

                                return (
                                  <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3.5 pl-5 font-mono text-center font-bold text-slate-700 bg-slate-50/20">
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">{formatThaiDate(log.date)}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{log.date}</span>
                                      </div>
                                    </td>

                                    <td className="p-3.5 text-center">
                                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black ${badgeColor}`}>
                                        {log.label}
                                      </span>
                                    </td>

                                    <td className="p-3.5 font-semibold text-slate-800 leading-relaxed max-w-sm">
                                      {log.description}
                                    </td>

                                    <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                                      {log.duration ? (
                                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                                          {log.duration}
                                        </span>
                                      ) : (
                                        log.type === 'attendance_late' ? (
                                          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">สาย (นาที)</span>
                                        ) : log.type === 'attendance_absent' ? (
                                          <span className="text-[10px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-bold">ขาด (วันทําการ)</span>
                                        ) : (
                                          <span className="text-slate-400 font-normal">1 วัน</span>
                                        )
                                      )}
                                    </td>

                                    <td className="p-3.5 text-right pr-6 font-bold">
                                      {log.source === 'daily_attendance' ? (
                                        <div className="inline-flex flex-col items-end">
                                          <span className="text-[10px] text-zinc-500 bg-slate-100/95 px-2 py-0.5 rounded-md border border-slate-200">
                                            ✓ บันทึกเวลาปฏิบัติประจำวัน
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="inline-flex flex-col items-end">
                                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                                            📋 ใบลาผ่านการอนุมัติระบบ
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        );
      })()}


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

      {/* ADD / EDIT HOLIDAY MODAL */}
      <AnimatePresence>
        {isHolidayFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-rose-100 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/60">
                <h4 className="font-extrabold text-rose-900 flex items-center gap-1.5">
                  <CalendarDays className="w-5 h-5 text-rose-600" />
                  {editingHolidayId ? 'แก้ไขข้อมูลวันหยุดประจำปี' : 'กำหนดวันหยุดประจำปีบริษัท'}
                </h4>
                <button 
                  onClick={() => setIsHolidayFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddHoliday} className="p-5.5 space-y-4 text-xs">
                {/* Date Input */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">ระบุวันที่หยุด (Holiday Date) *</label>
                  <input 
                    type="date"
                    required
                    value={holidayDateVal}
                    onChange={e => setHolidayDateVal(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Holiday Name */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">ชื่อวันหยุด / เทศกาลสำคัญ *</label>
                  <input 
                    type="text"
                    required
                    placeholder="เช่น วันขึ้นปีใหม่, วันจักรี, วันวิสาขบูชา"
                    value={holidayNameVal}
                    onChange={e => setHolidayNameVal(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Holiday Description */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">คำอธิบายรายละเอียดเพิ่มเติม (ข้ามได้)</label>
                  <textarea 
                    rows={2.5}
                    placeholder="เช่น เป็นวันหยุดทดแทน หรือมีจัดพิธีนันทนาการช่วงเย็น"
                    value={holidayDescVal}
                    onChange={e => setHolidayDescVal(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsHolidayFormOpen(false)}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer border-0"
                  >
                    ยกเลิกฟอร์ม
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black flex items-center gap-1 hover:shadow-xs cursor-pointer border-0"
                  >
                    <Check className="w-4 h-4" />
                    บันทึกวันหยุดลงระบบ
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
