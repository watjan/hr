import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  FileText, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Building,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { LeaveRequest, EmployeeSalary } from '../types';

interface LeaveApprovalViewProps {
  leaveRequests: LeaveRequest[];
  employees: EmployeeSalary[];
  onApproveLeave: (id: string, notes?: string) => void;
  onRejectLeave: (id: string, notes?: string) => void;
  onDeleteLeave: (id: string) => void;
  onResetLeaveStatus: (id: string) => void;
  onUpdateLeave?: (req: LeaveRequest) => void;
}

export default function LeaveApprovalView({
  leaveRequests,
  employees,
  onApproveLeave,
  onRejectLeave,
  onDeleteLeave,
  onResetLeaveStatus,
  onUpdateLeave
}: LeaveApprovalViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [managerNotes, setManagerNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Edit states
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [editType, setEditType] = useState<'sick' | 'personal' | 'vacation' | 'other'>('sick');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editDuration, setEditDuration] = useState(1);
  const [editReason, setEditReason] = useState('');
  const [editStatus, setEditStatus] = useState<'approved' | 'pending' | 'rejected' | 'cancelled'>('pending');

  React.useEffect(() => {
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
      status: editStatus
    };

    onUpdateLeave(updated);
    setEditingRequest(null);
  };

  // Get department friendly name helper
  const getDeptName = (deptId: string) => {
    switch (deptId) {
      case 'dept-hr': return 'ฝ่ายบุคคล (HR)';
      case 'dept-it': return 'ฝ่ายเทคโนโลยี (IT)';
      case 'dept-mkt': return 'ฝ่ายการตลาด (Marketing)';
      case 'dept-sales': return 'ฝ่ายขาย (Sales)';
      case 'dept-acc': return 'ฝ่ายบัญชี (Accounting)';
      default: return (deptId || '').toUpperCase();
    }
  };

  // Stats
  const pendingRequests = leaveRequests.filter(req => req.status === 'pending');
  const approvedRequestsCount = leaveRequests.filter(req => req.status === 'approved').length;
  const rejectedRequestsCount = leaveRequests.filter(req => req.status === 'rejected').length;
  const totalRequestsCount = leaveRequests.length;

  // Filter requests
  const filteredRequests = leaveRequests.filter(req => {
    const employee = employees.find(e => e.id === req.employeeId);
    const departmentName = employee?.departmentId ? getDeptName(employee.departmentId) : '';
    
    const matchesSearch = 
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      departmentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesType = typeFilter === 'all' || req.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getLeaveTypeDetails = (type: string) => {
    switch (type) {
      case 'sick':
        return { label: 'ลาป่วย (Sick Leave)', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: '🤒' };
      case 'personal':
        return { label: 'ลากิจ (Personal Leave)', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: '💼' };
      case 'vacation':
        return { label: 'ลาพักร้อน (Vacation Leave)', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: '🌴' };
      case 'other':
      default:
        return { label: 'ลาอื่นๆ (Other Leave)', color: 'bg-slate-50 text-slate-700 border-slate-100', icon: '📝' };
    }
  };

  const handleOpenActionModal = (req: LeaveRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setActionType(type);
    setManagerNotes('');
  };

  const handleConfirmAction = () => {
    if (!selectedRequest || !actionType) return;
    
    // Append manager notes to leave request reason/details or store it
    const finalNotes = managerNotes.trim() ? ` [หมายเหตุผู้อนุมัติ: ${managerNotes.trim()}]` : '';
    
    if (actionType === 'approve') {
      onApproveLeave(selectedRequest.id, finalNotes);
    } else {
      onRejectLeave(selectedRequest.id, finalNotes);
    }

    setSelectedRequest(null);
    setActionType(null);
    setManagerNotes('');
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Banner / Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">รอการพิจารณาอนุมัติ</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-900">{pendingRequests.length}</span>
              <span className="text-xs font-semibold text-amber-700">คำร้อง</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-200">
            <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
          </div>
        </div>

        {/* Approved card */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">อนุมัติแล้ว</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-900">{approvedRequestsCount}</span>
              <span className="text-xs font-semibold text-emerald-700">คำร้อง</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-200">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Rejected card */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">ปฏิเสธคำขอการลา</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-900">{rejectedRequestsCount}</span>
              <span className="text-xs font-semibold text-rose-700">คำร้อง</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-200">
            <XCircle className="w-6 h-6 text-rose-600" />
          </div>
        </div>

        {/* Total card */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-2xl border border-indigo-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">รวมบันทึกคำขอทั้งหมด</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-900">{totalRequestsCount}</span>
              <span className="text-xs font-semibold text-indigo-700">คำร้อง</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-200">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Pending Items Spotlight Area */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border border-amber-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              รายการคำขอลาที่ค้างตรวจสอบเร่งด่วน ({pendingRequests.length})
            </h3>
            <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded-full animate-pulse uppercase tracking-wide">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map(req => {
              const details = getLeaveTypeDetails(req.type);
              const employee = employees.find(e => e.id === req.employeeId);
              return (
                <motion.div
                  key={req.id}
                  layoutId={`card-${req.id}`}
                  className="bg-white border border-amber-200 rounded-xl p-4.5 shadow-sm space-y-3.5 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={employee?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                          alt={req.employeeName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-205"
                        />
                        <div>
                          <h4 className="text-xs font-black text-slate-850 leading-tight">{req.employeeName}</h4>
                          <span className="text-[10px] font-bold text-slate-500 block leading-tight">{employee?.departmentId ? getDeptName(employee.departmentId) : 'ฝ่ายบริการทั่วไป'}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${details.color}`}>
                        {details.icon} {details.label.split(' ')[0]}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-650 bg-slate-50 border border-slate-100 p-2.5 rounded-lg font-medium leading-relaxed italic">
                      " {req.reason} "
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px] font-bold text-slate-600 font-mono">
                      <div className="bg-slate-50/50 p-1.5 rounded border border-slate-100 flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">เริ่มต้นลา</span>
                        <span className="text-slate-800">{req.startDate}</span>
                      </div>
                      <div className="bg-slate-50/50 p-1.5 rounded border border-slate-100 flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">จำนงเวลา</span>
                        <span className="text-indigo-650">{req.durationDays} วัน</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => handleOpenActionModal(req, 'approve')}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-1.5 text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> อนุมัติการลา
                    </button>
                    <button
                      onClick={() => handleOpenActionModal(req, 'reject')}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg py-1.5 text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> ปฏิเสธการลา
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Datagrid View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              รายการคำขอยื่นใบลาในพอร์ทัลและประวัติคำขอทั้งหมด
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">ค้นหาหรือคัดกรองสถานะ/ประเภท เพื่ออนุมัติ ตรวจสอบหลักฐาน หรือลบบันทึกประวัติสมาชิก</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[210px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อพนักงาน, เหตุผล, ฝ่าย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 text-[11px] font-bold text-slate-600">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-3xs' : 'hover:bg-slate-150'}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-600 text-white shadow-3xs' : 'hover:bg-slate-150'}`}
              >
                รออนุมัติ
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-3xs' : 'hover:bg-slate-150'}`}
              >
                อนุมัติแล้ว
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-3xs' : 'hover:bg-slate-150'}`}
              >
                ไม่อนุมัติ
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${statusFilter === 'cancelled' ? 'bg-slate-500 text-white shadow-3xs' : 'hover:bg-slate-150'}`}
              >
                ยกเลิกแล้ว
              </button>
            </div>

            {/* Filter Leave Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">ทุกประเภทการลา</option>
              <option value="sick">🤒 ลาป่วย (Sick)</option>
              <option value="personal">💼 ลากิจ (Personal)</option>
              <option value="vacation">🌴 ลาพักร้อน (Vacation)</option>
              <option value="other">📝 ลาอื่นๆ (Other)</option>
            </select>
          </div>
        </div>

        {/* Datatable */}
        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full border-collapse text-left text-xs bg-white">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-150">
                <th className="p-4">พนักงานผู้ติดต่อคำขอ</th>
                <th className="p-4">แผนก/กลุ่มงาน</th>
                <th className="p-4">ประเภท</th>
                <th className="p-4 text-center">ระยะเวลาลา</th>
                <th className="p-4">เหตุผลในการลา</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-center">จัดการคำขอ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRequests.map(req => {
                const details = getLeaveTypeDetails(req.type);
                const employee = employees.find(e => e.id === req.employeeId);
                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={employee?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                          alt={req.employeeName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <strong className="text-slate-900 font-extrabold text-xs block">{req.employeeName}</strong>
                          <span className="text-[10px] text-slate-400 font-bold block font-mono">ID: {req.employeeId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-500">
                      {employee?.departmentId ? getDeptName(employee.departmentId) : 'ฝ่ายบริการทั่วไป'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${details.color}`}>
                        {details.icon} {details.label}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800 font-mono">
                      <div>{req.durationDays} วัน</div>
                      <div className="text-[9px] text-slate-400 font-bold">{req.startDate} ถึง {req.endDate}</div>
                    </td>
                    <td className="p-4 text-slate-650 font-bold max-w-[280px] break-words">
                      {req.reason}
                    </td>
                    <td className="p-4 text-center">
                      {req.status === 'approved' && (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-150 text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> อนุมัติแล้ว
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-150 text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ
                        </span>
                      )}
                      {req.status === 'pending' && (
                        <span className="bg-amber-50 text-amber-600 border border-amber-150 text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> รอการตัดสินใจ
                        </span>
                      )}
                      {req.status === 'cancelled' && (
                        <span className="bg-slate-550/10 text-slate-500 border border-slate-200 text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> ยกเลิกแล้ว
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {req.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleOpenActionModal(req, 'approve')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer hover:shadow-3xs"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(req, 'reject')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                            >
                              ปฏิเสธ
                            </button>
                            {onUpdateLeave && (
                              <button
                                onClick={() => {
                                  if (confirm('❔ แอดมินต้องการยกเลิกคำขอลาของพนักงานท่านนี้ใช่หรือไม่?')) {
                                    onUpdateLeave({ ...req, status: 'cancelled' as const });
                                  }
                                }}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-extrabold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                                title="แอดมินยกเลิกคำขอลาแทนพนักงาน"
                              >
                                ยกเลิกคำขอ
                              </button>
                            )}
                            {onUpdateLeave && (
                              <button
                                onClick={() => handleStartEdit(req)}
                                className="text-indigo-600 hover:text-indigo-755 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded-lg text-[10.5px] font-black transition-colors border border-indigo-200 cursor-pointer flex items-center gap-1"
                                title="แก้ไขรายละเอียดหรือสถานะคำร้องขอลา"
                              >
                                📝 แก้ไข
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {onUpdateLeave && req.status !== 'cancelled' && (
                              <button
                                onClick={() => {
                                  if (confirm('❔ แอดมินต้องการยกเลิกคำขอลาของพนักงานท่านนี้ใช่หรือไม่?')) {
                                    onUpdateLeave({ ...req, status: 'cancelled' as const });
                                  }
                                }}
                                className="bg-rose-50 hover:bg-rose-150 text-rose-600 border border-rose-150 font-bold px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                                title="แอดมินยกเลิกคำขอลาแทนพนักงาน"
                              >
                                🚫 ยกเลิกคำขอ
                              </button>
                            )}
                            {onUpdateLeave && (
                              <button
                                onClick={() => handleStartEdit(req)}
                                className="text-indigo-600 hover:text-indigo-755 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded-lg text-[10.5px] font-black transition-colors border border-indigo-200 cursor-pointer flex items-center gap-1"
                                title="แก้ไขรายละเอียดหรือสถานะคำร้องขอลา"
                              >
                                📝 แก้ไข
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('คุณแน่ใจว่าต้องการลบบันทึกคำขอนี้?')) {
                                  onDeleteLeave(req.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="ลบรายการ"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    ไม่พบรายการคำขอลาที่ต้องการแสดงในระบบขณะนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Prompt Modal for approval / rejection with comments */}
      <AnimatePresence>
        {selectedRequest && actionType && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-left"
            >
              <div className="p-5 border-b border-slate-150 flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  {actionType === 'approve' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                  {actionType === 'approve' ? 'ยืนยันอนุมัติสิทธิ์การลา' : 'ยืนยันเพื่อปฏิเสธคำขอการลา'}
                </h4>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-slate-400 hover:text-slate-650"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-extrabold text-slate-800">ผู้ยื่นคำร้อง: {selectedRequest.employeeName}</div>
                    <div className="font-bold text-slate-550">ประเภท: {getLeaveTypeDetails(selectedRequest.type).label}</div>
                    <div className="font-bold text-slate-550">ช่วงวัน: {selectedRequest.startDate} ถึง {selectedRequest.endDate} ({selectedRequest.durationDays} วัน)</div>
                    <div className="font-bold text-slate-550 mt-1 italic text-slate-600 bg-white border border-slate-100 p-2 rounded">
                      " {selectedRequest.reason} "
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    เขียนความเห็น / หมายเหตุคำชี้แจงของผู้แต่งตั้ง (ข้ามได้):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ใส่หมายเหตุชี้แจงเพื่อส่งกลับให้ผู้ยื่นทราบ..."
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all shadow-3xs"
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`rounded-xl px-5 py-2 text-xs font-black text-white shrink-0 cursor-pointer shadow-3xs ${
                    actionType === 'approve' 
                      ? 'bg-emerald-500 hover:bg-emerald-600' 
                      : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  {actionType === 'approve' ? 'อนุมัติผู้ลาพักทันที' : 'ระงับ/ปฏิเสธคำร้องใบสมัคร'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 font-sans">
                    📝 แก้ไขแบบฟอร์มคำร้องขอลา (มุมมองผู้อนุมัติ)
                  </h4>
                  <p className="text-[10px] text-slate-550 font-bold mt-0.5">
                    ผู้เสนอคำขอ: {editingRequest.employeeName} ({editingRequest.employeeId})
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

              <form onSubmit={handleSaveEdit} className="p-5 space-y-4 font-sans">
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
                    <label className="text-[10px] font-black uppercase text-indigo-600">สถานะการอนุมัติ:</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold cursor-pointer text-indigo-750"
                    >
                      <option value="pending">⏳ รอการพิจารณาอนุมัติ (Pending)</option>
                      <option value="approved">✅ อนุมัติผู้ลาพักทันที (Approved)</option>
                      <option value="rejected">❌ ระงับ/ปฏิเสธคำร้องใบคำขอ (Rejected)</option>
                      <option value="cancelled">🚫 ยกเลิกคำขอ (Cancelled)</option>
                    </select>
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
                  <span>⏱️ จำนวนวันต้องการลาพัก:</span>
                  <span className="font-mono text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">{editDuration} วัน</span>
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">เหตุผลประกอบการเสนอคำขอลาหยุดงาน:</label>
                  <textarea
                    rows={3}
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    placeholder="ระบุเหตุผลความจำเป็น..."
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
