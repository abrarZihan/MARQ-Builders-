import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  X, 
  MoreVertical, 
  Banknote, 
  Landmark, 
  Wallet,
  Building,
  Tag,
  Calendar,
  FileText,
  BadgeCent,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import { BDT, cn, todayStr, ac } from "../lib/utils";
import { EXP_ICON, EXP_CATS } from "../lib/data";
import { CategoryIcon, CategoryColor } from "./Shared";
import { addDoc, collection, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ExpenseManagement({ projects, expenses, admin, preSelectProjectId, onClearPreSelect }: any) {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Handle pre-selection redirection
  useEffect(() => {
    if (preSelectProjectId) {
      setIsAddModalOpen(true);
    }
  }, [preSelectProjectId]);

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    onClearPreSelect && onClearPreSelect();
  };
  
  // Filters
  const [scopeFilter, setScopeFilter] = useState("all");
  const [destFilter, setDestFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
      const matchesSearch = 
        (e.description?.toLowerCase().includes(search.toLowerCase())) || 
        (e.voucherCode?.toLowerCase().includes(search.toLowerCase())) ||
        (e.category?.toLowerCase().includes(search.toLowerCase()));
      
      const matchesScope = scopeFilter === "all" || e.expenseScope === scopeFilter;
      const matchesDest = destFilter === "all" || e.destinationId === destFilter;
      const matchesMethod = methodFilter === "all" || e.paymentMethod === methodFilter;
      
      return matchesSearch && matchesScope && matchesDest && matchesMethod;
    }).sort((a: any, b: any) => b.date.localeCompare(a.date));
  }, [expenses, search, scopeFilter, destFilter, methodFilter]);

  const totalFiltered = filteredExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-app-text-primary">{t("nav.expense_mgnt")}</h1>
          <p className="text-xs font-medium text-app-text-muted mt-1">
            {t("common.records_count", { count: filteredExpenses.length })} · {t("common.total_paid")}: {BDT(totalFiltered, lang === "bn")}
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-app-tab-active text-app-bg px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all active:scale-95"
        >
          <Plus size={18} /> {t("expense.add_btn")}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
          <input 
            type="text" 
            placeholder={t("expense.search_ph")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-app-surface border border-app-border rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-tab-active/20"
          />
        </div>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className={cn(
            "p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm",
            isFilterOpen || scopeFilter !== "all" || destFilter !== "all" || methodFilter !== "all"
              ? "bg-app-tab-active/10 border-app-tab-active text-app-tab-active" 
              : "bg-app-surface border-app-border text-app-text-secondary"
          )}
        >
          <Filter size={18} />
          <span className="hidden sm:inline">{t("expense.filter")}</span>
          {(scopeFilter !== "all" || destFilter !== "all" || methodFilter !== "all") && (
            <div className="w-2 h-2 rounded-full bg-app-tab-active animate-pulse" />
          )}
        </button>
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-20 bg-app-surface rounded-3xl border border-app-border">
            <div className="w-16 h-16 bg-app-bg rounded-2xl flex items-center justify-center mx-auto mb-4 text-app-text-muted opacity-20">
              <Building2 size={32} />
            </div>
            <p className="text-sm font-bold text-app-text-muted">{t("common.no_records")}</p>
          </div>
        ) : (
          filteredExpenses.map((expense: any) => (
            <ExpenseCard key={expense.id} expense={expense} lang={lang} />
          ))
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        projects={projects}
        scopeFilter={scopeFilter}
        setScopeFilter={setScopeFilter}
        destFilter={destFilter}
        setDestFilter={setDestFilter}
        methodFilter={methodFilter}
        setMethodFilter={setMethodFilter}
      />

      {/* Add/Edit Modal */}
      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseModal}
        projects={projects}
        admin={admin}
        initialProjectId={preSelectProjectId}
      />
    </motion.div>
  );
}

function ExpenseCard({ expense, lang }: any) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper for method icons
  const MethodIcon = (method: string) => {
    switch(method) {
      case 'bank': return <Landmark size={14} />;
      case 'check': return <FileText size={14} />;
      case 'cash': return <Banknote size={14} />;
      default: return <Wallet size={14} />;
    }
  };

  return (
    <motion.div 
      layout
      className="bg-app-surface rounded-2xl border border-app-border transition-all overflow-hidden"
    >
      <div 
        className="p-4 cursor-pointer flex items-center gap-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", CategoryColor(expense.category))}>
          <CategoryIcon category={expense.category} size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-app-text-primary">{expense.category}</h3>
            <span className="shrink-0 text-[8px] font-black font-mono px-1.5 py-0.5 bg-app-bg text-app-text-muted rounded border border-app-border uppercase tracking-tighter">#{expense.id || "???"}</span>
            {expense.expenseScope === 'internal' && (
              <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[9px] font-black uppercase tracking-tighter border border-violet-500/20">
                {t("expense.scope_internal")}
              </span>
            )}
          </div>
          <p className="text-xs text-app-text-secondary font-medium mt-0.5 leading-relaxed">{expense.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-app-text-muted font-bold flex items-center gap-1">
              <Calendar size={10} /> {expense.date}
            </span>
            {expense.voucherCode && (
              <span className="text-[10px] text-app-text-muted font-bold flex items-center gap-1 uppercase">
                <Tag size={10} /> {expense.voucherCode}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-black text-app-text-primary">{BDT(expense.amount, lang === "bn")}</div>
          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] font-bold text-app-text-muted uppercase">
            {MethodIcon(expense.paymentMethod)} {t(`expense.method_${expense.paymentMethod || 'undefined'}`)}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-app-border bg-app-bg/30 px-4 py-3 text-xs"
          >
            <div className="grid grid-cols-2 gap-y-3">
              <div>
                <div className="text-app-text-muted font-bold uppercase tracking-widest mb-1 text-[9px]">
                  {t("expense.destination")}
                </div>
                <div className="font-bold text-app-text-secondary flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-app-tab-active" />
                  {expense.destinationLabel || expense.projectId || t("expense.office_others")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-app-text-muted font-bold uppercase tracking-widest mb-1 text-[9px]">
                  {t("common.details")}
                </div>
                <div className="font-medium text-app-text-secondary leading-relaxed">
                  {expense.description || "—"}
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-app-border/30 mt-1">
                {isConfirming ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-tight">{t("common.delete_confirm")}</span>
                    <div className="flex gap-2">
                       <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          setIsDeleting(true);
                          try {
                            await deleteDoc(doc(db, "expenses", expense.id));
                          } catch (err) {
                            console.error("Delete failed:", err);
                            alert("Delete failed. Check permissions.");
                            setIsDeleting(false);
                            setIsConfirming(false);
                          }
                        }}
                        disabled={isDeleting}
                        className="px-3 py-1 bg-rose-500 text-white rounded-lg font-black text-[9px] uppercase shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        {isDeleting ? "..." : t("common.yes_delete")}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsConfirming(false);
                        }}
                        className="px-3 py-1 bg-app-surface text-app-text-primary border border-app-border rounded-lg font-black text-[9px] uppercase active:scale-95"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirming(true);
                    }}
                    className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 group"
                  >
                    <X size={14} className="group-hover:rotate-90 transition-transform" /> 
                    <span className="text-[10px] uppercase tracking-wider">{t("project_detail.delete")}</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FilterDrawer({ 
  isOpen, 
  onClose, 
  projects,
  scopeFilter, setScopeFilter,
  destFilter, setDestFilter,
  methodFilter, setMethodFilter
}: any) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600]">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-sm transition-colors"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-xs bg-app-surface border-l border-app-border p-6 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-app-text-primary">{t("expense.filter")}</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-app-bg rounded-xl text-app-text-muted transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
              {/* Scope */}
              <div>
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-3 block">
                  {t("expense.scope")}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {['all', 'internal', 'client_update'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setScopeFilter(s)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all border",
                        scopeFilter === s 
                          ? "bg-app-tab-active border-app-tab-active text-app-bg" 
                          : "bg-app-bg border-app-border text-app-text-primary hover:border-app-text-muted/30"
                      )}
                    >
                      {s === 'all' ? t("expense.all") : t(`expense.scope_${s}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-3 block">
                  {t("expense.destination")}
                </label>
                <select 
                  value={destFilter}
                  onChange={(e) => setDestFilter(e.target.value)}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-text-primary focus:outline-none"
                >
                  <option value="all">{t("expense.all")}</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="office">{t("expense.office_others")}</option>
                </select>
              </div>

              {/* Method */}
              <div>
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-3 block">
                  {t("expense.payment_method")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'bank', 'check', 'cash'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setMethodFilter(m)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl font-bold text-xs transition-all border",
                        methodFilter === m 
                          ? "bg-app-tab-active border-app-tab-active text-app-bg" 
                          : "bg-app-bg border-app-border text-app-text-secondary hover:border-app-text-muted/30"
                      )}
                    >
                      {m === 'all' ? t("expense.all") : t(`expense.method_${m}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-app-border grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  setScopeFilter("all");
                  setDestFilter("all");
                  setMethodFilter("all");
                }}
                className="py-3 rounded-2xl bg-app-bg border border-app-border text-app-text-secondary font-bold text-sm hover:bg-app-surface transition-all"
              >
                Reset
              </button>
              <button 
                onClick={onClose}
                className="py-3 rounded-2xl bg-app-tab-active text-app-bg font-black text-sm shadow-lg hover:opacity-90 transition-all"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AddExpenseModal({ isOpen, onClose, projects, admin, initialProjectId }: any) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    voucherCode: "",
    amount: "",
    date: todayStr(),
    paymentMethod: "cash",
    expenseScope: "client_update",
    destinationId: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (initialProjectId) {
        setFormData(prev => ({ ...prev, destinationId: initialProjectId }));
      }
    } else {
      // Reset form when modal closes
      setFormData({
        category: "",
        description: "",
        voucherCode: "",
        amount: "",
        date: todayStr(),
        paymentMethod: "cash",
        expenseScope: "client_update",
        destinationId: ""
      });
    }
  }, [isOpen, initialProjectId]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.date || !formData.destinationId) {
      return alert(t("common.error_fill_all"));
    }

    setLoading(true);
    try {
      const destLabel = formData.destinationId === 'office' 
        ? t("expense.office_others") 
        : (projects.find((p: any) => p.id === formData.destinationId)?.name || "");

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        destinationLabel: destLabel,
        projectId: formData.destinationId !== 'office' ? formData.destinationId : null,
        createdAt: new Date().toISOString(),
        addedBy: admin?.id || "unknown"
      };

      await addDoc(collection(db, "expenses"), payload);
      onClose();
      setFormData({
        category: "",
        description: "",
        voucherCode: "",
        amount: "",
        date: todayStr(),
        paymentMethod: "cash",
        expenseScope: "client_update",
        destinationId: ""
      });
    } catch(err) {
      console.error(err);
      alert(t("common.error_occurred"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-app-surface rounded-3xl border border-app-border shadow-2xl p-6 sm:p-8 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-app-text-primary">{t("expense.add_btn")}</h2>
          <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-xl text-app-text-muted"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 block">
                {t("expense.scope")}
              </label>
              <div className="flex bg-app-bg p-1 rounded-xl border border-app-border">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, expenseScope: "client_update"})}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                    formData.expenseScope === "client_update" ? "bg-app-tab-active text-app-bg shadow-sm" : "text-app-text-muted"
                  )}
                >
                  {t("expense.scope_client_update")}
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, expenseScope: "internal"})}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                    formData.expenseScope === "internal" ? "bg-app-tab-active text-app-bg shadow-sm" : "text-app-text-muted"
                  )}
                >
                  {t("expense.scope_internal")}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 block">
                {t("expense.destination")}
              </label>
              <select 
                required
                value={formData.destinationId}
                onChange={(e) => setFormData({...formData, destinationId: e.target.value})}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm font-bold text-app-text-primary focus:outline-none"
              >
                <option value="">{t("project_modals.select")}</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                {formData.expenseScope === 'internal' && (
                  <option value="office">{t("expense.office_others")}</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 block">
                {t("expense.category")}
              </label>
              <select 
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm font-bold text-app-text-primary focus:outline-none"
              >
                <option value="">{t("project_modals.select")}</option>
                {EXP_CATS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 block">
                {t("expense.voucher_no")}
              </label>
              <input 
                type="text"
                value={formData.voucherCode}
                onChange={(e) => setFormData({...formData, voucherCode: e.target.value})}
                placeholder="EXP-123"
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm font-bold text-app-text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 block">
              {t("expense.description")}
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={2}
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm font-bold text-app-text-primary focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 block">
                {t("expense.amount")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted font-bold">৳</span>
                <input 
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-app-bg border border-app-border rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-app-text-primary focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 block">
                {t("expense.date")}
              </label>
              <input 
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm font-bold text-app-text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 block">
              {t("expense.payment_method")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "bank", icon: Landmark },
                { id: "check", icon: FileText },
                { id: "cash", icon: Banknote }
              ].map(m => (
                <button 
                  key={m.id}
                  type="button"
                  onClick={() => setFormData({...formData, paymentMethod: m.id})}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all",
                    formData.paymentMethod === m.id 
                      ? "bg-app-tab-active border-app-tab-active text-app-bg shadow-sm" 
                      : "bg-app-bg border-app-border text-app-text-muted hover:border-app-text-muted/30"
                  )}
                >
                  <m.icon size={18} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">{t(`expense.method_${m.id}`)}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-app-tab-active text-app-bg font-black py-4 rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "..." : <><Plus size={20} /> {t("expense.add_btn")}</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
