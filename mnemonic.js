// mnemonic.js - Toàn bộ 60 Ký Tự Base60 (30 Cặp Hàng Hoàn Chỉnh Chuẩn Xác 100%)

export const MNEMONIC_DATA = [
  // ==================== CHỮ CÁI (24 CẶP) ====================
  {
    category: 'alpha',
    lower: 'b',
    upper: 'B',
    lowerIdx: 15,
    upperIdx: 42,
    lowerPhrase: 'bướm ➔ khoe ➔ tuy',
    upperPhrase: 'đây ➔ thoát ➔ khuya',
    lowerRhymes: ["ươm","oe","uy"],
    upperRhymes: ["ây","oat","uya"],
    samples: [
      { word: 'bướm', code: 'bbs' },
      { word: 'khoe', code: 'KbZ' },
      { word: 'tuy', code: 'tb0' },
      { word: 'đây', code: 'dBz' },
      { word: 'thoát', code: 'TBS' },
      { word: 'khuya', code: 'KB0' }
    ],
    story: 'Bắt con <em>bướm</em> đẹp đem <em>khoe</em>, <em>tuy</em> vậy đến <em>đây</em> may mà <em>thoát</em> nạn lúc đêm <em>khuya</em>!'
  },
  {
    category: 'alpha',
    lower: 'c',
    upper: 'C',
    lowerIdx: 0,
    upperIdx: 11,
    lowerPhrase: 'kết ➔ việc ➔ mua',
    upperPhrase: 'tích ➔ hoa ➔ muốn',
    lowerRhymes: ["êt","iêc","ua"],
    upperRhymes: ["ich","oa","uôn"],
    samples: [
      { word: 'kết', code: 'kcs' },
      { word: 'việc', code: 'vcJ' },
      { word: 'mua', code: 'mc0' },
      { word: 'tích', code: 'tCs' },
      { word: 'hoa', code: 'hCZ' },
      { word: 'muốn', code: 'mC1' }
    ],
    story: 'Tổng <em>kết</em> công <em>việc</em> đi <em>mua</em> sắm, tích lũy thành <em>tích</em> tặng nhánh <em>hoa</em> tươi nếu thực lòng <em>muốn</em>!'
  },
  {
    category: 'alpha',
    lower: 'd',
    upper: 'D',
    lowerIdx: 1,
    upperIdx: 9,
    lowerPhrase: 'cơ ➔ tiên ➔ xuất',
    upperPhrase: 'tâm ➔ thịt ➔ thuốc',
    lowerRhymes: ["ơ","iên","uât"],
    upperRhymes: ["âm","it","uôc"],
    samples: [
      { word: 'cơ', code: 'cdz' },
      { word: 'tiên', code: 'tdZ' },
      { word: 'xuất', code: 'xd1' },
      { word: 'tâm', code: 'tDz' },
      { word: 'thịt', code: 'TDJ' },
      { word: 'thuốc', code: 'TD1' }
    ],
    story: 'Thời <em>cơ</em> nàng <em>tiên</em> giáng <em>xuất</em>, dốc hết con <em>tâm</em> nướng đĩa <em>thịt</em> thơm rồi châm điếu <em>thuốc</em>!'
  },
  {
    category: 'alpha',
    lower: 'g',
    upper: 'G',
    lowerIdx: 2,
    upperIdx: 3,
    lowerPhrase: 'gạch ➔ nghiêng ➔ giục',
    upperPhrase: 'gái ➔ hiệp ➔ thuê',
    lowerRhymes: ["ach","iêng","uc"],
    upperRhymes: ["ai","iêp","uê"],
    samples: [
      { word: 'gạch', code: 'ggj' },
      { word: 'nghiêng', code: 'WgZ' },
      { word: 'giục', code: 'jg5' },
      { word: 'gái', code: 'gGs' },
      { word: 'hiệp', code: 'hGJ' },
      { word: 'thuê', code: 'TG0' }
    ],
    story: 'Cầm viên <em>gạch</em> đứng <em>nghiêng</em> người hối <em>giục</em>, bắt gặp em <em>gái</em> vừa chơi xong một <em>hiệp</em> ở căn nhà <em>thuê</em>!'
  },
  {
    category: 'alpha',
    lower: 'k',
    upper: 'K',
    lowerIdx: 5,
    upperIdx: 6,
    lowerPhrase: 'bạn ➔ chịu ➔ trùm',
    upperPhrase: 'tháng ➔ tin ➔ bún',
    lowerRhymes: ["an","iu","um"],
    upperRhymes: ["ang","in","un"],
    samples: [
      { word: 'bạn', code: 'bkj' },
      { word: 'chịu', code: 'CkJ' },
      { word: 'trùm', code: 'Rk2' },
      { word: 'tháng', code: 'TKs' },
      { word: 'tin', code: 'tKZ' },
      { word: 'bún', code: 'bK1' }
    ],
    story: 'Người <em>bạn</em> khó <em>chịu</em> trùm mền kín mít, mấy <em>tháng</em> trời ngóng <em>tin</em> mời đi ăn bát <em>bún</em>!'
  },
  {
    category: 'alpha',
    lower: 'h',
    upper: 'H',
    lowerIdx: 7,
    upperIdx: 21,
    lowerPhrase: 'hôn ➔ nhiều ➔ xuân',
    upperPhrase: 'tập ➔ ngọt ➔ lý',
    lowerRhymes: ["ôn","iêu","uân"],
    upperRhymes: ["âp","ot","y"],
    samples: [
      { word: 'hôn', code: 'hhz' },
      { word: 'nhiều', code: 'HhF' },
      { word: 'xuân', code: 'xh0' },
      { word: 'tập', code: 'tHj' },
      { word: 'ngọt', code: 'NHJ' },
      { word: 'lý', code: 'lH1' }
    ],
    story: 'Trao nụ <em>hôn</em> thật <em>nhiều</em> đón ngày <em>xuân</em>, chăm chỉ luyện <em>tập</em> hưởng vị <em>ngọt</em> ngào đầy hợp <em>lý</em>!'
  },
  {
    category: 'alpha',
    lower: 'v',
    upper: 'V',
    lowerIdx: 8,
    upperIdx: 51,
    lowerPhrase: 'chia ➔ kịp ➔ vùng',
    upperPhrase: 'ếch ➔ hoắm ➔ quýt',
    lowerRhymes: ["ia","ip","ung"],
    upperRhymes: ["êch","oăm","yt"],
    samples: [
      { word: 'chia', code: 'Cvz' },
      { word: 'kịp', code: 'kvJ' },
      { word: 'vùng', code: 'vv2' },
      { word: 'ếch', code: 'zVs' },
      { word: 'hoắm', code: 'hVS' },
      { word: 'quýt', code: 'qV1' }
    ],
    story: 'Cùng san <em>chia</em> cho <em>kịp</em> tới <em>vùng</em> quê, bắt con <em>ếch</em> dưới hố sâu hoắm rồi hái chùm <em>quýt</em>!'
  },
  {
    category: 'alpha',
    lower: 'm',
    upper: 'M',
    lowerIdx: 10,
    upperIdx: 48,
    lowerPhrase: 'hút ➔ chính ➔ tuổi',
    upperPhrase: 'đẹp ➔ moóc ➔ khuỷu',
    lowerRhymes: ["ut","inh","uôi"],
    upperRhymes: ["ep","ooc","uyu"],
    samples: [
      { word: 'hút', code: 'hms' },
      { word: 'chính', code: 'CmS' },
      { word: 'tuổi', code: 'tm3' },
      { word: 'đẹp', code: 'dMj' },
      { word: 'moóc', code: 'mMS' },
      { word: 'khuỷu', code: 'KM3' }
    ],
    story: 'Hơi <em>hút</em> chân <em>chính</em> thời trai <em>tuổi</em> trẻ, khoác áo <em>đẹp</em> móc xe kéo <em>moóc</em> va vào cùi <em>khuỷu</em> tay!'
  },
  {
    category: 'alpha',
    lower: 'r',
    upper: 'R',
    lowerIdx: 12,
    upperIdx: 29,
    lowerPhrase: 'rên ➔ ngoài ➔ xuống',
    upperPhrase: 'một ➔ tốt ➔ cứu',
    lowerRhymes: ["ên","oai","uông"],
    upperRhymes: ["ă","ôt","ưu"],
    samples: [
      { word: 'rên', code: 'rrz' },
      { word: 'ngoài', code: 'NrF' },
      { word: 'xuống', code: 'xr1' },
      { word: 'một', code: 'mRJ' },
      { word: 'tốt', code: 'tRS' },
      { word: 'cứu', code: 'cR1' }
    ],
    story: 'Tiếng <em>rên</em> vọng ra <em>ngoài</em> rồi lắng <em>xuống</em>, làm <em>một</em> việc <em>tốt</em> để kịp thời <em>cứu</em> nguy nan!'
  },
  {
    category: 'alpha',
    lower: 's',
    upper: 'S',
    lowerIdx: 13,
    upperIdx: 18,
    lowerPhrase: 'đường ➔ toàn ➔ suốt',
    upperPhrase: 'các ➔ con ➔ quỳnh',
    lowerRhymes: ["ương","oan","uôt"],
    upperRhymes: ["ac","on","ynh"],
    samples: [
      { word: 'đường', code: 'dsf' },
      { word: 'toàn', code: 'tsF' },
      { word: 'suốt', code: 'ss1' },
      { word: 'các', code: 'cSs' },
      { word: 'con', code: 'cSZ' },
      { word: 'quỳnh', code: 'qS2' }
    ],
    story: 'Trên con <em>đường</em> an <em>toàn</em> đi <em>suốt</em> đêm, <em>các</em> bạn nhỏ dẫn <em>con</em> ngắm hoa <em>quỳnh</em> nở!'
  },
  {
    category: 'alpha',
    lower: 'n',
    upper: 'N',
    lowerIdx: 14,
    upperIdx: 20,
    lowerPhrase: 'nhưng ➔ học ➔ giúp',
    upperPhrase: 'thực ➔ góp ➔ ngửi',
    lowerRhymes: ["ưng","oc","up"],
    upperRhymes: ["ưc","op","ưi"],
    samples: [
      { word: 'nhưng', code: 'Hnz' },
      { word: 'học', code: 'hnJ' },
      { word: 'giúp', code: 'jn1' },
      { word: 'thực', code: 'TNj' },
      { word: 'góp', code: 'gNS' },
      { word: 'ngửi', code: 'NN3' }
    ],
    story: 'Khó khăn <em>nhưng</em> chăm <em>học</em> sẽ được <em>giúp</em>, biến ước mơ thành hiện <em>thực</em> đóng <em>góp</em> hương thơm cho đời <em>ngửi</em>!'
  },
  {
    category: 'alpha',
    lower: 'l',
    upper: 'L',
    lowerIdx: 16,
    upperIdx: 22,
    lowerPhrase: 'điểm ➔ nói ➔ nguyên',
    upperPhrase: 'lộn ➔ khoăn ➔ nhưn',
    lowerRhymes: ["iêm","oi","uyên"],
    upperRhymes: ["ôn","oăn","ưn"],
    samples: [
      { word: 'điểm', code: 'dlr' },
      { word: 'nói', code: 'nlS' },
      { word: 'nguyên', code: 'Nl0' },
      { word: 'lộn', code: 'LLj' },
      { word: 'khoăn', code: 'KLZ' },
      { word: 'nhưn', code: 'HL0' }
    ],
    story: 'Từng luận <em>điểm</em> được <em>nói</em> giữ <em>nguyên</em> giá trị, chớ để lẫn <em>lộn</em> băn <em>khoăn</em> những chuyện <em>nhưn</em> nhượng!'
  },
  {
    category: 'alpha',
    lower: 'q',
    upper: 'Q',
    lowerIdx: 26,
    upperIdx: 17,
    lowerPhrase: 'phát ➔ tôi ➔ cướp',
    upperPhrase: 'phim ➔ nhóm ➔ tuyệt',
    lowerRhymes: ["at","ôi","ươp"],
    upperRhymes: ["im","om","uyêt"],
    samples: [
      { word: 'phát', code: 'fqs' },
      { word: 'tôi', code: 'tqZ' },
      { word: 'cướp', code: 'cq1' },
      { word: 'phim', code: 'fQz' },
      { word: 'nhóm', code: 'HQS' },
      { word: 'tuyệt', code: 'tQ5' }
    ],
    story: 'Vừa bộc <em>phát</em> lời <em>tôi</em> bị kẻ gian <em>cướp</em> lời, xem bộ <em>phim</em> cùng cả <em>nhóm</em> thật là <em>tuyệt</em> vời!'
  },
  {
    category: 'alpha',
    lower: 'z',
    upper: 'Z',
    lowerIdx: 19,
    upperIdx: 54,
    lowerPhrase: 'hôm ➔ trong ➔ chưa',
    upperPhrase: 'bếp ➔ xẻng ➔ qun',
    lowerRhymes: ["ôm","ong","ưa"],
    upperRhymes: ["êp","eng","n"],
    samples: [
      { word: 'hôm', code: 'hzz' },
      { word: 'trong', code: 'RzZ' },
      { word: 'chưa', code: 'Cz0' },
      { word: 'bếp', code: 'bZs' },
      { word: 'xẻng', code: 'xZR' },
      { word: 'qun', code: 'qZ0' }
    ],
    story: 'Mới <em>hôm</em> nào ở <em>trong</em> nhà mà <em>chưa</em> nấu nướng, nay đỏ lửa góc <em>bếp</em> cầm chiếc <em>xẻng</em> xúc đống than <em>qun</em>!'
  },
  {
    category: 'alpha',
    lower: 'y',
    upper: 'Y',
    lowerIdx: 53,
    upperIdx: 45,
    lowerPhrase: 'lệnh ➔ giê ➔ đắk',
    upperPhrase: 'em ➔ oem ➔ huynh',
    lowerRhymes: ["ênh","iê","ăk"],
    upperRhymes: ["em","oem","uynh"],
    samples: [
      { word: 'lệnh', code: 'lyj' },
      { word: 'giê', code: 'jyZ' },
      { word: 'đắk', code: 'dy1' },
      { word: 'em', code: 'zYz' },
      { word: 'oem', code: 'zYZ' },
      { word: 'huynh', code: 'hY0' }
    ],
    story: 'Nhận mệnh <em>lệnh</em> chạy máy <em>giê</em> thóc tại vùng <em>Đắk</em> Lắk, gửi <em>em</em> nụ cười hoem <em>oem</em> cùng người <em>huynh</em> đài!'
  },
  {
    category: 'alpha',
    lower: 'w',
    upper: 'W',
    lowerIdx: 59,
    upperIdx: 23,
    lowerPhrase: 'qu ➔ qu ➔ qu',
    upperPhrase: 'thành ➔ hoằng ➔ nước',
    lowerRhymes: ["","",""],
    upperRhymes: ["anh","oăng","ươc"],
    samples: [
      { word: 'qu', code: 'qwz' },
      { word: 'qu', code: 'qwz' },
      { word: 'qu', code: 'qwz' },
      { word: 'thành', code: 'TWf' },
      { word: 'hoằng', code: 'hWF' },
      { word: 'nước', code: 'nW1' }
    ],
    story: 'Gõ chữ <em>qu</em> tốc ký liền tay, lập chiến công <em>thành</em> công vang dội sáng <em>hoằng</em> soi dòng sông <em>nước</em>!'
  },
  {
    category: 'alpha',
    lower: 'p',
    upper: 'P',
    lowerIdx: 24,
    upperIdx: 49,
    lowerPhrase: 'báo ➔ cơm ➔ người',
    upperPhrase: 'nét ➔ xoong ➔ quyn',
    lowerRhymes: ["ao","ơm","ươi"],
    upperRhymes: ["et","oong","yn"],
    samples: [
      { word: 'báo', code: 'bps' },
      { word: 'cơm', code: 'cpZ' },
      { word: 'người', code: 'Np2' },
      { word: 'nét', code: 'nPs' },
      { word: 'xoong', code: 'xPZ' },
      { word: 'quyn', code: 'qP0' }
    ],
    story: 'Xem tờ <em>báo</em> ăn bữa <em>cơm</em> cùng mọi <em>người</em>, từng đường <em>nét</em> trên chiếc <em>xoong</em> bóng loáng như thẻ <em>quyn</em> bài!'
  },
  {
    category: 'alpha',
    lower: 'f',
    upper: 'F',
    lowerIdx: 25,
    upperIdx: 44,
    lowerPhrase: 'pháp ➔ quốc ➔ vườn',
    upperPhrase: 'séc ➔ ngoèo ➔ buyn',
    lowerRhymes: ["ap","ôc","ươn"],
    upperRhymes: ["ec","oeo","uyn"],
    samples: [
      { word: 'pháp', code: 'ffs' },
      { word: 'quốc', code: 'qfS' },
      { word: 'vườn', code: 'vf2' },
      { word: 'séc', code: 'sFs' },
      { word: 'ngoèo', code: 'NFF' },
      { word: 'buyn', code: 'bF0' }
    ],
    story: 'Hiến <em>pháp</em> của đất <em>quốc</em> gia giữ xanh mảnh <em>vườn</em>, ký tấm ngân <em>séc</em> đi đường ngoằn <em>ngoèo</em> đón xe <em>buyn</em>!'
  },
  {
    category: 'alpha',
    lower: 't',
    upper: 'T',
    lowerIdx: 27,
    upperIdx: 28,
    lowerPhrase: 'sau ➔ công ➔ vượt',
    upperPhrase: 'ngày ➔ hộp ➔ dứt',
    lowerRhymes: ["au","ông","ươt"],
    upperRhymes: ["ay","ôp","ưt"],
    samples: [
      { word: 'sau', code: 'stz' },
      { word: 'công', code: 'ctZ' },
      { word: 'vượt', code: 'vt5' },
      { word: 'ngày', code: 'NTf' },
      { word: 'hộp', code: 'hTJ' },
      { word: 'dứt', code: 'DT1' }
    ],
    story: 'Đứng phía <em>sau</em> lập chiến <em>công</em> vượt <em>vượt</em> mọi thử thách, qua bao <em>ngày</em> mở chiếc <em>hộp</em> quà chấm <em>dứt</em> chuỗi ngày chờ!'
  },
  {
    category: 'alpha',
    lower: 'x',
    upper: 'X',
    lowerIdx: 30,
    upperIdx: 52,
    lowerPhrase: 'bắc ➔ với ➔ ngừm',
    upperPhrase: 'đêm ➔ thoắt ➔ yểng',
    lowerRhymes: ["ăc","ơi","ưm"],
    upperRhymes: ["êm","oăt","yêng"],
    samples: [
      { word: 'bắc', code: 'bxs' },
      { word: 'với', code: 'vxS' },
      { word: 'ngừm', code: 'Nx2' },
      { word: 'đêm', code: 'dXz' },
      { word: 'thoắt', code: 'TXS' },
      { word: 'yểng', code: 'zX3' }
    ],
    story: 'Từ miền <em>bắc</em> vào chung sống <em>với</em> nhau đừng ngập <em>ngừm</em>, suốt <em>đêm</em> thoăn <em>thoắt</em> dạy chim <em>yểng</em> hót!'
  },
  {
    category: 'alpha',
    lower: 'j',
    upper: 'J',
    lowerIdx: 4,
    upperIdx: 47,
    lowerPhrase: 'làm ➔ việt ➔ vui',
    upperPhrase: 'kẹo ➔ loét ➔ buýt',
    lowerRhymes: ["am","iêt","ui"],
    upperRhymes: ["eo","oet","uyt"],
    samples: [
      { word: 'làm', code: 'ljf' },
      { word: 'việt', code: 'vjJ' },
      { word: 'vui', code: 'vj0' },
      { word: 'kẹo', code: 'kJj' },
      { word: 'loét', code: 'lJS' },
      { word: 'buýt', code: 'bJ1' }
    ],
    story: 'Chăm chỉ <em>làm</em> việc người <em>Việt</em> luôn rạng rỡ <em>vui</em> tươi, chia nhau thanh <em>kẹo</em> cười toét <em>loét</em> đón chuyến xe <em>buýt</em>!'
  },
  {
    category: 'alpha',
    lower: 'a',
    upper: 'A',
    lowerIdx: 55,
    upperIdx: 41,
    lowerPhrase: 'ba ➔ ca ➔ nhà',
    upperPhrase: 'oạp ➔ tuềnh ➔ huênh',
    lowerRhymes: ["a","",""],
    upperRhymes: ["â","oap","uênh"],
    samples: [
      { word: 'ba', code: 'baz' },
      { word: 'ca', code: 'caz' },
      { word: 'nhà', code: 'Haf' },
      { word: 'oạp', code: 'zAJ' },
      { word: 'tuềnh', code: 'tA2' },
      { word: 'huênh', code: 'hA0' }
    ],
    story: 'Người <em>ba</em> hát khúc tình <em>ca</em> trước mái <em>nhà</em>, tiếng sóng vỗ oam <em>oạp</em> giữa căn phòng <em>tuềnh</em> toàng không chút <em>huênh</em> hoang!'
  },
  {
    category: 'alpha',
    lower: 'e',
    upper: 'E',
    lowerIdx: 56,
    upperIdx: 43,
    lowerPhrase: 'xe ➔ mẹ ➔ bé',
    upperPhrase: 'mê ➔ ngoáy ➔ huých',
    lowerRhymes: ["e","",""],
    upperRhymes: ["ê","oay","uych"],
    samples: [
      { word: 'xe', code: 'xez' },
      { word: 'mẹ', code: 'mej' },
      { word: 'bé', code: 'bes' },
      { word: 'mê', code: 'mEz' },
      { word: 'ngoáy', code: 'NES' },
      { word: 'huých', code: 'hE1' }
    ],
    story: 'Lên chiếc <em>xe</em> cùng <em>mẹ</em> bế em <em>bé</em>, niềm say <em>mê</em> ngoắt <em>ngoáy</em> đuôi rồi tinh nghịch <em>huých</em> vai!'
  },
  {
    category: 'alpha',
    lower: 'u',
    upper: 'U',
    lowerIdx: 58,
    upperIdx: 50,
    lowerPhrase: 'thu ➔ ru ➔ đu',
    upperPhrase: 'nêu ➔ ngoặc ➔ như',
    lowerRhymes: ["u","",""],
    upperRhymes: ["êu","oăc","ư"],
    samples: [
      { word: 'thu', code: 'Tuz' },
      { word: 'ru', code: 'ruz' },
      { word: 'đu', code: 'duz' },
      { word: 'nêu', code: 'nUz' },
      { word: 'ngoặc', code: 'NUJ' },
      { word: 'như', code: 'HU0' }
    ],
    story: 'Gió mùa <em>thu</em> lời ru <em>ru</em> êm đềm võng <em>đu</em> đưa, tấm gương được <em>nêu</em> trong dấu <em>ngoặc</em> sáng trong <em>như</em> ngọc!'
  },

  // ==================== NGUYÊN ÂM ĐẶC BIỆT (1 CẶP) ====================
  {
    category: 'special',
    lower: 'o',
    upper: 'i',
    lowerIdx: 46,
    upperIdx: 57,
    lowerPhrase: 'đen ➔ cho ➔ tuýp',
    upperPhrase: 'đi ➔ chì ➔ khi',
    lowerRhymes: ["en","o","uyp"],
    upperRhymes: ["i","",""],
    samples: [
      { word: 'đen', code: 'doz' },
      { word: 'cho', code: 'CoZ' },
      { word: 'tuýp', code: 'to1' },
      { word: 'đi', code: 'diz' },
      { word: 'chì', code: 'Cif' },
      { word: 'khi', code: 'Kiz' }
    ],
    story: 'Vệt mực <em>đen</em> tặng <em>cho</em> em cả <em>tuýp</em> màu, cùng nhau bước <em>đi</em> cầm bút <em>chì</em> mỗi <em>khi</em> vẽ tranh!'
  },

  // ==================== KÝ TỰ SỐ (5 CẶP 0-9) ====================
  {
    category: 'number',
    lower: '0',
    upper: '1',
    lowerIdx: 31,
    upperIdx: 32,
    lowerPhrase: 'năm ➔ cô ➔ yếm',
    upperPhrase: 'ăn ➔ hơn ➔ yên',
    lowerRhymes: ["ăm","ô","yêm"],
    upperRhymes: ["ăn","ơn","yên"],
    samples: [
      { word: 'năm', code: 'n0z' },
      { word: 'cô', code: 'c0Z' },
      { word: 'yếm', code: 'z01' },
      { word: 'ăn', code: 'z1z' },
      { word: 'hơn', code: 'h1Z' },
      { word: 'yên', code: 'z10' }
    ],
    story: 'Trải qua bao <em>năm</em> tháng <em>cô</em> gái mặc áo <em>yếm</em>, chăm lo việc <em>ăn</em> uống sống <em>hơn</em> người trong bình <em>yên</em>!'
  },
  {
    category: 'number',
    lower: '2',
    upper: '3',
    lowerIdx: 33,
    upperIdx: 34,
    lowerPhrase: 'tăng ➔ hợp ➔ quyết',
    upperPhrase: 'gặp ➔ bớt ➔ yêu',
    lowerRhymes: ["ăng","ơp","yêt"],
    upperRhymes: ["ăp","ơt","yêu"],
    samples: [
      { word: 'tăng', code: 't2z' },
      { word: 'hợp', code: 'h2J' },
      { word: 'quyết', code: 'q21' },
      { word: 'gặp', code: 'g3j' },
      { word: 'bớt', code: 'b3S' },
      { word: 'yêu', code: 'z30' }
    ],
    story: 'Năng suất gia <em>tăng</em> kết <em>hợp</em> lòng kiên <em>quyết</em>, lúc hội <em>gặp</em> hãy <em>bớt</em> lo âu để trọn vẹn tình <em>yêu</em>!'
  },
  {
    category: 'number',
    lower: '4',
    upper: '5',
    lowerIdx: 35,
    upperIdx: 36,
    lowerPhrase: 'mặt ➔ hoen ➔ rượu',
    upperPhrase: 'cầu ➔ khoác ➔ buồm',
    lowerRhymes: ["ăt","oen","ươu"],
    upperRhymes: ["âu","oac","uôm"],
    samples: [
      { word: 'mặt', code: 'm4j' },
      { word: 'hoen', code: 'h4Z' },
      { word: 'rượu', code: 'r45' },
      { word: 'cầu', code: 'c5f' },
      { word: 'khoác', code: 'K5S' },
      { word: 'buồm', code: 'b52' }
    ],
    story: 'Nước mắt ướt <em>mặt</em> làm <em>hoen</em> chén ly <em>rượu</em>, bước qua chiếc <em>cầu</em> vai <em>khoác</em> túi giong cánh <em>buồm</em> ra khơi!'
  },
  {
    category: 'number',
    lower: '6',
    upper: '7',
    lowerIdx: 37,
    upperIdx: 38,
    lowerPhrase: 'giấc ➔ hoạch ➔ thuở',
    upperPhrase: 'nhân ➔ ngoạm ➔ khuâng',
    lowerRhymes: ["âc","oach","uơ"],
    upperRhymes: ["ân","oam","uâng"],
    samples: [
      { word: 'giấc', code: 'j6s' },
      { word: 'hoạch', code: 'h6J' },
      { word: 'thuở', code: 'T63' },
      { word: 'nhân', code: 'H7z' },
      { word: 'ngoạm', code: 'N7J' },
      { word: 'khuâng', code: 'K70' }
    ],
    story: 'Tỉnh cơn mê <em>giấc</em> hoàn thành kế <em>hoạch</em> nhớ <em>thuở</em> xưa, bao lớp tiền <em>nhân</em> há miệng <em>ngoạm</em> mồi lòng bâng <em>khuâng</em>!'
  },
  {
    category: 'number',
    lower: '8',
    upper: '9',
    lowerIdx: 39,
    upperIdx: 40,
    lowerPhrase: 'tầng ➔ khoảng ➔ khuấy',
    upperPhrase: 'đất ➔ doanh ➔ khuếch',
    lowerRhymes: ["âng","oang","uây"],
    upperRhymes: ["ât","oanh","uêch"],
    samples: [
      { word: 'tầng', code: 't8f' },
      { word: 'khoảng', code: 'K8R' },
      { word: 'khuấy', code: 'K81' },
      { word: 'đất', code: 'd9s' },
      { word: 'doanh', code: 'D9Z' },
      { word: 'khuếch', code: 'K91' }
    ],
    story: 'Lên trên các <em>tầng</em> đo <em>khoảng</em> cách tay <em>khuấy</em> trà, trên mảnh <em>đất</em> kinh <em>doanh</em> ngày càng <em>khuếch</em> trương phát đạt!'
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
