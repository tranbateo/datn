export interface CurriculumLessonSeed {
  title: string;
  order: number;
  content: string;
}

export interface CurriculumDocumentSeed {
  fileName: string;
  size: string;
  chunks: {
    page: number;
    content: string;
  }[];
}

export interface CurriculumQuizSeed {
  title: string;
  description: string;
  duration: number;
  questions: {
    content: string;
    options: string[];
    correctOption: string;
    explanation: string;
  }[];
}

export interface CurriculumCourseSeed {
  subjectName: string;
  grade: number;
  title: string;
  description: string;
  teacherCode: string;
  lessons: CurriculumLessonSeed[];
  documents: CurriculumDocumentSeed[];
  quiz: CurriculumQuizSeed;
}

export const CURRICULUM_KNTT_6_7: CurriculumCourseSeed[] = [
  // =========================================================================
  // KHỐI 6 - BỘ SÁCH KẾT NỐI TRI THỨC VỚI CUỘC SỐNG (GDPT 2018)
  // =========================================================================
  {
    subjectName: 'Toán',
    grade: 6,
    title: 'Toán 6 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Toán lớp 6 (Tập 1 & Tập 2) bộ Kết nối tri thức với cuộc sống: Số tự nhiên, Tính chia hết, Số nguyên, Phân số, Số thập phân, Hình học trực quan & phẳng, Dữ liệu và xác suất thực nghiệm.',
    teacherCode: 'GV01',
    lessons: [
      {
        order: 1,
        title: 'Chương I & II: Tập hợp các số tự nhiên và Tính chia hết',
        content:
          '1. Tập hợp các số tự nhiên: N = {0; 1; 2; 3; ...}, N* = {1; 2; 3; ...}.\n2. Phép tính lũy thừa với số mũ tự nhiên: a^m . a^n = a^(m+n); a^m : a^n = a^(m-n) (a ≠ 0, m >= n). Quy ước a^0 = 1.\n3. Thứ tự thực hiện phép tính: Ngoặc tròn () -> Ngoặc vuông [] -> Ngoặc nhọn {}; Lũy thừa -> Nhân, chia -> Cộng, trừ.\n4. Dấu hiệu chia hết cho 2, 5, 3, 9; Số nguyên tố, hợp số; Phân tích một số ra thừa số nguyên tố; Ước chung lớn nhất (ƯCLN) và Bội chung nhỏ nhất (BCNN).',
      },
      {
        order: 2,
        title: 'Chương III: Số nguyên',
        content:
          '1. Tập hợp các số nguyên Z = {..., -3, -2, -1, 0, 1, 2, 3, ...} gồm số nguyên âm, số 0 và số nguyên dương.\n2. Thứ tự trong tập hợp số nguyên: Trên trục số nằm ngang, điểm a nằm bên trái điểm b thì a < b.\n3. Quy tắc cộng, trừ hai số nguyên; Quy tắc dấu ngoặc.\n4. Quy tắc nhân, chia hai số nguyên: Tích/thương hai số nguyên cùng dấu là số nguyên dương; khác dấu là số nguyên âm.\n5. Phép chia hết, ước và bội của một số nguyên.',
      },
      {
        order: 3,
        title: 'Chương IV & V: Hình phẳng trong thực tiễn và Tính đối xứng',
        content:
          '1. Tam giác đều, hình vuông, lục giác đều.\n2. Hình chữ nhật (S = a.b, P = 2(a+b)), Hình thoi (S = 1/2 . d1 . d2), Hình bình hành (S = a.h), Hình thang cân (S = 1/2 . (a + b) . h).\n3. Hình có trục đối xứng (đoạn thẳng, tam giác đều, hình tròn, hình thang cân, hình thoi) và Hình có tâm đối xứng (hình bình hành, hình chữ nhật, hình vuông, hình thoi, lục giác đều, hình tròn).',
      },
      {
        order: 4,
        title: 'Chương VI & VII: Phân số và Số thập phân',
        content:
          '1. Phân số a/b với a, b thuộc Z, b ≠ 0. Hai phân số a/b = c/d nếu a.d = b.c.\n2. Tính chất cơ bản của phân số, quy đồng mẫu nhiều phân số, các phép tính cộng, trừ, nhân, chia phân số.\n3. Hai bài toán về phân số: Tìm giá trị phân số của một số cho trước (b = a . m/n) và tìm một số biết giá trị một phân số của nó.\n4. Số thập phân âm, các phép tính với số thập phân, làm tròn và ước lượng, tỉ số và tỉ số phần trăm.',
      },
      {
        order: 5,
        title: 'Chương VIII & IX: Hình học phẳng cơ bản, Dữ liệu và Xác suất thực nghiệm',
        content:
          '1. Điểm, đường thẳng, tia, đoạn thẳng, độ dài đoạn thẳng, trung điểm của đoạn thẳng (M nằm giữa A, B và MA = MB = AB/2).\n2. Góc, số đo góc: Góc nhọn (0° < α < 90°), góc vuông (90°), góc tù (90° < α < 180°), góc bẹt (180°).\n3. Thu thập, tổ chức dữ liệu, bảng thống kê, biểu đồ tranh, biểu đồ cột, biểu đồ cột kép.\n4. Kết quả có thể và sự kiện trong trò chơi, thí nghiệm; Xác suất thực nghiệm của sự kiện A bằng k/n (k là số lần sự kiện A xảy ra trong n lần thực nghiệm).',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Toan_6_Tap_1_Ket_Noi_Tri_Thuc.pdf',
        size: '2.4 MB',
        chunks: [
          {
            page: 6,
            content:
              '[SGK Toán 6 Tập 1 - Kết nối tri thức với cuộc sống - Chương I: Tập hợp các số tự nhiên] Tập hợp các số tự nhiên được kí hiệu là N = {0; 1; 2; 3; ...}. Tập hợp các số tự nhiên khác 0 được kí hiệu là N* = {1; 2; 3; ...}. Khi nhân hai lũy thừa cùng cơ số: a^m . a^n = a^(m+n). Khi chia hai lũy thừa cùng cơ số (a khác 0, m >= n): a^m : a^n = a^(m-n), quy ước a^0 = 1. Thứ tự thực hiện các phép tính đối với biểu thức không có dấu ngoặc: Lũy thừa -> Nhân và chia -> Cộng và trừ.',
          },
          {
            page: 30,
            content:
              '[SGK Toán 6 Tập 1 - Kết nối tri thức với cuộc sống - Chương II: Tính chia hết trong tập hợp các số tự nhiên] Số nguyên tố là số tự nhiên lớn hơn 1, chỉ có hai ước là 1 và chính nó (ví dụ: 2, 3, 5, 7, 11, 13...). Hợp số là số tự nhiên lớn hơn 1, có nhiều hơn hai ước. Số 0 và số 1 không là số nguyên tố và cũng không là hợp số. Số 2 là số nguyên tố chẵn duy nhất. Để tìm ƯCLN của hai hay nhiều số lớn hơn 1, ta phân tích mỗi số ra thừa số nguyên tố, chọn các thừa số nguyên tố chung với số mũ nhỏ nhất. Để tìm BCNN, ta chọn các thừa số nguyên tố chung và riêng với số mũ lớn nhất.',
          },
          {
            page: 61,
            content:
              '[SGK Toán 6 Tập 1 - Kết nối tri thức với cuộc sống - Chương III: Số nguyên] Tập hợp các số nguyên kí hiệu là Z = {..., -3; -2; -1; 0; 1; 2; 3; ...}. Hai số nguyên đối nhau có tổng bằng 0. Quy tắc dấu ngoặc: Khi bỏ dấu ngoặc có dấu "-" đằng trước, ta phải đổi dấu tất cả các số hạng trong dấu ngoặc: dấu "+" đổi thành dấu "-" và dấu "-" đổi thành dấu "+". Tích của hai số nguyên âm là một số nguyên dương; tích của hai số nguyên khác dấu là một số nguyên âm.',
          },
          {
            page: 85,
            content:
              '[SGK Toán 6 Tập 1 - Kết nối tri thức với cuộc sống - Chương IV & V: Hình phẳng và Tính đối xứng] Công thức chu vi và diện tích: Hình vuông cạnh a có P = 4a, S = a^2. Hình chữ nhật cạnh a, b có P = 2(a+b), S = a.b. Hình thoi cạnh a, hai đường chéo d1, d2 có P = 4a, S = (d1.d2)/2. Hình bình hành cạnh a, b và chiều cao h ứng với cạnh a có P = 2(a+b), S = a.h. Hình thang cân đáy a, b và chiều cao h có S = (a+b).h / 2.',
          },
        ],
      },
      {
        fileName: 'SGK_Toan_6_Tap_2_Ket_Noi_Tri_Thuc.pdf',
        size: '2.1 MB',
        chunks: [
          {
            page: 4,
            content:
              '[SGK Toán 6 Tập 2 - Kết nối tri thức với cuộc sống - Chương VI & VII: Phân số và Số thập phân] Hai phân số a/b và c/d được gọi là bằng nhau nếu a.d = b.c. Muốn tìm m/n của một số a cho trước, ta tính a . (m/n). Muốn tìm một số biết m/n của nó bằng b, ta tính b : (m/n). Tỉ số phần trăm của hai số a và b là (a/b) . 100%.',
          },
          {
            page: 45,
            content:
              '[SGK Toán 6 Tập 2 - Kết nối tri thức với cuộc sống - Chương VIII & IX: Hình học phẳng cơ bản và Xác suất thực nghiệm] Trung điểm M của đoạn thẳng AB là điểm nằm giữa A, B và cách đều A, B (MA = MB = AB/2). Góc nhọn có số đo lớn hơn 0° và nhỏ hơn 90°; góc vuông bằng 90°; góc tù lớn hơn 90° và nhỏ hơn 180°; góc bẹt bằng 180°. Xác suất thực nghiệm của sự kiện A trong n lần thực nghiệm là tỉ số k/n, trong đó k là số lần sự kiện A xảy ra.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Toán 6 - Kết nối tri thức: Số tự nhiên, Số nguyên & Hình học',
      description: 'Đề kiểm tra kiến thức trọng tâm Toán lớp 6 theo bộ sách Kết nối tri thức với cuộc sống.',
      duration: 15,
      questions: [
        {
          content: 'Tập hợp các số tự nhiên khác 0 được kí hiệu là gì?',
          options: ['N*', 'N', 'Z', 'Q'],
          correctOption: 'N*',
          explanation: 'Theo SGK Toán 6 Kết nối tri thức (Chương I), N* = {1; 2; 3; ...} là tập hợp các số tự nhiên khác 0.',
        },
        {
          content: 'Kết quả của phép tính 2^3 . 2^2 viết dưới dạng một lũy thừa là:',
          options: ['2^5', '2^6', '4^5', '4^6'],
          correctOption: '2^5',
          explanation: 'Khi nhân hai lũy thừa cùng cơ số, ta giữ nguyên cơ số và cộng các số mũ: 2^(3+2) = 2^5.',
        },
        {
          content: 'Trong các số tự nhiên sau, số nào là số nguyên tố chẵn duy nhất?',
          options: ['2', '0', '1', '4'],
          correctOption: '2',
          explanation: 'Số 2 chỉ có hai ước là 1 và 2 nên là số nguyên tố, đồng thời là số nguyên tố chẵn duy nhất.',
        },
        {
          content: 'Kết quả của phép nhân hai số nguyên (-12) . (-5) là:',
          options: ['60', '-60', '-17', '17'],
          correctOption: '60',
          explanation: 'Tích của hai số nguyên cùng dấu âm là một số nguyên dương: (-12) . (-5) = 12 . 5 = 60.',
        },
        {
          content: 'Một hình thoi có độ dài hai đường chéo lần lượt là 6 cm và 8 cm. Diện tích của hình thoi đó bằng:',
          options: ['24 cm²', '48 cm²', '14 cm²', '28 cm²'],
          correctOption: '24 cm²',
          explanation: 'Diện tích hình thoi bằng nửa tích độ dài hai đường chéo: S = (6 . 8) / 2 = 24 (cm²).',
        },
      ],
    },
  },
  {
    subjectName: 'Ngữ văn',
    grade: 6,
    title: 'Ngữ văn 6 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Ngữ văn lớp 6 (Tập 1 & Tập 2) bộ Kết nối tri thức với cuộc sống: Truyện đồng thoại, Thơ, Ký và Hồi ký, Truyền thuyết, Cổ tích, Văn bản nghị luận và thông tin.',
    teacherCode: 'GV02',
    lessons: [
      {
        order: 1,
        title: 'Bài 1 & Bài 2: Tôi và các bạn – Gõ cửa trái tim',
        content:
          '1. Truyện đồng thoại: Thể loại văn học dành cho thiếu nhi, nhân vật thường là loài vật hoặc đồ vật được nhân hóa (Bài học đường đời đầu tiên - Tô Hoài; Nếu cậu muốn có một người bạn - Antoine de Saint-Exupéry).\n2. Thơ và các yếu tố tự sự, miêu tả trong thơ (Chuyện cổ tích về loài người - Xuân Quỳnh; Mây và sóng - Rabindranath Tagore).\n3. Thực hành tiếng Việt: Từ đơn, từ phức (từ ghép, từ láy), nghĩa của từ, biện pháp tu từ ẩn dụ, nhân hóa.',
      },
      {
        order: 2,
        title: 'Bài 3, 4 & 5: Yêu thương và chia sẻ – Quê hương yêu dấu – Những nẻo đường xứ sở',
        content:
          '1. Truyện ngắn giàu tính nhân văn (Cô bé bán diêm - Andersen; Gió lạnh đầu mùa - Thạch Lam; Con chào mào - Mai Văn Phấn).\n2. Thơ lục bát: Thể thơ truyền thống dân tộc với cặp câu 6 tiếng và 8 tiếng, hiệp vần ở tiếng thứ 6 của câu lục với tiếng thứ 6 của câu bát, tiếng thứ 8 của câu bát với tiếng thứ 6 của câu lục tiếp theo (Chùm ca dao về quê hương đất nước; Chuyện cổ nước mình - Lâm Thị Mỹ Dạ).\n3. Du ký và Hồi ký: Ghi chép chân thực của người viết về cảnh vật, con người hoặc kỉ niệm đã trải qua (Cô Tô - Nguyễn Tuân; Hang Én - Hà My).',
      },
      {
        order: 3,
        title: 'Bài 6 & Bài 7: Chuyện kể về những người anh hùng – Thế giới cổ tích',
        content:
          '1. Truyền thuyết: Truyện dân gian kể về các nhân vật và sự kiện lịch sử thời quá khứ, thường có yếu tố kì ảo, thể hiện thái độ và cách đánh giá của nhân dân (Thánh Gióng; Sơn Tinh, Thủy Tinh; Sự tích Hồ Gươm).\n2. Truyện cổ tích: Truyện dân gian có yếu tố hoang đường, kì ảo, thể hiện ước mơ của nhân dân về chiến thắng của cái thiện đối với cái ác (Thạch Sanh; Cây khế; Vua chích chòe).',
      },
      {
        order: 4,
        title: 'Bài 8, 9 & 10: Khác biệt và gần gũi – Trái Đất ngôi nhà chung – Cuốn sách tôi yêu',
        content:
          '1. Văn bản nghị luận: Trình bày ý kiến, lí lẽ và bằng chứng thuyết phục về một vấn đề đời sống (Xem người ta kìa! - Lạc Thanh).\n2. Văn bản thông tin: Cung cấp thông tin khách quan, có nhan đề, sapo, đề mục, hình ảnh minh họa, số liệu (Trái Đất - cái nôi của sự sống; Các loài chung sống với nhau như thế nào?).\n3. Phương pháp đọc sách và viết bài trình bày ý kiến về một hiện tượng đời sống.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Ngu_Van_6_Ket_Noi_Tri_Thuc.pdf',
        size: '2.8 MB',
        chunks: [
          {
            page: 10,
            content:
              '[SGK Ngữ văn 6 Tập 1 - Kết nối tri thức với cuộc sống - Bài 1: Tôi và các bạn] Truyện đồng thoại là loại truyện viết cho trẻ em, có nhân vật thường là loài vật hoặc đồ vật được nhân hóa. Chúng vừa phản ánh đặc điểm sinh hoạt của loài vật vừa thể hiện đặc điểm của con người. Văn bản "Bài học đường đời đầu tiên" trích từ Chương I tác phẩm "Dế Mèn phiêu lưu kí" của nhà văn Tô Hoài, được kể theo ngôi thứ nhất (nhân vật Dế Mèn tự kể), rút ra bài học về thói hung hăng, kiêu ngạo dẫn đến cái chết thương tâm của Dế Choắt.',
          },
          {
            page: 88,
            content:
              '[SGK Ngữ văn 6 Tập 1 - Kết nối tri thức với cuộc sống - Bài 4: Quê hương yêu dấu] Thơ lục bát là thể thơ truyền thống của dân tộc Việt Nam. Mỗi cặp câu gồm một dòng 6 tiếng (dòng lục) và một dòng 8 tiếng (dòng bát). Cách gieo vần: tiếng thứ sáu của dòng lục vần với tiếng thứ sáu của dòng bát; tiếng thứ tám của dòng bát vần với tiếng thứ sáu của dòng lục tiếp theo. Nhịp thơ lục bát thường là nhịp chẵn (2/2/2, 4/4).',
          },
          {
            page: 120,
            content:
              '[SGK Ngữ văn 6 Tập 2 - Kết nối tri thức với cuộc sống - Bài 6 & 7: Truyền thuyết và Cổ tích] Truyền thuyết là loại truyện dân gian kể về các nhân vật và sự kiện có liên quan đến lịch sử thời quá khứ, thường có yếu tố tưởng tượng kì ảo (như Thánh Gióng, Sơn Tinh Thủy Tinh). Truyện cổ tích là loại truyện dân gian kể về cuộc đời của một số kiểu nhân vật (nhân vật bất hạnh, nhân vật dũng sĩ, nhân vật thông minh...), có nhiều chi tiết kì ảo, thể hiện ước mơ về công lí và cái thiện chiến thắng cái ác (như Thạch Sanh, Cây khế).',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Ngữ văn 6 - Kết nối tri thức: Truyện đồng thoại, Thơ lục bát & Dân gian',
      description: 'Đề kiểm tra kiến thức Ngữ văn lớp 6 theo bộ sách Kết nối tri thức với cuộc sống.',
      duration: 15,
      questions: [
        {
          content: 'Văn bản "Bài học đường đời đầu tiên" được trích từ tác phẩm nào của nhà văn Tô Hoài?',
          options: ['Dế Mèn phiêu lưu kí', 'Quê người', 'O chuột', 'Chuyện cũ Hà Nội'],
          correctOption: 'Dế Mèn phiêu lưu kí',
          explanation: '"Bài học đường đời đầu tiên" trích từ chương I của truyện đồng thoại "Dế Mèn phiêu lưu kí" (Tô Hoài).',
        },
        {
          content: 'Trong thể thơ lục bát truyền thống, tiếng thứ sáu của dòng lục hiệp vần với tiếng thứ mấy của dòng bát kế tiếp?',
          options: ['Tiếng thứ sáu', 'Tiếng thứ tư', 'Tiếng thứ tám', 'Tiếng thứ hai'],
          correctOption: 'Tiếng thứ sáu',
          explanation: 'Theo quy luật thơ lục bát, tiếng thứ 6 của dòng lục vần với tiếng thứ 6 của dòng bát, còn tiếng thứ 8 của dòng bát vần với tiếng thứ 6 của dòng lục tiếp theo.',
        },
        {
          content: 'Thể loại truyện dân gian nào kể về các nhân vật và sự kiện liên quan đến lịch sử thời quá khứ, thường có yếu tố kì ảo?',
          options: ['Truyền thuyết', 'Truyện cổ tích', 'Truyện đồng thoại', 'Truyện ngụ ngôn'],
          correctOption: 'Truyền thuyết',
          explanation: 'Truyền thuyết gắn với các nhân vật/sự kiện lịch sử quá khứ (như Thánh Gióng, Sự tích Hồ Gươm) và thể hiện thái độ tôn kính của nhân dân.',
        },
        {
          content: 'Từ "xanh xao" thuộc loại từ nào xét theo cấu tạo từ tiếng Việt?',
          options: ['Từ láy', 'Từ đơn', 'Từ ghép đẳng lập', 'Từ ghép chính phụ'],
          correctOption: 'Từ láy',
          explanation: '"Xanh xao" là từ láy phụ âm đầu (x).',
        },
      ],
    },
  },
  {
    subjectName: 'Tiếng Anh',
    grade: 6,
    title: 'Tiếng Anh 6 - Global Success (Kết nối tri thức)',
    description:
      'Chương trình Tiếng Anh lớp 6 Global Success (Unit 1 - Unit 12): My new school, My house, My friends, My neighbourhood, Natural wonders, Tet holiday, Television, Sports, Cities, Future houses, Greener world, Robots.',
    teacherCode: 'GV03',
    lessons: [
      {
        order: 1,
        title: 'Units 1 - 3: My New School, My House & My Friends',
        content:
          '1. Vocabulary: School things & activities, Types of house, rooms & furniture, Body parts, appearance & personality adjectives.\n2. Grammar:\n- The Present Simple (Thì hiện tại đơn): S + V(s/es) diễn tả thói quen, sự thật hiển nhiên; Trạng từ tần suất (always, usually, often, sometimes, never).\n- Possessive case (Sở hữu cách: Nam\'s room) & Prepositions of place (in, on, under, next to, behind, in front of, between).\n- The Present Continuous (Thì hiện tại tiếp diễn): S + am/is/are + V-ing diễn tả hành động đang xảy ra hoặc kế hoạch tương lai gần.',
      },
      {
        order: 2,
        title: 'Units 4 - 6: My Neighbourhood, Natural Wonders & Our Tet Holiday',
        content:
          '1. Vocabulary: Places in a neighbourhood, Things in nature & travel items, Things and activities at Tet.\n2. Grammar:\n- Comparative adjectives (So sánh hơn của tính từ): Tính từ ngắn (adj-er + than: smaller than), Tính từ dài (more + adj + than: more peaceful than).\n- Countable and uncountable nouns (Danh từ đếm được và không đếm được); some, any, much, many, a few, a little.\n- Modal verbs: must / mustn\'t (bắt buộc/cấm đoán), should / shouldn\'t (lời khuyên ngày Tết).',
      },
      {
        order: 3,
        title: 'Units 7 - 9: Television, Sports and Games & Cities of the World',
        content:
          '1. Vocabulary: TV programmes, Sports & games, Continents, countries, cities and landmarks.\n2. Grammar:\n- Wh-questions (What, Where, When, Why, Who, How often) & Conjunctions in compound sentences (and, but, so).\n- The Past Simple (Thì quá khứ đơn): S + V2/ed (was/were) diễn tả hành động đã xảy ra và kết thúc trong quá khứ; Imperatives (Câu mệnh lệnh: V / Don\'t + V).\n- Possessive adjectives (my, your, his, her, our, their) vs. Possessive pronouns (mine, yours, his, hers, ours, theirs).',
      },
      {
        order: 4,
        title: 'Units 10 - 12: Our Houses in the Future, Our Greener World & Robots',
        content:
          '1. Vocabulary: Future appliances, 3Rs (Reduce, Reuse, Recycle) & environmental protection, Daily activities & robot abilities.\n2. Grammar:\n- Future Simple (will / won\'t + V) cho dự đoán tương lai và might + V cho khả năng có thể xảy ra.\n- Articles (a, an, the) và First Conditional (Câu điều kiện loại 1): If + S + V(hiện tại đơn), S + will/won\'t + V(nguyên thể).\n- Superlative adjectives (So sánh nhất của tính từ ngắn: the + adj-est, 예: the smartest, the strongest).',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Tieng_Anh_6_Global_Success_KNTT.pdf',
        size: '2.2 MB',
        chunks: [
          {
            page: 8,
            content:
              '[SGK Tiếng Anh 6 Global Success - Kết nối tri thức - Units 1-6] Thì hiện tại đơn (Present Simple): Khẳng định S + V(s/es), phủ định S + do/does + not + V, nghi vấn Do/Does + S + V? Dùng với trạng từ tần suất (always, usually, often, sometimes, rarely, never) đứng trước động từ thường và sau động từ to be. Thì hiện tại tiếp diễn (Present Continuous): S + am/is/are + V-ing. So sánh hơn của tính từ ngắn: S1 + be + adj-er + than + S2; tính từ dài: S1 + be + more + adj + than + S2 (bất quy tắc: good -> better, bad -> worse, far -> farther/further).',
          },
          {
            page: 48,
            content:
              '[SGK Tiếng Anh 6 Global Success - Kết nối tri thức - Units 7-12] Thì quá khứ đơn (Past Simple): diễn tả sự việc đã xảy ra và kết thúc trong quá khứ (yesterday, last week, ago, in 2020). Đại từ sở hữu (mine, yours, his, hers, ours, theirs) dùng thay thế cho [tính từ sở hữu + danh từ] để tránh lặp từ. Câu điều kiện loại 1 (First conditional): If + S + V(hiện tại đơn), S + will/can + V(nguyên thể) diễn tả sự việc có thể xảy ra ở hiện tại hoặc tương lai. So sánh nhất với tính từ ngắn: the + adj-est (good -> the best, bad -> the worst).',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Tiếng Anh 6 - Global Success: Grammar & Vocabulary',
      description: 'Bài kiểm tra kiến thức Tiếng Anh lớp 6 (Global Success - Kết nối tri thức với cuộc sống).',
      duration: 15,
      questions: [
        {
          content: 'Choose the correct answer: Duy usually ______ to school by bicycle every morning.',
          options: ['goes', 'go', 'is going', 'went'],
          correctOption: 'goes',
          explanation: 'Dấu hiệu "usually" và "every morning" chỉ thói quen ở hiện tại (Present Simple), chủ ngữ số ít "Duy" nên động từ thêm -es: goes.',
        },
        {
          content: 'Living in the countryside is ______ than living in a big city.',
          options: ['more peaceful', 'peacefuler', 'most peaceful', 'as peaceful'],
          correctOption: 'more peaceful',
          explanation: '"Peaceful" là tính từ dài (2 âm tiết tận cùng bằng -ful), cấu trúc so sánh hơn với "than" là: more + peaceful + than.',
        },
        {
          content: 'If we ______ recycled paper, we will save a lot of trees.',
          options: ['use', 'used', 'will use', 'using'],
          correctOption: 'use',
          explanation: 'Câu điều kiện loại 1 (First Conditional - Unit 11): Mệnh đề If chia ở thì hiện tại đơn (we use), mệnh đề chính dùng will + V.',
        },
        {
          content: 'This is my new pen, and that red one over there is ______.',
          options: ['hers', 'her', 'she', 'herself'],
          correctOption: 'hers',
          explanation: 'Cần một đại từ sở hữu (Possessive pronoun - Unit 9) đứng độc lập thay cho "her pen" -> dùng "hers".',
        },
      ],
    },
  },
  {
    subjectName: 'Khoa học tự nhiên',
    grade: 6,
    title: 'Khoa học tự nhiên 6 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình KHTN lớp 6 bộ Kết nối tri thức: Mở đầu về KHTN, Chất quanh ta, Tế bào, Đa dạng thế giới sống, Lực, Năng lượng và Trái Đất & bầu trời.',
    teacherCode: 'GV04',
    lessons: [
      {
        order: 1,
        title: 'Chương I, II & III: Mở đầu KHTN, Các thể của chất, Oxygen và Không khí, Vật liệu & Hỗn hợp',
        content:
          '1. Các phép đo cơ bản: Đo chiều dài (đơn vị chuẩn SI là mét - m), đo khối lượng (kilôgam - kg), đo thời gian (giây - s), đo nhiệt độ (độ C, thang Kelvin K).\n2. Ba thể của chất (rắn, lỏng, khí) và sự chuyển thể: Nóng chảy (rắn -> lỏng), Đông đặc (lỏng -> rắn), Bay hơi (lỏng -> khí), Ngưng tụ (khí -> lỏng), Sôi.\n3. Thành phần không khí: khoảng 78% khí nitrogen, 21% khí oxygen, 1% khí carbon dioxide, hơi nước và khí hiếm. Oxygen duy trì sự sống và sự cháy.\n4. Hỗn hợp đồng nhất (dung dịch) và không đồng nhất (huyền phù, nhũ tương); các phương pháp tách chất: lắng, gạn, lọc, cô cạn, chiết.',
      },
      {
        order: 2,
        title: 'Chương IV & V: Tế bào và Đa dạng thế giới sống',
        content:
          '1. Tế bào là đơn vị cấu trúc và chức năng của mọi cơ thể sống. Cấu tạo gồm: Màng tế bào, Chất tế bào, Nhân tế bào (ở tế bào nhân thực) hoặc Vùng nhân (ở tế bào nhân sơ như vi khuẩn). Tế bào thực vật có thêm thành tế bào và lục lạp.\n2. Từ tế bào -> Mô -> Cơ quan -> Hệ cơ quan -> Cơ thể.\n3. Năm giới sinh vật: Giới Khởi sinh (vi khuẩn), Giới Nguyên sinh, Giới Nấm, Giới Thực vật (Rêu, Dương xỉ, Hạt trần, Hạt kín), Giới Động vật (Không xương sống và Có xương sống: Cá, Lưỡng cư, Bò sát, Chim, Thú).',
      },
      {
        order: 3,
        title: 'Chương VI, VII & VIII: Lực, Năng lượng và Trái Đất & Bầu trời',
        content:
          '1. Lực và tác dụng của lực (làm biến đổi chuyển động hoặc làm biến dạng vật). Đơn vị lực là Newton (N), dụng cụ đo là lực kế.\n2. Trọng lực là lực hút của Trái Đất, có phương thẳng đứng, chiều từ trên xuống; liên hệ giữa trọng lượng P (N) và khối lượng m (kg): P = 10.m. Lực ma sát (ma sát trượt, ma sát nghỉ).\n3. Định luật bảo toàn năng lượng: Năng lượng không tự sinh ra hoặc tự mất đi mà chỉ truyền từ vật này sang vật khác hoặc chuyển hóa từ dạng này sang dạng khác.\n4. Chuyển động nhìn thấy của Mặt Trời (mọc hướng Đông, lặn hướng Tây do Trái Đất tự quay quanh trục từ Tây sang Đông), các pha của Mặt Trăng, Hệ Mặt Trời (8 hành tinh) và Ngân Hà.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Khoa_Hoc_Tu_Nhien_6_Ket_Noi_Tri_Thuc.pdf',
        size: '3.1 MB',
        chunks: [
          {
            page: 25,
            content:
              '[SGK Khoa học tự nhiên 6 - Kết nối tri thức - Chương I, II, III: Chất quanh ta] Thành phần không khí theo thể tích gồm khoảng 78% khí nitrogen, 21% khí oxygen và 1% các khí khác (carbon dioxide, hơi nước, khí hiếm). Các phương pháp tách chất ra khỏi hỗn hợp: (1) Lọc: tách chất rắn không tan ra khỏi chất lỏng; (2) Cô cạn: tách chất rắn tan (không hóa hơi) ra khỏi dung dịch; (3) Chiết: tách các chất lỏng không tan vào nhau (ví dụ dầu ăn và nước).',
          },
          {
            page: 68,
            content:
              '[SGK Khoa học tự nhiên 6 - Kết nối tri thức - Chương IV & V: Tế bào và Đa dạng thế giới sống] Mọi cơ thể sống đều được cấu tạo từ tế bào. Ba thành phần chính của tế bào là: màng tế bào, tế bào chất và nhân (hoặc vùng nhân). Vi khuẩn là sinh vật nhân sơ. Thực vật và động vật là sinh vật nhân thực. Tế bào thực vật có lục lạp chứa diệp lục giúp thực hiện quang hợp và có thành tế bào tạo hình dạng ổn định.',
          },
          {
            page: 145,
            content:
              '[SGK Khoa học tự nhiên 6 - Kết nối tri thức - Chương VI, VII, VIII: Lực, Năng lượng và Trái Đất] Đơn vị đo lực là Newton (N), đo bằng lực kế. Trọng lượng P của vật có khối lượng m (kg) được tính gần đúng bởi công thức P = 10m. Định luật bảo toàn năng lượng: Năng lượng không tự sinh ra hoặc tự mất đi mà chỉ chuyển hóa từ dạng này sang dạng khác hoặc truyền từ vật này sang vật khác. Hiện tượng ngày và đêm trên Trái Đất là do Trái Đất tự quay quanh trục của nó theo chiều từ Tây sang Đông.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Khoa học tự nhiên 6 - Kết nối tri thức',
      description: 'Đề kiểm tra tổng hợp Chất, Tế bào, Lực và Năng lượng (KHTN 6 Kết nối tri thức).',
      duration: 15,
      questions: [
        {
          content: 'Trong không khí, khí oxygen chiếm khoảng bao nhiêu phần trăm về thể tích?',
          options: ['21%', '78%', '1%', '50%'],
          correctOption: '21%',
          explanation: 'Không khí gồm khoảng 78% nitrogen, 21% oxygen và 1% các khí khác.',
        },
        {
          content: 'Bào quan nào có ở tế bào thực vật giúp cây thực hiện quá trình quang hợp?',
          options: ['Lục lạp', 'Không bào', 'Ti thể', 'Màng sinh chất'],
          correctOption: 'Lục lạp',
          explanation: 'Lục lạp chứa sắc tố diệp lục có khả năng hấp thụ ánh sáng mặt trời để tổng hợp chất hữu cơ trong quang hợp.',
        },
        {
          content: 'Một vật có khối lượng m = 4,5 kg thì có trọng lượng P trên mặt đất xấp xỉ bằng bao nhiêu Newton?',
          options: ['45 N', '4,5 N', '450 N', '0,45 N'],
          correctOption: '45 N',
          explanation: 'Áp dụng công thức P = 10 . m = 10 . 4,5 = 45 (N).',
        },
        {
          content: 'Để tách dầu ăn ra khỏi hỗn hợp dầu ăn và nước, người ta sử dụng phương pháp nào sau đây?',
          options: ['Phương pháp chiết', 'Phương pháp lọc', 'Phương pháp cô cạn', 'Phương pháp chưng cất'],
          correctOption: 'Phương pháp chiết',
          explanation: 'Dầu ăn và nước là hai chất lỏng không hòa tan vào nhau và tách thành hai lớp riêng biệt nên dùng phễu chiết để tách.',
        },
      ],
    },
  },
  {
    subjectName: 'Lịch sử và Địa lí',
    grade: 6,
    title: 'Lịch sử và Địa lí 6 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Lịch sử và Địa lí lớp 6 bộ Kết nối tri thức: Xã hội nguyên thủy, Cổ đại phương Đông & phương Tây, Việt Nam từ thời nguyên thủy đến thế kỉ X; Bản đồ, Trái Đất, Khí hậu, Thủy văn, Đất và Sinh vật.',
    teacherCode: 'GV05',
    lessons: [
      {
        order: 1,
        title: 'Phần Lịch sử (Chương 1 - 3): Thời nguyên thủy và Xã hội cổ đại',
        content:
          '1. Lịch sử và Khoa học lịch sử; các nguồn sử liệu (truyền miệng, hiện vật, chữ viết); cách tính thời gian trong lịch sử (TCN và SCN).\n2. Quá trình tiến hóa từ Vượn người -> Người tối cổ -> Người tinh khôn; sự xuất hiện kim loại.\n3. Các quốc gia cổ đại phương Đông (Ai Cập gắn với sông Nin, Lưỡng Hà gắn với sông Ơ-phrát và Ti-grơ, Ấn Độ gắn với sông Ấn - sông Hằng, Trung Quốc gắn với Hoàng Hà - Trường Giang) và phương Tây (Hy Lạp, La Mã).',
      },
      {
        order: 2,
        title: 'Phần Lịch sử (Chương 4 - 5): Đông Nam Á và Việt Nam từ trước thế kỉ X',
        content:
          '1. Các vương quốc phong kiến Đông Nam Á từ thế kỉ VII đến thế kỉ X.\n2. Nhà nước Văn Lang (vua Hùng, kinh đô Phong Châu) và Nhà nước Âu Lạc (An Dương Vương, kinh đô Cổ Loa).\n3. Thời kì Bắc thuộc và các cuộc khởi nghĩa giành độc lập: Khởi nghĩa Hai Bà Trưng (năm 40), Bà Triệu (248), Lý Bí (542 - lập nước Vạn Xuân), Mai Thúc Loan, Phùng Hưng, Khúc Thừa Dụ và Chiến thắng Bạch Đằng năm 938 của Ngô Quyền kết thúc hơn 1000 năm Bắc thuộc.',
      },
      {
        order: 3,
        title: 'Phần Địa lí (Chương 1 - 3): Bản đồ, Trái Đất và Cấu tạo của Trái Đất',
        content:
          '1. Hệ thống kinh tuyến (nối hai cực Bắc - Nam, kinh tuyến gốc 0° đi qua đài thiên văn Greenwich) và vĩ tuyến (vòng tròn vuông góc kinh tuyến, vĩ tuyến gốc 0° là Xích đạo); Tỉ lệ bản đồ, kí hiệu bản đồ.\n2. Chuyển động tự quay quanh trục (24 giờ, sinh ra ngày đêm, giờ trên Trái Đất và lực lệch Coriolis) và chuyển động quay quanh Mặt Trời (365 ngày 6 giờ, sinh ra các mùa).\n3. Cấu tạo Trái Đất gồm 3 lớp: Vỏ Trái Đất, Manti và Nhân; Nội lực và ngoại lực, núi lửa, động đất, các dạng địa hình chính (núi, đồi, đồng bằng, cao nguyên).',
      },
      {
        order: 4,
        title: 'Phần Địa lí (Chương 4 - 7): Khí hậu, Nước, Đất, Sinh vật và Con người với thiên nhiên',
        content:
          '1. Lớp vỏ khí (Tầng đối lưu, tầng bình lưu, các tầng cao); Nhiệt độ, khí áp và gió; 5 đới khí hậu trên Trái Đất.\n2. Thủy quyển: Vòng tuần hoàn nước, sông và hồ, biển và đại dương (độ muối trung bình 35‰, sóng, thủy triều, dòng biển).\n3. Lớp đất (thổ nhưỡng) và các nhân tố hình thành đất; Sinh quyển và bảo vệ tự nhiên, phòng chống thiên tai, ứng phó biến đổi khí hậu.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Lich_Su_Va_Dia_Li_6_Ket_Noi_Tri_Thuc.pdf',
        size: '2.9 MB',
        chunks: [
          {
            page: 55,
            content:
              '[SGK Lịch sử và Địa lí 6 - Kết nối tri thức - Phần Lịch sử] Nhà nước Văn Lang ra đời vào khoảng thế kỉ VII TCN, đứng đầu là Hùng Vương, đóng đô ở Phong Châu (Phú Thọ). Khoảng năm 208 TCN, Thục Phán (An Dương Vương) lập ra nhà nước Âu Lạc, đóng đô ở Phong Khê (Cổ Loa, Đông Anh, Hà Nội). Năm 938, Ngô Quyền lãnh đạo nhân dân đánh tan quân Nam Hán trên sông Bạch Đằng bằng kế đóng cọc gỗ bịt sắt, chấm dứt hơn 1000 năm Bắc thuộc, mở ra thời kì độc lập tự chủ lâu dài.',
          },
          {
            page: 112,
            content:
              '[SGK Lịch sử và Địa lí 6 - Kết nối tri thức - Phần Địa lí] Kinh tuyến gốc (0°) là đường kinh tuyến đi qua đài thiên văn Greenwich ở ngoại ô thủ đô Luân Đôn (nước Anh). Vĩ tuyến gốc (0°) là đường Xích đạo chia quả Địa Cầu thành bán cầu Bắc và bán cầu Nam. Cấu tạo bên trong của Trái Đất gồm 3 lớp: Lớp vỏ Trái Đất (mỏng nhất, từ 5 đến 70 km), lớp Manti và lớp Nhân Trái Đất (nhiệt độ cao nhất tới khoảng 5000°C). Tầng đối lưu nằm sát mặt đất (từ 0 đến 16 km), tập trung 80% khối lượng không khí và sinh ra mọi hiện tượng mây, mưa, sấm, chớp.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Lịch sử và Địa lí 6 - Kết nối tri thức',
      description: 'Đề kiểm tra kiến thức Lịch sử (Văn Lang - Âu Lạc - Bắc thuộc) và Địa lí đại cương lớp 6.',
      duration: 15,
      questions: [
        {
          content: 'Nhà nước Âu Lạc dưới thời An Dương Vương đóng đô ở đâu?',
          options: ['Phong Khê (Cổ Loa, Đông Anh, Hà Nội)', 'Phong Châu (Phú Thọ)', 'Hoa Lư (Ninh Bình)', 'Mê Linh (Hà Nội)'],
          correctOption: 'Phong Khê (Cổ Loa, Đông Anh, Hà Nội)',
          explanation: 'Nhà nước Văn Lang đóng đô ở Phong Châu, còn nhà nước Âu Lạc của An Dương Vương đóng đô ở Phong Khê (Cổ Loa, Đông Anh, Hà Nội).',
        },
        {
          content: 'Chiến thắng nào vào năm 938 đã chấm dứt hoàn toàn hơn một nghìn năm Bắc thuộc của dân tộc ta?',
          options: ['Chiến thắng Bạch Đằng của Ngô Quyền', 'Khởi nghĩa Hai Bà Trưng', 'Khởi nghĩa Lý Bí', 'Khởi nghĩa Khúc Thừa Dụ'],
          correctOption: 'Chiến thắng Bạch Đằng của Ngô Quyền',
          explanation: 'Năm 938, chiến thắng Bạch Đằng của Ngô Quyền trước quân Nam Hán đã kết thúc hơn 1000 năm Bắc thuộc.',
        },
        {
          content: 'Đường vĩ tuyến gốc (0°) chia Trái Đất thành hai bán cầu Bắc và Nam có tên gọi là gì?',
          options: ['Đường Xích đạo', 'Chí tuyến Bắc', 'Chí tuyến Nam', 'Kinh tuyến Greenwich'],
          correctOption: 'Đường Xích đạo',
          explanation: 'Đường Xích đạo là vĩ tuyến gốc 0° và là vĩ tuyến dài nhất trên quả Địa Cầu.',
        },
        {
          content: 'Các hiện tượng thời tiết như mây, mưa, sấm, chớp diễn ra ở tầng nào của khí quyển?',
          options: ['Tầng đối lưu', 'Tầng bình lưu', 'Tầng giữa', 'Tầng nhiệt'],
          correctOption: 'Tầng đối lưu',
          explanation: 'Tầng đối lưu nằm sát mặt đất, tập trung khoảng 80% không khí và gần như toàn bộ hơi nước nên là nơi sinh ra mây, mưa, sấm, chớp.',
        },
      ],
    },
  },
  {
    subjectName: 'Giáo dục công dân',
    grade: 6,
    title: 'Giáo dục công dân 6 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình GDCD lớp 6 bộ Kết nối tri thức: Truyền thống gia đình dòng họ, Yêu thương con người, Siêng năng kiên trì, Tôn trọng sự thật, Tự lập, Tự nhận thức, Ứng phó nguy hiểm, Tiết kiệm, Quyền và nghĩa vụ công dân.',
    teacherCode: 'GV06',
    lessons: [
      {
        order: 1,
        title: 'Chủ đề Đạo đức (Bài 1 - Bài 4): Truyền thống gia đình, Yêu thương, Siêng năng & Tôn trọng sự thật',
        content:
          '1. Tự hào về truyền thống gia đình, dòng họ: Những giá trị tốt đẹp được lưu truyền từ thế hệ này sang thế hệ khác (hiếu học, yêu nước, nhân ái, nghề truyền thống).\n2. Yêu thương con người: Quan tâm, giúp đỡ, làm những điều tốt đẹp cho người khác, nhất là những người gặp khó khăn.\n3. Siêng năng, kiên trì: Cần cù, tự giác, miệt mài, quyết tâm làm đến cùng dù gặp khó khăn.\n4. Tôn trọng sự thật: Suy nghĩ, nói và làm theo đúng sự thật, bảo vệ sự thật.',
      },
      {
        order: 2,
        title: 'Chủ đề Kỹ năng sống (Bài 5 - Bài 8): Tự lập, Tự nhận thức, Ứng phó tình huống nguy hiểm & Tiết kiệm',
        content:
          '1. Tự lập: Tự làm lấy công việc của mình, tự lo liệu, tạo dựng cuộc sống không ỷ lại, dựa dẫm vào người khác.\n2. Tự nhận thức bản thân: Biết nhìn nhận, đánh giá đúng về khả năng, điểm mạnh, điểm yếu, sở thích của chính mình.\n3. Ứng phó với tình huống nguy hiểm: Nhận diện nguy cơ (bắt cóc, xâm hại, đuối nước, hỏa hoạn, dông sét) và bình tĩnh tìm cách thoát hiểm, gọi cứu trợ (113, 114, 115, 111).\n4. Tiết kiệm: Sử dụng hợp lí thời gian, tiền bạc, điện nước, tài sản của bản thân và xã hội.',
      },
      {
        order: 3,
        title: 'Chủ đề Pháp luật (Bài 9 - Bài 10): Công dân nước CHXHCN Việt Nam & Quyền, nghĩa vụ cơ bản',
        content:
          '1. Công dân nước Cộng hòa xã hội chủ nghĩa Việt Nam là người có quốc tịch Việt Nam.\n2. Căn cứ xác định quốc tịch Việt Nam: theo huyết thống (cha mẹ là công dân Việt Nam), theo nơi sinh hoặc do được nhập quốc tịch Việt Nam.\n3. Quyền và nghĩa vụ cơ bản của công dân theo Hiến pháp năm 2013: Quyền bất khả xâm phạm về thân thể, chỗ ở, thư tín; quyền học tập; nghĩa vụ trung thành với Tổ quốc, tuân theo Hiến pháp và pháp luật, bảo vệ môi trường, nộp thuế.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_GDCD_6_Ket_Noi_Tri_Thuc.pdf',
        size: '1.6 MB',
        chunks: [
          {
            page: 12,
            content:
              '[SGK Giáo dục công dân 6 - Kết nối tri thức - Bài 1 đến Bài 8] Truyền thống gia đình, dòng họ là những giá trị tốt đẹp mà gia đình, dòng họ đã tạo ra và được giữ gìn, phát huy từ thế hệ này sang thế hệ khác. Tự lập là tự làm lấy các công việc của mình bằng khả năng và sức lực của bản thân. Khi gặp tình huống nguy hiểm, cần bình tĩnh đánh giá tình huống, tìm cách thoát hiểm an toàn và gọi các số khẩn cấp: 113 (Công an), 114 (Cứu hỏa/Cứu nạn), 115 (Cấp cứu y tế), 111 (Tổng đài quốc gia bảo vệ trẻ em).',
          },
          {
            page: 46,
            content:
              '[SGK Giáo dục công dân 6 - Kết nối tri thức - Bài 9 & Bài 10] Công dân nước Cộng hòa xã hội chủ nghĩa Việt Nam là người có quốc tịch Việt Nam. Quốc tịch là căn cứ xác định công dân của một nước, thể hiện mối quan hệ pháp lí giữa Nhà nước và công dân. Mọi công dân đều được hưởng các quyền cơ bản và phải thực hiện đầy đủ các nghĩa vụ cơ bản theo quy định của Hiến pháp và pháp luật.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Giáo dục công dân 6 - Kết nối tri thức',
      description: 'Đề kiểm tra kiến thức Đạo đức, Kỹ năng sống và Pháp luật GDCD lớp 6.',
      duration: 15,
      questions: [
        {
          content: 'Căn cứ pháp lí quan trọng nhất để xác định một người là công dân nước Cộng hòa xã hội chủ nghĩa Việt Nam là gì?',
          options: ['Người đó có quốc tịch Việt Nam', 'Người đó đang sinh sống tại Việt Nam', 'Người đó biết nói tiếng Việt', 'Người đó đi du lịch tại Việt Nam'],
          correctOption: 'Người đó có quốc tịch Việt Nam',
          explanation: 'Theo Luật Quốc tịch Việt Nam (Bài 9 GDCD 6), người có quốc tịch Việt Nam là công dân nước CHXHCN Việt Nam.',
        },
        {
          content: 'Khi phát hiện đám cháy hoặc cần cứu nạn khẩn cấp, em cần gọi đến số điện thoại nào?',
          options: ['114', '115', '113', '1080'],
          correctOption: '114',
          explanation: 'Số 114 là số điện thoại gọi lực lượng Cảnh sát phòng cháy, chữa cháy và cứu nạn, cứu hộ.',
        },
        {
          content: 'Biểu hiện nào sau đây thể hiện phẩm chất "Tự lập" của học sinh lớp 6?',
          options: ['Tự giác chuẩn bị sách vở, đồ dùng học tập và làm bài tập về nhà', 'Nhờ bố mẹ làm hộ bài tập khó để đạt điểm cao', 'Chỉ dọn góc học tập khi được bố mẹ thưởng tiền', 'Đợi mẹ nhắc nhở nhiều lần mới chịu dậy đi học'],
          correctOption: 'Tự giác chuẩn bị sách vở, đồ dùng học tập và làm bài tập về nhà',
          explanation: 'Tự lập là tự làm lấy công việc của mình, không ỷ lại, dựa dẫm vào người khác.',
        },
      ],
    },
  },
  {
    subjectName: 'Tin học',
    grade: 6,
    title: 'Tin học 6 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Tin học lớp 6 bộ Kết nối tri thức: Thông tin và dữ liệu, Mạng máy tính và Internet, Sơ đồ tư duy, Soạn thảo văn bản và Thuật toán cơ bản.',
    teacherCode: 'GV07',
    lessons: [
      {
        order: 1,
        title: 'Chủ đề 1 & 2: Máy tính và cộng đồng – Mạng máy tính và Internet',
        content:
          '1. Thông tin (những gì đem lại hiểu biết cho con người), Dữ liệu (văn bản, hình ảnh, âm thanh được lưu trữ trong vật mang tin).\n2. Quá trình xử lí thông tin trong máy tính: Thu nhận -> Lưu trữ -> Xử lí -> Truyền thông tin. Đơn vị đo dung lượng dữ liệu: Byte (B), KB, MB, GB, TB (1 KB = 1024 B hoặc xấp xỉ 1000 B trong hệ thập phân).\n3. Mạng máy tính (các thiết bị đầu cuối, thiết bị kết nối Switch/Router, môi trường truyền dẫn), Internet, World Wide Web (WWW), Trình duyệt web, Máy tìm kiếm, Thư điện tử (Email) và An toàn thông tin.',
      },
      {
        order: 2,
        title: 'Chủ đề 4 & 5: Ứng dụng tin học (Sơ đồ tư duy, Soạn thảo văn bản) & Thuật toán',
        content:
          '1. Sơ đồ tư duy (Mindmap): Tổ chức thông tin trực quan từ chủ đề chính ở trung tâm tỏa ra các nhánh con.\n2. Định dạng văn bản, trình bày thông tin dạng bảng, công cụ Tìm kiếm (Find) và Thay thế (Replace).\n3. Khái niệm Thuật toán: Dãy các bước chỉ dẫn rõ ràng có thứ tự để giải quyết một bài toán từ Đầu vào (Input) cho ra Đầu ra (Output). Mô tả thuật toán bằng sơ đồ khối với 3 cấu trúc điều khiển: Tuần tự, Rẽ nhánh (Nếu... thì...) và Lặp.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Tin_Hoc_6_Ket_Noi_Tri_Thuc.pdf',
        size: '1.9 MB',
        chunks: [
          {
            page: 5,
            content:
              '[SGK Tin học 6 - Kết nối tri thức - Chủ đề 1 & 2] Thông tin là những gì đem lại hiểu biết cho con người về thế giới xung quanh và về chính bản thân mình. Dữ liệu là chữ và số, hình ảnh, âm thanh chỉ thông tin được chứa trong vật mang tin. Trong máy tính, thông tin được biểu diễn bằng các dãy bit (chỉ gồm hai kí hiệu 0 và 1). Đơn vị cơ bản đo dung lượng thông tin là Byte (1 Byte = 8 bit), các bội số là KB, MB, GB, TB.',
          },
          {
            page: 62,
            content:
              '[SGK Tin học 6 - Kết nối tri thức - Chủ đề 4 & 5] Thuật toán là một dãy các chỉ dẫn rõ ràng, có trình tự sao cho khi thực hiện những chỉ dẫn này người ta giải quyết được vấn đề hoặc nhiệm vụ đã cho. Trong sơ đồ khối mô tả thuật toán: Hình bầu dục biểu diễn Bắt đầu/Kết thúc; Hình bình hành biểu diễn Nhập/Xuất dữ liệu (Input/Output); Hình chữ nhật biểu diễn phép tính toán/xử lí; Hình thoi biểu diễn điều kiện kiểm tra rẽ nhánh.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Tin học 6 - Kết nối tri thức',
      description: 'Đề kiểm tra kiến thức Thông tin, Mạng Internet, Soạn thảo văn bản và Thuật toán lớp 6.',
      duration: 15,
      questions: [
        {
          content: 'Trong máy tính, một Byte (B) bằng bao nhiêu bit?',
          options: ['8 bit', '10 bit', '2 bit', '16 bit'],
          correctOption: '8 bit',
          explanation: 'Theo SGK Tin học 6 Kết nối tri thức (Bài 3), 1 Byte = 8 bit.',
        },
        {
          content: 'Trong sơ đồ khối mô tả thuật toán, hình thoi được dùng để biểu diễn thao tác nào?',
          options: ['Kiểm tra điều kiện (Rẽ nhánh)', 'Bắt đầu hoặc kết thúc thuật toán', 'Nhập hoặc xuất dữ liệu', 'Thực hiện phép tính toán'],
          correctOption: 'Kiểm tra điều kiện (Rẽ nhánh)',
          explanation: 'Hình thoi biểu diễn phép kiểm tra điều kiện Đúng/Sai trong cấu trúc rẽ nhánh hoặc lặp.',
        },
        {
          content: 'Công cụ nào trong phần mềm soạn thảo văn bản giúp tìm nhanh một từ và đổi thành từ khác?',
          options: ['Find and Replace (Tìm kiếm và Thay thế)', 'Page Setup (Thiết lập trang)', 'Insert Table (Chèn bảng)', 'Font Size (Cỡ chữ)'],
          correctOption: 'Find and Replace (Tìm kiếm và Thay thế)',
          explanation: 'Chức năng Find and Replace (Bài 13) giúp tìm kiếm và thay thế tự động các từ hoặc cụm từ trong văn bản.',
        },
      ],
    },
  },
  {
    subjectName: 'Công nghệ',
    grade: 6,
    title: 'Công nghệ 6 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Công nghệ lớp 6 bộ Kết nối tri thức: Nhà ở, Bảo quản và chế biến thực phẩm, Trang phục và thời trang, Đồ dùng điện trong gia đình.',
    teacherCode: 'GV08',
    lessons: [
      {
        order: 1,
        title: 'Chương I & II: Nhà ở – Bảo quản và chế biến thực phẩm',
        content:
          '1. Vai trò, cấu tạo chung của nhà ở (móng nhà, sàn, khung tường, mái nhà); Quy trình xây dựng nhà ở (Chuẩn bị -> Thi công -> Hoàn thiện); Ngôi nhà thông minh (Smart Home) có đặc điểm tiện ích, an ninh an toàn và tiết kiệm năng lượng.\n2. Các nhóm chất dinh dưỡng chính trong thực phẩm: Chất bột đường (Glucid), Chất đạm (Protein), Chất béo (Lipid), Vitamin và chất khoáng. Các phương pháp bảo quản và chế biến thực phẩm an toàn vệ sinh.',
      },
      {
        order: 2,
        title: 'Chương III & IV: Trang phục và thời trang – Đồ dùng điện trong gia đình',
        content:
          '1. Các loại vải thông dụng: Vải sợi thiên nhiên (bông, tơ tằm - thoáng mát nhưng dễ nhàu), Vải sợi hóa học (nhân tạo, tổng hợp - bền, ít nhàu), Vải sợi pha.\n2. Sử dụng và bảo quản trang phục (đọc kí hiệu trên nhãn quần áo).\n3. Thông số kĩ thuật định mức của đồ dùng điện: Điện áp định mức (V - ở Việt Nam thường là 220V) và Công suất định mức (W). Nguyên lí làm việc và cách sử dụng an toàn, tiết kiệm Đèn điện, Nồi cơm điện, Bếp hồng ngoại.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Cong_Nghe_6_Ket_Noi_Tri_Thuc.pdf',
        size: '1.8 MB',
        chunks: [
          {
            page: 14,
            content:
              '[SGK Công nghệ 6 - Kết nối tri thức - Chương I & II] Quy trình xây dựng nhà ở gồm 3 bước chính: Chuẩn bị -> Thi công -> Hoàn thiện. Ngôi nhà thông minh là ngôi nhà được trang bị hệ thống điều khiển tự động hoặc bán tự động cho các thiết bị trong gia đình nhằm đảm bảo sự tiện nghi, an ninh an toàn và tiết kiệm năng lượng. Thực phẩm cung cấp 4 nhóm chất dinh dưỡng chính: chất đạm (xây dựng tế bào), chất bột đường (nguồn năng lượng chính), chất béo (dự trữ năng lượng) và vitamin, chất khoáng (tăng sức đề kháng).',
          },
          {
            page: 48,
            content:
              '[SGK Công nghệ 6 - Kết nối tri thức - Chương III & IV] Vải sợi thiên nhiên có nguồn gốc từ thực vật (bông, lanh) hoặc động vật (tơ tằm, lông cừu), có độ hút ẩm cao, mặc thoáng mát nhưng dễ bị nhàu. Hai thông số kĩ thuật cơ bản ghi trên đồ dùng điện là điện áp định mức (đơn vị Vôn - V, mạng điện sinh hoạt Việt Nam là 220V) và công suất định mức (đơn vị Oát - W).',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Công nghệ 6 - Kết nối tri thức',
      description: 'Đề kiểm tra kiến thức Nhà ở, Dinh dưỡng thực phẩm, Trang phục và Đồ dùng điện lớp 6.',
      duration: 15,
      questions: [
        {
          content: 'Quy trình xây dựng nhà ở gồm 3 bước chính theo thứ tự nào sau đây?',
          options: ['Chuẩn bị -> Thi công -> Hoàn thiện', 'Thi công -> Chuẩn bị -> Hoàn thiện', 'Hoàn thiện -> Thi công -> Chuẩn bị', 'Chuẩn bị -> Hoàn thiện -> Thi công'],
          correctOption: 'Chuẩn bị -> Thi công -> Hoàn thiện',
          explanation: 'Theo Bài 2 SGK Công nghệ 6 Kết nối tri thức, quy trình xây dựng nhà ở gồm 3 bước: Chuẩn bị, Thi công và Hoàn thiện.',
        },
        {
          content: 'Loại vải nào sau đây có độ hút ẩm cao, mặc thoáng mát nhưng dễ bị nhàu?',
          options: ['Vải sợi thiên nhiên (vải bông, tơ tằm)', 'Vải sợi tổng hợp (nilon, polyester)', 'Vải sợi pha', 'Vải chống thấm'],
          correctOption: 'Vải sợi thiên nhiên (vải bông, tơ tằm)',
          explanation: 'Vải sợi thiên nhiên có nguồn gốc từ bông, lanh, tơ tằm có ưu điểm hút ẩm cao, thoáng mát nhưng dễ nhàu khi giặt.',
        },
        {
          content: 'Trên nhãn một chiếc nồi cơm điện có ghi "220V - 700W". Con số 700W cho biết thông số kĩ thuật nào?',
          options: ['Công suất định mức của nồi cơm điện', 'Điện áp định mức của nồi cơm điện', 'Dung tích của nồi cơm điện', 'Nhiệt độ nấu tối đa'],
          correctOption: 'Công suất định mức của nồi cơm điện',
          explanation: 'Đơn vị W (Oát) chỉ công suất định mức, còn 220V (Vôn) chỉ điện áp định mức.',
        },
      ],
    },
  },

  // =========================================================================
  // KHỐI 7 - BỘ SÁCH KẾT NỐI TRI THỨC VỚI CUỘC SỐNG (GDPT 2018)
  // =========================================================================
  {
    subjectName: 'Toán',
    grade: 7,
    title: 'Toán 7 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Toán lớp 7 (Tập 1 & Tập 2) bộ Kết nối tri thức với cuộc sống: Số hữu tỉ, Số thực, Góc và đường thẳng song song, Tam giác bằng nhau, Tỉ lệ thức, Đa thức một biến, Quan hệ các yếu tố trong tam giác, Xác suất.',
    teacherCode: 'GV01',
    lessons: [
      {
        order: 1,
        title: 'Chương I & II: Số hữu tỉ và Số thực',
        content:
          '1. Số hữu tỉ là số viết được dưới dạng phân số a/b (a, b thuộc Z, b ≠ 0), tập hợp các số hữu tỉ kí hiệu là Q. Các phép tính cộng, trừ, nhân, chia và lũy thừa của một số hữu tỉ: (x^m)^n = x^(m.n), (x.y)^n = x^n . y^n.\n2. Số thập phân vô hạn tuần hoàn và số thập phân vô hạn không tuần hoàn (số vô tỉ, ví dụ √2, π).\n3. Căn bậc hai số học của một số a không âm là số x không âm sao cho x^2 = a, kí hiệu √a.\n4. Tập hợp số thực R gồm số hữu tỉ và số vô tỉ; Giá trị tuyệt đối của một số thực |x| >= 0.',
      },
      {
        order: 2,
        title: 'Chương III & IV: Góc, Đường thẳng song song và Hai tam giác bằng nhau',
        content:
          '1. Hai góc kề bù có tổng số đo bằng 180°. Hai góc đối đỉnh thì bằng nhau. Tia phân giác của một góc.\n2. Dấu hiệu nhận biết và tính chất của hai đường thẳng song song: Hai góc so le trong bằng nhau; hai góc đồng vị bằng nhau; hai góc trong cùng phía bù nhau. Tiên đề Euclid về đường thẳng song song.\n3. Tổng ba góc trong một tam giác bằng 180°. Ba trường hợp bằng nhau của hai tam giác thường: cạnh - cạnh - cạnh (c.c.c), cạnh - góc - cạnh (c.g.c), góc - cạnh - góc (g.c.g) và các trường hợp bằng nhau của hai tam giác vuông.',
      },
      {
        order: 3,
        title: 'Chương V & VI: Tỉ lệ thức, Đại lượng tỉ lệ và Đa thức một biến',
        content:
          '1. Tỉ lệ thức a/b = c/d <=> a.d = b.c. Tính chất của dãy tỉ số bằng nhau: a/b = c/d = (a+c)/(b+d) = (a-c)/(b-d).\n2. Đại lượng tỉ lệ thuận (y = k.x) và đại lượng tỉ lệ nghịch (y = a/x hay x.y = a).\n3. Biểu thức đại số, đa thức một biến, bậc, hệ số cao nhất, hệ số tự do, nghiệm của đa thức một biến P(x) (x = a là nghiệm nếu P(a) = 0); Cộng, trừ, nhân, chia đa thức một biến.',
      },
      {
        order: 4,
        title: 'Chương VII, VIII & IX: Quan hệ trong tam giác, Biến cố & Xác suất, Hình khối thực tiễn',
        content:
          '1. Quan hệ giữa góc và cạnh đối diện trong một tam giác; Bất đẳng thức tam giác: |a - b| < c < a + b.\n2. Sự đồng quy của ba đường trung tuyến (Trọng tâm G, cách đỉnh một khoảng bằng 2/3 độ dài đường trung tuyến), ba đường phân giác (tâm đường tròn nội tiếp), ba đường trung trực (tâm đường tròn ngoại tiếp) và ba đường cao (Trực tâm H).\n3. Hình hộp chữ nhật, hình lập phương, hình lăng trụ đứng tam giác và tứ giác (Sxq = Cđáy . h, V = Sđáy . h).',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Toan_7_Tap_1_2_Ket_Noi_Tri_Thuc.pdf',
        size: '2.7 MB',
        chunks: [
          {
            page: 12,
            content:
              '[SGK Toán 7 - Kết nối tri thức - Chương I, II, V, VI: Đại số 7] Số hữu tỉ là số viết được dưới dạng phân số a/b (a, b thuộc Z, b khác 0), tập hợp kí hiệu là Q. Căn bậc hai số học của số a không âm là số x không âm sao cho x^2 = a. Tính chất dãy tỉ số bằng nhau: Từ a/b = c/d suy ra a/b = c/d = (a+c)/(b+d) = (a-c)/(b-d) (với các mẫu khác 0). Nếu tại x = a, đa thức P(x) có giá trị bằng 0, tức là P(a) = 0, thì a được gọi là một nghiệm của đa thức P(x).',
          },
          {
            page: 75,
            content:
              '[SGK Toán 7 - Kết nối tri thức - Chương III, IV, VII: Hình học 7] Tổng ba góc trong một tam giác luôn bằng 180°. Trong một tam giác, đối diện với cạnh lớn hơn là góc lớn hơn và ngược lại. Bất đẳng thức tam giác: Trong một tam giác, độ dài của một cạnh bất kì luôn nhỏ hơn tổng và lớn hơn hiệu độ dài hai cạnh còn lại. Ba đường trung tuyến của một tam giác cùng đi qua một điểm G gọi là trọng tâm, điểm G cách mỗi đỉnh một khoảng bằng 2/3 độ dài đường trung tuyến đi qua đỉnh ấy (AG = 2/3 AM).',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Toán 7 - Kết nối tri thức: Số thực, Tỉ lệ thức & Tam giác',
      description: 'Đề kiểm tra kiến thức trọng tâm Toán lớp 7 theo bộ sách Kết nối tri thức với cuộc sống.',
      duration: 15,
      questions: [
        {
          content: 'Căn bậc hai số học của 49 là số nào sau đây?',
          options: ['7', '-7', '±7', '2401'],
          correctOption: '7',
          explanation: 'Căn bậc hai số học của số a không âm là số x không âm sao cho x^2 = a. Vì 7 >= 0 và 7^2 = 49 nên √49 = 7.',
        },
        {
          content: 'Tìm hai số x, y biết x/3 = y/5 và x + y = 24.',
          options: ['x = 9, y = 15', 'x = 15, y = 9', 'x = 6, y = 18', 'x = 3, y = 5'],
          correctOption: 'x = 9, y = 15',
          explanation: 'Áp dụng tính chất dãy tỉ số bằng nhau: x/3 = y/5 = (x+y)/(3+5) = 24/8 = 3. Suy ra x = 3.3 = 9 và y = 5.3 = 15.',
        },
        {
          content: 'Cho đa thức P(x) = 2x - 6. Nghiệm của đa thức P(x) là:',
          options: ['x = 3', 'x = -3', 'x = 2', 'x = 6'],
          correctOption: 'x = 3',
          explanation: 'Cho P(x) = 0 => 2x - 6 = 0 => 2x = 6 => x = 3.',
        },
        {
          content: 'Cho tam giác ABC có AM là đường trung tuyến bằng 9 cm và G là trọng tâm của tam giác. Độ dài đoạn thẳng AG bằng:',
          options: ['6 cm', '3 cm', '4,5 cm', '9 cm'],
          correctOption: '6 cm',
          explanation: 'Trọng tâm G cách đỉnh A một khoảng bằng 2/3 độ dài đường trung tuyến AM: AG = (2/3) . 9 = 6 (cm).',
        },
      ],
    },
  },
  {
    subjectName: 'Ngữ văn',
    grade: 7,
    title: 'Ngữ văn 7 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Ngữ văn lớp 7 bộ Kết nối tri thức: Truyện ngắn, Thơ bốn chữ & năm chữ, Tùy bút & Tản văn, Truyện ngụ ngôn, Tục ngữ, Truyện khoa học viễn tưởng, Nghị luận xã hội & văn học.',
    teacherCode: 'GV02',
    lessons: [
      {
        order: 1,
        title: 'Bài 1, 2 & 3: Bầu trời tuổi thơ – Khúc ca quê hương – Cội nguồn yêu thương',
        content:
          '1. Truyện ngắn và tiểu thuyết (Bầy chim chìa vôi - Nguyễn Quang Thiều; Đi lấy mật - trích Đất rừng phương Nam của Đoàn Giỏi).\n2. Thơ bốn chữ và năm chữ: Cách ngắt nhịp, gieo vần, hình ảnh thơ giàu nhạc điệu (Đồng dao mùa xuân - Nguyễn Khoa Điềm; Gặp lá cơm nếp - Thanh Thảo).\n3. Thực hành tiếng Việt: Mở rộng thành phần chính và trạng ngữ của câu bằng cụm từ; Số từ, phó từ; Biện pháp tu từ nói giảm nói tránh, điệp ngữ.',
      },
      {
        order: 2,
        title: 'Bài 4 & 5: Giai điệu đất nước – Màu sắc trăm miền',
        content:
          '1. Tùy bút và Tản văn: Thể loại kí giàu chất trữ tình, thể hiện cái tôi cảm xúc của tác giả trước vẻ đẹp thiên nhiên và văn hóa dân tộc (Mùa xuân nho nhỏ - Thanh Hải; Mùa phơi sân trước - Nguyễn Ngọc Tư; Tháng Giêng, mơ về trăng non rét ngọt - Vũ Bằng; Chuyện cơm hến - Hoàng Phủ Ngọc Tường).\n2. Ngữ cảnh và nghĩa của từ trong ngữ cảnh; Từ ngữ địa phương và sự giàu đẹp của tiếng Việt.',
      },
      {
        order: 3,
        title: 'Bài 6, 7, 8 & 9: Bài học cuộc sống – Thế giới viễn tưởng – Trải nghiệm để trưởng thành – Hòa điệu với tự nhiên',
        content:
          '1. Truyện ngụ ngôn (Đẽo cày giữa đường; Ếch ngồi đáy giếng; Con hổ có nghĩa) và Tục ngữ Việt Nam (những câu nói dân gian ngắn gọn, có nhịp điệu, đúc kết kinh nghiệm về thiên nhiên, lao động và con người).\n2. Truyện khoa học viễn tưởng (Cuộc chạm trán trên đại dương - trích Hai vạn dặm dưới đáy biển của Jules Verne).\n3. Văn bản nghị luận (Bản đồ dẫn đường; Hãy cầm lấy và đọc) và Văn bản thông tin (Thủy tiên tháng Một).',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Ngu_Van_7_Ket_Noi_Tri_Thuc.pdf',
        size: '2.6 MB',
        chunks: [
          {
            page: 15,
            content:
              '[SGK Ngữ văn 7 - Kết nối tri thức - Tập 1] Trong bài "Bầu trời tuổi thơ", truyện ngắn "Bầy chim chìa vôi" (Nguyễn Quang Thiều) và đoạn trích "Đi lấy mật" (Đoàn Giỏi) khắc họa thế giới tâm hồn trong sáng của trẻ thơ và vẻ đẹp thiên nhiên. Thơ bốn chữ, năm chữ (như "Đồng dao mùa xuân" của Nguyễn Khoa Điềm, "Gặp lá cơm nếp" của Thanh Thảo) có nhịp điệu linh hoạt, giàu tính nhạc. Tùy bút và tản văn (như "Tháng Giêng, mơ về trăng non rét ngọt" của Vũ Bằng) bộc lộ trực tiếp cảm xúc, suy tư của cái "tôi" tác giả.',
          },
          {
            page: 110,
            content:
              '[SGK Ngữ văn 7 - Kết nối tri thức - Tập 2] Truyện ngụ ngôn là loại truyện kể ngắn gọn, hàm súc, bằng văn xuôi hoặc văn vần, mượn chuyện loài vật hoặc con người để nêu bài học triết lí nhân sinh (Đẽo cày giữa đường, Ếch ngồi đáy giếng). Tục ngữ là những câu nói dân gian ngắn gọn, ổn định, có nhịp điệu, hình ảnh, đúc kết kinh nghiệm của nhân dân về tự nhiên, lao động sản xuất và ứng xử xã hội. Truyện khoa học viễn tưởng dựa trên các giả thuyết, thành tựu khoa học công nghệ tương lai.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Ngữ văn 7 - Kết nối tri thức: Thơ 4-5 chữ, Tùy bút & Ngụ ngôn',
      description: 'Đề kiểm tra kiến thức Ngữ văn lớp 7 theo bộ sách Kết nối tri thức với cuộc sống.',
      duration: 15,
      questions: [
        {
          content: 'Đoạn trích "Đi lấy mật" trong SGK Ngữ văn 7 (Kết nối tri thức) được trích từ tiểu thuyết nào của nhà văn Đoàn Giỏi?',
          options: ['Đất rừng phương Nam', 'Cá bống mú', 'Rừng đêm xào xạc', 'Người thủy thủ già trên hòn đảo lưu đày'],
          correctOption: 'Đất rừng phương Nam',
          explanation: '"Đi lấy mật" trích từ tiểu thuyết nổi tiếng "Đất rừng phương Nam" của nhà văn Đoàn Giỏi.',
        },
        {
          content: 'Truyện ngụ ngôn "Đẽo cày giữa đường" khuyên con người bài học gì trong cuộc sống?',
          options: ['Phải có chính kiến riêng, suy xét kĩ càng khi lắng nghe ý kiến của người khác', 'Nên làm theo tất cả lời khuyên của mọi người đi qua đường', 'Không bao giờ được hỏi ý kiến người khác', 'Nghề mộc là nghề khó nhất'],
          correctOption: 'Phải có chính kiến riêng, suy xét kĩ càng khi lắng nghe ý kiến của người khác',
          explanation: 'Truyện phê phán người thiếu chủ kiến, ai nói gì cũng nghe theo dẫn đến thất bại, tốn công vô ích.',
        },
        {
          content: 'Biện pháp tu từ nào dùng cách diễn đạt tế nhị, uyển chuyển để tránh gây cảm giác quá đau buồn, nặng nề hoặc thô tục?',
          options: ['Nói giảm nói tránh', 'Nói quá', 'Nhân hóa', 'Liệt kê'],
          correctOption: 'Nói giảm nói tránh',
          explanation: 'Nói giảm nói tránh là biện pháp tu từ dùng cách diễn đạt tế nhị, uyển chuyển để giảm nhẹ mức độ đau buồn hoặc tránh sự thô tục.',
        },
      ],
    },
  },
  {
    subjectName: 'Tiếng Anh',
    grade: 7,
    title: 'Tiếng Anh 7 - Global Success (Kết nối tri thức)',
    description:
      'Chương trình Tiếng Anh lớp 7 Global Success (Unit 1 - Unit 12): Hobbies, Healthy living, Community service, Music and arts, Food and drink, A visit to a school, Traffic, Films, Festivals, Energy sources, Future travelling, English-speaking countries.',
    teacherCode: 'GV03',
    lessons: [
      {
        order: 1,
        title: 'Units 1 - 3: Hobbies, Healthy Living & Community Service',
        content:
          '1. Verbs of liking and disliking: like, love, enjoy, hate, prefer + V-ing.\n2. Simple sentences (Câu đơn): chỉ có một mệnh đề độc lập (S + V / S + V + O).\n3. The Past Simple (Thì quá khứ đơn): ôn tập động từ có quy tắc (-ed) và bất quy tắc, cách phát âm đuôi -ed (/id/, /t/, /d/).',
      },
      {
        order: 2,
        title: 'Units 4 - 6: Music and Arts, Food and Drink & A Visit to a School',
        content:
          '1. Comparisons: like, different from, (not) as + adj + as (so sánh ngang bằng).\n2. Quantifiers: some, any, a lot of / lots of; How much (danh từ không đếm được) & How many (danh từ đếm được số nhiều).\n3. Prepositions of time (at + giờ, on + ngày/thứ, in + tháng/năm/mùa/buổi) and Prepositions of place (at, in, on).',
      },
      {
        order: 3,
        title: 'Units 7 - 12: Traffic, Films, Festivals, Energy Sources & Future Travelling',
        content:
          '1. "It" indicating distance: It is about + khoảng cách + from A to B; should / shouldn\'t.\n2. Connectors: although / though (mặc dù + S + V) và however (tuy nhiên).\n3. Yes/No questions; Present Continuous cho hành động đang diễn ra tạo nguồn năng lượng xanh; Future Simple (will + V) & Possessive pronouns.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Tieng_Anh_7_Global_Success_KNTT.pdf',
        size: '2.3 MB',
        chunks: [
          {
            page: 10,
            content:
              '[SGK Tiếng Anh 7 Global Success - Kết nối tri thức] Động từ chỉ sự yêu thích (love, like, enjoy, fancy, hate, detest) đi kèm với V-ing (ví dụ: She enjoys gardening). Cấu trúc so sánh ngang bằng: S1 + be + (not) as + adj + as + S2; A is different from B; A is like B. Giới từ chỉ thời gian: "at" dùng với giờ (at 7 o\'clock, at noon, at night), "on" dùng với ngày và thứ (on Monday, on May 15th), "in" dùng với tháng, mùa, năm (in June, in 2026). Liên từ "Although / Though" đứng trước một mệnh đề (S + V) chỉ sự nhượng bộ, còn "However" thường đứng đầu câu và ngăn cách bởi dấu phẩy.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Tiếng Anh 7 - Global Success',
      description: 'Đề kiểm tra ngữ pháp và từ vựng Tiếng Anh 7 (Global Success - Kết nối tri thức).',
      duration: 15,
      questions: [
        {
          content: 'My sister really enjoys ______ models in her free time.',
          options: ['making', 'make', 'to make', 'made'],
          correctOption: 'making',
          explanation: 'Sau động từ "enjoy" (Verbs of liking - Unit 1), động từ theo sau luôn ở dạng V-ing (making).',
        },
        {
          content: 'Classical music is not ______ exciting as rock music.',
          options: ['as', 'more', 'than', 'from'],
          correctOption: 'as',
          explanation: 'Cấu trúc so sánh không ngang bằng (Unit 4): not as + adj + as.',
        },
        {
          content: '______ the film was very long, we watched it until the end.',
          options: ['Although', 'However', 'Because', 'Despite'],
          correctOption: 'Although',
          explanation: '"Although" + mệnh đề (S + V) diễn tả sự nhượng bộ ("Mặc dù bộ phim rất dài...").',
        },
      ],
    },
  },
  {
    subjectName: 'Khoa học tự nhiên',
    grade: 7,
    title: 'Khoa học tự nhiên 7 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình KHTN lớp 7 bộ Kết nối tri thức: Nguyên tử & Bảng tuần hoàn, Phân tử & Liên kết hóa học, Tốc độ, Âm thanh, Ánh sáng, Từ trường, Trao đổi chất, Cảm ứng và Sinh sản ở sinh vật.',
    teacherCode: 'GV04',
    lessons: [
      {
        order: 1,
        title: 'Chương II & III: Nguyên tử, Bảng tuần hoàn, Phân tử và Liên kết hóa học',
        content:
          '1. Nguyên tử gồm hạt nhân (chứa proton mang điện tích dương +1 và neutron không mang điện) và lớp vỏ (chứa các electron mang điện tích âm -1). Trong nguyên tử: Số p = Số e. Khối lượng nguyên tử tập trung ở hạt nhân (đơn vị amu).\n2. Bảng tuần hoàn các nguyên tố hóa học: Ô nguyên tố (số hiệu nguyên tử = số p), Chu kì (gồm các nguyên tố có cùng số lớp electron - 7 chu kì), Nhóm (gồm các nguyên tố có số electron lớp ngoài cùng tương tự nhau).\n3. Đơn chất, hợp chất, phân tử; Liên kết ion (cho - nhận electron giữa kim loại điển hình và phi kim điển hình) và Liên kết cộng hóa trị (dùng chung electron); Hóa trị và công thức hóa học.',
      },
      {
        order: 2,
        title: 'Chương IV, V, VI & VII: Tốc độ, Âm thanh, Ánh sáng và Từ trường',
        content:
          '1. Tốc độ chuyển động: v = s / t (đơn vị chuẩn m/s hoặc km/h; 1 m/s = 3,6 km/h). Đồ thị quãng đường - thời gian.\n2. Sóng âm truyền được trong chất rắn, lỏng, khí (v_rắn > v_lỏng > v_khí), không truyền được trong chân không. Độ cao của âm phụ thuộc tần số (Hz); Độ to của âm phụ thuộc biên độ dao động.\n3. Định luật phản xạ ánh sáng: Tia phản xạ nằm trong mặt phẳng tới, góc phản xạ bằng góc tới (i\' = i). Ảnh của vật tạo bởi gương phẳng là ảnh ảo, bằng vật và đối xứng với vật qua gương.\n4. Nam châm vĩnh cửu (hai cực Bắc N - Nam S), từ trường, từ phổ, đường sức từ (có chiều đi ra từ cực Bắc và đi vào cực Nam), từ trường Trái Đất và nam châm điện.',
      },
      {
        order: 3,
        title: 'Chương VIII, IX, X & XI: Trao đổi chất, Cảm ứng, Sinh trưởng và Sinh sản ở sinh vật',
        content:
          '1. Quang hợp ở thực vật: Nước + Carbon dioxide --(Ánh sáng, Diệp lục)--> Glucose + Oxygen. Hô hấp tế bào: Glucose + Oxygen -> Carbon dioxide + Nước + Năng lượng (ATP).\n2. Vận chuyển các chất trong cây (mạch gỗ vận chuyển nước và muối khoáng từ rễ lên lá; mạch rây vận chuyển chất hữu cơ từ lá xuống các cơ quan) và ở động vật.\n3. Cảm ứng, tập tính, sinh trưởng và phát triển, sinh sản vô tính và sinh sản hữu tính ở sinh vật.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Khoa_Hoc_Tu_Nhien_7_Ket_Noi_Tri_Thuc.pdf',
        size: '3.2 MB',
        chunks: [
          {
            page: 18,
            content:
              '[SGK Khoa học tự nhiên 7 - Kết nối tri thức - Chương II & III: Hóa học] Nguyên tử trung hòa về điện nên số proton (mang điện dương) luôn bằng số electron (mang điện âm). Các nguyên tố trong cùng một chu kì có cùng số lớp electron. Công thức hóa học của hợp chất tạo bởi nguyên tố X (hóa trị a) và Y (hóa trị b) là X_x Y_y tuân theo quy tắc hóa trị: x . a = y . b.',
          },
          {
            page: 52,
            content:
              '[SGK Khoa học tự nhiên 7 - Kết nối tri thức - Chương IV, V, VI, VII: Vật lí] Công thức tính tốc độ: v = s / t (1 m/s = 3,6 km/h). Sóng âm truyền nhanh nhất trong chất rắn, chậm hơn trong chất lỏng và chất khí, không truyền được trong chân không. Định luật phản xạ ánh sáng: Góc phản xạ luôn bằng góc tới (i\' = i). Đường sức từ ở bên ngoài thanh nam châm là những đường cong đi ra từ cực Bắc (N) và đi vào cực Nam (S).',
          },
          {
            page: 105,
            content:
              '[SGK Khoa học tự nhiên 7 - Kết nối tri thức - Chương VIII-XI: Sinh học] Phương trình quang hợp: Nước + Khí carbon dioxide --(Ánh sáng, Diệp lục)--> Glucose + Khí oxygen. Ở thực vật có mạch, mạch gỗ vận chuyển nước và muối khoáng từ rễ lên thân, lá; mạch rây vận chuyển các chất hữu cơ được tổng hợp ở lá đến các cơ quan khác.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Khoa học tự nhiên 7 - Kết nối tri thức',
      description: 'Đề kiểm tra kiến thức Nguyên tử, Tốc độ, Ánh sáng và Quang hợp (KHTN 7 Kết nối tri thức).',
      duration: 15,
      questions: [
        {
          content: 'Trong nguyên tử trung hòa về điện, hạt nào ở lớp vỏ mang điện tích âm?',
          options: ['Electron', 'Proton', 'Neutron', 'Hạt nhân'],
          correctOption: 'Electron',
          explanation: 'Hạt electron ở lớp vỏ nguyên tử mang điện tích âm (-1), proton mang điện tích dương (+1), neutron không mang điện.',
        },
        {
          content: 'Một ô tô đi được quãng đường 120 km trong thời gian 2 giờ. Tốc độ trung bình của ô tô đó là:',
          options: ['60 km/h', '240 km/h', '30 km/h', '122 km/h'],
          correctOption: '60 km/h',
          explanation: 'Áp dụng công thức v = s / t = 120 / 2 = 60 (km/h).',
        },
        {
          content: 'Chiếu một tia sáng tới gương phẳng với góc tới i = 35°. Góc phản xạ i\' có giá trị bằng bao nhiêu?',
          options: ['35°', '55°', '70°', '90°'],
          correctOption: '35°',
          explanation: 'Theo định luật phản xạ ánh sáng, góc phản xạ luôn bằng góc tới: i\' = i = 35°.',
        },
        {
          content: 'Trong thân cây, mạch gỗ có chức năng vận chuyển chủ yếu các chất nào từ rễ lên lá?',
          options: ['Nước và muối khoáng', 'Chất hữu cơ do lá tổng hợp', 'Khí oxygen', 'Chất diệp lục'],
          correctOption: 'Nước và muối khoáng',
          explanation: 'Mạch gỗ vận chuyển nước và muối khoáng hòa tan từ rễ lên lá; còn mạch rây vận chuyển chất hữu cơ từ lá xuống.',
        },
      ],
    },
  },
  {
    subjectName: 'Lịch sử và Địa lí',
    grade: 7,
    title: 'Lịch sử và Địa lí 7 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Lịch sử và Địa lí lớp 7 bộ Kết nối tri thức: Tây Âu trung đại, Phát kiến địa lí, Trung Quốc & Ấn Độ phong kiến, Đại Việt thời Ngô - Đinh - Tiền Lê - Lý - Trần - Hồ - Lê sơ; Địa lí các châu lục (Châu Âu, Châu Á, Châu Phi, Châu Mỹ, Châu Đại Dương, Châu Nam Cực).',
    teacherCode: 'GV05',
    lessons: [
      {
        order: 1,
        title: 'Phần Lịch sử (Chương 1 - 4): Tây Âu, Phát kiến địa lí, Trung Quốc, Ấn Độ và Đông Nam Á trung đại',
        content:
          '1. Sự hình thành và phát triển của chế độ phong kiến ở Tây Âu; Các cuộc phát kiến địa lí lớn thế kỉ XV - XVI (C. Cô-lôm-bô tìm ra châu Mỹ năm 1492, V. Ga-ma đến Ấn Độ, Ph. Ma-gien-lăng vòng quanh Trái Đất); Phong trào Văn hóa Phục hưng và Cải cách tôn giáo.\n2. Trung Quốc từ thế kỉ VII đến giữa thế kỉ XIX (Đường, Tống, Nguyên, Minh, Thanh) và Ấn Độ thời phong kiến (vương triều Gúp-ta, Đê-li, Mô-gôn).',
      },
      {
        order: 2,
        title: 'Phần Lịch sử (Chương 5): Việt Nam từ đầu thế kỉ X đến đầu thế kỉ XVI (Đại Việt)',
        content:
          '1. Thời Ngô - Đinh - Tiền Lê (939 - 1009): Đinh Bộ Lĩnh dẹp loạn 12 sứ quân lập nước Đại Cồ Việt (năm 968, đóng đô ở Hoa Lư); Lê Hoàn đánh tan quân Tống xâm lược năm 981.\n2. Thời Lý (1009 - 1225): Năm 1010 Lý Công Uẩn dời đô về Đại La và đổi tên thành Thăng Long; Năm 1054 đổi quốc hiệu là Đại Việt; Lý Thường Kiệt kháng chiến chống Tống (1075 - 1077) trên sông Như Nguyệt.\n3. Thời Trần (1226 - 1400): Ba lần kháng chiến chống quân xâm lược Mông - Nguyên thắng lợi (1258, 1285, 1287 - 1288).\n4. Khởi nghĩa Lam Sơn (1418 - 1427) do Lê Lợi và Nguyễn Trãi lãnh đạo đánh đuổi quân Minh và nước Đại Việt thời Lê sơ (vua Lê Thái Tổ, Lê Thánh Tông, Bộ luật Hồng Đức).',
      },
      {
        order: 3,
        title: 'Phần Địa lí (Chương 1 - 6): Thiên nhiên và dân cư các châu lục trên thế giới',
        content:
          '1. Châu Âu: Địa hình đồng bằng chiếm 2/3 diện tích, khí hậu ôn đới hải dương và ôn đới lục địa, dân số già hóa, đô thị hóa cao, Liên minh châu Âu (EU).\n2. Châu Á: Châu lục rộng nhất thế giới (~44,4 triệu km²), địa hình núi và sơn nguyên đồ sộ (đỉnh Everest 8848m), khí hậu gió mùa và lục địa khô, đông dân nhất thế giới.\n3. Châu Phi (khí hậu nóng và khô bậc nhất, hoang mạc Sahara), Châu Mỹ (kênh đào Panama nối Bắc Mỹ và Nam Mỹ, rừng nhiệt đới Amazon), Châu Đại Dương và Châu Nam Cực (châu lục lạnh nhất, Hiệp ước Nam Cực 1959).',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Lich_Su_Va_Dia_Li_7_Ket_Noi_Tri_Thuc.pdf',
        size: '3.0 MB',
        chunks: [
          {
            page: 48,
            content:
              '[SGK Lịch sử và Địa lí 7 - Kết nối tri thức - Phần Lịch sử Đại Việt] Năm 968, Đinh Bộ Lĩnh dẹp yên loạn 12 sứ quân, lên ngôi Hoàng đế (Đinh Tiên Hoàng), đặt quốc hiệu là Đại Cồ Việt, đóng đô ở Hoa Lư (Ninh Bình). Năm 1010, vua Lý Thái Tổ (Lý Công Uẩn) ban Chiếu dời đô từ Hoa Lư về thành Đại La và đổi tên là Thăng Long. Thời nhà Trần, quân dân Đại Việt đã ba lần đánh tan quân xâm lược Mông - Nguyên vào các năm 1258, 1285 và 1287-1288. Thời Lê sơ dưới triều vua Lê Thánh Tông đã ban hành Quốc triều hình luật (Bộ luật Hồng Đức).',
          },
          {
            page: 102,
            content:
              '[SGK Lịch sử và Địa lí 7 - Kết nối tri thức - Phần Địa lí các châu lục] Châu Á là châu lục có diện tích phần đất liền lớn nhất thế giới (khoảng 41,5 triệu km², tính cả các đảo là 44,4 triệu km²) và đông dân nhất thế giới. Châu Phi có đường Xích đạo đi qua gần chính giữa châu lục, khí hậu nóng và khô bậc nhất thế giới với hoang mạc Sahara lớn nhất thế giới. Rừng mưa nhiệt đới Amazon ở Nam Mỹ là lá phổi xanh lớn nhất hành tinh.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Lịch sử và Địa lí 7 - Kết nối tri thức',
      description: 'Đề kiểm tra kiến thức Lịch sử Đại Việt (Lý - Trần - Lê sơ) và Địa lí các châu lục lớp 7.',
      duration: 15,
      questions: [
        {
          content: 'Năm 1010, vị vua nào đã ban "Chiếu dời đô" chuyển kinh đô từ Hoa Lư về Đại La (Thăng Long)?',
          options: ['Lý Thái Tổ (Lý Công Uẩn)', 'Đinh Tiên Hoàng', 'Lê Đại Hành', 'Trần Nhân Tông'],
          correctOption: 'Lý Thái Tổ (Lý Công Uẩn)',
          explanation: 'Mùa thu năm 1010, vua Lý Thái Tổ (Lý Công Uẩn) quyết định dời đô từ Hoa Lư (Ninh Bình) về Đại La và đổi tên thành Thăng Long.',
        },
        {
          content: 'Trong thế kỉ XIII, quân dân nhà Trần đã mấy lần đánh thắng quân xâm lược Mông - Nguyên?',
          options: ['3 lần (1258, 1285, 1287 - 1288)', '2 lần', '1 lần', '4 lần'],
          correctOption: '3 lần (1258, 1285, 1287 - 1288)',
          explanation: 'Ba lần kháng chiến chống quân Mông - Nguyên của nhà Trần diễn ra vào các năm 1258, 1285 và 1287 - 1288.',
        },
        {
          content: 'Châu lục nào có diện tích lớn nhất và số dân đông nhất trên thế giới?',
          options: ['Châu Á', 'Châu Phi', 'Châu Mỹ', 'Châu Âu'],
          correctOption: 'Châu Á',
          explanation: 'Châu Á là châu lục có diện tích lớn nhất (~44,4 triệu km² tính cả các đảo) và quy mô dân số đông nhất thế giới.',
        },
      ],
    },
  },
  {
    subjectName: 'Giáo dục công dân',
    grade: 7,
    title: 'Giáo dục công dân 7 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình GDCD lớp 7 bộ Kết nối tri thức: Tự hào truyền thống quê hương, Quan tâm cảm thông chia sẻ, Học tập tự giác tích cực, Giữ chữ tín, Bảo tồn di sản văn hóa, Ứng phó căng thẳng, Phòng chống bạo lực học đường, Quản lý tiền, Quyền và nghĩa vụ trong gia đình.',
    teacherCode: 'GV06',
    lessons: [
      {
        order: 1,
        title: 'Bài 1 - Bài 5: Truyền thống quê hương, Cảm thông chia sẻ, Học tập tự giác, Giữ chữ tín & Bảo tồn di sản',
        content:
          '1. Tự hào về truyền thống quê hương; Quan tâm, cảm thông và chia sẻ với mọi người.\n2. Học tập tự giác, tích cực: Chủ động lập kế hoạch học tập và rèn luyện không đợi nhắc nhở.\n3. Giữ chữ tín: Coi trọng lòng tin của mọi người đối với mình, biết trọng lời hứa và thực hiện đúng cam kết.\n4. Bảo tồn di sản văn hóa: Di sản văn hóa vật thể (di tích lịch sử, danh lam thắng cảnh, cổ vật) và Di sản văn hóa phi vật thể (tiếng nói, chữ viết, lễ hội, nghệ thuật trình diễn dân gian như Nhã nhạc cung đình Huế, Dân ca Quan họ).',
      },
      {
        order: 2,
        title: 'Bài 6 - Bài 10: Ứng phó tâm lí căng thẳng, Phòng chống bạo lực học đường, Quản lý tiền & Gia đình',
        content:
          '1. Ứng phó với tâm lí căng thẳng và Phòng, chống bạo lực học đường (không cổ vũ, kịp thời báo cho thầy cô, cha mẹ hoặc cơ quan chức năng).\n2. Quản lí tiền hiệu quả: Lập kế hoạch thu - chi hợp lí, ưu tiên nhu cầu thiết yếu và tiết kiệm dự phòng.\n3. Phòng, chống tệ nạn xã hội (ma túy, cờ bạc, mê tín dị đoan) và Quyền, nghĩa vụ của công dân trong gia đình (ông bà, cha mẹ yêu thương, nuôi dưỡng, giáo dục con cháu; con cháu hiếu thảo, kính trọng, chăm sóc ông bà, cha mẹ).',
      },
    ],
    documents: [
      {
        fileName: 'SGK_GDCD_7_Ket_Noi_Tri_Thuc.pdf',
        size: '1.7 MB',
        chunks: [
          {
            page: 22,
            content:
              '[SGK Giáo dục công dân 7 - Kết nối tri thức] Giữ chữ tín là coi trọng lòng tin của mọi người đối với mình, biết trọng lời hứa và biết tin tưởng nhau. Di sản văn hóa bao gồm di sản văn hóa vật thể (Cố đô Huế, Phố cổ Hội An, Vịnh Hạ Long, Hoàng thành Thăng Long...) và di sản văn hóa phi vật thể (Nhã nhạc cung đình Huế, Không gian văn hóa Cồng chiêng Tây Nguyên, Dân ca Quan họ Bắc Ninh...).',
          },
          {
            page: 38,
            content:
              '[SGK Giáo dục công dân 7 - Kết nối tri thức - Bài 7 & Bài 10] Bạo lực học đường là hành vi hành hạ, ngược đãi, đánh đập, xâm hại thân thể, sức khỏe; lăng mạ, xúc phạm danh dự, nhân phẩm; cô lập, xua đuổi học sinh trong cơ sở giáo dục. Trong gia đình, cha mẹ có quyền và nghĩa vụ thương yêu, trông nom, nuôi dưỡng, giáo dục con cái; con cháu có bổn phận yêu quý, kính trọng, biết ơn, hiếu thảo và phụng dưỡng cha mẹ, ông bà.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Giáo dục công dân 7 - Kết nối tri thức',
      description: 'Đề kiểm tra kiến thức Giữ chữ tín, Di sản văn hóa, Phòng chống bạo lực học đường lớp 7.',
      duration: 15,
      questions: [
        {
          content: 'Di sản nào sau đây của Việt Nam thuộc loại "Di sản văn hóa phi vật thể"?',
          options: ['Dân ca Quan họ Bắc Ninh', 'Phố cổ Hội An', 'Hoàng thành Thăng Long', 'Vịnh Hạ Long'],
          correctOption: 'Dân ca Quan họ Bắc Ninh',
          explanation: 'Dân ca Quan họ Bắc Ninh là nghệ thuật trình diễn dân gian nên thuộc Di sản văn hóa phi vật thể; các di sản còn lại là di sản vật thể/thiên nhiên.',
        },
        {
          content: 'Khi chứng kiến bạn học cùng trường bị một nhóm bạn khác đe dọa, bắt nạt, em nên làm gì?',
          options: ['Báo ngay cho thầy cô giáo, cha mẹ hoặc người có trách nhiệm để can thiệp kịp thời', 'Đứng quay video đăng lên mạng xã hội để câu lượt xem', 'Cổ vũ và tham gia trêu chọc cùng nhóm bạn đó', 'Im lặng làm ngơ vì không liên quan đến mình'],
          correctOption: 'Báo ngay cho thầy cô giáo, cha mẹ hoặc người có trách nhiệm để can thiệp kịp thời',
          explanation: 'Theo Bài 7 (Phòng, chống bạo lực học đường), học sinh cần tìm kiếm sự hỗ trợ từ giáo viên, nhà trường, gia đình để ngăn chặn hành vi bạo lực an toàn.',
        },
      ],
    },
  },
  {
    subjectName: 'Tin học',
    grade: 7,
    title: 'Tin học 7 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Tin học lớp 7 bộ Kết nối tri thức: Thiết bị vào - ra, Phần mềm máy tính, Mạng xã hội, Phần mềm bảng tính điện tử, Bài trình chiếu, Thuật toán tìm kiếm và sắp xếp.',
    teacherCode: 'GV07',
    lessons: [
      {
        order: 1,
        title: 'Chủ đề 1, 2 & 3: Thiết bị vào - ra, Phần mềm, Quản lí dữ liệu & Ứng xử trên mạng xã hội',
        content:
          '1. Thiết bị vào (Input devices: bàn phím, chuột, micro, máy quét) và Thiết bị ra (Output devices: màn hình, máy in, loa, máy chiếu); màn hình cảm ứng vừa là thiết bị vào vừa là thiết bị ra.\n2. Hệ điều hành (Windows, macOS, Linux, Android, iOS) quản lí phần cứng và cung cấp môi trường chạy phần mềm ứng dụng. Phần mềm nguồn mở và phần mềm thương mại.\n3. Văn hóa ứng xử qua mạng xã hội và bảo vệ thông tin cá nhân.',
      },
      {
        order: 2,
        title: 'Chủ đề 4 & 5: Phần mềm bảng tính, Bài trình chiếu và Thuật toán tìm kiếm - sắp xếp',
        content:
          '1. Phần mềm bảng tính (Excel): Ô tính, vùng dữ liệu (ví dụ A1:C10), công thức bắt đầu bằng dấu "=" và các hàm cơ bản: SUM (tính tổng), AVERAGE (tính trung bình cộng), MAX (lớn nhất), MIN (nhỏ nhất), COUNT (đếm số).\n2. Thuật toán tìm kiếm tuần tự (Sequential Search) duyệt lần lượt từ đầu đến cuối danh sách.\n3. Thuật toán tìm kiếm nhị phân (Binary Search) áp dụng trên danh sách đã được sắp xếp bằng cách chia đôi vùng tìm kiếm ở mỗi bước.\n4. Thuật toán sắp xếp nổi bọt (Bubble Sort) và sắp xếp chọn (Selection Sort).',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Tin_Hoc_7_Ket_Noi_Tri_Thuc.pdf',
        size: '2.0 MB',
        chunks: [
          {
            page: 30,
            content:
              '[SGK Tin học 7 - Kết nối tri thức - Chủ đề 4: Bảng tính điện tử] Trong phần mềm bảng tính, mọi công thức tính toán đều phải bắt đầu bằng dấu "=". Một số hàm cơ bản: =SUM(vùng) tính tổng các số; =AVERAGE(vùng) tính trung bình cộng; =MAX(vùng) tìm giá trị lớn nhất; =MIN(vùng) tìm giá trị nhỏ nhất; =COUNT(vùng) đếm số ô chứa dữ liệu kiểu số.',
          },
          {
            page: 70,
            content:
              '[SGK Tin học 7 - Kết nối tri thức - Chủ đề 5: Thuật toán tìm kiếm và sắp xếp] Thuật toán tìm kiếm tuần tự thực hiện so sánh lần lượt từ phần tử đầu tiên đến phần tử cuối cùng. Thuật toán tìm kiếm nhị phân chỉ áp dụng được cho danh sách đã được sắp xếp theo thứ tự (tăng dần hoặc giảm dần), tại mỗi bước nó so sánh giá trị cần tìm với phần tử ở vị trí giữa để loại bỏ một nửa danh sách.',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Tin học 7 - Kết nối tri thức: Bảng tính & Thuật toán tìm kiếm',
      description: 'Đề kiểm tra kiến thức Tin học lớp 7 theo bộ sách Kết nối tri thức với cuộc sống.',
      duration: 15,
      questions: [
        {
          content: 'Trong phần mềm bảng tính, hàm nào dùng để tính trung bình cộng các giá trị số trong vùng A1:A5?',
          options: ['=AVERAGE(A1:A5)', '=SUM(A1:A5)', '=MAX(A1:A5)', '=COUNT(A1:A5)'],
          correctOption: '=AVERAGE(A1:A5)',
          explanation: 'Hàm AVERAGE dùng để tính trung bình cộng, SUM tính tổng, MAX tìm giá trị lớn nhất, COUNT đếm các ô chứa số.',
        },
        {
          content: 'Điều kiện bắt buộc để áp dụng được "Thuật toán tìm kiếm nhị phân" trên một danh sách là gì?',
          options: ['Danh sách phải được sắp xếp theo thứ tự tăng dần hoặc giảm dần', 'Danh sách phải có ít hơn 10 phần tử', 'Danh sách chỉ chứa các chữ cái', 'Danh sách được sắp xếp ngẫu nhiên'],
          correctOption: 'Danh sách phải được sắp xếp theo thứ tự tăng dần hoặc giảm dần',
          explanation: 'Theo Bài 15 Tin học 7, thuật toán tìm kiếm nhị phân chỉ hoạt động đúng trên danh sách đã được sắp xếp.',
        },
      ],
    },
  },
  {
    subjectName: 'Công nghệ',
    grade: 7,
    title: 'Công nghệ 7 - Kết nối tri thức với cuộc sống',
    description:
      'Chương trình Công nghệ lớp 7 bộ Kết nối tri thức (Nông - Lâm - Ngư nghiệp): Trồng trọt, Lâm nghiệp, Chăn nuôi và Thủy sản.',
    teacherCode: 'GV08',
    lessons: [
      {
        order: 1,
        title: 'Chương I & II: Trồng trọt và Lâm nghiệp',
        content:
          '1. Vai trò của trồng trọt; Quy trình làm đất trồng cây (Cày đất -> Bừa hoặc đập nhỏ đất -> Lên luống) và bón phân lót.\n2. Gieo trồng, chăm sóc (tỉa dặm, làm cỏ, vun xới, tưới tiêu, bón phân thúc) và phòng trừ sâu, bệnh hại theo nguyên tắc IPM (Phòng trừ tổng hợp).\n3. Nhân giống vô tính cây trồng bằng phương pháp giâm cành, chiết cành, ghép.\n4. Vai trò của rừng (rừng sản xuất, rừng phòng hộ, rừng đặc dụng) và biện pháp trồng, chăm sóc, bảo vệ rừng.',
      },
      {
        order: 2,
        title: 'Chương III & IV: Chăn nuôi và Thủy sản',
        content:
          '1. Vai trò, triển vọng của ngành chăn nuôi và các phương thức chăn nuôi ở Việt Nam (chăn thả, nuôi nhốt/công nghiệp, bán chăn thả).\n2. Kỹ thuật nuôi dưỡng, chăm sóc và phòng, trị bệnh cho vật nuôi (tiêm phòng vắc-xin, vệ sinh chuồng trại).\n3. Giới thiệu về thủy sản, bảo vệ nguồn lợi thủy sản và quy trình kĩ thuật nuôi cá cảnh.',
      },
    ],
    documents: [
      {
        fileName: 'SGK_Cong_Nghe_7_Ket_Noi_Tri_Thuc.pdf',
        size: '1.9 MB',
        chunks: [
          {
            page: 12,
            content:
              '[SGK Công nghệ 7 - Kết nối tri thức - Trồng trọt, Lâm nghiệp, Chăn nuôi, Thủy sản] Quy trình chuẩn bị đất trồng cây gồm: Cày đất (làm xáo trộn lớp đất mặt, chôn vùi cỏ dại), Bừa và đập nhỏ đất, Lên luống (giúp thoát nước, dễ chăm sóc). Ba loại rừng phổ biến ở Việt Nam theo mục đích sử dụng gồm: Rừng sản xuất (cung cấp gỗ, lâm sản), Rừng phòng hộ (bảo vệ nguồn nước, chắn gió, chắn cát bay, chắn sóng) và Rừng đặc dụng (vườn quốc gia, khu bảo tồn thiên nhiên để bảo tồn nguồn gen, nghiên cứu khoa học).',
          },
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra Công nghệ 7 - Kết nối tri thức: Nông - Lâm - Ngư nghiệp',
      description: 'Đề kiểm tra kiến thức Trồng trọt, Lâm nghiệp, Chăn nuôi và Thủy sản lớp 7.',
      duration: 15,
      questions: [
        {
          content: 'Vườn quốc gia Cúc Phương thuộc loại rừng nào theo mục đích sử dụng?',
          options: ['Rừng đặc dụng', 'Rừng sản xuất', 'Rừng phòng hộ đầu nguồn', 'Rừng phòng hộ chắn sóng'],
          correctOption: 'Rừng đặc dụng',
          explanation: 'Các vườn quốc gia, khu bảo tồn thiên nhiên thuộc loại Rừng đặc dụng nhằm bảo tồn hệ sinh thái và nguồn gen sinh vật rừng.',
        },
        {
          content: 'Phương pháp nhân giống cây trồng nào tạo ra cây con từ một đoạn cành đã được bó bầu cho ra rễ ngay trên cây mẹ rồi mới cắt đem trồng?',
          options: ['Chiết cành', 'Giâm cành', 'Ghép mắt', 'Gieo bằng hạt'],
          correctOption: 'Chiết cành',
          explanation: 'Chiết cành là phương pháp kích thích cành ra rễ ngay trên cây mẹ bằng bầu đất ẩm rồi mới cắt rời đem trồng.',
        },
      ],
    },
  },
];
