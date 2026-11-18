import {
  CurriculumDocumentSeed,
  CurriculumLessonSeed,
} from './curriculum-kntt-67.data';

export interface AdvancedCurriculumAugmentation {
  subjectName: string;
  grade: number;
  additionalDescription: string;
  lessons: CurriculumLessonSeed[];
  documents: CurriculumDocumentSeed[];
  questions: {
    content: string;
    options: string[];
    correctOption: string;
    explanation: string;
  }[];
}

/**
 * BỘ TÀI LIỆU CHUYÊN ĐỀ BỒI DƯỠNG & NÂNG CAO TOÀN DIỆN (KHỐI 6, 7, 8, 9)
 * Bổ sung kiến thức nâng cao, vận dụng cao (HSG, Thi chuyên) và tổng hợp tinh hoa
 * từ các bộ sách GDPT 2018 (Kết nối tri thức, Cánh Diều, Chân trời sáng tạo)
 * cho tất cả các môn: Toán, Vật lí, Hóa học, Sinh học (KHTN), Tiếng Anh, Ngữ văn,
 * Lịch sử & Địa lí, Tin học, Giáo dục công dân, Công nghệ.
 */
export const ADVANCED_CURRICULUM_6789: AdvancedCurriculumAugmentation[] = [
  // =========================================================================
  // 1. MÔN TOÁN NÂNG CAO (KHỐI 6, 7, 8, 9)
  // =========================================================================
  {
    subjectName: 'Toán',
    grade: 6,
    additionalDescription:
      'Bổ sung Chuyên đề Toán 6 Nâng cao & Bồi dưỡng HSG: Chia hết nâng cao, Đồng dư thức, Nguyên lý Dirichlet, Tổng dãy số theo quy luật, Phương trình nghiệm nguyên Diophantine cơ bản và Hình học tổ hợp.',
    lessons: [
      {
        order: 6,
        title:
          '[Chuyên đề Nâng cao 1] Số học nâng cao: Tính chia hết, Đồng dư thức & Nguyên lý Dirichlet',
        content:
          '1. Tính chất chia hết nâng cao:\n' +
          '- Tích của n số nguyên liên tiếp luôn chia hết cho n! (Ví dụ: tích 2 số nguyên liên tiếp chia hết cho 2; tích 3 số nguyên liên tiếp chia hết cho 6).\n' +
          '- Nếu a chia hết cho m, b chia hết cho m và (m, n) = 1 thì tích hoặc tính chất kết hợp: nếu a chia hết cho m và a chia hết cho n với ƯCLN(m, n) = 1 thì a chia hết cho (m . n).\n' +
          '2. Đồng dư thức cơ bản ( tìm chữ số tận cùng & số dư):\n' +
          '- Kí hiệu: a ≡ b (mod m) nghĩa là (a - b) chia hết cho m.\n' +
          '- Tính chất: Nếu a ≡ b (mod m) thì a^n ≡ b^n (mod m). Ứng dụng tìm chữ số tận cùng (mod 10): các số tận cùng là 0, 1, 5, 6 nâng lên lũy thừa nguyên dương bất kì vẫn giữ nguyên chữ số tận cùng; chữ số tận cùng 2, 3, 7, 8 có chu kì 4.\n' +
          '3. Nguyên lý Dirichlet (Nguyên lý chuồng thỏ): Nếu nhốt n + 1 con thỏ vào n chiếc lồng thì luôn tồn tại ít nhất một lồng chứa từ 2 con thỏ trở lên. Ứng dụng chứng minh tồn tại hai số có hiệu chia hết cho n.',
      },
      {
        order: 7,
        title:
          '[Chuyên đề Nâng cao 2] Dãy số viết theo quy luật, Phân số nâng cao & Tìm nghiệm nguyên',
        content:
          '1. Tổng dãy lũy thừa cùng cơ số (Phương pháp nhân cơ số rồi trừ vế):\n' +
          '- Ví dụ: Tính S = 1 + 2 + 2^2 + 2^3 + ... + 2^n. Ta nhân 2S = 2 + 2^2 + ... + 2^(n+1), suy ra S = 2S - S = 2^(n+1) - 1.\n' +
          '- Tổng quát với a > 1: S = 1 + a + a^2 + ... + a^n = (a^(n+1) - 1) / (a - 1).\n' +
          '2. Tổng dãy phân số có quy luật khử liên tiếp (Telescoping sum):\n' +
          '- Công thức chuẩn: 1 / [n(n + 1)] = 1/n - 1/(n + 1).\n' +
          '- Mở rộng: k / [n(n + k)] = 1/n - 1/(n + k).\n' +
          '- Ví dụ mẫu: A = 1/(1.2) + 1/(2.3) + ... + 1/(99.100) = 1 - 1/2 + 1/2 - 1/3 + ... + 1/99 - 1/100 = 1 - 1/100 = 99/100.\n' +
          '3. Phân số tối giản: Phân số A/B tối giản khi và chỉ khi ƯCLN(|A|, |B|) = 1 (chứng minh bằng thuật toán Euclid đặt d = ƯCLN(A, B) rồi khử n).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Toan_Nang_Cao_Boi_Duong_HSG_Lop_6.pdf',
        size: '3.2 MB',
        chunks: [
          {
            page: 12,
            content:
              '[Chuyên đề Toán 6 Nâng cao - Số học & Đồng dư thức] Tích của 2 số nguyên liên tiếp luôn chia hết cho 2; tích của 3 số nguyên liên tiếp n(n+1)(n+2) luôn chia hết cho 6. Nếu một số nguyên a vừa chia hết cho m vừa chia hết cho n mà ƯCLN(m, n) = 1 (hai số nguyên tố cùng nhau) thì a chia hết cho tích m.n. Để chứng minh phân số (2n + 3)/(3n + 4) tối giản với mọi số tự nhiên n, ta gọi d = ƯCLN(2n + 3, 3n + 4), suy ra 3(2n + 3) - 2(3n + 4) = 1 chia hết cho d, vậy d = 1.',
          },
          {
            page: 28,
            content:
              '[Chuyên đề Toán 6 Nâng cao - Dãy số quy luật & Phân số] Công thức tách phân số khử liên tiếp: k / [n(n + k)] = 1/n - 1/(n + k). Đặc biệt với k = 1: 1 / [n(n + 1)] = 1/n - 1/(n + 1). Công thức thu gọn tổng dãy lũy thừa: Với S = 1 + a + a^2 + ... + a^n (a > 1), ta tính a.S rồi lấy a.S - S để được S = (a^(n+1) - 1) / (a - 1).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Nâng cao] Giá trị của biểu thức A = 1/(1.2) + 1/(2.3) + 1/(3.4) + ... + 1/(99.100) bằng bao nhiêu?',
        options: ['99/100', '100/99', '1/100', '98/100'],
        correctOption: '99/100',
        explanation:
          'Áp dụng công thức khử liên tiếp 1/[n(n+1)] = 1/n - 1/(n+1), ta có A = (1 - 1/2) + (1/2 - 1/3) + ... + (1/99 - 1/100) = 1 - 1/100 = 99/100.',
      },
      {
        content:
          '[Nâng cao] Cho tổng lũy thừa S = 1 + 3 + 3^2 + 3^3 + ... + 3^20. Rút gọn biểu thức S ta được:',
        options: [
          '(3^21 - 1) / 2',
          '(3^20 - 1) / 2',
          '3^21 - 1',
          '(3^21 + 1) / 3',
        ],
        correctOption: '(3^21 - 1) / 2',
        explanation:
          'Nhân cả hai vế với 3: 3S = 3 + 3^2 + ... + 3^21. Lấy 3S - S = 2S = 3^21 - 1 => S = (3^21 - 1) / 2.',
      },
    ],
  },
  {
    subjectName: 'Toán',
    grade: 7,
    additionalDescription:
      'Bổ sung Chuyên đề Toán 7 Nâng cao & Bồi dưỡng HSG: Dãy tỉ số bằng nhau nâng cao, Cực trị biểu thức chứa dấu giá trị tuyệt đối, Đa thức một biến nâng cao và Chứng minh đồng quy - thẳng hàng trong Hình học.',
    lessons: [
      {
        order: 5,
        title:
          '[Chuyên đề Nâng cao 1] Dãy tỉ số bằng nhau nâng cao & Cực trị Giá trị tuyệt đối',
        content:
          '1. Phương pháp giải toán Dãy tỉ số bằng nhau nâng cao:\n' +
          '- Phương pháp đặt k: Nếu x/a = y/b = z/c = k thì x = ak, y = bk, z = ck (rất hiệu quả khi điều kiện cho dưới dạng bậc hai hoặc tích như x.y.z = m hoặc x^2 + y^2 = n).\n' +
          '- Chứng minh đẳng thức tỉ lệ từ a/b = c/d.\n' +
          '2. Bất đẳng thức chứa dấu Giá trị tuyệt đối (Tìm GTNN / GTLN):\n' +
          '- Tính chất cơ bản: |A| >= 0 với mọi A; dấu "=" xảy ra khi A = 0.\n' +
          '- Bất đẳng thức giá trị tuyệt đối: |A| + |B| >= |A + B|. Dấu "=" xảy ra khi và chỉ khi A . B >= 0 (A và B cùng dấu).\n' +
          '- Ví dụ mẫu: Tìm GTNN của P = |x - 2| + |x - 5|. Ta viết lại P = |x - 2| + |5 - x| >= |(x - 2) + (5 - x)| = 3. Dấu "=" xảy ra khi (x - 2)(5 - x) >= 0 <=> 2 <= x <= 5. Vậy min P = 3.',
      },
      {
        order: 6,
        title:
          '[Chuyên đề Nâng cao 2] Đa thức một biến nâng cao & Đường đồng quy trong tam giác',
        content:
          '1. Đa thức một biến nâng cao:\n' +
          '- Với mọi đa thức P(x): Tổng các hệ số của P(x) bằng P(1); Hệ số tự do bằng P(0); Tổng các hệ số bậc chẵn trừ tổng các hệ số bậc lẻ bằng P(-1).\n' +
          '- Nghiệm nguyên của đa thức hệ số nguyên: Nếu x = a (a nguyên) là nghiệm của đa thức hệ số nguyên P(x) thì a phải là ước của hệ số tự do.\n' +
          '2. Hình học nâng cao lớp 7:\n' +
          '- Phương pháp kẻ đường phụ (vẽ tam giác đều, lấy điểm đối xứng hoặc kéo dài đường trung tuyến gấp đôi) để chứng minh hai tam giác bằng nhau.\n' +
          '- Tính chất đường trung tuyến ứng với cạnh huyền trong tam giác vuông bằng nửa cạnh huyền; Ứng dụng trọng tâm G (AG = 2/3 AM), trực tâm H, tâm đường tròn nội tiếp I và ngoại tiếp O.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Toan_Nang_Cao_Boi_Duong_HSG_Lop_7.pdf',
        size: '3.4 MB',
        chunks: [
          {
            page: 14,
            content:
              '[Chuyên đề Toán 7 Nâng cao - Giá trị tuyệt đối & Tỉ lệ thức] Bất đẳng thức giá trị tuyệt đối quan trọng: |A| + |B| >= |A + B|, dấu bằng xảy ra khi và chỉ khi A.B >= 0. Áp dụng tìm giá trị nhỏ nhất của biểu thức dạng M = |x - a| + |x - b| (với a < b): Ta đổi |x - b| = |b - x|, suy ra M = |x - a| + |b - x| >= |x - a + b - x| = b - a; dấu "=" xảy ra khi a <= x <= b. Với bài toán tỉ lệ thức có điều kiện bậc cao (như x^2 + y^2 = k hoặc x.y = k), ta đặt tỉ số chung bằng t rồi biểu diễn x, y theo t.',
          },
          {
            page: 36,
            content:
              '[Chuyên đề Toán 7 Nâng cao - Đa thức & Hình học] Với đa thức một biến P(x) bất kì: Tổng tất cả các hệ số của P(x) sau khi thu gọn luôn bằng P(1), còn hệ số tự do luôn bằng P(0). Trong tam giác, để chứng minh ba đường thẳng đồng quy, ta sử dụng tính chất ba đường trung tuyến, ba đường phân giác, ba đường trung trực hoặc ba đường cao cùng đi qua một điểm.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Nâng cao] Giá trị nhỏ nhất của biểu thức P = |x - 1| + |x - 4| với x là số thực bất kì bằng bao nhiêu?',
        options: ['3', '5', '0', '4'],
        correctOption: '3',
        explanation:
          'Áp dụng bất đẳng thức |A| + |B| >= |A + B|: P = |x - 1| + |4 - x| >= |(x - 1) + (4 - x)| = 3. Dấu "=" xảy ra khi 1 <= x <= 4.',
      },
      {
        content:
          '[Nâng cao] Tổng tất cả các hệ số của đa thức P(x) = (2x - 1)^2026 sau khi khai triển và thu gọn bằng:',
        options: ['1', '0', '2026', '-1'],
        correctOption: '1',
        explanation:
          'Tổng các hệ số của đa thức P(x) luôn bằng giá trị P(1) = (2.1 - 1)^2026 = 1^2026 = 1.',
      },
    ],
  },
  {
    subjectName: 'Toán',
    grade: 8,
    additionalDescription:
      'Bổ sung Chuyên đề Toán 8 Nâng cao & Bồi dưỡng HSG: Phân tích đa thức thành nhân tử nâng cao (Định lý Bézout, Hệ số bất định, Đổi biến), Bất đẳng thức Cauchy (AM-GM) & Bunyakovsky, Định lý Thalès nâng cao.',
    lessons: [
      {
        order: 5,
        title:
          '[Chuyên đề Nâng cao 1] Phân tích đa thức thành nhân tử nâng cao, Định lý Bézout & Phương trình bậc cao',
        content:
          '1. Định lý Bézout về phép chia đa thức:\n' +
          '- Số dư trong phép chia đa thức f(x) cho nhị thức (x - a) đúng bằng f(a).\n' +
          '- Hệ quả: Đa thức f(x) chia hết cho (x - a) khi và chỉ khi f(a) = 0 (tức x = a là nghiệm của f(x)).\n' +
          '2. Các phương pháp phân tích đa thức thành nhân tử nâng cao:\n' +
          '- Phương pháp tách hạng tử và thêm bớt cùng một hạng tử (thường thêm bớt để tạo hằng đẳng thức hiệu hai bình phương A^2 - B^2).\n' +
          '- Ví dụ mẫu: Phân tích x^4 + 4 thành nhân tử: x^4 + 4 = (x^4 + 4x^2 + 4) - 4x^2 = (x^2 + 2)^2 - (2x)^2 = (x^2 - 2x + 2)(x^2 + 2x + 2).\n' +
          '- Phương pháp đặt ẩn phụ cho tích 4 nhị thức: (x + a)(x + b)(x + c)(x + d) + k với a + d = b + c.',
      },
      {
        order: 6,
        title:
          '[Chuyên đề Nâng cao 2] Bất đẳng thức Cauchy (AM-GM), Bunyakovsky & Hình học Thalès nâng cao',
        content:
          '1. Bất đẳng thức Cauchy (AM-GM) cho hai số không âm a >= 0, b >= 0:\n' +
          '- Dạng chuẩn: a + b >= 2√(ab) hay (a + b)^2 >= 4ab. Dấu "=" xảy ra khi và chỉ khi a = b.\n' +
          '- Hệ quả: Với x > 0 thì x + 1/x >= 2 (dấu "=" khi x = 1).\n' +
          '2. Bất đẳng thức Bunyakovsky (Cauchy-Schwarz) cho bộ hai số:\n' +
          '- (a^2 + b^2)(x^2 + y^2) >= (ax + by)^2. Dấu "=" xảy ra khi a/x = b/y.\n' +
          '3. Hình học nâng cao lớp 8 (Định lý Thalès & Tam giác đồng dạng):\n' +
          '- Kẻ thêm đường thẳng song song tạo các cặp đoạn thẳng tỉ lệ theo Định lý Thalès để tính tỉ số đoạn thẳng và diện tích.\n' +
          '- Tỉ số diện tích của hai tam giác đồng dạng bằng bình phương tỉ số đồng dạng: S1 / S2 = k^2.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Toan_Nang_Cao_Boi_Duong_HSG_Lop_8.pdf',
        size: '3.6 MB',
        chunks: [
          {
            page: 16,
            content:
              '[Chuyên đề Toán 8 Nâng cao - Định lý Bézout & Phân tích nhân tử] Định lý Bézout: Đa thức P(x) chia cho (x - a) có số dư là R = P(a). Do đó P(x) nhận x = a làm nghiệm khi và chỉ khi P(x) chứa nhân tử (x - a). Kỹ thuật thêm bớt hạng tử Sophie Germain: x^4 + 4y^4 = (x^2 + 2y^2)^2 - (2xy)^2 = (x^2 - 2xy + 2y^2)(x^2 + 2xy + 2y^2). Với phương trình dạng (x+a)(x+b)(x+c)(x+d) = m trong đó a+d = b+c, ta nhóm [(x+a)(x+d)].[(x+b)(x+c)] = m rồi đặt ẩn phụ t = x^2 + (a+d)x.',
          },
          {
            page: 42,
            content:
              '[Chuyên đề Toán 8 Nâng cao - Bất đẳng thức & Cực trị đại số] Bất đẳng thức Cauchy (AM-GM) cho hai số không âm a, b >= 0: a + b >= 2√(ab), dấu bằng xảy ra khi a = b. Để tìm GTNN của biểu thức bậc hai P = ax^2 + bx + c (với a > 0), ta biến đổi về dạng bình phương không âm: P = a(x + m)^2 + k >= k, suy ra GTNN của P là k khi x = -m.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Nâng cao] Theo định lý Bézout, số dư trong phép chia đa thức P(x) = x^3 - 2x^2 + 3x - 5 cho nhị thức (x - 2) bằng bao nhiêu?',
        options: ['1', '-5', '3', '0'],
        correctOption: '1',
        explanation:
          'Theo định lý Bézout, số dư khi chia P(x) cho (x - 2) bằng P(2) = 2^3 - 2.(2^2) + 3.2 - 5 = 8 - 8 + 6 - 5 = 1.',
      },
      {
        content:
          '[Nâng cao] Giá trị nhỏ nhất của biểu thức A = x^2 - 4x + 10 với mọi số thực x là:',
        options: ['6', '10', '4', '2'],
        correctOption: '6',
        explanation:
          'Ta tách hằng đẳng thức: A = (x^2 - 4x + 4) + 6 = (x - 2)^2 + 6 >= 6 với mọi x. Dấu "=" xảy ra khi x = 2.',
      },
    ],
  },
  {
    subjectName: 'Toán',
    grade: 9,
    additionalDescription:
      'Bổ sung Chuyên đề Toán 9 Nâng cao & Ôn thi vào lớp 10 Chuyên: Căn thức nâng cao, Phương trình vô tỉ, Hệ phương trình đối xứng, Định lý Viète nâng cao, Bất đẳng thức cực trị và Hình học đường tròn chuyên sâu.',
    lessons: [
      {
        order: 5,
        title:
          '[Chuyên đề Nâng cao 1] Căn thức nâng cao, Phương trình vô tỉ & Hệ phương trình đối xứng',
        content:
          '1. Bài toán rút gọn biểu thức chứa căn và câu hỏi phụ nâng cao:\n' +
          '- Tìm x nguyên để biểu thức P = A / B nhận giá trị nguyên: Thực hiện chia đa thức (hoặc tách phần nguyên) rồi tìm ước của hằng số dư; Nếu đề chỉ hỏi "tìm x thực để P nguyên" thì phải chặn khoảng m <= P <= M rồi xét các giá trị nguyên của P.\n' +
          '2. Phương trình vô tỉ (Chứa căn thức):\n' +
          '- Phương pháp đặt ẩn phụ (đưa về phương trình bậc hai hoặc hệ phương trình).\n' +
          '- Phương pháp nhân biểu thức liên hợp: √A - √B = (A - B) / (√A + √B).\n' +
          '3. Hệ phương trình đối xứng loại I và loại II:\n' +
          '- Hệ đối xứng loại I (đổi chỗ x, y cho nhau từng phương trình không đổi): Đặt S = x + y, P = x.y (điều kiện S^2 >= 4P).\n' +
          '- Hệ đối xứng loại II (đổi chỗ x, y thì phương trình 1 thành phương trình 2): Trừ vế theo vế hai phương trình để xuất hiện nhân tử chung (x - y) = 0.',
      },
      {
        order: 6,
        title:
          '[Chuyên đề Nâng cao 2] Định lý Viète nâng cao, Bất đẳng thức thi Chuyên & Đường tròn nâng cao',
        content:
          '1. Định lý Viète nâng cao (Biểu thức đối xứng & Không đối xứng giữa hai nghiệm x1, x2):\n' +
          '- Biểu thức đối xứng: x1^2 + x2^2 = (x1 + x2)^2 - 2x1x2 = S^2 - 2P; x1^3 + x2^3 = S^3 - 3SP; |x1 - x2| = √[(x1 + x2)^2 - 4x1x2] = √(S^2 - 4P).\n' +
          '- Biểu thức không đối xứng (ví dụ x1^2 + 5x2 = m): Dùng chính phương trình ban đầu ax1^2 + bx1 + c = 0 để hạ bậc x1^2 = (-bx1 - c)/a đưa về bậc nhất đối xứng.\n' +
          '2. Kỹ thuật chọn điểm rơi trong Bất đẳng thức Cauchy (AM-GM):\n' +
          '- Bất đẳng thức cộng mẫu số (Cauchy-Schwarz dạng Engel): 1/a + 1/b >= 4 / (a + b) với a, b > 0.\n' +
          '3. Hình học Đường tròn nâng cao (Câu cuối đề thi vào 10):\n' +
          '- Phương tích của một điểm đối với đường tròn: Tiếp tuyến MT và cát tuyến MAB từ điểm M ngoài đường tròn luôn thỏa mãn MT^2 = MA . MB.\n' +
          '- Đường thẳng Euler trong tam giác: Trực tâm H, Trọng tâm G và Tâm đường tròn ngoại tiếp O luôn thẳng hàng và HG = 2 GO.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Toan_Nang_Cao_On_Thi_Chuyen_Lop_9.pdf',
        size: '4.1 MB',
        chunks: [
          {
            page: 18,
            content:
              '[Chuyên đề Toán 9 Nâng cao - Định lý Viète & Phương trình bậc hai] Khi phương trình ax^2 + bx + c = 0 (a ≠ 0) có hai nghiệm x1, x2 (Δ >= 0), áp dụng hệ thức Viète S = x1 + x2 = -b/a và P = x1.x2 = c/a, ta biến đổi: x1^2 + x2^2 = S^2 - 2P; x1^3 + x2^3 = S^3 - 3SP; (x1 - x2)^2 = S^2 - 4P. Với hệ thức không đối xứng chứa x1^2, ta dùng tính chất x1 là nghiệm của phương trình nên ax1^2 + bx1 + c = 0 để hạ bậc x1^2 theo x1.',
          },
          {
            page: 54,
            content:
              '[Chuyên đề Toán 9 Nâng cao - Bất đẳng thức & Hình học Đường tròn] Bất đẳng thức cộng mẫu Cauchy-Schwarz (Schwarz-Engel) cho các số dương: x^2/a + y^2/b >= (x + y)^2 / (a + b); đặc biệt 1/a + 1/b >= 4/(a + b) (dấu "=" khi a = b). Trong hình học đường tròn, hệ thức phương tích từ điểm M nằm ngoài đường tròn (O) kẻ tiếp tuyến MT và cát tuyến MAB: ΔMTA đồng dạng ΔMBT (g.g) suy ra MT^2 = MA . MB.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Nâng cao] Gọi x1, x2 là hai nghiệm của phương trình x^2 - 4x + 1 = 0. Giá trị của biểu thức A = x1^2 + x2^2 bằng:',
        options: ['14', '16', '12', '18'],
        correctOption: '14',
        explanation:
          'Theo định lý Viète: S = x1 + x2 = 4 và P = x1.x2 = 1. Ta có A = x1^2 + x2^2 = (x1 + x2)^2 - 2x1x2 = 4^2 - 2.1 = 16 - 2 = 14.',
      },
      {
        content:
          '[Nâng cao] Từ điểm M nằm ngoài đường tròn (O), kẻ tiếp tuyến MT (T là tiếp điểm) và cát tuyến MAB (A nằm giữa M và B). Biết MA = 4 cm, MB = 9 cm. Độ dài đoạn tiếp tuyến MT bằng:',
        options: ['6 cm', '5 cm', '13 cm', '36 cm'],
        correctOption: '6 cm',
        explanation:
          'Xét ΔMTA và ΔMBT có góc M chung, góc MTA = góc MBT (góc tạo bởi tia tiếp tuyến và dây cung và góc nội tiếp cùng chắn cung TA) => ΔMTA ∽ ΔMBT (g.g) => MT^2 = MA . MB = 4 . 9 = 36 => MT = 6 (cm).',
      },
    ],
  },

  // =========================================================================
  // 2. KHOA HỌC TỰ NHIÊN NÂNG CAO: TÁCH RIÊNG 3 CHUYÊN ĐỀ VẬT LÍ - HÓA HỌC - SINH HỌC (KHỐI 6, 7, 8, 9)
  // =========================================================================
  {
    subjectName: 'Khoa học tự nhiên',
    grade: 6,
    additionalDescription:
      'Bổ sung 3 Chuyên đề Nâng cao Vật lí 6 (Lực đàn hồi Hooke, Hợp lực), Hóa học 6 (Độ tan, Tách chất nâng cao) và Sinh học 6 (Toán phân chia tế bào 2^k, Khóa lưỡng phân).',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Vật lí Nâng cao 6] Lực đàn hồi của lò xo (Định luật Hooke cơ bản) & Tổng hợp hai lực cùng phương',
        content:
          '1. Bài toán độ biến dạng của lò xo treo thẳng đứng:\n' +
          '- Độ dãn của lò xo: Δl = l - l_0 (trong đó l_0 là chiều dài tự nhiên ban đầu, l là chiều dài khi treo vật).\n' +
          '- Quy luật tỉ lệ: Trong giới hạn đàn hồi, độ dãn Δl của lò xo tỉ lệ thuận với trọng lượng P (hoặc khối lượng m) của vật treo: Δl_1 / Δl_2 = P_1 / P_2 = m_1 / m_2.\n' +
          '- Ví dụ mẫu: Lò xo có l_0 = 12 cm. Treo quả nặng m1 = 100g thì dài l1 = 14 cm (tức dãn Δl1 = 2 cm). Nếu treo m2 = 250g thì độ dãn Δl2 = 2,5 . 2 = 5 cm => chiều dài lò xo là l2 = 12 + 5 = 17 cm.\n' +
          '2. Hợp lực của hai lực cùng phương:\n' +
          '- Hai lực cùng phương, cùng chiều: F = F1 + F2.\n' +
          '- Hai lực cùng phương, ngược chiều: F = |F1 - F2| (vật đứng yên cân bằng khi F1 = F2).',
      },
      {
        order: 5,
        title:
          '[Chuyên đề Hóa học & Sinh học Nâng cao 6] Bài toán Độ tan của chất & Công thức phân chia Tế bào 2^k',
        content:
          '1. Chuyên đề Hóa học 6 Nâng cao — Độ tan (S) của một chất trong nước:\n' +
          '- Định nghĩa: Độ tan (S) của một chất trong nước ở nhiệt độ xác định là số gam chất đó hòa tan tối đa trong 100 gam nước để tạo thành dung dịch bão hòa.\n' +
          '- Công thức: S = (m_ct / m_H2O) . 100 (gam/100g H2O), trong đó m_dd_bão_hòa = m_ct + m_H2O.\n' +
          '2. Chuyên đề Sinh học 6 Nâng cao — Bài toán sự lớn lên và sinh sản của tế bào:\n' +
          '- Từ 1 tế bào mẹ ban đầu, sau 1 lần phân chia tạo ra 2 tế bào con; sau k lần phân chia liên tiếp tạo ra 2^k tế bào con.\n' +
          '- Tổng quát: Nếu có a tế bào ban đầu cùng phân chia k lần liên tiếp thì tổng số tế bào con tạo thành là: N_tb = a . 2^k.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Vat_Li_Nang_Cao_Lop_6.pdf',
        size: '2.1 MB',
        chunks: [
          {
            page: 10,
            content:
              '[Chuyên đề Vật lí 6 Nâng cao - Lực đàn hồi & Lò xo] Khi treo vật có khối lượng m (trọng lượng P = 10m) vào lò xo có chiều dài tự nhiên l_0, lò xo dãn ra một đoạn Δl = l - l_0. Trong giới hạn đàn hồi, độ biến dạng Δl tỉ lệ thuận với lực tác dụng (trọng lượng vật treo): Δl1 / Δl2 = P1 / P2 = m1 / m2. Khi hai lực F1, F2 tác dụng lên cùng một vật theo cùng một phương và ngược chiều nhau, nếu F1 = F2 thì hai lực cân bằng và vật đứng yên.',
          },
        ],
      },
      {
        fileName: 'Chuyen_De_Hoa_Hoc_Sinh_Hoc_Nang_Cao_Lop_6.pdf',
        size: '2.3 MB',
        chunks: [
          {
            page: 15,
            content:
              '[Chuyên đề Hóa học & Sinh học 6 Nâng cao] (1) Hóa học - Độ tan S ở nhiệt độ t°C là số gam chất tan hòa tan tối đa trong 100 gam nước để tạo dung dịch bão hòa: S = (m_ct / m_nuoc) . 100. (2) Sinh học - Toán phân chia tế bào: Một tế bào sau k lần phân chia liên tiếp sẽ tạo ra 2^k tế bào con. Nếu ban đầu có a tế bào cùng thực hiện k lần phân chia thì tổng số tế bào con thu được là N = a . 2^k.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Vật lí 6 Nâng cao] Một lò xo có chiều dài tự nhiên l0 = 15 cm. Khi treo quả nặng 100 g thì lò xo có chiều dài 17 cm. Hỏi nếu treo quả nặng 300 g (trong giới hạn đàn hồi) thì chiều dài của lò xo là bao nhiêu?',
        options: ['21 cm', '19 cm', '23 cm', '51 cm'],
        correctOption: '21 cm',
        explanation:
          'Treo 100 g lò xo dãn Δl1 = 17 - 15 = 2 cm. Treo 300 g (gấp 3 lần) thì độ dãn Δl2 = 3 . 2 = 6 cm. Chiều dài lò xo là l2 = l0 + Δl2 = 15 + 6 = 21 cm.',
      },
      {
        content:
          '[Sinh học 6 Nâng cao] Từ 3 tế bào sinh dưỡng ban đầu cùng tiến hành phân chia liên tiếp 4 lần. Tổng số tế bào con được tạo ra sau quá trình trên là:',
        options: ['48 tế bào', '12 tế bào', '16 tế bào', '24 tế bào'],
        correctOption: '48 tế bào',
        explanation:
          'Áp dụng công thức N = a . 2^k = 3 . 2^4 = 3 . 16 = 48 (tế bào con).',
      },
    ],
  },
  {
    subjectName: 'Khoa học tự nhiên',
    grade: 7,
    additionalDescription:
      'Bổ sung 3 Chuyên đề Nâng cao Vật lí 7 (Vận tốc trung bình, Bài toán hai xe gặp nhau, Tiếng vang, Hệ gương phẳng), Hóa học 7 (Bài toán tổng hạt P, N, E và phần trăm nguyên tố) và Sinh học 7 (Cân bằng Quang hợp - Hô hấp).',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Vật lí Nâng cao 7] Vận tốc trung bình, Bài toán hai xe chuyển động, Tiếng vang & Hệ gương phẳng',
        content:
          '1. Vận tốc trung bình trên nhiều quãng đường (Tuyệt đối không lấy trung bình cộng vận tốc!):\n' +
          '- Công thức chuẩn: v_tb = Tổng quãng đường / Tổng thời gian = (s1 + s2 + ... + sn) / (t1 + t2 + ... + tn).\n' +
          '- Trường hợp đi nửa quãng đường đầu (s/2) với vận tốc v1, nửa quãng đường sau (s/2) với vận tốc v2: v_tb = (2 . v1 . v2) / (v1 + v2).\n' +
          '2. Bài toán hai vật chuyển động trên cùng một đường thẳng (ban đầu cách nhau khoảng L):\n' +
          '- Chuyển động ngược chiều (đi lại gặp nhau): Thời gian gặp nhau t = L / (v1 + v2).\n' +
          '- Chuyển động cùng chiều (xe 1 đuổi theo xe 2, v1 > v2): Thời gian đuổi kịp t = L / (v1 - v2).\n' +
          '3. Bài toán phản xạ âm (Tiếng vang) & Quang hình gương phẳng:\n' +
          '- Quãng đường âm đi từ nguồn tới vách núi rồi phản xạ lại tai bằng 2 lần khoảng cách d tới vách: 2d = v_âm . t => d = (v_âm . t) / 2. Điều kiện nghe được tiếng vang là âm phản xạ đến tai chậm hơn âm trực tiếp ít nhất 1/15 giây.\n' +
          '- Khi quay gương phẳng một góc α quanh trục nằm trên mặt gương thì tia phản xạ quay một góc 2α.',
      },
      {
        order: 5,
        title:
          '[Chuyên đề Hóa học & Sinh học Nâng cao 7] Bài toán tổng hạt cơ bản (P, N, E) trong nguyên tử & Sinh lí thực vật nâng cao',
        content:
          '1. Chuyên đề Hóa học 7 Nâng cao — Bài toán xác định hạt Proton (P), Neutron (N), Electron (E):\n' +
          '- Trong nguyên tử trung hòa điện: Số P = Số E = Z (số hiệu nguyên tử).\n' +
          '- Tổng số hạt cơ bản trong nguyên tử: S = P + N + E = 2P + N.\n' +
          '- Số hạt mang điện (P + E = 2P) nhiều hơn số hạt không mang điện (N) là a hạt: 2P - N = a.\n' +
          '- Giải hệ phương trình { 2P + N = S ; 2P - N = a } => 4P = S + a => tìm P, N, E và tên nguyên tố.\n' +
          '- Điều kiện bền của hạt nhân nguyên tử (với Z <= 82): 1 <= N / P <= 1,52 => S / 3,52 <= P <= S / 3.\n' +
          '2. Chuyên đề Sinh học 7 Nâng cao — Mối quan hệ Quang hợp và Hô hấp tế bào:\n' +
          '- Điểm bù ánh sáng là cường độ ánh sáng mà tại đó cường độ quang hợp bằng cường độ hô hấp (lượng CO2 hấp thụ = lượng CO2 thải ra). Muốn cây tích lũy chất hữu cơ và lớn lên thì cường độ quang hợp phải lớn hơn cường độ hô hấp.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Vat_Li_Nang_Cao_Lop_7.pdf',
        size: '2.8 MB',
        chunks: [
          {
            page: 12,
            content:
              '[Chuyên đề Vật lí 7 Nâng cao - Chuyển động, Âm học & Quang học] Vận tốc trung bình trên toàn bộ quãng đường luôn tính bằng công thức v_tb = (s1 + s2) / (t1 + t2). Nếu đi nửa quãng đường đầu với tốc độ v1 và nửa quãng đường sau với tốc độ v2 thì v_tb = 2.v1.v2 / (v1 + v2). Trong bài toán đo độ sâu đáy biển hoặc khoảng cách đến vách đá bằng âm phản xạ (sonar), khoảng cách d = (v . t) / 2. Trong quang học, khi giữ nguyên tia tới và quay gương phẳng một góc α thì tia phản xạ sẽ quay đi một góc bằng 2α.',
          },
        ],
      },
      {
        fileName: 'Chuyen_De_Hoa_Hoc_Sinh_Hoc_Nang_Cao_Lop_7.pdf',
        size: '2.6 MB',
        chunks: [
          {
            page: 19,
            content:
              '[Chuyên đề Hóa học 7 Nâng cao - Cấu tạo nguyên tử & Công thức hóa học] Trong mọi nguyên tử trung hòa điện, số proton luôn bằng số electron (P = E = Z), nên tổng số hạt cơ bản là S = 2P + N, trong đó số hạt mang điện là 2P và số hạt không mang điện là N. Để lập công thức hóa học của hợp chất X_x Y_y khi biết phần trăm khối lượng (%X, %Y) và khối lượng phân tử M, ta dùng tỉ lệ: x : y = (%X / M_X) : (%Y / M_Y).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Vật lí 7 Nâng cao] Một người đi xe đạp trên nửa quãng đường đầu với tốc độ v1 = 12 km/h và nửa quãng đường còn lại với tốc độ v2 = 20 km/h. Tốc độ trung bình của người đó trên cả quãng đường là:',
        options: ['15 km/h', '16 km/h', '14 km/h', '32 km/h'],
        correctOption: '15 km/h',
        explanation:
          'Áp dụng công thức hai nửa quãng đường bằng nhau: v_tb = (2 . v1 . v2) / (v1 + v2) = (2 . 12 . 20) / (12 + 20) = 480 / 32 = 15 (km/h).',
      },
      {
        content:
          '[Hóa học 7 Nâng cao] Tổng số hạt cơ bản (proton, neutron, electron) trong nguyên tử của nguyên tố X là 40, trong đó tổng số hạt mang điện nhiều hơn số hạt không mang điện là 12. Số proton (P) của nguyên tử X là:',
        options: [
          '13 (Aluminium - Nhôm)',
          '12 (Magnesium)',
          '14 (Silicon)',
          '11 (Sodium)',
        ],
        correctOption: '13 (Aluminium - Nhôm)',
        explanation:
          'Ta có hệ phương trình: 2P + N = 40 và 2P - N = 12. Cộng hai vế được 4P = 52 => P = 13 (nguyên tố Nhôm - Al) và N = 14.',
      },
    ],
  },
  {
    subjectName: 'Khoa học tự nhiên',
    grade: 8,
    additionalDescription:
      'Bổ sung 3 Chuyên đề Nâng cao Vật lí 8 (Bình thông nhau, Lực đẩy Archimedes vật nổi, Phương trình cân bằng nhiệt Q_tỏa = Q_thu), Hóa học 8 (Bài toán chất dư - hết, Hiệu suất phản ứng H%, Quy tắc đường chéo pha trộn dung dịch) và Sinh học 8 (Sinh lí tuần hoàn máu & Hiệu suất sinh thái).',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Vật lí Nâng cao 8] Bình thông nhau, Sự nổi Archimedes & Phương trình cân bằng nhiệt',
        content:
          '1. Sự nổi của vật trong chất lỏng (Lực đẩy Archimedes nâng cao):\n' +
          '- Khi một vật đặc nằm cân bằng (nổi một phần hoặc lơ lửng) trong chất lỏng: Trọng lượng của vật bằng độ lớn lực đẩy Archimedes: P = F_A.\n' +
          '- Công thức: d_vật . V_vật = d_lỏng . V_chìm => Tỉ lệ thể tích phần chìm: V_chìm / V_vật = d_vật / d_lỏng = D_vật / D_lỏng.\n' +
          '2. Bình thông nhau chứa hai chất lỏng không trộn lẫn (ví dụ nước d1 và dầu d2):\n' +
          '- Xét hai điểm A, B trên cùng một mặt phẳng nằm ngang đi qua mặt phân cách hai chất lỏng: p_A = p_B <=> d1 . h1 = d2 . h2.\n' +
          '3. Phương trình cân bằng nhiệt nâng cao:\n' +
          '- Nhiệt lượng vật thu vào hay tỏa ra: Q = m . c . Δt (J), trong đó m (kg) là khối lượng, c (J/kg.K) là nhiệt dung riêng, Δt là độ biến thiên nhiệt độ.\n' +
          '- Phương trình cân bằng nhiệt (bỏ qua hao phí): Q_tỏa = Q_thu <=> m1 . c1 . (t1 - t_cb) = m2 . c2 . (t_cb - t2).',
      },
      {
        order: 5,
        title:
          '[Chuyên đề Hóa học Nâng cao 8] Bài toán Lượng chất dư - hết, Hiệu suất phản ứng (H%) & Pha trộn dung dịch',
        content:
          '1. Bài toán có chất dư trong phản ứng hóa học: Phải lập tỉ số (n_ban_đầu / hệ_số_cân_bằng) cho từng chất tham gia; chất nào có tỉ số nhỏ hơn sẽ phản ứng hết và mọi tính toán sản phẩm phải tính theo số mol chất phản ứng hết.\n' +
          '2. Hiệu suất phản ứng (H%):\n' +
          '- Tính theo chất sản phẩm: H% = (n_sp_thực_tế / n_sp_lí_thuyết) . 100%.\n' +
          '- Tính theo chất tham gia: H% = (n_pư / n_ban_đầu) . 100%.\n' +
          '3. Bài toán pha trộn hai dung dịch cùng chất tan (Quy tắc đường chéo & Bảo toàn khối lượng chất tan):\n' +
          '- Khi trộn m1 gam dung dịch nồng độ C1% với m2 gam dung dịch nồng độ C2% (giả sử C1 < C < C2) thu được dung dịch nồng độ C%:\n' +
          '  m_ct_tổng = m_ct1 + m_ct2 và m_dd_sau = m1 + m2; Tỉ lệ quy tắc đường chéo: m1 / m2 = (C2 - C) / (C - C1).',
      },
      {
        order: 6,
        title:
          '[Chuyên đề Sinh học Nâng cao 8] Quy tắc truyền máu ABO, Chu kì tim & Hiệu suất sinh thái',
        content:
          '1. Nguyên tắc truyền máu nâng cao (Hệ nhóm máu ABO):\n' +
          '- Hồng cầu người cho không được bị ngưng kết bởi kháng thể (α, β) trong huyết tương người nhận:\n' +
          '  + Nhóm máu O (hồng cầu không có kháng nguyên A, B; huyết tương có cả α, β): Chuyên cho.\n' +
          '  + Nhóm máu AB (hồng cầu có cả A, B; huyết tương không có α, β): Chuyên nhận.\n' +
          '2. Bài toán Chu kì hoạt động của tim:\n' +
          '- Một chu kì tim ở người trưởng thành kéo dài khoảng 0,8 giây gồm 3 pha: Pha nhĩ co (0,1s) -> Pha thất co (0,3s) -> Pha dãn chung (0,4s). Nhịp tim = 60 / 0,8 = 75 nhịp/phút.\n' +
          '- Lưu lượng tim trong 1 phút: Q = Thể tích tâm thu (ml/nhịp) × Nhịp tim (nhịp/phút).\n' +
          '3. Hiệu suất sinh thái giữa hai bậc dinh dưỡng trong chuỗi thức ăn:\n' +
          '- H (%) = (Năng lượng tích lũy ở bậc n+1 / Năng lượng tích lũy ở bậc n) × 100% (thường chỉ đạt khoảng 10%, còn 90% thất thoát qua hô hấp và nhiệt).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Vat_Li_Nang_Cao_Lop_8.pdf',
        size: '3.1 MB',
        chunks: [
          {
            page: 14,
            content:
              '[Chuyên đề Vật lí 8 Nâng cao - Cơ học chất lưu & Nhiệt học] Khi một vật có trọng lượng riêng d_v < d_l thả vào chất lỏng thì vật nổi cân bằng trên mặt thoáng, khi đó P = F_A <=> d_v . V = d_l . V_chìm => V_chìm / V = d_v / d_l. Trong bình thông nhau chứa hai chất lỏng không hòa tan có trọng lượng riêng d1, d2, xét hai điểm trên mặt phẳng ngang đi qua mặt phân cách ta có d1.h1 = d2.h2. Phương trình cân bằng nhiệt: Q_tỏa = Q_thu với Q = m.c.(t_cao - t_thấp).',
          },
        ],
      },
      {
        fileName: 'Chuyen_De_Hoa_Hoc_Nang_Cao_Lop_8.pdf',
        size: '3.2 MB',
        chunks: [
          {
            page: 20,
            content:
              '[Chuyên đề Hóa học 8 Nâng cao - Chất dư, Hiệu suất & Dung dịch] Với bài toán cho biết số mol của cả 2 chất tham gia phản ứng aA + bB -> cC, ta so sánh tỉ số n_A / a và n_B / b: tỉ số nào nhỏ hơn thì chất đó hết, chất kia dư; số mol sản phẩm C tính theo chất hết. Hiệu suất phản ứng H% = (Lượng thực tế thu được / Lượng tính theo phương trình lí thuyết) . 100%. Khi pha trộn dung dịch, tổng khối lượng chất tan trước và sau pha trộn luôn bảo toàn: m_ct = m_ct1 + m_ct2.',
          },
        ],
      },
      {
        fileName: 'Chuyen_De_Sinh_Hoc_Nang_Cao_Lop_8.pdf',
        size: '2.5 MB',
        chunks: [
          {
            page: 18,
            content:
              '[Chuyên đề Sinh học 8 Nâng cao - Sinh lí người & Sinh thái học] Một chu kì tim bình thường kéo dài 0,8s gồm 3 pha: tâm nhĩ co 0,1s, tâm thất co 0,3s, dãn chung 0,4s (nhịp tim 75 lần/phút). Trong hệ sinh thái, hiệu suất sinh thái giữa bậc dinh dưỡng sau (E_sau) so với bậc dinh dưỡng liền trước (E_trước) được tính bằng công thức H = (E_sau / E_trước) . 100%, trung bình qua mỗi bậc dinh dưỡng năng lượng chỉ truyền lên khoảng 10%.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Vật lí 8 Nâng cao] Thả một khối gỗ hình lập phương có trọng lượng riêng d_gỗ = 6000 N/m³ vào trong nước có trọng lượng riêng d_nước = 10000 N/m³. Khi khối gỗ nổi cân bằng, tỉ số phần trăm thể tích phần gỗ chìm trong nước so với toàn bộ thể tích khối gỗ là:',
        options: ['60%', '40%', '80%', '50%'],
        correctOption: '60%',
        explanation:
          'Khi khối gỗ nổi cân bằng: P = F_A <=> d_gỗ . V = d_nước . V_chìm => V_chìm / V = d_gỗ / d_nước = 6000 / 10000 = 0,6 = 60%.',
      },
      {
        content:
          '[Hóa học 8 Nâng cao] Nung nóng 20 gam đá vôi (CaCO3 nguyên chất, M = 100) thu được 8,96 gam vôi sống (CaO, M = 56) và khí CO2. Hiệu suất của phản ứng nhiệt phân trên bằng:',
        options: ['80%', '75%', '89,6%', '90%'],
        correctOption: '80%',
        explanation:
          'Số mol CaCO3 ban đầu = 20 / 100 = 0,2 mol. Theo phương trình CaCO3 -> CaO + CO2, khối lượng CaO lí thuyết = 0,2 . 56 = 11,2 (g). Hiệu suất H% = (8,96 / 11,2) . 100% = 80%.',
      },
      {
        content:
          '[Sinh học 8 Nâng cao] Trong một chuỗi thức ăn: Cỏ (10.000 kcal) -> Thỏ (1.200 kcal) -> Cáo (108 kcal). Hiệu suất sinh thái của bậc dinh dưỡng Cáo so với bậc dinh dưỡng Thỏ là:',
        options: ['9%', '12%', '1,08%', '10%'],
        correctOption: '9%',
        explanation:
          'Hiệu suất sinh thái của Cáo so với Thỏ: H = (E_Cáo / E_Thỏ) . 100% = (108 / 1200) . 100% = 9%.',
      },
    ],
  },
  {
    subjectName: 'Khoa học tự nhiên',
    grade: 9,
    additionalDescription:
      'Bổ sung 3 Chuyên đề Nâng cao Ôn thi Chuyên Lý - Hóa - Sinh lớp 9: Vật lí 9 (Mạch điện hỗn hợp, Cực trị công suất điện, Công thức thấu kính), Hóa học 9 (Tăng giảm khối lượng kim loại, Toán đốt cháy Hydrocarbon & Ester hóa) và Sinh học 9 (Công thức giải toán phân tử DNA/RNA/Protein & Quy luật di truyền Mendel nâng cao).',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Vật lí Nâng cao 9] Mạch điện hỗn hợp, Cực trị Công suất điện & Công thức Thấu kính mỏng',
        content:
          '1. Bài toán Mạch điện hỗn hợp & Cực trị công suất trên biến trở (Ôn thi Chuyên Lý):\n' +
          '- Cho mạch điện gồm điện trở R0 mắc nối tiếp với biến trở R_x vào hiệu điện thế U không đổi: Cường độ dòng điện I = U / (R0 + R_x).\n' +
          '- Công suất tiêu thụ trên biến trở: P_x = I^2 . R_x = [U^2 . R_x] / (R0 + R_x)^2 = U^2 / [√R_x + R0/√R_x]^2.\n' +
          '- Theo bất đẳng thức Cauchy: √R_x + R0/√R_x >= 2√R0, nên công suất P_x đạt giá trị cực đại P_max = U^2 / (4.R0) khi và chỉ khi R_x = R0.\n' +
          '2. Công thức Thấu kính mỏng & Độ phóng đại ảnh:\n' +
          "- Với thấu kính hội tụ (tiêu cự f > 0), vật thật cách thấu kính khoảng d, ảnh cách thấu kính khoảng d':\n" +
          "  + Nếu d > f (cho ảnh thật): 1/f = 1/d + 1/d'.\n" +
          "  + Nếu d < f (cho ảnh ảo cùng chiều lớn hơn vật): 1/f = 1/d - 1/|d'|.\n" +
          "- Hệ số phóng đại ảnh: k = h' / h = |d'| / d.",
      },
      {
        order: 5,
        title:
          '[Chuyên đề Hóa học Nâng cao 9] Phương pháp Tăng giảm khối lượng Kim loại, Đốt cháy Hydrocarbon & Ester hóa',
        content:
          '1. Phương pháp Tăng giảm khối lượng (Nhúng thanh kim loại M vào dung dịch muối):\n' +
          '- Nếu khối lượng kim loại tan ra nhỏ hơn khối lượng kim loại bám vào thì khối lượng thanh kim loại tăng: Δm_tăng = m_kim_loại_bám - m_kim_loại_tan.\n' +
          '- Ví dụ mẫu: Nhúng thanh Fe (M = 56) vào dung dịch CuSO4 dư: Fe + CuSO4 -> FeSO4 + Cu↓ (M = 64). Cứ 1 mol Fe phản ứng thì khối lượng thanh sắt tăng thêm Δm = 64 - 56 = 8 gam. Vậy nếu thanh sắt tăng m gam thì số mol Fe phản ứng là n_Fe = m / 8.\n' +
          '2. Bài toán đốt cháy Hydrocarbon (C_x H_y):\n' +
          '- Bảo toàn nguyên tố Carbon và Hydrogen: n_C = n_CO2; n_H = 2 . n_H2O; m_hydrocarbon = m_C + m_H = 12 . n_CO2 + 2 . n_H2O.\n' +
          '- Đặc biệt: Đốt cháy Alkane (C_n H_{2n+2}) luôn cho n_H2O > n_CO2 và n_alkane = n_H2O - n_CO2; Đốt cháy Alkene (C_n H_{2n}) luôn cho n_H2O = n_CO2.\n' +
          '3. Phản ứng Ester hóa nâng cao: CH3COOH + C2H5OH ⇌ CH3COOC2H5 + H2O (xúc tác H2SO4 đặc, t°), tính khối lượng ester theo hiệu suất H%.',
      },
      {
        order: 6,
        title:
          '[Chuyên đề Sinh học Nâng cao 9] Hệ thống công thức Toán phân tử DNA - RNA - Protein & Toán lai Mendel',
        content:
          '1. Hệ thống công thức giải toán cấu trúc phân tử DNA / Gene (mạch kép):\n' +
          '- Theo nguyên tắc bổ sung (NTBS): A = T, G = C. Tổng số nucleotide của gene: N = 2A + 2G = 2T + 2C => A + G = N / 2 (hay %A + %G = 50%).\n' +
          '- Chiều dài của gene (1 cặp nucleotide dài 3,4 Å = 0,34 nm): L = (N / 2) . 3,4 (Å).\n' +
          '- Khối lượng phân tử của gene (1 nu trung bình nặng 300 đvC): M = N . 300 (đvC).\n' +
          '- Số chu kì xoắn (1 chu kì xoắn gồm 10 cặp = 20 nu): C = N / 20.\n' +
          '- Tổng số liên kết Hydrogen (A liên kết với T bằng 2 liên kết H; G liên kết với C bằng 3 liên kết H): H = 2A + 3G = N + G.\n' +
          '2. Công thức nhân đôi DNA, Phiên mã và Dịch mã:\n' +
          '- Một gene nhân đôi k lần liên tiếp tạo ra 2^k gene con; Số nucleotide môi trường nội bào cần cung cấp: N_mt = N . (2^k - 1); A_mt = A . (2^k - 1).\n' +
          '- Phân tử mRNA có số ribonucleotide rN = N / 2; Số bộ ba mã sao (codon) = rN / 3 = N / 6; Số amino acid trong chuỗi polypeptide hoàn chỉnh = (N / 6) - 2.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Vat_Li_Nang_Cao_Lop_9.pdf',
        size: '3.8 MB',
        chunks: [
          {
            page: 25,
            content:
              "[Chuyên đề Vật lí 9 Nâng cao - Điện học & Quang hình học] Trong đoạn mạch gồm điện trở R0 mắc nối tiếp với biến trở R vào nguồn điện hiệu điện thế U không đổi, công suất tiêu thụ trên biến trở R là P_R = I^2 . R = U^2 . R / (R0 + R)^2. Áp dụng bất đẳng thức Cauchy, P_R đạt giá trị lớn nhất P_max = U^2 / (4R0) khi R = R0. Trong quang hình học thấu kính hội tụ tiêu cự f, nếu vật đặt cách thấu kính khoảng d > f thì cho ảnh thật cách thấu kính khoảng d' thỏa mãn 1/f = 1/d + 1/d', chiều cao ảnh h'/h = d'/d.",
          },
        ],
      },
      {
        fileName: 'Chuyen_De_Hoa_Hoc_Nang_Cao_Lop_9.pdf',
        size: '3.9 MB',
        chunks: [
          {
            page: 32,
            content:
              '[Chuyên đề Hóa học 9 Nâng cao - Kim loại & Hữu cơ] Phương pháp tăng giảm khối lượng: Khi nhúng thanh sắt (Fe = 56) vào dung dịch CuSO4 (Cu = 64), phản ứng Fe + CuSO4 -> FeSO4 + Cu làm khối lượng thanh kim loại tăng Δm = (64 - 56) . n_Fe = 8 . n_Fe (gam). Trong bài toán đốt cháy hoàn toàn hydrocarbon C_x H_y thu được CO2 và H2O: số mol C bằng n_CO2, số mol H bằng 2.n_H2O, khối lượng hydrocarbon m = 12.n_CO2 + 2.n_H2O.',
          },
        ],
      },
      {
        fileName: 'Chuyen_De_Sinh_Hoc_Nang_Cao_Lop_9.pdf',
        size: '3.7 MB',
        chunks: [
          {
            page: 18,
            content:
              '[Chuyên đề Sinh học 9 Nâng cao - Toán Di truyền phân tử DNA] Một gene mạch kép có tổng số nucleotide N = 2A + 2G (%A + %G = 50%), chiều dài L = (N / 2) . 3,4 (Å) (với 1 mm = 10^7 Å, 1 μm = 10^4 Å), số chu kì xoắn C = N / 20, khối lượng M = N . 300 đvC và tổng số liên kết hydrogen H = 2A + 3G. Khi gene tự nhân đôi k lần liên tiếp, số gene con tạo ra là 2^k và số nucleotide tự do môi trường cung cấp là N_mt = N . (2^k - 1).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Vật lí 9 Nâng cao] Đặt hiệu điện thế không đổi U = 12 V vào hai đầu đoạn mạch gồm điện trở R0 = 6 Ω mắc nối tiếp với biến trở R. Điều chỉnh biến trở R bằng bao nhiêu thì công suất tiêu thụ trên biến trở R đạt giá trị cực đại (P_max)?',
        options: [
          'R = 6 Ω và P_max = 6 W',
          'R = 12 Ω và P_max = 12 W',
          'R = 3 Ω và P_max = 24 W',
          'R = 6 Ω và P_max = 12 W',
        ],
        correctOption: 'R = 6 Ω và P_max = 6 W',
        explanation:
          'Công suất trên biến trở R đạt cực đại khi R = R0 = 6 Ω. Giá trị công suất cực đại là P_max = U^2 / (4.R0) = 12^2 / (4 . 6) = 144 / 24 = 6 (W).',
      },
      {
        content:
          '[Hóa học 9 Nâng cao] Nhúng một thanh sắt (Fe = 56) nặng 50 gam vào dung dịch CuSO4 dư. Sau một thời gian lấy thanh sắt ra, rửa nhẹ, làm khô và cân lại thấy nặng 51,6 gam (giả sử toàn bộ đồng sinh ra bám hết vào thanh sắt). Khối lượng sắt đã tham gia phản ứng là:',
        options: ['11,2 gam', '5,6 gam', '1,6 gam', '12,8 gam'],
        correctOption: '11,2 gam',
        explanation:
          'Theo phương trình Fe + CuSO4 -> FeSO4 + Cu, cứ 1 mol (56g) Fe tan ra thì có 1 mol (64g) Cu bám vào, làm khối lượng thanh kim loại tăng Δm = 64 - 56 = 8 (g). Độ tăng thực tế = 51,6 - 50 = 1,6 (g) => n_Fe phản ứng = 1,6 / 8 = 0,2 (mol) => m_Fe = 0,2 . 56 = 11,2 (gam).',
      },
      {
        content:
          '[Sinh học 9 Nâng cao] Một gene ở sinh vật nhân thực có chiều dài L = 4080 Å và có số nucleotide loại Adenine (A) chiếm 20% tổng số nucleotide của gene. Số liên kết Hydrogen (H) của gene đó là:',
        options: [
          '3120 liên kết',
          '2880 liên kết',
          '2400 liên kết',
          '3600 liên kết',
        ],
        correctOption: '3120 liên kết',
        explanation:
          'Tổng số nucleotide của gene: N = (2 . L) / 3,4 = (2 . 4080) / 3,4 = 2400 (nu). Ta có A = T = 20% . 2400 = 480 (nu); G = C = 30% . 2400 = 720 (nu). Số liên kết Hydrogen: H = 2A + 3G = 2.480 + 3.720 = 960 + 2160 = 3120.',
      },
    ],
  },

  // =========================================================================
  // 3. MÔN TIẾNG ANH NÂNG CAO (KHỐI 6, 7, 8, 9)
  // =========================================================================
  {
    subjectName: 'Tiếng Anh',
    grade: 6,
    additionalDescription:
      'Bổ sung Chuyên đề Tiếng Anh 6 Nâng cao (IOE & HSG): Word Formation (Tiền tố & Hậu tố), Tag Questions, Collocations (do/play/go/have) và Sentence Transformation.',
    lessons: [
      {
        order: 5,
        title:
          '[Chuyên đề Nâng cao] Word Formation, Collocations, Tag Questions & Sentence Transformation Lớp 6',
        content:
          '1. Advanced Collocations with Sports & Activities:\n' +
          '- PLAY + môn thể thao có bóng hoặc tính đối kháng đồng đội (play football, play badminton, play chess).\n' +
          '- DO + môn võ thuật, thể dục cá nhân trong phòng (do judo, do karate, do aerobics, do yoga, do gymnastics).\n' +
          '- GO + V-ing cho hoạt động ngoài trời (go swimming, go cycling, go fishing, go skiing).\n' +
          '2. Word Formation (Cấu tạo từ cơ bản cho HSG Lớp 6):\n' +
          '- Danh từ chỉ người: V + -er/-or/-ist (teach -> teacher, act -> actor,发明 invent -> inventor, art -> artist, science -> scientist).\n' +
          '- Tính từ: N + -ful (careful, peaceful, helpful, polluted/pollution) vs. N + -less (careless, homeless); Tiền tố trái nghĩa: un- (unhappy, unfriendly), im- (impolite, impossible).\n' +
          '3. Sentence Transformation (Viết lại câu không đổi nghĩa):\n' +
          '- There is/are + N <=> S + have/has + N.\n' +
          '- S1 + be + adj-er + than + S2 <=> S2 + be + not as + adj + as + S1 (hoặc dùng tính từ trái nghĩa).\n' +
          '- What + (a/an) + adj + N! <=> How + adj + S + be! (Câu cảm thán).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Tieng_Anh_Nang_Cao_IOE_Lop_6.pdf',
        size: '2.4 MB',
        chunks: [
          {
            page: 14,
            content:
              '[Chuyên đề Tiếng Anh 6 Nâng cao - Collocations & Sentence Transformation] Quy tắc kết hợp từ (Collocations): dùng PLAY với các môn bóng và cờ (football, tennis, chess); dùng DO với võ thuật và thể dục (judo, karate, aerobics, yoga); dùng GO với các môn tận cùng bằng -ing (swimming, jogging, camping). Cấu trúc viết lại câu tương đương: (1) My school has 30 classrooms <=> There are 30 classrooms in my school; (2) Living in the city is noisier than living in the country <=> Living in the country is quieter than (or not as noisy as) living in the city.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Advanced] Rewrite the sentence with the same meaning: "No river in the world is longer than the Nile."',
        options: [
          'The Nile is the longest river in the world.',
          'The Nile is longer than no river in the world.',
          'The Nile is as long as other rivers in the world.',
          'Other rivers in the world are longer than the Nile.',
        ],
        correctOption: 'The Nile is the longest river in the world.',
        explanation:
          'Cấu trúc viết lại câu từ so sánh hơn với chủ ngữ phủ định ("No river... is longer than...") sang so sánh nhất ("The Nile is the longest river...").',
      },
    ],
  },
  {
    subjectName: 'Tiếng Anh',
    grade: 7,
    additionalDescription:
      'Bổ sung Chuyên đề Tiếng Anh 7 Nâng cao (IOE & HSG): Passive Voice (Câu bị động), Used to vs. Be/Get used to, Participle Adjectives (-ed/-ing) và Clauses/Phrases of Concession.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Passive Voice, Used to vs. Be used to, Adjectives (-ed/-ing) & Concession',
        content:
          '1. Distinguishing "used to + V" vs. "be/get used to + V-ing":\n' +
          "- S + used to + V(bare-inf): Đã từng có thói quen trong quá khứ nhưng nay không còn nữa (Phủ định: didn't use to + V).\n" +
          '- S + be / get used to + V-ing / Noun: Quen với việc gì ở hiện tại.\n' +
          '2. Passive Voice (Câu bị động cơ bản & nâng cao):\n' +
          '- Present Simple Passive: S + am/is/are + V3/ed (+ by O).\n' +
          '- Past Simple Passive: S + was/were + V3/ed (+ by O).\n' +
          '3. Transforming Clauses of Concession:\n' +
          '- Although / Though / Even though + S + V, Clause <=> Despite / In spite of + Noun Phrase / V-ing (hoặc Despite the fact that + S + V), Clause.\n' +
          '4. Adjectives ending in -ED (chỉ cảm xúc bị tác động của người: interested, bored, exhausted) vs. -ING (chỉ bản chất gây ra cảm xúc của sự vật/bộ phim: interesting, boring, exhausting).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Tieng_Anh_Nang_Cao_IOE_Lop_7.pdf',
        size: '2.5 MB',
        chunks: [
          {
            page: 16,
            content:
              '[Chuyên đề Tiếng Anh 7 Nâng cao - Ngữ pháp chuyên sâu] Phân biệt: "used to + V(nguyên thể)" diễn tả thói quen trong quá khứ đã chấm dứt, còn "be/get used to + V-ing" diễn tả sự quen thuộc với một việc ở hiện tại. Chuyển đổi mệnh đề nhượng bộ: Although + S + V <=> In spite of / Despite + V-ing / Cụm danh từ (Ví dụ: Although it rained heavily <=> Despite the heavy rain). Câu bị động quá khứ đơn: S + was/were + V3/ed.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Advanced] My father ______ smoke a lot five years ago, but now he ______ doing morning exercise every day.',
        options: [
          'used to / is used to',
          'is used to / used to',
          'used to / used to',
          'gets used to / used to',
        ],
        correctOption: 'used to / is used to',
        explanation:
          'Vế đầu chỉ thói quen trong quá khứ đã bỏ ("five years ago") dùng "used to + V (smoke)"; vế sau có "doing" (V-ing) chỉ thói quen ở hiện tại ("now") dùng "is used to + V-ing".',
      },
    ],
  },
  {
    subjectName: 'Tiếng Anh',
    grade: 8,
    additionalDescription:
      'Bổ sung Chuyên đề Tiếng Anh 8 Nâng cao (IOE & HSG): Câu điều kiện loại 2, Câu tường thuật đặc biệt (gerund/to-infinitive), Cấu trúc so... that / such... that / too... to / enough... to.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Second Conditional, Advanced Reported Speech & Result Clauses (so/such/too/enough)',
        content:
          '1. Second Conditional (Câu điều kiện loại 2 - không có thật ở hiện tại):\n' +
          '- If + S + V2/ed (to be dùng were cho mọi ngôi), S + would/could/might + V(bare).\n' +
          '- Cấu trúc khuyên bảo: If I were you, I would + V...\n' +
          '2. Advanced Reported Speech with Gerunds & Infinitives:\n' +
          '- accuse + O + of + V-ing (buộc tội ai làm gì); apologize (to O) for + V-ing (xin lỗi); thank + O + for + V-ing; insist on + V-ing (khăng khăng); deny / admit + V-ing.\n' +
          '- advise / remind / warn / encourage / invite + O + (not) to V.\n' +
          '3. Sentence Transformation with Result Clauses:\n' +
          '- S + be + so + adj + that + S + V <=> S + be + such + (a/an) + adj + N + that + S + V.\n' +
          '- S + be + too + adj + (for O) + to V <=> S + be + not + adj(trái nghĩa) + enough + (for O) + to V.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Tieng_Anh_Nang_Cao_IOE_Lop_8.pdf',
        size: '2.7 MB',
        chunks: [
          {
            page: 20,
            content:
              "[Chuyên đề Tiếng Anh 8 Nâng cao - Reported Speech & Transformation] Trong câu tường thuật nâng cao, khi lời nói mang chức năng giao tiếp như cảm ơn, xin lỗi, buộc tội, khuyên bảo, ta dùng động từ tường thuật đặc biệt: apologize for + V-ing, accuse O of + V-ing, admit/deny + V-ing, remind/warn O (not) to V. Chuyển đổi mệnh đề chỉ kết quả: It was such a heavy box that I couldn't lift it <=> The box was so heavy that I couldn't lift it <=> The box was too heavy for me to lift.",
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Advanced] Choose the sentence that is closest in meaning to: "I am sorry that I broke your favourite vase," Nam said to Lan.',
        options: [
          'Nam apologized to Lan for breaking her favourite vase.',
          'Nam accused Lan of breaking her favourite vase.',
          "Nam denied breaking Lan's favourite vase.",
          'Nam reminded Lan to break her favourite vase.',
        ],
        correctOption: 'Nam apologized to Lan for breaking her favourite vase.',
        explanation:
          'Cấu trúc tường thuật lời xin lỗi: apologize to somebody for + V-ing (xin lỗi ai vì đã làm gì).',
      },
    ],
  },
  {
    subjectName: 'Tiếng Anh',
    grade: 9,
    additionalDescription:
      'Bổ sung Chuyên đề Tiếng Anh 9 Nâng cao & Ôn thi Chuyên Anh: Đảo ngữ (Inversion), Bị động khách quan (Impersonal Passive), Rút gọn mệnh đề quan hệ, Câu điều kiện loại 3 & Hỗn hợp, Subjunctive Mood.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Inversion (Đảo ngữ), Impersonal Passive, Reduced Relative Clauses & Mixed Conditionals',
        content:
          '1. Negative Inversion (Đảo ngữ nhấn mạnh với trạng từ phủ định đầu câu):\n' +
          '- Never / Rarely / Seldom / Little + trợ động từ (do/does/did/have/had/will) + S + V.\n' +
          '- Hardly / Scarcely + had + S + V3/ed + when + S + V2/ed <=> No sooner + had + S + V3/ed + than + S + V2/ed (Vừa mới... thì...).\n' +
          '- Not only + trợ động từ + S + V + but + S + also + V.\n' +
          '2. Impersonal Passive (Câu bị động khách quan / Bị động kép):\n' +
          '- Chủ động: People say / believe / report that + S2 + V2...\n' +
          '- Cách 1: It + is/was + said/believed + that + S2 + V2...\n' +
          '- Cách 2: S2 + is/are/was/were + said/believed + to V (nếu V2 cùng thì với V1) HOẶC + to have V3/ed (nếu V2 xảy ra trước V1).\n' +
          '3. Reduced Relative Clauses (Rút gọn mệnh đề quan hệ):\n' +
          '- Dùng V-ing khi mệnh đề mang nghĩa chủ động; Dùng V3/ed khi mệnh đề mang nghĩa bị động; Dùng to-V sau the first, the second, the last, the only hoặc so sánh nhất.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Tieng_Anh_Nang_Cao_On_Thi_Chuyen_Lop_9.pdf',
        size: '3.3 MB',
        chunks: [
          {
            page: 22,
            content:
              '[Chuyên đề Tiếng Anh 9 Nâng cao - Ôn thi Chuyên Anh] (1) Đảo ngữ: No sooner + had + S + V3/ed + than + S + V2/ed = Hardly/Scarcely + had + S + V3/ed + when + S + V2/ed. (2) Bị động khách quan: People think that he stole the car -> He is thought to have stolen the car (dùng to have V3/ed vì hành động stole ở quá khứ xảy ra trước think ở hiện tại). (3) Rút gọn mệnh đề quan hệ sau the first/last/only dùng to-infinitive (hoặc to be V3/ed nếu bị động).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Chuyên Anh 9] No sooner ______ the house than it started to pour with rain.',
        options: ['had we left', 'we had left', 'did we leave', 'have we left'],
        correctOption: 'had we left',
        explanation:
          'Cấu trúc đảo ngữ "Vừa mới... thì...": No sooner + had + S + V3/ed + than + S + V2/ed -> "had we left".',
      },
      {
        content:
          '[Chuyên Anh 9] Transform into impersonal passive: "People believe that the ancient temple was built in the 12th century."',
        options: [
          'The ancient temple is believed to have been built in the 12th century.',
          'The ancient temple is believed to be built in the 12th century.',
          'The ancient temple was believed to build in the 12th century.',
          'It was believed that the ancient temple is built in the 12th century.',
        ],
        correctOption:
          'The ancient temple is believed to have been built in the 12th century.',
        explanation:
          'Động từ giới thiệu "believe" ở hiện tại đơn ("is believed"), còn hành động "was built" ở quá khứ đơn (xảy ra trước và mang nghĩa bị động) nên dùng "to have been V3/ed".',
      },
    ],
  },

  // =========================================================================
  // 4. MÔN NGỮ VĂN NÂNG CAO (KHỐI 6, 7, 8, 9)
  // =========================================================================
  {
    subjectName: 'Ngữ văn',
    grade: 6,
    additionalDescription:
      'Bổ sung Chuyên đề Ngữ văn 6 Nâng cao: Phân tích chiều sâu biện pháp tu từ (Ẩn dụ chuyển đổi cảm giác, Hoán dụ) & Kể chuyện sáng tạo nhập vai.',
    lessons: [
      {
        order: 5,
        title:
          '[Chuyên đề Nâng cao] Phân tích Biện pháp tu từ chuyên sâu (Ẩn dụ - Hoán dụ) & Nghệ thuật viết văn Tự sự sáng tạo',
        content:
          '1. Phân biệt chuyên sâu Ẩn dụ và Hoán dụ (Bồi dưỡng HSG Ngữ văn 6):\n' +
          '- Ẩn dụ (So sánh ngầm): Gọi tên sự vật A bằng tên sự vật B dựa trên quan hệ TƯƠNG ĐỒNG (giống nhau về hình thức, cách thức, phẩm chất hoặc chuyển đổi cảm giác). Ví dụ: "Ngày ngày Mặt Trời đi qua trên lăng / Thấy một Mặt Trời trong lăng rất đỏ" (Mặt Trời thứ hai ẩn dụ cho Bác Hồ).\n' +
          '- Hoán dụ: Gọi tên sự vật A bằng tên sự vật B dựa trên quan hệ TƯƠNG CẬN (gần gũi, đi đôi với nhau: lấy bộ phận chỉ toàn thể, lấy vật chứa chỉ vật bị chứa, lấy dấu hiệu chỉ sự vật). Ví dụ: "Áo chàm đưa buổi phân li" (Áo chàm là dấu hiệu trang phục hoán dụ cho đồng bào Việt Bắc).\n' +
          '2. Kỹ thuật viết bài văn đóng vai nhân vật kể lại một truyện truyền thuyết hoặc cổ tích có sáng tạo chi tiết nội tâm.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Ngu_Van_Nang_Cao_Boi_Duong_HSG_Lop_6.pdf',
        size: '2.3 MB',
        chunks: [
          {
            page: 14,
            content:
              '[Chuyên đề Ngữ văn 6 Nâng cao - Biện pháp tu từ Ẩn dụ & Hoán dụ] Điểm khác biệt cốt lõi giữa ẩn dụ và hoán dụ: Ẩn dụ dựa trên mối quan hệ tương đồng (nét giống nhau ngầm giữa hai sự vật khác loại, gồm 4 kiểu: ẩn dụ hình thức, ẩn dụ cách thức, ẩn dụ phẩm chất, ẩn dụ chuyển đổi cảm giác như "ơi con chim chiền chiện, hót chi mà vang trời, từng giọt long lanh rơi"). Hoán dụ dựa trên mối quan hệ tương cận (gần gũi thực tế giữa hai sự vật).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Ngữ văn 6 Nâng cao] Trong câu thơ "Áo chàm đưa buổi phân li / Cầm tay nhau biết nói gì hôm nay" (Tố Hữu), hình ảnh "Áo chàm" sử dụng biện pháp tu từ nào?',
        options: [
          'Hoán dụ (lấy dấu hiệu trang phục để chỉ người dân Việt Bắc)',
          'Ẩn dụ chuyển đổi cảm giác',
          'Nhân hóa',
          'Nói quá',
        ],
        correctOption:
          'Hoán dụ (lấy dấu hiệu trang phục để chỉ người dân Việt Bắc)',
        explanation:
          '"Áo chàm" là trang phục truyền thống gắn liền với đồng bào Việt Bắc (quan hệ gần gũi/tương cận: lấy dấu hiệu của sự vật để gọi sự vật) nên là phép Hoán dụ.',
      },
    ],
  },
  {
    subjectName: 'Ngữ văn',
    grade: 7,
    additionalDescription:
      'Bổ sung Chuyên đề Ngữ văn 7 Nâng cao: Chất trữ tình trong Tùy bút - Tản văn, Ngôn ngữ thơ 4-5 chữ và Phương pháp lập luận Nghị luận văn học & xã hội.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Cái "tôi" trữ tình trong Tùy bút - Tản văn & Kỹ thuật lập luận Nghị luận sắc bén',
        content:
          '1. Đặc trưng nghệ thuật của Tùy bút và Tản văn (Liên hệ tác phẩm của Vũ Bằng, Nguyễn Tuân, Hoàng Phủ Ngọc Tường, Nguyễn Ngọc Tư):\n' +
          '- Sự kết hợp nhuần nhuyễn giữa yếu tố tự sự, miêu tả với biểu cảm và triết lí sâu sắc; Ngôn từ giàu chất thơ, nhạc điệu và bộc lộ rõ nét "cái tôi" tài hoa, uyên bác, nặng lòng với văn hóa quê hương xứ sở.\n' +
          '2. Cấu trúc đoạn văn nghị luận xã hội theo mô hình Giải thích -> Phân tích (Lí lẽ + Dẫn chứng tiêu biểu) -> Bàn luận mở rộng (Phản đề) -> Bài học nhận thức và hành động.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Ngu_Van_Nang_Cao_Boi_Duong_HSG_Lop_7.pdf',
        size: '2.4 MB',
        chunks: [
          {
            page: 18,
            content:
              '[Chuyên đề Ngữ văn 7 Nâng cao - Tùy bút & Nghị luận] Trong thể loại tùy bút và tản văn, mạch cảm xúc của cái "tôi" trữ tình giữ vai trò chủ đạo kết nối các chi tiết cảnh vật, ẩm thực và phong tục văn hóa vùng miền. Khi viết bài văn nghị luận về một vấn đề đời sống (tư tưởng đạo lí hoặc câu tục ngữ), một bài văn xuất sắc bắt buộc phải có bước "Bàn luận mở rộng - Phản đề" (phê phán biểu hiện lệch lạc và nhìn nhận vấn đề từ nhiều góc độ).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Ngữ văn 7 Nâng cao] Trong bài văn nghị luận về một vấn đề trong đời sống, bước "Bàn luận mở rộng (Phản đề)" có vai trò gì quan trọng nhất?',
        options: [
          'Giúp nhìn nhận vấn đề toàn diện, đa chiều, tránh phiến diện và phê phán các biểu hiện sai lệch trái ngược',
          'Dùng để chép lại nguyên văn đề bài',
          'Dùng để kể một câu chuyện cổ tích không liên quan đến luận điểm',
          'Làm thay đổi hoàn toàn chủ đề của bài viết sang môn học khác',
        ],
        correctOption:
          'Giúp nhìn nhận vấn đề toàn diện, đa chiều, tránh phiến diện và phê phán các biểu hiện sai lệch trái ngược',
        explanation:
          'Bước phản đề/mở rộng giúp lập luận chặt chẽ, sâu sắc và khách quan hơn khi đặt vấn đề trong nhiều hoàn cảnh và phê phán các hành vi tiêu cực.',
      },
    ],
  },
  {
    subjectName: 'Ngữ văn',
    grade: 8,
    additionalDescription:
      'Bổ sung Chuyên đề Ngữ văn 8 Nâng cao: Thi pháp Thơ Đường luật, Nghệ thuật Văn chính luận trung đại (Hịch - Cáo - Chiếu) và Phân tích tình huống truyện ngắn hiện đại.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Thi pháp Thơ Đường luật, Hào khí Văn chính luận trung đại & Tình huống truyện ngắn',
        content:
          '1. So sánh ba áng văn chính luận kiệt xuất thời trung đại:\n' +
          '- "Nam quốc sơn hà" (Lý Thường Kiệt - TK XI): Bản Tuyên ngôn độc lập đầu tiên khẳng định chủ quyền lãnh thổ thiêng liêng và ý chí đánh tan giặc ngoại xâm.\n' +
          '- "Hịch tướng sĩ" (Trần Quốc Tuấn - TK XIII): Thể Hịch khích lệ lòng yêu nước, căm thù giặc và tinh thần cảnh giác học tập "Binh thư yếu lược" chống quân Mông - Nguyên.\n' +
          '- "Bình Ngô đại cáo" (Nguyễn Trãi - 1428): Thể Cáo tổng kết cuộc kháng chiến chống quân Minh, nâng tư tưởng nhân nghĩa ("Việc nhân nghĩa cốt ở yên dân") và độc lập dân tộc lên tầm cao toàn diện (văn hiến, lãnh thổ, phong tục, lịch sử, hào kiệt).\n' +
          '2. Khái niệm "Tình huống truyện" trong truyện ngắn hiện đại: Là hoàn cảnh riêng biệt, bước ngoặt chứa đựng mâu thuẫn qua đó làm bộc lộ rõ nét tính cách nhân vật và tư tưởng chủ đề của nhà văn.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Ngu_Van_Nang_Cao_Boi_Duong_HSG_Lop_8.pdf',
        size: '2.6 MB',
        chunks: [
          {
            page: 22,
            content:
              '[Chuyên đề Ngữ văn 8 Nâng cao - Văn chính luận & Truyện ngắn] Tư tưởng nhân nghĩa của Nguyễn Trãi trong "Bình Ngô đại cáo" ("Việc nhân nghĩa cốt ở yên dân / Quân điếu phạt trước lo trừ bạo") gắn liền nhân nghĩa với việc bảo vệ cuộc sống yên bình của nhân dân và tiêu diệt giặc bạo tàn xâm lược. Trong lí luận truyện ngắn, "tình huống truyện" được ví như "cái khoảnh khắc chứa đựng cả một đời người", qua đó nhân vật bộc lộ phẩm chất sâu kín nhất.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Ngữ văn 8 Nâng cao] Cốt lõi tư tưởng "Nhân nghĩa" của Nguyễn Trãi trong câu mở đầu "Việc nhân nghĩa cốt ở yên dân / Quân điếu phạt trước lo trừ bạo" (Bình Ngô đại cáo) là gì?',
        options: [
          'Lấy việc đem lại cuộc sống thái bình, ấm no cho nhân dân và diệt trừ giặc xâm lược bạo tàn làm gốc',
          'Chỉ khuyên con người tu dưỡng đạo đức cá nhân tách rời vận mệnh đất nước',
          'Chấp nhận nhượng bộ quân xâm lược để giữ hòa khí',
          'Chỉ đề cao quyền lợi của tầng lớp quý tộc phong kiến',
        ],
        correctOption:
          'Lấy việc đem lại cuộc sống thái bình, ấm no cho nhân dân và diệt trừ giặc xâm lược bạo tàn làm gốc',
        explanation:
          'Nguyễn Trãi đã phát triển khái niệm "nhân nghĩa" của Nho giáo thành tư tưởng yêu nước thương dân: yên dân gắn liền với trừ bạo (đánh đuổi giặc Minh xâm lược).',
      },
    ],
  },
  {
    subjectName: 'Ngữ văn',
    grade: 9,
    additionalDescription:
      'Bổ sung Chuyên đề Ngữ văn 9 Nâng cao & Ôn thi Chuyên Văn: Lí luận văn học (Hình tượng nghệ thuật, Giá trị hiện thực - nhân đạo, Tả cảnh ngụ tình) và Nghị luận so sánh hai tác phẩm.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Lí luận văn học Ôn thi Chuyên Văn & Phương pháp Nghị luận so sánh hai tác phẩm',
        content:
          '1. Kiến thức Lí luận văn học trọng tâm cho HSG Lớp 9:\n' +
          '- Đặc trưng của văn học: Phản ánh hiện thực cuộc sống thông qua các "hình tượng nghệ thuật" bằng chất liệu ngôn từ giàu tính thẩm mĩ (Nhà văn Nam Cao: "Văn chương không cần đến những người thợ khéo tay, làm theo một vài kiểu mẫu đưa cho. Văn chương chỉ dung nạp những người biết đào sâu, biết tìm tòi, khơi những nguồn chưa ai khơi, và sáng tạo những cái gì chưa có").\n' +
          '- Hai giá trị tư tưởng lớn: Giá trị hiện thực (phản ánh chân thực bức tranh xã hội và số phận con người) và Giá trị nhân đạo (đồng cảm với nỗi khổ, ngợi ca vẻ đẹp phẩm chất, lên án thế lực tàn bạo và trân trọng khát vọng hạnh phúc của con người - đặc biệt là người phụ nữ như Vũ Nương, Thúy Kiều).\n' +
          '2. Phương pháp làm bài Nghị luận văn học so sánh hai đoạn trích/tác phẩm:\n' +
          '- Bước 1: Phân tích làm rõ nội dung và nghệ thuật của từng đoạn trích.\n' +
          '- Bước 2: Chỉ ra điểm tương đồng (về đề tài, cảm hứng nhân đạo/yêu nước) và điểm khác biệt (do hoàn cảnh sáng tác, thể loại và phong cách nghệ thuật riêng của mỗi tác giả).\n' +
          '- Bước 3: Lý giải nguyên nhân của sự tương đồng và khác biệt.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Ngu_Van_Nang_Cao_On_Thi_Chuyen_Lop_9.pdf',
        size: '3.2 MB',
        chunks: [
          {
            page: 24,
            content:
              '[Chuyên đề Ngữ văn 9 Nâng cao - Lí luận văn học & Truyện Kiều] Bút pháp "tả cảnh ngụ tình" của đại thi hào Nguyễn Du trong đoạn trích "Kiều ở lầu Ngưng Bích" (Truyện Kiều): Mỗi bức tranh thiên nhiên đều được nhìn qua lăng kính tâm trạng của Thúy Kiều ("Người buồn cảnh có vui đâu bao giờ"), đặc biệt cụm 8 câu cuối với điệp ngữ liên hoàn "Buồn trông..." tạo âm hưởng trầm buồn, dự báo sóng gió cuộc đời. Khi so sánh hai nhân vật Vũ Nương (Chuyện người con gái Nam Xương) và Thúy Kiều (Truyện Kiều), cả hai đều kết tinh vẻ đẹp truyền thống và số phận bi kịch của người phụ nữ trong xã hội phong kiến, nhưng được thể hiện qua hai thể loại khác nhau (truyện truyền kì văn xuôi chữ Hán và truyện thơ Nôm lục bát).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Chuyên Văn 9] Trong đoạn trích "Kiều ở lầu Ngưng Bích" (Truyện Kiều - Nguyễn Du), bút pháp nghệ thuật đặc sắc nhất được sử dụng trong 8 câu thơ cuối bắt đầu bằng điệp ngữ "Buồn trông..." là gì?',
        options: [
          'Nghệ thuật tả cảnh ngụ tình kết hợp điệp ngữ liên hoàn và hệ thống từ láy gợi hình, gợi cảm',
          'Nghệ thuật trào phúng châm biếm',
          'Nghệ thuật tự sự thuần túy không có yếu tố miêu tả',
          'Bút pháp ước lệ cổ điển chỉ miêu tả vẻ đẹp ngoại hình nhân vật',
        ],
        correctOption:
          'Nghệ thuật tả cảnh ngụ tình kết hợp điệp ngữ liên hoàn và hệ thống từ láy gợi hình, gợi cảm',
        explanation:
          '8 câu thơ cuối đoạn "Kiều ở lầu Ngưng Bích" là đỉnh cao của nghệ thuật tả cảnh ngụ tình: mượn cảnh thiên nhiên từ xa đến gần, từ màu sắc nhạt nhòa đến âm thanh dữ dội để diễn tả nỗi cô đơn, sợ hãi và dự cảm bất trắc của Thúy Kiều.',
      },
    ],
  },

  // =========================================================================
  // 5. MÔN LỊCH SỬ VÀ ĐỊA LÍ NÂNG CAO (KHỐI 6, 7, 8, 9)
  // =========================================================================
  {
    subjectName: 'Lịch sử và Địa lí',
    grade: 6,
    additionalDescription:
      'Bổ sung Chuyên đề Lịch sử & Địa lí 6 Nâng cao: So sánh văn minh cổ đại Đông - Tây, Bài toán tính tỉ lệ bản đồ, tính giờ các múi giờ quốc tế và độ giảm nhiệt độ theo độ cao.',
    lessons: [
      {
        order: 5,
        title:
          '[Chuyên đề Nâng cao] So sánh Văn minh Cổ đại Đông - Tây & Bài toán Địa lí (Tỉ lệ bản đồ, Múi giờ, Nhiệt độ theo độ cao)',
        content:
          '1. Lịch sử 6 Nâng cao — So sánh các quốc gia cổ đại phương Đông và phương Tây:\n' +
          '- Phương Đông (Ai Cập, Lưỡng Hà, Ấn Độ, Trung Quốc): Hình thành sớm bên lưu vực các dòng sông lớn có phù sa màu mỡ, kinh tế nông nghiệp trồng lúa tưới tiêu là chính, thể chế Quân chủ chuyên chế cổ đại.\n' +
          '- Phương Tây (Hy Lạp, La Mã): Hình thành muộn hơn trên các bán đảo nhiều vịnh cảng, đất canh tác ít nên kinh tế thủ công nghiệp và thương mại hàng hải phát triển mạnh, thể chế Dân chủ chủ nô / Cộng hòa quý tộc.\n' +
          '2. Địa lí 6 Nâng cao — Ba bài toán tính toán Địa lí trọng tâm:\n' +
          '- Bài toán 1 (Tỉ lệ bản đồ 1 : M): Khoảng cách thực tế D_thực = d_bản_đồ . M (lưu ý: 1 km = 100.000 cm).\n' +
          '- Bài toán 2 (Tính giờ theo 24 múi giờ, mỗi múi giờ rộng 15° kinh tuyến): Giờ tại địa điểm B (múi m_B) so với địa điểm A (múi m_A): T_B = T_A + (m_B - m_A) (Việt Nam thuộc múi giờ GMT+7; ở phía Đông thì cộng thêm, phía Tây thì trừ đi).\n' +
          '- Bài toán 3 (Tính nhiệt độ theo độ cao địa hình ở tầng đối lưu): Cứ lên cao 100m thì nhiệt độ không khí giảm 0,6°C: t_cao = t_thấp - [(H_cao - H_thấp) / 100] . 0,6.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Lich_Su_Dia_Li_Nang_Cao_Lop_6.pdf',
        size: '2.5 MB',
        chunks: [
          {
            page: 16,
            content:
              '[Chuyên đề Lịch sử & Địa lí 6 Nâng cao] (1) Công thức tính giờ khu vực: Trái Đất chia làm 24 múi giờ (mỗi múi 15° kinh tuyến), Việt Nam ở múi giờ số 7 (GMT+7), Luân Đôn ở múi giờ 0, Tokyo ở múi giờ 9. Khi ở Luân Đôn (GMT+0) là 8 giờ sáng thì ở Hà Nội (GMT+7) là 8 + 7 = 15 giờ cùng ngày. (2) Quy luật đai cao: Trong tầng đối lưu, trung bình cứ lên cao 100m thì nhiệt độ không khí giảm đi 0,6°C.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Địa lí 6 Nâng cao] Ở chân một ngọn núi (độ cao 0 m) có nhiệt độ không khí là 28°C. Biết trung bình cứ lên cao 100 m thì nhiệt độ giảm 0,6°C. Hỏi ở đỉnh núi cao 2500 m thì nhiệt độ không khí là bao nhiêu?',
        options: ['13°C', '15°C', '16°C', '10°C'],
        correctOption: '13°C',
        explanation:
          'Chênh lệch độ cao là 2500 m (= 25 lần 100 m). Độ giảm nhiệt độ = 25 . 0,6 = 15°C. Nhiệt độ ở đỉnh núi = 28 - 15 = 13°C.',
      },
    ],
  },
  {
    subjectName: 'Lịch sử và Địa lí',
    grade: 7,
    additionalDescription:
      'Bổ sung Chuyên đề Lịch sử & Địa lí 7 Nâng cao: Nghệ thuật quân sự Đại Việt thời Lý - Trần - Lê sơ và Phân tích tương quan địa hình - khí hậu các châu lục.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Nghệ thuật quân sự Đại Việt (Lý - Trần - Lê sơ) & Phân tích Khí hậu các châu lục',
        content:
          '1. Tổng kết nét độc đáo trong nghệ thuật quân sự giữ nước thời Lý – Trần – Lê sơ:\n' +
          '- Kháng chiến chống Tống thời Lý (1075 - 1077): Kế sách "Tiên phát chế nhân" (Ngồi yên đợi giặc không bằng đem quân đánh trước để chặn mũi nhọn của giặc) của Thái úy Lý Thường Kiệt gắn với phòng tuyến sông Như Nguyệt.\n' +
          '- Ba lần kháng chiến chống Mông - Nguyên thời Trần (TK XIII): Kế sách "Thanh dã" (Vườn không nhà trống), rút lui chiến lược bảo toàn lực lượng rồi phản công tiêu diệt địch khi chúng mệt mỏi, thiếu lương thực ("Lấy đoản binh chế trường trận"), đỉnh cao là trận Bạch Đằng 1288.\n' +
          '- Khởi nghĩa Lam Sơn (1418 - 1427): Nghệ thuật chiến tranh nhân dân "Lấy yếu chống mạnh, lấy ít địch nhiều", kết hợp đấu tranh quân sự với ngoại giao tâm công ("Mưu phạt tâm công") của Lê Lợi - Nguyễn Trãi.\n' +
          '2. Địa lí 7 Nâng cao: Giải thích vì sao Châu Phi nóng và khô bậc nhất thế giới (do đại bộ phận lãnh thổ nằm giữa hai chí tuyến Bắc - Nam, hình khối lục địa đồ sộ, bờ biển ít bị cắt xẻ và có các dòng biển lạnh chảy ven bờ).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Lich_Su_Dia_Li_Nang_Cao_Lop_7.pdf',
        size: '2.6 MB',
        chunks: [
          {
            page: 18,
            content:
              '[Chuyên đề Lịch sử & Địa lí 7 Nâng cao] Nghệ thuật quân sự tiêu biểu thời phong kiến độc lập: Thời Lý với chủ trương "Tiên phát chế nhân" của Lý Thường Kiệt; Thời Trần với kế sách "Vườn không nhà trống" (Thanh dã) và tư tưởng "Khoan thư sức dân để làm kế sâu rễ bền gốc" của Trần Quốc Tuấn; Khởi nghĩa Lam Sơn với nghệ thuật "vừa đánh vừa đàm" và "mưu phạt tâm công" (đánh vào lòng người) của Nguyễn Trãi.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Lịch sử 7 Nâng cao] Trong cuộc kháng chiến chống quân Tống xâm lược (1075 - 1077), Thái úy Lý Thường Kiệt đã thực hiện kế sách quân sự độc đáo nào để giành thế chủ động ngay từ đầu?',
        options: [
          '"Tiên phát chế nhân" (Chủ động tấn công trước vào căn cứ tập kết lương thảo của giặc rồi lui về lập phòng tuyến sông Như Nguyệt)',
          'Kế sách "Vườn không nhà trống" rút bỏ kinh thành Thăng Long',
          'Đóng cọc gỗ trên sông Bạch Đằng',
          'Vây thành diệt viện ở Chi Lăng - Xương Giang',
        ],
        correctOption:
          '"Tiên phát chế nhân" (Chủ động tấn công trước vào căn cứ tập kết lương thảo của giặc rồi lui về lập phòng tuyến sông Như Nguyệt)',
        explanation:
          'Thái úy Lý Thường Kiệt chủ trương "Ngồi yên đợi giặc không bằng đem quân đánh trước để chặn thế mạnh của giặc" ("Tiên phát chế nhân") năm 1075.',
      },
    ],
  },
  {
    subjectName: 'Lịch sử và Địa lí',
    grade: 8,
    additionalDescription:
      'Bổ sung Chuyên đề Lịch sử & Địa lí 8 Nâng cao: Nghệ thuật quân sự Tây Sơn, Con đường cứu nước đầu thế kỉ XX và Phân tích sự phân hóa thiên nhiên Việt Nam.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Nghệ thuật quân sự Quang Trung - Nguyễn Huệ & Sự phân hóa thiên nhiên Việt Nam',
        content:
          '1. Lịch sử 8 Nâng cao:\n' +
          '- Nghệ thuật quân sự thiên tài của Quang Trung – Nguyễn Huệ trong đại thắng Rạch Gầm - Xoài Mút (1785) và Ngọc Hồi - Đống Đa (1789): Hành quân thần tốc, táo bạo, bất ngờ, chọn đúng thời cơ đêm Giao thừa và Mùng 5 Tết để đập tan 29 vạn quân Thanh.\n' +
          '- So sánh khuynh hướng cứu nước đầu thế kỉ XX của Phan Bội Châu (bạo động vũ trang, dựa vào Nhật Bản - phong trào Đông Du) và Phan Châu Trinh (cải cách dân chủ ôn hòa "Khai dân trí, chấn dân khí, hậu dân sinh" - phong trào Duy Tân), từ đó thấy được bước ngoặt Nguyễn Tất Thành ra đi tìm đường cứu nước mới (5/6/1911).\n' +
          '2. Địa lí 8 Nâng cao — Quy luật phân hóa thiên nhiên Việt Nam:\n' +
          '- Phân hóa Bắc - Nam (ranh giới dãy Bạch Mã 16°B): Miền Bắc có mùa đông lạnh do gió mùa Đông Bắc; miền Nam nóng quanh năm có hai mùa mưa - khô rõ rệt.\n' +
          '- Phân hóa theo độ cao (3 đai cao): Đai nhiệt đới gió mùa chân núi (< 600-700m ở miền Bắc, < 900-1000m ở miền Nam), Đai cận nhiệt đới gió mùa trên núi và Đai ôn đới gió mùa trên núi (> 2600m, chỉ có ở Hoàng Liên Sơn).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Lich_Su_Dia_Li_Nang_Cao_Lop_8.pdf',
        size: '2.7 MB',
        chunks: [
          {
            page: 20,
            content:
              '[Chuyên đề Lịch sử & Địa lí 8 Nâng cao] Thiên nhiên Việt Nam phân hóa đa dạng theo chiều Bắc - Nam (lấy dãy núi Bạch Mã ở vĩ tuyến 16°B làm ranh giới tự nhiên giữa miền khí hậu phía Bắc có mùa đông lạnh và miền khí hậu phía Nam cận xích đạo nóng quanh năm), theo chiều Đông - Tây (vùng biển - thềm lục địa -> vùng đồng bằng ven biển -> vùng đồi núi) và theo độ cao (3 đai cao tự nhiên; đai ôn đới gió mùa trên núi cao trên 2600m chỉ xuất hiện ở dãy Hoàng Liên Sơn).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Địa lí 8 Nâng cao] Dãy núi nào chạy ngang ra sát biển ở vĩ tuyến 16°B đóng vai trò là ranh giới tự nhiên phân chia miền khí hậu phía Bắc (có mùa đông lạnh) và miền khí hậu phía Nam (nóng quanh năm) của nước ta?',
        options: [
          'Dãy Bạch Mã',
          'Dãy Hoàng Liên Sơn',
          'Dãy Hoành Sơn',
          'Cánh cung Đông Triều',
        ],
        correctOption: 'Dãy Bạch Mã',
        explanation:
          'Dãy núi Bạch Mã (khoảng vĩ tuyến 16°B, giữa Huế và Đà Nẵng) chắn gió mùa Đông Bắc làm suy yếu hoàn toàn khi xuống phía Nam, tạo ranh giới khí hậu Bắc - Nam.',
      },
    ],
  },
  {
    subjectName: 'Lịch sử và Địa lí',
    grade: 9,
    additionalDescription:
      'Bổ sung Chuyên đề Lịch sử & Địa lí 9 Nâng cao (Ôn thi HSG & Chuyên): Các bước ngoặt cách mạng Việt Nam (1930 - 1945 - 1954 - 1975) và Công thức xử lý bảng số liệu & Nhận diện biểu đồ Địa lí kinh tế.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Tổng kết Nghệ thuật Cách mạng Việt Nam hiện đại & Kỹ năng Tính toán - Nhận diện Biểu đồ Địa lí',
        content:
          '1. Lịch sử 9 Nâng cao — Các mốc son và bài học lịch sử trọng đại:\n' +
          '- Ý nghĩa thành lập Đảng Cộng sản Việt Nam (Đầu xuân 1930): Chấm dứt thời kì khủng hoảng về đường lối và giai cấp lãnh đạo của cách mạng Việt Nam; là sự kết hợp giữa Chủ nghĩa Mác - Lênin với phong trào công nhân và phong trào yêu nước.\n' +
          '- Nghệ thuật chớp thời cơ "ngàn năm có một" trong Cách mạng tháng Tám năm 1945 (từ khi Nhật đầu hàng Đồng minh 15/8/1945 đến trước khi quân Đồng minh vào Đông Dương).\n' +
          '2. Địa lí 9 Nâng cao — Hệ thống công thức xử lý số liệu & Nhận diện biểu đồ:\n' +
          '- Tỉ trọng thành phần: %A = (Giá trị A / Tổng số) . 100%.\n' +
          '- Tốc độ tăng trưởng (lấy năm đầu tiên làm gốc = 100%): Tốc độ năm n (%) = (Giá trị năm n / Giá trị năm gốc) . 100%.\n' +
          '- Mật độ dân số = Dân số (người) / Diện tích (km²) [đơn vị: người/km²]; Năng suất lúa = Sản lượng / Diện tích (1 tấn = 10 tạ).\n' +
          '- Quy tắc chọn biểu đồ chuẩn xác:\n' +
          '  + Từ khóa "Cơ cấu, tỉ trọng" (<= 3 năm): Biểu đồ Tròn.\n' +
          '  + Từ khóa "Sự chuyển dịch cơ cấu" (>= 4 năm): Biểu đồ Miền.\n' +
          '  + Từ khóa "Tốc độ tăng trưởng (%)": Biểu đồ Đường (Line chart).\n' +
          '  + Hai đại lượng có 2 đơn vị khác nhau qua nhiều năm (ví dụ Diện tích và Sản lượng): Biểu đồ Kết hợp (Cột và Đường).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Lich_Su_Dia_Li_Nang_Cao_On_Thi_Chuyen_Lop_9.pdf',
        size: '3.1 MB',
        chunks: [
          {
            page: 25,
            content:
              '[Chuyên đề Lịch sử & Địa lí 9 Nâng cao] (1) Lịch sử: Đảng Cộng sản Việt Nam ra đời (1930) là sản phẩm của sự kết hợp 3 yếu tố: Chủ nghĩa Mác - Lênin, phong trào công nhân và phong trào yêu nước Việt Nam. Thời cơ "ngàn năm có một" trong Tổng khởi nghĩa tháng Tám 1945 diễn ra trong khoảng nửa cuối tháng 8/1945 sau khi phát xít Nhật đầu hàng Đồng minh. (2) Địa lí kỹ năng biểu đồ: Khi đề bài yêu cầu thể hiện "tốc độ tăng trưởng" các đối tượng qua nhiều năm, ta xử lý số liệu về % (năm đầu = 100%) và vẽ biểu đồ Đường (đồ thị). Khi thể hiện "chuyển dịch cơ cấu" qua từ 4 mốc năm trở lên, ta vẽ biểu đồ Miền.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Địa lí 9 Nâng cao] Khi đề bài yêu cầu vẽ biểu đồ thích hợp nhất thể hiện "Tốc độ tăng trưởng" của diện tích, năng suất và sản lượng lúa qua giai đoạn 2015 - 2025 (với năm 2015 = 100%), em phải chọn loại biểu đồ nào?',
        options: [
          'Biểu đồ đường (đồ thị biểu diễn các đường xuất phát cùng tại 100% ở năm gốc)',
          'Biểu đồ hình quạt tròn',
          'Biểu đồ miền',
          'Biểu đồ cột đơn',
        ],
        correctOption:
          'Biểu đồ đường (đồ thị biểu diễn các đường xuất phát cùng tại 100% ở năm gốc)',
        explanation:
          'Theo quy tắc Địa lí kinh tế, từ khóa "Tốc độ tăng trưởng" của nhiều đối tượng có đơn vị khác nhau quy về % (năm gốc = 100%) luôn vẽ Biểu đồ đường.',
      },
    ],
  },

  // =========================================================================
  // 6. MÔN TIN HỌC NÂNG CAO (KHỐI 6, 7, 8, 9)
  // =========================================================================
  {
    subjectName: 'Tin học',
    grade: 6,
    additionalDescription:
      'Bổ sung Chuyên đề Tin học 6 Nâng cao: Hệ đếm nhị phân (Chuyển đổi cơ số 10 sang cơ số 2) & Tối ưu hóa sơ đồ khối thuật toán.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao] Hệ đếm Nhị phân (Binary) & Thiết kế Thuật toán nâng cao',
        content:
          '1. Biểu diễn số tự nhiên trong Hệ nhị phân (Cơ số 2):\n' +
          '- Cách đổi số thập phân N sang nhị phân: Chia liên tiếp N cho 2, lấy phần dư (0 hoặc 1) rồi viết ngược các số dư từ phép chia cuối cùng lên đầu. Ví dụ: 13 = 1101(2) vì 13 = 1.2^3 + 1.2^2 + 0.2^1 + 1.2^0 = 8 + 4 + 0 + 1.\n' +
          '2. Quy đổi chính xác dung lượng lưu trữ nhị phân: 1 Byte = 8 bit; 1 KB = 2^10 Byte = 1024 Byte; 1 MB = 1024 KB; 1 GB = 1024 MB.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Tin_Hoc_Nang_Cao_Lop_6.pdf',
        size: '1.9 MB',
        chunks: [
          {
            page: 12,
            content:
              '[Chuyên đề Tin học 6 Nâng cao - Hệ nhị phân] Để đổi một số nguyên dương từ hệ thập phân sang hệ nhị phân (dãy bit 0 và 1), ta chia liên tiếp số đó cho 2 cho đến khi thương bằng 0, sau đó viết các số dư theo thứ tự từ dưới lên trên (Ví dụ: 10 đổi sang nhị phân là 1010; 13 đổi sang nhị phân là 1101). Một dãy gồm n bit có thể biểu diễn được 2^n trạng thái khác nhau.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Tin học 6 Nâng cao] Số tự nhiên 13 trong hệ thập phân khi chuyển sang biểu diễn bằng dãy bit trong hệ nhị phân là:',
        options: ['1101', '1011', '1110', '1001'],
        correctOption: '1101',
        explanation:
          'Ta có 13 = 8 + 4 + 0 + 1 = 1.2^3 + 1.2^2 + 0.2^1 + 1.2^0 => biểu diễn nhị phân là 1101.',
      },
    ],
  },
  {
    subjectName: 'Tin học',
    grade: 7,
    additionalDescription:
      'Bổ sung Chuyên đề Tin học 7 Nâng cao: Phân tích số bước lặp của Thuật toán Tìm kiếm nhị phân (log2 N) và Sắp xếp.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao] Đánh giá hiệu quả Thuật toán Tìm kiếm Nhị phân (O(log2 N)) & Hàm bảng tính kết hợp',
        content:
          '1. So sánh số lần so sánh tối đa giữa Tìm kiếm tuần tự và Tìm kiếm nhị phân:\n' +
          '- Với danh sách có N phần tử đã sắp xếp:\n' +
          '  + Tìm kiếm tuần tự: Trường hợp xấu nhất cần tới N bước so sánh.\n' +
          '  + Tìm kiếm nhị phân: Mỗi bước chia đôi danh sách nên số bước so sánh tối đa chỉ là ⌊log2(N)⌋ + 1. Ví dụ: Với danh sách N = 1000 phần tử (vì 2^9 = 512 < 1000 < 1024 = 2^10), tìm kiếm nhị phân chỉ cần tối đa 10 bước so sánh!\n' +
          '2. Theo dõi từng bước hoán đổi (Swap) của thuật toán Sắp xếp nổi bọt (Bubble Sort) và Sắp xếp chọn (Selection Sort).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Tin_Hoc_Nang_Cao_Lop_7.pdf',
        size: '2.0 MB',
        chunks: [
          {
            page: 14,
            content:
              '[Chuyên đề Tin học 7 Nâng cao - Độ phức tạp tìm kiếm nhị phân] Trong thuật toán tìm kiếm nhị phân trên dãy N phần tử đã sắp xếp tăng dần, chỉ số phần tử giữa được tính bởi mid = (left + right) // 2. Số lần chia đôi tối đa không vượt quá log2(N) + 1. Chẳng hạn với danh sách 1024 học sinh đã xếp theo thứ tự bảng chữ cái, tìm kiếm nhị phân chỉ mất tối đa 11 lần so sánh trong khi tìm kiếm tuần tự có thể mất tới 1024 lần.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Tin học 7 Nâng cao] Cho một danh sách gồm 64 số nguyên đã được sắp xếp theo thứ tự tăng dần: 2, 5, 8, ... Khi dùng thuật toán Tìm kiếm nhị phân, số lần so sánh tối đa để kết luận một số có nằm trong danh sách hay không là:',
        options: ['7 lần', '64 lần', '32 lần', '16 lần'],
        correctOption: '7 lần',
        explanation:
          'Vì 64 = 2^6, mỗi lần so sánh chia đôi vùng tìm kiếm (64 -> 32 -> 16 -> 8 -> 4 -> 2 -> 1) nên cần tối đa 6 + 1 = 7 lần so sánh.',
      },
    ],
  },
  {
    subjectName: 'Tin học',
    grade: 8,
    additionalDescription:
      'Bổ sung Chuyên đề Tin học 8 Nâng cao (Thi Tin học trẻ): Lập trình thuật toán Kiểm tra số nguyên tố tối ưu (√N), Thuật toán Euclid tìm ƯCLN và BCNN.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao] Lập trình Thuật toán Số học tối ưu (Kiểm tra Số nguyên tố √N & Thuật toán Euclid)',
        content:
          '1. Thuật toán kiểm tra số nguyên tố tối ưu (Duyệt đến √N):\n' +
          '- Nếu số tự nhiên N >= 2 có một ước lớn hơn √N thì chắc chắn nó phải có một ước tương ứng nhỏ hơn hoặc bằng √N.\n' +
          '- Do đó chỉ cần kiểm tra các số i từ 2 đến int(√N): nếu không có số i nào mà N chia hết cho i thì N là số nguyên tố (giảm số vòng lặp từ 1.000.000 xuống chỉ còn 1.000 khi N = 10^6).\n' +
          '2. Thuật toán Euclid tìm ƯCLN(a, b) và BCNN(a, b):\n' +
          '- Lặp khi b != 0: gán (a, b) = (b, a mod b). Khi b = 0 thì a chính là ƯCLN.\n' +
          '- Từ đó suy ra BCNN(a, b) = (a . b) // ƯCLN(a, b).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Tin_Hoc_Nang_Cao_Lap_Trinh_Lop_8.pdf',
        size: '2.2 MB',
        chunks: [
          {
            page: 16,
            content:
              '[Chuyên đề Tin học 8 Nâng cao - Thuật toán Lập trình] Để kiểm tra một số nguyên dương N lớn (ví dụ N = 10^9) có phải là số nguyên tố hay không, ta chỉ cần duyệt các ước từ 2 đến phần nguyên của √N (độ phức tạp O(√N)). Để tìm ƯCLN của hai số nguyên dương a và b cực nhanh, ta dùng thuật toán Euclid dựa trên phép chia lấy dư: ƯCLN(a, b) = ƯCLN(b, a % b) cho đến khi số dư bằng 0.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Tin học 8 Nâng cao] Để kiểm tra số tự nhiên N = 10.000 có phải là số nguyên tố hay không bằng thuật toán tối ưu (kiểm tra các ước từ 2 đến √N), vòng lặp cần kiểm tra tối đa đến giá trị ước bằng bao nhiêu?',
        options: ['100', '5.000', '10.000', '1.000'],
        correctOption: '100',
        explanation:
          'Vì √10.000 = 100 nên ta chỉ cần kiểm tra các ước từ 2 đến 100 là đủ để kết luận tính nguyên tố của N.',
      },
    ],
  },
  {
    subjectName: 'Tin học',
    grade: 9,
    additionalDescription:
      'Bổ sung Chuyên đề Tin học 9 Nâng cao (Ôn thi Chuyên Tin & Tin học trẻ): Lập trình Python nâng cao (Sàng nguyên tố Eratosthenes, Quy hoạch động cơ bản) và Hàm IF lồng nhau kết hợp AND/OR.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao] Hàm Excel nâng cao (IF lồng nhau, AND/OR) & Lập trình Python Ôn thi Chuyên Tin',
        content:
          '1. Kết hợp hàm IF lồng nhau với hàm logic AND, OR trong Excel:\n' +
          '- Xếp loại học tập tự động: =IF(AND(DTB>=8, HanhKiem="Tốt"), "Giỏi", IF(AND(DTB>=6.5, HanhKiem<>"Yếu"), "Khá", "Đạt")).\n' +
          '- Hàm SUMIFS, COUNTIFS với nhiều điều kiện đồng thời.\n' +
          '2. Thuật toán ôn thi Chuyên Tin & Tin học trẻ (Python):\n' +
          '- Sàng số nguyên tố Eratosthenes: Liệt kê tất cả các số nguyên tố không vượt quá N trong thời gian O(N log log N).\n' +
          '- Mảng cộng dồn (Prefix Sum): Cho mảng A[1..N], xây dựng S[i] = S[i-1] + A[i] để tính nhanh tổng đoạn A[L..R] = S[R] - S[L-1] chỉ trong 1 phép trừ O(1).\n' +
          '- Quy hoạch động cơ bản (Dynamic Programming): Bài toán dãy Fibonacci F[n] = F[n-1] + F[n-2] và bài toán dãy con tăng dài nhất.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Tin_Hoc_Nang_Cao_On_Thi_Chuyen_Tin_Lop_9.pdf',
        size: '2.8 MB',
        chunks: [
          {
            page: 20,
            content:
              '[Chuyên đề Tin học 9 Nâng cao - Excel nâng cao & Chuyên Tin Python] Trong bảng tính Excel, hàm IF có thể lồng nhau nhiều cấp kết hợp hàm AND(đk1, đk2) (đúng khi tất cả điều kiện đều đúng) và hàm OR(đk1, đk2) (đúng khi có ít nhất 1 điều kiện đúng). Trong lập trình thuật toán Python, kỹ thuật Mảng cộng dồn (Prefix Sum) giúp trả lời M truy vấn tính tổng các phần tử từ vị trí L đến R theo công thức Sum(L, R) = S[R] - S[L-1] với độ phức tạp O(1) cho mỗi truy vấn.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Tin học 9 Nâng cao] Trong Excel, tại ô C2 có giá trị 8.5 và ô D2 có giá trị 7.0. Công thức =IF(AND(C2>=8, D2>=8), "Xuất sắc", IF(OR(C2>=8, D2>=8), "Giỏi", "Khá")) sẽ trả về kết quả nào?',
        options: ['"Giỏi"', '"Xuất sắc"', '"Khá"', '#VALUE!'],
        correctOption: '"Giỏi"',
        explanation:
          'Điều kiện AND(8.5>=8, 7.0>=8) trả về FALSE vì D2 < 8; chuyển sang IF thứ hai có điều kiện OR(8.5>=8, 7.0>=8) trả về TRUE (vì C2 >= 8) nên kết quả là "Giỏi".',
      },
    ],
  },

  // =========================================================================
  // 7. MÔN GIÁO DỤC CÔNG DÂN & CÔNG NGHỆ NÂNG CAO (KHỐI 6, 7, 8, 9)
  // =========================================================================
  {
    subjectName: 'Giáo dục công dân',
    grade: 6,
    additionalDescription:
      'Bổ sung Chuyên đề GDCD 6 Nâng cao: Xử lý tình huống Quyền trẻ em, Bảo vệ dữ liệu cá nhân trên không gian mạng và Luật Quốc tịch Việt Nam.',
    lessons: [
      {
        order: 4,
        title:
          '[Chuyên đề Nâng cao] Giải bài tập Tình huống Pháp luật về Quốc tịch & An toàn trẻ em trên không gian mạng',
        content:
          '1. Bài tập tình huống xác định Quốc tịch Việt Nam cho trẻ em sinh ra có yếu tố nước ngoài (Luật Quốc tịch Việt Nam):\n' +
          '- Trẻ em sinh ra có cha VÀ mẹ đều là công dân Việt Nam thì có quốc tịch Việt Nam (không phụ thuộc sinh trong hay ngoài lãnh thổ Việt Nam).\n' +
          '- Trẻ em sinh ra có cha HOẶC mẹ là công dân Việt Nam còn người kia là công dân nước ngoài thì có quốc tịch Việt Nam nếu có sự thỏa thuận bằng văn bản của cha mẹ; nếu sinh ra trên lãnh thổ Việt Nam mà cha mẹ không thỏa thuận được thì trẻ vẫn có quốc tịch Việt Nam.\n' +
          '2. Kỹ năng nhận diện và phòng tránh xâm hại, lừa đảo trên không gian mạng (Quy tắc 4 Không).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_GDCD_Tinh_Huong_Phap_Luat_Nang_Cao_Lop_6.pdf',
        size: '1.8 MB',
        chunks: [
          {
            page: 10,
            content:
              '[Chuyên đề GDCD 6 Nâng cao - Tình huống Luật Quốc tịch] Theo Luật Quốc tịch Việt Nam, trẻ em sinh ra trong hoặc ngoài lãnh thổ Việt Nam mà khi sinh ra có cả cha và mẹ đều là công dân Việt Nam thì đương nhiên có quốc tịch Việt Nam (nguyên tắc huyết thống). Nếu trẻ sơ sinh bị bỏ rơi được tìm thấy trên lãnh thổ Việt Nam mà không rõ cha mẹ là ai thì có quốc tịch Việt Nam.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[GDCD 6 Nâng cao] Bé An được sinh ra tại nước Pháp, có cả bố và mẹ đều là công dân nước Cộng hòa xã hội chủ nghĩa Việt Nam. Theo Luật Quốc tịch Việt Nam, bé An có quốc tịch nước nào?',
        options: [
          'Có quốc tịch Việt Nam (theo nguyên tắc huyết thống)',
          'Không có quốc tịch Việt Nam vì sinh ở nước ngoài',
          'Bắt buộc chỉ được mang quốc tịch Pháp',
          'Không có quốc tịch nào cho đến khi đủ 18 tuổi',
        ],
        correctOption: 'Có quốc tịch Việt Nam (theo nguyên tắc huyết thống)',
        explanation:
          'Theo Điều 15 Luật Quốc tịch Việt Nam, trẻ em sinh ra trong hoặc ngoài lãnh thổ Việt Nam mà khi sinh ra có cha mẹ đều là công dân Việt Nam thì có quốc tịch Việt Nam.',
      },
    ],
  },
  {
    subjectName: 'Giáo dục công dân',
    grade: 7,
    additionalDescription:
      'Bổ sung Chuyên đề GDCD 7 Nâng cao: Quy tắc quản lý tài chính cá nhân 50/30/20 và Phân biệt Di sản văn hóa UNESCO tại Việt Nam.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao] Quy tắc Quản lý Tài chính 50/30/20 & Phân loại Di sản Thế giới UNESCO tại Việt Nam',
        content:
          '1. Quy tắc quản lý tiền thông minh 50/30/20:\n' +
          '- 50% thu nhập dành cho Nhu cầu thiết yếu (ăn uống, học tập, đi lại).\n' +
          '- 30% dành cho Mong muốn cá nhân (giải trí, sở thích).\n' +
          '- 20% dành cho Tiết kiệm & Dự phòng khẩn cấp.\n' +
          '2. Phân biệt Di sản hỗn hợp duy nhất của Việt Nam được UNESCO công nhận (vừa là Di sản Văn hóa vừa là Di sản Thiên nhiên thế giới): Quần thể danh thắng Tràng An (Ninh Bình).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_GDCD_Nang_Cao_Lop_7.pdf',
        size: '1.8 MB',
        chunks: [
          {
            page: 12,
            content:
              '[Chuyên đề GDCD 7 Nâng cao - Di sản văn hóa & Quản lý tài chính] Quần thể danh thắng Tràng An (Ninh Bình) là "Di sản hỗn hợp" (vừa là di sản văn hóa vừa là di sản thiên nhiên thế giới) đầu tiên của Việt Nam và Đông Nam Á được UNESCO công nhận. Trong quản lý tiền cá nhân, quy tắc 50/30/20 chia khoản tiền thành 50% chi tiêu thiết yếu, 30% sở thích cá nhân và 20% tiết kiệm dự phòng.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[GDCD 7 Nâng cao] Di sản nào của Việt Nam được UNESCO công nhận là "Di sản thế giới hỗn hợp" (vừa là di sản văn hóa, vừa là di sản thiên nhiên thế giới)?',
        options: [
          'Quần thể danh thắng Tràng An (Ninh Bình)',
          'Phố cổ Hội An (Quảng Nam)',
          'Nhã nhạc cung đình Huế',
          'Không gian văn hóa Cồng chiêng Tây Nguyên',
        ],
        correctOption: 'Quần thể danh thắng Tràng An (Ninh Bình)',
        explanation:
          'Quần thể danh thắng Tràng An (Ninh Bình) được UNESCO ghi danh là Di sản thế giới hỗn hợp (Văn hóa và Thiên nhiên) vào năm 2014.',
      },
    ],
  },
  {
    subjectName: 'Giáo dục công dân',
    grade: 8,
    additionalDescription:
      'Bổ sung Chuyên đề GDCD 8 Nâng cao: Xử lý tình huống Bộ luật Lao động đối với người lao động chưa thành niên (từ đủ 15 đến dưới 18 tuổi) và Luật Phòng chống bạo lực gia đình.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao] Quy định Bộ luật Lao động về Thời giờ làm việc của Lao động chưa thành niên',
        content:
          '1. Quy định pháp luật chi tiết về thời giờ làm việc của người lao động chưa thành niên (Bộ luật Lao động 2019):\n' +
          '- Người từ đủ 15 tuổi đến chưa đủ 18 tuổi: Không được làm việc quá 08 giờ trong 01 ngày và 40 giờ trong 01 tuần; không được sử dụng làm các công việc nặng nhọc, độc hại, nguy hiểm.\n' +
          '- Người chưa đủ 15 tuổi: Chỉ được làm các công việc nhẹ theo danh mục quy định, không quá 04 giờ trong 01 ngày và 20 giờ trong 01 tuần, không được làm thêm giờ, làm việc vào ban đêm và không được ảnh hưởng đến thời gian học tập.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_GDCD_Phap_Luat_Lao_Dong_Nang_Cao_Lop_8.pdf',
        size: '1.9 MB',
        chunks: [
          {
            page: 14,
            content:
              '[Chuyên đề GDCD 8 Nâng cao - Pháp luật Lao động chưa thành niên] Theo Bộ luật Lao động Việt Nam: Thời giờ làm việc của người từ đủ 15 tuổi đến chưa đủ 18 tuổi không được quá 08 giờ/ngày và 40 giờ/tuần. Đối với người chưa đủ 15 tuổi, thời giờ làm việc không được quá 04 giờ/ngày và 20 giờ/tuần, đồng thời phải có sự đồng ý bằng văn bản của cha, mẹ hoặc người giám hộ hợp pháp.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[GDCD 8 Nâng cao] Theo Bộ luật Lao động Việt Nam, thời giờ làm việc tối đa của người lao động từ đủ 15 tuổi đến chưa đủ 18 tuổi được quy định như thế nào?',
        options: [
          'Không quá 08 giờ trong 01 ngày và 40 giờ trong 01 tuần',
          'Làm việc 12 giờ trong 01 ngày và 72 giờ trong 01 tuần',
          'Không giới hạn số giờ làm thêm ban đêm',
          'Bắt buộc chỉ được làm 01 giờ mỗi tuần',
        ],
        correctOption: 'Không quá 08 giờ trong 01 ngày và 40 giờ trong 01 tuần',
        explanation:
          'Theo Điều 146 Bộ luật Lao động 2019, thời giờ làm việc của người từ đủ 15 tuổi đến chưa đủ 18 tuổi không được quá 08 giờ trong 01 ngày và 40 giờ trong 01 tuần.',
      },
    ],
  },
  {
    subjectName: 'Giáo dục công dân',
    grade: 9,
    additionalDescription:
      'Bổ sung Chuyên đề GDCD 9 Nâng cao: Phân tích 4 yếu tố cấu thành Vi phạm pháp luật và Bài tập tình huống Độ tuổi chịu trách nhiệm hình sự - hành chính.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao] Giải bài tập Tình huống Pháp luật: Độ tuổi chịu Trách nhiệm Hình sự & Hành chính',
        content:
          '1. Phân biệt độ tuổi chịu trách nhiệm Hình sự và Hành chính trong các bài tập tình huống nâng cao:\n' +
          '- Về Trách nhiệm Hình sự (Điều 12 Bộ luật Hình sự):\n' +
          '  + Từ đủ 16 tuổi trở lên: Chịu trách nhiệm hình sự về MỌI tội phạm.\n' +
          '  + Từ đủ 14 tuổi đến dưới 16 tuổi: Chỉ chịu trách nhiệm hình sự về tội phạm RẤT NGHIÊM TRỌNG và ĐẶC BIỆT NGHIÊM TRỌNG được quy định trong Bộ luật Hình sự.\n' +
          '- Về Trách nhiệm Hành chính (Luật Xử lý vi phạm hành chính):\n' +
          '  + Từ đủ 16 tuổi trở lên: Bị xử phạt vi phạm hành chính về mọi vi phạm hành chính.\n' +
          '  + Từ đủ 14 tuổi đến dưới 16 tuổi: Bị xử phạt vi phạm hành chính về vi phạm hành chính do CỐ Ý (hình thức phạt cảnh cáo, không áp dụng phạt tiền đối với người từ đủ 14 đến dưới 16 tuổi).\n' +
          '- Về Trách nhiệm Dân sự: Người từ đủ 15 tuổi đến chưa đủ 18 tuổi tự mình gây thiệt hại thì lấy tài sản của mình để bồi thường; nếu không đủ tài sản thì cha, mẹ phải bồi thường phần còn thiếu.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_GDCD_Phap_Luat_Nang_Cao_Lop_9.pdf',
        size: '2.1 MB',
        chunks: [
          {
            page: 16,
            content:
              '[Chuyên đề GDCD 9 Nâng cao - Độ tuổi chịu trách nhiệm pháp lí] (1) Hình sự: Người từ đủ 16 tuổi trở lên chịu trách nhiệm hình sự về mọi tội phạm; người từ đủ 14 đến dưới 16 tuổi chịu trách nhiệm hình sự về tội phạm rất nghiêm trọng hoặc đặc biệt nghiêm trọng. (2) Hành chính: Người từ đủ 14 đến dưới 16 tuổi vi phạm hành chính do cố ý thì bị xử phạt bằng hình thức cảnh cáo (không phạt tiền).',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[GDCD 9 Nâng cao] Theo quy định của Bộ luật Hình sự Việt Nam, người ở độ tuổi nào phải chịu trách nhiệm hình sự về MỌI tội phạm do mình gây ra?',
        options: [
          'Người từ đủ 16 tuổi trở lên',
          'Người từ đủ 12 tuổi trở lên',
          'Chỉ người từ đủ 21 tuổi trở lên',
          'Mọi trẻ em từ 6 tuổi trở lên',
        ],
        correctOption: 'Người từ đủ 16 tuổi trở lên',
        explanation:
          'Theo khoản 1 Điều 12 Bộ luật Hình sự, người từ đủ 16 tuổi trở lên phải chịu trách nhiệm hình sự về mọi tội phạm; người từ đủ 14 đến dưới 16 tuổi chỉ chịu TNHS về tội rất nghiêm trọng, đặc biệt nghiêm trọng.',
      },
    ],
  },
  {
    subjectName: 'Công nghệ',
    grade: 6,
    additionalDescription:
      'Bổ sung Chuyên đề Công nghệ 6 Nâng cao (STEM): Bài toán tính Điện năng tiêu thụ (kWh) và tiền điện sinh hoạt của các đồ dùng điện trong gia đình.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao STEM] Bài toán Tính toán Điện năng tiêu thụ (kWh) và Tiết kiệm điện gia đình',
        content:
          '1. Công thức tính điện năng tiêu thụ của đồ dùng điện:\n' +
          '- A = P . t, trong đó:\n' +
          '  + P là công suất định mức của đồ dùng điện (đổi ra đơn vị kilôoát: 1 kW = 1000 W).\n' +
          '  + t là thời gian sử dụng (giờ - h).\n' +
          '  + A là điện năng tiêu thụ (đơn vị kWh — chính là "số điện" trên công tơ điện: 1 số điện = 1 kWh = 1000 Wh).\n' +
          '- Ví dụ mẫu: Một nồi cơm điện công suất P = 800 W (= 0,8 kW) dùng mỗi ngày 1,5 giờ. Trong 30 ngày nồi tiêu thụ: A = 0,8 . 1,5 . 30 = 36 (kWh = 36 số điện).',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Cong_Nghe_STEM_Nang_Cao_Lop_6.pdf',
        size: '1.8 MB',
        chunks: [
          {
            page: 12,
            content:
              '[Chuyên đề Công nghệ 6 Nâng cao - Tính điện năng tiêu thụ] Điện năng tiêu thụ của đồ dùng điện trong thời gian t (giờ) được tính bằng công thức A = P . t, với 1 kWh (1 số điện) = 1000 Wh. Để tiết kiệm điện năng, cần chọn thiết bị có nhãn năng lượng 5 sao (công nghệ Inverter/LED) và tắt nguồn khi không sử dụng.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Công nghệ 6 Nâng cao] Một bóng đèn LED có ghi "220V - 20W" được thắp sáng trung bình 5 giờ mỗi ngày. Trong 1 tháng (30 ngày), bóng đèn đó tiêu thụ hết bao nhiêu số điện (kWh)?',
        options: ['3 kWh (3 số điện)', '30 kWh', '100 kWh', '0,3 kWh'],
        correctOption: '3 kWh (3 số điện)',
        explanation:
          'Đổi P = 20 W = 0,02 kW. Điện năng tiêu thụ trong 30 ngày: A = P . t = 0,02 . 5 . 30 = 3 (kWh).',
      },
    ],
  },
  {
    subjectName: 'Công nghệ',
    grade: 7,
    additionalDescription:
      'Bổ sung Chuyên đề Công nghệ 7 Nâng cao (Nông nghiệp 4.0 & STEM): Nông nghiệp công nghệ cao (IoT, Thủy canh Hydroponics, VietGAP) và Xử lý môi trường nuôi thủy sản.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao STEM] Nông nghiệp công nghệ cao (Thủy canh, Khí canh, IoT) & Tiêu chuẩn VietGAP',
        content:
          '1. Các mô hình trồng trọt công nghệ cao không dùng đất:\n' +
          '- Thủy canh (Hydroponics): Trồng cây trực tiếp trong dung dịch dinh dưỡng hòa tan trong nước.\n' +
          '- Khí canh (Aeroponics): Rễ cây lơ lửng trong không khí và được phun sương dung dịch dinh dưỡng định kì bằng cảm biến tự động (tiết kiệm tới 95% lượng nước).\n' +
          '- Hệ thống tưới nhỏ giọt tự động ứng dụng cảm biến độ ẩm đất IoT.\n' +
          '2. Chỉ số môi trường nước nuôi thủy sản nâng cao: Độ pH thích hợp từ 6,5 đến 8,5; Hàm lượng oxygen hòa tan (DO) >= 4 mg/L.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Cong_Nghe_Nong_Nghiep_4_0_Nang_Cao_Lop_7.pdf',
        size: '1.9 MB',
        chunks: [
          {
            page: 14,
            content:
              '[Chuyên đề Công nghệ 7 Nâng cao - Nông nghiệp 4.0] Thủy canh (Hydroponics) và Khí canh (Aeroponics) là hai kỹ thuật trồng cây hiện đại không cần đất, cung cấp trực tiếp các ion khoáng thiết yếu cho bộ rễ trong nhà màng thông minh kết hợp cảm biến IoT đo nhiệt độ, độ ẩm và pH tự động.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Công nghệ 7 Nâng cao] Kỹ thuật trồng cây công nghệ cao nào trong đó bộ rễ cây treo lơ lửng trong không khí kín và được phun sương dung dịch dinh dưỡng tự động?',
        options: [
          'Khí canh (Aeroponics)',
          'Canh tác truyền thống trên đất',
          'Luân canh cây trồng trên ruộng bậc thang',
          'Bón phân lót vào hốc đất',
        ],
        correctOption: 'Khí canh (Aeroponics)',
        explanation:
          'Khí canh (Aeroponics) là công nghệ trồng cây trong môi trường không khí có phun sương dinh dưỡng trực tiếp vào bộ rễ, tiết kiệm tối đa nước và phân bón.',
      },
    ],
  },
  {
    subjectName: 'Công nghệ',
    grade: 8,
    additionalDescription:
      'Bổ sung Chuyên đề Công nghệ 8 Nâng cao (Cơ khí & Tự động hóa): Bài toán tính tỉ số truyền bộ truyền động bánh răng - đai nhiều cấp và Mạch điều khiển dùng mô-đun cảm biến.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao STEM] Bài toán Tỉ số truyền Cơ khí (i) & Mạch điện điều khiển tự động dùng Cảm biến',
        content:
          '1. Bài toán truyền chuyển động quay (Bộ truyền đai và Bộ truyền ăn khớp bánh răng - xích):\n' +
          '- Tỉ số truyền i = n_bị_dẫn / n_dẫn = n2 / n1 = D1 / D2 = Z1 / Z2 (hoặc theo quy ước SGK: n1 / n2 = D2 / D1 = Z2 / Z1, tức bánh nào có đường kính D hoặc số răng Z nhỏ hơn sẽ quay nhanh hơn: n1 . Z1 = n2 . Z2).\n' +
          '- Ví dụ mẫu: Đĩa xích xe đạp có Z1 = 45 răng quay với tốc độ n1 = 60 vòng/phút, đĩa líp có Z2 = 15 răng. Khi đó tốc độ quay của đĩa líp là n2 = (n1 . Z1) / Z2 = (60 . 45) / 15 = 180 (vòng/phút).\n' +
          '2. Sơ đồ khối Mạch điện điều khiển sử dụng mô-đun cảm biến (ánh sáng, nhiệt độ, độ ẩm): Nguồn điện -> Mô-đun cảm biến (Cảm biến + Mạch điện tử xử lí + Tiếp điểm đóng cắt Rơ-le) -> Phụ tải điện.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Cong_Nghe_Co_Khi_Cam_Bien_Nang_Cao_Lop_8.pdf',
        size: '2.0 MB',
        chunks: [
          {
            page: 15,
            content:
              '[Chuyên đề Công nghệ 8 Nâng cao - Cơ khí & Cảm biến] Trong bộ truyền ăn khớp (bánh răng hoặc đĩa - xích), tích của số răng và tốc độ quay luôn không đổi: n1 . Z1 = n2 . Z2 (bánh có số răng ít hơn sẽ quay với tốc độ lớn hơn). Trong mạch điện điều khiển tự động, cảm biến quang trở (LDR) dùng để bật/tắt đèn đường tự động khi trời tối; cảm biến nhiệt độ dùng trong bàn là, máy điều hòa; cảm biến độ ẩm dùng trong hệ thống tưới cây tự động.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Công nghệ 8 Nâng cao] Bộ truyền động đĩa - xích của một chiếc xe đạp có đĩa dẫn gồm Z1 = 48 răng và đĩa líp (bị dẫn) gồm Z2 = 16 răng. Khi người đạp xe làm đĩa dẫn quay với tốc độ n1 = 50 vòng/phút thì đĩa líp quay với tốc độ n2 bằng bao nhiêu?',
        options: [
          '150 vòng/phút',
          '50 vòng/phút',
          '16,7 vòng/phút',
          '96 vòng/phút',
        ],
        correctOption: '150 vòng/phút',
        explanation:
          'Áp dụng công thức ăn khớp n1 . Z1 = n2 . Z2 => n2 = (50 . 48) / 16 = 50 . 3 = 150 (vòng/phút).',
      },
    ],
  },
  {
    subjectName: 'Công nghệ',
    grade: 9,
    additionalDescription:
      'Bổ sung Chuyên đề Công nghệ 9 Nâng cao: Thiết kế mạch điện cầu thang (2 công tắc 3 cực điều khiển 1 bóng đèn) & Tính chọn tiết diện dây dẫn và Aptomat theo công suất.',
    lessons: [
      {
        order: 3,
        title:
          '[Chuyên đề Nâng cao] Thiết kế Mạch điện Cầu thang (2 công tắc 3 cực điều khiển 1 đèn) & Tính chọn Aptomat',
        content:
          '1. Nguyên lí hoạt động của Mạch điện hai công tắc 3 cực điều khiển một bóng đèn (Mạch điện cầu thang / phòng ngủ):\n' +
          '- Cấu tạo công tắc 3 cực: Gồm 1 cực động (chung - C) và 2 cực tĩnh (1, 2).\n' +
          '- Cách đấu dây chuẩn an toàn: Dây pha (L) đi qua cầu chì/aptomat vào cực chung C của Công tắc 1; hai cực tĩnh (1, 2) của Công tắc 1 nối tương ứng với hai cực tĩnh (1, 2) của Công tắc 2 bằng 2 dây liên động; cực chung C của Công tắc 2 nối ra bóng đèn rồi về dây trung tính (N). Nhờ đó đứng ở tầng 1 hay tầng 2 đều bật/tắt được đèn.\n' +
          '2. Tính toán dòng điện định mức để chọn Aptomat (CB/MCB) bảo vệ mạng điện trong nhà:\n' +
          '- Từ tổng công suất các thiết bị P_tổng (W) và điện áp U = 220V, dòng điện làm việc cực đại là I = P_tổng / U (A). Chọn Aptomat có dòng điện định mức I_đm >= 1,2 . I.',
      },
    ],
    documents: [
      {
        fileName: 'Chuyen_De_Cong_Nghe_Mang_Dien_Nang_Cao_Lop_9.pdf',
        size: '2.1 MB',
        chunks: [
          {
            page: 16,
            content:
              '[Chuyên đề Công nghệ 9 Nâng cao - Thiết kế mạng điện trong nhà] Để điều khiển 1 bóng đèn từ hai vị trí khác nhau (như ở hai đầu cầu thang tầng dưới và tầng trên), ta sử dụng mạch điện gồm 2 công tắc 3 cực mắc nối tiếp trên dây pha trước bóng đèn. Khi tính toán lựa chọn Aptomat (MCB) cho một nhánh mạch điện có tổng công suất P (W) ở điện áp U = 220V, ta tính dòng điện I = P / U rồi chọn Aptomat có dòng định mức lớn hơn khoảng 20% - 30% so với dòng làm việc cực đại.',
          },
        ],
      },
    ],
    questions: [
      {
        content:
          '[Công nghệ 9 Nâng cao] Để điều khiển bật/tắt 01 bóng đèn chiếu sáng cầu thang từ 02 vị trí khác nhau (ở chân cầu thang tầng 1 và đầu cầu thang tầng 2), người ta phải sử dụng loại thiết bị đóng cắt nào?',
        options: [
          'Sử dụng 02 công tắc 3 cực (công tắc hai chiều)',
          'Sử dụng 01 công tắc 2 cực thông thường',
          'Sử dụng 02 ổ cắm điện mắc song song',
          'Sử dụng 02 cầu chì mắc trên dây trung tính',
        ],
        correctOption: 'Sử dụng 02 công tắc 3 cực (công tắc hai chiều)',
        explanation:
          'Mạch điện cầu thang sử dụng 02 công tắc 3 cực nối liên động với nhau giúp bật/tắt 1 đèn độc lập từ 2 vị trí.',
      },
    ],
  },
];
