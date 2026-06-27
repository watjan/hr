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
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Wallet
} from 'lucide-react';
import { DailySale, EmployeeSalary } from '../types';
import { saveKeyToCloud, fetchKeyFromCloud } from '../lib/firebaseSync';

export interface CashflowRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  billAmount?: number;
  sales2Amount?: number;
  expenseAmount?: number;
  changeReserveAmount?: number;
  cashReceived?: number;
  changeAmount?: number;
  changeBreakdown?: Record<string, number>;
  transferKhonLaKhrueng?: number;
  transferKBank?: number;
  transferSCB?: number;
  actualCashCounted?: number;
  actualChangeCounted?: number;
  cashDiscrepancy?: number;
  creator: string;
}

const DEFAULT_CASHFLOW: CashflowRecord[] = [
  { id: 'CF-001', date: '2026-06-24', type: 'income', title: 'ยอดขายหน้าร้านอภิวัฒน์เครื่องครัว (เซ็ตเตาแก๊สและเครื่องครัวสเตนเลส)', amount: 24500, billAmount: 24500, cashReceived: 25000, changeAmount: 500, changeBreakdown: { '500': 1 }, creator: 'สมชาย รักดี' },
  { id: 'CF-002', date: '2026-06-24', type: 'expense', title: 'จ่ายค่าแก๊ส LPG สำหรับจัดแสดงเตาแก๊สสาธิต', amount: 850, creator: 'วิชัย ชาญชัย' },
  { id: 'CF-003', date: '2026-06-23', type: 'income', title: 'ขายส่งหม้อซุปสองหูสเตนเลส ตราหัวม้าลาย 10 ชุด', amount: 15900, billAmount: 15900, cashReceived: 16000, changeAmount: 100, changeBreakdown: { '100': 1 }, creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'CF-004', date: '2026-06-23', type: 'expense', title: 'ซื้อกระดาษบิลและอุปกรณ์สำนักงานส่วนงานขายหน้าร้าน', amount: 350, creator: 'สมชาย รักดี' },
  { id: 'CF-005', date: '2026-06-22', type: 'income', title: 'มัดจำชุดเครื่องครัวสไตล์โมเดิร์น (คุณรัศมี)', amount: 10000, billAmount: 10000, cashReceived: 10000, changeAmount: 0, changeBreakdown: {}, creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'CF-006', date: '2026-06-22', type: 'expense', title: 'จ่ายค่าขนส่งเครื่องครัวด่วนให้ลูกค้า (Lalamove)', amount: 450, creator: 'วิชัย ชาญชัย' },
];

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
  // Cash Register / Change Calculator & Cashflow Ledger Modes
  const [salesMode, setSalesMode] = useState<'standard' | 'cashflow'>('standard');

  const [cashflowRecords, setCashflowRecords] = useState<CashflowRecord[]>(() => {
    const saved = localStorage.getItem('sapphire_cashflow_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CASHFLOW;
      }
    }
    return DEFAULT_CASHFLOW;
  });

  // Change Calculator & New Cashflow Form states
  const [calcDate, setCalcDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calcChangeReserve, setCalcChangeReserve] = useState<string>('');
  const [calcReceived1, setCalcReceived1] = useState<string>('');
  const [calcProductPrice, setCalcProductPrice] = useState<string>('');
  const [calcSales2, setCalcSales2] = useState<string>('');
  const [calcExpense, setCalcExpense] = useState<string>('');
  const [calcChangeManual, setCalcChangeManual] = useState<string>('');
  const [calcTransferKhonLaKhrueng, setCalcTransferKhonLaKhrueng] = useState<string>('');
  const [calcTransferKBank, setCalcTransferKBank] = useState<string>('');
  const [calcTransferSCB, setCalcTransferSCB] = useState<string>('');
  const [calcActualCashCounted, setCalcActualCashCounted] = useState<string>('');
  const [calcActualChangeCounted, setCalcActualChangeCounted] = useState<string>('');
  const [calcTitle, setCalcTitle] = useState<string>('ยอดขายและเงินทอนประจำวัน');
  const [calcCreator, setCalcCreator] = useState<string>(employees[0]?.name || 'สมชาย รักดี');

  // Manual cashflow modal / state
  const [isCashflowModalOpen, setIsCashflowModalOpen] = useState(false);
  const [cfType, setCfType] = useState<'income' | 'expense'>('income');
  const [cfTitle, setCfTitle] = useState('');
  const [cfAmount, setCfAmount] = useState('');
  const [cfChangeReserveAmount, setCfChangeReserveAmount] = useState<string>('');
  const [cfBillAmount, setCfBillAmount] = useState<string>('');
  const [cfSales2Amount, setCfSales2Amount] = useState<string>('');
  const [cfExpenseAmount, setCfExpenseAmount] = useState<string>('');
  const [cfChangeAmount, setCfChangeAmount] = useState<string>('');
  const [cfTransferKhonLaKhrueng, setCfTransferKhonLaKhrueng] = useState<string>('');
  const [cfTransferKBank, setCfTransferKBank] = useState<string>('');
  const [cfTransferSCB, setCfTransferSCB] = useState<string>('');
  const [cfActualCashCounted, setCfActualCashCounted] = useState<string>('');
  const [cfActualChangeCounted, setCfActualChangeCounted] = useState<string>('');
  const [cfDate, setCfDate] = useState(new Date().toISOString().split('T')[0]);
  const [cfCreator, setCfCreator] = useState(employees[0]?.name || 'สมชาย รักดี');
  const [editingCashflowId, setEditingCashflowId] = useState<string | null>(null);
  const [cfDeleteConfirmId, setCfDeleteConfirmId] = useState<string | null>(null);

  // Search & filter for cashflow table
  const [cfSearch, setCfSearch] = useState('');
  const [cfFilterType, setCfFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [cfSortOrder, setCfSortOrder] = useState<'desc' | 'asc'>('desc');

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

        // Fetch cashflow records from cloud
        const cloudCashflow = await fetchKeyFromCloud('cashflow_records');
        if (cloudCashflow && Array.isArray(cloudCashflow)) {
          setCashflowRecords(cloudCashflow);
          localStorage.setItem('sapphire_cashflow_records', JSON.stringify(cloudCashflow));
        }

        setCloudStatus('success');
      } catch (err) {
        console.error('[Firebase] Failed to fetch sales and cashflow data:', err);
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
      const savedCashflow = localStorage.getItem('sapphire_cashflow_records');
      if (savedCashflow) {
        try {
          setCashflowRecords(JSON.parse(savedCashflow));
        } catch (e) {}
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

  // Change calculator logic computed on the fly
  const reserveNum = React.useMemo(() => parseFloat(calcChangeReserve) || 0, [calcChangeReserve]);
  const r1Num = React.useMemo(() => parseFloat(calcReceived1) || 0, [calcReceived1]);
  const pPriceNum = React.useMemo(() => parseFloat(calcProductPrice) || 0, [calcProductPrice]);
  const s2Num = React.useMemo(() => parseFloat(calcSales2) || 0, [calcSales2]);
  const expNum = React.useMemo(() => parseFloat(calcExpense) || 0, [calcExpense]);
  const transKhonLaKhrueng = React.useMemo(() => parseFloat(calcTransferKhonLaKhrueng) || 0, [calcTransferKhonLaKhrueng]);
  const transKBank = React.useMemo(() => parseFloat(calcTransferKBank) || 0, [calcTransferKBank]);
  const transSCB = React.useMemo(() => parseFloat(calcTransferSCB) || 0, [calcTransferSCB]);

  const changeAmt = React.useMemo(() => {
    if (calcChangeManual !== '') {
      return parseFloat(calcChangeManual) || 0;
    }
    if (r1Num > pPriceNum && pPriceNum > 0) {
      return r1Num - pPriceNum;
    }
    return 0;
  }, [calcChangeManual, r1Num, pPriceNum]);

  const todayRemainingBalance = React.useMemo(() => {
    return reserveNum + r1Num + s2Num - expNum - changeAmt;
  }, [reserveNum, r1Num, s2Num, expNum, changeAmt]);

  // สูตรสรุปยอดของร้าน: (ยอดขายที่ 1 + ยอดขายที่ 2) - ยอดเตรียมเงินทอน - (โอนคนละครึ่ง + กสิกรไทย + ไทยพาณิชย์) - รายจ่ายวันนี้
  const storeRemainingBalance = React.useMemo(() => {
    return (r1Num + s2Num) - reserveNum - (transKhonLaKhrueng + transKBank + transSCB) - expNum;
  }, [r1Num, s2Num, reserveNum, transKhonLaKhrueng, transKBank, transSCB, expNum]);

  const actualCashNum = React.useMemo(() => parseFloat(calcActualCashCounted) || 0, [calcActualCashCounted]);
  const actualChangeNum = React.useMemo(() => parseFloat(calcActualChangeCounted) || 0, [calcActualChangeCounted]);

  // ยอดนับจริงสุทธิ (สูตรร้าน) = ยอดนับได้จริง - โอนคนละครึ่ง - กสิกรไทย - ไทยพาณิชย์
  const storeActualCashNet = React.useMemo(() => {
    return actualCashNum - transKhonLaKhrueng - transKBank - transSCB;
  }, [actualCashNum, transKhonLaKhrueng, transKBank, transSCB]);

  const cashDiscrepancy = React.useMemo(() => {
    // สูตรการคำนวณที่ปรับปรุงใหม่
    // ส่วนที่ 1 (ยอดขายรวม): (ยอดขายที่ 1 + ยอดขายที่ 2)
    // ส่วนที่ 2: ยอดนับได้จริง + ยอดโอนรวม - รายจ่ายวันนี้ - ยอดเตรียมทอน
    const transferTotal = transKhonLaKhrueng + transKBank + transSCB;
    const part1 = r1Num + s2Num;
    const part2 = actualCashNum + transferTotal - expNum - reserveNum;
    return part1 - part2;
  }, [r1Num, s2Num, actualCashNum, transKhonLaKhrueng, transKBank, transSCB, expNum, reserveNum]);

  const changeBreakdown = React.useMemo(() => {
    if (changeAmt <= 0) return {};
    const denominations = [1000, 500, 100, 50, 20, 10, 5, 2, 1];
    const breakdown: Record<string, number> = {};
    let rem = changeAmt;
    
    for (const d of denominations) {
      const count = Math.floor(rem / d);
      if (count > 0) {
        breakdown[d.toString()] = count;
        rem %= d;
      }
    }
    return breakdown;
  }, [changeAmt]);

  // Auto-calculate total manual cashflow amount and type based on breakdown sub-fields
  useEffect(() => {
    const hasDetails = cfBillAmount !== '' || cfSales2Amount !== '' || cfExpenseAmount !== '' || cfChangeAmount !== '' || cfChangeReserveAmount !== '' || cfTransferKhonLaKhrueng !== '' || cfTransferKBank !== '' || cfTransferSCB !== '';
    if (hasDetails) {
      const res = parseFloat(cfChangeReserveAmount) || 0;
      const r1 = parseFloat(cfBillAmount) || 0;
      const s2 = parseFloat(cfSales2Amount) || 0;
      const exp = parseFloat(cfExpenseAmount) || 0;
      const khonLaKhrueng = parseFloat(cfTransferKhonLaKhrueng) || 0;
      const kbank = parseFloat(cfTransferKBank) || 0;
      const scb = parseFloat(cfTransferSCB) || 0;
      
      // สูตรสรุปยอดของร้าน: (ยอดขายที่ 1 + ยอดขายที่ 2) - ยอดเตรียมเงินทอน - (โอนคนละครึ่ง + กสิกรไทย + ไทยพาณิชย์) - รายจ่ายวันนี้
      const bal = (r1 + s2) - res - (khonLaKhrueng + kbank + scb) - exp;
      
      setCfAmount(Math.abs(bal).toString());
      setCfType(bal >= 0 ? 'income' : 'expense');
    }
  }, [cfBillAmount, cfSales2Amount, cfExpenseAmount, cfChangeAmount, cfChangeReserveAmount, cfTransferKhonLaKhrueng, cfTransferKBank, cfTransferSCB]);

  // Processed cashflow records with daily remaining balance (only within that date)
  const processedCFRecords = React.useMemo(() => {
    // First, filter the records
    const filtered = [...cashflowRecords].filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(cfSearch.toLowerCase()) || 
                            r.creator.toLowerCase().includes(cfSearch.toLowerCase()) ||
                            r.date.includes(cfSearch);
      const matchesType = cfFilterType === 'all' || r.type === cfFilterType;
      return matchesSearch && matchesType;
    });

    // Group filtered records by date
    const groups: Record<string, typeof cashflowRecords> = {};
    for (const r of filtered) {
      if (!groups[r.date]) {
        groups[r.date] = [];
      }
      groups[r.date].push(r);
    }

    // Process each date group separately to reset running balance per date
    const allProcessed: typeof cashflowRecords = [];
    
    for (const date of Object.keys(groups)) {
      // Sort oldest first within the same date to calculate chronological running balance
      const dayRecords = [...groups[date]].sort((a, b) => a.id.localeCompare(b.id));
      
      let runningBal = 0;
      const processedDayRecords = dayRecords.map(r => {
        if (r.type === 'income') {
          runningBal += r.amount;
        } else {
          runningBal -= r.amount;
        }
        return {
          ...r,
          balance: runningBal
        };
      });
      
      allProcessed.push(...processedDayRecords);
    }

    // Sort the final combined list based on selected sort order (desc = newest first, asc = oldest first)
    allProcessed.sort((a, b) => {
      const dateCompare = cfSortOrder === 'desc' 
        ? b.date.localeCompare(a.date) 
        : a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return cfSortOrder === 'desc' 
        ? b.id.localeCompare(a.id) 
        : a.id.localeCompare(b.id);
    });

    return allProcessed;
  }, [cashflowRecords, cfSearch, cfFilterType, cfSortOrder]);

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

  const saveCashflowToStorage = async (updatedList: CashflowRecord[]) => {
    setCashflowRecords(updatedList);
    localStorage.setItem('sapphire_cashflow_records', JSON.stringify(updatedList));
    
    setCloudStatus('syncing');
    try {
      await saveKeyToCloud('cashflow_records', updatedList);
      setCloudStatus('success');
    } catch (err) {
      console.error('[Firebase] Failed to auto-save cashflow:', err);
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

  // Cashflow Handlers
  const handleAddManualCashflow = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(cfAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (!cfTitle.trim()) {
      alert("กรุณาระบุคำอธิบายรายการ");
      return;
    }

    // Check if expense has details specifically for expenses
    if (cfType === 'expense') {
      if (cfTitle.trim().length < 3) {
        alert("คำอธิบายรายจ่ายสั้นเกินไป กรุณากรอกรายละเอียดให้ชัดเจนว่าเป็นรายจ่ายสำหรับค่าอะไร (อย่างน้อย 3 ตัวอักษร)");
        return;
      }
    }

    // Check duplicate date per unique day constraint
    if (editingCashflowId) {
      // Edit: Check if another record already has this date
      const isDuplicateDate = cashflowRecords.some(r => r.date === cfDate && r.id !== editingCashflowId);
      if (isDuplicateDate) {
        alert(`❌ ไม่สามารถบันทึกได้: มีข้อมูลบันทึกของวันที่ ${formatThaiDate(cfDate)} อยู่แล้วในระบบ!\nระบบอนุญาตให้ลงบันทึกได้เพียง 1 รายการต่อวันเท่านั้น`);
        return;
      }
    } else {
      // Add: Check if any record has this date
      const isDuplicateDate = cashflowRecords.some(r => r.date === cfDate);
      if (isDuplicateDate) {
        alert(`❌ ไม่สามารถบันทึกได้: มีข้อมูลบันทึกของวันที่ ${formatThaiDate(cfDate)} อยู่แล้วในระบบ!\nระบบอนุญาตให้ลงบันทึกได้เพียง 1 รายการต่อวันเท่านั้น`);
        return;
      }
    }

    const bAmt = cfBillAmount ? parseFloat(cfBillAmount) : undefined;
    const s2Amt = cfSales2Amount ? parseFloat(cfSales2Amount) : undefined;
    const expAmt = cfExpenseAmount ? parseFloat(cfExpenseAmount) : undefined;
    const chgAmt = cfChangeAmount ? parseFloat(cfChangeAmount) : undefined;
    const resAmt = cfChangeReserveAmount ? parseFloat(cfChangeReserveAmount) : undefined;
    const khonLaKhruengAmt = cfTransferKhonLaKhrueng ? parseFloat(cfTransferKhonLaKhrueng) : undefined;
    const kbankAmt = cfTransferKBank ? parseFloat(cfTransferKBank) : undefined;
    const scbAmt = cfTransferSCB ? parseFloat(cfTransferSCB) : undefined;
    const actCashAmt = cfActualCashCounted ? parseFloat(cfActualCashCounted) : undefined;
    const actChgAmt = cfActualChangeCounted ? parseFloat(cfActualChangeCounted) : undefined;

    let discAmt: number | undefined = undefined;
    if (actCashAmt !== undefined || actChgAmt !== undefined) {
      // สูตรการคำนวณที่ปรับปรุงใหม่: ส่วนที่ 1 - ส่วนที่ 2
      // ส่วนที่ 1 = ยอดขายรวม (ยอดขายที่ 1 + ยอดขายที่ 2)
      // ส่วนที่ 2 = ยอดนับได้จริง + ยอดโอนรวม (คนละครึ่ง + กสิกร + SCB) - รายจ่ายวันนี้ - ยอดเตรียมทอน
      const S = (bAmt || 0) + (s2Amt || 0);
      const R = resAmt || 0;
      const C = actCashAmt || 0;
      const T = (khonLaKhruengAmt || 0) + (kbankAmt || 0) + (scbAmt || 0);
      const E = expAmt || 0;
      discAmt = S - (C + T - E - R);
    }

    if (editingCashflowId) {
      // Edit
      const updated = cashflowRecords.map(r => r.id === editingCashflowId ? {
        ...r,
        date: cfDate,
        type: cfType,
        title: cfTitle,
        amount: amt,
        billAmount: bAmt,
        sales2Amount: s2Amt,
        expenseAmount: expAmt,
        changeAmount: chgAmt,
        changeReserveAmount: resAmt,
        transferKhonLaKhrueng: khonLaKhruengAmt,
        transferKBank: kbankAmt,
        transferSCB: scbAmt,
        actualCashCounted: actCashAmt,
        actualChangeCounted: actChgAmt,
        cashDiscrepancy: discAmt,
        cashReceived: (bAmt !== undefined || s2Amt !== undefined) ? ((bAmt || 0) + (s2Amt || 0)) : r.cashReceived,
        creator: cfCreator
      } : r);
      saveCashflowToStorage(updated);
      setEditingCashflowId(null);
    } else {
      // Add
      const newRecord: CashflowRecord = {
        id: `CF-${Date.now().toString().slice(-6)}`,
        date: cfDate,
        type: cfType,
        title: cfTitle,
        amount: amt,
        billAmount: bAmt,
        sales2Amount: s2Amt,
        expenseAmount: expAmt,
        changeAmount: chgAmt,
        changeReserveAmount: resAmt,
        transferKhonLaKhrueng: khonLaKhruengAmt,
        transferKBank: kbankAmt,
        transferSCB: scbAmt,
        actualCashCounted: actCashAmt,
        actualChangeCounted: actChgAmt,
        cashDiscrepancy: discAmt,
        cashReceived: (bAmt !== undefined || s2Amt !== undefined) ? ((bAmt || 0) + (s2Amt || 0)) : undefined,
        creator: cfCreator
      };
      const updated = [newRecord, ...cashflowRecords].sort((a,b) => b.date.localeCompare(a.date));
      saveCashflowToStorage(updated);
    }

    setIsCashflowModalOpen(false);
    // Reset form
    setCfTitle('');
    setCfAmount('');
    setCfBillAmount('');
    setCfSales2Amount('');
    setCfExpenseAmount('');
    setCfChangeAmount('');
    setCfChangeReserveAmount('');
    setCfTransferKhonLaKhrueng('');
    setCfTransferKBank('');
    setCfTransferSCB('');
    setCfActualCashCounted('');
    setCfActualChangeCounted('');
    setCfDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenEditCashflow = (record: CashflowRecord) => {
    setEditingCashflowId(record.id);
    setCfType(record.type);
    setCfTitle(record.title);
    setCfAmount(record.amount.toString());
    setCfBillAmount(record.billAmount !== undefined ? record.billAmount.toString() : '');
    setCfSales2Amount(record.sales2Amount !== undefined ? record.sales2Amount.toString() : '');
    setCfExpenseAmount(record.expenseAmount !== undefined ? record.expenseAmount.toString() : '');
    setCfChangeAmount(record.changeAmount !== undefined ? record.changeAmount.toString() : '');
    setCfChangeReserveAmount(record.changeReserveAmount !== undefined ? record.changeReserveAmount.toString() : '');
    setCfTransferKhonLaKhrueng(record.transferKhonLaKhrueng !== undefined ? record.transferKhonLaKhrueng.toString() : '');
    setCfTransferKBank(record.transferKBank !== undefined ? record.transferKBank.toString() : '');
    setCfTransferSCB(record.transferSCB !== undefined ? record.transferSCB.toString() : '');
    setCfActualCashCounted(record.actualCashCounted !== undefined ? record.actualCashCounted.toString() : '');
    setCfActualChangeCounted(record.actualChangeCounted !== undefined ? record.actualChangeCounted.toString() : '');
    setCfDate(record.date);
    setCfCreator(record.creator);
    setIsCashflowModalOpen(true);
  };

  const handleDeleteCashflow = (id: string) => {
    setCfDeleteConfirmId(id);
  };

  const executeDeleteCashflow = (id: string) => {
    const updated = cashflowRecords.filter(r => r.id !== id);
    saveCashflowToStorage(updated);
    setCfDeleteConfirmId(null);
  };

  const calculateChangeBreakdown = (change: number) => {
    const denominations = [1000, 500, 100, 50, 20, 10, 5, 2, 1];
    const breakdown: Record<string, number> = {};
    let rem = change;
    
    for (const d of denominations) {
      const count = Math.floor(rem / d);
      if (count > 0) {
        breakdown[d.toString()] = count;
        rem %= d;
      }
    }
    return breakdown;
  };

  const handleSaveCalcAsRecord = () => {
    if (r1Num === 0 && s2Num === 0 && expNum === 0 && changeAmt === 0 && reserveNum === 0) {
      alert("กรุณาระบุจำนวนเงินอย่างน้อยหนึ่งรายการในช่องคำนวณ");
      return;
    }

    // Check duplicate date per unique day constraint
    const isDuplicateDate = cashflowRecords.some(r => r.date === calcDate);
    if (isDuplicateDate) {
      alert(`❌ ไม่สามารถบันทึกได้: มีข้อมูลบันทึกของวันที่ ${formatThaiDate(calcDate)} อยู่แล้วในระบบ!\nระบบอนุญาตให้ลงบันทึกได้เพียง 1 รายการต่อวันเท่านั้น`);
      return;
    }

    const isIncome = todayRemainingBalance >= 0;
    const absAmount = Math.abs(todayRemainingBalance);

    const breakdown = calculateChangeBreakdown(changeAmt);

    const newRecord: CashflowRecord = {
      id: `CF-${Date.now().toString().slice(-6)}`,
      date: calcDate,
      type: isIncome ? 'income' : 'expense',
      title: `${calcTitle.trim() || 'ยอดคงเหลือประจำวัน'} (${reserveNum > 0 ? `เงินทอนสำรอง: ฿${reserveNum.toLocaleString()} + ` : ''}ยอดรับที่: ฿${r1Num.toLocaleString()} + ยอดขายที่ 2: ฿${s2Num.toLocaleString()} - รายจ่าย: ฿${expNum.toLocaleString()} - ยอดเงินทอน: ฿${changeAmt.toLocaleString()})`,
      amount: absAmount,
      billAmount: r1Num,
      sales2Amount: s2Num,
      expenseAmount: expNum,
      changeReserveAmount: reserveNum || undefined,
      cashReceived: r1Num + s2Num,
      changeAmount: changeAmt,
      changeBreakdown: breakdown,
      transferKhonLaKhrueng: transKhonLaKhrueng || undefined,
      transferKBank: transKBank || undefined,
      transferSCB: transSCB || undefined,
      actualCashCounted: actualCashNum || undefined,
      actualChangeCounted: actualChangeNum || undefined,
      cashDiscrepancy: (calcActualCashCounted !== '' || calcActualChangeCounted !== '') ? cashDiscrepancy : undefined,
      creator: calcCreator
    };

    const updated = [newRecord, ...cashflowRecords].sort((a,b) => b.date.localeCompare(a.date));
    saveCashflowToStorage(updated);
    
    let alertMsg = `🎉 บันทึกยอดคงเหลือลงในสมุดบัญชีเรียบร้อยแล้ว!\nวันที่: ${formatThaiDate(calcDate)}\nคงเหลือของวันนี้ (ตามสูตรร้าน): ฿${storeRemainingBalance.toLocaleString()} (${storeRemainingBalance >= 0 ? 'ยอดเงินบวก' : 'ยอดเงินติดลบ'})`;
    if (calcActualCashCounted !== '' || calcActualChangeCounted !== '') {
      alertMsg += `\n\nยอดตรวจนับจริง:\n- เงินสดนับจริง: ฿${actualCashNum.toLocaleString()}\n- เงินทอนนับจริง: ฿${actualChangeNum.toLocaleString()}\n- ผลต่างตรวจนับ: ฿${cashDiscrepancy.toLocaleString()}`;
    }
    alert(alertMsg);
    
    // Reset change calc form
    setCalcReceived1('');
    setCalcProductPrice('');
    setCalcSales2('');
    setCalcExpense('');
    setCalcChangeManual('');
    setCalcChangeReserve('');
    setCalcTransferKhonLaKhrueng('');
    setCalcTransferKBank('');
    setCalcTransferSCB('');
    setCalcActualCashCounted('');
    setCalcActualChangeCounted('');
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
        <div className="space-y-6 animate-fade-in">
          
          {/* Sub-toggle for Daily Sales: Standard vs Cash Register & Cashflow Ledger */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-200 w-full sm:w-fit self-start gap-1 select-none">
            <button
              onClick={() => setSalesMode('standard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                salesMode === 'standard'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>บันทึกยอดขายทั่วไป</span>
            </button>
            <button
              onClick={() => setSalesMode('cashflow')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                salesMode === 'cashflow'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>เครื่องคิดเงินทอน & บัญชีรับ-จ่ายรายวัน</span>
            </button>
          </div>

          {salesMode === 'standard' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
              
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
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Cash Change Calculator & Cashflow Formula */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">เครื่องคำนวณและสรุปยอดเงินสดประจำวัน 🤖</h3>
                    <p className="text-[10px] text-slate-400 font-bold">สูตร: (ยอดรับที่ + ยอดขายที่ 2) - รายจ่าย - ยอดเงินทอน</p>
                  </div>
                </div>

                {/* Digital Readout - Today's Net Remaining Balance */}
                <div className="bg-slate-900 rounded-xl p-4 text-center text-white space-y-2 shadow-inner relative overflow-hidden">
                  <div className="absolute right-3 top-3 opacity-10">
                    <Coins className="w-16 h-16 text-white" />
                  </div>
                  
                  <div>
                    <span className="text-[9px] text-blue-300 font-black uppercase tracking-widest block">💰 ยอดคงเหลือสุทธิวันนี้ (สูตรร้าน)</span>
                    <div className={`text-2xl font-black font-mono tracking-tight ${storeRemainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ฿{storeRemainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[8.5px] text-slate-300 font-bold max-w-xs mx-auto">
                      สูตร: (ขาย 1: ฿{r1Num.toLocaleString()} + ขาย 2: ฿{s2Num.toLocaleString()}) - สำรอง: ฿{reserveNum.toLocaleString()} - โอนรวม: ฿{(transKhonLaKhrueng + transKBank + transSCB).toLocaleString()} - รายจ่าย: ฿{expNum.toLocaleString()}
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between text-[8.5px] text-slate-400 font-bold">
                    <span>ยอดคงเหลือในระบบเดิม (คาดการณ์รวม):</span>
                    <span className="font-mono text-slate-200">฿{todayRemainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 1. Transaction Date & Creator Row */}
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-extrabold">วันที่ทำรายการ</label>
                    <input
                      type="date"
                      required
                      value={calcDate}
                      onChange={(e) => setCalcDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-extrabold">ผู้รับเงิน / แคชเชียร์</label>
                    <select
                      value={calcCreator}
                      onChange={(e) => setCalcCreator(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 1.5 Daily Change Reserve Amount */}
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3 space-y-1 text-xs font-bold text-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] text-amber-800 font-extrabold uppercase tracking-wide">💰 ยอดเตรียมเงินทอนแต่ละวัน (เงินสำรองตั้งต้น) (฿)</label>
                    <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-bold">
                      บวกเพิ่มอัตโนมัติ
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">฿</span>
                    <input
                      type="number"
                      placeholder="ระบุยอดเตรียมเงินทอน เช่น 2000"
                      value={calcChangeReserve}
                      onChange={(e) => setCalcChangeReserve(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-6.5 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-black"
                    />
                  </div>
                </div>

                {/* 2. Primary Cash Received & Product Price (helper) */}
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-emerald-600 font-extrabold">1. ยอดรับที่ (เงินรับมา) (฿)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">฿</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={calcReceived1}
                        onChange={(e) => setCalcReceived1(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6.5 pr-3 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-500 font-extrabold">ราคาสินค้ารวม (฿)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">฿</span>
                      <input
                        type="number"
                        placeholder="เพื่อคำนวณเงินทอน"
                        value={calcProductPrice}
                        onChange={(e) => setCalcProductPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6.5 pr-3 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Cash Presets for ยอดรับที่ */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-extrabold block">ปุ่มลัดระบุเงินรับมา (Quick Presets)</span>
                  <div className="flex flex-wrap gap-1">
                    {[20, 50, 100, 500, 1000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const current = parseFloat(calcReceived1) || 0;
                          setCalcReceived1((current + val).toString());
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 cursor-pointer transition-all active:scale-95 border border-slate-200/40"
                      >
                        +{val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        if (calcProductPrice) setCalcReceived1(calcProductPrice);
                      }}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[9px] font-black cursor-pointer transition-all active:scale-95"
                    >
                      พอดีเป๊ะ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCalcReceived1('');
                        setCalcProductPrice('');
                        setCalcSales2('');
                        setCalcExpense('');
                        setCalcChangeManual('');
                        setCalcChangeReserve('');
                        setCalcActualCashCounted('');
                        setCalcActualChangeCounted('');
                      }}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[9px] font-black cursor-pointer transition-all active:scale-95"
                    >
                      เคลียร์ทั้งหมด
                    </button>
                  </div>
                </div>

                {/* 3. Change Amount Field & Visual Indicator */}
                <div className="space-y-1.5 text-xs font-bold text-slate-700 bg-slate-50/50 p-2.5 rounded-xl border border-slate-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] text-slate-600 font-extrabold">ยอดเงินทอนกลับ (฿)</label>
                    {r1Num > pPriceNum && pPriceNum > 0 && calcChangeManual === '' && (
                      <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        คำนวณอัตโนมัติ
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono">฿</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={calcChangeManual !== '' ? calcChangeManual : (changeAmt > 0 ? changeAmt : '')}
                      onChange={(e) => setCalcChangeManual(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-6.5 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-black"
                    />
                  </div>
                </div>

                {/* 4. Sales 2 & Expenses row */}
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-blue-600 font-extrabold">2. ยอดขายที่ 2 (฿)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">฿</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={calcSales2}
                        onChange={(e) => setCalcSales2(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6.5 pr-3 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-rose-600 font-extrabold">3. รายจ่ายวันนี้ (฿)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">฿</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={calcExpense}
                        onChange={(e) => setCalcExpense(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6.5 pr-3 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 4.5 Bank Transfer / Online Sales Section */}
                <div className="bg-blue-50/40 border border-blue-200/50 rounded-xl p-3 space-y-2 select-none">
                  <span className="text-[10px] text-blue-800 font-black uppercase tracking-wide flex items-center gap-1">
                    💳 บันทึกยอดโอนเงินเข้าบัญชี (สูตรร้านนำไปหักออกจากเก๊ะ)
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[9.5px] font-bold text-slate-700">
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-extrabold">โอนคนละครึ่ง (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={calcTransferKhonLaKhrueng}
                        onChange={(e) => setCalcTransferKhonLaKhrueng(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-extrabold">กสิกรไทย (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={calcTransferKBank}
                        onChange={(e) => setCalcTransferKBank(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-extrabold">ไทยพาณิชย์ (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={calcTransferSCB}
                        onChange={(e) => setCalcTransferSCB(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Denominations Breakdown visual display for ยอดเงินทอน */}
                {changeAmt > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 space-y-1.5 animate-fade-in">
                    <span className="text-[9.5px] text-amber-800 font-extrabold block border-b border-amber-200/40 pb-1">🔍 การแจกแจงธนบัตรและเหรียญเพื่อทอนเงิน:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                      {Object.entries(changeBreakdown).map(([denom, qty]) => {
                        const val = parseInt(denom);
                        const isNote = val >= 20;
                        return (
                          <div 
                            key={denom} 
                            className={`flex items-center justify-between px-2 py-1 rounded-lg border select-none ${
                              val === 1000 ? 'bg-amber-100/55 border-amber-200/60 text-amber-950' :
                              val === 500 ? 'bg-purple-100/55 border-purple-200/60 text-purple-950' :
                              val === 100 ? 'bg-rose-100/55 border-rose-200/60 text-rose-950' :
                              val === 50 ? 'bg-blue-100/55 border-blue-200/60 text-blue-950' :
                              val === 20 ? 'bg-emerald-100/55 border-emerald-200/60 text-emerald-950' :
                              'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {isNote ? (
                                <div className={`w-5 h-2.5 rounded-xs border ${
                                  val === 1000 ? 'bg-slate-300 border-slate-400' :
                                  val === 500 ? 'bg-purple-200 border-purple-300' :
                                  val === 100 ? 'bg-rose-200 border-rose-300' :
                                  val === 50 ? 'bg-blue-200 border-blue-300' :
                                  'bg-emerald-200 border-emerald-300'
                                }`} />
                              ) : (
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] ${
                                  val === 10 ? 'bg-amber-100 border-yellow-500' :
                                  val === 2 ? 'bg-yellow-50 border-yellow-400' :
                                  'bg-slate-100 border-slate-300'
                                }`} />
                              )}
                              <span>{isNote ? 'แบงก์' : 'เหรียญ'} {val.toLocaleString()} บ.</span>
                            </div>
                            <span className="font-mono text-xs font-black">× {qty}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Cash Counting & Reconciliation Section */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5 select-none">
                    <span className="text-[10.5px] text-slate-700 font-extrabold uppercase tracking-wide flex items-center gap-1">
                      🔍 ตรวจสอบยอดตรวจนับจริง (Reconciliation)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9.5px] text-slate-600 font-extrabold">💵 ยอดนับได้จริง (฿)</label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">฿</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={calcActualCashCounted}
                          onChange={(e) => setCalcActualCashCounted(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-5.5 pr-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9.5px] text-slate-600 font-extrabold">🪙 เงินทอนนับได้จริง (฿)</label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">฿</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={calcActualChangeCounted}
                          onChange={(e) => setCalcActualChangeCounted(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-5.5 pr-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary of reconciliation */}
                  {(calcActualCashCounted !== '' || calcActualChangeCounted !== '') && (
                    <div className="bg-white border border-slate-200/70 rounded-lg p-3 space-y-2.5 text-[11px] font-bold">
                      <div className="text-[10px] text-blue-800 font-extrabold border-b border-blue-100 pb-1.5 flex items-center gap-1">
                        ✨ การคำนวณผลต่างยอดเงินตามสูตรร้าน
                      </div>

                      {/* Part 1: (ยอดขายที่ 1 + ยอดขายที่ 2) */}
                      <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between text-slate-700">
                          <span>📦 ส่วนที่ 1 (ยอดขายรวม):</span>
                          <span className="font-mono text-slate-900">
                            ฿{(r1Num + s2Num).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium leading-normal">
                          สูตร: (ยอดขายที่ 1 [฿{r1Num.toLocaleString()}] + ยอดขายที่ 2 [฿{s2Num.toLocaleString()}])
                        </div>
                      </div>

                      {/* Part 2: ยอดนับได้จริง + ยอดโอนรวม - รายจ่ายวันนี้ - ยอดเตรียมทอน */}
                      <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between text-slate-700">
                          <span>💵 ส่วนที่ 2 (ยอดจริงสุทธิ):</span>
                          <span className="font-mono text-slate-900">
                            ฿{(actualCashNum + (transKhonLaKhrueng + transKBank + transSCB) - expNum - reserveNum).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium leading-normal">
                          สูตร: ยอดนับได้จริง [฿{actualCashNum.toLocaleString()}] + โอนรวม [฿{(transKhonLaKhrueng + transKBank + transSCB).toLocaleString()}] - รายจ่ายวันนี้ [฿{expNum.toLocaleString()}] - ยอดเตรียมทอน [฿{reserveNum.toLocaleString()}]
                          <div className="text-[8.5px] text-slate-400 pl-2">
                            * โอนรวม = คนละครึ่ง (฿{transKhonLaKhrueng.toLocaleString()}) + กสิกร (฿{transKBank.toLocaleString()}) + SCB (฿{transSCB.toLocaleString()})
                          </div>
                        </div>
                      </div>

                      {/* Final Discrepancy Equation */}
                      <div className="bg-blue-50/40 p-2 rounded-lg border border-blue-100/50 space-y-1">
                        <div className="flex justify-between items-center text-blue-900 font-black">
                          <span>📊 ผลต่างตรวจนับยอดเงิน:</span>
                          <span className={`font-mono text-xs font-black ${
                            cashDiscrepancy === 0 ? 'text-emerald-600' :
                            cashDiscrepancy > 0 ? 'text-rose-600' :
                            'text-amber-600'
                          }`}>
                            {cashDiscrepancy === 0 ? '฿0.00 (พอดี)' :
                             cashDiscrepancy > 0 ? `+฿${cashDiscrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })} (เงินขาด)` :
                             `-฿${Math.abs(cashDiscrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })} (เงินเกิน)`}
                          </span>
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-semibold leading-normal">
                          สูตร: ส่วนที่ 1 [฿{(r1Num + s2Num).toLocaleString()}] - ส่วนที่ 2 [฿{(actualCashNum + (transKhonLaKhrueng + transKBank + transSCB) - expNum - reserveNum).toLocaleString()}]
                        </div>
                      </div>

                      {/* Diagnostic summary */}
                      <div className={`text-[9.5px] px-2.5 py-1.5 rounded-md text-center mt-1 border ${
                        cashDiscrepancy === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                        cashDiscrepancy > 0 ? 'bg-rose-50 text-rose-800 border-rose-100' :
                        'bg-amber-50 text-amber-800 border-amber-100'
                      }`}>
                        {cashDiscrepancy === 0 ? '🟢 ยอดคงเหลือตรงตามที่ตรวจนับได้จริง!' :
                         cashDiscrepancy > 0 ? '🔴 ยอดเงินขาดจากระบบ (เงินในเก๊ะน้อยกว่ายอดขายจริงตามสูตรร้าน)' :
                         '🟡 ยอดเงินเกินจากระบบ (เงินในเก๊ะมากกว่ายอดขายจริงตามสูตรร้าน)'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional description and Creator before saving */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-[9.5px] text-slate-500 font-extrabold">บันทึกหรือคำอธิบายเพิ่มเติม</label>
                    <input
                      type="text"
                      value={calcTitle}
                      onChange={(e) => setCalcTitle(e.target.value)}
                      placeholder="เช่น ยอดรวมสิ้นวันหน้าร้าน, ยอดสรุปยอดขายหลักและรอง"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCalcAsRecord}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    <span>📥 บันทึกสรุปยอดคงเหลือลงสมุดบัญชี</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Sales & Expense Ledger Table */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Ledger Statistics cards */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Total Cash Incomes */}
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-left select-none shadow-3xs">
                    <span className="text-[9.5px] text-emerald-600 font-extrabold uppercase tracking-wide block">ยอดขายรวม (Cash Sales)</span>
                    <div className="text-sm md:text-base font-black text-emerald-850 mt-0.5">
                      ฿{cashflowRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                    </div>
                  </div>
                  {/* Total Cash Expenses */}
                  <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 text-left select-none shadow-3xs">
                    <span className="text-[9.5px] text-rose-600 font-extrabold uppercase tracking-wide block">รายจ่ายรวม (Cash Paid)</span>
                    <div className="text-sm md:text-base font-black text-rose-850 mt-0.5">
                      ฿{cashflowRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                    </div>
                  </div>
                  {/* Cumulative balance */}
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-left select-none shadow-3xs">
                    <span className="text-[9.5px] text-blue-600 font-extrabold uppercase tracking-wide block">เงินสดคงเหลือสุทธิ</span>
                    <div className="text-sm md:text-base font-black text-blue-850 mt-0.5">
                      ฿{(
                        cashflowRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0) -
                        cashflowRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Ledger Table Container */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  
                  {/* Table Control Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row items-center gap-3 justify-between">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="ค้นหารายการ..."
                          value={cfSearch}
                          onChange={(e) => setCfSearch(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg pl-7.5 pr-3 py-1 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36"
                        />
                      </div>
                      <select
                        value={cfFilterType}
                        onChange={(e) => setCfFilterType(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-750 font-bold focus:outline-none"
                      >
                        <option value="all">ทุกประเภท</option>
                        <option value="income">รายรับ / ยอดขาย</option>
                        <option value="expense">รายจ่าย</option>
                      </select>

                      {/* Sort Order Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setCfSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-750 font-black cursor-pointer flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                        title={cfSortOrder === 'asc' ? 'เรียงลำดับจากเก่าไปใหม่' : 'เรียงลำดับจากใหม่ไปเก่า'}
                      >
                        <span>📅 {cfSortOrder === 'asc' ? 'เก่า ➔ ใหม่' : 'ใหม่ ➔ เก่า'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCashflowId(null);
                        setCfType('expense'); // Default manual cashflow entry to expense
                        setCfTitle('');
                        setCfAmount('');
                        setCfBillAmount('');
                        setCfSales2Amount('');
                        setCfExpenseAmount('');
                        setCfChangeAmount('');
                        setCfDate(new Date().toISOString().split('T')[0]);
                        setCfCreator(employees[0]?.name || 'สมชาย รักดี');
                        setIsCashflowModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>บันทึกรายรับ/จ่ายทั่วไป</span>
                    </button>
                  </div>

                  {/* Table Rows */}
                  <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                    {processedCFRecords.length === 0 ? (
                      <div className="p-12 text-center space-y-2 text-slate-400">
                        <Wallet className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                        <p className="text-xs font-bold">ไม่พบบันทึกข้อมูลกระแสเงินสดในตาราง</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold select-none whitespace-nowrap">
                            <th className="px-4 py-2.5">วันที่</th>
                            <th className="px-4 py-2.5">รายการ</th>
                            <th className="px-4 py-2.5 text-right">ยอดรับ (+)</th>
                            <th className="px-4 py-2.5 text-right">ยอดจ่าย (-)</th>
                            <th className="px-4 py-2.5 text-right">ยอดคงเหลือ</th>
                            <th className="px-4 py-2.5">ผู้ทำรายการ</th>
                            <th className="px-4 py-2.5 text-center">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-slate-700 text-xs font-semibold">
                          {processedCFRecords.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-[11px] font-mono text-slate-500">
                                {record.date}
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 leading-tight">
                                    {record.title}
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] font-bold flex-wrap">
                                    <span className="text-slate-400">ID: {record.id}</span>
                                    {record.transferKhonLaKhrueng !== undefined && record.transferKhonLaKhrueng > 0 && (
                                      <span className="text-blue-700 bg-blue-50 px-1 py-0.2 rounded-xs border border-blue-100">คนละครึ่ง: ฿{record.transferKhonLaKhrueng.toLocaleString()}</span>
                                    )}
                                    {record.transferKBank !== undefined && record.transferKBank > 0 && (
                                      <span className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded-xs border border-emerald-100">กสิกร: ฿{record.transferKBank.toLocaleString()}</span>
                                    )}
                                    {record.transferSCB !== undefined && record.transferSCB > 0 && (
                                      <span className="text-purple-700 bg-purple-50 px-1 py-0.2 rounded-xs border border-purple-100">SCB: ฿{record.transferSCB.toLocaleString()}</span>
                                    )}
                                    {record.changeReserveAmount !== undefined && record.changeReserveAmount > 0 && (
                                      <span className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded-xs border border-amber-100">เงินสำรอง ฿{record.changeReserveAmount.toLocaleString()}</span>
                                    )}
                                    {record.changeAmount !== undefined && record.changeAmount > 0 && (
                                      <span className="text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded-xs border border-emerald-100">ทอน ฿{record.changeAmount.toLocaleString()}</span>
                                    )}
                                    {record.actualCashCounted !== undefined && (
                                      <span className="text-slate-600 bg-slate-100 px-1 py-0.2 rounded-xs border border-slate-200">นับจริง ฿{record.actualCashCounted.toLocaleString()}</span>
                                    )}
                                    {record.actualChangeCounted !== undefined && (
                                      <span className="text-slate-600 bg-slate-100 px-1 py-0.2 rounded-xs border border-slate-200">ทอนนับจริง ฿{record.actualChangeCounted.toLocaleString()}</span>
                                    )}
                                    {record.cashDiscrepancy !== undefined && (
                                      <span className={`px-1 py-0.2 rounded-xs border ${
                                        record.cashDiscrepancy === 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                                        record.cashDiscrepancy > 0 ? 'text-rose-700 bg-rose-50 border-rose-100' :
                                        'text-amber-700 bg-amber-50 border-amber-100'
                                      }`}>
                                        {record.cashDiscrepancy === 0 ? 'ลงตัวพอดี' :
                                         record.cashDiscrepancy > 0 ? `ขาด ฿${record.cashDiscrepancy.toLocaleString()}` :
                                         `เกิน ฿${Math.abs(record.cashDiscrepancy).toLocaleString()}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-black text-emerald-600">
                                {record.type === 'income' ? `+฿${record.amount.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-black text-rose-600">
                                {record.type === 'expense' ? `-฿${record.amount.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-black text-slate-900 bg-slate-50/50">
                                ฿{record.balance.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[11px] text-slate-550">
                                {record.creator}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditCashflow(record)}
                                    className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer transition-all"
                                    title="แก้ไขข้อมูลรายการ"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCashflow(record.id)}
                                    className="p-1 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer transition-all"
                                    title="ลบรายการ"
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

                </div>

              </div>

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

      {/* CUSTOM CASHFLOW DELETION CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {cfDeleteConfirmId !== null && (() => {
          const targetRecord = cashflowRecords.find(r => r.id === cfDeleteConfirmId);
          if (!targetRecord) return null;
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
                    <h3 className="text-sm font-black text-rose-950">ยืนยันการลบรายการบัญชี</h3>
                    <p className="text-[10px] text-rose-600 font-bold">การลบรายการจะไม่สามารถกู้คืนกลับมาได้</p>
                  </div>
                </div>

                {/* Details layout */}
                <div className="p-5 space-y-3 font-semibold text-xs leading-relaxed text-slate-700">
                  <p>
                    คุณแน่ใจหรือไม่ที่จะทำการลบรายการ <span className="font-mono text-slate-950 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{targetRecord.id}</span> ลงวันที่ <strong className="text-slate-950 font-extrabold">{formatThaiDate(targetRecord.date)}</strong>?
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1 font-mono text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>ประเภทรายการ:</span>
                      <strong className={targetRecord.type === 'income' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {targetRecord.type === 'income' ? '📈 รายรับ / ยอดขาย' : '📉 รายจ่าย'}
                      </strong>
                    </div>
                    <div className="flex justify-between flex-wrap gap-1">
                      <span>คำอธิบาย:</span>
                      <strong className="text-slate-950 text-right break-all" title={targetRecord.title}>{targetRecord.title}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>จำนวนเงิน:</span>
                      <strong className="text-slate-950">฿{targetRecord.amount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Buttons controls */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px] select-none">
                  <button
                    type="button"
                    onClick={() => setCfDeleteConfirmId(null)}
                    className="py-2 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDeleteCashflow(targetRecord.id)}
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

      {/* CASHFLOW MANUAL RECORD MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {isCashflowModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>{editingCashflowId ? 'แก้ไขรายการรับ-จ่ายเงิน' : 'เพิ่มรายการรับ-จ่ายใหม่'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCashflowModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddManualCashflow} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                
                {/* Income / Expense Toggle */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">ประเภทรายการ</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => setCfType('income')}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        cfType === 'income'
                          ? 'bg-emerald-650 bg-emerald-650 bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-white/40'
                      }`}
                    >
                      📈 รายรับ / ยอดขาย
                    </button>
                    <button
                      type="button"
                      onClick={() => setCfType('expense')}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        cfType === 'expense'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-white/40'
                      }`}
                    >
                      📉 รายจ่าย
                    </button>
                  </div>
                </div>

                {/* Title / Description */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                    {cfType === 'expense' ? '📝 คำอธิบายรายจ่าย (ระบุรายละเอียดเฉพาะรายจ่ายเท่านั้น)' : '📝 คำอธิบายรายการ'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={cfType === 'expense' ? "ระบุรายละเอียดรายจ่าย เช่น ค่าวัตถุดิบ, ค่าเดินทาง, ค่าอุปกรณ์..." : "เช่น ค่าขนส่งสินค้าหม้อ Zebra, จ่ายค่าพัสดุด่วน..."}
                    value={cfTitle}
                    onChange={(e) => setCfTitle(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 font-bold ${
                      cfType === 'expense' 
                        ? 'border-rose-200 focus:ring-rose-550 focus:ring-rose-500' 
                        : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                  {cfType === 'expense' && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">
                      ⚠️ โปรดบันทึกเฉพาะรายการที่เป็นรายจ่ายจริงๆ เท่านั้น
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">จำนวนเงินรวม (฿)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono">฿</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={cfAmount}
                      onChange={(e) => setCfAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-black text-slate-900"
                    />
                  </div>
                </div>

                {/* Detailed cash breakdown options */}
                <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-600 font-black">⚙️ ปรับปรุงยอดแยกย่อยประจำวัน (สูตรคำนวณอัตโนมัติ)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9.5px] text-emerald-600 font-black">1. ยอดรับที่ 1 (เงินรับมา) (฿)</label>
                      <input
                        type="number"
                        placeholder="ไม่มี"
                        value={cfBillAmount}
                        onChange={(e) => setCfBillAmount(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9.5px] text-blue-600 font-black">2. ยอดขายที่ 2 (฿)</label>
                      <input
                        type="number"
                        placeholder="ไม่มี"
                        value={cfSales2Amount}
                        onChange={(e) => setCfSales2Amount(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9.5px] text-rose-600 font-black">3. รายจ่ายวันนี้ (฿)</label>
                      <input
                        type="number"
                        placeholder="ไม่มี"
                        value={cfExpenseAmount}
                        onChange={(e) => setCfExpenseAmount(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9.5px] text-amber-600 font-black">4. ยอดเงินทอน (฿)</label>
                      <input
                        type="number"
                        placeholder="ไม่มี"
                        value={cfChangeAmount}
                        onChange={(e) => setCfChangeAmount(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Bank Transfer fields inside modal */}
                  <div className="bg-blue-50/40 p-2.5 rounded-lg space-y-1.5 border border-blue-100/50">
                    <span className="text-[9.5px] text-blue-800 font-black">💳 ยอดโอนเงินแยกช่องทาง (สูตรร้านนำไปหักออกจากเก๊ะ)</span>
                    <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold">
                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold">โอนคนละครึ่ง (฿)</label>
                        <input
                          type="number"
                          placeholder="ไม่มี"
                          value={cfTransferKhonLaKhrueng}
                          onChange={(e) => setCfTransferKhonLaKhrueng(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold">กสิกรไทย (฿)</label>
                        <input
                          type="number"
                          placeholder="ไม่มี"
                          value={cfTransferKBank}
                          onChange={(e) => setCfTransferKBank(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold">ไทยพาณิชย์ (฿)</label>
                        <input
                          type="number"
                          placeholder="ไม่มี"
                          value={cfTransferSCB}
                          onChange={(e) => setCfTransferSCB(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/40">
                    <div className="space-y-1">
                      <label className="block text-[9.5px] text-slate-600 font-black">💵 ยอดนับจริง (฿)</label>
                      <input
                        type="number"
                        placeholder="ไม่มี"
                        value={cfActualCashCounted}
                        onChange={(e) => setCfActualCashCounted(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9.5px] text-slate-600 font-black">🪙 เงินทอนนับจริง (฿)</label>
                      <input
                        type="number"
                        placeholder="ไม่มี"
                        value={cfActualChangeCounted}
                        onChange={(e) => setCfActualChangeCounted(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {(cfBillAmount !== '' || cfSales2Amount !== '' || cfExpenseAmount !== '' || cfChangeAmount !== '' || cfTransferKhonLaKhrueng !== '' || cfTransferKBank !== '' || cfTransferSCB !== '' || cfActualCashCounted !== '' || cfActualChangeCounted !== '') && (
                    <div className="flex items-center justify-between text-[9px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 font-bold">
                      <span>สูตร: (ยอดขายที่ 1 + ยอดขายที่ 2) - ยอดเตรียมเงิน - (ยอดนับได้จริง - โอนรวม - รายจ่าย)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCfBillAmount('');
                          setCfSales2Amount('');
                          setCfExpenseAmount('');
                          setCfChangeAmount('');
                          setCfTransferKhonLaKhrueng('');
                          setCfTransferKBank('');
                          setCfTransferSCB('');
                          setCfActualCashCounted('');
                          setCfActualChangeCounted('');
                        }}
                        className="text-rose-600 hover:underline cursor-pointer"
                      >
                        ล้างค่าคำนวณทั้งหมด
                      </button>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">วันที่ลงบันทึก</label>
                  <input
                    type="date"
                    required
                    value={cfDate}
                    onChange={(e) => setCfDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                {/* Creator */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">ผู้ลงบันทึกข้อมูล</label>
                  <select
                    value={cfCreator}
                    onChange={(e) => setCfCreator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px] select-none">
                  <button
                    type="button"
                    onClick={() => setIsCashflowModalOpen(false)}
                    className="py-2 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer font-black shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกรายการ</span>
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
