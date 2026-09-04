# ⏱️ BẢN THIẾT KẾ KIẾN TRÚC TIMECYPHER & BASE60 (VCOMP)
> **Giải Mã Toàn Diện: "Cụ Thể Cái Gì Được Mã Hóa Thành Cái Gì?"**  
> *Dành cho cộng đồng mã nguồn mở GitHub, lập trình viên và người dùng muốn thấu hiểu nguyên lý nén ngôn ngữ Tiếng Việt & Tiếng Anh.*

---

## 🧭 MỤC LỤC
1. [Triết Lý Cốt Lõi: Bản Chất Của TimeCypher](#1-triết-lý-cốt-lõi-bản-chất-của-timecypher)
2. [Tập Ký Tự Base60 Chuẩn (Loại Bỏ Thị Giác Tranh Chấp)](#2-tập-ký-tự-base60-chuẩn-loại-bỏ-thị-giác-tranh-chấp)
3. [Ký Tự 1 ($C_1$ - Giờ HH): Phụ Âm Tiếng Việt Mã Hóa Thành Gì?](#3-ký-tự-1-c_1---giờ-hh-phụ-âm-tiếng-việt-mã-hóa-thành-gì)
4. [Ký Tự 2 ($C_2$ - Phút MM): 180 Vần Tiếng Việt Mã Hóa Thành Gì?](#4-ký-tự-2-c_2---phút-mm-180-vần-tiếng-việt-mã-hóa-thành-gì)
5. [Ký Tự 3 ($C_3$ - Giây SS): Dấu Thanh & Cơ Chế Phân Bảng](#5-ký-tự-3-c_3---giây-ss-dấu-thanh--cơ-chế-phân-bảng)
6. [Khoang Chứa 24 Slot Dôi Dư: Mã Hóa 34.560 Từ Tiếng Anh](#6-khoang-chứa-24-slot-dôi-dư-mã-hóa-34560-từ-tiếng-anh)
7. [Cơ Chế Đánh Dấu Chữ Hoa (Title Case & ALL CAPS)](#7-cơ-chế-đánh-dấu-chữ-hoa-title-case--all-caps)
8. [Mổ Xẻ Chi Tiết Từng Từ Thực Tế (Walkthrough Examples)](#8-mổ-xẻ-chi-tiết-từng-từ-thực-tế-walkthrough-examples)

---

## 1. TRIẾT LÝ CỐT LÕI: BẢN CHẤT CỦA TIMECYPHER

Trong tiếng Việt, một từ có thể dài tới 7-8 ký tự (ví dụ: `nghiêng`, `nghiệp`, `phương`...). App ngân hàng giới hạn nội dung chuyển khoản trong 30-50 ký tự và tự động hủy sạch dấu tiếng Việt.

**Hệ thống TimeCypher (VCOMP) giải quyết bài toán này bằng quy trình nén 2 chặng:**

```
                  ┌───────────────────────────────┐
                  │      TỪ TIẾNG VIỆT GỐC        │ (vd: muốn, đen, được)
                  └──────────────┬────────────────┘
                                 │ Chặng 1: Bóc tách ngữ âm học
                                 ▼
                  ┌───────────────────────────────┐
                  │    BỘ SỐ THỜI GIAN (HHMMSS)   │ (vd: 102601, 014600)
                  │   Giờ (HH) - Phút (MM) - Giây │
                  └──────────────┬────────────────┘
                                 │ Chặng 2: Nén Base60 (1:1)
                                 ▼
                  ┌───────────────────────────────┐
                  │       MÃ BASE60 3 KÝ TỰ       │
                  │        C₁    C₂    C₃         │ (vd: mCe, doz, dWy)
                  └───────────────────────────────┘
```

Mỗi ký tự trong chuỗi 3 ký tự đại diện cho một thành phần ngôn ngữ học bất biến:
* **$C_1$ (Ký tự thứ 1):** Đại diện cho **Phụ Âm Đầu** (Giờ $HH$).
* **$C_2$ (Ký tự thứ 2):** Đại diện cho **Vần** (Phút $MM$).
* **$C_3$ (Ký tự thứ 3):** Đại diện cho **Dấu Thanh** & **Chỉ Định Bảng Vần** (Giây $SS$).

---

## 2. TẬP KÝ TỰ BASE60 CHUẨN (LOẠI BỎ THỊ GIÁC TRANH CHẤP)

Tổng kho ký tự chữ cái và số ASCII gồm 62 ký tự: $10 \text{ số} + 26 \text{ chữ thường} + 26 \text{ chữ HOA}$.  
Để đạt đúng **60 ký tự Base60**, hệ thống **LOẠI BỎ ĐÚNG 2 KÝ TỰ GÂY LÚ NHẤT TRÊN FONT CHỮ DI ĐỘNG (SANS-SERIF)**:

1. **Loại bỏ `O` [chữ O-HOA]:** Triệt tiêu 100% việc nhìn nhầm với **`0` [số Không]**.
2. **Loại bỏ `I` [chữ i-ngắn HOA]:** Trong font Sans-serif (Roboto, Google Sans), chữ `I` hoa và chữ `l` thường đều là 1 nét sổ thẳng đứng `|`. Bằng cách loại bỏ hoàn toàn `I` hoa, **nét sổ thẳng duy nhất trên bàn phím chỉ còn lại là chữ `l` [chữ l-dài thường]**.
3. **Giữ trọn vẹn `o` [chữ o-thường]:** Chữ `o` là ký tự thân lùn (x-height), bằng nửa số 0 nên cực kỳ dễ đọc.

### 🔢 Danh Sách 60 Ký Tự Base60 Tuyệt Đối:
```
Index:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
Ký tự:  c  d  g  G  j  k  K  h  v  D  m  C  r  s  n  b  l  Q  S  z

Index: 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39
Ký tự:  N  y  L  W  p  f  q  t  T  R  x  0  1  2  3  4  5  6  7  8

Index: 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59
Ký tự:  9  A  B  E  F  H  o  J  M  P  U  V  X  Y  Z  a  e  i  u  w
```
*(Lưu ý: Index 46 là `o` [chữ o-thường], đại diện cho vần `en`)*.

---

## 3. KÝ TỰ 1 ($C_1$ - GIỜ HH): PHỤ ÂM TIẾNG VIỆT MÃ HÓA THÀNH GÌ?

Tiếng Việt có **31 phụ âm**, được chia thành 2 nhóm:
* **24 Phụ âm chính ($s_2 \in \{0, 1, 2\}$):**
  * `c, k, qu` $\rightarrow$ **`c`**
  * `đ` $\rightarrow$ **`d`**
  * `g` $\rightarrow$ **`g`**
  * `gh` $\rightarrow$ **`G`**
  * `gi` $\rightarrow$ **`j`**
  * `h` $\rightarrow$ **`h`**
  * `kh` $\rightarrow$ **`K`**
  * `v` $\rightarrow$ **`v`**
  * `d` $\rightarrow$ **`D`**
  * `m` $\rightarrow$ **`m`**
  * `ch` $\rightarrow$ **`C`**
  * `r` $\rightarrow$ **`r`**
  * `s` $\rightarrow$ **`s`**
  * `n` $\rightarrow$ **`n`**
  * `b` $\rightarrow$ **`b`**
  * `l` $\rightarrow$ **`l`** *(phụ âm l giữ nguyên chữ l thường!)*
  * `ng` $\rightarrow$ **`N`**
  * `nh` $\rightarrow$ **`y`**
  * `ngh` $\rightarrow$ **`L`**
  * `(nguyên âm mở đầu / phụ âm rỗng)` $\rightarrow$ **`z`**
* **7 Phụ âm phụ ($s_2 \in \{3, 4, 5\}$):**
  * `p` $\rightarrow$ **`p`**
  * `ph` $\rightarrow$ **`f`**
  * `qu` (nhóm phụ) $\rightarrow$ **`q`**
  * `t` $\rightarrow$ **`t`**
  * `th` $\rightarrow$ **`T`**
  * `tr` $\rightarrow$ **`R`**
  * `x` $\rightarrow$ **`x`**

---

## 4. KÝ TỰ 2 ($C_2$ - PHÚT MM): 180 VẦN TIẾNG VIỆT MÃ HÓA THÀNH GÌ?

Tiếng Việt có gần 200 vần. Để nén gọn vào **1 ký tự duy nhất ($C_2$)**, hệ thống chia vần thành **3 Bảng Vần** (mỗi bảng chứa đúng **60 vần** tương ứng 60 ký tự Base60):

$$\mathbf{60 \text{ Vần Bảng Chính (B1)}} + \mathbf{60 \text{ Vần Phụ 1 (B2)}} + \mathbf{60 \text{ Vần Phụ 2 (B3)}} = \mathbf{180 \text{ Vần}}$$

### Bảng Tra Cứu Một Số Vần Điển Hình:

| Mã Base60 ($C_2$) | Vần Bảng 1 (B1 - Vần Phổ Biến) | Vần Bảng 2 (B2 - Vần Ghép) | Vần Bảng 3 (B3 - Vần Hiếm) |
| :---: | :--- | :--- | :--- |
| **`o`** | **`en`** *(đen, kèn, len)* | **`oen`** *(hoen)* | **`uyp`** *(buýp)* |
| **`C`** | **`uôn`** *(muốn, cuốn)* | **`iêt`** *(Việt, chiết)* | **`uông`** *(chuông, luống)* |
| **`f`** | **`ươn`** *(mượn, lượn)* | **`uôi`** *(chuối, đuôi)* | **`iêm`** *(chiêm, kiếm)* |
| **`W`** | **`anh`** *(thành, nhanh)* | **`ương`** *(thương, đường)* | **`oong`** *(xoong)* |
| **`s`** | **`oan`** *(toán, đoàn)* | **`ươc`** *(nước, bước)* | **`iêu`** *(chiếu, chiều)* |
| **`h`** | **`ôn`** *(hôn, chồn)* | **`iêu`** *(tiêu, phiêu)* | **`uân`** *(chuẩn, xuân)* |
| **`4`** | **`o`** *(cho, bò, cỏ, to)* | **`oap`** | **`uyt`** |

> 💡 **Hỏi:** *Nếu mã `C` đại diện cho cả `uôn` (B1) và `iêt` (B2), làm sao máy phân biệt được?*  
> 👉 **Đáp:** Nhờ **Ký tự thứ 3 ($C_3$)**! Nếu $C_3$ là phím Telex thường thì máy hiểu là Bảng 1 (`uôn`), nếu $C_3$ là phím Telex HOA thì máy hiểu là Bảng 2 (`iêt`)!

---

## 5. KÝ TỰ 3 ($C_3$ - GIÂY SS): DẤU THANH & CƠ CHẾ PHÂN BẢNG

Vị trí thứ 3 là **"linh hồn điều hướng"** của toàn bộ thuật toán. Nó mang 2 nhiệm vụ cùng lúc:
1. Xác định **Dấu Thanh** (Ngang, Sắc, Huyền, Hỏi, Ngã, Nặng).
2. Xác định **Từ đó thuộc Bảng Vần nào (B1, B2 hay B3)** và **Nhóm Phụ Âm nào (Chính hay Phụ)**.

### 🎼 Bảng Ánh Xạ 36 Slot Dấu Tiếng Việt:

| Nhóm Phụ Âm | Bảng Vần | Dấu Ngang | Dấu Sắc | Dấu Huyền | Dấu Hỏi | Dấu Ngã | Dấu Nặng | Bộ Phím Quy Ước |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Phụ âm Chính** | **Bảng 1 (B1)** | **`z`** | **`s`** | **`f`** | **`r`** | **`x`** | **`j`** | **Bộ Telex Thường** |
| **Phụ âm Chính** | **Bảng 2 (B2)** | **`Z`** | **`S`** | **`F`** | **`R`** | **`X`** | **`J`** | **Bộ Telex HOA** |
| **Phụ âm Chính** | **Bảng 3 (B3)** | **`a`** | **`e`** | **`i`** | **`u`** | **`w`** | **`y`** | **Bộ Nguyên Âm Thường** |
| **Phụ âm Phụ** | **Bảng 1 (B1)** | **`0`** | **`1`** | **`2`** | **`3`** | **`4`** | **`5`** | **Bộ VNI Số 0-5** |
| **Phụ âm Phụ** | **Bảng 2 (B2)** | **`6`** | **`7`** | **`8`** | **`9`** | **`B`** | **`C`** | **Bộ VNI Cao (6-9, B, C)** |
| **Phụ âm Phụ** | **Bảng 3 (B3)** | **`A`** | **`E`** | **`o`** | **`U`** | **`W`** | **`Y`** | **Bộ Nguyên Âm HOA (+ o)** |

$$\text{Tổng số slot dành cho Tiếng Việt} = 6 \text{ tổ hợp} \times 6 \text{ dấu thanh} = \mathbf{36 \text{ slots (từ index 00 đến 35)}}.$$

---

## 6. KHOANG CHỨA 24 SLOT DÔI DƯ: MÃ HÓA 34.560 TỪ TIẾNG ANH

Vì vị trí thứ 3 ($SS$) có 60 giây mà Tiếng Việt chỉ dùng hết **36 giây (00 đến 35)**, hệ thống còn dôi dư chính xác **24 slot (từ index 36 đến 59)**:

$$60 - 36 = \mathbf{24 \text{ slots}}$$

### 🇬🇧 Cơ Chế Nén Tiếng Anh Tự Động:
* Toàn bộ 24 slot này được dùng để mã hóa từ điển **Tiếng Anh thông dụng**:
  $$\text{Dung lượng lưu trữ} = 24 \times 1440 = \mathbf{34.560 \text{ từ tiếng Anh}}.$$
* Khi một từ tiếng Anh được nén, ký tự thứ 3 luôn rơi vào khoảng $\ge 36$.
* **Không bao giờ xung đột:** Máy chỉ cần nhìn vào ký tự thứ 3:
  * Nếu $C_3 \le 35$ $\rightarrow$ **100% là Tiếng Việt**.
  * Nếu $C_3 \ge 36$ $\rightarrow$ **100% là Tiếng Anh**.

---

## 7. CƠ CHẾ ĐÁNH DẤU CHỮ HOA (TITLE CASE & ALL CAPS)

Do mã nén chuẩn của từ viết thường luôn có độ dài đúng **3 ký tự**, hệ thống sử dụng tiền tố để hỗ trợ văn bản viết hoa:

* **Viết hoa chữ cái đầu (Title Case, vd: `Việt`):** Thêm tiền tố **`o` [chữ o-thường]** $\rightarrow$ Mã dài 4 ký tự: **`ovjJ`**.
* **Viết HOA TOÀN BỘ (ALL CAPS, vd: `VIỆT`):** Thêm tiền tố **`O` [chữ O-HOA]** $\rightarrow$ Mã dài 4 ký tự: **`OvjJ`**.
* **Giải mã:** Trình giải mã kiểm tra nếu mã có 4 ký tự bắt đầu bằng `o` hoặc `O` thì tự động trả về định dạng chữ hoa tương ứng.

---

## 8. MỔ XẺ CHI TIẾT TỪNG TỪ THỰC TẾ (WALKTHROUGH EXAMPLES)

### 📌 Ví dụ 1: Từ `đen` $\longrightarrow$ Mã `doz`
1. **Phụ âm đầu `đ`:** Thuộc nhóm Phụ âm chính $\rightarrow$ Ký tự $C_1$ = **`d`**.
2. **Vần `en`:** Nằm ở Index 46 của Bảng 1 $\rightarrow$ Ký tự $C_2$ = **`o`**.
3. **Thanh Ngang (Bằng B1):** Phụ âm chính + Bảng 1 + Dấu Ngang $\rightarrow$ Ký tự $C_3$ = **`z`** (Telex thường).
$$\Rightarrow \mathbf{d} + \mathbf{o} + \mathbf{z} = \mathbf{doz}$$
*(Thanh thoát, cực rõ ràng, triệt tiêu hoàn toàn lỗi nhìn nhầm `dIz` thành `dlz`!)*

---

### 📌 Ví dụ 2: Từ `muốn` $\longrightarrow$ Mã `mCe`
1. **Phụ âm đầu `m`:** Phụ âm chính $\rightarrow$ Ký tự $C_1$ = **`m`**.
2. **Vần `uôn`:** Nằm ở Index 11 của Bảng 1 $\rightarrow$ Ký tự $C_2$ = **`C`**.
3. **Dấu Sắc (B1):** Phụ âm chính + Bảng 1 + Dấu Sắc $\rightarrow$ Ký tự $C_3$ = **`e`** *(hoặc `s`)*.
$$\Rightarrow \mathbf{m} + \mathbf{C} + \mathbf{e} = \mathbf{mCe}$$

---

### 📌 Ví dụ 3: Từ `được` $\longrightarrow$ Mã `dWy`
1. **Phụ âm đầu `đ`:** Ký tự $C_1$ = **`d`**.
2. **Vần `ươc`:** Nằm ở Bảng 3 $\rightarrow$ Ký tự $C_2$ = **`W`**.
3. **Dấu Nặng (B3):** Phụ âm chính + Bảng 3 + Dấu Nặng $\rightarrow$ Ký tự $C_3$ = **`y`** (Nguyên âm thường).
$$\Rightarrow \mathbf{d} + \mathbf{W} + \mathbf{y} = \mathbf{dWy}$$

---

### 📌 Ví dụ 4: Từ `thành` $\longrightarrow$ Mã `TW2`
1. **Phụ âm đầu `th`:** Thuộc nhóm Phụ âm phụ $\rightarrow$ Ký tự $C_1$ = **`T`**.
2. **Vần `anh`:** Nằm ở Bảng 1 $\rightarrow$ Ký tự $C_2$ = **`W`**.
3. **Dấu Huyền (B1 - Phụ âm phụ):** Phụ âm phụ + Bảng 1 + Dấu Huyền $\rightarrow$ Ký tự $C_3$ = **`2`** (VNI 0-5).
$$\Rightarrow \mathbf{T} + \mathbf{W} + \mathbf{2} = \mathbf{TW2}$$

---

## 🏆 TỔNG KẾT
Hệ thống **TimeCypher (Base60)** là sự kết tinh giữa **Ngữ âm học Tiếng Việt**, **Toán học hoán vị** và **Công thái học hiển thị số**:
* Nén mọi từ tiếng Việt về **3 ký tự ASCII thuần**.
* Không lỗi font, không phụ thuộc máy chủ, an toàn tuyệt đối trước mọi app ngân hàng.
* Sạch sẽ, không còn bất kỳ sự nhầm lẫn thị giác nào giữa nét thẳng `I` và `l`.
