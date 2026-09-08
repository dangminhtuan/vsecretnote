# 🗺️ BẢN ĐỒ KIẾN TRÚC HỆ THỐNG TIMECYPHER BASE60 (PROJECT SYSTEM MAP)

> **Dành cho Người Dùng & AI trong các phiên hội thoại tiếp theo**:  
> Đọc file này ĐẦU TIÊN khi bắt đầu một phiên làm việc mới để nắm toàn bộ cấu trúc dự án, các công cụ sẵn có và quy trình đồng bộ tự động.

---

## 1. NGUỒN CHÂN LÝ DUY NHẤT (SINGLE SOURCE OF TRUTH)
- **`data.js`**: Định nghĩa toàn bộ mảng dữ liệu âm vị tiếng Việt:
  - `CONSONANTS_BASE` (24 phụ âm chính, HH = 0..23)
  - `CONSONANTS_EXTRA` (7 phụ âm phụ, HH = 24..30)
  - `RHYMES_BASE` (Bảng vần chính 1)
  - `RHYMES_EXTRA_1` (Bảng vần phụ 2)
  - `RHYMES_EXTRA_2` (Bảng vần phụ 3)
  - `BASE60_MAPPING` (Bảng 60 ký tự Base60 chuẩn)
  - `REAL_VIETNAMESE_WORDS` (~6.500 từ vựng tiếng Việt thực tế)
- **`vcomp.js`**: Engine toán học xử lý mã hóa & giải mã:
  - `encodeWord(word)`: Từ tiếng Việt ➔ Mã thời gian 6 số `hhmmss`.
  - `timeToBase60(time)`: Mã thời gian 6 số ➔ Chuỗi Base60 3 ký tự `C1C2C3`.
  - `base60ToTime(code)`: Chuỗi Base60 3 ký tự ➔ Mã thời gian 6 số.
  - `decodeWord(time)`: Mã thời gian 6 số ➔ Từ tiếng Việt nguyên bản.

---

## 2. QUY TRÌNH ĐỒNG BỘ 1 CHẠM (MASTER SYNC PIPELINE)
Bất cứ khi nào có thay đổi trong `data.js` hoặc `vcomp.js`, chỉ cần chạy **DUY NHẤT 1 LỆNH**:

```bash
npm run sync
```
*(Tương đương với: `node tools/master_sync.mjs`)*

Lệnh này sẽ tự động chạy dây chuyền 3 script trong thư mục `tools/`:
1. `tools/rebuild_all_dictionaries.mjs`: Tái tạo toàn bộ 16 tổ hợp Gboard zip, các file từ điển tĩnh `dictionary_1way.txt`, `dictionary_2way.txt`, `PersonalDictionary*.zip`...
2. `tools/generate_banking_dicts.mjs`: Tái tạo 3 gói Banking Telex, Banking VNI và Học vần không dấu.
3. `tools/rebuild_twins.mjs`: Quét và tái tạo toàn bộ dữ liệu Cặp Lặp trong `twins_data_full.json`.

---

## 3. DANH MỤC CÔNG CỤ (`/tools`)
- **`tools/master_sync.mjs`**: Nhạc trưởng điều phối toàn bộ pipeline đồng bộ.
- **`tools/rebuild_all_dictionaries.mjs`**: Tự động build và nén 16 file zip tổ hợp Gboard (R, F, B, L) cùng các từ điển hệ thống trong `public/`.
- **`tools/generate_banking_dicts.mjs`**: Tự động build 3 gói tiện ích ngân hàng & học vần.
- **`tools/rebuild_twins.mjs`**: Tự động mã hóa lại toàn bộ từ lặp trong `twins_data_full.json`.

---

## 4. CÁC GIAO DIỆN CHÍNH (PAGES & APPS)
- **`index.html`**: Giao diện chính mã hóa/giải mã TimeCypher, bàn phím ảo, hiển thị Base60.
- **`twins.html`**: Trang phân tích & huấn luyện Cặp Lặp (Tam hoa, Lặp đầu, Kẹp sandwich, Lặp đuôi), kèm bộ lọc ký tự đa năng.
- **`dict-matrix.html`**: Ma trận vần trực quan & trung tâm tải xuống các tổ hợp từ điển Gboard.
- **`matrix.html`**: Ma trận vần và 6 thanh điệu.
- **`mnemonic.html`**: Bộ thẻ flashcard ghi nhớ 60 ký tự Base60 và 30 cặp đối ứng.
- **`vssl.html`**: Hệ thống ngôn ngữ ký hiệu tốc ký tiếng Việt (Vietnamese Sign Speed Language).
- **`viscript.html`**: Hệ thống hiển thị đồ họa kiểu chữ tốc ký ViScript.

---

## 5. NGUYÊN TẮC BẢO TRÌ & MỞ RỘNG
1. **Không tạo script rời rạc trong thư mục tạm**: Mọi script sinh dữ liệu mới BẮT BUỘC phải lưu vào thư mục `tools/` và được gọi qua `master_sync.mjs`.
2. **Khôi phục khẩn cấp (Emergency Undo)**: Có thể quay về phiên bản ổn định trước đợt tái cấu trúc bằng lệnh:
   ```bash
   git reset --hard stable-before-rhyme-remap
   git clean -fd
   ```
