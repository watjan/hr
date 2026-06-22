import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit2, 
  CalendarDays, 
  Coins, 
  Search, 
  Filter, 
  DollarSign, 
  Sparkles, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  User, 
  Check, 
  X, 
  TrendingDown, 
  Target, 
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Cloud,
  Loader2
} from 'lucide-react';
import { DailySale, EmployeeSalary } from '../types';
import { saveKeyToCloud, fetchKeyFromCloud } from '../lib/firebaseSync';

const deduplicateSalesByDate = (list: DailySale[]): DailySale[] => {
  const seen = new Set<string>();
  const uniqueList: DailySale[] = [];
  // Sort from newest to oldest date
  const sortedList = [...list].sort((a, b) => b.date.localeCompare(a.date));
  for (const item of sortedList) {
    if (!seen.has(item.date)) {
      seen.add(item.date);
      uniqueList.push(item);
    }
  }
  return uniqueList;
};

interface SalesViewProps {
  activeSubTab: 'daily' | 'monthly' | 'yearly';
  employees: EmployeeSalary[];
}

const DEFAULT_SALES: DailySale[] = [
  { id: 'S-001', date: '2026-06-19', amount: 48500, orderCount: 22, paymentMethod: 'โอนเงินดิจิทัล', note: 'ยอดขายหน้าร้าน + ออเดอร์จัดส่งเตาแก๊สชุดใหญ่', creator: 'สมชาย รักดี' },
  { id: 'S-002', date: '2026-06-18', amount: 32400, orderCount: 15, paymentMethod: 'โอนเงินดิจิทัล', note: 'ขายกระทะนอนสติ๊ก Zebra 40 ใบ ส่งฝ่ายจัดเตรียม', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-003', date: '2026-06-17', amount: 56900, orderCount: 28, paymentMethod: 'บัตรเครดิต', note: 'คุณวรรณาเหมาชุดจานชามเมลามีนเข้าคาเฟ่ใหม่', creator: 'สมชาย รักดี' },
  { id: 'S-004', date: '2026-06-16', amount: 18200, orderCount: 10, paymentMethod: 'เงินสด', note: 'ยอดชำระเบ็ดเตล็ดกล่องอาหารพลาสติก', creator: 'วิชัย ชาญชัย' },
  { id: 'S-005', date: '2026-06-15', amount: 74100, orderCount: 35, paymentMethod: 'โอนเงินดิจิทัล', note: 'หม้อชาบูสเตนเลสไฟฟ้า 20 ชุด ขนส่งทางเรือ', creator: 'สมชาย รักดี' },
  { id: 'S-006', date: '2026-06-14', amount: 23000, orderCount: 12, paymentMethod: 'โอนเงินดิจิทัล', note: 'ชุดมีดทำครัวสเตนเลสสตีลเยอรมัน 12 กล่อง', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-010', date: '2026-04-20', amount: 92000, orderCount: 42, paymentMethod: 'โอนเงินดิจิทัล', note: 'งานตกแต่งห้องครัวคอนโดพัทยา เซ็ตพรีเมียม', creator: 'วรรณวิสา วงศ์วรรณ' },
];

export default function SalesView({ activeSubTab, employees }: SalesViewProps) {
  // Persistence state
  const [sales, setSales] = useState<DailySale[]>(() => {
    const saved = localStorage.getItem('sapphire_daily_sales');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return deduplicateSalesByDate(parsed);
        }
      } catch (e) {
        return deduplicateSalesByDate(DEFAULT_SALES);
      }
    }
    return deduplicateSalesByDate(DEFAULT_SALES);
  });

  // Annual sales goal state
  const [salesTarget, setSalesTarget] = useState<number>(() => {
    const saved = localStorage.getItem('sapphire_sales_annual_target');
    return saved ? Number(saved) : 1200000; // default 1.2M Baht
  });
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [targetInputVal, setTargetInputVal] = useState(salesTarget.toString());

  // Cloud status state
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Load current sales data from Firebase Firestore automatically on mount
  useEffect(() => {
    const fetchLatestSales = async () => {
      setIsLoadingCloud(true);
      setCloudStatus('syncing');
      try {
        const cloudSales = await fetchKeyFromCloud('daily_sales');
        if (cloudSales && Array.isArray(cloudSales)) {
          const uniqueSales = deduplicateSalesByDate(cloudSales);
          setSales(uniqueSales);
          localStorage.setItem('sapphire_daily_sales', JSON.stringify(uniqueSales));
        }
        
        const cloudTarget = await fetchKeyFromCloud('sales_target');
        if (cloudTarget) {
          const num = Number(cloudTarget);
          if (!isNaN(num) && num > 0) {
            setSalesTarget(num);
            setTargetInputVal(num.toString());
            localStorage.setItem('sapphire_sales_annual_target', num.toString());
          }
        }
        setCloudStatus('success');
      } catch (err) {
        console.error('[Firebase] Failed to fetch sales data:', err);
        setCloudStatus('error');
      } finally {
        setIsLoadingCloud(false);
      }
    };
    fetchLatestSales();
  }, []);

  // Listen for storage change events to trigger UI update (especially after dynamic cloud restore)
  useEffect(() => {
    const handleSyncReset = () => {
      const savedSales = localStorage.getItem('sapphire_daily_sales');
      if (savedSales) {
        try {
          const parsed = JSON.parse(savedSales);
          if (Array.isArray(parsed)) {
            setSales(deduplicateSalesByDate(parsed));
          }
        } catch (e) {}
      }
      const savedTarget = localStorage.getItem('sapphire_sales_annual_target');
      if (savedTarget) {
        setSalesTarget(Number(savedTarget));
        setTargetInputVal(savedTarget);
      }
    };
    window.addEventListener('sapphire_storage_updated', handleSyncReset);
    return () => window.removeEventListener('sapphire_storage_updated', handleSyncReset);
  }, []);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | 'โอนเงินดิจิทัล' | 'เงินสด' | 'บัตรเครดิต' | 'อื่นๆ'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all'); // "YYYY-MM"

  // Pagination State for Daily Sales
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMethod, filterMonth]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<DailySale | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formOrderCount, setFormOrderCount] = useState('');
  const [formMethod, setFormMethod] = useState<'โอนเงินดิจิทัล' | 'เงินสด' | 'บัตรเครดิต' | 'อื่นๆ'>('โอนเงินดิจิทัล');
  const [formNote, setFormNote] = useState('');
  const [formCreator, setFormCreator] = useState('');

  // Tooltip details for hover charts
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: number } | null>(null);

  // Synchronize storage and cloud
  const saveToStorage = async (updatedList: DailySale[]) => {
    const uniqueList = deduplicateSalesByDate(updatedList);
    setSales(uniqueList);
    localStorage.setItem('sapphire_daily_sales', JSON.stringify(uniqueList));
    
    setCloudStatus('syncing');
    try {
      await saveKeyToCloud('daily_sales', updatedList);
      setCloudStatus('success');
    } catch (err) {
      console.error('[Firebase] Failed to auto-save sales:', err);
      setCloudStatus('error');
    }
  };

  const handleSaveTarget = async () => {
    const num = Number(targetInputVal);
    if (!isNaN(num) && num > 0) {
      setSalesTarget(num);
      localStorage.setItem('sapphire_sales_annual_target', num.toString());
      setShowTargetInput(false);
      
      setCloudStatus('syncing');
      try {
        await saveKeyToCloud('sales_target', num);
        setCloudStatus('success');
      } catch (err) {
        console.error('[Firebase] Failed to save target:', err);
        setCloudStatus('error');
      }
    }
  };

  // CRUD Handlers
  const openAddModal = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAmount('');
    setFormOrderCount('');
    setFormMethod('โอนเงินดิจิทัล');
    setFormNote('');
    setFormCreator(employees[0]?.name || 'สมชาย รักดี');
    setIsAddModalOpen(true);
  };

  const openEditModal = (sale: DailySale) => {
    setEditingSale(sale);
    setFormDate(sale.date);
    setFormAmount(sale.amount.toString());
    setFormOrderCount(sale.orderCount.toString());
    setFormMethod(sale.paymentMethod);
    setFormNote(sale.note || '');
    setFormCreator(sale.creator || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    const orderNum = parseInt(formOrderCount, 10);

    if (isNaN(amountNum) || amountNum <= 0) {
      alert("กรุณากรอกยอดขายให้ถูกต้อง (มากกว่า 0)");
      return;
    }
    if (isNaN(orderNum) || orderNum < 0) {
      alert("กรุณากรอกจำนวนออเดอร์ให้ถูกต้อง");
      return;
    }

    // Check duplicate dates
    const dateExists = sales.some(s => 
      s.date === formDate && (!editingSale || s.id !== editingSale.id)
    );
    if (dateExists) {
      alert(`❌ พบข้อมูลซ้ำซ้อน: วันที่ ${formatThaiDate(formDate)} มีบันทึกยอดขายเพิ่มในระบบแล้ว ห้ามป้อนข้อมูลซ้ำวันเดียวกัน`);
      return;
    }

    if (editingSale) {
      // Edit
      const updated = sales.map(s => s.id === editingSale.id ? {
        ...s,
        date: formDate,
        amount: amountNum,
        orderCount: orderNum,
        paymentMethod: formMethod,
        note: formNote,
        creator: formCreator
      } : s);
      saveToStorage(updated);
      setEditingSale(null);
    } else {
      // Add
      const newSale: DailySale = {
        id: `S-${Date.now().toString().slice(-6)}`,
        date: formDate,
        amount: amountNum,
        orderCount: orderNum,
        paymentMethod: formMethod,
        note: formNote,
        creator: formCreator || 'ระบบอัตโนมัติ'
      };
      // Insert in sorted order (newest date first)
      const updated = [newSale, ...sales].sort((a,b) => b.date.localeCompare(a.date));
      saveToStorage(updated);
      setIsAddModalOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = (id: string) => {
    const updated = sales.filter(s => s.id !== id);
    saveToStorage(updated);
    setDeleteConfirmId(null);
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
    const month = getThaiMonthName(d.getMonth()).substring(0, 6);
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  // Filter lists & sort descending (Newest to Oldest)
  const filteredSales = sales
    .filter(sale => {
      const matchesSearch = 
        sale.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.creator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.date.includes(searchTerm);

      const matchesMethod = filterMethod === 'all' || sale.paymentMethod === filterMethod;
      
      const matchesMonth = filterMonth === 'all' || sale.date.startsWith(filterMonth);

      return matchesSearch && matchesMethod && matchesMonth;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const paginatedSales = filteredSales.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // Calculate stats for filtered results
  const totalAmount = filteredSales.reduce((acc, s) => acc + s.amount, 0);
  const totalOrders = filteredSales.reduce((acc, s) => acc + s.orderCount, 0);
  const averageTicket = totalOrders > 0 ? totalAmount / totalOrders : 0;

  // Aggregate monthly lists
  const getMonthlyAggregate = () => {
    const monthlyMap: { [key: string]: { amount: number; orderCount: number; records: number } } = {};
    sales.forEach(s => {
      const monthKey = s.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { amount: 0, orderCount: 0, records: 0 };
      }
      monthlyMap[monthKey].amount += s.amount;
      monthlyMap[monthKey].orderCount += s.orderCount;
      monthlyMap[monthKey].records += 1;
    });

    return Object.keys(monthlyMap).sort((a,b) => b.localeCompare(a)).map(month => {
      const year = parseInt(month.split('-')[0], 10) + 543;
      const monthIdx = parseInt(month.split('-')[1], 10) - 1;
      const label = `${getThaiMonthName(monthIdx)} ${year}`;
      const data = monthlyMap[month];
      return {
        key: month,
        label,
        amount: data.amount,
        orderCount: data.orderCount,
        records: data.records,
        avgTicket: data.orderCount > 0 ? data.amount / data.orderCount : 0
      };
    });
  };

  const monthlyAggregate = getMonthlyAggregate();

  // Aggregate yearly lists
  const getYearlyAggregate = () => {
    const yearlyMap: { [key: string]: { amount: number; orderCount: number; records: number } } = {};
    sales.forEach(s => {
      const yearKey = s.date.substring(0, 4); // YYYY
      if (!yearlyMap[yearKey]) {
        yearlyMap[yearKey] = { amount: 0, orderCount: 0, records: 0 };
      }
      yearlyMap[yearKey].amount += s.amount;
      yearlyMap[yearKey].orderCount += s.orderCount;
      yearlyMap[yearKey].records += 1;
    });

    return Object.keys(yearlyMap).sort((a,b) => b.localeCompare(a)).map(year => {
      const label = `ปี พ.ศ. ${parseInt(year, 10) + 543}`;
      const data = yearlyMap[year];
      return {
        key: year,
        label,
        amount: data.amount,
        orderCount: data.orderCount,
        records: data.records,
        avgTicket: data.orderCount > 0 ? data.amount / data.orderCount : 0
      };
    });
  };

  const yearlyAggregate = getYearlyAggregate();

  // Distinct months in system for selector
  const distinctMonths: string[] = Array.from(new Set<string>(sales.map(s => s.date.substring(0, 7)))).sort((a: string, b: string) => b.localeCompare(a));

  return (
    <div className="space-y-6">

      {/* Cloud Sync Indicator Slat */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 px-4.5 py-3 rounded-2xl select-none text-xs">
        <div className="flex items-center gap-2">
          <Cloud className={`w-4 h-4 text-blue-500 ${cloudStatus === 'syncing' ? 'animate-bounce' : ''}`} />
          <div className="space-y-0.5 text-left">
            <span className="font-extrabold text-slate-800 block">สถานะฐานข้อมูลคลาวด์สหพันธ์ (Firebase Cloud Sync)</span>
            <p className="text-[10px] text-slate-500 font-medium leading-none">เชื่อมต่อกับ Firestore เพื่อรวบรวมและสำรองข้อมูลแบบ Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-[10px]">
          {cloudStatus === 'syncing' && (
            <>
              <Loader2 className="w-3 h-3 text-blue-500 animate-spin animate-infinite" />
              <span className="text-blue-600 font-extrabold">กำลังซิงก์ข้อมูล...</span>
            </>
          )}
          {cloudStatus === 'success' && (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-extrabold">ซิงก์สำเร็จ (Cloud Updated)</span>
            </>
          )}
          {cloudStatus === 'error' && (
            <>
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-600 font-extrabold">คลาวด์ออฟไลน์ (Local-only)</span>
            </>
          )}
          {cloudStatus === 'idle' && (
            <>
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-500 font-extrabold">แสตนด์บาย (Connected)</span>
            </>
          )}
        </div>
      </div>

      {/* HEADER STATS SLAT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">ยอดขายรวมทั้งหมด</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-slate-900">฿{totalAmount.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-500">บาท</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block flex items-center gap-1">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>อิงข้อมูล {filteredSales.length} วันทำการ</span>
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Coins className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">จำนวนออเดอร์สะสม</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-slate-900">{totalOrders.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-500">บิล</span>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold block flex items-center gap-1">
              <ShoppingCart className="w-3 h-3 shrink-0" />
              <span>เฉลี่ย {(filteredSales.length > 0 ? (totalOrders / filteredSales.length).toFixed(1) : 0)} บิล/วัน</span>
            </span>
          </div>
          <div className="w-11 h-11 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <BarChart3 className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">ราคาเฉลี่ยต่อออเดอร์</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-slate-900">฿{Math.round(averageTicket).toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-500">บาท</span>
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold block flex items-center gap-1">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>ศักยภาพการสั่งซื้อลูกค้าร้านครัว</span>
            </span>
          </div>
          <div className="w-11 h-11 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="space-y-1 w-full">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">เป้าหมายรายปี</span>
              <button 
                onClick={() => {
                  setTargetInputVal(salesTarget.toString());
                  setShowTargetInput(!showTargetInput);
                }} 
                className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                ปรับเปลี่ยน目標
              </button>
            </div>
            
            {showTargetInput ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={targetInputVal}
                  onChange={(e) => setTargetInputVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-mono focus:outline-none"
                  placeholder="เงินเป้าหมาย"
                />
                <button
                  type="button"
                  onClick={handleSaveTarget}
                  className="bg-purple-600 text-white rounded px-2 py-1 text-[10px] font-bold cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg md:text-xl font-black text-purple-950">
                  {Math.round((sales.reduce((sum, s) => sum + s.amount, 0) / salesTarget) * 100)}%
                </span>
                <span className="text-[9.5px] font-medium text-slate-500">
                  จากเป้า ฿{(salesTarget/1000000).toFixed(2)}M
                </span>
              </div>
            )}

            {/* target bar progress indicator */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1 select-none">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((sales.reduce((sum, s) => sum + s.amount, 0) / salesTarget) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1. NEW DAILY SALES SLAT (ยอดวัน) */}
      {activeSubTab === 'daily' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden animate-fade-in">
          
          {/* Filtering and Actions Grid bar */}
          <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search note or creator */}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตามบันทึก, ผู้เพิ่ม, วันที่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-105"
                />
              </div>

              {/* Filter payments */}
              <div className="relative">
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-105"
                >
                  <option value="all">ช่องทางจ่ายเงินทั้งหมด</option>
                  <option value="โอนเงินดิจิทัล">โอนเงินดิจิทัล</option>
                  <option value="เงินสด">เงินสด</option>
                  <option value="บัตรเครดิต">บัตรเครดิต</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              {/* Filter months */}
              <div className="relative">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-705 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-105"
                >
                  <option value="all">ปี/เดือน ทั้งหมด</option>
                  {distinctMonths.map(m => {
                    const year = parseInt(m.substring(0, 4), 10) + 543;
                    const monthName = getThaiMonthName(parseInt(m.substring(5,7), 10) - 1);
                    return (
                      <option key={m} value={m}>{monthName} {year}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Slat Primary trigger button */}
            <button
              onClick={openAddModal}
              className="w-full md:w-auto py-2 px-4.5 bg-blue-600 hover:bg-blue-750 font-bold text-xs text-white rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มยอดขายรายวัน</span>
            </button>
          </div>

          {/* Records list table view */}
          <div className="overflow-x-auto">
            {filteredSales.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-705 text-slate-800">ไม่พบบันทึกข้อมูลยอดขาย</h4>
                  <p className="text-xs text-slate-405 text-slate-450 leading-relaxed font-semibold">กรุณากรอกระบุข้อมูลใหม่ หรือเปลี่ยนตัวเลือกตัวคัดกรองขวาด้านบน</p>
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold select-none whitespace-nowrap border-b border-slate-200">
                    <th className="px-6 py-3.5">วันที่ขาย</th>
                    <th className="px-6 py-3.5">ยอดบิลทั้งหมด</th>
                    <th className="px-6 py-3.5 text-right">จำนวนออเดอร์</th>
                    <th className="px-6 py-3.5 text-right">ยอดขายสุทธิ (บาท)</th>
                    <th className="px-6 py-3.5">ช่องทางชำระเงิน</th>
                    <th className="px-6 py-3.5">บันทึกเพิ่มเติม / รายละเอียด</th>
                    <th className="px-6 py-3.5">ผู้ลงบันทึก</th>
                    <th className="px-6 py-3.5 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700 text-xs font-semibold">
                  {paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>{formatThaiDate(sale.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {sale.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold">
                        {sale.orderCount.toLocaleString()} บิล
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-black text-slate-950">
                        ฿{sale.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          sale.paymentMethod === 'โอนเงินดิจิทัล'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : sale.paymentMethod === 'เงินสด'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : sale.paymentMethod === 'บัตรเครดิต'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500 font-medium">
                        {sale.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-bold">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{sale.creator || 'พนักงานจำลอง'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(sale)}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 hover:text-blue-600 text-slate-650 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="แก้ไขบันทึกยอดขายชิ้นนี้"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="ลบบันทึกออกชิ้นนี้"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination controls with 10 rows limit */}
          {filteredSales.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
              <div className="text-xs text-slate-550 font-bold">
                แสดงผล <span className="font-extrabold text-slate-900">{Math.min((activePage - 1) * itemsPerPage + 1, filteredSales.length)}</span> ถึง{' '}
                <span className="font-extrabold text-slate-900">{Math.min(activePage * itemsPerPage, filteredSales.length)}</span> จากทั้งหมด{' '}
                <span className="font-extrabold text-slate-900">{filteredSales.length}</span> รายการ
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={activePage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-black transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    ก่อนหน้า
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          activePage === pageNum
                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                            : 'border border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-black transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    ถัดไป
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. SALES MONTHLY ACCUMULATION (ยอดรวมรายเดือน) */}
      {activeSubTab === 'monthly' && (
        <div className="space-y-6">
          
          {/* Custom interactive dashboard charts built with SVG wrapper panel */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 animate-fade-in select-none">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>กราฟแท่งเปรียบเทียบ ยอดขายสะสมรายเดือน (Monthly Revenue Analytics)</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">วิเคราะห์จากยอดขายบริษัทจำลอง อภิวัฒน์เครื่องครัว</p>
              </div>

              {/* Tooltip active feedback hover badge */}
              <AnimatePresence>
                {hoveredPoint && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-mono flex items-center gap-1.5"
                  >
                    <span className="font-bold text-emerald-400">{hoveredPoint.label}:</span>
                    <span className="font-extrabold text-white">฿{hoveredPoint.value.toLocaleString()}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Custom Responsive SVG Charting component */}
            <div className="w-full overflow-x-auto scrollbar-thin py-2">
              <div className="min-w-[500px] h-[220px] relative">
                {monthlyAggregate.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold">
                    ไม่มีข้อมูลแสดงสรุปกราฟ
                  </div>
                ) : (
                  <svg className="w-full h-full" viewBox="0 0 600 220">
                    {/* Horizontal helper gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const yPos = 20 + ratio * 150;
                      return (
                        <g key={idx}>
                          <line x1="45" y1={yPos} x2="570" y2={yPos} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
                        </g>
                      );
                    })}

                    {/* Chart bars */}
                    {(() => {
                      const maxAmount = Math.max(...monthlyAggregate.map(m => m.amount), 10000);
                      const barWidth = 40;
                      const spacing = (520 - barWidth) / Math.max(1, monthlyAggregate.length - 1);
                      
                      return monthlyAggregate.map((m, idx) => {
                        const amountRatio = m.amount / maxAmount;
                        const height = Math.max(10, amountRatio * 150);
                        const x = 50 + idx * spacing;
                        const y = 170 - height;

                        return (
                          <g key={m.key} className="group">
                            {/* Interactive Hover rectangle */}
                            <rect
                              x={x - 10}
                              y="10"
                              width={barWidth + 20}
                              height="170"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPoint({ label: m.label, value: m.amount })}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />

                            {/* Main colored Bar */}
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={height}
                              rx="6"
                              fill="url(#blueGrad)"
                              className="transition-all duration-300 hover:opacity-85 outline-none"
                            />

                            {/* Value label on top of bar */}
                            <text
                              x={x + barWidth / 2}
                              y={y - 8}
                              textAnchor="middle"
                              className="text-[9px] font-mono font-bold fill-slate-700 hidden group-hover:block"
                            >
                              ฿{(m.amount / 1000).toFixed(0)}k
                            </text>

                            {/* Bottom Label card */}
                            <text
                              x={x + barWidth / 2}
                              y="190"
                              textAnchor="middle"
                              className="text-[9px] font-semibold fill-slate-500 font-sans"
                            >
                              {m.label.split(' ')[0]}
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y="202"
                              textAnchor="middle"
                              className="text-[7.5px] font-mono font-bold fill-indigo-400"
                            >
                              {m.label.split(' ')[1]}
                            </text>
                          </g>
                        );
                      });
                    })()}

                    {/* Left vertical border lines */}
                    <line x1="45" y1="20" x2="45" y2="170" stroke="#cbd5e1" strokeWidth="1" />
                    {/* Bottom axis line */}
                    <line x1="45" y1="170" x2="570" y2="170" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Table display */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-150">
              <span className="text-xs font-black text-slate-810 text-slate-800">ตารางแอนาไลติกส์ ยอดรายรับรวมรายเดือน</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold select-none whitespace-nowrap border-b border-slate-200">
                    <th className="px-6 py-3.5">เดือน / ปี (พ.ศ.)</th>
                    <th className="px-6 py-3.5 text-right">จำนวนวันที่มีออเดอร์</th>
                    <th className="px-6 py-3.5 text-right">จำนวนสลิปออเดอร์บิล</th>
                    <th className="px-6 py-3.5 text-right">ยอดออเดอร์ตั๋วเฉลี่ย</th>
                    <th className="px-6 py-3.5 text-right">ยอดรายได้สุทธิประจำเดือน</th>
                    <th className="px-6 py-3.5">สถานภาพการเติบโต (MoM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700 text-xs font-semibold">
                  {monthlyAggregate.map((m, idx) => {
                    // Calculate MoM percent
                    let momPercent = 0;
                    const nextIndex = idx + 1; // monthlyAggregate is sorted descendingly, so index+1 is previous month
                    if (nextIndex < monthlyAggregate.length) {
                      const prevAmt = monthlyAggregate[nextIndex].amount;
                      if (prevAmt > 0) {
                        momPercent = ((m.amount - prevAmt) / prevAmt) * 100;
                      }
                    }

                    return (
                      <tr key={m.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-905">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span>{m.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          {m.records} วันทำการ
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          {m.orderCount.toLocaleString()} ออเดอร์
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          ฿{Math.round(m.avgTicket).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                          ฿{m.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {nextIndex < monthlyAggregate.length ? (
                            momPercent >= 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-extrabold flex items-center gap-1.5 w-max">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>+{momPercent.toFixed(1)}%</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-extrabold flex items-center gap-1.5 w-max">
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span>{momPercent.toFixed(1)}%</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 font-medium">เกณฑ์ตั้งต้น (Baseline)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SALES YEARLY SUMMARY (ยอดรวมรายปี) */}
      {activeSubTab === 'yearly' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in select-none">
          
          {/* Left panel: Total annual aggregate lists */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
              <div className="p-4.5 bg-slate-50 border-b border-slate-150">
                <span className="text-xs font-black text-slate-705 text-slate-800">แจงสถิติรายงานผลสรุปรายปี (Annual Sales Ledger)</span>
              </div>

              <div className="divide-y divide-slate-150">
                {yearlyAggregate.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    ไม่พบสถิติยอดรายปี
                  </div>
                ) : (
                  yearlyAggregate.map(y => {
                    const progressVal = Math.min(100, Math.round((y.amount / salesTarget) * 100));
                    return (
                      <div key={y.key} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black text-slate-900">{y.label}</h4>
                            <p className="text-[10px] text-slate-400 font-bold">บันทึกชุดโครงสร้าง {y.records} เรคคอร์ดตลอดปีปฏิทิน</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-blue-650 font-mono block">฿{y.amount.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-550 block font-semibold">ออเดอร์จำนวน {y.orderCount.toLocaleString()} บิล</span>
                          </div>
                        </div>

                        {/* progress target for each year based on high-level target */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-purple-600">อัตราความสำเร็จตามเป้ายอดขาย:</span>
                            <span className="font-mono text-slate-700">{progressVal}% ของยอดขาย ฿{salesTarget.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${
                                progressVal >= 100 
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                                  : 'bg-gradient-to-r from-purple-500 to-indigo-650'
                              }`}
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Target visual tracking with cards and tips */}
          <div className="space-y-6">
            <div className="bg-purple-950 text-white rounded-2xl p-5 border border-purple-900 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-3 translate-y-3 opacity-10">
                <Target className="w-40 h-40" />
              </div>
              
              <div className="space-y-1.5 relative z-10">
                <span className="px-2.5 py-0.5 bg-purple-900/60 border border-purple-800 rounded-full text-[9px] font-black tracking-widest text-[#d8b4fe] uppercase select-none w-max block">
                  ANNUAL TARGET PROGRESS
                </span>
                <h4 className="text-xs font-bold font-sans">แดชบอร์ดเกณฑ์วัดเป้าหมายใหญ่</h4>
                <p className="text-[10.5px] text-purple-200 leading-relaxed font-medium">
                  ตั้งเป้ายอดขายบริษัทสำหรับปีทำการ พัฒนาขีดความสามารถร่วมกันเพื่อความยั่งยืนของกิจการ
                </p>
              </div>

              <div className="pt-3 border-t border-purple-900 relative z-10">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] text-purple-300 font-bold">ยอดปี 2569 ปัจจุบัน:</span>
                  <span className="text-xs font-mono font-bold">
                    ฿{sales.filter(s => s.date.startsWith('2026')).reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-purple-300 font-bold">เป้าหมายสะสมรายปี:</span>
                  <span className="text-xs font-mono font-bold text-[#d8b4fe]">
                    ฿{salesTarget.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-purple-900/50 rounded-xl p-3 border border-purple-800/80 text-[10.5px] text-purple-200 leading-normal font-medium">
                💰 💡 <strong>เคล็ดลับจากผู้จัดเตรียม Sapphire HR:</strong> มอบรางวัลหรือ โบนัสพิเศษ ให้แก่พนักงานที่ทำผลงานบิลยอดออเดอร์สะสมสูงสุด เพื่อเพิ่มแรงบันดาลใจในการผลักดันออเดอร์หน้าร้าน!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM DIALOG MODE (ADD / EDIT SINGLE SALES RECORD) */}
      <AnimatePresence>
        {(isAddModalOpen || editingSale !== null) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between select-none bg-slate-50">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-blue-650" />
                  <span>{editingSale ? 'แก้ไขข้อมูลยอดขายรายวัน' : 'เพิ่มข้อมูลยอดขายรายวันอันใหม่'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSale(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-bold text-slate-700">
                
                {/* 1. Date */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-550 font-bold">1. ระบุวันที่ยอดขาย (Date)</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 text-xs focus:ring-2 focus:ring-blue-105 inline-block"
                  />
                </div>

                {/* 2. Amount and Order Count Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-550 font-bold">2. ยอดขายจริง (บาท)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="เช่น 15000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 font-mono text-slate-800 text-xs focus:ring-2 focus:ring-blue-105 inline-block"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-550 font-bold">3. จำนวนออเดอร์ (บิล)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="เช่น 8"
                      value={formOrderCount}
                      onChange={(e) => setFormOrderCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 font-mono text-slate-800 text-xs focus:ring-2 focus:ring-blue-105 inline-block"
                    />
                  </div>
                </div>

                {/* 3. Payment Method */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-550 font-bold">4. ช่องทางการจ่ายหลัก (Payment Channel)</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-105"
                  >
                    <option value="โอนเงินดิจิทัล">โอนเงินดิจิทัล (แอปพลิเคชันแบงก์กิ้ง)</option>
                    <option value="เงินสด">เงินสด (Cash)</option>
                    <option value="บัตรเครดิต">บัตรเครดิต (Credit Card)</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                {/* 4. Creator / Employee dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-550 font-bold">5. บันทึก/ทำรายการโดยพนักงาน (Staff Origin)</label>
                  <select
                    value={formCreator}
                    onChange={(e) => setFormCreator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-105"
                  >
                    <option value="">-- กรุณาเลือกชื่อพนักงาน --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                    ))}
                    <option value="ผู้ดูแลระบบ (Admin)">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>

                {/* 5. Note info details */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-550 font-bold">6. บันทึกเพิ่มเติม หรือหมายเหตุสินค้า (Note)</label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="เช่น ลูกค้าเหมาจานชลบุรี 150 ชุด..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-105 resize-none font-sans"
                  />
                </div>

                {/* Action submit and cancel buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px] select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingSale(null);
                    }}
                    className="py-2 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer font-black"
                  >
                    {editingSale ? 'บันทึกแก้ไขข้อมูล' : 'สร้างรายการใหม่'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM BEAUTIFUL DELETION CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {deleteConfirmId !== null && (() => {
          const targetSale = sales.find(s => s.id === deleteConfirmId);
          if (!targetSale) return null;
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-700"
              >
                {/* Header icon alert */}
                <div className="p-5 border-b border-rose-100 flex items-center gap-3 select-none bg-rose-50/70">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950">ยืนยันการลบยอดขายรายวัน</h3>
                    <p className="text-[10px] text-rose-600 font-bold">การลบข้อมูลจะไม่สามารถกู้คืนกลับมาได้อีก</p>
                  </div>
                </div>

                {/* Details layout */}
                <div className="p-5 space-y-3 font-semibold text-xs leading-relaxed text-slate-705 text-slate-700">
                  <p>
                    คุณแน่ใจหรือไม่ที่จะทำการลบบันทึกยอดขายรหัส <span className="font-mono text-slate-950 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{targetSale.id}</span> ลงวันที่ <strong className="text-slate-950 font-extrabold">{formatThaiDate(targetSale.date)}</strong>?
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1 font-mono text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>ยอดสุทธิ:</span>
                      <strong className="text-slate-950">฿{targetSale.amount.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>จำนวนใบเสร็จ:</span>
                      <strong className="text-slate-950">{targetSale.orderCount} บิล</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ช่องทางชำระเงิน:</span>
                      <strong className="text-slate-950">{targetSale.paymentMethod}</strong>
                    </div>
                  </div>
                </div>

                {/* Buttons controls */}
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
                    onClick={() => executeDelete(targetSale.id)}
                    className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer font-black shadow-xs"
                  >
                    ยืนยันการลบ
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
