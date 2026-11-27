# UTAC QA Calendar (QMS-CASS) — User Manual / คู่มือผู้ใช้

> **Audience / ผู้ใช้งาน:** QA planners, QMS Hosts, and system administrators across UTAC sites.  
> **Scope / ขอบเขต:** Instructions for the current application build. Screen labels are shown in English as they appear in the app.

## Table of Contents / สารบัญ

- [Part 1: คู่มือการใช้งานฉบับภาษาไทย](#part-1-คู่มือการใช้งานฉบับภาษาไทย)
  - [1. ภาพรวมระบบ เบราว์เซอร์ที่รองรับ และการเข้าสู่ระบบ](#th-1-ภาพรวมระบบ-เบราว์เซอร์ที่รองรับ-และการเข้าสู่ระบบ)
  - [2. หน้าปฏิทิน ตัวกรอง และความหมายของสี](#th-2-หน้าปฏิทิน-ตัวกรอง-และความหมายของสี)
  - [3. สร้าง แก้ไข และลบนัดหมาย CS/IA](#th-3-สร้าง-แก้ไข-และลบนัดหมาย-csia)
  - [4. หน้าตารางและส่งออก Excel](#th-4-หน้าตารางและส่งออก-excel)
  - [5. หน้าสรุป](#th-5-หน้าสรุป)
  - [6. จัดการ QMS Host ตัวเลือก และวันหยุด](#th-6-จัดการ-qms-host-ตัวเลือก-และวันหยุด)
  - [7. ประวัติการใช้งานและโปรไฟล์](#th-7-ประวัติการใช้งานและโปรไฟล์)
  - [8. เคล็ดลับและการแก้ปัญหาเบื้องต้น](#th-8-เคล็ดลับและการแก้ปัญหาเบื้องต้น)
- [Part 2: English User Manual](#part-2-english-user-manual)
  - [1. System Overview, Supported Browsers, and Login](#en-1-system-overview-supported-browsers-and-login)
  - [2. Schedule, Filters, and Status Colors](#en-2-schedule-filters-and-status-colors)
  - [3. Create, Edit, and Delete CS/IA Appointments](#en-3-create-edit-and-delete-csia-appointments)
  - [4. Table View and Excel Export](#en-4-table-view-and-excel-export)
  - [5. Summary View](#en-5-summary-view)
  - [6. Manage QMS Hosts, Options, and Holidays](#en-6-manage-qms-hosts-options-and-holidays)
  - [7. History and Profile](#en-7-history-and-profile)
  - [8. Tips and Troubleshooting](#en-8-tips-and-troubleshooting)

---

<a id="part-1-คู่มือการใช้งานฉบับภาษาไทย"></a>
# Part 1: คู่มือการใช้งานฉบับภาษาไทย

<a id="th-1-ภาพรวมระบบ-เบราว์เซอร์ที่รองรับ-และการเข้าสู่ระบบ"></a>
## 1. ภาพรวมระบบ เบราว์เซอร์ที่รองรับ และการเข้าสู่ระบบ

UTAC QA Calendar (QMS-CASS) ใช้สำหรับวางแผน Customer Audit (CS) และ Internal Audit (IA) ดูตารางตามวัน/เดือน/ปี จัดการ QMS Host วันหยุดและข้อจำกัด รวมถึงค้นหาและส่งออกข้อมูล ระบบรองรับ 7 ไซต์: `UTL1`, `UTL2`, `UTL2A`, `UTL2B`, `UTL3`, `UTL3A` และ `UTL3T` ตัวเลือกไซต์ที่แสดงอาจขึ้นกับมาตรฐานหรือประเภทการตรวจที่เลือก

### เบราว์เซอร์ที่รองรับ

รองรับอย่างเป็นทางการบน **Microsoft Edge** (เบราว์เซอร์มาตรฐานของ UTAC) และ **Google Chrome** ควรใช้เบราว์เซอร์เวอร์ชันปัจจุบันและหน้าต่างปกติ

- ผู้ใช้ Microsoft Edge ควรเปิดหน้าต่างปกติ ไม่ใช้ **InPrivate** เพื่อให้การตั้งค่า `localStorage` ใช้งานข้ามการรีเฟรชได้
- ตรวจการตั้งค่าความเป็นส่วนตัวของ Edge ไม่ให้ล้าง cookies และข้อมูลเว็บไซต์เมื่อปิดเบราว์เซอร์ หากนโยบายองค์กรล้างข้อมูลเว็บไซต์ เซสชันที่บันทึกไว้จะไม่คงอยู่
- อนุญาตการดาวน์โหลดไฟล์จากเว็บไซต์นี้ เพื่อให้ดาวน์โหลดไฟล์ตาราง `.xlsx` ได้
- Google Chrome ใช้หน้าต่างปกติและอนุญาต site data/downloads เช่นเดียวกัน

### เข้าสู่ระบบ

1. กรอก User ID และ Password แล้วเลือก **Sign in**.
2. หากมีบัญชีอยู่แล้วแต่จำรหัสผ่านไม่ได้ ให้เปิด **Change password** และยืนยันด้วยรหัสผ่านปัจจุบันก่อนตั้งรหัสใหม่
3. หากเปิดให้ลงทะเบียน ให้เลือก **Sign up** และกรอกรหัสลงทะเบียนที่ผู้ดูแลระบบแจ้ง พร้อม User ID และรหัสผ่าน บัญชีใหม่ไม่สามารถสมัครได้หากไม่มี registration code ที่ถูกต้อง
4. เลือก **Remember me on this device** หากต้องการให้ cookie สำหรับเซสชันของเซิร์ฟเวอร์คงอยู่ได้นานขึ้น หลังเข้าสู่ระบบ ระบบจะเปิดแท็บ **Schedule** ในมุมมองเดือนของเดือนและปีปัจจุบัน
5. เมื่อรีเฟรชหรือเปิดหน้าใหม่ ข้อมูลผู้ใช้สำหรับคืนสถานะหน้าจอจะถูกเก็บใน `localStorage` ส่วนสิทธิ์เข้าถึงข้อมูลร่วมยังตรวจสอบด้วยเซสชันแบบ HttpOnly cookie ของเซิร์ฟเวอร์ อย่าแชร์เครื่องที่บันทึกการเข้าสู่ระบบไว้ หากต้องการจบเซสชันให้เปิดเมนูผู้ใช้แล้วกด **Sign out** (หรือ **Logout**) ด้วยตนเอง

### เปลี่ยนหน้า

แถบนำทางด้านบนมี **Schedule**, **Table**, **Summary**, **Manage** และ **History** คลิกชื่อหน้าเพื่อเปลี่ยนมุมมอง เปิดเมนูชื่อผู้ใช้เพื่อไปที่ **Your profile** หรือ **Sign out**

<a id="th-2-หน้าปฏิทิน-ตัวกรอง-และความหมายของสี"></a>
## 2. หน้าปฏิทิน ตัวกรอง และความหมายของสี

### เลือกมุมมองวัน/เดือน/ปี

1. ใน **Schedule** เลือก **Week**, **Month** หรือ **Year** บนแถบเครื่องมือ มุมมองเริ่มต้นหลังเปิดแอปและหลังเข้าสู่ระบบคือ **Month** ของเดือนปัจจุบัน
2. กดลูกศรซ้าย/ขวาเพื่อย้อนหรือเลื่อนไปตามช่วงเวลาที่เลือก ในมุมมองเดือนจะเลื่อนทีละเดือน และมุมมองปีจะเลื่อนทีละปี
3. ในมุมมอง **Year** คลิกเดือนเพื่อเปิดเดือนนั้น ปฏิทิน Schedule เปลี่ยนปีด้วยลูกศรและยังไม่มีช่องกรอกปีโดยตรง; ช่องปี 4 หลักมีในหน้า Summary และ Holidays
4. กด **New appointment** เพื่อสร้างรายการ หรือคลิกช่องวันในปฏิทินเพื่อดูรายการของวันนั้น
5. ใช้ตัวกรองในแถบด้านข้าง เช่น **Audit Type**, **QMS Host**, **Standard**, **Site**, **Customer**, **Purpose**, **Target Package**, **Customer Name** และ **Audit Category** เลือกได้หลายค่า กด **Clear all** เพื่อกลับไปแสดงรายการทั้งหมด ตัวกรองเปลี่ยนสิ่งที่เห็น ไม่ได้แก้ไขนัดหมาย
6. หากต้องการค้นหาตามช่วงวัน/ข้อความ ให้ใช้มุมมองค้นหาและช่อง **Duration** หรือช่องค้นหาที่เกี่ยวข้อง

### สีของการ์ดนัดหมาย (5 สถานะ)

| สี | ความหมาย | วิธีใช้ |
|---|---|---|
| 🔴 แดง | ข้อมูลที่จำเป็นยังไม่ครบ | บันทึกเป็นร่างได้ เปิดการ์ดเพื่อดูและเติมช่องที่ขาด |
| 🟣 ม่วง | นัดหมายใหม่ที่กรอกข้อมูลจำเป็นครบ | สถานะข้อมูลใหม่ |
| 🔵 น้ำเงิน | นัดหมายที่กรอกครบและมีการแก้ไข | ใช้แยกข้อมูลที่อัปเดตจากรายการใหม่ |
| 🟡 เหลือง | รอผลหรือรอติดตาม (Pending Result) | บันทึกผล/ติดตามก่อนปิดงาน |
| 🟢 เขียว | เสร็จสิ้น/ปิดแล้ว (Complete) | สถานะครบถ้วนหรือปิดงานแล้ว |

สีเป็นสถานะของข้อมูล ไม่ใช่ประเภท CS/IA หรือสีของไซต์ หากแก้ไขไซต์หรือข้อมูลอื่นในนัดหมายใหม่ ระบบควรประเมินว่าเป็นรายการอัปเดตและแสดงสีน้ำเงินเมื่อข้อมูลครบ

### สีและกติกาของช่องวัน

| สีช่องวัน | ประเภทวัน | CS | IA |
|---|---|---|---|
| ขาว | วันทำงานปกติ | อนุญาต | อนุญาต |
| เทา | `Public Holiday` | ไม่อนุญาต | ไม่อนุญาต |
| น้ำเงิน | `No Customer Audits` | ไม่อนุญาต | อนุญาต |
| น้ำเงิน | `Shutdown Plant` | ไม่อนุญาต | อนุญาตเฉพาะไซต์ที่ไม่ได้ล็อก |

วันเสาร์/อาทิตย์หรือวันที่ถูกบล็อกทั้งหมดอาจไม่รับการนัดหมาย ตรวจดูป้ายชื่อบนช่องวันเสมอ ช่อง `No Customer Audits` และ `Shutdown Plant` ยังคงเป็นสีน้ำเงินพร้อมป้ายชื่อเดิม แม้จะมีการ์ด IA อยู่แล้ว สำหรับ `Shutdown Plant` ไซต์ที่ถูกเลือกให้ล็อกจะไม่รับ IA ด้วย

<a id="th-3-สร้าง-แก้ไข-และลบนัดหมาย-csia"></a>
## 3. สร้าง แก้ไข และลบนัดหมาย CS/IA

### สร้างนัดหมาย

1. กด **New appointment** หรือคลิกวันที่ในปฏิทิน เลือกชนิด **Customer Audit** หรือ **Internal Audit**
2. เลือกวันที่เริ่มและสิ้นสุด ตรวจให้วันที่สิ้นสุดไม่อยู่ก่อนวันที่เริ่ม
3. กรอกข้อมูลที่จำเป็น แล้วเลือก **Save** ข้อมูลที่ยังไม่ครบสามารถบันทึกเป็นร่างได้ ระบบจะแสดงสีแดงและระบุช่องที่ต้องเติม

**Customer Audit (CS):** ต้องกรอก Standard, Site, Customer, End Customer, Purpose, Target Package, Customer Name และ QMS Host รวมถึงช่วงวันที่ที่ถูกต้อง ช่อง Status และ Notes อาจปรากฏในฟอร์มตามรายละเอียดนัดหมาย แต่ไม่ใช่รายการบังคับที่ระบบใช้ตัดสินสีแดง/ข้อมูลครบ

**Internal Audit (IA):** ต้องกรอก 5 ช่องหลัก ได้แก่ Standard, Site, Audit Category, Area และ QMS Host พร้อมช่วงวันที่ที่ถูกต้อง ช่อง Area เลือกได้หลายรายการและสร้าง tag ใหม่ได้ โดยรายการจะคั่นด้วย ` / ` ไม่ต้องกรอกข้อมูล Customer/End Customer/Target Package สำหรับ IA

### แก้ไขและลบ

1. คลิกการ์ดนัดหมายเพื่อเปิดรายละเอียด แล้วเลือกคำสั่งแก้ไข (ดินสอ) หรือคำสั่งที่เกี่ยวข้อง
2. รายการหลายวันอาจให้เลือกขอบเขตการแก้ไข เช่น แก้เฉพาะวันหรือทั้งชุด ตรวจสอบวันที่ก่อนยืนยัน
3. บันทึกการเปลี่ยนแปลงเพื่ออัปเดตนัดหมาย หากข้อมูลครบ สถานะการ์ดจะเปลี่ยนตามเกณฑ์ใหม่/อัปเดต/ติดตาม/เสร็จสิ้น
4. ใช้ไอคอนถังขยะเพื่อลบทั้งนัดหมาย หรือใช้คำสั่งลบวันเดียวเมื่อมีให้เลือก การลบเป็นการเปลี่ยนแปลงที่บันทึกในระบบและประวัติ
5. กดไอคอนผลตรวจบนการ์ดเพื่อเปิด **Audit Results** แล้วกรอกจำนวน Major, Minor, OFI, OBS และ Findings แยกตามไซต์ สำหรับนัดหมายหลายวัน ผลตรวจใช้ร่วมกันทั้งชุดได้
6. ในหน้ารายละเอียดของวัน ใช้ส่วน **NOTES** เพื่อโพสต์หรือจัดการบันทึกประกอบวันนั้น
7. การบันทึกเป็นแบบไม่บล็อกการทำงานเมื่อยังขาดข้อมูล ระบบเตือนและระบุช่องที่ขาด แต่ผู้วางแผนสามารถบันทึกไว้เติมภายหลังได้ หากเกิดข้อผิดพลาดด้านเครือข่าย ให้ตรวจแถบแจ้งเตือนและสถานะก่อนทำรายการซ้ำ

<a id="th-4-หน้าตารางและส่งออก-excel"></a>
## 4. หน้าตารางและส่งออก Excel

1. เปิด **Table** เพื่อดูรายการตรวจเป็นตาราง
2. ใช้ช่องค้นหาข้อความ และตัวกรอง **Audit Type**, **Sites**, **Standards**, **Categories**, **Packages**, **Customers**, **QMS Hosts** และวันที่ **From/To** สามารถเลือกหลายค่าได้
3. คลิกหัวคอลัมน์เพื่อเรียงลำดับ คลิกซ้ำเพื่อสลับจากน้อยไปมาก/มากไปน้อย ใช้ **Reset filters** เพื่อล้างเงื่อนไข
4. ตารางแสดงจำนวนที่ตรงกับตัวกรองและมีการแบ่งหน้า เลือกขนาดหน้าเพื่อดูผลลัพธ์เพิ่มเติม
5. กดปุ่มดาวน์โหลด Excel เพื่อส่งออกแถวที่ผ่านตัวกรองปัจจุบันเป็นไฟล์ `.xlsx` ตรวจสอบตัวกรองและจำนวนผลลัพธ์ก่อนส่งต่อไฟล์ เนื้อหาที่ส่งออกอาจมีข้อมูลลูกค้าและการตรวจประเมิน

<a id="th-5-หน้าสรุป"></a>
## 5. หน้าสรุป

เปิด **Summary** เพื่อดูยอด Customer Audit และ Internal Audit สรุปตามช่วงเวลา/ไซต์ ใช้ช่องปีและปุ่มเลื่อนปีเพื่อเลือกปีที่ต้องการ ตรวจตัวเลขรวมและรายละเอียดไซต์ก่อนนำไปอ้างอิง สามารถส่งออกตาราง visits หรือ findings เป็น Excel ได้ตามปุ่มส่งออกที่ปรากฏ โดยไฟล์จะอิงปีและตัวเลือกปัจจุบัน

<a id="th-6-จัดการ-qms-host-ตัวเลือก-และวันหยุด"></a>
## 6. จัดการ QMS Host ตัวเลือก และวันหยุด

### QMS Host และ Options

1. เปิด **Manage** แล้วเลือกแท็บ **QMS Host** เพื่อดู เพิ่ม แก้ไข หรือลบ QMS Host รวมถึงไซต์/แผนกและตัวกรองที่แสดง
2. เปิดแท็บ **Options** เพื่อจัดการค่าตัวเลือก เช่น ไซต์ มาตรฐาน แผนก/หมวดหมู่ ลูกค้า Purpose, Target Package, Customer Name และ Audit Category
3. เพิ่มค่าใหม่ได้จากแผงตัวเลือกหรือจากช่อง tag ในฟอร์มเมื่อระบบแสดงปุ่มเพิ่ม ลบค่าที่ไม่ใช้ด้วยปุ่ม ✕ และลากรายการเพื่อจัดลำดับเมื่อมีที่จับลาก
4. ลบค่าอย่างระมัดระวัง เพราะอาจกระทบการเลือกในอนาคต รายการที่บันทึกในนัดหมายเดิมอาจยังปรากฏเป็นข้อมูลเดิม

### Holidays และข้อจำกัด

1. เปิด **Manage → Holidays** เลือกปีด้วยลูกศรหรือกรอกปี 4 หลัก กด Enter เพื่อยืนยัน
2. คลิกการ์ด **Public Holidays** เพื่อกรองรายการวันหยุดและดูรายการตามลำดับเวลา เพิ่มหรือแก้ไขวันหยุด/วันหยุดกำหนดเอง และใช้ **Reset to Normal Day** เพื่อลบ override ของวันนั้น
3. กด **Add Date Range Rule** หรือคลิกวันในปฏิทิน เลือก `Public Holiday`, `Shutdown Plant` หรือ `No Customer Audits` กรอกช่วงวันและชื่อ/หมายเหตุ (ถ้ามี) แล้วกด **Save Status**
4. สำหรับ `Shutdown Plant` เลือกไซต์ที่ได้รับผลกระทบใน **Affected Sites** อย่างน้อยหนึ่งไซต์ checkbox จะยังไม่ถูกเลือกโดยอัตโนมัติเมื่อสร้างกฎใหม่ กด **Select All** หรือเลือกไซต์ที่ต้องการ แล้วตรวจสอบก่อนบันทึก ไซต์ที่เลือกจะถูกล็อกไม่ให้ IA ในวันนั้น
5. `No Customer Audits` ห้าม CS แต่ยังอนุญาต IA ส่วน `Public Holiday` ห้ามทั้ง CS และ IA เมื่อแก้ไขกฎหลายวัน ให้ตรวจช่วงวันที่และกติกาที่เลือกก่อนยืนยัน
6. **ข้อจำกัดปัจจุบัน:** เวอร์ชันนี้ยังไม่มีปุ่มนำเข้าไฟล์ Excel/CSV สำหรับวันหยุด จึงไม่สามารถนำเข้าไฟล์ที่มี `Date`, `Type`, `Name`, `Affected Sites` จากหน้านี้ได้ ให้สร้างกฎด้วยปฏิทินหรือ **Add Date Range Rule** แทน การแก้ไขกฎวันหยุดใช้กับข้อจำกัดของปฏิทินและไม่ใช่การแก้ไข/ลบนัดหมายเดิม

<a id="th-7-ประวัติการใช้งานและโปรไฟล์"></a>
## 7. ประวัติการใช้งานและโปรไฟล์

เปิด **History** เพื่อค้นหาประวัติการเปลี่ยนแปลง ใช้คำค้น ตัวกรอง **Action**, **Entity**, วันที่เริ่มต้นและสิ้นสุด เพื่อจำกัดรายการ ประวัติที่บันทึกอัตโนมัติครอบคลุมการสร้าง/แก้ไข/ลบนัดหมาย การเปลี่ยนผลตรวจ ตัวเลือก QMS Host และกฎวันหยุด/ข้อจำกัด การเพิ่ม ลบ หรือจัดลำดับตัวเลือกอาจแสดงเป็นรายการจัดการใน log

เปิดเมนูผู้ใช้ → **Your profile** เพื่อดูข้อมูลโปรไฟล์และกิจกรรมล่าสุด บางข้อมูลในโปรไฟล์เป็นข้อมูลแสดงผล ผู้ดูแลระบบจัดการรายชื่อ QMS Host ผ่านหน้า Manage

<a id="th-8-เคล็ดลับและการแก้ปัญหาเบื้องต้น"></a>
## 8. เคล็ดลับและการแก้ปัญหาเบื้องต้น

- หากไม่เห็นนัดหมาย ให้ตรวจเดือน/ปี มุมมอง และตัวกรองทั้งหมดก่อน
- หากนัดหมายเป็นสีแดง ให้เปิดรายการและเติมช่องที่ระบบระบุ
- หากสร้าง CS ในวันที่เป็นสีน้ำเงินไม่ได้ ให้ตรวจว่ามีกฎ `No Customer Audits` หรือ `Shutdown Plant` หรือไม่ สำหรับ Shutdown ตรวจไซต์ที่ล็อก
- หากการเปลี่ยนแปลงไม่ถูกบันทึก ให้รอการแจ้งเตือน อ่านข้อความข้อผิดพลาด และตรวจการเชื่อมต่อก่อนทำซ้ำ เพื่อเลี่ยงข้อมูลซ้ำ
- ส่งออกเฉพาะข้อมูลที่จำเป็น และจัดเก็บไฟล์ Excel ตามแนวทางการรักษาความลับขององค์กร
- หากล็อกอินไม่ได้ ให้ตรวจ User ID/Password หรือติดต่อผู้ดูแลระบบเพื่อขอ registration code/รีเซ็ตบัญชี

---

<a id="part-2-english-user-manual"></a>
# Part 2: English User Manual

<a id="en-1-system-overview-supported-browsers-and-login"></a>
## 1. System Overview, Supported Browsers, and Login

UTAC QA Calendar (QMS-CASS) supports Customer Audit (CS) and Internal Audit (IA) planning, calendar views, QMS Host and holiday/restriction management, search, reporting, and exports. It covers seven sites: `UTL1`, `UTL2`, `UTL2A`, `UTL2B`, `UTL3`, `UTL3A`, and `UTL3T`. Available site choices can depend on the selected standard or audit type.

### Supported browsers

The officially supported browsers are **Microsoft Edge** (UTAC's standard corporate browser) and **Google Chrome**. Use a current browser version and a standard window.

- In Microsoft Edge, use a standard window instead of **InPrivate** so the saved `localStorage` sign-in profile can be restored across refreshes.
- Check Edge privacy settings and avoid clearing cookies and site data on browser exit. If company policy clears site data, the saved session profile will not persist.
- Allow downloads from the application site so `.xlsx` exports can be saved.
- In Google Chrome, likewise use a standard window and allow site data and file downloads.

### Sign in

1. Enter your User ID and Password, then select **Sign in**.
2. If you already have an account and need to change its password, open **Change password** and verify the current password before setting a new one.
3. If registration is enabled, choose **Sign up** and enter a valid registration code supplied by an administrator, a User ID, and a password. Registration is unavailable without the correct code.
4. Select **Remember me on this device** to request a longer-lived server cookie. After authentication, the app opens the **Schedule** tab in the current month and year.
5. The app stores the user profile used to restore the signed-in interface in `localStorage` across refreshes. Access to shared data is still verified by the server using an HttpOnly session cookie. On a shared computer, sign out when finished: open the user menu and select **Sign out** (also referred to as **Logout**).

### Navigate the app

The top navigation contains **Schedule**, **Table**, **Summary**, **Manage**, and **History**. Select a tab to switch views. Open the user menu for **Your profile** or **Sign out**.

<a id="en-2-schedule-filters-and-status-colors"></a>
## 2. Schedule, Filters, and Status Colors

### Choose a calendar view

1. In **Schedule**, choose **Week**, **Month**, or **Year** from the toolbar. Startup and post-login defaults are the current month in **Month** view.
2. Use the left/right arrows to move through the selected period: one week, one month, or one year depending on the view.
3. In **Year** view, select a month to open it. The Schedule calendar currently changes years with the arrows and has no direct year-entry field; four-digit year inputs are available in Summary and Holidays.
4. Select **New appointment** to create a record, or click a calendar day to see that day’s appointments.
5. Use sidebar filters such as **Audit Type**, **QMS Host**, **Standard**, **Site**, **Customer**, **Purpose**, **Target Package**, **Customer Name**, and **Audit Category**. Filters support multiple selections; select **Clear all** to remove them. Filters change only what is displayed, not the appointments themselves.
6. Use the search view and its **Duration** or other search controls when you need to find appointments by date range or text.

### Appointment card colors (five states)

| Color | Meaning | What to do |
|---|---|---|
| 🔴 Red | Required appointment data is incomplete | The draft can be saved; open it and complete the missing fields |
| 🟣 Purple | New appointment with required data complete | Newly entered complete data |
| 🔵 Blue | Complete appointment that has been updated | Updated data, distinguished from a new record |
| 🟡 Yellow | Pending result or follow-up | Record results or follow up before closing |
| 🟢 Green | Complete/closed | The appointment is complete or closed |

These colors represent record status, not audit type or site. When a new appointment is edited—for example, its site changes—the app should classify it as updated and show blue once it remains complete.

### Calendar day-cell rules

| Cell color | Rule | Customer Audit (CS) | Internal Audit (IA) |
|---|---|---|---|
| White | Normal working day | Allowed | Allowed |
| Gray | `Public Holiday` | Blocked | Blocked |
| Blue | `No Customer Audits` | Blocked | Allowed |
| Blue | `Shutdown Plant` | Blocked | Allowed only for sites that are not locked |

Weekends and dates blocked for all applicable sites may also be unavailable for scheduling. Read the label on the cell. `No Customer Audits` and `Shutdown Plant` cells retain their blue color and label when IA cards are present. For a shutdown rule, IA is also blocked at each site selected as affected/locked.

<a id="en-3-create-edit-and-delete-csia-appointments"></a>
## 3. Create, Edit, and Delete CS/IA Appointments

### Create an appointment

1. Select **New appointment** or click a calendar date, then choose **Customer Audit** or **Internal Audit**.
2. Set the start and end dates. The end date must not be earlier than the start date.
3. Fill the required fields and select **Save**. Incomplete records can be saved as drafts; the card is marked red and the missing fields are identified.

**Customer Audit (CS):** The required fields are Standard, Site, Customer, End Customer, Purpose, Target Package, Customer Name, and QMS Host, plus a valid date range. Status and Notes may appear in the form or record details, but they are not part of the required-field check that determines the incomplete/red state.

**Internal Audit (IA):** The five core required fields are Standard, Site, Audit Category, Area, and QMS Host, plus a valid date range. Area accepts multiple selections and creatable tags; values are joined with ` / `. Customer, End Customer, and Target Package are not required for IA.

### Edit or delete

1. Select an appointment card to open its details, then choose the edit (pencil) or other relevant action.
2. Multi-day records may ask whether the change applies to one day or the entire series. Review the date scope before confirming.
3. Save the changes. The app recalculates the card state using the complete/new/updated/pending/closed rules.
4. Use the trash action to delete an entire appointment, or the single-day delete action when available. Deletions are recorded in the system history.
5. Select the results icon on an appointment card to open **Audit Results**. Enter Major, Minor, OFI, OBS, and Findings counts by site. Results can be shared across the days in a multi-day appointment series.
6. In a day's details, use **NOTES** to post or manage comments for that calendar day.
7. Save validation is non-blocking: the app identifies missing required fields but permits saving a draft for later completion. If a network error appears, review the warning and connection status before retrying to avoid duplicate changes.

<a id="en-4-table-view-and-excel-export"></a>
## 4. Table View and Excel Export

1. Open **Table** to view appointment records in a dense, tabular layout.
2. Use global text search and the **Audit Type**, **Sites**, **Standards**, **Categories**, **Packages**, **Customers**, **QMS Hosts**, and **From/To** date filters. Multi-select filters can include several values.
3. Select a column heading to sort; select it again to reverse sort direction. Use **Reset filters** to clear the active criteria.
4. The table reports the matching result count and paginates records. Change the page size to display more rows at once.
5. Select the Excel download control to export the currently filtered rows as `.xlsx`. Review the filters and result count before sharing the file; exports may contain customer and audit information.

<a id="en-5-summary-view"></a>
## 5. Summary View

Open **Summary** for customer and internal audit totals by period/site. Use the year input and year controls to select the reporting year. Review totals and site details before using them in reports. The available export buttons download visits or findings workbooks for the selected year and current summary options.

<a id="en-6-manage-qms-hosts-options-and-holidays"></a>
## 6. Manage QMS Hosts, Options, and Holidays

### QMS Hosts and Options

1. Open **Manage → QMS Host** to review, add, edit, or remove QMS Hosts and manage their site/department details and available filters.
2. Open **Manage → Options** to maintain selectable values such as sites, standards, departments/categories, customers, Purpose, Target Package, Customer Name, and Audit Category.
3. Add values from the option panel or from a form tag field when its add control is available. Remove obsolete values with the ✕ control. Drag option rows to reorder them where drag handles are shown.
4. Remove values carefully because they affect future selections. Existing appointments may continue to show the values already saved on them.

### Holidays and restrictions

1. Open **Manage → Holidays**. Move between years with the arrows or enter a four-digit year and press Enter.
2. Select the **Public Holidays** summary card to filter the chronological holiday list. Add or edit holiday/custom holiday entries; use **Reset to Normal Day** to remove an override from a date.
3. Choose **Add Date Range Rule** or click a calendar day. Select `Public Holiday`, `Shutdown Plant`, or `No Customer Audits`, set the date/range and optional name/note, then select **Save Status**.
4. For `Shutdown Plant`, choose at least one affected site under **Affected Sites**. New rules start with no sites selected; choose the affected sites or select **Select All**, then verify the list before saving. IA is blocked at selected sites on that date.
5. `No Customer Audits` blocks CS while permitting IA. `Public Holiday` blocks both CS and IA. Verify the dates and rule type before saving a multi-day rule.
6. **Current limitation:** The current app does not provide an Excel/CSV holiday-import control. A file with `Date`, `Type`, `Name`, and `Affected Sites` cannot be imported from this screen; create the rules manually with the calendar or **Add Date Range Rule**. Holiday rules control calendar availability and do not edit or delete existing appointments.

<a id="en-7-history-and-profile"></a>
## 7. History and Profile

Open **History** to review the activity audit log. Search by text and filter by **Action**, **Entity**, and start/end date. The log records appointment creation/updates/deletions, result changes, option and QMS Host changes, and holiday/restriction changes. Option add/remove/reorder operations may appear as management entries.

Open the user menu → **Your profile** to see profile details and recent activity. Some profile fields are display information; manage QMS Host records from the Manage page.

<a id="en-8-tips-and-troubleshooting"></a>
## 8. Tips and Troubleshooting

- If an appointment is missing, check the selected month/year, calendar view, and active filters.
- If a card is red, open it and fill the fields listed as missing.
- If a CS appointment cannot be placed on a blue date, check for `No Customer Audits` or `Shutdown Plant`; for shutdowns, check the selected locked sites.
- If a change does not save, read the warning and check connectivity before retrying, to avoid creating duplicate records.
- Export only the information needed and store Excel files under your organization’s data-handling rules.
- If sign-in fails, verify the User ID and password or contact the administrator for a registration code or account help.

---

**Related documentation / เอกสารที่เกี่ยวข้อง:** [Documentation index](index.md) · [Engineering handover](HANDOVER.md) · [System architecture and feature reference](app-architecture-and-features.html)

