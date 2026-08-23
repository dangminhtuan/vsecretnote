# 📖 QUY TẮC BẢNG VẦN & MẸO GHI NHỚ TIMECYPHER (VCOMP)

> **Tài liệu hướng dẫn toàn diện về Hệ thống Mã hóa Ngữ nghĩa Tiếng Việt (TimeCypher 3 Ký tự - Base60), Trục Từ Neo Khắc Cốt Ghi Tâm và Các Mẹo Tra Cứu Thông Minh.**

---

## 🧭 MỤC LỤC
1. [Kiến trúc Mã hóa 3 Ký tự Base60](#1-kiến-trúc-mã-hóa-3-ký-tự-base60)
2. [Hệ Thống 3 Bảng Vần & Quy Ước Thanh Điệu (Telex + VNI)](#2-hệ-thống-3-bảng-vần--quy-ước-thanh-điệu-telex--vni)
3. [Trục Từ Neo "Thiêng & Bậy" (The Sacred Anchor Diagonal)](#3-trục-từ-neo-thiêng--bậy-the-sacred-anchor-diagonal)
4. [Cơ chế Gán Vần Đa Bảng (Multi-Table Code Sharing)](#4-cơ-chế-gán-vần-đa-bảng-multi-table-code-sharing)
5. [Hệ Sinh Thái Giờ Thiêng & Các Thế Số Đẹp](#5-hệ-sinh-thái-giờ-thiêng--các-thế-số-đẹp)
6. [Mẹo Tra Cứu Nhanh & Lọc 1 Chạm (Mobile & Desktop)](#6-mẹo-tra-cứu-nhanh--lọc-1-chạm-mobile--desktop)

---

## 1. KIẾN TRÚC MÃ HÓA 3 KÝ TỰ BASE60

Mỗi từ tiếng Việt được nén chặt thành một chuỗi **3 ký tự Base60** theo công thức:

$$\text{Mã Nén} = \mathbf{[C_1]} + \mathbf{[C_2]} + \mathbf{[C_3]}$$

* **Ký tự 1 ($C_1$) - Phụ Âm Đầu**: Đại diện cho 24 phụ âm chính (`c, đ, g, gh, gi, k, kh, h, v, d, m, ch, r, s, n, b, l, ch, s, (rỗng), ng, nh, l, ngh`) hoặc 7 phụ âm phụ (`p, ph, qu, t, th, tr, x`).
* **Ký tự 2 ($C_2$) - Ký Tự Vần (Base60)**: Đại diện cho vị trí của vần trong 1 trong 3 Bảng Vần (`0` đến `59`).
* **Ký tự 3 ($C_3$) - Dấu & Định Danh Bảng**: Vừa mang thông tin **Dấu Thanh** (Bằng, Sắc, Huyền, Hỏi, Ngã, Nặng) vừa xác định từ đó thuộc **Bảng 1, Bảng 2, hay Bảng 3** và thuộc **Nhóm Phụ Âm Chính hay Phụ Âm Phụ**.

### 🔢 Bảng 60 Ký Tự Base60 Chuẩn:
```
Index:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
Char:   c  d  g  G  j  k  K  h  v  D  m  C  r  s  n  b  l  Q  S  z

Index: 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39
Char:   N  y  L  W  p  f  q  t  T  R  x  0  1  2  3  4  5  6  7  8

Index: 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59
Char:   9  A  B  E  F  H  I  J  M  P  U  V  X  Y  Z  a  e  i  u  w
```

---

## 2. HỆ THỐNG 3 BẢNG VẦN & QUY ƯỚC THANH ĐIỆU (TELEX + VNI)

Để chứa trọn vẹn **169 vần** tiếng Việt trong không gian Base60, hệ thống chia vần thành 3 Bảng con. Ký tự thứ 3 ($C_3$) là "chìa khóa vàng" giúp giải mã không bao giờ bị trùng lặp:

### 🎼 Bảng Quy ước Dấu $C_3$:

| Nhóm Phụ Âm | Bảng Vần | Dấu = (Bằng) | Dấu ✓ (Sắc) | Dấu ` (Huyền) | Dấu ˀ (Hỏi) | Dấu ~ (Ngã) | Dấu • (Nặng) | Quy ước Ghi nhớ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Phụ âm Chính** | **Bảng 1 (B1)** | **`z`** | **`s`** | **`f`** | **`r`** | **`x`** | **`j`** | **Telex thường** |
| **Phụ âm Chính** | **Bảng 2 (B2)** | **`Z`** | **`S`** | **`F`** | **`R`** | **`X`** | **`J`** | **Telex HOA** |
| **Phụ âm Chính** | **Bảng 3 (B3)** | **`a`** | **`e`** | **`i`** | **`u`** | **`w`** | **`y`** | **Nguyên âm thường đối xứng** |
| **Phụ âm Phụ** | **Bảng 1 (B1)** | **`0`** | **`1`** | **`2`** | **`3`** | **`4`** | **`5`** | **VNI 0-5** |
| **Phụ âm Phụ** | **Bảng 2 (B2)** | **`6`** | **`7`** | **`8`** | **`9`** | **`B`** | **`C`** | **VNI cao (6-9, B, C)** |
| **Phụ âm Phụ** | **Bảng 3 (B3)** | **`A`** | **`E`** | **`I`** | **`U`** | **`W`** | **`Y`** | **Nguyên âm HOA đối xứng** |

---

## 3. TRỤC TỪ NEO "THIÊNG & BẬY" (THE SACRED ANCHOR DIAGONAL)

Khi **Số Giờ trùng Số Phút** ($HH = MM$), hệ thống tạo ra một đường chéo vàng gồm 16 từ neo gắn liền với cảm xúc mạnh, giúp người học ghi nhớ vị trí bảng mã vĩnh viễn:

> ⚡ **Quy tắc Thần Tốc**: Khi $HH = MM$, 2 chữ cái đầu của Mã Base60 luôn là **CHỮ CÁI LẶP ĐÔI**!

| $HH:MM$ | Từ Neo | Mã 6 Số | Mã Base60 | Phân Tích Mã |
| :---: | :---: | :---: | :---: | :--- |
| **`07:07`** | **hôn** | `070700` | **`hhz`** | `h` (PA h) + `h` (vần ôn) + `z` (Bằng B1) |
| **`08:08`** | **vú** | `080801` | **`vvs`** | `v` (PA v) + `v` (vần u) + `s` (Sắc B1) |
| **`09:09`** | **dâm** | `090900` | **`DDz`** | `D` (PA d) + `D` (vần âm) + `z` (Bằng B1) |
| **`10:10`** | **mút** | `101000` | **`mmz`** | `m` (PA m) + `m` (vần ut) + `z` (Bằng B1) |
| **`11:11`** | **chịch** | `111105` | **`CCj`** | `C` (PA ch) + `C` (vần ich) + `j` (Nặng B1) |
| **`12:12`** | **rên** | `121200` | **`rrz`** | `r` (PA r) + `r` (vần ên) + `z` (Bằng B1) |
| **`13:13`** | **sướng** | `131301` | **`sss`** | `s` (PA s) + `s` (vần ương) + `s` (Sắc B1) |
| **`14:14`** | **nứng** | `141401` | **`nns`** | `n` (PA n) + `n` (vần ưng) + `s` (Sắc B1) |
| **`15:15`** | **bướm** | `151501` | **`bbs`** | `b` (PA b) + `b` (vần ươm) + `s` (Sắc B1) |
| **`16:16`** | **liếm** | `161601` | **`lls`** | `l` (PA l) + `l` (vần iêm) + `s` (Sắc B1) |
| **`17:17`** | **chim** | `171700` | **`QQz`** | `Q` (PA ch2) + `Q` (vần im) + `z` (Bằng B1) |
| **`18:18`** | **sờ** | `181802` | **`SSf`** | `S` (PA s2) + `S` (vần ơ) + `f` (Huyền B1) |
| **`19:19`** | **ôm** | `191900` | **`zzz`** | `z` (PA rỗng) + `z` (vần ôm) + `z` (Bằng B1) |
| **`20:20`** | **ngực** | `202005` | **`NNj`** | `N` (PA ng) + `N` (vần ưc) + `j` (Nặng B1) |
| **`21:21`** | **nhấp** | `212100` | **`yyz`** | `y` (PA nh) + `y` (vần âp) + `z` (Bằng B1) |
| **`22:22`** | **lồn** | `222202` | **`LLf`** | `L` (PA l2) + `L` (vần ôn) + `f` (Huyền B1) |

---

## 4. CƠ CHẾ GÁN VẦN ĐA BẢNG (MULTI-TABLE CODE SHARING)

Trong kiến trúc 3 Bảng, các vần ở **KHÁC BẢNG NHAU** hoàn toàn có thể dùng **CHUNG 1 KÝ TỰ MÃ BASE60** mà không bao giờ bị xung đột, bởi vì ký tự đuôi $C_3$ (Dấu) sẽ chỉ rõ nguồn gốc bảng:

### 🌟 Ví dụ Kinh điển: Mã `h` dùng chung cho `ôn` (B1), `iêu` (B2), `uân` (B3)

| Từ | Vần & Bảng | Mã 6 Số | Mã Base60 | Cơ Chế Phân Biệt Tự Động |
| :---: | :---: | :---: | :---: | :--- |
| **hôn** | `ôn` *(B1)* | `070700` | **`hhz`** | Đuôi **`z`** (Telex thường) $\rightarrow$ Tra mã `h` ở **Bảng 1** $\rightarrow$ Ra **`ôn`** |
| **chiếu** | `iêu` *(B2)* | `110707` | **`ChS`** | Đuôi **`S`** (Telex HOA) $\rightarrow$ Tra mã `h` ở **Bảng 2** $\rightarrow$ Ra **`iêu`** |
| **chuẩn** | `uân` *(B3)* | `110715` | **`Chu`** | Đuôi **`u`** (Nguyên âm thường) $\rightarrow$ Tra mã `h` ở **Bảng 3** $\rightarrow$ Ra **`uân`** |
| **thuần** | `uân` *(B3)* | `040732` | **`ThI`** | Đuôi **`I`** (Nguyên âm HOA) $\rightarrow$ Tra mã `h` ở **Bảng 3** $\rightarrow$ Ra **`uân`** |

---

## 5. HỆ SINH THÁI GIỜ THIÊNG & CÁC THẾ SỐ ĐẸP

Hệ thống tích hợp sẵn các bộ từ ngữ ấn tượng cho toàn bộ các thế số đẹp trên đồng hồ:

### 🪞 1. Thế Số Đảo / Gánh (Mirror Times):
* **`06:09`** *(Tư thế 69)* $\rightarrow$ **`khít`** (`KDZ`)
* **`09:06`** $\rightarrow$ **`dạng`** (`DKj`) *(dạng háng / dạng chân)*
* **`12:21`** $\rightarrow$ **`rập`** (`ryj`) *(dập dập rập rập)*
* **`21:12`** $\rightarrow$ **`nhoài`** (`yrF`) *(nhoài người)*
* **`13:31`** $\rightarrow$ **`săm`** (`s0z`) *(săm soi)*
* **`14:41`** $\rightarrow$ **`nẫu`** (`nAx`) *(nẫu ruột)*
* **`01:10`** $\rightarrow$ **`đút`** (`dmz`) *(đút vào)*
* **`04:40`** $\rightarrow$ **`thật`** (`T95`) *(thật lòng)*
* **`05:50`** $\rightarrow$ **`kê`** (`kUz`) *(kê cao)*

### 🚀 2. Thế Số Sảnh Tiến (Straight Times):
* **`01:23`** $\rightarrow$ **`được`** (`dWy`)
* **`12:34`** $\rightarrow$ **`rớt`** (`r3S`) *(giữ nguyên 12:12 là `rên` - dùng Sắc B2 là `S`)*
* **`23:45`** $\rightarrow$ **`nghẻm`** (`WHr`) *(nghẻo củ tỏi)*
* **`02:34`** $\rightarrow$ **`quặp`** (`q35`) *(quặp lấy)*
* **`03:45`** $\rightarrow$ **`ghém`** (`GHs`)
* **`00:12`** $\rightarrow$ **`cuồng`** (`cri`) *(cuồng nhiệt)*

### 👯 3. Thế Số Cặp Đôi (Pairs):
* **`11:22`** $\rightarrow$ **`chồn`** (`CLf`) *(chồn chân)*
* **`22:11`** $\rightarrow$ **`lích`** (`LCs`) *(liên tưởng "lick" liếm tiếng Anh)*
* **`10:20`** $\rightarrow$ **`móp`** (`mNS`) *(liên tưởng "bóp")*
* **`20:10`** $\rightarrow$ **`nguôi`** (`Nma`) *(nguôi ngoai)*
* **`08:16`** $\rightarrow$ **`vòi`** (`vlF`) *(vòi vĩnh)*

---

## 6. MẸO TRA CỨU NHANH & LỌC 1 CHẠM (MOBILE & DESKTOP)

### 📱 Trên Điện thoại (1 Chạm - Cực Nhanh):
1. **Chạm vào Badge Mã**: Chạm vào bất kỳ chữ cái nào ở cột Mã (VD: `h`, `c`, `d`) $\rightarrow$ Bảng tự động gom và chỉ hiển thị đúng các vần mang mã đó.
2. **Chạm vào Ô Vần**: Tự động lọc riêng theo vần đó.
3. **Nút `[✖]`**: Nhấn để hủy lọc ngay lập tức.

### ⌨️ Trên Máy tính (Cú pháp Tiền tố & Regex):
* Gõ **`:h`** hoặc **`m:h`** $\rightarrow$ Lọc riêng cột **Mã Base60**.
* Gõ **`v:uân`** $\rightarrow$ Lọc riêng cột **Vần**.
* Gõ **`^c.*s$`** hoặc **`ch*nh`** $\rightarrow$ Tìm kiếm bằng **Biểu thức chính quy (Regex)** và **Ký tự đại diện Wildcard (`*`, `?`)**.
* Tìm kiếm có chức năng **Highlight phát sáng (Cyber Neon)** làm nổi bật đúng đoạn ký tự khớp.

---
*Biên soạn & Cập nhật: Hệ thống VSecretNote (TimeCypher Engine).*
