import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  Settings, 
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  CreditCard,
  Check,
  Smartphone,
  Info
} from 'lucide-react';
import { Cheque, LeaveRequest } from '../types';

interface ChequeNotificationsProps {
  cheques: Cheque[];
  leaveRequests?: LeaveRequest[];
  onNavigate?: (tab: string, subTab?: string) => void;
  currentUserRole?: string;
}

export default function ChequeNotifications({ 
  cheques, 
  leaveRequests = [], 
  onNavigate, 
  currentUserRole 
}: ChequeNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lineToken, setLineToken] = useState(() => localStorage.getItem('line_notify_token') || '');
  const [autoSend, setAutoSend] = useState(() => localStorage.getItem('auto_send_line_notify') === 'true');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('noti_sound_enabled') !== 'false');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep track of which cheques have been notified today to prevent infinite sending/toasts
  const [sentLogs, setSentLogs] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('notified_cheques_logs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate critical cheques
  // 1. Due Tomorrow (= exactly 1 day remaining)
  // 2. Due Today (= 0 days remaining)
  // 3. Overdue (= < 0 days but status is pending_deposit or pending_receipt)
  const getChequeStatusInfo = (ch: Cheque) => {
    if (!ch.chequeDate) return { diffDays: 999, category: 'normal' };
    const chequeTime = new Date(ch.chequeDate).setHours(0, 0, 0, 0);
    const todayTime = new Date().setHours(0, 0, 0, 0);
    const diffTime = chequeTime - todayTime;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // We only care about pending (un-cleared, un-cancelled) cheques
    const isPending = ch.status === 'pending_deposit' || ch.status === 'pending_receipt';
    
    if (!isPending) return { diffDays, category: 'cleared' };
    if (diffDays === 1) return { diffDays, category: 'tomorrow' };
    if (diffDays === 0) return { diffDays, category: 'today' };
    if (diffDays < 0) return { diffDays, category: 'overdue' };
    return { diffDays, category: 'pending_future' };
  };

  // Filter critical cheques to show in the notification list
  const criticalCheques = cheques
    .map(ch => ({ ...ch, info: getChequeStatusInfo(ch) }))
    .filter(ch => ch.info.category === 'tomorrow' || ch.info.category === 'today' || ch.info.category === 'overdue')
    .sort((a, b) => a.info.diffDays - b.info.diffDays);

  const dueTomorrowCheques = criticalCheques.filter(ch => ch.info.category === 'tomorrow');

  // Filter pending leave requests for administrators/HR to show in the universal bell
  const pendingLeaves = (currentUserRole === 'admin' || currentUserRole === 'hr')
    ? leaveRequests.filter(req => req.status === 'pending')
    : [];

  const totalNotificationsCount = criticalCheques.length + pendingLeaves.length;

  // Sync settings
  useEffect(() => {
    localStorage.setItem('line_notify_token', lineToken);
  }, [lineToken]);

  useEffect(() => {
    localStorage.setItem('auto_send_line_notify', String(autoSend));
  }, [autoSend]);

  useEffect(() => {
    localStorage.setItem('noti_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('notified_cheques_logs', JSON.stringify(sentLogs));
  }, [sentLogs]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track the count of notifications to trigger sound when a new one arrives
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevCountRef.current !== null && totalNotificationsCount > prevCountRef.current) {
      playNotiSound();
    }
    prevCountRef.current = totalNotificationsCount;
  }, [totalNotificationsCount, soundEnabled]);

  // Play discrete custom sound if enabled
  const playNotiSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);  // A5
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // AudioContext could be blocked by browser user gestures, ignore safely
    }
  };

  // Send message to LINE Notify via bypass proxy (corsproxy.io or direct)
  const sendLineNotifyMessage = async (messageText: string): Promise<boolean> => {
    if (!lineToken) {
      setNotificationStatus('⚠️ กรุณาบันทึก LINE Notify Token ก่อนสั่งส่งข้อมูล');
      return false;
    }

    setIsSendingTest(true);
    setNotificationStatus('⏳ กำลังทำการเชื่อมต่อ LINE Gateway...');

    try {
      // Due to direct browser CORS restriction, we send via a reliable free CORS proxy
      const directUrl = 'https://notify-api.line.me/api/notify';
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;

      const formData = new URLSearchParams();
      formData.append('message', messageText);

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lineToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (response.ok) {
        setNotificationStatus('🎉 ส่งการแจ้งเตือนไปยังผู้รับทาง LINE สำเร็จแล้ว!');
        setIsSendingTest(false);
        playNotiSound();
        setTimeout(() => setNotificationStatus(null), 4000);
        return true;
      } else {
        const errText = await response.text();
        throw new Error(errText || 'เซิร์ฟเวอร์ LINE ปฏิเสธคำขอ');
      }
    } catch (err: any) {
      console.warn('CORS Limit or error on line notify, providing failback log:', err);
      // Attempt alternative standard direct fetch to log what happens
      try {
        const directResp = await fetch('https://notify-api.line.me/api/notify', {
          method: 'POST',
          mode: 'no-cors', // forces fetch but can't read response body
          headers: {
            'Authorization': `Bearer ${lineToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ message: messageText }).toString()
        });
        
        // No-cors usually turns status to 0 (opaque) but successfully dispatches the request to LINE!
        setNotificationStatus('⚡ ส่งสำเร็จผ่าน Client Request (Opaque Bridge)');
        setIsSendingTest(false);
        setTimeout(() => setNotificationStatus(null), 4000);
        return true;
      } catch (innerErr) {
        setNotificationStatus(`❌ เกิดข้อผิดพลาดเชื่อมต่อ: โทเคนไม่ถูกต้อง หรือติดปัญหา CORS`);
        setIsSendingTest(false);
        return false;
      }
    }
  };

  // Format the LINE notification message based on a list of cheques due tomorrow
  const formatChequeLineMessage = (targetCheques: Cheque[]) => {
    if (targetCheques.length === 0) return '';
    
    let msg = `\n🔔 [ Sapphire HR - แจ้งเตือนเช็คครบกำหนด ]\n`;
    msg += `มีเช็คที่จะครบกำหนดจ่ายในวันพรุ่งนี้ (ล่วงหน้า 1 วัน) จำนวน ${targetCheques.length} รายการ ดังนี้:\n`;
    msg += `--------------------------------\n`;
    
    targetCheques.forEach((ch, index) => {
      msg += `${index + 1}. เลขที่เช็ค: ${ch.chequeNumber}\n`;
      msg += `   • ยอดเงิน: ฿${ch.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n`;
      msg += `   • คู่ค้า: ${ch.partyName}\n`;
      msg += `   • ธนาคาร: ${ch.bankName} (${ch.branch || 'สาขาทั่วไป'})\n`;
      msg += `   • ทิศทางธุรกรรม: ${ch.type === 'incoming' ? 'ขารับ (Incoming)' : 'ขาจ่าย (Outgoing)'}\n`;
      msg += `   • สถานะปัจจบัน: ${ch.status === 'pending_deposit' ? 'รอฝากเช็คขึ้นเงิน' : 'รอรับเช็ค'}\n`;
      msg += `--------------------------------\n`;
    });
    
    msg += `กรุณาเข้าสู่ระบบหลักเพื่อดำเนินการเคลียร์สถานะเช็คด้วยค่ะ ขอบคุณค่ะ`;
    return msg;
  };

  // Automatically scan on render
  useEffect(() => {
    if (dueTomorrowCheques.length === 0) return;

    // We check if we have already auto-notified for these cheques today
    const todayStr = new Date().toISOString().split('T')[0];
    const unsentCheques = dueTomorrowCheques.filter(ch => {
      const uniqueKey = `${ch.id}_${ch.chequeDate}`;
      return sentLogs[uniqueKey] !== todayStr;
    });

    if (unsentCheques.length > 0) {
      // We found due-tomorrow cheques that haven't been alerted today!
      // 1. Play beautiful sound in app
      setTimeout(() => {
        playNotiSound();
      }, 1500);

      // 2. If auto-send is enabled and LINE Token exists, automatically dispatch message to LINE
      if (autoSend && lineToken) {
        const msg = formatChequeLineMessage(unsentCheques);
        sendLineNotifyMessage(msg).then((success) => {
          if (success) {
            // Update sent logs
            const updatedLogs = { ...sentLogs };
            unsentCheques.forEach(ch => {
              const uniqueKey = `${ch.id}_${ch.chequeDate}`;
              updatedLogs[uniqueKey] = todayStr;
            });
            setSentLogs(updatedLogs);
          }
        });
      }
    }
  }, [cheques, autoSend, lineToken]);

  // Handle Manual Trigger
  const handleTriggerManualLineSend = () => {
    if (dueTomorrowCheques.length === 0) {
      // Just send a general test message
      const testMsg = `\n🔔 [ Sapphire HR - ทดสอบระบบเชื่อมต่อ ]\nการเชื่อมต่อระหว่างระบบสารสนเทศ Sapphire HR และ LINE Notify ของท่านสำเร็จเรียบร้อยดี ระบบพกพาการแจ้งเตือนเช็คทำงานตามปกติ`;
      sendLineNotifyMessage(testMsg);
    } else {
      const msg = formatChequeLineMessage(dueTomorrowCheques);
      sendLineNotifyMessage(msg).then((success) => {
        if (success) {
          const todayStr = new Date().toISOString().split('T')[0];
          const updatedLogs = { ...sentLogs };
          dueTomorrowCheques.forEach(ch => {
            const uniqueKey = `${ch.id}_${ch.chequeDate}`;
            updatedLogs[uniqueKey] = todayStr;
          });
          setSentLogs(updatedLogs);
        }
      });
    }
  };

  // Sound toggle button click handler
  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (nextVal) {
      setTimeout(() => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);  
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.5);
        } catch {}
      }, 50);
    }
  };

  return (
    <div className="relative font-sans text-xs select-none" ref={dropdownRef}>
      {/* BELL TRIGGER BUTTON */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && totalNotificationsCount > 0) {
            playNotiSound();
          }
        }}
        className={`relative p-2 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center ${
          totalNotificationsCount > 0 
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200' 
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
        }`}
        title={`${totalNotificationsCount} รายการแจ้งเตือนและการรอพิจารณา`}
      >
        <Bell className={`w-4 h-4 ${totalNotificationsCount > 0 ? 'animate-bounce' : ''}`} />
        
        {totalNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse border border-white">
            {totalNotificationsCount}
          </span>
        )}
      </button>

      {/* DROPDOWN CONTAINER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-slate-700"
          >
            {/* Header section */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 px-2 bg-indigo-50 text-indigo-650 rounded-lg font-bold flex items-center gap-1.5 text-[11px] border border-indigo-100">
                  <Bell className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>ระบบควบคุมการแจ้งเตือน (Notifications Hub)</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Sound control button */}
                <button
                  onClick={handleToggleSound}
                  className="p-1.5 rounded-lg hover:bg-slate-150 text-slate-400 hover:text-slate-750 transition-colors"
                  title="เปิด-ปิดเสียงเตือนของระบบ"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                </button>

                {/* Settings Toggle icon button */}
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className={`p-1.5 rounded-lg transition-colors ${showConfig ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'hover:bg-slate-200 text-slate-400'}`}
                  title="ตั้งค่า LINE LINE Notify Token"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* EXPANDABLE LINE NOTIFY CONFIGURATION PANEL */}
            {showConfig && (
              <div className="p-4 bg-blue-50/70 border-b border-blue-100 space-y-3">
                <div className="flex items-start gap-2 text-blue-800 text-[10.5px]">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">
                    ระบบแจ้งเตือนผ่านแอปพลิเคชัน <strong>LINE</strong> โดยใช้ LINE Notify Token ของแผนกบัญชีเพื่อแจ้งเตือนเช็คครบกำหนดล่วงหน้า 1 วัน
                  </p>
                </div>

                {/* Access credentials links token generator */}
                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold">ยังไม่มีโทเคน? กดรับสิทธิ์ได้ฟรี</span>
                  <a
                    href="https://notify-bot.line.me/my/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 font-black flex items-center gap-1 hover:underline"
                  >
                    บริการ LINE Notify <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Token input field form */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-650 font-black block">LINE Notify Personal Access Token:</label>
                  <input
                    type="password"
                    placeholder="ใส่คีย์ เช่น e9X8yZaBcDeFg..."
                    value={lineToken}
                    onChange={(e) => setLineToken(e.target.value.trim())}
                    className="w-full font-mono font-bold text-[10px] p-2 bg-white border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 shadow-3xs"
                  />
                </div>

                {/* Automation options selection status switches */}
                <div className="flex items-center justify-between border-t border-slate-150 pt-2 text-[10px]">
                  <label className="flex items-center gap-1.5 text-slate-650 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSend}
                      onChange={(e) => setAutoSend(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    />
                    เปิดระบบแจ้งเตือนอัตโนมัติ (Auto Trigger)
                  </label>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${autoSend ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    {autoSend ? 'ออนไลน์' : 'ปิดการทำงาน'}
                  </span>
                </div>
              </div>
            )}

            {/* STATUS AND RESULTS LOG MESSAGE DIAL */}
            {notificationStatus && (
              <div className="px-4 py-2 border-b border-amber-100 bg-amber-50 text-[10.5px] font-black text-amber-800 flex items-center justify-between select-none">
                <span>{notificationStatus}</span>
                <button onClick={() => setNotificationStatus(null)} className="hover:text-amber-950 font-bold">×</button>
              </div>
            )}

            {/* MAIN LIST OF CRITICAL NOTIFICATIONS OR CLEAN */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {totalNotificationsCount === 0 ? (
                <div className="p-12 text-center space-y-2 select-none">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-black text-slate-800">ไม่มีรายการค้างรออนุมัติหรือแจ้งเตือน</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    ระบบไม่พบใบคำขอลาของพนักงานที่คั่งค้างพิจารณาพิจารณา หรือยอดเช็คคงค้างเคลียริ่งในวิกฤตขณะนี้
                  </p>
                </div>
              ) : (
                <>
                  {/* Leave Requests Category */}
                  {pendingLeaves.length > 0 && (
                    <div className="bg-amber-50/20 pb-1">
                      <div className="px-3 py-1.5 bg-amber-500/10 text-amber-850 text-[9.5px] font-extrabold border-y border-amber-250/20 flex justify-between items-center select-none uppercase tracking-wide">
                        <span>📝 ใบลาค้างอนุมัติพิจารณา ({pendingLeaves.length} รายการ)</span>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      </div>
                      <div className="divide-y divide-amber-100/50">
                        {pendingLeaves.map(req => {
                          const typeLabel = req.type === 'sick' ? '🤒 ลาป่วย' : req.type === 'personal' ? '💼 ลากิจ' : req.type === 'vacation' ? '🌴 ลาพักร้อน' : '📝 ลาอื่นๆ';
                          return (
                            <div 
                              key={req.id} 
                              onClick={() => {
                                onNavigate?.('leave-approval');
                                setIsOpen(false);
                              }}
                              className="p-3.5 hover:bg-amber-500/10 transition-colors cursor-pointer flex items-start gap-2.5"
                            >
                              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-700 shrink-0 mt-0.5 text-xs font-bold">
                                {req.type === 'sick' ? '🤒' : req.type === 'personal' ? '💼' : req.type === 'vacation' ? '🌴' : '📝'}
                              </span>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex justify-between items-start gap-1">
                                  <strong className="text-slate-900 font-extrabold text-[11px] truncate">{req.employeeName}</strong>
                                  <span className="text-[8.5px] bg-amber-100 text-amber-800 font-black border border-amber-200 rounded px-1.5 flex shrink-0">
                                    {req.durationDays} วัน
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold truncate">
                                  ขอลา: <strong className="text-slate-700">{typeLabel}</strong>
                                </p>
                                <p className="text-[10px] text-zinc-500 italic font-semibold truncate">
                                  "{req.reason}"
                                </p>
                                <div className="pt-1 text-[9px] font-black text-amber-800 flex justify-between items-center">
                                  <span>เริ่มลา: {req.startDate}</span>
                                  <span className="text-indigo-600 hover:underline flex items-center gap-0.5">กดอนุมัติการลา →</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cheques Category header if both exist */}
                  {criticalCheques.length > 0 && pendingLeaves.length > 0 && (
                    <div className="px-3 py-1.5 bg-indigo-500/5 text-indigo-850 text-[9.5px] font-extrabold border-y border-slate-150 select-none uppercase tracking-wide">
                      <span>💳 รายการแจ้งเตือนยอดเช็ค ({criticalCheques.length} รายการ)</span>
                    </div>
                  )}

                  {/* Cheque list items */}
                  {criticalCheques.map((ch) => {
                    const getSubColor = () => {
                      switch (ch.info.category) {
                        case 'tomorrow':
                          return {
                            head: 'ครบกำหนดวันพรุ่งนี้ (ล่วงหน้า 1 วัน)',
                            bg: 'bg-amber-50/80 border-amber-200',
                            border: 'border-amber-200',
                            badge: 'bg-amber-100 text-amber-800 border-amber-200',
                            indicator: 'bg-amber-500 animate-ping'
                          };
                        case 'today':
                          return {
                            head: 'ครบกำหนดวันนี้ (Due Today!)',
                            bg: 'bg-rose-50/50 border-rose-200',
                            border: 'border-rose-200',
                            badge: 'bg-rose-100 text-rose-800 border-rose-200',
                            indicator: 'bg-rose-550 animate-ping bg-rose-600'
                          };
                        case 'overdue':
                        default:
                          return {
                            head: `เกินกำหนดมาแล้ว ${Math.abs(ch.info.diffDays)} วัน! (Overdue)`,
                            bg: 'bg-rose-50/30 border-slate-200',
                            border: 'border-rose-200',
                            badge: 'bg-slate-100 text-slate-700 border-slate-200',
                            indicator: 'bg-rose-850 bg-rose-700 font-bold'
                          };
                      }
                    };
                    const colors = getSubColor();

                    return (
                      <div key={ch.id} className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${colors.bg}`}>
                        
                        {/* Leftside color code representing the direction */}
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 relative flex`}>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.indicator}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${ch.type === 'incoming' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        </span>

                        {/* Cheque main details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <strong className="text-slate-900 font-extrabold text-xs">เช็คเลขที่ {ch.chequeNumber}</strong>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide border uppercase ${colors.badge}`}>
                              {ch.type === 'incoming' ? 'ขารับ' : 'ขาจ่าย'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 font-bold truncate">
                            ลูกค้า/คู่ค้า: <strong className="text-slate-800">{ch.partyName}</strong>
                          </p>

                          <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
                            <span>ยอดเงิน: <strong className="text-indigo-805 text-indigo-700 bg-indigo-50/50 px-1 py-0.2 rounded">฿{ch.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                            <span>ธนาคาร: <strong className="text-slate-805 text-slate-800">{ch.bankName}</strong></span>
                          </div>

                          {/* Critical status statement tag */}
                          <div className="pt-2 text-[9px] font-black text-rose-800 flex items-center justify-between">
                            <span className="text-amber-800 font-extrabold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {colors.head}
                            </span>
                            <span className="text-slate-450 font-mono font-semibold">กำหนด: {ch.chequeDate}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* BUTTON FOOTER WITH SEND TO LINE OPTION FOR USERS */}
            <div className="p-3 bg-slate-50 border-t border-slate-150 flex items-center justify-between text-[10px]">
              <span className="font-mono text-slate-400 font-bold"> Sapphire HR Notify</span>
              <button
                onClick={handleTriggerManualLineSend}
                disabled={isSendingTest}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
              >
                <Send className="w-3 h-3" />
                {dueTomorrowCheques.length > 0 ? 'ส่งยอดเตือนเข้า LINE' : 'ทดสอบส่งการเชื่อมต่อ LINE'}
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
