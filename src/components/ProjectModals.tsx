import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BDT, uid, todayStr } from "../lib/utils";
import { FG, ConfirmDelete, PBar } from "./Shared";
import { EXP_CATS } from "../lib/data";
import { Trash2, Clock } from "lucide-react";

export function CellPaySheet({ client, instDef, payments, isSuperAdmin, onSave, onDelete, onClose }: any) {
  const existPays = payments.filter((p: any) => p.clientId === client.id && p.instDefId === instDef.id);
  const approvedPays = existPays.filter((p: any) => p.status === "approved");
  const pendingPays = existPays.filter((p: any) => p.status === "pending");
  const paid = approvedPays.reduce((s: number, p: any) => s + p.amount, 0);
  const rem = Math.max(0, instDef.targetAmount - paid);
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [delPay, setDelPay] = useState<any>(null);

  const submit = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) { setErr("সঠিক পরিমাণ লিখুন"); return; }
    if (a > rem) { setErr("বাকি " + BDT(rem) + " এর বেশি না"); return; }
    onSave({ id: uid("PAY-"), clientId: client.id, instDefId: instDef.id, amount: a, date, note, status: isSuperAdmin ? "approved" : "pending", approvedBy: null });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[400] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
        <div className="text-xl font-black text-slate-900">পেমেন্ট রেকর্ড</div>
        <div className="text-xs font-bold text-slate-500 mt-1 mb-6">{client.name} · {client.plot} · {instDef.title}</div>
        
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <PBar paid={paid} target={instDef.targetAmount} />
          {rem > 0 && <div className="text-sm font-bold text-rose-600 mt-3">বাকি: {BDT(rem)}</div>}
        </div>
        
        {approvedPays.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">APPROVED</div>
            {approvedPays.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-2">
                <span className="text-xs font-medium text-slate-700">{p.date}{p.note && ` · ${p.note}`}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-emerald-700">{BDT(p.amount)}</span>
                  {isSuperAdmin && (
                    <button className="w-7 h-7 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-200 transition-colors" onClick={() => setDelPay(p)}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {pendingPays.length > 0 && (
          <div className="mb-6">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">PENDING APPROVAL</div>
            {pendingPays.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5"><Clock size={12} /> {p.date}{p.note && ` · ${p.note}`}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-amber-700">{BDT(p.amount)}</span>
                  {isSuperAdmin && (
                    <button className="w-7 h-7 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-200 transition-colors" onClick={() => setDelPay(p)}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {rem > 0 ? (
          <>
            <FG label={`পরিমাণ (৳)${!isSuperAdmin ? " — Super Admin approve করবেন" : ""}`}>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold" 
                type="number" inputMode="numeric" placeholder={"সর্বোচ্চ " + rem} 
                value={amount} onChange={e => { setAmount(e.target.value); setErr(""); }} 
              />
            </FG>
            {!isSuperAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 -mt-2 mb-4 text-xs font-bold text-amber-700 flex items-center gap-2">
                <Clock size={14} /> Super Admin approval এর জন্য pending থাকবে।
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FG label="তারিখ"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="date" value={date} onChange={e => setDate(e.target.value)} /></FG>
              <FG label="নোট"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder="ঐচ্ছিক" value={note} onChange={e => setNote(e.target.value)} /></FG>
            </div>
            
            <AnimatePresence>
              {err && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="text-rose-600 text-sm font-bold mb-4 bg-rose-50 p-3 rounded-xl border border-rose-100">{err}</div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex gap-3 mt-2">
              <button className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" onClick={submit}>{isSuperAdmin ? "সংরক্ষণ" : "Submit for Approval"}</button>
              <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>বাতিল</button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-emerald-600 font-black bg-emerald-50 rounded-2xl border border-emerald-100">
            ✓ সম্পূর্ণ পরিশোধিত
          </div>
        )}
        
        <AnimatePresence>
          {delPay && (
            <ConfirmDelete 
              message={<><b>{BDT(delPay.amount)}</b> ({delPay.date}) মুছে যাবে।</>} 
              onConfirm={() => { onDelete(delPay.id); setDelPay(null); }} 
              onClose={() => setDelPay(null)} 
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function AddDefSheet({ projectId, onSave, onClose }: any) {
  const [f, setF] = useState({ title: "", dueDate: "", targetAmount: "" });
  const s = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[400] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
        <div className="text-xl font-black text-slate-900 mb-6">নতুন কিস্তি কলাম</div>
        
        <FG label="কিস্তির নাম">
          <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold" placeholder="যেমন: বুকিং মানি" value={f.title} onChange={e => s("title", e.target.value)} />
        </FG>
        <div className="grid grid-cols-2 gap-4">
          <FG label="লক্ষ্য (৳)"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold" type="number" value={f.targetAmount} onChange={e => s("targetAmount", e.target.value)} /></FG>
          <FG label="ডিউ তারিখ"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="date" value={f.dueDate} onChange={e => s("dueDate", e.target.value)} /></FG>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button 
            className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" 
            onClick={() => {
              if (!f.title || !f.targetAmount) { alert("নাম ও পরিমাণ দিন"); return; }
              onSave({ id: uid("D-"), projectId, title: f.title, dueDate: f.dueDate, targetAmount: parseFloat(f.targetAmount) });
              onClose();
            }}
          >
            যোগ করুন
          </button>
          <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>বাতিল</button>
        </div>
      </motion.div>
    </div>
  );
}

export function AddExpSheet({ projectId, onSave, onClose }: any) {
  const [f, setF] = useState({ category: "", description: "", amount: "", date: todayStr() });
  const s = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[400] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
        <div className="text-xl font-black text-slate-900 mb-6">ব্যয় যোগ</div>
        
        <FG label="বিভাগ">
          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold appearance-none" value={f.category} onChange={e => s("category", e.target.value)}>
            <option value="">নির্বাচন করুন</option>
            {EXP_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FG>
        <FG label="বিবরণ"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={f.description} onChange={e => s("description", e.target.value)} /></FG>
        <div className="grid grid-cols-2 gap-4">
          <FG label="পরিমাণ (৳)"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold" type="number" value={f.amount} onChange={e => s("amount", e.target.value)} /></FG>
          <FG label="তারিখ"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="date" value={f.date} onChange={e => s("date", e.target.value)} /></FG>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button 
            className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" 
            onClick={() => {
              if (!f.category || !f.amount) { alert("বিভাগ ও পরিমাণ দিন"); return; }
              onSave({ id: uid("EX-"), projectId, ...f, amount: parseFloat(f.amount) });
              onClose();
            }}
          >
            যোগ করুন
          </button>
          <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>বাতিল</button>
        </div>
      </motion.div>
    </div>
  );
}

export function ReceiptSheet({ payment, instDef, client, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[400] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">🏗️</div>
          <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">MARQ BUILDERS</div>
          <div className="text-xl font-black text-slate-900">পেমেন্ট রিসিপ্ট</div>
          <div className="text-xs text-slate-400 font-mono mt-1">{payment.id}</div>
        </div>
        
        <div className="border-t-2 border-dashed border-slate-200 my-6" />
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6">
          {[
            ["ক্লাইন্ট", client?.name], ["প্লট", client?.plot], 
            ["তারিখ", payment.date], ["কিস্তি", instDef?.title], 
            ["কিস্তি মূল্য", BDT(instDef?.targetAmount)]
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{k}</div>
              <div className="text-sm font-bold text-slate-900">{v}</div>
            </div>
          ))}
        </div>
        
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-5 text-center mb-6">
          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">পরিশোধিত</div>
          <div className="text-3xl font-black text-emerald-700">{BDT(payment.amount)}</div>
        </div>
        
        <button className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" onClick={onClose}>
          বন্ধ করুন
        </button>
      </motion.div>
    </div>
  );
}
