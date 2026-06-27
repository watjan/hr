import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  FileCheck,
  FileText,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Users
} from 'lucide-react';
import { Cheque, ChequePayer, ChequePayee } from '../types';

interface ChequesViewProps {
  activeSubTab: 'incoming' | 'outgoing' | 'payers' | 'payees';
  cheques: Cheque[];
  setCheques: React.Dispatch<React.SetStateAction<Cheque[]>>;
  payers: ChequePayer[];
  setPayers: React.Dispatch<React.SetStateAction<ChequePayer[]>>;
  payees: ChequePayee[];
  setPayees: React.Dispatch<React.SetStateAction<ChequePayee[]>>;
}

export const DEFAULT_CHEQUES: Cheque[] = [
  {
    id: "CHQ-001",
    chequeNumber: "12345678",
    bankName: "ธนาคารกสิกรไทย",
    branch: "สยามพารากอน",
    chequeDate: "2026-06-25",
    amount: 150000,
    partyName: "บริษัท สยาม คิทเช่น จำกัด",
    type: "incoming",
    status: "pending_deposit",
    note: "เงินมัดจำค่าเครื่องครัวชุดสแตนเลสสตีล"
  },
  {
    id: "CHQ-002",
    chequeNumber: "87654321",
    bankName: "ธนาคารไทยพาณิชย์",
    branch: "สุขุมวิท 39",
    chequeDate: "2026-06-18",
    amount: 85000,
    partyName: "หจก. อร่อยดีดี ดิสทริบิวชั่น",
    type: "incoming",
    status: "cleared",
    note: "ขำระส่วนที่เหลือใบสั่งซื้อ #PO202605"
  },
  {
    id: "CHQ-003",
    chequeNumber: "45612378",
    bankName: "ธนาคารกรุงเทพ",
    branch: "สีลม",
    chequeDate: "2026-06-30",
    amount: 45000,
    partyName: "บริษัท สเตนเลสไทย พาวเวอร์",
    type: "outgoing",
    status: "pending_deposit",
    note: "ชำระค่าเพลตสแตนเลสแผ่นรอบเดือน"
  },
  {
    id: "CHQ-004",
    chequeNumber: "98751243",
    bankName: "ธนาคารกรุงไทย",
    branch: "อโศก",
    chequeDate: "2026-06-10",
    amount: 120000,
    partyName: "บจก. บางกอก แก๊ส อินเตอร์",
    type: "outgoing",
    status: "cleared",
    note: "จ่ายมัดจำตู้อบอุตสาหกรรมขนาดใหญ่"
  },
  {
    id: "CHQ-005",
    chequeNumber: "11223344",
    bankName: "ธนาคารกสิกรไทย",
    branch: "เซ็นทรัลเวิลด์",
    chequeDate: "2026-05-20",
    amount: 32000,
    partyName: "ร้านอาหาร แซ่บสตรีทฟู้ด",
    type: "incoming",
    status: "bounced",
    note: "เช็คเด้ง (ติดต่อลูกค้าขอนำฝากใหม่แล้ว)"
  },
  {
    id: "CHQ-006",
    chequeNumber: "55667788",
    bankName: "ธนาคารกรุงศรีอยุธยา",
    branch: "รัชดาภิเษก",
    chequeDate: "2026-06-28",
    amount: 98000,
    partyName: "หจก. ยูนิเวอร์แซล โลหะกิจ",
    type: "incoming",
    status: "pending_receipt",
    note: "ยังค้างรับเล่มเช็คจากสำนักงานใหญ่"
  },
  {
    id: "CHQ-007",
    chequeNumber: "44558899",
    bankName: "ธนาคารกรุงเทพ",
    branch: "เยาวราช",
    chequeDate: "2026-06-29",
    amount: 60000,
    partyName: "บริษัท เฟอร์นิเจอร์ โมเดิร์น ซัพพลาย บจก.",
    type: "outgoing",
    status: "pending_receipt",
    note: "ค้างจ่ายเช็ค (นัดผู้ค้าเข้ามารับวันที่ 29 ช่วงบ่าย)"
  }
];

export const INITIAL_PAYERS: ChequePayer[] = [
  { id: 'pyr-1', name: 'บริษัท สยาม คิทเช่น จำกัด', taxId: '0105560123456', phone: '02-123-4567', email: 'siamkitchen@example.com', address: '123 ถ.หลักเมือง แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร' },
  { id: 'pyr-2', name: 'หจก. อร่อยดีดี ดิสทริบิวชั่น', taxId: '0105562001122', phone: '081-332-2110', email: 'aroy_dd@example.com', address: '45/8 ถ.อ่อนนุช แขวงประเวศ เขตประเวศ กรุงเทพมหานคร' },
  { id: 'pyr-3', name: 'ร้านอาหาร แซ่บสตรีทฟู้ด', taxId: '0305560000345', phone: '095-888-7766', email: 'sab_street@example.com', address: '99 หมู่ 3 ต.บึงน้ำรักษ์ อ.ธัญบุรี จ.ปทุมธานี' },
  { id: 'pyr-4', name: 'หจก. ยูนิเวอร์แซล โลหะกิจ', taxId: '0105558000456', phone: '02-777-8899', email: 'universal_metal@example.com', address: '10/12 ถ.พระราม 2 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพมหานคร' }
];

export const INITIAL_PAYEES: ChequePayee[] = [
  { id: 'pye-1', name: 'บริษัท สเตนเลสไทย พาวเวอร์', taxId: '0105560111222', phone: '02-543-2100', email: 'stainless_thai@example.com', address: '55/9 ถ.หนองจอก แขวงกระทุ่มราย เขตหนองจอก กรุงเทพมหานคร' },
  { id: 'pye-2', name: 'บจก. บางกอก แก๊ส อินเตอร์', taxId: '0105559000123', phone: '02-888-1111', email: 'bkk_gas@example.com', address: '12-14 ถ.จรัญสนิทวงศ์ แขวงบ้านช่างหล่อ เขตบางกอกน้อย กรุงเทพมหานคร' },
  { id: 'pye-3', name: 'บริษัท เฟอร์นิเจอร์ โมเดิร์น ซัพพลาย บจก.', taxId: '0105559876543', phone: '02-987-6543', email: 'modern_furn@example.com', address: '45/6 ถ.รามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร' }
];

export default function ChequesView({ 
  activeSubTab, 
  cheques, 
  setCheques,
  payers,
  setPayers,
  payees,
  setPayees
}: ChequesViewProps) {
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Directory Modal state
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [partyType, setPartyType] = useState<'payers' | 'payees'>('payers');
  const [editingParty, setEditingParty] = useState<ChequePayer | ChequePayee | null>(null);
  const [partyFormName, setPartyFormName] = useState('');
  const [partyFormTaxId, setPartyFormTaxId] = useState('');
  const [partyFormPhone, setPartyFormPhone] = useState('');
  const [partyFormEmail, setPartyFormEmail] = useState('');
  const [partyFormAddress, setPartyFormAddress] = useState('');
  const [deletePartyId, setDeletePartyId] = useState<string | null>(null);
  const [expandedPartyId, setExpandedPartyId] = useState<string | null>(null);

  // Form states
  const [formChequeNumber, setFormChequeNumber] = useState('');
  const [formBankName, setFormBankName] = useState('ธนาคารกสิกรไทย');
  const [formBranch, setFormBranch] = useState('');
  const [formChequeDate, setFormChequeDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formPartyName, setFormPartyName] = useState('');
  const [formStatus, setFormStatus] = useState<'pending_receipt' | 'pending_deposit' | 'cleared' | 'bounced' | 'cancelled'>('pending_deposit');
  const [formNote, setFormNote] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number_asc' | 'number_desc' | 'date_desc' | 'date_asc'>('number_asc');
  
  // Pagination State for Outgoing Cheques Register
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setSortBy('number_asc');
    setCurrentPage(1);
    setMonthFilter('all');
    setYearFilter('all');
  }, [activeSubTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, bankFilter, monthFilter, yearFilter]);

  // Open modal for editing or adding
  const handleOpenModal = (cheque: Cheque | null = null) => {
    if (cheque) {
      setEditingCheque(cheque);
      setFormChequeNumber(cheque.chequeNumber);
      setFormBankName(cheque.bankName);
      setFormBranch(cheque.branch);
      setFormChequeDate(cheque.chequeDate);
      setFormAmount(cheque.amount.toString());
      setFormPartyName(cheque.partyName);
      setFormStatus(cheque.status);
      setFormNote(cheque.note || '');
    } else {
      setEditingCheque(null);
      setFormChequeNumber('');
      setFormBankName('ธนาคารกสิกรไทย');
      setFormBranch('');
      setFormChequeDate(new Date().toISOString().split('T')[0]);
      setFormAmount('');
      setFormPartyName('');
      // Default corresponding appropriate default status
      setFormStatus(activeSubTab === 'incoming' ? 'pending_deposit' : 'pending_deposit');
      setFormNote('');
    }
    setIsModalOpen(true);
  };

  const handleSaveCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChequeNumber || !formAmount || !formPartyName) {
      alert('กรุณากรอกข้อมูลหลักให้ครบถ้วน (เลขที่เช็ค, จำนวนเงิน, และคู่ค้า)');
      return;
    }

    const numericAmount = parseFloat(formAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้องและมีค่ามากกว่า 0');
      return;
    }

    if (editingCheque) {
      // Update
      const updated = cheques.map(item => {
        if (item.id === editingCheque.id) {
          return {
            ...item,
            chequeNumber: formChequeNumber,
            bankName: formBankName,
            branch: formBranch,
            chequeDate: formChequeDate,
            amount: numericAmount,
            partyName: formPartyName,
            status: formStatus,
            note: formNote,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      setCheques(updated);
    } else {
      // Create new
      const newCheque: Cheque = {
        id: `CHQ-${Date.now().toString().slice(-4)}`,
        chequeNumber: formChequeNumber,
        bankName: formBankName,
        branch: formBranch,
        chequeDate: formChequeDate,
        amount: numericAmount,
        partyName: formPartyName,
        type: (activeSubTab === 'incoming' || activeSubTab === 'payers') ? 'incoming' : 'outgoing',
        status: formStatus,
        note: formNote,
        updatedAt: new Date().toISOString()
      };
      setCheques([newCheque, ...cheques]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteCheque = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = (id: string) => {
    const updated = cheques.filter(ch => ch.id !== id);
    setCheques(updated);
    setDeleteConfirmId(null);
  };

  const handleUpdateStatusQuickly = (id: string, newStatus: typeof formStatus) => {
    const updated = cheques.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    setCheques(updated);
  };

  // Open modal for editing or adding directories (Payer or Payee)
  const handleOpenPartyModal = (party: ChequePayer | ChequePayee | null = null, overridingType: 'payers' | 'payees' | null = null) => {
    let resolvedType: 'payers' | 'payees' = 'payers';
    if (overridingType) {
      resolvedType = overridingType;
    } else if (activeSubTab === 'payees' || activeSubTab === 'outgoing') {
      resolvedType = 'payees';
    }
    setPartyType(resolvedType);

    if (party) {
      setEditingParty(party);
      setPartyFormName(party.name);
      setPartyFormTaxId(party.taxId || '');
      setPartyFormPhone(party.phone || '');
      setPartyFormEmail(party.email || '');
      setPartyFormAddress(party.address || '');
    } else {
      setEditingParty(null);
      setPartyFormName('');
      setPartyFormTaxId('');
      setPartyFormPhone('');
      setPartyFormEmail('');
      setPartyFormAddress('');
    }
    setIsPartyModalOpen(true);
  };

  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyFormName.trim()) {
      alert('กรุณากรอกชื่อหน่วยงานหรือรายชื่อติดต่ออย่างถูกต้อง');
      return;
    }

    const isPayersTab = partyType === 'payers';
    
    if (editingParty) {
      if (isPayersTab) {
        setPayers(payers.map(p => p.id === editingParty.id ? {
          ...p,
          name: partyFormName.trim(),
          taxId: partyFormTaxId.trim(),
          phone: partyFormPhone.trim(),
          email: partyFormEmail.trim(),
          address: partyFormAddress.trim()
        } : p));
      } else {
        setPayees(payees.map(p => p.id === editingParty.id ? {
          ...p,
          name: partyFormName.trim(),
          taxId: partyFormTaxId.trim(),
          phone: partyFormPhone.trim(),
          email: partyFormEmail.trim(),
          address: partyFormAddress.trim()
        } : p));
      }
    } else {
      const idPrefix = isPayersTab ? 'pyr' : 'pye';
      const newParty = {
        id: `${idPrefix}-${Date.now().toString().slice(-4)}`,
        name: partyFormName.trim(),
        taxId: partyFormTaxId.trim(),
        phone: partyFormPhone.trim(),
        email: partyFormEmail.trim(),
        address: partyFormAddress.trim(),
        createdAt: new Date().toISOString()
      };

      if (isPayersTab) {
        setPayers([newParty, ...payers]);
      } else {
        setPayees([newParty, ...payees]);
      }
      
      // Auto-select the newly added customer/supplier in the cheque form
      setFormPartyName(partyFormName.trim());
    }

    setIsPartyModalOpen(false);
  };

  const handleDeleteParty = (id: string) => {
    setDeletePartyId(id);
  };

  const executeDeleteParty = (id: string) => {
    const isPayersTab = activeSubTab === 'payers';
    if (isPayersTab) {
      setPayers(payers.filter(p => p.id !== id));
    } else {
      setPayees(payees.filter(p => p.id !== id));
    }
    setDeletePartyId(null);
  };

  // Extract statistics dynamically
  const isDirectoryTab = activeSubTab === 'payers' || activeSubTab === 'payees';

  const displayPayers = payers.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
           (p.taxId && p.taxId.includes(q)) ||
           (p.phone && p.phone.includes(q)) ||
           (p.address && p.address.toLowerCase().includes(q));
  });

  const displayPayees = payees.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
           (p.taxId && p.taxId.includes(q)) ||
           (p.phone && p.phone.includes(q)) ||
           (p.address && p.address.toLowerCase().includes(q));
  });

  const dirList = activeSubTab === 'payers' ? payers : payees;
  const filteredDirList = activeSubTab === 'payers' ? displayPayers : displayPayees;

  // Helper to get the lowest cheque number for a party to sort directories
  const getLowestChequeNumber = (partyName: string, type: 'incoming' | 'outgoing') => {
    const partyChs = cheques.filter(ch => ch.partyName === partyName && ch.type === type);
    if (partyChs.length === 0) return 'ZZZZZZZZZZZZZ'; // Sort contacts with no cheques to the bottom
    const sortedChs = [...partyChs].sort((a, b) => a.chequeNumber.localeCompare(b.chequeNumber, undefined, { numeric: true, sensitivity: 'base' }));
    return sortedChs[0].chequeNumber;
  };

  const sortedFilteredDirList = [...filteredDirList].sort((a, b) => {
    const type = activeSubTab === 'payers' ? 'incoming' : 'outgoing';
    const aVal = getLowestChequeNumber(a.name, type);
    const bVal = getLowestChequeNumber(b.name, type);
    return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
  });

  const dirCheques = cheques.filter(ch => ch.type === (activeSubTab === 'payers' ? 'incoming' : 'outgoing'));
  const totalDirChequesValue = dirCheques.reduce((sum, ch) => sum + ch.amount, 0);
  const dirAverageChequeValue = dirCheques.length > 0 ? (totalDirChequesValue / dirCheques.length) : 0;

  const filteredByTypeCheques = cheques.filter(ch => ch.type === (activeSubTab === 'payers' ? 'incoming' : activeSubTab === 'payees' ? 'outgoing' : activeSubTab));

  const stats = {
    totalItems: filteredByTypeCheques.length,
    totalVal: filteredByTypeCheques.reduce((sum, ch) => sum + ch.amount, 0),
    // Received / cleared cheques (เช็ครับแล้ว / ผ่านแล้ว)
    clearedVal: filteredByTypeCheques.filter(ch => ch.status === 'cleared').reduce((sum, ch) => sum + ch.amount, 0),
    clearedCount: filteredByTypeCheques.filter(ch => ch.status === 'cleared').length,
    // Unreceived / Still pending (ยังไม่รับ หรือ ค้างรับ / อยู่ระหว่างดำเนินการ)
    pendingVal: filteredByTypeCheques.filter(ch => ch.status === 'pending_deposit' || ch.status === 'pending_receipt').reduce((sum, ch) => sum + ch.amount, 0),
    pendingCount: filteredByTypeCheques.filter(ch => ch.status === 'pending_deposit' || ch.status === 'pending_receipt').length,
    // Bounced (เช็คเด้ง)
    bouncedVal: filteredByTypeCheques.filter(ch => ch.status === 'bounced').reduce((sum, ch) => sum + ch.amount, 0),
    bouncedCount: filteredByTypeCheques.filter(ch => ch.status === 'bounced').length,
  };

  // Distinct banks list for filtering
  const distinctBanks = Array.from(new Set(filteredByTypeCheques.map(ch => ch.bankName)));

  // Distinct years list for filtering
  const distinctYears = Array.from(new Set(filteredByTypeCheques.map(ch => ch.chequeDate ? ch.chequeDate.split('-')[0] : ''))).filter(Boolean).sort().reverse();

  // Thai months options
  const THAI_MONTH_OPTS = [
    { value: '01', label: 'มกราคม (Jan)' },
    { value: '02', label: 'กุมภาพันธ์ (Feb)' },
    { value: '03', label: 'มีนาคม (Mar)' },
    { value: '04', label: 'เมษายน (Apr)' },
    { value: '05', label: 'พฤษภาคม (May)' },
    { value: '06', label: 'มิถุนายน (Jun)' },
    { value: '07', label: 'กรกฎาคม (Jul)' },
    { value: '08', label: 'สิงหาคม (Aug)' },
    { value: '09', label: 'กันยายน (Sept)' },
    { value: '10', label: 'ตุลาคม (Oct)' },
    { value: '11', label: 'พฤศจิกายน (Nov)' },
    { value: '12', label: 'ธันวาคม (Dec)' }
  ];

  // Display filter logic
  const filteredDisplayCheques = filteredByTypeCheques.filter(ch => {
    // Search filter
    const matchesSearch = 
      ch.chequeNumber.includes(searchQuery) || 
      ch.partyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ch.branch.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (ch.note && ch.note.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'cleared' ? ch.status === 'cleared' :
      statusFilter === 'pending' ? (ch.status === 'pending_deposit' || ch.status === 'pending_receipt') :
      statusFilter === 'bounced' ? ch.status === 'bounced' :
      statusFilter === 'cancelled' ? ch.status === 'cancelled' : true;

    // Bank filter
    const matchesBank = bankFilter === 'all' ? true : ch.bankName === bankFilter;

    // Month & Year filter
    const dateParts = ch.chequeDate ? ch.chequeDate.split('-') : [];
    const matchesMonth = monthFilter === 'all' ? true : dateParts[1] === monthFilter;
    const matchesYear = yearFilter === 'all' ? true : dateParts[0] === yearFilter;

    return matchesSearch && matchesStatus && matchesBank && matchesMonth && matchesYear;
  });

  // Display sorted cheques based on selected option
  const displayCheques = [...filteredDisplayCheques].sort((a, b) => {
    if (sortBy === 'number_asc') {
      return a.chequeNumber.localeCompare(b.chequeNumber, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortBy === 'number_desc') {
      return b.chequeNumber.localeCompare(a.chequeNumber, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortBy === 'date_asc') {
      return a.chequeDate.localeCompare(b.chequeDate);
    } else { // 'date_desc'
      return b.chequeDate.localeCompare(a.chequeDate);
    }
  });

  // Pagination Constants for Outgoing Register
  const itemsPerPage = 10;
  const isPaginated = activeSubTab === 'outgoing' || activeSubTab === 'incoming';
  const totalPages = Math.ceil(displayCheques.length / itemsPerPage);
  
  // Slice displayCheques for mapping
  const paginatedCheques = isPaginated
    ? displayCheques.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : displayCheques;

  // Helper labels and colors
  const getStatusBadge = (status: Cheque['status']) => {
    switch (status) {
      case 'cleared':
        return {
          text: activeSubTab === 'incoming' ? 'รับเงินแล้ว / เช็คผ่านแล้ว' : 'จ่ายเงินแล้ว / เช็คตัดบัญชีแล้ว',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        };
      case 'pending_deposit':
        return {
          text: activeSubTab === 'incoming' ? 'ได้รับเช็คแล้ว / รอฝากขึ้นเงิน' : 'ออกเช็คแล้ว / รอเบิกขึ้นเงิน',
          bg: 'bg-blue-5 text-blue-700 border-blue-200 bg-blue-50/50',
          icon: <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" />
        };
      case 'pending_receipt':
        return {
          text: activeSubTab === 'incoming' ? 'ยังไม่ได้รับ / ค้างรับเล่มเช็ค' : 'ค้างออกเช็ค / ค้างรับเช็ค',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        };
      case 'bounced':
        return {
          text: 'เช็คเด้ง / ปฏิเสธจ่ายเงิน',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        };
      case 'cancelled':
        return {
          text: 'ยกเลิก / ชำรุด',
          bg: 'bg-slate-100 text-slate-500 border-slate-200',
          icon: <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        };
    }
  };

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const year = parseInt(parts[0]) + 543;
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const month = months[parseInt(parts[1]) - 1];
    const day = parseInt(parts[2]);
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION BANNER SUMMARY STATS */}
      {!isDirectoryTab ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1 Total */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {activeSubTab === 'incoming' ? 'ยอดเช็คขารับทั้งหมด' : 'ยอดเช็คขาจ่ายทั้งหมด'}
              </p>
              <h3 className="text-xl font-black text-slate-900 leading-none">
                ฿{stats.totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">{stats.totalItems} รายการธุรกรรมเช็ค</p>
            </div>
            <div className={`w-11 h-11 rounded-xl ${activeSubTab === 'incoming' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center shrink-0`}>
              {activeSubTab === 'incoming' ? <ArrowDownLeft className="w-6 h-6 font-bold" /> : <ArrowUpRight className="w-6 h-6 font-bold" />}
            </div>
          </div>

          {/* Card 2 Cleared / Received */}
          <div className="bg-emerald-50/20 bg-white p-5 rounded-2xl border border-emerald-100 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                {activeSubTab === 'incoming' ? 'รับเงิินผ่านบัญชีแล้ว' : 'เงินตัดจ่ายสำเร็จแล้ว'}
              </p>
              <h3 className="text-xl font-black text-emerald-800 leading-none">
                ฿{stats.clearedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-emerald-600 font-extrabold">{stats.clearedCount} รายการเช็คที่ผ่านแล้ว</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 font-bold" />
            </div>
          </div>

          {/* Card 3 Still Pending / Unreceived */}
          <div className="bg-amber-50/20 bg-white p-5 rounded-2xl border border-amber-100 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">
                {activeSubTab === 'incoming' ? 'ยังไม่ได้ขึ้นเงิน / รอขึ้นเงิน' : 'รอขึ้นเงิน / ค้างแสดงตน'}
              </p>
              <h3 className="text-xl font-black text-amber-800 leading-none">
                ฿{stats.pendingVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-amber-600 font-extrabold">{stats.pendingCount} รายการค้างดำเนินการ</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 font-bold" />
            </div>
          </div>

          {/* Card 4 Bounced */}
          <div className="bg-rose-50/20 bg-white p-5 rounded-2xl border border-rose-100 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">เช็คเด้ง / ค้างปฏิเสธสั่งจ่าย</p>
              <h3 className="text-xl font-black text-rose-800 leading-none">
                ฿{stats.bouncedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-rose-600 font-extrabold">{stats.bouncedCount} รายการเช็คมีปัญหา</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 font-bold animate-bounce" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Directory Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {activeSubTab === 'payers' ? 'ผู้สั่งจ่ายเช็คขารับ' : 'ผู้รับเช็คขาจ่าย'}
              </p>
              <h3 className="text-xl font-black text-slate-900 leading-none">
                {filteredDirList.length} / {dirList.length} ราย
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">รายชื่อผู้ติดต่อที่ลงทะเบียน</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 font-bold" />
            </div>
          </div>

          {/* Directory Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                จำนวนเช็คออกยอดสะสม
              </p>
              <h3 className="text-xl font-black text-slate-900 leading-none">
                {dirCheques.length} ฉบับ
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">ยอดจำนวนนิติกรรมเช็ค</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 font-bold" />
            </div>
          </div>

          {/* Directory Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                มูลค่านิติกรรมสะสม
              </p>
              <h3 className="text-xl font-black text-slate-950 leading-none">
                ฿{totalDirChequesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">ยอดวงเงินเช็ครวมสะสม</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 font-bold" />
            </div>
          </div>

          {/* Directory Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                มูลค่าเช็คเฉลี่ย/ฉบับ
              </p>
              <h3 className="text-xl font-black text-slate-900 leading-none">
                ฿{dirAverageChequeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold font-mono">เฉลี่ยต่อตราสารเช็ค</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 font-bold" />
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          
          {/* Leftside selectors */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={isDirectoryTab ? "ค้นหาชื่อลูกค้า, เลขประจำตัวผู้เสียภาษี, โทรศัพท์..." : "เลขที่เช็ค, ชื่อลูกค้า/คู่ค้า, สาขา..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>

            {!isDirectoryTab && (
              <>
                {/* Quick Status Buttons "จ่ายแล้ว - ยังไม่จ่าย" */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white text-slate-800 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('cleared')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === 'cleared'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-slate-550 hover:text-emerald-600 hover:bg-white/40'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'cleared' ? 'bg-white' : 'bg-emerald-500'}`} />
                    จ่ายแล้ว
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'text-slate-550 hover:text-amber-600 hover:bg-white/40'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'pending' ? 'bg-white' : 'bg-amber-500'}`} />
                    ยังไม่จ่าย
                  </button>
                </div>

                {/* Sort Option Dropdown for Cheque Numbers and Dates */}
                <div className="relative w-full sm:w-48">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="pl-3 pr-8 py-2 w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 appearance-none font-sans"
                  >
                    <option value="number_asc">🔢 ตามเลขเช็ค (น้อย-มาก)</option>
                    <option value="number_desc">🔢 ตามเลขเช็ค (มาก-น้อย)</option>
                    <option value="date_desc">📅 วันที่พึงรับจ่าย (ล่าสุด-เก่าสุด)</option>
                    <option value="date_asc">📅 วันที่พึงรับจ่าย (เก่าสุด-ล่าสุด)</option>
                  </select>
                  <span className="absolute right-3.5 top-3.5 text-[8px] pointer-events-none text-slate-500">▼</span>
                </div>

                {/* Bank Filter Select */}
                <div className="relative w-full sm:w-44">
                  <select
                    value={bankFilter}
                    onChange={(e) => setBankFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 appearance-none"
                  >
                    <option value="all">ทุกธนาคารสั่งจ่าย</option>
                    {distinctBanks.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-3.5 text-[8px] pointer-events-none text-slate-500">▼</span>
                </div>

                {/* Month Filter Select */}
                <div className="relative w-full sm:w-36">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 appearance-none"
                  >
                    <option value="all">🗓️ ทุกเดือน</option>
                    {THAI_MONTH_OPTS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-3.5 text-[8px] pointer-events-none text-slate-500">▼</span>
                </div>

                {/* Year Filter Select */}
                <div className="relative w-full sm:w-32">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 appearance-none"
                  >
                    <option value="all">📅 ทุกปี</option>
                    {distinctYears.map((y) => (
                      <option key={y} value={y}>ปี {y} (พ.ศ. {parseInt(y) + 543})</option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-3.5 text-[8px] pointer-events-none text-slate-500">▼</span>
                </div>
              </>
            )}
          </div>

          {/* Rightside Action Trigger to Add */}
          <div className="w-full lg:w-auto flex justify-end shrink-0 select-none">
            {isDirectoryTab ? (
              <button
                onClick={() => handleOpenPartyModal(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" />
                {activeSubTab === 'payers' ? 'ลงทะเบียนลูกค้าผู้สั่งจ่ายเช็คขารับเพิ่ม' : 'ลงทะเบียนผู้ติดต่อสั่งรับเช็คเพิ่ม'}
              </button>
            ) : (
              <button
                onClick={() => handleOpenModal(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" />
                ลงทะเบียนบันทึกเช็ค{activeSubTab === 'incoming' ? 'ขารับ' : 'ขาจ่าย'}ใหม่
              </button>
            )}
          </div>

        </div>
      </div>

      {/* CORE CHEQUES DATA GRID TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center select-none">
          <h4 className="text-xs font-black text-slate-800">
            {activeSubTab === 'incoming' && 'ทะเบียนหนังสือสำคัญทางการเงิน (เช็คขารับ)'}
            {activeSubTab === 'outgoing' && 'ทะเบียนบันทึกจ่ายเงินผู้ค้าด้วยกระดาษ (เช็คขาจ่าย)'}
            {activeSubTab === 'payers' && 'ระเบียนรายชื่อลูกค้าผู้สั่งจ่ายเช็คขารับ (Incoming Payer Directory)'}
            {activeSubTab === 'payees' && 'ระเบียนรายชื่อลูกค้า/ผู้รับเงินเช็คขาจ่าย (Outgoing Payee Directory)'}
          </h4>
          <span className="text-[10px] text-slate-500 font-extrabold bg-slate-200 px-2 py-0.5 rounded-full">
            {isDirectoryTab ? `ลงทะเบียนไว้ ${filteredDirList.length} รายชื่อ` : `แสดง ${displayCheques.length} รายการเช็ค`}
          </span>
        </div>

        {isDirectoryTab ? (
          // DIRECTORIES GRID
          filteredDirList.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-500">ไม่พบข้อมูลผู้ติดต่อที่ต้องการค้นหา</p>
              <p className="text-[11px] text-slate-400">ทดลองพิมค้นหาแบรนด์, ชื่อองค์กร, เบอร์โทร หรือกดปุ่มลงทะเบียนข้อมูลใหม่</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-widest font-black select-none">
                    <th className="py-3 px-4">ชื่อผู้ติดต่อ / หน่วยงาน</th>
                    <th className="py-3 px-4">เลขประจำตัวผู้เสียภาษี</th>
                    <th className="py-3 px-4">การติดต่อ</th>
                    <th className="py-3 px-4">ที่อยู่จดทะเบียนส่งเอกสาร</th>
                    <th className="py-3 px-4 text-center">สถิติเช็คสะสม</th>
                    <th className="py-3 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {sortedFilteredDirList.map((party) => {
                    const partyCheques = cheques
                      .filter(ch => ch.partyName === party.name && ch.type === (activeSubTab === 'payers' ? 'incoming' : 'outgoing'))
                      .sort((a, b) => a.chequeNumber.localeCompare(b.chequeNumber, undefined, { numeric: true, sensitivity: 'base' }));
                    const sumAmount = partyCheques.reduce((sum, ch) => sum + ch.amount, 0);
                    const isExpanded = expandedPartyId === party.id;
                    
                    return (
                      <React.Fragment key={party.id}>
                        <tr 
                          onClick={() => setExpandedPartyId(isExpanded ? null : party.id)}
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-650 flex items-center justify-center font-bold">
                                {party.name.slice(0, 2)}
                              </div>
                              <div>
                                <strong className="text-slate-900 font-extrabold text-xs block">{party.name}</strong>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-slate-400 font-bold font-mono">ID: {party.id}</span>
                                  {partyCheques.length > 0 && (
                                    <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded font-mono font-black">
                                      เช็คแรก: #{partyCheques[0].chequeNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono font-bold">
                            {party.taxId || '-'}
                          </td>
                          <td className="py-3.5 px-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{party.phone || '-'}</span>
                            </div>
                            {party.email && (
                              <div className="flex items-center gap-1.5 text-slate-500 font-normal">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{party.email}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-normal max-w-sm truncate" title={party.address}>
                            {party.address || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xs font-black text-indigo-950 font-mono">
                                ฿{sumAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-extrabold mt-1">
                                {partyCheques.length} ฉบับ • {isExpanded ? 'คลิกพับปิด' : 'คลิกดูรายการ'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenPartyModal(party)}
                                title="แก้ไขรายชื่อผู้ติดต่อ"
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteParty(party.id)}
                                title="ลบรายชื่อตู้อัตโนมัติ"
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Collapsible associated cheques list row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-slate-50 p-4 border-y border-slate-150">
                              <div className="space-y-2 max-w-4xl mx-auto">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5 text-slate-400" />
                                    รายการตราสารเช็คที่เกี่ยวข้องกับ "{party.name}" ({partyCheques.length} รายการ)
                                  </h5>
                                  <button
                                    onClick={() => handleOpenModal({
                                      id: '',
                                      chequeNumber: '',
                                      bankName: 'ธนาคารกสิกรไทย',
                                      branch: '',
                                      chequeDate: new Date().toISOString().split('T')[0],
                                      amount: 0,
                                      partyName: party.name,
                                      type: activeSubTab === 'payers' ? 'incoming' : 'outgoing',
                                      status: 'pending_deposit'
                                    })}
                                    className="px-2 py-1 text-[10px] font-extrabold bg-slate-900 border border-slate-800 text-white rounded-md hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    ออกบันทึกเช็ดใหม่ให้ลูกค้ารายนี้
                                  </button>
                                </div>
                                
                                {partyCheques.length === 0 ? (
                                  <p className="text-[11px] text-slate-450 italic p-3 text-center bg-white border border-slate-200 rounded-lg">
                                    ยังไม่พบบันทึกเช็คผูกกับผู้ติดต่อรายนี้
                                  </p>
                                ) : (
                                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                                    <table className="w-full text-left col-collapse text-[11px]">
                                      <thead>
                                        <tr className="bg-slate-100 text-slate-500 font-black border-b border-slate-200 select-none">
                                          <th className="p-2">เลขที่เช็ค</th>
                                          <th className="p-2">ธนาคารสั่งจ่าย</th>
                                          <th className="p-2">วันที่ลงเช็ค</th>
                                          <th className="p-2 text-right">จำนวนเงิน</th>
                                          <th className="p-2 text-center">สถานะ</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {partyCheques.map(chk => {
                                          const badge = getStatusBadge(chk.status);
                                          return (
                                            <tr key={chk.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                              <td className="p-2 font-mono font-bold text-slate-900">{chk.chequeNumber}</td>
                                              <td className="p-2 text-slate-700">{chk.bankName} (สาขา {chk.branch || 'สำนักงานใหญ่'})</td>
                                              <td className="p-2 text-slate-600">{formatThaiDate(chk.chequeDate)}</td>
                                              <td className="p-2 text-right font-bold text-indigo-950 font-mono">฿{chk.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                              <td className="p-2 text-center select-none">
                                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-black rounded-full border ${badge.bg}`}>
                                                  {badge.text}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // CHEQUES LIST
          displayCheques.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-500">ไม่พบรายการจัดเก็บบันทึกข้อมูลเช็คตามเงื่อนไขการค้นหานี้</p>
              <p className="text-[11px] text-slate-400">ทดลองสลับฟิลเตอร์หรือกดเพิ่มการลงทะเบียนเช็คใหม่ในระบบ</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-widest font-black select-none">
                    <th className="py-3 px-4 text-center w-12 shrink-0">ลำดับ</th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/85 transition-colors group"
                      onClick={() => {
                        setSortBy(prev => prev === 'number_asc' ? 'number_desc' : 'number_asc');
                      }}
                      title="คลิกเพื่อสลับการเรียงตามเลขที่เช็ค"
                    >
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>เลขที่เช็ค / ธนาคาร</span>
                        <span className="text-slate-400 group-hover:text-blue-600 transition-colors text-[9px] font-mono leading-none">
                          {sortBy === 'number_asc' ? '▲ (น้อย-มาก)' : sortBy === 'number_desc' ? '▼ (มาก-น้อย)' : '↕'}
                        </span>
                      </div>
                    </th>
                    <th className="py-3 px-4">{activeSubTab === 'incoming' ? 'ชื่อลูกค้า (ผู้สั่งจ่าย)' : 'ชื่อคู่ค้า (ผู้รับเงิน)'}</th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/85 transition-colors group"
                      onClick={() => {
                        setSortBy(prev => prev === 'date_asc' ? 'date_desc' : 'date_asc');
                      }}
                      title="คลิกเพื่อสลับการเรียงตามวันครบกำหนด"
                    >
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>วันครบกำหนด (บนเช็ค)</span>
                        <span className="text-slate-400 group-hover:text-blue-600 transition-colors text-[9px] font-mono leading-none">
                          {sortBy === 'date_asc' ? '▲ (เก่า-ใหม่)' : sortBy === 'date_desc' ? '▼ (ใหม่-เก่า)' : '↕'}
                        </span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">จำนวนเงินสุทธิ</th>
                    <th className="py-3 px-4 text-center">สถานะเช็ค</th>
                    <th className="py-3 px-4 text-center">ทางเลือกด่วน</th>
                    <th className="py-3 px-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {paginatedCheques.map((item, idx) => {
                    const badgeInfo = getStatusBadge(item.status);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-400 select-none bg-slate-50/20 w-12">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-slate-400 shrink-0" />
                            <strong className="text-slate-900 font-extrabold font-mono text-sm">{item.chequeNumber}</strong>
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            {item.bankName} • สาขา {item.branch || 'ทั่วไป'}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.partyName}
                          {item.note && (
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">{item.note}</p>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatThaiDate(item.chequeDate)}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right text-sm font-black text-indigo-950 font-mono">
                          ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-center select-none">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${badgeInfo.bg}`}>
                            {badgeInfo.icon}
                            {badgeInfo.text}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center select-none">
                          {/* QUICK ACTIONS STATUS TOGGLE SWITCHES */}
                          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs gap-0.5">
                            <button
                              onClick={() => handleUpdateStatusQuickly(item.id, 'cleared')}
                              title={activeSubTab === 'incoming' ? "ทำเครื่องหมาย: เคลียร์/รับเงินจริงแล้ว" : "ทำเครื่องหมาย: หักยอดจ่ายจริงแล้ว"}
                              className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                                item.status === 'cleared'
                                  ? 'bg-emerald-600 text-white font-black'
                                  : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {activeSubTab === 'incoming' ? 'รับเงินแล้ว' : 'จ่ายแล้ว'}
                            </button>
                            <button
                              onClick={() => handleUpdateStatusQuickly(item.id, 'pending_deposit')}
                              title={activeSubTab === 'incoming' ? "ทำเครื่องหมาย: ตราสารคงค้าง" : "ทำเครื่องหมาย: รอไปขึ้นตัดจ่าย"}
                              className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                                item.status === 'pending_deposit' || item.status === 'pending_receipt'
                                  ? 'bg-amber-500 text-white font-black'
                                  : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                              }`}
                            >
                              {activeSubTab === 'incoming' ? 'ค้างรับ' : 'ยังไม่จ่าย'}
                            </button>
                            <button
                              onClick={() => handleUpdateStatusQuickly(item.id, 'bounced')}
                              title="ทำเครื่องหมาย: เช็คเด้งมีปากเสียง"
                              className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                                item.status === 'bounced'
                                  ? 'bg-rose-600 text-white font-black animate-pulse'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              เด้ง
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right select-none">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenModal(item)}
                              title="แก้ไขบันทึกเช็ดเล่มนี้"
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCheque(item.id)}
                              title="ลบเช็คนี้ออกจากระบบ"
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
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
            </div>

            {/* Premium Pagination Controls */}
            {isPaginated && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100 font-sans select-none">
                <div className="text-[11px] font-bold text-slate-500">
                  แสดง <span className="font-extrabold text-slate-950 font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> ถึง{" "}
                  <span className="font-extrabold text-slate-950 font-mono">
                    {Math.min(currentPage * itemsPerPage, displayCheques.length)}
                  </span>{" "}
                  จากทั้งหมด <span className="font-extrabold text-slate-950 font-mono">{displayCheques.length}</span> รายการ
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    ก่อนหน้า
                  </button>
                  {(() => {
                    // Show a maximum of 5 page buttons with smart ellipses for superior UI
                    const pageRange = [];
                    const maxVisible = 5;
                    let start = Math.max(1, currentPage - 2);
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }
                    for (let p = start; p <= end; p++) {
                      pageRange.push(p);
                    }
                    return (
                      <>
                        {start > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentPage(1)}
                              className={`h-7.5 min-w-[30px] px-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                                currentPage === 1
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                  : "border-transparent text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              1
                            </button>
                            {start > 2 && <span className="text-slate-350 text-[10px] px-0.5 select-none font-bold">...</span>}
                          </>
                        )}
                        {pageRange.map((p) => (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`h-7.5 min-w-[30px] px-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                              currentPage === p
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "border-transparent text-slate-600 hover:bg-slate-100 hover:border-slate-200"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        {end < totalPages && (
                          <>
                            {end < totalPages - 1 && <span className="text-slate-350 text-[10px] px-0.5 select-none font-bold">...</span>}
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className={`h-7.5 min-w-[30px] px-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                                currentPage === totalPages
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                  : "border-transparent text-slate-600 hover:bg-slate-100 border-slate-200"
                              }`}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </>
                    );
                  })()}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}
      </div>

      {/* DETAILED ADD / EDIT CHEQUE POPUP MODAL DIALOG */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-700"
            >
              {/* Modal header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {editingCheque ? 'แก้ไขบันทึกเช็คสำคัญทางการเงิน' : `ลงทะเบียนประวัติตราสารเช็ค ${activeSubTab === 'incoming' ? 'ขารับ (Incoming)' : 'ขาจ่าย (Outgoing)'}`}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      รหัสชั่วคราว: {editingCheque ? editingCheque.id : 'สร้างอัตโนมัติ'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 w-6 h-6 hover:bg-slate-200 rounded-full transition-colors cursor-pointer text-slate-400 font-extrabold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Form container code */}
              <form onSubmit={handleSaveCheque} className="p-5 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Cheque number input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">เลขที่เช็ค (Cheque No.) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      maxLength={15}
                      required
                      placeholder="เช่น 10045231"
                      value={formChequeNumber}
                      onChange={(e) => setFormChequeNumber(e.target.value.replace(/\D/g, ''))} // numbers only
                      className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white"
                    />
                  </div>

                  {/* Cheque Date Calendar */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">วันที่ครบกำหนดตามเช็ค <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={formChequeDate}
                      onChange={(e) => setFormChequeDate(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Bank Name Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">ธนาคาร <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select
                        value={formBankName}
                        onChange={(e) => setFormBankName(e.target.value)}
                        className="w-full text-xs font-extrabold p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white appearance-none"
                      >
                        <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย (KBank)</option>
                        <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
                        <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
                        <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย (KTB)</option>
                        <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                        <option value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต (ttb)</option>
                        <option value="ธนาคารออมสิน">ธนาคารออมสิน (GSB)</option>
                        <option value="ธนาคารธ.ก.ส">ธนาคารธ.ก.ส (BAAC)</option>
                      </select>
                      <span className="absolute right-3 top-3 text-[10px] pointer-events-none text-slate-500">▼</span>
                    </div>
                  </div>

                  {/* Branch Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">สาขาธนาคาร</label>
                    <input
                      type="text"
                      placeholder="เช่น อโศก, บางนา"
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">จำนวนเงิน (฿) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 150000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-indigo-900 focus:bg-white font-mono"
                    />
                  </div>

                  {/* Party Name Input */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-black text-slate-600 block">
                        {(activeSubTab === 'incoming' || activeSubTab === 'payers') ? 'ชื่อผู้สั่งจ่าย (ลูกค้า)' : 'ชื่อผู้รับเงิน (ซัพพลายเออร์)'} <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenPartyModal(null, (activeSubTab === 'incoming' || activeSubTab === 'payers') ? 'payers' : 'payees')}
                        className="text-[10px] text-blue-600 hover:underline font-black flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" /> ลงทะเบียนใหม่
                      </button>
                    </div>
                    
                    <div className="space-y-1.5">
                      <select
                        onChange={(e) => {
                          if (e.target.value !== "") {
                            setFormPartyName(e.target.value);
                          }
                        }}
                        value={(activeSubTab === 'incoming' || activeSubTab === 'payers' ? payers : payees).some(p => p.name === formPartyName) ? formPartyName : ""}
                        className="w-full text-xs font-bold p-2 bg-blue-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850"
                      >
                        <option value="">-- เลือกนำเข้าหลักจากฐานข้อมูลรายชื่อจดทะเบียน --</option>
                        {(activeSubTab === 'incoming' || activeSubTab === 'payers' ? payers : payees).map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} {p.taxId ? `(Tax ID: ${p.taxId})` : ''}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        required
                        placeholder={(activeSubTab === 'incoming' || activeSubTab === 'payers') ? 'บริษัทผู้เช่า หรือชื่อลูกค้า' : 'ร้านค้า/ซัพพลายเออร์ส่งของ'}
                        value={formPartyName}
                        onChange={(e) => setFormPartyName(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">สถานะของเช็ค</label>
                  <div className="relative">
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full text-xs font-extrabold p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white appearance-none"
                    >
                      {activeSubTab === 'incoming' ? (
                        <>
                          <option value="pending_receipt">ค้างรับเช็คจริง (ค้างได้รับเล่มเช็ค)</option>
                          <option value="pending_deposit">ได้รับเช็คเล่มจริงแล้ว (รอไปฝากขึ้นเงินที่ธนาคาร)</option>
                          <option value="cleared">ผ่านด่านเรียกเก็บแล้ว (รับเงินสดเข้ากระเป๋าบัญชีเรียบร้อย)</option>
                          <option value="bounced">เช็คเด้ง (ธนาคารปัดปฏิเสธชำระเงินเนื่องจากไม่มีวงเงินสำรอง/ปิดบัญชี)</option>
                          <option value="cancelled">ยกเลิกเช็ค (แก้ไขฉบับ/พิมพ์ผิดพลาด)</option>
                        </>
                      ) : (
                        <>
                          <option value="pending_receipt">ค้างจ่ายเช็ค (ยังไม่มีการออกตัวเช็คจริงให้พาร์ทเนอร์)</option>
                          <option value="pending_deposit">ออกหน้าเช็คแล้ว (พาร์ทเนอร์ถือเช็ค รอไปเรียกเก็บยอด)</option>
                          <option value="cleared">เงินตัดตัดระบบเรียบร้อย (เช็คผ่านขึ้นบัญชีผู้รับไปแล้ว)</option>
                          <option value="bounced">เช็คตัดไม่ได้/ปฏิเสธจ่ายเงิน (ฝั่งตรงข้ามเบิกแล้วเด้งกลับ)</option>
                          <option value="cancelled">ยกเลิกหน้าเช็คใบนี้</option>
                        </>
                      )}
                    </select>
                    <span className="absolute right-3.5 top-3.5 text-[8px] pointer-events-none text-slate-500">▼</span>
                  </div>
                </div>

                {/* Additional Note */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">บันทึกช่วยจำเพิ่มเติม</label>
                  <textarea
                    rows={2}
                    placeholder="ใส่เป้าหมายอ้างอิง รหัสใบเสร็จอ้างอิง หรือหมายเหตุความคืบหน้า..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white resize-none"
                  />
                </div>

                {/* Submit Controls footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px] select-none">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 cursor-pointer transition-colors font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    {editingCheque ? 'บันทึกการเปลี่ยนแปลงตราสาร' : 'ยืนยันการลงทะเบียนเช็คเข้าระบบ'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD / EDIT CUSTOMER DIRECTORY POPUP MODAL DIALOG */}

      {/* ADD / EDIT CUSTOMER DIRECTORY POPUP MODAL DIALOG */}
      <AnimatePresence>
        {isPartyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-700 font-sans"
            >
              {/* Modal header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {editingParty ? 'แก้ไขฐานข้อมูลผู้ติดต่อ' : `ลงทะเบียนฐานข้อมูล ${partyType === 'payers' ? 'ลูกค้าผู้สั่งจ่ายเช็ค' : 'ผู้รับเช็ค'}`}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      ID: {editingParty ? editingParty.id : 'สร้างรหัสอัตโนมัติ'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPartyModalOpen(false)}
                  className="p-1 w-6 h-6 hover:bg-slate-200 rounded-full transition-colors cursor-pointer text-slate-400 font-extrabold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Form container code */}
              <form onSubmit={handleSaveParty} className="p-5 space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">ชื่อหน่วยบุคคล หรือองค์กรธุรกิจ <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น บริษัท สยาม ฟู๊ด เทรดดิ้ง จำกัด"
                    value={partyFormName}
                    onChange={(e) => setPartyFormName(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">เลขประจำตัวผู้เสียภาษีอากร 13 หลัก</label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="เลข 13 หลัก เช่น 0105560123456"
                    value={partyFormTaxId}
                    onChange={(e) => setPartyFormTaxId(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">หมายเลขโทรศัพท์</label>
                    <input
                      type="text"
                      placeholder="เช่น 02-123-4567"
                      value={partyFormPhone}
                      onChange={(e) => setPartyFormPhone(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">อีเมลติดต่อ</label>
                    <input
                      type="email"
                      placeholder="เช่น contact@company.com"
                      value={partyFormEmail}
                      onChange={(e) => setPartyFormEmail(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">ที่อยู่จัดส่งสินค้า / เอกสาร และออกไปกำกับภาษี</label>
                  <textarea
                    rows={3}
                    placeholder="แขวง เขต จังหวัด..."
                    value={partyFormAddress}
                    onChange={(e) => setPartyFormAddress(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 focus:bg-white resize-none"
                  />
                </div>

                {/* Submit Controls footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px] select-none">
                  <button
                    type="button"
                    onClick={() => setIsPartyModalOpen(false)}
                    className="py-2 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 cursor-pointer transition-colors font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    {editingParty ? 'บันทึกการแก้ไขผู้ติดต่อ' : 'ยืนยันการเพิ่มผู้ติดต่อข้อมูล'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE FOR DIRECTORY ENTERPRISES */}
      <AnimatePresence>
        {deletePartyId !== null && (() => {
          const isPayersTab = activeSubTab === 'payers';
          const target = isPayersTab ? payers.find(p => p.id === deletePartyId) : payees.find(p => p.id === deletePartyId);
          if (!target) return null;
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-700"
              >
                <div className="p-5 border-b border-rose-100 flex items-center gap-3 select-none bg-rose-50/70">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950">ลบรายชื่อผู้ติดต่อ</h3>
                    <p className="text-[10px] text-rose-600 font-bold">ข้อมูลการลงทะเบียนจะหายสาบสูญอย่างถาวร</p>
                  </div>
                </div>

                <div className="p-5 space-y-3 font-semibold text-xs leading-relaxed text-slate-700">
                  <p>
                    คุณแน่ใจจริงหรือไม่ที่จะทำการลบผู้ติดต่อระเบียบชื่อ <span className="font-bold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{target.name}</span> ออกจากบัญชีฐานข้อมูล?
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    *หมายเหตุ: การลบข้อมูลระเบียนติดต่อจะไม่ส่งผลกระทบต่อรายการเช็คเดิมที่มีอยู่ แต่จะลบชื่อออกจากรายการแนะนำรายชื่อผู้ติดต่อสำหรับตราสารใบต่อๆ ไป
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-[11.5px] select-none">
                  <button
                    type="button"
                    onClick={() => setDeletePartyId(null)}
                    className="py-2 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer font-bold"
                  >
                    ยกเลิกเก็บไว้ก่อน
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDeleteParty(target.id)}
                    className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer font-black shadow-xs"
                  >
                    ยืนยันการลบระเบียบ
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* CUSTOM BEAUTIFUL DELETION CONFIRMATION DIALOG MODAL FOR CHEQUES */}
      <AnimatePresence>
        {deleteConfirmId !== null && (() => {
          const target = cheques.find(c => c.id === deleteConfirmId);
          if (!target) return null;
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
                    <h3 className="text-sm font-black text-rose-950">ยืนยันการลบตราสารเช็ค</h3>
                    <p className="text-[10px] text-rose-600 font-bold">ข้อมูลธุรกรรมจะสาบสูญอย่างถาวร</p>
                  </div>
                </div>

                {/* Details text layout */}
                <div className="p-5 space-y-3 font-semibold text-xs leading-relaxed text-slate-700">
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-100/50 p-2.5 rounded-lg text-rose-800 text-[11.5px]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>ข้อมูลใบธุรกรรมเช็คเล่มนี้จะถูกทำลายทิ้งและไม่สามารถเรียกคืนประวัติได้อีก</span>
                  </div>

                  <p>
                    คุณแน่ใจจริงหรือไม่ที่จะทำการลบข้อมูลเช็คเลขที่ <span className="font-mono text-slate-950 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{target.chequeNumber}</span> (ธนาคาร {target.bankName}) นี้?
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1 font-mono text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>ประเภทเช็ค:</span>
                      <strong className="text-slate-950">{target.type === 'incoming' ? 'เช็คขารับ (Incoming)' : 'เช็คขาจ่าย (Outgoing)'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ยอดเงินบนเช็ค:</span>
                      <strong className="text-rose-600 font-extrabold">฿{target.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>วันที่ครบกำหนด:</span>
                      <strong className="text-slate-950">{formatThaiDate(target.chequeDate)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{target.type === 'incoming' ? 'ผู้สั่งจ่าย:' : 'ผู้รับเงิน:'}</span>
                      <strong className="text-slate-850 truncate max-w-[140px]">{target.partyName}</strong>
                    </div>
                  </div>
                </div>

                {/* Confirm Cancel button controls */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-[11.5px] select-none">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(null)}
                    className="py-2 px-4 border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer font-bold"
                  >
                    ยกเลิกปลอดภัย
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDelete(target.id)}
                    className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer font-black shadow-xs"
                  >
                    ยืนยันลบตราสาร
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
