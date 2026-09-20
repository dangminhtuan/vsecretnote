package vn.ehou.vsecretkeyboard

import java.text.Normalizer
import java.util.Locale

object VCompEngine {
    private val VOWEL_PRIORITY = listOf("a", "ă", "â", "e", "ê", "o", "ô", "ơ", "y", "ư", "u", "i")
    private val shortcutDecodeMap: Map<String, String>

    val BASE60_HH = arrayOf(
        "c", "d", "g", "G", "j", "k", "K", "h", "v", "D", "m", "C", "r", "s", "n", "b", "l", "Q", "S", "z", "N", "H", "L", "W"
    )
    val BASE60_HH_EXTRA = arrayOf(
        "p", "f", "q", "t", "T", "R", "x"
    )

    // 3 Bảng Dấu Chuẩn (18 ký tự)
    val TONE_TABLE_B1 = arrayOf("z", "s", "f", "r", "x", "j") // Bảng 1: Telex thường
    val TONE_TABLE_B2 = arrayOf("Z", "S", "F", "R", "X", "J") // Bảng 2: Telex HOA
    val TONE_TABLE_B3 = arrayOf("0", "1", "2", "3", "4", "5") // Bảng 3: VNI số

    val BASE60_SS = arrayOf(
        // s2=0 (Bảng 1 + PA Cơ bản): Telex thường
        "z", "s", "f", "r", "x", "j",
        // s2=1 (Bảng 2 + PA Cơ bản): Telex HOA
        "Z", "S", "F", "R", "X", "J",
        // s2=2 (Bảng 3 + PA Cơ bản): VNI số
        "0", "1", "2", "3", "4", "5",
        // s2=3 (Bảng 1 + PA Phụ): Telex thường
        "z", "s", "f", "r", "x", "j",
        // s2=4 (Bảng 2 + PA Phụ): Telex HOA
        "Z", "S", "F", "R", "X", "J",
        // s2=5 (Bảng 3 + PA Phụ): VNI số
        "0", "1", "2", "3", "4", "5",
        // 36..59: English dictionary slots (24 chars)
        "c", "d", "g", "G", "k", "K", "h", "v", "D", "m", "n", "b", "l", "Q", "N", "L", "p", "q", "t", "T", "H", "M", "P", "V"
    )

    init {
        val tempMap = mutableMapOf<String, String>()
        for (w in DataDictionary.SHORTCUT_WORDS) {
            val fullCode = encodeWord(w, true)
            if (fullCode.length == 6 && !fullCode.contains("\"")) {
                tempMap[fullCode.substring(0, 4)] = w
            }
        }
        shortcutDecodeMap = tempMap
    }

    fun removeAccents(str: String): String {
        val nfd = Normalizer.normalize(str, Normalizer.Form.NFD)
        val clean = nfd.replace(Regex("[\\u0300-\\u036f]"), "")
        return clean.replace('đ', 'd').replace('Đ', 'D')
    }

    private fun removeVietnameseTones(str: String): Pair<String, Int> {
        var tone = 0
        val nfd = Normalizer.normalize(str, Normalizer.Form.NFD)
        if (nfd.contains("\u0301")) tone = 1      // sắc
        else if (nfd.contains("\u0300")) tone = 2 // huyền
        else if (nfd.contains("\u0309")) tone = 3 // hỏi
        else if (nfd.contains("\u0303")) tone = 4 // ngã
        else if (nfd.contains("\u0323")) tone = 5 // nặng

        val clean = nfd.replace(Regex("[\\u0301\\u0300\\u0309\\u0303\\u0323]"), "")
        val nfc = Normalizer.normalize(clean, Normalizer.Form.NFC)
        return Pair(nfc, tone)
    }

    private data class Phonetics(val consonant: String, val rhyme: String, val tone: Int)

    private fun extractPhonetics(word: String): Phonetics {
        val lowerWord = word.lowercase(Locale.getDefault())
        val (cleanWord, tone) = removeVietnameseTones(lowerWord)

        var consonant = ""
        var rhyme = cleanWord

        val consList: List<String> = (DataDictionary.CONSONANTS_BASE.filterNotNull() + DataDictionary.CONSONANTS_EXTRA.filterNotNull())
            .filter { it.isNotEmpty() }
            .sortedByDescending { it.length }

        for (c in consList) {
            if (cleanWord.startsWith(c)) {
                consonant = c
                rhyme = cleanWord.substring(c.length)
                break
            }
        }

        if (consonant == "gi") {
            if (rhyme.isEmpty()) {
                rhyme = "i"
            } else if (rhyme.startsWith("ê")) {
                rhyme = "i" + rhyme
            } else if (!rhyme.matches(Regex("^[aăâeêioôơuưy].*"))) {
                rhyme = "i" + rhyme
            }
        }
        return Phonetics(consonant, rhyme, tone)
    }

    private fun applyTone(rhyme: String, tone: Int): String {
        if (tone == 0 || rhyme.isEmpty()) return rhyme
        val marks = arrayOf("", "\u0301", "\u0300", "\u0309", "\u0303", "\u0323")
        val m = marks[tone]

        for (v in VOWEL_PRIORITY) {
            if (rhyme.contains(v)) {
                val idx = rhyme.indexOf(v)
                val combined = rhyme.substring(0, idx + 1) + m + rhyme.substring(idx + 1)
                return Normalizer.normalize(combined, Normalizer.Form.NFC)
            }
        }
        return rhyme + m
    }

    fun encodeWord(wordInput: String, bypassShortcut: Boolean = false): String {
        val word = wordInput.lowercase(Locale.getDefault())

        if (!bypassShortcut) {
            val twoDigitIndex = DataDictionary.TWO_DIGIT_WORDS.indexOf(word)
            if (twoDigitIndex != -1) {
                return twoDigitIndex.toString().padStart(2, '0')
            }

            val shortWordIndex = DataDictionary.SHORTCUT_WORDS.indexOf(word)
            if (shortWordIndex != -1) {
                val hh = 32 + (shortWordIndex / 60)
                val mm = shortWordIndex % 60
                return "${hh.toString().padStart(2, '0')}${mm.toString().padStart(2, '0')}"
            }
        }

        val (consonant, rhyme, tone) = extractPhonetics(word)

        var cBaseIdx = DataDictionary.CONSONANTS_BASE.indexOf(consonant)
        for (i in DataDictionary.CONSONANTS_BASE.indices) {
            if (DataDictionary.CONSONANTS_BASE[i] == consonant && DataDictionary.RHYMES_BASE[i] == rhyme) {
                cBaseIdx = i
                break
            }
        }

        val cExtraIdx = DataDictionary.CONSONANTS_EXTRA.indexOf(consonant)

        var rBaseIdx = DataDictionary.RHYMES_BASE.indexOf(rhyme)
        if (cBaseIdx != -1 && DataDictionary.RHYMES_BASE[cBaseIdx] == rhyme) {
            rBaseIdx = cBaseIdx
        }

        val rExtra1Idx = DataDictionary.RHYMES_EXTRA_1.indexOf(rhyme)
        val rExtra2Idx = DataDictionary.RHYMES_EXTRA_2.indexOf(rhyme)

        var hh = -1
        var mm = -1
        var s1 = tone
        var s2 = 0

        if (cBaseIdx != -1) {
            hh = cBaseIdx
            if (rBaseIdx != -1) { mm = rBaseIdx; s2 = 0 }
            else if (rExtra1Idx != -1) { mm = rExtra1Idx; s2 = 1 }
            else if (rExtra2Idx != -1) { mm = rExtra2Idx; s2 = 2 }
        } else if (cExtraIdx != -1) {
            hh = cExtraIdx
            if (rBaseIdx != -1) { mm = rBaseIdx; s2 = 3 }
            else if (rExtra1Idx != -1) { mm = rExtra1Idx; s2 = 4 }
            else if (rExtra2Idx != -1) { mm = rExtra2Idx; s2 = 5 }
        }

        if (hh != -1 && mm != -1 && (consonant.isNotEmpty() || rhyme.isNotEmpty())) {
            val ss = s2 * 6 + s1
            val fullCode = "${hh.toString().padStart(2, '0')}${mm.toString().padStart(2, '0')}${ss.toString().padStart(2, '0')}"

            if (!bypassShortcut) {
                val hhmm = fullCode.substring(0, 4)
                if (DataDictionary.SHORTCUT_WORDS.contains(word)) {
                    return hhmm
                }
                if (fullCode.endsWith("00") && !shortcutDecodeMap.containsKey(hhmm)) {
                    return hhmm
                }
            }
            return fullCode
        }

        // Fallback English
        val engIndex = DataDictionary.ENGLISH_DICT.indexOf(word)
        if (engIndex != -1) {
            val ss = 36 + (engIndex / 1440)
            val remainder = engIndex % 1440
            val h = remainder / 60
            val m = remainder % 60
            return "${h.toString().padStart(2, '0')}${m.toString().padStart(2, '0')}${ss.toString().padStart(2, '0')}"
        }

        return "[$word]"
    }

    fun decodeWord(codeStr: String): String {
        var code = codeStr
        if (code.length == 2) {
            val idx = code.toIntOrNull()
            if (idx != null && idx >= 0 && idx < DataDictionary.TWO_DIGIT_WORDS.size) {
                return DataDictionary.TWO_DIGIT_WORDS[idx]
            }
            return "[ERR:2D]"
        }

        if (code.length == 4) {
            if (shortcutDecodeMap.containsKey(code)) return shortcutDecodeMap[code]!!
            val hh = code.substring(0, 2).toIntOrNull()
            val mm = code.substring(2, 4).toIntOrNull()
            if (hh != null && mm != null && hh >= 32) {
                val shortIdx = (hh - 32) * 60 + mm
                if (shortIdx >= 0 && shortIdx < DataDictionary.SHORTCUT_WORDS.size) {
                    return DataDictionary.SHORTCUT_WORDS[shortIdx]
                }
            }
            code += "00"
        }

        if (code.length != 6) return code
        val hh = code.substring(0, 2).toIntOrNull()
        val mm = code.substring(2, 4).toIntOrNull()
        val ss = code.substring(4, 6).toIntOrNull()

        if (hh == null || mm == null || ss == null) return "[ERR:FORMAT]"

        if (ss >= 36) {
            val engIndex = (ss - 36) * 1440 + (hh * 60) + mm
            if (engIndex < DataDictionary.ENGLISH_DICT.size) {
                return DataDictionary.ENGLISH_DICT[engIndex]
            }
            return "[EN-UNKNOWN]"
        }

        val s2 = ss / 6
        val s1 = ss % 6

        var consonant = ""
        var rhyme = ""

        if (s2 in 0..2) {
            if (hh >= DataDictionary.CONSONANTS_BASE.size) return "[ERR:HH]"
            consonant = DataDictionary.CONSONANTS_BASE[hh] ?: ""
        } else if (s2 in 3..5) {
            if (hh >= DataDictionary.CONSONANTS_EXTRA.size) return "[ERR:HH]"
            consonant = DataDictionary.CONSONANTS_EXTRA[hh] ?: ""
        }

        when (s2) {
            0, 3 -> rhyme = if (mm < DataDictionary.RHYMES_BASE.size) DataDictionary.RHYMES_BASE[mm] ?: "" else ""
            1, 4 -> rhyme = if (mm < DataDictionary.RHYMES_EXTRA_1.size) DataDictionary.RHYMES_EXTRA_1[mm] ?: "" else ""
            2, 5 -> rhyme = if (mm < DataDictionary.RHYMES_EXTRA_2.size) DataDictionary.RHYMES_EXTRA_2[mm] ?: "" else ""
        }

        if (rhyme.isEmpty() && consonant.isEmpty()) return "[ERR:RHYME]"

        val tonedRhyme = applyTone(rhyme, s1)
        return consonant + tonedRhyme
    }

    fun timeToBase60(timeStr: String): String {
        if (timeStr.contains('?') || timeStr.startsWith('[')) return timeStr

        var processStr = timeStr
        if (processStr.length == 4 && processStr.all { it.isDigit() }) {
            processStr += "00"
        }

        if (processStr.length == 6) {
            val hh = processStr.substring(0, 2).toIntOrNull()
            val mm = processStr.substring(2, 4).toIntOrNull()
            val ss = processStr.substring(4, 6).toIntOrNull()
            if (hh != null && mm != null && ss != null) {
                if (ss >= 36 && ss < BASE60_SS.size) {
                    val c1 = if (hh < DataDictionary.BASE60_MAPPING.size) DataDictionary.BASE60_MAPPING[hh].toString() else ""
                    val c2 = if (mm < DataDictionary.BASE60_MAPPING.size) DataDictionary.BASE60_MAPPING[mm].toString() else ""
                    return "$c1$c2${BASE60_SS[ss]}"
                }
                val s2 = ss / 6
                val isExtra = s2 in 3..5
                val c1 = if (isExtra) {
                    if (hh < BASE60_HH_EXTRA.size) BASE60_HH_EXTRA[hh] else if (hh < DataDictionary.BASE60_MAPPING.size) DataDictionary.BASE60_MAPPING[hh].toString() else ""
                } else {
                    if (hh < BASE60_HH.size) BASE60_HH[hh] else if (hh < DataDictionary.BASE60_MAPPING.size) DataDictionary.BASE60_MAPPING[hh].toString() else ""
                }
                val c2 = if (mm < DataDictionary.BASE60_MAPPING.size) DataDictionary.BASE60_MAPPING[mm].toString() else ""
                val c3 = if (ss < BASE60_SS.size) BASE60_SS[ss] else if (ss < DataDictionary.BASE60_MAPPING.size) DataDictionary.BASE60_MAPPING[ss].toString() else ""
                return "$c1$c2$c3"
            }
        }
        return timeStr
    }

    fun base60ToTime(base60Str: String): String {
        if (base60Str.length == 1) {
            val i1 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[0])
            if (i1 != -1) return i1.toString().padStart(2, '0')
        } else if (base60Str.length == 2) {
            val i1 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[0])
            val i2 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[1])
            if (i1 != -1 && i2 != -1) return "${i1.toString().padStart(2, '0')}${i2.toString().padStart(2, '0')}"
        } else if (base60Str.length == 3) {
            val c1 = base60Str[0].toString()
            val c2 = base60Str[1]
            val c3 = base60Str[2].toString()

            // 1. Kiểm tra từ điển tiếng Anh (ss >= 36)
            val engSlice = BASE60_SS.sliceArray(36 until BASE60_SS.size)
            val engSsIdx = engSlice.indexOf(c3)
            if (engSsIdx != -1 && !TONE_TABLE_B1.contains(c3) && !TONE_TABLE_B2.contains(c3) && !TONE_TABLE_B3.contains(c3)) {
                val ss = 36 + engSsIdx
                val hh = DataDictionary.BASE60_MAPPING.indexOf(base60Str[0])
                val mm = DataDictionary.BASE60_MAPPING.indexOf(base60Str[1])
                if (hh != -1 && mm != -1) {
                    return "${hh.toString().padStart(2, '0')}${mm.toString().padStart(2, '0')}${ss.toString().padStart(2, '0')}"
                }
            }

            // 2. Giải mã tiếng Việt theo 3 Bảng Dấu (18 ký tự)
            var rhymeTable = -1
            var s1 = -1

            if (TONE_TABLE_B1.contains(c3)) {
                rhymeTable = 0
                s1 = TONE_TABLE_B1.indexOf(c3)
            } else if (TONE_TABLE_B2.contains(c3)) {
                rhymeTable = 1
                s1 = TONE_TABLE_B2.indexOf(c3)
            } else if (TONE_TABLE_B3.contains(c3)) {
                rhymeTable = 2
                s1 = TONE_TABLE_B3.indexOf(c3)
            }

            if (rhymeTable != -1 && s1 != -1) {
                val isExtra = BASE60_HH_EXTRA.contains(c1)
                val hh = if (isExtra) BASE60_HH_EXTRA.indexOf(c1) else BASE60_HH.indexOf(c1)
                val mm = DataDictionary.BASE60_MAPPING.indexOf(c2)

                if (hh != -1 && mm != -1) {
                    val s2 = (if (isExtra) 3 else 0) + rhymeTable
                    val ss = s2 * 6 + s1
                    return "${hh.toString().padStart(2, '0')}${mm.toString().padStart(2, '0')}${ss.toString().padStart(2, '0')}"
                }
            }

            // Fallback: raw mapping
            val i1 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[0])
            val i2 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[1])
            val i3 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[2])
            if (i1 != -1 && i2 != -1 && i3 != -1) {
                return "${i1.toString().padStart(2, '0')}${i2.toString().padStart(2, '0')}${i3.toString().padStart(2, '0')}"
            }
        }
        return base60Str
    }

    fun timeTo5Digit(timeStr: String): String {
        if (timeStr.isBlank()) return ""
        return Regex("[0-9]+").replace(timeStr) { mr ->
            val str = mr.value
            val (h, m, s) = when (str.length) {
                2 -> Triple(0, 0, str.toIntOrNull() ?: 0)
                4 -> Triple(0, str.substring(0, 2).toIntOrNull() ?: 0, str.substring(2, 4).toIntOrNull() ?: 0)
                6 -> Triple(str.substring(0, 2).toIntOrNull() ?: 0, str.substring(2, 4).toIntOrNull() ?: 0, str.substring(4, 6).toIntOrNull() ?: 0)
                else -> return@replace str
            }
            val total = h * 3600 + m * 60 + s
            total.toString().padStart(5, '0')
        }
    }

    val FAKE_VIET_MAP = mapOf(
        'A' to "卂", 'B' to "乃", 'C' to "匚", 'D' to "ᗪ", 'E' to "乇", 'F' to "₣", 'G' to "Ꮆ",
        'H' to "卄", 'I' to "工", 'J' to "ﾌ", 'K' to "Ꮶ", 'L' to "ㄥ", 'M' to "爪", 'N' to "几",
        'O' to "ㄖ", 'P' to "卩", 'Q' to "Ɋ", 'R' to "尺", 'S' to "丂", 'T' to "ㄒ", 'U' to "ㄩ",
        'V' to "ᐯ", 'W' to "ᗯ", 'X' to "乂", 'Y' to "ㄚ", 'Z' to "乙"
    )

    fun toFakeViet(text: String): String {
        if (text.isBlank()) return ""
        val noTone = removeAccents(text).uppercase(Locale.getDefault())
        val mapped = noTone.map { c ->
            if (c == ' ') "-" else FAKE_VIET_MAP[c] ?: c.toString()
        }.joinToString("")
        return "♰$mapped♰"
    }

    val FAKE_VIET_MINIMAL_SINGLE_MAP = mapOf(
        'c' to "⊂", 'k' to "<", 't' to "+", 'p' to "p", 'g' to "↯", 'n' to "∩",
        'r' to "┌", 's' to "┘", 'b' to "b", 'l' to "|", 'm' to "m", 'v' to "∨",
        'x' to "×", 'h' to "♡",
        'a' to "—", 'e' to "=", 'i' to "⸝", 'u' to "∪", 'o' to "o"
    )

    fun toFakeVietMinimal(text: String): String {
        if (text.isBlank()) return ""
        var clean = Normalizer.normalize(text, Normalizer.Form.NFD)
            .replace(Regex("[\\u0300-\\u036f]"), "")

        clean = clean.replace(Regex("ngh", RegexOption.IGNORE_CASE), "W")
        clean = clean.replace(Regex("nh", RegexOption.IGNORE_CASE), "H")
        clean = clean.replace(Regex("ch", RegexOption.IGNORE_CASE), "C")
        clean = clean.replace(Regex("tr", RegexOption.IGNORE_CASE), "R")
        clean = clean.replace(Regex("ng", RegexOption.IGNORE_CASE), "N")
        clean = clean.replace(Regex("kh", RegexOption.IGNORE_CASE), ">")
        clean = clean.replace(Regex("th", RegexOption.IGNORE_CASE), "⊤")
        clean = clean.replace(Regex("ph", RegexOption.IGNORE_CASE), "⊥")
        clean = clean.replace(Regex("gh", RegexOption.IGNORE_CASE), "⊃")
        clean = clean.replace(Regex("qu", RegexOption.IGNORE_CASE), "⊏")
        clean = clean.replace(Regex("gi", RegexOption.IGNORE_CASE), "j")
        clean = clean.replace(Regex("[đd]", RegexOption.IGNORE_CASE), "ᑯ")

        val compoundSet = setOf('W', 'N', '>', '⊤', '⊥', 'C', 'R', 'H', '⊃', '⊏', 'j', 'ᑯ')
        return clean.map { ch ->
            if (compoundSet.contains(ch)) ch.toString()
            else FAKE_VIET_MINIMAL_SINGLE_MAP[ch.lowercaseChar()] ?: ch.toString()
        }.joinToString("")
    }

    fun toCamelCase(text: String): String {
        val words = text.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
        return words.mapIndexed { idx, w ->
            val clean = removeAccents(w)
            if (idx == 0) clean.lowercase(Locale.getDefault())
            else clean.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }
        }.joinToString("")
    }

    fun toNoAccentContinuous(text: String): String {
        val clean = removeAccents(text)
        return clean.replace(Regex("\\s+"), "").lowercase(Locale.getDefault())
    }

    val CVNSS4_RHYMES_56 = mapOf(
        "uyêt" to "yd", "uyên" to "yl",
        "iêt" to "id", "iêp" to "if", "iêc" to "is", "iên" to "il", "iêm" to "iv", "iêng" to "iz", "iêu" to "iw",
        "yêt" to "id", "yên" to "il", "yêm" to "iv", "yêng" to "iz", "yêu" to "iw",
        "uôt" to "ud", "uôc" to "us", "uôn" to "ul", "uôm" to "uv", "uông" to "uz", "uôi" to "uj",
        "ươt" to "ưd", "ươp" to "ưf", "ươc" to "ưs", "ươn" to "ưl", "ươm" to "ưv", "ương" to "ưz", "ươu" to "ưw", "ươi" to "ưj",
        "uât" to "âd", "uân" to "âl", "uâng" to "âz", "uây" to "âj",
        "uơt" to "ơd", "uơn" to "ơl", "uơi" to "ơj",
        "oăt" to "ăd", "oăp" to "ăf", "oăc" to "ăs", "oăn" to "ăl", "oăm" to "ăv", "oăng" to "ăz",
        "oet" to "ed", "oec" to "es", "oen" to "el", "oem" to "ev", "oeng" to "ez", "oeo" to "ew",
        "oat" to "od", "oap" to "of", "oac" to "os", "oan" to "ol", "oam" to "ov", "oang" to "oz", "oao" to "ow", "oai" to "oj", "oay" to "aj"
    )

    val CVNSS4_INIT_MAP = mapOf(
        "ph" to "f", "qu" to "q", "k" to "c", "kh" to "k", "d" to "z", "đ" to "d", "gi" to "j", "gh" to "g", "ngh" to "w", "ng" to "w"
    )

    val CVNSS4_INITS = listOf(
        "ngh", "ng", "nh", "ch", "gh", "gi", "ph", "qu", "kh", "th", "tr", "b", "c", "d", "đ", "g", "h", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "x"
    )

    fun encodeCVNSS4Word(word: String): String {
        if (!word.matches(Regex("^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$"))) return word

        val (cleanWithHats, tone) = removeVietnameseTones(word.lowercase(Locale.getDefault()))

        var group = "khong"
        val nfd = Normalizer.normalize(word.lowercase(Locale.getDefault()), Normalizer.Form.NFD)
        if (nfd.contains("\u0302")) {
            group = "non"
        } else if (nfd.contains("\u0306") || nfd.contains("\u031b")) {
            group = "trang_moc"
        }

        var init = ""
        var rhyme = cleanWithHats
        for (i in CVNSS4_INITS) {
            if (cleanWithHats.startsWith(i)) {
                init = i
                rhyme = cleanWithHats.substring(i.length)
                break
            }
        }

        if (init == "gi") {
            if (rhyme.isEmpty()) rhyme = "i"
            else if (rhyme.startsWith("ê")) rhyme = "i$rhyme"
            else if (!rhyme.matches(Regex("^[aăâeêioôơuưy].*"))) rhyme = "i$rhyme"
        }

        val initMapped = CVNSS4_INIT_MAP[init] ?: init
        var reducedRhyme = rhyme

        if (CVNSS4_RHYMES_56.containsKey(rhyme)) {
            reducedRhyme = CVNSS4_RHYMES_56[rhyme] ?: rhyme
        } else {
            if (reducedRhyme.endsWith("ng")) reducedRhyme = reducedRhyme.substring(0, reducedRhyme.length - 2) + "g"
            else if (reducedRhyme.endsWith("nh")) reducedRhyme = reducedRhyme.substring(0, reducedRhyme.length - 2) + "h"
            else if (reducedRhyme.endsWith("ch")) reducedRhyme = reducedRhyme.substring(0, reducedRhyme.length - 2) + "k"

            if (reducedRhyme == "uy") reducedRhyme = "y"
            else if (reducedRhyme == "y") reducedRhyme = "i"
        }

        val reducedWord = initMapped + reducedRhyme
        var sym = ""

        when (group) {
            "non" -> {
                sym = when (tone) {
                    1 -> "b"
                    2 -> "d"
                    3 -> "q"
                    4 -> "g"
                    5 -> "f"
                    else -> "y"
                }
            }
            "trang_moc" -> {
                sym = when (tone) {
                    1 -> "x"
                    2 -> "k"
                    3 -> "v"
                    4 -> "w"
                    5 -> "h"
                    else -> "o"
                }
            }
            "khong" -> {
                when (tone) {
                    1 -> sym = if (reducedWord.endsWith("c") || reducedWord.endsWith("p") || reducedWord.endsWith("t")) "" else "j"
                    2 -> sym = "l"
                    3 -> sym = "z"
                    4 -> sym = "s"
                    5 -> sym = "r"
                    0 -> {
                        val pList = listOf("ag", "ah", "aj", "eg", "el", "ev", "ew", "ez", "ih", "oah", "og", "oj", "ol", "ov", "ow", "oz", "ug", "yh")
                        if (pList.contains(reducedRhyme)) sym = "p"
                    }
                }
            }
        }

        val stripped = reducedWord
            .replace("â", "a").replace("ă", "a")
            .replace("ê", "e")
            .replace("ô", "o").replace("ơ", "o")
            .replace("ư", "u")

        val finalWord = stripped + sym
        if (word == word.uppercase(Locale.getDefault()) && word != word.lowercase(Locale.getDefault())) {
            return finalWord.uppercase(Locale.getDefault())
        }
        if (word.isNotEmpty() && word[0].isUpperCase()) {
            return finalWord.replaceFirstChar { it.uppercaseChar() }
        }
        return finalWord
    }
}
