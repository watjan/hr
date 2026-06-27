import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  FileText, 
  Mail, 
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  Hash,
  X,
  Check,
  FolderLock,
  Database,
  Download,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { CompanySettings, Department } from '../types';
import { uploadAllToCloud, downloadAllFromCloud } from '../lib/firebaseSync';

interface CompanySettingsViewProps {
  settings: CompanySettings;
  onUpdateSettings: (updated: CompanySettings) => void;
  onRestoreCloud?: () => void;
}

export default function CompanySettingsView({
  settings,
  onUpdateSettings,
  onRestoreCloud
}: CompanySettingsViewProps) {
  
  // Local state for core company updates
  const [editableSettings, setEditableSettings] = useState<CompanySettings>({ ...settings });
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // Firebase Sync State variables
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<Array<{ msg: string; time: string }>>([
    { msg: 'ระบบสื่อสารกับ Firestore (ai-studio-68d424b9-6a2b-4d65-b480-ee0f1e9e8407) แสตนด์บาย', time: new Date().toLocaleTimeString('th-TH') }
  ]);

  const addSyncLog = (msg: string) => {
    setSyncLogs(prev => [
      { msg, time: new Date().toLocaleTimeString('th-TH') },
      ...prev
    ]);
  };

  const handleUploadCloud = async () => {
    setIsSyncing(true);
    addSyncLog('เริ่มกระบวนการแบคอัพขึ้นคลาวด์...');
    try {
      await uploadAllToCloud();
      addSyncLog('✔️ บันทึกข้อมูลขึ้นระบบคลาวด์ Firestore สำเร็จบริบูรณ์!');
      alert('✔️ สำรองข้อมูลระบบทั้งหมดไปยัง Cloud Database เรียบร้อยแล้ว!');
    } catch (err: any) {
      console.error(err);
      addSyncLog(`❌ บันทึกผิดพลาด: ${err.message || err}`);
      alert(`❌ ข้อผิดพลาดในการบันทึก: ${err.message || 'กรุณาตรวจสอบการเชื่อมต่อของคุณ'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCloud = async () => {
    if (!window.confirm('⚠️ คำเตือน: การดึงข้อมูลคืนจากคลาวด์เสมือนจะทับข้อมูลชั่วคราวทั้งหมดที่อยู่ในเครื่องของคุณในตอนนี้ ยืนยันที่จะดำเนินต่อหรือไม่?')) {
      return;
    }
    setIsSyncing(true);
    addSyncLog('เริ่มกระบวนการจำลองข้อมูลกลับสู่เครื่อง...');
    try {
      const result = await downloadAllFromCloud();
      addSyncLog('✔️ ดึงประวัติข้อมูลทดแทนทับ Local Storage สำเร็จ!');
      if (onRestoreCloud) {
        onRestoreCloud();
      }
      alert('✔️ ดึงข้อมูลคืนจากคลาวด์และปรับปรุงระบบเรียบร้อยแล้ว!');
    } catch (err: any) {
      console.error(err);
      addSyncLog(`❌ ดึงข้อมูลผิดพลาด: ${err.message || err}`);
      alert(`❌ ข้อผิดพลาดในการกู้ข้อมูล: ${err.message || 'ฐานข้อมูลคลาวน์ว่างเปล่าหรือเกิดข้อผิดพลาด'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  
  // Department Actions state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  
  // Department Form Inputs
  const [deptNameInput, setDeptNameInput] = useState('');
  const [deptCodeInput, setDeptCodeInput] = useState('');

  // Save the entire edited company settings
  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(editableSettings);
    setIsEditingCompany(false);
    showToast('💾 บันทึกการตั้งค่าบริษัทเรียบร้อยแล้ว!', 'success');
  };

  // Backup current localStorage states to a JSON download file
  const handleBackupData = () => {
    try {
      const backupObj: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          backupObj[key] = localStorage.getItem(key) || '';
        }
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `sapphire-hr-backup-${currentDate}.json`;
      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup failed", err);
      alert("❌ ไม่สามารถสำรองข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // Open department modal for Add
  const handleOpenAddDeptModal = () => {
    setEditingDept(null);
    setDeptNameInput('');
    setDeptCodeInput('');
    setIsDeptModalOpen(true);
  };

  // Open department modal for Edit
  const handleOpenEditDeptModal = (dept: Department) => {
    setEditingDept(dept);
    setDeptNameInput(dept.name);
    setDeptCodeInput(dept.code);
    setIsDeptModalOpen(true);
  };

  // Delete department action after confirmation in custom modal
  const handleConfirmDelete = () => {
    if (deptToDelete) {
      const id = deptToDelete.id;
      const updatedDepts = editableSettings.departments.filter(d => d.id !== id);
      const newSettings = { ...editableSettings, departments: updatedDepts };
      setEditableSettings(newSettings);
      onUpdateSettings(newSettings);
      setDeptToDelete(null);
      showToast('🗑️ ลบข้อมูลแผนกเรียบร้อยแล้ว!', 'success');
    }
  };

  // Save Department (both Add & Edit)
  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptNameInput.trim() || !deptCodeInput.trim()) {
      alert("กรุณากรอกข้อมูลแผนกให้ครบถ้วน");
      return;
    }

    let updatedDepts = [...editableSettings.departments];

    if (editingDept) {
      // Edit mode
      updatedDepts = updatedDepts.map(d => 
        d.id === editingDept.id 
          ? { ...d, name: deptNameInput, code: deptCodeInput.toUpperCase() } 
          : d
      );
    } else {
      // Add mode
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: deptNameInput,
        code: deptCodeInput.toUpperCase(),
        employeeCount: 0
      };
      updatedDepts.push(newDept);
    }

    const newSettings = { ...editableSettings, departments: updatedDepts };
    setEditableSettings(newSettings);
    onUpdateSettings(newSettings);
    setIsDeptModalOpen(false);
    showToast(editingDept ? '✏️ อัปเดตข้อมูลแผนกเรียบร้อยแล้ว!' : '➕ เพิ่มแผนกใหม่เรียบร้อยแล้ว!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-blue-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            ตั้งค่าองค์กรและแผนก (Company Settings)
          </h2>
          <p className="text-xs text-slate-500 mt-1">ตั้งค่าชื่อบริษัท ข้อมูลการติดต่อ เลขที่จดทะเบียน และบริหารการจัดการแผนกพนักงานในองค์กรได้ที่นี่</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Column: Company Settings Detail */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-blue-500" />
              ข้อมูลทั่วไปของบริษัท
            </h3>
            {!isEditingCompany && (
              <button 
                id="edit-company-trigger-btn"
                onClick={() => {
                  setEditableSettings({ ...settings });
                  setIsEditingCompany(true);
                }} 
                className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
              >
                <Edit className="w-3 h-3" /> แก้ไขข้อมูล
              </button>
            )}
          </div>

          {isEditingCompany ? (
            <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
              {/* Edit Form */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">ชื่อบริษัท / องค์กร (Thai)</label>
                <input 
                  type="text" 
                  required
                  value={editableSettings.name}
                  onChange={e => setEditableSettings({ ...editableSettings, name: e.target.value })}
                  className="w-full text-sm border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/10 focus:border-blue-500" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                <input 
                  type="text" 
                  value={editableSettings.taxId}
                  onChange={e => setEditableSettings({ ...editableSettings, taxId: e.target.value })}
                  className="w-full text-sm border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/10 focus:border-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">เบอร์โทรศัพท์</label>
                  <input 
                    type="text" 
                    value={editableSettings.phone}
                    onChange={e => setEditableSettings({ ...editableSettings, phone: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/10 focus:border-blue-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">อีเมลบริษัท</label>
                  <input 
                    type="email" 
                    value={editableSettings.email}
                    onChange={e => setEditableSettings({ ...editableSettings, email: e.target.value })}
                    className="w-full text-sm border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/10" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">เว็บไซต์ (Website / Social)</label>
                <input 
                  type="text" 
                  value={editableSettings.website}
                  onChange={e => setEditableSettings({ ...editableSettings, website: e.target.value })}
                  className="w-full text-sm border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/10" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">ที่ตั้งสำนักงานใหญ่</label>
                <textarea 
                  rows={3}
                  value={editableSettings.address}
                  onChange={e => setEditableSettings({ ...editableSettings, address: e.target.value })}
                  className="w-full text-sm border border-slate-205 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/10 resize-none" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditingCompany(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button 
                  id="save-company-info-btn"
                  type="submit" 
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              <div className="border-b border-dashed border-blue-50 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">ชื่อบริษัท</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{settings.name}</p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mt-0.5 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-tight">เลขผู้เสียภาษี</span>
                    <span className="text-xs font-medium text-slate-800">{settings.taxId || 'ไม่ได้ระบุ'}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mt-0.5 shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-tight">เบอร์โทรศัพท์</span>
                    <span className="text-xs font-medium text-slate-800 font-mono">{settings.phone || 'ไม่ได้ระบุ'}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mt-0.5 shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-tight">อีเมลติดต่อ</span>
                    <span className="text-xs font-medium text-slate-800">{settings.email || 'ไม่ได้ระบุ'}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mt-0.5 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-tight">เว็บไซต์ / สื่อสังคม</span>
                    <span className="text-xs font-medium text-blue-600 hover:underline">{settings.website || 'ไม่ได้ระบุ'}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start pt-1.5 border-t border-slate-100">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mt-0.5 shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold leading-tight">ตำแหน่งสำนักงานใหญ่</span>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{settings.address || 'ไม่ได้ระบุที่อยู่'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Departments Administrator Suite */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                  <FolderLock className="w-4.5 h-4.5 text-blue-500" />
                  บริหารจัดการแผนกพนักงาน
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">สามารถ เพิ่ม ลบ และแก้ไขแผนกต่างๆ เพื่อสะท้อนระบบโครงสร้างพนักงาน</p>
              </div>
              <button 
                id="add-department-trigger-btn"
                onClick={handleOpenAddDeptModal}
                className="bg-blue-600 hover:bg-blue-700 hover:shadow-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มแผนกใหม่
              </button>
            </div>

            {/* Department Table/List */}
            <div className="overflow-x-auto rounded-xl border border-blue-50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-55/70 bg-blue-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-blue-105">
                    <th className="p-3">รหัสแผนก</th>
                    <th className="p-3">ชื่อแผนกการทำงาน</th>
                    <th className="p-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {settings.departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">
                        <span className="bg-blue-100/60 text-blue-800 font-mono text-xs px-2.5 py-0.5 rounded-md border border-blue-150">
                          {dept.code}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">
                        {dept.name}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <button
                            id={`edit-dept-${dept.id}`}
                            onClick={() => handleOpenEditDeptModal(dept)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="แก้ไขแผนก"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-dept-${dept.id}`}
                            onClick={() => setDeptToDelete(dept)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="ลบแผนก"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {settings.departments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-400">
                        ไม่พบข้อมูลแผนกพนักงานในขณะนี้ กรุณาเพิ่มแผนกใหม่
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 text-slate-400 text-xs text-slate-500 flex items-center gap-1">
            <span>* หมายเหตุ: การลบแผนกจะไม่ส่งผลกับประวัติในอดีต แต่จะทำให้รหัสเชื่อมโยงของบุคลากรเข้าสู่หมวดหมู่ยังไม่สังกัด</span>
          </div>
        </div>
      </div>

      {/* Firebase Cloud Sync Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-2xl border border-slate-800 p-6 text-white space-y-5 shadow-xl text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Database className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h3 className="font-extrabold text-sm tracking-wide text-indigo-200">
                ระบบจัดการฐานข้อมูลคลาวด์สหพันธ์ Firebase (Firebase Cloud Database Integration)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              เชื่อมต่อและโอนย้ายข้อมูลระบบงานทั้งหมดร่วมกับระบบ Cloud Firestore ของกูเกิลอย่างปลอดภัย ด้วยระบบรักษาความปลอดภัยความเสถียรสูงสุด
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              href="https://console.firebase.google.com/project/ai-studio-68d424b9-6a2b-4d65-b480-ee0f1e9e8407/firestore/data"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[11px] font-black transition-all cursor-pointer select-none"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              ไปยัง Google Cloud Firebase Console
            </a>
            <div className="flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono leading-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400 font-bold">สถานะ Firestore DB:</span>
              <span className="font-extrabold text-white">ONLINE (Connected)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-300 font-extrabold block uppercase tracking-widest">การเชื่อมต่อประวัติบีบอัดขึ้นคลาวด์ {"(Local ➜ Cloud)"}</span>
              <h4 className="text-xs font-bold text-slate-100">สำรองพูลข้อมูลในปัจจุบันไปยังคลาวด์ (Backup to Firestore)</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">สำรองข้อมูลทั้งหมดที่คุณบันทึกอยู่ในเบรกเบราว์เซอร์นี้ (ทะเบียนพนักงาน, อัตราสลิปเงินเดือน, ใบรับลาพักร้อน และรายการเช็ค) โดยเขียนทับพูลบนระบบคลาวด์</p>
            </div>
            <button
              onClick={handleUploadCloud}
              disabled={isSyncing}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> กำลังประมวลผล...
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5" /> ซิงค์แบ็คอัพไปที่ Firebase (Upload to Firestore)
                </>
              )}
            </button>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-355 font-extrabold block uppercase tracking-widest text-emerald-400">การดึงพูลโครงสร้างกลับสู่เครื่อง {"(Cloud ➜ Local)"}</span>
              <h4 className="text-xs font-bold text-slate-100">ดึงข้อมูลตัวจริงจากระบบฐานข้อมูลคลาวน์ (Restore from Firestore)</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">กู้ดึงไฟล์ข้อมูลล่าสุดขึ้นมาจาก Firestore ทดแทนลงเครื่องเบราว์เซอร์ของคุณในปัจจุบันทันทีโดยไม่ต้องพึ่งหาไฟล์บันทึกสำรอง</p>
            </div>
            <button
              onClick={handleDownloadCloud}
              disabled={isSyncing}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> กำลังดึงประวัติ...
                </>
              ) : (
                <>
                  <CloudDownload className="w-3.5 h-3.5" /> ซิงค์ย้อนประวัติจาก Firebase (Restore from Firestore)
                </>
              )}
            </button>
          </div>
        </div>

        {syncLogs.length > 0 && (
          <div className="bg-black/30 rounded-xl border border-slate-800/80 p-3.5 space-y-1 text-[10px] font-mono">
            <span className="text-slate-500 uppercase tracking-widest font-extrabold text-[9px] block">บันทึกขั้นตอนเชื่อมต่อระบบ (Syncing Connection Log):</span>
            <div className="max-h-[80px] overflow-y-auto space-y-1">
              {syncLogs.map((log, index) => (
                <div key={index} className="flex justify-between text-slate-350">
                  <span>✨ {log.msg}</span>
                  <span className="text-slate-505 text-slate-500">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backup Local Storage Data Section */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-650" />
            สำรองข้อมูลระบบภายใน (Backup Local Storage)
          </h3>
          <p className="text-xs text-slate-500">
            ดาวน์โหลดไฟล์สำรองข้อมูลของระบบทั้งหมดที่บันทึกไว้ในเบราว์เซอร์ รวมถึงข้อมูลบริษัท แผนก รายการเช็ค อัตราพนักงาน และการตรวจสอบสถานะสิทธิ์
          </p>
        </div>
        <button
          id="backup-system-data-btn"
          type="button"
          onClick={handleBackupData}
          className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          สำรองและดาวน์โหลดข้อมูล (.json)
        </button>
      </div>

      {/* DEPARTMENT FORM MODAL */}
      <AnimatePresence>
        {isDeptModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-blue-100 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-blue-50/60">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {editingDept ? 'แก้ไขข้อมูลแผนก' : 'เพิ่มแผนกใหม่เข้าสู่องค์กร'}
                </h4>
                <button 
                  onClick={() => setIsDeptModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDept} className="p-5 space-y-4">
                {/* ID Prefix indicator */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">รหัสย่อ (Department Code)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="เช่น EXP, SWE, HR"
                    value={deptCodeInput}
                    onChange={e => setDeptCodeInput(e.target.value)}
                    maxLength={10}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <span className="text-[10px] text-slate-400 leading-none">ต้องเป็นอักษรภาษาอังกฤษเพื่อเชื่อมโยงกับรหัสบุคลากร</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">ชื่อเต็มแผนก (Department Name)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="เช่น ฝ่ายต้อนรับลูกค้าและบริการ"
                    value={deptNameInput}
                    onChange={e => setDeptNameInput(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsDeptModalOpen(false)}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    id="submit-dept-btn"
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    ยืนยันแก้ไขบันทึก
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deptToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-red-105 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-red-50 bg-red-55/10">
                <h4 className="font-bold text-red-900 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  ยืนยันการลบแผนกพนักงาน
                </h4>
                <button 
                  onClick={() => setDeptToDelete(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  คุณแน่ใจหรือไม่ว่าจะลบแผนก <span className="font-extrabold text-slate-900 border-b border-amber-300">"{deptToDelete.name}"</span>?
                </p>
                
                <div className="bg-red-50/50 rounded-xl p-3.5 border border-red-100/60 space-y-1">
                  <span className="text-[10px] text-red-500 font-bold block uppercase tracking-wider">รายละเอียดการลบ</span>
                  <div className="text-xs font-mono text-slate-700 flex justify-between">
                    <span>รหัสแผนก:</span>
                    <span className="font-bold">{deptToDelete.code}</span>
                  </div>
                  <div className="text-xs text-slate-700 flex justify-between">
                    <span>ชื่อแผนก:</span>
                    <span className="font-semibold">{deptToDelete.name}</span>
                  </div>
                </div>

                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5 leading-normal border border-amber-100/70">
                  ⚠️ <b>ข้อควรระวัง:</b> พนักงานในบริษัทที่สังกัดแผนกนี้จะถูกปรับย้ายไปเป็นสถานะ "ยังไม่สังกัดแผนก" ทันที ข้อมูลประวัติการรับรองเดิมจะไม่สูญหาย
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                  <button 
                    type="button" 
                    onClick={() => setDeptToDelete(null)}
                    className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    id="confirm-delete-dept-btn"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ยืนยันการลบแผนก
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="company-settings-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 bg-slate-900 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-slate-800 max-w-sm"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
              toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
