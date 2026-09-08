import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log("===============================================================");
console.log("🚀 BẮT ĐẦU MASTER SYNC: ĐỒNG BỘ TOÀN BỘ HỆ THỐNG TIMECYPHER");
console.log("===============================================================\n");

function runStep(title, scriptPath) {
  console.log(`\n▶ [CHẠY] ${title}...`);
  try {
    execSync(`node "${scriptPath}"`, {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log(`✔ [HOÀN TẤT] ${title}`);
  } catch (err) {
    console.error(`❌ [LỖI] ${title} thất bại:`, err.message);
    process.exit(1);
  }
}

// 1. Rebuild All Gboard & General Dictionaries
runStep("1. Tái tạo 16 gói Gboard & toàn bộ file từ điển tĩnh", path.join(__dirname, 'rebuild_all_dictionaries.mjs'));

// 2. Rebuild Banking & Learn Dictionaries
runStep("2. Tái tạo 3 gói Banking (Telex, VNI, Không Dấu)", path.join(__dirname, 'generate_banking_dicts.mjs'));

// 3. Rebuild Twins Data
runStep("3. Tái tạo dữ liệu Cặp Lặp (twins_data_full.json)", path.join(__dirname, 'rebuild_twins.mjs'));

console.log("\n===============================================================");
console.log("🎉 MASTER SYNC THÀNH CÔNG 100%! TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC ĐỒNG BỘ!");
console.log("===============================================================");
