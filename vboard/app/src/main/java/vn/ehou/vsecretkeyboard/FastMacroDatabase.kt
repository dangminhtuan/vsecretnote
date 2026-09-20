package vn.ehou.vsecretkeyboard

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class MacroItem(
    val label: String,      // Nhãn ngắn gọn hiển thị trên phím (2-4 ký tự)
    val fullText: String    // Văn bản hoàn chỉnh được chèn vào (kèm dấu cách)
)

object FastMacroDatabase {

    private const val PREF_NAME = "vsecret_macro_prefs"
    private const val KEY_PREFIX = "macro_"

    // Hàm tạo nhãn thông minh 4 cấp độ
    fun generateSmartLabel(phrase: String, targetKey: Char): Pair<String, Int> {
        val clean = phrase.trim()
        val words = clean.split("\\s+".toRegex()).filter { it.isNotEmpty() }
        val count = words.size
        return when {
            count <= 1 -> {
                // Cấp 1: Bỏ ký tự đầu nếu trùng targetKey, hoặc lấy đuôi
                val first = if (words.isNotEmpty()) words[0].lowercase() else ""
                val label = if (first.startsWith(targetKey.lowercaseChar())) {
                    first.substring(1).ifEmpty { first }
                } else {
                    first
                }
                Pair(label, 1)
            }
            count == 2 -> {
                // Cấp 2: Từ thứ 2 viết hoa
                val second = words[1].replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
                Pair(second, 2)
            }
            count in 3..4 -> {
                // Cấp 3: Viết tắt chữ cái đầu viết thường
                val acronym = words.map { it.first().lowercaseChar() }.joinToString("")
                Pair(acronym, 3)
            }
            else -> {
                // Cấp 4: 2 ký tự đầu của 2 từ đầu + khoảng trắng + tổng số từ
                val c1 = words[0].first().lowercaseChar()
                val c2 = words[1].first().lowercaseChar()
                Pair("$c1$c2 $count", 4)
            }
        }
    }

    // Từ điển tốc ký 4 cấp độ tiếng Việt mặc định đầy đủ 26 chữ cái:
    val DEFAULT_DATA: Map<String, List<MacroItem>> = mapOf(
        "a" to listOf(
            MacroItem("i", "ai "),
            MacroItem("n", "an "),
            MacroItem("nh", "anh "),
            MacroItem("ng", "ang "),
            MacroItem("o", "ao "),
            MacroItem("p", "ap "),
            MacroItem("t", "at "),
            MacroItem("y", "ay "),
            MacroItem("m", "am "),
            MacroItem("c", "ac "),
            MacroItem("Ninh", "an ninh "),
            MacroItem("Toàn", "an toàn "),
            MacroItem("Tâm", "an tâm "),
            MacroItem("Hùng", "anh hùng "),
            MacroItem("Em", "anh em "),
            MacroItem("Chị", "anh chị "),
            MacroItem("Dưỡng", "an dưỡng "),
            MacroItem("atgt", "an toàn giao thông "),
            MacroItem("antt", "an ninh trật tự "),
            MacroItem("atld", "an toàn lao động "),
            MacroItem("av", "anh văn "),
            MacroItem("ah 6", "anh hùng lực lượng vũ trang nhân dân "),
            MacroItem("at 5", "an toàn vệ sinh lao động ")
        ),
        "b" to listOf(
            MacroItem("ạn", "bạn "),
            MacroItem("iết", "biết "),
            MacroItem("ằng", "bằng "),
            MacroItem("ây", "bây "),
            MacroItem("ước", "bước "),
            MacroItem("ên", "bên "),
            MacroItem("ảo", "bảo "),
            MacroItem("àn", "bàn "),
            MacroItem("ao", "bao "),
            MacroItem("ớt", "bớt "),
            MacroItem("Giờ", "bây giờ "),
            MacroItem("Cáo", "báo cáo "),
            MacroItem("Đầu", "bắt đầu "),
            MacroItem("Nhiêu", "bao nhiêu "),
            MacroItem("Vệ", "bảo vệ "),
            MacroItem("Hiểm", "bảo hiểm "),
            MacroItem("Trì", "bảo trì "),
            MacroItem("bqp", "bộ quốc phòng "),
            MacroItem("bca", "bộ công an "),
            MacroItem("bg 6", "bộ giáo dục và đào tạo "),
            MacroItem("byt", "bộ y tế "),
            MacroItem("btp", "bộ tư pháp "),
            MacroItem("bct", "bộ công thương "),
            MacroItem("bhxh", "bảo hiểm xã hội "),
            MacroItem("bt 5", "bảo hiểm y tế tự nguyện ")
        ),
        "c" to listOf(
            MacroItem("ó", "có "),
            MacroItem("ho", "cho "),
            MacroItem("ùng", "cùng "),
            MacroItem("ũng", "cũng "),
            MacroItem("ác", "các "),
            MacroItem("hỉ", "chỉ "),
            MacroItem("òn", "còn "),
            MacroItem("ần", "cần "),
            MacroItem("hưa", "chưa "),
            MacroItem("hính", "chính "),
            MacroItem("Thể", "có thể "),
            MacroItem("Ơn", "cảm ơn "),
            MacroItem("Việc", "công việc "),
            MacroItem("Nghệ", "công nghệ "),
            MacroItem("Khai", "công khai "),
            MacroItem("Tác", "công tác "),
            MacroItem("Cụ", "công cụ "),
            MacroItem("Ty", "công ty "),
            MacroItem("Trình", "chương trình "),
            MacroItem("ch 8", "cộng hòa xã hội chủ nghĩa việt nam "),
            MacroItem("cntt", "công nghệ thông tin "),
            MacroItem("cp", "chính phủ "),
            MacroItem("cskh", "chăm sóc khách hàng "),
            MacroItem("cmnd", "chứng minh nhân dân "),
            MacroItem("cccd", "căn cước công dân "),
            MacroItem("csdl", "cơ sở dữ liệu ")
        ),
        "d" to listOf(
            MacroItem("ược", "được "),
            MacroItem("i", "đi "),
            MacroItem("ến", "đến "),
            MacroItem("ầu", "đầu "),
            MacroItem("úng", "đúng "),
            MacroItem("ủ", "đủ "),
            MacroItem("ã", "đã "),
            MacroItem("ang", "đang "),
            MacroItem("ều", "điều "),
            MacroItem("ặt", "đặt "),
            MacroItem("Đầu", "bắt đầu "),
            MacroItem("Nay", "đêm nay "),
            MacroItem("Này", "điều này "),
            MacroItem("Kiện", "điều kiện "),
            MacroItem("Điểm", "đặc điểm "),
            MacroItem("Thoại", "điện thoại "),
            MacroItem("Năng", "điện năng "),
            MacroItem("Tử", "điện tử "),
            MacroItem("Thực", "đích thực "),
            MacroItem("đl 6", "độc lập tự do hạnh phúc "),
            MacroItem("đb", "đặc biệt "),
            MacroItem("đt", "điện thoại "),
            MacroItem("đv", "đảng viên "),
            MacroItem("đcs", "đảng cộng sản "),
            MacroItem("đhqg", "đại học quốc gia "),
            MacroItem("đtn", "đoàn thanh niên ")
        ),
        "e" to listOf(
            MacroItem("m", "em "),
            MacroItem("ng", "eng "),
            MacroItem("p", "ep "),
            MacroItem("o", "eo "),
            MacroItem("th", "eth "),
            MacroItem("qu", "equ "),
            MacroItem("ấp", "e ấp "),
            MacroItem("n", "en "),
            MacroItem("Gái", "em gái "),
            MacroItem("Trai", "em trai "),
            MacroItem("Út", "em út "),
            MacroItem("Sợ", "e sợ "),
            MacroItem("Ngại", "e ngại "),
            MacroItem("Lệ", "e lệ "),
            MacroItem("Ấp", "e ấp "),
            MacroItem("ec", "electronic commerce "),
            MacroItem("erp", "enterprise resource planning "),
            MacroItem("eng", "english language "),
            MacroItem("em 5", "em chúc anh chị một ngày ")
        ),
        "f" to listOf(
            MacroItem("acebook", "facebook "),
            MacroItem("ast", "fast "),
            MacroItem("ile", "file "),
            MacroItem("lash", "flash "),
            MacroItem("orm", "form "),
            MacroItem("un", "fun "),
            MacroItem("ull", "full "),
            MacroItem("oot", "foot "),
            MacroItem("ree", "free "),
            MacroItem("resh", "fresh "),
            MacroItem("Back", "feedback "),
            MacroItem("Ware", "firmware "),
            MacroItem("Time", "full time "),
            MacroItem("Tech", "fintech "),
            MacroItem("Word", "forward "),
            MacroItem("fdi", "đầu tư trực tiếp nước ngoài "),
            MacroItem("fpt", "công ty fpt "),
            MacroItem("faq", "câu hỏi thường gặp "),
            MacroItem("fmcg", "hàng tiêu dùng nhanh "),
            MacroItem("fa 5", "fpt information system company ")
        ),
        "g" to listOf(
            MacroItem("ặp", "gặp "),
            MacroItem("ọi", "gọi "),
            MacroItem("iờ", "giờ "),
            MacroItem("ửi", "gửi "),
            MacroItem("ần", "gần "),
            MacroItem("iúp", "giúp "),
            MacroItem("iá", "giá "),
            MacroItem("iải", "giải "),
            MacroItem("iáo", "giáo "),
            MacroItem("iữ", "giữ "),
            MacroItem("Viên", "giáo viên "),
            MacroItem("Dục", "giáo dục "),
            MacroItem("Trình", "giáo trình "),
            MacroItem("Pháp", "giải pháp "),
            MacroItem("Đoạn", "giai đoạn "),
            MacroItem("Thích", "giải thích "),
            MacroItem("Quyết", "giải quyết "),
            MacroItem("Đình", "gia đình "),
            MacroItem("gddt", "giáo dục đào tạo "),
            MacroItem("gtvt", "giao thông vận tải "),
            MacroItem("gpkd", "giấy phép kinh doanh "),
            MacroItem("gdt", "giá trị gia tăng "),
            MacroItem("gd 5", "giám đốc điều hành doanh nghiệp ")
        ),
        "h" to listOf(
            MacroItem("ay", "hay "),
            MacroItem("ơn", "hơn "),
            MacroItem("ọc", "học "),
            MacroItem("ết", "hết "),
            MacroItem("oặc", "hoặc "),
            MacroItem("ãy", "hãy "),
            MacroItem("iểu", "hiểu "),
            MacroItem("ỏi", "hỏi "),
            MacroItem("ợp", "hợp "),
            MacroItem("oàn", "hoàn "),
            MacroItem("Nay", "hôm nay "),
            MacroItem("Tại", "hiện tại "),
            MacroItem("Toàn", "hoàn toàn "),
            MacroItem("Thống", "hệ thống "),
            MacroItem("Dẫn", "hướng dẫn "),
            MacroItem("Tập", "học tập "),
            MacroItem("Sinh", "học sinh "),
            MacroItem("Viên", "học viên "),
            MacroItem("Đồng", "hành động "),
            MacroItem("Trình", "hành trình "),
            MacroItem("Quả", "hiệu quả "),
            MacroItem("Lực", "hiệu lực "),
            MacroItem("hssv", "học sinh sinh viên "),
            MacroItem("hcm", "hồ chí minh "),
            MacroItem("hdnd", "hội đồng nhân dân "),
            MacroItem("htx", "hợp tác xã "),
            MacroItem("hdld", "hợp đồng lao động "),
            MacroItem("hd 6", "hội đồng quản trị công ty ")
        ),
        "i" to listOf(
            MacroItem("n", "in "),
            MacroItem("t", "ít "),
            MacroItem("ch", "ích "),
            MacroItem("pad", "ipad "),
            MacroItem("phone", "iphone "),
            MacroItem("nternet", "internet "),
            MacroItem("nbox", "inbox "),
            MacroItem("mport", "import "),
            MacroItem("mage", "image "),
            MacroItem("nfo", "info "),
            MacroItem("Ấn", "in ấn "),
            MacroItem("Nhất", "ít nhất "),
            MacroItem("Ổi", "ít ỏi "),
            MacroItem("Nhiều", "ít nhiều "),
            MacroItem("Lợi", "ích lợi "),
            MacroItem("Trí", "ích trí "),
            MacroItem("ip", "internet protocol "),
            MacroItem("it", "information technology "),
            MacroItem("iso", "tiêu chuẩn quốc tế "),
            MacroItem("ielts", "chứng chỉ tiếng anh "),
            MacroItem("in 5", "in ấn xuất bản phẩm toàn quốc ")
        ),
        "j" to listOf(
            MacroItem("ava", "java "),
            MacroItem("ob", "job "),
            MacroItem("oin", "join "),
            MacroItem("ump", "jump "),
            MacroItem("une", "june "),
            MacroItem("uly", "july "),
            MacroItem("am", "jam "),
            MacroItem("apan", "japan "),
            MacroItem("ournal", "journal "),
            MacroItem("ust", "just "),
            MacroItem("Tech", "java tech "),
            MacroItem("Team", "join team "),
            MacroItem("Fair", "job fair "),
            MacroItem("View", "job view "),
            MacroItem("js", "javascript "),
            MacroItem("jwt", "json web token "),
            MacroItem("jdk", "java development kit "),
            MacroItem("json", "json data format "),
            MacroItem("js 5", "javascript and typescript stack project ")
        ),
        "k" to listOf(
            MacroItem("hông", "không "),
            MacroItem("hi", "khi "),
            MacroItem("hác", "khác "),
            MacroItem("ia", "kia "),
            MacroItem("hó", "khó "),
            MacroItem("hả", "khả "),
            MacroItem("hí", "khí "),
            MacroItem("hách", "khách "),
            MacroItem("hoảng", "khoảng "),
            MacroItem("hắc", "khắc "),
            MacroItem("Khăn", "khó khăn "),
            MacroItem("Gian", "không gian "),
            MacroItem("Năng", "khả năng "),
            MacroItem("Quả", "kết quả "),
            MacroItem("Hợp", "kết hợp "),
            MacroItem("Thúc", "kết thúc "),
            MacroItem("Hạch", "kế hoạch "),
            MacroItem("Toán", "kế toán "),
            MacroItem("Doanh", "kinh doanh "),
            MacroItem("Tế", "kinh tế "),
            MacroItem("kc 8", "không có gì quý hơn độc lập tự do "),
            MacroItem("kt", "kinh tế "),
            MacroItem("khtn", "khoa học tự nhiên "),
            MacroItem("khxh", "khoa học xã hội "),
            MacroItem("kcn", "khu công nghiệp "),
            MacroItem("kđt", "khu đô thị "),
            MacroItem("kt 6", "kiểm toán nhà nước việt nam ")
        ),
        "l" to listOf(
            MacroItem("à", "là "),
            MacroItem("ại", "lại "),
            MacroItem("ên", "lên "),
            MacroItem("àm", "làm "),
            MacroItem("ớn", "lớn "),
            MacroItem("ần", "lần "),
            MacroItem("uôn", "luôn "),
            MacroItem("uật", "luật "),
            MacroItem("ực", "lực "),
            MacroItem("òng", "lòng "),
            MacroItem("Việc", "làm việc "),
            MacroItem("Lao", "lao động "),
            MacroItem("Doanh", "liên doanh "),
            MacroItem("Kết", "liên kết "),
            MacroItem("Quan", "liên quan "),
            MacroItem("Tục", "liên tục "),
            MacroItem("Lượng", "lực lượng "),
            MacroItem("lđ 7", "lao động thương binh và xã hội "),
            MacroItem("lhq", "liên hợp quốc "),
            MacroItem("ls", "luật sư "),
            MacroItem("lh", "liên hệ "),
            MacroItem("ld", "lao động "),
            MacroItem("ll 6", "lực lượng vũ trang nhân dân ")
        ),
        "m" to listOf(
            MacroItem("ình", "mình "),
            MacroItem("ột", "một "),
            MacroItem("ới", "mới "),
            MacroItem("à", "mà "),
            MacroItem("ỗi", "mỗi "),
            MacroItem("ặt", "mặt "),
            MacroItem("ở", "mở "),
            MacroItem("ắt", "mắt "),
            MacroItem("ất", "mất "),
            MacroItem("ua", "mua "),
            MacroItem("Người", "mọi người "),
            MacroItem("Tiêu", "mục tiêu "),
            MacroItem("Đích", "mục đích "),
            MacroItem("Hình", "mô hình "),
            MacroItem("Trường", "môi trường "),
            MacroItem("Cực", "tích cực "),
            MacroItem("mxh", "mạng xã hội "),
            MacroItem("mtv", "một thành viên "),
            MacroItem("msnv", "mã số nhân viên "),
            MacroItem("mst", "mã số thuế "),
            MacroItem("mt 6", "mặt trận tổ quốc việt nam ")
        ),
        "n" to listOf(
            MacroItem("gày", "ngày "),
            MacroItem("hư", "như "),
            MacroItem("hiều", "nhiều "),
            MacroItem("hất", "nhất "),
            MacroItem("ào", "nào "),
            MacroItem("hưng", "nhưng "),
            MacroItem("ên", "nên "),
            MacroItem("ếu", "nếu "),
            MacroItem("ói", "nói "),
            MacroItem("hận", "nhận "),
            MacroItem("Nay", "ngày nay "),
            MacroItem("Thế", "như thế "),
            MacroItem("Nơi", "nơi nào "),
            MacroItem("Nghiệp", "nông nghiệp "),
            MacroItem("Vụ", "nhiệm vụ "),
            MacroItem("Dung", "nội dung "),
            MacroItem("Lực", "năng lực "),
            MacroItem("Lượng", "năng lượng "),
            MacroItem("ntn", "như thế nào "),
            MacroItem("nn", "nông nghiệp "),
            MacroItem("nn 7", "nông nghiệp và phát triển nông thôn "),
            MacroItem("nxb", "nhà xuất bản "),
            MacroItem("nhnn", "ngân hàng nhà nước "),
            MacroItem("nd 6", "nghị định chính phủ ban hành ")
        ),
        "o" to listOf(
            MacroItem("nline", "online "),
            MacroItem("ffline", "offline "),
            MacroItem("pen", "open "),
            MacroItem("k", "ok "),
            MacroItem("ff", "off "),
            MacroItem("ld", "old "),
            MacroItem("rder", "order "),
            MacroItem("ver", "over "),
            MacroItem("ffer", "offer "),
            MacroItem("nce", "once "),
            MacroItem("Mạng", "trực tuyến "),
            MacroItem("Hàng", "đặt hàng "),
            MacroItem("Cửa", "mở cửa "),
            MacroItem("oop", "lập trình hướng đối tượng "),
            MacroItem("ota", "over the air update "),
            MacroItem("os", "hệ điều hành "),
            MacroItem("on 5", "online learning and training system ")
        ),
        "p" to listOf(
            MacroItem("hải", "phải "),
            MacroItem("hát", "phát "),
            MacroItem("hần", "phần "),
            MacroItem("hương", "phương "),
            MacroItem("háp", "pháp "),
            MacroItem("hòng", "phòng "),
            MacroItem("hố", "phố "),
            MacroItem("hiền", "phiền "),
            MacroItem("hụ", "phụ "),
            MacroItem("hiếu", "phiếu "),
            MacroItem("Triển", "phát triển "),
            MacroItem("Hiện", "phát hiện "),
            MacroItem("Thức", "phương thức "),
            MacroItem("Tiện", "phương tiện "),
            MacroItem("Án", "phương án "),
            MacroItem("Luật", "pháp luật "),
            MacroItem("Vụ", "phục vụ "),
            MacroItem("Trách", "phụ trách "),
            MacroItem("pccc", "phòng cháy chữa cháy "),
            MacroItem("pt 5", "phát triển nông nghiệp nông thôn "),
            MacroItem("pgd", "phòng giáo dục "),
            MacroItem("ptt", "phó thủ tướng ")
        ),
        "q" to listOf(
            MacroItem("uá", "quá "),
            MacroItem("ua", "qua "),
            MacroItem("uan", "quan "),
            MacroItem("uy", "quy "),
            MacroItem("uân", "quân "),
            MacroItem("uốc", "quốc "),
            MacroItem("uền", "quyền "),
            MacroItem("uên", "quên "),
            MacroItem("uận", "quận "),
            MacroItem("uảng", "quảng "),
            MacroItem("Trọng", "quan trọng "),
            MacroItem("Tâm", "quan tâm "),
            MacroItem("Điểm", "quan điểm "),
            MacroItem("Hệ", "quan hệ "),
            MacroItem("Quốc", "quốc gia "),
            MacroItem("Tế", "quốc tế "),
            MacroItem("Phòng", "quốc phòng "),
            MacroItem("Định", "quy định "),
            MacroItem("Trình", "quy trình "),
            MacroItem("qh", "quốc hội "),
            MacroItem("qđ", "quyết định "),
            MacroItem("qltt", "quản lý thị trường "),
            MacroItem("qđnd", "quân đội nhân dân "),
            MacroItem("qh 6", "quốc hội nước cộng hòa xã hội ")
        ),
        "r" to listOf(
            MacroItem("ất", "rất "),
            MacroItem("a", "ra "),
            MacroItem("ồi", "rồi "),
            MacroItem("ộng", "rộng "),
            MacroItem("õ", "rõ "),
            MacroItem("ời", "rời "),
            MacroItem("út", "rút "),
            MacroItem("ủ", "rủ "),
            MacroItem("iêng", "riêng "),
            MacroItem("ực", "rực "),
            MacroItem("Ràng", "rõ ràng "),
            MacroItem("Rãi", "rộng rãi "),
            MacroItem("Nhanh", "rất nhanh "),
            MacroItem("Nhiều", "rất nhiều "),
            MacroItem("Tốt", "rất tốt "),
            MacroItem("Hay", "rất hay "),
            MacroItem("Lòng", "rộng lòng "),
            MacroItem("rd", "nghiên cứu và phát triển "),
            MacroItem("rom", "bộ nhớ chỉ đọc "),
            MacroItem("ram", "bộ nhớ truy xuất ngẫu nhiên "),
            MacroItem("rr 5", "rất vui được gặp lại bạn ")
        ),
        "s" to listOf(
            MacroItem("ẽ", "sẽ "),
            MacroItem("ự", "sự "),
            MacroItem("au", "sau "),
            MacroItem("ang", "sang "),
            MacroItem("ớm", "sớm "),
            MacroItem("uy", "suy "),
            MacroItem("ố", "số "),
            MacroItem("ách", "sách "),
            MacroItem("uất", "suất "),
            MacroItem("âu", "sâu "),
            MacroItem("Việc", "sự việc "),
            MacroItem("Kiện", "sự kiện "),
            MacroItem("Thật", "sự thật "),
            MacroItem("Lượng", "số lượng "),
            MacroItem("Liệu", "số liệu "),
            MacroItem("Nghĩ", "suy nghĩ "),
            MacroItem("Xuất", "sản xuất "),
            MacroItem("Phẩm", "sản phẩm "),
            MacroItem("sv", "sinh viên "),
            MacroItem("sđt", "số điện thoại "),
            MacroItem("stk", "số tài khoản "),
            MacroItem("sx", "sản xuất "),
            MacroItem("st 5", "sổ tay quản lý chất lượng ")
        ),
        "t" to listOf(
            MacroItem("ôi", "tôi "),
            MacroItem("heo", "theo "),
            MacroItem("rên", "trên "),
            MacroItem("rước", "trước "),
            MacroItem("rong", "trong "),
            MacroItem("ừ", "từ "),
            MacroItem("ại", "tại "),
            MacroItem("ìm", "tìm "),
            MacroItem("hêm", "thêm "),
            MacroItem("ất", "tất "),
            MacroItem("Gian", "thời gian "),
            MacroItem("Tế", "thực tế "),
            MacroItem("Tin", "thông tin "),
            MacroItem("Tục", "tiếp tục "),
            MacroItem("Cả", "tất cả "),
            MacroItem("Trình", "tiến trình "),
            MacroItem("Hiện", "thực hiện "),
            MacroItem("Gia", "tham gia "),
            MacroItem("Quốc", "trung quốc "),
            MacroItem("Trọng", "quan trọng "),
            MacroItem("tnhh", "trách nhiệm hữu hạn "),
            MacroItem("tphcm", "thành phố hồ chí minh "),
            MacroItem("tt", "thông tin "),
            MacroItem("tc", "tài chính "),
            MacroItem("thpt", "trung học phổ thông "),
            MacroItem("thcs", "trung học cơ sở "),
            MacroItem("tp 6", "thành phố trực thuộc trung ương ")
        ),
        "u" to listOf(
            MacroItem("ng", "ung "),
            MacroItem("ống", "uống "),
            MacroItem("ối", "uối "),
            MacroItem("a", "ua "),
            MacroItem("m", "um "),
            MacroItem("mê", "u mê "),
            MacroItem("uất", "u uất "),
            MacroItem("n", "un "),
            MacroItem("Thư", "ung thư "),
            MacroItem("Nước", "uống nước "),
            MacroItem("Buồn", "u sầu "),
            MacroItem("Tối", "u tối "),
            MacroItem("ubnd", "ủy ban nhân dân "),
            MacroItem("ubmttq", "ủy ban mặt trận tổ quốc "),
            MacroItem("usb", "cổng usb "),
            MacroItem("ub 6", "ủy ban nhân dân thành phố ")
        ),
        "v" to listOf(
            MacroItem("à", "và "),
            MacroItem("ào", "vào "),
            MacroItem("ề", "về "),
            MacroItem("ì", "vì "),
            MacroItem("ới", "với "),
            MacroItem("ẫn", "vẫn "),
            MacroItem("iệc", "việc "),
            MacroItem("iết", "viết "),
            MacroItem("ừa", "vừa "),
            MacroItem("ăn", "văn "),
            MacroItem("Vấn", "vấn đề "),
            MacroItem("Bản", "văn bản "),
            MacroItem("Phòng", "văn phòng "),
            MacroItem("Hóa", "văn hóa "),
            MacroItem("Nam", "việt nam "),
            MacroItem("Vị", "đơn vị "),
            MacroItem("Trí", "vị trí "),
            MacroItem("vhtt", "văn hóa thông tin "),
            MacroItem("vn", "việt nam "),
            MacroItem("vnd", "việt nam đồng "),
            MacroItem("vpub", "văn phòng ủy ban "),
            MacroItem("vksnd", "viện kiểm sát nhân dân "),
            MacroItem("vn 6", "việt nam độc lập tự do hạnh phúc ")
        ),
        "w" to listOf(
            MacroItem("ebsite", "website "),
            MacroItem("ebi", "webinar "),
            MacroItem("ifi", "wifi "),
            MacroItem("in", "win "),
            MacroItem("ord", "word "),
            MacroItem("ork", "work "),
            MacroItem("eb", "web "),
            MacroItem("ebcam", "webcam "),
            MacroItem("indow", "window "),
            MacroItem("eather", "weather "),
            MacroItem("Wide", "world wide "),
            MacroItem("Page", "web page "),
            MacroItem("Link", "web link "),
            MacroItem("Site", "web site "),
            MacroItem("www", "world wide web "),
            MacroItem("wto", "tổ chức thương mại thế giới "),
            MacroItem("who", "tổ chức y tế thế giới "),
            MacroItem("ww 5", "world wide web information system ")
        ),
        "x" to listOf(
            MacroItem("em", "xem "),
            MacroItem("ong", "xong "),
            MacroItem("inh", "xinh "),
            MacroItem("in", "xin "),
            MacroItem("ưa", "xưa "),
            MacroItem("ung", "xung "),
            MacroItem("ao", "xao "),
            MacroItem("ét", "xét "),
            MacroItem("ấu", "xấu "),
            MacroItem("iên", "xiên "),
            MacroItem("Khẩu", "xuất khẩu "),
            MacroItem("Hiện", "xuất hiện "),
            MacroItem("Dựng", "xây dựng "),
            MacroItem("Xử", "xử lý "),
            MacroItem("Nhận", "xác nhận "),
            MacroItem("Định", "xác định "),
            MacroItem("Quanh", "xung quanh "),
            MacroItem("xhcn", "xã hội chủ nghĩa "),
            MacroItem("xl", "xin lỗi "),
            MacroItem("xnk", "xuất nhập khẩu "),
            MacroItem("xđ", "xác định "),
            MacroItem("xd", "xây dựng "),
            MacroItem("xh 7", "xã hội văn minh hiện đại nghĩa tình ")
        ),
        "y" to listOf(
            MacroItem("êu", "yêu "),
            MacroItem("ếu", "yếu "),
            MacroItem("ên", "yên "),
            MacroItem("ý", "ý "),
            MacroItem("tá", "y tá "),
            MacroItem("ểm", "yểm "),
            MacroItem("êm", "yêm "),
            MacroItem("ếm", "yếm "),
            MacroItem("Cầu", "yêu cầu "),
            MacroItem("Thương", "yêu thương "),
            MacroItem("Tố", "yếu tố "),
            MacroItem("Tĩnh", "yên tĩnh "),
            MacroItem("Tâm", "yên tâm "),
            MacroItem("Tế", "y tế "),
            MacroItem("Ý", "ý kiến "),
            MacroItem("Nghĩa", "ý nghĩa "),
            MacroItem("yt", "y tế "),
            MacroItem("ytdf", "y tế dự phòng "),
            MacroItem("yb", "yên bái "),
            MacroItem("yt 5", "y tế cộng đồng chăm sóc sức khỏe ")
        ),
        "z" to listOf(
            MacroItem("alo", "zalo "),
            MacroItem("oom", "zoom "),
            MacroItem("ero", "zero "),
            MacroItem("one", "zone "),
            MacroItem("ip", "zip "),
            MacroItem("inc", "zinc "),
            MacroItem("oology", "zoology "),
            MacroItem("ebra", "zebra "),
            MacroItem("ombie", "zombie "),
            MacroItem("est", "zest "),
            MacroItem("App", "zalo app "),
            MacroItem("Pay", "zalo pay "),
            MacroItem("Out", "zoom out "),
            MacroItem("In", "zoom in "),
            MacroItem("zl", "zalo "),
            MacroItem("zp", "zalopay "),
            MacroItem("zm", "zoom meeting "),
            MacroItem("zf", "zenfone "),
            MacroItem("za 5", "zalo tin nhắn cuộc gọi miễn phí ")
        )
    )

    fun getMacrosForKey(context: Context?, key: String): List<MacroItem> {
        val lower = key.lowercase()
        if (context != null) {
            val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            val jsonStr = prefs.getString(KEY_PREFIX + lower, null)
            if (!jsonStr.isNullOrEmpty()) {
                try {
                    val arr = JSONArray(jsonStr)
                    val result = mutableListOf<MacroItem>()
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        val label = obj.getString("label")
                        val fullText = obj.getString("fullText")
                        result.add(MacroItem(label, fullText))
                    }
                    if (result.isNotEmpty()) return result
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        return DEFAULT_DATA[lower] ?: emptyList()
    }

    // Overload tiện dụng khi chưa có Context (dùng bộ mặc định)
    fun getMacrosForKey(key: String): List<MacroItem> {
        return getMacrosForKey(null, key)
    }

    fun saveMacrosForKey(context: Context, key: String, items: List<MacroItem>) {
        val lower = key.lowercase()
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val arr = JSONArray()
        for (item in items) {
            val obj = JSONObject()
            obj.put("label", item.label)
            obj.put("fullText", item.fullText)
            arr.put(obj)
        }
        prefs.edit().putString(KEY_PREFIX + lower, arr.toString()).apply()
    }

    fun resetMacrosForKey(context: Context, key: String) {
        val lower = key.lowercase()
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(KEY_PREFIX + lower).apply()
    }

    fun resetAll(context: Context) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }
}

