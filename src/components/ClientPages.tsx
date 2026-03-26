import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BDT, ac, initials, todayStr, clientPaidForDef, cellStatus, cn, tsNow } from "../lib/utils";
import { FG, ClientAvatar, PBar, CategoryIcon, CategoryColor } from "./Shared";
import { STATUS } from "../lib/data";
import { ReceiptSheet } from "./ProjectModals";
import { Eye, EyeOff, Building2, CheckCircle2, Clock, KeyRound, FileText, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export function ClientInstallments({ client, instDefs, payments, projects }: any) {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<"combined" | "shares">("combined");
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prjDefs = instDefs.filter((d: any) => d.projectId === client.projectId);
  const shareCount = client.shareCount || 1;
  const totalPaid = payments.filter((p: any) => p.clientId === client.id && p.status === "approved").reduce((s: number, p: any) => s + p.amount, 0);
  const totalTarget = prjDefs.reduce((s: number, d: any) => s + d.targetAmount, 0) * shareCount;
  const today = todayStr();
  const color = ac(client.id);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const transactionId = params.get("transactionId");
    const amount = params.get("amount");
    const installmentNumber = params.get("installmentNumber");
    const clientName = params.get("clientName");

    if (payment === "success" && transactionId) {
      setPaymentResult({
        id: transactionId,
        amount: parseFloat(amount || "0"),
        date: todayStr(),
        instDefId: params.get("installmentId"),
        clientId: client.id,
        status: "approved",
        note: `Online Payment - Installment ${installmentNumber}`
      });
      // Clear URL params without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === "failed") {
      setErrorMsg(t('common.payment_failed_msg') || "Payment failed or was cancelled. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  }, [client.id, t]);

  const handlePayment = async (d: any, amount: number) => {
    setLoading(true);
    try {
      console.log('Initiating payment for installment:', d.id, 'amount:', amount);
      const response = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          installmentId: d.id, 
          clientId: client.id, 
          clientName: client.name,
          clientEmail: client.email,
          clientPhone: client.phone,
          installmentNumber: d.title
        })
      });
      
      console.log('Payment initiation response status:', response.status);
      const text = await response.text();
      console.log('Payment initiation response text:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON. Response text:", text);
        throw new Error(`Invalid server response: ${text.substring(0, 100)}`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Payment initiation failed:', data);
        setErrorMsg(t('common.payment_init_error') || "Failed to initiate payment. Please try again later.");
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setErrorMsg(t('common.payment_init_error') || "Failed to initiate payment. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 flex items-center gap-4 mb-4 shadow-sm">
        <ClientAvatar client={client} size={56} />
        <div className="flex-1 min-w-0">
          <div className="text-lg font-black text-slate-900 truncate">{client.name}</div>
          <div className="text-sm font-medium text-slate-500 mt-0.5">{t('client.plot')}: <span className="font-bold" style={{ color }}>{client.plot}</span> {shareCount > 1 && <span className="text-blue-600 font-bold">({shareCount} {t('client_info.shares')})</span>}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('common.total_price_label')}</div>
          <div className="text-base font-black text-slate-900">{BDT(client.totalAmount * shareCount)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 flex flex-col justify-center">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-2"><CheckCircle2 size={16} /></div>
          <div className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider mb-0.5">{t('common.paid')}</div>
          <div className="text-lg font-black text-emerald-700">{BDT(totalPaid)}</div>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 flex flex-col justify-center">
          <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-2"><Clock size={16} /></div>
          <div className="text-[10px] text-amber-600/80 font-bold uppercase tracking-wider mb-0.5">{t('common.due')}</div>
          <div className="text-lg font-black text-amber-700">{BDT(Math.max(0, totalTarget - totalPaid))}</div>
        </div>
      </div>

      {shareCount > 1 && (
        <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6">
          <button 
            className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", viewMode === "combined" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            onClick={() => setViewMode("combined")}
          >
            {t('client.view_combined')}
          </button>
          <button 
            className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", viewMode === "shares" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            onClick={() => setViewMode("shares")}
          >
            {t('client.view_per_share')}
          </button>
        </div>
      )}

      {prjDefs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-sm">
          {t('common.no_installments')}
        </div>
      )}

      <div className="space-y-6">
        {viewMode === "combined" ? (
          <div className="space-y-3">
            {prjDefs.map((d: any) => {
              const paid = clientPaidForDef(client.id, d.id, payments);
              const pendingAmt = payments.filter((p: any) => p.clientId === client.id && p.instDefId === d.id && p.status === "pending").reduce((s: number, p: any) => s + p.amount, 0);
              const target = d.targetAmount * shareCount;
              const st = cellStatus(paid, target);
              const isDue = d.dueDate && d.dueDate < today && paid < target;
              const m = STATUS[st];

              return (
                <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", m.dot)} />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-base font-black text-slate-900">{d.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-medium">{t('common.due')}: {d.dueDate || "—"}</span>
                        {isDue && <span className="bg-rose-100 text-rose-600 rounded-md px-2 py-0.5 text-[10px] font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Due</span>}
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", m.bg, m.text)}>
                      {st === "paid" ? t('common.status.paid') : st === "partial" ? t('common.status.partial') : t('common.status.unpaid')}
                    </span>
                  </div>
                  
                  <PBar paid={paid} target={target} />
                  
                  {target - paid > 0 && (
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-sm font-bold text-rose-600">{t('common.due')}: {BDT(target - paid)}</div>
                      <button 
                        disabled={loading}
                        className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                        onClick={() => handlePayment(d, target - paid)}
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : t('common.pay_now')}
                      </button>
                    </div>
                  )}
                  {pendingAmt > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <Clock size={14} /> {t('common.pending_approval_amount', { amount: BDT(pendingAmt) })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from({ length: shareCount }).map((_, j) => (
              <div key={j} className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black">{j + 1}</div>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-widest">{t('client_info.shares')} {j + 1}</div>
                </div>
                <div className="space-y-2">
                  {prjDefs.map((d: any) => {
                    const totalPaidForDef = clientPaidForDef(client.id, d.id, payments);
                    const sharePaid = Math.min(d.targetAmount, Math.max(0, totalPaidForDef - j * d.targetAmount));
                    const st = cellStatus(sharePaid, d.targetAmount);
                    const m = STATUS[st];
                    
                    return (
                      <div key={d.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900">{d.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{BDT(d.targetAmount)}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", m.bg, m.text)}>
                              {st === "paid" ? t('common.status.paid') : st === "partial" ? t('common.status.partial') : t('common.status.unpaid')}
                            </span>
                            <span className="text-xs font-black text-slate-900">{BDT(sharePaid)}</span>
                          </div>
                          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", m.bar)} style={{ width: `${(sharePaid / d.targetAmount) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-[500] bg-rose-50 border border-rose-200 p-4 rounded-2xl shadow-lg flex items-center gap-3 text-rose-700 font-bold text-sm"
          >
            <AlertCircle size={20} />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paymentResult && (
          <ReceiptSheet 
            payment={paymentResult} 
            instDef={instDefs.find((d: any) => d.id === paymentResult.instDefId)} 
            client={client} 
            project={projects.find((p: any) => p.id === client.projectId)} 
            hideOfficeCopy={true} 
            onClose={() => setPaymentResult(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ClientReceipts({ client, instDefs, payments, projects }: any) {
  const { t } = useLanguage();
  const [viewR, setViewR] = useState<any>(null);
  const myPays = [...payments.filter((p: any) => p.clientId === client.id && p.status === "approved")].sort((a, b) => b.date.localeCompare(a.date));
  const pendingPays = payments.filter((p: any) => p.clientId === client.id && p.status === "pending");
  const project = projects.find((p: any) => p.id === client.projectId);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">{t('common.receipts')}</h1>
          <p className="text-xs font-medium text-slate-500">{t('common.approved_count', { count: myPays.length })}</p>
        </div>
      </div>

      {pendingPays.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm font-bold text-amber-700 flex items-center gap-2">
          <Clock size={16} /> {t('common.pending_approval_count', { count: pendingPays.length })}
        </div>
      )}

      {myPays.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-sm">
          {t('common.no_approved_payments')}
        </div>
      ) : (
        <div className="space-y-3">
          {myPays.map((p: any) => {
            const def = instDefs.find((d: any) => d.id === p.instDefId);
            return (
              <motion.div 
                whileHover={{ scale: 0.98, y: -2 }} whileTap={{ scale: 0.95 }}
                key={p.id} 
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer group"
                onClick={() => setViewR(p)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 group-hover:w-2 transition-all" />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase mb-0.5">{p.id.split('-')[1] || p.id}</div>
                      <div className="text-base font-black text-slate-900 leading-tight">{def?.title || t('common.installment')}</div>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t('common.approved')}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t('common.amount_paid')}</div>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter">{BDT(p.amount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-bold mb-2">{p.date}</div>
                    <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-black uppercase tracking-wider group-hover:gap-2 transition-all">
                      {t('common.receipt_link')} <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewR && <ReceiptSheet payment={viewR} instDef={instDefs.find((d: any) => d.id === viewR.instDefId)} client={client} project={project} hideOfficeCopy={true} onClose={() => setViewR(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

export function ClientExpenses({ client, expenses }: any) {
  const { t } = useLanguage();
  const prjExpenses = expenses.filter((e: any) => e.projectId === client.projectId);
  const total = prjExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900">{t('common.project_expenses')}</h1>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
          <CategoryIcon category="মোট ব্যয়" size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('common.total_expenses')}</div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{BDT(total)}</div>
        </div>
      </div>

      {prjExpenses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-sm">
          {t('common.no_expenses')}
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
  const { t } = useLanguage();
  const [old, setOld] = useState("");
  const [nw, setNw] = useState("");
  const [conf, setConf] = useState("");
  const [showO, setShowO] = useState(false);
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState<any>(null);
  
  const color = ac(client.id);
  
  const save = () => {
    setMsg(null);
    if (!old) return setMsg({ t: "e", v: t('common.error_enter_current_pw') });
    if (old !== client.password) return setMsg({ t: "e", v: t('common.error_wrong_current_pw') });
    if (!nw || nw.length < 4) return setMsg({ t: "e", v: t('common.error_min_chars', { count: 4 }) });
    if (nw !== conf) return setMsg({ t: "e", v: t('common.error_pw_mismatch') });
    onUpdateClient({ ...client, password: nw });
    setOld(""); setNw(""); setConf("");
    setMsg({ t: "s", v: t('common.success_pw_changed') });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-5 mb-8">
          <ClientAvatar client={client} size={80} />
          <div>
            <div className="text-2xl font-black text-slate-900">{client.name}</div>
            <div className="text-sm font-medium text-slate-500 mt-1">{t('client.plot')}: <span className="font-bold" style={{ color }}>{client.plot}</span></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            [t('common.customer_id'), client.id], [t('common.phone'), client.phone || "—"], 
            [t('client.father_husband'), client.fatherHusband || "—"], [t('client.birth_date'), client.birthDate || "—"], 
            [t('client.email'), client.email || "—"], [t('client.nid'), client.nid || "—"], 
            [t('common.total_price_label'), BDT(client.totalAmount * (client.shareCount || 1))]
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
          <h2 className="text-lg font-black text-slate-900">{t('common.change_password')}</h2>
        </div>
        
        <FG label={t('common.current_password')}>
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
        
        <FG label={t('common.new_password')}>
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
        
        <FG label={t('common.confirm_password')}>
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
          {t('common.change_password')}
        </button>
      </div>
    </motion.div>
  );
}
