import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BDT, ac, initials, todayStr, clientPaidForDef, cellStatus, cn } from "../lib/utils";
import { FG, ClientAvatar, PBar, CategoryIcon, CategoryColor } from "./Shared";
import { STATUS } from "../lib/data";
import { ReceiptSheet } from "./ProjectModals";
import { Eye, EyeOff, Building2, CheckCircle2, Clock, KeyRound } from "lucide-react";

export function ClientInstallments({ client, instDefs, payments }: any) {
  const prjDefs = instDefs.filter((d: any) => d.projectId === client.projectId);
  const totalPaid = payments.filter((p: any) => p.clientId === client.id && p.status === "approved").reduce((s: number, p: any) => s + p.amount, 0);
  const totalTarget = prjDefs.reduce((s: number, d: any) => s + d.targetAmount, 0);
  const today = todayStr();
  const color = ac(client.id);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 flex items-center gap-4 mb-4 shadow-sm">
        <ClientAvatar client={client} size={56} />
        <div className="flex-1 min-w-0">
          <div className="text-lg font-black text-slate-900 truncate">{client.name}</div>
          <div className="text-sm font-medium text-slate-500 mt-0.5">প্লট: <span className="font-bold" style={{ color }}>{client.plot}</span></div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">মোট মূল্য</div>
          <div className="text-base font-black text-slate-900">{BDT(client.totalAmount)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 flex flex-col justify-center">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-2"><CheckCircle2 size={16} /></div>
          <div className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider mb-0.5">পরিশোধিত</div>
          <div className="text-lg font-black text-emerald-700">{BDT(totalPaid)}</div>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 flex flex-col justify-center">
          <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-2"><Clock size={16} /></div>
          <div className="text-[10px] text-amber-600/80 font-bold uppercase tracking-wider mb-0.5">বাকি</div>
          <div className="text-lg font-black text-amber-700">{BDT(Math.max(0, totalTarget - totalPaid))}</div>
        </div>
      </div>

      {prjDefs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-sm">
          কোনো কিস্তি নেই
        </div>
      )}

      <div className="space-y-3">
        {prjDefs.map((d: any) => {
          const paid = clientPaidForDef(client.id, d.id, payments);
          const pendingAmt = payments.filter((p: any) => p.clientId === client.id && p.instDefId === d.id && p.status === "pending").reduce((s: number, p: any) => s + p.amount, 0);
          const st = cellStatus(paid, d.targetAmount);
          const isDue = d.dueDate && d.dueDate < today && paid < d.targetAmount;
          const m = STATUS[st];

          return (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
              <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", m.dot)} />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-base font-black text-slate-900">{d.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">ডিউ: {d.dueDate || "—"}</span>
                    {isDue && <span className="bg-rose-100 text-rose-600 rounded-md px-2 py-0.5 text-[10px] font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Due</span>}
                  </div>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", m.bg, m.text)}>
                  {st === "paid" ? "সম্পূর্ণ" : st === "partial" ? "আংশিক" : "বাকি"}
                </span>
              </div>
              
              <PBar paid={paid} target={d.targetAmount} />
              
              {d.targetAmount - paid > 0 && (
                <div className="text-sm font-bold text-rose-600 mt-3">বাকি: {BDT(d.targetAmount - paid)}</div>
              )}
              {pendingAmt > 0 && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <Clock size={14} /> Pending approval: {BDT(pendingAmt)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function ClientReceipts({ client, instDefs, payments }: any) {
  const [viewR, setViewR] = useState<any>(null);
  const myPays = [...payments.filter((p: any) => p.clientId === client.id && p.status === "approved")].sort((a, b) => b.date.localeCompare(a.date));
  const pendingPays = payments.filter((p: any) => p.clientId === client.id && p.status === "pending");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">রিসিপ্টসমূহ</h1>
          <p className="text-xs font-medium text-slate-500">{myPays.length}টি approved</p>
        </div>
      </div>

      {pendingPays.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm font-bold text-amber-700 flex items-center gap-2">
          <Clock size={16} /> {pendingPays.length}টি payment approval এর অপেক্ষায়
        </div>
      )}

      {myPays.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-sm">
          কোনো approved payment নেই
        </div>
      ) : (
        <div className="space-y-3">
          {myPays.map((p: any) => {
            const def = instDefs.find((d: any) => d.id === p.instDefId);
            return (
              <motion.div 
                whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.95 }}
                key={p.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden cursor-pointer"
                onClick={() => setViewR(p)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold tracking-wider mb-0.5">{p.id}</div>
                    <div className="text-base font-black text-slate-900">{def?.title || "কিস্তি"}</div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Approved
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-2xl font-black text-emerald-600">{BDT(p.amount)}</div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium mb-1">{p.date}</div>
                    <div className="text-xs text-blue-600 font-bold">রিসিপ্ট &rarr;</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {viewR && <ReceiptSheet payment={viewR} instDef={instDefs.find((d: any) => d.id === viewR.instDefId)} client={client} onClose={() => setViewR(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

export function ClientExpenses({ client, expenses }: any) {
  const prjExpenses = expenses.filter((e: any) => e.projectId === client.projectId);
  const total = prjExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900">প্রজেক্ট ব্যয়</h1>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
          <CategoryIcon category="মোট ব্যয়" size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">মোট ব্যয়</div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{BDT(total)}</div>
        </div>
      </div>

      {prjExpenses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-sm">
          কোনো ব্যয় নেই
        </div>
      ) : (
        <div className="space-y-3">
          {[...prjExpenses].sort((a, b) => b.date.localeCompare(a.date)).map((e: any, i: number) => {
            return (
              <div key={e.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                <div 
                  className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", CategoryColor(e.category))}
                >
                  <CategoryIcon category={e.category} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900">{e.category}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">{e.description}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{e.date}</div>
                </div>
                <div className="text-base font-black shrink-0 text-slate-900">{BDT(e.amount)}</div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function ClientProfile({ client, onUpdateClient }: any) {
  const [old, setOld] = useState("");
  const [nw, setNw] = useState("");
  const [conf, setConf] = useState("");
  const [showO, setShowO] = useState(false);
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState<any>(null);
  
  const color = ac(client.id);
  
  const save = () => {
    setMsg(null);
    if (!old) return setMsg({ t: "e", v: "বর্তমান পাসওয়ার্ড লিখুন" });
    if (old !== client.password) return setMsg({ t: "e", v: "পাসওয়ার্ড ভুল" });
    if (!nw || nw.length < 4) return setMsg({ t: "e", v: "কমপক্ষে ৪ অক্ষর" });
    if (nw !== conf) return setMsg({ t: "e", v: "মিলছে না" });
    onUpdateClient({ ...client, password: nw });
    setOld(""); setNw(""); setConf("");
    setMsg({ t: "s", v: "পাসওয়ার্ড পরিবর্তন হয়েছে" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-5 mb-8">
          <ClientAvatar client={client} size={80} />
          <div>
            <div className="text-2xl font-black text-slate-900">{client.name}</div>
            <div className="text-sm font-medium text-slate-500 mt-1">প্লট: <span className="font-bold" style={{ color }}>{client.plot}</span></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            ["Customer ID", client.id], ["Phone", client.phone || "—"], 
            ["পিতা/স্বামী", client.fatherHusband || "—"], ["জন্ম", client.birthDate || "—"], 
            ["Email", client.email || "—"], ["NID", client.nid || "—"], 
            ["মোট মূল্য", BDT(client.totalAmount)]
          ].map(([l, v]) => (
            <div key={l} className="flex items-center py-2 border-b border-slate-100 last:border-0">
              <span className="text-xs font-bold text-slate-400 w-32 shrink-0">{l}</span>
              <span className="text-sm font-bold text-slate-900 flex-1">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <KeyRound size={20} />
          </div>
          <h2 className="text-lg font-black text-slate-900">পাসওয়ার্ড পরিবর্তন</h2>
        </div>
        
        <FG label="বর্তমান পাসওয়ার্ড">
          <div className="relative">
            <input 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all pr-12" 
              type={showO ? "text" : "password"} 
              value={old} onChange={e => setOld(e.target.value)} 
            />
            <button onClick={() => setShowO(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
              {showO ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </FG>
        
        <FG label="নতুন পাসওয়ার্ড">
          <div className="relative">
            <input 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all pr-12" 
              type={showN ? "text" : "password"} 
              value={nw} onChange={e => setNw(e.target.value)} 
            />
            <button onClick={() => setShowN(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
              {showN ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </FG>
        
        <FG label="নিশ্চিত করুন">
          <input 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" 
            type="password" 
            value={conf} onChange={e => setConf(e.target.value)} 
          />
        </FG>
        
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div className={cn(
                "p-4 rounded-xl mb-6 text-sm font-bold border",
                msg.t === "s" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
              )}>
                {msg.v}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors mt-2" onClick={save}>
          পরিবর্তন করুন
        </button>
      </div>
    </motion.div>
  );
}
