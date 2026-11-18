export interface GeneratedQuizQuestionItem {
  content: string;
  options: string[]; // Mảng 4 phương án cho Trắc nghiệm, hoặc mảng rỗng [] cho Tự luận
  correctOption: string; // Đáp án đúng (Trắc nghiệm) hoặc Đáp án / Lời giải chuẩn (Tự luận)
  explanation: string;
  questionType: 'MULTIPLE_CHOICE' | 'ESSAY';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Tính thời gian làm bài (30 - 60 phút) dựa trên số lượng câu hỏi (30 - 50 câu)
 */
export function calculateDurationFromQuestionCount(
  numQuestions: number,
): number {
  if (numQuestions <= 30) return 30;
  if (numQuestions >= 50) return 60;
  // Nội suy tuyến tính từ 30 câu (30 phút) đến 50 câu (60 phút), làm tròn đến 5 phút
  const rawMinutes = 30 + ((numQuestions - 30) / 20) * 30;
  return Math.round(rawMinutes / 5) * 5;
}

/**
 * Sinh các câu hỏi Trắc nghiệm & Tự luận biến thiên số liệu ngẫu nhiên theo môn học & khối lớp
 */
function buildParametricSubjectQuestions(
  subjectName: string,
  grade: number,
  targetCount: number,
): GeneratedQuizQuestionItem[] {
  const results: GeneratedQuizQuestionItem[] = [];
  const subj = subjectName.toLowerCase();

  for (let i = 0; i < targetCount; i++) {
    // -----------------------------------------------------------------------
    // 1. MÔN TOÁN (KHỐI 6, 7, 8, 9)
    // -----------------------------------------------------------------------
    if (subj.includes('toán')) {
      const variantType = i % 6;
      if (grade === 6) {
        if (variantType === 0) {
          const a = randomInt(2, 5);
          const m = randomInt(2, 4);
          const n = randomInt(1, 3);
          const ans = `${a}^${m + n}`;
          const opts = shuffleArray([
            ans,
            `${a}^${m * n}`,
            `${a * 2}^${m + n}`,
            `${a}^${Math.abs(m - n)}`,
          ]);
          results.push({
            content: `[Mức 1: Nhận biết - Dễ] [Trắc nghiệm] Kết quả của phép nhân hai lũy thừa cùng cơ số ${a}^${m} . ${a}^${n} viết dưới dạng một lũy thừa là:`,
            options: opts,
            correctOption: ans,
            explanation: `Khi nhân hai lũy thừa cùng cơ số ${a}, ta giữ nguyên cơ số và cộng hai số mũ: ${a}^(${m}+${n}) = ${ans}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
          });
        } else if (variantType === 1) {
          const k = randomInt(4, 12);
          const a = k * 2;
          const b = k * 3;
          const ucln = gcd(a, b);
          const bcnn = (a * b) / ucln;
          const opts = shuffleArray([
            `ƯCLN = ${ucln} và BCNN = ${bcnn}`,
            `ƯCLN = ${bcnn} và BCNN = ${ucln}`,
            `ƯCLN = ${k} và BCNN = ${a + b}`,
            `ƯCLN = 2 và BCNN = ${a * b}`,
          ]);
          results.push({
            content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm] Cho hai số tự nhiên ${a} và ${b}. Ước chung lớn nhất (ƯCLN) và Bội chung nhỏ nhất (BCNN) của hai số đó lần lượt là:`,
            options: opts,
            correctOption: `ƯCLN = ${ucln} và BCNN = ${bcnn}`,
            explanation: `Ta có ${a} = 2 . ${k} và ${b} = 3 . ${k} nên ƯCLN(${a}, ${b}) = ${ucln} và BCNN(${a}, ${b}) = (${a} . ${b}) / ${ucln} = ${bcnn}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM',
          });
        } else if (variantType === 2) {
          const x = randomInt(6, 18);
          const y = randomInt(4, 15);
          const prod = x * y;
          const opts = shuffleArray([
            `${prod}`,
            `-${prod}`,
            `-${x + y}`,
            `${x + y}`,
          ]);
          results.push({
            content: `[Mức 1: Nhận biết - Dễ] [Trắc nghiệm] Kết quả của phép nhân hai số nguyên âm (-${x}) . (-${y}) bằng:`,
            options: opts,
            correctOption: `${prod}`,
            explanation: `Tích của hai số nguyên cùng dấu âm luôn là một số nguyên dương: (-${x}) . (-${y}) = ${x} . ${y} = ${prod}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
          });
        } else if (variantType === 3) {
          const d1 = randomInt(4, 12) * 2;
          const d2 = randomInt(5, 15) * 2;
          const area = (d1 * d2) / 2;
          const opts = shuffleArray([
            `${area} cm²`,
            `${d1 * d2} cm²`,
            `${d1 + d2} cm²`,
            `${(d1 + d2) * 2} cm²`,
          ]);
          results.push({
            content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm] Một hình thoi có độ dài hai đường chéo lần lượt là ${d1} cm và ${d2} cm. Diện tích của hình thoi đó bằng:`,
            options: opts,
            correctOption: `${area} cm²`,
            explanation: `Diện tích hình thoi bằng nửa tích độ dài hai đường chéo: S = (${d1} × ${d2}) / 2 = ${area} (cm²).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM',
          });
        } else if (variantType === 4) {
          const n = randomInt(20, 90);
          const ans = `${n}/${n + 1}`;
          const opts = shuffleArray([
            ans,
            `${n + 1}/${n}`,
            `1/${n + 1}`,
            `${n - 1}/${n + 1}`,
          ]);
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm] Tính tổng dãy phân số theo quy luật: S = 1/(1.2) + 1/(2.3) + 1/(3.4) + ... + 1/(${n}.${n + 1}). Kết quả thu gọn của S là:`,
            options: opts,
            correctOption: ans,
            explanation: `Áp dụng công thức khử liên tiếp 1/[k(k+1)] = 1/k - 1/(k+1), ta có S = 1 - 1/${n + 1} = ${ans}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'HARD',
          });
        } else {
          // Câu hỏi TỰ LUẬN Toán 6
          const base = randomInt(15, 45);
          const p = randomInt(2, 3);
          const mult = randomInt(2, 5);
          const powerVal = Math.pow(2, p);
          const total = base + mult * powerVal;
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Tự luận] Thực hiện phép tính từng bước và ghi kết quả cuối cùng của biểu thức: A = ${base} + ${mult} × 2^${p} - 2026^0.`,
            options: [],
            correctOption: `${total - 1}`,
            explanation: `Bước 1 (Tính lũy thừa): 2^${p} = ${powerVal} và 2026^0 = 1. Bước 2 (Tính nhân): ${mult} × ${powerVal} = ${mult * powerVal}. Bước 3 (Cộng, trừ): A = ${base} + ${mult * powerVal} - 1 = ${total - 1}.`,
            questionType: 'ESSAY',
            difficulty: 'ADVANCED',
          });
        }
      } else if (grade === 7) {
        if (variantType === 0) {
          const a = randomInt(3, 12);
          const sq = a * a;
          const opts = shuffleArray([`${a}`, `-${a}`, `${sq}`, `±${a}`]);
          results.push({
            content: `[Mức 1: Nhận biết - Dễ] [Trắc nghiệm] Căn bậc hai số học của số ${sq} là:`,
            options: opts,
            correctOption: `${a}`,
            explanation: `Căn bậc hai số học của số a không âm là số x không âm sao cho x² = a. Vì ${a} > 0 và ${a}² = ${sq} nên √${sq} = ${a}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
          });
        } else if (variantType === 1) {
          const gB = randomInt(40, 75);
          const gC = randomInt(35, 60);
          const gA = 180 - gB - gC;
          const opts = shuffleArray([
            `${gA}°`,
            `${gB + gC}°`,
            `${90 - gB}°`,
            `${180 - gB}°`,
          ]);
          results.push({
            content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm] Cho tam giác ABC có số đo góc B = ${gB}° và góc C = ${gC}°. Số đo góc A của tam giác ABC bằng:`,
            options: opts,
            correctOption: `${gA}°`,
            explanation: `Tổng ba góc trong một tam giác bằng 180° nên góc A = 180° - (${gB}° + ${gC}°) = ${gA}°.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM',
          });
        } else if (variantType === 2) {
          const k = randomInt(4, 10);
          const r1 = 2;
          const r2 = 3;
          const sum = k * (r1 + r2);
          const x = k * r1;
          const y = k * r2;
          const ans = `x = ${x}, y = ${y}`;
          const opts = shuffleArray([
            ans,
            `x = ${y}, y = ${x}`,
            `x = ${k}, y = ${sum - k}`,
            `x = ${r1}, y = ${r2}`,
          ]);
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm] Tìm hai số x, y biết x/${r1} = y/${r2} và x + y = ${sum}:`,
            options: opts,
            correctOption: ans,
            explanation: `Áp dụng tính chất dãy tỉ số bằng nhau: x/${r1} = y/${r2} = (x + y)/(${r1} + ${r2}) = ${sum}/${r1 + r2} = ${k} => x = ${x}, y = ${y}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'HARD',
          });
        } else if (variantType === 3) {
          const a = randomInt(1, 5);
          const b = a + randomInt(3, 8);
          const minVal = b - a;
          const opts = shuffleArray([`${minVal}`, `${a + b}`, `0`, `${a}`]);
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Trắc nghiệm] Giá trị nhỏ nhất của biểu thức P = |x - ${a}| + |x - ${b}| với mọi số thực x là:`,
            options: opts,
            correctOption: `${minVal}`,
            explanation: `Áp dụng bất đẳng thức |A| + |B| >= |A + B|: P = |x - ${a}| + |${b} - x| >= |x - ${a} + ${b} - x| = ${minVal}. Dấu "=" xảy ra khi ${a} <= x <= ${b}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'ADVANCED',
          });
        } else {
          // Tự luận Toán 7
          const root = randomInt(2, 9);
          const c = 2 * root;
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Tự luận] Tìm nghiệm của đa thức một biến P(x) = 2x - ${c} (ghi giá trị số của nghiệm x).`,
            options: [],
            correctOption: `${root}`,
            explanation: `Cho P(x) = 0 <=> 2x - ${c} = 0 <=> 2x = ${c} <=> x = ${root}. Vậy nghiệm của đa thức P(x) là x = ${root}.`,
            questionType: 'ESSAY',
            difficulty: 'HARD',
          });
        }
      } else if (grade === 8) {
        if (variantType === 0) {
          const a = randomInt(2, 7);
          const ans = `x² - ${2 * a}x + ${a * a}`;
          const opts = shuffleArray([
            ans,
            `x² + ${2 * a}x + ${a * a}`,
            `x² - ${a * a}`,
            `x² - ${a}x + ${a * a}`,
          ]);
          results.push({
            content: `[Mức 1: Nhận biết - Dễ] [Trắc nghiệm] Khai triển hằng đẳng thức bình phương của một hiệu (x - ${a})² ta được:`,
            options: opts,
            correctOption: ans,
            explanation: `Áp dụng hằng đẳng thức (A - B)² = A² - 2AB + B²: (x - ${a})² = x² - 2.x.${a} + ${a}² = ${ans}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
          });
        } else if (variantType === 1) {
          const mn = randomInt(4, 15);
          const bc = mn * 2;
          const opts = shuffleArray([
            `${mn} cm`,
            `${bc * 2} cm`,
            `${bc} cm`,
            `${mn + 2} cm`,
          ]);
          results.push({
            content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm] Cho tam giác ABC có M, N lần lượt là trung điểm của AB và AC. Biết cạnh BC = ${bc} cm, độ dài đường trung bình MN bằng:`,
            options: opts,
            correctOption: `${mn} cm`,
            explanation: `Đường trung bình MN của tam giác ABC song song với BC và bằng nửa cạnh BC: MN = ${bc} / 2 = ${mn} (cm).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM',
          });
        } else if (variantType === 2) {
          const x1 = randomInt(1, 5);
          const x2 = x1 + randomInt(1, 4);
          const sum = x1 + x2;
          const prod = x1 * x2;
          const ans = `x = ${x1} hoặc x = ${x2}`;
          const opts = shuffleArray([
            ans,
            `x = -${x1} hoặc x = -${x2}`,
            `x = ${sum} hoặc x = ${prod}`,
            `x = 0 hoặc x = ${sum}`,
          ]);
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm] Tập nghiệm của phương trình x² - ${sum}x + ${prod} = 0 (giải bằng phương pháp tách hạng tử đưa về phương trình tích) là:`,
            options: opts,
            correctOption: ans,
            explanation: `Ta tách -${sum}x = -${x1}x - ${x2}x, phương trình trở thành (x - ${x1})(x - ${x2}) = 0 <=> x = ${x1} hoặc x = ${x2}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'HARD',
          });
        } else if (variantType === 3) {
          const h = randomInt(2, 6);
          const k = randomInt(3, 12);
          const b = -2 * h;
          const c = h * h + k;
          const opts = shuffleArray([`${k}`, `${c}`, `${h}`, `0`]);
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Trắc nghiệm] Giá trị nhỏ nhất của biểu thức bậc hai A = x² ${b}x + ${c} với mọi số thực x bằng:`,
            options: opts,
            correctOption: `${k}`,
            explanation: `Biến đổi về hằng đẳng thức: A = (x² - ${2 * h}x + ${h * h}) + ${k} = (x - ${h})² + ${k} >= ${k} với mọi x. Dấu "=" xảy ra khi x = ${h}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'ADVANCED',
          });
        } else {
          // Tự luận Toán 8
          const a = randomInt(2, 5);
          const root = randomInt(2, 8);
          const b = a * root;
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Tự luận] Giải phương trình bậc nhất một ẩn: ${a}x - ${b} = 0 (ghi giá trị nghiệm x).`,
            options: [],
            correctOption: `${root}`,
            explanation: `Ta có ${a}x - ${b} = 0 <=> ${a}x = ${b} <=> x = ${b} / ${a} = ${root}. Vậy nghiệm của phương trình là x = ${root}.`,
            questionType: 'ESSAY',
            difficulty: 'HARD',
          });
        }
      } else {
        // Toán 9
        if (variantType === 0) {
          const val = randomInt(2, 10);
          const b = 2 * val;
          const ans = `x >= ${val}`;
          const opts = shuffleArray([
            ans,
            `x > ${val}`,
            `x <= ${val}`,
            `x != ${val}`,
          ]);
          results.push({
            content: `[Mức 1: Nhận biết - Dễ] [Trắc nghiệm] Điều kiện xác định của biểu thức căn bậc hai √(2x - ${b}) là:`,
            options: opts,
            correctOption: ans,
            explanation: `Biểu thức √(2x - ${b}) xác định khi biểu thức dưới dấu căn không âm: 2x - ${b} >= 0 <=> x >= ${val}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
          });
        } else if (variantType === 1) {
          const arc = randomInt(3, 8) * 20;
          const inscribed = arc / 2;
          const opts = shuffleArray([
            `${inscribed}°`,
            `${arc}°`,
            `${arc * 2}°`,
            `${180 - inscribed}°`,
          ]);
          results.push({
            content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm] Trong một đường tròn, góc nội tiếp chắn cung có số đo ${arc}° thì có số đo bằng:`,
            options: opts,
            correctOption: `${inscribed}°`,
            explanation: `Trong một đường tròn, số đo của góc nội tiếp bằng nửa số đo của cung bị chắn: ${arc}° / 2 = ${inscribed}°.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM',
          });
        } else if (variantType === 2) {
          const s = randomInt(4, 8);
          const p = randomInt(1, 5);
          const sumSq = s * s - 2 * p;
          const opts = shuffleArray([
            `${sumSq}`,
            `${s * s}`,
            `${s * s + 2 * p}`,
            `${s * s - p}`,
          ]);
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm] Gọi x1, x2 là hai nghiệm của phương trình x² - ${s}x + ${p} = 0. Không giải phương trình, theo hệ thức Viète giá trị của biểu thức A = x1² + x2² bằng:`,
            options: opts,
            correctOption: `${sumSq}`,
            explanation: `Theo định lí Viète: S = x1 + x2 = ${s} và P = x1.x2 = ${p}. Ta có A = x1² + x2² = S² - 2P = ${s}² - 2.${p} = ${sumSq}.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'HARD',
          });
        } else if (variantType === 3) {
          const ma = randomInt(2, 5);
          const k = randomInt(2, 4);
          const mb = ma * k * k;
          const mt = ma * k;
          const opts = shuffleArray([
            `${mt} cm`,
            `${ma + mb} cm`,
            `${mt * mt} cm`,
            `${mb - ma} cm`,
          ]);
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Trắc nghiệm] Từ điểm M nằm ngoài đường tròn (O), kẻ tiếp tuyến MT và cát tuyến MAB (A nằm giữa M và B). Biết MA = ${ma} cm và MB = ${mb} cm. Độ dài đoạn tiếp tuyến MT bằng:`,
            options: opts,
            correctOption: `${mt} cm`,
            explanation: `Áp dụng hệ thức phương tích ΔMTA ∽ ΔMBT (g.g): MT² = MA . MB = ${ma} . ${mb} = ${mt * mt} => MT = ${mt} (cm).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'ADVANCED',
          });
        } else {
          // Tự luận Toán 9
          const x1 = randomInt(2, 5);
          const x2 = x1 + randomInt(1, 4);
          const s = x1 + x2;
          const p = x1 * x2;
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Tự luận] Giải phương trình bậc hai x² - ${s}x + ${p} = 0 và tính tổng bình phương hai nghiệm x1² + x2² (ghi kết quả của x1² + x2²).`,
            options: [],
            correctOption: `${x1 * x1 + x2 * x2}`,
            explanation: `Theo định lí Viète: x1 + x2 = ${s}, x1.x2 = ${p} (hai nghiệm là x1 = ${x1}, x2 = ${x2}). Tổng bình phương hai nghiệm: x1² + x2² = ${s}² - 2.${p} = ${x1 * x1 + x2 * x2}.`,
            questionType: 'ESSAY',
            difficulty: 'ADVANCED',
          });
        }
      }
      continue;
    }

    // -----------------------------------------------------------------------
    // 2. MÔN KHOA HỌC TỰ NHIÊN: VẬT LÍ - HÓA HỌC - SINH HỌC (KHỐI 6, 7, 8, 9)
    // -----------------------------------------------------------------------
    if (
      subj.includes('khoa học tự nhiên') ||
      subj.includes('vật') ||
      subj.includes('hóa') ||
      subj.includes('sinh')
    ) {
      const subBranch = i % 4; // 0: Vật lí, 1: Hóa học, 2: Sinh học, 3: Tự luận KHTN
      if (subBranch === 0) {
        // Vật lí
        if (grade === 6) {
          const m = randomInt(2, 15);
          const p = m * 10;
          results.push({
            content: `[Mức 1: Nhận biết - Dễ] [Trắc nghiệm - Vật lí 6] Một vật có khối lượng m = ${m} kg đặt trên mặt đất thì có trọng lượng P bằng bao nhiêu Newton?`,
            options: shuffleArray([
              `${p} N`,
              `${m} N`,
              `${p * 10} N`,
              `${m / 10} N`,
            ]),
            correctOption: `${p} N`,
            explanation: `Áp dụng công thức liên hệ giữa trọng lượng và khối lượng: P = 10 . m = 10 . ${m} = ${p} (N).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
          });
        } else if (grade === 7) {
          const v = randomInt(40, 80);
          const t = randomInt(2, 5);
          const s = v * t;
          results.push({
            content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm - Vật lí 7] Một ô tô chuyển động trên quãng đường dài s = ${s} km trong thời gian t = ${t} giờ. Tốc độ trung bình của ô tô là:`,
            options: shuffleArray([
              `${v} km/h`,
              `${s * t} km/h`,
              `${v / 2} km/h`,
              `${s + t} km/h`,
            ]),
            correctOption: `${v} km/h`,
            explanation: `Áp dụng công thức tính tốc độ: v = s / t = ${s} / ${t} = ${v} (km/h).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM',
          });
        } else if (grade === 8) {
          const f = randomInt(2, 9) * 100;
          const s = 0.2;
          const p = f / s;
          results.push({
            content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm - Vật lí 8] Một áp lực F = ${f} N tác dụng vuông góc lên mặt bị ép có diện tích S = 0,2 m². Áp suất p do lực đó gây ra là:`,
            options: shuffleArray([
              `${p} Pa`,
              `${f * 0.2} Pa`,
              `${f} Pa`,
              `${p / 10} Pa`,
            ]),
            correctOption: `${p} Pa`,
            explanation: `Áp dụng công thức tính áp suất: p = F / S = ${f} / 0,2 = ${p} (Pa).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM',
          });
        } else {
          const r = randomInt(4, 12);
          const iAmp = randomInt(2, 5);
          const u = r * iAmp;
          const pMax = (u * u) / (4 * r);
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Trắc nghiệm - Vật lí 9] Cho mạch điện có hiệu điện thế U = ${u} V không đổi, điện trở R0 = ${r} Ω mắc nối tiếp với biến trở Rx. Khi điều chỉnh Rx = R0 = ${r} Ω thì công suất tiêu thụ cực đại P_max trên biến trở Rx bằng:`,
            options: shuffleArray([
              `${pMax} W`,
              `${pMax * 2} W`,
              `${u * iAmp} W`,
              `${r} W`,
            ]),
            correctOption: `${pMax} W`,
            explanation: `Theo chuyên đề cực trị công suất điện, khi Rx = R0 = ${r} Ω thì công suất trên Rx đạt cực đại: P_max = U² / (4.R0) = ${u}² / (4 . ${r}) = ${pMax} (W).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'ADVANCED',
          });
        }
      } else if (subBranch === 1) {
        // Hóa học
        if (grade <= 7) {
          const p = randomInt(6, 17);
          const n = p + randomInt(0, 2);
          const total = 2 * p + n;
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm - Hóa học ${grade}] Nguyên tử của một nguyên tố X có số proton là P = ${p} và số neutron là N = ${n}. Tổng số hạt cơ bản (proton, neutron, electron) trong nguyên tử X là:`,
            options: shuffleArray([
              `${total} hạt`,
              `${p + n} hạt`,
              `${2 * p} hạt`,
              `${total + p} hạt`,
            ]),
            correctOption: `${total} hạt`,
            explanation: `Vì nguyên tử trung hòa về điện nên số electron E = số proton P = ${p}. Tổng số hạt cơ bản S = P + E + N = ${p} + ${p} + ${n} = ${total} (hạt).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'HARD',
          });
        } else {
          const mCt = randomInt(1, 4) * 10;
          const mDd = 200;
          const cPercent = (mCt / mDd) * 100;
          results.push({
            content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm - Hóa học ${grade}] Hòa tan ${mCt} gam muối ăn vào ${mDd - mCt} gam nước thu được ${mDd} gam dung dịch. Nồng độ phần trăm (C%) của dung dịch thu được là:`,
            options: shuffleArray([
              `${cPercent}%`,
              `${cPercent * 2}%`,
              `${mCt}%`,
              `${((mCt / (mDd - mCt)) * 100).toFixed(1)}%`,
            ]),
            correctOption: `${cPercent}%`,
            explanation: `Khối lượng dung dịch m_dd = ${mCt} + ${mDd - mCt} = ${mDd} (g). Nồng độ phần trăm: C% = (m_ct / m_dd) . 100% = (${mCt} / ${mDd}) . 100% = ${cPercent}%.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM',
          });
        }
      } else if (subBranch === 2) {
        // Sinh học
        const k = randomInt(3, 6);
        const aCells = randomInt(1, 3);
        const totalCells = aCells * Math.pow(2, k);
        results.push({
          content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm - Sinh học ${grade}] Từ ${aCells} tế bào ban đầu cùng tiến hành nguyên phân (phân chia) liên tiếp ${k} lần. Tổng số tế bào con được tạo thành là:`,
          options: shuffleArray([
            `${totalCells} tế bào`,
            `${aCells * k * 2} tế bào`,
            `${Math.pow(2, k)} tế bào`,
            `${totalCells / 2} tế bào`,
          ]),
          correctOption: `${totalCells} tế bào`,
          explanation: `Áp dụng công thức phân chia tế bào: N = a . 2^k = ${aCells} . 2^${k} = ${totalCells} (tế bào con).`,
          questionType: 'MULTIPLE_CHOICE',
          difficulty: 'HARD',
        });
      } else {
        // Tự luận KHTN
        if (grade === 9) {
          const aNu = randomInt(3, 6) * 100;
          const gNu = randomInt(4, 8) * 100;
          const hBonds = 2 * aNu + 3 * gNu;
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Tự luận - Sinh học 9] Một phân tử DNA mạch kép có số nucleotide loại Adenine là A = ${aNu} và loại Guanine là G = ${gNu}. Hãy tính tổng số liên kết Hydrogen (H) của phân tử DNA đó (ghi kết quả bằng số).`,
            options: [],
            correctOption: `${hBonds}`,
            explanation: `Theo nguyên tắc bổ sung, A liên kết với T bằng 2 liên kết Hydrogen, G liên kết với C bằng 3 liên kết Hydrogen. Tổng số liên kết Hydrogen: H = 2A + 3G = 2 × ${aNu} + 3 × ${gNu} = ${hBonds} (liên kết).`,
            questionType: 'ESSAY',
            difficulty: 'ADVANCED',
          });
        } else {
          const sDist = randomInt(6, 15) * 10;
          const tTime = 2;
          const vSpeed = sDist / tTime;
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Tự luận - Vật lí ${grade}] Một vật chuyển động đều đi được quãng đường s = ${sDist} km trong thời gian t = ${tTime} giờ. Tính tốc độ v của vật theo đơn vị km/h (ghi kết quả số).`,
            options: [],
            correctOption: `${vSpeed}`,
            explanation: `Áp dụng công thức tính tốc độ: v = s / t = ${sDist} / ${tTime} = ${vSpeed} (km/h).`,
            questionType: 'ESSAY',
            difficulty: 'HARD',
          });
        }
      }
      continue;
    }

    // -----------------------------------------------------------------------
    // 3. MÔN LỊCH SỬ VÀ ĐỊA LÍ (KHỐI 6, 7, 8, 9)
    // -----------------------------------------------------------------------
    if (subj.includes('lịch sử') || subj.includes('địa')) {
      const mod = i % 3;
      if (mod === 0) {
        const h = randomInt(10, 25) * 100;
        const t0 = randomInt(25, 30);
        const drop = (h / 100) * 0.6;
        const tHigh = Number((t0 - drop).toFixed(1));
        results.push({
          content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm - Địa lí ${grade}] Ở chân núi (độ cao 0 m) có nhiệt độ không khí là ${t0}°C. Biết trong tầng đối lưu cứ lên cao 100 m thì nhiệt độ giảm 0,6°C. Nhiệt độ tại độ cao ${h} m trên sườn núi đó là:`,
          options: shuffleArray([
            `${tHigh}°C`,
            `${(t0 + drop).toFixed(1)}°C`,
            `${(t0 - drop / 2).toFixed(1)}°C`,
            `${t0}°C`,
          ]),
          correctOption: `${tHigh}°C`,
          explanation: `Khi lên cao ${h} m (= ${h / 100} lần 100 m), nhiệt độ giảm Δt = ${h / 100} × 0,6 = ${drop.toFixed(1)}°C. Vậy nhiệt độ ở độ cao ${h} m là ${t0} - ${drop.toFixed(1)} = ${tHigh}°C.`,
          questionType: 'MULTIPLE_CHOICE',
          difficulty: 'HARD',
        });
      } else if (mod === 1) {
        const londonHour = randomInt(6, 15);
        const hanoiHour = londonHour + 7;
        results.push({
          content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm - Địa lí ${grade}] Khi tại thủ đô Luân Đôn (múi giờ GMT+0) đang là ${londonHour} giờ ngày 15/11 thì cùng lúc đó tại thủ đô Hà Nội (múi giờ GMT+7) là mấy giờ?`,
          options: shuffleArray([
            `${hanoiHour} giờ cùng ngày`,
            `${londonHour - 5} giờ cùng ngày`,
            `${londonHour} giờ cùng ngày`,
            `${hanoiHour - 2} giờ cùng ngày`,
          ]),
          correctOption: `${hanoiHour} giờ cùng ngày`,
          explanation: `Hà Nội ở múi giờ số 7 (phía Đông của Luân Đôn múi giờ 0) nên giờ Hà Nội nhanh hơn 7 tiếng: T_Hà_Nội = ${londonHour} + 7 = ${hanoiHour} giờ cùng ngày.`,
          questionType: 'MULTIPLE_CHOICE',
          difficulty: 'MEDIUM',
        });
      } else {
        // Tự luận Lịch sử & Địa lí
        const pop = randomInt(12, 30) * 100000;
        const area = 1000;
        const density = pop / area;
        results.push({
          content: `[Mức 4: Vận dụng cao - Khó] [Tự luận - Địa lí ${grade}] Một tỉnh có số dân là ${pop.toLocaleString('vi-VN')} người và diện tích tự nhiên là ${area} km². Hãy tính mật độ dân số của tỉnh đó theo đơn vị người/km² (ghi kết quả bằng số).`,
          options: [],
          correctOption: `${density}`,
          explanation: `Áp dụng công thức tính mật độ dân số: Mật độ dân số = Số dân / Diện tích = ${pop} / ${area} = ${density} (người/km²).`,
          questionType: 'ESSAY',
          difficulty: 'ADVANCED',
        });
      }
      continue;
    }

    // -----------------------------------------------------------------------
    // 4. MÔN TIN HỌC & CÔNG NGHỆ (KHỐI 6, 7, 8, 9)
    // -----------------------------------------------------------------------
    if (subj.includes('tin học') || subj.includes('công nghệ')) {
      if (subj.includes('tin học')) {
        if (i % 3 !== 2) {
          const k = randomInt(4, 10);
          const n = Math.pow(2, k);
          const steps = k + 1;
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm - Tin học ${grade}] Với danh sách gồm N = ${n} phần tử đã được sắp xếp theo thứ tự tăng dần, thuật toán Tìm kiếm nhị phân cần tối đa bao nhiêu bước chia đôi so sánh?`,
            options: shuffleArray([
              `${steps} bước`,
              `${n} bước`,
              `${n / 2} bước`,
              `${k * 2} bước`,
            ]),
            correctOption: `${steps} bước`,
            explanation: `Vì ${n} = 2^${k}, mỗi bước tìm kiếm nhị phân chia đôi vùng tìm kiếm nên số lần so sánh tối đa là log2(${n}) + 1 = ${k} + 1 = ${steps} bước.`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'HARD',
          });
        } else {
          const dec = randomInt(8, 31);
          const bin = dec.toString(2);
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Tự luận - Tin học ${grade}] Hãy chuyển đổi số tự nhiên ${dec} từ hệ thập phân (cơ số 10) sang biểu diễn dãy bit trong hệ nhị phân (cơ số 2).`,
            options: [],
            correctOption: bin,
            explanation: `Chia liên tiếp ${dec} cho 2 và lấy phần dư viết theo chiều ngược lại, ta được kết quả biểu diễn nhị phân của ${dec} là ${bin}.`,
            questionType: 'ESSAY',
            difficulty: 'ADVANCED',
          });
        }
      } else {
        // Công nghệ
        if (i % 3 !== 2) {
          const z1 = randomInt(3, 6) * 12;
          const z2 = 12;
          const n1 = randomInt(4, 10) * 10;
          const n2 = (n1 * z1) / z2;
          results.push({
            content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm - Công nghệ ${grade}] Bộ truyền động ăn khớp có bánh dẫn Z1 = ${z1} răng quay với tốc độ n1 = ${n1} vòng/phút và bánh bị dẫn có Z2 = ${z2} răng. Tốc độ quay n2 của bánh bị dẫn là:`,
            options: shuffleArray([
              `${n2} vòng/phút`,
              `${n1} vòng/phút`,
              `${n1 / 2} vòng/phút`,
              `${z1 + z2} vòng/phút`,
            ]),
            correctOption: `${n2} vòng/phút`,
            explanation: `Áp dụng công thức truyền chuyển động ăn khớp: n1 . Z1 = n2 . Z2 => n2 = (${n1} × ${z1}) / ${z2} = ${n2} (vòng/phút).`,
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'HARD',
          });
        } else {
          const pWatt = 1000;
          const hours = randomInt(2, 5);
          const days = 30;
          const kwh = (pWatt / 1000) * hours * days;
          results.push({
            content: `[Mức 4: Vận dụng cao - Khó] [Tự luận - Công nghệ ${grade}] Một thiết bị điện gia đình có công suất định mức P = ${pWatt} W hoạt động trung bình ${hours} giờ mỗi ngày. Tính điện năng tiêu thụ A (số điện kWh) của thiết bị đó trong ${days} ngày (ghi kết quả bằng số).`,
            options: [],
            correctOption: `${kwh}`,
            explanation: `Đổi P = ${pWatt} W = ${pWatt / 1000} kW. Điện năng tiêu thụ trong ${days} ngày: A = P × t = ${pWatt / 1000} × ${hours} × ${days} = ${kwh} (kWh).`,
            questionType: 'ESSAY',
            difficulty: 'ADVANCED',
          });
        }
      }
      continue;
    }
  }

  return results;
}

/**
 * Xây dựng đề thi 30 - 50 câu (Trắc nghiệm + Tự luận, 4 mức độ từ Dễ -> Khó)
 * đảm bảo mỗi lần tạo đề là một đề khác nhau từ kho học liệu và bộ sinh tham số động.
 */
export function buildRandomizedFullExamQuestions(params: {
  subjectName: string;
  grade: number;
  numQuestions: number;
  seedQuestions: {
    content: string;
    options: string[];
    correctOption: string;
    explanation: string;
  }[];
  lessons: { title: string; content: string | null }[];
}): GeneratedQuizQuestionItem[] {
  const { subjectName, grade, numQuestions, seedQuestions, lessons } = params;
  const totalTarget = Math.min(Math.max(numQuestions || 35, 1), 60);

  const easyPool: GeneratedQuizQuestionItem[] = [];
  const mediumPool: GeneratedQuizQuestionItem[] = [];
  const hardPool: GeneratedQuizQuestionItem[] = [];
  const advancedEssayPool: GeneratedQuizQuestionItem[] = [];

  // 1. Chuyển đổi các câu hỏi gốc của môn học (đảo thứ tự đáp án ngẫu nhiên)
  shuffleArray(seedQuestions).forEach((sq, idx) => {
    const isAdv =
      sq.content.includes('Nâng cao') ||
      sq.content.includes('Chuyên') ||
      sq.content.includes('Advanced');
    const cleanText = sq.content.replace(/^\[[^\]]+\]\s*/, '');
    const shuffledOpts = shuffleArray(sq.options);

    if (isAdv) {
      hardPool.push({
        content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm] ${cleanText}`,
        options: shuffledOpts,
        correctOption: sq.correctOption,
        explanation: sq.explanation,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'HARD',
      });
    } else if (idx % 2 === 0) {
      easyPool.push({
        content: `[Mức 1: Nhận biết - Dễ] [Trắc nghiệm] ${cleanText}`,
        options: shuffledOpts,
        correctOption: sq.correctOption,
        explanation: sq.explanation,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
      });
    } else {
      mediumPool.push({
        content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm] ${cleanText}`,
        options: shuffledOpts,
        correctOption: sq.correctOption,
        explanation: sq.explanation,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
      });
    }
  });

  // 2. Khai thác từng mệnh đề kiến thức trong các bài giảng (Lessons) của môn học để tạo câu hỏi Đa mức độ & Tự luận
  const allStatements: {
    lessonTitle: string;
    statement: string;
    isAdv: boolean;
  }[] = [];
  lessons.forEach((l) => {
    const isAdv = l.title.includes('Nâng cao') || l.title.includes('Chuyên đề');
    const lines = (l.content || '')
      .split('\n')
      .map((s) =>
        s
          .trim()
          .replace(/^[-+•]|\d+\.\s*/g, '')
          .trim(),
      )
      .filter((s) => s.length >= 25);

    lines.forEach((st) => {
      allStatements.push({ lessonTitle: l.title, statement: st, isAdv });
    });
  });

  const distractorPool = [
    'Chỉ áp dụng cho các trường hợp ngoại lệ ngoài chương trình học phổ thông.',
    'Các yếu tố trong quy tắc này hoàn toàn độc lập và ngược chiều với định nghĩa sách giáo khoa.',
    'Không cần xét đến điều kiện xác định hay ngữ cảnh áp dụng của kiến thức.',
    'Kết quả luôn bằng không trong mọi điều kiện biến đổi thông thường.',
    'Chỉ đúng khi bỏ qua toàn bộ các quy tắc cơ bản đã học trong bài.',
    'Thay đổi ngẫu nhiên không tuân theo quy luật hay công thức của chương trình.',
  ];

  shuffleArray(allStatements).forEach((item, idx) => {
    const shortCorrect =
      item.statement.length > 180
        ? item.statement.substring(0, 177) + '...'
        : item.statement;

    // Lấy các mệnh đề của bài khác hoặc câu nhiễu làm phương án sai
    const otherDistractors = shuffleArray(distractorPool).slice(0, 3);
    const options = shuffleArray([shortCorrect, ...otherDistractors]);

    if (idx % 5 === 0) {
      // Tạo câu hỏi TỰ LUẬN từ bài học
      advancedEssayPool.push({
        content: `[Mức 4: Vận dụng cao - Khó] [Tự luận] Dựa vào kiến thức "${item.lessonTitle}" (${subjectName} ${grade}), em hãy trình bày quy tắc/nội dung cốt lõi và giải thích ngắn gọn về vấn đề sau: "${shortCorrect.split(':')[0] || item.lessonTitle}".`,
        options: [],
        correctOption: shortCorrect,
        explanation: `Theo nội dung chuẩn trong "${item.lessonTitle}": ${item.statement}`,
        questionType: 'ESSAY',
        difficulty: 'ADVANCED',
      });
    } else if (item.isAdv) {
      hardPool.push({
        content: `[Mức 3: Vận dụng - Khá] [Trắc nghiệm] Khi vận dụng chuyên đề "${item.lessonTitle}" (${subjectName} lớp ${grade}), khẳng định nào sau đây là ĐÚNG và chính xác nhất?`,
        options,
        correctOption: shortCorrect,
        explanation: `Theo tài liệu chuyên đề "${item.lessonTitle}": ${item.statement}`,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'HARD',
      });
    } else if (idx % 2 === 0) {
      easyPool.push({
        content: `[Mức 1: Nhận biết - Dễ] [Trắc nghiệm] Theo nội dung bài học "${item.lessonTitle}" (${subjectName} lớp ${grade}), phát biểu nào sau đây là ĐÚNG?`,
        options,
        correctOption: shortCorrect,
        explanation: `Kiến thức trọng tâm bài "${item.lessonTitle}": ${item.statement}`,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
      });
    } else {
      mediumPool.push({
        content: `[Mức 2: Thông hiểu - Trung bình] [Trắc nghiệm] Trong chương trình ${subjectName} lớp ${grade} ("${item.lessonTitle}"), nhận định nào dưới đây phản ánh đúng bản chất bài học?`,
        options,
        correctOption: shortCorrect,
        explanation: `Giải thích theo "${item.lessonTitle}": ${item.statement}`,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
      });
    }
  });

  // 3. Bổ sung bộ câu hỏi biến thiên số liệu động (Parametric Questions) để đảm bảo đủ 30-50 câu luôn mới
  const parametricItems = buildParametricSubjectQuestions(
    subjectName,
    grade,
    totalTarget,
  );
  parametricItems.forEach((pItem) => {
    if (pItem.questionType === 'ESSAY') {
      advancedEssayPool.push(pItem);
    } else if (pItem.difficulty === 'EASY') {
      easyPool.push(pItem);
    } else if (pItem.difficulty === 'MEDIUM') {
      mediumPool.push(pItem);
    } else {
      hardPool.push(pItem);
    }
  });

  // Якщо các môn xã hội cần thêm biến thể câu hỏi tình huống & tự luận để đủ 50 câu
  let extraCounter = 1;
  while (
    easyPool.length +
      mediumPool.length +
      hardPool.length +
      advancedEssayPool.length <
    totalTarget + 10
  ) {
    const refLesson = lessons[extraCounter % Math.max(lessons.length, 1)] || {
      title: `Chuyên đề ${subjectName} ${grade}`,
      content: `Nắm vững lý thuyết và vận dụng giải bài tập ${subjectName} lớp ${grade}.`,
    };
    const lines = (refLesson.content || '').split('\n').filter(Boolean);
    const fact =
      lines[extraCounter % Math.max(lines.length, 1)] ||
      `Kiến thức trọng tâm ${refLesson.title}`;
    const cleanFact = fact.replace(/^\d+\.\s*/, '').trim();

    if (extraCounter % 5 === 0) {
      advancedEssayPool.push({
        content: `[Mức 4: Vận dụng cao - Khó] [Tự luận - TĐ #${extraCounter}] Dựa vào "${refLesson.title}" (Môn ${subjectName} lớp ${grade}), em hãy phân tích ngắn gọn ý nghĩa hoặc cách vận dụng nội dung: "${cleanFact.substring(0, 120)}..."`,
        options: [],
        correctOption: cleanFact,
        explanation: `Lời giải chuẩn theo "${refLesson.title}": ${cleanFact}`,
        questionType: 'ESSAY',
        difficulty: 'ADVANCED',
      });
    } else {
      const dOpts = shuffleArray(distractorPool).slice(0, 3);
      const qOpts = shuffleArray([cleanFact, ...dOpts]);
      const diffLevel =
        extraCounter % 3 === 0
          ? 'HARD'
          : extraCounter % 2 === 0
            ? 'MEDIUM'
            : 'EASY';
      const label =
        diffLevel === 'EASY'
          ? '[Mức 1: Nhận biết - Dễ]'
          : diffLevel === 'MEDIUM'
            ? '[Mức 2: Thông hiểu - Trung bình]'
            : '[Mức 3: Vận dụng - Khá]';

      const targetArr =
        diffLevel === 'EASY'
          ? easyPool
          : diffLevel === 'MEDIUM'
            ? mediumPool
            : hardPool;
      targetArr.push({
        content: `${label} [Trắc nghiệm - Mã biến thể #${randomInt(100, 999)}] Trong "${refLesson.title}" (${subjectName} ${grade}), nội dung nào sau đây là chuẩn xác nhất?`,
        options: qOpts,
        correctOption: cleanFact,
        explanation: `Theo tài liệu "${refLesson.title}": ${cleanFact}`,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: diffLevel,
      });
    }
    extraCounter++;
  }

  // 4. Phân bổ số lượng câu hỏi theo đúng ma trận đề từ Dễ đến Khó (80% Trắc nghiệm + 20% Tự luận)
  const essayCount =
    totalTarget >= 10 ? Math.max(2, Math.round(totalTarget * 0.2)) : 1;
  const mcCount = totalTarget - essayCount;

  const easyCount = Math.round(mcCount * 0.4);
  const mediumCount = Math.round(mcCount * 0.35);
  const hardCount = Math.max(0, mcCount - easyCount - mediumCount);

  const selectedEasy = shuffleArray(easyPool).slice(0, easyCount);
  const selectedMedium = shuffleArray(mediumPool).slice(0, mediumCount);
  const selectedHard = shuffleArray(hardPool).slice(0, hardCount);
  const selectedEssay = shuffleArray(advancedEssayPool).slice(0, essayCount);

  // Sắp xếp đề thi tăng dần độ khó: Nhận biết (Dễ) -> Thông hiểu (TB) -> Vận dụng (Khá) -> Tự luận / Vận dụng cao (Khó)
  const combined = [
    ...selectedEasy,
    ...selectedMedium,
    ...selectedHard,
    ...selectedEssay,
  ];

  // Bù thêm nếu thiếu do làm tròn
  const fallbackAll = shuffleArray([
    ...easyPool,
    ...mediumPool,
    ...hardPool,
    ...advancedEssayPool,
  ]);
  for (const item of fallbackAll) {
    if (combined.length >= totalTarget) break;
    if (!combined.includes(item)) {
      combined.push(item);
    }
  }

  return combined.slice(0, totalTarget);
}

/**
 * Chấm điểm câu hỏi (Trắc nghiệm & Tự luận) và:
 * - Nếu ĐÚNG: Chỉ xác nhận đúng (errorAnalysis = null, correction = null).
 * - Nếu SAI: Chỉ rõ lỗi sai của học sinh và hướng dẫn sửa lại chi tiết.
 */
export function evaluateAndCorrectQuestion(params: {
  questionContent: string;
  options: string[];
  correctOption: string;
  explanation: string | null;
  userAnswer: string | null | undefined;
}): {
  isCorrect: boolean;
  questionType: 'MULTIPLE_CHOICE' | 'ESSAY';
  errorAnalysis: string | null;
  correction: string | null;
} {
  const { questionContent, options, correctOption, explanation, userAnswer } =
    params;
  const isEssay =
    !Array.isArray(options) ||
    options.length === 0 ||
    questionContent.includes('[Tự luận');

  const trimmedUser = (userAnswer || '').trim();
  const trimmedCorrect = (correctOption || '').trim();

  if (!trimmedUser) {
    return {
      isCorrect: false,
      questionType: isEssay ? 'ESSAY' : 'MULTIPLE_CHOICE',
      errorAnalysis: isEssay
        ? 'Em đã bỏ trống chưa nhập lời giải hoặc đáp số cho câu hỏi tự luận này.'
        : 'Em đã bỏ trống chưa chọn phương án trả lời cho câu hỏi trắc nghiệm này.',
      correction:
        `Đáp án / Lời giải chuẩn: ${trimmedCorrect}. ${explanation || ''}`.trim(),
    };
  }

  if (!isEssay) {
    // Chấm câu Trắc nghiệm
    const isCorrect = trimmedUser === trimmedCorrect;
    if (isCorrect) {
      return {
        isCorrect: true,
        questionType: 'MULTIPLE_CHOICE',
        errorAnalysis: null,
        correction: null,
      };
    }

    return {
      isCorrect: false,
      questionType: 'MULTIPLE_CHOICE',
      errorAnalysis: `Em đã chọn phương án "${trimmedUser}" — đây là phương án nhiễu chưa chính xác (nhầm lẫn về công thức, điều kiện áp dụng hoặc số liệu tính toán so với yêu cầu đề bài).`,
      correction: `Sửa lại cho đúng: Phương án chính xác phải là "${trimmedCorrect}". Vì: ${explanation || 'Cần áp dụng đúng định nghĩa và công thức trong tài liệu học tập.'}`,
    };
  }

  // Chấm câu Tự luận (Essay / Short Answer)
  const normUser = trimmedUser.toLowerCase().replace(/\s+/g, ' ');
  const normCorrect = trimmedCorrect.toLowerCase().replace(/\s+/g, ' ');

  // 1. Nếu là bài toán tự luận có đáp số cụ thể (ví dụ "14", "3120", "1101")
  const isNumericTarget = /^[+-]?\d+([.,/]\d+)?$/.test(normCorrect);
  if (isNumericTarget) {
    // Kiểm tra xem trong bài giải của học sinh có chứa đúng con số đáp án hay không
    const escapedNum = normCorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^0-9])${escapedNum}([^0-9]|$)`);
    const matched = normUser === normCorrect || regex.test(normUser);

    if (matched) {
      return {
        isCorrect: true,
        questionType: 'ESSAY',
        errorAnalysis: null,
        correction: null,
      };
    }

    return {
      isCorrect: false,
      questionType: 'ESSAY',
      errorAnalysis: `Bài làm tự luận của em ("${trimmedUser}") đã tính ra kết quả chưa chính xác so với đáp số chuẩn (${trimmedCorrect}). Em có thể đã nhầm công thức, sai dấu hoặc quên đổi đơn vị ở bước tính toán trung gian.`,
      correction: `Hướng dẫn sửa lại bài giải: Kết quả đúng phải là ${trimmedCorrect}. Chi tiết các bước: ${explanation || trimmedCorrect}`,
    };
  }

  // 2. Nếu là câu tự luận lý thuyết / giải thích (kiểm tra độ phủ từ khóa trọng tâm)
  const keywords = normCorrect
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);

  const matchedKeywords = keywords.filter((kw) => normUser.includes(kw));
  const matchRatio =
    keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;

  if (
    normUser === normCorrect ||
    (normUser.length >= 15 && matchRatio >= 0.45)
  ) {
    return {
      isCorrect: true,
      questionType: 'ESSAY',
      errorAnalysis: null,
      correction: null,
    };
  }

  const missingKeywords = keywords
    .filter((kw) => !normUser.includes(kw))
    .slice(0, 5)
    .join(', ');

  return {
    isCorrect: false,
    questionType: 'ESSAY',
    errorAnalysis: `Câu trả lời tự luận của em ("${trimmedUser}") chưa đầy đủ hoặc lệch trọng tâm (còn thiếu các ý/từ khóa cốt lõi như: ${missingKeywords || 'khái niệm và bản chất trọng tâm'}).`,
    correction: `Hướng dẫn sửa và bổ sung hoàn chỉnh: ${trimmedCorrect}. ${explanation ? `Giải thích chi tiết: ${explanation}` : ''}`,
  };
}
