import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BDT, dotJoin, uid, todayStr } from "../lib/utils";
import { FG, ConfirmDelete, PBar } from "./Shared";
import { EXP_CATS } from "../lib/data";
import { Trash2, Clock, Printer } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export function CellPaySheet({ client, instDef, payments, isSuperAdmin, onSave, onDelete, onClose }: any) {
  const { t } = useLanguage();
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
    if (!a || a <= 0) { setErr(t("project_modals.enter_valid_amount")); return; }
    if (a > rem) { setErr(t("project_modals.max_amount", { amount: BDT(rem) })); return; }
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
        <div className="text-xl font-black text-slate-900">{t("project_modals.payment_record")}</div>
        <div className="text-xs font-bold text-slate-500 mt-1 mb-6">{dotJoin(client.name, client.plot, instDef.title)}</div>
        
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <PBar paid={paid} target={instDef.targetAmount} />
          {rem > 0 && <div className="text-sm font-bold text-rose-600 mt-3">{t("project_modals.remaining", { amount: BDT(rem) })}</div>}
        </div>
        
        {approvedPays.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("project_modals.approved")}</div>
            {approvedPays.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-2">
                <span className="text-xs font-medium text-slate-700">{dotJoin(p.date, p.note)}</span>
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
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("project_modals.pending_approval")}</div>
            {pendingPays.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5"><Clock size={12} /> {dotJoin(p.date, p.note)}</span>
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
            <FG label={`${t("project_modals.amount_bdt")}${!isSuperAdmin ? t("project_modals.super_admin_approve") : ""}`}>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold" 
                type="number" inputMode="numeric" placeholder={t("project_modals.max_placeholder", { amount: rem.toString() })} 
                value={amount} onChange={e => { setAmount(e.target.value); setErr(""); }} 
              />
            </FG>
            {!isSuperAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 -mt-2 mb-4 text-xs font-bold text-amber-700 flex items-center gap-2">
                <Clock size={14} /> {t("project_modals.pending_msg")}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FG label={t("project_modals.date")}><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="date" value={date} onChange={e => setDate(e.target.value)} /></FG>
              <FG label={t("project_modals.note")}><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" placeholder={t("project_modals.optional")} value={note} onChange={e => setNote(e.target.value)} /></FG>
            </div>
            
            <AnimatePresence>
              {err && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="text-rose-600 text-sm font-bold mb-4 bg-rose-50 p-3 rounded-xl border border-rose-100">{err}</div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex gap-3 mt-2">
              <button className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" onClick={submit}>{isSuperAdmin ? t("project_modals.save_btn") : t("project_modals.submit_for_approval")}</button>
              <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>{t("project_modals.cancel")}</button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-emerald-600 font-black bg-emerald-50 rounded-2xl border border-emerald-100">
            {t("project_modals.fully_paid")}
          </div>
        )}
        
        <AnimatePresence>
          {delPay && (
            <ConfirmDelete 
              message={<><b>{BDT(delPay.amount)}</b> ({delPay.date}){t("project_modals.will_be_deleted")}</>} 
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
  const { t } = useLanguage();
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
        <div className="text-xl font-black text-slate-900 mb-6">{t("project_modals.new_installment_col")}</div>
        
        <FG label={t("project_modals.inst_name")}>
          <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold" placeholder={t("project_modals.inst_name_ph")} value={f.title} onChange={e => s("title", e.target.value)} />
        </FG>
        <div className="grid grid-cols-2 gap-4">
          <FG label={t("project_modals.target_bdt")}><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold" type="number" value={f.targetAmount} onChange={e => s("targetAmount", e.target.value)} /></FG>
          <FG label={t("project_modals.due_date")}><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="date" value={f.dueDate} onChange={e => s("dueDate", e.target.value)} /></FG>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button 
            className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" 
            onClick={() => {
              if (!f.title || !f.targetAmount) { alert(t("project_modals.add_inst_err")); return; }
              onSave({ id: uid("D-"), projectId, title: f.title, dueDate: f.dueDate, targetAmount: parseFloat(f.targetAmount) });
              onClose();
            }}
          >
            {t("project_modals.add")}
          </button>
          <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>{t("project_modals.cancel")}</button>
        </div>
      </motion.div>
    </div>
  );
}

export function AddExpSheet({ projectId, onSave, onClose }: any) {
  const { t } = useLanguage();
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
        <div className="text-xl font-black text-slate-900 mb-6">{t("project_modals.expense_add")}</div>
        
        <FG label={t("project_modals.category")}>
          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold appearance-none" value={f.category} onChange={e => s("category", e.target.value)}>
            <option value="">{t("project_modals.select")}</option>
            {EXP_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FG>
        <FG label={t("project_modals.description")}><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={f.description} onChange={e => s("description", e.target.value)} /></FG>
        <div className="grid grid-cols-2 gap-4">
          <FG label={t("project_modals.amount_bdt_simple")}><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-bold" type="number" value={f.amount} onChange={e => s("amount", e.target.value)} /></FG>
          <FG label={t("project_modals.date")}><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="date" value={f.date} onChange={e => s("date", e.target.value)} /></FG>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button 
            className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" 
            onClick={() => {
              if (!f.category || !f.amount) { alert(t("project_modals.expense_add_err")); return; }
              onSave({ id: uid("EX-"), projectId, ...f, amount: parseFloat(f.amount) });
              onClose();
            }}
          >
            {t("project_modals.add")}
          </button>
          <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>{t("project_modals.cancel")}</button>
        </div>
      </motion.div>
    </div>
  );
}

export function ReceiptSheet({ payment, instDef, client, onClose }: any) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[400] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden no-print" />
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">🏗️</div>
          <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">MARQ BUILDERS</div>
          <div className="text-xl font-black text-slate-900">{t("project_modals.payment_receipt")}</div>
          <div className="text-xs text-slate-400 font-mono mt-1">{payment.id}</div>
        </div>
        
        <div className="border-t-2 border-dashed border-slate-200 my-6" />
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6">
          {[
            [t("project_modals.client"), client?.name], [t("project_modals.plot"), client?.plot], 
            [t("project_modals.date"), payment.date], [t("project_modals.installment"), instDef?.title], 
            [t("project_modals.installment_price"), BDT(instDef?.targetAmount)]
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{k}</div>
              <div className="text-sm font-bold text-slate-900">{v}</div>
            </div>
          ))}
        </div>
        
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-5 text-center mb-6">
          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">{t("project_modals.paid_status")}</div>
          <div className="text-3xl font-black text-emerald-700">{BDT(payment.amount)}</div>
        </div>
        
        <div className="flex gap-3 no-print">
          <button 
            className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2" 
            onClick={() => window.print()}
          >
            <Printer size={18} /> {t("project_modals.print")}
          </button>
          <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>
            {t("project_modals.close")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
