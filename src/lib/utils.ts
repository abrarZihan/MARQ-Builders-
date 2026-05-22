import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dotJoin = (...parts: (string | number | undefined | null)[]) => 
  parts.filter(p => p !== undefined && p !== null && String(p).trim() !== "").join(" · ");

export const BDT = (n: number | string, isBn: boolean = false) => {
  const v = Number(n || 0);
  const s = v.toLocaleString("en-IN");
  if (!isBn) return "৳ " + s;
  const digits: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return "৳ " + s.replace(/[0-9]/g, w => digits[w]);
};
export const BDTshort = (n: number | string, isBn: boolean = false) => {
  const v = Number(n || 0);
  if (v < 0) return "-" + BDTshort(-v, isBn);
  
  const toBn = (s: string) => {
    if (!isBn) return s;
    const digits: Record<string, string> = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return s.replace(/[0-9]/g, w => digits[w]);
  };

  if (v >= 10000000) {
    const val = Number((v / 10000000).toFixed(2)).toString();
    return "৳" + toBn(val) + (isBn ? " কোটি" : "Cr");
  }
  if (v >= 100000) {
    const val = Number((v / 100000).toFixed(2)).toString();
    return "৳" + toBn(val) + (isBn ? " লাখ" : "L");
  }
  if (v >= 1000) {
    const val = Number((v / 1000).toFixed(2)).toString();
    return "৳" + toBn(val) + (isBn ? " কে" : "K");
  }
  return "৳" + toBn(String(v));
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

export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const nStr = num.toString();
  if (nStr.length > 9) return 'overflow';
  const n = ('000000000' + nStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[parseInt(n[1][0])] + ' ' + a[parseInt(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[parseInt(n[2][0])] + ' ' + a[parseInt(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[parseInt(n[3][0])] + ' ' + a[parseInt(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[parseInt(n[4][0])] + ' ' + a[parseInt(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[parseInt(n[5][0])] + ' ' + a[parseInt(n[5][1])]) : '';
  return str.trim();
};

export function sortInstallmentDefs(defs: any[]): any[] {
  return [...defs].sort((a: any, b: any) => {
    const cA = a.createdAt || "";
    const cB = b.createdAt || "";

    // If both have createdAt, sort by it chronologically
    if (cA && cB) {
      if (cA !== cB) {
        return cA.localeCompare(cB);
      }
    }

    // Older items (without createdAt) must come first before newer items (with createdAt)
    if (!cA && cB) return -1;
    if (cA && !cB) return 1;

    // Fallback: If neither has createdAt, or both have identical createdAt,
    // use the tried-and-tested weight and title-based sorting to maintain correct order.
    const getWeight = (item: any) => {
      const title = (item.title || "").toLowerCase().trim();
      
      // Check if it is an upfront / plan / booking / down payment
      const isUpfront = /plan|booking|down|upfront|প্ল্যান|বুকিং|ডাউন|এককালীন/.test(title);
      if (isUpfront) {
        return -1000;
      }

      // Convert Bengali digits to English
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      let cleaned = title;
      bnDigits.forEach((bn, idx) => {
        cleaned = cleaned.replace(new RegExp(bn, 'g'), String(idx));
      });

      const match = cleaned.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }

      // Fallback if no digit is found
      return 99999;
    };

    const wA = getWeight(a);
    const wB = getWeight(b);
    if (wA !== wB) {
      return wA - wB;
    }
    
    // Tie-breaker 1: dueDate
    const dA = a.dueDate || "";
    const dB = b.dueDate || "";
    if (dA && dB) {
      return dA.localeCompare(dB);
    } else if (dA) {
      return -1; // item with due date comes first
    } else if (dB) {
      return 1;
    }

    // Tie-breaker 2: title
    const tA = a.title || "";
    const tB = b.title || "";
    const titleCompare = tA.localeCompare(tB);
    if (titleCompare !== 0) return titleCompare;

    // Tie-breaker 3: ID alphabetical comparison
    const idA = a.id || "";
    const idB = b.id || "";
    return idA.localeCompare(idB);
  });
}

