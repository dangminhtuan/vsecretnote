package vn.ehou.vsecretkeyboard

import java.util.Locale

/**
 * Bộ xử lý khẩu lệnh chính tả tiếng Việt tuân thủ 100% quy tắc ngữ pháp & xuất bản:
 * - Dấu mở ngoặc kép ": \"" hoặc " \"" (có khoảng trắng phía trước, dính sát chữ phía sau).
 * - Dấu đóng ngoặc kép "\" " (dính sát chữ phía trước, có khoảng trắng phía sau).
 * - Dấu phẩy, chấm, hai chấm, chấm hỏi, chấm than (dính sát chữ trước, cách chữ sau).
 * - Tự động viết hoa đầu câu và đầu lời thoại sau dấu hai chấm mở ngoặc kép.
 */
object VietnamesePunctuationFormatter {

    private const val TOKEN_OPEN_QUOTE = "___OPEN_QUOTE___"
    private const val TOKEN_CLOSE_QUOTE = "___CLOSE_QUOTE___"

    fun format(input: String): String {
        if (input.isBlank()) return input

        var text = input

        // 1. Phân biệt rõ ràng Dấu Mở và Dấu Đóng nháy kép
        text = text.replace(Regex("(?i)\\b(mở ngoặc kép|mở nháy kép|mở nháy|mở kép)\\b"), TOKEN_OPEN_QUOTE)
        text = text.replace(Regex("(?i)\\b(đóng ngoặc kép|đóng nháy kép|đóng nháy|đóng kép)\\b"), TOKEN_CLOSE_QUOTE)

        // Nếu nói chung chung "nháy kép" hoặc "ngoặc kép", tự động đảo chiều Mở -> Đóng
        if (text.contains(Regex("(?i)\\b(dấu nháy kép|nháy kép|ngoặc kép)\\b"))) {
            val sb = StringBuilder()
            val regex = Regex("(?i)\\b(dấu nháy kép|nháy kép|ngoặc kép)\\b")
            var isOpen = true
            var lastIdx = 0
            for (match in regex.findAll(text)) {
                sb.append(text.substring(lastIdx, match.range.first))
                sb.append(if (isOpen) TOKEN_OPEN_QUOTE else TOKEN_CLOSE_QUOTE)
                isOpen = !isOpen
                lastIdx = match.range.last + 1
            }
            sb.append(text.substring(lastIdx))
            text = sb.toString()
        }

        // 2. Thay thế các cụm từ ghép đa âm tiết TRƯỚC
        val compoundReplacements = listOf(
            // Dấu hai chấm (hỗ trợ cả chữ và số)
            Regex("(?i)\\b(dấu hai chấm|hai chấm|dấu 2 chấm|2 chấm)\\b") to ":",
            // Dấu chấm phẩy
            Regex("(?i)\\b(dấu chấm phẩy|chấm phẩy)\\b") to ";",
            // Dấu chấm hỏi (hỗ trợ hỏi chấm, chấm hỏi, dấu hỏi)
            Regex("(?i)\\b(dấu chấm hỏi|chấm hỏi|hỏi chấm|dấu hỏi)\\b") to "?",
            // Dấu chấm than
            Regex("(?i)\\b(dấu chấm than|chấm than|than chấm|dấu cảm)\\b") to "!",
            // Xuống dòng / ngắt dòng
            Regex("(?i)\\b(xuống dòng|ngắt dòng|dòng mới|xuống hàng|enter)\\b") to "\n",
            // Ngoặc đơn
            Regex("(?i)\\b(mở ngoặc đơn|mở ngoặc)\\b") to "(",
            Regex("(?i)\\b(đóng ngoặc đơn|đóng ngoặc)\\b") to ")",
            // Dấu gạch ngang
            Regex("(?i)\\b(dấu gạch ngang|gạch ngang|dấu trừ)\\b") to "-"
        )

        for ((pattern, rep) in compoundReplacements) {
            text = text.replace(pattern, rep)
        }

        // 3. Thay thế các từ đơn lẻ SAU CÙNG
        text = text.replace(Regex("(?i)\\b(dấu phẩy|phẩy)\\b"), ",")
        text = text.replace(Regex("(?i)\\b(dấu chấm|chấm)\\b"), ".")

        // 4. CHUẨN HÓA KHOẢNG TRẮNG CHÍNH TẢ TUYỆT ĐỐI
        // 4.1. Bỏ khoảng trắng trước dấu câu: "chào ," -> "chào,", "nói :" -> "nói:"
        text = text.replace(Regex("\\s+([,.:;?!])"), "$1")

        // 4.2. Đảm bảo có 1 khoảng trắng sau dấu câu (trừ khi là cuối chuỗi hoặc xuống dòng): ",hôm" -> ", hôm"
        text = text.replace(Regex("([,.:;?!])(?=[^\\s\\d\n_\"')\\]])"), "$1 ")

        // 4.3. QUY TẮC DẤU MỞ NHÁY KÉP ("):
        // Bắt buộc PHẢI có khoảng trắng phía TRƯỚC (nếu trước nó có chữ hoặc dấu hai chấm): "nói:" + " -> "nói: \""
        text = text.replace(Regex("([^\\s\n(])$TOKEN_OPEN_QUOTE"), "$1 $TOKEN_OPEN_QUOTE")
        // DÍNH SÁT phía SAU với chữ bên trong (bỏ khoảng trắng sau mở nháy):
        text = text.replace(Regex("$TOKEN_OPEN_QUOTE\\s+"), TOKEN_OPEN_QUOTE)

        // 4.4. QUY TẮC DẤU ĐÓNG NHÁY KÉP ("):
        // DÍNH SÁT phía TRƯỚC với chữ bên trong (bỏ khoảng trắng trước đóng nháy):
        text = text.replace(Regex("\\s+$TOKEN_CLOSE_QUOTE"), TOKEN_CLOSE_QUOTE)
        // PHẢI CÓ khoảng trắng phía SAU nếu tiếp theo là một từ hoặc số khác (nếu là dấu chấm/phẩy thì dính sát):
        text = text.replace(Regex("$TOKEN_CLOSE_QUOTE(?=[^\\s\n,.:;?!)\\]}])"), "$TOKEN_CLOSE_QUOTE ")

        // 4.5. Chuẩn hóa ngoặc đơn:
        text = text.replace(Regex("([^\\s\n])\\("), "$1 (")
        text = text.replace(Regex("\\(\\s+"), "(")
        text = text.replace(Regex("\\s+\\)"), ")")
        text = text.replace(Regex("\\)(?=[^\\s\n,.:;?!])"), ") ")

        // 5. Chuyển đổi token thành dấu nháy kép chuẩn "\""
        text = text.replace(TOKEN_OPEN_QUOTE, "\"")
        text = text.replace(TOKEN_CLOSE_QUOTE, "\"")

        // 6. Tự động viết hoa đầu câu và đầu lời thoại
        val capitalized = autoCapitalize(text)

        // 7. Chuẩn hóa hạ chữ thường các hư từ / trợ từ cuối câu nếu không đứng đầu câu
        return normalizeParticles(capitalized)
    }

    private val LOWERCASE_PARTICLES = setOf(
        "đấy", "đó", "này", "kia", "kìa", "nhé", "nha", "nè", "nhỉ", "hả", "hở", "hử",
        "thôi", "cơ", "ạ", "dạ", "vâng", "chứ", "rồi", "mà", "thì", "liền", "luôn", "ngay",
        "á", "à", "ừ", "hén", "nhen", "hông", "nào", "sao", "vậy", "nhể"
    )

    private fun normalizeParticles(text: String): String {
        val regex = Regex("([\\p{L}]+)")
        return regex.replace(text) { matchResult ->
            val word = matchResult.value
            val lower = word.lowercase(Locale.getDefault())
            if (LOWERCASE_PARTICLES.contains(lower)) {
                val prefix = text.substring(0, matchResult.range.first).trimEnd()
                val isStartOfSentence = prefix.isEmpty() ||
                        prefix.endsWith(".") || prefix.endsWith("?") ||
                        prefix.endsWith("!") || prefix.endsWith("\n") ||
                        prefix.endsWith("\"") || prefix.endsWith(":")
                if (!isStartOfSentence) {
                    lower
                } else {
                    word
                }
            } else {
                word
            }
        }
    }

    private fun autoCapitalize(text: String): String {
        val sb = StringBuilder()
        var capitalizeNext = true

        for (i in text.indices) {
            val c = text[i]

            if (capitalizeNext && c.isLetter()) {
                sb.append(c.uppercaseChar())
                capitalizeNext = false
            } else {
                sb.append(c)
            }

            // Viết hoa chữ kế tiếp sau dấu chấm, hỏi, than, xuống dòng hoặc sau dấu mở ngoặc kép lời thoại
            if (c == '.' || c == '?' || c == '!' || c == '\n') {
                capitalizeNext = true
            } else if (c == '"') {
                // Nếu dấu nháy kép này đứng đầu chuỗi hoặc sau dấu hai chấm (bắt đầu lời thoại)
                val isDialogueOpen = (i == 0) || (i >= 2 && text.substring(0, i).trimEnd().endsWith(":"))
                if (isDialogueOpen) {
                    capitalizeNext = true
                }
            }
        }
        return sb.toString()
    }
}
