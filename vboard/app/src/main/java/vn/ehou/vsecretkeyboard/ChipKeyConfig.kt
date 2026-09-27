package vn.ehou.vsecretkeyboard

data class ChipKeyDef(
    val key: String,
    val shiftKey: String? = null,
    val rhyme: String? = null,
    val sc1: String? = null,
    val sc2: String? = null,
    val tr: String? = null,
    val tap: String? = null,
    val note: String? = null,
    val directions: Map<String, String>? = null
) {
    val char: String get() = key
    val shift: String get() = shiftKey ?: key.uppercase()
    val tl: String get() = rhyme ?: ""
    val bl: String get() = sc2 ?: ""
    val br: String get() = sc1 ?: ""
}

object ChipKeyConfig {

    // === HÀNG 0: KÝ HIỆU & HÀNG TỰ DO (10 PHÍM) ===
    val rowSymbols = listOf(
        ChipKeyDef(
            key = ":",
            shiftKey = "[",
            rhyme = "uô",
            sc1 = "uông",
            sc2 = "uôc",
            note = "uô (6 hướng dấu: uô/uố/uồ/uổ/uỗ/uộ) | sc1: uông | sc2: uôc",
            tap = ":"
        ),
        ChipKeyDef(
            key = "?",
            shiftKey = "]",
            rhyme = "ui",
            sc1 = "gì",
            sc2 = "sao",
            note = "ui | sc1: gì | sc2: sao",
            tap = "?"
        ),
        ChipKeyDef(
            key = "\"",
            shiftKey = "{",
            rhyme = "ua",
            sc1 = "oe",
            sc2 = "qua",
            note = "ua | sc1: oe | sc2: qua",
            tap = "\""
        ),
        ChipKeyDef(
            key = "+",
            shiftKey = "}",
            rhyme = "ươi",
            sc1 = "người",
            sc2 = "tươi",
            note = "ươi | sc1: người | sc2: tươi",
            tap = "+"
        ),
        ChipKeyDef(
            key = "-",
            shiftKey = "_",
            rhyme = "uâ",
            sc1 = "uân",
            sc2 = "uât",
            note = "uâ (6 hướng dấu: uâ/uấ/uầ/uẩ/uẫ/uậ) | sc1: uân | sc2: uât",
            tap = "-"
        ),
        ChipKeyDef(
            key = "=",
            shiftKey = "~",
            rhyme = "uyê",
            sc1 = "uyên",
            sc2 = "uyêt",
            note = "uyê (6 hướng dấu: uyê/uyế/uyề/uyể/uyễ/uyệ) | sc1: uyên | sc2: uyêt",
            tap = "="
        ),
        ChipKeyDef(
            key = "/",
            shiftKey = "\\",
            rhyme = "â",
            sc1 = "ân",
            sc2 = "âm",
            note = "â (6 hướng dấu: â/ấ/ầ/ẩ/ẫ/ậ) | sc1: ân | sc2: âm",
            tap = "/"
        ),
        ChipKeyDef(
            key = "<",
            shiftKey = "|",
            rhyme = "oay",
            sc1 = "xoay",
            sc2 = "loay",
            note = "oay | sc1: xoay | sc2: loay",
            tap = "<"
        ),
        ChipKeyDef(
            key = ">",
            shiftKey = "`",
            rhyme = "ă",
            sc1 = "ăn",
            sc2 = "ăng",
            note = "ă (6 hướng dấu: ă/ắ/ằ/ẳ/ẵ/ặ) | sc1: ăn | sc2: ăng",
            tap = ">"
        ),
        ChipKeyDef(
            key = "000",
            shiftKey = "₫",
            rhyme = "ay",
            sc1 = "này",
            sc2 = "ngày",
            note = "000 | sc1: này | sc2: ngày | shift: ₫",
            tap = "000"
        )
    )

    // === HÀNG 1: SỐ (10 PHÍM) ===
    val rowNumbers = listOf(
        ChipKeyDef(
            key = "1",
            shiftKey = "!",
            rhyme = "yê",
            sc1 = "luyện",
            sc2 = "chuyện",
            note = "yê | tap: 1 | sc1: luyện | sc2: chuyện",
            tap = "1"
        ),
        ChipKeyDef(
            key = "2",
            shiftKey = "@",
            rhyme = "oat",
            sc1 = "thoát",
            sc2 = "oac",
            note = "oat | sc1: thoát | sc2: oac",
            tap = "2"
        ),
        ChipKeyDef(
            key = "3",
            shiftKey = "#",
            rhyme = "ê",
            sc1 = "yêu",
            sc2 = "yếu",
            note = "ê | sc1: yêu | sc2: yếu",
            tap = "3"
        ),
        ChipKeyDef(
            key = "4",
            shiftKey = "$",
            rhyme = "ươu",
            sc1 = "rượu",
            sc2 = "hươu",
            note = "ươu | sc1: rượu | sc2: hươu",
            tap = "4"
        ),
        ChipKeyDef(
            key = "5",
            shiftKey = "%",
            rhyme = "âu",
            sc1 = "đâu",
            sc2 = "sau",
            note = "âu | sc1: đâu | sc2: sau",
            tap = "5"
        ),
        ChipKeyDef(
            key = "6",
            shiftKey = "^",
            rhyme = "ươ",
            sc1 = "thường",
            sc2 = "trước",
            note = "ươ | tap: 6 | sc1: thường | sc2: trước",
            tap = "6"
        ),
        ChipKeyDef(
            key = "7",
            shiftKey = "&",
            rhyme = "oai",
            sc1 = "ngoài",
            sc2 = "thoải",
            note = "oai | sc1: ngoài | sc2: thoải",
            tap = "7"
        ),
        ChipKeyDef(
            key = "8",
            shiftKey = "*",
            rhyme = "oă",
            sc1 = "hoặc",
            sc2 = "khoăn",
            note = "oă | sc1: hoặc | sc2: khoăn",
            tap = "8"
        ),
        ChipKeyDef(
            key = "9",
            shiftKey = "(",
            rhyme = "ây",
            sc1 = "đây",
            sc2 = "thấy",
            note = "ây | sc1: đây | sc2: thấy",
            tap = "9"
        ),
        ChipKeyDef(
            key = "0",
            shiftKey = ")",
            rhyme = "ô",
            sc1 = "ông",
            sc2 = "rồi",
            note = "ô | sc1: ông | sc2: rồi",
            tap = "0"
        )
    )

    // === HÀNG 2: QWERTY (10 PHÍM) ===
    val rowQWERTY = listOf(
        ChipKeyDef(
            key = "q",
            rhyme = "ôi",
            sc1 = "quá",
            sc2 = "qu",
            tr = "q",
            note = "ôi | sc1: quá | sc2: qu",
            tap = "q"
        ),
        ChipKeyDef(
            key = "w",
            rhyme = "ư",
            sc1 = "như",
            sc2 = "ngh",
            tr = "W",
            note = "ư | sc1: như | sc2: ngh",
            tap = "w"
        ),
        ChipKeyDef(
            key = "e",
            rhyme = "e",
            sc1 = "em",
            sc2 = "quét",
            tr = "E",
            note = "e | sc1: em | sc2: quét",
            tap = "e"
        ),
        ChipKeyDef(
            key = "r",
            rhyme = "ưu",
            sc1 = "hữu",
            sc2 = "tr",
            tr = "R",
            note = "ưu + êu | 12h: ứu | 3h: ưu | 6h: ựu | 10h30: ều | 1h30: ếu | 9h: êu",
            tap = "r",
            directions = mapOf(
                "bang" to "ưu",
                "sac" to "ứu",
                "nang" to "ựu",
                "huyen" to "ều",
                "hoi" to "ếu",
                "nga" to "êu"
            )
        ),
        ChipKeyDef(
            key = "t",
            rhyme = "au",
            sc1 = "trong",
            sc2 = "th",
            tr = "T",
            note = "au | sc1: trong | sc2: th",
            tap = "t"
        ),
        ChipKeyDef(
            key = "y",
            rhyme = "iê",
            sc1 = "ý",
            sc2 = "yên",
            tr = "y",
            note = "iê | sc1: ý | sc2: yên",
            tap = "y"
        ),
        ChipKeyDef(
            key = "u",
            rhyme = "u",
            sc1 = "cũng",
            sc2 = "nếu",
            tr = "u",
            note = "u | tap: u | sc1: cũng | sc2: nếu",
            tap = "u"
        ),
        ChipKeyDef(
            key = "i",
            rhyme = "i",
            sc1 = "in",
            sc2 = "y",
            tr = "i",
            note = "i | sc1: in | sc2: y",
            tap = "i"
        ),
        ChipKeyDef(
            key = "o",
            rhyme = "o",
            sc1 = "ong",
            sc2 = "cho",
            tr = "o",
            note = "o | tap: o | sc1: ong | sc2: cho",
            tap = "o"
        ),
        ChipKeyDef(
            key = "p",
            rhyme = "ao",
            sc1 = "phải",
            sc2 = "cao",
            tr = "p",
            note = "ao | tap: p | sc1: phải | sc2: cao",
            tap = "p"
        )
    )

    // === HÀNG 3: ASDF (9 PHÍM) ===
    val rowASDF = listOf(
        ChipKeyDef(
            key = "a",
            rhyme = "a",
            sc1 = "anh",
            sc2 = "uya",
            tr = "a",
            note = "a | sc1: anh | sc2: uya (khuya)",
            tap = "a"
        ),
        ChipKeyDef(
            key = "s",
            rhyme = "oan",
            sc1 = "sẽ",
            sc2 = "x",
            tr = "s",
            note = "oan | sc1: sẽ | sc2: x",
            tap = "s"
        ),
        ChipKeyDef(
            key = "d",
            rhyme = "ơ",
            sc1 = "được",
            sc2 = "đ",
            tr = "D",
            note = "ơ | sc1: được | sc2: đ",
            tap = "d"
        ),
        ChipKeyDef(
            key = "f",
            rhyme = "ươn",
            sc1 = "phần",
            sc2 = "ph",
            tr = "f",
            note = "ươn | sc1: phần | sc2: ph",
            tap = "f"
        ),
        ChipKeyDef(
            key = "g",
            rhyme = "ai",
            sc1 = "gửi",
            sc2 = "gh",
            tr = "G",
            note = "ai | sc1: gửi | sc2: gh",
            tap = "g"
        ),
        ChipKeyDef(
            key = "h",
            rhyme = "iêu",
            sc1 = "những",
            sc2 = "nh",
            tr = "H",
            note = "iêu | sc1: những | sc2: nh",
            tap = "h"
        ),
        ChipKeyDef(
            key = "j",
            rhyme = "eo",
            sc1 = "giờ",
            sc2 = "gi",
            tr = "j",
            note = "eo | sc1: giờ | sc2: gi",
            tap = "j"
        ),
        ChipKeyDef(
            key = "k",
            rhyme = "iu",
            sc1 = "không",
            sc2 = "kh",
            tr = "K",
            note = "iu | sc1: không | sc2: kh",
            tap = "k"
        ),
        ChipKeyDef(
            key = "l",
            rhyme = "oi",
            sc1 = "là",
            sc2 = "lại",
            tr = "l",
            note = "oi | sc1: là | sc2: lại",
            tap = "l"
        )
    )

    // === HÀNG 4: ZXCV (7 PHÍM) ===
    val rowZXCV = listOf(
        ChipKeyDef(
            key = "z",
            rhyme = "ưa",
            sc1 = "đã",
            sc2 = "d",
            tr = "z",
            note = "ưa | sc1: đã | sc2: d",
            tap = "z"
        ),
        ChipKeyDef(
            key = "x",
            rhyme = "ơi",
            sc1 = "xem",
            sc2 = "s",
            tr = "x",
            note = "ơi | sc1: xem | sc2: s",
            tap = "x"
        ),
        ChipKeyDef(
            key = "c",
            rhyme = "oa",
            sc1 = "loa",
            sc2 = "ch",
            tr = "C",
            note = "oa | tap: c | sc1: loa | sc2: ch",
            tap = "c"
        ),
        ChipKeyDef(
            key = "v",
            rhyme = "ia",
            sc1 = "và",
            sc2 = "việc",
            tr = "v",
            note = "ia | sc1: và | sc2: việc",
            tap = "v"
        ),
        ChipKeyDef(
            key = "b",
            rhyme = "uy",
            sc1 = "bằng",
            sc2 = "bởi",
            tr = "b",
            note = "uy | sc1: bằng | sc2: bởi",
            tap = "b"
        ),
        ChipKeyDef(
            key = "n",
            rhyme = "ưi",
            sc1 = "năm",
            sc2 = "ng",
            tr = "N",
            note = "ưi | sc1: năm | sc2: ng",
            tap = "n"
        ),
        ChipKeyDef(
            key = "m",
            rhyme = "uôi",
            sc1 = "mình",
            sc2 = "muốn",
            tr = "m",
            note = "uôi | sc1: mình | sc2: muốn",
            tap = "m"
        )
    )

    // Tìm kiếm cấu hình phím theo key ID hoặc ký tự
    private val keyMap = mutableMapOf<String, ChipKeyDef>().apply {
        (rowSymbols + rowNumbers + rowQWERTY + rowASDF + rowZXCV).forEach {
            put(it.key, it)
        }
    }

    fun getDef(key: String): ChipKeyDef? = keyMap[key]
}
