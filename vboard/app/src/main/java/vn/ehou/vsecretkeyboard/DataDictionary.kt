package vn.ehou.vsecretkeyboard

object DataDictionary {
    val TONES = arrayOf("ngang", "sắc", "huyền", "hỏi", "ngã", "nặng")

    // CONSONANTS_BASE: 24 phụ âm chuẩn (HH = 0-23)
    val CONSONANTS_BASE = arrayOf(
        "c", "đ", "g", "gh", "gi", "k", "kh",
        "h", "v", "d", "m", "ch", "r", "s", "n", "b", "l",
        "ch", "s", "", "ng", "nh", "l", "ngh"
    )

    // CONSONANTS_EXTRA: 8 phụ âm phụ chuẩn (p, ph, qu, t, th, tr, x, null)
    val CONSONANTS_EXTRA = arrayOf(
        "p", "ph", "qu", "t", "th", "tr", "x", null
    )

    // RHYMES_BASE: 60 vần Bảng 1 (Toàn bộ 9 nguyên âm đơn độc lập a, e, ê, i, o, ô, ơ, u, ư ở B1 phím thường)
    val RHYMES_BASE = arrayOf(
        "êt", "ơ", "ach", "ai", "am", "an", "ang", "ôn", "ia", "-", "ut", "ich", "ê", "ương", "it", "ươm", "iêm", "at", "ac", "ôm",
        "ưc", "âp", "-", "anh", "ao", "ap", "ô", "au", "ay", "ă", "ăc", "ăm", "ăn", "ăng", "ăp", "ăt", "âu", "âc", "ân", "âng",
        "ât", "â", "yêu", "uâng", "ec", "-", "o", "eo", "ep", "et", "êu", "êch", "êm", "ênh", "êp", "a", "e", "i", "u", "ư"
    )

    // RHYMES_EXTRA_1: 60 vần Bảng 2 (i/o/ô/ơ + lấp đầy phím thường)
    val RHYMES_EXTRA_1 = arrayOf(
        "iêc", "iên", "iêng", "iêp", "iêt", "iu", "-", "iêu", "ip", "-", "inh", "oa", "ên", "oan", "oc", "oe", "oi", "-", "on", "ong",
        "op", "ot", "oăn", "oăng", "ơm", "ôc", "ôi", "ông", "ôp", "ôt", "ơi", "-", "ơn", "ơp", "ơt", "oen", "oac", "oach", "oam", "oang",
        "oanh", "oap", "uêch", "oay", "oeo", "oem", "om", "oet", "ooc", "oong", "oăc", "oăm", "oăt", "iê", "eng", "yêt", "em", "in", "un", "ưng"
    )

    // RHYMES_EXTRA_2: 60 vần Bảng 3 (u/ư/y + lấp đầy uôc, uya, âm, ưa)
    val RHYMES_EXTRA_2 = arrayOf(
        "ua", "uât", "uc", "uê", "âm", "um", "-", "uân", "ung", "-", "uôi", "uôn", "uông", "uôt", "up", "uy", "uyên", "uyêt", "ynh", "ui",
        "ưi", "y", "ưn", "ươc", "ươi", "ươn", "ươp", "ươt", "ưt", "ưu", "ưm", "yêm", "yê", "oat", "-", "ươu", "uôm", "ươ", "oai", "oă",
        "ây", "uênh", "-", "uych", "uyn", "uynh", "uyp", "uyt", "uyu", "yn", "yên", "yt", "yêng", "uya", "uơ", "uây", "en", "im", "uôc", "ưa"
    )

    // BASE60_MAPPING: 60 ký tự Base60 chuẩn của hệ thống TimeCypher
    val BASE60_MAPPING = arrayOf(
        'c', 'd', 'g', 'G', 'j', 'k', 'K', 'h', 'v', 'D', 'm', 'C', 'r', 's', 'n', 'b', 'l', 'Q', 'S', 'z', 'N', 'H', 'L', 'W',
        'p', 'f', 'q', 't', 'T', 'R', 'x', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'E', 'F', 'Y', 'o', 'J', 'M', 'P', 'U', 'V', 'X', 'y', 'Z', 'a', 'e', 'i', 'u', 'w'
    )

    val SHORTCUT_WORDS = listOf(
        "chim", "mút", "vú", "chịch", "hôn", "lồn",
        "dâm", "rên", "sướng", "nứng", "bướm", "liếm", "sờ", "ôm", "ngực", "nhấp",
        "em", "anh", "tôi", "bạn"
    )

    val TWO_DIGIT_WORDS = listOf(
        "có", "đi", "gặp", "ghê", "gì", "kêu", "không", "hay", "vậy", "dạ",
        "mình", "chưa", "rồi", "sao", "này", "biết", "làm", "cho", "sẽ", "ơi",
        "người", "như", "lại", "nghĩ", "được", "một", "hai", "ba", "bốn", "năm",
        "sáu", "bảy", "tám", "chín", "anh", "em", "phải", "in", "phim", "tôi",
        "uống", "web", "xem", "ai", "bạn", "ếch", "file", "hỏi", "ít", "giờ",
        "mới", "pin", "qua", "ra", "tiền", "úc", "vào", "xin", "yêu", "zalo",
        "gõ", "sửa", "chạy", "bấm", "chọn", "tải", "cài", "xóa", "lỗi", "link",
        "code", "test", "tiếp", "mở", "thử", "bật", "tắt", "số", "biển"
    )

    val ENGLISH_DICT = listOf(
        "hello", "world", "love", "time", "fuck", "shit", "sex", "pussy", "dick", "cock", "boobs", "ass",
        "cyber", "matrix", "hacker", "system", "online", "code", "secret", "data"
    )

    private val realWordsList = mutableListOf<String>()
    private val wordRankMap = HashMap<String, Int>(8000)
    private val wordSet = HashSet<String>(8000)
    private val unaccentedMap = HashMap<String, MutableList<String>>(8000)
    private val prefix1Map = HashMap<Char, MutableList<String>>(30)
    @Volatile private var isInitialized = false

    fun removeAccents(str: String): String {
        val nfd = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD)
        val clean = nfd.replace(Regex("[\\u0300-\\u036f]"), "")
        return clean.replace('đ', 'd').replace('Đ', 'D')
    }

    fun initWords(assets: android.content.res.AssetManager) {
        if (isInitialized) return
        try {
            // Nạp trước các từ tốc ký quan trọng nhất vào đầu danh sách chữ cái
            for (w in (TWO_DIGIT_WORDS + SHORTCUT_WORDS)) {
                val lower = w.lowercase()
                val unacc = removeAccents(lower).lowercase()
                val ch = unacc.firstOrNull()
                if (ch != null) {
                    val list = prefix1Map.getOrPut(ch) { mutableListOf() }
                    if (!list.contains(lower)) {
                        list.add(lower)
                    }
                }
            }

            assets.open("vn_words.txt").bufferedReader().useLines { lines ->
                var rank = 0
                for (line in lines) {
                    val w = line.trim().lowercase()
                    if (w.isNotEmpty()) {
                        realWordsList.add(w)
                        if (!wordRankMap.containsKey(w)) {
                            wordRankMap[w] = rank
                        }
                        wordSet.add(w)
                        val unacc = removeAccents(w).lowercase()
                        unaccentedMap.getOrPut(unacc) { mutableListOf() }.add(w)

                        val ch = unacc.firstOrNull()
                        if (ch != null) {
                            val list = prefix1Map.getOrPut(ch) { mutableListOf() }
                            if (list.size < 15 && !list.contains(w)) {
                                list.add(w)
                            }
                        }
                        rank++
                    }
                }
            }

            // Đưa các từ thông dụng thực tế lên vị trí số 0 đầu tiên của danh sách từ không dấu
            for (w in (SHORTCUT_WORDS + TWO_DIGIT_WORDS)) {
                val lower = w.lowercase()
                val unacc = removeAccents(lower).lowercase()
                val list = unaccentedMap.getOrPut(unacc) { mutableListOf() }
                list.remove(lower)
                list.add(0, lower)
            }

            isInitialized = true
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun isRealWord(word: String): Boolean {
        val lower = word.lowercase()
        return wordSet.contains(lower) || SHORTCUT_WORDS.contains(lower) || TWO_DIGIT_WORDS.contains(lower)
    }

    fun getWordRank(word: String): Int {
        val lower = word.lowercase()
        return wordRankMap[lower] ?: 99999
    }

    fun getAccentedCandidates(unaccented: String): List<String> {
        val lower = unaccented.trim().lowercase()
        return unaccentedMap[lower] ?: emptyList()
    }

    fun getTopWordsForChar(ch: Char): List<String> {
        return prefix1Map[ch.lowercaseChar()] ?: emptyList()
    }

    fun getUnaccentedKeys(): Set<String> {
        return unaccentedMap.keys
    }
}