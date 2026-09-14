package vn.ehou.vsecretkeyboard

import java.text.Normalizer
import java.util.Locale

object VCompEngine {
    private val VOWEL_PRIORITY = listOf("a", "ă", "â", "e", "ê", "o", "ô", "ơ", "y", "ư", "u", "i")
    private val shortcutDecodeMap: Map<String, String>

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

    private fun removeVietnameseTones(str: String): Pair<String, Int> {
        var tone = 0
        val nfd = Normalizer.normalize(str, Normalizer.Form.NFD)
        if (nfd.contains("\u0301")) tone = 1      // sắc
        else if (nfd.contains("\u0300")) tone = 2 // huyền
        else if (nfd.contains("\u0309")) tone = 3 // hỏi
        else if (nfd.contains("\u0303")) tone = 4 // ngã
        else if (nfd.contains("\u0323")) tone = 5 // nặng

        val clean = nfd.replace(Regex("[\u0301\u0300\u0309\u0303\u0323]"), "")
        val nfc = Normalizer.normalize(clean, Normalizer.Form.NFC)
        return Pair(nfc, tone)
    }

    private data class Phonetics(val consonant: String, val rhyme: String, val tone: Int)

    private fun extractPhonetics(word: String): Phonetics {
        val lowerWord = word.lowercase(Locale.getDefault())
        val (cleanWord, tone) = removeVietnameseTones(lowerWord)

        var consonant = ""
        var rhyme = cleanWord

        val consList = (DataDictionary.CONSONANTS_BASE + DataDictionary.CONSONANTS_EXTRA)
            .filterNotNull()
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

            val shortWordIndex = DataDictionary.SHORT_WORDS.indexOf(word)
            if (shortWordIndex != -1) {
                val hh = 32 + (shortWordIndex / 60)
                val mm = shortWordIndex % 60
                return "${hh.toString().padStart(2, '0')}${mm.toString().padStart(2, '0')}"
            }
        }

        val engIndex = DataDictionary.ENGLISH_DICT.indexOf(word)
        if (engIndex != -1 && !DataDictionary.SHORTCUT_WORDS.contains(word)) {
            val s2State = (engIndex / 1440) + 6
            val remainder = engIndex % 1440
            val hh = remainder / 60
            val mm = remainder % 60
            return "${hh.toString().padStart(2, '0')}${mm.toString().padStart(2, '0')}0${s2State}"
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

        if (rhyme.matches(Regex(".*[cpt]$")) || rhyme.endsWith("ch")) {
            if (s1 == 1) s1 = 0
        }

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

        if (hh == -1 || mm == -1) {
            return "[$word]"
        }

        val fullCode = "${hh.toString().padStart(2, '0')}${mm.toString().padStart(2, '0')}${s1}${s2}"

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
                if (shortIdx >= 0 && shortIdx < DataDictionary.SHORT_WORDS.size) {
                    return DataDictionary.SHORT_WORDS[shortIdx]
                }
            }
            code += "00"
        }

        if (code.length != 6) return code
        val hh = code.substring(0, 2).toIntOrNull()
        val mm = code.substring(2, 4).toIntOrNull()
        val s1 = code.substring(4, 5).toIntOrNull()
        val s2 = code.substring(5, 6).toIntOrNull()

        if (hh == null || mm == null || s1 == null || s2 == null) return "[ERR:FORMAT]"

        if (s2 in 6..9) {
            val engIndex = (s2 - 6) * 1440 + (hh * 60) + mm
            if (engIndex < DataDictionary.ENGLISH_DICT.size) {
                return DataDictionary.ENGLISH_DICT[engIndex]
            }
            return "[EN-UNKNOWN]"
        }

        var consonant = ""
        var rhyme = ""

        if (s2 == 0 || s2 == 1 || s2 == 2) {
            if (hh >= DataDictionary.CONSONANTS_BASE.size) return "[ERR:HH]"
            consonant = DataDictionary.CONSONANTS_BASE[hh] ?: ""
        } else if (s2 == 3 || s2 == 4 || s2 == 5) {
            if (hh >= DataDictionary.CONSONANTS_EXTRA.size) return "[ERR:HH]"
            consonant = DataDictionary.CONSONANTS_EXTRA[hh] ?: ""
        }

        when (s2) {
            0, 3 -> rhyme = if (mm < DataDictionary.RHYMES_BASE.size) DataDictionary.RHYMES_BASE[mm] ?: "" else ""
            1, 4 -> rhyme = if (mm < DataDictionary.RHYMES_EXTRA_1.size) DataDictionary.RHYMES_EXTRA_1[mm] else ""
            2, 5 -> rhyme = if (mm < DataDictionary.RHYMES_EXTRA_2.size) DataDictionary.RHYMES_EXTRA_2[mm] else ""
        }

        if (rhyme.isEmpty() && consonant.isEmpty()) return "[ERR:RHYME]"

        var decodedS1 = s1
        if (rhyme.matches(Regex(".*[cpt]$")) || rhyme.endsWith("ch")) {
            if (decodedS1 == 0) decodedS1 = 1
        }

        if (consonant == "gi" && rhyme.startsWith("iê")) {
            rhyme = rhyme.substring(1)
        }

        val tonedRhyme = applyTone(rhyme, decodedS1)
        return consonant + tonedRhyme
    }

    fun timeToBase60(timeStr: String): String {
        if (timeStr.contains('?') || timeStr.startsWith('[')) return timeStr

        if (timeStr.length == 2) {
            val hh = timeStr.toIntOrNull()
            if (hh != null && hh < DataDictionary.BASE60_MAPPING.size) return DataDictionary.BASE60_MAPPING[hh].toString()
        } else if (timeStr.length == 4) {
            val hh = timeStr.substring(0, 2).toIntOrNull()
            val mm = timeStr.substring(2, 4).toIntOrNull()
            if (hh != null && mm != null && hh < DataDictionary.BASE60_MAPPING.size && mm < DataDictionary.BASE60_MAPPING.size) {
                return "${DataDictionary.BASE60_MAPPING[hh]}${DataDictionary.BASE60_MAPPING[mm]}"
            }
        } else if (timeStr.length == 6) {
            val hh = timeStr.substring(0, 2).toIntOrNull()
            val mm = timeStr.substring(2, 4).toIntOrNull()
            val ss = timeStr.substring(4, 6).toIntOrNull()
            if (hh != null && mm != null && ss != null && 
                hh < DataDictionary.BASE60_MAPPING.size && mm < DataDictionary.BASE60_MAPPING.size && ss < DataDictionary.BASE60_MAPPING.size) {
                return "${DataDictionary.BASE60_MAPPING[hh]}${DataDictionary.BASE60_MAPPING[mm]}${DataDictionary.BASE60_MAPPING[ss]}"
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
            val i1 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[0])
            val i2 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[1])
            val i3 = DataDictionary.BASE60_MAPPING.indexOf(base60Str[2])
            if (i1 != -1 && i2 != -1 && i3 != -1) {
                return "${i1.toString().padStart(2, '0')}${i2.toString().padStart(2, '0')}${i3.toString().padStart(2, '0')}"
            }
        }
        return base60Str
    }
}
