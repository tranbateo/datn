export interface GradeTopicRule {
  subject: string;
  minGrade: number;
  label: string;
  keywords?: string[];
  patterns?: RegExp[];
}

/**
 * Bảng ánh xạ các chuyên đề kiến thức theo Khối lớp tối thiểu của Chương trình GDPT 2018
 * (Bộ sách Kết nối tri thức với cuộc sống — áp dụng cho tất cả các môn và các khối 6–12).
 * Dùng để chặn triệt để tình trạng học sinh lớp dưới hỏi bài vượt cấp lớp trên (BR-RAG-001).
 */
export const GDPT_2018_GRADE_TOPIC_RULES: GradeTopicRule[] = [
  // =========================================================================
  // MÔN TOÁN (Lớp 7, 8, 9, THPT 10-12)
  // =========================================================================
  {
    subject: 'Toán',
    minGrade: 12,
    label: 'Giải tích & Hình học Oxyz (Toán 12)',
    keywords: [
      'nguyên hàm',
      'tích phân',
      'số phức',
      'khảo sát hàm số',
      'cực trị hàm số',
      'đường tiệm cận',
      'tiệm cận đứng',
      'tiệm cận ngang',
      'phương trình mặt phẳng',
      'phương trình mặt cầu',
      'không gian oxyz',
    ],
    patterns: [/\\int\b/i],
  },
  {
    subject: 'Toán',
    minGrade: 11,
    label: 'Giới hạn, Đạo hàm, Lôgarit & Cấp số (Toán 11)',
    keywords: [
      'đạo hàm',
      'giới hạn dãy số',
      'giới hạn hàm số',
      'hàm số liên tục',
      'cấp số cộng',
      'cấp số nhân',
      'phương trình lượng giác',
      'hàm số lượng giác',
      'hàm số mũ',
      'hàm số lôgarit',
      'logarit',
      'lôgarit',
      'logarithm',
    ],
    patterns: [/\\lim\b/i, /\\log\b/i, /f'\s*\(/i],
  },
  {
    subject: 'Toán',
    minGrade: 10,
    label: 'Vectơ, Bất phương trình bậc hai & Tổ hợp (Toán 10)',
    keywords: [
      'vectơ',
      'vector',
      'tích vô hướng',
      'bất phương trình bậc hai',
      'tam thức bậc hai',
      'định lí côsin',
      'định lý côsin',
      'định lí cosin',
      'định lí sin',
      'phương trình đường tròn',
      'elip',
      'hypebol',
      'tổ hợp',
      'chỉnh hợp',
      'hoán vị',
      'nhị thức newton',
    ],
  },
  {
    subject: 'Toán',
    minGrade: 9,
    label:
      'Hệ phương trình, Phương trình bậc hai, Căn thức & Lượng giác (Toán 9)',
    keywords: [
      'hệ phương trình',
      'hệ hai phương trình',
      'phương trình bậc nhất hai ẩn',
      'phương trình bậc hai',
      'công thức nghiệm',
      'biệt thức delta',
      'định lý vi-ét',
      'định lí vi-ét',
      'định lí viète',
      'định lý viète',
      'hệ thức vi-ét',
      'hệ thức viète',
      'vi-ét',
      'viète',
      'bất phương trình bậc nhất',
      'căn thức bậc hai',
      'căn bậc ba',
      'trục căn thức',
      'parabol',
      'tỉ số lượng giác',
      'góc nội tiếp',
      'tứ giác nội tiếp',
      'đường tròn ngoại tiếp',
      'đường tròn nội tiếp',
      'hình trụ',
      'hình nón',
      'hình cầu',
    ],
    patterns: [
      /\\begin\{cases\}/i,
      /\d*\s*x\s*[+-]\s*\d*\s*y\s*=/i,
      /\d*\s*y\s*[+-]\s*\d*\s*x\s*=/i,
      /\\(sin|cos|tan|cot)\b/i,
      /\b(sin|cos|tan|cot)\s*\(/i,
      /\by\s*=\s*-?\d*x(?:\^2|²)/i,
    ],
  },
  {
    subject: 'Toán',
    minGrade: 8,
    label:
      'Hằng đẳng thức, Phân thức, Hàm số bậc nhất, Thalès & Pythagore (Toán 8)',
    keywords: [
      'đa thức nhiều biến',
      'hằng đẳng thức',
      'phân tích đa thức thành nhân tử',
      'phân thức đại số',
      'phương trình bậc nhất một ẩn',
      'hàm số bậc nhất',
      'hệ số góc',
      'định lí thalès',
      'định lý thalès',
      'định lý thales',
      'định lý talet',
      'định lí pythagore',
      'định lý pythagore',
      'định lý pytago',
      'pytago',
      'tam giác đồng dạng',
      'đường trung bình của tam giác',
      'hình chóp tam giác đều',
      'hình chóp tứ giác đều',
    ],
    patterns: [/\d*x(?:\^2|²)\s*[+-]\s*\d*x\s*[+-]?\s*\d*\s*=/i],
  },
  {
    subject: 'Toán',
    minGrade: 7,
    label:
      'Số hữu tỉ, Số thực, Tỉ lệ thức, Đa thức & Tam giác bằng nhau (Toán 7)',
    keywords: [
      'số hữu tỉ',
      'số vô tỉ',
      'số thực',
      'căn bậc hai số học',
      'tỉ lệ thức',
      'dãy tỉ số bằng nhau',
      'đại lượng tỉ lệ thuận',
      'đại lượng tỉ lệ nghịch',
      'đa thức một biến',
      'nghiệm của đa thức',
      'tam giác bằng nhau',
      'đường trung trực',
      'đường trung tuyến',
      'trọng tâm tam giác',
      'trực tâm',
      'hình lăng trụ đứng',
      'góc so le trong',
      'góc đồng vị',
    ],
  },

  // =========================================================================
  // MÔN KHOA HỌC TỰ NHIÊN (Vật lí, Hóa học, Sinh học — Lớp 7, 8, 9, THPT)
  // =========================================================================
  {
    subject: 'Khoa học tự nhiên',
    minGrade: 10,
    label: 'Vật lí / Hóa học / Sinh học THPT (Lớp 10–12)',
    keywords: [
      'chuyển động thẳng biến đổi đều',
      'rơi tự do',
      'định luật newton',
      'động lượng',
      'cấu hình electron',
      'orbital',
      'phản ứng oxi hóa khử',
      'enthalpy',
      'cân bằng hóa học',
      'sự điện li',
      'dao động điều hòa',
      'giao thoa sóng',
      'sóng điện từ',
      'phản ứng hạt nhân',
      'phóng xạ',
    ],
  },
  {
    subject: 'Khoa học tự nhiên',
    minGrade: 9,
    label: 'Điện học, Quang học, Hóa hữu cơ & Di truyền (KHTN 9)',
    keywords: [
      'định luật ohm',
      'định luật ôm',
      'điện trở',
      'biến trở',
      'công suất điện',
      'định luật joule',
      'cảm ứng điện từ',
      'dòng điện xoay chiều',
      'khúc xạ ánh sáng',
      'tán sắc ánh sáng',
      'thấu kính hội tụ',
      'thấu kính phân kì',
      'động năng',
      'thế năng',
      'cơ năng',
      'dãy hoạt động hóa học',
      'hợp chất hữu cơ',
      'alkane',
      'ankan',
      'alkene',
      'anken',
      'ethylic alcohol',
      'rượu etylic',
      'acetic acid',
      'axit axetic',
      'carbohydrate',
      'polymer',
      'polime',
      'di truyền',
      'quy luật mendel',
      'menđen',
      'phân tử dna',
      'phân tử adn',
      'liên kết hydrogen',
      'nhiễm sắc thể',
      'nguyên phân',
      'giảm phân',
      'đột biến gen',
      'tiến hóa',
    ],
  },
  {
    subject: 'Khoa học tự nhiên',
    minGrade: 8,
    label:
      'Phản ứng hóa học, Mol, Acid/Base, Áp suất & Sinh học người (KHTN 8)',
    keywords: [
      'phản ứng hóa học',
      'phương trình hóa học',
      'định luật bảo toàn khối lượng',
      'số mol',
      'khối lượng mol',
      'tỉ khối của chất khí',
      'nồng độ phần trăm',
      'nồng độ mol',
      'tốc độ phản ứng',
      'axit',
      'acid',
      'bazơ',
      'base',
      'thang ph',
      'oxide',
      'oxit',
      'khối lượng riêng',
      'áp suất',
      'lực đẩy archimedes',
      'lực đẩy ác-si-mét',
      'moment lực',
      'mômen lực',
      'đòn bẩy',
      'cường độ dòng điện',
      'hiệu điện thế',
      'hệ tiêu hóa',
      'hệ tuần hoàn',
      'hệ hô hấp',
      'hệ bài tiết',
      'hệ thần kinh',
      'hệ nội tiết',
      'quần thể sinh vật',
      'quần xã sinh vật',
    ],
  },
  {
    subject: 'Khoa học tự nhiên',
    minGrade: 7,
    label: 'Nguyên tử, Bảng tuần hoàn, Tốc độ, Sóng âm & Quang học (KHTN 7)',
    keywords: [
      'nguyên tử',
      'nguyên tố hóa học',
      'bảng tuần hoàn',
      'phân tử',
      'đơn chất',
      'hợp chất',
      'hóa trị',
      'liên kết ion',
      'liên kết cộng hóa trị',
      'đồ thị quãng đường',
      'sóng âm',
      'tần số âm',
      'phản xạ ánh sáng',
      'từ trường',
      'nam châm điện',
      'quang hợp',
      'hô hấp tế bào',
    ],
  },

  // =========================================================================
  // MÔN TIẾNG ANH (Lớp 7, 8, 9, THPT)
  // =========================================================================
  {
    subject: 'Tiếng Anh',
    minGrade: 10,
    label: 'Ngữ pháp nâng cao THPT / IELTS (Tiếng Anh 10–12)',
    keywords: [
      'đảo ngữ',
      'inversion',
      'câu chẻ',
      'cleft sentence',
      'mệnh đề phân từ',
      'ielts',
      'toeic',
    ],
  },
  {
    subject: 'Tiếng Anh',
    minGrade: 9,
    label:
      'Câu điều kiện loại 2/3, Mệnh đề quan hệ, Câu ước Wish & Quá khứ hoàn thành (Tiếng Anh 9)',
    keywords: [
      'câu điều kiện loại 2',
      'second conditional',
      'câu điều kiện loại 3',
      'third conditional',
      'mệnh đề quan hệ',
      'relative clause',
      'câu ước',
      'past perfect',
      'thì quá khứ hoàn thành',
      'phrasal verb',
    ],
  },
  {
    subject: 'Tiếng Anh',
    minGrade: 8,
    label: 'Quá khứ tiếp diễn, Câu tường thuật & Câu bị động (Tiếng Anh 8)',
    keywords: [
      'past continuous',
      'thì quá khứ tiếp diễn',
      'câu tường thuật',
      'reported speech',
      'câu bị động',
      'passive voice',
    ],
  },
  {
    subject: 'Tiếng Anh',
    minGrade: 7,
    label: 'Thì quá khứ đơn, Used to & Hiện tại hoàn thành (Tiếng Anh 7)',
    keywords: [
      'past simple',
      'thì quá khứ đơn',
      'present perfect',
      'thì hiện tại hoàn thành',
      'cấu trúc used to',
    ],
  },

  // =========================================================================
  // MÔN NGỮ VĂN (Lớp 7, 8, 9, THPT)
  // =========================================================================
  {
    subject: 'Ngữ văn',
    minGrade: 10,
    label: 'Tác phẩm văn học THPT (Ngữ văn 10–12)',
    keywords: [
      'chí phèo',
      'vợ nhặt',
      'vợ chồng a phủ',
      'rừng xà nu',
      'chiếc thuyền ngoài xa',
      'tây tiến',
      'việt bắc',
      'sóng xuân quỳnh',
      'người lái đò sông đà',
      'ai đã đặt tên cho dòng sông',
    ],
  },
  {
    subject: 'Ngữ văn',
    minGrade: 9,
    label: 'Truyện Kiều, Vũ Nương, Chiếc lược ngà & Thơ hiện đại (Ngữ văn 9)',
    keywords: [
      'chuyện người con gái nam xương',
      'vũ nương',
      'truyện kiều',
      'chị em thúy kiều',
      'kiều ở lầu ngưng bích',
      'lục vân tiên',
      'lặng lẽ sa pa',
      'chiếc lược ngà',
      'tiểu đội xe không kính',
      'mùa xuân nho nhỏ',
      'viếng lăng bác',
    ],
  },
  {
    subject: 'Ngữ văn',
    minGrade: 8,
    label: 'Lão Hạc, Tắt đèn, Chiếu dời đô & Hịch tướng sĩ (Ngữ văn 8)',
    keywords: [
      'lá cờ thêu sáu chữ vàng',
      'quang trung đại phá quân thanh',
      'lão hạc',
      'tắt đèn',
      'chị dậu',
      'chiếu dời đô',
      'hịch tướng sĩ',
      'nước đại việt ta',
      'bình ngô đại cáo',
      'bếp lửa',
    ],
  },
  {
    subject: 'Ngữ văn',
    minGrade: 7,
    label: 'Bầy chim chìa vôi, Đi lấy mật & Truyện ngụ ngôn (Ngữ văn 7)',
    keywords: [
      'bầy chim chìa vôi',
      'đi lấy mật',
      'vừa nhắm mắt vừa mở cửa sổ',
      'đồng dao mùa xuân',
      'gặp lá cơm nếp',
      'người thầy đầu tiên',
      'đẽo cày giữa đường',
    ],
  },

  // =========================================================================
  // MÔN LỊCH SỬ VÀ ĐỊA LÍ (Lớp 7, 8, 9)
  // =========================================================================
  {
    subject: 'Lịch sử và Địa lí',
    minGrade: 9,
    label:
      'Thế chiến II, Cách mạng tháng Tám, Điện Biên Phủ & Đổi mới (Sử-Địa 9)',
    keywords: [
      'chiến tranh thế giới thứ hai',
      'chiến tranh lạnh',
      'cách mạng tháng tám',
      'chiến dịch điện biên phủ',
      'kháng chiến chống pháp',
      'kháng chiến chống mỹ',
      'chiến dịch hồ chí minh',
      'công cuộc đổi mới',
    ],
  },
  {
    subject: 'Lịch sử và Địa lí',
    minGrade: 8,
    label: 'Cách mạng tư sản, Tây Sơn, Nhà Nguyễn & Địa lí Việt Nam (Sử-Địa 8)',
    keywords: [
      'cách mạng tư sản',
      'cách mạng công nghiệp',
      'trịnh nguyễn phân tranh',
      'phong trào tây sơn',
      'nhà nguyễn',
      'phong trào cần vương',
      'chiến tranh thế giới thứ nhất',
      'cách mạng tháng mười nga',
      'địa lí việt nam',
    ],
  },
  {
    subject: 'Lịch sử và Địa lí',
    minGrade: 7,
    label: 'Lịch sử Lý – Trần – Lê sơ & Địa lí các châu lục (Sử-Địa 7)',
    keywords: [
      'phong kiến châu âu',
      'phát kiến địa lí',
      'văn hóa phục hưng',
      'nhà lý',
      'nhà trần',
      'kháng chiến chống mông nguyên',
      'khởi nghĩa lam sơn',
      'nhà lê sơ',
    ],
  },

  // =========================================================================
  // MÔN TIN HỌC, CÔNG NGHỆ, GDCD (Lớp 7, 8, 9, THPT)
  // =========================================================================
  {
    subject: 'Tin học',
    minGrade: 10,
    label: 'Lập trình Python / C++ / SQL / Web (Tin học THPT)',
    keywords: [
      'python',
      'c++',
      'java',
      'html',
      'css',
      'sql',
      'trí tuệ nhân tạo',
    ],
  },
  {
    subject: 'Tin học',
    minGrade: 9,
    label: 'Bảng tính nâng cao COUNTIF/SUMIF & Cơ sở dữ liệu (Tin học 9)',
    keywords: ['countif', 'sumif', 'cơ sở dữ liệu', 'hàm if lồng nhau'],
  },
  {
    subject: 'Tin học',
    minGrade: 8,
    label:
      'Lập trình trực quan Scratch nâng cao — Biến, Rẽ nhánh & Vòng lặp (Tin học 8)',
    keywords: ['cấu trúc rẽ nhánh', 'cấu trúc lặp', 'biến và hằng'],
  },
  {
    subject: 'Tin học',
    minGrade: 7,
    label: 'Bảng tính điện tử Excel & Thuật toán tìm kiếm/sắp xếp (Tin học 7)',
    keywords: [
      'bảng tính điện tử',
      'excel',
      'hàm sum',
      'hàm average',
      'tìm kiếm nhị phân',
      'tìm kiếm tuần tự',
      'thuật toán sắp xếp',
    ],
  },
  {
    subject: 'Công nghệ',
    minGrade: 9,
    label: 'Lắp đặt mạng điện trong nhà & Mạch điện cầu thang (Công nghệ 9)',
    keywords: [
      'mạng điện trong nhà',
      'mạch điện cầu thang',
      'tiết diện dây dẫn',
      'lắp đặt mạng điện',
    ],
  },
  {
    subject: 'Công nghệ',
    minGrade: 8,
    label: 'Bản vẽ kỹ thuật, Gia công cơ khí & An toàn điện (Công nghệ 8)',
    keywords: [
      'bản vẽ kỹ thuật',
      'hình chiếu vuông góc',
      'gia công cơ khí',
      'an toàn điện',
      'mạch điện điều khiển',
    ],
  },
  {
    subject: 'Công nghệ',
    minGrade: 7,
    label: 'Trồng trọt, Chăn nuôi, Lâm nghiệp & Thủy sản (Công nghệ 7)',
    keywords: ['trồng trọt', 'chăn nuôi', 'lâm nghiệp', 'thủy sản'],
  },
  {
    subject: 'Giáo dục công dân',
    minGrade: 9,
    label: 'Quyền kinh doanh, Thuế, Lao động & Trách nhiệm pháp lí (GDCD 9)',
    keywords: [
      'tự do kinh doanh',
      'nghĩa vụ đóng thuế',
      'quyền và nghĩa vụ lao động',
      'trách nhiệm pháp lí',
      'vi phạm pháp luật',
    ],
  },
  {
    subject: 'Giáo dục công dân',
    minGrade: 8,
    label: 'Phòng ngừa tai nạn vũ khí & Bảo vệ tài nguyên môi trường (GDCD 8)',
    keywords: ['tai nạn vũ khí', 'cháy nổ', 'lập kế hoạch chi tiêu'],
  },
  {
    subject: 'Giáo dục công dân',
    minGrade: 7,
    label: 'Phòng chống tệ nạn xã hội & Bạo lực học đường (GDCD 7)',
    keywords: ['tệ nạn xã hội', 'bạo lực học đường', 'quản lí tiền'],
  },
];

export interface OutOfGradeDetectionResult {
  isOutOfGrade: boolean;
  targetGrade?: number;
  topicLabel?: string;
  reason?: string;
}

/**
 * Kiểm tra câu hỏi có vượt cấp hoặc nhắc đích danh khối lớp khác khối học của học sinh không.
 */
export function detectOutOfGradeQuery(
  studentGrade: number | null | undefined,
  subjectName: string | null | undefined,
  query: string,
): OutOfGradeDetectionResult {
  if (
    typeof studentGrade !== 'number' ||
    studentGrade < 1 ||
    studentGrade > 12
  ) {
    return { isOutOfGrade: false };
  }

  const q = query.toLowerCase();

  // 1. Kiểm tra học sinh có nhắc đích danh khối/lớp khác không (VD: HS lớp 6 hỏi "toán lớp 9")
  const gradeMatches = Array.from(
    q.matchAll(/\b(?:lớp|khối)\s*(1[0-2]|[1-9])\b/gi),
  ).map((m) => Number(m[1]));

  if (gradeMatches.length > 0 && !gradeMatches.includes(studentGrade)) {
    const requestedGrade = gradeMatches[0];
    return {
      isOutOfGrade: true,
      targetGrade: requestedGrade,
      reason: `explicit_grade_${requestedGrade}`,
    };
  }

  // Ôn thi đại học / thi vào 10 đối với học sinh lớp dưới
  if (
    studentGrade < 9 &&
    /ôn thi vào 10|thi tuyển sinh lớp 10|thi chuyên 10/i.test(q)
  ) {
    return {
      isOutOfGrade: true,
      targetGrade: 9,
      topicLabel: 'Ôn thi tuyển sinh vào lớp 10',
    };
  }
  if (
    studentGrade < 10 &&
    /ôn thi đại học|thi thpt quốc gia|tốt nghiệp thpt/i.test(q)
  ) {
    return {
      isOutOfGrade: true,
      targetGrade: 12,
      topicLabel: 'Ôn thi THPT Quốc gia / Đại học',
    };
  }

  // 2. Kiểm tra theo bảng chuyên đề GDPT 2018 (ưu tiên đúng môn hiện tại hoặc toàn bộ nếu môn chưa xác định)
  for (const rule of GDPT_2018_GRADE_TOPIC_RULES) {
    if (studentGrade >= rule.minGrade) continue;

    // Nếu phiên đã khóa môn cụ thể, chỉ đối chiếu quy tắc của đúng môn đó
    if (
      subjectName &&
      subjectName !== 'Tổng hợp' &&
      rule.subject !== subjectName
    ) {
      continue;
    }

    const matchedKeyword = rule.keywords?.some((kw) => q.includes(kw));
    const matchedPattern = rule.patterns?.some((re) => re.test(query));

    if (matchedKeyword || matchedPattern) {
      return {
        isOutOfGrade: true,
        targetGrade: rule.minGrade,
        topicLabel: rule.label,
      };
    }
  }

  return { isOutOfGrade: false };
}
