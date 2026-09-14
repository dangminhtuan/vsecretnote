package vn.ehou.vsecretkeyboard

object DataDictionary {
    val TONES = arrayOf("ngang", "sắc", "huyền", "hỏi", "ngã", "nặng")

    val CONSONANTS_BASE = arrayOfNulls<String>(24)
    val CONSONANTS_EXTRA = arrayOfNulls<String>(8)
    
    init {
        CONSONANTS_BASE[7] = "h"
        CONSONANTS_BASE[8] = "v"
        CONSONANTS_BASE[9] = "d"
        CONSONANTS_BASE[10] = "m"
        CONSONANTS_BASE[11] = "ch"
        CONSONANTS_BASE[12] = "r"
        CONSONANTS_BASE[13] = "s"
        CONSONANTS_BASE[14] = "n"
        CONSONANTS_BASE[15] = "b"
        CONSONANTS_BASE[16] = "l"
        CONSONANTS_BASE[17] = "ch"
        CONSONANTS_BASE[18] = "s"
        CONSONANTS_BASE[19] = ""
        CONSONANTS_BASE[20] = "ng"
        CONSONANTS_BASE[21] = "nh"
        CONSONANTS_BASE[22] = "l"

        val remainingConsonants = listOf(
            "", "b", "c", "d", "đ", "g", "gh", "gi", "h", "k", "kh",
            "n", "ng", "ngh", "nh", "p", "ph", "qu", "r", "s", "t", "th", "tr", "v", "x"
        )

        val poolConsonants = remainingConsonants.filter { !CONSONANTS_BASE.contains(it) }

        var poolIndex = 0
        for (i in 0 until 24) {
            if (CONSONANTS_BASE[i] == null) {
                CONSONANTS_BASE[i] = poolConsonants[poolIndex++]
            }
        }
        for (i in 0 until 8) {
            if (CONSONANTS_EXTRA[i] == null && poolIndex < poolConsonants.size) {
                CONSONANTS_EXTRA[i] = poolConsonants[poolIndex++]
            }
        }
    }

    val RHYMES_BASE = arrayOfNulls<String>(60)
    lateinit var RHYMES_EXTRA_1: List<String>
    lateinit var RHYMES_EXTRA_2: List<String>

    init {
        RHYMES_BASE[7] = "ôn"
        RHYMES_BASE[8] = "u"
        RHYMES_BASE[9] = "âm"
        RHYMES_BASE[10] = "ut"
        RHYMES_BASE[11] = "ich"
        RHYMES_BASE[12] = "ên"
        RHYMES_BASE[13] = "ương"
        RHYMES_BASE[14] = "ưng"
        RHYMES_BASE[15] = "ươm"
        RHYMES_BASE[16] = "iêm"
        RHYMES_BASE[17] = "im"
        RHYMES_BASE[18] = "ơ"
        RHYMES_BASE[19] = "ôm"
        RHYMES_BASE[20] = "ưc"
        RHYMES_BASE[21] = "âp"
        RHYMES_BASE[22] = "ôn"

        val allRhymes = listOf(
            "a", "ac", "ach", "ai", "am", "an", "ang", "anh", "ao", "ap", "at", "au", "ay", 
            "ă", "ăc", "ăm", "ăn", "ăng", "ăp", "ăt",
            "â", "âc", "âm", "ân", "âng", "âp", "ât", "âu", "ây",
            "e", "ec", "em", "en", "eng", "eo", "ep", "et",
            "ê", "êch", "êm", "ên", "ênh", "êp", "êt", "êu",
            "i", "ia", "ich", "iêc", "iêm", "iên", "iêng", "iêp", "iêt", "iêu", "im", "in", "inh", "ip", "it", "iu",
            "o", "oa", "oac", "oach", "oai", "oam", "oan", "oang", "oanh", "oap", "oat", "oay", "oăc", "oăm", "oăn", "oăng", "oăt", "oc", "oe", "oen", "oeo", "oet", "oi", "om", "on", "ong", "op", "ot",
            "ô", "ôc", "ôi", "ôm", "ôn", "ông", "ôp", "ôt",
            "ơ", "ơi", "ơm", "ơn", "ơp", "ơt",
            "u", "ua", "uân", "uâng", "uât", "uây", "uc", "uê", "uêch", "uênh", "ui", "um", "un", "ung", "uo", "uôc", "uôi", "uôm", "uôn", "uông", "uôt", "up", "ut", "uya", "uych", "uyn", "uynh", "uyt", "uyu", "uy", "uyên", "uyêt",
            "ư", "ưa", "ưc", "ưi", "ưm", "ưn", "ưng", "ươc", "ươi", "ươm", "ươn", "ương", "ươp", "ươt", "ưt", "ưu",
            "y", "yêm", "yên", "yêng", "yêt", "yêu"
        )

        val poolRhymes = allRhymes.filter { !RHYMES_BASE.contains(it) }

        var rPoolIndex = 0
        for (i in 0 until 60) {
            if (RHYMES_BASE[i] == null) {
                RHYMES_BASE[i] = poolRhymes[rPoolIndex++]
            }
        }
        
        RHYMES_EXTRA_1 = poolRhymes.subList(rPoolIndex, rPoolIndex + 60)
        rPoolIndex += 60
        RHYMES_EXTRA_2 = poolRhymes.subList(rPoolIndex, poolRhymes.size)
    }

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

    val BASE60_MAPPING = listOf(
        'c', 'd', 'g', 'G', 'j', 'k', 'K', 'h', 'v', 'D', 'm', 'C', 'r', 's', 'n', 'b', 'l', 'q', 'S', 'z', 'N', 'y', 'L', 'W',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'e', 'f', 'i', 'p', 't', 'u', 'w', 'x',
        'A', 'B', 'E', 'F', 'H', 'I', 'J', 'M', 'P', 'Q', 'R', 'T', 'U', 'V', 'X', 'Y', 'Z'
    )
    
    val SHORT_WORDS = listOf(
        "cá", "cà", "cả", "cã", "cạ", "cú", "cù", "củ", "cũ", "cụ", "cớ", "cờ", "cở", "cỡ", "cợ", "cắ", "cằ", "cẳ", "cẵ", "cặ", "cấ", "cầ", "cẩ", "cẫ", "cậ", "cé", "cè", "cẻ", "cẽ", "cẹ", "cế", "cề", "cể", "cễ", "cệ", "cí", "cì", "cỉ", "cĩ", "cị", "đá", "đà", "đả", "đã", "đạ", "đú", "đù", "đủ", "đũ", "đụ", "đớ", "đờ", "đở", "đỡ", "đợ", "đắ", "đằ", "đẳ", "đẵ", "đặ", "đấ", "đầ", "đẩ", "đẫ", "đậ", "đé", "đè", "đẻ", "đẽ", "đẹ", "đế", "đề", "để", "đễ", "đệ", "đí", "đì", "đỉ", "đĩ", "đị", "gá", "gà", "gả", "gã", "gạ", "gú", "gù", "gủ", "gũ", "gụ", "gớ", "gờ", "gở", "gỡ", "gợ", "gắ", "gằ", "gẳ", "gẵ", "gặ", "gấ", "gầ", "gẩ", "gẫ", "gậ", "gé", "gè", "gẻ", "gẽ", "gẹ", "gế", "gề", "gể", "gễ", "gệ", "gí", "gỉ", "gĩ", "gị", "ká", "kà", "kả", "kã", "kạ", "kú", "kù", "kủ", "kũ", "kụ", "kớ", "kờ", "kở", "kỡ", "kợ", "kắ", "kằ", "kẳ", "kẵ", "kặ", "kấ", "kầ", "kẩ", "kẫ", "kậ", "ké", "kè", "kẻ", "kẽ", "kẹ", "kế", "kề", "kể", "kễ", "kệ", "kí", "kì", "kỉ", "kĩ", "kị", "há", "hà", "hả", "hã", "hạ", "hú", "hù", "hủ", "hũ", "hụ", "hớ", "hờ", "hở", "hỡ", "hợ", "hắ", "hằ", "hẳ", "hẵ", "hặ", "hấ", "hầ", "hẩ", "hẫ", "hậ", "hé", "hè", "hẻ", "hẽ", "hẹ", "hế", "hề", "hể", "hễ", "hệ", "hí", "hì", "hỉ", "hĩ", "hị", "vá", "và", "vả", "vã", "vạ", "vù", "vủ", "vũ", "vụ", "vớ", "vờ", "vở", "vỡ", "vợ", "vắ", "vằ", "vẳ", "vẵ", "vặ", "vấ", "vầ", "vẩ", "vẫ", "vậ", "vé", "vè", "vẻ", "vẽ", "vẹ", "vế", "về", "vể", "vễ", "vệ", "ví", "vì", "vỉ", "vĩ", "vị", "dá", "dà", "dả", "dã", "dú", "dù", "dủ", "dũ", "dụ", "dớ", "dờ", "dở", "dỡ", "dợ", "dắ", "dằ", "dẳ", "dẵ", "dặ", "dấ", "dầ", "dẩ", "dẫ", "dậ", "dé", "dè", "dẻ", "dẽ", "dẹ", "dế", "dề", "dể", "dễ", "dệ", "dí", "dì", "dỉ", "dĩ", "dị", "má", "mà", "mả", "mã", "mạ", "mú", "mù", "mủ", "mũ", "mụ", "mớ", "mờ", "mở", "mỡ", "mợ", "mắ", "mằ", "mẳ", "mẵ", "mặ", "mấ", "mầ", "mẩ", "mẫ", "mậ", "mé", "mè", "mẻ", "mẽ", "mẹ", "mế", "mề", "mể", "mễ", "mệ", "mí", "mì", "mỉ", "mĩ", "mị", "rá", "rà", "rả", "rã", "rạ", "rú", "rù", "rủ", "rũ", "rụ", "rớ", "rờ", "rở", "rỡ", "rợ", "rắ", "rằ", "rẳ", "rẵ", "rặ", "rấ", "rầ", "rẩ", "rẫ", "rậ", "ré", "rè", "rẻ", "rẽ", "rẹ", "rế", "rề", "rể", "rễ", "rệ", "rí", "rì", "rỉ", "rĩ", "rị", "sá", "sà", "sả", "sã", "sạ", "sú", "sù", "sủ", "sũ", "sụ", "sớ", "sở", "sỡ", "sợ", "sắ", "sằ", "sẳ", "sẵ", "sặ", "sấ", "sầ", "sẩ", "sẫ", "sậ", "sé", "sè", "sẻ", "sẹ", "sế", "sề", "sể", "sễ", "sệ", "sí", "sì", "sỉ", "sĩ", "sị", "ná", "nà", "nả", "nã", "nạ", "nú", "nù", "nủ", "nũ", "nụ", "nớ", "nờ", "nở", "nỡ", "nợ", "nắ", "nằ", "nẳ", "nẵ", "nặ", "nấ", "nầ", "nẩ", "nẫ", "nậ", "né", "nè", "nẻ", "nẽ", "nẹ", "nế", "nề", "nể", "nễ", "nệ", "ní", "nì", "nỉ", "nĩ", "nị", "bá", "bà", "bả", "bã", "bạ", "bú", "bù", "bủ", "bũ", "bụ", "bớ", "bờ", "bở", "bỡ", "bợ", "bắ", "bằ", "bẳ", "bẵ", "bặ", "bấ", "bầ", "bẩ", "bẫ", "bậ", "bé", "bè", "bẻ", "bẽ", "bẹ", "bế", "bề", "bể", "bễ", "bệ", "bí", "bì", "bỉ", "bĩ", "bị", "lá", "là", "lả", "lã", "lạ", "lú", "lù", "lủ", "lũ", "lụ", "lớ", "lờ", "lở", "lỡ", "lợ", "lắ", "lằ", "lẳ", "lẵ", "lặ", "lấ", "lầ", "lẩ", "lẫ", "lậ", "lé", "lè", "lẻ", "lẽ", "lẹ", "lế", "lề", "lể", "lễ", "lệ", "lí", "lì", "lỉ", "lĩ", "lị", "á", "à", "ả", "ã", "ạ", "ạc", "ái", "ài", "ải", "ãi", "ại", "ám", "àm", "ảm", "ãm", "ạm", "án", "àn", "ản", "ãn", "ạn", "ốn", "ồn", "ổn", "ỗn", "ộn", "ú", "ù", "ủ", "ũ", "ụ", "ấm", "ầm", "ẩm", "ẫm", "ậm", "ụt", "ến", "ền", "ển", "ễn", "ện", "ím", "ìm", "ỉm", "ĩm", "ịm", "ớ", "ờ", "ở", "ỡ", "ợ", "ốm", "ồm", "ổm", "ỗm", "ộm", "ực", "ập", "áo", "ào", "ảo", "ão", "ạo", "ạp", "ạt", "áu", "àu", "ảu", "ãu", "ạu", "áy", "ày", "ảy", "ãy", "ạy", "ắ", "ằ", "ẳ", "ẵ", "ặ", "ặc", "ắm", "ằm", "ẳm", "ẵm", "ặm", "ắn", "ằn", "ẳn", "ẵn", "ặn", "ặp", "ặt", "ấ", "ầ", "ẩ", "ẫ", "ậ", "ậc", "ấn", "ần", "ẩn", "ẫn", "ận", "ật", "ấu", "ầu", "ẩu", "ẫu", "ậu", "ấy", "ầy", "ẩy", "ẫy", "ậy", "é", "è", "ẻ", "ẽ", "ẹ", "ẹc", "ém", "èm", "ẻm", "ẽm", "ẹm", "én", "èn", "ẻn", "ẽn", "ẹn", "éo", "èo", "ẻo", "ẽo", "ẹo", "ẹp", "ẹt", "ế", "ề", "ể", "ễ", "ệ", "ếm", "ềm", "ểm", "ễm", "ệm", "ệp", "ệt", "ếu", "ều", "ểu", "ễu", "ệu", "í", "ì", "ỉ", "ĩ", "ị", "iá", "ià", "iả", "iã", "iạ", "pá", "pà", "pả", "pã", "pạ", "pú", "pù", "pủ", "pũ", "pụ", "pớ", "pờ", "pở", "pỡ", "pợ", "pắ", "pằ", "pẳ", "pẵ", "pặ", "pấ", "pầ", "pẩ", "pẫ", "pậ", "pé", "pè", "pẻ", "pẽ", "pẹ", "pế", "pề", "pể", "pễ", "pệ", "pí", "pì", "pỉ", "pĩ", "pị", "tá", "tà", "tả", "tã", "tạ", "tú", "tù", "tủ", "tũ", "tụ", "tớ", "tờ", "tở", "tỡ", "tợ", "tắ", "tằ", "tẳ", "tẵ", "tặ", "tấ", "tầ", "tẩ", "tẫ", "tậ", "té", "tè", "tẻ", "tẽ", "tẹ", "tế", "tề", "tể", "tễ", "tệ", "tí", "tì", "tỉ", "tĩ", "tị", "xá", "xà", "xả", "xã", "xạ", "xú", "xù", "xủ", "xũ", "xụ", "xớ", "xờ", "xở", "xỡ", "xợ", "xắ", "xằ", "xẳ", "xẵ", "xặ", "xấ", "xầ", "xẩ", "xẫ", "xậ", "xé", "xè", "xẻ", "xẽ", "xẹ", "xế", "xề", "xể", "xễ", "xệ", "xí", "xì", "xỉ", "xĩ", "xị", "cò", "cỏ", "cõ", "cọ", "cố", "cồ", "cổ", "cỗ", "cộ", "đó", "đò", "đỏ", "đõ", "đọ", "đố", "đồ", "đổ", "đỗ", "độ", "gó", "gò", "gỏ", "gõ", "gọ", "gố", "gồ", "gổ", "gỗ", "gộ", "kó", "kò", "kỏ", "kõ", "kọ", "kố", "kồ", "kổ", "kỗ", "kộ", "hó", "hò", "hỏ", "hõ", "họ", "hố", "hồ", "hổ", "hỗ", "hộ", "vó", "vò", "vỏ", "võ", "vọ", "vố", "vồ", "vổ", "vỗ", "vộ", "dó", "dò", "dỏ", "dõ", "dọ", "dố", "dồ", "dổ", "dỗ", "dộ", "mó", "mò", "mỏ", "mõ", "mọ", "mố", "mồ", "mổ", "mỗ", "mộ", "ró", "rò", "rỏ", "rõ", "rọ", "rố", "rồ", "rổ", "rỗ", "rộ", "só", "sò", "sỏ", "sõ", "sọ", "số", "sồ", "sổ", "sỗ", "sộ", "nó", "nò", "nỏ", "nõ", "nọ", "nố", "nồ", "nổ", "nỗ", "nộ", "bó", "bò", "bỏ", "bõ", "bọ", "bố", "bồ", "bổ", "bỗ", "bộ", "ló", "lò", "lỏ", "lõ", "lọ", "lố", "lồ", "lổ", "lỗ", "lộ", "ín", "ìn", "ỉn", "ĩn", "ịn", "íp", "ịp", "ít", "ịt", "iú", "iù", "iủ", "iũ", "iụ", "ó", "ò", "ỏ", "õ", "ọ", "oá", "oà", "oả", "oã", "oạ", "óc", "ọc", "oé", "oè", "oẻ", "oẽ", "oẹ", "ói", "òi", "ỏi", "õi", "ọi", "óm", "òm", "ỏm", "õm", "ọm", "ón", "òn", "ỏn", "õn", "ọn", "óp", "ọp", "ót", "ọt", "ố", "ồ", "ổ", "ỗ", "ộ", "ốc", "ộc", "ối", "ồi", "ổi", "ỗi", "ội", "ốp", "ộp", "ốt", "ột", "ới", "ời", "ởi", "ỡi", "ợi", "ớm", "ờm", "ởm", "ỡm", "ợm", "ớn", "ờn", "ởn", "ỡn", "ợn", "ớp", "ợp", "ớt", "ợt", "uá", "uà", "uả", "uã", "uạ", "úc", "ục", "uế", "uề", "uể", "uễ", "uệ", "úi", "ùi", "ủi", "ũi", "ụi", "pó", "pò", "pỏ", "põ", "pọ", "pố", "pồ", "pổ", "pỗ", "pộ", "tó", "tò", "tỏ", "tõ", "tọ", "tố", "tồ", "tổ", "tỗ", "tộ", "xó", "xò", "xỏ", "xõ", "xọ", "xố", "xồ", "xổ", "xỗ", "xộ", "cứ", "cừ", "cử", "cữ", "cự", "cý", "cỳ", "cỷ", "cỹ", "cỵ", "đứ", "đừ", "đử", "đữ", "đự", "đý", "đỳ", "đỷ", "đỹ", "đỵ", "gứ", "gừ", "gử", "gữ", "gự", "gý", "gỳ", "gỷ", "gỹ", "gỵ", "kứ", "kừ", "kử", "kữ", "kự", "ký", "kỳ", "kỷ", "kỹ", "kỵ", "hứ", "hừ", "hử", "hữ", "hự", "hý", "hỳ", "hỷ", "hỹ", "hỵ", "vứ", "vừ", "vử", "vữ", "vự", "vý", "vỳ", "vỷ", "vỹ", "vỵ", "dứ", "dừ", "dử", "dữ", "dự", "dý", "dỳ", "dỷ", "dỹ", "dỵ", "mứ", "mừ", "mử", "mữ", "mự", "mý", "mỳ", "mỷ", "mỹ", "mỵ", "rứ", "rừ", "rử", "rữ", "rự", "rý", "rỳ", "rỷ", "rỹ", "rỵ", "sứ", "sừ", "sử", "sữ", "sự", "sý", "sỳ", "sỷ", "sỹ", "sỵ", "nứ", "nừ", "nử", "nữ", "nự", "ný", "nỳ", "nỷ", "nỹ", "nỵ", "bứ", "bừ", "bử", "bữ", "bự", "bý", "bỳ", "bỷ", "bỹ", "bỵ", "lứ", "lừ", "lử", "lữ", "lự", "lý", "lỳ", "lỷ", "lỹ", "lỵ", "úm", "ùm", "ủm", "ũm", "ụm", "ún", "ùn", "ủn", "ũn", "ụn", "uó", "uò", "uỏ", "uõ", "uọ", "úp", "ụp", "uý", "uỳ", "uỷ", "uỹ", "uỵ", "ứ", "ừ", "ử", "ữ", "ự", "ưá", "ưà", "ưả", "ưã", "ưạ", "ứi", "ừi", "ửi", "ữi", "ựi", "ứm", "ừm", "ửm", "ữm", "ựm", "ứn", "ừn", "ửn", "ữn", "ựn", "ứt", "ựt", "ứu", "ừu", "ửu", "ữu", "ựu", "ý", "ỳ", "ỷ", "ỹ", "ỵ", "pứ", "pừ", "pử", "pữ", "pự", "pý", "pỳ", "pỷ", "pỹ", "pỵ", "tứ", "từ", "tử", "tữ", "tự", "tý", "tỳ", "tỷ", "tỹ", "tỵ", "xứ", "xừ", "xử", "xữ", "xự", "xý", "xỳ", "xỷ", "xỹ", "xỵ", "do", "go", "to", "in", "is", "it", "on", "he", "we", "me", "my", "by", "or", "of", "if", "as", "at", "so", "up", "us", "no", "an", "am", "be", "ok", "hi", "oh", "ah", "ha"
    )
}