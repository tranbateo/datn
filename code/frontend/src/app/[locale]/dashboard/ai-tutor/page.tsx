"use client";
import { notify } from "@/lib/toast";

import { API_ENDPOINTS } from "@/constants/api";
import {
  Fragment,
  Suspense,
  useState,
  useRef,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import {
  Search,
  Edit,
  Send,
  Mic,
  ChevronLeft,
  Sparkles,
  Flag,
  X,
  BookOpen,
  MessageSquare,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { fetchApi, fetchApiStream } from "@/lib/api-client";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface Citation {
  documentId?: string;
  fileName: string;
  page?: number | null;
  snippet?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt?: string;
}

interface ChatSessionItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  subject?: { id: string; name: string; grade?: number | null } | null;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

const FRONTEND_CJK_MAP: Array<[RegExp, string]> = [
  [/纠错|纠正|纠/g, " sửa "],
  [/错误|错/g, " sai "],
  [/正确/g, " đúng "],
  [/例子|例如|比如/g, " ví dụ "],
  [/公式/g, " công thức "],
  [/步骤/g, " bước "],
  [/总结/g, " tóm tắt "],
  [/注意/g, " lưu ý "],
  [/语法/g, " ngữ pháp "],
  [/动词/g, " động từ "],
  [/主语/g, " chủ ngữ "],
];

const WEB_SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
  i: "ⁱ",
};

const WEB_SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
  n: "ₙ",
  i: "ᵢ",
};

function webConvertMap(str: string, map: Record<string, string>): string | null {
  if (!str) return null;
  let out = "";
  for (const ch of str) {
    if (!(ch in map)) return null;
    out += map[ch];
  }
  return out;
}

function webWrapMathAtom(expr: string): string {
  const trimmed = expr.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z0-9πΔℕℤℚℝℂ⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉.]+$/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) return trimmed;
  return `(${trimmed})`;
}

function convertLatexBodyToUnicode(raw: string, isMathBlock: boolean): string {
  let text = raw;

  text = text.replace(
    /\\begin\{d?cases\}([\s\S]*?)\\end\{d?cases\}/g,
    (_, body: string) => {
      const rows = body
        .replace(/\\\\(?:\[[^\]]*\])?/g, "\n")
        .split("\n")
        .map((r) => r.replace(/\s*&\s*/g, ", ").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      return rows.map((r) => `• ${r}`).join("\n");
    },
  );

  text = text.replace(
    /\\begin\{([pbBvV]?matrix)\}([\s\S]*?)\\end\{\1\}/g,
    (_, env: string, body: string) => {
      const open = env.startsWith("p") ? "(" : env.startsWith("v") || env.startsWith("V") ? "|" : "[";
      const close = env.startsWith("p") ? ")" : env.startsWith("v") || env.startsWith("V") ? "|" : "]";
      const rows = body
        .replace(/\\\\(?:\[[^\]]*\])?/g, "\n")
        .split("\n")
        .map((r) => r.split("&").map((c) => c.trim()).join("  "))
        .filter(Boolean);
      return rows.map((r) => `${open} ${r} ${close}`).join("\n");
    },
  );

  text = text
    .replace(/\\begin\{array\}(?:\[[^\]]*\])?\{[^}]*\}/g, "")
    .replace(/\\begin\{[a-zA-Z*]+\}(?:\[[^\]]*\])?/g, "")
    .replace(/\\end\{[a-zA-Z*]+\}/g, "");

  if (isMathBlock) {
    text = text.replace(/\\{2}\*?(?:\[[^\]]*\])?/g, "\n");
  } else {
    text = text.replace(/\\{2}\*?(?:\[[^\]]*\])?(?=\s*(?:\n|$))/g, "\n");
  }

  text = text.replace(
    /\s*&\s*(=|<|>|\\neq|\\ne\b|\\leq|\\le\b|\\leqslant|\\geq|\\ge\b|\\geqslant|\\approx|\\equiv|\\Rightarrow|\\Leftrightarrow|\\rightarrow|\\implies|\\iff)/g,
    " $1",
  );
  if (isMathBlock) {
    text = text.replace(/\s*&\s*/g, " ");
  }

  for (let pass = 0; pass < 4; pass++) {
    const prev = text;
    text = text
      .replace(/\\mathbb\{N\}\s*\^\s*\{\*\}/g, "ℕ*")
      .replace(/\\mathbb\{N\}\s*\^\s*\*/g, "ℕ*")
      .replace(/\\mathbb\{N\}/g, "ℕ")
      .replace(/\\mathbb\{Z\}/g, "ℤ")
      .replace(/\\mathbb\{Q\}/g, "ℚ")
      .replace(/\\mathbb\{R\}/g, "ℝ")
      .replace(/\\mathbb\{C\}/g, "ℂ")
      .replace(/\\boxed\{([^{}]+)\}/g, "[$1]")
      .replace(
        /\\(?:text|textbf|textit|textrm|mathrm|mathbf|mathit|mathsf|mathtt|operatorname)\{([^{}]+)\}/g,
        "$1",
      )
      .replace(/\\(?:overline|underline)\{([^{}]+)\}/g, "$1")
      .replace(/\\(?:widehat|hat)\{([A-Z]{1,3})\}/g, "∠$1")
      .replace(/\\(?:widehat|hat)\{([^{}]+)\}/g, "$1")
      .replace(/\\(?:overrightarrow|vec)\{([^{}]+)\}/g, "$1⃗")
      .replace(/\\phantom\{([^{}]+)\}/g, "")
      .replace(/\\tag\{([^{}]+)\}/g, " ($1)")
      .replace(/\\binom\{([^{}]+)\}\{([^{}]+)\}/g, "C($1, $2)")
      .replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (_, deg: string, inner: string) => {
        const sup = webConvertMap(deg.trim(), WEB_SUPERSCRIPT_MAP) ?? deg.trim();
        return `${sup}√${webWrapMathAtom(inner)}`;
      })
      .replace(/\\sqrt\{([^{}]+)\}/g, (_, inner: string) => `√${webWrapMathAtom(inner)}`)
      .replace(
        /\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g,
        (_, num: string, den: string) => `${webWrapMathAtom(num)}/${webWrapMathAtom(den)}`,
      );
    if (text === prev) break;
  }

  text = text
    .replace(/\^\s*\{\s*\\circ\s*\}/g, "°")
    .replace(/\^\s*\\circ\b/g, "°")
    .replace(/\\degree\b/g, "°")
    .replace(/\\(?:left|right)\s*\./g, "")
    .replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|biggl|biggr|Biggl|Biggr|big|Big|bigg|Bigg)\b/g, "")
    .replace(/\\(?:displaystyle|textstyle|scriptstyle|limits|nolimits|notag|nonumber)\b/g, "")
    .replace(/\\(?:qquad|quad)\b/g, "  ")
    .replace(/\\[,;:! ]/g, " ")
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}")
    .replace(/\\\|/g, "‖")
    .replace(/\\%/g, "%")
    .replace(/\\_/g, "_")
    .replace(/\\cdots\b/g, "···")
    .replace(/\\ldots\b|\\dots\b/g, "…")
    .replace(/\\times\b/g, "×")
    .replace(/\\div\b/g, "÷")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\pm\b/g, "±")
    .replace(/\\mp\b/g, "∓")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/\\delta\b/g, "δ")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\theta\b|\\vartheta\b/g, "θ")
    .replace(/\\lambda\b/g, "λ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\pi\b/g, "π")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\Sigma\b|\\sum\b/g, "Σ")
    .replace(/\\phi\b|\\varphi\b/g, "φ")
    .replace(/\\omega\b/g, "ω")
    .replace(/\\Omega\b/g, "Ω")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\neq\b|\\ne\b/g, "≠")
    .replace(/\\leqslant\b|\\leq\b|\\le\b/g, "≤")
    .replace(/\\geqslant\b|\\geq\b|\\ge\b/g, "≥")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\equiv\b/g, "≡")
    .replace(/\\cong\b/g, "≅")
    .replace(/\\sim\b/g, "∼")
    .replace(/\\angle\b|\\measuredangle\b/g, "∠")
    .replace(/\\perp\b/g, "⊥")
    .replace(/\\parallel\b/g, "∥")
    .replace(/\\triangle\b|\\bigtriangleup\b/g, "△")
    .replace(/\\notin\b/g, "∉")
    .replace(/\\in\b/g, "∈")
    .replace(/\\subseteq\b/g, "⊆")
    .replace(/\\subset\b/g, "⊂")
    .replace(/\\cup\b/g, "∪")
    .replace(/\\cap\b/g, "∩")
    .replace(/\\emptyset\b|\\varnothing\b/g, "∅")
    .replace(/\\forall\b/g, "∀")
    .replace(/\\exists\b/g, "∃")
    .replace(/\\Longleftrightarrow\b|\\Leftrightarrow\b|\\iff\b/g, "⇔")
    .replace(/\\Longrightarrow\b|\\Rightarrow\b|\\implies\b/g, "⇒")
    .replace(/\\Longleftarrow\b|\\Leftarrow\b/g, "⇐")
    .replace(/\\leftrightarrow\b/g, "↔")
    .replace(/\\rightarrow\b|\\to\b/g, "→")
    .replace(/\\leftarrow\b/g, "←")
    .replace(/\\circ\b/g, "°")
    .replace(
      /\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|log|ln|lg|exp|lim|max|min|gcd|lcm|det|deg|mod)\b/g,
      "$1",
    )
    .replace(/\^\{([^{}]+)\}/g, (_, g: string) => {
      const clean = g.trim();
      return webConvertMap(clean, WEB_SUPERSCRIPT_MAP) ?? `^(${clean})`;
    })
    .replace(/\^([0-9])(?![0-9])/g, (_, g: string) => WEB_SUPERSCRIPT_MAP[g] ?? `^${g}`)
    .replace(/_\{([^{}]+)\}/g, (_, g: string) => {
      const clean = g.trim();
      return webConvertMap(clean, WEB_SUBSCRIPT_MAP) ?? `_${clean}`;
    })
    .replace(/_([0-9])(?![0-9])/g, (_, g: string) => WEB_SUBSCRIPT_MAP[g] ?? `_${g}`);

  if (isMathBlock) {
    text = text
      .replace(/~/g, " ")
      .split("\n")
      .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  }
  return text;
}

function formatDisplayMathBlockForMarkdown(rawExpr: string): string {
  const inner = convertLatexBodyToUnicode(rawExpr, true);
  if (!inner) return "";
  const lines = inner.split("\n").filter(Boolean);
  if (lines.length > 1) {
    const quoted = lines
      .map((l) => (l.includes("*") ? `> \`${l}\`` : `> **${l}**`))
      .join("\n");
    return `\n\n${quoted}\n\n`;
  }
  const single = lines[0];
  return single.includes("*") ? `\n\n> \`${single}\`\n\n` : `\n\n> **${single}**\n\n`;
}

function sanitizeAndFormatAiContent(text: string): string {
  if (!text) return "";

  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?think>/gi, "");

  // Chống rò rỉ ký tự chữ Hán (CJK token leakage) trên cả tin nhắn cũ trong DB
  if (/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(cleaned)) {
    for (const [pattern, vi] of FRONTEND_CJK_MAP) {
      cleaned = cleaned.replace(pattern, vi);
    }
    cleaned = cleaned
      .replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+/g, "")
      .replace(/ {2,}/g, " ")
      .replace(/ ([.,!?;:])/g, "$1");
  }

  // Loại bỏ câu rào đón phiên học thừa nếu phía sau đã có nội dung giải đáp
  const preambleMatch = cleaned.match(
    /^\s*(?:Chào\s+(?:em|bạn)[!,.]?\s*)?Hiện tại\s+(?:chúng ta|mình)\s+đang ở trong phiên\s+(?:học|làm việc)[^.\n]*?chỉ hỗ trợ[^.\n]*?\.\s*/i,
  );
  if (preambleMatch) {
    const rest = cleaned.slice(preambleMatch[0].length).trim();
    const isRefusal = /chuyển sang phiên|mở phiên|phiên học môn khác/i.test(
      rest.slice(0, 140),
    );
    if (rest.length > 25 && !isRefusal) {
      cleaned = rest;
    }
  }

  // Định dạng khối công thức LaTeX đa dòng (\[...\], $$...$$, \begin{aligned}...) và inline (\(...\), $...$)
  cleaned = cleaned
    .trimStart()
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr: string) =>
      formatDisplayMathBlockForMarkdown(expr),
    )
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expr: string) =>
      formatDisplayMathBlockForMarkdown(expr),
    )
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr: string) => {
      const inner = convertLatexBodyToUnicode(expr, true);
      if (!inner) return "";
      return inner.includes("*") ? `\`${inner}\`` : `**${inner}**`;
    })
    .replace(/\$(?!\s)([^$\n]+?)(?<!\s)\$/g, (_, expr: string) => {
      const inner = convertLatexBodyToUnicode(expr, true);
      if (!inner) return "";
      return inner.includes("*") ? `\`${inner}\`` : `**${inner}**`;
    })
    // Dọn dấu mở/đóng LaTeX rời rạc khi đang stream dở
    .replace(/\\\[|\\\]|\\\(|\\\)/g, "")
    .replace(/^\s*\$\$\s*$/gm, "");

  return convertLatexBodyToUnicode(cleaned, false);
}

const HAS_HTML_BR_REGEX = /<br\s*\/?>/i;
const SPLIT_HTML_BR_REGEX = /<br\s*\/?>/gi;

function renderWithLineBreaks(node: ReactNode): ReactNode {
  if (typeof node === "string") {
    if (!HAS_HTML_BR_REGEX.test(node)) return node;
    const parts = node.split(SPLIT_HTML_BR_REGEX);
    return parts.map((part, idx) => (
      <Fragment key={idx}>
        {idx > 0 && <br />}
        {part}
      </Fragment>
    ));
  }
  if (Array.isArray(node)) {
    return node.map((child, idx) => <Fragment key={idx}>{renderWithLineBreaks(child)}</Fragment>);
  }
  return node;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight first:mt-0">
      {renderWithLineBreaks(children)}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-2.5 tracking-tight first:mt-0">
      {renderWithLineBreaks(children)}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white mt-5 mb-2 tracking-tight first:mt-0">
      {renderWithLineBreaks(children)}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[15.5px] leading-7 text-slate-800 dark:text-slate-200 mb-3.5 last:mb-0">
      {renderWithLineBreaks(children)}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-[circle] pl-6 my-3 space-y-2 text-[15.5px] leading-7 text-slate-800 dark:text-slate-200 marker:text-slate-400 dark:marker:text-slate-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 my-3 space-y-2 text-[15.5px] leading-7 text-slate-800 dark:text-slate-200 marker:font-medium marker:text-slate-500">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{renderWithLineBreaks(children)}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-white">
      {renderWithLineBreaks(children)}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-700 dark:text-slate-300">{renderWithLineBreaks(children)}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 pl-4 border-l-2 border-blue-500/70 text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/30 py-2 pr-3 rounded-r-lg">
      {renderWithLineBreaks(children)}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-slate-200 dark:border-slate-800" />,
  code: ({ className, children }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <pre className="my-4 p-4 rounded-xl bg-slate-900 text-slate-100 overflow-x-auto text-[13.5px] leading-6 font-mono">
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[13.5px] font-mono">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto pb-1">
      <table className="w-full border-collapse text-left text-[14.5px] min-w-[460px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-slate-200 dark:border-slate-700/80">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="py-3 pr-6 pl-0 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
      {renderWithLineBreaks(children)}
    </th>
  ),
  td: ({ children }) => (
    <td className="py-3.5 pr-6 pl-0 text-slate-800 dark:text-slate-200 align-top first:font-semibold first:text-slate-900 dark:first:text-white">
      {renderWithLineBreaks(children)}
    </td>
  ),
};

const SIDEBAR_STORAGE_KEY = "eduai_ai_tutor_sidebar_collapsed";
const SIDEBAR_CHANGE_EVENT = "eduai-ai-tutor-sidebar-change";
let memorySidebarCollapsed = false;

function subscribeSidebarCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, callback);
  };
}

function getSidebarCollapsedSnapshot(): boolean {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    // Fallback to in-memory state when storage is unavailable
  }
  return memorySidebarCollapsed;
}

function getSidebarCollapsedServerSnapshot(): boolean {
  return false;
}

function setHistoryCollapsed(collapsed: boolean) {
  memorySidebarCollapsed = collapsed;
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // Ignore storage quota or privacy mode errors
  }
  window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
}

function AITutorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get("subjectId");
  const initialSubjectName = searchParams.get("subjectName");
  const initialGrade = searchParams.get("grade");
  const initialDocName = searchParams.get("docName");
  const initializedSubjectKeyRef = useRef<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showHistory, setShowHistory] = useState(false);
  const isHistoryCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<{
    id: string;
    name: string;
    grade?: number | null;
  } | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const [feedbackMsgId, setFeedbackMsgId] = useState<string | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState("AI_ERROR");
  const [feedbackContent, setFeedbackContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("User.AITutor");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadSessions = async () => {
    try {
      const data = await fetchApi<ChatSessionItem[]>("/chat/sessions");
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, []);

  // Tự động khởi tạo phiên Gia sư AI gắn đúng môn học & lời chào chuyên môn khi bấm "Hỏi AI" từ một môn cụ thể
  useEffect(() => {
    if (!initialSubjectId) return;
    const initKey = `${initialSubjectId}_${initialDocName || ""}`;
    if (initializedSubjectKeyRef.current === initKey) return;
    initializedSubjectKeyRef.current = initKey;

    const initSubjectSession = async () => {
      setLoading(true);
      try {
        const title = initialSubjectName
          ? `Gia sư ${initialSubjectName}${initialGrade ? ` (Lớp ${initialGrade})` : ""}`
          : undefined;
        const created = await fetchApi<{
          id: string;
          title: string;
          createdAt: string;
          subject?: { id: string; name: string; grade?: number | null } | null;
          messages?: Array<{
            id: string;
            role: string;
            content: string;
            citations?: Citation[];
            createdAt?: string;
          }>;
        }>(API_ENDPOINTS.CHAT.SESSION, {
          method: "POST",
          body: JSON.stringify({
            subjectId: initialSubjectId,
            title,
          }),
        });

        setSessionId(created.id);
        setActiveSubject(
          created.subject ||
            (initialSubjectName
              ? {
                  id: initialSubjectId,
                  name: initialSubjectName,
                  grade: initialGrade ? Number(initialGrade) : null,
                }
              : null),
        );
        setSessions((prev) => [
          {
            id: created.id,
            title: created.title,
            createdAt: created.createdAt,
            subject: created.subject || null,
          },
          ...prev.filter((s) => s.id !== created.id),
        ]);
        setMessages(
          Array.isArray(created.messages)
            ? created.messages.map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                citations: Array.isArray(m.citations) ? m.citations : undefined,
                createdAt: m.createdAt,
              }))
            : [],
        );
        if (initialDocName) {
          setInputText(
            `Thầy/Cô giúp em tóm tắt những kiến thức trọng tâm nhất trong tài liệu ${initialDocName} với ạ`,
          );
        }
      } catch (err) {
        console.error("Failed to initialize subject AI session:", err);
      } finally {
        setLoading(false);
      }
    };

    initSubjectSession();
  }, [initialSubjectId, initialSubjectName, initialGrade, initialDocName]);

  const handleSelectSession = async (id: string) => {
    setSessionId(id);
    setShowHistory(false);
    setLoading(true);
    try {
      const data = await fetchApi<{
        id: string;
        subject?: { id: string; name: string; grade?: number | null } | null;
        messages: any[];
      }>(`/chat/session/${id}`);
      setActiveSubject(data?.subject || null);
      if (data?.messages) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            citations: Array.isArray(m.citations) ? m.citations : undefined,
            createdAt: m.createdAt,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const windowWithSpeech = window as unknown as WindowWithSpeech;
      const SpeechRecognitionConstructor =
        windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        recognitionRef.current = new SpeechRecognitionConstructor();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "vi-VN";

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Failed to start recording", e);
      }
    }
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(
        sanitizeAndFormatAiContent(content).replace(SPLIT_HTML_BR_REGEX, "\n"),
      );
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 1800);
    } catch {
      notify("Không thể sao chép nội dung.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    const aiMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        role: "assistant",
        content: "",
      },
    ]);

    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const session = await fetchApi<{ id: string; title: string; createdAt: string }>(
          API_ENDPOINTS.CHAT.SESSION,
          {
            method: "POST",
            body: JSON.stringify({
              title: userMessage.content.substring(0, 50),
            }),
          },
        );
        currentSessionId = session.id;
        setSessionId(session.id);
        setSessions((prev) => [
          { id: session.id, title: session.title, createdAt: session.createdAt },
          ...prev,
        ]);
      }

      const response = await fetchApiStream(`/chat/session/${currentSessionId}/message-stream`, {
        method: "POST",
        body: JSON.stringify({
          content: userMessage.content,
          role: "user",
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No reader available");

      let done = false;
      let aiText = "";
      let sseBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  aiText =
                    typeof data.error === "string"
                      ? data.error
                      : "Xin lỗi, Gia sư AI gặp sự cố khi xử lý yêu cầu.";
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMsgId ? { ...msg, content: aiText } : msg,
                    ),
                  );
                } else if (data.content) {
                  aiText += data.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMsgId
                        ? { ...msg, content: aiText, citations: data.citations || msg.citations }
                        : msg,
                    ),
                  );
                } else if (data.citations) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMsgId ? { ...msg, citations: data.citations } : msg,
                    ),
                  );
                }
              } catch {
                // Ignore malformed JSON chunk
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errMessage =
        error?.message ||
        "Xin lỗi, đã xảy ra lỗi trong quá trình kết nối với AI. Vui lòng thử lại sau.";
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMsgId ? { ...msg, content: errMessage } : msg)),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMsgId) return;
    try {
      await fetchApi("/chat/feedback", {
        method: "POST",
        body: JSON.stringify({
          category: feedbackCategory,
          content: feedbackContent || "Báo cáo tin nhắn AI",
        }),
      });
      notify("Cảm ơn bạn đã phản hồi!");
    } catch (error) {
      console.error(error);
      notify("Có lỗi xảy ra khi gửi phản hồi.");
    } finally {
      setFeedbackMsgId(null);
      setFeedbackContent("");
    }
  };

  const handleResetToNewChat = () => {
    setSessionId(null);
    setActiveSubject(null);
    setMessages([]);
    setInputText("");
    setShowHistory(false);
    initializedSubjectKeyRef.current = null;
    if (initialSubjectId) {
      router.replace("/dashboard/ai-tutor");
    }
  };

  const handleOpenAndFocusSearch = () => {
    setHistoryCollapsed(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);
  };

  const sidebarTooltipClass =
    "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap shadow-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 transition-all duration-150 z-50";

  const filteredSessions = sessions.filter(
    (s) => !historySearch || s.title?.toLowerCase().includes(historySearch.toLowerCase()),
  );

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] md:h-screen flex flex-col md:flex-row bg-white dark:bg-[#0f111a]">
      {/* Mobile Header for switching views */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-card-bg border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"
        >
          {showHistory ? <ChevronLeft className="w-4 h-4" /> : null}
          {showHistory ? t("backToChat") : t("chatHistory")}
        </button>
      </div>

      <div className="flex w-full h-full overflow-hidden">
        {/* --- LEFT COLUMN: COLLAPSIBLE HISTORY SIDEBAR (Gemini-style) --- */}
        <aside
          aria-label={t("chatHistory")}
          className={`${
            showHistory ? "flex w-full" : "hidden"
          } md:flex flex-col shrink-0 relative z-30 bg-slate-50/70 dark:bg-card-bg border-r border-slate-200/80 dark:border-gray-800 transition-[width] duration-300 ease-in-out ${
            isHistoryCollapsed ? "md:w-[68px]" : "md:w-72 lg:w-80"
          }`}
        >
          {/* Desktop Collapsed Slim Rail */}
          <div
            className={`hidden ${
              isHistoryCollapsed ? "md:flex" : ""
            } flex-col items-center py-3.5 px-2 gap-2.5 h-full`}
          >
            <button
              type="button"
              onClick={() => setHistoryCollapsed(false)}
              aria-label={t("openSidebar")}
              aria-expanded={false}
              className="relative group w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <PanelLeftOpen className="w-[18px] h-[18px]" />
              <span role="tooltip" className={sidebarTooltipClass}>
                {t("openSidebar")}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetToNewChat}
              aria-label={t("newChat")}
              className="relative group w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Edit className="w-[18px] h-[18px]" />
              <span role="tooltip" className={sidebarTooltipClass}>
                {t("newChat")}
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenAndFocusSearch}
              aria-label={t("searchChats")}
              className="relative group w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Search className="w-[18px] h-[18px]" />
              <span role="tooltip" className={sidebarTooltipClass}>
                {t("searchChats")}
              </span>
            </button>
          </div>

          {/* Expanded Sidebar Content (always shown on mobile drawer) */}
          <div
            className={`${
              isHistoryCollapsed ? "flex md:hidden" : "flex"
            } flex-col flex-1 min-h-0 w-full`}
          >
            <div className="px-4 pt-3.5 pb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                {t("chatHistory")}
              </span>
              <button
                type="button"
                onClick={() => setHistoryCollapsed(true)}
                aria-label={t("closeSidebar")}
                aria-expanded={true}
                className="hidden md:flex relative group w-9 h-9 rounded-full items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <PanelLeftClose className="w-[18px] h-[18px]" />
                <span role="tooltip" className={sidebarTooltipClass}>
                  {t("closeSidebar")}
                </span>
              </button>
            </div>

            <div className="px-4 pb-3 flex justify-between items-center">
              <button
                type="button"
                onClick={handleResetToNewChat}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-xs whitespace-nowrap"
              >
                <Edit className="w-4 h-4 shrink-0" />{" "}
                {t("newChat", { fallback: "Cuộc trò chuyện mới" })}
              </button>
            </div>

            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder={t("searchHistory")}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-700 focus:border-blue-500 rounded-lg text-sm outline-none transition-colors dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
              {filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  Chưa có lịch sử trò chuyện
                </div>
              ) : (
                filteredSessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    title={sess.title}
                    className={`p-3 rounded-lg cursor-pointer text-sm flex items-center gap-2.5 transition-colors truncate ${
                      sessionId === sess.id
                        ? "bg-blue-50 dark:bg-blue-900/30 font-semibold text-blue-700 dark:text-blue-300"
                        : "hover:bg-slate-100/80 dark:hover:bg-gray-800/50 text-slate-600 dark:text-gray-400"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="truncate">{sess.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* --- MAIN CHAT AREA (Modern Editorial Canvas) --- */}
        <div
          className={`${showHistory ? "hidden" : "flex"} md:flex flex-col flex-1 min-w-0 bg-white dark:bg-[#0f111a]`}
        >
          {/* Active Subject Context Bar */}
          {activeSubject && (
            <div className="px-4 sm:px-8 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                  <BookOpen className="w-3.5 h-3.5" />
                  Gia sư môn {activeSubject.name}
                  {activeSubject.grade ? ` • Lớp ${activeSubject.grade}` : ""}
                </span>
                <span className="hidden sm:inline text-slate-500 dark:text-slate-400 text-xs">
                  Đã kết nối kho tài liệu chính khóa của môn học
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToNewChat}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
              >
                Đổi môn khác
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto">
            <div
              className={`${
                isHistoryCollapsed ? "max-w-4xl" : "max-w-3xl"
              } mx-auto px-4 sm:px-8 py-6 sm:py-8 transition-[max-width] duration-300`}
            >
              {messages.length === 0 && loading ? (
                <div className="flex flex-col items-center justify-center h-full mt-24 text-center px-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-md text-white animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Đang kết nối Gia sư AI
                    {initialSubjectName ? ` môn ${initialSubjectName}` : ""}
                    {initialGrade ? ` (Lớp ${initialGrade})` : ""}...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Đang tải chương trình và kho tài liệu chính khóa của môn học
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full mt-14 sm:mt-20 text-center px-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-blue-600/20 text-white">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                    Gia sư AI (RAG Trường học)
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-lg text-sm sm:text-base leading-relaxed mb-8">
                    Đặt câu hỏi về bài giảng, đề cương và tài liệu của lớp bạn. Mọi câu trả lời
                    từ tài liệu đều đi kèm trích dẫn nguồn minh bạch (BR-RAG-001).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                    {[
                      "Em muốn học Tiếng Anh lớp 6, bắt đầu dạy em từ bài 1",
                      "Em muốn học Toán lớp 6, tóm tắt các chương trọng tâm giúp em",
                      "Giải thích thì Hiện tại đơn và lập bảng chia động từ dễ nhớ",
                      "Hướng dẫn cách làm dạng bài tập thường gặp trong đề kiểm tra",
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(suggestion)}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 hover:bg-blue-50/60 dark:bg-slate-900/60 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800 transition-all text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                      >
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {messages.map((msg, idx) =>
                    msg.role === "user" ? (
                      <div key={msg.id || idx} className="flex justify-end">
                        <div className="max-w-[82%] sm:max-w-[75%] px-5 py-3 rounded-3xl rounded-tr-md bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-[15px] leading-relaxed">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id || idx} className="flex items-start gap-3.5 sm:gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          {msg.content ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {sanitizeAndFormatAiContent(msg.content)}
                            </ReactMarkdown>
                          ) : null}

                          {/* Citations block (BR-RAG-001) */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                <BookOpen className="w-3.5 h-3.5" /> Nguồn tài liệu tham khảo
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.citations.map((cit, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-full px-3 py-1 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                    title={cit.snippet || ""}
                                  >
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                      {cit.fileName}
                                    </span>
                                    {cit.page ? (
                                      <span className="ml-1 text-slate-400">
                                        • Trang {cit.page}
                                      </span>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sleek Action Toolbar */}
                          {msg.content && (
                            <div className="mt-3 flex items-center gap-2 text-slate-400">
                              <button
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                title="Sao chép câu trả lời"
                              >
                                {copiedMsgId === msg.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      Đã sao chép
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Sao chép</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setFeedbackMsgId(msg.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500 transition-colors"
                                title="Báo cáo câu trả lời này"
                              >
                                <Flag className="w-3.5 h-3.5" />
                                <span>Báo lỗi</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  )}

                  {loading && (
                    <div className="flex items-center gap-3.5 pl-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div className="flex items-center gap-1.5 py-2">
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Fixed Input Area */}
          <div className="w-full bg-white dark:bg-[#0f111a] pt-2 pb-4 px-4 flex-shrink-0">
            <div
              className={`${
                isHistoryCollapsed ? "max-w-4xl" : "max-w-3xl"
              } mx-auto transition-[max-width] duration-300`}
            >
              <div className="flex items-end gap-2 bg-slate-50 dark:bg-[#1a1d2d] border border-slate-200 dark:border-slate-700 rounded-3xl p-2 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                    isRecording
                      ? "bg-rose-100 text-rose-500 dark:bg-rose-900/30"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
                </button>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={
                    isRecording
                      ? "Đang nghe..."
                      : t("askQuestion", { fallback: "Hỏi gia sư AI bất cứ điều gì..." })
                  }
                  className="w-full max-h-32 bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-3 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 overflow-y-auto"
                  style={{ minHeight: "48px" }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || loading}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed m-1"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">
                {t("aiWarning", {
                  fallback: "AI có thể mắc sai lầm. Vui lòng kiểm tra lại thông tin quan trọng.",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card-bg rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Báo lỗi AI</h3>
              <button
                onClick={() => setFeedbackMsgId(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Loại lỗi
                </label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white focus:border-blue-500"
                >
                  <option value="AI_ERROR">AI trả lời không đúng nội dung</option>
                  <option value="CONTENT_ERROR">Sai kiến thức chuyên môn</option>
                  <option value="SYSTEM_BUG">Lỗi hệ thống hiển thị</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chi tiết (Tùy chọn)
                </label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Mô tả lỗi gặp phải..."
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white focus:border-blue-500 resize-none h-24"
                />
              </div>
              <button
                onClick={handleSubmitFeedback}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AITutorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0f111a] text-slate-500 text-sm">
          Đang tải Gia sư AI...
        </div>
      }
    >
      <AITutorContent />
    </Suspense>
  );
}
