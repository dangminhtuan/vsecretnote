const KEY_NEIGHBORS = {
      't': {
        top_left: { rhyme: '-oan', word: 'toan' },
        top: { rhyme: '-iên', word: 'tiên' },
        top_right: { rhyme: '-iêt', word: 'tiêt' },       // -iêt phổ biến kết hợp với t (tiết, tiệt). Tuyệt đối KHÔNG có tr ở t!
        left: { rhyme: 'Th', word: 'th', type: 'cons' },  // Phụ âm Th (mã Base60 T hoa)
        right: { rhyme: '-ay', word: 'tay' },
        bottom_left: { rhyme: '-at', word: 'tat' },
        bottom: { rhyme: '-ang', word: 'tang' },
        bottom_right: { rhyme: '-an', word: 'tan' }
      },
      'c': {
        top_left: { rhyme: '-oa', word: 'coa' },
        top: { rhyme: '-anh', word: 'canh' },
        top_right: { rhyme: '-uông', word: 'cuông' },
        left: { rhyme: 'Ch', word: 'ch', type: 'cons' },  // Phụ âm Ch (mã Base60 C hoa)
        right: { rhyme: '-ao', word: 'cao' },
        bottom_left: { rhyme: '-am', word: 'cam' },
        bottom: { rhyme: '-on', word: 'con' },
        bottom_right: { rhyme: '-ai', word: 'cai' }
      },
      'n': {
        top_left: { rhyme: '-ơi', word: 'nơi' },
        top: { rhyme: '-ăm', word: 'năm' },
        top_right: { rhyme: '-iêu', word: 'niêu' },
        left: { rhyme: 'Ng', word: 'ng', type: 'cons' },  // Phụ âm Ng (mã Base60 N hoa)
        right: { rhyme: '-ao', word: 'nao' },
        bottom_left: { rhyme: '-an', word: 'nan' },
        bottom: { rhyme: '-ang', word: 'nang' },
        bottom_right: { rhyme: '-ay', word: 'nay' }
      },
      'd': {
        top_left: { rhyme: '-ươc', word: 'được' },
        top: { rhyme: '-âu', word: 'dâu' },
        top_right: { rhyme: '-ân', word: 'dân' },
        left: { rhyme: 'đ', word: 'đ', type: 'cons' },
        right: { rhyme: '-i', word: 'di' },
        bottom_left: { rhyme: '-ay', word: 'day' },
        bottom: { rhyme: '-ông', word: 'dông' },
        bottom_right: { rhyme: '-ang', word: 'dang' }
      },
      'k': {
        top_left: { rhyme: '-ia', word: 'kia' },
        top: { rhyme: '-iên', word: 'kiên' },
        top_right: { rhyme: '-inh', word: 'kinh' },
        left: { rhyme: 'Kh', word: 'kh', type: 'cons' },  // Phụ âm Kh (mã Base60 K hoa)
        right: { rhyme: '-eo', word: 'keo' },
        bottom_left: { rhyme: '-im', word: 'kim' },
        bottom: { rhyme: '-in', word: 'kin' },
        bottom_right: { rhyme: '-em', word: 'kem' }
      },
      'g': {
        top_left: { rhyme: '-ưa', word: 'gưa' },
        top: { rhyme: '-iêp', word: 'giêp' },
        top_right: { rhyme: '-ang', word: 'gang' },
        left: { rhyme: 'Gh', word: 'gh', type: 'cons' },  // Phụ âm Gh (mã Base60 G hoa)
        right: { rhyme: 'gi', word: 'gi', type: 'cons' }, // Phụ âm gi (mã Base60 j)
        bottom_left: { rhyme: '-an', word: 'gan' },
        bottom: { rhyme: '-ay', word: 'gay' },
        bottom_right: { rhyme: '-ao', word: 'gao' }
      },
      'p': {
        top_left: { rhyme: '-o', word: 'po' },
        top: { rhyme: '-a', word: 'pa' },
        top_right: { rhyme: '-i', word: 'pi' },
        left: { rhyme: 'Ph', word: 'ph', type: 'cons' },  // Phụ âm Ph (mã Base60 f)
        right: { rhyme: '-u', word: 'pu' },
        bottom_left: { rhyme: '-ê', word: 'pê' },
        bottom_right: { rhyme: '-en', word: 'pen' },
        bottom: { rhyme: '-on', word: 'pon' }
      },
      'b': {
        top_left: { rhyme: '-iêt', word: 'biết' },
        top: { rhyme: '-ang', word: 'bang' },
        top_right: { rhyme: '-uôi', word: 'buôi' },
        left: { rhyme: '-ai', word: 'bai' },
        right: { rhyme: '-ay', word: 'bay' },
        bottom_left: { rhyme: '-an', word: 'ban' },
        bottom: { rhyme: '-a', word: 'ba' },
        bottom_right: { rhyme: '-ao', word: 'bao' }
      },
      'm': {
        top_left: { rhyme: '-ua', word: 'mua' },
        top: { rhyme: '-inh', word: 'minh' },
        top_right: { rhyme: '-uôn', word: 'muôn' },
        left: { rhyme: '-ơi', word: 'mơi' },
        right: { rhyme: '-ay', word: 'may' },
        bottom_left: { rhyme: '-ang', word: 'mang' },
        bottom: { rhyme: '-a', word: 'ma' },
        bottom_right: { rhyme: '-an', word: 'man' }
      },
      'h': {
        top_left: { rhyme: '-oa', word: 'hoa' },
        top: { rhyme: '-iêu', word: 'hiêu' },
        top_right: { rhyme: '-ương', word: 'hương' },
        left: { rhyme: 'Nh', word: 'nh', type: 'cons' },  // Phụ âm Nh (mã Base60 H hoa)
        right: { rhyme: '-ay', word: 'hay' },
        bottom_left: { rhyme: '-ang', word: 'hang' },
        bottom: { rhyme: '-a', word: 'ha' },
        bottom_right: { rhyme: '-an', word: 'han' }
      },
      'l': {
        top_left: { rhyme: '-oan', word: 'loan' },
        top: { rhyme: '-iên', word: 'liên' },
        top_right: { rhyme: '-ươn', word: 'lươn' },
        left: { rhyme: '-ai', word: 'lai' },
        right: { rhyme: '-ay', word: 'lay' },
        bottom_left: { rhyme: '-ang', word: 'lang' },
        bottom: { rhyme: '-a', word: 'la' },
        bottom_right: { rhyme: '-an', word: 'lan' }
      },
      'v': {
        top_left: { rhyme: '-iên', word: 'viên' },
        top: { rhyme: '-ươn', word: 'vươn' },
        top_right: { rhyme: '-ang', word: 'vang' },
        left: { rhyme: '-ay', word: 'vay' },
        right: { rhyme: '-i', word: 'vi' },
        bottom_left: { rhyme: '-a', word: 'va' },
        bottom: { rhyme: '-an', word: 'van' },
        bottom_right: { rhyme: '-ao', word: 'vao' }
      },

      // PHÍM 'y': CHỈ MANG CÁC VẦN ĐỘC LẬP GỐC Y (-YÊU, -YÊN, -YÊM, -YẾT...)
      // TUYỆT ĐỐI KHÔNG CÓ -ÊU Ở ĐÂY!
      'y': {
        top_left: { rhyme: '-yêu', word: 'yêu' },
        top: { rhyme: '-yêm', word: 'yêm' },
        top_right: { rhyme: '-yêt', word: 'yêt' },
        left: { rhyme: '-ya', word: 'ya' },
        right: { rhyme: '-yu', word: 'yu' },
        bottom_left: { rhyme: '-yên', word: 'yên' },
        bottom: { rhyme: '-yê', word: 'yê' },
        bottom_right: { rhyme: '-yêp', word: 'yêp' }
      },

      // PHÍM 'e': NƠI QUY TỤ VẦN -ÊU (MÃ BASE60 'U' HOA) CHO K, L, Đ, N, R...
      'e': {
        top_left: { rhyme: '-en', word: 'en' },
        top: { rhyme: '-em', word: 'em' },
        top_right: { rhyme: '-et', word: 'et' },
        left: { rhyme: '-ec', word: 'ec' },
        right: { rhyme: '-êu', word: 'êu' },     // Vần -ÊU chuẩn xác ở đây!
        bottom_left: { rhyme: '-eo', word: 'eo' },
        bottom: { rhyme: '-ep', word: 'ep' },
        bottom_right: { rhyme: '-ech', word: 'ech' }
      },

      'a': {
        top_left: { rhyme: '-ai', word: 'ai' },
        top: { rhyme: '-an', word: 'an' },
        top_right: { rhyme: '-ang', word: 'ang' },
        left: { rhyme: '-at', word: 'at' },
        right: { rhyme: '-ac', word: 'ac' },
        bottom_left: { rhyme: '-am', word: 'am' },
        bottom: { rhyme: '-ap', word: 'ap' },
        bottom_right: { rhyme: '-ao', word: 'ao' }
      },
      'i': {
        top_left: { rhyme: '-in', word: 'in' },
        top: { rhyme: '-im', word: 'im' },
        top_right: { rhyme: '-it', word: 'it' },
        left: { rhyme: '-ich', word: 'ich' },
        right: { rhyme: '-inh', word: 'inh' },
        bottom_left: { rhyme: '-iu', word: 'iu' },
        bottom: { rhyme: '-ip', word: 'ip' },
        bottom_right: { rhyme: '-ia', word: 'ia' }
      },
      'o': {
        top_left: { rhyme: '-oan', word: 'oan' },
        top: { rhyme: '-oang', word: 'oang' },
        top_right: { rhyme: '-oat', word: 'oat' },
        left: { rhyme: '-oa', word: 'oa' },
        right: { rhyme: '-oi', word: 'oi' },
        bottom_left: { rhyme: '-ong', word: 'ong' },
        bottom: { rhyme: '-oc', word: 'oc' },
        bottom_right: { rhyme: '-om', word: 'om' }
      },
      'u': {
        top_left: { rhyme: '-ua', word: 'ua' },
        top: { rhyme: '-uô', word: 'uô' },
        top_right: { rhyme: '-uơ', word: 'uơ' },
        left: { rhyme: '-ui', word: 'ui' },
        right: { rhyme: '-uy', word: 'uy' },
        bottom_left: { rhyme: '-ung', word: 'ung' },
        bottom: { rhyme: '-uc', word: 'uc' },
        bottom_right: { rhyme: '-ut', word: 'ut' }
      },

      // PHÍM 'w': NGUYÊN ÂM 'ư' (BASE60 'w' BẢNG 1) - QUẢN LÝ TOÀN BỘ VẦN HỌ 'ư'
      'w': {
        top_left: { rhyme: '-ươu', word: 'rượu' },
        top: { rhyme: '-ương', word: 'hương' },
        top_right: { rhyme: '-ươn', word: 'vươn' },
        left: { rhyme: '-ưa', word: 'mưa' },
        right: { rhyme: '-ưu', word: 'lưu' },
        bottom_left: { rhyme: '-ươi', word: 'tươi' },
        bottom: { rhyme: '-ư', word: 'từ' },
        bottom_right: { rhyme: '-ưng', word: 'rừng' }
      },

      // PHÍM 'q': PHỤ ÂM 'qu' (BASE60 'q') - QUẢN LÝ CÁC TỪ VÀ VẦN GỐC 'qu'
      'q': {
        top_left: { rhyme: '-uyên', word: 'khuyên' },
        top: { rhyme: '-ua', word: 'qua' },
        top_right: { rhyme: '-uê', word: 'quê' },
        left: { rhyme: '-uyêt', word: 'quyết' },
        right: { rhyme: 'Qu', word: 'qu', type: 'cons' }, // Phụ âm Qu (mã Base60 q)
        bottom_left: { rhyme: '-uy', word: 'quy' },
        bottom: { rhyme: '-a', word: 'quá' },
        bottom_right: { rhyme: '-an', word: 'quan' }
      },

      's': {
        top_left: { rhyme: '-ôi', word: 'sôi' },
        top: { rhyme: '-ư', word: 'sư' },
        top_right: { rhyme: '-e', word: 'se' },
        left: { rhyme: '-a', word: 'sa' },
        right: { rhyme: '-ương', word: 'sương' }, // Vần -ƯƠNG cốt lõi B1 (Base60 's') ➔ sss = sướng!
        bottom_left: { rhyme: '-i', word: 'si' },
        bottom: { rhyme: '-u', word: 'su' },
        bottom_right: { rhyme: '-on', word: 'son' }
      },
      'f': {
        top_left: { rhyme: '-an', word: 'fan' },
        top: { rhyme: '-i', word: 'fi' },
        top_right: { rhyme: '-o', word: 'fo' },
        left: { rhyme: '-u', word: 'fu' },
        right: { rhyme: '-e', word: 'fe' },
        bottom_left: { rhyme: '-ay', word: 'fay' },
        bottom: { rhyme: '-at', word: 'fat' },
        bottom_right: { rhyme: '-am', word: 'fam' }
      },
      'r': {
        top_left: { rhyme: '-a', word: 'ra' },
        top: { rhyme: '-i', word: 'ri' },
        top_right: { rhyme: '-u', word: 'ru' },
        left: { rhyme: 'Tr', word: 'tr', type: 'cons' },  // Phụ âm Tr (mã Base60 R hoa)!
        right: { rhyme: '-e', word: 're' },
        bottom_left: { rhyme: '-ay', word: 'ray' },
        bottom: { rhyme: '-ang', word: 'rang' },
        bottom_right: { rhyme: '-on', word: 'ron' }
      },
      'x': {
        top_left: { rhyme: '-a', word: 'xa' },
        top: { rhyme: '-e', word: 'xe' },
        top_right: { rhyme: '-i', word: 'xi' },
        left: { rhyme: '-o', word: 'xo' },
        right: { rhyme: '-u', word: 'xu' },
        bottom_left: { rhyme: '-ay', word: 'xay' },
        bottom: { rhyme: '-ang', word: 'xang' },
        bottom_right: { rhyme: '-an', word: 'xan' }
      },
      'j': {
        top_left: { rhyme: '-a', word: 'ja' },
        top: { rhyme: '-i', word: 'ji' },
        top_right: { rhyme: '-u', word: 'ju' },
        left: { rhyme: '-o', word: 'jo' },
        right: { rhyme: '-e', word: 'je' },
        bottom_left: { rhyme: '-ay', word: 'jay' },
        bottom: { rhyme: '-an', word: 'jan' },
        bottom_right: { rhyme: '-ang', word: 'jang' }
      },
      'z': {
        top_left: { rhyme: '-a', word: 'za' },
        top: { rhyme: '-i', word: 'zi' },
        top_right: { rhyme: '-u', word: 'zu' },
        left: { rhyme: '-o', word: 'zo' },
        right: { rhyme: '-e', word: 'ze' },
        bottom_left: { rhyme: '-ay', word: 'zay' },
        bottom: { rhyme: '-an', word: 'zan' },
        bottom_right: { rhyme: '-ang', word: 'zang' }
      },

      '0': {
        left: { rhyme: '9', word: '0' },
        right: { rhyme: '000', word: '0' },
        bottom_left: { rhyme: '-o', word: 'o' },
        bottom: { rhyme: '-ô', word: 'ô' },
        bottom_right: { rhyme: '-p', word: 'p' }
      },
      '1': {
        left: { rhyme: ':', word: '1' },
        right: { rhyme: '2', word: '1' },
        bottom_left: { rhyme: '❖', word: '1' },
        bottom: { rhyme: '-q', word: 'q' },
        bottom_right: { rhyme: '-w', word: 'w' }
      },
      '2': {
        left: { rhyme: '1', word: '2' },
        right: { rhyme: '3', word: '2' },
        bottom_left: { rhyme: '-q', word: 'q' },
        bottom: { rhyme: '-w', word: 'w' },
        bottom_right: { rhyme: '-e', word: 'e' }
      },
      '3': {
        left: { rhyme: '2', word: '3' },
        right: { rhyme: '4', word: '3' },
        bottom_left: { rhyme: '-w', word: 'w' },
        bottom: { rhyme: '-e', word: 'e' },
        bottom_right: { rhyme: '-r', word: 'r' }
      },
      '4': {
        left: { rhyme: '3', word: '4' },
        right: { rhyme: '5', word: '4' },
        bottom_left: { rhyme: '-e', word: 'e' },
        bottom: { rhyme: '-r', word: 'r' },
        bottom_right: { rhyme: '-t', word: 't' }
      },
      '5': {
        left: { rhyme: '4', word: '5' },
        right: { rhyme: '6', word: '5' },
        bottom_left: { rhyme: '-r', word: 'r' },
        bottom: { rhyme: '-t', word: 't' },
        bottom_right: { rhyme: '-y', word: 'y' }
      }
    };

    // Từ điển dự đoán không dấu ➔ có dấu
    
module.exports = { KEY_NEIGHBORS };