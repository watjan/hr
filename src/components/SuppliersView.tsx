import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  User,
  Star,
  DollarSign,
  Package,
  Calendar,
  FileText,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SupplierPartner, DeliveryLog, EmployeeSalary } from '../types';

interface SuppliersViewProps {
  employees: EmployeeSalary[];
}

export const INITIAL_SUPPLIERS: SupplierPartner[] = [
  {
    id: "SPL-001",
    name: "บริษัท ไทยสเตนเลส มาร์เก็ตติ้ง จำกัด",
    contactName: "คุณวิชัย เลิศสเตนเลส",
    phone: "02-555-1234",
    email: "wichai@thaistainless.com",
    address: "88/9 ถ.บางนา-ตราด กม.12 ต.บางพลีใหญ่ อ.บางพลี จ.สมุทรปราการ 10540",
    productCategory: "แผ่นสแตนเลสและท่อโลหะ",
    deliveryStatus: "active",
    rating: 5,
    paymentTerms: "เครดิต 30 วัน",
    totalDeliveriesCount: 42,
    outstandingBalance: 125000,
    lastDeliveryDate: "2026-06-20"
  },
  {
    id: "SPL-002",
    name: "หจก. พัทลุง บรรจุภัณฑ์ และถุงกระดาษ",
    contactName: "คุณสมพงษ์ แก้วดี",
    phone: "074-612-345",
    email: "contact@phatthalungpack.com",
    address: "123 ถ.ราเมศวร์ ต.คูหาสวรรค์ อ.เมือง จ.พัทลุง 93000",
    productCategory: "บรรจุภัณฑ์และกล่องกระดาษ",
    deliveryStatus: "active",
    rating: 4,
    paymentTerms: "เงินสดลด 2%",
    totalDeliveriesCount: 28,
    outstandingBalance: 0,
    lastDeliveryDate: "2026-06-24"
  },
  {
    id: "SPL-003",
    name: "บจก. พัทลุงอุตสาหกรรมแก๊ส",
    contactName: "คุณสุนีย์ รัตนเจริญ",
    phone: "074-615-999",
    email: "sunee.gas@gmail.com",
    address: "45 หมู่ 3 ต.ท่ามิหรำ อ.เมือง จ.พัทลุง 93000",
    productCategory: "แก๊สหุงต้มและแก๊สอุตสาหกรรม",
    deliveryStatus: "active",
    rating: 5,
    paymentTerms: "เครดิต 15 วัน",
    totalDeliveriesCount: 56,
    outstandingBalance: 18500,
    lastDeliveryDate: "2026-06-25"
  },
  {
    id: "SPL-004",
    name: "บริษัท โกลบอล คิทเช่น อิมพอร์ต จำกัด",
    contactName: "คุณแอนดรูว์ หวัง",
    phone: "02-888-7766",
    email: "sales@globalkitchen.co.th",
    address: "456 ถ.รัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
    productCategory: "เครื่องครัวนำเข้าและอะไหล่",
    deliveryStatus: "inactive",
    rating: 3,
    paymentTerms: "มัดจำ 50% ก่อนจัดส่ง",
    totalDeliveriesCount: 12,
    outstandingBalance: 0,
    lastDeliveryDate: "2026-05-14"
  },
  {
    id: "SPL-005",
    name: "บจก. สยาม โลจิสติกส์ ทรานสปอร์ต",
    contactName: "คุณมานะ ทรงพลัง",
    phone: "081-456-7890",
    email: "mana.s@siamlogistic.com",
    address: "10/4 ถ.กาญจนาภิเษก แขวงบางแค เขตบางแค กรุงเทพฯ 10160",
    productCategory: "บริการขนส่ง/โลจิสติกส์",
    deliveryStatus: "active",
    rating: 5,
    paymentTerms: "เครดิต 30 วัน",
    totalDeliveriesCount: 95,
    outstandingBalance: 45000,
    lastDeliveryDate: "2026-06-26"
  }
];

export const INITIAL_DELIVERIES: DeliveryLog[] = [
  {
    id: "DLV-001",
    supplierId: "SPL-005",
    supplierName: "บจก. สยาม โลจิสติกส์ ทรานสปอร์ต",
    deliveryDate: "2026-06-26",
    billNo: "INV-LOG2606-09",
    amount: 12500,
    deliveryStatus: "delivered",
    receiverName: "สมชาย แสนดี",
    note: "จัดส่งตู้อบความร้อนและจานสแตนเลสให้ลูกค้าสาขาพัทลุงเรียบร้อย"
  },
  {
    id: "DLV-002",
    supplierId: "SPL-003",
    supplierName: "บจก. พัทลุงอุตสาหกรรมแก๊ส",
    deliveryDate: "2026-06-25",
    billNo: "G-99881",
    amount: 4500,
    deliveryStatus: "delivered",
    receiverName: "สายใจ สดชื่น",
    note: "เปลี่ยนถังแก๊ส LPG 48 กิโลกรัม จำนวน 3 ถังสำหรับแผนกทดสอบเตา"
  },
  {
    id: "DLV-003",
    supplierId: "SPL-002",
    supplierName: "หจก. พัทลุง บรรจุภัณฑ์ และถุงกระดาษ",
    deliveryDate: "2026-06-24",
    billNo: "PKG-2026/102",
    amount: 8600,
    deliveryStatus: "delivered",
    receiverName: "สมชาย แสนดี",
    note: "กล่องกระดาษคราฟท์ใส่เตาอบ 500 ใบ ครบถ้วนตามสเปก"
  },
  {
    id: "DLV-004",
    supplierId: "SPL-001",
    supplierName: "บริษัท ไทยสเตนเลส มาร์เก็ตติ้ง จำกัด",
    deliveryDate: "2026-06-23",
    billNo: "TX-998822",
    amount: 85000,
    deliveryStatus: "shipping",
    receiverName: "วิทยา ภูมิใจ",
    note: "แผ่นสแตนเลสเกรด 304 ขนาด 4x8 ฟุต จำนวน 20 แผ่น กำลังเดินทางจากกรุงเทพฯ"
  },
  {
    id: "DLV-005",
    supplierId: "SPL-001",
    supplierName: "บริษัท ไทยสเตนเลส มาร์เก็ตติ้ง จำกัด",
    deliveryDate: "2026-06-20",
    billNo: "TX-998124",
    amount: 40000,
    deliveryStatus: "delivered",
    receiverName: "วิทยา ภูมิใจ",
    note: "ท่อกลมสแตนเลสขัดเงา 2 นิ้ว จัดส่งเรียบร้อย ตรวจนับครบถ้วน"
  },
  {
    id: "DLV-006",
    supplierId: "SPL-004",
    supplierName: "บริษัท โกลบอล คิทเช่น อิมพอร์ต จำกัด",
    deliveryDate: "2026-05-10",
    billNo: "IMP-9001",
    amount: 14800,
    deliveryStatus: "delayed",
    receiverName: "วิทยา ภูมิใจ",
    note: "อะไหล่เครื่องครัวนำเข้า เกิดความล่าช้าเนื่องจากพิธีการศุลกากรสะดุด"
  }
];

const CATEGORIES = [
  "ทั้งหมด",
  "แผ่นสแตนเลสและท่อโลหะ",
  "บรรจุภัณฑ์และกล่องกระดาษ",
  "แก๊สหุงต้มและแก๊สอุตสาหกรรม",
  "เครื่องครัวนำเข้าและอะไหล่",
  "บริการขนส่ง/โลจิสติกส์",
  "อื่นๆ"
];

export default function SuppliersView({ employees }: SuppliersViewProps) {
  // Navigation tabs
  const [currentTab, setCurrentTab] = useState<'directory' | 'logs'>('directory');

  // Load and Save Local Storage
  const [suppliers, setSuppliers] = useState<SupplierPartner[]>(() => {
    const saved = localStorage.getItem('company_suppliers_data');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>(() => {
    const saved = localStorage.getItem('company_delivery_logs_data');
    return saved ? JSON.parse(saved) : INITIAL_DELIVERIES;
  });

  useEffect(() => {
    localStorage.setItem('company_suppliers_data', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('company_delivery_logs_data', JSON.stringify(deliveryLogs));
  }, [deliveryLogs]);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Supplier Modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierPartner | null>(null);
  const [supplierForm, setSupplierForm] = useState<Omit<SupplierPartner, 'id' | 'totalDeliveriesCount'>>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    productCategory: 'แผ่นสแตนเลสและท่อโลหะ',
    deliveryStatus: 'active',
    rating: 5,
    paymentTerms: 'เครดิต 30 วัน',
    outstandingBalance: 0,
    lastDeliveryDate: ''
  });

  // Delivery Modal state
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryLog | null>(null);
  const [deliveryForm, setDeliveryForm] = useState<Omit<DeliveryLog, 'id'>>({
    supplierId: '',
    supplierName: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    billNo: '',
    amount: 0,
    deliveryStatus: 'delivered',
    receiverName: '',
    note: ''
  });

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Custom Deletion Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'supplier' | 'delivery';
    id: string;
    name?: string;
  }>({
    isOpen: false,
    type: 'supplier',
    id: '',
    name: ''
  });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper mapping function for Delivery Tracking Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="w-3 h-3 text-blue-400 animate-pulse" />
            <span>In Transit</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>Delivered</span>
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce" />
            <span>Delayed</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <XCircle className="w-3 h-3 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/40 text-slate-500 border border-slate-800">
            ไม่มีข้อมูลจัดส่ง
          </span>
        );
    }
  };

  // Function to update the latest delivery log status of a supplier, or create one if none exists
  const updateLatestDeliveryStatus = (
    supplierId: string, 
    supplierName: string, 
    newStatus: 'delivered' | 'pending' | 'shipping' | 'delayed' | 'cancelled'
  ) => {
    const logsForSupplier = [...deliveryLogs]
      .filter(log => log.supplierId === supplierId)
      .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());

    if (logsForSupplier.length > 0) {
      // Update the latest delivery log status
      const latestLogId = logsForSupplier[0].id;
      setDeliveryLogs(prev => prev.map(log => log.id === latestLogId ? { ...log, deliveryStatus: newStatus } : log));
      showToast(`อัปเดตสถานะจัดส่งล่าสุดของคู่ค้าเป็น "${newStatus}" เรียบร้อยแล้ว`, 'success');
    } else {
      // Create a new delivery log for this supplier
      const newLog: DeliveryLog = {
        id: `DLV-${String(deliveryLogs.length + 1).padStart(3, '0')}`,
        supplierId,
        supplierName,
        deliveryDate: new Date().toISOString().split('T')[0],
        billNo: `AUTO-${String(Math.floor(1000 + Math.random() * 9000))}`,
        amount: 0,
        deliveryStatus: newStatus,
        receiverName: employees && employees.length > 0 ? employees[0].name : "วิทยา ภูมิใจ",
        note: "สร้างบันทึกอัปเดตสถานะอัตโนมัติจากหน้าจัดการคู่ค้า"
      };
      setDeliveryLogs(prev => [...prev, newLog]);
      showToast(`สร้างบันทึกจัดส่งใหม่ และตั้งสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`, 'success');
    }
  };

  // KPI calculations
  const activeSuppliersCount = suppliers.filter(s => s.deliveryStatus === 'active').length;
  const totalOutstandingBalance = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
  const totalDeliveriesCount = deliveryLogs.length;
  const activeDeliveriesCount = deliveryLogs.filter(d => d.deliveryStatus === 'shipping' || d.deliveryStatus === 'pending').length;

  // Handle Supplier Forms
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      productCategory: 'แผ่นสแตนเลสและท่อโลหะ',
      deliveryStatus: 'active',
      rating: 5,
      paymentTerms: 'เครดิต 30 วัน',
      outstandingBalance: 0,
      lastDeliveryDate: ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: SupplierPartner) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      productCategory: supplier.productCategory,
      deliveryStatus: supplier.deliveryStatus,
      rating: supplier.rating,
      paymentTerms: supplier.paymentTerms || 'เครดิต 30 วัน',
      outstandingBalance: supplier.outstandingBalance || 0,
      lastDeliveryDate: supplier.lastDeliveryDate || ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleSubmitSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      showToast('⚠️ กรุณาระบุชื่อคู่ค้า', 'error');
      return;
    }

    if (editingSupplier) {
      // Edit
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? {
        ...s,
        ...supplierForm
      } : s));
      showToast('✏️ แก้ไขข้อมูลคู่ค้าสำเร็จ');
    } else {
      // Add
      const newId = `SPL-${String(suppliers.length + 1).padStart(3, '0')}`;
      const newSupplier: SupplierPartner = {
        id: newId,
        ...supplierForm,
        totalDeliveriesCount: 0
      };
      setSuppliers(prev => [...prev, newSupplier]);
      showToast('➕ เพิ่มคู่ค้าใหม่เรียบร้อยแล้ว');
    }
    setIsSupplierModalOpen(false);
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'supplier',
      id,
      name
    });
  };

  // Handle Delivery Forms
  const handleOpenAddDelivery = () => {
    setEditingDelivery(null);
    setDeliveryForm({
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || '',
      deliveryDate: new Date().toISOString().split('T')[0],
      billNo: '',
      amount: 0,
      deliveryStatus: 'delivered',
      receiverName: employees[0]?.name || '',
      note: ''
    });
    setIsDeliveryModalOpen(true);
  };

  const handleOpenEditDelivery = (log: DeliveryLog) => {
    setEditingDelivery(log);
    setDeliveryForm({
      supplierId: log.supplierId,
      supplierName: log.supplierName,
      deliveryDate: log.deliveryDate,
      billNo: log.billNo || '',
      amount: log.amount,
      deliveryStatus: log.deliveryStatus,
      receiverName: log.receiverName,
      note: log.note || ''
    });
    setIsDeliveryModalOpen(true);
  };

  const handleSubmitDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryForm.supplierId) {
      showToast('⚠️ กรุณาเลือกคู่ค้าที่จัดส่ง', 'error');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === deliveryForm.supplierId);
    const supplierName = selectedSupplier ? selectedSupplier.name : deliveryForm.supplierName;

    if (editingDelivery) {
      // Edit
      setDeliveryLogs(prev => prev.map(d => d.id === editingDelivery.id ? {
        ...d,
        ...deliveryForm,
        supplierName
      } : d));
      showToast('✏️ แก้ไขบันทึกการส่งของสำเร็จ');
    } else {
      // Add
      const newId = `DLV-${String(deliveryLogs.length + 1).padStart(3, '0')}`;
      const newLog: DeliveryLog = {
        id: newId,
        ...deliveryForm,
        supplierName
      };
      setDeliveryLogs(prev => [newLog, ...prev]);

      // Update delivery count and last delivery date on supplier
      setSuppliers(prev => prev.map(s => s.id === deliveryForm.supplierId ? {
        ...s,
        totalDeliveriesCount: s.totalDeliveriesCount + 1,
        lastDeliveryDate: deliveryForm.deliveryDate,
        outstandingBalance: deliveryForm.deliveryStatus === 'delivered' ? (s.outstandingBalance || 0) + deliveryForm.amount : s.outstandingBalance
      } : s));

      showToast('➕ บันทึกข้อมูลการรับมอบสิ่งของเรียบร้อย');
    }
    setIsDeliveryModalOpen(false);
  };

  const handleDeleteDelivery = (id: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'delivery',
      id,
      name: `รายการส่งของรหัส ${id}`
    });
  };

  const handleConfirmDelete = () => {
    const { type, id } = confirmModal;
    if (type === 'supplier') {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      // Optionally clean up deliveries
      setDeliveryLogs(prev => prev.filter(d => d.supplierId !== id));
      showToast('🗑️ ลบข้อมูลคู่ค้าเสร็จสิ้น', 'info');
    } else if (type === 'delivery') {
      const target = deliveryLogs.find(d => d.id === id);
      setDeliveryLogs(prev => prev.filter(d => d.id !== id));
      if (target) {
        // optionally decrement supplier deliveries count
        setSuppliers(prev => prev.map(s => s.id === target.supplierId ? {
          ...s,
          totalDeliveriesCount: Math.max(0, s.totalDeliveriesCount - 1)
        } : s));
      }
      showToast('🗑️ ลบบันทึกการส่งของเรียบร้อย', 'info');
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Filter logic
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.contactName && s.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.phone && s.phone.includes(searchTerm));
    const matchesCategory = selectedCategory === 'ทั้งหมด' || s.productCategory === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || s.deliveryStatus === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredLogs = deliveryLogs.filter(d => {
    const matchesSearch = d.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.billNo && d.billNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (d.receiverName && d.receiverName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || d.deliveryStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Upper Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-450 block">คู่ค้าที่ใช้งานอยู่ (Active)</span>
            <span className="text-2xl font-black font-mono text-white">{activeSuppliersCount} <span className="text-xs text-slate-500 font-normal">/ {suppliers.length} ราย</span></span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-450 block">จำนวนรอบส่งของสะสม</span>
            <span className="text-2xl font-black font-mono text-emerald-400">{totalDeliveriesCount} <span className="text-xs text-slate-500 font-normal">รอบ</span></span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-450 block">ยอดค้างจ่ายสินค้าสะสม</span>
            <span className="text-2xl font-black font-mono text-amber-400">฿{totalOutstandingBalance.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-450 block">กำลังดำเนินการขนส่ง</span>
            <span className="text-2xl font-black font-mono text-indigo-400">{activeDeliveriesCount} <span className="text-xs text-slate-500 font-normal">ออเดอร์</span></span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-900 space-y-6">
        
        {/* Nav Tabs & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80 self-start">
            <button
              onClick={() => { setCurrentTab('directory'); setSelectedStatus('all'); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentTab === 'directory' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>ฐานข้อมูลผู้จัดส่งและคู่ค้า</span>
            </button>
            <button
              onClick={() => { setCurrentTab('logs'); setSelectedStatus('all'); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentTab === 'logs' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>บันทึกประวัติการส่งของ</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentTab === 'directory' ? (
              <button
                onClick={handleOpenAddSupplier}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มคู่ค้า / ผู้จัดส่งสินค้า</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddDelivery}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกการส่งของใหม่</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={currentTab === 'directory' ? "ค้นหาชื่อคู่ค้า, ผู้ติดต่อ, โทรศัพท์..." : "ค้นหาใบส่งของ, ชื่อคู่ค้า, ผู้รับสินค้า..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600"
            />
          </div>

          {currentTab === 'directory' && (
            <div className="md:col-span-4 flex items-center gap-2">
              <span className="text-[10px] text-slate-550 font-bold whitespace-nowrap shrink-0">หมวดหมู่:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-600"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <div className={`md:col-span-3 flex items-center gap-2 ${currentTab === 'logs' ? 'md:col-span-7' : ''}`}>
            <span className="text-[10px] text-slate-550 font-bold whitespace-nowrap shrink-0">สถานะ:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-600"
            >
              {currentTab === 'directory' ? (
                <>
                  <option value="all">ทั้งหมด</option>
                  <option value="active">🟢 ใช้งานอยู่ (Active)</option>
                  <option value="inactive">🔴 ระงับชั่วคราว (Inactive)</option>
                </>
              ) : (
                <>
                  <option value="all">ทั้งหมด</option>
                  <option value="delivered">🟢 ส่งของสำเร็จแล้ว (Delivered)</option>
                  <option value="shipping">🚚 อยู่ระหว่างจัดส่ง (Shipping)</option>
                  <option value="pending">🟡 รอคิวดำเนินการ (Pending)</option>
                  <option value="delayed">⚠️ จัดส่งล่าช้ากว่ากำหนด (Delayed)</option>
                  <option value="cancelled">🔴 ยกเลิกรายการ (Cancelled)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Tab Content Rendering */}
        <AnimatePresence mode="wait">
          {currentTab === 'directory' ? (
            <motion.div
              key="directory-table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-bold border border-dashed border-slate-900 rounded-xl">
                  📭 ไม่พบข้อมูลคู่ค้าที่ระบุในระบบ
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                        <th className="py-3 px-4">รหัส</th>
                        <th className="py-3 px-4">ชื่อคู่ค้าจัดส่ง</th>
                        <th className="py-3 px-4">หมวดหมู่สินค้าหลัก</th>
                        <th className="py-3 px-4">การติดต่อประสานงาน</th>
                        <th className="py-3 px-4 text-center">เครดิต / ชำระเงิน</th>
                        <th className="py-3 px-4 text-center">คะแนนคู่ค้า</th>
                        <th className="py-3 px-4 text-center">รอบส่งสะสม</th>
                        <th className="py-3 px-4 text-right">ยอดค้างชำระ</th>
                        <th className="py-3 px-4 text-center">สถานะติดตามของ (Tracking)</th>
                        <th className="py-3 px-4 text-center">สถานะ</th>
                        <th className="py-3 px-4 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-medium text-slate-300">
                      {filteredSuppliers.map(s => {
                        const latestLog = [...deliveryLogs]
                          .filter(log => log.supplierId === s.id)
                          .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())[0];

                        return (
                          <tr key={s.id} className="hover:bg-slate-900/35 transition-colors group">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{s.id}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{s.name}</p>
                            {s.address && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs" title={s.address}>
                                📍 {s.address}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-850 text-slate-400">
                              {s.productCategory}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 space-y-0.5">
                            <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" /> {s.contactName || '-'}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" /> {s.phone || '-'}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-300 text-[11px]">{s.paymentTerms || '-'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < s.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">{s.totalDeliveriesCount} รอบ</td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400">
                            ฿{(s.outstandingBalance || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {getStatusBadge(latestLog?.deliveryStatus || '')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              s.deliveryStatus === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.deliveryStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              {s.deliveryStatus === 'active' ? 'ใช้งานอยู่' : 'ระงับชั่วคราว'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Status Dropdown selector */}
                              <div className="relative">
                                <select
                                  id={`status-select-${s.id}`}
                                  value={latestLog?.deliveryStatus || ''}
                                  onChange={(e) => updateLatestDeliveryStatus(s.id, s.name, e.target.value as any)}
                                  className="text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-300 pl-2 pr-6 py-1.5 font-bold focus:outline-none focus:border-blue-500 cursor-pointer appearance-none hover:bg-slate-900"
                                  title="ปรับเปลี่ยนสถานะส่งของล่าสุด"
                                >
                                  <option value="" disabled={!!latestLog}>อัปเดตสถานะ...</option>
                                  <option value="shipping">🚚 In Transit</option>
                                  <option value="delivered">🟢 Delivered</option>
                                  <option value="delayed">⚠️ Delayed</option>
                                  <option value="pending">🟡 Pending</option>
                                  <option value="cancelled">🔴 Cancelled</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-500">
                                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                  </svg>
                                </div>
                              </div>

                              <button
                                onClick={() => handleOpenEditSupplier(s)}
                                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                                title="แก้ไขข้อมูลคู่ค้า"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(s.id, s.name)}
                                className="p-1.5 rounded-lg border border-rose-950/40 text-rose-400 hover:text-white hover:bg-rose-900/40 transition-colors cursor-pointer"
                                title="ลบข้อมูลคู่ค้า"
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
              )}
            </motion.div>
          ) : (
            <motion.div
              key="logs-table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-bold border border-dashed border-slate-900 rounded-xl">
                  📭 ไม่พบประวัติบันทึกการส่งของ
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                        <th className="py-3 px-4">เลขที่รายการ</th>
                        <th className="py-3 px-4">วันที่จัดส่ง</th>
                        <th className="py-3 px-4">ชื่อบริษัทคู่ค้า</th>
                        <th className="py-3 px-4">เลขที่ใบส่งของ (Bill No.)</th>
                        <th className="py-3 px-4 text-right">ยอดเงินในบิล</th>
                        <th className="py-3 px-4">เจ้าหน้าที่ผู้รับของ</th>
                        <th className="py-3 px-4">หมายเหตุ / ข้อมูลจัดส่ง</th>
                        <th className="py-3 px-4 text-center">สถานะจัดส่ง</th>
                        <th className="py-3 px-4 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-medium text-slate-300">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-900/35 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{log.id}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                            {new Date(log.deliveryDate).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">{log.supplierName}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{log.billNo || 'ไม่มีเลขบิล'}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400">
                            ฿{log.amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">{log.receiverName || '-'}</td>
                          <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate" title={log.note}>
                            {log.note || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                              log.deliveryStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              log.deliveryStatus === 'shipping' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              log.deliveryStatus === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {log.deliveryStatus === 'delivered' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> :
                               log.deliveryStatus === 'shipping' ? <Truck className="w-3 h-3 text-blue-400 animate-pulse" /> :
                               log.deliveryStatus === 'pending' ? <Clock className="w-3 h-3 text-amber-400" /> :
                               <XCircle className="w-3 h-3 text-rose-400" />}
                              <span>
                                {log.deliveryStatus === 'delivered' ? 'ส่งสำเร็จเรียบร้อย' :
                                 log.deliveryStatus === 'shipping' ? 'อยู่ระหว่างจัดส่ง' :
                                 log.deliveryStatus === 'pending' ? 'รอเตรียมส่ง' : 'ยกเลิกจัดส่ง'}
                              </span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditDelivery(log)}
                                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                                title="แก้ไขบันทึก"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDelivery(log.id)}
                                className="p-1.5 rounded-lg border border-rose-950/40 text-rose-400 hover:text-white hover:bg-rose-900/40 transition-colors cursor-pointer"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Supplier Modal Dialog */}
      <AnimatePresence>
        {isSupplierModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative"
            >
              <h3 className="text-base font-black text-white flex items-center gap-2 pb-4 border-b border-slate-900">
                <Briefcase className="w-5 h-5 text-blue-500" />
                <span>{editingSupplier ? 'แก้ไขข้อมูลคู่ค้า' : 'เพิ่มข้อมูลคู่ค้าส่งของรายใหม่'}</span>
              </h3>

              <form onSubmit={handleSubmitSupplier} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">ชื่อบริษัท / ร้านคู่ค้า <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="บจก. สยามวัสดุภัณฑ์"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">ประเภทวัตถุดิบ/หมวดหมู่ที่ส่ง</label>
                    <select
                      value={supplierForm.productCategory}
                      onChange={(e) => setSupplierForm({ ...supplierForm, productCategory: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                    >
                      {CATEGORIES.filter(c => c !== 'ทั้งหมด').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">ชื่อผู้ติดต่อประสานงาน</label>
                    <input
                      type="text"
                      placeholder="คุณสมยศ ประสานงาน"
                      value={supplierForm.contactName}
                      onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      placeholder="08X-XXX-XXXX"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">อีเมลติดต่อ</label>
                    <input
                      type="email"
                      placeholder="partner@example.com"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">เงื่อนไขการชำระเงิน (Payment Terms)</label>
                    <input
                      type="text"
                      placeholder="เช่น เครดิต 30 วัน, เงินสด"
                      value={supplierForm.paymentTerms}
                      onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">คะแนนการประเมิน (1-5 ดาว)</label>
                    <select
                      value={supplierForm.rating}
                      onChange={(e) => setSupplierForm({ ...supplierForm, rating: Number(e.target.value) })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                    >
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n} ดาว</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">ยอดค้างจ่ายสะสม (บาท)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={supplierForm.outstandingBalance}
                      onChange={(e) => setSupplierForm({ ...supplierForm, outstandingBalance: Number(e.target.value) })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">สถานะเปิดรับคู่ค้า</label>
                    <select
                      value={supplierForm.deliveryStatus}
                      onChange={(e) => setSupplierForm({ ...supplierForm, deliveryStatus: e.target.value as 'active' | 'inactive' })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="active">🟢 กำลังจัดส่ง/เปิดใช้งาน (Active)</option>
                      <option value="inactive">🔴 ระงับชั่วคราว (Inactive)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">ที่อยู่สำนักงาน / โรงงาน</label>
                  <textarea
                    rows={3}
                    placeholder="กรอกที่อยู่โดยละเอียด..."
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    {editingSupplier ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delivery Log Modal Dialog */}
      <AnimatePresence>
        {isDeliveryModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative"
            >
              <h3 className="text-base font-black text-white flex items-center gap-2 pb-4 border-b border-slate-900">
                <Truck className="w-5 h-5 text-blue-500" />
                <span>{editingDelivery ? 'แก้ไขบันทึกการส่งของ' : 'บันทึกประวัติจัดส่งและรับมอบสิ่งของ'}</span>
              </h3>

              <form onSubmit={handleSubmitDelivery} className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">เลือกบริษัทคู่ค้าผู้ส่ง <span className="text-rose-500">*</span></label>
                  <select
                    value={deliveryForm.supplierId}
                    onChange={(e) => {
                      const selected = suppliers.find(s => s.id === e.target.value);
                      setDeliveryForm({ 
                        ...deliveryForm, 
                        supplierId: e.target.value,
                        supplierName: selected ? selected.name : ''
                      });
                    }}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="" disabled>-- เลือกบริษัทคู่ค้า --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.productCategory})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">วันที่มาส่งของ <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={deliveryForm.deliveryDate}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">เลขที่ใบส่งของ / บิลอ้างอิง</label>
                    <input
                      type="text"
                      placeholder="เช่น INV-2026/05"
                      value={deliveryForm.billNo}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, billNo: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">มูลค่าสิ่งส่งมอบในบิล (บาท)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={deliveryForm.amount}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, amount: Number(e.target.value) })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">ผู้รับมอบของฝ่ายบริษัท <span className="text-rose-500">*</span></label>
                    <select
                      value={deliveryForm.receiverName}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverName: e.target.value })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="" disabled>-- เลือกเจ้าหน้าที่ผู้รับของ --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                      ))}
                      <option value="สมชาย แสนดี">สมชาย แสนดี (ฝ่ายขนส่งหลัก)</option>
                      <option value="วิทยา ภูมิใจ">วิทยา ภูมิใจ (ฝ่ายคลังสินค้า)</option>
                      <option value="สายใจ สดชื่น">สายใจ สดชื่น (ธุรการคลัง)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">สถานะจัดส่ง/ส่งสินค้า</label>
                    <select
                      value={deliveryForm.deliveryStatus}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryStatus: e.target.value as any })}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="delivered">🟢 ส่งสำเร็จสมบูรณ์ ตรวจนับครบ (Delivered)</option>
                      <option value="shipping">🚚 กำลังนำส่ง/อยู่ระหว่างขนส่ง (Shipping)</option>
                      <option value="pending">🟡 รอคิวดำเนินการผลิต/จัดส่ง (Pending)</option>
                      <option value="cancelled">🔴 ยกเลิกรายการส่งนี้ (Cancelled)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">รายละเอียดพัสดุ / หมายเหตุเพิ่มเติม</label>
                  <textarea
                    rows={3}
                    placeholder="ระบุสิ่งที่จัดส่ง เช่น ท่อสแตนเลส 30 เส้น, กล่องบรรจุ 100 ใบ หรือปัญหาการตรวจนับพบพัสดุชำรุดเสียหาย..."
                    value={deliveryForm.note}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, note: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsDeliveryModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    {editingDelivery ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลรับของ'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-slate-900 border border-rose-500/20 rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-center text-base font-bold text-white mb-2">
                ยืนยันการลบข้อมูล
              </h3>

              <p className="text-center text-xs font-medium text-slate-400 leading-relaxed mb-6">
                คุณแน่ใจหรือไม่ว่าต้องการลบ <span className="font-bold text-rose-400">"{confirmModal.name}"</span>?
                <br />
                <span className="text-[10px] text-slate-500 mt-1 block">⚠️ การดำเนินการนี้ไม่สามารถย้อนคืนได้ และจะลบข้อมูลที่เกี่ยวข้องออกทั้งหมด</span>
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-950 transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/10 cursor-pointer"
                >
                  ยืนยันลบข้อมูล
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 max-w-sm"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
              toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-150">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
