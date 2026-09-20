package vn.ehou.vsecretkeyboard

data class VowelVariantRow(val title: String, val items: List<String>)
data class VowelData(val name: String, val rows: List<VowelVariantRow>)

data class ToneDef(
    val base: String,
    val tones: List<String>, // [0: Sắc, 1: Huyền, 2: Hỏi, 3: Ngã, 4: Nặng]
    val uppers: List<String> = tones.map { it.uppercase() },
    val label: String = base
)

data class ConsonantClusterDef(
    val base: String,
    val clusters: List<String>, // [0: qu, 1: ph, 2: gi, 3: ch, 4: ng]
    val uppers: List<String>,
    val labels: List<String>
)

object VowelDatabase {

    // 36 ánh xạ từ phím trên bàn phím sang nguyên âm / cụm vần tiếng Việt
    val KEY_TO_VOWEL_MAPPING: Map<String, String> = mapOf(
        // Hàng 1 (Số 1..0 -> 10 cụm vần ghép, uâ & iê cạnh nhau)
        "1" to "ươ", "2" to "ưa", "3" to "uâ", "4" to "iê", "5" to "ia",
        "6" to "uô", "7" to "ua", "8" to "uê", "9" to "uy", "0" to "yê",

        // Hàng 2:
        "q" to "oa", "w" to "ư", "e" to "e", "r" to "ê", "t" to "ơ",
        "y" to "y", "u" to "u", "i" to "i", "o" to "o", "p" to "ô",

        // Hàng 3:
        "a" to "a", "s" to "ă", "d" to "d", "f" to "â", "g" to "au",
        "h" to "ai", "j" to "ay", "k" to "ao", "l" to "êu",

        // Hàng 4:
        "z" to "ngh", "x" to "âu", "c" to "ơi", "v" to "ôi", "b" to "ui",
        "n" to "eo"
    )

    // Dữ liệu 5 dấu thanh chuẩn cho từng nguyên âm (0ms Hexa-Flick)
    // Thứ tự trong tones: [0: Sắc, 1: Huyền, 2: Hỏi, 3: Ngã, 4: Nặng]
    val TONE_DATABASE: Map<String, ToneDef> = mapOf(
        "o" to ToneDef("o", listOf("ó", "ò", "ỏ", "õ", "ọ"), listOf("Ó", "Ò", "Ỏ", "Õ", "Ọ")),
        "ô" to ToneDef("ô", listOf("ố", "ồ", "ổ", "ỗ", "ộ"), listOf("Ố", "Ồ", "Ổ", "Ỗ", "Ộ")),
        "ơ" to ToneDef("ơ", listOf("ớ", "ờ", "ở", "ỡ", "ợ"), listOf("Ớ", "Ờ", "Ở", "Ỡ", "Ợ")),
        "u" to ToneDef("u", listOf("ú", "ù", "ủ", "ũ", "ụ"), listOf("Ú", "Ù", "Ủ", "Ũ", "Ụ")),
        "ư" to ToneDef("ư", listOf("ứ", "ừ", "ử", "ữ", "ự"), listOf("Ứ", "Ừ", "Ử", "Ữ", "Ự")),
        "a" to ToneDef("a", listOf("á", "à", "ả", "ã", "ạ"), listOf("Á", "À", "Ả", "Ã", "Ạ")),
        "â" to ToneDef("â", listOf("ấ", "ầ", "ẩ", "ẫ", "ậ"), listOf("Ấ", "Ầ", "Ẩ", "Ẫ", "Ậ")),
        "ă" to ToneDef("ă", listOf("ắ", "ằ", "ẳ", "ẵ", "ặ"), listOf("Ắ", "Ằ", "Ẳ", "Ẵ", "Ặ")),
        "e" to ToneDef("e", listOf("é", "è", "ẻ", "ẽ", "ẹ"), listOf("É", "È", "Ẻ", "Ẽ", "Ẹ")),
        "ê" to ToneDef("ê", listOf("ế", "ề", "ể", "ễ", "ệ"), listOf("Ế", "Ề", "Ể", "Ễ", "Ệ")),
        "i" to ToneDef("i", listOf("í", "ì", "ỉ", "ĩ", "ị"), listOf("Í", "Ì", "Ỉ", "Ĩ", "Ị")),
        "y" to ToneDef("y", listOf("ý", "ỳ", "ỷ", "ỹ", "ỵ"), listOf("Ý", "Ỳ", "Ỷ", "Ỹ", "Ỵ")),

        // Cụm nguyên âm kép
        "ươ" to ToneDef("ươ", listOf("ướ", "ườ", "ưở", "ưỡ", "ượ"), listOf("ƯỚ", "ƯỜ", "ƯỞ", "ƯỠ", "ƯỢ")),
        "ưa" to ToneDef("ưa", listOf("ứa", "ừa", "ửa", "ữa", "ựa"), listOf("ỨA", "ỪA", "ỬA", "ỮA", "ỰA")),
        "uâ" to ToneDef("uâ", listOf("uấ", "uầ", "uẩ", "uẫ", "uậ"), listOf("UẤ", "UẦ", "UẨ", "UẪ", "UẬ")),
        "iê" to ToneDef("iê", listOf("iế", "iề", "iể", "iễ", "iệ"), listOf("IẾ", "IỀ", "IỂ", "IỄ", "IỆ")),
        "ia" to ToneDef("ia", listOf("ía", "ìa", "ỉa", "ĩa", "ịa"), listOf("ÍA", "ÌA", "ỈA", "ĨA", "ỊA")),
        "uô" to ToneDef("uô", listOf("uố", "uồ", "uổ", "uỗ", "uộ"), listOf("UỐ", "UỒ", "UỔ", "UỖ", "UỘ")),
        "ua" to ToneDef("ua", listOf("úa", "ùa", "ủa", "ũa", "ụa"), listOf("ÚA", "ÙA", "ỦA", "ŨA", "ỤA")),
        "uê" to ToneDef("uê", listOf("uế", "uề", "uể", "uễ", "uệ"), listOf("UẾ", "UỀ", "UỂ", "UỄ", "UỆ")),
        "uy" to ToneDef("uy", listOf("uý", "uỳ", "uỷ", "uỹ", "uỵ"), listOf("UÝ", "UỲ", "UỶ", "UỸ", "UỴ")),
        "yê" to ToneDef("yê", listOf("yế", "yề", "yể", "yễ", "yệ"), listOf("YẾ", "YỀ", "YỂ", "YỄ", "YỆ")),
        "oa" to ToneDef("oa", listOf("oá", "oà", "oả", "oã", "oạ"), listOf("OÁ", "OÀ", "OẢ", "OÃ", "OẠ")),
        "ai" to ToneDef("ai", listOf("ái", "ài", "ải", "ãi", "ại"), listOf("ÁI", "ÀI", "ẢI", "ÃI", "ẠI")),
        "ay" to ToneDef("ay", listOf("áy", "ày", "ảy", "ãy", "ạy"), listOf("ÁY", "ÀY", "ẢY", "ÃY", "ẠY")),
        "ây" to ToneDef("ây", listOf("ấy", "ầy", "ẩy", "ẫy", "ậy"), listOf("ẤY", "ẦY", "ẨY", "ẪY", "ẬY")),
        "ao" to ToneDef("ao", listOf("áo", "ào", "ảo", "ão", "ạo"), listOf("ÁO", "ÀO", "ẢO", "ÃO", "ẠO")),
        "au" to ToneDef("au", listOf("áu", "àu", "ảu", "ãu", "ạu"), listOf("ÁU", "ÀU", "ẢU", "ÃU", "ẠU")),
        "âu" to ToneDef("âu", listOf("ấu", "ầu", "ẩu", "ẫu", "ậu"), listOf("ẤU", "ẦU", "ẨU", "ẪU", "ẬU")),
        "oi" to ToneDef("oi", listOf("ói", "òi", "ỏi", "õi", "ọi"), listOf("ÓI", "ÒI", "ỎI", "ÕI", "ỌI")),
        "ơi" to ToneDef("ơi", listOf("ới", "ời", "ởi", "ỡi", "ợi"), listOf("ỚI", "ỜI", "ỞI", "ỠI", "ỢI")),
        "ôi" to ToneDef("ôi", listOf("ối", "ồi", "ổi", "ỗi", "ội"), listOf("ỐI", "ỒI", "ỔI", "ỖI", "ỘI")),
        "ui" to ToneDef("ui", listOf("úi", "ùi", "ủi", "ũi", "ụi"), listOf("ÚI", "ÙI", "ỦI", "ŨI", "ỤI")),
        "eo" to ToneDef("eo", listOf("éo", "èo", "ẻo", "ẽo", "ẹo"), listOf("ÉO", "ÈO", "ẺO", "ẼO", "ẸO")),
        "êu" to ToneDef("êu", listOf("ếu", "ều", "ểu", "ễu", "ệu"), listOf("ẾU", "ỀU", "ỂU", "ỄU", "ỆU"))
    )

    // Bảng 2 Siêu Phím Phụ Âm Kép Tiếng Việt:
    // z / ngh: 0: qu, 1: ph, 2: gi, 3: ch, 4: ng, 5: ngh (gốc)
    // d / đ:   0: tr, 1: nh, 2: kh, 3: gh, 4: th, 5: đ (gốc)
    val CONSONANT_CLUSTERS: Map<String, ConsonantClusterDef> = mapOf(
        "ngh" to ConsonantClusterDef(
            base = "ngh",
            clusters = listOf("qu", "ph", "gi", "ch", "ng"),
            uppers = listOf("Qu", "Ph", "Gi", "Ch", "Ng"),
            labels = listOf("qu: quê", "ph: phố", "gi: giờ", "ch: chúng", "ng: người")
        ),
        "d" to ConsonantClusterDef(
            base = "đ",
            clusters = listOf("tr", "nh", "kh", "gh", "th"),
            uppers = listOf("Tr", "Nh", "Kh", "Gh", "Th"),
            labels = listOf("tr: trời", "nh: nhìn", "kh: không", "gh: ghế", "th: thấy")
        )
    )

    val DATA: Map<String, VowelData> = mapOf(
        "u" to VowelData("u & ư", listOf(
            VowelVariantRow("u thường:", listOf("u", "ù", "ú", "ủ", "ũ", "ụ")),
            VowelVariantRow("ư thường:", listOf("ư", "ừ", "ứ", "ử", "ữ", "ự")),
            VowelVariantRow("U HOA:", listOf("U", "Ù", "Ú", "Ủ", "Ũ", "Ụ")),
            VowelVariantRow("Ư HOA:", listOf("Ư", "Ừ", "Ứ", "Ử", "Ữ", "Ự"))
        )),
        "a" to VowelData("a, ă, â", listOf(
            VowelVariantRow("a thường:", listOf("a", "à", "á", "ả", "ã", "ạ")),
            VowelVariantRow("ă thường:", listOf("ă", "ằ", "ắ", "ẳ", "ẵ", "ặ")),
            VowelVariantRow("â thường:", listOf("â", "ầ", "ấ", "ẩ", "ẫ", "ậ")),
            VowelVariantRow("A, Ă, Â HOA:", listOf("A", "Ă", "Â", "Á", "Ắ", "Ấ"))
        )),
        "o" to VowelData("o, ô, ơ", listOf(
            VowelVariantRow("o thường:", listOf("o", "ò", "ó", "ỏ", "õ", "ọ")),
            VowelVariantRow("ô thường:", listOf("ô", "ồ", "ố", "ổ", "ỗ", "ộ")),
            VowelVariantRow("ơ thường:", listOf("ơ", "ờ", "ớ", "ở", "ỡ", "ợ")),
            VowelVariantRow("O, Ô, Ơ HOA:", listOf("O", "Ô", "Ơ", "Ó", "Ố", "Ớ"))
        )),
        "e" to VowelData("e & ê", listOf(
            VowelVariantRow("e thường:", listOf("e", "è", "é", "ẻ", "ẽ", "ẹ")),
            VowelVariantRow("ê thường:", listOf("ê", "ề", "ế", "ể", "ễ", "ệ")),
            VowelVariantRow("E, Ê HOA:", listOf("E", "Ê", "É", "Ế", "È", "Ề"))
        )),
        "i" to VowelData("i", listOf(
            VowelVariantRow("i thường:", listOf("i", "ì", "í", "ỉ", "ĩ", "ị")),
            VowelVariantRow("I HOA:", listOf("I", "Ì", "Í", "Ỉ", "Ĩ", "Ị"))
        )),
        "y" to VowelData("y", listOf(
            VowelVariantRow("y thường:", listOf("y", "ỳ", "ý", "ỷ", "ỹ", "ỵ")),
            VowelVariantRow("Y HOA:", listOf("Y", "Ỳ", "Ý", "Ỷ", "Ỹ", "Ỵ"))
        )),
        "ươ" to VowelData("ươ", listOf(
            VowelVariantRow("ươ thường:", listOf("ươ", "ườ", "ướ", "ưở", "ưỡ", "ượ")),
            VowelVariantRow("ƯƠ HOA:", listOf("ƯƠ", "ƯỜ", "ƯỚ", "ƯỞ", "ƯỠ", "ƯỢ")),
            VowelVariantRow("Ươ hoa đầu:", listOf("Ươ", "Ườ", "Ướ", "Ưở", "Ưỡ", "Ượ"))
        )),
        "ưa" to VowelData("ưa", listOf(
            VowelVariantRow("ưa thường:", listOf("ưa", "ừa", "ứa", "ửa", "ữa", "ựa")),
            VowelVariantRow("ƯA HOA:", listOf("ƯA", "ỪA", "ỨA", "ỬA", "ỮA", "ỰA")),
            VowelVariantRow("Ưa hoa đầu:", listOf("Ưa", "Ừa", "Ứa", "Ửa", "Ữa", "Ựa"))
        )),
        "iê" to VowelData("iê", listOf(
            VowelVariantRow("iê thường:", listOf("iê", "iề", "iế", "iể", "iễ", "iệ")),
            VowelVariantRow("IÊ HOA:", listOf("IÊ", "IỀ", "IẾ", "IỂ", "IỄ", "IỆ")),
            VowelVariantRow("Iê hoa đầu:", listOf("Iê", "Iề", "Iế", "Iể", "Iễ", "Iệ"))
        )),
        "ia" to VowelData("ia", listOf(
            VowelVariantRow("ia thường:", listOf("ia", "ìa", "ía", "ỉa", "ĩa", "ịa")),
            VowelVariantRow("IA HOA:", listOf("IA", "ÌA", "ÍA", "ỈA", "ĨA", "ỊA")),
            VowelVariantRow("Ia hoa đầu:", listOf("Ia", "Ìa", "Ía", "Ỉa", "Ĩa", "Ịa"))
        )),
        "uô" to VowelData("uô", listOf(
            VowelVariantRow("uô thường:", listOf("uô", "uồ", "uố", "uổ", "uỗ", "uộ")),
            VowelVariantRow("UÔ HOA:", listOf("UÔ", "UỒ", "UỐ", "UỔ", "UỖ", "UỘ")),
            VowelVariantRow("Uô hoa đầu:", listOf("Uô", "Uồ", "Uố", "Uổ", "Uỗ", "Uộ"))
        )),
        "ua" to VowelData("ua", listOf(
            VowelVariantRow("ua thường:", listOf("ua", "ùa", "úa", "ủa", "ũa", "ụa")),
            VowelVariantRow("UA HOA:", listOf("UA", "ÙA", "ÚA", "ỦA", "ŨA", "ỤA")),
            VowelVariantRow("Ua hoa đầu:", listOf("Ua", "Ùa", "Úa", "Ủa", "Ũa", "Ụa"))
        )),
        "oa" to VowelData("oa", listOf(
            VowelVariantRow("oa thường:", listOf("oa", "oà", "oá", "oả", "oã", "oạ")),
            VowelVariantRow("OA HOA:", listOf("OA", "OÀ", "OÁ", "OẢ", "OÃ", "OẠ")),
            VowelVariantRow("Oa hoa đầu:", listOf("Oa", "Oà", "Oá", "Oả", "Oã", "Oạ"))
        )),
        "oe" to VowelData("oe", listOf(
            VowelVariantRow("oe thường:", listOf("oe", "oè", "oé", "oẻ", "oẽ", "oẹ")),
            VowelVariantRow("OE HOA:", listOf("OE", "OÈ", "OÉ", "OẺ", "OẼ", "OẸ")),
            VowelVariantRow("Oe hoa đầu:", listOf("Oe", "Oè", "Oé", "Oẻ", "Oẽ", "Oẹ"))
        )),
        "uy" to VowelData("uy", listOf(
            VowelVariantRow("uy thường:", listOf("uy", "uỳ", "uý", "uỷ", "uỹ", "uỵ")),
            VowelVariantRow("UY HOA:", listOf("UY", "UỲ", "UÝ", "UỶ", "UỸ", "UỴ")),
            VowelVariantRow("Uy hoa đầu:", listOf("Uy", "Uỳ", "Uý", "Uỷ", "Uỹ", "Uỵ"))
        )),
        "uê" to VowelData("uê", listOf(
            VowelVariantRow("uê thường:", listOf("uê", "uề", "uế", "uể", "uễ", "uệ")),
            VowelVariantRow("UÊ HOA:", listOf("UÊ", "UỀ", "UẾ", "UỂ", "UỄ", "UỆ")),
            VowelVariantRow("Uê hoa đầu:", listOf("Uê", "Uề", "Uế", "Uể", "Uễ", "Uệ"))
        )),
        "yê" to VowelData("yê", listOf(
            VowelVariantRow("yê thường:", listOf("yê", "yề", "yế", "yể", "yễ", "yệ")),
            VowelVariantRow("YÊ HOA:", listOf("YÊ", "YỀ", "YẾ", "YỂ", "YỄ", "YỆ")),
            VowelVariantRow("Yê hoa đầu:", listOf("Yê", "Yề", "Yế", "Yể", "Yễ", "Yệ"))
        )),
        "ai" to VowelData("ai", listOf(
            VowelVariantRow("ai thường:", listOf("ai", "ài", "ái", "ải", "ãi", "ại")),
            VowelVariantRow("AI HOA:", listOf("AI", "ÀI", "ÁI", "ẢI", "ÃI", "ẠI")),
            VowelVariantRow("Ai hoa đầu:", listOf("Ai", "Ài", "Ái", "Ải", "Ãi", "Ại"))
        )),
        "ay" to VowelData("ay", listOf(
            VowelVariantRow("ay thường:", listOf("ay", "ày", "áy", "ảy", "ãy", "ạy")),
            VowelVariantRow("AY HOA:", listOf("AY", "ÀY", "ÁY", "ẢY", "ÃY", "ẠY")),
            VowelVariantRow("Ay hoa đầu:", listOf("Ay", "Ày", "Áy", "Ảy", "Ãy", "Ạy"))
        )),
        "ao" to VowelData("ao", listOf(
            VowelVariantRow("ao thường:", listOf("ao", "ào", "áo", "ảo", "ão", "ạo")),
            VowelVariantRow("AO HOA:", listOf("AO", "ÀO", "ÁO", "ẢO", "ÃO", "ẠO")),
            VowelVariantRow("Ao hoa đầu:", listOf("Ao", "Ào", "Áo", "Ảo", "Ão", "Ạo"))
        )),
        "au" to VowelData("au", listOf(
            VowelVariantRow("au thường:", listOf("au", "àu", "áu", "ảu", "ãu", "ạu")),
            VowelVariantRow("AU HOA:", listOf("AU", "ÀU", "ÁU", "ẢU", "ÃU", "ẠU")),
            VowelVariantRow("Au hoa đầu:", listOf("Au", "Àu", "Áu", "Ảu", "Ãu", "Ạu"))
        )),
        "âu" to VowelData("âu", listOf(
            VowelVariantRow("âu thường:", listOf("âu", "ầu", "ấu", "ẩu", "ẫu", "ậu")),
            VowelVariantRow("ÂU HOA:", listOf("ÂU", "ẦU", "ẤU", "ẨU", "ẪU", "ẬU")),
            VowelVariantRow("Âu hoa đầu:", listOf("Âu", "Ầu", "Ấu", "Ẩu", "Ẫu", "Ậu"))
        )),
        "ơi" to VowelData("ơi", listOf(
            VowelVariantRow("ơi thường:", listOf("ơi", "ời", "ới", "ởi", "ỡi", "ợi")),
            VowelVariantRow("ƠI HOA:", listOf("ƠI", "ỜI", "ỚI", "ỞI", "ỠI", "ỢI")),
            VowelVariantRow("Ơi hoa đầu:", listOf("Ơi", "Ời", "Ới", "Ởi", "Ỡi", "Ợi"))
        )),
        "ôi" to VowelData("ôi", listOf(
            VowelVariantRow("ôi thường:", listOf("ôi", "ồi", "ối", "ổi", "ỗi", "ội")),
            VowelVariantRow("ÔI HOA:", listOf("ÔI", "ỒI", "ỐI", "ỔI", "ỖI", "ỘI")),
            VowelVariantRow("Ôi hoa đầu:", listOf("Ôi", "Ồi", "Ối", "Ổi", "Ỗi", "Ội"))
        )),
        "oi" to VowelData("oi", listOf(
            VowelVariantRow("oi thường:", listOf("oi", "òi", "ói", "ỏi", "õi", "ọi")),
            VowelVariantRow("OI HOA:", listOf("OI", "ÒI", "ÓI", "ỎI", "ÕI", "ỌI")),
            VowelVariantRow("Oi hoa đầu:", listOf("Oi", "Òi", "Ói", "Ỏi", "Õi", "Ọi"))
        )),
        "ui" to VowelData("ui", listOf(
            VowelVariantRow("ui thường:", listOf("ui", "ùi", "úi", "ủi", "ũi", "ụi")),
            VowelVariantRow("UI HOA:", listOf("UI", "ÙI", "ÚI", "ỦI", "ŨI", "ỤI")),
            VowelVariantRow("Ui hoa đầu:", listOf("Ui", "Ùi", "Úi", "Ủi", "Ũi", "Ụi"))
        )),
        "ưi" to VowelData("ưi", listOf(
            VowelVariantRow("ưi thường:", listOf("ửi", "ứi", "ừi", "ựi")),
            VowelVariantRow("ƯI HOA:", listOf("ỬI", "ỨI", "ỪI", "ỰI"))
        )),
        "ngh" to VowelData("ngh", listOf(
            VowelVariantRow("Chữ thường:", listOf("ngh")),
            VowelVariantRow("Chữ HOA:", listOf("NGH")),
            VowelVariantRow("Hoa đầu:", listOf("Ngh"))
        ))
    )
}
