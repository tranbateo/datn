export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let counter = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(items));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function inferType(message: string): ToastType {
  if (/thành công|cảm ơn|^đã /i.test(message)) return "success";
  if (/^vui lòng/i.test(message)) return "warning";
  return "error";
}

/**
 * Show a non-blocking notification. Type is inferred from the message
 * when not provided: success words -> success, "Vui lòng ..." -> warning,
 * everything else -> error.
 */
export function notify(message: string, type?: ToastType) {
  const text = String(message ?? "").trim();
  if (!text) return;
  counter += 1;
  items = [...items, { id: counter, message: text, type: type ?? inferType(text) }].slice(-4);
  emit();
}

