import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  HeartHandshake, 
  Plane, 
  FileCheck,
  CheckCircle,
  XCircle,
  Clock3,
  User,
  Check,
  FileText,
  Upload,
  UserCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  Trash2,
  RotateCcw,
  X
} from 'lucide-react';
import { LeaveRequest, EmployeeSalary } from '../types';

interface EmployeeLeaveViewProps {
  session: {
    username: string;
    displayName: string;
    role: string;
    department: string;
    avatarUrl?: string;
    employeeId?: string;
  };
  employees: EmployeeSalary[];
  leaveRequests: LeaveRequest[];
  onAddLeave: (req: LeaveRequest) => void;
  onDeleteLeave: (id: string) => void;
  onResetLeaveStatus?: (id: string) => void;
  onUpdateLeave?: (req: LeaveRequest) => void;
}

export default function EmployeeLeaveView({
  session,
  employees,
  leaveRequests,
  onAddLeave,
  onDeleteLeave,
  onResetLeaveStatus,
  onUpdateLeave
}: EmployeeLeaveViewProps) {
  // Find employee data
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    if (session.employeeId) {
      const found = employees.find(emp => emp.id === session.employeeId || emp.employeeId === session.employeeId);
      if (found) return found.id;
    }
    return employees.length > 0 ? employees[0].id : '';
  });

  const activeEmp = employees.find(emp => emp.id === selectedEmpId) || employees[0];

  const [typeInput, setTypeInput] = useState<'sick' | 'personal' | 'vacation' | 'other'>('sick');
  const [startDateInput, setStartDateInput] = useState('2026-06-20');
  const [endDateInput, setEndDateInput] = useState('2026-06-20');
  const [durationDaysInput, setDurationDaysInput] = useState(1);
  const [reasonInput, setReasonInput] = useState('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showStatusToast, setShowStatusToast] = useState<{ show: boolean; msg: string; type: 'success' | 'err' }>({
    show: false,
    msg: '',
    type: 'success'
  });

  // Edit Leave Request states
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [editType, setEditType] = useState<'sick' | 'personal' | 'vacation' | 'other'>('sick');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editDuration, setEditDuration] = useState(1);
  const [editReason, setEditReason] = useState('');
  const [editStatus, setEditStatus] = useState<'approved' | 'pending' | 'rejected' | 'cancelled'>('pending');

  // Auto calculate duration in days for edit state
  useEffect(() => {
    if (editStartDate && editEndDate) {
      const start = new Date(editStartDate);
      const end = new Date(editEndDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (!isNaN(diffDays) && diffDays > 0) {
        setEditDuration(diffDays);
      } else {
        setEditDuration(1);
      }
    }
  }, [editStartDate, editEndDate]);

  const handleStartEdit = (req: LeaveRequest) => {
    setEditingRequest(req);
    const leaveType = req.type as 'sick' | 'personal' | 'vacation' | 'other';
    setEditType(leaveType);
    setEditStartDate(req.startDate);
    setEditEndDate(req.endDate);
    setEditDuration(req.durationDays);
    setEditReason(req.reason);
    setEditStatus(req.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest || !onUpdateLeave) return;

    if (!editReason.trim()) {
      alert('❌ กรุณากรอกเหตุผลความจำเป็นในการลา');
      return;
    }

    const updated: LeaveRequest = {
      ...editingRequest,
      type: editType as 'sick' | 'personal' | 'vacation' | 'other',
      startDate: editStartDate,
      endDate: editEndDate,
      durationDays: editDuration,
      reason: editReason,
      status: editStatus,
    };

    onUpdateLeave(updated);
    setEditingRequest(null);
    setShowStatusToast({
      show: true,
      msg: '🚀 อัปเดตข้อมูลคำร้องขอลาสำเร็จแล้ว',
      type: 'success'
    });
  };

  // Calculate stats for this specific employee
  const myRequests = leaveRequests.filter(r => r.employeeId === activeEmp?.id);

  const approvedSick = myRequests
    .filter(r => r.type === 'sick' && r.status === 'approved')
    .reduce((sum, r) => sum + r.durationDays, 0);

  const approvedPersonal = myRequests
    .filter(r => r.type === 'personal' && r.status === 'approved')
    .reduce((sum, r) => sum + r.durationDays, 0);

  const approvedVacation = myRequests
    .filter(r => r.type === 'vacation' && r.status === 'approved')
    .reduce((sum, r) => sum + r.durationDays, 0);

  const pendingCount = myRequests.filter(r => r.status === 'pending').length;

  // Auto calculate duration in days
  useEffect(() => {
    if (startDateInput && endDateInput) {
      const start = new Date(startDateInput);
      const end = new Date(endDateInput);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (!isNaN(diffDays) && diffDays > 0) {
        setDurationDaysInput(diffDays);
      } else {
        setDurationDaysInput(1);
      }
    }
  }, [startDateInput, endDateInput]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachmentName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      setShowStatusToast({
        show: true,
        msg: '❌ กรุณากรอกเหตุผลความจำเป็นในการลา',
        type: 'err'
      });
      setTimeout(() => setShowStatusToast({ show: false, msg: '', type: 'success' }), 3000);
      return;
    }

    const payload: LeaveRequest = {
      id: `req-emp-${Date.now()}`,
      employeeId: activeEmp?.id || 'emp-unknown',
      employeeName: activeEmp?.name || session.displayName,
      type: typeInput,
      startDate: startDateInput,
      endDate: endDateInput,
      durationDays: Number(durationDaysInput),
      reason: reasonInput + (attachmentName ? ` (แนบหลักฐาน: ${attachmentName})` : ''),
      status: 'pending' // always pending when submitted by employee
    };

    onAddLeave(payload);
    
    // reset form
    setReasonInput('');
    setAttachmentName('');
    
    setShowStatusToast({
      show: true,
      msg: '🚀 ส่งความจำนงคำร้องขอลาสำเร็จ! รอหัวหน้างานอนุมัติ',
      type: 'success'
    });
    setTimeout(() => setShowStatusToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const handleDeleteRequest = (id: string) => {
    if (confirm('คุณต้องการยกเลิกคำขอลาที่รอการตรวจสอบนี้หรือไม่?')) {
      onDeleteLeave(id);
      setShowStatusToast({
        show: true,
        msg: '🗑️ ยกเลิกคำขอลาเรียบร้อยแล้ว',
        type: 'success'
      });
      setTimeout(() => setShowStatusToast({ show: false, msg: '', type: 'success' }), 3000);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-100 gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-indigo-650" />
            พอร์ทัลยื่นคำร้องใบลาสำหรับพนักงาน (Employee Leave Portal)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ระบุรายละเอียดความประสงค์ขอลาพักผ่อน ลาป่วย ลากิจ ประสานส่งต่อตรงสู่ฝ่ายบริหารบุคคลได้ทันเวลา
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-750">
          🟢 เข้าใช้งานเป็นโมดูลพนักงาน: <strong className="text-indigo-900">{session.displayName}</strong>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showStatusToast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-3.5 rounded-xl border font-bold text-xs flex items-center gap-2 shadow-md ${
              showStatusToast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
                : 'bg-rose-50 border-rose-150 text-rose-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{showStatusToast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Profile card + Request form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Employee Mini Profile Box */}
          {activeEmp && (
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm border border-indigo-950 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <img 
                src={activeEmp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                alt={activeEmp.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-md shrink-0 select-none"
              />
              <div className="space-y-1 min-w-0 text-center sm:text-left">
                <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest block font-mono">
                  {activeEmp.employeeId} • {activeEmp.position}
                </span>
                <h3 className="text-lg font-black tracking-tight">{activeEmp.name}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    ฝ่าย: {activeEmp.departmentId ? (
                      activeEmp.departmentId === 'dept-hr' ? 'ฝ่ายบุคคล (HR)' :
                      activeEmp.departmentId === 'dept-it' ? 'ฝ่ายเทคโนโลยี (IT)' :
                      activeEmp.departmentId === 'dept-dev' ? 'ฝ่ายพัฒนาผลิตภัณฑ์ (R&D)' :
                      activeEmp.departmentId === 'dept-sales' ? 'ฝ่ายขายและการตลาด (Sales)' :
                      activeEmp.departmentId === 'dept-acc' ? 'ฝ่ายบัญชีและการเงิน (Accounting)' :
                      'ฝ่ายบริการทั่วไป'
                    ) : (session.department || 'วิศวกรรมซอฟต์แวร์')}
                  </span>
                  <span className="w-1 h-1 bg-slate-500 rounded-full hidden sm:inline" />
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    เริ่มงานเมื่อ: {activeEmp.startDate || '2021-02-15'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* New Request Interactive Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-105 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 animate-pulse" />
              กรอกใบคำร้องขอลา (Submit New Leave Request)
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Employee Selection Dropdown */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                <label className="text-[11px] text-slate-500 font-black block">👤 เลือกบัญชีผู้ยื่นขอลาหยุดงาน:</label>
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  disabled={session.role === 'employee'}
                  className={`w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                    session.role === 'employee' 
                      ? 'cursor-not-allowed text-slate-500 bg-slate-100' 
                      : 'cursor-pointer text-slate-800 focus:border-indigo-500'
                  }`}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
                {session.role === 'employee' ? (
                  <p className="text-[9.5px] text-slate-400 font-bold mt-1">
                    * จำกัดสิทธิ์ความปลอดภัย (เชื่อมตรงกับพนักงานท่านที่เข้าสู่ระบบ)
                  </p>
                ) : (
                  <p className="text-[9.5px] text-indigo-600 font-extrabold mt-1">
                    * ในบทบาทแอดมิน/ฝ่ายบุคคล คุณสามารถเลือกพนักงานท่านอื่นเพื่อยื่นเอกสาร/ตรวจสอบประวัติแทนได้
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Leave Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold block">ประเภทการขอลาสำคัญ:</label>
                  <select
                    value={typeInput}
                    onChange={e => setTypeInput(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="sick">🤒 ลาป่วย (มีอาการไม่สบาย/ตรวจสุขภาพ)</option>
                    <option value="personal">💼 ลากิจ (มีภารกิจจำเป็นส่วนบุคคล)</option>
                    <option value="vacation">🏖️ ลาพักร้อนประจำปี</option>
                    <option value="other">📝 ลาประเภทอื่นๆ</option>
                  </select>
                </div>

                {/* 2. Duration Preview */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold block">ระยะเวลาหยุดงานคำนวณ:</label>
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800 font-mono font-black text-xs flex items-center justify-between">
                    <span>จำนวนวันหยุดคิดเป็น:</span>
                    <span className="text-sm text-indigo-900 bg-white px-2 py-0.5 rounded shadow-2xs font-extrabold">{durationDaysInput} วัน</span>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 3. Start Date selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold block">ตั้งแต่วันที่:</label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      value={startDateInput}
                      onChange={e => setStartDateInput(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* 4. End Date selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold block">ถึงวันที่ (รวมวันสุดท้าย):</label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      value={endDateInput}
                      onChange={e => setEndDateInput(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
                    />
                  </div>
                </div>

              </div>

              {/* 5. Reason Comment Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold block">ระบุเหตุชี้แจงความจำเป็น:</label>
                <textarea
                  required
                  placeholder="เช่น ลาป่วยเนื่องจากอาหารเป็นพิษเฉียบพลัน, ลากิจไปทำบัตรประชาชนใหม่..."
                  rows={3}
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
                />
              </div>

              {/* 6. Document Upload Simulation Box (Drag and Drop is required) */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold block">
                  ใบรับรองแพทย์ / รูปภาพหลักประกอบ (ถ้ามี):
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    isDragOver 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : attachmentName 
                        ? 'border-emerald-400 bg-emerald-50/60 text-slate-700' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <input
                    type="file"
                    id="employee-leave-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <label htmlFor="employee-leave-file-input" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                    {attachmentName ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-emerald-500 mb-1" />
                        <span className="text-xs font-black text-emerald-700">แนบหลักฐานเรียบร้อย!</span>
                        <span className="text-[10px] text-slate-500 font-mono max-w-xs truncate mt-0.5">{attachmentName}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700">ลากและวางรูปภาพไฟล์ หรือคลิกเพื่ออัปโหลด</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">รองรับไฟล์ใบรับรองแพทย์ PDF, JPG, PNG (ไม่เกิน 5MB)</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/10"
              >
                <Plus className="w-4 h-4" />
                ส่งใบขอลาเข้าระบบอำนวยการ
              </button>

            </form>
          </div>

        </div>

        {/* Right column: Stats summary cards + Leave History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Approved Leave Accumulator Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            
            <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-3 text-center shadow-2xs">
              <HeartHandshake className="w-4.5 h-4.5 text-rose-500 mx-auto mb-1" />
              <span className="text-[9.5px] uppercase font-bold text-rose-700 block">ลาป่วยอนุมัติ</span>
              <span className="text-lg font-black text-rose-800 font-mono">
                {approvedSick} <span className="text-[10px] font-normal text-slate-400">วัน</span>
              </span>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 text-center shadow-2xs">
              <Calendar className="w-4.5 h-4.5 text-indigo-500 mx-auto mb-1" />
              <span className="text-[9.5px] uppercase font-bold text-indigo-700 block">ลากิจอนุมัติ</span>
              <span className="text-lg font-black text-indigo-800 font-mono">
                {approvedPersonal} <span className="text-[10px] font-normal text-slate-400">วัน</span>
              </span>
            </div>

            <div className="bg-teal-50/80 border border-teal-100 rounded-xl p-3 text-center shadow-2xs">
              <Plane className="w-4.5 h-4.5 text-teal-500 mx-auto mb-1" />
              <span className="text-[9.5px] uppercase font-bold text-teal-700 block">พักร้อนอนุมัติ</span>
              <span className="text-lg font-black text-teal-800 font-mono">
                {approvedVacation} <span className="text-[10px] font-normal text-slate-400">วัน</span>
              </span>
            </div>

          </div>

          {/* Leaves History Lists Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-105 shadow-sm space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4.5 h-4.5 text-emerald-600" />
                ประวัติการทำรายการของ {activeEmp?.name || session.displayName} ({myRequests.length} รายการคำขอ)
              </h3>
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-850 px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse">
                  รอยืนยัน {pendingCount}
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {myRequests.map((req) => {
                const getLeaveTypeBadge = (t: string) => {
                  switch (t) {
                    case 'sick': return <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded border border-rose-100 font-black">🤒 ลาป่วย</span>;
                    case 'personal': return <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded border border-indigo-100 font-black">💼 ลากิจ</span>;
                    case 'vacation': return <span className="bg-teal-50 text-teal-700 text-[10px] px-2 py-0.5 rounded border border-teal-100 font-black">🏖️ พักร้อน</span>;
                    default: return <span className="bg-slate-50 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-100 font-black">📝 อื่นๆ</span>;
                  }
                };

                return (
                  <div key={req.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      {getLeaveTypeBadge(req.type)}
                      <span className="text-[10px] font-black text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-150">
                        หยุด {req.durationDays} วัน
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-705">
                      <p className="font-mono text-[10.5px] text-slate-500 font-bold">
                        📅 {req.startDate} ถึง {req.endDate}
                      </p>
                      <p className="font-medium text-slate-650 leading-relaxed text-xs">
                        📌 เหตุผล: <strong className="text-slate-800 font-bold">{req.reason}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-150/40">
                      <div className="flex items-center gap-1">
                        {req.status === 'approved' && (
                          <span className="text-[10px] font-black text-emerald-650 flex items-center gap-1 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5" /> อนุมัติแล้ว
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="text-[10px] font-black text-red-600 flex items-center gap-1 bg-red-50 border border-red-150 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> บริหารปฏิเสธ
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="text-[10px] font-black text-amber-700 flex items-center gap-1 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded-full">
                            <Clock3 className="w-3.5 h-3.5" /> กำลังตรวจสอบ
                          </span>
                        )}
                        {req.status === 'cancelled' && (
                          <span className="text-[10px] font-black text-slate-500 flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> ยกเลิกแล้ว
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {onUpdateLeave && req.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('❔ คุณต้องการยกเลิกคำขอลาของท่านรายการนี้ใช่หรือไม่?')) {
                                onUpdateLeave({ ...req, status: 'cancelled' as const });
                                setShowStatusToast({
                                  show: true,
                                  msg: '🚫 ดำเนินการยกเลิกคำขอลาสำเร็จแล้ว',
                                  type: 'success'
                                });
                                setTimeout(() => setShowStatusToast({ show: false, msg: '', type: 'success' }), 3000);
                              }
                            }}
                            className="flex items-center gap-1 text-[10.5px] font-black text-rose-600 hover:text-rose-750 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-150 transition-colors cursor-pointer"
                            title="กดยกเลิกการลาด้วยตนเอง"
                          >
                            🚫 ยกเลิกใบลา
                          </button>
                        )}

                        {onUpdateLeave && req.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(req)}
                            className="flex items-center gap-1 text-[10.5px] font-black text-indigo-600 hover:text-indigo-750 bg-indigo-50/80 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-150 transition-colors cursor-pointer"
                            title="แก้ไขคำขอลา"
                          >
                            📝 แก้ไข
                          </button>
                        )}

                        {/* Only allow deletion for pending items */}
                        {req.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                            title="ลบคำร้องใบลาออกจากการแก้ไข"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {myRequests.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-150 rounded-xl space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">ไม่มีข้อมูลประวัติคำขอลาหยุดงานสะสม</p>
                  <p className="text-[10px] text-slate-400 font-medium">กรอกแบบฟอร์มด้านข้างเพื่อยื่นคำขอลารายการแรกของคุณ</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Edit Leave Request Modal */}
      <AnimatePresence>
        {editingRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-left"
            >
              <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    📝 แก้ไขแบบฟอร์มคำร้องขอลาหยุดงาน
                  </h4>
                  <p className="text-[10px] text-slate-550 font-bold mt-0.5">
                    ผู้ยื่นคำขอลายงาน: {editingRequest.employeeName} ({editingRequest.employeeId})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Leave Type Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">ประเภทการลา:</label>
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold cursor-pointer"
                    >
                      <option value="sick">🤒 ลาป่วย (Sick)</option>
                      <option value="personal">💼 ลากิจ (Personal)</option>
                      <option value="vacation">🌴 ลาพักร้อน (Vacation)</option>
                      <option value="other">📝 ลาอื่นๆ (Other)</option>
                    </select>
                  </div>

                  {/* Status Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-indigo-600">สถานะคำขออนุมัติ:</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as any)}
                      disabled={session.role === 'employee'}
                      className={`w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                        session.role === 'employee' ? 'cursor-not-allowed bg-slate-50 text-slate-500' : 'cursor-pointer text-indigo-700'
                      }`}
                    >
                      <option value="pending">⏳ รออนุมัติ (Pending)</option>
                      <option value="approved">✅ อนุมัติแล้ว (Approved)</option>
                      <option value="rejected">❌ ปฏิเสธการลา (Rejected)</option>
                      <option value="cancelled">🚫 ยกเลิกแล้ว (Cancelled)</option>
                    </select>
                    {session.role === 'employee' && (
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">* เฉพาะผู้อนุมัติ/HR เท่านั้นที่แก้สถานะได้</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">วันเริ่มต้นการลา:</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={e => setEditStartDate(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">วันสิ้นสุดการลา:</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={e => setEditEndDate(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                </div>

                {/* Duration info */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>⏱️ จำนวนวันลาทั้งหมด:</span>
                  <span className="font-mono text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">{editDuration} วัน</span>
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">เหตุผลความจำเป็นในการลาหยุดงาน:</label>
                  <textarea
                    rows={3}
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    placeholder="กรอกเหตุผล ข้อมูลรายละเอียด หรือเอกสารประกอบการลา..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold placeholder:text-slate-350"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingRequest(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    💾 บันทึกการแก้ไข
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
