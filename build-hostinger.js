import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import JSZip from 'jszip';

const __dirname = path.resolve();

console.log('📦 เริ่มต้นการ Build โปรแกรมสำหรับติดตั้งบน Hostinger (Subdirectory: /tes/)...');

// 1. รันคำสั่ง npm run build ของ Vite
try {
  console.log('⚡ กำลังคอมไพล์โค้ดด้วย Vite (Vite building)...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ คอมไพล์โค้ดเสร็จสิ้น!');
} catch (err) {
  console.error('❌ การคอมไพล์โค้ดล้มเหลว:', err);
  process.exit(1);
}

// 2. เตรียมไดเรกทอรี 'tes' ใน root
const sourceDir = path.join(__dirname, 'dist');
const targetDir = path.join(__dirname, 'tes');

console.log(`🧹 กำลังเคลียร์โฟลเดอร์เก่า 'tes' (ถ้ามี)...`);
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

// ฟังก์ชันคัดลอกโฟลเดอร์แบบ Recursive
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`📂 กำลังคัดลอกไฟล์คอมไพล์จาก 'dist' ไปยังโฟลเดอร์สำหรับอัปโหลด 'tes'...`);
if (fs.existsSync(sourceDir)) {
  copyDirRecursive(sourceDir, targetDir);
} else {
  console.error('❌ ไม่พบโฟลเดอร์ผลลัพธ์การ Build (dist/)!');
  process.exit(1);
}

// 3. สร้างไฟล์ .htaccess ในโฟลเดอร์ 'tes' เพื่อช่วยให้ Hostinger/Apache จัดการหน้าและ routing ของ React App
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /tes/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /tes/index.html [L]
</IfModule>
`;

console.log(`✍️ กำลังสร้างไฟล์กำหนดค่าเซิร์ฟเวอร์ .htaccess เพื่อความเสถียรบน Hostinger...`);
fs.writeFileSync(path.join(targetDir, '.htaccess'), htaccessContent);

// 4. บีบอัดโฟลเดอร์ 'tes' เป็นไฟล์ 'tes.zip'
console.log(`📦 กำลังรวมไฟล์และบีบอัดโฟลเดอร์ 'tes' เป็น 'tes.zip'...`);
const zip = new JSZip();

function addFilesToZip(zipFolder, folderPath, relativePath = '') {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subZip = zipFolder.folder(entry.name);
      addFilesToZip(subZip, fullPath, relPath);
    } else {
      const fileData = fs.readFileSync(fullPath);
      zipFolder.file(entry.name, fileData);
    }
  }
}

// ใส่โฟลเดอร์ 'tes' ไว้เป็นโฟลเดอร์รากข้างใน ZIP เพื่อให้เวลาแตกไฟล์แล้วได้โฟลเดอร์ tes ทันที
const zipRoot = zip.folder('tes');
addFilesToZip(zipRoot, targetDir);

zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
  const zipPath = path.join(__dirname, 'tes.zip');
  fs.writeFileSync(zipPath, content);
  console.log(`\n======================================================`);
  console.log(`🎉 สร้างโฟลเดอร์ 'tes' และไฟล์ 'tes.zip' ในระบบสำเร็จแล้ว!`);
  console.log(`======================================================`);
  console.log(`👉 สามารถดาวน์โหลดไฟล์ 'tes.zip' ไปอัปโหลดบนโฮส Hostinger ได้ทันที`);
  console.log(`👉 หลังจากแตกไฟล์ ZIP บนเซิร์ฟเวอร์แล้ว จะได้โฟลเดอร์ 'tes' ที่ทำงานได้อย่างสมบูรณ์แบบที่ https://yourdomain.com/tes/`);
  console.log(`======================================================\n`);
}).catch((err) => {
  console.error('❌ เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP:', err);
  process.exit(1);
});
