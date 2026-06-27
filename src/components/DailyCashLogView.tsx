import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Wallet,
  AlertCircle,
  FileText,
  User,
  Settings
} from 'lucide-react';
import { DailyCashLog, EmployeeSalary } from '../types';
import { saveKeyToCloud, fetchKeyFromCloud } from '../lib/firebaseSync';

interface DailyCashLogViewProps {
  employees: EmployeeSalary[];
}

const DEFAULT_CASH_LOGS: DailyCashLog[] = [
  {
    id: 'DCL-001',
    date: '2026-06-25',
    sales1: 25000,
    sales2: 12500,
    reserve: 2000,
    transferKhonLaKhrueng: 3500,
    transferKBank: 4500,
    transferSCB: 2000,
    expense: 1500,
    actualCashCounted: 23500,
    creator: 'สมชาย รักดี',
    note: 'ยอดสิ้นวันปกติ เครื่องครัวเซ็ตใหญ่'
  },
  {
    id: 'DCL-002',
    date: '2026-06-24',
    sales1: 18500,
    sales2: 8000,
    reserve: 2000,
    transferKhonLaKhrueng: 1500,
    transferKBank: 3000,
    transferSCB: 1500,
    expense: 800,
    actualCashCounted: 18700,
    creator: 'วรรณวิสา วงศ์วรรณ',
    note: 'มีค่าแก๊ส LPG และอุปกรณ์สำนักงาน'
  },
  {
    id: 'DCL-003',
    date: '2026-06-23',
    sales1: 32000,
    sales2: 15000,
    reserve: 2000,
    transferKhonLaKhrueng: 5000,
    transferKBank: 6000,
    transferSCB: 4000,
    expense: 2500,
    actualCashCounted: 23000,
    creator: 'วิชัย ชาญชัย',
    note: 'ซื้อของเบ็ดเตล็ดเข้าหน้าร้าน'
  }
];

export default function DailyCashLogView({ employees }: DailyCashLogViewProps) {
  const [logs, setLogs] = useState<DailyCashLog[]>(() => {
    const saved = localStorage.getItem('sapphire_daily_cash_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CASH_LOGS;
      }
    }
    return DEFAULT_CASH_LOGS;
  });

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form States
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSales1, setFormSales1] = useState('');
  const [formSales2, setFormSales2] = useState('');
  const [formReserve, setFormReserve] = useState('2000'); // Default 2,000 Baht
  const [formKhonLaKhrueng, setFormKhonLaKhrueng] = useState('');
  const [formKBank, setFormKBank] = useState('');
  const [formSCB, setFormSCB] = useState('');
  const [formExpense, setFormExpense] = useState('');
  const [formActualCash, setFormActualCash] = useState('');
  const [formCreator, setFormCreator] = useState(employees[0]?.name || 'สมชาย รักดี');
  const [formNote, setFormNote] = useState('');

  // Sync state
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Load from Cloud Firestore on Mount
  useEffect(() => {
    const fetchLatestLogs = async () => {
      setIsLoadingCloud(true);
      setCloudStatus('syncing');
      try {
        const cloudData = await fetchKeyFromCloud('daily_cash_logs');
        if (cloudData && Array.isArray(cloudData)) {
          setLogs(cloudData);
          localStorage.setItem('sapphire_daily_cash_logs', JSON.stringify(cloudData));
          setCloudStatus('success');
        } else {
          setCloudStatus('idle');
        }
      } catch (err) {
        console.error('[Firebase] Failed to fetch daily cash logs:', err);
        setCloudStatus('error');
      } finally {
        setIsLoadingCloud(false);
      }
    };
    fetchLatestLogs();
  }, []);

  // Sync to Cloud
  const saveLogsToStorage = async (updatedLogs: DailyCashLog[]) => {
    setLogs(updatedLogs);
    localStorage.setItem('sapphire_daily_cash_logs', JSON.stringify(updatedLogs));

    setCloudStatus('syncing');
    try {
      await saveKeyToCloud('daily_cash_logs', updatedLogs);
      setCloudStatus('success');
      // Trigger update event for other components if needed
      window.dispatchEvent(new Event('sapphire_storage_updated'));
    } catch (err) {
      console.error('[Firebase] Failed to auto-save daily cash logs:', err);
      setCloudStatus('error');
    }
  };

  // Helper date conversions
  const getThaiMonthName = (monthIndex: number) => {
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return months[monthIndex] || '';
  };

  const formatThaiDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = getThaiMonthName(d.getMonth());
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  // Form Computed Calculations (Realtime updates for preview in Dialog)
  const sales1Num = parseFloat(formSales1) || 0;
  const sales2Num = parseFloat(formSales2) || 0;
  const reserveNum = parseFloat(formReserve) || 0;
  const khonLaKhruengNum = parseFloat(formKhonLaKhrueng) || 0;
  const kbankNum = parseFloat(formKBank) || 0;
  const scbNum = parseFloat(formSCB) || 0;
  const expenseNum = parseFloat(formExpense) || 0;
  const actualCashNum = parseFloat(formActualCash) || 0;

  const computedTransferTotal = useMemo(() => {
    return khonLaKhruengNum + kbankNum + scbNum;
  }, [khonLaKhruengNum, kbankNum, scbNum]);

  const computedExpectedCash = useMemo(() => {
    // ยอดทอนที่มีตอนแรก + ยอดเงินที่ได้จากยอดขายหลักและรองหลังหักส่วนที่โอนและหักรายจ่าย
    // สูตรของร้าน: ยอดในเก๊ะ = (ยอดขายที่ 1 + ยอดขายที่ 2) - ยอดเตรียมเงินทอน - ยอดโอนรวม - รายจ่ายวันนี้
    return (sales1Num + sales2Num) - reserveNum - computedTransferTotal - expenseNum;
  }, [sales1Num, sales2Num, reserveNum, computedTransferTotal, expenseNum]);

  const computedDiscrepancy = useMemo(() => {
    // สูตรการคำนวณที่ปรับปรุงใหม่: ส่วนที่ 1 - ส่วนที่ 2
    // ส่วนที่ 1 = ยอดขายรวม (ยอดขายที่ 1 + ยอดขายที่ 2)
    // ส่วนที่ 2 = ยอดนับได้จริง + ยอดโอนรวม (คนละครึ่ง + กสิกร + SCB) - รายจ่ายวันนี้ - ยอดเตรียมทอน
    const part1 = sales1Num + sales2Num;
    const part2 = actualCashNum + computedTransferTotal - expenseNum - reserveNum;
    return part1 - part2;
  }, [sales1Num, sales2Num, actualCashNum, computedTransferTotal, expenseNum, reserveNum]);

  // Aggregate Stats across all records
  const stats = useMemo(() => {
    let totalSales = 0;
    let totalTransfers = 0;
    let totalExpenses = 0;
    let totalActualCash = 0;
    let totalDiscrepancy = 0;

    for (const log of logs) {
      totalSales += (log.sales1 + log.sales2);
      totalTransfers += (log.transferKhonLaKhrueng + log.transferKBank + log.transferSCB);
      totalExpenses += log.expense;
      totalActualCash += log.actualCashCounted;
      
      const logTransfer = log.transferKhonLaKhrueng + log.transferKBank + log.transferSCB;
      const part1 = log.sales1 + log.sales2;
      const part2 = log.actualCashCounted + logTransfer - log.expense - log.reserve;
      const discrepancy = part1 - part2;
      totalDiscrepancy += discrepancy;
    }

    return {
      totalSales,
      totalTransfers,
      totalExpenses,
      totalActualCash,
      totalDiscrepancy,
      logCount: logs.length
    };
  }, [logs]);

  // Filtered and Sorted Logs
  const filteredLogs = useMemo(() => {
    const filtered = logs.filter(log => {
      const matchesSearch =
        log.date.includes(searchTerm) ||
        log.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.note && log.note.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      return sortOrder === 'desc'
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
    });
  }, [logs, searchTerm, sortOrder]);

  // Open Modal to Add
  const openAddModal = () => {
    setEditingLogId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSales1('');
    setFormSales2('');
    setFormReserve('2000');
    setFormKhonLaKhrueng('');
    setFormKBank('');
    setFormSCB('');
    setFormExpense('');
    setFormActualCash('');
    setFormCreator(employees[0]?.name || 'สมชาย รักดี');
    setFormNote('');
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const openEditModal = (log: DailyCashLog) => {
    setEditingLogId(log.id);
    setFormDate(log.date);
    setFormSales1(log.sales1.toString());
    setFormSales2(log.sales2.toString());
    setFormReserve(log.reserve.toString());
    setFormKhonLaKhrueng(log.transferKhonLaKhrueng > 0 ? log.transferKhonLaKhrueng.toString() : '');
    setFormKBank(log.transferKBank > 0 ? log.transferKBank.toString() : '');
    setFormSCB(log.transferSCB > 0 ? log.transferSCB.toString() : '');
    setFormExpense(log.expense > 0 ? log.expense.toString() : '');
    setFormActualCash(log.actualCashCounted.toString());
    setFormCreator(log.creator);
    setFormNote(log.note || '');
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDate) {
      alert('กรุณาระบุวันที่ทำรายการ');
      return;
    }

    // Check duplicate date constraint
    const dateExists = logs.some(l => 
      l.date === formDate && (!editingLogId || l.id !== editingLogId)
    );
    if (dateExists) {
      alert(`❌ ไม่สามารถบันทึกได้: มีข้อมูลบันทึกของวันที่ ${formatThaiDate(formDate)} อยู่ในระบบแล้ว!\nระบบอนุญาตให้ลงบันทึกได้เพียง 1 รายการต่อวันเท่านั้นเพื่อความถูกต้อง`);
      return;
    }

    const newLog: DailyCashLog = {
      id: editingLogId || `DCL-${Date.now().toString().slice(-6)}`,
      date: formDate,
      sales1: parseFloat(formSales1) || 0,
      sales2: parseFloat(formSales2) || 0,
      reserve: parseFloat(formReserve) || 0,
      transferKhonLaKhrueng: parseFloat(formKhonLaKhrueng) || 0,
      transferKBank: parseFloat(formKBank) || 0,
      transferSCB: parseFloat(formSCB) || 0,
      expense: parseFloat(formExpense) || 0,
      actualCashCounted: parseFloat(formActualCash) || 0,
      creator: formCreator,
      note: formNote.trim() || undefined
    };

    let updatedList: DailyCashLog[];
    if (editingLogId) {
      updatedList = logs.map(l => l.id === editingLogId ? newLog : l);
    } else {
      updatedList = [newLog, ...logs];
    }

    // Sort descending by date
    updatedList.sort((a, b) => b.date.localeCompare(a.date));

    saveLogsToStorage(updatedList);
    setIsModalOpen(false);
  };

  // Handle Deletion
  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    saveLogsToStorage(updated);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* HEADER ACTIONS BLOCK */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-3xs">
            <FileSpreadsheet className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              สมุดบันทึกเงินสดรายวัน (Daily Cash Log Grid)
              {isLoadingCloud && (
                <span className="text-xs text-blue-500 font-bold flex items-center gap-1 bg-blue-50 border border-blue-150 rounded-full px-2 py-0.5 animate-pulse">
                  กำลังเชื่อม Cloud
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">
              ระบบตรวจสอบและกระทบยอดเงินสดหน้าเก๊ะรายวัน พร้อมฟังก์ชันหักยอดโอนและบันทึกผลต่างเงินขาด/เงินเกิน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 select-none">
          {cloudStatus === 'success' && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150 font-bold flex items-center gap-1">
              ✓ ซิงค์ Cloud เรียบร้อย
            </span>
          )}
          {cloudStatus === 'error' && (
            <span className="text-[10px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-150 font-bold flex items-center gap-1">
              ⚠ ซิงค์ Cloud ล้มเหลว
            </span>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-97"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มบันทึกรายวัน</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 select-none">
        {/* Total Incomes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 text-left shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ยอดขายสะสมรวม</span>
          <div className="text-lg font-black text-slate-800 leading-tight">
            ฿{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[9px] text-emerald-600 font-bold block">
            จากทั้งหมด {stats.logCount} วันทำการ
          </span>
        </div>

        {/* Total Transfers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 text-left shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ยอดโอนสะสมรวม</span>
          <div className="text-lg font-black text-blue-600 leading-tight">
            ฿{stats.totalTransfers.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[9px] text-blue-500 font-bold block">
            โอนหักออกจากหน้าเก๊ะเก็บเงิน
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 text-left shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ยอดจ่ายเงิน/รายจ่ายสะสม</span>
          <div className="text-lg font-black text-rose-600 leading-tight">
            ฿{stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[9px] text-rose-500 font-bold block">
            ค่าใช้จ่ายเบ็ดเตล็ดหน้าสาขา
          </span>
        </div>

        {/* Total Net Discrepancies */}
        <div className={`p-4 rounded-xl border shadow-2xs space-y-1 text-left ${
          stats.totalDiscrepancy === 0 ? 'bg-emerald-50/30 border-emerald-200 text-emerald-850' :
          stats.totalDiscrepancy > 0 ? 'bg-rose-50/30 border-rose-200 text-rose-850' :
          'bg-amber-50/30 border-amber-200 text-amber-850'
        }`}>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ผลรวมผลต่างสะสมทั้งหมด</span>
          <div className="text-lg font-black leading-tight">
            {stats.totalDiscrepancy === 0 ? '฿0.00 (ลงตัว)' :
             stats.totalDiscrepancy > 0 ? `+฿${stats.totalDiscrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })} (เงินขาด)` :
             `-฿${Math.abs(stats.totalDiscrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })} (เงินเกิน)`}
          </div>
          <span className="text-[9px] font-semibold block">
            ผลรวมความคลาดเคลื่อนทางบัญชี
          </span>
        </div>
      </div>

      {/* FILTER & TABLE GRID MODULE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filtering bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3 justify-between select-none">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาวันที่, ผู้ลงบันทึก, หมายเหตุ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8.5 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="bg-white hover:bg-slate-550 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black cursor-pointer flex items-center gap-1 transition-all active:scale-95 text-slate-700"
              title="สลับการเรียงลำดับวันที่"
            >
              <span>📅 {sortOrder === 'desc' ? 'วันที่ล่าสุดก่อน' : 'วันที่เก่าสุดก่อน'}</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 leading-normal">
            <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-200" />
            <span>ช่องคอลัมน์สีเขียวแสดงผลการคำนวณอัตโนมัติประจำรายการ</span>
          </div>
        </div>

        {/* Interactive Data Table Grid */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Coins className="w-12 h-12 mx-auto text-slate-300 animate-pulse" />
              <p className="text-slate-400 font-black text-xs">ไม่พบข้อมูลบันทึกตามเงื่อนไขที่ระบุ</p>
              <button
                onClick={() => { setSearchTerm(''); setSortOrder('desc'); }}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                ล้างคำค้นหาและคืนค่าเดิม
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 text-[10.5px] uppercase font-bold select-none whitespace-nowrap">
                  <th className="px-4 py-3">วันที่ทำรายการ</th>
                  <th className="px-3 py-3 text-right">ยอดขาย 1</th>
                  <th className="px-3 py-3 text-right">ยอดขาย 2</th>
                  <th className="px-3 py-3 text-right">เตรียมทอน</th>
                  <th className="px-3 py-3 text-right">คนละครึ่ง</th>
                  <th className="px-3 py-3 text-right">กสิกรไทย</th>
                  <th className="px-3 py-3 text-right">ไทยพาณิชย์</th>
                  <th className="px-4 py-3 text-right bg-emerald-50/80 text-emerald-800 font-black border-x border-emerald-200/50">
                    ⚡ ยอดโอนรวม
                  </th>
                  <th className="px-4 py-3 text-right bg-rose-50/50 text-rose-800 font-black border-r border-rose-200/50">
                    ⚡ ยอดจ่ายรวม
                  </th>
                  <th className="px-3 py-3 text-right">ควรมีในเก๊ะ (สูตร)</th>
                  <th className="px-3 py-3 text-right">นับได้จริง</th>
                  <th className="px-4 py-3 text-right bg-slate-900 text-white font-black">
                    ผลต่างตรวจนับ
                  </th>
                  <th className="px-3 py-3">ผู้บันทึก</th>
                  <th className="px-4 py-3">หมายเหตุ</th>
                  <th className="px-4 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700 text-xs font-semibold">
                {filteredLogs.map(log => {
                  const transferTotal = log.transferKhonLaKhrueng + log.transferKBank + log.transferSCB;
                  const expectedCash = (log.sales1 + log.sales2) - log.reserve - transferTotal - log.expense;
                  
                  // สูตรปรับปรุงใหม่: ส่วนที่ 1 - ส่วนที่ 2
                  const part1 = log.sales1 + log.sales2;
                  const part2 = log.actualCashCounted + transferTotal - log.expense - log.reserve;
                  const discrepancy = part1 - part2;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatThaiDate(log.date)}</div>
                        <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">{log.date}</div>
                      </td>
                      
                      {/* Sales 1 */}
                      <td className="px-3 py-3.5 text-right font-mono text-slate-800">
                        {log.sales1 > 0 ? `฿${log.sales1.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </td>

                      {/* Sales 2 */}
                      <td className="px-3 py-3.5 text-right font-mono text-slate-800">
                        {log.sales2 > 0 ? `฿${log.sales2.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </td>

                      {/* Reserve */}
                      <td className="px-3 py-3.5 text-right font-mono text-amber-700">
                        {log.reserve > 0 ? `฿${log.reserve.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </td>

                      {/* Transfer channels */}
                      <td className="px-3 py-3.5 text-right font-mono text-slate-500 text-[11px]">
                        {log.transferKhonLaKhrueng > 0 ? `฿${log.transferKhonLaKhrueng.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-slate-500 text-[11px]">
                        {log.transferKBank > 0 ? `฿${log.transferKBank.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-slate-500 text-[11px]">
                        {log.transferSCB > 0 ? `฿${log.transferSCB.toLocaleString()}` : '-'}
                      </td>

                      {/* AUTO-CALCULATED TRANSFER TOTAL */}
                      <td className="px-4 py-3.5 text-right font-mono font-black bg-emerald-50/40 text-emerald-700 border-x border-emerald-100">
                        ฿{transferTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* AUTO-CALCULATED PAYMENTS / EXPENSES */}
                      <td className="px-4 py-3.5 text-right font-mono font-black bg-rose-50/20 text-rose-700 border-r border-rose-100/50">
                        ฿{log.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Expected Drawer cash */}
                      <td className="px-3 py-3.5 text-right font-mono text-slate-900 bg-slate-50/50">
                        ฿{expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Actual cash counted */}
                      <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-800">
                        ฿{log.actualCashCounted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* DISCREPANCY */}
                      <td className={`px-4 py-3.5 text-right font-mono font-black text-xs ${
                        discrepancy === 0 ? 'bg-emerald-600 text-white' :
                        discrepancy > 0 ? 'bg-rose-600 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        {discrepancy === 0 ? '฿0.00 (พอดี)' :
                         discrepancy > 0 ? `+฿${discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })} (ขาด)` :
                         `-฿${Math.abs(discrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })} (เกิน)`}
                      </td>

                      {/* Creator */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 font-bold">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] text-slate-500 uppercase font-black">
                            {log.creator.charAt(0)}
                          </div>
                          <span>{log.creator}</span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="px-4 py-3.5 max-w-xs text-slate-400 font-medium text-[11px] truncate" title={log.note || ''}>
                        {log.note || <span className="italic text-slate-300">ไม่มีหมายเหตุ</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(log)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-slate-600 cursor-pointer transition-all active:scale-90"
                            title="แก้ไขข้อมูลรายการ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-750 text-rose-600 rounded-lg cursor-pointer transition-all active:scale-90"
                            title="ลบบันทึกข้อมูลประจำวันนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DETAILED EQUATIONS EXPLANATION CARD (HELP PANEL) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3 select-none">
        <h4 className="text-xs font-black tracking-widest text-blue-300 uppercase flex items-center gap-1.5">
          <Calculator className="w-4.5 h-4.5" />
          <span>โครงสร้างและหลักเกณฑ์วิเคราะห์ยอดเงินตรวจนับ (Calculation Explanations)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-300 font-medium">
          <div className="space-y-1 bg-black/20 p-3 rounded-xl border border-white/5">
            <span className="font-extrabold text-white block">1. ยอดเตรียมเงินทอน (สำรองตั้งต้น)</span>
            <p className="text-[11px] text-slate-400">
              ยอดเงินสำหรับเป็นทอนตั้งต้นหน้าร้านในแต่ละเช้า การคิดยอดคงเหลือสุทธิและผลต่างสะสมจะถูกหักออกจากยอดขายจริงเพื่อไม่ให้ไปกระทบส่วนแบ่งรายรับ
            </p>
          </div>
          <div className="space-y-1 bg-black/20 p-3 rounded-xl border border-white/5">
            <span className="font-extrabold text-white block">2. ยอดโอนรวมและยอดจ่ายรวม (คำนวณอัตโนมัติ)</span>
            <p className="text-[11px] text-slate-400">
              <strong>ยอดโอนรวม:</strong> สรุปผลต่างช่องทางโอนดิจิทัล (คนละครึ่ง + กสิกรไทย + ไทยพาณิชย์) <br />
              <strong>ยอดจ่ายรวม:</strong> รายจ่ายเบ็ดเตล็ดหน้าสาขาสำหรับซื้อสิ่งของหรืองบตกแต่งหน้าร้าน
            </p>
          </div>
          <div className="space-y-1 bg-black/20 p-3 rounded-xl border border-white/5">
            <span className="font-extrabold text-white block">3. สูตรสรุปผลต่างขาด/เกินกระทำการ</span>
            <p className="text-[11px] text-slate-400 font-mono text-emerald-400">
              สูตรร้านใหม่: ส่วนที่ 1 (ยอดขายที่ 1 + ยอดขายที่ 2) - ส่วนที่ 2 (ยอดนับได้จริง + ยอดโอนรวม - รายจ่ายวันนี้ - ยอดเตรียมทอน)
            </p>
          </div>
        </div>
      </div>

      {/* ADD / EDIT DIALOG OVERLAY */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden text-left font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>{editingLogId ? `แก้ไขสมุดบันทึกรายวัน [ID: ${editingLogId}]` : 'เพิ่มข้อมูลยอดเงินสดรายวันใหม่'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs font-semibold text-slate-700">
                
                {/* 1. Date and Cashier */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10.5px] text-slate-500 font-bold uppercase">วันที่ทำรายการ</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10.5px] text-slate-500 font-bold uppercase">ผู้ลงบันทึก/ผู้รับเงิน</label>
                    <select
                      value={formCreator}
                      onChange={(e) => setFormCreator(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Sales amounts & Cash Reserve */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-wide block border-b border-slate-200/50 pb-1">
                    💰 ส่วนยอดรายรับเงินสดหลักและรอง
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-emerald-700 font-extrabold">ยอดขายที่ 1 (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="any"
                        value={formSales1}
                        onChange={(e) => setFormSales1(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-blue-700 font-extrabold">ยอดขายที่ 2 (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="any"
                        value={formSales2}
                        onChange={(e) => setFormSales2(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-amber-700 font-extrabold">เตรียมทอน (สำรอง) (฿)</label>
                      <input
                        type="number"
                        placeholder="2000"
                        min="0"
                        step="any"
                        value={formReserve}
                        onChange={(e) => setFormReserve(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Bank transfer details */}
                <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-200/50 space-y-3">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-1">
                    <span className="text-[10px] text-blue-800 font-black uppercase tracking-wide">
                      💳 ส่วนยอดชำระช่องทางโอนดิจิทัล (หักออกจากเก๊ะ)
                    </span>
                    <span className="text-[9.5px] text-blue-600 font-bold font-mono">
                      รวมสะสม: ฿{computedTransferTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-600 font-bold">โอนคนละครึ่ง (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="any"
                        value={formKhonLaKhrueng}
                        onChange={(e) => setFormKhonLaKhrueng(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-600 font-bold">โอนกสิกรไทย (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="any"
                        value={formKBank}
                        onChange={(e) => setFormKBank(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-600 font-bold">โอนไทยพาณิชย์ (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="any"
                        value={formSCB}
                        onChange={(e) => setFormSCB(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Expenses / Payout and Actual cash */}
                <div className="bg-rose-50/15 p-4 rounded-xl border border-rose-200 space-y-3">
                  <span className="text-[10px] text-rose-850 font-black uppercase tracking-wide block border-b border-rose-100 pb-1">
                    💸 รายจ่ายหน้าร้าน & ยอดตรวจนับจริง
                  </span>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-rose-700 font-extrabold">รายจ่ายวันนี้ (ยอดจ่ายเงิน) (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="any"
                        value={formExpense}
                        onChange={(e) => setFormExpense(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-700 font-extrabold">ยอดนับได้จริงในเก๊ะ (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="any"
                        value={formActualCash}
                        onChange={(e) => setFormActualCash(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none font-mono focus:ring-1 focus:ring-slate-800"
                      />
                    </div>
                  </div>
                </div>

                 {/* REALTIME CALCULATION PREVIEW */}
                 {(formSales1 !== '' || formSales2 !== '' || formActualCash !== '') && (
                   <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 select-none border border-slate-850">
                     <div className="text-[10px] text-blue-300 font-black tracking-widest uppercase border-b border-slate-850 pb-1 flex justify-between items-center">
                       <span>📊 ตัวอย่างการกระทบยอดคำนวณเรียลไทม์</span>
                       <span>สูตรร้านอาหารอภิวัฒน์เครื่องครัว</span>
                     </div>
                     <div className="grid grid-cols-2 gap-3.5 text-[11px]">
                       <div>
                         <span className="text-slate-400 block text-[9.5px]">ส่วนที่ 1 (ยอดขายรวม)</span>
                         <span className="font-mono text-xs font-black text-white block">
                           ฿{(sales1Num + sales2Num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                         <span className="block text-[8.5px] text-slate-400 mt-0.5 leading-normal">
                           สูตร: (ยอดขายที่ 1 + ยอดขายที่ 2)
                         </span>
                       </div>
                       <div>
                         <span className="text-slate-400 block text-[9.5px]">ส่วนที่ 2 (ยอดจริงสุทธิ)</span>
                         <span className="font-mono text-xs font-black text-white block">
                           ฿{(actualCashNum + computedTransferTotal - expenseNum - reserveNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                         <span className="block text-[8.5px] text-slate-400 mt-0.5 leading-normal font-mono text-[8px]">
                           สูตร: นับจริง + โอนรวม - รายจ่าย - ยอดเตรียมทอน
                         </span>
                       </div>
                     </div>
                     <div className="border-t border-white/5 pt-1.5 flex justify-between items-center">
                       <span className="text-slate-400 text-[10px]">ผลต่างตรวจนับ (ส่วนที่ 1 - ส่วนที่ 2):</span>
                       <span className={`font-mono text-xs font-black block ${
                         computedDiscrepancy === 0 ? 'text-emerald-400' :
                         computedDiscrepancy > 0 ? 'text-rose-400' :
                         'text-amber-400'
                       }`}>
                         {computedDiscrepancy === 0 ? '฿0.00 (พอดี)' :
                          computedDiscrepancy > 0 ? `+฿${computedDiscrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })} (เงินขาด)` :
                          `-฿${Math.abs(computedDiscrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })} (เงินเกิน)`}
                       </span>
                     </div>
                   </div>
                 )}

                {/* Note */}
                <div className="space-y-1">
                  <label className="block text-[10.5px] text-slate-500 font-bold uppercase">บันทึกเพิ่มเติม / หมายเหตุ</label>
                  <textarea
                    placeholder="ใส่ข้อมูลความคลาดเคลื่อน ข้อมูลบิลตกหล่น หรือค่าขนส่งพิเศษ..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none resize-none font-sans"
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px] select-none">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer font-black shadow-md shadow-emerald-500/10"
                  >
                    {editingLogId ? 'บันทึกแก้ไขข้อมูล' : 'บันทึกข้อมูลลงสมุด'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM DIALOG OVERLAY */}
      <AnimatePresence>
        {deleteConfirmId !== null && (() => {
          const targetLog = logs.find(l => l.id === deleteConfirmId);
          if (!targetLog) return null;
          return (
            <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-700"
              >
                <div className="p-5 border-b border-rose-100 flex items-center gap-3 bg-rose-50/70 select-none">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950">ยืนยันลบบันทึกเงินสดรายวัน</h3>
                    <p className="text-[10px] text-rose-600 font-bold">ข้อมูลจะไม่สามารถกู้คืนกลับมาได้อีกครั้ง</p>
                  </div>
                </div>

                <div className="p-5 space-y-3 font-semibold text-xs leading-relaxed text-slate-700">
                  <p>
                    คุณแน่ใจหรือไม่ที่จะลบบันทึกเงินสดประจำวันที่ <strong className="text-slate-950 font-extrabold">{formatThaiDate(targetLog.date)}</strong>?
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1 font-mono text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>ยอดขายที่ 1:</span>
                      <strong className="text-slate-950">฿{targetLog.sales1.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ยอดขายที่ 2:</span>
                      <strong className="text-slate-950">฿{targetLog.sales2.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ผู้รับบันทึก:</span>
                      <strong className="text-slate-950">{targetLog.creator}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px] select-none">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(null)}
                    className="py-2 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDelete(targetLog.id)}
                    className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer font-black"
                  >
                    ยืนยันลบ
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
