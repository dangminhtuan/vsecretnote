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

    // RHYMES_BASE: 60 vần Bảng 1 (a/ă/â/e/ê + anchors)
    val RHYMES_BASE = arrayOf(
        "êt", "ơ", "ach", "ai", "am", "an", "ang",
        "ôn", "ia", "âm", "ut", "ich", "ên", "ương",
        "ưng", "ươm", "iêm", "im", "ac", "ôm",
        "ưc", "âp", "ôn",
        "anh", "ao", "ap", "at", "au", "ay",
        "ă", "ăc", "ăm", "ăn", "ăng", "ăp", "ăt",
        "âu", "âc", "ân", "âng", "ât", "â", "ây",
        "ê", "ec", "em", "en", "eo", "ep", "et",
        "êu", "êch", "êm", "ênh", "êp", "a", "e",
        "i", "u", ""
    )

    // RHYMES_EXTRA_1: 60 vần Bảng 2 (i/o/ô/ơ)
    val RHYMES_EXTRA_1 = arrayOf(
        "iêc", "iên", "iêng", "iêp", "iêt", "iu", "in", "iêu", "ip", "it", "inh",
        "oa", "oai", "oan", "oc", "oe", "oi", "om", "on", "ong", "op", "ot", "oăn", "oăng",
        "ơm", "ôc", "ôi", "ông", "ôp", "ôt",
        "ơi", "ô", "ơn", "ơp", "ơt",
        "oen", "oac", "oach", "oam", "oang", "oanh", "oap", "oat", "oay", "oeo",
        "oem", "o", "oet", "ooc", "oong", "oăc", "oăm", "oăt", "iê", "eng",
        null, null, null, null, null
    )

    // RHYMES_EXTRA_2: 60 vần Bảng 3 (u/ư/y)
    val RHYMES_EXTRA_2 = arrayOf(
        "ua", "uât", "uc", "uê", "ui", "um", "un", "uân", "ung", "uôc", "uôi", "uôn", "uông", "uôt", "up", "uy", "uyên", "uyêt",
        "ynh", "ưa", "ưi", "y", "ưn", "ươc", "ươi", "ươn", "ươp", "ươt", "ưt", "ưu",
        "ưm", "yêm", "yên", "yêt", "yêu",
        "ươu", "uôm", "uơ", "uâng", "uây", "uêch", "uênh", "uya", "uych", "uyn",
        "uynh", "uyp", "uyt", "uyu", "yn", "ư", "yt", "yêng", "ăk", "n",
        null, null, null, null, null
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
        "mới", "pin", "qua", "ra", "tiền", "úc", "vào", "xin", "yêu", "zalo"
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

            for (w in (SHORTCUT_WORDS + TWO_DIGIT_WORDS)) {
                val lower = w.lowercase()
                val unacc = removeAccents(lower).lowercase()
                val list = unaccentedMap.getOrPut(unacc) { mutableListOf() }
                if (!list.contains(lower)) {
                    list.add(lower)
                }
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
}