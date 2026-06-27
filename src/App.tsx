import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  CreditCard, 
  Calendar, 
  LayoutDashboard, 
  Settings, 
  Users, 
  HelpCircle,
  Menu,
  X,
  RefreshCw,
  Clock,
  Briefcase,
  Paintbrush,
  TrendingUp,
  Banknote,
  Wallet,
  LogOut,
  Shield,
  Lock,
  UserCog,
  Cloud,
  Database,
  UploadCloud,
  DownloadCloud,
  Check,
  Server,
  Loader2,
  AlertTriangle,
  Eye,
  Layers,
  ChevronLeft,
  BookOpen,
  FileText,
  FileSpreadsheet,
  UserCheck,
  ExternalLink,
  Truck,
  HardDrive
} from 'lucide-react';

// Types and mock data
import { CompanySettings, EmployeeSalary, LeaveRequest, Cheque, UserSession, UserRole, ChequePayer, ChequePayee } from './types';
import { 
  INITIAL_COMPANY_SETTINGS, 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PAYERS,
  INITIAL_PAYEES
} from './mockData';

// Modular Components
import DashboardOverview from './components/DashboardOverview';
import CompanySettingsView from './components/CompanySettingsView';
import PayrollView from './components/PayrollView';
import AttendanceView from './components/AttendanceView';
import EmployeeRegistryView from './components/EmployeeRegistryView';
import SalesView from './components/SalesView';
import ChequesView, { DEFAULT_CHEQUES } from './components/ChequesView';
import ChequeNotifications from './components/ChequeNotifications';
import LoginView from './components/LoginView';
import UsersRolesView, { MODULE_TABS, PRESET_AVATARS, ALL_ROLES } from './components/UsersRolesView';
import ConsolidatedReportsView from './components/ConsolidatedReportsView';
import EmployeeLeaveView from './components/EmployeeLeaveView';
import LeaveApprovalView from './components/LeaveApprovalView';
import DailyCashLogView from './components/DailyCashLogView';
import AccountingTaxView from './components/AccountingTaxView';
import SalesBillingView from './components/SalesBillingView';
import WebInstallerSimulator from './components/WebInstallerSimulator';
import SuppliersView from './components/SuppliersView';
import GDriveView from './components/GDriveView';
import { 
  testConnection, 
  saveKeyToCloud, 
  uploadAllToCloud, 
  downloadAllFromCloud, 
  fetchKeyFromCloud,
  ensureLocalDefaultsInStorage
} from './lib/firebaseSync';
import firebaseConfig from '../firebase-applet-config.json';

const SYNC_MAPPINGS: Record<string, string> = {
  'sapphire_users': 'users',
  'sapphire_role_permissions': 'role_permissions',
  'hr_company_settings': 'company_settings',
  'hr_employees': 'employees',
  'hr_leave_requests': 'leave_requests',
  'hr_daily_attendance': 'daily_attendance',
  'sapphire_daily_sales': 'daily_sales',
  'hr_cheques_data': 'cheques_data',
  'sapphire_payroll_registries': 'payroll_registries',
  'hr_cheque_payers': 'cheque_payers',
  'hr_cheque_payees': 'cheque_payees',
  'sapphire_sales_annual_target': 'sales_annual_target',
  'sapphire_billing_statements': 'billing_statements'
};

// Monkeypatch localStorage.setItem to dispatch custom events
if (typeof window !== 'undefined' && !(window as any).__local_storage_intercepted) {
  (window as any).__local_storage_intercepted = true;
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    const event = new CustomEvent('local_storage_write', {
      detail: { key, value }
    });
    window.dispatchEvent(event);
  };
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [permissionsTrigger, setPermissionsTrigger] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [digitalTime, setDigitalTime] = useState(new Date());
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isChequeDuePopupOpen, setIsChequeDuePopupOpen] = useState(true);
  const [useSimulatedCheques, setUseSimulatedCheques] = useState(false);

  // Firebase Database Sync & Connection States
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [modalSubTab, setModalSubTab] = useState<'status' | 'tables'>('status');
  const [inspectedTable, setInspectedTable] = useState<string | null>(null);
  const [cloudConnectionState, setCloudConnectionState] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [cloudSyncState, setCloudSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sapphire_auto_sync_firebase') !== 'false';
  });
  const [syncLogs, setSyncLogs] = useState<string[]>(['[ระบบ] เริ่มต้นระบบเชื่อมต่อฐานข้อมูลศูนย์กลาง Sapphire Cloud']);

  const addSyncLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('th-TH');
    setSyncLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 30)]);
  };

  const handleExportFullBackup = () => {
    const localKeyMap: Record<string, string> = {
      employees: 'hr_employees',
      leave_requests: 'hr_leave_requests',
      daily_attendance: 'hr_daily_attendance',
      cheques_data: 'hr_cheques_data',
      daily_sales: 'sapphire_daily_sales',
      users: 'sapphire_users',
      role_permissions: 'sapphire_role_permissions',
      company_settings: 'hr_company_settings'
    };

    const backupData: Record<string, any> = {};
    Object.entries(localKeyMap).forEach(([tableId, localKey]) => {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        try {
          backupData[tableId] = JSON.parse(raw);
        } catch (e) {
          backupData[tableId] = raw;
        }
      } else {
        backupData[tableId] = null;
      }
    });

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `sapphire_hr_complete_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addSyncLog('📁 ทำรายการสำรองฐานข้อมูลทั้งหมด (Full Backup JSON) สำเร็จแล้ว!');
  };

  const handleImportFullBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      try {
        const data = JSON.parse(text);
        
        const localKeyMap: Record<string, string> = {
          employees: 'hr_employees',
          leave_requests: 'hr_leave_requests',
          daily_attendance: 'hr_daily_attendance',
          cheques_data: 'hr_cheques_data',
          daily_sales: 'sapphire_daily_sales',
          users: 'sapphire_users',
          role_permissions: 'sapphire_role_permissions',
          company_settings: 'hr_company_settings'
        };

        if (!confirm('คำเตือน: คุณต้องการนำเข้าข้อมูลสำรองทั้งหมด ซึ่งจะติดตั้งแทนที่และลบทับข้อมูลปัจจุบันในเว็บบราวเซอร์ของคุณ ยืนยันดำเนินการต่อใช่หรือไม่?')) {
          return;
        }

        setCloudSyncState('syncing');
        addSyncLog('📁 เริ่มดำเนินการตรวจสอบและนำเข้าชุดแฟ้มสำรอง...');

        let importedTablesCount = 0;
        for (const [tableId, localKey] of Object.entries(localKeyMap)) {
          if (tableId in data) {
            const value = data[tableId];
            if (value !== undefined) {
              localStorage.setItem(localKey, JSON.stringify(value));
              importedTablesCount++;
              addSyncLog(`   - นำเข้าตาราง [${tableId}] สำเร็จ`);
              
              if (isAutoSyncEnabled) {
                try {
                  await saveKeyToCloud(tableId, value);
                  addSyncLog(`   - ซิงค์ขึ้น Firebase [${tableId}] แล้ว`);
                } catch (err) {
                  addSyncLog(`   ⚠️ ซิงค์ขึ้นคลาวด์ [${tableId}] ขัดข้อง`);
                }
              }
            }
          }
        }

        setCloudSyncState('success');
        addSyncLog(`🎉 นำเข้าชุดข้อมูลสำเร็จสมบูรณ์ จำนวน ${importedTablesCount} ตาราง!`);
        alert(`🎉 นำเข้าไฟล์ฐานข้อมูลชุดสมบูรณ์สำเร็จ! (จัดสรรค่าตารางทั้งหมดเรียบร้อย)`);
        setReloadTrigger(prev => prev + 1);
        window.dispatchEvent(new Event('sapphire_storage_updated'));
      } catch (err) {
        setCloudSyncState('error');
        addSyncLog(`❌ นำเข้าไฟล์สารสนเทศล้มเหลว: รูปแบบ JSON ไม่ถูกต้อง หรือโครงสร้างเสียหาย`);
        alert('❌ ไฟล์ที่อัปโหลดไม่ใช่รูปแบบ JSON ที่ถูกต้อง หรือระบบเสียหาย');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDigitalTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Run database connection test and sync configurations
  const handleCheckConnection = async (silent = false) => {
    if (!silent) {
      setCloudConnectionState('checking');
      addSyncLog('กำลังเชื่อมและทดสอบระดับปิงกับเซิร์ฟเวอร์ฐานข้อมูล Google Cloud FireStore...');
    }
    try {
      const isConnected = await testConnection();
      if (isConnected) {
        setCloudConnectionState('connected');
        if (!silent) {
          addSyncLog('✅ เชื่อมต่อและสื่อสารข้อมูลกับ Firestore สำเร็จ (ออนไลน์ 100%)');
        }
        return true;
      } else {
        setCloudConnectionState('disconnected');
        if (!silent) {
          addSyncLog('❌ ไม่สามารถจับคู่สัญญาณคลาวด์ได้ (ตรวจสอบการตั้งค่า Firebase หรือเครือข่ายอินเทอร์เน็ต)');
        }
        return false;
      }
    } catch (e) {
      setCloudConnectionState('disconnected');
      if (!silent) {
        addSyncLog(`❌ เชื่อมต่อล้มเหลว: ${e instanceof Error ? e.message : String(e)}`);
      }
      return false;
    }
  };

  useEffect(() => {
    const runBootSync = async () => {
      // Ensure local storage has at least default values before anything else
      ensureLocalDefaultsInStorage();

      const isConnected = await handleCheckConnection(true);
      if (isConnected) {
        if (isAutoSyncEnabled) {
          addSyncLog('🔄 ตรวจพบระบบเริ่มทำงาน กำลังซิงโครไนซ์ข้อมูลล่าสุดจาก Firebase Cloud เพื่อระบบทุกอัพเดตเหมือนกันและฐานข้อมูลตรง...');
          try {
            setCloudSyncState('syncing');
            const dataResult = await downloadAllFromCloud();
            if (Object.keys(dataResult).length > 0) {
              setCloudSyncState('success');
              addSyncLog(`📥 ดึงและประสานข้อมูลรวมจาก Cloud สำเร็จ (${Object.keys(dataResult).length} ตารางข้อมูล)`);
              localStorage.setItem('sapphire_first_boot_sync', 'true');
              // Force local triggers and notify other components
              setReloadTrigger(prev => prev + 1);
              window.dispatchEvent(new Event('sapphire_storage_updated'));
            } else {
              setCloudSyncState('syncing');
              addSyncLog('⚠️ ตรวจพบฐานข้อมูลคลาวด์ยังว่างเปล่า กำลังดำเนินจัดอัปโหลดประถมฐานข้อมูลเริ่มต้นขึ้นสู่คลาวด์เพื่อความปลอดภัย...');
              await uploadAllToCloud();
              setCloudSyncState('success');
              addSyncLog('✅ ทำการอัปโหลดฐานข้อมูลความปลอดภัยรอบตั้งต้นสำเร็จเรียบร้อย!');
              localStorage.setItem('sapphire_first_boot_sync', 'true');
              setReloadTrigger(prev => prev + 1);
              window.dispatchEvent(new Event('sapphire_storage_updated'));
            }
          } catch (e) {
            setCloudSyncState('error');
            addSyncLog(`❌ การซิงโครไนซ์ข้อมูลมีอุปสรรค: ${e instanceof Error ? e.message : String(e)}`);
          }
        } else {
          const hasDoneFirstSync = localStorage.getItem('sapphire_first_boot_sync');
          if (!hasDoneFirstSync) {
            addSyncLog('ตรวจพบการเข้าสู่ระบบครั้งแรก กำลังซิงค์ข้อมูลล่าสุดจาก Cloud Storage...');
            try {
              setCloudSyncState('syncing');
              const dataResult = await downloadAllFromCloud();
              if (Object.keys(dataResult).length > 0) {
                setCloudSyncState('success');
                addSyncLog(`📥 ดึงและคัดลอกข้อมูลสำเร็จ (${Object.keys(dataResult).length} ตารางข้อมูลรวม)`);
                localStorage.setItem('sapphire_first_boot_sync', 'true');
                setReloadTrigger(prev => prev + 1);
                window.dispatchEvent(new Event('sapphire_storage_updated'));
              } else {
                setCloudSyncState('syncing');
                addSyncLog('⚠️ ตรวจพบฐานข้อมูลคลาวด์ยังว่างเปล่า กำลังดำเนินจัดอัปโหลดประถมฐานข้อมูลเริ่มต้นขึ้นสู่คลาวด์เพื่อความปลอดภัย...');
                await uploadAllToCloud();
                setCloudSyncState('success');
                addSyncLog('✅ ทำการอัปโหลดฐานข้อมูลความปลอดภัยรอบตั้งต้นสำเร็จเรียบร้อย!');
                localStorage.setItem('sapphire_first_boot_sync', 'true');
                setReloadTrigger(prev => prev + 1);
                window.dispatchEvent(new Event('sapphire_storage_updated'));
              }
            } catch (e) {
              setCloudSyncState('error');
              addSyncLog(`❌ การซิงโครไนซ์ข้อมูลมีอุปสรรค: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
      }
    };
    runBootSync();
  }, [isAutoSyncEnabled]);

  // Hook into local_storage_write to automatically save to Firebase when enabled
  useEffect(() => {
    const handleStorageWrite = async (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; value: string }>;
      const { key, value } = customEvent.detail;

      if (!isAutoSyncEnabled) return;
      if ((window as any).__is_downloading_from_cloud) return;

      const cloudKey = SYNC_MAPPINGS[key];
      if (cloudKey) {
        try {
          let parsedPayload: any;
          try {
            parsedPayload = JSON.parse(value);
          } catch {
            parsedPayload = value; // fallback for raw strings
          }
          await saveKeyToCloud(cloudKey, parsedPayload);
          addSyncLog(`⚡️ อัปเดตข้อมูลตรงกันเรียบร้อย: ซิงก์คีย์ [${cloudKey}] สู่ Firestore สำเร็จ`);
        } catch (error) {
          addSyncLog(`⚠️ ซิงก์แบคอัพด่วน [${cloudKey}] ขัดข้อง: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };

    window.addEventListener('local_storage_write', handleStorageWrite);
    return () => {
      window.removeEventListener('local_storage_write', handleStorageWrite);
    };
  }, [isAutoSyncEnabled]);

  useEffect(() => {
    const handleUpdate = () => {
      setPermissionsTrigger(prev => prev + 1);
    };
    const handleStorageUpdated = () => {
      setLastUpdated(new Date().toLocaleTimeString('th-TH'));
      
      const savedCompany = localStorage.getItem('hr_company_settings');
      const savedEmployees = localStorage.getItem('hr_employees');
      const savedLeaves = localStorage.getItem('hr_leave_requests');
      const savedCheques = localStorage.getItem('hr_cheques_data');
      const savedPayers = localStorage.getItem('hr_cheque_payers');
      const savedPayees = localStorage.getItem('hr_cheque_payees');

      if (savedCompany) {
        try { setCompanySettings(JSON.parse(savedCompany)); } catch (e) {}
      }
      if (savedEmployees) {
        try { setEmployees(JSON.parse(savedEmployees)); } catch (e) {}
      }
      if (savedLeaves) {
        try { setLeaveRequests(JSON.parse(savedLeaves)); } catch (e) {}
      }
      if (savedCheques) {
        try { setCheques(JSON.parse(savedCheques)); } catch (e) {}
      }
      if (savedPayers) {
        try { setPayers(JSON.parse(savedPayers)); } catch (e) {}
      }
      if (savedPayees) {
        try { setPayees(JSON.parse(savedPayees)); } catch (e) {}
      }
    };
    window.addEventListener('sapphire_permissions_updated', handleUpdate);
    window.addEventListener('sapphire_storage_updated', handleStorageUpdated);
    return () => {
      window.removeEventListener('sapphire_permissions_updated', handleUpdate);
      window.removeEventListener('sapphire_storage_updated', handleStorageUpdated);
    };
  }, []);

  // Sidebar config & custom color state
  const [sidebarColor, setSidebarColor] = useState<string>(() => {
    return localStorage.getItem('hr_sidebar_bg_uniqueness') || '#0f172a';
  });
  const [isColorSubmenuOpen, setIsColorSubmenuOpen] = useState(true);
  const [isSalesMenuOpen, setIsSalesMenuOpen] = useState(true);
  const [isChequeMenuOpen, setIsChequeMenuOpen] = useState(true);
  const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(true);
  const [isAccountingMenuOpen, setIsAccountingMenuOpen] = useState(true);

  const handleUpdateSidebarColor = (color: string) => {
    setSidebarColor(color);
    localStorage.setItem('hr_sidebar_bg_uniqueness', color);
  };

  // States
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('sapphire_hr_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem('sapphire_hr_session', JSON.stringify(newSession));
    
    // Redirect role to appropriate initial active tab
    if (newSession.role === 'sales') {
      setActiveTab('sales-daily');
    } else if (newSession.role === 'accountant') {
      setActiveTab('cheque-incoming');
    } else if (newSession.role === 'employee') {
      setActiveTab('employee-leave');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบ ใช่หรือไม่?')) {
      setSession(null);
      localStorage.removeItem('sapphire_hr_session');
      setActiveTab('dashboard');
    }
  };

  // Logged-in user's custom profile and permission states
  const [isMyProfileModalOpen, setIsMyProfileModalOpen] = useState(false);
  const [myDisplayName, setMyDisplayName] = useState('');
  const [myPassword, setMyPassword] = useState('');
  const [myRole, setMyRole] = useState<UserRole>('sales');
  const [myDepartment, setMyDepartment] = useState('');
  const [myAvatarUrl, setMyAvatarUrl] = useState('');
  const [myCustomAvatar, setMyCustomAvatar] = useState(false);
  const [myDesc, setMyDesc] = useState('');
  const [myUseCustomProps, setMyUseCustomProps] = useState(false);
  const [myCustomTabs, setMyCustomTabs] = useState<string[]>([]);

  const handleOpenMyProfileModal = () => {
    if (!session) return;
    
    // Find detailed TestUser record because session doesn't contain password
    const savedUsers = localStorage.getItem('sapphire_users');
    let foundUser: any = null;
    if (savedUsers) {
      try {
        const usersList = JSON.parse(savedUsers);
        foundUser = usersList.find((u: any) => u.username.toLowerCase() === session.username.toLowerCase());
      } catch (e) {}
    }
    
    // Safety fallback
    const activeUser = foundUser || {
      username: session.username,
      password: session.username === 'admin' ? 'admin123' : 
                 session.username === 'hr' ? 'hr123' :
                 session.username === 'accountant' ? 'acc123' : 'sales123',
      displayName: session.displayName,
      role: session.role,
      department: session.department || 'ฝ่ายบริหารงานทั่วไป',
      avatarUrl: session.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      desc: 'ผู้ร่วมขับเคลื่อนระบบ',
      allowedTabs: undefined
    };

    setMyDisplayName(activeUser.displayName);
    setMyPassword(activeUser.password);
    setMyRole(activeUser.role);
    setMyDepartment(activeUser.department);
    setMyAvatarUrl(activeUser.avatarUrl);
    setMyCustomAvatar(false);
    setMyDesc(activeUser.desc || '');
    
    if (activeUser.allowedTabs) {
      setMyUseCustomProps(true);
      setMyCustomTabs(activeUser.allowedTabs);
    } else {
      setMyUseCustomProps(false);
      // Retrieve role-preset permissions as edit base
      const savedPerms = localStorage.getItem('sapphire_role_permissions');
      let roleTabs: string[] = [];
      if (savedPerms) {
        try {
          roleTabs = JSON.parse(savedPerms)[activeUser.role] || [];
        } catch (e) {}
      }
      if (roleTabs.length === 0) {
        roleTabs = ['dashboard'];
      }
      setMyCustomTabs(roleTabs);
    }
    
    setIsMyProfileModalOpen(true);
    setIsProfileDropdownOpen(false);
  };

  const handleSaveMyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    if (!myDisplayName.trim() || !myPassword.trim()) {
      alert('❌ กรุณากรอกชื่อแสดงผลและรหัสผ่านบัญชีของคุณ');
      return;
    }

    // A. Update user database
    const savedUsers = localStorage.getItem('sapphire_users');
    let usersList: any[] = [];
    if (savedUsers) {
      try {
        usersList = JSON.parse(savedUsers);
      } catch (e) {}
    }
    
    const existIndex = usersList.findIndex((u: any) => u.username.toLowerCase() === session.username.toLowerCase());
    
    const updatedUserObj = {
      username: session.username,
      password: myPassword.trim(),
      displayName: myDisplayName.trim(),
      role: myRole, // Note: standard employees cannot bypass admin, but for simulation we save role updates
      department: myDepartment.trim(),
      avatarUrl: myAvatarUrl,
      desc: myDesc.trim(),
      allowedTabs: myUseCustomProps ? myCustomTabs : undefined
    };

    if (existIndex >= 0) {
      usersList[existIndex] = updatedUserObj;
    } else {
      usersList.push(updatedUserObj);
    }
    localStorage.setItem('sapphire_users', JSON.stringify(usersList));

    // B. Save Session Info
    const newSessionState: UserSession = {
      username: session.username,
      displayName: myDisplayName.trim(),
      role: myRole,
      department: myDepartment.trim(),
      avatarUrl: myAvatarUrl,
      loginTime: session.loginTime || '09:00'
    };
    setSession(newSessionState);
    localStorage.setItem('sapphire_hr_session', JSON.stringify(newSessionState));

    // C. Notify other panels and close
    window.dispatchEvent(new Event('sapphire_permissions_updated'));
    setIsMyProfileModalOpen(false);
    alert('🎉 ปรับปรุงข้อมูลสมาชิก & สิทธิ์การเข้าใช้งานส่วนบุคคลของคุณเรียบร้อยแล้ว!');
  };

  const syncWithCloudIfEnabled = async (cloudKey: string, docPayload: any) => {
    if (!isAutoSyncEnabled) return;
    try {
      setCloudSyncState('syncing');
      await saveKeyToCloud(cloudKey, docPayload);
      setCloudSyncState('success');
      addSyncLog(`💾 บันทึกและซิงก์ตาราง [${cloudKey}] สู่ Firestore สหพันธ์เรียบร้อยแล้ว`);
    } catch (e) {
      setCloudSyncState('error');
      addSyncLog(`⚠️ ซิงก์ตาราง [${cloudKey}] ขัดข้อง: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const [companySettings, setCompanySettings] = useState<CompanySettings>(INITIAL_COMPANY_SETTINGS);
  const [employees, setEmployees] = useState<EmployeeSalary[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [cheques, setCheques] = useState<Cheque[]>(() => {
    const saved = localStorage.getItem('hr_cheques_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CHEQUES;
      }
    }
    return DEFAULT_CHEQUES;
  });
  
  const [payers, setPayers] = useState<ChequePayer[]>(() => {
    const saved = localStorage.getItem('hr_cheque_payers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PAYERS;
      }
    }
    return INITIAL_PAYERS;
  });

  const [payees, setPayees] = useState<ChequePayee[]>(() => {
    const saved = localStorage.getItem('hr_cheque_payees');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PAYEES;
      }
    }
    return INITIAL_PAYEES;
  });

  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('hr_cheques_data', JSON.stringify(cheques));
    syncWithCloudIfEnabled('cheques_data', cheques);
  }, [cheques]);

  useEffect(() => {
    localStorage.setItem('hr_cheque_payers', JSON.stringify(payers));
    syncWithCloudIfEnabled('cheque_payers', payers);
  }, [payers]);

  useEffect(() => {
    localStorage.setItem('hr_cheque_payees', JSON.stringify(payees));
    syncWithCloudIfEnabled('cheque_payees', payees);
  }, [payees]);

  // 1. Initial State Load from LocalStorage (or Mock Defaults)
  useEffect(() => {
    const savedCompany = localStorage.getItem('hr_company_settings');
    const savedEmployees = localStorage.getItem('hr_employees');
    const savedLeaves = localStorage.getItem('hr_leave_requests');
    const savedCheques = localStorage.getItem('hr_cheques_data');
    const savedPayers = localStorage.getItem('hr_cheque_payers');
    const savedPayees = localStorage.getItem('hr_cheque_payees');

    if (savedCompany) {
      try {
        setCompanySettings(JSON.parse(savedCompany));
      } catch (e) {
        setCompanySettings(INITIAL_COMPANY_SETTINGS);
      }
    } else {
      setCompanySettings(INITIAL_COMPANY_SETTINGS);
    }

    if (savedEmployees) {
      try {
        setEmployees(JSON.parse(savedEmployees));
      } catch (e) {
        setEmployees(INITIAL_EMPLOYEES);
      }
    } else {
      setEmployees(INITIAL_EMPLOYEES);
    }

    if (savedLeaves) {
      try {
        setLeaveRequests(JSON.parse(savedLeaves));
      } catch (e) {
        setLeaveRequests(INITIAL_LEAVE_REQUESTS);
      }
    } else {
      setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    }

    if (savedCheques) {
      try {
        setCheques(JSON.parse(savedCheques));
      } catch (e) {}
    }

    if (savedPayers) {
      try {
        setPayers(JSON.parse(savedPayers));
      } catch (e) {
        setPayers(INITIAL_PAYERS);
      }
    } else {
      setPayers(INITIAL_PAYERS);
    }

    if (savedPayees) {
      try {
        setPayees(JSON.parse(savedPayees));
      } catch (e) {
        setPayees(INITIAL_PAYEES);
      }
    } else {
      setPayees(INITIAL_PAYEES);
    }

    setLastUpdated(new Date().toLocaleTimeString('th-TH'));
    setIsInitialLoadDone(true);
  }, [reloadTrigger]);

  // Auto-prune leave requests if the associated employee does not exist in our employees list (to prevent orphaned leaves/history)
  useEffect(() => {
    if (isInitialLoadDone && leaveRequests.length > 0) {
      const hasOrphaned = leaveRequests.some(
        req => !employees.some(emp => emp.id === req.employeeId)
      );
      if (hasOrphaned) {
        const cleaned = leaveRequests.filter(
          req => employees.some(emp => emp.id === req.employeeId)
        );
        setLeaveRequests(cleaned);
        localStorage.setItem('hr_leave_requests', JSON.stringify(cleaned));
        syncWithCloudIfEnabled('leave_requests', cleaned);
        triggerUpdateNotification();
        addSyncLog('🧹 ระบบรักษาความสอดคล้อง: ทำความสะอาดประวัติการลาทั้งหมดของพนักงานที่ไม่มีชื่ออยู่ในระบบเรียบร้อยแล้ว เพื่อความถูกต้องของคลาวด์');
      }
    }
  }, [isInitialLoadDone, employees, leaveRequests]);

  // 2. State synchronization with LocalStorage
  const saveCompanySettings = (updated: CompanySettings) => {
    setCompanySettings(updated);
    localStorage.setItem('hr_company_settings', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('company_settings', updated);
  };

  const handleAddEmployee = (newEmp: EmployeeSalary) => {
    const updated = [...employees, newEmp];
    setEmployees(updated);
    localStorage.setItem('hr_employees', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('employees', updated);
  };

  const handleUpdateEmployee = (updatedEmp: EmployeeSalary) => {
    const updated = employees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp);
    setEmployees(updated);
    localStorage.setItem('hr_employees', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('employees', updated);
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter(emp => emp.id !== id);
    setEmployees(updated);
    localStorage.setItem('hr_employees', JSON.stringify(updated));
    
    // Also cleanup associated leave requests for data consistency (especially pending leave requests)
    const updatedLeaves = leaveRequests.filter(req => req.employeeId !== id);
    setLeaveRequests(updatedLeaves);
    localStorage.setItem('hr_leave_requests', JSON.stringify(updatedLeaves));

    // Also cleanup associated daily attendance logs for data consistency
    const savedAttendance = localStorage.getItem('hr_daily_attendance');
    if (savedAttendance) {
      try {
        const attendanceList = JSON.parse(savedAttendance);
        if (Array.isArray(attendanceList)) {
          const updatedAttendance = attendanceList.filter((item: any) => item.employeeId !== id);
          localStorage.setItem('hr_daily_attendance', JSON.stringify(updatedAttendance));
          syncWithCloudIfEnabled('daily_attendance', updatedAttendance);
        }
      } catch (e) {
        console.error('Error cleaning daily attendance during employee delete', e);
      }
    }
    
    triggerUpdateNotification();
    syncWithCloudIfEnabled('employees', updated);
    syncWithCloudIfEnabled('leave_requests', updatedLeaves);
  };

  const handleAddLeave = (newReq: LeaveRequest) => {
    const updated = [newReq, ...leaveRequests];
    setLeaveRequests(updated);
    localStorage.setItem('hr_leave_requests', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('leave_requests', updated);
  };

  const handleUpdateLeave = (updatedReq: LeaveRequest) => {
    const updated = leaveRequests.map(req => req.id === updatedReq.id ? updatedReq : req);
    setLeaveRequests(updated);
    localStorage.setItem('hr_leave_requests', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('leave_requests', updated);
  };

  const handleDeleteLeave = (id: string) => {
    const updated = leaveRequests.filter(req => req.id !== id);
    setLeaveRequests(updated);
    localStorage.setItem('hr_leave_requests', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('leave_requests', updated);
  };

  const handleResetLeaveStatus = (id: string) => {
    const updated = leaveRequests.map(req => {
      if (req.id === id) {
        // Remove any previous "[หมายเหตุผู้อนุมัติ: ...]" text from the reason
        const cleanedReason = req.reason.replace(/\s*\[หมายเหตุผู้อนุมัติ:[^\]]*\]/g, '');
        return { ...req, status: 'pending' as const, reason: cleanedReason };
      }
      return req;
    });
    setLeaveRequests(updated);
    localStorage.setItem('hr_leave_requests', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('leave_requests', updated);
  };

  const handleApproveLeave = (id: string, notes?: string) => {
    const updated = leaveRequests.map(req => {
      if (req.id === id) {
        return { 
          ...req, 
          status: 'approved' as const,
          reason: notes ? (req.reason.includes('[หมายเหตุผู้อนุมัติ:') ? req.reason : `${req.reason}${notes}`) : req.reason
        };
      }
      return req;
    });
    setLeaveRequests(updated);
    localStorage.setItem('hr_leave_requests', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('leave_requests', updated);
  };

  const handleRejectLeave = (id: string, notes?: string) => {
    const updated = leaveRequests.map(req => {
      if (req.id === id) {
        return { 
          ...req, 
          status: 'rejected' as const,
          reason: notes ? (req.reason.includes('[หมายเหตุผู้อนุมัติ:') ? req.reason : `${req.reason}${notes}`) : req.reason
        };
      }
      return req;
    });
    setLeaveRequests(updated);
    localStorage.setItem('hr_leave_requests', JSON.stringify(updated));
    triggerUpdateNotification();
    syncWithCloudIfEnabled('leave_requests', updated);
  };

  const triggerUpdateNotification = () => {
    setLastUpdated(new Date().toLocaleTimeString('th-TH'));
    window.dispatchEvent(new Event('sapphire_storage_updated'));
  };

  // 3. Clear data and Restore defaults
  const handleResetSystemData = () => {
    if (confirm("คำเตือน: คุณต้องการล้างความจำและฟื้นฟูข้อมูลพนักงานชุดแบบทดสอบเริ่มต้นใช่หรือไม่?")) {
      localStorage.removeItem('hr_company_settings');
      localStorage.removeItem('hr_employees');
      localStorage.removeItem('hr_leave_requests');
      
      setCompanySettings(INITIAL_COMPANY_SETTINGS);
      setEmployees(INITIAL_EMPLOYEES);
      setLeaveRequests(INITIAL_LEAVE_REQUESTS);
      triggerUpdateNotification();
      alert("จัดฟื้นฟูฐานข้อมูลเริ่มต้นบลูเทคสำเร็จเรียบร้อย!");
    }
  };

  const isTabAllowed = (tab: string) => {
    if (!session) return false;
    
    // Map report and cheque tab permissions
    let targetTab = tab;
    if (tab === 'report-sales-monthly') targetTab = 'sales-monthly';
    if (tab === 'report-sales-yearly') targetTab = 'sales-yearly';
    if (tab === 'cheque-payers') targetTab = 'cheque-incoming';
    if (tab === 'cheque-payees') targetTab = 'cheque-outgoing';
    if (tab === 'accounting-tax' || tab === 'accounting-tax-detail' || tab === 'accounting-tax-transfer') targetTab = 'employees';
    if (tab === 'sales-cashlog') targetTab = 'sales-daily';
    
    // Employee routing: ONLY allowed to see 'employee-leave'
    if (session.role === 'employee') {
      return targetTab === 'employee-leave';
    }
    
    // Managers can view employee leave view & leave approval page
    if (targetTab === 'employee-leave' || targetTab === 'leave-approval') {
      return session.role === 'admin' || session.role === 'hr';
    }
    
    // Always allow basic dashboard & users tab so everyone can manage/view accounts
    if (targetTab === 'dashboard' || targetTab === 'users' || targetTab === 'system-installer' || targetTab === 'gdrive') return true;
    
    // Allow sales-billing for admin, sales, accountant
    if (targetTab === 'sales-billing') {
      return session.role === 'admin' || session.role === 'sales' || session.role === 'accountant';
    }

    // Allow suppliers for admin, sales, accountant
    if (targetTab === 'suppliers') {
      return session.role === 'admin' || session.role === 'sales' || session.role === 'accountant';
    }
    
    // Access permission matrix
    const saved = localStorage.getItem('sapphire_role_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const rolesList: string[] = parsed[session.role] || [];
        // Support either th or en identifiers compatibility
        const legacyTranslateMap: Record<string, string[]> = {
          'admin': ['settings', 'registry', 'employees', 'leave', 'sales-daily', 'sales-monthly', 'sales-yearly', 'cheque-incoming', 'cheque-outgoing', 'users'],
          'hr': ['registry', 'employees', 'leave'],
          'accountant': ['employees', 'cheque-incoming', 'cheque-outgoing', 'sales-daily', 'sales-monthly', 'sales-yearly'],
          'sales': ['sales-daily', 'sales-monthly', 'sales-yearly']
        };
        
        // Return matching state
        return rolesList.includes(targetTab);
      } catch (e) {
        // Fallback below
      }
    }

    const role = session.role;
    if (role === 'admin') return true;
    if (role === 'hr') {
      return ['registry', 'employees', 'leave'].includes(targetTab);
    }
    if (role === 'accountant') {
      return ['employees', 'cheque-incoming', 'cheque-outgoing', 'sales-daily', 'sales-monthly', 'sales-yearly'].includes(targetTab);
    }
    if (role === 'sales') {
      return ['sales-daily', 'sales-monthly', 'sales-yearly'].includes(targetTab);
    }
    return false;
  };

  if (!session) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row text-slate-800">
      
      {/* 1. SIDEBAR Navigation - Desktop screen preview */}
      <aside 
        className="w-64 border-r border-slate-800 hidden md:flex flex-col shrink-0 transition-all duration-300"
        style={{ backgroundColor: sidebarColor }}
      >
        <div className="p-6 border-b border-slate-800 flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/10">
            <Briefcase className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-white text-base font-extrabold tracking-wide">Sapphire HR</h1>
            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider block">
              {session.role === 'admin' ? 'Super Admin' : `${session.role.toUpperCase()} Account`}
            </span>
          </div>
        </div>

        {/* Desktop Sidebar Buttons */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {session.role !== 'employee' && (
            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              แผงควบคุม Dashboard
            </button>
          )}

          {isTabAllowed('employee-leave') && (
            <button
              id="tab-employee-leave-btn"
              onClick={() => setActiveTab('employee-leave')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'employee-leave'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck className="w-4.5 h-4.5 text-indigo-400" />
              <span>ยื่นใบคำร้องขอลาหยุด</span>
            </button>
          )}

          {isTabAllowed('settings') && (
            <button
              id="tab-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-4.5 h-4.5" />
              1. ตั้งค่าบริษัท/แผนก
            </button>
          )}

          {isTabAllowed('registry') && (
            <button
              id="tab-registry-btn"
              onClick={() => setActiveTab('registry')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'registry'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              2. ทะเบียนพนักงาน
            </button>
          )}

          {isTabAllowed('employees') && (
            <button
              id="tab-employees-btn"
              onClick={() => setActiveTab('employees')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CreditCard className="w-4.5 h-4.5" />
              3. จ่ายเงินเดือนและสลิป (Payroll)
            </button>
          )}

          {isTabAllowed('leave') && (
            <button
              id="tab-leave-btn"
              onClick={() => setActiveTab('leave')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'leave'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4.5 h-4.5" />
              4. การลา / ขาดงาน
            </button>
          )}

          {isTabAllowed('leave-approval') && (
            <button
              id="tab-leave-approval-btn"
              onClick={() => setActiveTab('leave-approval')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'leave-approval'
                  ? 'bg-indigo-650 text-white shadow-md shadow-indigo-550/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck className="w-4.5 h-4.5 text-indigo-400" />
              อนุมัติการลาพนักงาน
            </button>
          )}

          {/* Foldable Sales 5 Navigation Tab */}
          {isTabAllowed('sales-daily') && (
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                onClick={() => setIsSalesMenuOpen(!isSalesMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                  <span>5. ยอดขาย (Sales)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold pr-1">
                  {isSalesMenuOpen ? '▼' : '►'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isSalesMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-6 space-y-1 mt-1 overflow-hidden"
                  >
                    <button
                      onClick={() => setActiveTab('sales-daily')}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'sales-daily' 
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'sales-daily' ? 'bg-white' : 'bg-emerald-500'}`} />
                      ยอดวัน (Daily Sales)
                    </button>
                    <button
                      onClick={() => setActiveTab('sales-monthly')}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'sales-monthly' 
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'sales-monthly' ? 'bg-white' : 'bg-blue-500'}`} />
                      ยอดขายรวมเดือน (Monthly)
                    </button>
                    <button
                      onClick={() => setActiveTab('sales-yearly')}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'sales-yearly' 
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'sales-yearly' ? 'bg-white' : 'bg-purple-500'}`} />
                      ยอดขายปี (Yearly)
                    </button>
                    <button
                      onClick={() => setActiveTab('sales-cashlog')}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'sales-cashlog' 
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'sales-cashlog' ? 'bg-white' : 'bg-emerald-500'}`} />
                      บันทึกยอดเงินสด (Cash Log Grid)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Foldable Cheques 6 Navigation Tab */}
          {isTabAllowed('cheque-incoming') && (
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                onClick={() => setIsChequeMenuOpen(!isChequeMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <Banknote className="w-4.5 h-4.5 text-indigo-400" />
                  <span>6. ระบบรับเช็ค (Cheque)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold pr-1">
                  {isChequeMenuOpen ? '▼' : '►'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isChequeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-6 space-y-1 mt-1 overflow-hidden"
                >
                  <button
                    onClick={() => setActiveTab('cheque-incoming')}
                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'cheque-incoming' 
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'cheque-incoming' ? 'bg-white' : 'bg-emerald-500'}`} />
                    1. เช็คขารับ (Incoming)
                  </button>
                  <button
                    onClick={() => setActiveTab('cheque-payers')}
                    className={`w-full text-left flex items-center gap-2 pl-7 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'cheque-payers' 
                        ? 'text-blue-400 font-bold bg-white/5' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    └─ เมนูย่อย: เพิ่มข้อมูลลูกค้า
                  </button>
                  <button
                    onClick={() => setActiveTab('cheque-outgoing')}
                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'cheque-outgoing' 
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'cheque-outgoing' ? 'bg-white' : 'bg-rose-500'}`} />
                    2. เช็คขาจ่าย (Outgoing)
                  </button>
                  <button
                    onClick={() => setActiveTab('cheque-payees')}
                    className={`w-full text-left flex items-center gap-2 pl-7 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'cheque-payees' 
                        ? 'text-blue-400 font-bold bg-white/5' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    └─ เมนูย่อย: เพิ่มข้อมูลผู้รับเงิน/คู่ค้า
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}

          {/* Item 6.1: Delivery & Suppliers Directory */}
          {isTabAllowed('suppliers') && (
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                id="tab-suppliers-btn"
                onClick={() => setActiveTab('suppliers')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'suppliers'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Truck className="w-4.5 h-4.5 text-blue-400" />
                <span>6.1 ระบบจัดการคู่ค้าส่งของ</span>
              </button>
            </div>
          )}

          {/* Foldable Accounting Navigation Tab */}
          {isTabAllowed('accounting-tax') && (
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                onClick={() => setIsAccountingMenuOpen(!isAccountingMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-4.5 h-4.5 text-emerald-400" />
                  <span>ระบบบัญชี (Accounting)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold pr-1">
                  {isAccountingMenuOpen ? '▼' : '►'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isAccountingMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-6 space-y-1 mt-1 overflow-hidden"
                  >
                    <button
                      onClick={() => setActiveTab('accounting-tax')}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'accounting-tax' 
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'accounting-tax' ? 'bg-white' : 'bg-emerald-500'}`} />
                      1. ยอดจ่ายรายเดือนที่ส่งสรรพกรแล้ว
                    </button>
                    <button
                      onClick={() => setActiveTab('accounting-tax-detail')}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'accounting-tax-detail' 
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'accounting-tax-detail' ? 'bg-white' : 'bg-blue-500'}`} />
                      1.1 รายการจ่ายส่งสรรพกรแต่ละเดือน
                    </button>
                    <button
                      onClick={() => setActiveTab('accounting-tax-transfer')}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'accounting-tax-transfer' 
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'accounting-tax-transfer' ? 'bg-white' : 'bg-indigo-500'}`} />
                      1.2 โอนเงินให้สรรพกรแต่ละเดือน
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Item 7: Users & Roles Control Panel */}
          {isTabAllowed('users') && (
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                id="tab-users-btn"
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 shrink-0'
                }`}
              >
                <UserCog className="w-4.5 h-4.5 text-indigo-400" />
                7. ทะเบียนบริหารจัดการบัญชีผู้ใช้งาน
              </button>
            </div>
          )}

          {/* Item 9: Web Installer Simulator */}
          {isTabAllowed('system-installer') && (
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                id="tab-installer-btn"
                onClick={() => setActiveTab('system-installer')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'system-installer'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 shrink-0'
                }`}
              >
                <Server className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                <span>9. โปรแกรมจำลองการติดตั้งระบบ</span>
              </button>
            </div>
          )}

          {/* Item 10: Google Drive Storage */}
          {isTabAllowed('gdrive') && (
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                id="tab-gdrive-btn"
                onClick={() => setActiveTab('gdrive')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'gdrive'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 shrink-0'
                }`}
              >
                <HardDrive className="w-4.5 h-4.5 text-cyan-400" />
                <span>10. ระบบคลังเอกสาร Google Drive</span>
              </button>
            </div>
          )}

          {/* Foldable Reports 8 Navigation Tab */}
          {(isTabAllowed('report-sales-monthly') || isTabAllowed('report-sales-yearly')) && (
            <div className="border-t border-white/5 pt-2 mt-2 mb-1">
              <button
                onClick={() => setIsReportsMenuOpen(!isReportsMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4.5 h-4.5 text-blue-400" />
                  <span>8. รวมรายงานทั้งหมด</span>
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold pr-1">
                  {isReportsMenuOpen ? '▼' : '►'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isReportsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-6 space-y-1 mt-1 overflow-hidden"
                  >
                    {isTabAllowed('report-sales-monthly') && (
                      <button
                        onClick={() => setActiveTab('report-sales-monthly')}
                        className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'report-sales-monthly' 
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'report-sales-monthly' ? 'bg-white' : 'bg-blue-500'}`} />
                        1. ยอดขายรายเดือน
                      </button>
                    )}
                    {isTabAllowed('report-sales-yearly') && (
                      <button
                        onClick={() => setActiveTab('report-sales-yearly')}
                        className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'report-sales-yearly' 
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'report-sales-yearly' ? 'bg-white' : 'bg-purple-500'}`} />
                        2. ยอดขายรายปี
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Menu 9: Sales Billing Tab */}
          {isTabAllowed('sales-billing') && (
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                id="tab-sales-billing-btn"
                onClick={() => setActiveTab('sales-billing')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'sales-billing'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-4.5 h-4.5 text-blue-400" />
                <span>9. เซลมาใบวางบิล</span>
              </button>
            </div>
          )}
        </nav>

        {/* Settings menu bar color settings - positioned at the bottom of the menu bar */}
        <div className="px-4 py-4 border-t border-white/10 bg-black/20">
          <button
            onClick={() => setIsColorSubmenuOpen(!isColorSubmenuOpen)}
            className="w-full flex items-center justify-between text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider py-1.5 px-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>การตั้งค่า (Settings)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-black">
              {isColorSubmenuOpen ? '▼' : '▲'}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {isColorSubmenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 space-y-2.5 pl-2 pr-1 overflow-hidden"
              >
                <div className="text-[10px] text-slate-300 flex items-center gap-1 font-bold">
                  <Paintbrush className="w-3.5 h-3.5 text-blue-400" />
                  <span>เมนูย่อย เปลี่ยนสี:</span>
                </div>

                {/* Palette presets */}
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {[
                    { color: '#0f172a', title: 'Classic' },
                    { color: '#1e3b8b', title: 'Blue' },
                    { color: '#093a2f', title: 'Teal' },
                    { color: '#131e29', title: 'Dark' },
                    { color: '#311042', title: 'Violet' },
                    { color: '#450a0a', title: 'Wine' },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => handleUpdateSidebarColor(preset.color)}
                      className="w-5.5 h-5.5 rounded-full border cursor-pointer hover:scale-110 active:scale-95 transition-all text-[0px]"
                      style={{
                        backgroundColor: preset.color,
                        borderColor: sidebarColor === preset.color ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                        borderWidth: sidebarColor === preset.color ? '2.5px' : '1px'
                      }}
                      title={preset.title}
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>

                {/* Custom code color input */}
                <div className="flex items-center gap-1.5 mt-1.5 pt-1">
                  <input
                    type="color"
                    id="colpicker-sidebar"
                    value={sidebarColor.startsWith('#') && sidebarColor.length === 7 ? sidebarColor : '#0f172a'}
                    onChange={(e) => handleUpdateSidebarColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 shrink-0"
                    title="เลือกสีเมนูด้วยหน้าต่างหยอดสีอิสระ"
                  />
                  <div className="relative flex-1">
                    <span className="absolute left-1.5 top-1.5 text-[8px] text-slate-400 font-extrabold font-mono pointer-events-none">#</span>
                    <input
                      type="text"
                      maxLength={7}
                      value={sidebarColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateSidebarColor(val.startsWith('#') ? val : `#${val}`);
                      }}
                      placeholder="#0f172a"
                      className="w-full bg-black/40 border border-white/15 rounded-lg pl-3.5 pr-1 py-1 text-[10px] text-white font-mono font-bold focus:outline-none focus:border-blue-500 uppercase"
                      title="พิมพ์หรือใส่โค้ดสี HEX เอง"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs px-2">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>อัปเดตล่าสุด: {lastUpdated}</span>
          </div>
          <button 
            onClick={handleResetSystemData}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-rose-450 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all border border-rose-500/15 cursor-pointer"
            title="รีเซ็ตโครงสร้างฐานข้อมูลทดลองทั้งหมด"
          >
            <RefreshCw className="w-3.5 h-3.5" /> รีเซ็ตข้อมูลจำลอง
          </button>
        </div>
      </aside>

      {/* Main Panel Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

      {/* Mobile Header view */}
      <header 
        className="text-white p-4 flex items-center justify-between md:hidden transition-all duration-300"
        style={{ backgroundColor: sidebarColor }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-sm tracking-wide">Sapphire HR</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile digital clock */}
          <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-xl border border-white/10 text-white font-mono text-[11px] font-black tabular-nums shrink-0 select-none">
            <Clock className="w-3 h-3 text-emerald-350 animate-pulse shrink-0" />
            <span>
              {digitalTime.getHours().toString().padStart(2, '0')}:
              {digitalTime.getMinutes().toString().padStart(2, '0')}:
              {digitalTime.getSeconds().toString().padStart(2, '0')}
            </span>
          </div>

          {/* Mobile database cloud sync trigger button */}
          <button
            onClick={() => setIsCloudSyncModalOpen(true)}
            className={`p-1.5 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
              cloudConnectionState === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-350 hover:bg-emerald-500/25'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300 animate-pulse'
            }`}
            title="แผงเชื่อมต่อฐานข้อมูลระบบคลาวด์"
          >
            <Cloud className={`w-3.5 h-3.5 ${cloudSyncState === 'syncing' ? 'animate-bounce text-blue-400' : ''}`} />
          </button>

          <ChequeNotifications 
            cheques={cheques} 
            leaveRequests={leaveRequests} 
            employees={employees}
            currentUserRole={session?.role} 
            onNavigate={(tab) => {
              setActiveTab(tab);
              setIsMobileMenuOpen(false);
            }} 
            onUpdateLeave={handleUpdateLeave}
          />
          
          <img 
            src={session.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
            alt={session.displayName}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover border border-white/20 select-none cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="เปิดเมนูผู้ใช้งาน"
          />

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-slate-350 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>
 
      {/* Mobile navigation side drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-800 md:hidden overflow-hidden py-3 px-4 space-y-1.5 transition-all duration-300"
            style={{ backgroundColor: sidebarColor }}
          >
            {session.role !== 'employee' && (
              <button
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'dashboard' ? 'bg-blue-600' : 'bg-white/5'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> แผงควบคุม Dashboard
              </button>
            )}
            {isTabAllowed('employee-leave') && (
              <button
                onClick={() => { setActiveTab('employee-leave'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'employee-leave' ? 'bg-blue-600' : 'bg-white/5'}`}
              >
                <UserCheck className="w-4 h-4 text-indigo-450" /> ยื่นใบคำร้องขอลาหยุด
              </button>
            )}
            {isTabAllowed('settings') && (
              <button
                onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'settings' ? 'bg-blue-600' : 'bg-white/5'}`}
              >
                <Building2 className="w-4 h-4" /> 1. ตั้งค่าบริษัท/แผนก
              </button>
            )}
            {isTabAllowed('registry') && (
              <button
                onClick={() => { setActiveTab('registry'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'registry' ? 'bg-blue-600' : 'bg-white/5'}`}
              >
                <Users className="w-4 h-4" /> 2. ทะเบียนพนักงาน
              </button>
            )}
            {isTabAllowed('employees') && (
              <button
                onClick={() => { setActiveTab('employees'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'employees' ? 'bg-blue-600' : 'bg-white/5'}`}
              >
                <CreditCard className="w-4 h-4" /> 3. จ่ายเงินเดือนและสลิป (Payroll)
              </button>
            )}
            {isTabAllowed('leave') && (
              <button
                onClick={() => { setActiveTab('leave'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'leave' ? 'bg-blue-600' : 'bg-white/5'}`}
              >
                <Calendar className="w-4 h-4" /> 4. การลา / ขาดงาน
              </button>
            )}
            {isTabAllowed('leave-approval') && (
              <button
                onClick={() => { setActiveTab('leave-approval'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'leave-approval' ? 'bg-indigo-600' : 'bg-white/5'}`}
              >
                <UserCheck className="w-4 h-4 text-indigo-400" /> อนุมัติการลาพนักงาน
              </button>
            )}

            {/* Mobile collapsible Sales menu */}
            {isTabAllowed('sales-daily') && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => setIsSalesMenuOpen(!isSalesMenuOpen)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold text-white bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>5. ยอดขาย (Sales)</span>
                  </div>
                  <span className="text-[10px] text-slate-355 text-slate-350 pr-1">{isSalesMenuOpen ? '▼' : '►'}</span>
                </button>
                
                <AnimatePresence initial={false}>
                  {isSalesMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-5 space-y-1 mt-1 overflow-hidden"
                    >
                      <button
                        onClick={() => { setActiveTab('sales-daily'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'sales-daily' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ยอดวัน (Daily Sales)
                      </button>
                      <button
                        onClick={() => { setActiveTab('sales-monthly'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'sales-monthly' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        ยอดขายรวมเดือน (Monthly)
                      </button>
                      <button
                        onClick={() => { setActiveTab('sales-yearly'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'sales-yearly' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        ยอดขายปี (Yearly)
                      </button>
                      <button
                        onClick={() => { setActiveTab('sales-cashlog'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'sales-cashlog' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        บันทึกยอดเงินสด (Cash Log Grid)
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile collapsible Cheque menu */}
            {isTabAllowed('cheque-incoming') && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => setIsChequeMenuOpen(!isChequeMenuOpen)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold text-white bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="w-4 h-4 text-indigo-400" />
                    <span>6. ระบบรับเช็ค (Cheque)</span>
                  </div>
                  <span className="text-[10px] text-slate-355 text-slate-300 pr-1">{isChequeMenuOpen ? '▼' : '►'}</span>
                </button>
                
                <AnimatePresence initial={false}>
                  {isChequeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-5 space-y-1 mt-1 overflow-hidden"
                    >
                      <button
                        onClick={() => { setActiveTab('cheque-incoming'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'cheque-incoming' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        1. เช็คขารับ (Incoming)
                      </button>
                      <button
                        onClick={() => { setActiveTab('cheque-payers'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 pl-6 py-1 rounded-lg text-xs font-semibold text-slate-300 ${activeTab === 'cheque-payers' ? 'text-blue-400 bg-white/5' : 'hover:text-white'}`}
                      >
                        └─ เมนูย่อย: เพิ่มข้อมูลลูกค้า
                      </button>
                      <button
                        onClick={() => { setActiveTab('cheque-outgoing'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'cheque-outgoing' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        2. เช็คขาจ่าย (Outgoing)
                      </button>
                      <button
                        onClick={() => { setActiveTab('cheque-payees'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 pl-6 py-1 rounded-lg text-xs font-semibold text-slate-300 ${activeTab === 'cheque-payees' ? 'text-blue-400 bg-white/5' : 'hover:text-white'}`}
                      >
                        └─ เมนูย่อย: เพิ่มข้อมูลผู้รับเงิน/คู่ค้า
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile collapsible Accounting menu */}
            {isTabAllowed('accounting-tax') && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => setIsAccountingMenuOpen(!isAccountingMenuOpen)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold text-white bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>ระบบบัญชี (Accounting)</span>
                  </div>
                  <span className="text-[10px] text-slate-355 text-slate-300 pr-1">{isAccountingMenuOpen ? '▼' : '►'}</span>
                </button>
                
                <AnimatePresence initial={false}>
                  {isAccountingMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-5 space-y-1 mt-1 overflow-hidden"
                    >
                      <button
                        onClick={() => { setActiveTab('accounting-tax'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'accounting-tax' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        1. ยอดจ่ายรายเดือนที่ส่งสรรพกรแล้ว
                      </button>
                      <button
                        onClick={() => { setActiveTab('accounting-tax-detail'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'accounting-tax-detail' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        1.1 รายการจ่ายส่งสรรพกรแต่ละเดือน
                      </button>
                      <button
                        onClick={() => { setActiveTab('accounting-tax-transfer'); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'accounting-tax-transfer' ? 'bg-blue-600' : 'bg-white/5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        1.2 โอนเงินให้สรรพกรแต่ละเดือน
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Suppliers & Delivery log tab */}
            {isTabAllowed('suppliers') && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => { setActiveTab('suppliers'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'suppliers' ? 'bg-blue-600' : 'bg-white/5'}`}
                >
                  <Truck className="w-4 h-4 text-blue-400" /> 6.1 ระบบจัดการคู่ค้าส่งของ
                </button>
              </div>
            )}

            {/* Mobile Users & Roles tab */}
            {isTabAllowed('users') && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'users' ? 'bg-blue-600' : 'bg-white/5'}`}
                >
                  <UserCog className="w-4 h-4 text-indigo-400" /> 7. ทะเบียนบริหารจัดการบัญชีผู้ใช้งาน
                </button>
              </div>
            )}

            {/* Mobile Web Installer Simulator tab */}
            {isTabAllowed('system-installer') && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => { setActiveTab('system-installer'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'system-installer' ? 'bg-blue-600' : 'bg-white/5'}`}
                >
                  <Server className="w-4 h-4 text-blue-400" /> 9. โปรแกรมจำลองการติดตั้งระบบ
                </button>
              </div>
            )}

            {/* Mobile Google Drive tab */}
            {isTabAllowed('gdrive') && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => { setActiveTab('gdrive'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'gdrive' ? 'bg-blue-600' : 'bg-white/5'}`}
                >
                  <HardDrive className="w-4 h-4 text-cyan-400" /> 10. ระบบคลังเอกสาร Google Drive
                </button>
              </div>
            )}

            {/* Mobile collapsible Reports menu */}
            {(isTabAllowed('report-sales-monthly') || isTabAllowed('report-sales-yearly')) && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => setIsReportsMenuOpen(!isReportsMenuOpen)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold text-white bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4.5 h-4.5 text-blue-400" />
                    <span>8. รวมรายงานทั้งหมด</span>
                  </div>
                  <span className="text-[10px] text-slate-350 pr-1">{isReportsMenuOpen ? '▼' : '►'}</span>
                </button>
                
                <AnimatePresence initial={false}>
                  {isReportsMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-5 space-y-1 mt-1 overflow-hidden"
                    >
                      {isTabAllowed('report-sales-monthly') && (
                        <button
                          onClick={() => { setActiveTab('report-sales-monthly'); setIsMobileMenuOpen(false); }}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'report-sales-monthly' ? 'bg-blue-600' : 'bg-white/5'}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          1. ยอดขายรายเดือน
                        </button>
                      )}
                      {isTabAllowed('report-sales-yearly') && (
                        <button
                          onClick={() => { setActiveTab('report-sales-yearly'); setIsMobileMenuOpen(false); }}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${activeTab === 'report-sales-yearly' ? 'bg-blue-600' : 'bg-white/5'}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          2. ยอดขายรายปี
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Sales Billing Tab */}
            {isTabAllowed('sales-billing') && (
              <div className="pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => { setActiveTab('sales-billing'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${activeTab === 'sales-billing' ? 'bg-blue-600' : 'bg-white/5'}`}
                >
                  <FileText className="w-4 h-4 text-blue-400" /> 9. เซลมาใบวางบิล
                </button>
              </div>
            )}
 
            {/* Mobile Color Settings submenu at the bottom */}
            <div className="pt-3 border-t border-white/10 mt-2 space-y-2">
              <span className="text-[10px] text-slate-350 font-bold block uppercase tracking-wider">🎨 สีเมนูบาร์ (Custom Color)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={sidebarColor.startsWith('#') && sidebarColor.length === 7 ? sidebarColor : '#0f172a'}
                  onChange={(e) => handleUpdateSidebarColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 shrink-0"
                  title="เลือกสีเมนูบาร์"
                />
                <input
                  type="text"
                  maxLength={7}
                  value={sidebarColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateSidebarColor(val.startsWith('#') ? val : `#${val}`);
                  }}
                  className="flex-1 bg-black/40 border border-white/15 rounded-lg pl-3 px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none uppercase"
                  placeholder="#0f172a"
                />
              </div>
            </div>

            {/* Mobile Log Out action item */}
            <div className="pt-2 border-t border-white/10 mt-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setTimeout(() => handleLogout(), 200);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/15 rounded-xl text-xs font-bold transition-all cursor-pointer text-rose-400"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ ({session.displayName})
              </button>
            </div>
 
            <div className="pt-3 border-t border-white/10 text-center flex justify-between items-center text-[10px] text-slate-350">
              <span>แก้ไขล่าสุด: {lastUpdated}</span>
              <button onClick={() => { handleResetSystemData(); setIsMobileMenuOpen(false); }} className="text-rose-450 hover:text-rose-400 font-bold">ใช้ข้อมูลทดสอบ</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Content Panel Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Quick Tab header on Desktop */}
          <div className="hidden md:flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">แผงควบคุมหลักฝ่ายบุคคล</span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {activeTab === 'employee-leave' && 'พอร์ทัลยื่นใบสมัครขอลาประจำวันของพนักงาน (Employee Leave Portal)'}
                  {activeTab === 'dashboard' && 'แดชบอร์ดสรุปวิเคราะห์กำลังคน (Systems Overview)'}
                  {activeTab === 'settings' && 'การตั้งค่าบริษัทและแผนกโครงสร้าง (Company Profile)'}
                  {activeTab === 'registry' && 'สารสนเทศทะเบียนประวัติและข้อมูลพนักงาน (Employee Registry)'}
                  {activeTab === 'employees' && 'การบริหารงานเงินเดือนพนักงาน (Payroll Administrator)'}
                  {activeTab === 'leave' && 'การลาพักร้อน ลาป่วย และการมาทำงานสาย (Attendance)'}
                  {activeTab === 'sales-daily' && 'รายงานการบริหารจัดการ ยอดขายรายวัน (Daily Sales)'}
                  {activeTab === 'sales-monthly' && 'สรุปสถิติวิเคราะห์ ยอดขายรวมรายเดือน (Monthly Sales Grid)'}
                  {activeTab === 'sales-yearly' && 'ข้อมูลสรุปศักยภาพและเป้าหมาย ยอดขายรายปี (Yearly Business Target)'}
                  {activeTab === 'sales-cashlog' && 'สมุดบันทึกยอดเงินสดแบบตารางกริด (Daily Cash Log Grid)'}
                  {activeTab === 'cheque-incoming' && 'ระบบสารสนเทศหนังสือสำคัญทางการเงิน (เช็คขารับ - Incoming Cheques)'}
                  {activeTab === 'cheque-payers' && 'ฐานข้อมูลลูกค้าผู้สั่งจ่าย (เช็คขารับ) (Customers / Payers Directory)'}
                  {activeTab === 'cheque-outgoing' && 'ระบบจ่ายตราสารและหนังสือแลกเงิน (เช็คขาจ่าย - Outgoing Cheques)'}
                  {activeTab === 'cheque-payees' && 'ฐานข้อมูลผู้รับเงิน/ซัพพลายเออร์ (เช็คขาจ่าย) (Suppliers / Payees Directory)'}
                  {activeTab === 'users' && 'ทะเบียนบริหารจัดการบัญชีผู้ใช้งาน (User Accounts Control Panel)'}
                  {activeTab === 'suppliers' && 'ระบบบริหารจัดการฐานข้อมูลคู่ค้าและประวัติการส่งของ (Suppliers & Delivery Partners)'}
                  {activeTab === 'system-installer' && 'โปรแกรมจำลองการตั้งค่าโครงสร้างและติดตั้งระบบ (Web Setup Installer Simulator)'}
                  {activeTab === 'gdrive' && 'ระบบคลังเอกสารและไฟล์บน Google Drive (Cloud Storage Management)'}
                  {activeTab === 'report-sales-monthly' && 'บริหารรวมรายงานทั้งหมด: รายงานสรุปยอดขายรายเดือนสุทธิสะสม (Consolidated Monthly Sales)'}
                  {activeTab === 'report-sales-yearly' && 'บริหารรวมรายงานทั้งหมด: รายงานสรุปยอดขายรายปีอ้างอิงเป้าหมาย (Consolidated Yearly Sales)'}
                  {activeTab === 'accounting-tax' && 'ระบบบัญชีและยอดส่งภาษีสรรพากร (Tax & Payroll Accounting Panel)'}
                  {activeTab === 'accounting-tax-detail' && 'ระบบบัญชี 1.1 รายการจ่ายส่งสรรพากรแต่ละเดือน (Individual Tax Filings)'}
                  {activeTab === 'accounting-tax-transfer' && 'ระบบบัญชี 1.2 โอนเงินจ่ายภาษีส่งสรรพากรแต่ละรอบเดือน (Monthly Revenue Direct Transfer)'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4 relative">
              {/* Premium Digital Clock in the top right corner */}
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 px-3 py-1.5 rounded-2xl border border-slate-800 shadow-md text-white">
                <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs font-mono font-black tracking-widest text-emerald-400 tabular-nums select-none leading-none">
                    {digitalTime.getHours().toString().padStart(2, '0')}:
                    {digitalTime.getMinutes().toString().padStart(2, '0')}:
                    {digitalTime.getSeconds().toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] font-bold text-slate-350 tracking-wider">
                    {digitalTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* DB & Cloud Connection Status Button */}
              <button
                onClick={() => setIsCloudSyncModalOpen(true)}
                title="คลิกเพื่อจัดการความสัมพันธ์คลาวด์มัลติพาส"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-black transition-all shadow-sm select-none cursor-pointer ${
                  cloudConnectionState === 'connected'
                    ? 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    : cloudConnectionState === 'checking'
                    ? 'bg-blue-50 border-blue-250 text-blue-700 animate-pulse border-blue-200'
                    : 'bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100 border-rose-200'
                }`}
              >
                <Cloud className={`w-3.5 h-3.5 shrink-0 ${cloudSyncState === 'syncing' ? 'animate-bounce text-blue-500' : ''}`} />
                <span className="hidden leading-none lg:inline">
                  {cloudConnectionState === 'connected' ? 'เชื่อมคลาวด์สำเร็จ' : cloudConnectionState === 'checking' ? 'กำลังส่งคำขอเข้าคลาวด์...' : 'คลาวด์ออฟไลน์'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  cloudConnectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : cloudConnectionState === 'checking' ? 'bg-blue-500' : 'bg-rose-500'
                }`} />
              </button>

              <div className="h-6 w-[1px] bg-slate-200" />
              <ChequeNotifications 
                cheques={cheques} 
                leaveRequests={leaveRequests} 
                employees={employees}
                currentUserRole={session?.role} 
                onNavigate={(tab) => setActiveTab(tab)} 
                onUpdateLeave={handleUpdateLeave}
              />
              <div className="h-6 w-[1px] bg-slate-200" />
              
              {/* Dynamic Dropped profile selection */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer select-none"
                >
                  <img 
                    src={session.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
                    alt={session.displayName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-sm"
                  />
                  <div className="hidden lg:block text-left">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">{session.displayName}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block leading-tight">
                      {session.role} ({session.department ? session.department.split(' ')[0] : 'บริหาร'})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>
                
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <>
                      {/* Close trigger backdrop */}
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsProfileDropdownOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-4 space-y-3"
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                          <img 
                            src={session.avatarUrl} 
                            alt={session.displayName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate">{session.displayName}</h4>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-150">
                              {session.role}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">แผนก:</span>
                            <span className="font-semibold text-slate-800">{session.department || 'ฝ่ายบริหาร'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">เวลาล็อคอิน:</span>
                            <span className="font-mono text-slate-800">{session.loginTime || '09:00'}</span>
                          </div>
                          <div className="pb-1 border-b border-slate-100" />
                          <div className="pt-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">สิทธิ์การเข้าถึงโมดูล</span>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              {['dashboard', 'settings', 'registry', 'employees', 'leave', 'sales-daily', 'cheque-incoming', 'users'].map(tab => {
                                const allowed = isTabAllowed(tab);
                                return (
                                  <div key={tab} className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${allowed ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                                    <span className={allowed ? 'text-slate-700 font-bold' : 'text-slate-450 line-through'}>
                                      {tab === 'dashboard' && 'แดชบอร์ด'}
                                      {tab === 'settings' && 'ตั้งค่าระบบ'}
                                      {tab === 'registry' && 'ทะเบียน'}
                                      {tab === 'employees' && 'เงินเดือน'}
                                      {tab === 'leave' && 'การลา'}
                                      {tab === 'sales-daily' && 'ยอดขาย'}
                                      {tab === 'cheque-incoming' && 'เช็คขารับ'}
                                      {tab === 'users' && 'ผู้ใช้งาน'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex gap-1.5 flex-wrap">
                          <button
                            onClick={handleOpenMyProfileModal}
                            className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-black text-[11px] rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1 border border-indigo-200/80"
                          >
                            <UserCog className="w-3.5 h-3.5" /> โปรไฟล์ & ตั้งสิทธิ์ส่วนตัว
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              handleLogout();
                            }}
                            className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-rose-150"
                          >
                            <LogOut className="w-3 h-3" /> ออกระบบ
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ACTIVE VIEW WRAPPERS with micro-motion loading transitions */}
          <div className="pb-16">
            <AnimatePresence mode="wait">
              {!isTabAllowed(activeTab) ? (
                <motion.div
                  key="unauthorized-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-2xl p-10 border border-slate-200/85 shadow-lg max-w-md mx-auto text-center space-y-6 mt-12"
                >
                  <div className="w-14 h-14 bg-rose-100/70 rounded-full flex items-center justify-center text-rose-600 mx-auto border border-rose-200/50">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="space-y-2.5">
                    <h2 className="text-lg font-black text-slate-900">พื้นที่จำกัดสิทธิการควบคุม (Restricted Access)</h2>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                      บัญชีปัจจุบันของคุณ <strong>{session?.displayName}</strong> บนตำแหน่งงานบทบาท <strong>"{session?.role.toUpperCase()}"</strong> ไม่ได้รับอนุญาตให้ใช้เมนูหรือเข้าถึงโมดูล <strong>"{activeTab}"</strong>
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (session.role === 'sales') {
                          setActiveTab('sales-daily');
                        } else if (session.role === 'accountant') {
                          setActiveTab('cheque-incoming');
                        } else {
                          setActiveTab('dashboard');
                        }
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-indigo-500/10 shadow-md"
                    >
                      กลับไปยังเมนูหลักของคุณ
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <motion.div
                      key="dashboard-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <DashboardOverview 
                        companySettings={companySettings}
                        employees={employees}
                        leaveRequests={leaveRequests}
                        onNavigate={(tab) => setActiveTab(tab)}
                        onApproveLeave={handleApproveLeave}
                        onRejectLeave={handleRejectLeave}
                        dbConnected={cloudConnectionState === 'connected'}
                        onOpenSyncHub={() => setIsCloudSyncModalOpen(true)}
                      />

                      {/* Cheque Due Alarm Popup (Incoming daily until cleared, Outgoing from 2 days prior daily until cleared) */}
                      {(() => {
                        const getChequeDiffDays = (chequeDateStr: string) => {
                          if (!chequeDateStr) return 999;
                          try {
                            const chequeTime = new Date(chequeDateStr).setHours(0, 0, 0, 0);
                            const todayTime = new Date().setHours(0, 0, 0, 0);
                            return Math.round((chequeTime - todayTime) / (1000 * 60 * 60 * 24));
                          } catch {
                            return 999;
                          }
                        };

                        const realDueTomorrowCheques = cheques.filter(ch => {
                          const isPending = ch.status === 'pending_deposit' || ch.status === 'pending_receipt';
                          if (!isPending) return false;
                          const diffDays = getChequeDiffDays(ch.chequeDate);
                          
                          if (ch.type === 'incoming') {
                            // ป๊อบอัพแจ้งเตือนเช็คขารับที่ยังไม่ขึ้นเงิน ให้แจ้งเตือนทุกวันตั้งแต่วันครบกำหนด (หรือก่อนหน้า 1 วัน) จนกว่าจะได้รับเงิน/เคลียร์แล้ว
                            return diffDays <= 1;
                          } else {
                            // เช็คขาจ่ายเตือนล่วงหน้า 2 วัน วันถัดไปแจ้งอีกจนกว่าจะทำการจ่ายแล้ว (diffDays <= 2)
                            return diffDays <= 2;
                          }
                        });

                        const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        const inTwoDaysStr = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        const threeDaysAgoStr = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                        const testCheques = [
                          {
                            id: "CHQ-SIM-001",
                            chequeNumber: "99988112",
                            bankName: "ธนาคารกสิกรไทย",
                            branch: "สำนักงานใหญ่",
                            chequeDate: threeDaysAgoStr,
                            amount: 145000,
                            partyName: "บริษัท สยาม คิทเช่นเวิล์ด จำกัด",
                            type: "incoming" as const,
                            status: "pending_deposit" as const,
                            note: "จำลองขารับ: เกินกำหนดขึ้นเงินมาแล้ว 3 วัน (เตือนต่อเนื่องทุกวัน จนกว่าจะทำรายการรับเงินสำเร็จ)"
                          },
                          {
                            id: "CHQ-SIM-002",
                            chequeNumber: "88877554",
                            bankName: "ธนาคารไทยพาณิชย์",
                            branch: "สาขาอโศก",
                            chequeDate: inTwoDaysStr,
                            amount: 98000,
                            partyName: "บจก. เพลตโลหะไทย พาวเวอร์",
                            type: "outgoing" as const,
                            status: "pending_deposit" as const,
                            note: "จำลองขาจ่าย: ครบกำหนดล่วงหน้า 2 วัน (เตือนล่วงหน้า และวันถัดไปเตือนซ้ำ จนกว่าจะบันทึกชำระเงิน)"
                          }
                        ];

                        const activeCheques = realDueTomorrowCheques.length > 0 
                          ? realDueTomorrowCheques 
                          : testCheques; 
                          
                        const isSimulating = realDueTomorrowCheques.length === 0;

                        if (!isChequeDuePopupOpen) return null;

                        return (
                          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 15 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl ring-4 ring-amber-500/30 border border-slate-100 flex flex-col max-h-[90vh]"
                            >
                              {/* Header with Amber Alert Theme */}
                              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-6 text-white flex items-start gap-4 shrink-0 shadow-md">
                                <div className="p-3 bg-white/10 rounded-2xl animate-pulse shrink-0 border border-white/10">
                                  <Clock className="w-8 h-8 text-amber-100" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-rose-500/90 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce shadow-xs">
                                      แจ้งเตือนระบบการเงินตราสารหนี้เช็ค
                                    </span>
                                    {isSimulating && (
                                        <span className="bg-amber-950/40 text-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                          (โหมดจำลองทดสอบระบบ)
                                        </span>
                                      )}
                                  </div>
                                  <h3 className="text-xl font-extrabold tracking-tight mt-1">
                                    🔔 ตรวจพบเช็คขารับค้างเงิน หรือเช็คขาจ่ายถึงกำหนดชำระ
                                  </h3>
                                  <p className="text-xs text-amber-100 font-medium">
                                    แจ้งเตือนเช็คขารับที่ยังไม่ขึ้นเงินทุกวันจนกว่าจะเคลียร์ และเตือนเช็คขาจ่ายล่วงหน้า 2 วันต่อเนื่องจนกว่าจะลงจ่ายเงินแล้ว
                                  </p>
                                </div>
                                <button
                                  onClick={() => setIsChequeDuePopupOpen(false)}
                                  className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors cursor-pointer block"
                                  title="ปิดหน้าต่างนี้"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              {/* Body Container */}
                              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {isSimulating && (
                                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/50 flex gap-3 text-amber-900 text-xs font-semibold leading-relaxed">
                                    <span className="text-base shrink-0">💡</span>
                                    <div>
                                      <p className="font-extrabold text-amber-950">จำลองจำพวกข้อมูลเพื่อพรีวิวความถูกต้อง (Preview Mode)</p>
                                      <p className="text-[11px] font-medium text-amber-800 mt-0.5 font-sans">
                                        เนื่องจากในระบบของคุณไม่มีข้อมูลเช็คค้างชำระจริงที่เข้าเกณฑ์ ณ วันนี้ ระบบจึงจำลองตัวอย่างให้คุณตรวจเช็ค ทั้งเช็ครับที่เกิณงวด (เตือนทุกวัน) และเช็คจ่ายล่วงหน้า 2 วัน (แจ้งจนกว่าจะเคลียร์)
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  {activeCheques.map((ch, idx) => {
                                    const isIncoming = ch.type === 'incoming';
                                    const diffDays = getChequeDiffDays(ch.chequeDate);
                                    
                                    let badgeType = "default";
                                    let statusText = "";
                                    
                                    if (isIncoming) {
                                      if (diffDays < 0) {
                                        badgeType = "overdue";
                                        statusText = `⚠️ ค้างเงินเลยกำหนดมาแล้ว ${Math.abs(diffDays)} วัน!`;
                                      } else if (diffDays === 0) {
                                        badgeType = "today";
                                        statusText = "⚡️ ครบกำหนดนำเช็คขึ้นเงินในวันนี้!";
                                      } else if (diffDays === 1) {
                                        badgeType = "warning";
                                        statusText = "⏰ ถึงกำหนดเคลียร์พรุ่งนี้ (แจ้งเตือนล่วงหน้า 1 วัน)";
                                      } else {
                                        badgeType = "future";
                                        statusText = `⏳ เตรียมขึ้นเงินล่วงหน้า ${diffDays} วัน`;
                                      }
                                    } else {
                                      if (diffDays < 0) {
                                        badgeType = "overdue";
                                        statusText = `🚨 ค้างจ่ายยอดเลยกำหนดมาแล้ว ${Math.abs(diffDays)} วัน!`;
                                      } else if (diffDays === 0) {
                                        badgeType = "today";
                                        statusText = "🔥 ถึงกำหนดดึงยอดชำระจ่ายวันนี้!";
                                      } else if (diffDays === 1) {
                                        badgeType = "warning";
                                        statusText = "⏰ ครบกำหนดชำระพรุ่งนี้ (แจ้งเตือนล่วงหน้า 1 วัน)";
                                      } else if (diffDays === 2) {
                                        badgeType = "warning-two";
                                        statusText = "⏰ ครบกำหนดจ่ายเงินล่วงหน้าในอีก 2 วัน";
                                      } else {
                                        badgeType = "future";
                                        statusText = `⏳ เตรียมจ่ายล่วงหน้า ${diffDays} วัน`;
                                      }
                                    }

                                    return (
                                      <div 
                                        key={ch.id || idx}
                                        className={`p-4 rounded-2xl border transition-all hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                          isIncoming 
                                            ? 'bg-emerald-50/15 border-emerald-100/70 hover:border-emerald-200/90' 
                                            : 'bg-rose-50/15 border-rose-100/70 hover:border-rose-200/90'
                                        }`}
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                              isIncoming 
                                                ? 'bg-emerald-600 text-white' 
                                                : 'bg-rose-605 text-white bg-rose-600'
                                            }`}>
                                              {isIncoming ? '📥 เช็ครับเงิน' : '📤 เช็คจ่ายเงิน'}
                                            </span>
                                            <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg" title="เลขที่เช็ค">
                                              No. {ch.chequeNumber}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                              badgeType === 'overdue' ? 'bg-rose-50 border border-rose-200 text-rose-700 animate-pulse' :
                                              badgeType === 'today' ? 'bg-amber-100 text-amber-800 border border-amber-300 font-extrabold' :
                                              'bg-amber-50 border border-amber-200/50 text-amber-700'
                                            }`}>
                                              <span className={`w-1.5 h-1.5 rounded-full ${badgeType === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'} animate-ping`}></span>
                                              {statusText}
                                            </span>
                                          </div>
                                          <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                                            {ch.bankName} • {ch.branch}
                                          </h4>
                                          <p className="text-[11px] font-medium text-slate-600">
                                            <strong className="text-slate-700 font-bold">คู่สัญญา:</strong> {ch.partyName}
                                          </p>
                                          <p className="text-[10px] font-medium text-zinc-500 italic mt-0.5">
                                            "{ch.note || 'ไม่มีข้อมูลบันทึกเพิ่มเติม'}"
                                          </p>
                                        </div>

                                        <div className="text-left sm:text-right bg-white/65 p-2 rounded-xl border border-slate-100 min-w-[120px] shrink-0">
                                          <span className="text-[10px] font-black text-slate-400 block uppercase">กำหนดขึ้นเงิน</span>
                                          <span className="text-xs font-bold text-slate-850 block mt-0.5">{ch.chequeDate}</span>
                                          <span className={`text-sm font-black block mt-1 ${isIncoming ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            ฿{ch.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Footer Actions */}
                              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                                <div className="text-left shrink-0">
                                  <span className="text-[10px] text-slate-500 font-bold block">
                                    Sapphire Financial Check Sweep
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-semibold block mt-px">
                                    ระบบเตือนล่วงหน้า 24 ชั่วโมงเพื่อความมั่นคงและปลอดภัยทางการเงิน
                                  </span>
                                </div>

                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsChequeDuePopupOpen(false);
                                      setActiveTab('cheque-incoming');
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black transition-all cursor-pointer shadow-md text-nowrap"
                                  >
                                    📋 ไปหน้าจัดการข้อมูลเช็ค
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsChequeDuePopupOpen(false);
                                    }}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-black transition-all cursor-pointer shadow-sm text-nowrap"
                                  >
                                    ❌ ปิดหน้าต่างแจ้งเตือน
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      key="settings-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <CompanySettingsView 
                        settings={companySettings}
                        onUpdateSettings={saveCompanySettings}
                        onRestoreCloud={() => setReloadTrigger(prev => prev + 1)}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'registry' && (
                    <motion.div
                      key="registry-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <EmployeeRegistryView 
                        employees={employees}
                        departments={companySettings.departments}
                        onAddEmployee={handleAddEmployee}
                        onUpdateEmployee={handleUpdateEmployee}
                        onDeleteEmployee={handleDeleteEmployee}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'employees' && (
                    <motion.div
                      key="payroll-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <PayrollView 
                        employees={employees}
                        departments={companySettings.departments}
                        onAddEmployee={handleAddEmployee}
                        onUpdateEmployee={handleUpdateEmployee}
                        onDeleteEmployee={handleDeleteEmployee}
                        companySettings={companySettings}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'leave' && (
                    <motion.div
                      key="attendance-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AttendanceView 
                        leaveRequests={leaveRequests}
                        employees={employees}
                        onAddLeave={handleAddLeave}
                        onUpdateLeave={handleUpdateLeave}
                        onDeleteLeave={handleDeleteLeave}
                        onApproveLeave={handleApproveLeave}
                        onRejectLeave={handleRejectLeave}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'leave-approval' && (
                    <motion.div
                      key="leave-approval-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <LeaveApprovalView 
                        leaveRequests={leaveRequests}
                        employees={employees}
                        onApproveLeave={handleApproveLeave}
                        onRejectLeave={handleRejectLeave}
                        onDeleteLeave={handleDeleteLeave}
                        onResetLeaveStatus={handleResetLeaveStatus}
                        onUpdateLeave={handleUpdateLeave}
                      />
                    </motion.div>
                  )}

                  {activeTab.startsWith('sales-') && activeTab !== 'sales-cashlog' && (
                    <motion.div
                      key="sales-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SalesView 
                        activeSubTab={activeTab === 'sales-daily' ? 'daily' : activeTab === 'sales-monthly' ? 'monthly' : 'yearly'}
                        employees={employees}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'sales-cashlog' && (
                    <motion.div
                      key="sales-cashlog-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <DailyCashLogView employees={employees} />
                    </motion.div>
                  )}

                  {activeTab.startsWith('cheque-') && (
                    <motion.div
                      key="cheques-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChequesView 
                        activeSubTab={
                          activeTab === 'cheque-incoming' ? 'incoming' :
                          activeTab === 'cheque-outgoing' ? 'outgoing' :
                          activeTab === 'cheque-payers' ? 'payers' : 'payees'
                        }
                        cheques={cheques}
                        setCheques={setCheques}
                        payers={payers}
                        setPayers={setPayers}
                        payees={payees}
                        setPayees={setPayees}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'users' && session && (
                    <motion.div
                      key="users-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <UsersRolesView 
                        currentSessionUsername={session.username} 
                        currentSessionRole={session.role} 
                      />
                    </motion.div>
                  )}

                  {activeTab === 'suppliers' && (
                    <motion.div
                      key="suppliers-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SuppliersView employees={employees} />
                    </motion.div>
                  )}

                  {activeTab === 'system-installer' && (
                    <motion.div
                      key="installer-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <WebInstallerSimulator />
                    </motion.div>
                  )}

                  {activeTab === 'gdrive' && (
                    <motion.div
                      key="gdrive-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <GDriveView />
                    </motion.div>
                  )}

                  {activeTab.startsWith('report-sales-') && (
                    <motion.div
                      key="consolidated-reports-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ConsolidatedReportsView 
                        activeReportType={activeTab === 'report-sales-monthly' ? 'monthly' : 'yearly'} 
                      />
                    </motion.div>
                  )}

                  {(activeTab === 'accounting-tax' || activeTab === 'accounting-tax-detail' || activeTab === 'accounting-tax-transfer') && (
                    <motion.div
                      key={`accounting-tax-view-${activeTab}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AccountingTaxView 
                        employees={employees}
                        departments={companySettings.departments}
                        mode={activeTab === 'accounting-tax-transfer' ? 'transfer' : activeTab === 'accounting-tax-detail' ? 'detail' : 'summary'}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'employee-leave' && session && (
                    <motion.div
                      key="employee-leave-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <EmployeeLeaveView 
                        session={session}
                        employees={employees}
                        leaveRequests={leaveRequests}
                        onAddLeave={handleAddLeave}
                        onDeleteLeave={handleDeleteLeave}
                        onResetLeaveStatus={handleResetLeaveStatus}
                        onUpdateLeave={handleUpdateLeave}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'sales-billing' && (
                    <motion.div
                      key="sales-billing-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SalesBillingView 
                        employees={employees}
                        companySettings={companySettings}
                      />
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* PERSONAL PROFILE & PERMISSIONS MODAL OVERLAY */}
      {isMyProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* Backdrop click close */}
          <div className="fixed inset-0 cursor-default" onClick={() => setIsMyProfileModalOpen(false)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden relative z-10 text-left"
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <img 
                  src={myAvatarUrl} 
                  alt="My Profile avatar" 
                  className="w-10 h-10 rounded-full border border-white/20 object-cover shrink-0 shadow"
                />
                <div>
                  <h3 className="font-black text-sm flex items-center gap-1.5">
                    ⚙️ บัญญาโปรไฟล์ส่วนตัว & ตั้งค่าสิทธิ์ (My Profile & Permissions)
                  </h3>
                  <span className="text-[10px] text-indigo-200 font-bold block mt-0.5">
                    ปรับรายละเอียดบัญชี รหัสผ่าน และระดับความเปิดสิทธิ์ข้ามระดับงานประจำตัวของคุณ
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMyProfileModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-indigo-100 font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSaveMyProfile} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              
              {/* Display name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">ชื่อแสดงผลจริงของบัญชีคุณ (Full Name)</label>
                <input
                  type="text"
                  required
                  value={myDisplayName}
                  onChange={(e) => setMyDisplayName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">รหัสผ่านเข้าใช้งานระบบ (Password)</label>
                <input
                  type="text"
                  required
                  value={myPassword}
                  onChange={(e) => setMyPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-slate-800"
                />
              </div>

              {/* Department Option */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">สังกัดแผนกงานพนักงาน (Department)</label>
                <input
                  type="text"
                  required
                  value={myDepartment}
                  onChange={(e) => setMyDepartment(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700"
                />
              </div>

              {/* Avatar Url selection */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span>เลือกรูปโปรไฟล์ทางการของคุณ</span>
                  <button
                    type="button"
                    onClick={() => setMyCustomAvatar(!myCustomAvatar)}
                    className="text-indigo-600 text-[10px] uppercase font-bold hover:underline cursor-pointer"
                  >
                    {!myCustomAvatar ? 'ป้อน URL รูปภาพอิสระ' : 'เลือกจากแค็ตตาล็อก'}
                  </button>
                </div>

                {!myCustomAvatar ? (
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-100/50 rounded-xl justify-between">
                    {PRESET_AVATARS.map((pUrl, index) => {
                      const isSelected = myAvatarUrl === pUrl;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setMyAvatarUrl(pUrl)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform shrink-0 cursor-pointer ${
                            isSelected ? 'border-indigo-600 scale-110 shadow' : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={pUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="url"
                    required
                    placeholder="วางลิงก์รูปภาพ เช่น https://images.unsplash.com/..."
                    value={myAvatarUrl}
                    onChange={(e) => setMyAvatarUrl(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                )}
              </div>

              {/* Note / Description */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">
                  ⚠️ ข้อมูลการเปลี่ยนแปลงสิทธิ์จะไม่สามารถแก้ไขด้วยตนเองได้เมื่อบันทึกแล้ว ยกเว้นได้รับอนุมัติจากผู้ดูแลระบบสูงสุด
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMyProfileModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 transition-all font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 border border-slate-950 text-white hover:bg-slate-800 rounded-xl transition-all font-black text-xs cursor-pointer"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Firebase Database Connection & Sync Modal */}
      {isCloudSyncModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white leading-tight">ศูนย์ควบคุมตารางฐานข้อมูล Google Cloud Firebase</h3>
                  <p className="text-[10px] text-indigo-300 font-bold leading-none">Google Cloud Firestore Multi-Table Control Room</p>
                </div>
              </div>
              
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl select-none shrink-0 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setModalSubTab('status');
                    setInspectedTable(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${modalSubTab === 'status' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  สถานะ & สำรองหลัก (Main Control)
                </button>
                <button
                  type="button"
                  onClick={() => setModalSubTab('tables')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${modalSubTab === 'tables' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  แฟ้มศูนย์ตารางเชื่อม Firebase
                </button>
              </div>

              <button
                onClick={() => {
                  setIsCloudSyncModalOpen(false);
                  setInspectedTable(null);
                }}
                className="absolute top-5 right-5 md:static p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {modalSubTab === 'status' ? (
                <>
                  {/* Connection Status Panel */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Server className={`w-5 h-5 ${cloudConnectionState === 'connected' ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">สถานะเซิร์ฟเวอร์คลาวด์</span>
                        <span className="text-xs font-black text-slate-800 leading-none">
                          {cloudConnectionState === 'connected' && 'เชื่อมต่อแล้ว (Firestore Online)'}
                          {cloudConnectionState === 'checking' && 'กำลังวัดความหน่วงของสัญญาณเครือข่าย...'}
                          {cloudConnectionState === 'disconnected' && 'ตัดการเชื่อมต่อ (ใช้นโยบาย Local Database กำรอง)'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleCheckConnection()}
                      disabled={cloudConnectionState === 'checking'}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                    >
                      {cloudConnectionState === 'checking' ? 'กำลังตรวจสอบ...' : 'ตรวจสอบปิง'}
                    </button>
                  </div>

                  {/* Server Metadata and Configuration */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">พารามิเตอร์การตั้งค่าโครงการ (Project Identifiers)</span>
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold font-sans">FIREBASE PROJECT ID</span>
                        <span className="font-mono text-slate-800 break-all select-all font-black">
                          {firebaseConfig?.projectId || 'ai-studio-68d424b9-6a2b-4d65-b480-ee0f1e9e8407'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">DATABASE REGION</span>
                        <span className="font-mono text-indigo-600 font-bold">asia-southeast1 / Singapore</span>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">ระบบอัตโนมัติซิงโครไนซ์ตารางงาน (Auto-Sync Mode)</span>
                          <span className="text-[10px] text-slate-500">ทำการบันทึกทุกตารางพนักงาน/เช็ค/ประวัติ/บทบาท ไปคลาวด์ขณะคีย์</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                          <input
                            type="checkbox"
                            checked={isAutoSyncEnabled}
                            onChange={(e) => {
                              setIsAutoSyncEnabled(e.target.checked);
                              localStorage.setItem('sapphire_auto_sync_firebase', String(e.target.checked));
                              addSyncLog(e.target.checked ? '🔔 เปิดโหมดบันทึก Auto-Sync อัจฉริยะแล้ว' : '🔕 ยกเลิกโหมดบันทึก Auto-Sync ชั่วคราว');
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-[9px] text-slate-450 block font-bold font-sans">GOOGLE CLOUD PLATFORM</span>
                          <span className="text-[10px] text-slate-500">จัดการข้อมูลและโครงสร้างบน Google Firebase Console สดผ่านเบราว์เซอร์</span>
                        </div>
                        <a
                          href="https://console.firebase.google.com/project/ai-studio-68d424b9-6a2b-4d65-b480-ee0f1e9e8407/firestore/data"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/20 text-[11px] font-black transition-all cursor-pointer select-none"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          เปิด Google Firebase Console
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Action Tools */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">คำสั่งการจัดระเบียบสารสนเทศ (Manual Force Data Sync)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('ยืนยันระบบ: คุณต้องการอัปโหลดข้อมูลจากบราวเซอร์นี้ไปเขียนทับ Firebase Cloud ทั้งหมดใช่หรือไม่?')) return;
                          try {
                            setCloudSyncState('syncing');
                            addSyncLog('📤 กำลังรวบรวมตารางประวัติผู้ใช้ / พนักงาน / ใบลา / เช็คเงินฝาก...');
                            await uploadAllToCloud();
                            setCloudSyncState('success');
                            addSyncLog('🎉 สำเร็จ! อัปโหลดข้อมูลทุกตารางหน่วยขึ้นสู่ระบบคลาวด์อย่างสมบูรณ์');
                            alert('📤 อัปโหลดข้อมูลและสร้างข้อมูลจัดระเบียบคลาวด์สำเร็จแล้ว!');
                          } catch (err) {
                            setCloudSyncState('error');
                            addSyncLog(`❌ เกิดข้อผิดพลาดในการอัปโหลด: ${err instanceof Error ? err.message : String(err)}`);
                            alert('❌ การอัปโหลดล้มเหลว กรุณาเช็คสิทธิหรือการทดลองเชื่อมต่อคลาวด์');
                          }
                        }}
                        className="p-3.5 rounded-2xl border border-blue-250 bg-blue-50/50 hover:bg-blue-50 text-blue-700 transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer border-blue-250/20"
                      >
                        <UploadCloud className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-black">อัปโหลดสู่ Cloud (Backup)</span>
                        <span className="text-[9px] text-blue-550 font-bold">Local Storage ➔ Firestore</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('คำเตือน: การดึงชุดสถิติตารางจากคลาวด์จะเป่าลบและเซ็ตทับค่าข้อมูลปัจจุบันบนเบราว์เซอร์นี้ทั้งหมด ต้องการดำเนิดการใช่หรือไม่?')) return;
                          try {
                            setCloudSyncState('syncing');
                            addSyncLog('📥 ดึงโครงสร้างชุดความจำทั้งหมดลงมาจาก Cloud Firestore...');
                            const downloaded = await downloadAllFromCloud();
                            setCloudSyncState('success');
                            addSyncLog(`🎉 สำเร็จ! ดึงข้อมูลจำนวน ${Object.keys(downloaded).length} ตาราง มาเขียนลงแทนหน่วยความจำตัวนำเรียบร้อย`);
                            alert('📥 ซิงโครไนซ์ดึงไฟล์ฐานข้อมูลลงมายังเครื่องผู้ใช้งานสำเร็จลุล่วงแล้ว!');
                            // Refresh state hooks
                            setReloadTrigger(prev => prev + 1);
                            window.dispatchEvent(new Event('sapphire_storage_updated'));
                          } catch (err) {
                            setCloudSyncState('error');
                            addSyncLog(`❌ ดึงข้อมูลขัดข้อง: ${err instanceof Error ? err.message : String(err)}`);
                            alert('❌ ไม่สามารถดึงความจำจากคลาวด์ได้ กรุณาตรวจสภาพความเร็วปิง');
                          }
                        }}
                        className="p-3.5 rounded-2xl border border-indigo-250 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-750 transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer border-indigo-250/20"
                      >
                        <DownloadCloud className="w-6 h-6 text-indigo-600" />
                        <span className="text-xs font-black">ดึงข้อมูลลงคอมฯ (Restore)</span>
                        <span className="text-[9px] text-indigo-550 font-bold">Firestore ➔ Local Memory</span>
                      </button>
                    </div>
                  </div>

                  {/* Local JSON Backup & Web-Migration Tools */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-405 tracking-wider">จัดการไฟล์สำรองสำหรับพกพา & ย้ายข้ามระบบเว็บอื่น (Offline JSON Backup & Migration)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleExportFullBackup}
                        className="p-3.5 rounded-2xl border border-emerald-250 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer border-emerald-250/20"
                      >
                        <DownloadCloud className="w-6 h-6 text-emerald-600 shrink-0" />
                        <span className="text-xs font-black">ดาวน์โหลดไฟล์สำรองทั้งหมด (JSON Backup)</span>
                        <span className="text-[9px] text-emerald-600 font-bold">ดาวน์โหลดทั้ง 8 ตารางเก็บลงเครื่อง</span>
                      </button>

                      <label
                        className="p-3.5 rounded-2xl border border-purple-250 bg-purple-50/40 hover:bg-purple-50 text-purple-800 transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer border-purple-250/20 text-[11px] font-black"
                      >
                        <UploadCloud className="w-6 h-6 text-purple-600 shrink-0" />
                        <span className="text-xs font-black">กู้คืนระบายข้อมูลจากปุ่มสำรอง (Restore Backup)</span>
                        <span className="text-[9px] text-purple-600 font-bold">อัปโหลดไฟล์ backup เพื่อเปิดกับเว็บนี้</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportFullBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {inspectedTable === null ? (
                    <>
                      {/* Tables Directory */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-800">รายชื่อตารางระบบทั้งหมด (System Schema Directory)</h4>
                          <p className="text-[10px] text-slate-450">สามารถเปรียบเทียบขนาดบันทึก แอบส่องเนื้อหา และเลือกสำรองข้อมูลแบบรายตารางเดี่ยวคีย์</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black">เชื่อมโยง Firebase</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                        {[
                          { id: 'employees', label: 'ตารางพนักงาน & อัตราเงินเดือน', localKey: 'hr_employees', countKey: 'hr_employees', type: 'array' },
                          { id: 'leave_requests', label: 'ตารางวันลา & ใบพักร้อน', localKey: 'hr_leave_requests', countKey: 'hr_leave_requests', type: 'array' },
                          { id: 'daily_attendance', label: 'ตารางลงเวลามาสายรายวัน', localKey: 'hr_daily_attendance', countKey: 'hr_daily_attendance', type: 'array' },
                          { id: 'cheques_data', label: 'ตารางบันทึกเช็ค รับ-จ่าย', localKey: 'hr_cheques_data', countKey: 'hr_cheques_data', type: 'array' },
                          { id: 'daily_sales', label: 'ตารางบัญชีบันทึกยอดขาย', localKey: 'sapphire_daily_sales', countKey: 'sapphire_daily_sales', type: 'array' },
                          { id: 'users', label: 'ตารางบัญชีรายชื่อผู้ใช้ระบบ', localKey: 'sapphire_users', countKey: 'sapphire_users', type: 'array' },
                          { id: 'role_permissions', label: 'ตารางบทบาท & สิทธิ์เปิดหน้า', localKey: 'sapphire_role_permissions', countKey: 'sapphire_role_permissions', type: 'object' },
                          { id: 'company_settings', label: 'ตารางตั้งค่าระบบ & เอกลักษณ์', localKey: 'hr_company_settings', countKey: 'hr_company_settings', type: 'meta' }
                        ].map((tbl) => {
                          const raw = localStorage.getItem(tbl.localKey);
                          let recordCount = 0;
                          if (raw) {
                            try {
                              const parsed = JSON.parse(raw);
                              if (tbl.type === 'array') recordCount = parsed.length;
                              else if (tbl.type === 'object') recordCount = Object.keys(parsed).length;
                              else recordCount = 1; // meta
                            } catch (e) {
                              recordCount = 1;
                            }
                          }
                          return (
                            <div key={tbl.id} className="p-3.5 rounded-2xl border border-slate-150 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between gap-3">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-indigo-600 font-black">{tbl.id}</span>
                                  <span className="px-2 py-0.5 rounded px-2 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-700">
                                    {recordCount} บันทึก
                                  </span>
                                </div>
                                <h5 className="text-xs font-black text-slate-800 mt-1 leading-snug">{tbl.label}</h5>
                                <p className="text-[9px] text-slate-450 leading-tight mt-0.5">เชื่อมผ่าน Local Key: <span className="font-mono text-slate-500">{tbl.localKey}</span></p>
                              </div>

                              <div className="flex gap-1.5 pt-1.5 border-t border-slate-100 mt-1">
                                <button
                                  type="button"
                                  onClick={() => setInspectedTable(tbl.id)}
                                  className="flex-1 py-1 px-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  แอบส่องข้อมูล
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`คุณต้องการสำรองตารางเฉพาะตัว [${tbl.id}] ขึ้น Firestore ใช่หรือไม่?`)) {
                                      try {
                                        setCloudSyncState('syncing');
                                        addSyncLog(`⏳ อัปโหลดตารางเฉพาะคีย์ [${tbl.id}]...`);
                                        const storedVal = localStorage.getItem(tbl.localKey);
                                        if (storedVal) {
                                          await saveKeyToCloud(tbl.id, JSON.parse(storedVal));
                                          addSyncLog(`✅ อัปโหลดสำรองตารางเฉพาะคีย์ [${tbl.id}] ขึ้นคลาวด์เรียบร้อยแล้ว`);
                                          alert(`🎉 อัปโหลดและเชื่อมตาราง ${tbl.id} ไป Firebase สำเร็จ!`);
                                        }
                                        setCloudSyncState('success');
                                      } catch (err) {
                                        setCloudSyncState('error');
                                        addSyncLog(`❌ สำรองข้อมูลตาราง [${tbl.id}] ล้มเหลว`);
                                        alert('❌ ไม่สามารถเชื่อมโยงอัปเดตบน Firebase ได้ในครั้งนี้');
                                      }
                                    }
                                  }}
                                  className="py-1 px-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-[9px] text-slate-700 font-bold cursor-pointer"
                                  title="สำรองตารางนี้เดี่ยว"
                                >
                                  สำรองเดี่ยว
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`คำเตือน: ดึงทับโครงสร้าง [${tbl.id}] จะเขียนทับข้อมูลในเครื่อง ต้องการดำเนินการต่อใช่หรือไม่?`)) {
                                      try {
                                        setCloudSyncState('syncing');
                                        addSyncLog(`⏳ กำลังสั่งดึงคืนตารางเฉพาะคีย์ [${tbl.id}] จาก Firebase...`);
                                        const cloudVal = await fetchKeyFromCloud(tbl.id);
                                        if (cloudVal !== null) {
                                          localStorage.setItem(tbl.localKey, JSON.stringify(cloudVal));
                                          addSyncLog(`✅ ดึงคืนและเขียนแทนที่ตาราง [${tbl.id}] สำเร็จ`);
                                          alert(`📥 ซิงโครไนซ์ดึงตาราง ${tbl.id} กลับมาในเครื่องสำเร็จ!`);
                                          setReloadTrigger(prev => prev + 1);
                                          window.dispatchEvent(new Event('sapphire_storage_updated'));
                                        } else {
                                          addSyncLog(`⚠️ ตรวจไม่พบตาราง [${tbl.id}] เก่าบนคลาวด์`);
                                          alert(`⚠️ ไม่มีตารางข้อมูลเก่า ${tbl.id} ให้กู้คืนบน Firestore`);
                                        }
                                        setCloudSyncState('success');
                                      } catch (err) {
                                        setCloudSyncState('error');
                                        addSyncLog(`❌ ซิงโครไนซ์เดี่ยวดาวน์โหลด [${tbl.id}] ผิดพลาด`);
                                      }
                                    }
                                  }}
                                  className="py-1 px-2 rounded-lg border border-indigo-150 hover:bg-indigo-50 hover:border-indigo-200 text-[9px] text-indigo-600 font-black cursor-pointer"
                                  title="กู้คืนตารางนี้เดี่ยว"
                                >
                                  กู้เดี่ยว
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Table row inspector */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setInspectedTable(null)}
                            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            กลับหน้าแฟ้มรวมตาราง
                          </button>

                          {/* Individual Download/Upload keys */}
                          {(() => {
                            const localKeyMap: Record<string, string> = {
                              employees: 'hr_employees',
                              leave_requests: 'hr_leave_requests',
                              daily_attendance: 'hr_daily_attendance',
                              cheques_data: 'hr_cheques_data',
                              daily_sales: 'sapphire_daily_sales',
                              users: 'sapphire_users',
                              role_permissions: 'sapphire_role_permissions',
                              company_settings: 'hr_company_settings'
                            };
                            const localKey = localKeyMap[inspectedTable || ''];
                            if (!localKey) return null;
                            
                            const handleExportSingleTable = () => {
                              const raw = localStorage.getItem(localKey);
                              if (!raw) {
                                alert('ไม่มีข้อมูลจำเพาะตารางที่จะดาวน์โหลด');
                                return;
                              }
                              const blob = new Blob([raw], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `sapphire_table_${inspectedTable}.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              addSyncLog(`📥 ดาวน์โหลดเฉพาะไฟล์ตารางเดี่ยว [${inspectedTable}] สำเร็จแล้ว`);
                            };

                            const handleImportSingleTable = (event: React.ChangeEvent<HTMLInputElement>) => {
                              const file = event.target.files?.[0];
                              if (!file) return;

                              const reader = new FileReader();
                              reader.onload = async (e) => {
                                const text = e.target?.result;
                                if (typeof text !== 'string') return;
                                try {
                                  const data = JSON.parse(text);
                                  if (!confirm(`❔ ต้องการเขียนข้อมูลในตาราง [${inspectedTable}] ทับด้วยไฟล์ที่คุณอัปโหลดใช่หรือไม่ข้อมูลเดิมจะหายไป?`)) {
                                    return;
                                  }
                                  
                                  localStorage.setItem(localKey, JSON.stringify(data));
                                  addSyncLog(`📥 นำเข้าและแทนชุดข้อมูลตาราง [${inspectedTable}] สำเร็จ`);
                                  
                                  if (isAutoSyncEnabled) {
                                    setCloudSyncState('syncing');
                                    await saveKeyToCloud(inspectedTable || '', data);
                                    addSyncLog(`   - ระบบประสานไฟล์ [${inspectedTable}] ซิงก์ขึ้น Firebase คลาวด์แล้ว`);
                                    setCloudSyncState('success');
                                  }
                                  
                                  alert(`🎉 นำเข้าและเปลี่ยนถ่ายสารสนเทศตาราง [${inspectedTable}] เรียบร้อย!`);
                                  setReloadTrigger(prev => prev + 1);
                                  window.dispatchEvent(new Event('sapphire_storage_updated'));
                                } catch (err) {
                                  alert('❌ รูปแบบไฟล์ไม่สอดคล้อง กรุณาอัปโหลดไฟล์ JSON ที่ถูกต้อง');
                                }
                              };
                              reader.readAsText(file);
                            };

                            return (
                              <div className="flex items-center gap-1.5 font-sans">
                                <button
                                  type="button"
                                  onClick={handleExportSingleTable}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all border border-emerald-200/40"
                                  title="ดาวน์โหลดไฟล์ข้อมูล .json เพื่อนำไปอิมพอร์ตใช้งานบนเว็บอื่น"
                                >
                                  <DownloadCloud className="w-3.5 h-3.5" />
                                  ดาวน์โหลดตารางนี้ (.JSON)
                                </button>

                                <label
                                  className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all border border-purple-200/40 opacity-90 hover:opacity-100"
                                  title="นำเข้าไฟล์ข้อมูล .json เพื่อเขียนทับตารางข้อมูลเดิม"
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  นำเข้าเขียนทับตาราง (.JSON)
                                  <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportSingleTable}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] font-mono text-indigo-600 font-bold block">Firestore Table Inspector</span>
                          <span className="text-xs font-black text-slate-800 text-right block">ตารางอ้างอิง: {inspectedTable}</span>
                        </div>
                      </div>

                      {/* Render different grids depending on selection */}
                      <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white max-h-[40vh] overflow-y-auto">
                        {(() => {
                          const localKeyMap: Record<string, string> = {
                            employees: 'hr_employees',
                            leave_requests: 'hr_leave_requests',
                            daily_attendance: 'hr_daily_attendance',
                            cheques_data: 'hr_cheques_data',
                            daily_sales: 'sapphire_daily_sales',
                            users: 'sapphire_users',
                            role_permissions: 'sapphire_role_permissions',
                            company_settings: 'hr_company_settings'
                          };
                          const raw = localStorage.getItem(localKeyMap[inspectedTable] || '');
                          if (!raw) {
                            return <div className="p-8 text-center text-xs text-slate-400 font-black">ไม่พบบันทึกข้อมูลในฐานข้อมูล Local เครื่องบราวเซอร์เครื่องนี้</div>;
                          }
                          try {
                            const parsed = JSON.parse(raw);
                            
                            if (inspectedTable === 'employees') {
                              return (
                                <table className="w-full text-left border-collapse text-[11px] font-sans">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-650 border-b border-slate-200 font-black">
                                      <th className="p-2.5">รหัสพนักงาน</th>
                                      <th className="p-2.5">ชื่อจริง - นามสกุล</th>
                                      <th className="p-2.5">แผนก / ฝ่าย</th>
                                      <th className="p-2.5">ตำแหน่ง</th>
                                      <th className="p-2.5 text-right">เงินเดือนปัจจุบัน</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsed.map((item: any) => (
                                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2.5 font-mono text-indigo-600">{item.id}</td>
                                        <td className="p-2.5 font-black text-slate-800">{item.name}</td>
                                        <td className="p-2.5 text-slate-600">{item.department}</td>
                                        <td className="p-2.5 text-slate-500">{item.position}</td>
                                        <td className="p-2.5 text-right font-black text-slate-850">{(item.salary || 0).toLocaleString()} ฿</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }

                            if (inspectedTable === 'leave_requests') {
                              return (
                                <table className="w-full text-left border-collapse text-[11px] font-sans">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-650 border-b border-slate-200 font-black">
                                      <th className="p-2.5">ไอดีพนักงาน</th>
                                      <th className="p-2.5">ประเภทการลา</th>
                                      <th className="p-2.5">เวลาระหว่างวัน</th>
                                      <th className="p-2.5">จำนวนวันลา</th>
                                      <th className="p-2.5">สถานะ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsed.map((item: any) => (
                                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2.5 font-mono text-indigo-600">{item.employeeId}</td>
                                        <td className="p-2.5 font-black text-slate-800">{item.type}</td>
                                        <td className="p-2.5 text-slate-500">{item.startDate} ถึง {item.endDate}</td>
                                        <td className="p-2.5 text-slate-600 font-black">{item.totalDays} วัน</td>
                                        <td className="p-2.5">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                            item.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            item.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                          }`}>
                                            {item.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }

                            if (inspectedTable === 'daily_attendance') {
                              return (
                                <table className="w-full text-left border-collapse text-[11px] font-sans">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-650 border-b border-slate-200 font-black">
                                      <th className="p-2.5">วันที่</th>
                                      <th className="p-2.5">รหัสพนักงาน</th>
                                      <th className="p-2.5">สถานะลงเวลา</th>
                                      <th className="p-2.5">บันทึกช่วยจำ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsed.map((item: any, idx: number) => (
                                      <tr key={item.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2.5 font-black text-slate-700">{item.date}</td>
                                        <td className="p-2.5 font-mono text-indigo-600">{item.employeeId}</td>
                                        <td className="p-2.5">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                            item.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            item.status === 'late' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-red-50 text-red-600 border border-red-100'
                                          }`}>
                                            {item.status}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-slate-500 italic">{item.note || 'ไม่มีระบุบันทึกรายละเอียด'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }

                            if (inspectedTable === 'cheques_data') {
                              return (
                                <table className="w-full text-left border-collapse text-[11px] font-sans">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-650 border-b border-slate-200 font-black">
                                      <th className="p-2.5">เลขที่หน้าเช็ค</th>
                                      <th className="p-2.5">ธนาคารส่งจ่าย</th>
                                      <th className="p-2.5">ชื่อคู่ค้าสั่งจ่าย/รับเงิน</th>
                                      <th className="p-2.5 text-right">มูลค่ารวม</th>
                                      <th className="p-2.5">ประเภท</th>
                                      <th className="p-2.5">สถานะ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsed.map((item: any) => (
                                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2.5 font-mono text-indigo-600">{item.chequeNumber}</td>
                                        <td className="p-2.5 font-black text-slate-700">{item.bankName}</td>
                                        <td className="p-2.5 text-slate-600 font-medium">{item.payerName}</td>
                                        <td className="p-2.5 text-right font-black text-slate-800">{(item.amount || 0).toLocaleString()} ฿</td>
                                        <td className="p-2.5 font-black text-[10px] text-slate-500">{item.type}</td>
                                        <td className="p-2.5">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                            item.status === 'cleared' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                          }`}>
                                            {item.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }

                            if (inspectedTable === 'daily_sales') {
                              return (
                                <table className="w-full text-left border-collapse text-[11px] font-sans">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-650 border-b border-slate-200 font-black">
                                      <th className="p-2.5">วันที่ขาย</th>
                                      <th className="p-2.5 text-right">ยอดเงินสุทธิ</th>
                                      <th className="p-2.5">จำนวนบิล</th>
                                      <th className="p-2.5">รูปแบบการชำระ</th>
                                      <th className="p-2.5">พนักงายผู้ทำรายการ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsed.map((item: any) => (
                                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2.5 font-black text-slate-700">{item.date}</td>
                                        <td className="p-2.5 text-right font-black text-slate-900">{(item.amount || 0).toLocaleString()} ฿</td>
                                        <td className="p-2.5 text-slate-600 font-black">{item.orderCount} ครั้ง</td>
                                        <td className="p-2.5 font-bold text-slate-500">{item.method}</td>
                                        <td className="p-2.5 text-slate-550 italic">{item.creatorName || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }

                            if (inspectedTable === 'users') {
                              return (
                                <table className="w-full text-left border-collapse text-[11px] font-sans">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-650 border-b border-slate-200 font-black">
                                      <th className="p-2.5">Username</th>
                                      <th className="p-2.5">DisplayName (ชื่อจริง)</th>
                                      <th className="p-2.5">บทบาทระบบ (Role)</th>
                                      <th className="p-2.5">ฝ่าย / สังกัดผู้ใช้</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsed.map((item: any) => (
                                      <tr key={item.username} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2.5 font-mono text-indigo-650 font-black">@{item.username}</td>
                                        <td className="p-2.5 font-black text-slate-800">{item.displayName}</td>
                                        <td className="p-2.5">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-600 uppercase">
                                            {item.role}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-slate-500">{item.department}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }

                            if (inspectedTable === 'role_permissions') {
                              return (
                                <table className="w-full text-left border-collapse text-[11px] font-sans">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-650 border-b border-slate-200 font-black">
                                      <th className="p-2.5">บทบาทหลัก (Role Name)</th>
                                      <th className="p-2.5">ขอบเขตโมดูลสารสนเทศที่มองเห็นได้ (Allowed View Tabs)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(parsed).map(([role, permittedModules]: any) => (
                                      <tr key={role} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2.5 font-black text-slate-800 uppercase text-xs">{role}</td>
                                        <td className="p-2.5">
                                          <div className="flex flex-wrap gap-1">
                                            {(permittedModules || []).map((mod: string) => (
                                              <span key={mod} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono leading-none border border-slate-200">
                                                {mod}
                                              </span>
                                            ))}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }

                            if (inspectedTable === 'company_settings') {
                              return (
                                <div className="p-4 space-y-3 text-xs">
                                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block">ชื่อบริษัท (ไทย)</label>
                                      <span className="font-black text-slate-800 text-xs">{parsed.companyNameTh}</span>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block">ชื่อบริษัท (อังกฤษ)</label>
                                      <span className="font-black text-slate-800 text-xs">{parsed.companyNameEn}</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block">เลขประจำตัวผู้เสียภาษี</label>
                                      <span className="font-mono text-slate-700">{parsed.taxId || '0105563124578'}</span>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block">โทรศัพท์ติดต่อ</label>
                                      <span className="font-mono text-slate-700">{parsed.phone}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block">สำนักงานใหญ่จดทะเบียน</label>
                                    <span className="text-slate-700 leading-normal">{parsed.address}</span>
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          } catch (e) {
                            return <div className="p-4 text-xs font-mono text-red-500 break-all">การลอกข้อมูลล้มเหลว: {String(e)}</div>;
                          }
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Diagnostic Terminal Stream Log is always shown on BOTH tabs for active feedback */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping inline-block" />
                  บันทึกสดศูนย์รวมข้อมูลคลาวด์ (Live Storage Terminal stream)
                </span>
                <div className="h-24 bg-slate-900 rounded-2xl p-3 border border-slate-800 overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-1">
                  {syncLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed break-all">{log}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                ⚙️ ขับเคลื่อนผ่าน Engine สื่อสาร Firestore SDK v10.x
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCloudSyncModalOpen(false);
                  setInspectedTable(null);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
              >
                ปิดหน้าต่างศูนย์ตารางข้อมูล
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
