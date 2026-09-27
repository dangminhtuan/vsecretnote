package vn.ehou.vsecretkeyboard

import java.text.Normalizer
import java.util.Locale

/**
 * RhymeTutorEngine: Động cơ "Vừa tìm vừa gõ & Học thuộc vị trí vần trên phím vi mạch"
 *
 * Chức năng:
 * 1. Ánh xạ toàn bộ 171+ vần tiếng Việt chuẩn vào các phím vi mạch trên bàn phím (đồng bộ 100% với Base60 & ChipKeyConfig).
 * 2. Phân tích từ đang gõ theo thời gian thực: Tách phụ âm đầu và tiền tố vần (rhymePrefix).
 * 3. Tìm kiếm và chỉ điểm các phím chứa vần khớp để bật đèn viền sáng trực tiếp trên bàn phím.
 * 4. Hỗ trợ quẹt 5 hướng (hoặc chạm thanh Bằng) để hoàn tất từ và thay thế sạch sẽ phần vần đang gõ dở.
 */
object RhymeTutorEngine {

    // Danh sách 12 nguyên âm hạt nhân tiếng Việt
    val CORE_VOWELS = setOf('a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y')

    // Danh sách phụ âm tiếng Việt (sắp xếp dài trước ngắn sau để khớp tham lam)
    val CONSONANTS = listOf(
        "ngh", "ng", "ch", "gh", "gi", "kh", "nh", "ph", "qu", "th", "tr",
        "b", "c", "d", "đ", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "x"
    )

    data class KeyRhymeInfo(
        val gridKey: String,       // Ký tự phím trên bàn phím (vd: "k", "a", "u", "1", "?")
        val primaryRhyme: String,   // Vần chính hiển thị
        val allRhymes: List<String> // Toàn bộ vần liên kết với phím này
    )

    // Bảng tra cứu vần -> danh sách KeyRhymeInfo
    private val keyRhymeList = mutableListOf<KeyRhymeInfo>()

    init {
        initRhymeDatabase()
    }

    private fun initRhymeDatabase() {
        val keyToRhymes = mutableMapOf<String, MutableSet<String>>()

        fun addRhymeToKey(key: String, rhyme: String?) {
            if (key.isBlank() || rhyme.isNullOrBlank() || rhyme == "-" || rhyme == "null") return
            val cleanRhyme = rhyme.lowercase().trim()
            if (cleanRhyme.isNotEmpty()) {
                keyToRhymes.getOrPut(key) { mutableSetOf() }.add(cleanRhyme)
            }
        }

        // 1. Nạp từ ChipKeyConfig (các vần góc trên-trái, sc1, sc2)
        val allChipRows = listOf(
            ChipKeyConfig.rowSymbols,
            ChipKeyConfig.rowNumbers,
            ChipKeyConfig.rowQWERTY,
            ChipKeyConfig.rowASDF,
            ChipKeyConfig.rowZXCV
        )
        for (row in allChipRows) {
            for (chip in row) {
                addRhymeToKey(chip.char, chip.rhyme)
                addRhymeToKey(chip.char, chip.sc1)
                addRhymeToKey(chip.char, chip.sc2)
            }
        }

        // 2. Nạp từ Base60 Mapping (toàn bộ 171 vần B1, B2, B3)
        // Ký tự thường (lowChar) và ký tự hoa (upChar) đều thuộc cùng 1 phím vật lý
        for (i in DataDictionary.BASE60_MAPPING.indices) {
            val baseChar = DataDictionary.BASE60_MAPPING[i]
            val keyStr = baseChar.lowercase()

            val rB1 = DataDictionary.RHYMES_BASE.getOrNull(i)
            val rB2 = DataDictionary.RHYMES_EXTRA_1.getOrNull(i)
            val rB3 = DataDictionary.RHYMES_EXTRA_2.getOrNull(i)

            addRhymeToKey(keyStr, rB1)
            addRhymeToKey(keyStr, rB2)
            addRhymeToKey(keyStr, rB3)
        }

        // Đảm bảo các vần phổ biến như 'ang', 'an' luôn gắn chắc chắn vào phím 'k' (Base60 'K' / 'k')
        addRhymeToKey("k", "an")
        addRhymeToKey("k", "ang")
        addRhymeToKey("k", "anh")
        addRhymeToKey("a", "a")
        addRhymeToKey("a", "am")
        addRhymeToKey("a", "at")
        addRhymeToKey("a", "ac")
        addRhymeToKey("a", "ap")

        // Chuyển map sang danh sách KeyRhymeInfo
        keyRhymeList.clear()
        for ((key, rhymes) in keyToRhymes) {
            val primary = rhymes.firstOrNull { it.length <= 3 } ?: rhymes.firstOrNull() ?: ""
            keyRhymeList.add(KeyRhymeInfo(key, primary, rhymes.toList()))
        }
    }

    /**
     * Tách một từ đang gõ thành Phụ âm đầu và Tiền tố vần
     * Ví dụ:
     * - "r" -> Pair("r", "")
     * - "ra" -> Pair("r", "a")
     * - "ran" -> Pair("r", "an")
     * - "ch" -> Pair("ch", "")
     * - "chan" -> Pair("ch", "an")
     * - "ang" -> Pair("", "ang")
     * - "u" -> Pair("", "u")
     */
    fun splitConsonantAndRhymePrefix(word: String): Pair<String, String> {
        val lower = word.lowercase(Locale.getDefault())
        if (lower.isEmpty()) return Pair("", "")

        for (c in CONSONANTS) {
            if (lower.startsWith(c)) {
                val rem = lower.substring(c.length)
                return Pair(c, rem)
            }
        }

        // Không có phụ âm đầu (từ bắt đầu bằng nguyên âm)
        return Pair("", lower)
    }

    /**
     * Quy đồng họ nguyên âm tiếng Việt:
     * - a, ă, â -> a
     * - e, ê -> e
     * - o, ô, ơ -> o
     * - u, ư -> u
     * - d, đ -> d
     */
    fun foldVowels(str: String): String {
        return str
            .replace('ă', 'a').replace('â', 'a')
            .replace('ê', 'e')
            .replace('ô', 'o').replace('ơ', 'o')
            .replace('ư', 'u')
            .replace('đ', 'd')
    }

    /**
     * Tách bỏ dấu thanh điệu (sắc, huyền, hỏi, ngã, nặng) nhưng vẫn giữ nguyên mũ/móc (ă, â, ê, ô, ơ, ư)
     */
    fun stripToneOnly(str: String): String {
        if (str.isEmpty()) return str
        val nfd = Normalizer.normalize(str, Normalizer.Form.NFD)
        val withoutTone = nfd.replace(Regex("[\u0300\u0301\u0303\u0309\u0323]"), "")
        return Normalizer.normalize(withoutTone, Normalizer.Form.NFC)
    }

    /**
     * Kiểm tra một ký tự có phải là nguyên âm (kể cả có dấu thanh điệu hay mũ/móc)
     */
    fun isVowel(c: Char): Boolean {
        val stripped = stripToneOnly(c.lowercaseChar().toString())
        return stripped.isNotEmpty() && stripped.first() in CORE_VOWELS
    }

    /**
     * Tìm tất cả các phím có chứa vần khớp với tiền tố đang gõ.
     * Hỗ trợ quy đồng họ nguyên âm:
     * - Nếu gõ nguyên âm gốc không mũ/móc (a, e, o, u): tự động tìm cả họ nguyên âm (o -> o, ô, ơ; a -> a, ă, â; u -> u, ư; e -> e, ê).
     * - Nếu gõ đích danh ký tự có mũ/móc (ă, â, ê, ô, ơ, ư): giữ nguyên tìm kiếm chính xác theo ký tự đó.
     * Trả về Map<gridKey, matchedRhyme>
     * Ví dụ: prefix = "oi" -> Map("l" -> "oi", "q" -> "ôi", "x" -> "ơi")
     */
    fun findMatchingKeys(prefix: String): Map<String, String> {
        if (prefix.isBlank()) return emptyMap()
        val cleanPrefix = stripToneOnly(prefix.lowercase().trim())
        if (cleanPrefix.isBlank()) return emptyMap()

        val isSpecificAccent = cleanPrefix.any { it in "ăâêôơưđ" }
        val foldedPrefix = foldVowels(cleanPrefix)
        val result = mutableMapOf<String, String>()

        for (info in keyRhymeList) {
            if (isSpecificAccent) {
                // Người dùng gõ đích danh mũ/móc: chỉ tìm chính xác
                val exactMatch = info.allRhymes.firstOrNull { it == cleanPrefix }
                if (exactMatch != null) {
                    result[info.gridKey] = exactMatch
                    continue
                }
                val prefixMatch = info.allRhymes
                    .filter { it.startsWith(cleanPrefix) }
                    .minByOrNull { it.length }
                if (prefixMatch != null) {
                    result[info.gridKey] = prefixMatch
                }
            } else {
                // Quy đồng họ nguyên âm: o khớp cả o, ô, ơ; an khớp an, ang, ăn, ăng, ân, âng...
                // 1. Khớp chính xác không cần fold (ưu tiên cao nhất)
                val strictExact = info.allRhymes.firstOrNull { it == cleanPrefix }
                if (strictExact != null) {
                    result[info.gridKey] = strictExact
                    continue
                }
                // 2. Khớp chính xác sau khi fold (vd: gõ "oi" -> khớp "ôi" hoặc "ơi")
                val foldExact = info.allRhymes.firstOrNull { foldVowels(it) == foldedPrefix }
                if (foldExact != null) {
                    result[info.gridKey] = foldExact
                    continue
                }
                // 3. Khớp tiền tố (bắt đầu bằng) sau khi fold, ưu tiên vần ngắn nhất
                val prefixMatch = info.allRhymes
                    .filter { foldVowels(it).startsWith(foldedPrefix) }
                    .minByOrNull { it.length }
                if (prefixMatch != null) {
                    result[info.gridKey] = prefixMatch
                }
            }
        }

        return result
    }

    /**
     * Gán dấu thanh điệu tiếng Việt chuẩn xác vào vần được chọn
     * @param tone: 0: Bằng/Ngang, 1: Sắc, 2: Huyền, 3: Hỏi, 4: Ngã, 5: Nặng
     */
    fun applyTone(rhyme: String, tone: Int): String {
        return FlickCompassEngine.applyTone(rhyme, tone)
    }
}
