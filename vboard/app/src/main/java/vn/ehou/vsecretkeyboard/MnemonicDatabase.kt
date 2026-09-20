package vn.ehou.vsecretkeyboard

data class MnemonicSample(val word: String, val code: String)

data class MnemonicItem(
    val category: String,
    val lower: Char,
    val upper: Char,
    val lowerIdx: Int,
    val upperIdx: Int,
    val lowerPhrase: String,
    val upperPhrase: String,
    val lowerRhymes: List<String>,
    val upperRhymes: List<String>,
    val samples: List<MnemonicSample>,
    val story: String
)

object MnemonicDatabase {

    val ITEMS: List<MnemonicItem> = listOf(
        // 1. B / b
        MnemonicItem(
            category = "alpha", lower = 'b', upper = 'B', lowerIdx = 15, upperIdx = 42,
            lowerPhrase = "bướm ➔ khoe ➔ tuy", upperPhrase = "đây ➔ thoát ➔ khuya",
            lowerRhymes = listOf("ươm", "oe", "uy"), upperRhymes = listOf("ây", "oat", "uya"),
            samples = listOf(MnemonicSample("bướm", "bbs"), MnemonicSample("khoe", "KbZ"), MnemonicSample("tuy", "tb0"), MnemonicSample("đây", "dBz"), MnemonicSample("thoát", "TBS"), MnemonicSample("khuya", "KB0")),
            story = "Bắt con bướm đẹp đem khoe, tuy vậy đến đây may mà thoát nạn lúc đêm khuya!"
        ),
        // 2. C / c
        MnemonicItem(
            category = "alpha", lower = 'c', upper = 'C', lowerIdx = 0, upperIdx = 11,
            lowerPhrase = "kết ➔ việc ➔ mua", upperPhrase = "tích ➔ hoa ➔ muốn",
            lowerRhymes = listOf("êt", "iêc", "ua"), upperRhymes = listOf("ich", "oa", "uôn"),
            samples = listOf(MnemonicSample("kết", "kcs"), MnemonicSample("việc", "vcJ"), MnemonicSample("mua", "mc0"), MnemonicSample("tích", "tCs"), MnemonicSample("hoa", "hCZ"), MnemonicSample("muốn", "mC1")),
            story = "Tổng kết công việc đi mua sắm, tích lũy thành tích tặng nhánh hoa tươi nếu thực lòng muốn!"
        ),
        // 3. D / d
        MnemonicItem(
            category = "alpha", lower = 'd', upper = 'D', lowerIdx = 1, upperIdx = 9,
            lowerPhrase = "cơ ➔ tiên ➔ xuất", upperPhrase = "tâm ➔ thịt ➔ thuốc",
            lowerRhymes = listOf("ơ", "iên", "uât"), upperRhymes = listOf("âm", "it", "uôc"),
            samples = listOf(MnemonicSample("cơ", "cdz"), MnemonicSample("tiên", "tdZ"), MnemonicSample("xuất", "xd1"), MnemonicSample("tâm", "tDz"), MnemonicSample("thịt", "TDJ"), MnemonicSample("thuốc", "TD1")),
            story = "Thời cơ nàng tiên giáng xuất, dốc hết con tâm nướng đĩa thịt thơm rồi châm điếu thuốc!"
        ),
        // 4. G / g
        MnemonicItem(
            category = "alpha", lower = 'g', upper = 'G', lowerIdx = 2, upperIdx = 3,
            lowerPhrase = "gạch ➔ nghiêng ➔ giục", upperPhrase = "gái ➔ hiệp ➔ thuê",
            lowerRhymes = listOf("ach", "iêng", "uc"), upperRhymes = listOf("ai", "iêp", "uê"),
            samples = listOf(MnemonicSample("gạch", "ggj"), MnemonicSample("nghiêng", "WgZ"), MnemonicSample("giục", "jg5"), MnemonicSample("gái", "gGs"), MnemonicSample("hiệp", "hGJ"), MnemonicSample("thuê", "TG0")),
            story = "Cầm viên gạch đứng nghiêng người hối giục, bắt gặp em gái vừa chơi xong một hiệp ở căn nhà thuê!"
        ),
        // 5. K / k
        MnemonicItem(
            category = "alpha", lower = 'k', upper = 'K', lowerIdx = 5, upperIdx = 6,
            lowerPhrase = "bạn ➔ chịu ➔ trùm", upperPhrase = "tháng ➔ tin ➔ bún",
            lowerRhymes = listOf("an", "iu", "um"), upperRhymes = listOf("ang", "in", "un"),
            samples = listOf(MnemonicSample("bạn", "bkj"), MnemonicSample("chịu", "CkJ"), MnemonicSample("trùm", "Rk2"), MnemonicSample("tháng", "TKs"), MnemonicSample("tin", "tKZ"), MnemonicSample("bún", "bK1")),
            story = "Người bạn khó chịu trùm mền kín mít, mấy tháng trời ngóng tin mời đi ăn bát bún!"
        ),
        // 6. H / h
        MnemonicItem(
            category = "alpha", lower = 'h', upper = 'H', lowerIdx = 7, upperIdx = 21,
            lowerPhrase = "hôn ➔ nhiều ➔ xuân", upperPhrase = "tập ➔ ngọt ➔ lý",
            lowerRhymes = listOf("ôn", "iêu", "uân"), upperRhymes = listOf("âp", "ot", "y"),
            samples = listOf(MnemonicSample("hôn", "hhz"), MnemonicSample("nhiều", "HhF"), MnemonicSample("xuân", "xh0"), MnemonicSample("tập", "tHj"), MnemonicSample("ngọt", "NHJ"), MnemonicSample("lý", "lH1")),
            story = "Trao nụ hôn thật nhiều đón ngày xuân, chăm chỉ luyện tập hưởng vị ngọt ngào đầy hợp lý!"
        ),
        // 7. V / v
        MnemonicItem(
            category = "alpha", lower = 'v', upper = 'V', lowerIdx = 8, upperIdx = 51,
            lowerPhrase = "chia ➔ kịp ➔ vùng", upperPhrase = "ếch ➔ hoắm ➔ quýt",
            lowerRhymes = listOf("ia", "ip", "ung"), upperRhymes = listOf("êch", "oăm", "yt"),
            samples = listOf(MnemonicSample("chia", "Cvz"), MnemonicSample("kịp", "kvJ"), MnemonicSample("vùng", "vv2"), MnemonicSample("ếch", "zVs"), MnemonicSample("hoắm", "hVS"), MnemonicSample("quýt", "qV1")),
            story = "Cùng san chia cho kịp tới vùng quê, bắt con ếch dưới hố sâu hoắm rồi hái chùm quýt!"
        ),
        // 8. M / m
        MnemonicItem(
            category = "alpha", lower = 'm', upper = 'M', lowerIdx = 10, upperIdx = 48,
            lowerPhrase = "hút ➔ chính ➔ tuổi", upperPhrase = "đẹp ➔ moóc ➔ khuỷu",
            lowerRhymes = listOf("ut", "inh", "uôi"), upperRhymes = listOf("ep", "ooc", "uyu"),
            samples = listOf(MnemonicSample("hút", "hms"), MnemonicSample("chính", "CmS"), MnemonicSample("tuổi", "tm3"), MnemonicSample("đẹp", "dMj"), MnemonicSample("moóc", "mMS"), MnemonicSample("khuỷu", "KM3")),
            story = "Hơi hút chân chính thời trai tuổi trẻ, khoác áo đẹp móc xe kéo moóc va vào cùi khuỷu tay!"
        ),
        // 9. R / r
        MnemonicItem(
            category = "alpha", lower = 'r', upper = 'R', lowerIdx = 12, upperIdx = 29,
            lowerPhrase = "rên ➔ ngoài ➔ xuống", upperPhrase = "một ➔ tốt ➔ cứu",
            lowerRhymes = listOf("ên", "oai", "uông"), upperRhymes = listOf("ă", "ôt", "ưu"),
            samples = listOf(MnemonicSample("rên", "rrz"), MnemonicSample("ngoài", "NrF"), MnemonicSample("xuống", "xr1"), MnemonicSample("một", "mRJ"), MnemonicSample("tốt", "tRS"), MnemonicSample("cứu", "cR1")),
            story = "Tiếng rên vọng ra ngoài rồi lắng xuống, làm một việc tốt để kịp thời cứu nguy nan!"
        ),
        // 10. S / s
        MnemonicItem(
            category = "alpha", lower = 's', upper = 'S', lowerIdx = 13, upperIdx = 18,
            lowerPhrase = "đường ➔ toàn ➔ suốt", upperPhrase = "các ➔ con ➔ quỳnh",
            lowerRhymes = listOf("ương", "oan", "uôt"), upperRhymes = listOf("ac", "on", "ynh"),
            samples = listOf(MnemonicSample("đường", "dsf"), MnemonicSample("toàn", "tsF"), MnemonicSample("suốt", "ss1"), MnemonicSample("các", "cSs"), MnemonicSample("con", "cSZ"), MnemonicSample("quỳnh", "qS2")),
            story = "Trên con đường an toàn đi suốt đêm, các bạn nhỏ dẫn con ngắm hoa quỳnh nở!"
        ),
        // 11. N / n
        MnemonicItem(
            category = "alpha", lower = 'n', upper = 'N', lowerIdx = 14, upperIdx = 20,
            lowerPhrase = "nhưng ➔ học ➔ giúp", upperPhrase = "thực ➔ góp ➔ ngửi",
            lowerRhymes = listOf("ưng", "oc", "up"), upperRhymes = listOf("ưc", "op", "ưi"),
            samples = listOf(MnemonicSample("nhưng", "Hnz"), MnemonicSample("học", "hnJ"), MnemonicSample("giúp", "jn1"), MnemonicSample("thực", "TNj"), MnemonicSample("góp", "gNS"), MnemonicSample("ngửi", "NN3")),
            story = "Khó khăn nhưng chăm học sẽ được giúp, biến ước mơ thành hiện thực đóng góp hương thơm cho đời ngửi!"
        ),
        // 12. L / l
        MnemonicItem(
            category = "alpha", lower = 'l', upper = 'L', lowerIdx = 16, upperIdx = 22,
            lowerPhrase = "điểm ➔ nói ➔ nguyên", upperPhrase = "lộn ➔ khoăn ➔ nhưn",
            lowerRhymes = listOf("iêm", "oi", "uyên"), upperRhymes = listOf("ôn", "oăn", "ưn"),
            samples = listOf(MnemonicSample("điểm", "dlr"), MnemonicSample("nói", "nlS"), MnemonicSample("nguyên", "Nl0"), MnemonicSample("lộn", "LLj"), MnemonicSample("khoăn", "KLZ"), MnemonicSample("nhưn", "HL0")),
            story = "Từng luận điểm được nói giữ nguyên giá trị, chớ để lẫn lộn băn khoăn những chuyện nhưn nhượng!"
        ),
        // 13. Q / q
        MnemonicItem(
            category = "alpha", lower = 'q', upper = 'Q', lowerIdx = 26, upperIdx = 17,
            lowerPhrase = "phát ➔ tôi ➔ cướp", upperPhrase = "phim ➔ nhóm ➔ tuyệt",
            lowerRhymes = listOf("at", "ôi", "ươp"), upperRhymes = listOf("im", "om", "uyêt"),
            samples = listOf(MnemonicSample("phát", "fqs"), MnemonicSample("tôi", "tqZ"), MnemonicSample("cướp", "cq1"), MnemonicSample("phim", "fQz"), MnemonicSample("nhóm", "HQS"), MnemonicSample("tuyệt", "tQ5")),
            story = "Vừa bộc phát lời tôi bị kẻ gian cướp lời, xem bộ phim cùng cả nhóm thật là tuyệt vời!"
        ),
        // 14. Z / z
        MnemonicItem(
            category = "alpha", lower = 'z', upper = 'Z', lowerIdx = 19, upperIdx = 54,
            lowerPhrase = "hôm ➔ trong ➔ chưa", upperPhrase = "bếp ➔ xẻng ➔ qun",
            lowerRhymes = listOf("ôm", "ong", "ưa"), upperRhymes = listOf("êp", "eng", "n"),
            samples = listOf(MnemonicSample("hôm", "hzz"), MnemonicSample("trong", "RzZ"), MnemonicSample("chưa", "Cz0"), MnemonicSample("bếp", "bZs"), MnemonicSample("xẻng", "xZR"), MnemonicSample("qun", "qZ0")),
            story = "Mới hôm nào ở trong nhà mà chưa nấu nướng, nay đỏ lửa góc bếp cầm chiếc xẻng xúc đống than qun!"
        ),
        // 15. Y / y
        MnemonicItem(
            category = "alpha", lower = 'y', upper = 'Y', lowerIdx = 53, upperIdx = 45,
            lowerPhrase = "lệnh ➔ giê ➔ đắk", upperPhrase = "em ➔ oem ➔ huynh",
            lowerRhymes = listOf("ênh", "iê", "ăk"), upperRhymes = listOf("em", "oem", "uynh"),
            samples = listOf(MnemonicSample("lệnh", "lyj"), MnemonicSample("giê", "jyZ"), MnemonicSample("đắk", "dy1"), MnemonicSample("em", "zYz"), MnemonicSample("oem", "zYZ"), MnemonicSample("huynh", "hY0")),
            story = "Nhận mệnh lệnh chạy máy giê thóc tại vùng Đắk Lắk, gửi em nụ cười hoem oem cùng người huynh đài!"
        ),
        // 16. W / w
        MnemonicItem(
            category = "alpha", lower = 'w', upper = 'W', lowerIdx = 59, upperIdx = 23,
            lowerPhrase = "qu ➔ qu ➔ qu", upperPhrase = "thành ➔ hoằng ➔ nước",
            lowerRhymes = listOf("", "", ""), upperRhymes = listOf("anh", "oăng", "ươc"),
            samples = listOf(MnemonicSample("qu", "qwz"), MnemonicSample("qu", "qwz"), MnemonicSample("qu", "qwz"), MnemonicSample("thành", "TWf"), MnemonicSample("hoằng", "hWF"), MnemonicSample("nước", "nW1")),
            story = "Gõ chữ qu tốc ký liền tay, lập chiến công thành công vang dội sáng hoằng soi dòng sông nước!"
        ),
        // 17. P / p
        MnemonicItem(
            category = "alpha", lower = 'p', upper = 'P', lowerIdx = 24, upperIdx = 49,
            lowerPhrase = "báo ➔ cơm ➔ người", upperPhrase = "nét ➔ xoong ➔ quyn",
            lowerRhymes = listOf("ao", "ơm", "ươi"), upperRhymes = listOf("et", "oong", "yn"),
            samples = listOf(MnemonicSample("báo", "bps"), MnemonicSample("cơm", "cpZ"), MnemonicSample("người", "Np2"), MnemonicSample("nét", "nPs"), MnemonicSample("xoong", "xPZ"), MnemonicSample("quyn", "qP0")),
            story = "Xem tờ báo ăn bữa cơm cùng mọi người, từng đường nét trên chiếc xoong bóng loáng như thẻ quyn bài!"
        ),
        // 18. F / f
        MnemonicItem(
            category = "alpha", lower = 'f', upper = 'F', lowerIdx = 25, upperIdx = 44,
            lowerPhrase = "pháp ➔ quốc ➔ vườn", upperPhrase = "séc ➔ ngoèo ➔ buyn",
            lowerRhymes = listOf("ap", "ôc", "ươn"), upperRhymes = listOf("ec", "oeo", "uyn"),
            samples = listOf(MnemonicSample("pháp", "ffs"), MnemonicSample("quốc", "qfS"), MnemonicSample("vườn", "vf2"), MnemonicSample("séc", "sFs"), MnemonicSample("ngoèo", "NFF"), MnemonicSample("buyn", "bF0")),
            story = "Hiến pháp của đất quốc gia giữ xanh mảnh vườn, ký tấm ngân séc đi đường ngoằn ngoèo đón xe buyn!"
        ),
        // 19. T / t
        MnemonicItem(
            category = "alpha", lower = 't', upper = 'T', lowerIdx = 27, upperIdx = 28,
            lowerPhrase = "sau ➔ công ➔ vượt", upperPhrase = "ngày ➔ hộp ➔ dứt",
            lowerRhymes = listOf("au", "ông", "ươt"), upperRhymes = listOf("ay", "ôp", "ưt"),
            samples = listOf(MnemonicSample("sau", "stz"), MnemonicSample("công", "ctZ"), MnemonicSample("vượt", "vt5"), MnemonicSample("ngày", "NTf"), MnemonicSample("hộp", "hTJ"), MnemonicSample("dứt", "DT1")),
            story = "Đứng phía sau lập chiến công vượt vượt mọi thử thách, qua bao ngày mở chiếc hộp quà chấm dứt chuỗi ngày chờ!"
        ),
        // 20. X / x
        MnemonicItem(
            category = "alpha", lower = 'x', upper = 'X', lowerIdx = 30, upperIdx = 52,
            lowerPhrase = "bắc ➔ với ➔ ngừm", upperPhrase = "đêm ➔ thoắt ➔ yểng",
            lowerRhymes = listOf("ăc", "ơi", "ưm"), upperRhymes = listOf("êm", "oăt", "yêng"),
            samples = listOf(MnemonicSample("bắc", "bxs"), MnemonicSample("với", "vxS"), MnemonicSample("ngừm", "Nx2"), MnemonicSample("đêm", "dXz"), MnemonicSample("thoắt", "TXS"), MnemonicSample("yểng", "zX3")),
            story = "Từ miền bắc vào chung sống với nhau đừng ngập ngừm, suốt đêm thoăn thoắt dạy chim yểng hót!"
        ),
        // 21. J / j
        MnemonicItem(
            category = "alpha", lower = 'j', upper = 'J', lowerIdx = 4, upperIdx = 47,
            lowerPhrase = "làm ➔ việt ➔ vui", upperPhrase = "kẹo ➔ loét ➔ buýt",
            lowerRhymes = listOf("am", "iêt", "ui"), upperRhymes = listOf("eo", "oet", "uyt"),
            samples = listOf(MnemonicSample("làm", "ljf"), MnemonicSample("việt", "vjJ"), MnemonicSample("vui", "vj0"), MnemonicSample("kẹo", "kJj"), MnemonicSample("loét", "lJS"), MnemonicSample("buýt", "bJ1")),
            story = "Chăm chỉ làm việc người Việt luôn rạng rỡ vui tươi, chia nhau thanh kẹo cười toét loét đón chuyến xe buýt!"
        ),
        // 22. A / a
        MnemonicItem(
            category = "alpha", lower = 'a', upper = 'A', lowerIdx = 55, upperIdx = 41,
            lowerPhrase = "ba ➔ ca ➔ nhà", upperPhrase = "oạp ➔ tuềnh ➔ huênh",
            lowerRhymes = listOf("a", "", ""), upperRhymes = listOf("â", "oap", "uênh"),
            samples = listOf(MnemonicSample("ba", "baz"), MnemonicSample("ca", "caz"), MnemonicSample("nhà", "Haf"), MnemonicSample("oạp", "zAJ"), MnemonicSample("tuềnh", "tA2"), MnemonicSample("huênh", "hA0")),
            story = "Người ba hát khúc tình ca trước mái nhà, tiếng sóng vỗ oam oạp giữa căn phòng tuềnh toàng không chút huênh hoang!"
        ),
        // 23. E / e
        MnemonicItem(
            category = "alpha", lower = 'e', upper = 'E', lowerIdx = 56, upperIdx = 43,
            lowerPhrase = "xe ➔ mẹ ➔ bé", upperPhrase = "mê ➔ ngoáy ➔ huých",
            lowerRhymes = listOf("e", "", ""), upperRhymes = listOf("ê", "oay", "uych"),
            samples = listOf(MnemonicSample("xe", "xez"), MnemonicSample("mẹ", "mej"), MnemonicSample("bé", "bes"), MnemonicSample("mê", "mEz"), MnemonicSample("ngoáy", "NES"), MnemonicSample("huých", "hE1")),
            story = "Lên chiếc xe cùng mẹ bế em bé, niềm say mê ngoắt ngoáy đuôi rồi tinh nghịch huých vai!"
        ),
        // 24. U / u
        MnemonicItem(
            category = "alpha", lower = 'u', upper = 'U', lowerIdx = 58, upperIdx = 50,
            lowerPhrase = "thu ➔ ru ➔ đu", upperPhrase = "nêu ➔ ngoặc ➔ như",
            lowerRhymes = listOf("u", "", ""), upperRhymes = listOf("êu", "oăc", "ư"),
            samples = listOf(MnemonicSample("thu", "Tuz"), MnemonicSample("ru", "ruz"), MnemonicSample("đu", "duz"), MnemonicSample("nêu", "nUz"), MnemonicSample("ngoặc", "NUJ"), MnemonicSample("như", "HU0")),
            story = "Gió mùa thu lời ru ru êm đềm võng đu đưa, tấm gương được nêu trong dấu ngoặc sáng trong như ngọc!"
        ),
        // 25. i / o
        MnemonicItem(
            category = "special", lower = 'o', upper = 'i', lowerIdx = 46, upperIdx = 57,
            lowerPhrase = "đen ➔ cho ➔ tuýp", upperPhrase = "đi ➔ chì ➔ khi",
            lowerRhymes = listOf("en", "o", "uyp"), upperRhymes = listOf("i", "", ""),
            samples = listOf(MnemonicSample("đen", "doz"), MnemonicSample("cho", "CoZ"), MnemonicSample("tuýp", "to1"), MnemonicSample("đi", "diz"), MnemonicSample("chì", "Cif"), MnemonicSample("khi", "Kiz")),
            story = "Vệt mực đen tặng cho em cả tuýp màu, cùng nhau bước đi cầm bút chì mỗi khi vẽ tranh!"
        ),
        // 26. 1 / 0
        MnemonicItem(
            category = "number", lower = '0', upper = '1', lowerIdx = 31, upperIdx = 32,
            lowerPhrase = "năm ➔ cô ➔ yếm", upperPhrase = "ăn ➔ hơn ➔ yên",
            lowerRhymes = listOf("ăm", "ô", "yêm"), upperRhymes = listOf("ăn", "ơn", "yên"),
            samples = listOf(MnemonicSample("năm", "n0z"), MnemonicSample("cô", "c0Z"), MnemonicSample("yếm", "z01"), MnemonicSample("ăn", "z1z"), MnemonicSample("hơn", "h1Z"), MnemonicSample("yên", "z10")),
            story = "Trải qua bao năm tháng cô gái mặc áo yếm, chăm lo việc ăn uống sống hơn người trong bình yên!"
        ),
        // 27. 3 / 2
        MnemonicItem(
            category = "number", lower = '2', upper = '3', lowerIdx = 33, upperIdx = 34,
            lowerPhrase = "tăng ➔ hợp ➔ quyết", upperPhrase = "gặp ➔ bớt ➔ yêu",
            lowerRhymes = listOf("ăng", "ơp", "yêt"), upperRhymes = listOf("ăp", "ơt", "yêu"),
            samples = listOf(MnemonicSample("tăng", "t2z"), MnemonicSample("hợp", "h2J"), MnemonicSample("quyết", "q21"), MnemonicSample("gặp", "g3j"), MnemonicSample("bớt", "b3S"), MnemonicSample("yêu", "z30")),
            story = "Năng suất gia tăng kết hợp lòng kiên quyết, lúc hội gặp hãy bớt lo âu để trọn vẹn tình yêu!"
        ),
        // 28. 5 / 4
        MnemonicItem(
            category = "number", lower = '4', upper = '5', lowerIdx = 35, upperIdx = 36,
            lowerPhrase = "mặt ➔ hoen ➔ rượu", upperPhrase = "cầu ➔ khoác ➔ buồm",
            lowerRhymes = listOf("ăt", "oen", "ươu"), upperRhymes = listOf("âu", "oac", "uôm"),
            samples = listOf(MnemonicSample("mặt", "m4j"), MnemonicSample("hoen", "h4Z"), MnemonicSample("rượu", "r45"), MnemonicSample("cầu", "c5f"), MnemonicSample("khoác", "K5S"), MnemonicSample("buồm", "b52")),
            story = "Nước mắt ướt mặt làm hoen chén ly rượu, bước qua chiếc cầu vai khoác túi giong cánh buồm ra khơi!"
        ),
        // 29. 7 / 6
        MnemonicItem(
            category = "number", lower = '6', upper = '7', lowerIdx = 37, upperIdx = 38,
            lowerPhrase = "giấc ➔ hoạch ➔ thuở", upperPhrase = "nhân ➔ ngoạm ➔ khuâng",
            lowerRhymes = listOf("âc", "oach", "uơ"), upperRhymes = listOf("ân", "oam", "uâng"),
            samples = listOf(MnemonicSample("giấc", "j6s"), MnemonicSample("hoạch", "h6J"), MnemonicSample("thuở", "T63"), MnemonicSample("nhân", "H7z"), MnemonicSample("ngoạm", "N7J"), MnemonicSample("khuâng", "K70")),
            story = "Tỉnh cơn mê giấc hoàn thành kế hoạch nhớ thuở xưa, bao lớp tiền nhân há miệng ngoạm mồi lòng bâng khuâng!"
        ),
        // 30. 9 / 8
        MnemonicItem(
            category = "number", lower = '8', upper = '9', lowerIdx = 39, upperIdx = 40,
            lowerPhrase = "tầng ➔ khoảng ➔ khuấy", upperPhrase = "đất ➔ doanh ➔ khuếch",
            lowerRhymes = listOf("âng", "oang", "uây"), upperRhymes = listOf("ât", "oanh", "uêch"),
            samples = listOf(MnemonicSample("tầng", "t8f"), MnemonicSample("khoảng", "K8R"), MnemonicSample("khuấy", "K81"), MnemonicSample("đất", "d9s"), MnemonicSample("doanh", "D9Z"), MnemonicSample("khuếch", "K91")),
            story = "Lên trên các tầng đo khoảng cách tay khuấy trà, trên mảnh đất kinh doanh ngày càng khuếch trương phát đạt!"
        )
    )

    private val map: Map<Char, MnemonicItem> by lazy {
        val m = mutableMapOf<Char, MnemonicItem>()
        for (item in ITEMS) {
            m[item.lower] = item
            m[item.upper] = item
        }
        m
    }

    fun get(ch: Char): MnemonicItem? = map[ch]

    // Trích xuất thông tin tóm tắt cho 1 ký tự cụ thể (hỗ trợ cả thường và hoa)
    fun getSummary(ch: Char): Pair<String, String>? {
        val item = map[ch] ?: return null
        val isUpper = (ch == item.upper)
        val phrase = if (isUpper) item.upperPhrase else item.lowerPhrase
        val rhymes = if (isUpper) item.upperRhymes else item.lowerRhymes
        val rStr = rhymes.filter { it.isNotEmpty() }.joinToString(" • ")
        val samples = if (isUpper) item.samples.takeLast(3) else item.samples.take(3)
        val sStr = samples.joinToString(" • ") { "${it.word}[${it.code}]" }
        return Pair("Phím [$ch]: $phrase ($rStr)", sStr)
    }

    // Thông tin tóm tắt tinh gọn cho thanh Guide HUD (2 hàng đối ứng thường/HOA, gộp Base60)
    fun getCompactHudSummary(ch: Char): Pair<String, String>? {
        val item = map[ch] ?: return null
        val lowerSamples = item.samples.take(3).joinToString(", ") { "${it.word}-${it.code}" }
        val upperSamples = item.samples.takeLast(3).joinToString(", ") { "${it.word}-${it.code}" }

        val line1 = "<font color='#58A6FF'><b>${item.lower}:</b></font> $lowerSamples"
        val line2 = "<font color='#FFA657'><b>${item.upper}:</b></font> $upperSamples"
        return Pair(line1, line2)
    }

    // Lấy phụ âm tương ứng cho ký tự Base60
    fun getConsonant(ch: Char): String {
        return when (ch) {
            'c' -> "c"
            'C' -> "ch"
            'd' -> "đ"
            'D' -> "d"
            'g' -> "g"
            'G' -> "gh"
            'k' -> "k"
            'K' -> "kh"
            'h' -> "h"
            'H' -> "nh"
            'v', 'V' -> "v"
            'm', 'M' -> "m"
            'r' -> "r"
            'R' -> "tr"
            's', 'S' -> "s"
            'n' -> "n"
            'N' -> "ng"
            'b', 'B' -> "b"
            'l', 'L' -> "l"
            'q' -> "qu"
            'Q' -> "ch"
            'p', 'P' -> "p"
            'f', 'F' -> "ph"
            't' -> "t"
            'T' -> "th"
            'x', 'X' -> "x"
            'j', 'J' -> "gi"
            'w', 'W' -> "ngh"
            'z', 'Z' -> "∅"
            'a', 'A', 'e', 'E', 'u', 'U', 'o', 'i', 'y', 'Y' -> "•"
            '0' -> "0"
            '1' -> "1"
            '2' -> "2"
            '3' -> "3"
            '4' -> "4"
            '5' -> "5"
            '6' -> "6"
            '7' -> "7"
            '8' -> "8"
            '9' -> "9"
            else -> ""
        }
    }

    // Lấy thông tin dấu thanh (chỉ trả về dấu thật sự, bỏ hoàn toàn các mã #idx)
    fun getTone(ch: Char): String {
        return when (ch) {
            'z', 'Z', '0' -> "ngang"
            's', 'S', '1' -> "sắc"
            'f', 'F', '2' -> "huyền"
            'r', 'R', '3' -> "hỏi"
            'x', 'X', '4' -> "ngã"
            'j', 'J', '5' -> "nặng"
            else -> ""
        }
    }

    // Nhãn phụ âm thông minh: Hiện luôn cặp HOA: Phụ âm kép (khỏi cần bấm Shift)
    // Các phím số hoặc chữ cái đơn giản thì để rỗng để tránh lặp 1-1, 0-0
    fun getSmartConsonantLabel(ch: Char): String {
        return when (ch) {
            'q' -> "Q: ch"
            't' -> "T: th"
            'k' -> "K: kh"
            'g' -> "G: gh"
            'c' -> "C: ch"
            'h' -> "H: nh"
            'n' -> "N: ng"
            'r' -> "R: tr"
            'd' -> "D: d"
            'w' -> "W: ngh"
            'f' -> "F: ph"
            'j' -> "J: gi"
            // Khi bấm Shift (nhánh HOA):
            'Q', 'C' -> "ch"
            'T' -> "th"
            'K' -> "kh"
            'G' -> "gh"
            'H' -> "nh"
            'N' -> "ng"
            'R' -> "tr"
            'D' -> "d"
            'W' -> "ngh"
            'F' -> "ph"
            'J' -> "gi"
            else -> ""
        }
    }

    // Highlight các từ khóa thần chú trong câu chuyện (viết hoa và đổi màu nổi bật)
    fun getHighlightedStory(item: MnemonicItem): String {
        val keywords = mutableListOf<String>()
        item.lowerPhrase.split("➔").forEach {
            val w = it.trim()
            if (w.isNotEmpty()) keywords.add(w)
        }
        item.upperPhrase.split("➔").forEach {
            val w = it.trim()
            if (w.isNotEmpty()) keywords.add(w)
        }

        var result = item.story
        keywords.sortByDescending { it.length }

        for (kw in keywords) {
            val pattern = Regex("(?i)${Regex.escape(kw)}")
            result = result.replace(pattern) { match ->
                "<font color='#FFA657'><b>${match.value.uppercase()}</b></font>"
            }
        }
        return result
    }
}
