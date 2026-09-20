// mnemonic.js - Toàn bộ 60 Ký Tự Base60 (30 Cặp Hàng Hoàn Chỉnh)

export const MNEMONIC_DATA = [
  // ==================== CHỮ CÁI (24 CẶP) ====================
  {
    category: 'alpha',
    lower: 'b',
    upper: 'B',
    lowerIdx: 15,
    upperIdx: 42,
    lowerPhrase: 'bướm ➔ tòe ➔ nguy',
    upperPhrase: 'cây ➔ toát ➔ khuya',
    lowerRhymes: ['ươm', 'oe', 'uy'],
    upperRhymes: ['ây', 'oat', 'uya'],
    samples: [
      { word: 'bướm', code: 'bbs' },
      { word: 'tòe', code: 'tbF' },
      { word: 'nguy', code: 'Nb0' },
      { word: 'cây', code: 'cBz' },
      { word: 'toát', code: 'tBS' },
      { word: 'khuya', code: 'KB0' }
    ],
    story: 'Bắt con <em>bướm</em>, nghịch mở <em>toè loe</em>, gặp <em>nguy</em> hiểm liền trèo tót lên <em>cây</em>, sợ <em>toát</em> mồ hôi tới tận đêm <em>khuya</em>!'
  },
  {
    category: 'alpha',
    lower: 'c',
    upper: 'C',
    lowerIdx: 0,
    upperIdx: 11,
    lowerPhrase: 'ca ➔ tiếc ➔ cua',
    upperPhrase: 'chịch ➔ hoa ➔ muốn',
    lowerRhymes: ['a', 'iêc', 'ua'],
    upperRhymes: ['ich', 'oa', 'uôn'],
    samples: [
      { word: 'ca', code: 'caz' },
      { word: 'tiếc', code: 'tcS' },
      { word: 'cua', code: 'cc0' },
      { word: 'chịch', code: 'CCj' },
      { word: 'hoa', code: 'hCZ' },
      { word: 'muốn', code: 'mC1' }
    ],
    story: 'Đang ngồi hát <em>ca</em>, làm rơi mất đĩa <em>tiếc</em> con <em>cua</em> hoàng đế, bực mình đè <em>chịch</em> cô bé tên <em>Hoa</em> nếu thực sự <em>muốn</em>!'
  },
  {
    category: 'alpha',
    lower: 'd',
    upper: 'D',
    lowerIdx: 1,
    upperIdx: 9,
    lowerPhrase: 'các ➔ tiên ➔ xuất',
    upperPhrase: 'dâm ➔ khít ➔ thuốc',
    lowerRhymes: ['ac', 'iên', 'uât'],
    upperRhymes: ['âm', 'it', 'uôc'],
    samples: [
      { word: 'các', code: 'cSs' },
      { word: 'tiên', code: 'tdZ' },
      { word: 'xuất', code: 'xd1' },
      { word: 'dâm', code: 'DDz' },
      { word: 'khít', code: 'KDS' },
      { word: 'thuốc', code: 'TD1' }
    ],
    story: '<em>Các</em> nàng <em>tiên</em> nữ giáng <em>xuất</em>, khơi dậy thú tính <em>dâm</em> cuồng nhiệt, ôm kẹp <em>khít</em> khao như ngậm điếu <em>thuốc</em>!'
  },
  {
    category: 'alpha',
    lower: 'g',
    upper: 'G',
    lowerIdx: 2,
    upperIdx: 3,
    lowerPhrase: 'gạch ➔ nghiêng ➔ giục',
    upperPhrase: 'gái ➔ hiệp ➔ quê',
    lowerRhymes: ['ach', 'iêng', 'uc'],
    upperRhymes: ['ai', 'iêp', 'uê'],
    samples: [
      { word: 'gạch', code: 'ggj' },
      { word: 'nghiêng', code: 'WgZ' },
      { word: 'giục', code: 'jg5' },
      { word: 'gái', code: 'gGs' },
      { word: 'hiệp', code: 'hGJ' },
      { word: 'quê', code: 'qEz' }
    ],
    story: 'Cầm viên <em>gạch</em> đứng <em>nghiêng</em> người hối <em>giục</em>, bắt gặp em <em>gái</em> vừa chơi xong một <em>hiệp</em> đòi về <em>quê</em>!'
  },
  {
    category: 'alpha',
    lower: 'k',
    upper: 'K',
    lowerIdx: 5,
    upperIdx: 6,
    lowerPhrase: 'cán ➔ chín ➔ chun',
    upperPhrase: 'càng ➔ khiếu ➔ khuân',
    lowerRhymes: ['an', 'in', 'un'],
    upperRhymes: ['ang', 'iêu', 'uân'],
    samples: [
      { word: 'cán', code: 'cks' },
      { word: 'chín', code: 'CKS' },
      { word: 'chun', code: 'CK0' },
      { word: 'càng', code: 'cKf' },
      { word: 'khiếu', code: 'KhS' },
      { word: 'khuân', code: 'Kh0' }
    ],
    story: 'Vác cái <em>cán</em> đập quả <em>chín</em>, quần tụt giãn <em>chun</em>, <em>càng</em> khoe năng <em>khiếu</em> hì hục <em>khuân</em> đồ!'
  },
  {
    category: 'alpha',
    lower: 'h',
    upper: 'H',
    lowerIdx: 7,
    upperIdx: 45,
    lowerPhrase: 'hôn ➔ chiều ➔ xuân',
    upperPhrase: 'hét ➔ hoem ➔ huynh',
    lowerRhymes: ['ôn', 'iêu', 'uân'],
    upperRhymes: ['et', 'oem', 'uynh'],
    samples: [
      { word: 'hôn', code: 'hhz' },
      { word: 'chiều', code: 'ChF' },
      { word: 'xuân', code: 'xh0' },
      { word: 'hét', code: 'hPs' },
      { word: 'hoem', code: 'hYZ' },
      { word: 'huynh', code: 'hY0' }
    ],
    story: 'Sáng sớm ôm <em>hôn</em>, đến buổi <em>chiều</em> đón gió <em>xuân</em>, bất ngờ <em>hét</em> toang mồm, cười <em>hoem</em> hoét chọc tức <em>huynh</em> đài!'
  },
  {
    category: 'alpha',
    lower: 'v',
    upper: 'V',
    lowerIdx: 8,
    upperIdx: 51,
    lowerPhrase: 'vú ➔ viết ➔ vui',
    upperPhrase: 'vếch ➔ giê ➔ buyn',
    lowerRhymes: ['u', 'iêt', 'ui'],
    upperRhymes: ['êch', 'iê', 'yn'],
    samples: [
      { word: 'vú', code: 'vus' },
      { word: 'viết', code: 'vjS' },
      { word: 'vui', code: 'vj0' },
      { word: 'vếch', code: 'vVs' },
      { word: 'giê', code: 'jyZ' },
      { word: 'buyn', code: 'bF0' }
    ],
    story: 'Sờ đôi <em>vú</em> vừa <em>viết</em> thư tình rất <em>vui</em>, mặt vênh <em>vếch</em> chạy máy <em>giê</em> thóc kêu ầm như xe <em>buyn</em>!'
  },
  {
    category: 'alpha',
    lower: 'm',
    upper: 'M',
    lowerIdx: 10,
    upperIdx: 48,
    lowerPhrase: 'mút ➔ dịu ➔ trùm',
    upperPhrase: 'mèo ➔ khoét ➔ huýt',
    lowerRhymes: ['ut', 'iu', 'um'],
    upperRhymes: ['eo', 'oet', 'uyt'],
    samples: [
      { word: 'mút', code: 'mms' },
      { word: 'dịu', code: 'DkJ' },
      { word: 'trùm', code: 'Rk2' },
      { word: 'mèo', code: 'mJf' },
      { word: 'khoét', code: 'KJS' },
      { word: 'huýt', code: 'hJ1' }
    ],
    story: 'Nằng nặc đòi <em>mút</em> cho êm <em>dịu</em>, rồi <em>trùm</em> mền cuộn tròn như con <em>mèo</em>, cào <em>khoét</em> vách cửa rồi <em>huýt</em> sáo!'
  },
  {
    category: 'alpha',
    lower: 'r',
    upper: 'R',
    lowerIdx: 12,
    upperIdx: 29,
    lowerPhrase: 'rên ➔ kịp ➔ đuôi',
    upperPhrase: 'răn ➔ toang ➔ rượu',
    lowerRhymes: ['ên', 'ip', 'uôi'],
    upperRhymes: ['ă', 'oang', 'ươu'],
    samples: [
      { word: 'rên', code: 'rrz' },
      { word: 'kịp', code: 'kvJ' },
      { word: 'đuôi', code: 'dm0' },
      { word: 'răn', code: 'r1z' },
      { word: 'toang', code: 't8Z' },
      { word: 'rượu', code: 'r45' }
    ],
    story: 'Vừa <em>rên</em> không <em>kịp</em> thở, túm chặt lấy cái <em>đuôi</em>, mở miệng <em>răn</em> đe kẻo làm <em>toang</em> bình <em>rượu</em> quý!'
  },
  {
    category: 'alpha',
    lower: 's',
    upper: 'S',
    lowerIdx: 13,
    upperIdx: 18,
    lowerPhrase: 'sướng ➔ nước ➔ lướt',
    upperPhrase: 'sờ ➔ bớt ➔ đứt',
    lowerRhymes: ['ương', 'ươc', 'ươt'],
    upperRhymes: ['ơ', 'ơt', 'ưt'],
    samples: [
      { word: 'sướng', code: 'sss' },
      { word: 'nước', code: 'nW1' },
      { word: 'lướt', code: 'lt1' },
      { word: 'sờ', code: 'sdf' },
      { word: 'bớt', code: 'b3S' },
      { word: 'đứt', code: 'dT1' }
    ],
    story: 'Đang <em>sướng</em> rên rỉ thì ra <em>nước</em>, vội <em>lướt</em> tay thò vào <em>sờ</em>, nàng bảo <em>bớt</em> lại kẻo <em>đứt</em> gân!'
  },
  {
    category: 'alpha',
    lower: 'n',
    upper: 'N',
    lowerIdx: 14,
    upperIdx: 20,
    lowerPhrase: 'nứng ➔ tươi ➔ vượn',
    upperPhrase: 'ngực ➔ cho ➔ ngửi',
    lowerRhymes: ['ưng', 'ươi', 'ươn'],
    upperRhymes: ['ưc', 'o', 'ưi'],
    samples: [
      { word: 'nứng', code: 'nns' },
      { word: 'tươi', code: 'tp0' },
      { word: 'vượn', code: 'vf5' },
      { word: 'ngực', code: 'NNj' },
      { word: 'cho', code: 'CoZ' },
      { word: 'ngửi', code: 'NN3' }
    ],
    story: 'Nổi cơn <em>nứng</em> phơi phới <em>tươi</em> tỉnh như loài <em>vượn</em>, phanh bờ <em>ngực</em> ra <em>cho</em> người tình ghé vào <em>ngửi</em>!'
  },
  {
    category: 'alpha',
    lower: 'l',
    upper: 'L',
    lowerIdx: 16,
    upperIdx: 22,
    lowerPhrase: 'liếm ➔ đòi ➔ trúng',
    upperPhrase: 'lồn ➔ hoẵng ➔ bự',
    lowerRhymes: ['iêm', 'oi', 'ung'],
    upperRhymes: ['ôn', 'oăng', 'ư'],
    samples: [
      { word: 'liếm', code: 'lls' },
      { word: 'đòi', code: 'dlF' },
      { word: 'trúng', code: 'Rv1' },
      { word: 'lồn', code: 'LLf' },
      { word: 'hoẵng', code: 'hWX' },
      { word: 'bự', code: 'bU5' }
    ],
    story: 'Cúi xuống <em>liếm</em> láp, nàng liền <em>đòi</em> phải đâm trúng cái <em>lồn</em> chạy nhảy như con <em>hoẵng</em> to <em>bự</em>!'
  },
  {
    category: 'alpha',
    lower: 'q',
    upper: 'Q',
    lowerIdx: 26,
    upperIdx: 17,
    lowerPhrase: 'cát ➔ côi ➔ cướp',
    upperPhrase: 'chim ➔ còm ➔ tuyệt',
    lowerRhymes: ['at', 'ôi', 'ươp'],
    upperRhymes: ['im', 'om', 'uyêt'],
    samples: [
      { word: 'cát', code: 'cqs' },
      { word: 'côi', code: 'cqZ' },
      { word: 'cướp', code: 'cq1' },
      { word: 'chim', code: 'QQz' },
      { word: 'còm', code: 'cQF' },
      { word: 'tuyệt', code: 'tQ5' }
    ],
    story: 'Bãi <em>cát</em> mồ <em>côi</em> bị bọn cướp giật, vỗ đầu con <em>chim</em> gầy <em>còm</em> khen đẹp <em>tuyệt</em>!'
  },
  {
    category: 'alpha',
    lower: 'z',
    upper: 'Z',
    lowerIdx: 19,
    upperIdx: 54,
    lowerPhrase: 'ôm ➔ lo ➔ ừa',
    upperPhrase: 'bếp ➔ xẻng ➔ cằn',
    lowerRhymes: ['ôm', 'o', 'ưa'],
    upperRhymes: ['êp', 'eng', 'n'],
    samples: [
      { word: 'ôm', code: 'zzz' },
      { word: 'lo', code: 'loZ' },
      { word: 'ừa', code: 'zz2' },
      { word: 'bếp', code: 'bZs' },
      { word: 'xẻng', code: 'xZR' },
      { word: 'cằn', code: 'c1f' }
    ],
    story: 'Siết chặt vòng <em>ôm</em> đừng <em>lo</em> hãy <em>ừa</em> một tiếng, vào <em>bếp</em> cầm cái <em>xẻng</em> xúc mảnh đất cằn cỗi!'
  },
  {
    category: 'alpha',
    lower: 'y',
    upper: 'Y',
    lowerIdx: 21,
    upperIdx: 53,
    lowerPhrase: 'nhấp ➔ xót ➔ chụm',
    upperPhrase: 'lệnh ➔ giê ➔ giặc',
    lowerRhymes: ['âp', 'ot', 'ưm'],
    upperRhymes: ['ênh', 'iê', 'ăk'],
    samples: [
      { word: 'nhấp', code: 'HHs' },
      { word: 'xót', code: 'xHS' },
      { word: 'chụm', code: 'Ck5' },
      { word: 'lệnh', code: 'lyj' },
      { word: 'giê', code: 'jyZ' },
      { word: 'giặc', code: 'jxj' }
    ],
    story: 'Liên tục dập <em>nhấp</em> đau <em>xót</em> tụm <em>chụm</em> vào nhau, ban bố khẩu <em>lệnh</em> máy <em>giê</em> quét sạch quân <em>giặc</em>!'
  },
  {
    category: 'alpha',
    lower: 'w',
    upper: 'W',
    lowerIdx: 59,
    upperIdx: 23,
    lowerPhrase: 'gốc ➔ trống ➔ rỗng',
    upperPhrase: 'thành ➔ xoăng ➔ được',
    lowerRhymes: ['', '', ''],
    upperRhymes: ['anh', 'oăng', 'ươc'],
    samples: [
      { word: 'thành', code: 'TWf' },
      { word: 'xoăng', code: 'xWZ' },
      { word: 'được', code: 'dW5' }
    ],
    story: 'Khởi đầu từ con số không <em>trống rỗng</em> (vần rỗng w), xây dựng công <em>thành</em> tóc quăn <em>xoăng</em> tít là <em>được</em>!'
  },
  {
    category: 'alpha',
    lower: 'p',
    upper: 'P',
    lowerIdx: 24,
    upperIdx: 49,
    lowerPhrase: 'chao ➔ cô ➔ tươi',
    upperPhrase: 'kẹt ➔ xoong ➔ lìn',
    lowerRhymes: ['ao', 'ô', 'ươi'],
    upperRhymes: ['et', 'oong', 'yn'],
    samples: [
      { word: 'chao', code: 'Cpz' },
      { word: 'cô', code: 'c0Z' },
      { word: 'tươi', code: 'tp0' },
      { word: 'kẹt', code: 'kPj' },
      { word: 'xoong', code: 'xPZ' },
      { word: 'lìn', code: 'lKF' }
    ],
    story: 'Thuyền chao <em>đảo</em> gặp <em>cô</em> gái mắt <em>tươi</em> cười, kẹt <em>vào</em> cái <em>xoong</em> rớt lọt <em>lìn</em> xìn!'
  },
  {
    category: 'alpha',
    lower: 'f',
    upper: 'F',
    lowerIdx: 25,
    upperIdx: 44,
    lowerPhrase: 'tháp ➔ mốc ➔ lượn',
    upperPhrase: 'héc ➔ nghoeo ➔ buyn',
    lowerRhymes: ['ap', 'ôc', 'ươn'],
    upperRhymes: ['ec', 'oeo', 'uyn'],
    samples: [
      { word: 'tháp', code: 'Tfs' },
      { word: 'mốc', code: 'mfS' },
      { word: 'lượn', code: 'lf5' },
      { word: 'héc', code: 'hFs' },
      { word: 'nghoeo', code: 'WFZ' },
      { word: 'buyn', code: 'bF0' }
    ],
    story: 'Trèo lên đỉnh <em>tháp</em> phủ đầy rêu <em>mốc</em> rồi bay <em>lượn</em>, chạy <em>héc</em>-quyn quẹo <em>nghoeo</em> đón xe <em>buyn</em>!'
  },
  {
    category: 'alpha',
    lower: 't',
    upper: 'T',
    lowerIdx: 27,
    upperIdx: 28,
    lowerPhrase: 'sau ➔ chông ➔ lướt',
    upperPhrase: 'chày ➔ xốp ➔ dứt',
    lowerRhymes: ['au', 'ông', 'ươt'],
    upperRhymes: ['ay', 'ôp', 'ưt'],
    samples: [
      { word: 'sau', code: 'stz' },
      { word: 'chông', code: 'CtZ' },
      { word: 'lướt', code: 'lt1' },
      { word: 'chày', code: 'CTf' },
      { word: 'xốp', code: 'xTS' },
      { word: 'dứt', code: 'DT1' }
    ],
    story: 'Đứng phía <em>sau</em> vượt bãi cọc <em>chông</em> nhẹ nhàng <em>lướt</em>, giã chiếc <em>chày</em> bánh <em>xốp</em> ăn không thể <em>dứt</em>!'
  },
  {
    category: 'alpha',
    lower: 'x',
    upper: 'X',
    lowerIdx: 30,
    upperIdx: 52,
    lowerPhrase: 'bắc ➔ xơi ➔ quỳ',
    upperPhrase: 'đêm ➔ thoắt ➔ liềng',
    lowerRhymes: ['ăc', 'ơi', 'y'],
    upperRhymes: ['êm', 'oăt', 'yêng'],
    samples: [
      { word: 'bắc', code: 'bxs' },
      { word: 'xơi', code: 'xxZ' },
      { word: 'quỳ', code: 'qH2' },
      { word: 'đêm', code: 'dXz' },
      { word: 'thoắt', code: 'TXS' },
      { word: 'liềng', code: 'lgF' }
    ],
    story: 'Đi ra phương <em>Bắc</em> mời chàng <em>xơi</em> chén rượu rồi bắt <em>quỳ</em>, canh <em>đêm</em> thoăn <em>thoắt</em> cất tiếng chim <em>liềng</em>!'
  },
  {
    category: 'alpha',
    lower: 'j',
    upper: 'J',
    lowerIdx: 4,
    upperIdx: 47,
    lowerPhrase: 'làm ➔ miệt ➔ lùi',
    upperPhrase: 'kẹo ➔ choẹt ➔ quýt',
    lowerRhymes: ['am', 'iêt', 'ui'],
    upperRhymes: ['eo', 'oet', 'uyt'],
    samples: [
      { word: 'làm', code: 'ljf' },
      { word: 'miệt', code: 'mjJ' },
      { word: 'lùi', code: 'lj2' },
      { word: 'kẹo', code: 'kJj' },
      { word: 'choẹt', code: 'CJJ' },
      { word: 'quýt', code: 'qV1' }
    ],
    story: 'Chăm chỉ <em>làm</em> việc <em>miệt</em> mài không bao giờ chịu <em>lùi</em>, ngậm viên <em>kẹo</em> đỏ <em>choẹt</em> thơm phức mùi <em>quýt</em>!'
  },
  {
    category: 'alpha',
    lower: 'a',
    upper: 'A',
    lowerIdx: 55,
    upperIdx: 41,
    lowerPhrase: 'hết ➔ rỗng ➔ rỗng',
    upperPhrase: 'cầu ➔ ngoáp ➔ huểnh',
    lowerRhymes: ['êt', '', ''],
    upperRhymes: ['âu', 'oap', 'uênh'],
    samples: [
      { word: 'hết', code: 'hcs' },
      { word: 'cầu', code: 'c5f' },
      { word: 'ngoáp', code: 'NAS' },
      { word: 'huểnh', code: 'hA3' }
    ],
    story: 'Chơi cho <em>hết</em> mình bước qua chiếc <em>cầu</em>, ngáp <em>ngoáp</em> cái mồm vểnh râu <em>huểnh</em> hoang!'
  },
  {
    category: 'alpha',
    lower: 'e',
    upper: 'E',
    lowerIdx: 56,
    upperIdx: 43,
    lowerPhrase: 'kêu ➔ rỗng ➔ rỗng',
    upperPhrase: 'mẹ ➔ ngoáy ➔ huých',
    lowerRhymes: ['êu', '', ''],
    upperRhymes: ['e', 'oay', 'uych'],
    samples: [
      { word: 'kêu', code: 'kUz' },
      { word: 'mẹ', code: 'mej' },
      { word: 'ngoáy', code: 'NES' },
      { word: 'huých', code: 'hE1' }
    ],
    story: 'Cún con cất tiếng <em>kêu</em> đòi <em>mẹ</em>, ngoắt <em>ngoáy</em> cái đuôi mừng rỡ rồi <em>huých</em> thân vào chân chủ!'
  },
  {
    category: 'alpha',
    lower: 'u',
    upper: 'U',
    lowerIdx: 58,
    upperIdx: 50,
    lowerPhrase: 'chia ➔ rỗng ➔ rỗng',
    upperPhrase: 'mê ➔ ngoặc ➔ huỳnh',
    lowerRhymes: ['ia', '', ''],
    upperRhymes: ['ê', 'oăc', 'ynh'],
    samples: [
      { word: 'chia', code: 'Cvz' },
      { word: 'mê', code: 'mEz' },
      { word: 'ngoặc', code: 'NUJ' },
      { word: 'huỳnh', code: 'hY2' }
    ],
    story: 'Cùng nhau san <em>chia</em> niềm say <em>mê</em>, mở dấu <em>ngoặc</em> ghi tên Lưu <em>Huỳnh</em> rực rỡ!'
  },

  // ==================== NGUYÊN ÂM ĐẶC BIỆT (1 CẶP) ====================
  {
    category: 'special',
    lower: 'o',
    upper: 'i',
    lowerIdx: 46,
    upperIdx: 57,
    lowerPhrase: 'đen ➔ hoen ➔ buýp',
    upperPhrase: 'đi ➔ rỗng ➔ rỗng',
    lowerRhymes: ['en', 'oen', 'uyp'],
    upperRhymes: ['i', '', ''],
    samples: [
      { word: 'đen', code: 'doz' },
      { word: 'hoen', code: 'h4Z' },
      { word: 'buýp', code: 'bo1' },
      { word: 'đi', code: 'diz' },
      { word: 'chì', code: 'Cif' },
      { word: 'khi', code: 'Kiz' }
    ],
    story: 'Vệt mực <em>đen</em> làm <em>hoen</em> gỉ chiếc xe <em>buýp</em>, thôi hãy xách ba lô lên và <em>đi</em>!'
  },

  // ==================== KÝ TỰ SỐ (5 CẶP 0-9) ====================
  {
    category: 'number',
    lower: '0',
    upper: '1',
    lowerIdx: 31,
    upperIdx: 32,
    lowerPhrase: 'tắm ➔ bơm ➔ yếm',
    upperPhrase: 'cắn ➔ hơn ➔ yên',
    lowerRhymes: ['ăm', 'ơm', 'yêm'],
    upperRhymes: ['ăn', 'ơn', 'yên'],
    samples: [
      { word: 'tắm', code: 't0s' },
      { word: 'bơm', code: 'bpZ' },
      { word: 'yếm', code: 'z01' },
      { word: 'cắn', code: 'c1s' },
      { word: 'hơn', code: 'h1Z' },
      { word: 'yên', code: 'z10' }
    ],
    story: 'Ra suối <em>tắm</em> mát rồi <em>bơm</em> nước mặc áo <em>yếm</em>, không cho <em>cắn</em> nhau để sống <em>hơn</em> người trong bình <em>yên</em>!'
  },
  {
    category: 'number',
    lower: '2',
    upper: '3',
    lowerIdx: 33,
    upperIdx: 34,
    lowerPhrase: 'trăng ➔ chớp ➔ yết',
    upperPhrase: 'bắp ➔ bớt ➔ yêu',
    lowerRhymes: ['ăng', 'ơp', 'yêt'],
    upperRhymes: ['ăp', 'ơt', 'yêu'],
    samples: [
      { word: 'trăng', code: 'R2z' },
      { word: 'chớp', code: 'C2S' },
      { word: 'yết', code: 'z21' },
      { word: 'bắp', code: 'b3s' },
      { word: 'bớt', code: 'b3S' },
      { word: 'yêu', code: 'z30' }
    ],
    story: 'Ánh <em>trăng</em> ló dạng <em>chớp</em> nhoáng bảng <em>yết</em> kiến, cầm bắp <em>ngô</em> ăn <em>bớt</em> một nửa trao người mình <em>yêu</em>!'
  },
  {
    category: 'number',
    lower: '4',
    upper: '5',
    lowerIdx: 35,
    upperIdx: 36,
    lowerPhrase: 'cắt ➔ cho ➔ hươu',
    upperPhrase: 'bầm ➔ ngoác ➔ buồm',
    lowerRhymes: ['ăt', 'o', 'ươu'],
    upperRhymes: ['â', 'oac', 'uôm'],
    samples: [
      { word: 'cắt', code: 'c4s' },
      { word: 'cho', code: 'CoZ' },
      { word: 'hươu', code: 'h40' },
      { word: 'bầm', code: 'bDf' },
      { word: 'ngoác', code: 'N5S' },
      { word: 'buồm', code: 'b52' }
    ],
    story: 'Cầm kéo <em>cắt</em> cỏ <em>cho</em> đàn <em>hươu</em>, vết thương bầm <em>dập</em> mở toang <em>ngoác</em> cánh <em>buồm</em>!'
  },
  {
    category: 'number',
    lower: '6',
    upper: '7',
    lowerIdx: 37,
    upperIdx: 38,
    lowerPhrase: 'giấc ➔ hoạch ➔ quơ',
    upperPhrase: 'chân ➔ ngoạm ➔ quẫng',
    lowerRhymes: ['âc', 'oach', 'uơ'],
    upperRhymes: ['ân', 'oam', 'uâng'],
    samples: [
      { word: 'giấc', code: 'j6s' },
      { word: 'hoạch', code: 'h6J' },
      { word: 'quơ', code: 'qdz' },
      { word: 'chân', code: 'C7z' },
      { word: 'ngoạm', code: 'N7J' },
      { word: 'quẫng', code: 'q8x' }
    ],
    story: 'Tỉnh <em>giấc</em> hoàn thành kế <em>hoạch</em> tay <em>quơ</em> vội, bước đôi <em>chân</em> há mồm <em>ngoạm</em> miếng thịt nhảy <em>quẫng</em> lên!'
  },
  {
    category: 'number',
    lower: '8',
    upper: '9',
    lowerIdx: 39,
    upperIdx: 40,
    lowerPhrase: 'tầng ➔ choang ➔ khuấy',
    upperPhrase: 'đất ➔ doanh ➔ huếch',
    lowerRhymes: ['âng', 'oang', 'uây'],
    upperRhymes: ['ât', 'oanh', 'uêch'],
    samples: [
      { word: 'tầng', code: 't8f' },
      { word: 'choang', code: 'C8Z' },
      { word: 'khuấy', code: 'K81' },
      { word: 'đất', code: 'd9s' },
      { word: 'doanh', code: 'D9Z' },
      { word: 'huếch', code: 'h91' }
    ],
    story: 'Lên <em>tầng</em> cao chén vỡ kêu <em>choang</em> tay <em>khuấy</em> trà, rơi xuống mảnh <em>đất</em> kinh <em>doanh</em> nhà trống <em>huếch</em>!'
  }
];

let currentFilter = 'all';

export function renderCards(data = MNEMONIC_DATA, filter = currentFilter) {
  const container = document.getElementById('cards-container');
  if (!container) return;

  const filtered = data.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const catLabels = {
    alpha: '🔤 Chữ Cái',
    number: '🔢 Ký Tự Số',
    special: '🌟 Nguyên Âm Lẻ'
  };

  container.innerHTML = filtered.map(item => {
    const cardId = `card-${item.lower}-${item.upper}`;
    const lowerSamples = item.samples.slice(0, 3);
    const upperSamples = item.samples.slice(3);

    return `
      <div class="mn-card" id="${cardId}" data-lower="${item.lower}" data-upper="${item.upper}" data-cat="${item.category}">
        <!-- Top row: Keys & Category -->
        <div class="card-top-row">
          <div class="card-keys-badges">
            <span class="card-key-box lower">${item.lower}</span>
            <span style="color:#666; font-size:12px;">•</span>
            <span class="card-key-box upper">${item.upper}</span>
            <span style="color:#f8fafc; font-size:12.5px; font-weight:bold; margin-left:4px;">
              ${item.lowerPhrase.split('➔')[0].trim()} • ${item.upperPhrase.split('➔')[0].trim()}
            </span>
          </div>
          <span class="card-cat-badge">${catLabels[item.category] || 'Ma Trận'}</span>
        </div>

        <!-- Branches: Lower & Upper -->
        <div class="card-branches">
          <!-- Nhánh Thường -->
          <div class="card-branch-row">
            <div class="card-branch-header">
              <div class="card-branch-phrase lower-accent">phím [ ${item.lower} ]: ${item.lowerPhrase}</div>
              <div class="card-rhymes-list">
                <span class="rhyme-badge rhyme-b1">${item.lowerRhymes[0] || 'Ø'}</span>
                <span class="rhyme-badge rhyme-b2">${item.lowerRhymes[1] || 'Ø'}</span>
                <span class="rhyme-badge rhyme-b3">${item.lowerRhymes[2] || 'Ø'}</span>
              </div>
            </div>
            <div class="card-samples-list">
              ${lowerSamples.map(s => `
                <span class="sample-chip" data-word="${s.word}" data-code="${s.code}" title="Bấm để nạp vào ô tra cứu">
                  <span class="word">${s.word}</span>
                  <span style="color:#666;">➔</span>
                  <span class="code">${s.code}</span>
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Nhánh HOA -->
          <div class="card-branch-row">
            <div class="card-branch-header">
              <div class="card-branch-phrase upper-accent">phím [ ${item.upper} ]: ${item.upperPhrase}</div>
              <div class="card-rhymes-list">
                <span class="rhyme-badge rhyme-b1">${item.upperRhymes[0] || 'Ø'}</span>
                <span class="rhyme-badge rhyme-b2">${item.upperRhymes[1] || 'Ø'}</span>
                <span class="rhyme-badge rhyme-b3">${item.upperRhymes[2] || 'Ø'}</span>
              </div>
            </div>
            <div class="card-samples-list">
              ${upperSamples.map(s => `
                <span class="sample-chip" data-word="${s.word}" data-code="${s.code}" title="Bấm để nạp vào ô tra cứu">
                  <span class="word">${s.word}</span>
                  <span style="color:#666;">➔</span>
                  <span class="code">${s.code}</span>
                </span>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Story (High Contrast Box) -->
        <div class="card-story-box">
          <div class="card-story-text">
            💡 <strong>Ý nghĩa liên tưởng:</strong> ${item.story}
          </div>
          <button class="speak-btn" title="Đọc to câu chuyện này" data-text="${item.story.replace(/<[^>]*>/g, '')}">🔊 Nghe</button>
        </div>
      </div>
    `;
  }).join('');
}

export function renderTable(data = MNEMONIC_DATA, filter = currentFilter) {
  const tbody = document.getElementById('mnemonic-tbody');
  if (!tbody) return;

  const filtered = data.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  tbody.innerHTML = filtered.map(item => {
    const rowId = `row-${item.lower}-${item.upper}`;
    return `
      <tr id="${rowId}" data-lower="${item.lower}" data-upper="${item.upper}" data-cat="${item.category}">
        <!-- Cặp Phím -->
        <td>
          <div class="key-pair-badge">
            <span class="key-char-lower">${item.lower}</span>
            <div class="key-divider"></div>
            <span class="key-char-upper">${item.upper}</span>
          </div>
        </td>

        <!-- Câu Thần Chú 6 Từ -->
        <td class="mnemonic-cell">
          <div class="mnemonic-sub-row">
            <span class="label-tag tag-lower">${item.lower}</span>
            <span class="mnemonic-phrase">${item.lowerPhrase}</span>
          </div>
          <div class="mnemonic-sub-row" style="border-top:1px dashed #003315; margin-top:3px; padding-top:3px;">
            <span class="label-tag tag-upper">${item.upper}</span>
            <span class="mnemonic-phrase"><span class="accent">${item.upperPhrase}</span></span>
          </div>
        </td>

        <!-- 6 Vần Tương Ứng -->
        <td class="rhymes-cell">
          <div style="margin-bottom:3px;">
            <strong style="color:var(--neon-green);">${item.lower}:</strong> 
            <span class="rhyme-badge rhyme-b1">${item.lowerRhymes[0] || 'Ø'}</span>
            <span class="rhyme-badge rhyme-b2">${item.lowerRhymes[1] || 'Ø'}</span>
            <span class="rhyme-badge rhyme-b3">${item.lowerRhymes[2] || 'Ø'}</span>
          </div>
          <div>
            <strong style="color:var(--neon-gold);">${item.upper}:</strong> 
            <span class="rhyme-badge rhyme-b1">${item.upperRhymes[0] || 'Ø'}</span>
            <span class="rhyme-badge rhyme-b2">${item.upperRhymes[1] || 'Ø'}</span>
            <span class="rhyme-badge rhyme-b3">${item.upperRhymes[2] || 'Ø'}</span>
          </div>
        </td>

        <!-- Ví Dụ Thực Chiến & Mã Nén -->
        <td class="samples-cell">
          ${item.samples.map(s => `
            <span class="sample-chip" data-word="${s.word}" data-code="${s.code}" title="Bấm để nạp vào ô tra cứu">
              <span class="word">${s.word}</span>
              <span style="color:#666;">➔</span>
              <span class="code">${s.code}</span>
            </span>
          `).join('')}
        </td>

        <!-- Ý Nghĩa Liên Tưởng -->
        <td class="story-cell">
          ${item.story}
          <button class="speak-btn" title="Đọc to câu chuyện này" data-text="${item.story.replace(/<[^>]*>/g, '')}">🔊</button>
        </td>
      </tr>
    `;
  }).join('');
}

export function renderViews(data = MNEMONIC_DATA, filter = currentFilter) {
  renderCards(data, filter);
  renderTable(data, filter);
}

// Interactive lookup via Local API
export async function performLookup(query) {
  const q = (query || '').trim();
  const resBox = document.getElementById('lookup-result-box');
  if (!q) {
    if (resBox) resBox.classList.remove('show');
    clearHighlights();
    return;
  }

  try {
    const res = await fetch(`/api/lookup?w=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();

    if (data.success && resBox) {
      resBox.classList.add('show');
      
      const code = data.code || data.result || '---';
      const word = data.word || data.input || q;
      document.getElementById('res-code').textContent = data.type === 'gboard_learn' ? data.code : code;

      if (data.type === 'gboard_memo') {
        document.getElementById('res-word').innerHTML = `<span style="color:#ffea00; font-size:13.5px;">⚡ Gboard Tra Gọn:</span> <b>${data.input}</b> ➔ Mã <b style="color:#00ff66;">${data.code}</b> <span style="font-size:12px; color:#aaa;">(Từ gốc: <i>${data.word}</i>)</span>`;
      } else if (data.type === 'gboard_learn') {
        document.getElementById('res-word').innerHTML = `<span style="color:#38bdf8; font-size:13.5px;">🎓 Gboard Học Sâu:</span> <b>${data.input}</b> ➔ Thẻ 9 vần: <span style="color:#ffea00; font-family:monospace; font-size:13px; background:#001a26; padding:2px 6px; border:1px solid #38bdf8; border-radius:3px;">${data.card}</span>`;
      } else {
        document.getElementById('res-word').textContent = word;
      }

      const breakdown = data.breakdown;
      if (breakdown) {
        document.getElementById('res-details').textContent = 
          `C1: ${breakdown.c1?.char || ''} (${breakdown.c1?.consonant || ''}) | ` +
          `C2: ${breakdown.c2?.char || ''} (vần '${breakdown.c2?.rhyme || ''}') | ` +
          `C3: ${breakdown.c3?.char || ''} (${breakdown.c3?.toneName || ''})`;
      } else {
        document.getElementById('res-details').textContent = data.summary || '';
      }

      document.getElementById('res-mnemonic').textContent = data.mnemonic || '';

      // Highlight corresponding row / card
      highlightMatchingRow(code, breakdown);
    } else if (resBox) {
      resBox.classList.remove('show');
      clearHighlights();
    }
  } catch (err) {
    console.warn('Local lookup error:', err);
  }
}

export function clearHighlights() {
  document.querySelectorAll('.highlight-row').forEach(el => {
    el.classList.remove('highlight-row');
  });
}

export function highlightMatchingRow(code, breakdown) {
  clearHighlights();
  if (!code && !breakdown) return;

  let c2Char = breakdown?.c2?.char;
  if (!c2Char && code && code.length >= 2) {
    const base = (code.startsWith('I') || code.startsWith('O')) ? code.substring(1) : code;
    c2Char = base[1];
  }

  if (!c2Char) return;

  const targetLower = c2Char.toLowerCase();
  
  // Find matching table row
  const tr = document.querySelector(`tr[data-lower="${c2Char}"]`) || 
             document.querySelector(`tr[data-upper="${c2Char}"]`) ||
             document.querySelector(`tr[data-lower="${targetLower}"]`);
  if (tr) {
    tr.classList.add('highlight-row');
  }

  // Find matching card
  const card = document.querySelector(`.mn-card[data-lower="${c2Char}"]`) || 
               document.querySelector(`.mn-card[data-upper="${c2Char}"]`) ||
               document.querySelector(`.mn-card[data-lower="${targetLower}"]`);
  if (card) {
    card.classList.add('highlight-row');
  }
}

// Text-to-speech for Vietnamese
export function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Attach event listeners
export function initApp() {
  renderViews();

  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const clearBtn = document.getElementById('clear-btn');

  let debounceTimer = null;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performLookup(e.target.value);
    }, 250);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      performLookup(searchInput.value);
    }
  });

  searchBtn?.addEventListener('click', () => {
    performLookup(searchInput?.value);
  });

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    performLookup('');
  });

  // Filter tabs
  document.querySelectorAll('.mn-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mn-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      renderViews(MNEMONIC_DATA, currentFilter);
    });
  });

  // View Switcher (Cards vs Table)
  const btnCards = document.getElementById('btn-view-cards');
  const btnTable = document.getElementById('btn-view-table');
  const cardsContainer = document.getElementById('cards-container');
  const tableContainer = document.getElementById('table-container');

  btnCards?.addEventListener('click', () => {
    btnCards.classList.add('active');
    btnTable?.classList.remove('active');
    if (cardsContainer) cardsContainer.style.display = 'flex';
    if (tableContainer) tableContainer.style.display = 'none';
  });

  btnTable?.addEventListener('click', () => {
    btnTable.classList.add('active');
    btnCards?.classList.remove('active');
    if (cardsContainer) cardsContainer.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
  });

  // Quick pills
  document.querySelectorAll('.quick-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      if (q === '7pa') {
        const banner = document.getElementById('extra-consonants-banner');
        banner?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        banner?.animate([
          { boxShadow: '0 0 0px #ffea00' },
          { boxShadow: '0 0 20px #ffea00' },
          { boxShadow: '0 0 0px #ffea00' }
        ], { duration: 1200 });
      } else {
        if (searchInput) {
          searchInput.value = q;
          performLookup(q);
        }
      }
    });
  });

  // Event delegation for chips & sound buttons (works for both Cards & Table)
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.sample-chip');
    if (chip) {
      const word = chip.getAttribute('data-word');
      if (searchInput && word) {
        searchInput.value = word;
        performLookup(word);
      }
      return;
    }

    const speak = e.target.closest('.speak-btn');
    if (speak) {
      const text = speak.getAttribute('data-text');
      if (text) speakText(text);
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initApp);
}
