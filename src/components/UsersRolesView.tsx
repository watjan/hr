import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  FolderLock, 
  Lock,
  UserCog, 
  Trash2, 
  Save, 
  ShieldAlert, 
  KeyRound, 
  Users,
  Check,
  AlertCircle,
  Briefcase,
  Contact,
  Image,
  RefreshCcw,
  CheckSquare,
  Square,
  Database,
  Cloud,
  Edit2,
  Search,
  Filter
} from 'lucide-react';
import { UserRole, TestUser } from '../types';
import { saveKeyToCloud, fetchKeyFromCloud } from '../lib/firebaseSync';

interface UsersRolesViewProps {
  currentSessionUsername: string;
  currentSessionRole?: string;
}

export const ALL_ROLES: { value: UserRole; label: string; desc: string; color: string }[] = [
  { value: 'admin', label: 'ผู้ดูแลระบบ (Admin)', desc: 'เข้าถึงสิทธิ์ผู้จัดการระบบสูงสุดทุกส่วนงาน', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'hr', label: 'ผู้ช่วยฝ่ายบุคคล (HR Assist)', desc: 'งานดูแลพนักงาน บันทึกการลงชื่อ/เช็ควันสาย/การทำใบลา', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'accountant', label: 'พนักงานบัญชี (Accountant)', desc: 'งานบัญชี ดูสลีปเงินเดือน สถิติมูลค่ายอดขาย และดูแลรายงานเช็ค', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'sales', label: 'ผู้จัดการสาขา/พนักงานขาย (Sales)', desc: 'จำกัดขอบเขตบันทึกรายงานยอดขายและสถิติกำไร', color: 'bg-blue-100 text-blue-800 border-blue-200' },
];

export const MODULE_TABS = [
  { value: 'dashboard', label: '📊 แผงควบคุม (Dashboard)', category: 'ทั่วไป' },
  { value: 'settings', label: '🏢 ตั้งค่าบริษัท/แผนก (Company Profile)', category: 'ข้อมูลบริษัท' },
  { value: 'registry', label: '👥 ทะเบียนพนักงาน (Employee Registry)', category: 'ฝ่ายบุคคล' },
  { value: 'employees', label: '💳 จัดการเงินเดือนและสลิป (Payroll)', category: 'ฝ่ายบุคคล' },
  { value: 'leave', label: '📅 การมาสาย/ใบลาพนักงาน (Attendance)', category: 'ฝ่ายบุคคล' },
  { value: 'sales-daily', label: '📈 ยอดขายรายวัน (Daily Sales)', category: 'ฝ่ายขาย' },
  { value: 'sales-monthly', label: '📊 ยอดขายรายเดือน (Monthly)', category: 'ฝ่ายขาย' },
  { value: 'sales-yearly', label: '🏆 ยอดขายรายปี (Yearly Summary)', category: 'ฝ่ายขาย' },
  { value: 'cheque-incoming', label: '🏦 ตรวจเช็คขารับ (Incoming Cheque)', category: 'ฝ่ายบัญชี' },
  { value: 'cheque-outgoing', label: '💸 สรุปเช็คขาจ่าย (Outgoing Cheque)', category: 'ฝ่ายบัญชี' },
  { value: 'users', label: '⚙️ จัดการสิทธิ์และบัญชีผู้ใช้งาน (Users & Roles)', category: 'ระบบรักษาความปลอดภัย' },
];

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
];

export default function UsersRolesView({ currentSessionUsername, currentSessionRole }: UsersRolesViewProps) {
  // 1. Users Dynamic Data Store
  const [users, setUsers] = useState<TestUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>({
    admin: [],
    hr: [],
    accountant: [],
    sales: []
  });

  // Cloud sync status indicator state
  const [cloudSyncState, setCloudSyncState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // State for user table filtering
  const [tableSearch, setTableSearch] = useState('');
  const [tableRoleFilter, setTableRoleFilter] = useState<'all' | UserRole>('all');

  // State handles for dynamic user creation
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('sales');
  const [department, setDepartment] = useState('ฝ่ายขายและการตลาด (Sales & Marketing)');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [customAvatarInput, setCustomAvatarInput] = useState(false);
  const [desc, setDesc] = useState('พนักงานบันทึกข้อมูลและตรวจสอบความถูกต้องงานรายอุตสาหกรรม');

  // Custom permissions for creation
  const [creationUseCustomPermissions, setCreationUseCustomPermissions] = useState(false);
  const [creationCustomTabs, setCreationCustomTabs] = useState<string[]>([]);

  // States of edited user
  const [userToEdit, setUserToEdit] = useState<TestUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('sales');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCustomAvatar, setEditCustomAvatar] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editUseCustomProps, setEditUseCustomProps] = useState(false);
  const [editCustomTabs, setEditCustomTabs] = useState<string[]>([]);

  // Status Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initial load with Firestore integration
  useEffect(() => {
    const fetchCloudData = async () => {
      setCloudSyncState('loading');
      try {
        let finalUsers: TestUser[] = [];
        let finalPerms: Record<UserRole, string[]> = rolePermissions;

        // 1. Fetch Users from Cloud Firestore ('users' document payload in sapphire_hr)
        const cloudUsers = await fetchKeyFromCloud('users');
        if (cloudUsers && Array.isArray(cloudUsers)) {
          setUsers(cloudUsers);
          localStorage.setItem('sapphire_users', JSON.stringify(cloudUsers));
          finalUsers = cloudUsers;
        } else {
          // No cloud data yet, initialize defaults and save them to the cloud database
          const DEFAULT_USERS: TestUser[] = [
            {
              username: 'admin',
              password: 'admin123',
              displayName: 'อภิวัฒน์ เกียรติสกุล',
              role: 'admin',
              department: 'ฝ่ายบริหาร (Management)',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              desc: 'เข้าถึงสิทธิ์ผู้เข้าดูแลระบบ (Full Admin Access) สามารถดูและแก้ไขได้ทุกโมดูล',
              color: 'from-amber-550 to-orange-600 bg-amber-500/10'
            },
            {
              username: 'hr',
              password: 'hr123',
              displayName: 'นพเก้า มิ่งขวัญศิริ',
              role: 'hr',
              department: 'ทรัพยากรบุคคล (HR Dept)',
              avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
              desc: 'งานบริหารจัดการพนักงาน บันทึกการเข้างาน-เวลามาสาย แจ้งใบลา และสลิปเงินเดือนเบื้องต้น',
              color: 'from-emerald-550 to-teal-600 bg-emerald-500/10'
            },
            {
              username: 'accountant',
              password: 'acc123',
              displayName: 'ศรุตรา เลียบคงเกียรติ',
              role: 'accountant',
              department: 'บัญชีและการเงิน (Accounting)',
              avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
              desc: 'สำหรับฝ่ายบัญชี จัดการสถิติยอดรายวัน รายเดือน สิทธิและสารสนเทศระบบควบคุมเรื่องเช็ครับ-จ่าย',
              color: 'from-indigo-550 to-purple-600 bg-indigo-500/10'
            },
            {
              username: 'sales',
              password: 'sales123',
              displayName: 'ธีรเดช ตันติเวชกุล',
              role: 'sales',
              department: 'พนักงานขายหน้าร้าน (Sales Representative)',
              avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
              desc: 'จำกัดขอบเขตงานเฉพาะตรวจสอบบันทึกยอดขายรายวันและคำนวณสถิติยอดรวมเป้าหมายรายปี',
              color: 'from-blue-550 to-sky-600 bg-blue-500/10'
            }
          ];
          setUsers(DEFAULT_USERS);
          localStorage.setItem('sapphire_users', JSON.stringify(DEFAULT_USERS));
          finalUsers = DEFAULT_USERS;
          await saveKeyToCloud('users', DEFAULT_USERS);
        }

        // 2. Fetch Permissions from Cloud Firestore
        const cloudPermissions = await fetchKeyFromCloud('role_permissions');
        if (cloudPermissions && typeof cloudPermissions === 'object') {
          setRolePermissions(cloudPermissions);
          localStorage.setItem('sapphire_role_permissions', JSON.stringify(cloudPermissions));
          finalPerms = cloudPermissions;
        } else {
          // No cloud permissions, initialize stable defaults
          const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
            admin: [
              'dashboard', 'settings', 'registry', 'employees', 'leave',
              'sales-daily', 'sales-monthly', 'sales-yearly',
              'cheque-incoming', 'cheque-outgoing', 'users'
            ],
            hr: [
              'dashboard', 'registry', 'employees', 'leave', 'users'
            ],
            accountant: [
              'dashboard', 'employees', 'cheque-incoming', 'cheque-outgoing',
              'sales-daily', 'sales-monthly', 'sales-yearly', 'users'
            ],
            sales: [
              'dashboard', 'sales-daily', 'sales-monthly', 'sales-yearly', 'users'
            ],
            employee: [
              'employee-leave'
            ]
          };
          setRolePermissions(DEFAULT_PERMISSIONS);
          localStorage.setItem('sapphire_role_permissions', JSON.stringify(DEFAULT_PERMISSIONS));
          finalPerms = DEFAULT_PERMISSIONS;
          await saveKeyToCloud('role_permissions', DEFAULT_PERMISSIONS);
        }

        setCloudSyncState('success');
      } catch (error) {
        console.error('[Firebase Sync Users] Initial cloud sync error, falling back to Local Storage:', error);
        setCloudSyncState('error');

        // Fallback to local storage
        const savedUsers = localStorage.getItem('sapphire_users');
        if (savedUsers) {
          try {
            setUsers(JSON.parse(savedUsers));
          } catch (e) {
            initializeDefaultUsers();
          }
        } else {
          initializeDefaultUsers();
        }

        const savedPermissions = localStorage.getItem('sapphire_role_permissions');
        if (savedPermissions) {
          try {
            setRolePermissions(JSON.parse(savedPermissions));
          } catch (e) {
            initializeDefaultPermissions();
          }
        } else {
          initializeDefaultPermissions();
        }
      }
    };

    fetchCloudData();
  }, []);

  // Listen for storage change events to trigger UI update (especially after dynamic cloud restore)
  useEffect(() => {
    const handleSyncReset = () => {
      const savedUsers = localStorage.getItem('sapphire_users');
      if (savedUsers) {
        try {
          setUsers(JSON.parse(savedUsers));
        } catch (e) {}
      }
      const savedPerms = localStorage.getItem('sapphire_role_permissions');
      if (savedPerms) {
        try {
          setRolePermissions(JSON.parse(savedPerms));
        } catch (e) {}
      }
    };
    window.addEventListener('sapphire_storage_updated', handleSyncReset);
    return () => window.removeEventListener('sapphire_storage_updated', handleSyncReset);
  }, []);

  const initializeDefaultUsers = () => {
    const DEFAULT_USERS: TestUser[] = [
      {
        username: 'admin',
        password: 'admin123',
        displayName: 'อภิวัฒน์ เกียรติสกุล',
        role: 'admin',
        department: 'ฝ่ายบริหาร (Management)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        desc: 'เข้าถึงสิทธิ์ผู้เข้าดูแลระบบ (Full Admin Access) สามารถดูและแก้ไขได้ทุกโมดูล',
        color: 'from-amber-550 to-orange-600 bg-amber-500/10'
      },
      {
        username: 'hr',
        password: 'hr123',
        displayName: 'นพเก้า มิ่งขวัญศิริ',
        role: 'hr',
        department: 'ทรัพยากรบุคคล (HR Dept)',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        desc: 'งานบริหารจัดการพนักงาน บันทึกการเข้างาน-เวลามาสาย แจ้งใบลา และสลิปเงินเดือนเบื้องต้น',
        color: 'from-emerald-550 to-teal-600 bg-emerald-500/10'
      },
      {
        username: 'accountant',
        password: 'acc123',
        displayName: 'ศรุตรา เลียบคงเกียรติ',
        role: 'accountant',
        department: 'บัญชีและการเงิน (Accounting)',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        desc: 'สำหรับฝ่ายบัญชี จัดการสถิติยอดรายวัน รายเดือน สิทธิและสารสนเทศระบบควบคุมเรื่องเช็ครับ-จ่าย',
        color: 'from-indigo-550 to-purple-600 bg-indigo-500/10'
      },
      {
        username: 'sales',
        password: 'sales123',
        displayName: 'ธีรเดช ตันติเวชกุล',
        role: 'sales',
        department: 'พนักงานขายหน้าร้าน (Sales Representative)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        desc: 'จำกัดขอบเขตงานเฉพาะตรวจสอบบันทึกยอดขายรายวันและคำนวณสถิติยอดรวมเป้าหมายรายปี',
        color: 'from-blue-550 to-sky-600 bg-blue-500/10'
      },
    ];
    setUsers(DEFAULT_USERS);
    localStorage.setItem('sapphire_users', JSON.stringify(DEFAULT_USERS));
    if (typeof (window as any).triggerSapphireLocalUpdate === 'function') {
      (window as any).triggerSapphireLocalUpdate('users', DEFAULT_USERS);
    }
    saveKeyToCloud('users', DEFAULT_USERS).catch(err => console.error('[Database] Failed to write default users:', err));
  };

  const initializeDefaultPermissions = () => {
    const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
      admin: [
        'dashboard', 'settings', 'registry', 'employees', 'leave',
        'sales-daily', 'sales-monthly', 'sales-yearly',
        'cheque-incoming', 'cheque-outgoing', 'users'
      ],
      hr: [
        'dashboard', 'registry', 'employees', 'leave', 'users'
      ],
      accountant: [
        'dashboard', 'employees', 'cheque-incoming', 'cheque-outgoing',
        'sales-daily', 'sales-monthly', 'sales-yearly', 'users'
      ],
      sales: [
        'dashboard', 'sales-daily', 'sales-monthly', 'sales-yearly', 'users'
      ],
      employee: [
        'employee-leave'
      ]
    };
    setRolePermissions(DEFAULT_PERMISSIONS);
    localStorage.setItem('sapphire_role_permissions', JSON.stringify(DEFAULT_PERMISSIONS));
    if (typeof (window as any).triggerSapphireLocalUpdate === 'function') {
      (window as any).triggerSapphireLocalUpdate('role_permissions', DEFAULT_PERMISSIONS);
    }
    saveKeyToCloud('role_permissions', DEFAULT_PERMISSIONS).catch(err => console.error('[Database] Failed to write default permissions:', err));
  };

  // Switch dynamic presets for departments based on selecting different roles
  const handleRoleSelectionChange = (newRole: UserRole) => {
    setRole(newRole);
    setCreationCustomTabs(rolePermissions[newRole] || []);
    if (newRole === 'admin') {
      setDepartment('ฝ่ายบริหารงานหลัก (Management & HQ)');
      setDesc('มีสิทธิ์ดูแลระบบ ควบคุมนโยบาย จัดทำรายชื่อพนักงาน ตรวจเช็คข้อมูลทั้งหมด');
    } else if (newRole === 'hr') {
      setDepartment('ทรัพยากรบุคคลปัญาพัฒนา (HR Dept)');
      setDesc('ดูแลข้อมูลประวัติพนักงาน อนุมัติวันลาทำงาน และจดสถิติการลางานสายของบุคลากร');
    } else if (newRole === 'accountant') {
      setDepartment('บัญชี-การเงินประจำปี (Accounting)');
      setDesc('จัดทำข้อมูลเงินเดือนพนักงาน บันทึกเคลียร์เช็คขารับ/เช็คขาจ่าย และดูแผนกยอดขายสะสมเดือน');
    } else {
      setDepartment('ฝ่ายขายและการจัดส่งอาหาร (Sales Representative)');
      setDesc('บันทึกยอดจำหน่ายสินค้าหน้าร้านรายวัน และดูเป้าหมายศักยภาพสติถิสัดส่วนทางสถิติ');
    }
  };

  useEffect(() => {
    if (rolePermissions && role && creationCustomTabs.length === 0) {
      setCreationCustomTabs(rolePermissions[role] || []);
    }
  }, [rolePermissions]);

  // Save Role permissions grid changes
  const togglePermission = (roleKey: UserRole, tabValue: string) => {
    if (roleKey === 'admin' && tabValue === 'users') {
      // Admin should always have 'users' tab permission, block toggling to prevent lockouts
      showTemporaryAlert('error', '⚠️ เพื่อป้องกันการล็อกเอ้าท์ระบบ บทบาท Admin ต้องมีสิทธิ์เข้าถึงเมนูจัดการผู้ใช้อยู่เสมอ');
      return;
    }

    const currentList = rolePermissions[roleKey] || [];
    let updatedList: string[];

    if (currentList.includes(tabValue)) {
      updatedList = currentList.filter(t => t !== tabValue);
    } else {
      updatedList = [...currentList, tabValue];
    }

    const updatedPermissions = {
      ...rolePermissions,
      [roleKey]: updatedList
    };

    setRolePermissions(updatedPermissions);
    localStorage.setItem('sapphire_role_permissions', JSON.stringify(updatedPermissions));
    if (typeof (window as any).triggerSapphireLocalUpdate === 'function') {
      (window as any).triggerSapphireLocalUpdate('role_permissions', updatedPermissions);
    }
    
    // Save to Cloud Firestore Database
    setCloudSyncState('loading');
    saveKeyToCloud('role_permissions', updatedPermissions)
      .then(() => setCloudSyncState('success'))
      .catch(err => {
        console.error('[Database] Failed to save permissions to cloud:', err);
        setCloudSyncState('error');
      });

    // Dispatch general custom event so any loaded sidebar navigations rebuild dynamically
    window.dispatchEvent(new Event('sapphire_permissions_updated'));
    showTemporaryAlert('success', `💾 เซฟความปลอดภัยบันทึกลงฐานข้อมูลคลาวด์ แผนก ${roleKey.toUpperCase()} แล้ว!`);
  };

  const showTemporaryAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Add Custom User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim() || !displayName.trim()) {
      showTemporaryAlert('error', '❌ กรุณาป้อนข้อมูล ชื่อบัญชี, รหัสผ่าน และขื่อ-นามสกุลจริง ให้ครบถ้วน');
      return;
    }

    const checkLowerUsername = username.trim().toLowerCase();
    const isExisted = users.some(u => u.username.toLowerCase() === checkLowerUsername);

    if (isExisted) {
      showTemporaryAlert('error', `❌ ชื่อเข้าใช้งาน "${username.trim()}" ถูกใช้งานไปแล้วในระบบ กรุณาใช้ชื่ออื่น`);
      return;
    }

    const newUser: TestUser = {
      username: checkLowerUsername,
      password: password,
      displayName: displayName.trim(),
      role: role,
      department: department.trim(),
      avatarUrl: avatarUrl,
      desc: desc.trim(),
      color: role === 'admin' ? 'from-amber-550 to-orange-600 bg-amber-500/10' :
             role === 'hr' ? 'from-emerald-550 to-teal-600 bg-emerald-500/10' :
             role === 'accountant' ? 'from-indigo-550 to-purple-600 bg-indigo-500/10' :
             'from-blue-550 to-sky-600 bg-blue-500/10',
      allowedTabs: creationUseCustomPermissions ? creationCustomTabs : undefined
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('sapphire_users', JSON.stringify(updatedUsers));
    if (typeof (window as any).triggerSapphireLocalUpdate === 'function') {
      (window as any).triggerSapphireLocalUpdate('users', updatedUsers);
    }

    // Save to Cloud Firestore Database
    setCloudSyncState('loading');
    saveKeyToCloud('users', updatedUsers)
      .then(() => setCloudSyncState('success'))
      .catch(err => {
        console.error('[Database] Failed to save added user to cloud:', err);
        setCloudSyncState('error');
      });

    // Clear Form Fields
    setUsername('');
    setPassword('');
    setDisplayName('');
    setCreationUseCustomPermissions(false);
    setCreationCustomTabs(rolePermissions[role] || []);
    showTemporaryAlert('success', `🎉 สร้างผู้ใช้งานใหม่ "${newUser.displayName}" บันทึกลงระบบคลาวด์สำเร็จแล้ว!`);
  };

  // Delete User
  const handleDeleteUser = (userToDelete: string) => {
    // Check if the current user has "admin" role
    if (currentSessionRole !== 'admin') {
      alert('❌ สิทธิ์ไม่พอ: ต้องเป็นผู้ใช้งานระดับ Admin เท่านั้นจึงจะสามารถลบบัญชีผู้ใช้ได้');
      return;
    }

    // Basic protections - do not delete the currently active logged in user or default primary accounts to sustain safety
    if (userToDelete.toLowerCase() === currentSessionUsername.toLowerCase()) {
      showTemporaryAlert('error', '❌ ไม่สามารถลบบัญชีที่คุณกำลังล็อกอินใช้งานค้างอยู่ได้');
      return;
    }

    // Confirmation pop-up before deleting
    const confirmMessage = `❓ คุณต้องการยืนยันการลบบัญชีผู้ใช้ "${userToDelete}" ออกจากระบบและฐานข้อมูลใช่หรือไม่?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    const filtered = users.filter(u => u.username.toLowerCase() !== userToDelete.toLowerCase());
    setUsers(filtered);
    localStorage.setItem('sapphire_users', JSON.stringify(filtered));
    if (typeof (window as any).triggerSapphireLocalUpdate === 'function') {
      (window as any).triggerSapphireLocalUpdate('users', filtered);
    }

    // Save to Cloud Firestore Database
    setCloudSyncState('loading');
    saveKeyToCloud('users', filtered)
      .then(() => setCloudSyncState('success'))
      .catch(err => {
        console.error('[Database] Failed to delete user from cloud:', err);
        setCloudSyncState('error');
      });

    showTemporaryAlert('success', `🗑️ ลบชื่อผู้ใช้ "${userToDelete}" ออกจากฐานข้อมูลคลาวด์สำเร็จแล้ว`);
  };

  const handleStartEditUser = (u: TestUser) => {
    setUserToEdit(u);
    setEditDisplayName(u.displayName);
    setEditPassword(u.password);
    setEditRole(u.role);
    setEditDepartment(u.department);
    setEditAvatarUrl(u.avatarUrl);
    setEditCustomAvatar(false);
    setEditDesc(u.desc || '');
    if (u.allowedTabs) {
      setEditUseCustomProps(true);
      setEditCustomTabs(u.allowedTabs);
    } else {
      setEditUseCustomProps(false);
      setEditCustomTabs(rolePermissions[u.role] || []);
    }
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (!editDisplayName.trim() || !editPassword.trim()) {
      showTemporaryAlert('error', '❌ กรุณากรอกข้อมูล ชื่อแสดงผลและรหัสผ่าน');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.username.toLowerCase() === userToEdit.username.toLowerCase()) {
        return {
          ...u,
          displayName: editDisplayName.trim(),
          password: editPassword.trim(),
          role: editRole,
          department: editDepartment.trim(),
          avatarUrl: editAvatarUrl,
          desc: editDesc.trim(),
          allowedTabs: editUseCustomProps ? editCustomTabs : undefined
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem('sapphire_users', JSON.stringify(updatedUsers));
    if (typeof (window as any).triggerSapphireLocalUpdate === 'function') {
      (window as any).triggerSapphireLocalUpdate('users', updatedUsers);
    }

    // Save to Cloud Firestore Database
    setCloudSyncState('loading');
    saveKeyToCloud('users', updatedUsers)
      .then(() => setCloudSyncState('success'))
      .catch(err => {
        console.error('[Database] Failed to save edited user to cloud:', err);
        setCloudSyncState('error');
      });

    // Update active session metadata if user edited themselves
    if (userToEdit.username.toLowerCase() === currentSessionUsername.toLowerCase()) {
      const savedSession = localStorage.getItem('sapphire_hr_session');
      if (savedSession) {
        try {
          const s = JSON.parse(savedSession);
          const newSession = {
            ...s,
            displayName: editDisplayName.trim(),
            role: editRole,
            department: editDepartment.trim(),
            avatarUrl: editAvatarUrl
          };
          localStorage.setItem('sapphire_hr_session', JSON.stringify(newSession));
        } catch (err) {}
      }
    }

    window.dispatchEvent(new Event('sapphire_permissions_updated'));
    setUserToEdit(null);
    showTemporaryAlert('success', `💾 บันทึกและซิงค์การแก้ไขสิทธิ์ของ "${editDisplayName}" ลงระบบตารางเรียบร้อย!`);
  };

  const handleResetDefaults = () => {
    if (confirm('คุณแน่ใจว่าต้องการรีเซ็ตบทบาทความปลอดภัย บัญชีผู้ใช้งาน และสร้างตารางลงฐานข้อมูลคลาวด์กลับสู่ค่าเริ่มต้นโรงงาน?')) {
      initializeDefaultUsers();
      initializeDefaultPermissions();
      showTemporaryAlert('success', '🔄 รีเซ็ตตารางผู้ใช้งานและตารางสิทธิ์ลงคลาวด์กลับสู่มาตรฐานสำเร็จแล้ว');
      window.dispatchEvent(new Event('sapphire_permissions_updated'));
    }
  };

  // Filtered users for our high-fidelity detailed table
  const filteredTableUsers = users.filter((u) => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(tableSearch.toLowerCase()));
    
    const matchesRole = tableRoleFilter === 'all' || u.role === tableRoleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 font-sans">
      
      {/* Upper info banners */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FolderLock className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/40 border border-blue-500/30 text-[11px] font-bold text-blue-300">
            <Lock className="w-3.5 h-3.5" /> Security Panel
          </div>
          <h2 className="text-2xl font-black">ศูนย์สิทธิ์ผู้ใช้และระบบรักษาความปลอดภัย (Users & Permission Control)</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            ระบบบริหารจัดการบัญชีผู้ใช้งานจำลองที่ใช้เทสระบบ พร้มความสามารถในการเปิด/ปิดโมดูล การจัดวางระดับความปลอดภัย (Access Matrix) 
            สำหรับ 4 แผนกตำแหน่งงานหลัก: Admin, HR, Accountant และ Sales
          </p>
        </div>
      </div>

      {/* ALERT BOX BAR */}
      {alert && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-md ${
            alert.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {alert.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0 bg-emerald-100 p-1 rounded-full text-emerald-600" />
          ) : (
            <ShieldAlert className="w-5 h-5 shrink-0 bg-rose-100 p-1 rounded-full text-rose-600" />
          )}
          <span className="text-xs font-bold">{alert.message}</span>
        </motion.div>
      )}

      {/* Grid Layout 12 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Role settings & Permission checklist matrices (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FolderLock className="w-5 h-5 text-indigo-500 animate-pulse" />
                  ตารางกำหนดสิทธิ์การเข้าถึงโมดูล (Role Access Matrix)
                </h3>
                <span className="text-[11px] text-slate-450 block font-semibold mt-0.5">ติ๊กหรือยกเลิกการติ๊กเพื่อเพิ่ม/จำกัด การใช้งานของแต่ละแผนกสถิติได้ทันที</span>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg"
              >
                <RefreshCcw className="w-3 h-3" /> คืนค่ามาตรฐานทั้งหมด
              </button>
            </div>

            {/* Matrix tables implementation */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                    <th className="p-3 text-xs">โมดูลระบบแผงควบคุม</th>
                    {ALL_ROLES.map(roleItem => (
                      <th key={roleItem.value} className="p-3 text-center text-[10.5px]">
                        {roleItem.label.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {MODULE_TABS.map((moduleItem) => (
                    <tr key={moduleItem.value} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">
                        <div>
                          <span className="text-slate-900 block font-bold">{moduleItem.label}</span>
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold mt-1 inline-block">
                            หมวดหมู่: {moduleItem.category}
                          </span>
                        </div>
                      </td>
                      {ALL_ROLES.map((roleItem) => {
                        const isChecked = (rolePermissions[roleItem.value] || []).includes(moduleItem.value);
                        const isDisabled = roleItem.value === 'admin' && moduleItem.value === 'users';
                        return (
                          <td key={roleItem.value} className="p-3 text-center">
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={() => togglePermission(roleItem.value, moduleItem.value)}
                              className={`mx-auto w-5.5 h-5.5 rounded flex items-center justify-center transition-all border ${
                                isChecked 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                  : 'bg-slate-100 border-slate-300 text-transparent hover:border-slate-400'
                              } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix notice context */}
            <div className="flex gap-2.5 p-3.5 bg-indigo-50/50 border border-indigo-100/65 rounded-xl text-[11px] leading-relaxed text-indigo-900 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
              <span>
                💡 ข้อมูลของบทบาทจะได้รับการบันทึกผ่านระบบ <strong>Local Cache</strong> อัตโนมัติ หากมีพนักงานล็อกอินด้วยสิทธิ์นั้น เมนูปิดบังต่างๆ บนแถบด้านซ้ายและแถบมือถือจะซิงค์ปิดการมองเห็นและจำกัดความปลอดภัยในการกดเข้าหน้านั้นๆ ทันที
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Users Add Form & Registry summary Lists (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* A. User creation form card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              สร้างรหัสผู้เข้าใช้งานใหม่ (Create Simulator Account)
            </h3>

            <form onSubmit={handleAddUser} className="space-y-4">
              
              {/* Account fields */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">บัญชีล็อกอิน (Username)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น apiwat"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">รหัสผ่าน (Password)</label>
                  <input
                    type="text"
                    required
                    placeholder="รหัสผ่านเข้าใช้"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Display name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">ชื่อแสดงผลจริง (Full Display Name)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายอรรถพล พารวย"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              {/* Role Select options */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 font-black mb-1 block">เลือกสิทธิ์/บทบาทงาน (User Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map((roleOpt) => {
                    const isSelected = role === roleOpt.value;
                    return (
                      <button
                        key={roleOpt.value}
                        type="button"
                        onClick={() => handleRoleSelectionChange(roleOpt.value)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isSelected 
                            ? 'bg-indigo-55/70 border-indigo-600 ring-1 ring-indigo-500/20' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[11.5px] font-extrabold text-slate-900 block">{roleOpt.label.split(' ')[0]}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{roleOpt.label.split(' ')[1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">แผนกประจำตัว (Department):</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ฝ่ายบริหารงานคลัง"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700"
                />
              </div>

              {/* Avatar options picker */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span>เลือกรูปโปรไฟล์จำลอง (Profile Image)</span>
                  <button
                    type="button"
                    onClick={() => setCustomAvatarInput(!customAvatarInput)}
                    className="text-indigo-600 text-[10px] uppercase font-bold hover:underline"
                  >
                    {!customAvatarInput ? 'กรอก URL อิสระ' : 'เลือกรูปจำลอง'}
                  </button>
                </div>

                {!customAvatarInput ? (
                  <div className="flex flex-wrap gap-2.5 p-2 bg-slate-100/50 rounded-xl justify-between">
                    {PRESET_AVATARS.map((pUrl, index) => {
                      const isSelected = avatarUrl === pUrl;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setAvatarUrl(pUrl)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform shrink-0 ${
                            isSelected ? 'border-indigo-600 scale-110 shadow' : 'border-transparent opacity-70 hover:opacity-100'
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
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                )}
              </div>

              {/* Summary Description info */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">คติ/คำอธิบายบัญชี (Optional Note)</label>
                <input
                  type="text"
                  placeholder="คำอธิบายสิทธิ์บัญชี"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Custom Specific Permissions selection for user creation */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700">⚙️ สิทธิ์การใช้งานบัญชีเฉพาะตัว (Custom Permissions)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const enabled = !creationUseCustomPermissions;
                      setCreationUseCustomPermissions(enabled);
                      if (enabled) {
                        setCreationCustomTabs(rolePermissions[role] || []);
                      }
                    }}
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-black border transition-all cursor-pointer ${
                      creationUseCustomPermissions
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-350'
                    }`}
                  >
                    {creationUseCustomPermissions ? '✓ เปิดสิทธิ์กำหนดเอง' : 'ใช้ตามบทบาทงาน'}
                  </button>
                </div>
                
                {creationUseCustomPermissions ? (
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 max-h-[160px] overflow-y-auto">
                    <span className="text-[9px] text-amber-800 font-extrabold uppercase leading-none block mb-1">
                      เลือกสิทธิ์การเข้าถึงโมดูล (ติ๊กสำหรับบัญชีนี้)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MODULE_TABS.map(tab => {
                        const isChecked = creationCustomTabs.includes(tab.value);
                        return (
                          <label key={tab.value} className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-slate-700 font-semibold">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setCreationCustomTabs(creationCustomTabs.filter(t => t !== tab.value));
                                } else {
                                  setCreationCustomTabs([...creationCustomTabs, tab.value]);
                                }
                              }}
                              className="w-3.5 h-3.5 accent-amber-500 rounded text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="truncate">{tab.label.replace(/^[^\s]+\s/, '')}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic font-semibold pl-1">
                    * บัญชีนี้จะใช้สิทธิ์ร่วมตามระดับบทบาทงาน ({role.toUpperCase()}) ทั่วไปของระบบโดยออโต้
                  </p>
                )}
              </div>

              {/* Submission button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow shadow-indigo-500/10 flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.2"
              >
                <UserPlus className="w-4 h-4" />
                <span>สร้างรหัสเข้าใช้งานและเตรียมสิทธิ์</span>
              </button>

            </form>
          </div>

          {/* B. All Accounts List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-5 h-5 text-indigo-500" />
              รายชื่อบัญชีทั้งหมดในระบบ ({users.length})
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {users.map((u) => {
                const isActive = u.username.toLowerCase() === currentSessionUsername.toLowerCase();
                const roleBadge = ALL_ROLES.find(r => r.value === u.role);
                
                return (
                  <div
                    key={u.username}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isActive 
                        ? 'bg-indigo-50/50 border-indigo-150' 
                        : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={u.avatarUrl} 
                        alt={u.displayName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-900 truncate">{u.displayName}</h4>
                          {isActive && (
                            <span className="text-[8px] bg-indigo-600 text-white font-black px-1.5 py-0.2 rounded uppercase shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[8.5px] font-mono font-bold text-slate-450 bg-slate-100 px-1 py-0.2 rounded text-slate-500">
                            u: {u.username} (p: {u.password})
                          </span>
                          <span className={`text-[8.5px] font-black border uppercase px-1 py-0.2 rounded inline-block shrink-0 ${
                            u.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            u.role === 'hr' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            u.role === 'accountant' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[180px] font-semibold">
                          {u.department}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons list */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleStartEditUser(u)}
                        title="แก้ไขโปรไฟล์และสิทธิ์ของบัญชีจำลองนี้"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-indigo-55/70 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <UserCog className="w-3.5 h-3.5 animate-pulse" />
                      </button>

                      {/* Delete button option */}
                      <button
                        type="button"
                        disabled={isActive}
                        onClick={() => handleDeleteUser(u.username)}
                        title={isActive ? 'ไม่สามารถลบบัญชีที่คุณใช้อยู่ได้' : 'ลบบัญชีผู้ใช้'}
                        className={`p-1.5 rounded-lg transition-colors border ${
                          isActive 
                            ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'bg-white border-slate-200/80 hover:bg-rose-50 hover:border-rose-350 text-slate-400 hover:text-rose-600 cursor-pointer'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* GLORIOUS DETAILED TABLE SECT - ทะเบียนตารางบัญชีผู้ใช้ระบบ (Database Account Registry) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mt-8">
        
        {/* Table Header Section */}
        <div className="p-6 border-b border-slate-150 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  ทะเบียนตารางบัญชีผู้ใช้งานฐานข้อมูลคลาวด์ 
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    ทั้งหมด {users.length} บัญชี
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  ตารางรายงานและเครื่องมือจัดการข้อมูลผู้ใช้แบบรวมศูนย์ ซิงโครไนซ์เรียลไทม์กับฐานข้อมูล Google Cloud Firestore
                </p>
              </div>
            </div>
          </div>

          {/* Database Connection Status Block */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-[11px] font-extrabold ${
              cloudSyncState === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : cloudSyncState === 'loading'
                ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span>
                {cloudSyncState === 'success' && 'ซิงค์ฐานข้อมูลสำเร็จ (Real-time DB Online)'}
                {cloudSyncState === 'loading' && 'กำลังอัปเดตข้อมูลลง Cloud...'}
                {cloudSyncState === 'error' && 'ฐานข้อมูลออฟไลน์ (Local Storage Only)'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                cloudSyncState === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`} />
            </div>

            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 text-xs font-black bg-white select-none cursor-pointer border border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              คืนค่าโรงงาน
            </button>
          </div>
        </div>

        {/* Filter Toolbar Section */}
        <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* A. Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ-สกุลจริง, ชื่อบัญชี, สังกัดหน่วยงาน..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
            />
          </div>

          {/* B. Role Filters Tab-Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" />
              กรองตามระดับ:
            </span>
            {[
              { value: 'all', label: 'ทั้งหมด (All)' },
              { value: 'admin', label: 'Admin' },
              { value: 'hr', label: 'HR' },
              { value: 'accountant', label: 'Accountant' },
              { value: 'sales', label: 'Sales' }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setTableRoleFilter(btn.value as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all select-none border shrink-0 ${
                  tableRoleFilter === btn.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real HTML Table Design */}
        <div className="overflow-x-auto">
          {filteredTableUsers.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-6">โปรไฟล์ & ชื่อแสดงผลจริง</th>
                  <th className="py-3 px-6">ชื่อเข้าใช้งาน (Username)</th>
                  <th className="py-3 px-6">รหัสผ่าน (Password)</th>
                  <th className="py-3 px-6">ระดับบทบาท</th>
                  <th className="py-3 px-6">สังกัด / แผนกงาน</th>
                  <th className="py-3 px-6">ขอบเขตโมดูลสิทธิ์</th>
                  <th className="py-3 px-6 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTableUsers.map((u) => {
                  const isActive = u.username.toLowerCase() === currentSessionUsername.toLowerCase();
                  
                  // Menus count indicator
                  const allowedMenuCount = u.allowedTabs 
                    ? u.allowedTabs.length 
                    : (rolePermissions[u.role] || []).length;

                  // Custom badge styles
                  const roleBadgeColors = u.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                           u.role === 'hr' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                           u.role === 'accountant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                           'bg-blue-50 text-blue-700 border-blue-200';

                  return (
                    <tr 
                      key={u.username} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isActive ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* 1. Real Display Name and Photo */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={u.displayName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-150 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                              {u.displayName}
                              {isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-blue-500 text-white font-bold rounded-full animate-pulse whitespace-nowrap">
                                  ตัวคุณ
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate" title={u.desc}>
                              {u.desc || 'ไม่มีคำอธิบายเพิ่มเติม'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Username */}
                      <td className="py-4 px-6 font-mono text-sm text-slate-600 font-semibold select-all">
                        {u.username}
                      </td>

                      {/* 3. Password */}
                      <td className="py-4 px-6 font-mono text-sm text-slate-800 select-all">
                        <div className="flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.password}</span>
                        </div>
                      </td>

                      {/* 4. Role Badges */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-black rounded-lg border uppercase tracking-wider ${roleBadgeColors}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      {/* 5. Department */}
                      <td className="py-4 px-6 text-xs text-slate-600 truncate max-w-[180px]">
                        {u.department || '-'}
                      </td>

                      {/* 6. Tabs allowed length */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${allowedMenuCount > 6 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-xs font-bold text-slate-700">
                            เปิด {allowedMenuCount} เมนูบริหาร
                          </span>
                          {u.allowedTabs && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-extrabold rounded-full" title="สิทธิ์การใช้งานของบัญชีนี้ถูกกำหนดพิเศษเฉพาะรายบุคคล">
                              (พิเศษเฉพาะ)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Action options */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          <button
                            type="button"
                            onClick={() => handleStartEditUser(u)}
                            title="แก้ไขชื่อ/สิทธิ์ผู้ใช้งาน"
                            className="p-1 px-2.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-250 text-indigo-600 hover:text-indigo-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            แก้ไข
                          </button>

                          <button
                            type="button"
                            disabled={isActive}
                            onClick={() => handleDeleteUser(u.username)}
                            title={isActive ? 'ไม่สามารถลบบัญชีที่คุณใชู้อยู่ได้' : 'ลบบัญชีผู้ใช้'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isActive 
                                ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' 
                                : 'bg-slate-50 border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600 cursor-pointer'
                            }`}
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
          ) : (
            <div className="py-12 px-6 text-center space-y-2">
              <ShieldAlert className="w-10 h-10 text-slate-450 mx-auto" />
              <h4 className="text-sm font-black text-slate-700">ไม่พบข้อมูลบัญชีผู้ใช้งานที่ค้นหา</h4>
              <p className="text-xs text-slate-450 max-w-sm mx-auto">
                ไม่พบคู่ที่ตรงกับการสะกดข้อความค้นหา หรือระดับแผนกงานที่เลือกในระเบียนตารางผู้ใช้งานขณะนี้
              </p>
            </div>
          )}
        </div>

      </div>

      {/* USER EDIT MODAL OVERLAY */}
      {userToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* Backdrop click close */}
          <div className="fixed inset-0" onClick={() => setUserToEdit(null)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-indigo-300" />
                  แก้ไขโปรไฟล์ & กำหนดสิทธิ์ผู้ใช้ (User: {userToEdit.username})
                </h3>
                <span className="text-[10px] text-indigo-200 font-bold block mt-0.5">
                  ปรับปรุงรหัสผ่าน บัญชี และสิทธิ์อนุมัติพิเศษรายบุคคลได้ทีนี่
                </span>
              </div>
              <button
                onClick={() => setUserToEdit(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-indigo-100 font-black text-xs flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSaveUserEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Display name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">ชื่อแสดงผลจริง (Display Name)</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">รหัสผ่านบัญชี (Password)</label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-slate-800"
                />
              </div>

              {/* Role select */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">เลือกสิทธิ์/บทบาทหน้าที่งาน (User Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map((roleOpt) => {
                    const isSelected = editRole === roleOpt.value;
                    return (
                      <button
                        key={roleOpt.value}
                        type="button"
                        onClick={() => {
                          setEditRole(roleOpt.value);
                          if (!editUseCustomProps) {
                            setEditCustomTabs(rolePermissions[roleOpt.value] || []);
                          }
                        }}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-500/10' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[11px] font-black text-slate-900 block">{roleOpt.label.split(' ')[0]}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{roleOpt.label.split(' ')[1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">แผนกสังกัด (Department):</label>
                <input
                  type="text"
                  required
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                />
              </div>

              {/* Avatar Url selection */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span>เลือกรูปโปรไฟล์จำลอง (Profile Image)</span>
                  <button
                    type="button"
                    onClick={() => setEditCustomAvatar(!editCustomAvatar)}
                    className="text-indigo-600 text-[10px] uppercase font-bold hover:underline cursor-pointer"
                  >
                    {!editCustomAvatar ? 'กรอก URL อิสระ' : 'เลือกรูปจำลอง'}
                  </button>
                </div>

                {!editCustomAvatar ? (
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-100/50 rounded-xl justify-between">
                    {PRESET_AVATARS.map((pUrl, index) => {
                      const isSelected = editAvatarUrl === pUrl;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setEditAvatarUrl(pUrl)}
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
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                )}
              </div>

              {/* Desc Option */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">คติ/คำอธิบายบัญชี (Optional Note)</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              {/* Custom Specific Permissions selection for user editing */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-700">⚙️ สิทธิ์การเข้าใช้งานพิเศษเฉพาะรายบุคคล (Custom Sights)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const enabled = !editUseCustomProps;
                      setEditUseCustomProps(enabled);
                      if (enabled) {
                        setEditCustomTabs(rolePermissions[editRole] || []);
                      }
                    }}
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-black border transition-all cursor-pointer ${
                      editUseCustomProps
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-350'
                    }`}
                  >
                    {editUseCustomProps ? '✓ สิทธิ์กำหนดเฉพาะตัว' : 'ใช้ตามบทบาทตำแหน่ง'}
                  </button>
                </div>
                
                {editUseCustomProps ? (
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1.5 max-h-[160px] overflow-y-auto">
                    <span className="text-[9px] text-amber-800 font-extrabold uppercase leading-none block mb-1">
                      ติ๊กถูกเพื่อเปิดสิทธิ์ความเข้าถึงหน้านั้นๆ
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MODULE_TABS.map(tab => {
                        const isChecked = editCustomTabs.includes(tab.value);
                        return (
                          <label key={tab.value} className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-slate-700 font-semibold">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setEditCustomTabs(editCustomTabs.filter(t => t !== tab.value));
                                } else {
                                  setEditCustomTabs([...editCustomTabs, tab.value]);
                                }
                              }}
                              className="w-3.5 h-3.5 accent-amber-500 rounded text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="truncate">{tab.label.replace(/^[^\s]+\s/, '')}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic font-semibold pl-1">
                    * บัญชีนี้จะซิงค์สิทธิหลักตามบทบาทแผนกงาน ({editRole.toUpperCase()}) อัตโนมัติทุกโมดูล
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="flex-1 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow shadow-indigo-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  บันทึกการแก้ไข
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
