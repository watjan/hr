import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HardDrive, 
  Folder, 
  File, 
  Trash2, 
  Edit3, 
  Plus, 
  ArrowLeft, 
  Search, 
  LogOut, 
  UploadCloud, 
  Download, 
  ChevronRight, 
  Clock, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Globe,
  AlertTriangle,
  Loader2,
  CheckCircle,
  HelpCircle,
  MoreVertical,
  X,
  FileCode,
  FolderPlus
} from 'lucide-react';
import { 
  signInWithGoogleDrive, 
  initGDriveAuth, 
  getGDriveAccessToken, 
  setGDriveAccessToken, 
  logoutGDrive 
} from '../lib/gdriveAuth';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
}

export default function GDriveView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'Drive ส่วนตัว' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Custom modals state
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; fileId: string; currentName: string; newName: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; fileId: string; fileName: string; isFolder: boolean } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const activeFolderId = currentFolder[currentFolder.length - 1]?.id || 'root';

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initialize and check Auth State
  useEffect(() => {
    const unsubscribe = initGDriveAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setIsAuthenticated(true);
        fetchFiles(activeFolderId);
      },
      () => {
        setIsAuthenticated(false);
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Re-fetch files when folder navigation changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles(activeFolderId);
    }
  }, [activeFolderId, isAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogleDrive();
      if (result) {
        setUser(result.user);
        setIsAuthenticated(true);
        showToast('🔓 เชื่อมต่อ Google Drive สำเร็จ', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast('❌ การเชื่อมต่อล้มเหลว หรือถูกยกเลิก', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutGDrive();
      setIsAuthenticated(false);
      setUser(null);
      setFiles([]);
      setCurrentFolder([{ id: 'root', name: 'Drive ส่วนตัว' }]);
      showToast('🔒 ลงชื่อออกเรียบร้อยแล้ว', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Files
  const fetchFiles = async (folderId: string) => {
    const token = getGDriveAccessToken();
    if (!token) return;

    setLoading(true);
    try {
      // Setup Drive API listing query
      const q = `'${folderId}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)&orderBy=folder,name&pageSize=100`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch files from Google Drive');
      }

      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      showToast('❌ ไม่สามารถดึงข้อมูลไฟล์ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create Folder
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const token = getGDriveAccessToken();
    if (!token) return;

    setIsCreatingFolder(false);
    setLoading(true);

    try {
      const metadata = {
        name: newFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: activeFolderId !== 'root' ? [activeFolderId] : undefined,
      };

      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!res.ok) throw new Error('Create folder failed');

      showToast(`📁 สร้างโฟลเดอร์ "${newFolderName}" เรียบร้อย`, 'success');
      setNewFolderName('');
      fetchFiles(activeFolderId);
    } catch (err) {
      console.error(err);
      showToast('❌ สร้างโฟลเดอร์ไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // File Upload
  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const token = getGDriveAccessToken();
    if (!token) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        const metadata = {
          name: file.name,
          parents: activeFolderId !== 'root' ? [activeFolderId] : undefined,
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        if (!res.ok) throw new Error(`Upload failed for file: ${file.name}`);
      }

      showToast('📤 อัปโหลดไฟล์เสร็จสมบูรณ์', 'success');
      fetchFiles(activeFolderId);
    } catch (err) {
      console.error(err);
      showToast('❌ ไม่สามารถอัปโหลดไฟล์ได้', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Rename File
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameModal || !renameModal.newName.trim()) return;

    const token = getGDriveAccessToken();
    if (!token) return;

    const { fileId, newName } = renameModal;
    setRenameModal(null);
    setLoading(true);

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) throw new Error('Rename failed');

      showToast('✏️ เปลี่ยนชื่อไฟล์เรียบร้อยแล้ว', 'success');
      fetchFiles(activeFolderId);
    } catch (err) {
      console.error(err);
      showToast('❌ เปลี่ยนชื่อไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete File/Folder (Confirm action modal)
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;

    const token = getGDriveAccessToken();
    if (!token) return;

    const { fileId, fileName, isFolder } = deleteModal;
    setDeleteModal(null);
    setLoading(true);

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Delete failed');

      showToast(`🗑️ ลบ${isFolder ? 'โฟลเดอร์' : 'ไฟล์'} "${fileName}" เรียบร้อยแล้ว`, 'info');
      fetchFiles(activeFolderId);
    } catch (err) {
      console.error(err);
      showToast('❌ ลบรายการไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Helper file size formatter
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '—';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Icon selector based on mimeType
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-9 h-9 text-blue-500 fill-blue-500/10" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType === 'application/vnd.google-apps.spreadsheet') {
      return <FileSpreadsheet className="w-9 h-9 text-emerald-500" />;
    }
    if (mimeType.includes('document') || mimeType === 'application/vnd.google-apps.document') {
      return <FileText className="w-9 h-9 text-blue-400" />;
    }
    if (mimeType.includes('image/')) {
      return <Image className="w-9 h-9 text-rose-400" />;
    }
    if (mimeType.includes('video/')) {
      return <Video className="w-9 h-9 text-purple-400" />;
    }
    if (mimeType.includes('audio/')) {
      return <Music className="w-9 h-9 text-amber-400" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-9 h-9 text-red-500" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('compressed')) {
      return <FileCode className="w-9 h-9 text-indigo-400" />;
    }
    return <File className="w-9 h-9 text-slate-400" />;
  };

  // Filter files by search query
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate deeper into a folder
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(prev => [...prev, { id: folderId, name: folderName }]);
  };

  // Breadcrumb navigation
  const navigateBackTo = (index: number) => {
    setCurrentFolder(prev => prev.slice(0, index + 1));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative min-h-[500px]">
      
      {/* Top Banner / Hero Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
              <HardDrive className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">ระบบคลังเอกสารและไฟล์ Google Drive</h2>
              <p className="text-slate-400 text-xs">เชื่อมต่อ บันทึก อัปโหลด และจัดการเอกสารของ Sapphire Kitchenware บน Cloud</p>
            </div>
          </div>
        </div>
        
        {isAuthenticated && user && (
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 py-1.5 pl-3 pr-2.5 rounded-2xl self-stretch md:self-auto justify-between">
            <div className="flex items-center gap-2">
              <img 
                src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                alt={user.displayName}
                className="w-7 h-7 rounded-full border border-slate-700" 
              />
              <div className="text-left">
                <p className="text-white text-[11px] font-bold leading-tight">{user.displayName}</p>
                <p className="text-slate-500 text-[9px] leading-tight font-mono">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer ml-4"
              title="ออกจากระบบ Google Drive"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 bg-blue-500/5 border border-blue-500/15 rounded-full flex items-center justify-center mb-6">
            <HardDrive className="w-10 h-10 text-blue-500 animate-pulse" />
          </div>
          <h3 className="text-white text-base font-black mb-2">เข้าใช้งาน Google Drive Cloud Storage</h3>
          <p className="text-slate-400 text-xs max-w-md leading-relaxed mb-8">
            โปรดลงชื่อเข้าใช้งานด้วยบัญชี Google เพื่ออนุญาตให้ระบบดึงข้อมูลไฟล์และจัดการเอกสารงานคู่ค้า การจัดส่ง ใบเสร็จ และสัญญารวมถึงบัญชีต่าง ๆ ได้โดยตรง
          </p>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="gsi-material-button hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 shadow-lg shadow-blue-500/5"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents font-bold text-xs tracking-wide">Sign in with Google เพื่อใช้งาน Drive</span>
            </div>
          </button>
        </div>
      ) : (
        <div>
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-5">
            {/* Breadcrumbs Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 pr-4 no-scrollbar">
              {currentFolder.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  {index > 0 && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />}
                  <button
                    onClick={() => navigateBackTo(index)}
                    className={`text-xs font-bold shrink-0 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                      index === currentFolder.length - 1 ? 'text-blue-400 bg-blue-500/5 border border-blue-500/15' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {index === 0 ? <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Drive หลัก</span> : folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Action buttons + search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 md:w-60 md:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อไฟล์งาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-medium text-white rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => fetchFiles(activeFolderId)}
                className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                title="รีเฟรชไฟล์"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsCreatingFolder(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                สร้างโฟลเดอร์
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                อัปโหลดไฟล์
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => handleFileUpload(e.target.files)} 
                multiple 
              />
            </div>
          </div>

          {/* Drag & Drop Overlay container */}
          <div 
            onDragEnter={handleDrag} 
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl relative transition-all duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' 
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
            }`}
          >
            {dragActive && (
              <div className="absolute inset-0 z-10 bg-slate-950/90 rounded-3xl flex flex-col items-center justify-center p-4 pointer-events-none">
                <UploadCloud className="w-12 h-12 text-blue-400 animate-bounce mb-3" />
                <p className="text-white text-sm font-bold">ปล่อยไฟล์ที่นี่เพื่อเริ่มอัปโหลดเข้าสู่โฟลเดอร์นี้</p>
                <p className="text-slate-500 text-xs mt-1">อัปโหลดอัตโนมัติไปยังโฟลเดอร์ปัจจุบันทันที</p>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-400 text-xs font-medium">กำลังติดต่อ Google Drive...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <Folder className="w-12 h-12 text-slate-700 mb-4" />
                <h4 className="text-white text-sm font-bold">ไม่พบไฟล์หรือข้อมูลในโฟลเดอร์นี้</h4>
                <p className="text-slate-500 text-xs mt-1">ลากไฟล์มาวางที่นี่ หรือใช้ปุ่มเมนูด้านบนเพื่อเริ่มต้นอัปโหลด</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-wider bg-slate-950/60">
                      <th className="py-3 px-4">ชื่อไฟล์ / โฟลเดอร์</th>
                      <th className="py-3 px-4 text-center">ขนาดไฟล์</th>
                      <th className="py-3 px-4 text-center">แก้ไขล่าสุด</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-medium text-slate-300">
                    {filteredFiles.map((file) => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      
                      return (
                        <tr key={file.id} className="hover:bg-slate-900/50 transition-colors group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.mimeType)}
                              <div className="min-w-0 flex-1">
                                {isFolder ? (
                                  <button
                                    onClick={() => navigateToFolder(file.id, file.name)}
                                    className="font-bold text-white hover:text-blue-400 hover:underline transition-colors text-xs text-left cursor-pointer truncate block max-w-md"
                                  >
                                    {file.name}
                                  </button>
                                ) : (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-slate-200 hover:text-blue-400 transition-colors text-xs hover:underline truncate block max-w-md"
                                  >
                                    {file.name}
                                  </a>
                                )}
                                <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate max-w-xs">{file.mimeType}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                            {isFolder ? 'โฟลเดอร์' : formatBytes(file.size)}
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-slate-400">
                            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(file.modifiedTime).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              {!isFolder && file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                                  title="ดูตัวอย่างเอกสาร"
                                >
                                  <Globe className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => setRenameModal({ isOpen: true, fileId: file.id, currentName: file.name, newName: file.name })}
                                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                title="เปลี่ยนชื่อไฟล์"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ isOpen: true, fileId: file.id, fileName: file.name, isFolder })}
                                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="ลบออกจาก Drive"
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
          </div>
        </div>
      )}

      {/* Uploading Progress bar overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center z-40 p-6">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <h4 className="text-white text-sm font-bold">กำลังอัปโหลดไฟล์สู่ Google Drive...</h4>
          <p className="text-slate-400 text-xs mt-1">โปรดอย่าปิดหน้านี้ขณะทำการส่งไฟล์</p>
        </div>
      )}

      {/* Modal: Create Folder */}
      <AnimatePresence>
        {isCreatingFolder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsCreatingFolder(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-400" />
                สร้างโฟลเดอร์ใหม่
              </h3>
              
              <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-black tracking-wider block mb-1.5">ชื่อโฟลเดอร์</label>
                  <input
                    type="text"
                    required
                    placeholder="ป้อนชื่อโฟลเดอร์ เช่น 'เอกสารจัดส่งสินค้าSPL-001'"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-950 transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    สร้างโฟลเดอร์
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Rename File */}
      <AnimatePresence>
        {renameModal?.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setRenameModal(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                เปลี่ยนชื่อรายการ
              </h3>
              
              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-black tracking-wider block mb-1.5">ชื่อเดิม: {renameModal.currentName}</label>
                  <input
                    type="text"
                    required
                    value={renameModal.newName}
                    onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenameModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-950 transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    บันทึกชื่อใหม่
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY Confirmation Modal: Delete File/Folder */}
      <AnimatePresence>
        {deleteModal?.isOpen && (
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
                ยืนยันการลบไฟล์จาก Google Drive
              </h3>

              <p className="text-center text-xs font-medium text-slate-400 leading-relaxed mb-6">
                คุณต้องการย้ายหรือลบ <span className="font-bold text-rose-400">"{deleteModal.fileName}"</span>?
                <br />
                <span className="text-[10px] text-slate-500 mt-2 block font-medium">
                  ⚠️ บันทึกนี้เป็นข้อมูลจริงบน Google Cloud Storage และไม่สามารถย้อนคืนได้หากทำการลบถาวร
                </span>
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-950 transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
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
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border bg-slate-950 text-xs font-bold text-white max-w-sm"
            style={{
              borderColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#f43f5e' : '#3b82f6'
            }}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
            <span className="leading-snug">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
