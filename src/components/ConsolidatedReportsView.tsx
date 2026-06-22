import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  FileDown, 
  TrendingUp, 
  Coins, 
  BarChart3, 
  CalendarDays, 
  Download, 
  RefreshCw, 
  Table, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer,
  ChevronRight,
  TrendingDown,
  Building2,
  FileSpreadsheet,
  Cloud,
  Percent,
  Activity,
  SlidersHorizontal
} from 'lucide-react';
import { DailySale } from '../types';
import { fetchKeyFromCloud } from '../lib/firebaseSync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ConsolidatedReportsViewProps {
  activeReportType: 'monthly' | 'yearly';
}

const DEFAULT_SALES: DailySale[] = [
  // 2026
  { id: 'S-26-06-1', date: '2026-06-19', amount: 48500, orderCount: 22, paymentMethod: 'โอนเงินดิจิทัล', note: 'ยอดขายหน้าร้าน + ออเดอร์จัดส่งเตาแก๊สชุดใหญ่', creator: 'สมชาย รักดี' },
  { id: 'S-26-06-2', date: '2026-06-18', amount: 32400, orderCount: 15, paymentMethod: 'โอนเงินดิจิทัล', note: 'ขายกระทะนอนสติ๊ก Zebra 40 ใบ ส่งฝ่ายจัดเตรียม', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-26-06-3', date: '2026-06-17', amount: 56900, orderCount: 28, paymentMethod: 'บัตรเครดิต', note: 'คุณวรรณาเหมาชุดจานชามเมลามีนเข้าคาเฟ่ใหม่', creator: 'สมชาย รักดี' },
  { id: 'S-26-06-4', date: '2026-06-16', amount: 18200, orderCount: 10, paymentMethod: 'เงินสด', note: 'ยอดชำระเบ็ดเตล็ดกล่องอาหารพลาสติก', creator: 'วิชัย ชาญชัย' },
  { id: 'S-26-06-5', date: '2026-06-15', amount: 74100, orderCount: 35, paymentMethod: 'โอนเงินดิจิทัล', note: 'หม้อชาบูสเตนเลสไฟฟ้า 20 ชุด ขนส่งทางเรือ', creator: 'สมชาย รักดี' },
  { id: 'S-26-06-6', date: '2026-06-14', amount: 23000, orderCount: 12, paymentMethod: 'โอนเงินดิจิทัล', note: 'ชุดมีดทำครัวสเตนเลสสตีลเยอรมัน 12 กล่อง', creator: 'วรรณวิสา วงศ์วรรณ' },
  
  { id: 'S-26-05-1', date: '2026-05-15', amount: 94500, orderCount: 38, paymentMethod: 'โอนเงินดิจิทัล', note: 'จัดเซ็ตเตาทอดแก๊สเชิงพาณิชย์แบรนด์จีน', creator: 'สมชาย รักดี' },
  { id: 'S-26-05-2', date: '2026-05-28', amount: 90500, orderCount: 32, paymentMethod: 'บัตรเครดิต', note: 'ชุดหม้อชาบูสเตนเลสแท้', creator: 'วรรณวิสา วงศ์วรรณ' },
  
  { id: 'S-26-04-1', date: '2026-04-20', amount: 92000, orderCount: 42, paymentMethod: 'โอนเงินดิจิทัล', note: 'งานตกแต่งห้องครัวคอนโดพัทยา เซ็ตพรีเมียม', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-26-04-2', date: '2026-04-10', amount: 118000, orderCount: 50, paymentMethod: 'บัตรเครดิต', note: 'ออเดอร์ร้านอาหารเปิดใหม่ริมหาดกระบี่', creator: 'สมชาย รักดี' },
  
  { id: 'S-26-03-1', date: '2026-03-15', amount: 195000, orderCount: 72, paymentMethod: 'โอนเงินดิจิทัล', note: 'ล็อตออเดอร์งานครัวประถมเทศบาล', creator: 'วิชัย ชาญชัย' },
  { id: 'S-26-02-1', date: '2026-02-18', amount: 160000, orderCount: 60, paymentMethod: 'โอนเงินดิจิทัล', note: 'เครื่องจ่ายน้ำหวานสแตนเลส 3 ช่อง 10 เครื่อง', creator: 'สมชาย รักดี' },
  { id: 'S-26-01-1', date: '2026-01-20', amount: 220000, orderCount: 85, paymentMethod: 'โอนเงินดิจิทัล', note: 'เหมาถังไอศกรีมเขย่ามือโบราณและวัตถุดิบนำเข้า', creator: 'วรรณวิสา วงศ์วรรณ' },
  
  // 2025
  { id: 'S-25-12-1', date: '2025-12-25', amount: 260000, orderCount: 95, paymentMethod: 'โอนเงินดิจิทัล', note: 'เทศกาลปีใหม่ เซ็ตของชำร่วยชุดช้อนส้อมพรีเมียม', creator: 'สมชาย รักดี' },
  { id: 'S-25-11-1', date: '2025-11-18', amount: 210000, orderCount: 78, paymentMethod: 'โอนเงินดิจิทัล', note: 'เหมาซึ้งนึ่งอลูมิเนียมใหญ่ 3 ชั้น 150 ชุด', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-25-10-1', date: '2025-10-15', amount: 195050, orderCount: 70, paymentMethod: 'บัตรเครดิต', note: 'อุปกรณ์เครื่องใช้สแตนเลสสำหรับร้านหมูกระทะเปิดใหม่', creator: 'วิชัย ชาญชัย' },
  { id: 'S-25-09-1', date: '2025-09-20', amount: 185000, orderCount: 68, paymentMethod: 'โอนเงินดิจิทัล', note: 'แก้วกาแฟดับเบิ้ลวอลพร้อมจานรอง 200 เซ็ต', creator: 'สมชาย รักดี' },
  { id: 'S-25-08-1', date: '2025-08-12', amount: 175000, orderCount: 65, paymentMethod: 'โอนเงินดิจิทัล', note: 'กระทะจีนเหล็กหล่อด้ามไม้ 24 นิ้ว 40 ใบ', creator: 'วิชัย ชาญชัย' },
  { id: 'S-25-07-1', date: '2025-07-19', amount: 168000, orderCount: 62, paymentMethod: 'เงินสด', note: 'เครื่องปั่นน้ำผลไม้เชิงพาณิชย์ มอเตอร์สายทองแดง 10 ชุด', creator: 'สมชาย รักดี' },
  { id: 'S-25-06-1', date: '2025-06-15', amount: 230000, orderCount: 80, paymentMethod: 'โอนเงินดิจิทัล', note: 'ชุดหม้อชาบูไฟฟ้านำเข้า คาร์โก้ตู้คอนเทนเนอร์', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-25-05-1', date: '2025-05-18', amount: 170000, orderCount: 65, paymentMethod: 'โอนเงินดิจิทัล', note: 'ถาดอาหารสแตนเลสมีฝาปิดสำหรับบุฟเฟ่ต์งานแต่ง', creator: 'วิชัย ชาญชัย' },
  { id: 'S-25-04-1', date: '2025-04-10', amount: 190000, orderCount: 70, paymentMethod: 'บัตรเครดิต', note: 'เซ็ตเตาบาบีคิวแคมป์ปิ้ง ยอดขายทะลักช่วงเทศกาล', creator: 'สมชาย รักดี' },
  { id: 'S-25-03-1', date: '2025-03-24', amount: 180000, orderCount: 68, paymentMethod: 'โอนเงินดิจิทัล', note: 'อ่างอุ่นอาหารเซรามิคขาทองหรูหรา 40 ชิ้น', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-25-02-1', date: '2025-02-14', amount: 150550, orderCount: 55, paymentMethod: 'เงินสด', note: 'งานวันวาเลนไทน์ ล็อตแก้วแชมเปญใสพิเศษ', creator: 'สมชาย รักดี' },
  { id: 'S-25-01-1', date: '2025-01-20', amount: 200000, orderCount: 75, paymentMethod: 'โอนเงินดิจิทัล', note: 'เปิดบัญชีลูกค้าขาประจำ ร้านก๋วยเตี๋ยวเรือแฟรนไชส์', creator: 'วรรณวิสา วงศ์วรรณ' },
  
  // 2024
  { id: 'S-24-12-1', date: '2024-12-22', amount: 245000, orderCount: 90, paymentMethod: 'โอนเงินดิจิทัล', note: 'สถิติส่งท้ายปี เคลียร์แล็บครัวคัดพิเศษ', creator: 'สมชาย รักดี' },
  { id: 'S-24-11-1', date: '2024-11-15', amount: 198000, orderCount: 74, paymentMethod: 'โอนเงินดิจิทัล', note: 'เครื่องนวดแป้งไดเรคไดร์ฟ 3 เครื่อง ส่งโรงแรมล้านนา', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-24-10-1', date: '2024-10-11', amount: 180000, orderCount: 65, paymentMethod: 'บัตรเครดิต', note: 'ชุดกระทะย่างหินเคลือบพรีเมียมลายหินอ่อน 80 ดีไซน์', creator: 'สมชาย รักดี' },
  { id: 'S-24-09-1', date: '2024-09-17', amount: 172000, orderCount: 60, paymentMethod: 'โอนเงินดิจิทัล', note: 'เคาน์เตอร์กาแฟสั่งตัดพิเศษสแตนเลสหนา 2 มม.', creator: 'วิชัย ชาญชัย' },
  { id: 'S-24-08-1', date: '2024-08-14', amount: 165000, orderCount: 58, paymentMethod: 'โอนเงินดิจิทัล', note: 'ชั้นวางจานสแตนเลสมีล้อลาก 4 ชั้น 20 ตัว', creator: 'สมชาย รักดี' },
  { id: 'S-24-07-1', date: '2024-07-16', amount: 150000, orderCount: 50, paymentMethod: 'เงินสด', note: 'ตู้โชว์เค้กกระจกโค้งรักษาอุณหภูมิสไตล์มินิมอล', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-24-06-1', date: '2024-06-21', amount: 210000, orderCount: 75, paymentMethod: 'โอนเงินดิจิทัล', note: 'เซ็ตเตาแม่เหล็กไฟฟ้าคู่พร้อมหม้อชาบูล็อตใหญ่', creator: 'สมชาย รักดี' },
  { id: 'S-24-05-1', date: '2024-05-19', amount: 160000, orderCount: 60, paymentMethod: 'บัตรเครดิต', note: 'ชุดแก้วเบียร์คริสตัลนำเข้าจากเบลเยียม 2 ปาลเล็ต', creator: 'วิชัย ชาญชัย' },
  { id: 'S-24-04-1', date: '2024-04-12', amount: 180000, orderCount: 68, paymentMethod: 'โอนเงินดิจิทัล', note: 'ชุดครัวพกพา แอร์เออร์ ถังแก๊สจิ๋ว ขายส่งรับหน้าร้อน', creator: 'สมชาย รักดี' },
  { id: 'S-24-03-1', date: '2024-03-14', amount: 175000, orderCount: 64, paymentMethod: 'โอนเงินดิจิทัล', note: 'เครื่องสับผสมเนื้อสัตว์ขนาดใหญ่สแตนเลสฟู้ดเกรด', creator: 'วรรณวิสา วงศ์วรรณ' },
  { id: 'S-24-02-1', date: '2024-02-14', amount: 140000, orderCount: 50, paymentMethod: 'เงินสด', note: 'จานดินเผาศิลาดลทรงเหลี่ยมแฮนด์เมด 500 ใบ', creator: 'สมชาย รักดี' },
  { id: 'S-24-01-1', date: '2024-01-18', amount: 185500, orderCount: 70, paymentMethod: 'โอนเงินดิจิทัล', note: 'หม้อก๋วยเตี๋ยวไร้สารตะกั่วมาตรฐานสมอ. 50 ใบ', creator: 'วรรณวิสา วงศ์วรรณ' }
];

export default function ConsolidatedReportsView({ activeReportType }: ConsolidatedReportsViewProps) {
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('บริษัท คิทเช่นแวร์ ทรานสปอร์ต จำกัด');
  
  // Custom interactive modes
  const [reportMode, setReportMode] = useState<'standard' | 'stock'>('standard');
  const [heatmapMetric, setHeatmapMetric] = useState<'sales' | 'mom' | 'yoy'>('sales');

  const getThaiMonthName = (monthIndex: number) => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return months[monthIndex] || '';
  };

  const loadData = async () => {
    setLoading(true);
    // 1. Load Company Name
    const savedCompany = localStorage.getItem('hr_company_settings');
    if (savedCompany) {
      try {
        const parsed = JSON.parse(savedCompany);
        if (parsed.name) setCompanyName(parsed.name);
      } catch (e) {}
    }

    // 2. Load Sales from storage
    const localSaved = localStorage.getItem('sapphire_daily_sales');
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        // If local is too small or contains fewer than 10 items, prefer loading extended dataset info safely
        if (parsed.length > 10) {
          setSales(parsed);
        } else {
          setSales(DEFAULT_SALES);
        }
      } catch (e) {
        setSales(DEFAULT_SALES);
      }
    } else {
      setSales(DEFAULT_SALES);
    }

    // Attempt cloud pull to update
    try {
      const cloudSales = await fetchKeyFromCloud('daily_sales');
      if (cloudSales && Array.isArray(cloudSales) && cloudSales.length > 5) {
        // Only override if cloud dataset actually is populated
        setSales(cloudSales);
        localStorage.setItem('sapphire_daily_sales', JSON.stringify(cloudSales));
      }
    } catch (err) {
      console.warn('[Reports Cloud sync] Cloud read ignored/unavailable, utilizing local storage:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    
    // Listen for storage changes as well to react in real-time
    const handleStorageUpdate = (e: any) => {
      if (e.detail && e.detail.key === 'daily_sales') {
        setSales(e.detail.data || []);
      }
    };
    window.addEventListener('sapphire_storage_updated' as any, handleStorageUpdate);
    return () => {
      window.removeEventListener('sapphire_storage_updated' as any, handleStorageUpdate);
    };
  }, []);

  // Aggregate monthly lists for standard report
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

    // Sort key ascendingly for charts, but descendingly for reports listing
    const monthsSorted = Object.keys(monthlyMap).sort((a, b) => b.localeCompare(a));
    return monthsSorted.map((month, index) => {
      const yearStr = month.split('-')[0];
      const monthStr = month.split('-')[1];
      const year = parseInt(yearStr, 10) + 543;
      const monthIdx = parseInt(monthStr, 10) - 1;
      const label = `${getThaiMonthName(monthIdx)} ${year}`;
      const data = monthlyMap[month];

      // Growth rate relative to the chronological older month
      let growthRate = 0;
      const chronologicallyOlderIndex = index + 1; // since index 0 is newest, 1 is older
      if (chronologicallyOlderIndex < monthsSorted.length) {
        const prevAmount = monthlyMap[monthsSorted[chronologicallyOlderIndex]].amount;
        if (prevAmount > 0) {
          growthRate = ((data.amount - prevAmount) / prevAmount) * 100;
        }
      }

      return {
        key: month,
        label,
        amount: data.amount,
        orderCount: data.orderCount,
        records: data.records,
        avgTicket: data.orderCount > 0 ? data.amount / data.orderCount : 0,
        growthRate
      };
    });
  };

  // Aggregate yearly lists for standard report
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

    const yearsSorted = Object.keys(yearlyMap).sort((a, b) => b.localeCompare(a));
    return yearsSorted.map((year, index) => {
      const label = `ปี พ.ศ. ${parseInt(year, 10) + 543}`;
      const data = yearlyMap[year];

      // Growth rate relative to chronological previous year
      let growthRate = 0;
      const olderIndex = index + 1;
      if (olderIndex < yearsSorted.length) {
        const prevAmount = yearlyMap[yearsSorted[olderIndex]].amount;
        if (prevAmount > 0) {
          growthRate = ((data.amount - prevAmount) / prevAmount) * 100;
        }
      }

      return {
        key: year,
        label,
        amount: data.amount,
        orderCount: data.orderCount,
        records: data.records,
        avgTicket: data.orderCount > 0 ? data.amount / data.orderCount : 0,
        growthRate
      };
    });
  };

  const monthlyAggregate = getMonthlyAggregate();
  const yearlyAggregate = getYearlyAggregate();

  const reportData = activeReportType === 'monthly' ? monthlyAggregate : yearlyAggregate;

  // Key stats
  const totalReportSales = reportData.reduce((acc, r) => acc + r.amount, 0);
  const totalReportOrders = reportData.reduce((acc, r) => acc + r.orderCount, 0);
  const overallAvgTicket = totalReportOrders > 0 ? totalReportSales / totalReportOrders : 0;
  const bestRecord = reportData.length > 0 ? [...reportData].sort((a, b) => b.amount - a.amount)[0] : null;

  // Compute stock return matrix data
  const getHeatmapData = () => {
    const years = (Array.from(new Set(sales.map(s => s.date.substring(0, 4)))) as string[]).sort((a, b) => b.localeCompare(a));
    
    if (years.length === 0) {
      years.push(new Date().getFullYear().toString());
    }

    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    return years.map(year => {
      let annualTotal = 0;
      let activeMonthsCount = 0;

      const monthlyDetails = months.map((month, mIdx) => {
        const key = `${year}-${month}`;
        
        // Sum current month sales
        const currentSales = sales
          .filter(s => s.date.startsWith(key))
          .reduce((sum, s) => sum + s.amount, 0);

        annualTotal += currentSales;
        if (currentSales > 0) activeMonthsCount++;

        // Calculate MoM (previous chronological month)
        let prevMonthSales = 0;
        if (mIdx === 0) {
          // January -> Dec of previous year
          const prevYearStr = (parseInt(year) - 1).toString();
          prevMonthSales = sales
            .filter(s => s.date.startsWith(`${prevYearStr}-12`))
            .reduce((sum, s) => sum + s.amount, 0);
        } else {
          // Feb - Dec -> previous month same year
          const prevMonthStr = mIdx.toString().padStart(2, '0');
          prevMonthSales = sales
            .filter(s => s.date.startsWith(`${year}-${prevMonthStr}`))
            .reduce((sum, s) => sum + s.amount, 0);
        }

        let momGrowth = null;
        if (prevMonthSales > 0) {
          momGrowth = ((currentSales - prevMonthSales) / prevMonthSales) * 100;
        }

        // Calculate YoY (same month previous year)
        const prevYearStr = (parseInt(year) - 1).toString();
        const prevYearSales = sales
          .filter(s => s.date.startsWith(`${prevYearStr}-${month}`))
          .reduce((sum, s) => sum + s.amount, 0);

        let yoyGrowth = null;
        if (prevYearSales > 0) {
          yoyGrowth = ((currentSales - prevYearSales) / prevYearSales) * 100;
        }

        return {
          month,
          monthName: getThaiMonthName(mIdx),
          sales: currentSales,
          momGrowth,
          yoyGrowth,
        };
      });

      return {
        year,
        thaiYear: parseInt(year) + 543,
        monthlyDetails,
        annualTotal,
        annualAverage: activeMonthsCount > 0 ? annualTotal / activeMonthsCount : 0,
      };
    });
  };

  const heatmapData = getHeatmapData();

  // Advanced financial indicators / Seasonal insight analysis (Bloomberg design)
  const calculateInsights = () => {
    const monthlySum = Array.from({ length: 12 }, () => 0);
    const monthlyCount = Array.from({ length: 12 }, () => 0);
    
    sales.forEach(s => {
      const monthIdx = parseInt(s.date.substring(5, 7), 10) - 1;
      if (!isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12) {
        monthlySum[monthIdx] += s.amount;
        monthlyCount[monthIdx] += 1;
      }
    });

    const monthlyAvg = monthlySum.map((val, idx) => monthlyCount[idx] > 0 ? val / monthlyCount[idx] : 0);
    
    // 1. Peak month
    let maxAvgIndex = 0;
    let maxAvgVal = 0;
    monthlyAvg.forEach((avg, idx) => {
      if (avg > maxAvgVal) {
        maxAvgVal = avg;
        maxAvgIndex = idx;
      }
    });

    // 2. Lowest month
    let minAvgIndex = 0;
    let minAvgVal = Number.MAX_VALUE;
    monthlyAvg.forEach((avg, idx) => {
      if (avg > 0 && avg < minAvgVal) {
        minAvgVal = avg;
        minAvgIndex = idx;
      }
    });

    // 3. Volatility Coefficient (Standard Deviation of non-zero entries)
    const validSalesTotals = sales.reduce((acc: Record<string, number>, cur) => {
      const key = cur.date.substring(0, 7);
      acc[key] = (acc[key] || 0) + cur.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const monthlySalesArray = Object.values(validSalesTotals) as number[];
    let volatilityLabel = "ไม่มีข้อมูลเพียงพอ";
    let cvValue = 0;

    if (monthlySalesArray.length > 1) {
      const mean = monthlySalesArray.reduce((s: number, v: number) => s + v, 0) / monthlySalesArray.length;
      const sumSqDiff = monthlySalesArray.reduce((s: number, v: number) => s + Math.pow(v - mean, 2), 0);
      const variance = sumSqDiff / (monthlySalesArray.length - 1);
      const stdDev = Math.sqrt(variance);
      cvValue = (stdDev / mean) * 100;

      if (cvValue < 15) {
        volatilityLabel = "ความผันผวนต่ำมาก (มีเสถียรภาพสม่ำเสมอเป็นเลิศ)";
      } else if (cvValue <= 30) {
        volatilityLabel = "ความผันผวนปานกลาง (มียอดสลับขึ้นลงตามฤดูกาลปกติ)";
      } else {
        volatilityLabel = "ความผันผวนสูง (ยอดแกว่งตัวกว้าง สวิงตามฤดูกาลขายหนัก)";
      }
    }

    return {
      bestMonthName: getThaiMonthName(maxAvgIndex),
      bestMonthAvg: maxAvgVal,
      worstMonthName: minAvgVal !== Number.MAX_VALUE ? getThaiMonthName(minAvgIndex) : 'N/A',
      worstMonthAvg: minAvgVal !== Number.MAX_VALUE ? minAvgVal : 0,
      volatilityLabel,
      volatilityPercent: cvValue,
      totalMonthsCount: Object.keys(validSalesTotals).length
    };
  };

  const insights = calculateInsights();

  // Export to Excel / CSV
  const handleDownloadExcel = () => {
    let csvContent = "\uFEFF"; // Byte Order Mark for Excel Thai support
    
    if (reportMode === 'stock') {
      csvContent += `ตารางวิเคราะห์เปรียบเทียบยอดขายรายเดือนในรอบปีแบบกระดานหุ้น - ${companyName}\n`;
      csvContent += `สถิติ ณ วันที่ ${new Date().toLocaleDateString('th-TH')}\n\n`;
      csvContent += "ปี พ.ศ. (ค.ศ.),ม.ค. (มกราคม),ก.พ. (กุมภาพันธ์),มี.ค. (มีนาคม),เม.ย. (เมษายน),พ.ค. (พฤษภาคม),มิ.ย. (มิถุนายน),ก.ค. (กรกฎาคม),ส.ค. (สิงหาคม),ก.ย. (กันยายน),ต.ค. (ตุลาคม),พ.ย. (พฤศจิกายน),ธ.ค. (ธันวาคม),รวมทั้งปี,เฉลี่ยต่อเดือน\n";
      
      heatmapData.forEach(yr => {
        let rowStr = `ปี พ.ศ. ${yr.thaiYear} (${yr.year})`;
        yr.monthlyDetails.forEach(m => {
          rowStr += `,${m.sales}`;
        });
        rowStr += `,${yr.annualTotal},${yr.annualAverage.toFixed(2)}\n`;
        csvContent += rowStr;
      });

      csvContent += `\nตัวบ่งชี้เสริมเชิงประสิทธิภาพกองทุน,\n`;
      csvContent += `ช่วงไฮซีซั่นเฉลี่ยดีที่สุด,${insights.bestMonthName} (ยอดเฉลี่ย ฿${Math.round(insights.bestMonthAvg).toLocaleString()})\n`;
      csvContent += `ช่วงโลว์ซีซั่นเฉลี่ยต่ำสุด,${insights.worstMonthName} (ยอดเฉลี่ย ฿${Math.round(insights.worstMonthAvg).toLocaleString()})\n`;
      csvContent += `ดัชนีเสถียรภาพความผันผวน,${insights.volatilityPercent.toFixed(2)}% (${insights.volatilityLabel})\n`;
    } else {
      // Standard Exports
      if (activeReportType === 'monthly') {
        csvContent += `รายงานยอดขายรวมรายเดือน - ${companyName}\n`;
        csvContent += `สถิติ ณ วันที่ ${new Date().toLocaleDateString('th-TH')}\n\n`;
        csvContent += "ลำดับ,ประจำเดิอน/ปี,ยอดขายรวม (บาท),จำนวนออเดอร์ (รายการ),ค่าเฉลี่ยตั๋วออเดอร์ (บาท),อัตราการเติบโต (%, MoM),จำนวนวันที่มีบันทึก\n";
        reportData.forEach((row, idx) => {
          csvContent += `${idx + 1},"${row.label}",${row.amount},${row.orderCount},${row.avgTicket.toFixed(2)},${row.growthRate.toFixed(2)}%,${row.records}\n`;
        });
        csvContent += `\nยอดขายรวมทั้งหมด,${totalReportSales} บาท\n`;
        csvContent += `ออเดอร์รวมทั้งหมด,${totalReportOrders} รายการ\n`;
        csvContent += `ค่าเฉลี่ยต่อออเดอร์ทั้งหมด,${overallAvgTicket.toFixed(2)} บาท\n`;
      } else {
        csvContent += `รายงานยอดขายรายปี - ${companyName}\n`;
        csvContent += `สถิติ ณ วันที่ ${new Date().toLocaleDateString('th-TH')}\n\n`;
        csvContent += "ลำดับ,ประจำปี พ.ศ.,ยอดขายรวม (บาท),จำนวนออเดอร์ (รายการ),ค่าเฉลี่ยตั๋วออเดอร์ (บาท),อัตราการเติบโต (%, YoY),จำนวนวันที่มีบันทึก\n";
        reportData.forEach((row, idx) => {
          csvContent += `${idx + 1},"${row.label}",${row.amount},${row.orderCount},${row.avgTicket.toFixed(2)},${row.growthRate.toFixed(2)}%,${row.records}\n`;
        });
        csvContent += `\nยอดขายรวมทั้งหมด,${totalReportSales} บาท\n`;
        csvContent += `ออเดอร์รวมทั้งหมด,${totalReportOrders} รายการ\n`;
        csvContent += `ค่าเฉลี่ยต่อออเดอร์ทั้งหมด,${overallAvgTicket.toFixed(2)} บาท\n`;
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานยอดขาย_${reportMode === 'stock' ? 'วิเคราะห์เชิงเปรียบเทียบสไตล์หุ้น' : activeReportType === 'monthly' ? 'รายเดือน' : 'รายปี'}_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF with optimized scale capture
  const handleDownloadPDF = async () => {
    const element = document.getElementById('rendered-report-print-pane');
    if (!element) return;
    setIsExporting(true);
    
    try {
      // Let layout expand fully before screenshotting
      await new Promise(resolve => setTimeout(resolve, 310));
      const canvas = await html2canvas(element, {
        scale: 2.2, // Crisp high-definition resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; // A4 width
      const pdfPageHeight = 297; // A4 height
      const imgHeightOnPdf = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeightOnPdf;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightOnPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
        heightLeft -= pdfPageHeight;
      }
      
      pdf.save(`รายงานยอดขาย_${reportMode === 'stock' ? 'ตารางหุ้นข้ามปี' : activeReportType === 'monthly' ? 'รายเดือน' : 'รายปี'}_${new Date().toISOString().substring(0,10)}.pdf`);
    } catch (err) {
      console.error('[Reports PDF Export Error]:', err);
      alert('ขอประทานอภัย เกิดปัญหาทางเทคนิคในการสร้างไฟล์เอกสาร PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  // Formatter for short compact numerical currency values like standard stock tickers
  const formatCellVal = (val: number) => {
    if (val === 0) return '-';
    if (val >= 1000000) return `฿${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `฿${(val / 1000).toFixed(0)}k`;
    return `฿${val}`;
  };

  // Cell Background Class Determination for Heatmap Values
  const getGrowthCellClasses = (percent: number | null) => {
    if (percent === null) return 'bg-slate-50 text-slate-400 border border-slate-100';
    if (percent > 15) return 'bg-emerald-600 text-white font-black shadow-xs';
    if (percent > 0) return 'bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-250';
    if (percent < -15) return 'bg-rose-600 text-white font-black shadow-xs';
    if (percent < 0) return 'bg-rose-100 text-rose-950 font-extrabold border border-rose-250';
    return 'bg-slate-100 text-slate-650 font-bold border border-slate-200';
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Navigation & Mode Selector Tabs */}
      <div className="bg-white p-2 border border-slate-200 shadow-xs rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-2 w-full md:w-auto">
          <button
            onClick={() => setReportMode('standard')}
            className={`flex-1 md:flex-none px-4.5 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer ${
              reportMode === 'standard' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-550 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📋 บัญชีและแผนภูมิมาตรฐาน (Standard Ledger)</span>
          </button>
          
          <button
            onClick={() => setReportMode('stock')}
            className={`flex-1 md:flex-none px-4.5 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer ${
              reportMode === 'stock' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-550 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>📈 กระดานเปรียบเทียบสไตล์งบหุ้น (% returns Matrix)</span>
            <span className="bg-rose-500 text-white text-[8px] px-1 rounded font-extrabold animate-pulse">New</span>
          </button>
        </div>
        
        <span className="text-[11px] text-slate-450 font-black uppercase tracking-wider hidden lg:block bg-slate-50 px-3 py-1 border border-slate-200 rounded-lg">
          โหมดรายงานขาย: {reportMode === 'standard' ? 'บัญชีสรุป' : 'สถิติตลาดทุน'}
        </span>
      </div>

      {/* Dynamic Action Buttons Toolbar */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-0.5">การออกเอกสาร (Export Center)</span>
          <p className="text-xs text-slate-600 font-semibold">ดาวน์โหลดตารางข้อมูล{reportMode === 'stock' ? 'ตารางหุ้น' : 'รายงานนี้'} ลงเครื่องคอมพิวเตอร์ของคุณในทันที</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          
          <button
            onClick={handleDownloadExcel}
            className="flex-1 sm:flex-none px-4.5 py-2.5 bg-white select-none cursor-pointer border border-slate-300 text-emerald-700 hover:text-emerald-800 rounded-2xl hover:bg-emerald-50 hover:border-emerald-300 shadow-xs transition-all text-sm font-black flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>ดาวน์โหลด CSV (Excel)</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className={`flex-1 sm:flex-none px-4.5 py-2.5 select-none cursor-pointer rounded-2xl shadow-sm text-sm font-black transition-all flex items-center justify-center gap-2 ${
              isExporting 
                ? 'bg-slate-300 border border-slate-400 text-slate-500 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:shadow-md'
            }`}
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                <span>กำลังจัดพัสดุ PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>โหลดเอกสาร PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* THE ACTUAL EXECUTIVE REPORT DRAFT PANEL (Targeted for high-def PDF capture) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div 
        id="rendered-report-print-pane" 
        className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 text-slate-800 select-text relative overflow-hidden"
      >
        {/* Print Only Elegant Watermark Design */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 text-slate-100 opacity-20 pointer-events-none text-7xl font-sans font-black select-none tracking-widest leading-none text-center uppercase">
          {companyName}<br/>OFFICIAL FINANCE REPORT
        </div>

        {/* 1. Report Corporate Header */}
        <div className="border-b-2 border-slate-200 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 px-2.5 font-black text-[10px] uppercase tracking-wider bg-blue-105 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg">
                รายงานการเงินระดับผู้บริหาร (Executive Financial Statement)
              </span>
              <span className="p-1 px-2.5 font-black text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg">
                ระบบสถิติการขายรวม
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{companyName}</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              สำนักงานและศูนย์วัตกรรมเครื่องครัวอย่างเป็นทางการ • แผนกประเมินและทิศทางทรัพยากรการคลังและการค้าร่วมพาร์ทเนอร์
            </p>
          </div>

          <div className="text-right space-y-1 font-semibold">
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">วันเวลาพิมพ์เอกสาร / Report Date</span>
            <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 block">
              {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
            </span>
            <span className="text-[10px] text-slate-450 block font-mono">Real-time Cloud Sync Database Node</span>
          </div>
        </div>

        {/* 2. Document Title and Scope banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>
                {reportMode === 'stock' 
                  ? 'กระดานความร้อนเปรียบเทียบผลต่างรายเดือนร่วมแต่ละปี (% Financial Returns Heatmap)' 
                  : `สรุปยอดขายวิเคราะห์อ้างอิงรายงวด ${activeReportType === 'monthly' ? 'รายเดือนสะสม (Consolidated Monthly)' : 'รายปีอ้างอิงเป้าหมาย (Consolidated Yearly)'}`
                }
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {reportMode === 'stock'
                ? 'ตารางบงชี้เปอร์เซ็นต์อัตราเติบโต Month-on-Month และ Year-on-Year เสมือนโครงสร้างพอร์ตโฟลิโอข้อมูลหุ้นตลาดหลักทรัพย์'
                : 'จัดทำโครงสารสมทบทิศทางผลกำไรเฉลี่ย อัตราเติบโตต่อเนื่อง และข้อสรุปสถิติจำแนกละเอียดตามปฏิทินปฏิบัติงานพนักงานถาวร'
              }
            </p>
          </div>
          <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black rounded-xl whitespace-nowrap">
            ระดับการประเมิน: ตลอดแนว (Grand Unified Verified)
          </div>
        </div>

        {/* ---------------------------------------------------------------------- */}
        {/* VIEW 1: CHRONOLOGICAL STANDARD LEDGER */}
        {/* ---------------------------------------------------------------------- */}
        {reportMode === 'standard' && (
          <div className="space-y-8">
            {/* Bento Highlights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-450 uppercase tracking-wider block">ยอดขายสะสมสุทธิ / Total Sales</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block -mb-0.5">รวมเงินสดและโอนสุทธิ</span>
                  <span className="text-2xl font-black text-slate-950 tracking-tight font-mono">
                    ฿{totalReportSales.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-450 uppercase tracking-wider block">ปริมาณรายการ / Total Orders</span>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Table className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block -mb-0.5">นับจำนวนคำสั่งซื้อรวม</span>
                  <span className="text-2xl font-black text-slate-950 tracking-tight font-mono">
                    {totalReportOrders} <span className="text-xs font-semibold text-slate-500">ออเดอร์</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-450 uppercase tracking-wider block">ราคาเฉลี่ยต่อออเดอร์ / Avg Ticket</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block -mb-0.5">Average Basket Value</span>
                  <span className="text-2xl font-black text-slate-950 tracking-tight font-mono">
                    ฿{Math.round(overallAvgTicket).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-450 uppercase tracking-wider block">ยอดขายสูงสุดในตาราง / Peak Record</span>
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block -mb-0.5" title={bestRecord?.label || ''}>
                    {bestRecord?.label || 'ไม่มีข้อมูล'}
                  </span>
                  <span className="text-xl font-black text-slate-950 tracking-tight font-mono truncate block">
                    {bestRecord ? `฿${bestRecord.amount.toLocaleString()}` : '฿0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom SVG Data Performance Chart */}
            {reportData.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      แผนภาพเปรียบเทียบยอดขายสุทธิสะสม (Sales Trajectory Graph)
                    </h4>
                    <p className="text-[10px] text-slate-450 font-bold block mt-0.5">แท่งกราฟเปรียบเทียบขนาดสถิติและลำดับความต้องการตามแกนเวลา</p>
                  </div>
                  <span className="text-[10px] text-indigo-650 font-extrabold bg-indigo-50 px-2 py-1 rounded border border-indigo-150">หน่วย: บาท (THB)</span>
                </div>

                <div className="w-full">
                  <div className="relative pt-2 h-44 flex items-end gap-2 px-4 border-b border-slate-300">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-45 py-2">
                      <span className="border-t border-slate-200 w-full text-[9px] text-slate-400 text-left pt-0.5">ยอดบนสุด</span>
                      <span className="border-t border-slate-200 w-full text-[9px] text-slate-400 text-left">50%</span>
                      <span className="w-full text-[9px] text-slate-400 text-left pb-1">ศูนย์</span>
                    </div>

                    <div className="w-full h-full flex items-end justify-around gap-4 z-10 pt-6">
                      {reportData.slice(0, 10).reverse().map((item) => {
                        const maxVal = Math.max(...reportData.map(r => r.amount), 50000);
                        const percentage = (item.amount / maxVal) * 100;
                        
                        return (
                          <div key={item.key} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-md -translate-y-2 whitespace-nowrap shadow-md z-45 pointer-events-none">
                              ฿{item.amount.toLocaleString()}
                            </div>

                            <div 
                              style={{ height: `${Math.max(percentage, 8)}%` }}
                              className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 transition-all to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 relative shadow-inner min-h-[30px]"
                            >
                              <div className="absolute top-1 left-0 right-0 text-center text-white/90 text-[8px] font-black font-mono overflow-hidden">
                                ฿{Math.round(item.amount / 1000)}k
                              </div>
                            </div>

                            <span className="text-[10px] text-slate-600 font-bold tracking-tight text-center mt-2.5 truncate max-w-[90px] block" title={item.label}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Ledger Table Section */}
            <div className="space-y-3 relative z-10">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Table className="w-4 h-4 text-indigo-500" />
                ตารางสรุปรายงานทางการเงินแยกตามแง่มุมงวดหลัก ({activeReportType === 'monthly' ? 'Monthly Standard Statements' : 'Yearly Financial Records'})
              </h4>

              <div className="overflow-hidden border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-550 tracking-wider">
                      <th className="py-3 px-5">ลำดับ (No.)</th>
                      <th className="py-3 px-5">ประจำงวด / รอบบัญชี</th>
                      <th className="py-3 px-5 text-right">ยอดขายรวม (บาท)</th>
                      <th className="py-3 px-5 text-right">จำนวนคิวงานออเดอร์</th>
                      <th className="py-3 px-5 text-right">ยอดเฉลี่ยพัสดุตระกร้า</th>
                      <th className="py-3 px-5 text-center">การเติบโตสะสม %</th>
                      <th className="py-3 px-5 text-center">วันที่มีการบันทึกค้าขาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {reportData.map((row, index) => {
                      const hasGrown = row.growthRate >= 0;
                      return (
                        <tr key={row.key} className="hover:bg-slate-50/75 transition-colors">
                          <td className="py-3 px-5 font-mono text-slate-400 font-bold">
                            {(index + 1).toString().padStart(2, '0')}
                          </td>

                          <td className="py-3 px-5 font-black text-slate-900 font-sans">
                            {row.label}
                          </td>

                          <td className="py-3 px-5 text-right font-bold text-slate-950 font-mono">
                            ฿{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-5 text-right font-semibold text-slate-800 font-mono">
                            {row.orderCount.toLocaleString()} รายการ
                          </td>

                          <td className="py-3 px-5 text-right font-medium text-slate-600 font-mono">
                            ฿{row.avgTicket.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 animate-fadeIn">
                              {index === reportData.length - 1 ? (
                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  หลักแรกเริ่ม
                                </span>
                              ) : (
                                <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-black border ${
                                  hasGrown 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {hasGrown ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                  <span>{hasGrown ? '+' : ''}{row.growthRate.toFixed(2)}%</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-5 text-center text-slate-500 font-bold font-mono">
                            {row.records} วันที่รายงาน
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-100/60 font-black text-slate-900 border-t border-slate-200">
                      <td className="py-3.5 px-5 text-center" colSpan={2}>
                        สรุปยอดสุทธิ (Consolidated Net)
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-blue-700 text-sm">
                        ฿{totalReportSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono">
                        {totalReportOrders.toLocaleString()} รายการ
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono" colSpan={3}>
                        เฉลี่ย ฿{Math.round(overallAvgTicket).toLocaleString()} / บิล
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------- */}
        {/* VIEW 2: FINANCIAL RETURNS MATRICES (STOCK MARKET HEATMAP STYLE) */}
        {/* ---------------------------------------------------------------------- */}
        {reportMode === 'stock' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Heatmap interactive controls inside the printable zone (useful decoration) */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">การแสดงผลกระดานหุ้น (Performance Grid Controls)</span>
                
                {/* Metric Select Buttons */}
                <div className="bg-slate-200/50 p-1 rounded-xl flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setHeatmapMetric('sales')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all select-none cursor-pointer ${
                      heatmapMetric === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    💰 ยอดขายจริง (Sales)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapMetric('mom')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all select-none cursor-pointer ${
                      heatmapMetric === 'mom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    🔄 เติบโต % MoM
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapMetric('yoy')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all select-none cursor-pointer ${
                      heatmapMetric === 'yoy' ? 'bg-white text-blue-650 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    📈 เติบโต % YoY
                  </button>
                </div>
              </div>

              {/* Color guide */}
              <div className="space-y-2.5">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">สัญลักษณ์ความร้อน (Color Metric Scale)</span>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-505">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-emerald-600 block shadow-xs" />
                    <span>เกรดเอ (&gt;+15%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-emerald-100 block border border-emerald-250" />
                    <span>เป็นบวก (0% ~ 15%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-slate-100 block border border-slate-200" />
                    <span>ศูนย์/คงที่</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-rose-100 block border border-rose-250" />
                    <span>ติดลบ (&lt;0%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-rose-600 block shadow-xs" />
                    <span>ลบหนัก (&lt;-15%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloomberg Terminal Style Stock Grid Table */}
            <div className="relative z-10 border border-slate-200 rounded-2.5xl overflow-hidden bg-white shadow-xs max-w-full overflow-x-auto">
              <table className="w-full text-center border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase border-b border-slate-800">
                    <th className="py-4.5 px-3 text-left pl-5 sticky left-0 bg-slate-900 z-10 shadow-md">ปี พ.ศ. (ค.ศ.)</th>
                    <th className="py-4.5 px-2 font-black">ม.ค. (Jan)</th>
                    <th className="py-4.5 px-2 font-black">ก.พ. (Feb)</th>
                    <th className="py-4.5 px-2 font-black">มี.ค. (Mar)</th>
                    <th className="py-4.5 px-2 font-black">เม.ย. (Apr)</th>
                    <th className="py-4.5 px-2 font-black">พ.ค. (May)</th>
                    <th className="py-4.5 px-2 font-black">มิ.ย. (Jun)</th>
                    <th className="py-4.5 px-2 font-black">ก.ค. (Jul)</th>
                    <th className="py-4.5 px-2 font-black">ส.ค. (Aug)</th>
                    <th className="py-4.5 px-2 font-black">ก.ย. (Sep)</th>
                    <th className="py-4.5 px-2 font-black">ต.ค. (Oct)</th>
                    <th className="py-4.5 px-2 font-black">พ.ย. (Nov)</th>
                    <th className="py-4.5 px-2 font-black">ธ.ค. (Dec)</th>
                    <th className="py-4.5 px-3 font-black bg-slate-800 text-slate-100 pr-5">ยอดรวมทั้งปี (Annual)</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-200 font-bold">
                  {heatmapData.map((yr) => {
                    return (
                      <tr key={yr.year} className="hover:bg-slate-50 transition-colors">
                        {/* Year head sticky */}
                        <td className="py-4.5 px-4 text-left pl-5 font-black text-slate-900 bg-slate-50/90 border-r border-slate-200 sticky left-0 z-10 shadow-xs">
                          {yr.thaiYear} <span className="text-[10px] text-slate-400 font-bold font-mono">({yr.year})</span>
                        </td>

                        {/* Month columns */}
                        {yr.monthlyDetails.map((m) => {
                          let displayValue = '-';
                          let scoreForColoring: number | null = null;
                          
                          // Evaluate what score defines cell background
                          if (heatmapMetric === 'sales') {
                            displayValue = m.sales > 0 ? formatCellVal(m.sales) : '-';
                            scoreForColoring = m.yoyGrowth; // Color cells according to YoY same-month percentage
                          } else if (heatmapMetric === 'mom') {
                            displayValue = m.momGrowth !== null ? `${m.momGrowth >= 0 ? '+' : ''}${m.momGrowth.toFixed(1)}%` : '-';
                            scoreForColoring = m.momGrowth;
                          } else if (heatmapMetric === 'yoy') {
                            displayValue = m.yoyGrowth !== null ? `${m.yoyGrowth >= 0 ? '+' : ''}${m.yoyGrowth.toFixed(1)}%` : '-';
                            scoreForColoring = m.yoyGrowth;
                          }

                          return (
                            <td 
                              key={m.month} 
                              className={`py-4 px-2 transition-all relative group cursor-help`}
                            >
                              <div className={`mx-auto w-14.5 h-10 flex flex-col justify-center items-center rounded-xl transition-all shadow-2xs ${getGrowthCellClasses(scoreForColoring)}`}>
                                <span className="text-[10px] tracking-tight">{displayValue}</span>
                                
                                {/* Micro visual bar representing value load */}
                                {m.sales > 0 && heatmapMetric !== 'sales' && (
                                  <span className="text-[7.5px] opacity-75 font-mono leading-none block -mt-0.5">
                                    {formatCellVal(m.sales)}
                                  </span>
                                )}
                              </div>

                              {/* Rich financial tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col bg-slate-950 text-white rounded-xl p-3 shadow-xl border border-slate-800 z-50 text-[10px] w-48 text-left leading-normal font-sans tracking-wide">
                                <span className="font-extrabold text-blue-400 border-b border-slate-800 pb-1 mb-1 block">รอบสถิติ: {m.monthName} {yr.thaiYear}</span>
                                <span>💰 ยอดขายสุทธิ: <strong className="font-mono text-white">฿{m.sales.toLocaleString()}</strong></span>
                                <span className="block mt-0.5">🔄 อัตรา MoM: <strong className={`font-mono ${m.momGrowth !== null && m.momGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{m.momGrowth !== null ? `${m.momGrowth >= 0 ? '+' : ''}${m.momGrowth.toFixed(2)}%` : 'ไม่มีตัวเปรียบ'}</strong></span>
                                <span className="block mt-0.5">📈 อัตรา YoY: <strong className={`font-mono ${m.yoyGrowth !== null && m.yoyGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{m.yoyGrowth !== null ? `${m.yoyGrowth >= 0 ? '+' : ''}${m.yoyGrowth.toFixed(2)}%` : 'ยศฐานปีแรกเริ่ม'}</strong></span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Annual Sum column */}
                        <td className="py-4.5 px-3 bg-slate-900 border-l border-slate-800 sticky right-0 z-10 text-right pr-5 text-slate-100 font-mono tracking-tight font-black text-sm">
                          ฿{yr.annualTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bloomberg style corporate smart financial analytics insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
              
              <div className="bg-slate-950 text-white p-5 rounded-2.5xl border border-slate-800 flex flex-col justify-between space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">วิเคราะห์ฤดูกาลทอง (Seasonal Peak Season Index)</span>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-semibold">เดือนที่มีผลกำไรเฉลี่ยโดดเด่นสะสมสูงสุดข้ามปี:</span>
                  <span className="text-lg font-black text-white tracking-tight">{insights.bestMonthName}</span>
                </div>
                <div className="text-[11px] text-slate-300 font-semibold leading-relaxed pt-1.5 border-t border-slate-900 bg-slate-900/30 p-2 rounded-xl">
                  ยอดขายเฉลี่ยรายปีช่วงงวดเดือนนี้ดีดตัวแตะ <strong className="text-emerald-400 text-xs font-mono">฿{Math.round(insights.bestMonthAvg).toLocaleString()}</strong> เหมาะสำหรับอัดงบโฆษณาซื้อแคมเปญ
                </div>
              </div>

              <div className="bg-slate-950 text-white p-5 rounded-2.5xl border border-slate-800 flex flex-col justify-between space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">ดัชนีภาพรวมความผันผวน (Flow Volatility Coefficient)</span>
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-semibold">สัมประสิทธิ์การแกว่งตัวของเงินสดรายเดือน:</span>
                  <span className="text-base font-black text-white tracking-tight">{insights.volatilityPercent.toFixed(2)}%</span>
                  <p className="text-[10px] text-slate-400 font-bold block">{insights.volatilityLabel}</p>
                </div>
                <div className="text-[11px] text-slate-300 font-semibold leading-relaxed pt-1.5 border-t border-slate-900 bg-slate-900/30 p-2 rounded-xl">
                  {insights.volatilityPercent < 20 
                    ? 'โครงสร้างยอดขายค่อนข้างมั่นคงและมีผลิตภัณฑ์เป็นฐานซื้อซ้ำอย่างสมบูรณ์แบบ แผนจัดซื้อมีความเสี่ยงต่ำ' 
                    : 'อุตสาหกรรมในเครือเซนซิทีฟต่อเทศกาล ควรสำรองเงินคลังสำรองเพื่อรองรับการขาดทุนสะสมช่วงพักตัวในงวดถัดไป'
                  }
                </div>
              </div>

              <div className="bg-slate-950 text-white p-5 rounded-2.5xl border border-slate-800 flex flex-col justify-between space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">สถิติความเงียบสงบ (Cycle Minimum Season)</span>
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-semibold">เดือนที่มียอดซื้อพักตัวต่ำที่สุด:</span>
                  <span className="text-lg font-black text-rose-450 tracking-tight">{insights.worstMonthName}</span>
                </div>
                <div className="text-[11px] text-slate-300 font-semibold leading-relaxed pt-1.5 border-t border-slate-900 bg-slate-900/30 p-2 rounded-xl">
                  งวดในเดือนนี้ลดต่ำลงเหลือเฉลี่ย <strong className="text-rose-400 text-xs font-mono">฿{Math.round(insights.worstMonthAvg).toLocaleString()}</strong> เหมาะสมสำหรับทำสต็อกลดเคลียร์ สินค้าตกทอดจัดมุมล้างคลัง
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 6. Corporate Signature and Signoff Fields */}
        <div className="pt-8 border-t border-slate-150 grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
          <div className="text-left space-y-1.5 font-semibold">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">เทคโนโลยีและโครงข่ายร่วม / Verification Center</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Cloud className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>ซิงค์ระบบคลาวด์ร่วม Google Firebase Firestore ประสิทธิภาพคงเหลือระดับมิลลิวินาที</span>
            </div>
            <p className="text-[9.5px] text-slate-450 font-bold leading-relaxed">
              สถิติผ่านการประเมินและดึงข้อมูลอัพเดทสุ่มผ่านกุญแจ API ความปลอดภัยระดับสูงของบริษัททรานสปอร์ต
            </p>
          </div>

          <div className="text-right flex flex-col items-end justify-end">
            <div className="w-64 text-center space-y-4">
              <div className="border-b border-slate-350 h-8 flex items-end justify-center">
                <span className="text-xs font-serif italic text-slate-500 select-none">ระบบคอมพิวเตอร์และคณะกรรมการกลาง</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">ตราประทับผู้บริหารและพาร์ทเนอร์</span>
                <span className="text-xs font-black text-slate-850 tracking-tight block">คุณอภิวัฒน์ เกียรติสกุล (คลังอาหารกลาง)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
