import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BDT, dotJoin, uid, todayStr, numberToWords, cn } from "../lib/utils";
import { FG, ConfirmDelete, PBar } from "./Shared";
import { EXP_CATS } from "../lib/data";
import { Trash2, Clock, Printer, FileText, CheckCircle2, X } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export function CellPaySheet({ client, instDef, payments, project, isSuperAdmin, onSave, onDelete, onClose }: any) {
  const { t } = useLanguage();
  const shareCount = client.shareCount || 1;
  const targetAmount = instDef.targetAmount * shareCount;
  const existPays = payments.filter((p: any) => p.clientId === client.id && p.instDefId === instDef.id);
  const approvedPays = existPays.filter((p: any) => p.status === "approved");
  const pendingPays = existPays.filter((p: any) => p.status === "pending");
  const paid = approvedPays.reduce((s: number, p: any) => s + p.amount, 0);
  const rem = Math.max(0, targetAmount - paid);
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [delPay, setDelPay] = useState<any>(null);
  const [viewR, setViewR] = useState<any>(null);

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
        <div className="text-xs font-bold text-slate-500 mt-1 mb-6">{dotJoin(client.name, client.plot, instDef.title)} {shareCount > 1 && <span className="text-blue-600">({shareCount} {t("client_info.shares")})</span>}</div>
        
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <PBar paid={paid} target={targetAmount} />
          {rem > 0 && <div className="text-sm font-bold text-rose-600 mt-3">{t("project_modals.remaining", { amount: BDT(rem) })}</div>}
        </div>
        
        {approvedPays.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("project_modals.approved")}</div>
            {approvedPays.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 mb-3 shadow-sm hover:border-emerald-200 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{BDT(p.amount)}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm" 
                    onClick={() => setViewR(p)}
                    title={t('common.view_receipt')}
                  >
                    <FileText size={16} />
                  </button>
                  {isSuperAdmin && (
                    <button 
                      className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm" 
                      onClick={() => setDelPay(p)}
                      title={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
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
          {viewR && (
            <ReceiptSheet payment={viewR} instDef={instDef} client={client} project={project} onClose={() => setViewR(null)} />
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

export function ReceiptSheet({ payment, instDef, client, project, hideOfficeCopy, onClose }: any) {
  const { t } = useLanguage();
  
  const DigitalReceipt = () => (
    <div className="p-6 bg-white sm:p-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-xl shadow-slate-200">🏗️</div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">MARQ BUILDERS</h2>
        <div className="h-1 w-12 bg-blue-600 rounded-full mt-2 mb-1" />
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">{t('modal.receipt')}</p>
      </div>

      <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-8 border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{t('common.amount_paid')}</div>
        <div className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{BDT(payment.amount)}</div>
        <div className="flex justify-center">
          <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" /> {t('common.approved')}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {[
          [t('common.receipt_id'), payment.id.split('-')[1] || payment.id, true],
          [t('common.date'), payment.date],
          [t('common.customer'), client?.name],
          [t('nav.projects'), project?.name],
          [t('common.installment'), instDef?.title]
        ].map(([l, v, mono]: any) => (
          <div key={l} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}</span>
            <span className={cn("text-sm font-bold text-slate-900", mono && "font-mono")}>{v}</span>
          </div>
        ))}
      </div>

      {payment.note && (
        <div className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-2">Note</p>
          <p className="text-xs text-blue-900/80 font-medium leading-relaxed italic">"{payment.note}"</p>
        </div>
      )}

      <div className="mt-10 pt-8 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Thank you for your payment</p>
        <p className="text-[9px] text-slate-300 font-medium">This is a digitally generated receipt.</p>
      </div>
    </div>
  );

  const ReceiptContent = ({ type }: { type: string }) => (
    <div className="relative p-10 bg-white text-slate-900 font-serif border-b border-dashed border-slate-300 last:border-0 print:border-b-0 print:h-[50vh] flex flex-col justify-between min-h-[600px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-3xl text-white shadow-lg">🏗️</div>
          <div>
            <div className="text-3xl font-black tracking-tighter leading-none mb-1">MARQ BUILDERS</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">216/8, Baganbari, North Vasantek Dhaka Cantt, Dhaka- 1206</div>
            <div className="text-[9px] font-medium text-slate-400 mt-0.5">Contact: +880 1XXX-XXXXXX | Email: info@marqbuilders.com</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-md uppercase tracking-[0.2em]">
            {type} Copy
          </div>
          <div className="text-[10px] font-bold text-slate-400">ID: {payment.id}</div>
        </div>
      </div>

      {/* Sl No & Date */}
      <div className="flex justify-between text-xs font-bold mb-10">
        <div className="flex items-end gap-2">
          <span className="text-slate-500 uppercase tracking-widest text-[10px]">Sl. No.</span>
          <span className="border-b-2 border-slate-900 min-w-[100px] inline-block px-2 text-sm">{payment.id.split('-')[1] || payment.id}</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-slate-500 uppercase tracking-widest text-[10px]">Date</span>
          <span className="border-b-2 border-slate-900 min-w-[140px] inline-block px-2 text-sm">{payment.date}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-12">
        <div className="inline-block relative">
          <span className="relative z-10 bg-white px-10 py-2 border-2 border-slate-900 font-black text-base uppercase tracking-[0.3em]">Money Receipt</span>
          <div className="absolute -inset-1 bg-slate-100 -z-10 translate-x-1 translate-y-1" />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-6 text-sm">
        <div className="flex gap-6">
          <div className="flex-1 flex items-end gap-3">
            <span className="whitespace-nowrap font-bold text-slate-500 uppercase text-[10px] tracking-widest">Name</span>
            <span className="flex-1 border-b border-slate-200 px-2 font-bold text-slate-900 pb-1">{client?.name}</span>
          </div>
          <div className="w-1/3 flex items-end gap-3">
            <span className="whitespace-nowrap font-bold text-slate-500 uppercase text-[10px] tracking-widest">Customer ID</span>
            <span className="flex-1 border-b border-slate-200 px-2 font-bold text-slate-900 pb-1">{client?.id}</span>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 flex items-end gap-3">
            <span className="whitespace-nowrap font-bold text-slate-500 uppercase text-[10px] tracking-widest">Project Name</span>
            <span className="flex-1 border-b border-slate-200 px-2 font-bold text-slate-900 pb-1">{project?.name || "N/A"}</span>
          </div>
          <div className="w-1/3 flex items-end gap-3">
            <span className="whitespace-nowrap font-bold text-slate-500 uppercase text-[10px] tracking-widest">Instalment</span>
            <span className="flex-1 border-b border-slate-200 px-2 font-bold text-slate-900 pb-1">{instDef?.title}</span>
          </div>
        </div>

        <div className="flex items-end gap-3 py-2">
          <span className="whitespace-nowrap font-bold text-slate-500 uppercase text-[10px] tracking-widest">Amount</span>
          <div className="flex-1 bg-slate-50 border-2 border-slate-900 px-4 py-2 font-black text-2xl flex items-center justify-between">
            <span>{BDT(payment.amount)}/-</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Taka Only</span>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <span className="whitespace-nowrap font-bold text-slate-500 uppercase text-[10px] tracking-widest">In Words</span>
          <span className="flex-1 border-b border-slate-200 px-2 font-bold text-slate-900 pb-1 italic capitalize">{numberToWords(payment.amount)} Taka Only</span>
        </div>

        <div className="flex items-end gap-3">
          <span className="whitespace-nowrap font-bold text-slate-500 uppercase text-[10px] tracking-widest">Method</span>
          <span className="flex-1 border-b border-slate-200 px-2 font-bold text-slate-900 pb-1">Cash / Cheque / Bank Transfer</span>
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="flex justify-between mt-20 pt-6 text-[9px] font-black uppercase tracking-[0.15em] text-center">
        <div className="w-40 border-t-2 border-slate-900 pt-2">Prepared By</div>
        <div className="w-40 border-t-2 border-slate-900 pt-2">Accounts Officer</div>
        <div className="w-40 border-t-2 border-slate-900 pt-2">Authorised Signature</div>
      </div>

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none -z-10">
        <div className="text-[150px] font-black rotate-[-25deg] tracking-tighter">MARQ</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[500] flex items-center justify-center backdrop-blur-md p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="bg-white w-full max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none relative" 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors z-10 no-print sm:flex hidden"
        >
          <X size={20} />
        </button>

        <div className="max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible custom-scrollbar">
          {/* Mobile/Screen View */}
          <div className="no-print">
            <DigitalReceipt />
          </div>

          {/* Print View (Hidden on screen, shown on print) */}
          <div className="hidden print:block">
            <ReceiptContent type="Customer" />
            {!hideOfficeCopy && (
              <>
                <div className="h-px border-b-2 border-dashed border-slate-200 my-8" />
                <ReceiptContent type="Office" />
              </>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 no-print sticky bottom-0">
          <button 
            className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-[0.98]" 
            onClick={() => window.print()}
          >
            <Printer size={18} /> {t("project_modals.print")}
          </button>
          <button 
            className="flex-1 bg-white text-slate-700 font-bold py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]" 
            onClick={onClose}
          >
            {t("project_modals.close")}
          </button>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
