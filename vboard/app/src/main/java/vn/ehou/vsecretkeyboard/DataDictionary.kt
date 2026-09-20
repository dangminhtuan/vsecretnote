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
}