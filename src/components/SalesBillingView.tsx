import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  Search, 
  Calendar, 
  User, 
  Building, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle,
  FileCheck,
  Briefcase,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building2,
  DollarSign,
  Truck,
  Link,
  Edit2
} from 'lucide-react';
import { DailySale, EmployeeSalary, ChequePayer, CompanySettings } from '../types';

export interface SupplierDeliveryNote {
  id: string;
  deliveryNumber: string; // เลขที่ใบส่งของ (เช่น DN-2026-0001)
  payerId: string; // คู่ค้าผู้ส่งของ (Payer ID)
  payerName: string; // ชื่อคู่ค้า
  date: string; // วันที่ส่งของ (YYYY-MM-DD)
  amount: number; // ยอดเงินสุทธิ (บาท)
  orderCount: number; // จำนวนรายการ/กล่อง
  note?: string; // รายละเอียดสินค้า หรือหมายเหตุ
  status: 'pending' | 'linked'; // pending = ค้างวางบิล, linked = เชื่อมโยงกับใบวางบิลแล้ว
  linkedBillingId?: string; // ID ใบวางบิลที่เชื่อมโยง
}

export interface BillingStatement {
  id: string;
  billingNumber: string;
  payerId: string;
  payerName: string;
  payerTaxId?: string;
  payerAddress?: string;
  payerPhone?: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: Array<{
    id: string;
    description: string;
    date: string;
    amount: number;
    orderCount: number;
  }>;
  totalAmount: number;
  vatRate: number; // e.g. 7 for 7%
  vatAmount: number;
  grandTotal: number;
  status: 'pending' | 'paid' | 'overdue';
  note?: string;
  creator?: string;
}

interface SalesBillingViewProps {
  employees: EmployeeSalary[];
  companySettings: CompanySettings;
}

// Thai number to text converter (Baht Text)
function arabicToThaiBahtText(num: number): string {
  if (isNaN(num) || num === null) return "";
  
  // Format to 2 decimal places to prevent float precision issues
  const roundedNum = Math.round(num * 100) / 100;
  const strVal = roundedNum.toFixed(2);
  const parts = strVal.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let bahtText = "";

  if (integerPart === "0" && decimalPart === "00") {
    return "ศูนย์บาทถ้วน";
  }

  if (integerPart !== "0") {
    bahtText += numToThaiWords(parseInt(integerPart)) + "บาท";
  }

  if (decimalPart === "00") {
    bahtText += "ถ้วน";
  } else {
    bahtText += numToThaiWords(parseInt(decimalPart)) + "สตางค์";
  }

  return bahtText;
}

function numToThaiWords(num: number): string {
  const thaiNums = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const thaiUnits = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  if (num === 0) return "";
  
  let strNum = num.toString();
  let len = strNum.length;
  let word = "";

  // Handle Millions recursively if number is larger than 1,000,000
  if (len > 6) {
    const millionPart = parseInt(strNum.substring(0, len - 6));
    const remainderPart = parseInt(strNum.substring(len - 6));
    return numToThaiWords(millionPart) + "ล้าน" + numToThaiWords(remainderPart);
  }

  for (let i = 0; i < len; i++) {
    const digit = parseInt(strNum.charAt(i));
    const unitPos = len - 1 - i;
    
    if (digit !== 0) {
      if (unitPos === 1 && digit === 1) {
        word += "สิบ";
      } else if (unitPos === 1 && digit === 2) {
        word += "ยี่สิบ";
      } else if (unitPos === 0 && digit === 1 && len > 1 && parseInt(strNum.charAt(i - 1)) !== 0) {
        word += "เอ็ด";
      } else {
        word += thaiNums[digit] + thaiUnits[unitPos];
      }
    }
  }
  return word;
}

export default function SalesBillingView({ employees, companySettings }: SalesBillingViewProps) {
  // Load databases
  const [payers, setPayers] = useState<ChequePayer[]>(() => {
    const saved = localStorage.getItem('hr_cheque_payers');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<DailySale[]>(() => {
    const saved = localStorage.getItem('sapphire_daily_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [billingStatements, setBillingStatements] = useState<BillingStatement[]>(() => {
    const saved = localStorage.getItem('sapphire_billing_statements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Keep internal states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [selectedBilling, setSelectedBilling] = useState<BillingStatement | null>(null);

  // Document configuration for dynamic "ใบวางบิล" vs "ใบรับวางบิล/ของ" switching
  const [docMode, setDocMode] = useState<'billing' | 'receiving'>('billing');
  const [paymentApptDate, setPaymentApptDate] = useState('');
  const [salesmanName, setSalesmanName] = useState('');
  const [receiverName, setReceiverName] = useState('');

  useEffect(() => {
    if (selectedBilling) {
      setDocMode('billing');
      setPaymentApptDate(selectedBilling.dueDate || '');
      setSalesmanName('');
      setReceiverName(selectedBilling.creator || '');
    }
  }, [selectedBilling]);

  // Date Filters & Grouping States
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'day' | 'month' | 'year'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({});

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Create Form/Wizard state
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [billingNumber, setBillingNumber] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedPayerId, setSelectedPayerId] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days payment terms default
    return date.toISOString().split('T')[0];
  });
  const [selectedSalesIds, setSelectedSalesIds] = useState<string[]>([]);
  const [includeVat, setIncludeVat] = useState(true);
  const [billingNote, setBillingNote] = useState('');
  const [creatorName, setCreatorName] = useState('');

  const [billingSource, setBillingSource] = useState<'auto' | 'manual' | 'delivery_note'>('auto');
  const [manualItems, setManualItems] = useState<{ id: string; description: string; date: string; amount: number; orderCount: number }[]>([]);

  // Subtab Toggle State
  const [activeSubTab, setActiveSubTab] = useState<'billing_statements' | 'supplier_deliveries'>('billing_statements');

  // Supplier Delivery Notes Databases & States
  const [deliveryNotes, setDeliveryNotes] = useState<SupplierDeliveryNote[]>(() => {
    const saved = localStorage.getItem('sapphire_supplier_delivery_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [selectedDeliveryNoteIds, setSelectedDeliveryNoteIds] = useState<string[]>([]);

  // Delivery Note Form States
  const [isCreateDeliveryMode, setIsCreateDeliveryMode] = useState(false);
  const [editingDeliveryNote, setEditingDeliveryNote] = useState<SupplierDeliveryNote | null>(null);
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [deliveryNotePayerId, setDeliveryNotePayerId] = useState('');
  const [deliveryNoteDate, setDeliveryNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryNoteAmount, setDeliveryNoteAmount] = useState<number | string>('');
  const [deliveryNoteOrderCount, setDeliveryNoteOrderCount] = useState<number>(1);
  const [deliveryNoteMemo, setDeliveryNoteMemo] = useState('');

  // Delivery Notes Search / Filters
  const [deliverySearch, setDeliverySearch] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'all' | 'pending' | 'linked'>('all');
  const [deliveryPayerFilter, setDeliveryPayerFilter] = useState<string>('all');
  const [deleteDeliveryId, setDeleteDeliveryId] = useState<string | null>(null);

  // Add Payer Modal States
  const [isAddPayerOpen, setIsAddPayerOpen] = useState(false);
  const [newPayerName, setNewPayerName] = useState('');
  const [newPayerTaxId, setNewPayerTaxId] = useState('');
  const [newPayerPhone, setNewPayerPhone] = useState('');
  const [newPayerEmail, setNewPayerEmail] = useState('');
  const [newPayerAddress, setNewPayerAddress] = useState('');

  useEffect(() => {
    if (isCreateMode && manualItems.length === 0) {
      setManualItems([
        {
          id: `item-${Date.now()}-1`,
          description: 'ยอดวางบิลตามที่เซลเสนอ',
          date: docDate,
          amount: 0,
          orderCount: 1
        }
      ]);
    }
  }, [isCreateMode, docDate]);

  const handleAddManualItem = () => {
    setManualItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: '',
        date: docDate,
        amount: 0,
        orderCount: 1
      }
    ]);
  };

  const handleRemoveManualItem = (id: string) => {
    setManualItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateManualItem = (id: string, field: string, value: any) => {
    setManualItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Auto-generate invoice number based on date
  useEffect(() => {
    if (isCreateMode) {
      const year = new Date(docDate).getFullYear() + 543;
      const monthStr = (new Date(docDate).getMonth() + 1).toString().padStart(2, '0');
      const prefix = `BIL-${year}${monthStr}-`;
      
      // Find maximum sequence for the same year/month
      const sameMonthBills = billingStatements.filter(b => b.billingNumber.startsWith(prefix));
      let nextSeq = 1;
      if (sameMonthBills.length > 0) {
        const sequences = sameMonthBills.map(b => {
          const parts = b.billingNumber.split('-');
          const lastPart = parseInt(parts[parts.length - 1], 10);
          return isNaN(lastPart) ? 0 : lastPart;
        });
        nextSeq = Math.max(...sequences) + 1;
      }
      
      setBillingNumber(`${prefix}${nextSeq.toString().padStart(4, '0')}`);
      setCreatorName(employees[0]?.name || 'ศรุตรา เลียบคงเกียรติ');
    }
  }, [isCreateMode, docDate, billingStatements, employees]);

  // Handle storage updates
  useEffect(() => {
    const handleStorageUpdated = () => {
      const savedPayers = localStorage.getItem('hr_cheque_payers');
      if (savedPayers) {
        try { setPayers(JSON.parse(savedPayers)); } catch (e) {}
      }
      const savedSales = localStorage.getItem('sapphire_daily_sales');
      if (savedSales) {
        try { setSales(JSON.parse(savedSales)); } catch (e) {}
      }
      const savedBills = localStorage.getItem('sapphire_billing_statements');
      if (savedBills) {
        try { setBillingStatements(JSON.parse(savedBills)); } catch (e) {}
      }
      const savedNotes = localStorage.getItem('sapphire_supplier_delivery_notes');
      if (savedNotes) {
        try { setDeliveryNotes(JSON.parse(savedNotes)); } catch (e) {}
      }
    };
    window.addEventListener('sapphire_storage_updated', handleStorageUpdated);
    return () => window.removeEventListener('sapphire_storage_updated', handleStorageUpdated);
  }, []);

  // Save changes
  const saveBills = (newBills: BillingStatement[]) => {
    setBillingStatements(newBills);
    localStorage.setItem('sapphire_billing_statements', JSON.stringify(newBills));
    
    // Dispatch storage event to trigger auto-sync on Firebase
    const event = new CustomEvent('local_storage_write', {
      detail: { key: 'sapphire_billing_statements', value: JSON.stringify(newBills) }
    });
    window.dispatchEvent(event);
    window.dispatchEvent(new Event('sapphire_storage_updated'));
  };

  const saveDeliveryNotes = (newNotes: SupplierDeliveryNote[]) => {
    setDeliveryNotes(newNotes);
    localStorage.setItem('sapphire_supplier_delivery_notes', JSON.stringify(newNotes));
    
    const event = new CustomEvent('local_storage_write', {
      detail: { key: 'sapphire_supplier_delivery_notes', value: JSON.stringify(newNotes) }
    });
    window.dispatchEvent(event);
    window.dispatchEvent(new Event('sapphire_storage_updated'));
  };

  const savePayers = (newPayers: ChequePayer[]) => {
    setPayers(newPayers);
    localStorage.setItem('hr_cheque_payers', JSON.stringify(newPayers));
    
    // Dispatch storage event to trigger auto-sync on Firebase
    const event = new CustomEvent('local_storage_write', {
      detail: { key: 'hr_cheque_payers', value: JSON.stringify(newPayers) }
    });
    window.dispatchEvent(event);
    window.dispatchEvent(new Event('sapphire_storage_updated'));
  };

  const handleAddPayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayerName.trim()) {
      alert('❌ กรุณาระบุชื่อบริษัทคู่ค้า/ลูกค้า');
      return;
    }

    const newPayer: ChequePayer = {
      id: `payer-${Date.now()}`,
      name: newPayerName.trim(),
      taxId: newPayerTaxId.trim() || undefined,
      phone: newPayerPhone.trim() || undefined,
      email: newPayerEmail.trim() || undefined,
      address: newPayerAddress.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const updatedPayers = [...payers, newPayer];
    savePayers(updatedPayers);
    setSelectedPayerId(newPayer.id);

    // Reset fields
    setNewPayerName('');
    setNewPayerTaxId('');
    setNewPayerPhone('');
    setNewPayerEmail('');
    setNewPayerAddress('');
    setIsAddPayerOpen(false);

    alert(`🎉 เพิ่มข้อมูลคู่ค้า "${newPayer.name}" สำเร็จและเลือกให้เรียบร้อยแล้ว!`);
  };

  // Check if a sale is already included in any generated billing statement
  const getBilledSalesIds = () => {
    const ids = new Set<string>();
    billingStatements.forEach(bill => {
      bill.items.forEach(item => {
        ids.add(item.id);
      });
    });
    return ids;
  };

  const billedSalesIds = getBilledSalesIds();

  // Handle create submit
  const handleCreateBilling = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayerId) {
      alert('❌ กรุณาเลือกข้อมูลลูกค้า/ผู้รับการวางบิล');
      return;
    }

    const payer = payers.find(p => p.id === selectedPayerId);
    if (!payer) {
      alert('❌ ไม่พบข้อมูลลูกค้าที่เลือก');
      return;
    }

    let items = [];
    if (billingSource === 'auto') {
      if (selectedSalesIds.length === 0) {
        alert('❌ กรุณาเลือกรายการยอดขายในตารางอย่างน้อย 1 รายการเพื่อออกใบวางบิล');
        return;
      }
      items = sales
        .filter(s => selectedSalesIds.includes(s.id))
        .map(s => ({
          id: s.id,
          description: s.note || `ยอดขายประจำวันที่ ${formatThaiDate(s.date)}`,
          date: s.date,
          amount: s.amount,
          orderCount: s.orderCount
        }));
    } else if (billingSource === 'delivery_note') {
      if (selectedDeliveryNoteIds.length === 0) {
        alert('❌ กรุณาเลือกใบส่งของคู่ค้าในตารางอย่างน้อย 1 ใบเพื่อนำมาออกใบวางบิล');
        return;
      }
      items = deliveryNotes
        .filter(dn => selectedDeliveryNoteIds.includes(dn.id))
        .map(dn => ({
          id: dn.id,
          description: `ใบส่งของจากคู่ค้า เลขที่ ${dn.deliveryNumber}${dn.note ? ` (${dn.note})` : ''}`,
          date: dn.date,
          amount: dn.amount,
          orderCount: dn.orderCount
        }));
    } else {
      const validItems = manualItems.filter(item => item.description.trim() !== '' && item.amount > 0);
      if (validItems.length === 0) {
        alert('❌ กรุณากรอกรายละเอียดรายการและระบุยอดเงินสะสม/ยอดวางของที่พนักงานขายนำมาวางบิล (ที่มีมูลค่ามากกว่า 0 บาท)');
        return;
      }
      items = validItems.map(item => ({
        id: item.id || `man-${Date.now()}-${Math.random()}`,
        description: item.description.trim(),
        date: item.date || docDate,
        amount: Number(item.amount),
        orderCount: Number(item.orderCount || 1)
      }));
    }

    const totalAmount = items.reduce((acc, item) => acc + item.amount, 0);
    const vatRate = includeVat ? 7 : 0;
    const vatAmount = includeVat ? Math.round(totalAmount * 0.07 * 100) / 100 : 0;
    const grandTotal = totalAmount + vatAmount;

    const newBill: BillingStatement = {
      id: `BILL-${Date.now().toString().slice(-6)}`,
      billingNumber: billingNumber.trim() || `BIL-${Date.now()}`,
      payerId: payer.id,
      payerName: payer.name,
      payerTaxId: payer.taxId || '-',
      payerAddress: payer.address || '-',
      payerPhone: payer.phone || '-',
      date: docDate,
      dueDate: dueDate,
      items: items,
      totalAmount: totalAmount,
      vatRate: vatRate,
      vatAmount: vatAmount,
      grandTotal: grandTotal,
      status: 'pending',
      note: billingNote.trim(),
      creator: creatorName
    };

    const updatedBills = [newBill, ...billingStatements];
    saveBills(updatedBills);

    // If billingSource was delivery_note, mark selected delivery notes as linked
    if (billingSource === 'delivery_note') {
      const updatedNotes = deliveryNotes.map(n => {
        if (selectedDeliveryNoteIds.includes(n.id)) {
          return {
            ...n,
            status: 'linked' as const,
            linkedBillingId: newBill.id
          };
        }
        return n;
      });
      saveDeliveryNotes(updatedNotes);
    }

    // Reset Form
    setIsCreateMode(false);
    setSelectedPayerId('');
    setSelectedSalesIds([]);
    setSelectedDeliveryNoteIds([]);
    setManualItems([]);
    setBillingSource('auto');
    setBillingNote('');
    alert(`🎉 ออกใบวางบิลเลขที่ ${newBill.billingNumber} สำเร็จเสร็จสิ้น!`);
  };

  // Toggle selected sale
  const handleToggleSale = (saleId: string) => {
    setSelectedSalesIds(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId) 
        : [...prev, saleId]
    );
  };

  // Select all unbilled sales
  const handleSelectAllUnbilledSales = (unbilledSales: DailySale[]) => {
    if (selectedSalesIds.length === unbilledSales.length) {
      setSelectedSalesIds([]);
    } else {
      setSelectedSalesIds(unbilledSales.map(s => s.id));
    }
  };

  // Delete billing statement
  const handleDeleteBilling = (id: string, number: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteBilling = () => {
    if (!deleteConfirmId) return;

    // Reset linked delivery notes status back to pending
    const updatedNotes = deliveryNotes.map(n => {
      if (n.linkedBillingId === deleteConfirmId) {
        return {
          ...n,
          status: 'pending' as const,
          linkedBillingId: undefined
        };
      }
      return n;
    });
    saveDeliveryNotes(updatedNotes);

    const updated = billingStatements.filter(b => b.id !== deleteConfirmId);
    saveBills(updated);
    if (selectedBilling?.id === deleteConfirmId) {
      setSelectedBilling(null);
    }
    setDeleteConfirmId(null);
  };

  // Supplier Delivery Notes Action Handlers
  const handleSaveDeliveryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryNoteNumber.trim()) {
      alert('❌ กรุณาระบุเลขที่ใบส่งของ');
      return;
    }
    if (!deliveryNotePayerId) {
      alert('❌ กรุณาเลือกบริษัทคู่ค้า/ซัพพลายเออร์');
      return;
    }
    const payer = payers.find(p => p.id === deliveryNotePayerId);
    if (!payer) {
      alert('❌ ไม่พบข้อมูลคู่ค้าที่เลือก');
      return;
    }
    const amountVal = Number(deliveryNoteAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('❌ กรุณาระบุยอดเงินสุทธิให้ถูกต้อง (ต้องมากกว่า 0 บาท)');
      return;
    }

    if (editingDeliveryNote) {
      // Edit
      const updated = deliveryNotes.map(dn => {
        if (dn.id === editingDeliveryNote.id) {
          return {
            ...dn,
            deliveryNumber: deliveryNoteNumber.trim(),
            payerId: payer.id,
            payerName: payer.name,
            date: deliveryNoteDate,
            amount: amountVal,
            orderCount: Number(deliveryNoteOrderCount || 1),
            note: deliveryNoteMemo.trim()
          };
        }
        return dn;
      });
      saveDeliveryNotes(updated);
      alert(`🎉 แก้ไขข้อมูลใบส่งของเลขที่ ${deliveryNoteNumber} สำเร็จ!`);
    } else {
      // Create
      const newNote: SupplierDeliveryNote = {
        id: `deliv-${Date.now()}`,
        deliveryNumber: deliveryNoteNumber.trim(),
        payerId: payer.id,
        payerName: payer.name,
        date: deliveryNoteDate,
        amount: amountVal,
        orderCount: Number(deliveryNoteOrderCount || 1),
        note: deliveryNoteMemo.trim(),
        status: 'pending'
      };
      saveDeliveryNotes([newNote, ...deliveryNotes]);
      alert(`🎉 บันทึกใบส่งของคู่ค้าเลขที่ ${deliveryNoteNumber} เรียบร้อยแล้ว!`);
    }

    // Reset Form
    setIsCreateDeliveryMode(false);
    setEditingDeliveryNote(null);
    setDeliveryNoteNumber('');
    setDeliveryNotePayerId('');
    setDeliveryNoteDate(new Date().toISOString().split('T')[0]);
    setDeliveryNoteAmount('');
    setDeliveryNoteOrderCount(1);
    setDeliveryNoteMemo('');
  };

  const handleEditDeliveryNoteClick = (dn: SupplierDeliveryNote) => {
    setEditingDeliveryNote(dn);
    setDeliveryNoteNumber(dn.deliveryNumber);
    setDeliveryNotePayerId(dn.payerId);
    setDeliveryNoteDate(dn.date);
    setDeliveryNoteAmount(dn.amount);
    setDeliveryNoteOrderCount(dn.orderCount);
    setDeliveryNoteMemo(dn.note || '');
    setIsCreateDeliveryMode(true);
  };

  const confirmDeleteDeliveryNote = () => {
    if (!deleteDeliveryId) return;
    const target = deliveryNotes.find(dn => dn.id === deleteDeliveryId);
    if (target && target.status === 'linked') {
      alert('❌ ไม่สามารถลบเอกสารส่งของนี้ได้ เนื่องจากได้รับการเชื่อมโยงกับใบวางบิลแล้ว กรุณาลบใบวางบิลก่อนลบใบส่งของ');
      setDeleteDeliveryId(null);
      return;
    }
    const updated = deliveryNotes.filter(dn => dn.id !== deleteDeliveryId);
    saveDeliveryNotes(updated);
    setDeleteDeliveryId(null);
    alert('🗑️ ลบใบส่งของเรียบร้อยแล้ว');
  };

  // Change billing status
  const handleChangeStatus = (id: string, newStatus: 'pending' | 'paid' | 'overdue') => {
    const updated = billingStatements.map(b => b.id === id ? { ...b, status: newStatus } : b);
    saveBills(updated);
    if (selectedBilling?.id === id) {
      setSelectedBilling(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Print invoice helper
  const handlePrint = () => {
    window.print();
  };

  // Date formatted in Thai
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

  // Filter bills
  const filteredBills = billingStatements.filter(bill => {
    const matchesSearch = 
      bill.billingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.note?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    
    // Date filters
    const dateParts = bill.date ? bill.date.split('-') : []; // [YYYY, MM, DD]
    const billYear = dateParts[0] || '';
    const billMonth = dateParts[1] || '';
    const billDay = dateParts[2] || '';
    
    const matchesYear = filterYear === 'all' || billYear === filterYear;
    const matchesMonth = filterMonth === 'all' || billMonth === filterMonth;
    const matchesDay = filterDay === 'all' || parseInt(billDay, 10).toString().padStart(2, '0') === filterDay.padStart(2, '0');
    
    return matchesSearch && matchesStatus && matchesYear && matchesMonth && matchesDay;
  });

  // Extract unique years from billingStatements to populate the Year filter
  const availableYears = (Array.from(new Set(billingStatements.map(b => {
    if (!b.date) return '';
    const parts = b.date.split('-');
    return parts[0] || '';
  }).filter(Boolean))) as string[]).sort((a, b) => b.localeCompare(a));

  // Grouping helper
  const getGroupedBills = () => {
    const groups: { [key: string]: BillingStatement[] } = {};
    
    filteredBills.forEach(bill => {
      let key = 'อื่น ๆ / ไม่ระบุวันที่';
      if (bill.date) {
        const d = new Date(bill.date);
        if (!isNaN(d.getTime())) {
          if (groupBy === 'year') {
            key = `ปี พ.ศ. ${d.getFullYear() + 543}`;
          } else if (groupBy === 'month') {
            key = `เดือน${getThaiMonthName(d.getMonth())} พ.ศ. ${d.getFullYear() + 543}`;
          } else if (groupBy === 'day') {
            key = `วันที่ ${formatThaiDate(bill.date)}`;
          }
        }
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(bill);
    });
    
    return groups;
  };

  const groupedBills = getGroupedBills();

  // Calculate statistics
  const statsPending = billingStatements.filter(b => b.status === 'pending');
  const statsPaid = billingStatements.filter(b => b.status === 'paid');
  const statsOverdue = billingStatements.filter(b => b.status === 'overdue');

  const sumPending = statsPending.reduce((acc, b) => acc + b.grandTotal, 0);
  const sumPaid = statsPaid.reduce((acc, b) => acc + b.grandTotal, 0);
  const sumOverdue = statsOverdue.reduce((acc, b) => acc + b.grandTotal, 0);
  const grandTotalAll = billingStatements.reduce((acc, b) => acc + b.grandTotal, 0);

  // Available sales that are not yet billed (excluding currently editing/creating unless checked)
  const availableUnbilledSales = sales.filter(s => !billedSalesIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* Tab Print styles to hide sidebar and header during printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-billing-invoice-modal, #printable-billing-invoice-modal * {
            visibility: visible;
          }
          #printable-billing-invoice-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
            color: black !important;
            padding: 0px !important;
            border: 0px !important;
            box-shadow: none !important;
          }
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .print-page:last-child {
            page-break-after: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @keyframes custom-blink {
          0%, 100% {
            background-color: #ffffff;
            border-color: rgba(226, 232, 240, 0.8);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          50% {
            background-color: rgba(254, 243, 199, 0.45);
            border-color: rgba(245, 158, 11, 0.7);
            box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
          }
        }
        .animate-custom-blink {
          animation: custom-blink 2s infinite ease-in-out;
        }
      `}</style>

      {/* Main Container No-Print */}
      <div className="no-print space-y-6">

        {/* Module Sub-tabs Toggle Bar */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => {
              setActiveSubTab('billing_statements');
              setIsCreateMode(false);
            }}
            className={`pb-3 text-sm font-black relative transition-all cursor-pointer ${
              activeSubTab === 'billing_statements' 
                ? 'text-blue-600 font-extrabold' 
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>ระบบวางบิล & ใบรับแจ้งหนี้คู่ค้า (Billing Statements)</span>
            </div>
            {activeSubTab === 'billing_statements' && (
              <motion.div layoutId="active_billing_subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveSubTab('supplier_deliveries');
              setIsCreateMode(false);
            }}
            className={`pb-3 text-sm font-black relative transition-all cursor-pointer ${
              activeSubTab === 'supplier_deliveries' 
                ? 'text-blue-600 font-extrabold' 
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>ใบส่งของจากคู่ค้า (Supplier Delivery Notes)</span>
            </div>
            {activeSubTab === 'supplier_deliveries' && (
              <motion.div layoutId="active_billing_subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {activeSubTab === 'billing_statements' && (
          <>
            {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">ใบวางบิลทั้งหมด</span>
              <span className="text-xl font-black text-slate-800">{billingStatements.length} ใบ</span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">รวมสุทธิ ฿{grandTotalAll.toLocaleString()}</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${
            statsPending.length > 0 
              ? 'animate-custom-blink' 
              : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <div className={`p-3.5 rounded-xl transition-colors ${statsPending.length > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-amber-50 text-amber-600'}`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">ค้างรับเงิน (Pending)</span>
              <span className="text-xl font-black text-amber-600">{statsPending.length} ใบ</span>
              <span className="text-[10px] text-amber-600 font-bold block mt-0.5">มูลค่ารวม ฿{sumPending.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">ชำระแล้ว (Paid)</span>
              <span className="text-xl font-black text-emerald-600">{statsPaid.length} ใบ</span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">มูลค่ารวม ฿{sumPaid.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-rose-50 rounded-xl text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">เกินกำหนด (Overdue)</span>
              <span className="text-xl font-black text-rose-600">{statsOverdue.length} ใบ</span>
              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">มูลค่ารวม ฿{sumOverdue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Create Mode Wizard vs. Overview List */}
        <AnimatePresence mode="wait">
          {isCreateMode ? (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md"
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-400" />
                    เขียนประกอบและออกใบวางบิลใหม่ (Sales to Billing Wizard)
                  </h3>
                  <p className="text-xs text-slate-350 mt-0.5">ดึงข้อมูลรายการยอดขายจากประวัติพนักงานขายหน้าร้าน เพื่อจัดตั้งเอกสารวางบิลลูกค้าแบบบูรณาการ</p>
                </div>
                <button
                  onClick={() => setIsCreateMode(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBilling} className="p-6 space-y-6">
                
                {/* Form Controls Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Controls */}
                  <div className="space-y-4 md:col-span-1 border-r border-slate-150 pr-0 md:pr-6">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">เลขที่เอกสารใบวางบิล (Auto-sequence)</label>
                      <input
                        type="text"
                        required
                        value={billingNumber}
                        onChange={(e) => setBillingNumber(e.target.value)}
                        className="w-full bg-slate-100 border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="BIL-256906-0001"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">เลือกผู้รับการวางบิล / ลูกค้าหลัก</label>
                        <button
                          type="button"
                          onClick={() => setIsAddPayerOpen(true)}
                          className="text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> เพิ่มคู่ค้าใหม่
                        </button>
                      </div>
                      <select
                        required
                        value={selectedPayerId}
                        onChange={(e) => setSelectedPayerId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- เลือกบริษัทลูกค้าคู่ค้า --</option>
                        {payers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.taxId ? `(เลขผู้เสียภาษี: ${p.taxId})` : ''}
                          </option>
                        ))}
                      </select>
                      {selectedPayerId && (
                        <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[10px] space-y-1 text-slate-600">
                          {(() => {
                            const p = payers.find(item => item.id === selectedPayerId);
                            if (!p) return null;
                            return (
                              <>
                                <p><strong className="text-slate-700 font-bold">ที่อยู่:</strong> {p.address || '-'}</p>
                                <p><strong className="text-slate-700 font-bold">เบอร์โทรศัพท์:</strong> {p.phone || '-'}</p>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">วันที่ออกเอกสาร</label>
                        <input
                          type="date"
                          required
                          value={docDate}
                          onChange={(e) => setDocDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">วันครบกำหนด (Due)</label>
                        <input
                          type="date"
                          required
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        id="wizard-include-vat"
                        checked={includeVat}
                        onChange={(e) => setIncludeVat(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="wizard-include-vat" className="text-xs font-bold text-slate-850 cursor-pointer select-none">
                        คำนวณภาษีมูลค่าเพิ่ม VAT 7%
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">ผู้จัดทำเอกสารวางบิล</label>
                      <select
                        required
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none"
                      >
                        {employees.map(e => (
                          <option key={e.id} value={e.name}>{e.name} ({e.position})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">หมายเหตุเอกสาร</label>
                      <textarea
                        value={billingNote}
                        onChange={(e) => setBillingNote(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                        placeholder="เช่น ชำระโดยการโอนเงินเข้าบัญชีกระแสรายวันบริษัทเท่านั้น"
                      />
                    </div>
                  </div>

                  {/* Right - Sales Items Selection */}
                  <div className="space-y-4 md:col-span-2 flex flex-col h-[530px]">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setBillingSource('auto')}
                        className={`flex-1 py-2 text-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                          billingSource === 'auto'
                            ? 'bg-white text-blue-700 shadow-xs border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        🔗 ดึงจากประวัติยอดขายฝ่ายขาย (Auto)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingSource('delivery_note')}
                        className={`flex-1 py-2 text-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                          billingSource === 'delivery_note'
                            ? 'bg-white text-blue-700 shadow-xs border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        🚚 ดึงจากใบส่งของคู่ค้า (Delivery Note)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingSource('manual')}
                        className={`flex-1 py-2 text-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                          billingSource === 'manual'
                            ? 'bg-white text-blue-700 shadow-xs border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        ✍️ กรอกรายละเอียดและยอดเงินเอง (Manual)
                      </button>
                    </div>

                    {billingSource === 'auto' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-850">
                              เลือกรายการประวัติยอดขายที่ต้องการออกใบวางบิล
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              แสดงเฉพาะยอดขายที่ยังไม่เคยนำมาผูกออกใบวางบิล เพื่อป้องกันสับสนและรายการซ้ำ
                            </span>
                          </div>
                          
                          {availableUnbilledSales.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSelectAllUnbilledSales(availableUnbilledSales)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-black text-[10px] rounded-lg transition-colors cursor-pointer"
                            >
                              {selectedSalesIds.length === availableUnbilledSales.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมดที่ว่าง'}
                            </button>
                          )}
                        </div>

                        {availableUnbilledSales.length === 0 ? (
                          <div className="flex-1 border border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-100">
                              <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-black text-slate-800">ไม่มีประวัติยอดขายค้างวางบิล</p>
                              <p className="text-[10px] text-slate-500 font-semibold max-w-sm">
                                ออเดอร์ยอดขายทั้งหมดได้รับการผูกกับเอกสารใบวางบิลก่อนหน้าเรียบร้อยแล้ว หรือสามารถสลับไปกรอกยอดเงินเองได้ในแถบเมนูด้านบน
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 sticky top-0 z-10">
                                <tr>
                                  <th className="px-4 py-3 text-center w-12">เลือก</th>
                                  <th className="px-3 py-3">วันที่ยอดขาย</th>
                                  <th className="px-3 py-3">บันทึกช่วยจำ/ออเดอร์</th>
                                  <th className="px-3 py-3 text-center">จำนวนออเดอร์</th>
                                  <th className="px-4 py-3 text-right">ยอดสุทธิ (บาท)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150">
                                {availableUnbilledSales.map(sale => {
                                  const isChecked = selectedSalesIds.includes(sale.id);
                                  return (
                                    <tr 
                                      key={sale.id}
                                      onClick={() => handleToggleSale(sale.id)}
                                      className={`hover:bg-blue-50/20 cursor-pointer transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}
                                    >
                                      <td className="px-4 py-3.5 text-center">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}} // toggled by row click
                                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                      </td>
                                      <td className="px-3 py-3.5 font-mono font-bold text-slate-700">
                                        {formatThaiDate(sale.date)}
                                      </td>
                                      <td className="px-3 py-3.5 font-semibold text-slate-800">
                                        {sale.note || '-'}
                                      </td>
                                      <td className="px-3 py-3.5 text-center font-bold text-slate-600">
                                        {sale.orderCount}
                                      </td>
                                      <td className="px-4 py-3.5 text-right font-black text-slate-950 font-mono">
                                        ฿{sale.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    ) : billingSource === 'delivery_note' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-850">
                              ดึงข้อมูลจากใบส่งของของคู่ค้า (Supplier Delivery Notes)
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              เลือกใบส่งของที่ค้างวางบิลเพื่อนำมารวมยอดออกใบวางบิลคู่ค้า
                            </span>
                          </div>
                          
                          {selectedPayerId && deliveryNotes.filter(n => n.payerId === selectedPayerId && n.status === 'pending').length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const pendingNotesForPayer = deliveryNotes
                                  .filter(n => n.payerId === selectedPayerId && n.status === 'pending')
                                  .map(n => n.id);
                                const allSelected = pendingNotesForPayer.every(id => selectedDeliveryNoteIds.includes(id));
                                if (allSelected) {
                                  setSelectedDeliveryNoteIds(prev => prev.filter(id => !pendingNotesForPayer.includes(id)));
                                } else {
                                  setSelectedDeliveryNoteIds(prev => {
                                    const unique = new Set([...prev, ...pendingNotesForPayer]);
                                    return Array.from(unique);
                                  });
                                }
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-black text-[10px] rounded-lg transition-colors cursor-pointer"
                            >
                              {deliveryNotes.filter(n => n.payerId === selectedPayerId && n.status === 'pending').every(n => selectedDeliveryNoteIds.includes(n.id))
                                ? 'ยกเลิกทั้งหมด'
                                : 'เลือกทั้งหมดที่ว่าง'}
                            </button>
                          )}
                        </div>

                        {!selectedPayerId ? (
                          <div className="flex-1 border border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 border border-blue-100">
                              <User className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-black text-slate-800">กรุณาเลือกบริษัทคู่ค้า</p>
                              <p className="text-[10px] text-slate-500 font-semibold max-w-sm">
                                โปรดเลือกบริษัทคู่ค้า/คู่สัญญาในช่องด้านซ้ายมือ เพื่อดึงข้อมูลใบส่งของคู่ค้าที่ค้างวางบิลขึ้นมาให้คุณเลือกทำรายการ
                              </p>
                            </div>
                          </div>
                        ) : deliveryNotes.filter(n => n.payerId === selectedPayerId && n.status === 'pending').length === 0 ? (
                          <div className="flex-1 border border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100">
                              <Check className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-black text-slate-800">ไม่มีใบส่งของค้างวางบิลสำหรับคู่ค้านี้</p>
                              <p className="text-[10px] text-slate-500 font-semibold max-w-sm">
                                คู่ค้าบริษัทที่เลือกไม่มีใบส่งของที่มีสถานะค้างวางบิล คุณสามารถสร้างใบส่งของใหม่ของคู่ค้ารายนี้ได้ในแถบ "ใบส่งของจากคู่ค้า"
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 sticky top-0 z-10">
                                <tr>
                                  <th className="px-4 py-3 text-center w-12">เลือก</th>
                                  <th className="px-3 py-3">วันที่ส่งของ</th>
                                  <th className="px-3 py-3">เลขที่ใบส่งของ</th>
                                  <th className="px-3 py-3">รายละเอียด/บันทึกช่วยจำ</th>
                                  <th className="px-4 py-3 text-right">ยอดเงิน (บาท)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150">
                                {deliveryNotes
                                  .filter(n => n.payerId === selectedPayerId && n.status === 'pending')
                                  .map(dn => {
                                    const isChecked = selectedDeliveryNoteIds.includes(dn.id);
                                    return (
                                      <tr 
                                        key={dn.id}
                                        onClick={() => {
                                          setSelectedDeliveryNoteIds(prev =>
                                            prev.includes(dn.id)
                                              ? prev.filter(id => id !== dn.id)
                                              : [...prev, dn.id]
                                          );
                                        }}
                                        className={`hover:bg-blue-50/20 cursor-pointer transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}
                                      >
                                        <td className="px-4 py-3.5 text-center">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}} // toggled by row click
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                          />
                                        </td>
                                        <td className="px-3 py-3.5 font-mono font-bold text-slate-700">
                                          {formatThaiDate(dn.date)}
                                        </td>
                                        <td className="px-3 py-3.5 font-black text-slate-800 flex items-center gap-1">
                                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                                          {dn.deliveryNumber}
                                        </td>
                                        <td className="px-3 py-3.5 font-semibold text-slate-600">
                                          {dn.note || '-'}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-black text-slate-950 font-mono">
                                          ฿{dn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-850 flex items-center gap-1.5 text-blue-600">
                              <span>✍️ ตารางกรอกรายละเอียดและยอดวางบิลด้วยตนเอง</span>
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              ระบุวันที่ บันทึกอธิบายรายการ (เช่น บิลเลขที่...) และยอดเงินสุทธิของเซลล์แต่ละท่านได้เลย
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={handleAddManualItem}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-[10px] rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            ➕ เพิ่มแถวรายการ
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 sticky top-0 z-10">
                              <tr>
                                <th className="px-3 py-2.5 text-center w-10">#</th>
                                <th className="px-2 py-2.5 w-28">วันที่บิล</th>
                                <th className="px-2 py-2.5">รายละเอียดเอกสาร / ข้อมูลอ้างอิง</th>
                                <th className="px-2 py-2.5 text-center w-16">จำนวน</th>
                                <th className="px-2 py-2.5 text-right w-32">ยอดเงินวางบิล (บาท)</th>
                                <th className="px-3 py-2.5 text-center w-10">ลบ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                              {manualItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 text-center text-slate-400 font-bold">
                                    {index + 1}
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="date"
                                      required
                                      value={item.date}
                                      onChange={(e) => handleUpdateManualItem(item.id, 'date', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] font-bold focus:outline-none focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      required
                                      value={item.description}
                                      onChange={(e) => handleUpdateManualItem(item.id, 'description', e.target.value)}
                                      placeholder="เช่น ใบส่งของเลขที่ IV-2026/001"
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-blue-500 text-slate-900"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      required
                                      min={1}
                                      value={item.orderCount}
                                      onChange={(e) => handleUpdateManualItem(item.id, 'orderCount', parseInt(e.target.value, 10) || 1)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center text-[11px] font-bold focus:outline-none focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="relative">
                                      <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-400 font-bold">฿</span>
                                      <input
                                        type="number"
                                        required
                                        min={0}
                                        step="any"
                                        value={item.amount === 0 ? '' : item.amount}
                                        onChange={(e) => handleUpdateManualItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        className="w-full bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-1 text-right text-[11px] font-mono font-black focus:outline-none focus:border-blue-500 text-emerald-600 text-slate-900"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      disabled={manualItems.length <= 1}
                                      onClick={() => handleRemoveManualItem(item.id)}
                                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* Summary Draft Section */}
                    {((billingSource === 'auto' && selectedSalesIds.length > 0) || 
                      (billingSource === 'delivery_note' && selectedDeliveryNoteIds.length > 0) || 
                      (billingSource === 'manual' && manualItems.some(i => i.amount > 0))) && (
                      <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-semibold">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400">สรุปยอดคำนวณล่วงหน้า (Draft Calculation)</p>
                          <p className="text-xs font-black mt-0.5">
                            {billingSource === 'auto' 
                              ? `เลือกสะสมจากฝ่ายขายจำนวน ${selectedSalesIds.length} วัน`
                              : billingSource === 'delivery_note'
                              ? `เลือกใบส่งของคู่ค้าสะสมจำนวน ${selectedDeliveryNoteIds.length} ใบ`
                              : `รวมข้อมูลกรอกด้วยตนเองจำนวน ${manualItems.filter(i => i.description.trim() !== '' && i.amount > 0).length} รายการ`
                            }
                          </p>
                        </div>
                        <div className="text-left sm:text-right font-mono">
                          <span className="text-xs text-slate-300 block">
                            รวมมูลค่าก่อนภาษี: ฿{
                              (() => {
                                const sum = billingSource === 'auto'
                                  ? sales.filter(s => selectedSalesIds.includes(s.id)).reduce((acc, s) => acc + s.amount, 0)
                                  : billingSource === 'delivery_note'
                                  ? deliveryNotes.filter(dn => selectedDeliveryNoteIds.includes(dn.id)).reduce((acc, dn) => acc + dn.amount, 0)
                                  : manualItems.reduce((acc, i) => acc + i.amount, 0);
                                return sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              })()
                            }
                          </span>
                          <span className="text-xs font-black text-emerald-400 block mt-px">
                            รวมสุทธิ ({includeVat ? 'VAT 7%' : 'ไม่มี VAT'}): ฿{
                              (() => {
                                const sum = billingSource === 'auto'
                                  ? sales.filter(s => selectedSalesIds.includes(s.id)).reduce((acc, s) => acc + s.amount, 0)
                                  : billingSource === 'delivery_note'
                                  ? deliveryNotes.filter(dn => selectedDeliveryNoteIds.includes(dn.id)).reduce((acc, dn) => acc + dn.amount, 0)
                                  : manualItems.reduce((acc, i) => acc + i.amount, 0);
                                const vat = includeVat ? sum * 0.07 : 0;
                                return (sum + vat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              })()
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateMode(false)}
                    className="px-5 py-2.5 bg-white hover:bg-slate-150 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    ยกเลิกคำสั่ง
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/10 cursor-pointer transition-colors"
                  >
                    💾 ยืนยันการออกเอกสารและบันทึก
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* Overview list of billing statements */
            <div className="space-y-4">
              
              {/* Controls bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
                
                {/* Search inputs */}
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาตามเลขที่เอกสาร, ชื่อบริษัทลูกค้า..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Filter and creation action buttons */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                  
                  {/* Status selector */}
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {[
                      { key: 'all', label: 'ทั้งหมด' },
                      { key: 'pending', label: 'ค้างจ่าย' },
                      { key: 'paid', label: 'ชำระแล้ว' },
                      { key: 'overdue', label: 'เกินกำหนด' }
                    ].map(st => (
                      <button
                        key={st.key}
                        onClick={() => setStatusFilter(st.key as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          statusFilter === st.key 
                            ? 'bg-white text-slate-900 shadow-xs font-black' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Create Trigger */}
                  <button
                    onClick={() => setIsCreateMode(true)}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/10 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    ออกใบวางบิลใหม่ (Billing Statement)
                  </button>
                </div>
              </div>

              {/* Date Separation Controls (แยกตาม วัน เดือน ปี และ จัดกลุ่ม) */}
              <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-3.5 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800">เครื่องมือคัดกรองและแยกข้อมูลตามวัน/เดือน/ปี (Date Sorter)</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500">รูปแบบการจัดกลุ่ม:</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {[
                        { key: 'none', label: 'เรียงลำดับปกติ' },
                        { key: 'day', label: 'แยกกลุ่มตามวัน' },
                        { key: 'month', label: 'แยกกลุ่มตามเดือน' },
                        { key: 'year', label: 'แยกกลุ่มตามปี' }
                      ].map(g => (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setGroupBy(g.key as any)}
                          className={`px-2.5 py-1.5 rounded-md text-[10px] font-black cursor-pointer transition-all ${
                            groupBy === g.key 
                              ? 'bg-blue-600 text-white shadow-2xs font-black' 
                              : 'text-slate-600 hover:text-slate-955 hover:bg-slate-50'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  {/* Select Year */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 block mb-1">ปี พ.ศ. (Year)</label>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">📅 แสดงทุกปี พ.ศ.</option>
                      {availableYears.map(yearStr => (
                        <option key={yearStr} value={yearStr}>
                          พ.ศ. {parseInt(yearStr, 10) + 543} ({yearStr})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Month */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 block mb-1">เดือน (Month)</label>
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">📅 แสดงทุกเดือน</option>
                      {[
                        { val: '01', label: 'มกราคม' },
                        { val: '02', label: 'กุมภาพันธ์' },
                        { val: '03', label: 'มีนาคม' },
                        { val: '04', label: 'เมษายน' },
                        { val: '05', label: 'พฤษภาคม' },
                        { val: '06', label: 'มิถุนายน' },
                        { val: '07', label: 'กรกฎาคม' },
                        { val: '08', label: 'สิงหาคม' },
                        { val: '09', label: 'กันยายน' },
                        { val: '10', label: 'ตุลาคม' },
                        { val: '11', label: 'พฤศจิกายน' },
                        { val: '12', label: 'ธันวาคม' }
                      ].map(m => (
                        <option key={m.val} value={m.val}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Day */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 block mb-1">วันที่ (ของเดือน)</label>
                    <select
                      value={filterDay}
                      onChange={(e) => setFilterDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">📅 แสดงทุกวันที่</option>
                      {Array.from({ length: 31 }, (_, i) => {
                        const dayVal = (i + 1).toString().padStart(2, '0');
                        return (
                          <option key={dayVal} value={dayVal}>วันที่ {i + 1}</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Reset Filters Buttons */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterYear('all');
                        setFilterMonth('all');
                        setFilterDay('all');
                        setGroupBy('none');
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center border border-slate-200"
                    >
                      ล้างตัวกรองวันที่ทั้งหมด
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Display Table (Grouped or Flat) */}
              {filteredBills.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs p-16 text-center space-y-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto border border-slate-150">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800">ไม่พบเอกสารใบวางบิล</h4>
                    <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                      ยังไม่มีการออกเอกสารหรือตรงกับตัวเลือกค้นหา / ตัวกรองแยกวันเดือนปีที่คุณคัดกรองในปัจจุบัน คุณสามารถคลิกปุ่มด้านบนเพื่อเพิ่มหรือเปลี่ยนเงื่อนไขใหม่
                    </p>
                  </div>
                </div>
              ) : groupBy !== 'none' ? (
                /* Grouped Accordion layout */
                <div className="space-y-4">
                  {Object.entries(groupedBills).map(([groupKey, groupBills]) => {
                    const isCollapsed = collapsedGroups[groupKey] ?? false;
                    const totalGroupAmount = groupBills.reduce((sum, b) => sum + b.grandTotal, 0);
                    
                    return (
                      <div key={groupKey} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                        {/* Group Header */}
                        <div 
                          onClick={() => toggleGroup(groupKey)}
                          className="bg-slate-50 hover:bg-slate-100/60 px-5 py-3.5 flex items-center justify-between cursor-pointer select-none transition-colors border-b border-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">{groupKey}</span>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-100">
                              {groupBills.length} รายการ
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-emerald-600">
                              ยอดรวมกลุ่ม: ฿{totalGroupAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-400 font-bold text-xs">
                              {isCollapsed ? '➕ แสดง' : '➖ ซ่อน'}
                            </span>
                          </div>
                        </div>

                        {/* Group Table content */}
                        {!isCollapsed && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-bold">
                                <tr>
                                  <th className="px-6 py-3">เลขที่เอกสาร (Billing No.)</th>
                                  <th className="px-4 py-3">วันที่ออกเอกสาร</th>
                                  <th className="px-4 py-3">คู่สัญญา / ลูกค้า</th>
                                  <th className="px-4 py-3">วันครบกำหนดชำระ</th>
                                  <th className="px-4 py-3 text-right">ยอดเงินรวมสุทธิ</th>
                                  <th className="px-4 py-3 text-center">สถานะ</th>
                                  <th className="px-6 py-3 text-center">การจัดการ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {groupBills.map(bill => (
                                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-3.5">
                                      <button
                                        onClick={() => setSelectedBilling(bill)}
                                        className="font-mono font-black text-blue-600 hover:underline hover:text-blue-800 text-left cursor-pointer flex items-center gap-1"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        {bill.billingNumber}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-slate-600">
                                      {formatThaiDate(bill.date)}
                                    </td>
                                    <td className="px-4 py-3.5 font-extrabold text-slate-900">
                                      {bill.payerName}
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className="font-semibold text-slate-600">
                                        {formatThaiDate(bill.dueDate)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-black font-mono text-slate-950 text-xs">
                                      ฿{bill.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${
                                        bill.status === 'paid' 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                          : bill.status === 'overdue' 
                                          ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                                          : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                          bill.status === 'paid' ? 'bg-emerald-500' : bill.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'
                                        }`} />
                                        {bill.status === 'paid' ? 'รับชำระแล้ว' : bill.status === 'overdue' ? 'เกินกำหนด' : 'ค้างรับชำระ'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => setSelectedBilling(bill)}
                                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                          title="ดูตัวอย่างเอกสารเพื่อพิมพ์หรือส่งออก"
                                        >
                                          <Printer className="w-4 h-4" />
                                        </button>
                                        
                                        <select
                                          value={bill.status}
                                          onChange={(e) => handleChangeStatus(bill.id, e.target.value as any)}
                                          className="bg-white border border-slate-200 rounded-md py-0.5 px-1.5 text-[10px] font-bold text-slate-700 focus:outline-none"
                                        >
                                          <option value="pending">ค้างชำระ</option>
                                          <option value="paid">จ่ายแล้ว</option>
                                          <option value="overdue">เกินกำหนด</option>
                                        </select>

                                        <button
                                          onClick={() => handleDeleteBilling(bill.id, bill.billingNumber)}
                                          className="p-1 text-rose-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                          title="ลบเอกสารออกจากระบบคลาวด์"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Flat Data Table (Standard style) */
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="px-6 py-3.5">เลขที่เอกสาร (Billing No.)</th>
                          <th className="px-4 py-3.5">วันที่ออกเอกสาร</th>
                          <th className="px-4 py-3.5">คู่สัญญา / ลูกค้า</th>
                          <th className="px-4 py-3.5">วันครบกำหนดชำระ</th>
                          <th className="px-4 py-3.5 text-right">ยอดเงินรวมสุทธิ</th>
                          <th className="px-4 py-3.5 text-center">สถานะ</th>
                          <th className="px-6 py-3.5 text-center">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBills.map(bill => (
                          <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setSelectedBilling(bill)}
                                className="font-mono font-black text-blue-600 hover:underline hover:text-blue-800 text-left cursor-pointer flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {bill.billingNumber}
                              </button>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-600">
                              {formatThaiDate(bill.date)}
                            </td>
                            <td className="px-4 py-4 font-extrabold text-slate-900">
                              {bill.payerName}
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-semibold text-slate-600">
                                {formatThaiDate(bill.dueDate)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-black font-mono text-slate-950 text-xs">
                              ฿{bill.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${
                                bill.status === 'paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : bill.status === 'overdue' 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  bill.status === 'paid' ? 'bg-emerald-500' : bill.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'
                                }`} />
                                {bill.status === 'paid' ? 'รับชำระแล้ว' : bill.status === 'overdue' ? 'เกินกำหนด' : 'ค้างรับชำระ'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedBilling(bill)}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  title="ดูตัวอย่างเอกสารเพื่อพิมพ์หรือส่งออก"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                
                                <select
                                  value={bill.status}
                                  onChange={(e) => handleChangeStatus(bill.id, e.target.value as any)}
                                  className="bg-white border border-slate-200 rounded-md py-0.5 px-1.5 text-[10px] font-bold text-slate-700 focus:outline-none"
                                >
                                  <option value="pending">ค้างชำระ</option>
                                  <option value="paid">จ่ายแล้ว</option>
                                  <option value="overdue">เกินกำหนด</option>
                                </select>

                                <button
                                  onClick={() => handleDeleteBilling(bill.id, bill.billingNumber)}
                                  className="p-1 text-rose-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  title="ลบเอกสารออกจากระบบคลาวด์"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
          </>
        )}

        {/* ========================================== */}
        {/* TAB 2: SUPPLIER DELIVERY NOTES DASHBOARD   */}
        {/* ========================================== */}
        {activeSubTab === 'supplier_deliveries' && (
          <div className="space-y-6">
            {/* Delivery Notes Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex items-center gap-4">
                <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">ใบส่งของทั้งหมด</span>
                  <span className="text-xl font-black text-slate-850">
                    {deliveryNotes.length} ใบ
                  </span>
                  <span className="text-[10px] text-slate-550 font-semibold block mt-0.5">
                    มูลค่าสะสม ฿{deliveryNotes.reduce((sum, n) => sum + n.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex items-center gap-4">
                <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600 animate-pulse">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">ค้างวางบิล (Pending Billing)</span>
                  <span className="text-xl font-black text-amber-600">
                    {deliveryNotes.filter(n => n.status === 'pending').length} ใบ
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                    รวมมูลค่า ฿{deliveryNotes.filter(n => n.status === 'pending').reduce((sum, n) => sum + n.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex items-center gap-4">
                <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">เชื่อมวางบิลแล้ว (Linked)</span>
                  <span className="text-xl font-black text-emerald-600">
                    {deliveryNotes.filter(n => n.status === 'linked').length} ใบ
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                    รวมมูลค่า ฿{deliveryNotes.filter(n => n.status === 'linked').reduce((sum, n) => sum + n.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex items-center gap-4">
                <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">ผู้ส่งสินค้า / คู่ค้าทั้งหมด</span>
                  <span className="text-xl font-black text-indigo-600">
                    {new Set(deliveryNotes.map(n => n.payerId)).size} ราย
                  </span>
                  <span className="text-[10px] text-indigo-500 font-semibold block mt-0.5">
                    คู่ค้าบริษัทจดทะเบียน {payers.length} ราย
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Note Form/Wizard */}
            {isCreateDeliveryMode ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md"
              >
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-400" />
                      {editingDeliveryNote ? '📝 แก้ไขใบส่งของจากคู่ค้า' : '➕ เพิ่มใบส่งของจากคู่ค้าใหม่ (Supplier Delivery Note)'}
                    </h3>
                    <p className="text-xs text-slate-350 mt-0.5">
                      บันทึกประวัติการส่งมอบสินค้าจากผู้จัดจำหน่าย/คู่ค้า เพื่อใช้รวบรวมในการวางบิลภายหลัง
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateDeliveryMode(false);
                      setEditingDeliveryNote(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveDeliveryNote} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Delivery Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block">
                        เลขที่ใบส่งของจากคู่ค้า (Delivery Note No.) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryNoteNumber}
                        onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                        placeholder="เช่น DN-2026-0001"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-black focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block">
                        วันที่จัดส่งสินค้า <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          required
                          value={deliveryNoteDate}
                          onChange={(e) => setDeliveryNoteDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Supplier select with Add Payer option */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700">
                          บริษัทคู่ค้า/ซัพพลายเออร์ <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsAddPayerOpen(true)}
                          className="text-[10px] text-blue-600 hover:underline font-black cursor-pointer flex items-center gap-0.5"
                        >
                          ➕ เพิ่มคู่ค้าใหม่
                        </button>
                      </div>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                          required
                          value={deliveryNotePayerId}
                          onChange={(e) => setDeliveryNotePayerId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-extrabold focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="">-- เลือกคู่ค้า/ผู้ส่งสินค้า --</option>
                          {payers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block">
                        ยอดเงินรวมสุทธิในใบส่งของ (บาท) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-bold">฿</span>
                        <input
                          type="number"
                          required
                          min={0.01}
                          step="any"
                          value={deliveryNoteAmount}
                          onChange={(e) => setDeliveryNoteAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-mono font-black text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Order Count */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 block">
                        จำนวนรายการสินค้า/งาน (รายการ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={deliveryNoteOrderCount}
                        onChange={(e) => setDeliveryNoteOrderCount(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    {/* Note / Memo */}
                    <div className="space-y-1.5 lg:col-span-3">
                      <label className="text-xs font-black text-slate-700 block">บันทึกเพิ่มเติม/คำอธิบายสินค้า</label>
                      <textarea
                        value={deliveryNoteMemo}
                        onChange={(e) => setDeliveryNoteMemo(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none"
                        placeholder="ระบุคำอธิบายสินค้าสั้นๆ เช่น อะไหล่คอมพิวเตอร์ 10 รายการ, ชิ้นส่วนโลหะ"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateDeliveryMode(false);
                        setEditingDeliveryNote(null);
                      }}
                      className="px-5 py-2.5 bg-white hover:bg-slate-150 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      บันทึกใบส่งของ
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              // List Filter & Notes Table
              <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
                {/* Search and Filters Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">รายการใบส่งของจากคู่ค้าทั้งหมด</h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">ค้นหา กรองข้อมูล และสร้างใบวางบิลเชื่อมโยงได้ทันที</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsCreateDeliveryMode(true);
                        setEditingDeliveryNote(null);
                        setDeliveryNoteNumber(`DN-${Date.now().toString().slice(-6)}`);
                        setDeliveryNoteDate(new Date().toISOString().split('T')[0]);
                        setDeliveryNoteAmount('');
                        setDeliveryNoteOrderCount(1);
                        setDeliveryNoteMemo('');
                        setDeliveryNotePayerId('');
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่มใบส่งของคู่ค้าใหม่
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={deliverySearch}
                        onChange={(e) => setDeliverySearch(e.target.value)}
                        placeholder="ค้นเลขที่ใบส่งของ / บันทึก..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Filter Partner */}
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={deliveryPayerFilter}
                        onChange={(e) => setDeliveryPayerFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-extrabold focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="all">เลือกดูคู่ค้า: ทั้งหมด ({payers.length})</option>
                        {payers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Status */}
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={deliveryStatusFilter}
                        onChange={(e) => setDeliveryStatusFilter(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-extrabold focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="all">สถานะ: ทั้งหมด</option>
                        <option value="pending">⏳ ค้างวางบิล (Pending)</option>
                        <option value="linked">✅ เชื่อมโยงวางบิลแล้ว (Linked)</option>
                      </select>
                    </div>

                    {/* Export / Quick helper */}
                    <div className="bg-slate-150 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] font-black text-slate-600">
                      <span>ยอดคัดกรอง:</span>
                      <span className="font-mono text-xs text-blue-700">
                        ฿{deliveryNotes
                          .filter(n => {
                            const matchSearch = n.deliveryNumber.toLowerCase().includes(deliverySearch.toLowerCase()) ||
                              (n.note || '').toLowerCase().includes(deliverySearch.toLowerCase());
                            const matchPayer = deliveryPayerFilter === 'all' || n.payerId === deliveryPayerFilter;
                            const matchStatus = deliveryStatusFilter === 'all' || n.status === deliveryStatusFilter;
                            return matchSearch && matchPayer && matchStatus;
                          })
                          .reduce((sum, n) => sum + n.amount, 0)
                          .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto">
                  {deliveryNotes.filter(n => {
                    const matchSearch = n.deliveryNumber.toLowerCase().includes(deliverySearch.toLowerCase()) ||
                      (n.note || '').toLowerCase().includes(deliverySearch.toLowerCase());
                    const matchPayer = deliveryPayerFilter === 'all' || n.payerId === deliveryPayerFilter;
                    const matchStatus = deliveryStatusFilter === 'all' || n.status === deliveryStatusFilter;
                    return matchSearch && matchPayer && matchStatus;
                  }).length === 0 ? (
                    <div className="p-16 text-center space-y-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto border border-slate-150">
                        <Truck className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-800">ไม่พบใบส่งของจากคู่ค้า</h4>
                        <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                          ยังไม่มีการป้อนประวัติใบส่งของ หรือไม่ตรงกับเงื่อนไขคำค้นหาและตัวกรองที่คุณเลือก
                        </p>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">วันที่รับส่งสินค้า</th>
                          <th className="px-4 py-4">เลขที่ใบส่งของ</th>
                          <th className="px-4 py-4">ผู้ให้บริการ/คู่ค้า</th>
                          <th className="px-4 py-4">บันทึกสินค้า/อธิบายเพิ่มเติม</th>
                          <th className="px-4 py-4 text-center">จำนวนงาน</th>
                          <th className="px-4 py-4 text-right">ยอดเงินรวมสุทธิ</th>
                          <th className="px-4 py-4 text-center">สถานะการวางบิล</th>
                          <th className="px-6 py-4 text-center">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deliveryNotes
                          .filter(n => {
                            const matchSearch = n.deliveryNumber.toLowerCase().includes(deliverySearch.toLowerCase()) ||
                              (n.note || '').toLowerCase().includes(deliverySearch.toLowerCase());
                            const matchPayer = deliveryPayerFilter === 'all' || n.payerId === deliveryPayerFilter;
                            const matchStatus = deliveryStatusFilter === 'all' || n.status === deliveryStatusFilter;
                            return matchSearch && matchPayer && matchStatus;
                          })
                          .map((dn, idx) => {
                            const linkedBill = billingStatements.find(b => b.id === dn.linkedBillingId);
                            return (
                              <tr key={dn.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-600">
                                  {formatThaiDate(dn.date)}
                                </td>
                                <td className="px-4 py-4 font-black text-slate-800 flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                                  {dn.deliveryNumber}
                                </td>
                                <td className="px-4 py-4 font-bold text-slate-900">
                                  {dn.payerName}
                                </td>
                                <td className="px-4 py-4 font-semibold text-slate-500 max-w-xs truncate">
                                  {dn.note || '-'}
                                </td>
                                <td className="px-4 py-4 text-center font-bold text-slate-600">
                                  {dn.orderCount}
                                </td>
                                <td className="px-4 py-4 text-right font-mono font-black text-slate-950">
                                  ฿{dn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  {dn.status === 'linked' && linkedBill ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBilling(linkedBill)}
                                      className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-150 cursor-pointer transition-colors"
                                      title="คลิกเพื่อเปิดใบวางบิลคู่ค้าที่เกี่ยวข้อง"
                                    >
                                      <Link className="w-3 h-3 text-emerald-500" />
                                      {linkedBill.billingNumber}
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                      <Clock className="w-3 h-3 text-amber-500" />
                                      ค้างออกใบวางบิล
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-1.5 font-bold">
                                    <button
                                      onClick={() => handleEditDeliveryNoteClick(dn)}
                                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                      title="แก้ไขใบส่งของ"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        if (dn.status === 'linked') {
                                          alert('❌ ไม่สามารถลบใบส่งของนี้ได้ เนื่องจากมีใบวางบิลเชื่อมโยงอยู่ กรุณาลบใบวางบิลออกก่อน');
                                          return;
                                        }
                                        setDeleteDeliveryId(dn.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                      title="ลบใบส่งของ"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
            )}
          </div>
        )}
      </div>

      {/* Corporate Printable Template Modal */}
      <AnimatePresence>
        {selectedBilling && (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-[120] overflow-y-auto">
            <div className="fixed inset-0 cursor-default no-print" onClick={() => setSelectedBilling(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 text-left flex flex-col my-8 max-h-[90vh]"
            >
              {/* Header section (Non-Printable) */}
              <div className="no-print bg-slate-900 text-white p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600 rounded-xl text-white">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">
                      ตัวอย่างเอกสาร ({docMode === 'billing' ? 'ใบวางบิล / ใบแจ้งหนี้' : 'ใบรับวางบิล / ใบรับของ'})
                    </h3>
                    <p className="text-[10px] text-slate-400">เลขที่ {selectedBilling.billingNumber} • จัดพิมพ์ตามมาตรฐานภาษีและเอกสารการค้า</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handlePrint}
                    className="px-4.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-md shadow-blue-500/10"
                  >
                    <Printer className="w-4 h-4" /> พิมพ์หรือเซฟ PDF
                  </button>
                  <button
                    onClick={() => setSelectedBilling(null)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>

              {/* Document Configuration Tool (Non-Printable) */}
              <div className="no-print bg-slate-50 p-5 border-b border-slate-200 flex flex-col gap-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800">เครื่องมือเลือกประเภทและตั้งค่าเอกสาร (Document Type Configurator)</h4>
                    <p className="text-[10px] text-slate-500 font-bold">
                      เลือกสลับได้ว่าเอกสารนี้เป็น "เราไปวางบิลลูกค้า" หรือ "เซลล์ต่างบริษัทมาวางบิลกับเรา (ใบรับวางบิล)"
                    </p>
                  </div>
                  <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setDocMode('billing')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                        docMode === 'billing'
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                      }`}
                    >
                      📄 ใบวางบิล (เราเรียกเก็บเงินลูกค้า)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocMode('receiving')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                        docMode === 'receiving'
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                      }`}
                    >
                      📥 ใบรับวางบิล/ของ (เซลล์มาส่งเอกสาร)
                    </button>
                  </div>
                </div>

                {docMode === 'receiving' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200/80">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 block mb-1">วันนัดรับเช็ค / กำหนดจ่ายเงิน (Payment Appointment)</label>
                      <input
                        type="date"
                        value={paymentApptDate}
                        onChange={(e) => setPaymentApptDate(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 block mb-1">ชื่อพนักงานขายผู้มาวางบิล (Supplier Salesperson)</label>
                      <input
                        type="text"
                        value={salesmanName}
                        onChange={(e) => setSalesmanName(e.target.value)}
                        placeholder="ระบุชื่อพนักงานขายต่างบริษัท"
                        className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 block mb-1">ชื่อเจ้าหน้าที่ผู้รับวางบิล (Recipient Accountant)</label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="ระบุชื่อพนักงานผู้รับเอกสาร"
                        className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Printable Body Content */}
              <div 
                id="printable-billing-invoice-modal" 
                className="p-8 md:p-12 overflow-y-auto flex-1 bg-white text-black font-sans text-xs space-y-8"
              >
                {(() => {
                  const items = selectedBilling.items;
                  const itemsChunks: typeof items[] = [];
                  for (let i = 0; i < items.length; i += 10) {
                    itemsChunks.push(items.slice(i, i + 10));
                  }
                  
                  return itemsChunks.map((chunk, pageIndex) => {
                    const isLastPage = pageIndex === itemsChunks.length - 1;
                    return (
                      <div 
                        key={pageIndex} 
                        className="print-page space-y-6 relative pb-6 border-b border-dashed border-slate-200 last:border-0 last:pb-0"
                      >
                        {/* Header (Company Logo & Information) */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                          <div className="space-y-1.5 max-w-lg">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
                                <Building2 className="w-6 h-6" />
                              </div>
                              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide leading-none">
                                {companySettings.name || 'บริษัท แซฟไฟร์ เทคโนโลยี จำกัด'}
                              </h2>
                            </div>
                            <div className="text-[10px] text-slate-600 space-y-0.5 leading-relaxed">
                              <p><strong className="text-slate-800">สำนักงานใหญ่:</strong> {companySettings.address || 'เลขที่ 999 ถ.เพชรเกษม ต.ควนขนุน อ.ควนขนุน จ.พัทลุง 93110'}</p>
                              <p>โทรศัพท์: {companySettings.phone || '074-601-234'} • อีเมล: {companySettings.email || 'billing@sapphire-hq.com'}</p>
                              <p>เลขประจำตัวผู้เสียภาษีอากร: <span className="font-mono font-bold text-slate-800">{companySettings.taxId || '0123456789012'}</span></p>
                            </div>
                          </div>

                          <div className="text-left sm:text-right space-y-1.5 min-w-[150px]">
                            <span className="text-base font-black text-slate-900 bg-slate-100 px-3.5 py-1 rounded-xl block text-center uppercase tracking-wider border border-slate-200">
                              {docMode === 'billing' ? 'ใบวางบิล / ใบแจ้งหนี้' : 'ใบรับวางบิล / ใบรับวางของ'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold block text-center mt-1">
                              {docMode === 'billing' ? 'BILLING STATEMENT' : 'BILLING ACCEPTANCE RECEIPT'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-extrabold block text-center mt-0.5 uppercase tracking-wider">
                              หน้า (Page) {pageIndex + 1} / {itemsChunks.length}
                            </span>
                            <div className="pt-2 text-[10px] text-slate-700 font-medium space-y-1">
                              <p><strong className="text-slate-900 font-bold">เลขที่เอกสาร:</strong> <span className="font-mono font-bold text-blue-600">{selectedBilling.billingNumber}</span></p>
                              <p><strong className="text-slate-900 font-bold">วันที่เอกสาร:</strong> {formatThaiDate(selectedBilling.date)}</p>
                              {docMode === 'billing' ? (
                                <p><strong className="text-slate-900 font-bold">วันครบกำหนด:</strong> <span className="font-bold text-rose-600">{formatThaiDate(selectedBilling.dueDate)}</span></p>
                              ) : (
                                <p><strong className="text-slate-900 font-bold">วันนัดชำระเงิน:</strong> <span className="font-bold text-blue-600">{formatThaiDate(paymentApptDate)}</span></p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bill To Customer Information or Vendor Information block */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          {docMode === 'billing' ? (
                            <>
                              <div>
                                <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider mb-1.5">ชื่อและที่อยู่ลูกค้า (BILL TO)</span>
                                <h4 className="text-xs font-black text-slate-900">{selectedBilling.payerName}</h4>
                                <p className="text-[10px] text-slate-600 leading-relaxed mt-1">
                                  ที่อยู่ติดต่อ: {selectedBilling.payerAddress}
                                </p>
                                <p className="text-[10px] text-slate-600 mt-1">โทรศัพท์: {selectedBilling.payerPhone}</p>
                              </div>

                              <div className="text-left sm:text-right flex flex-col justify-end">
                                <p className="text-[10px] text-slate-600">
                                  <strong className="text-slate-800 font-bold">เลขประจำตัวผู้เสียภาษี:</strong>{' '}
                                  <span className="font-mono font-bold text-slate-800">{selectedBilling.payerTaxId}</span>
                                </p>
                                <p className="text-[10px] text-slate-600 mt-1">
                                  <strong className="text-slate-800 font-bold">เงื่อนไขการชำระ:</strong> ชำระภายใน 30 วันนับแต่วันรับวางบิล
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-[10px] text-blue-600 font-black block uppercase tracking-wider mb-1.5">ผู้วางบิล / บริษัทผู้จำหน่าย (BILLING BY / SUPPLIER)</span>
                                <h4 className="text-xs font-black text-slate-900">{selectedBilling.payerName}</h4>
                                <p className="text-[10px] text-slate-600 leading-relaxed mt-1">
                                  ที่อยู่ติดต่อ: {selectedBilling.payerAddress}
                                </p>
                                <p className="text-[10px] text-slate-600 mt-1">โทรศัพท์: {selectedBilling.payerPhone}</p>
                                <p className="text-[10px] text-slate-600 mt-0.5">
                                  เลขประจำตัวผู้เสียภาษี: <span className="font-mono font-bold text-slate-800">{selectedBilling.payerTaxId}</span>
                                </p>
                              </div>

                              <div className="text-left sm:text-right flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider mb-1.5">ผู้รับวางบิล / ลูกค้าผู้ชำระเงิน (RECEIVED BY / CUSTOMER)</span>
                                  <h4 className="text-xs font-black text-slate-900">{companySettings.name || 'บริษัท แซฟไฟร์ เทคโนโลยี จำกัด'}</h4>
                                  <p className="text-[10px] text-slate-600 leading-relaxed mt-1">
                                    {companySettings.address || 'เลขที่ 999 ถ.เพชรเกษม ต.ควนขนุน อ.ควนขนุน จ.พัทลุง 93110'}
                                  </p>
                                </div>
                                <div className="pt-2">
                                  <p className="text-[10px] text-slate-600">
                                    โทรศัพท์: {companySettings.phone || '074-601-234'} • เลขผู้เสียภาษี: <span className="font-mono font-bold text-slate-800">{companySettings.taxId || '0123456789012'}</span>
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Items Table */}
                        <div className="border border-slate-300 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                              <tr>
                                <th className="px-4 py-2.5 text-center w-12">ลำดับ</th>
                                <th className="px-3 py-2.5">วันที่เอกสาร/รายการ</th>
                                <th className="px-3 py-2.5">
                                  {docMode === 'billing' 
                                    ? 'รายการอธิบายรายละเอียด (Sales Details/Invoice Reference)' 
                                    : 'รายการอธิบายรายละเอียด / เอกสารอ้างอิงที่รับวางบิล (Invoice Details / Received References)'}
                                </th>
                                <th className="px-3 py-2.5 text-center w-16">จำนวน</th>
                                <th className="px-4 py-2.5 text-right w-28">ยอดเงินสุทธิ (บาท)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {chunk.map((item, index) => {
                                const itemIndex = pageIndex * 10 + index + 1;
                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/20">
                                    <td className="px-4 py-3 text-center text-slate-500 font-bold">{itemIndex}</td>
                                    <td className="px-3 py-3 font-mono text-slate-600">{formatThaiDate(item.date)}</td>
                                    <td className="px-3 py-3 font-semibold text-slate-800">{item.description}</td>
                                    <td className="px-3 py-3 text-center text-slate-600 font-bold">{item.orderCount} งาน</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                      {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                              
                              {/* Subtotal & tax calculations */}
                              {!isLastPage ? (
                                <tr className="bg-slate-50/80">
                                  <td colSpan={3} className="px-4 py-3 text-left font-bold text-slate-500 italic">
                                    * มีต่อหน้าถัดไป... (Continued on next page)
                                  </td>
                                  <td className="px-3 py-3 text-right font-bold text-slate-600 border-l border-slate-200">รวมย่อยหน้านี้</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                                    {chunk.reduce((acc, item) => acc + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ) : (
                                <>
                                  <tr className="bg-slate-50/50">
                                    <td colSpan={3} rowSpan={3} className="px-4 py-4 text-left align-top">
                                      <div className="space-y-1 text-[10px]">
                                        {docMode === 'billing' ? (
                                          <>
                                            <p className="font-extrabold text-slate-800">💡 คำอธิบาย/ข้อตกลงการรับจ่ายชำระเงิน:</p>
                                            <p className="text-slate-500 font-medium leading-relaxed">
                                              โปรดโอนเงินชำระมายัง บัญชีธนาคารกสิกรไทย <br />
                                              ชื่อบัญชี: <span className="font-bold text-slate-700">{companySettings.name || 'บจก. แซฟไฟร์ เทคโนโลยี'}</span> <br />
                                              เลขบัญชีสะสมทรัพย์: <span className="font-mono font-bold text-slate-800">045-8-12345-6</span> <br />
                                              และส่งหลักฐานการชำระเงิน (Pay-in slip) มายังฝ่ายบัญชีและการเงิน โทรศัพท์ {companySettings.phone}
                                            </p>
                                          </>
                                        ) : (
                                          <>
                                            <p className="font-extrabold text-blue-800">💡 กำหนดการนัดชำระเงินและเงื่อนไข (Payment Schedule):</p>
                                            <p className="text-slate-500 font-medium leading-relaxed">
                                              ทางบริษัทฯ ได้ตรวจสอบความถูกต้องและรับใบวางบิลชุดดังกล่าวเรียบร้อยแล้ว <br />
                                              กำหนดการโอนเงิน/จ่ายเช็ค นัดหมายในวันที่:{' '}
                                              <span className="font-black text-blue-700 underline">{formatThaiDate(paymentApptDate)}</span> <br />
                                              โดยฝ่ายการเงินจะดำเนินการตามรอบและแจ้งผลโอนเมื่อเสร็จสมบูรณ์
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-slate-600 border-l border-slate-200">รวมเงินสุทธิ</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold">
                                      {selectedBilling.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                  <tr className="bg-slate-50/50">
                                    <td className="px-3 py-2 text-right font-bold text-slate-600 border-l border-slate-200">ภาษีมูลค่าเพิ่ม (VAT {selectedBilling.vatRate}%)</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-slate-700">
                                      {selectedBilling.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                  <tr className="bg-slate-900 text-white font-extrabold">
                                    <td className="px-3 py-2.5 text-right uppercase tracking-wider border-l border-slate-800">ยอดเงินรวมทั้งสิ้น</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-xs text-emerald-400 font-black">
                                      ฿{selectedBilling.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                </>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Thai Baht text representation */}
                        {isLastPage && (
                          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-black">
                            <span className="text-slate-500 font-bold">ตัวอักษรไทย (AMOUNT IN THAI WORDS):</span>
                            <span className="text-slate-900 font-extrabold bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                              {arabicToThaiBahtText(selectedBilling.grandTotal)}
                            </span>
                          </div>
                        )}

                        {/* Authorized Signatures blocks */}
                        {isLastPage && (
                          <div className="grid grid-cols-2 gap-8 pt-8 text-[11px]">
                            {docMode === 'billing' ? (
                              <>
                                {/* Customer Signature Block */}
                                <div className="border border-dashed border-slate-300 rounded-2xl p-4.5 text-center space-y-12 bg-slate-50/30">
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">ผู้มีสิทธิ์อนุมัติรับวางบิล (CUSTOMER RECEIVED BY)</span>
                                  <div className="space-y-2">
                                    <div className="w-48 border-b border-slate-900 mx-auto" />
                                    <p className="text-slate-700 font-semibold">ผู้รับเอกสาร / วันที่รับเอกสาร</p>
                                  </div>
                                </div>

                                {/* Company Authorized Signer Block */}
                                <div className="border border-dashed border-slate-300 rounded-2xl p-4.5 text-center space-y-12 bg-slate-50/30">
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">ผู้รับวางบิล / ผู้ออกเอกสาร (AUTHORIZED SIGNATURE)</span>
                                  <div className="space-y-2">
                                    <p className="text-slate-800 font-bold font-serif italic text-sm">{selectedBilling.creator || 'ศรุตรา เลียบคงเกียรติ'}</p>
                                    <div className="w-48 border-b border-slate-900 mx-auto" />
                                    <p className="text-slate-700 font-semibold">พนักงานบัญชีและการเงินผู้มีอำนาจลงนาม</p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Vendor Salesperson Signature Block */}
                                <div className="border border-dashed border-slate-300 rounded-2xl p-4.5 text-center space-y-12 bg-slate-50/30">
                                  <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider block">ผู้นำส่งบิล / พนักงานขายต่างบริษัท (SUBMITTED BY SALESMAN)</span>
                                  <div className="space-y-2">
                                    <p className="text-slate-800 font-bold font-serif italic text-sm">{salesmanName || '..................................................'}</p>
                                    <div className="w-48 border-b border-slate-900 mx-auto" />
                                    <p className="text-slate-700 font-semibold font-bold">ผู้นำส่งบิล / ตัวแทนพนักงานขายผู้มาติดต่อ</p>
                                    <p className="text-[9px] text-slate-400 font-semibold">วันที่: ______/______/_________</p>
                                  </div>
                                </div>

                                {/* Recipient Accountant Signature Block */}
                                <div className="border border-dashed border-slate-300 rounded-2xl p-4.5 text-center space-y-12 bg-slate-50/30">
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">ผู้รับวางบิล / เจ้าหน้าที่ตรวจสอบ (RECEIVED & ACCEPTED BY)</span>
                                  <div className="space-y-2">
                                    <p className="text-slate-800 font-bold font-serif italic text-sm">{receiverName || '..................................................'}</p>
                                    <div className="w-48 border-b border-slate-900 mx-auto" />
                                    <p className="text-slate-700 font-semibold font-bold">เจ้าหน้าที่ฝ่ายการเงิน / ผู้รับวางบิล</p>
                                    <p className="text-[9px] text-slate-400 font-semibold">วันที่: ______/______/_________</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Footer text */}
                        {isLastPage && (
                          <div className="pt-6 border-t border-slate-200 text-center text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                            ขอบคุณที่ใช้บริการ Sapphire ERP System และร่วมขับเคลื่อนระบบการคลังกับเรา
                          </div>
                        )}

                        {/* On-screen visual page break line helper */}
                        {!isLastPage && (
                          <div className="no-print my-6 border-t border-dashed border-blue-400/50 relative flex justify-center">
                            <span className="absolute -top-3 bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-0.5 rounded-full border border-blue-200 shadow-xs">
                              ✂️ ส่วนขึ้นหน้าใหม่ตอนพิมพ์ (Page Break for Printing - หน้า {pageIndex + 1} ไป หน้า {pageIndex + 2})
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM BEAUTIFUL DELETION CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {deleteConfirmId !== null && (() => {
          const targetBill = billingStatements.find(b => b.id === deleteConfirmId);
          if (!targetBill) return null;
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[150] overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-700"
              >
                {/* Header icon alert */}
                <div className="p-5 border-b border-rose-100 flex items-center gap-3 select-none bg-rose-50/70">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950">ยืนยันการลบใบวางบิล</h3>
                    <p className="text-[10px] text-rose-600 font-bold">การลบเอกสารจะไม่สามารถกู้คืนหรือยกเลิกได้ในภายหลัง</p>
                  </div>
                </div>

                {/* Details layout */}
                <div className="p-5 space-y-4 font-semibold text-xs leading-relaxed text-slate-700">
                  <p>
                    คุณแน่ใจหรือไม่ที่จะลบเอกสารใบวางบิลเลขที่ <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{targetBill.billingNumber}</span>?
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 font-semibold text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] text-slate-400">วันที่ออกเอกสาร:</span>
                      <strong className="text-slate-900">{formatThaiDate(targetBill.date)}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] text-slate-400">ลูกค้า / คู่สัญญา:</span>
                      <strong className="text-slate-900">{targetBill.payerName}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] text-slate-400">วันครบกำหนดชำระ:</span>
                      <strong className="text-rose-600">{formatThaiDate(targetBill.dueDate)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-400">ยอดเงินรวมสุทธิ:</span>
                      <strong className="text-emerald-600 font-mono text-sm font-black">
                        ฿{targetBill.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    ยกเลิก (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteBilling}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/15 transition-all cursor-pointer"
                  >
                    🚨 ใช่, ฉันต้องการลบเอกสาร
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* CUSTOM BEAUTIFUL DELETION CONFIRMATION DIALOG MODAL FOR SUPPLIER DELIVERY NOTES */}
      <AnimatePresence>
        {deleteDeliveryId !== null && (() => {
          const targetDn = deliveryNotes.find(n => n.id === deleteDeliveryId);
          if (!targetDn) return null;
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[150] overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-700"
              >
                {/* Header icon alert */}
                <div className="p-5 border-b border-rose-100 flex items-center gap-3 select-none bg-rose-50/70">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950">ยืนยันการลบใบส่งของคู่ค้า</h3>
                    <p className="text-[10px] text-rose-600 font-bold">การลบใบส่งของคู่ค้าจะไม่สามารถกู้คืนได้ในภายหลัง</p>
                  </div>
                </div>

                {/* Details layout */}
                <div className="p-5 space-y-4 font-semibold text-xs leading-relaxed text-slate-700">
                  <p>
                    คุณแน่ใจหรือไม่ที่จะลบใบส่งของเลขที่ <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{targetDn.deliveryNumber}</span>?
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 font-semibold text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] text-slate-400">วันที่จัดส่ง:</span>
                      <strong className="text-slate-900">{formatThaiDate(targetDn.date)}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] text-slate-400">ซัพพลายเออร์/คู่ค้า:</span>
                      <strong className="text-slate-900">{targetDn.payerName}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] text-slate-400">รายละเอียดสินค้า:</span>
                      <strong className="text-slate-850">{targetDn.note || '-'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-400">ยอดเงินรวมสุทธิ:</span>
                      <strong className="text-emerald-600 font-mono text-sm font-black">
                        ฿{targetDn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteDeliveryId(null)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    ยกเลิก (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteDeliveryNote}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/15 transition-all cursor-pointer"
                  >
                    🚨 ใช่, ฉันต้องการลบใบส่งของนี้
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ADD NEW PAYER / CUSTOMER MODAL */}
      <AnimatePresence>
        {isAddPayerOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[160] overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-700"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5 select-none">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">เพิ่มบริษัทลูกค้าคู่ค้าใหม่</h3>
                    <p className="text-[10px] text-slate-400 font-bold">กรอกข้อมูลลูกค้าเพื่อออกใบวางบิลในระบบ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPayerOpen(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddPayer}>
                <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                  <div>
                    <label className="block mb-1.5">ชื่อบริษัทลูกค้าคู่ค้า <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newPayerName}
                      onChange={(e) => setNewPayerName(e.target.value)}
                      placeholder="เช่น บริษัท แซฟไฟร์ คอร์ปอเรชั่น จำกัด (สำนักงานใหญ่)"
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                      <input
                        type="text"
                        maxLength={13}
                        value={newPayerTaxId}
                        onChange={(e) => setNewPayerTaxId(e.target.value.replace(/\D/g, ''))}
                        placeholder="เลขผู้เสียภาษี 13 หลัก"
                        className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
                      <input
                        type="text"
                        value={newPayerPhone}
                        onChange={(e) => setNewPayerPhone(e.target.value)}
                        placeholder="เช่น 02-123-4567"
                        className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5">อีเมลติดต่อ</label>
                    <input
                      type="email"
                      value={newPayerEmail}
                      onChange={(e) => setNewPayerEmail(e.target.value)}
                      placeholder="เช่น contact@partnercompany.com"
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5">ที่อยู่สถานประกอบการ</label>
                    <textarea
                      value={newPayerAddress}
                      onChange={(e) => setNewPayerAddress(e.target.value)}
                      rows={3}
                      placeholder="เลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์..."
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddPayerOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    ยกเลิก (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/15 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> บันทึกและเลือกทันที
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
