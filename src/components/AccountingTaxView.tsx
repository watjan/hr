import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCheck, 
  FileText, 
  CheckCircle, 
  Calendar, 
  Building2, 
  Users, 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  Printer, 
  Download, 
  RefreshCw, 
  User, 
  Hash, 
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { EmployeeSalary, Department } from '../types';

interface AccountingTaxViewProps {
  employees: EmployeeSalary[];
  departments: Department[];
  mode?: 'summary' | 'detail' | 'transfer';
}

export interface TaxSubmission {
  id: string; // e.g. "2026_6"
  year: number;
  month: number;
  submittedAt: string;
  submittedBy: string;
  receiptNo: string;
  referenceNo: string;
  totalEmployees: number;
  totalSalary: number;
  totalTax: number;
  totalSso: number;
  taxFilingType: 'normal' | 'additional'; // ยื่นปกติ / ยื่นเพิ่มเติม
  status: 'submitted' | 'draft' | 'pending';
}

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function AccountingTaxView({ employees, departments, mode = 'summary' }: AccountingTaxViewProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [submissions, setSubmissions] = useState<TaxSubmission[]>(() => {
    const saved = localStorage.getItem('sapphire_tax_submissions');
    try {
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading tax submissions', e);
    }
    
    // Default initial submissions data for 2026 showing months prior to current (Jan - May)
    return [
      {
        id: '2026_1',
        year: 2026,
        month: 1,
        submittedAt: '2569-02-05 10:30',
        submittedBy: 'อาภิวัฒน์ บัญชี',
        receiptNo: 'REC-256901-0498',
        referenceNo: 'TX-REF-14930284',
        totalEmployees: 5,
        totalSalary: 145000,
        totalTax: 4350,
        totalSso: 3750,
        taxFilingType: 'normal',
        status: 'submitted'
      },
      {
        id: '2026_2',
        year: 2026,
        month: 2,
        submittedAt: '2569-03-04 14:15',
        submittedBy: 'อาภิวัฒน์ บัญชี',
        receiptNo: 'REC-256902-0941',
        referenceNo: 'TX-REF-18540921',
        totalEmployees: 5,
        totalSalary: 145000,
        totalTax: 4350,
        totalSso: 3750,
        taxFilingType: 'normal',
        status: 'submitted'
      },
      {
        id: '2026_3',
        year: 2026,
        month: 3,
        submittedAt: '2569-04-05 09:40',
        submittedBy: 'อาภิวัฒน์ บัญชี',
        receiptNo: 'REC-256903-1203',
        referenceNo: 'TX-REF-23094851',
        totalEmployees: 6,
        totalSalary: 180000,
        totalTax: 5400,
        totalSso: 4500,
        taxFilingType: 'normal',
        status: 'submitted'
      },
      {
        id: '2026_4',
        year: 2026,
        month: 4,
        submittedAt: '2569-05-06 11:12',
        submittedBy: 'อาภิวัฒน์ บัญชี',
        receiptNo: 'REC-256904-2034',
        referenceNo: 'TX-REF-39485091',
        totalEmployees: 6,
        totalSalary: 180000,
        totalTax: 5400,
        totalSso: 4500,
        taxFilingType: 'normal',
        status: 'submitted'
      },
      {
        id: '2026_5',
        year: 2026,
        month: 5,
        submittedAt: '2569-06-03 15:55',
        submittedBy: 'อาภิวัฒน์ บัญชี',
        receiptNo: 'REC-256905-3498',
        referenceNo: 'TX-REF-45903284',
        totalEmployees: 7,
        totalSalary: 215000,
        totalTax: 6450,
        totalSso: 5250,
        taxFilingType: 'normal',
        status: 'submitted'
      }
    ];
  });

  const [activeSubmission, setActiveSubmission] = useState<TaxSubmission | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [modalMonth, setModalMonth] = useState<number>(6);
  const [modalReportType, setModalReportType] = useState<'normal' | 'additional'>('normal');
  const [modalSubmitter, setModalSubmitter] = useState('อาภิวัฒน์ บัญชี');
  const [modalFlatTaxRate, setModalFlatTaxRate] = useState<number>(3); // default 3% flat withholding tax to represent realistic Thai holding taxation code

  // Load actual payroll registers to compute real amounts
  const [payrollRegistries, setPayrollRegistries] = useState<Record<string, any>>(() => {
    try {
      const raw = localStorage.getItem('sapphire_payroll_registries');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<number>(0);
  const [filterDept, setFilterDept] = useState<string>('all');

  // Standalone individual details state for 1.1 - decoupled from original employees
  const [individualDetails, setIndividualDetails] = useState<any[]>(() => {
    const saved = localStorage.getItem('sapphire_individual_tax_details');
    try {
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing individual details', e);
    }

    let items: any[] = [];
    const defaults = [
      { id: '2026_1', year: 2026, month: 1, receiptNo: 'REC-256901-0498', referenceNo: 'TX-REF-14930284', submittedAt: '2569-02-05 10:30', submittedBy: 'อาภิวัฒน์ บัญชี', sCount: 5 },
      { id: '2026_2', year: 2026, month: 2, receiptNo: 'REC-256902-0941', referenceNo: 'TX-REF-18540921', submittedAt: '2569-03-04 14:15', submittedBy: 'อาภิวัฒน์ บัญชี', sCount: 5 },
      { id: '2026_3', year: 2026, month: 3, receiptNo: 'REC-256903-1203', referenceNo: 'TX-REF-23094851', submittedAt: '2569-04-05 09:40', submittedBy: 'อาภิวัฒน์ บัญชี', sCount: 6 },
      { id: '2026_4', year: 2026, month: 4, receiptNo: 'REC-256904-2034', referenceNo: 'TX-REF-39485091', submittedAt: '2569-05-06 11:12', submittedBy: 'อาภิวัฒน์ บัญชี', sCount: 6 },
      { id: '2026_5', year: 2026, month: 5, receiptNo: 'REC-256905-3498', referenceNo: 'TX-REF-45903284', submittedAt: '2569-06-03 15:55', submittedBy: 'อาภิวัฒน์ บัญชี', sCount: 7 }
    ];

    const names = ['สมชาย ใจดี', 'สมหญิง รักชาติ', 'วิชัย ปัญญา', 'นารี อ่อนหวาน', 'ประพันธ์ ดวงศิลป์', 'จันทร์ เจ้าเล่ห์', 'เกียรติ ยศรุ่ง'];
    const positions = ['เจ้าหน้าที่บริหารงานทั่วไป', 'นักการตลาดดิจิทัล', 'หัวหน้าแผนกพัฒนาเทคโนโลยี', 'เจ้าหน้าที่ฝ่ายบัญชี', 'ที่ปรึกษากลยุทธ์ธุรกิจ', 'ผู้จัดการฝ่ายปฏิบัติการ', 'พนักงานอาวุโส'];

    defaults.forEach(sub => {
      for (let i = 0; i < sub.sCount; i++) {
        const salary = 25000 + (i * 3000);
        const tax = Math.round(salary * 0.03);
        const sso = Math.min(750, Math.round(salary * 0.05));
        
        items.push({
          id: `manual_${sub.id}_${i}_${Math.floor(1000 + Math.random() * 9000)}`,
          year: sub.year,
          month: sub.month,
          monthName: THAI_MONTHS_FULL[sub.month - 1],
          receiptNo: sub.receiptNo,
          referenceNo: sub.referenceNo,
          name: names[i % names.length],
          position: positions[i % positions.length],
          salary,
          tax,
          sso,
          submittedAt: sub.submittedAt,
          submittedBy: sub.submittedBy,
          taxFilingType: 'normal',
          transferStatus: 'complete',
          transferDate: sub.submittedAt.split(' ')[0],
          bankName: 'ธนาคารกสิกรไทย',
          bankAccount: `020-2-34918-${i}`,
          remark: 'บันทึกโอนเงินส่งอากรและประกันสังคมเสร็จสิ้น'
        });
      }
    });

    return items;
  });

  const handleSaveIndividualDetails = (newDetails: any[]) => {
    setIndividualDetails(newDetails);
    localStorage.setItem('sapphire_individual_tax_details', JSON.stringify(newDetails));
    window.dispatchEvent(new Event('sapphire_storage_updated'));
  };

  // Add/Edit manual record states:
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [showAddManualRecordModal, setShowAddManualRecordModal] = useState(false);

  // Form payload states
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formSalary, setFormSalary] = useState<number>(30000);
  const [formTax, setFormTax] = useState<number>(900);
  const [formSso, setFormSso] = useState<number>(750);
  const [formMonth, setFormMonth] = useState<number>(6);
  const [formYear, setFormYear] = useState<number>(2026);
  const [formReceiptNo, setFormReceiptNo] = useState('');
  const [formReferenceNo, setFormReferenceNo] = useState('');
  const [formFilingType, setFormFilingType] = useState<'normal' | 'additional'>('normal');
  const [formTransferStatus, setFormTransferStatus] = useState<'complete' | 'pending'>('complete');
  const [formTransferDate, setFormTransferDate] = useState(new Date().toISOString().substring(0, 10));
  const [formBankName, setFormBankName] = useState('ธนาคารกสิกรไทย');
  const [formBankAccount, setFormBankAccount] = useState('020-2-34918-1');
  const [formRemark, setFormRemark] = useState('');

  // 1.2 State for direct bank transfers to Revenue Department and Social Security Office
  const [taxTransfers, setTaxTransfers] = useState<any[]>(() => {
    const saved = localStorage.getItem('sapphire_tax_transfers');
    try {
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading tax transfers', e);
    }
    
    // Default pre-population representing the history of Jan - May 2026
    return [
      { id: 'tx_2026_1_tax', year: 2026, month: 1, type: 'tax', amount: 4350, status: 'success', transferredAt: '2569-02-07 10:45', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-928104', recipient: 'กรมสรรพากร (เลขบัญชี: 006-1-08491-0)', receiptNo: 'REC-256901-0498' },
      { id: 'tx_2026_1_sso', year: 2026, month: 1, type: 'sso', amount: 3750, status: 'success', transferredAt: '2569-02-07 10:48', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-928105', recipient: 'สำนักงานประกันสังคม (เลขบัญชี: 006-1-09591-1)', receiptNo: 'SSO-REC-256901-0499' },
      
      { id: 'tx_2026_2_tax', year: 2026, month: 2, type: 'tax', amount: 4350, status: 'success', transferredAt: '2569-03-07 11:20', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-941824', recipient: 'กรมสรรพากร (เลขบัญชี: 006-1-08491-0)', receiptNo: 'REC-256902-0941' },
      { id: 'tx_2026_2_sso', year: 2026, month: 2, type: 'sso', amount: 3750, status: 'success', transferredAt: '2569-03-07 11:25', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-941825', recipient: 'สำนักงานประกันสังคม (เลขบัญชี: 006-1-09591-1)', receiptNo: 'SSO-REC-256902-0942' },
      
      { id: 'tx_2026_3_tax', year: 2026, month: 3, type: 'tax', amount: 5400, status: 'success', transferredAt: '2569-04-07 09:15', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-104928', recipient: 'กรมสรรพากร (เลขบัญชี: 006-1-08491-0)', receiptNo: 'REC-256903-1203' },
      { id: 'tx_2026_3_sso', year: 2026, month: 3, type: 'sso', amount: 4500, status: 'success', transferredAt: '2569-04-07 09:20', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-104929', recipient: 'สำนักงานประกันสังคม (เลขบัญชี: 006-1-09591-1)', receiptNo: 'SSO-REC-256903-1204' },
      
      { id: 'tx_2026_4_tax', year: 2026, month: 4, type: 'tax', amount: 5400, status: 'success', transferredAt: '2569-05-08 15:30', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-302914', recipient: 'กรมสรรพากร (เลขบัญชี: 006-1-08491-0)', receiptNo: 'REC-256904-2034' },
      { id: 'tx_2026_4_sso', year: 2026, month: 4, type: 'sso', amount: 4500, status: 'success', transferredAt: '2569-05-08 15:35', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-302915', recipient: 'สำนักงานประกันสังคม (เลขบัญชี: 006-1-09591-1)', receiptNo: 'SSO-REC-256904-2035' },
      
      { id: 'tx_2026_5_tax', year: 2026, month: 5, type: 'tax', amount: 6450, status: 'success', transferredAt: '2569-06-05 10:15', transferredBy: 'อาภิวัฒน์ บัญชี', payerBank: 'ธนาคารกสิกรไทย', payerAccount: '020-2-34918-1', transferTxId: 'KBK-TX-418293', recipient: 'กรมสรรพากร (เลขบัญชี: 006-1-08491-0)', receiptNo: 'REC-256905-3498' },
      { id: 'tx_2026_5_sso', year: 2026, month: 5, type: 'sso', amount: 5250, status: 'pending', transferredAt: '', transferredBy: '', payerBank: '', payerAccount: '', transferTxId: '', recipient: 'สำนักงานประกันสังคม (เลขบัญชี: 006-1-09591-1)', receiptNo: '' }
    ];
  });

  const handleSaveTaxTransfers = (newTransfers: any[]) => {
    setTaxTransfers(newTransfers);
    localStorage.setItem('sapphire_tax_transfers', JSON.stringify(newTransfers));
    window.dispatchEvent(new Event('sapphire_storage_updated'));
  };

  // State to execute direct transfer modal & visual sync simulation
  const [activeTransferToExecute, setActiveTransferToExecute] = useState<any | null>(null);
  const [formPayerBank, setFormPayerBank] = useState('ธนาคารกสิกรไทย');
  const [formPayerAccount, setFormPayerAccount] = useState('020-2-34918-1');
  const [formTransferTxId, setFormTransferTxId] = useState('');
  const [formTransferDateVal, setFormTransferDateVal] = useState(new Date().toISOString().substring(0, 10));
  const [isSyncingDirectAPI, setIsSyncingDirectAPI] = useState(false);
  const [selectedTransferStatusFilter, setSelectedTransferStatusFilter] = useState<'all' | 'pending' | 'success'>('all');
  const [selectedTransferSlip, setSelectedTransferSlip] = useState<any | null>(null);

  // 1.2 Edit / Create Custom Direct Payment states
  const [activeTransferToEdit, setActiveTransferToEdit] = useState<any | null>(null);
  const [editTxAmount, setEditTxAmount] = useState<number>(0);
  const [editTxRecipient, setEditTxRecipient] = useState<string>('');
  const [editTxStatus, setEditTxStatus] = useState<'pending' | 'success'>('pending');
  const [editTxTransferredAt, setEditTxTransferredAt] = useState<string>('');
  const [editTxTransferredBy, setEditTxTransferredBy] = useState<string>('');
  const [editTxPayerBank, setEditTxPayerBank] = useState<string>('');
  const [editTxPayerAccount, setEditTxPayerAccount] = useState<string>('');
  const [editTxTransferTxId, setEditTxTransferTxId] = useState<string>('');
  const [editTxReceiptNo, setEditTxReceiptNo] = useState<string>('');
  const [editTxMonth, setEditTxMonth] = useState<number>(1);
  const [editTxYear, setEditTxYear] = useState<number>(2026);
  const [editTxType, setEditTxType] = useState<'tax' | 'sso'>('tax');
  const [isEditingNew, setIsEditingNew] = useState<boolean>(false);

  // Re-read when other tabs store data
  useEffect(() => {
    const handleStorageUpdated = () => {
      const raw = localStorage.getItem('sapphire_payroll_registries');
      const rawSubs = localStorage.getItem('sapphire_tax_submissions');
      const rawIndivs = localStorage.getItem('sapphire_individual_tax_details');
      const rawTrans = localStorage.getItem('sapphire_tax_transfers');
      try {
        if (raw) setPayrollRegistries(JSON.parse(raw));
        if (rawSubs) setSubmissions(JSON.parse(rawSubs));
        if (rawIndivs) setIndividualDetails(JSON.parse(rawIndivs));
        if (rawTrans) setTaxTransfers(JSON.parse(rawTrans));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('sapphire_storage_updated', handleStorageUpdated);
    return () => window.removeEventListener('sapphire_storage_updated', handleStorageUpdated);
  }, []);

  const handleOpenEditTransferModal = (tx: any) => {
    setActiveTransferToEdit(tx);
    setIsEditingNew(false);
    setEditTxAmount(tx.amount || 0);
    setEditTxRecipient(tx.recipient || '');
    setEditTxStatus(tx.status || 'pending');
    setEditTxTransferredAt(tx.transferredAt || '');
    setEditTxTransferredBy(tx.transferredBy || '');
    setEditTxPayerBank(tx.payerBank || 'ธนาคารกสิกรไทย (บัญชีบริษัท 020-2-34918-1)');
    setEditTxPayerAccount(tx.payerAccount || '020-2-34918-1');
    setEditTxTransferTxId(tx.transferTxId || '');
    setEditTxReceiptNo(tx.receiptNo || '');
    setEditTxMonth(tx.month || 1);
    setEditTxYear(tx.year || selectedYear);
    setEditTxType(tx.type || 'tax');
  };

  const handleOpenAddTransferModal = () => {
    const tempId = `tx_new_${Date.now()}`;
    setActiveTransferToEdit({ id: tempId });
    setIsEditingNew(true);
    setEditTxAmount(0);
    setEditTxRecipient('กรมสรรพากร (เลขบัญชี: 006-1-08491-0)');
    setEditTxStatus('pending');
    setEditTxTransferredAt('');
    setEditTxTransferredBy('อาภิวัฒน์ บัญชี');
    setEditTxPayerBank('ธนาคารกสิกรไทย');
    setEditTxPayerAccount('020-2-34918-1');
    setEditTxTransferTxId('');
    setEditTxReceiptNo('');
    setEditTxMonth(6); // Default June
    setEditTxYear(selectedYear);
    setEditTxType('tax');
  };

  const handleSaveTransferRecord = () => {
    if (!activeTransferToEdit) return;

    if (editTxAmount <= 0) {
      alert('⚠️ กรุณาระบุยอดเงินตัดจ่ายที่ถูกต้อง (มากกว่า 0 บาท)');
      return;
    }
    if (!editTxRecipient.trim()) {
      alert('⚠️ กรุณาระบุปลายทางผู้รับประโยชน์');
      return;
    }

    let updatedTransfers;
    const newRecord = {
      id: activeTransferToEdit.id,
      year: editTxYear,
      month: editTxMonth,
      type: editTxType,
      amount: editTxAmount,
      status: editTxStatus,
      transferredAt: editTxStatus === 'success' ? (editTxTransferredAt || `${editTxYear + 543}-${editTxMonth.toString().padStart(2, '0')}-05 10:00 น.`) : '',
      transferredBy: editTxStatus === 'success' ? (editTxTransferredBy || 'อาภิวัฒน์ บัญชี (ระบบโอนตรงผ่าน Direct API)') : '',
      payerBank: editTxStatus === 'success' ? editTxPayerBank : '',
      payerAccount: editTxStatus === 'success' ? editTxPayerAccount : '',
      transferTxId: editTxStatus === 'success' ? (editTxTransferTxId || `KBK-TX-${Math.floor(100000 + Math.random() * 899999)}`) : '',
      recipient: editTxRecipient,
      receiptNo: editTxReceiptNo || (editTxStatus === 'success' ? `REC-${editTxYear + 543}${editTxMonth.toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}` : '')
    };

    if (isEditingNew) {
      updatedTransfers = [...taxTransfers, newRecord];
    } else {
      updatedTransfers = taxTransfers.map(tx => tx.id === activeTransferToEdit.id ? newRecord : tx);
    }

    handleSaveTaxTransfers(updatedTransfers);
    setActiveTransferToEdit(null);
    alert('🎉 บันทึกข้อมูลรายงานโอนเงินส่งหน่วยงานราชการเรียบร้อยแล้ว');
  };

  const handleDeleteTransferRecord = (id: string) => {
    if (window.confirm('❓ คุณยืนยันที่จะลบรายการธุรกรรมโอนเงินนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      const updatedTransfers = taxTransfers.filter(tx => tx.id !== id);
      handleSaveTaxTransfers(updatedTransfers);
      setActiveTransferToEdit(null);
      alert('🗑️ ลบรายการธุรกรรมเรียบร้อยแล้ว');
    }
  };

  const handleOpenAddRecordModal = () => {
    setEditingRecord(null);
    setFormName('');
    setFormPosition('เจ้าหน้าที่ทั่วไป');
    setFormSalary(28000);
    setFormTax(840);
    setFormSso(750);
    setFormMonth(new Date().getMonth() + 1);
    setFormYear(selectedYear);
    setFormReceiptNo(`REC-${selectedYear + 543}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormReferenceNo(`TX-REF-${Math.floor(10000000 + Math.random() * 89999999)}`);
    setFormFilingType('normal');
    setFormTransferStatus('complete');
    setFormTransferDate(new Date().toISOString().substring(0, 10));
    setFormBankName('ธนาคารกสิกรไทย');
    setFormBankAccount('020-2-34918-1');
    setFormRemark('ป้อนข้อมูลแมนนวลสำหรับรายการจ่ายโอนเงินและรายงานส่งแยกอิสระ');
    setShowAddManualRecordModal(true);
  };

  const handleOpenEditRecordModal = (item: any) => {
    setEditingRecord(item);
    setFormName(item.name);
    setFormPosition(item.position || '');
    setFormSalary(item.salary || 0);
    setFormTax(item.tax || 0);
    setFormSso(item.sso || 0);
    setFormMonth(item.month || 6);
    setFormYear(item.year || 2026);
    setFormReceiptNo(item.receiptNo || '');
    setFormReferenceNo(item.referenceNo || '');
    setFormFilingType(item.taxFilingType || 'normal');
    setFormTransferStatus(item.transferStatus || 'complete');
    setFormTransferDate(item.transferDate || new Date().toISOString().substring(0, 10));
    setFormBankName(item.bankName || 'ธนาคารกสิกรไทย');
    setFormBankAccount(item.bankAccount || '');
    setFormRemark(item.remark || '');
    setShowAddManualRecordModal(true);
  };

  const handleSaveManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('กรุณากรอกชื่อผู้รับเงิน/เสียภาษี');
      return;
    }

    if (editingRecord) {
      const updatedList = individualDetails.map(item => {
        if (item.id === editingRecord.id) {
          return {
            ...item,
            name: formName,
            position: formPosition,
            salary: Number(formSalary),
            tax: Number(formTax),
            sso: Number(formSso),
            month: Number(formMonth),
            year: Number(formYear),
            monthName: THAI_MONTHS_FULL[Number(formMonth) - 1],
            receiptNo: formReceiptNo,
            referenceNo: formReferenceNo,
            taxFilingType: formFilingType,
            transferStatus: formTransferStatus,
            transferDate: formTransferDate,
            bankName: formBankName,
            bankAccount: formBankAccount,
            remark: formRemark
          };
        }
        return item;
      });
      handleSaveIndividualDetails(updatedList);
    } else {
      const gReceiptNo = formReceiptNo || `REC-${formYear + 543}${String(formMonth).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const gReferenceNo = formReferenceNo || `TX-REF-${Math.floor(10000000 + Math.random() * 89999999)}`;
      const newRecord = {
        id: `manual_new_${Math.floor(100000 + Math.random() * 900000)}`,
        name: formName,
        position: formPosition,
        salary: Number(formSalary),
        tax: Number(formTax),
        sso: Number(formSso),
        month: Number(formMonth),
        year: Number(formYear),
        monthName: THAI_MONTHS_FULL[Number(formMonth) - 1],
        receiptNo: gReceiptNo,
        referenceNo: gReferenceNo,
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        submittedBy: 'อาภิวัฒน์ บัญชี (ผ่านระเบียบโอนลอย)',
        taxFilingType: formFilingType,
        transferStatus: formTransferStatus,
        transferDate: formTransferDate,
        bankName: formBankName,
        bankAccount: formBankAccount,
        remark: formRemark
      };
      
      handleSaveIndividualDetails([...individualDetails, newRecord]);
    }
    
    setShowAddManualRecordModal(false);
    setEditingRecord(null);
  };

  const handleDeleteManualRecord = (id: string, name: string) => {
    if (confirm(`คุณมั่นใจที่จะลบรายการโอนเงินนำส่งของ "${name}" หรือไม่?\n(รายการลบนี้จะถูกล้างแยกขาดเป็นอิสระและไม่กระทบแฟ้มพนักงานหลัก)`)) {
      const filtered = individualDetails.filter(item => item.id !== id);
      handleSaveIndividualDetails(filtered);
    }
  };

  // Compute stats for a month
  const getMonthStats = (year: number, month: number, isFlatTaxRate: number = 3) => {
    // 1. Check if there are payroll registries saved for this month (for periods 1 and 2)
    const key1 = `${year}_${month}_1`;
    const key2 = `${year}_${month}_2`;
    
    const reg1Rows = payrollRegistries[key1] || [];
    const reg2Rows = payrollRegistries[key2] || [];
    const combinedRows = [...reg1Rows, ...reg2Rows];

    if (combinedRows.length > 0) {
      // Direct sums from the actual historical registry records!
      const totalSalary = combinedRows.reduce((sum, row) => sum + (row.totalEarnings || 0), 0);
      const totalSso = combinedRows.reduce((sum, row) => sum + (row.socialSecurity || 0), 0);
      // If we saved tax as 0 in payroll registries, calculate flat tax rate based on gross earnings for tax department showcase
      const totalTax = combinedRows.reduce((sum, row) => {
        const rowTax = row.tax || 0;
        if (rowTax > 0) return sum + rowTax;
        return sum + Math.round((row.totalEarnings || 0) * (isFlatTaxRate / 100));
      }, 0);

      // unique payroll employees
      const uniqueEmployeeIds = Array.from(new Set(combinedRows.map(row => row.employeeId)));
      return {
        totalSalary,
        totalSso,
        totalTax,
        employeeCount: uniqueEmployeeIds.length,
        isCustomDraft: false,
        employeeDetails: combinedRows
      };
    } else {
      // 2. Fallback to generating a preview based on currently registered employees so grid is never blank
      const activeEmployees = employees.filter(emp => emp.paymentStatus === 'paid' || true);
      const employeeCount = activeEmployees.length;
      let totalSalary = 0;
      let totalSso = 0;
      let totalTax = 0;

      const details = activeEmployees.map(emp => {
        const isDaily = emp.salaryType === 'daily';
        const days = emp.workedDays !== undefined ? emp.workedDays : 15;
        const base = isDaily ? emp.baseSalary * days : emp.baseSalary;
        const gross = base + (emp.bonus || 0);
        // Social Security standard calculation
        const defaultSSO = emp.socialSecurity !== undefined ? emp.socialSecurity : Math.min(750, Math.round(base * 0.05));
        totalSalary += gross;
        totalSso += defaultSSO;
        const calculatedTax = Math.round(gross * (isFlatTaxRate / 100));
        totalTax += calculatedTax;

        return {
          employeeId: emp.employeeId || emp.id,
          name: emp.name,
          totalEarnings: gross,
          socialSecurity: defaultSSO,
          tax: calculatedTax,
          position: emp.position
        };
      });

      return {
        totalSalary,
        totalSso,
        totalTax,
        employeeCount,
        isCustomDraft: true,
        employeeDetails: details
      };
    }
  };

  const filteredSubmittedItems = React.useMemo(() => {
    return individualDetails.filter(item => {
      // Filter by selected year
      if (item.year !== selectedYear) return false;
      
      // Filter by month
      if (filterMonth > 0 && item.month !== filterMonth) return false;

      // Filter by Search Query
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesRef = item.referenceNo?.toLowerCase().includes(query) || false;
        const matchesReceipt = item.receiptNo?.toLowerCase().includes(query) || false;
        const matchesPos = item.position?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesRef && !matchesReceipt && !matchesPos) return false;
      }

      return true;
    });
  }, [individualDetails, selectedYear, filterMonth, searchQuery]);

  const handleSaveSubmissions = (newSubmissions: TaxSubmission[]) => {
    setSubmissions(newSubmissions);
    localStorage.setItem('sapphire_tax_submissions', JSON.stringify(newSubmissions));
    window.dispatchEvent(new Event('sapphire_storage_updated'));
  };

  const handleOpenSubmissionModal = (month: number) => {
    setModalMonth(month);
    setShowSubmitModal(true);
  };

  const executeFiling = () => {
    const stats = getMonthStats(selectedYear, modalMonth, modalFlatTaxRate);
    const newId = `${selectedYear}_${modalMonth}`;
    const generatedReceiptNo = `REC-${selectedYear + 543}${modalMonth.toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedReferenceNo = `TX-REF-${Math.floor(10000000 + Math.random() * 89999999)}`;
    
    // Check if duplicate exist
    const filtered = submissions.filter(sub => sub.id !== newId);
    
    const newSub: TaxSubmission = {
      id: newId,
      year: selectedYear,
      month: modalMonth,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      submittedBy: modalSubmitter || 'อาภิวัฒน์ บัญชี',
      receiptNo: generatedReceiptNo,
      referenceNo: generatedReferenceNo,
      totalEmployees: stats.employeeCount,
      totalSalary: stats.totalSalary,
      totalTax: stats.totalTax,
      totalSso: stats.totalSso,
      taxFilingType: modalReportType,
      status: 'submitted'
    };

    const updated = [...filtered, newSub].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    handleSaveSubmissions(updated);

    // Also populate individualDetails automatically from this filing for Section 1.1:
    const newIndividualItems: any[] = [];
    if (stats && stats.employeeDetails) {
      stats.employeeDetails.forEach((emp: any, idx: number) => {
        const salary = emp.totalEarnings || emp.workedAmount || emp.baseSalary || 0;
        const tax = emp.tax !== undefined ? emp.tax : Math.round(salary * modalFlatTaxRate / 100);
        const sso = emp.socialSecurity !== undefined ? emp.socialSecurity : Math.min(750, Math.round(salary * 0.05));
        
        newIndividualItems.push({
          id: `manual_${newId}_${idx}_${Math.floor(Math.random() * 10000)}`,
          year: selectedYear,
          month: modalMonth,
          monthName: THAI_MONTHS_FULL[modalMonth - 1],
          receiptNo: generatedReceiptNo,
          referenceNo: generatedReferenceNo,
          name: emp.name,
          position: emp.position || 'เจ้าหน้าที่ทั่วไป',
          salary,
          tax,
          sso,
          submittedAt: newSub.submittedAt,
          submittedBy: newSub.submittedBy,
          taxFilingType: modalReportType,
          transferStatus: 'complete',
          transferDate: newSub.submittedAt.split(' ')[0],
          bankName: 'ธนาคารกสิกรไทย',
          bankAccount: `020-2-${Math.floor(100000 + Math.random() * 900000)}`,
          remark: 'บันทึกโอนเงินส่งภาษีเสร็จสิ้น (ไม่ใช่รายการพนักงานพลบการจ่ายปกติ)'
        });
      });
    }

    // Filter out old entries for this month/year before appending new ones to prevent duplicate records
    const cleanIndivs = individualDetails.filter(item => !(item.year === selectedYear && item.month === modalMonth));
    handleSaveIndividualDetails([...cleanIndivs, ...newIndividualItems]);

    // Also auto-generate transfer tasks for Section 1.2
    const newTaxTransfer = {
      id: `tx_${newId}_tax`,
      year: selectedYear,
      month: modalMonth,
      type: 'tax',
      amount: stats.totalTax,
      status: 'pending',
      transferredAt: '',
      transferredBy: '',
      payerBank: '',
      payerAccount: '',
      transferTxId: '',
      recipient: 'กรมสรรพากร (เลขบัญชี: 006-1-08491-0)',
      receiptNo: generatedReceiptNo
    };
    const newSsoTransfer = {
      id: `tx_${newId}_sso`,
      year: selectedYear,
      month: modalMonth,
      type: 'sso',
      amount: stats.totalSso,
      status: 'pending',
      transferredAt: '',
      transferredBy: '',
      payerBank: '',
      payerAccount: '',
      transferTxId: '',
      recipient: 'สำนักงานประกันสังคม (เลขบัญชี: 006-1-09591-1)',
      receiptNo: `SSO-${generatedReceiptNo}`
    };

    const cleanTransfers = taxTransfers.filter(tx => !(tx.year === selectedYear && tx.month === modalMonth));
    handleSaveTaxTransfers([...cleanTransfers, newTaxTransfer, newSsoTransfer]);

    setShowSubmitModal(false);
    setActiveSubmission(newSub);

    // system notification update
    const addSyncLog = (msg: string) => {
      console.log(msg);
    };
    addSyncLog(`📁 ทำการยื่นคำร้องแบบภาษีกระทรวงการคลัง (ภ.ง.ด.1) รายเดือนเรียบร้อย เลขที่อ้างอิง: ${generatedReferenceNo}`);
  };
  // Generate 12 months status matrix
  const monthsMatrix = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const sub = submissions.find(s => s.year === selectedYear && s.month === monthNum);
    const calculatedStats = getMonthStats(selectedYear, monthNum, 3);
    
    return {
      monthNum,
      monthName: THAI_MONTHS_FULL[i],
      submission: sub || null,
      stats: calculatedStats
    };
  });

  const aggregateYearlyTax = submissions
    .filter(s => s.year === selectedYear)
    .reduce((sum, s) => sum + s.totalTax, 0);

  const aggregateYearlySalary = submissions
    .filter(s => s.year === selectedYear)
    .reduce((sum, s) => sum + s.totalSalary, 0);

  const aggregateYearlySso = submissions
    .filter(s => s.year === selectedYear)
    .reduce((sum, s) => sum + s.totalSso, 0);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {activeSubmission ? (
        /* 4. Active Specific Month's Receipt & PDF Form View */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-6"
        >
          {/* Back utility rail */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSubmission(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
              ย้อนกลับบริการตรวจสอบรวม
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              พิมพ์รายงานใบเสร็จ/ส่งออก PDF
            </button>
          </div>

          {/* Form Printable Wrapper */}
          <div id="tax-form-printable" className="bg-white rounded-3xl border border-slate-250 p-8 shadow-xl max-w-4xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none">
            {/* National emblem and header details */}
            <div className="border-b-4 border-double border-slate-400 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center font-black">
                    <span className="text-lg">ครุฑ</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-snug">กรมสรรพากรแห่งประเทศไทย</h2>
                    <p className="text-xs font-bold text-slate-600">สลิปชำระและแบบเงินได้ยื่นรายการสรุปภาษีเงินได้หัก ณ ที่จ่าย ภ.ง.ด. 1 ประจำเดือน</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-right space-y-1 w-full md:w-auto h-fit">
                <span className="text-[10px] text-slate-500 block font-black uppercase">Tax Submission Code</span>
                <span className="font-mono text-sm font-black text-indigo-700 block">{activeSubmission.referenceNo}</span>
                <span className="text-[10px] text-emerald-700 block font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-full w-fit ml-auto border border-emerald-100">ยื่นแบบปกติประจำเดือนสำเร็จ</span>
              </div>
            </div>

            {/* Submitter & company bio banner block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-450 uppercase tracking-wide">สถาบันเงินได้หักส่ง (Company Submitter)</h3>
                <div className="space-y-1 text-slate-700">
                  <p><strong>ชื่อนิติบุคคลผู้แต่งตั้ง:</strong> บริษัท บิวตี้ ซูซัน จำกัด</p>
                  <p><strong>เลขที่ใบประจำผู้เสียภาษี (Tax ID):</strong> 0-1055-6302-84-1</p>
                  <p><strong>ที่อยู่จดทะเบียน:</strong> อาคารไอสตูดิโอ ถ.เพชรเกษม 48 แขวงบางแวก เขตภาษีเจริญ กทม.</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-450 uppercase tracking-wide">ข้อความแบบรายงาน (Filing Receipt Details)</h3>
                <div className="space-y-1 text-slate-700">
                  <p><strong>ประเภทการยื่นแบบ:</strong> {activeSubmission.taxFilingType === 'normal' ? 'ยื่นปกติประจำเดือนภาษี' : 'ยื่นเพิ่มเติมข้อมูลส่วนเบี่ยงเบน'}</p>
                  <p><strong>งวดเดือนบัญชีภาษี:</strong> {THAI_MONTHS_FULL[activeSubmission.month - 1]} พ.ศ. {activeSubmission.year + 543}</p>
                  <p><strong>ผู้จัดทำลงนามยื่นเรื่อง:</strong> {activeSubmission.submittedBy}</p>
                  <p><strong>วันเวลาที่นำยื่นระบบคลาวด์:</strong> {activeSubmission.submittedAt} น.</p>
                </div>
              </div>
            </div>

            {/* Formal Certificate receipt ID line */}
            <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-slate-700 inline">
                🤝 <strong>กรมสรรพากรออกใบพกพาอิเล็กทรอนิกส์:</strong> ได้ชำระภาษีเข้าสู่กระทรวงการคลังเรียบร้อย เลขที่ใบเสร็จรับเงิน 
              </p>
              <span className="font-mono text-sm font-black text-emerald-800 ml-1.5 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 inline shadow-sm">{activeSubmission.receiptNo}</span>
            </div>

            {/* Table of Employee Breakdowns for P.N.D.1 filing list */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-extrabold text-slate-800">บัญชีรายชื่อพนักงานประกอบการส่งภาษีเงินได้หัก ณ ที่จ่าย ภ.ง.ด.1 (แนบท้าย)</h4>
                <span className="text-[10px] text-slate-400 font-bold">รวมจำนวนสมาชิกสมาชิก {activeSubmission.totalEmployees} คน</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-4 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3">เลขประจำตัวผู้เสียภาษี</th>
                      <th className="py-2.5 px-3">ชื่อข้าราชการ/พนักงาน</th>
                      <th className="py-2.5 px-3">แผนกงาน/ส่วนย่อย</th>
                      <th className="py-2.5 px-3 text-right">ยอดรวมเงินได้รวม</th>
                      <th className="py-2.5 px-3 text-right text-rose-600">ภาษี ณ ที่จ่ายที่หักนำส่ง (3%)</th>
                      <th className="py-2.5 px-4 text-right text-indigo-600">ประกันสังคมยื่นสปส. (5%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSubmission.employeeDetails && activeSubmission.employeeDetails.map((emp: any, index: number) => {
                      const empUniqueTaxId = `1-1039-48590-${index}${4}`;
                      const salaryEarned = emp.totalEarnings || emp.workedAmount || emp.baseSalary || 0;
                      return (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 text-center text-slate-500 font-mono font-bold">{index + 1}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{empUniqueTaxId}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-850">{emp.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{emp.position || 'เจ้าหน้าที่ฝ่ายปฏิบัติการ'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-850">{salaryEarned.toLocaleString('th-TH')} ฿</td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-600 bg-rose-50/20">{Math.round((emp.tax || salaryEarned * 0.03)).toLocaleString('th-TH')} ฿</td>
                          <td className="py-2.5 px-4 text-right font-bold text-indigo-600 bg-indigo-50/10">{(emp.socialSecurity || Math.round(salaryEarned * 0.05 * 0.5)).toLocaleString('th-TH')} ฿</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Final Summaries Total Statement Badge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t-2 border-dashed border-slate-300 pt-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">ยอดเงินได้รวมทั้งสิ้น (TOTAL GROSS SALARY)</span>
                <span className="text-lg font-black text-slate-800">{activeSubmission.totalSalary.toLocaleString('th-TH')} บาท</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-rose-455 text-rose-500 block font-bold uppercase">ภาษีเงินได้นำส่งรวมทั้งสิ้น (TOTAL TAX DEDUCTED)</span>
                <span className="text-lg font-black text-rose-650 text-rose-600">{activeSubmission.totalTax.toLocaleString('th-TH')} บาท</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-indigo-400 block font-bold uppercase">ประกันสังคมสมทบนำส่งสปส. (TOTAL SSO DEDUCTED)</span>
                <span className="text-lg font-black text-indigo-600">{activeSubmission.totalSso.toLocaleString('th-TH')} บาท</span>
              </div>
            </div>

            {/* Standard revenue signature area */}
            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-400 gap-4">
              <p>📍 เอกสารรับรองจากเซิร์ฟเวอร์คลาวด์ สรรพากรเชื่อมระบบกับ Sapphire HR อัตโนมัติ (ขอบคุณในความร่วมมือเสียภาษีเพื่อประเทศ)</p>
              <div className="text-center">
                <p className="font-serif italic text-slate-650 font-bold text-slate-600">กรมสรรพากรแห่งสยาม</p>
                <p className="text-[10px] tracking-wide mt-0.5">เอกสารตรวจสอบรันโดยสิทธิ์อาญาบัญชีอิเล็กทรอนิกส์</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : mode === 'transfer' ? (
        /* 1.2 โอนเงินให้สรรพกรแต่ละเดือน */
        <>
          <div className="bg-gradient-to-r from-teal-700 via-slate-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeIn">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold w-fit border border-emerald-400/20">
                <Building2 className="w-4 h-4 text-emerald-300" />
                <span>ช่องทางชำระเงินตรง • Direct Bank Payout & Tax Transfer System</span>
              </div>
              <h2 className="text-2xl font-black tracking-wide">1.2 โอนเงินให้สรรพากรแต่ละเดือน (Direct Government Payout)</h2>
              <p className="text-emerald-100 text-xs font-medium max-w-2xl leading-relaxed">
                ทำรายการชำระเงินโอนจ่ายและตัดบัญชีส่งตรงเข้าเครือข่ายธนาคารกรมสรรพากร (ภ.ง.ด.1) และส่วนกลางกองทุนงานประกันสังคมแห่งประเทศไทย สะดวกรวดเร็วตามเกณฑ์คลัง
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 bg-black/20 p-1.5 rounded-2xl border border-white/10 select-none shrink-0">
              <button
                onClick={() => setSelectedYear(2025)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear === 2025 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                ปี 2568 (2025)
              </button>
              <button
                onClick={() => setSelectedYear(2026)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear === 2026 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                ปี 2569 (2026)
              </button>
            </div>
          </div>

          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">ยอดรอโอนชำระเงิน</span>
                <span className="text-2xl font-black text-rose-600 font-mono">
                  {taxTransfers
                    .filter(tx => tx.year === selectedYear && tx.status === 'pending')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString('th-TH')} ฿
                </span>
                <span className="text-[10px] text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold block w-fit">
                  {taxTransfers.filter(tx => tx.year === selectedYear && tx.status === 'pending').length} รายการค้างจ่าย
                </span>
              </div>
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">ชำระสำเร็จเสร็จสิ้น</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {taxTransfers
                    .filter(tx => tx.year === selectedYear && tx.status === 'success')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString('th-TH')} ฿
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold block w-fit">
                  {taxTransfers.filter(tx => tx.year === selectedYear && tx.status === 'success').length} ธุรกรรมสำเร็จ
                </span>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">โอนนำส่งภาษีอากรสะสม</span>
                <span className="text-2xl font-black text-blue-600 font-mono">
                  {taxTransfers
                    .filter(tx => tx.year === selectedYear && tx.type === 'tax' && tx.status === 'success')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString('th-TH')} ฿
                </span>
                <span className="text-[10px] text-blue-500 block font-bold">เพื่อบัญชีนำกรมสรรพากร</span>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-50">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">โอนนำส่ง สปส. 5% สะสม</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">
                  {taxTransfers
                    .filter(tx => tx.year === selectedYear && tx.type === 'sso' && tx.status === 'success')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString('th-TH')} ฿
                </span>
                <span className="text-[10px] text-indigo-500 block font-bold">เพื่อประกันสังคมพนักงาน</span>
              </div>
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-50">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 📊 รายงานระดับความคืบหน้านำส่งรายยอดประจำปี (REPORT AREA) */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 space-y-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-black border border-indigo-200 block w-fit">
                  📊 AUDIT & TAX REPORTING MODULE • สถิตินำส่งตรง
                </span>
                <h3 className="text-base font-black text-slate-800">
                  รายงานสะสมยอดจ่ายภาษีและสวัสดิการสมทบกองคลังรายเดือน ประจำปี พ.ศ. {selectedYear + 543}
                </h3>
                <p className="text-slate-500 text-xs font-medium">
                  แจกแจงเม็ดเงินของ บริษัท บิวตี้ ซูซัน จำกัด ที่ดำเนินการโอนเข้ารัฐ คลังอากร และ สปส. ครบถ้วนรายเดือน
                </p>
              </div>
              
              {/* Year total stat badge */}
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start xl:items-end justify-center shrink-0">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">ยอดนำจ่ายรัฐเสร็จสิ้นประจำปี {selectedYear + 543} (NET SUM)</span>
                <span className="text-xl font-black text-emerald-600 font-mono tracking-tight">
                  {taxTransfers
                    .filter(tx => tx.year === selectedYear && tx.status === 'success')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString('th-TH')} ฿
                </span>
              </div>
            </div>

            {/* Monthly Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(() => {
                const summary = Array.from({ length: 12 }, (_, i) => {
                  const mIndex = i + 1;
                  const monthTransfers = taxTransfers.filter(tx => tx.year === selectedYear && tx.month === mIndex);
                  
                  const taxTransfer = monthTransfers.find(tx => tx.type === 'tax');
                  const ssoTransfer = monthTransfers.find(tx => tx.type === 'sso');
                  
                  const taxAmount = taxTransfer ? taxTransfer.amount : 0;
                  const taxPaid = taxTransfer && taxTransfer.status === 'success' ? taxTransfer.amount : 0;
                  const taxStatus = taxTransfer ? taxTransfer.status : 'none';
                  
                  const ssoAmount = ssoTransfer ? ssoTransfer.amount : 0;
                  const ssoPaid = ssoTransfer && ssoTransfer.status === 'success' ? ssoTransfer.amount : 0;
                  const ssoStatus = ssoTransfer ? ssoTransfer.status : 'none';

                  const grandTotal = taxAmount + ssoAmount;
                  const paidTotal = taxPaid + ssoPaid;
                  
                  let completionPercentage = 0;
                  let successCount = 0;
                  let totalCount = 0;
                  if (taxTransfer) { totalCount++; if (taxTransfer.status === 'success') successCount++; }
                  if (ssoTransfer) { totalCount++; if (ssoTransfer.status === 'success') successCount++; }
                  if (totalCount > 0) {
                    completionPercentage = Math.round((successCount / totalCount) * 100);
                  }

                  return {
                    month: mIndex,
                    monthName: THAI_MONTHS_FULL[i],
                    taxAmount,
                    taxStatus,
                    ssoAmount,
                    ssoStatus,
                    grandTotal,
                    paidTotal,
                    completionPercentage,
                    totalCount
                  };
                });

                return summary.map((m) => {
                  const hasData = m.totalCount > 0;
                  return (
                    <div 
                      key={m.month} 
                      className={`rounded-2xl p-4.5 border transition-all relative flex flex-col justify-between ${
                        hasData 
                          ? m.completionPercentage === 100 
                            ? 'bg-emerald-50/25 border-emerald-200/70 shadow-sm'
                            : m.completionPercentage > 0
                              ? 'bg-amber-50/15 border-amber-200/70 shadow-sm'
                              : 'bg-white border-slate-200 hover:shadow-sm'
                          : 'bg-slate-100/40 border-dashed border-slate-200 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-extrabold text-slate-800 text-[13px] flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              hasData 
                                ? m.completionPercentage === 100 
                                  ? 'bg-emerald-500' 
                                  : 'bg-amber-400' 
                                : 'bg-slate-300'
                            }`} />
                            {m.monthName}
                          </span>
                          
                          {hasData ? (
                            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                              m.completionPercentage === 100 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : m.completionPercentage > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}>
                              จ่ายจริง {m.completionPercentage}%
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 px-2 py-0.5 rounded-full font-bold">
                              ไม่มีข้อมูล
                            </span>
                          )}
                        </div>

                        {hasData ? (
                          <div className="space-y-2 text-[11px] text-slate-600">
                            {/* Withholding Tax */}
                            <div className="flex justify-between items-start">
                              <span className="text-slate-450 text-[10.5px]">ภาษี ภ.ง.ด.1</span>
                              <div className="text-right">
                                <span className="font-mono font-bold block text-slate-800">
                                  {m.taxAmount.toLocaleString('th-TH')} ฿
                                </span>
                                <span className={`text-[9px] font-extrabold block ${m.taxStatus === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {m.taxStatus === 'success' ? '✓ นำส่งแล้ว' : '✗ ค้างชำระ'}
                                </span>
                              </div>
                            </div>

                            {/* Social Security */}
                            <div className="flex justify-between items-start border-t border-slate-100 pt-1.5">
                              <span className="text-slate-450 text-[10.5px]">สปส. ประกันสังคม</span>
                              <div className="text-right">
                                <span className="font-mono font-bold block text-slate-800">
                                  {m.ssoAmount.toLocaleString('th-TH')} ฿
                                </span>
                                <span className={`text-[9px] font-extrabold block ${m.ssoStatus === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {m.ssoStatus === 'success' ? '✓ นำส่งแล้ว' : '✗ ค้างชำระ'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-slate-350 text-[10.5px] font-bold">
                            — ไม่มีภาระงานวางจ่าย —
                          </div>
                        )}
                      </div>

                      {hasData && (
                        <div className="mt-3.5 pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center font-bold text-[11px] mb-1.5 text-slate-700">
                            <span>ยอดตัดจ่ายสุทธิ:</span>
                            <span className="text-slate-800 font-mono">
                              <span className="text-emerald-600 font-black">{m.paidTotal.toLocaleString('th-TH')}</span>
                              <span className="text-slate-400"> / {m.grandTotal.toLocaleString('th-TH')} ฿</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                m.completionPercentage === 100 
                                  ? 'bg-emerald-500' 
                                  : m.completionPercentage > 0 
                                    ? 'bg-amber-400' 
                                    : 'bg-rose-400'
                              }`}
                              style={{ width: `${m.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Search, filters, tools card block */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTransferStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedTransferStatusFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                ทั้งหมด ({taxTransfers.filter(tx => tx.year === selectedYear).length})
              </button>
              <button
                onClick={() => setSelectedTransferStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedTransferStatusFilter === 'pending' ? 'bg-rose-600 text-white shadow-sm font-extrabold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                ค้างโอนจ่าย ({taxTransfers.filter(tx => tx.year === selectedYear && tx.status === 'pending').length})
              </button>
              <button
                onClick={() => setSelectedTransferStatusFilter('success')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedTransferStatusFilter === 'success' ? 'bg-emerald-600 text-white shadow-sm font-extrabold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                โอนจ่ายสำเร็จ ({taxTransfers.filter(tx => tx.year === selectedYear && tx.status === 'success').length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto mt-2 md:mt-0">
              <button
                onClick={handleOpenAddTransferModal}
                className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มบันทึกนำนำจ่าย (Add Transfer)
              </button>

              <button
                disabled={isSyncingDirectAPI}
                onClick={() => {
                  setIsSyncingDirectAPI(true);
                  setTimeout(() => {
                    setIsSyncingDirectAPI(false);
                    alert('🔄 เชื่อมต่อ API เครือข่ายธนาคารรัฐเพื่อตรวจสอบสถานะการรับเงินเรียบร้อยแล้ว!\nยอดการยื่นและตัดบัญชีอากรถูกต้องตามงบดุลบริษัท');
                  }, 1200);
                }}
                className="w-full md:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDirectAPI ? 'animate-spin' : ''}`} />
                {isSyncingDirectAPI ? 'กำลังเชื่อมฐานข้อมูล...' : 'Direct Sync Bank API'}
              </button>
            </div>
          </div>

          {/* Ledger table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 text-center w-12">ลำดับ</th>
                    <th className="py-3 px-3">งวดเดือนชำระภาษี</th>
                    <th className="py-3 px-3">ประเภทชำระภาษีส่งพนักงาน</th>
                    <th className="py-3 px-3 text-right">ยอดตัดจ่ายธนาคาร</th>
                    <th className="py-3 px-3">ปลายทางผู้รับประโยชน์</th>
                    <th className="py-3 px-3">สถานะการทำธุรกรรม</th>
                    <th className="py-3 px-4 text-center">สิทธิ์คำสั่งโอน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxTransfers
                    .filter(tx => {
                      if (tx.year !== selectedYear) return false;
                      if (selectedTransferStatusFilter === 'pending') return tx.status === 'pending';
                      if (selectedTransferStatusFilter === 'success') return tx.status === 'success';
                      return true;
                    })
                    .sort((a, b) => b.month - a.month || (a.type === 'tax' ? -1 : 1))
                    .map((tx, index) => {
                      const thaiMonthName = THAI_MONTHS_FULL[tx.month - 1];
                      const isTax = tx.type === 'tax';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-all">
                          <td className="py-4 px-4 text-center font-mono font-bold text-slate-500">{index + 1}</td>
                          <td className="py-4 px-3">
                            <span className="font-bold text-slate-900 block">{thaiMonthName} {tx.year + 543}</span>
                            <span className="text-[10px] text-slate-400 block font-semibold">ปีงบภาษีเงินได้คริสตศักราช {tx.year}</span>
                          </td>
                          <td className="py-4 px-3 font-semibold">
                            {isTax ? (
                              <div className="space-y-1">
                                <span className="bg-sky-50 text-sky-700 border border-sky-200/50 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider block w-fit">
                                  ภ.ง.ด. 1 (Withholding Tax)
                                </span>
                                <span className="text-slate-500 block text-[10px]">ชำระภาษีหัก ณ ที่จ่ายรวมรายยอดพนักงาน</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/50 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider block w-fit">
                                  เงินสมทบ สปส. 5% (Social Security)
                                </span>
                                <span className="text-slate-500 block text-[10px]">ประกันสังคมรอบกองทุนส่วนกลางข้าราชการ</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-3 text-right font-black font-mono text-slate-800 text-sm">
                            {tx.amount.toLocaleString('th-TH')} ฿
                          </td>
                          <td className="py-4 px-3">
                            <span className="text-slate-700 block font-bold">{tx.recipient.split(' (')[0]}</span>
                            <span className="text-slate-400 font-mono text-[10px] block">
                              {tx.recipient.includes('(') ? '(' + tx.recipient.split('(')[1] : ''}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            {tx.status === 'success' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-250 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  โอนชำระเงินสำเร็จ
                                </span>
                                <span className="text-[9px] text-slate-450 block font-semibold">{tx.transferredAt ? tx.transferredAt : ''}</span>
                                <span className="text-[9px] font-mono font-medium text-slate-500 block">สลิป: {tx.transferTxId}</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-250 px-2.5 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  ค้างยอด / รอสั่งโอนตรง
                                </span>
                                <span className="text-[9.5px] text-slate-450 block leading-tight font-medium">รอบัญชีตรวจสอบตัดจ่าย</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                              {tx.status === 'success' ? (
                                <div className="flex flex-wrap gap-1 justify-center">
                                  <button
                                    onClick={() => setSelectedTransferSlip(tx)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                    title="ดูสลิปโอนเงินอิเล็กทรอนิกส์"
                                  >
                                    <FileText className="w-3 h-3 text-slate-500" />
                                    Slip
                                  </button>
                                  {tx.receiptNo && (
                                    <button
                                      onClick={() => {
                                        const subId = `${tx.year}_${tx.month}`;
                                        const matchedSub = submissions.find(s => s.id === subId);
                                        if (matchedSub) {
                                          setActiveSubmission(matchedSub);
                                        } else {
                                          alert(`📄 เลขนำเอกสารอ้างอิงยืนยัน:\n${tx.receiptNo}`);
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                      title="ดูรายละเอียดใบเสร็จ"
                                    >
                                      <FileCheck className="w-3 h-3 text-blue-500" />
                                      ใบรับแบบ
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setFormTransferTxId(`KBK-TX-${Math.floor(100000 + Math.random() * 899999)}`);
                                    setActiveTransferToExecute(tx);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[10px] transition-all cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
                                >
                                  🎯 โอนเงินตรง
                                </button>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditTransferModal(tx)}
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-all cursor-pointer"
                                  title="แก้ไขข้อมูลธุรกรรมนี้"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTransferRecord(tx.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-750 rounded-lg transition-all cursor-pointer"
                                  title="ลบรายการนี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  
                  {taxTransfers.filter(tx => tx.year === selectedYear).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                        ❌ ไม่พบข้อมูลภาระธุรกรรมชำระภาษีสำหรับปี {selectedYear + 543}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : mode === 'detail' ? (
        /* 1.1 รายการจ่ายส่งสรรพกรแต่ละเดือน */
        <>
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeIn">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-bold w-fit border border-blue-400/20">
                <FileText className="w-4 h-4 text-blue-300" />
                <span>ฝ่ายยื่นแบบ • ทะเบียนรวมรายบุคคลแยกเดือนส่งอากร</span>
              </div>
              <h2 className="text-2xl font-black tracking-wide">1.1 รายการจ่ายส่งสรรพากรแต่ละเดือน (Individual Details Tracking)</h2>
              <p className="text-blue-100 text-xs font-medium max-w-2xl leading-relaxed">
                สรุปบัญชีรายชื่อพนักงานและเงินได้รายบุคคลหัก ณ ที่จ่าย 3% และรายจ่ายสมทบประกันสังคมสะสม นำส่งตรงตามปฏิทินกรมสรรพากรแห่งประเทศไทย ภ.ง.ด. 1
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-black/20 p-1.5 rounded-2xl border border-white/10 select-none shrink-0">
              <button
                onClick={() => setSelectedYear(2025)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear === 2025 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                ปี 2568 (2025)
              </button>
              <button
                onClick={() => setSelectedYear(2026)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear === 2026 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                ปี 2569 (2026)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">จำนวนรายการจ่ายทั้งหมด</span>
                <span className="text-2xl font-black text-slate-900">{filteredSubmittedItems.length} รายการ</span>
                <span className="text-[10px] text-blue-600 font-bold block bg-blue-50 px-2 py-0.5 rounded-full w-fit font-bold">บันทึกส่งสรรพากร</span>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">ฐานเงินได้ประเมินรวมสะสม</span>
                <span className="text-2xl font-black text-slate-900">{filteredSubmittedItems.reduce((sum, item) => sum + item.salary, 0).toLocaleString('th-TH')} ฿</span>
                <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 px-2 py-0.5 rounded-full w-fit">ยอดจ่ายรวม</span>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">ยอดภาษีหัก ณ ที่จ่ายรวม (3%)</span>
                <span className="text-2xl font-black text-rose-600">{filteredSubmittedItems.reduce((sum, item) => sum + item.tax, 0).toLocaleString('th-TH')} ฿</span>
                <span className="text-[10px] text-rose-600 font-bold block bg-rose-50 px-2 py-0.5 rounded-full w-fit">นำส่งหลวงแล้ว</span>
              </div>
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between bg-white border border-slate-200">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหารายชื่อพนักงาน ตำแหน่งงาน หรือเลขรับเงิน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white border border-slate-200"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">รอบเดือน:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value={0}>ทั้งหมดทุกเดือน</option>
                  {THAI_MONTHS_FULL.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterMonth(0);
                }}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <span>ลิสต์จัดเก็บประวัติส่งภาษีและรายการโอนจ่ายแต่ละเดือน (แนบท้าย ภ.ง.ด.1)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200 leading-none">แมนนวลโอนจ่ายแยก</span>
                </h3>
                <p className="text-slate-400 text-[10.5px] font-semibold mt-0.5">ระบบปฏิทินแสดงลิสรายการโอนจ่ายส่งสรรพากรพนักงานรายบุคคล ไม่ผูกกับโมดูลอื่นเพื่อความอิสระในการคีย์ยอด</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={handleOpenAddRecordModal}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มรายการโอนจ่าย/สรรพากรแมนนวล
                </button>
                <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-xl">
                  ผลค้นหา {filteredSubmittedItems.length} แถว
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredSubmittedItems.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-150 bg-slate-100/85 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wide">
                      <th className="py-3 px-4 text-center w-12">ลำดับ</th>
                      <th className="py-3 px-3">รอบภาษีประจำเดือน</th>
                      <th className="py-3 px-3">พนักงานผู้มีเงินได้ / บัญชีรับ</th>
                      <th className="py-3 px-3">ตำแหน่งงาน</th>
                      <th className="py-3 px-3 text-right">เงินได้เกณฑ์ประเมิน</th>
                      <th className="py-3 px-3 text-right text-rose-600">ภาษีหักนำส่ง (3%)</th>
                      <th className="py-3 px-4 text-right text-indigo-600">สปส. หักนำส่ง (5%)</th>
                      <th className="py-3 px-3">สถานะช่องทางโอนจ่าย (Bank Pay)</th>
                      <th className="py-3 px-3 text-center w-40">เครื่องมือจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSubmittedItems.map((item, index) => {
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-500 font-mono font-bold">{index + 1}</td>
                          <td className="py-3 px-3 font-semibold text-slate-700">{item.monthName} {item.year + 543}</td>
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6.5 h-6.5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-[9px] shrink-0">
                                  {item.name.substring(0, 2)}
                                </div>
                                <span className="font-extrabold text-slate-850 block">{item.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold block pl-9 font-mono">
                                💳 {item.bankName || 'ธนาคารการโอน'} {item.bankAccount || 'ไม่ระบุเลขที่บัญชี'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-semibold">{item.position}</td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-800">{item.salary.toLocaleString('th-TH')} ฿</td>
                          <td className="py-3 px-3 text-right font-black text-rose-600 bg-rose-50/10">{item.tax.toLocaleString('th-TH')} ฿</td>
                          <td className="py-3 px-4 text-right font-bold text-indigo-600 bg-indigo-50/10">{item.sso.toLocaleString('th-TH')} ฿</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                              item.transferStatus === 'complete' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.transferStatus === 'complete' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                              {item.transferStatus === 'complete' ? 'โอนจ่ายสำเร็จแล้ว' : 'รอดำเนินการสั่งจ่าย'}
                            </span>
                            {item.transferDate && item.transferStatus === 'complete' && (
                              <span className="block text-[9px] text-slate-400 font-medium pl-2.5 mt-0.5">เมื่อ: {item.transferDate}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditRecordModal(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer border border-blue-100"
                                title="แก้ไขข้อมูลแบบยื่นอิสระ"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteManualRecord(item.id, item.name)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer border border-rose-100"
                                title="ลบข้อมูลชั่วคราว"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  // Find general submission receipt matching or mock it
                                  const sub = submissions.find(s => s.year === item.year && s.month === item.month);
                                  setActiveSubmission({
                                    id: item.id,
                                    year: item.year,
                                    month: item.month,
                                    submittedAt: item.submittedAt || '2569-01-01 12:00',
                                    submittedBy: item.submittedBy || 'อาภิวัฒน์ บัญชี',
                                    receiptNo: item.receiptNo || 'REC-MOCK-9182',
                                    referenceNo: item.referenceNo || 'REF-MOCK-2819',
                                    totalEmployees: 1,
                                    totalSalary: item.salary,
                                    totalTax: item.tax,
                                    totalSso: item.sso,
                                    taxFilingType: item.taxFilingType || 'normal',
                                    status: 'submitted',
                                    employeeDetails: [item]
                                  });
                                }}
                                className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 font-bold text-[10.5px]"
                                title="ดูแบบเสร็จ ภ.ง.ด.1 ลอย"
                              >
                                รับรองแบบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="font-extrabold text-slate-700 text-sm">ไม่พบรายการยื่นภาษีนำส่งแมนนวล</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-semibold">
                    ไม่มีประวัติตัดบัญชีสำหรับการโอนส่งแบบอากรลอย กรุณาใช้ข้อมูลแมนนวลโดยคลิกปุ่ม "เพิ่มรายการโอนจ่าย" หรือยื่นสรรพากรจากหน้าบริหารสรุปรวมหลัก
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* 1. ยอดจ่ายรายเดือนที่ส่งสรรพกรแล้ว (The standard view) */
        <>
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold w-fit border border-emerald-400/20">
                <Building2 className="w-4 h-4 text-emerald-300" />
                <span>ฝ่ายบัญชีผู้รับผิดชอบ & งานสรรพกรเขตกรุงเทพฯ</span>
              </div>
              <h2 className="text-2xl font-black tracking-wide">ยอดจ่ายรายเดือนยื่นสรรพากร (Tax Filing Center)</h2>
              <p className="text-emerald-100 text-xs font-medium max-w-2xl leading-relaxed">
                ศูนย์บริการจัดการข้อมูลสำหรับนำส่งกรมสรรพากรแห่งประเทศไทย ประจำปีบัญชีภาษีอากร 2569 ยอดคำนวณจากใบสำคัญแสดงเงินเดือนและอัตราหัก ณ ที่จ่าย (ภ.ง.ด.1) และนำส่งสปส. สำเร็จ
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-black/20 p-1.5 rounded-2xl border border-white/10 select-none shrink-0">
              <button
                onClick={() => setSelectedYear(2025)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear === 2025 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                ปี 2568 (2025)
              </button>
              <button
                onClick={() => setSelectedYear(2026)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear === 2026 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                ปี 2569 (2026)
              </button>
            </div>
          </div>

          {/* 2. Top Cumulative Stats widgets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">ภาษีที่ยื่นสะสมปี {selectedYear + 543}</span>
                <span className="text-2xl font-black text-slate-900">{aggregateYearlyTax.toLocaleString('th-TH')} บาท</span>
                <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 px-2 py-0.5 rounded-full w-fit">หัก ณ ที่จ่ายนำส่งแล้ว</span>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">ยอดจ่ายเงินเดือนผ่านระบบสะสม</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">{aggregateYearlySalary.toLocaleString('th-TH')} บาท</span>
                <span className="text-[10px] text-blue-600 font-bold block bg-blue-50 px-2 py-0.5 rounded-full w-fit">ยื่นรายรวมสรรพากรแล้ว</span>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">ยอดนำส่งสปส. ประกันสังคมสะสม</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">{aggregateYearlySso.toLocaleString('th-TH')} บาท</span>
                <span className="text-[10px] text-indigo-600 font-bold block bg-indigo-50 px-2 py-0.5 rounded-full w-fit">ข้อมูล พ.ส.น. 1-10 ตรงจุด</span>
              </div>
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] text-slate-300 block font-bold uppercase">ยื่นแบบออนไลน์แล้ว</span>
                <span className="text-2xl font-black">{submissions.filter(s => s.year === selectedYear).length} เดือน</span>
                <span className="text-[10px] text-slate-300 block font-serif leading-none italic">พร้อมหลักฐานใบเสร็จครบ</span>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 z-10">
                <CheckCircle className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              {/* background vector gradient */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl" />
            </div>
          </div>

          {/* 3. Months Tax Grid List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">ปฏิทินและสถานะตรวจสอบภาษีรายเดือนปีกาลบัญชีภาษีอากร {selectedYear + 543}</h3>
                <p className="text-slate-400 text-[11px] font-medium">กดปุ่มยื่นแบบหรือตรวจสอบแบบรายละเอียดด้านขวามือเพื่อสร้างแบบฟอร์ม ภ.ง.ด.1 เพื่อส่งเอกสารประจำงวด</p>
              </div>
              <button 
                onClick={() => handleSaveSubmissions(submissions)}
                className="p-1 px-3 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                title="รีเฟรชตารางตรวจจับล่าสุด"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                รีเฟรชระบบตรวจ
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {monthsMatrix.map((item) => {
                const isSubmitted = item.submission !== null;
                const stats = getMonthStats(selectedYear, item.monthNum, 3);
                const yearPrefixThai = selectedYear + 543;

                return (
                  <div key={item.monthNum} className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    {/* Left: Month metadata */}
                    <div className="flex items-center gap-4.5 min-w-44">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex flex-col items-center justify-center font-bold text-slate-700 sm:shrink-0">
                        <span className="text-[10px] text-slate-450 uppercase leading-none">{selectedYear}</span>
                        <span className="text-sm font-black leading-tight">M{item.monthNum}</span>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm leading-snug">{item.monthName} {yearPrefixThai}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isSubmitted ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              ยื่นสรรพากรเรียบร้อย
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                              รอยื่น (Pending ภ.ง.ด.1)
                            </span>
                          )}
                          
                          {item.stats.isCustomDraft && (
                            <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 rounded-md" title="จำลองแบบคำนวณจากสารสนเทศพนักงานยังไม่บันทึกประวัติ">
                              คำสั่งจำลองแบบ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Salary & tax counters */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 flex-1 max-w-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">จำนวนพนักงาน</span>
                        <span className="text-slate-800 font-extrabold text-sm">{stats.employeeCount} อัตรา</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">เงินเดือนค่าจ้างรวม</span>
                        <span className="text-slate-800 font-extrabold text-sm">{stats.totalSalary.toLocaleString('th-TH')} ฿</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">นำส่งภาษี (หัก ณ ที่จ่าย)</span>
                        <span className="text-slate-800 font-black text-sm text-rose-600">{stats.totalTax.toLocaleString('th-TH')} ฿</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                      {isSubmitted ? (
                        <>
                          <button
                            onClick={() => {
                              // Ensure sub payload contains detail array
                              const subWithDetail = { ...item.submission!, employeeDetails: stats.employeeDetails };
                              setActiveSubmission(subWithDetail);
                            }}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-slate-900 border border-slate-900 text-white rounded-xl hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            ใบแบบยื่น & ใบเสร็จภาษี
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleOpenSubmissionModal(item.monthNum)}
                          className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          ดำเนินการยื่นภาษีออนไลน์
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 5. Create Tax Online Submission Form Modal popup */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-250 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    ดำเนินการยื่นแบบชำระภาษีเงินเดือนพนักงาน
                  </h3>
                  <p className="text-slate-450 text-xs font-semibold">ส่งคำร้องฟอร์ม ภ.ง.ด.1 (Withholding Tax Report) เพื่อระบบประมวลผล</p>
                </div>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">งวดเดือนบัญชีที่ยื่นรายการ</label>
                  <select
                    value={modalMonth}
                    onChange={(e) => setModalMonth(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {THAI_MONTHS_FULL.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m} {selectedYear + 543}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ประเภทหนังสือการยื่น</label>
                    <select
                      value={modalReportType}
                      onChange={(e) => setModalReportType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">ยื่นแบบปกติปกติ (ภ.ง.ด.1)</option>
                      <option value="additional">ยื่นแบบเพิ่มเติมกรณีพิเศษ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ข้อยึดอัตราภาษีหัก ณ ที่จ่าย</label>
                    <select
                      value={modalFlatTaxRate}
                      onChange={(e) => setModalFlatTaxRate(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={3}>หัก ณ ที่จ่ายคงที่ 3% (ทั่วไป)</option>
                      <option value={5}>หัก ณ ที่จ่ายอัตรา 5%</option>
                      <option value={1}>หัก ณ ที่จ่าย 1% (กรณีสัญญาจ้าง)</option>
                      <option value={0}>ไม่คำนวณและหักภาษีเงินได้ (0%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">ชื่อผู้ลงสนามผู้พิกัดนำส่ง (Authorized Person)</label>
                  <input
                    type="text"
                    value={modalSubmitter}
                    onChange={(e) => setModalSubmitter(e.target.value)}
                    placeholder="ระบุชื่อเจ้าหน้าที่การเงิน/ผู้จัดทำเรื่อง"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Subtotals simulation box */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-250 space-y-1.5 font-bold">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">ประมาณการแบบยื่นระบบ</span>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">เงินได้พนักงานรวมสะสม:</span>
                    <span className="text-slate-850">{getMonthStats(selectedYear, modalMonth, modalFlatTaxRate).totalSalary.toLocaleString('th-TH')} ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">ยอดรวมประเมินภาษีนำส่ง ({modalFlatTaxRate}%):</span>
                    <span className="text-rose-600">{getMonthStats(selectedYear, modalMonth, modalFlatTaxRate).totalTax.toLocaleString('th-TH')} ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">ยอดส่งประกันสังคม สปส. 5%:</span>
                    <span className="text-indigo-600">{getMonthStats(selectedYear, modalMonth, modalFlatTaxRate).totalSso.toLocaleString('th-TH')} ฿</span>
                  </div>
                </div>

                {/* Warning note */}
                <p className="text-[10.5px] leading-relaxed text-slate-400">
                  ⚠️ นำส่งภาษีเงินปันผล/เงินเดือนเข้าสู่เครื่องเซิร์ฟเวอร์เสมือนจริงของกรมสรรพากรแห่งระบบ หลังยืนยันระบบ จะไม่สามารถลบแบบชำระได้จนกว่าจะสร้างแบบยื่นเพิ่มเติมเพื่อกู้คืนข้อมูล
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 font-bold text-slate-600 text-xs rounded-xl cursor-pointer"
                >
                  ยกเลิกรายการ
                </button>
                <button
                  onClick={executeFiling}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md shadow-blue-500/10"
                >
                  ยืนยันนำยื่นสรรพากรสำเร็จ
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddManualRecordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    {editingRecord ? 'แก้ไขข้อมูลรายการจ่ายส่งอากรลอยธนาคาร' : 'เพิ่มข้อมูลรายการส่งอากรและสั่งจ่ายธนาคารใหม่'}
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold">
                    บันทึกสรรพากรแบบโอนจ่ายเท่านั้น (ไม่เชื่อมข้อมูลพนักงานหลัก / ไม่กระทบประวัติรายเดือนกลุ่มอื่น)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddManualRecordModal(false)}
                  className="p-1 px-2 mb-1.5 rounded-lg text-slate-400 hover:bg-slate-100 font-extrabold cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveManualRecord} className="space-y-4 text-xs font-bold text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ชื่อผู้มีเงินได้ / ผู้รับเงินปลายทาง (Payee Name) *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="เช่น สมศักดิ์ สุขใจ"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ตำแหน่งงาน / ฝ่าย (Position)</label>
                    <input
                      type="text"
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      placeholder="เช่น ผู้จัดการฝ่ายบัญชี"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เงินได้พึงประเมินก่อนหัก (ฐานเงินเดือน)</label>
                    <input
                      type="number"
                      value={formSalary}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setFormSalary(val);
                        setFormTax(Math.round(val * 0.03));
                        setFormSso(Math.min(750, Math.round(val * 0.05)));
                      }}
                      placeholder="ระบุบาท เช่น 30000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ภาษีหัก ณ ที่จ่ายนำส่งสรรพากร (3%)</label>
                    <input
                      type="number"
                      value={formTax}
                      onChange={(e) => setFormTax(parseInt(e.target.value) || 0)}
                      placeholder="ระบุบาท"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-rose-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ภาษีสมทบประกันสังคม (สปส. 5%)</label>
                    <input
                      type="number"
                      value={formSso}
                      onChange={(e) => setFormSso(parseInt(e.target.value) || 0)}
                      placeholder="ระบุบาท"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ปีภาษีนำส่ง (พ.ศ. / ค.ศ.)</label>
                    <select
                      value={formYear}
                      onChange={(e) => setFormYear(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={2025}>พ.ศ. 2568 (2025)</option>
                      <option value={2026}>พ.ศ. 2569 (2026)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">งวดภาษีประจำเดือน</label>
                    <select
                      value={formMonth}
                      onChange={(e) => setFormMonth(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {THAI_MONTHS_FULL.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-indigo-50/45 rounded-2xl border border-indigo-100/50">
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-[11px] text-indigo-800 block font-black uppercase tracking-wider mb-2">💸 ข้อมูลการโอนชำระเงินตรงผ่านธนาคาร (Bank Transfer Segment Only)</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ช่องทางธนาคารขารับโอน</label>
                    <select
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none outline-none ring-1 ring-slate-200/50"
                    >
                      <option value="ธนาคารกสิกรไทย">KBank - ธนาคารกสิกรไทย</option>
                      <option value="ธนาคารไทยพาณิชย์">SCB - ธนาคารไทยพาณิชย์</option>
                      <option value="ธนาคารกรุงเทพ">BBL - ธนาคารกรุงเทพ</option>
                      <option value="ธนาคารกรุงศรีอยุธยา">BAY - ธนาคารกรุงศรีอยุธยา</option>
                      <option value="ธนาคารกรุงไทย">KTB - ธนาคารกรุงไทย</option>
                      <option value="ธนาคารออมสิน">GSB - ธนาคารออมสิน</option>
                      <option value="ธนาคารธ.ก.ส">BAAC - ธนาคารธ.ก.ส</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เลขบัญชีรับเงินโอน</label>
                    <input
                      type="text"
                      value={formBankAccount}
                      onChange={(e) => setFormBankAccount(e.target.value)}
                      placeholder="เช่น 102-3-45678-9"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">สถานะการทำธุรกรรมโอนสั่งจ่าย</label>
                    <select
                      value={formTransferStatus}
                      onChange={(e) => setFormTransferStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none outline-none ring-1 ring-slate-200/50"
                    >
                      <option value="complete">โอนสั่งจ่ายเสร็จสิ้น (Bank Direct Transfer Complete)</option>
                      <option value="pending">อยู่ระหว่างสั่งพิมพ์/รอดำเนินการสั่งจ่าย (Pending Transfer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">วันที่ต้องการโอนสั่งจ่าย</label>
                    <input
                      type="date"
                      value={formTransferDate}
                      onChange={(e) => setFormTransferDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เลขอ้างเอกสารรับแบบ (ถ้ามี)</label>
                    <input
                      type="text"
                      value={formReceiptNo}
                      onChange={(e) => setFormReceiptNo(e.target.value)}
                      placeholder="เว้นว่างเพื่ออิงตามระบบ"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ประเภทการส่งแบบยื่นอักขระ</label>
                    <select
                      value={formFilingType}
                      onChange={(e) => setFormFilingType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">การยื่นตามรอบปกติ (ภ.ง.ด.1)</option>
                      <option value="additional">ยื่นแบบย้อนหลัง/ยอดเพิ่มเติม</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">หมายเหตุระบบบัญชีเพิ่มเติม (Remark)</label>
                  <textarea
                    value={formRemark}
                    onChange={(e) => setFormRemark(e.target.value)}
                    placeholder="ใส่คำสำคัญหรือเบาะแส เช่น 'โอนต่างหากรอบประเมินพิเศษ'"
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddManualRecordModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer font-bold text-center"
                  >
                    ยกเลิกแบบบันทึก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer font-black text-center shadow-lg shadow-blue-500/10"
                  >
                    {editingRecord ? 'บันทึกอัปเดตอากรลอยสำเร็จ' : 'บันทึกเข้าระบบส่งโอนจ่าย'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal for executing direct transfer */}
        {activeTransferToExecute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 text-left"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-905 text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    ยืนยันโอนเงินส่งกองคลังรัฐ (Execute Direct Transfer)
                  </h3>
                  <p className="text-slate-400 text-[11px] font-semibold">
                    ตัดจ่ายบัญชีบริษัท บิวตี้ ซูซัน จำกัด เพื่อโอนเข้ารัฐทางอิเล็กทรอนิกส์
                  </p>
                </div>
                <button
                  onClick={() => setActiveTransferToExecute(null)}
                  className="p-1 px-2 rounded-lg text-slate-400 hover:bg-slate-100 font-extrabold cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-indigo-50/45 p-4 rounded-2xl border border-indigo-100/50 space-y-2.5 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-y-2">
                  <div>
                    <span className="text-slate-400 font-semibold block">ประเมินเป้าประสงค์:</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {activeTransferToExecute.type === 'tax' ? 'ภาษีหัก ณ ที่จ่าย ภ.ง.ด.1' : 'เงินสมทบสำนักงานประกันสังคม'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">งวดเดือนงบประมาณ:</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {THAI_MONTHS_FULL[activeTransferToExecute.month - 1]} {activeTransferToExecute.year + 543}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">ยอดเงินชำระขาดสุทธิ:</span>
                    <span className="font-black text-indigo-700 text-sm font-mono block">
                      {activeTransferToExecute.amount.toLocaleString('th-TH')} ฿
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">บัญชีปลายทางผู้รับเงิน:</span>
                    <span className="font-bold text-slate-800">
                      {activeTransferToExecute.recipient.split(' (')[0]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">เลือกธนาคารต้นทางผู้โอนชำระเงิน</label>
                  <select
                    value={formPayerBank}
                    onChange={(e) => setFormPayerBank(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-805 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="ธนาคารกสิกรไทย">KBank - ธนาคารกสิกรไทย (บัญชีบริษัท 020-2-34918-1)</option>
                    <option value="ธนาคารไทยพาณิชย์">SCB - ธนาคารไทยพาณิชย์ (บัญชีบริษัท 105-4-93821-2)</option>
                    <option value="ธนาคารกรุงเทพ">BBL - ธนาคารกรุงเทพ (บัญชีบริษัท 210-9-48210-4)</option>
                    <option value="ธนาคารกรุงไทย">KTB - ธนาคารกรุงไทย (บัญชีบริษัท 001-3-48590-0)</option>
                    <option value="ธนาคารธ.ก.ส">BAAC - ธนาคารธ.ก.ส (บัญชีบริษัท 020-0-12345-6)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เลขบัญชีผู้โอน (Payer Acc)</label>
                    <input
                      type="text"
                      value={formPayerAccount}
                      onChange={(e) => setFormPayerAccount(e.target.value)}
                      placeholder="เช่น 020-2-34918-1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เลขอ้างอิงคำขอตัดโอนสำเร็จ (Tx Ref ID)</label>
                    <input
                      type="text"
                      value={formTransferTxId}
                      onChange={(e) => setFormTransferTxId(e.target.value)}
                      placeholder="เช่น KBK-TX-928104"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-indigo-700 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">วันที่ดำเนินการสั่งหักโอนสำเร็จ</label>
                  <input
                    type="date"
                    value={formTransferDateVal}
                    onChange={(e) => setFormTransferDateVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-805 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTransferToExecute(null)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-705 text-slate-700 rounded-xl cursor-pointer text-center font-bold"
                  >
                    ยกเลิกธุรกรรมนี้
                  </button>
                  <button
                    onClick={() => {
                      // Process confirmed transfer status
                      const updatedTransfers = taxTransfers.map(tx => {
                        if (tx.id === activeTransferToExecute.id) {
                          const thaiTimeFormatted = new Date().toLocaleTimeString('th-TH').substring(0, 5);
                          return {
                            ...tx,
                            status: 'success',
                            transferredAt: `${formTransferDateVal.split('-').map((v, i) => i === 0 ? parseInt(v) + 543 : v).join('-')} ${thaiTimeFormatted} น.`,
                            transferredBy: 'อาภิวัฒน์ บัญชี (ระบบโอนตรงผ่าน Direct API)',
                            payerBank: `${formPayerBank} (${formPayerAccount})`,
                            transferTxId: formTransferTxId || `KBK-TX-${Math.floor(100000 + Math.random() * 899999)}`,
                            receiptNo: tx.receiptNo || `REC-${tx.year + 543}${tx.month.toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
                          };
                        }
                        return tx;
                      });

                      handleSaveTaxTransfers(updatedTransfers);
                      setActiveTransferToExecute(null);
                      alert('🎉 ดำเนินการตัดจ่ายและทำธุรกรรมโอนเงินให้หน่วยงานสำเร็จเด็ดขาด!');
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-center shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    ยืนยันการตัดบัญชีนำจ่ายเงิน
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal for viewing Bank Slip details */}
        {selectedTransferSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative space-y-5 text-left"
            >
              {/* Slip visual watermarks */}
              <div className="text-center pb-2 border-b-2 border-dashed border-slate-150">
                <span className="text-[10px] text-emerald-600 font-black tracking-widest block uppercase">e-Slip TRANSACTION CERTIFICATE</span>
                <span className="text-xs text-slate-450 text-slate-400 block font-bold mt-0.5">บริษัท บิวตี้ ซูซัน จำกัด</span>
              </div>

              {/* Slip content */}
              <div className="space-y-4 text-xs font-semibold">
                {/* Visual arrow indicating flow */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 gap-3">
                  <div className="text-left space-y-1">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">ต้นทางผู้จ่าย (From)</span>
                    <span className="font-black text-slate-800 block text-xs">บจก. บิวตี้ ซูซัน จำกัด</span>
                    <span className="text-[9.5px] text-slate-500 block font-mono leading-tight">{selectedTransferSlip.payerBank || 'ธนาคารกสิกรไทย (020-2-34918-1)'}</span>
                  </div>
                  <div className="text-slate-300 font-black text-lg select-none shrink-0">➔</div>
                  <div className="text-right space-y-1">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">ปลายทางผู้รับ (To)</span>
                    <span className="font-black text-slate-800 block text-xs">{selectedTransferSlip.recipient.split(' (')[0]}</span>
                    <span className="text-[9.5px] font-mono text-slate-500 block leading-tight">{selectedTransferSlip.recipient.includes('(') ? selectedTransferSlip.recipient.split('(')[1].replace(')', '') : ''}</span>
                  </div>
                </div>

                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ประเภทอากรภาษี/สปส.</span>
                    <span className="font-bold text-slate-800">
                      {selectedTransferSlip.type === 'tax' ? 'ภาษีหัก ณ ที่จ่าย ภ.ง.ด.1' : 'ฝ่ายสมทบ สปส. ประกันสังคม'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ประจำรอบบัญชี</span>
                    <span className="font-bold text-slate-800">
                      {THAI_MONTHS_FULL[selectedTransferSlip.month - 1]} {selectedTransferSlip.year + 543}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">วันที่โอนผ่านระบบ</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {selectedTransferSlip.transferredAt ? selectedTransferSlip.transferredAt : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ดำเนินการรับรองโดย</span>
                    <span className="font-bold text-emerald-600">
                      {selectedTransferSlip.transferredBy ? selectedTransferSlip.transferredBy.split(' (')[0] : 'อาภิวัฒน์ บัญชี'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">หมายเลขสลิปและอ้างอิงกรม</span>
                    <span className="font-mono font-bold text-indigo-600 block">{selectedTransferSlip.transferTxId}</span>
                  </div>
                </div>

                <div className="text-center py-2 bg-emerald-50 rounded-2xl border border-emerald-100 text-slate-900 font-sans space-y-1">
                  <span className="text-[10px] text-emerald-700 block font-bold uppercase tracking-wider">จำนวนเงินตัดโอนเสร็จสมบูรณ์ทั้งสิ้น (NET TRANSFER)</span>
                  <span className="text-2xl font-black text-emerald-800 font-mono tracking-wide">{selectedTransferSlip.amount.toLocaleString('th-TH')} ฿</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setSelectedTransferSlip(null)}
                  className="flex-1 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl text-center cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  ตกลงและปิดข้อมูลสลิป
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal for editing OR adding custom direct transfer record */}
        {activeTransferToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl relative my-8 text-left space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Edit className="w-5 h-5 text-indigo-600" />
                    {isEditingNew ? 'เพิ่มรายการธุรกรรมโอนเงิน (Add Direct Transfer)' : 'แก้ไขข้อมูลรายงานธุรกรรมโอนเงิน (Edit Direct Transfer)'}
                  </h3>
                  <p className="text-slate-400 text-[11px] font-semibold">
                    กรอกข้อมูลบัญชีสรรพากรหรือส่วนงานราชการเพื่อทำสมุดรายงาน
                  </p>
                </div>
                <button
                  onClick={() => setActiveTransferToEdit(null)}
                  className="p-1 px-2 rounded-lg text-slate-400 hover:bg-slate-100 font-extrabold cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                {/* Month selection */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">งวดเดือนบัญชี (Month)</label>
                  <select
                    value={editTxMonth}
                    onChange={(e) => setEditTxMonth(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {THAI_MONTHS_FULL.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Year selection */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">ปีภาษี (Year)</label>
                  <select
                    value={editTxYear}
                    onChange={(e) => setEditTxYear(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value={2025}>พ.ศ. 2568 (2025)</option>
                    <option value={2026}>พ.ศ. 2569 (2026)</option>
                    <option value={2027}>พ.ศ. 2570 (2027)</option>
                  </select>
                </div>

                {/* Transfer Type */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">ประเภทการชำระเงิน นำจ่าย</label>
                  <select
                    value={editTxType}
                    onChange={(e) => {
                      const type = e.target.value as 'tax' | 'sso';
                      setEditTxType(type);
                      if (type === 'tax') {
                        setEditTxRecipient('กรมสรรพากร (เลขบัญชี: 006-1-08491-0)');
                      } else {
                        setEditTxRecipient('สำนักงานประกันสังคม (เลขบัญชี: 006-1-09591-1)');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="tax">ภาษีหัก ณ ที่จ่าย ภ.ง.ด.1 (Revenue Dept)</option>
                    <option value="sso">สปส. ประกันสังคม 5% (Social Security)</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">ยอดเงินนำส่งตัดบัญชี (บาท)</label>
                  <input
                    type="number"
                    value={editTxAmount}
                    onChange={(e) => setEditTxAmount(parseFloat(e.target.value) || 0)}
                    placeholder="เช่น 4500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-indigo-700"
                  />
                </div>

                {/* Recipient Account details */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">บัญชีปลายทางผู้รับประโยชน์ (Recipient Bank Details)</label>
                  <input
                    type="text"
                    value={editTxRecipient}
                    onChange={(e) => setEditTxRecipient(e.target.value)}
                    placeholder="เช่น กรมสรรพากร (เลขบัญชี: 006-1-08491-0)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                {/* Status selection */}
                <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                  <label className="text-[11px] font-bold text-slate-600 block mb-2">สถานะการทำธุรกรรม (Transaction Status)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditTxStatus('pending')}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${editTxStatus === 'pending' ? 'bg-rose-50 border-rose-300 text-rose-700 font-black' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      🛑 ค้างยอด / รอสั่งโอนตรง
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTxStatus('success');
                        if (!editTxPayerBank) setEditTxPayerBank('ธนาคารกสิกรไทย');
                        if (!editTxPayerAccount) setEditTxPayerAccount('020-2-34918-1');
                        if (!editTxTransferTxId) setEditTxTransferTxId(`KBK-TX-${Math.floor(100000 + Math.random() * 899999)}`);
                        if (!editTxTransferredAt) {
                          const time = new Date().toLocaleTimeString('th-TH').substring(0, 5);
                          setEditTxTransferredAt(`${editTxYear + 543}-${editTxMonth.toString().padStart(2, '0')}-07 ${time} น.`);
                        }
                      }}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${editTxStatus === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-black' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      ✅ โอนเงินชำระสำเร็จแล้ว
                    </button>
                  </div>
                </div>

                {/* Conditional fields if STATUS is success */}
                {editTxStatus === 'success' && (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 mt-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ธนาคารต้นทางผู้โอน</label>
                      <select
                        value={editTxPayerBank}
                        onChange={(e) => setEditTxPayerBank(e.target.value)}
                        className="w-full bg-white border border-slate-255 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 text-xs font-bold"
                      >
                        <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                        <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                        <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                        <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                        <option value="ธนาคารธ.ก.ส">ธนาคารธ.ก.ส</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">หมายเลขบัญชีต้นทาง</label>
                      <input
                        type="text"
                        value={editTxPayerAccount}
                        onChange={(e) => setEditTxPayerAccount(e.target.value)}
                        placeholder="เช่น 020-2-34918-1"
                        className="w-full bg-white border border-slate-255 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">รหัสอ้างอิงอุดหนุน (Tx Ref ID)</label>
                      <input
                        type="text"
                        value={editTxTransferTxId}
                        onChange={(e) => setEditTxTransferTxId(e.target.value)}
                        placeholder="เช่น KBK-TX-928104"
                        className="w-full bg-white border border-slate-255 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">เลขนำเอกสารคลังรับแบบ (Receipt No)</label>
                      <input
                        type="text"
                        value={editTxReceiptNo}
                        onChange={(e) => setEditTxReceiptNo(e.target.value)}
                        placeholder="เช่น REC-256901-0498"
                        className="w-full bg-white border border-slate-255 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ผู้ทำธุรกรรมและอนุมัติหลัก</label>
                      <input
                        type="text"
                        value={editTxTransferredBy}
                        onChange={(e) => setEditTxTransferredBy(e.target.value)}
                        placeholder="เช่น อาภิวัฒน์ บัญชี"
                        className="w-full bg-white border border-slate-255 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">วันที่และเวลาตัดเงินโอน</label>
                      <input
                        type="text"
                        value={editTxTransferredAt}
                        onChange={(e) => setEditTxTransferredAt(e.target.value)}
                        placeholder="เช่น 2569-02-07 10:45 น."
                        className="w-full bg-white border border-slate-255 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 font-bold">
                {!isEditingNew && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTransferRecord(activeTransferToEdit.id)}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบข้อมูลนี้
                  </button>
                )}
                
                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTransferToEdit(null)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer text-center font-bold text-xs"
                  >
                    ยกเลิกแบบ
                  </button>
                  <button
                    onClick={handleSaveTransferRecord}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-800 hover:to-blue-800 text-white font-black rounded-xl text-center shadow-lg shadow-indigo-505/10 cursor-pointer text-xs"
                  >
                    บันทึกข้อมูลธุรกรรม
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
