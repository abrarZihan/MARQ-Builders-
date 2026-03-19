import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dotJoin = (...parts: (string | number | undefined | null)[]) => 
  parts.filter(p => p !== undefined && p !== null && String(p).trim() !== "").join(" · ");

export const BDT = (n: number | string) => "৳ " + Number(n || 0).toLocaleString("en-IN");
export const BDTshort = (n: number | string) => {
  const v = Number(n || 0);
  if (v < 0) return "-" + BDTshort(-v);
  if (v >= 10000000) return "৳" + (v / 10000000).toFixed(1) + "Cr";
  if (v >= 100000) return "৳" + (v / 100000).toFixed(v % 100000 === 0 ? 0 : 1) + "L";
  if (v >= 1000) return "৳" + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "K";
  return "৳" + v;
};

export const uid = (p: string) => p + Date.now().toString(36).toUpperCase().slice(-6);
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const tsNow = () => new Date().toISOString();
export const fmtTs = (ts: string) => {
  const d = new Date(ts);
  return dotJoin(
    d.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" }),
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
};

export const genClientId = (existing: any[]) => {
  const nums = existing.map(c => parseInt((c.id || "").replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return "C" + String(next).padStart(3, "0");
};

export const clientPaidForDef = (cId: string, dId: string, pays: any[]) => 
  pays.filter(p => p.clientId === cId && p.instDefId === dId && p.status === "approved").reduce((s, p) => s + p.amount, 0);

export const cellStatus = (paid: number, target: number) => paid === 0 ? "unpaid" : paid >= target ? "paid" : "partial";

export const ACCENTS = ["#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#f97316", "#06b6d4"];
export const ac = (id: string) => ACCENTS[parseInt((id || "0").replace(/\D/g, ""), 10) % ACCENTS.length];
export const initials = (name: string) => (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
