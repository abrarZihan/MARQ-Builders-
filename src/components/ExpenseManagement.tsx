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
  ArrowRight,
  Edit2,
  Trash2
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
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState<any>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<any>(null);

  // Handle pre-selection redirection
  useEffect(() => {
    if (preSelectProjectId) {
      setIsAddModalOpen(true);
    }
  }, [preSelectProjectId]);

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setExpenseToEdit(null);
    onClearPreSelect && onClearPreSelect();
  };

  const handleEditExpenseClick = (expense: any) => {
    setSelectedExpenseForDetails(null);
    setExpenseToEdit(expense);
    setIsAddModalOpen(true);
  };
  
  // Filters
  const [scopeFilter, setScopeFilter] = useState("all");
  const [destFilter, setDestFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
      const matchesSearch = 
        (e.description?.toLowerCase().includes(search.toLowerCase())) || 
        (e.voucherCode?.toLowerCase().includes(search.toLowerCase())) ||
        (e.category?.toLowerCase().includes(search.toLowerCase()));
      
      const matchesScope = scopeFilter === "all" || e.expenseScope === scopeFilter;
      const matchesDest = destFilter === "all" || e.destinationId === destFilter;
      const matchesMethod = methodFilter === "all" || e.paymentMethod === methodFilter;
      
      const expenseDate = e.date; // YYYY-MM-DD
      const matchesStartDate = !startDate || expenseDate >= startDate;
      const matchesEndDate = !endDate || expenseDate <= endDate;
      
      return matchesSearch && matchesScope && matchesDest && matchesMethod && matchesStartDate && matchesEndDate;
    }).sort((a: any, b: any) => b.date.localeCompare(a.date));
  }, [expenses, search, scopeFilter, destFilter, methodFilter, startDate, endDate]);

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
            isFilterOpen || scopeFilter !== "all" || destFilter !== "all" || methodFilter !== "all" || startDate || endDate
              ? "bg-app-tab-active/10 border-app-tab-active text-app-tab-active" 
              : "bg-app-surface border-app-border text-app-text-secondary"
          )}
        >
          <Filter size={18} />
          <span className="hidden sm:inline">{t("expense.filter")}</span>
          {(scopeFilter !== "all" || destFilter !== "all" || methodFilter !== "all" || startDate || endDate) && (
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
            <ExpenseCard 
              key={expense.id} 
              expense={expense} 
              lang={lang} 
              onClick={() => setSelectedExpenseForDetails(expense)}
            />
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
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      {/* Add/Edit Modal */}
      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseModal}
        projects={projects}
        admin={admin}
        initialProjectId={preSelectProjectId}
        expenseToEdit={expenseToEdit}
      />

      {/* Expense Details & Options Popup */}
      <AnimatePresence mode="wait">
        {selectedExpenseForDetails && (
          <ExpenseDetailsModal
            isOpen={!!selectedExpenseForDetails}
            onClose={() => setSelectedExpenseForDetails(null)}
            expense={selectedExpenseForDetails}
            projects={projects}
            admin={admin}
            lang={lang}
            onEdit={handleEditExpenseClick}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExpenseCard({ expense, lang, onClick }: any) {
  const { t } = useLanguage();

  // Helper for method icons
  const MethodIcon = (method: string) => {
    switch(method) {
      case 'bank': return <Landmark size={14} />;
      case 'check': return <FileText size={14} />;
      case 'cash': return <Banknote size={14} />;
      default: return <Wallet size={14} />;
    }
  };

  // Stable 4-digit numeric fallback derived from the document ID if voucherCode is missing
  const getEasyVoucherFallback = (id: string) => {
    if (!id) return "1000";
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const code = Math.abs(hash) % 9000 + 1000; // Returns 1000-9999
    return code.toString();
  };

  const displayVoucher = expense.voucherCode && expense.voucherCode.trim()
    ? expense.voucherCode
    : getEasyVoucherFallback(expense.id);

  return (
    <motion.div 
      layout
      onClick={onClick}
      className="bg-app-surface rounded-2xl border border-app-border transition-all hover:border-app-text-muted/30 hover:shadow-md cursor-pointer overflow-hidden active:scale-[0.99] duration-150"
    >
      <div className="p-4 flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", CategoryColor(expense.category))}>
          <CategoryIcon category={expense.category} size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-app-text-primary">{expense.category}</h3>
            <span className="shrink-0 text-[8px] font-black font-mono px-1.5 py-0.5 bg-app-bg text-app-text-muted rounded border border-app-border uppercase tracking-tighter">#{displayVoucher}</span>
            {expense.expenseScope === 'internal' && (
              <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[9px] font-black uppercase tracking-tighter border border-violet-500/20">
                {t("expense.scope_internal")}
              </span>
            )}
          </div>
          <p className="text-xs text-app-text-secondary font-medium mt-0.5 leading-relaxed truncate" title={expense.description}>{expense.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-app-text-muted font-bold flex items-center gap-1">
              <Calendar size={10} /> {expense.date}
            </span>
            {displayVoucher && (
              <span className="text-[10px] text-app-text-muted font-bold flex items-center gap-1 uppercase">
                <Tag size={10} /> {displayVoucher}
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
    </motion.div>
  );
}

function ExpenseDetailsModal({ isOpen, onClose, expense, projects, admin, lang, onEdit }: any) {
  const { t } = useLanguage();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !expense) return null;

  // Helper for method icons
  const MethodIcon = (method: string) => {
    switch(method) {
      case 'bank': return <Landmark size={14} />;
      case 'check': return <FileText size={14} />;
      case 'cash': return <Banknote size={14} />;
      default: return <Wallet size={14} />;
    }
  };

  const getEasyVoucherFallback = (id: string) => {
    if (!id) return "1000";
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
       hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 9000 + 1000).toString();
  };

  const displayVoucher = expense.voucherCode && expense.voucherCode.trim()
    ? expense.voucherCode
    : getEasyVoucherFallback(expense.id);

  const destinationText = expense.destinationLabel || expense.projectId || t("expense.office_others");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "expenses", expense.id));
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed. Check permissions.");
    } finally {
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-app-surface rounded-3xl border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Color banner header representing category */}
        <div className={cn("p-6 text-white relative flex flex-col justify-end min-h-[120px]", CategoryColor(expense.category))}>
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={onClose} 
              className="p-1.5 bg-slate-900/20 hover:bg-slate-900/40 rounded-full text-white/90 transition-all focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-white/20 p-1.5 rounded-lg flex items-center justify-center">
              <CategoryIcon category={expense.category} size={20} />
            </div>
            <span className="text-xs font-black tracking-widest uppercase opacity-95">{expense.category}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-white/20 rounded border border-white/10 uppercase tracking-wide">
              VOUCHER #{displayVoucher}
            </span>
            {expense.expenseScope === 'internal' && (
              <span className="px-2 py-0.5 rounded bg-violet-600 text-white text-[10px] font-black uppercase tracking-wide border border-white/10">
                {t("expense.scope_internal")}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Main big amount visual */}
          <div className="text-center py-4 bg-app-bg rounded-2xl border border-app-border">
            <div className="text-xs font-bold text-app-text-muted mb-1 uppercase tracking-wider">
              {t("expense.amount")}
            </div>
            <div className="text-3xl font-black text-app-text-primary tracking-tight">
              {BDT(expense.amount, lang === "bn")}
            </div>
          </div>

          {/* Key-Value Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-app-bg/40 p-3 rounded-2xl border border-app-border/40">
              <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest block mb-1">
                {t("expense.destination")}
              </span>
              <div className="text-xs font-black text-app-text-secondary flex items-center gap-1.5">
                <Building2 size={14} className="text-app-tab-active shrink-0" />
                <span className="truncate">{destinationText}</span>
              </div>
            </div>

            <div className="bg-app-bg/40 p-3 rounded-2xl border border-app-border/40">
              <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest block mb-1">
                {t("expense.date")}
              </span>
              <div className="text-xs font-black text-app-text-secondary flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500 shrink-0" />
                <span>{expense.date}</span>
              </div>
            </div>

            <div className="bg-app-bg/40 p-3 rounded-2xl border border-app-border/40">
              <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest block mb-1">
                {t("expense.payment_method")}
              </span>
              <div className="text-xs font-black text-app-text-secondary flex items-center gap-1.5 capitalize">
                <span className="text-emerald-500 shrink-0">{MethodIcon(expense.paymentMethod)}</span>
                <span>{t(`expense.method_${expense.paymentMethod || 'undefined'}`)}</span>
              </div>
            </div>

            <div className="bg-app-bg/40 p-3 rounded-2xl border border-app-border/40">
              <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest block mb-1">
                {t("expense.voucher_no")}
              </span>
              <div className="text-xs font-black text-app-text-secondary flex items-center gap-1.5">
                <Tag size={14} className="text-violet-500 shrink-0" />
                <span>{displayVoucher}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block mb-1.5">
              {t("common.details")}
            </span>
            <div className="bg-app-bg/60 p-4 rounded-2xl border border-app-border text-xs font-medium text-app-text-secondary leading-relaxed break-words whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
              {expense.description || <span className="italic text-app-text-muted">{t("common.no_records") || "No notes"}</span>}
            </div>
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="border-t border-app-border bg-app-bg/30 p-6 flex items-center justify-between gap-3">
          {isConfirming ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-tight">{t("common.delete_confirm")}</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-500 text-white rounded-xl font-black text-xs uppercase shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? "..." : t("common.yes_delete")}
                </button>
                <button 
                  onClick={() => setIsConfirming(false)}
                  className="px-4 py-2 bg-app-surface text-app-text-primary border border-app-border rounded-xl font-black text-xs uppercase active:scale-95"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button 
                onClick={() => {
                  onEdit(expense);
                }}
                className="flex-1 bg-app-bg hover:bg-app-surface text-app-text-primary border border-app-border font-black py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-95"
              >
                <Edit2 size={16} className="text-app-tab-active" />
                <span>{t("common.edit") || "Edit"}</span>
              </button>

              <button 
                onClick={() => setIsConfirming(true)}
                className="px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black py-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 text-sm active:scale-95"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">{t("project_detail.delete") || "Delete"}</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function FilterDrawer({ 
  isOpen, 
  onClose, 
  projects,
  scopeFilter, setScopeFilter,
  destFilter, setDestFilter,
  methodFilter, setMethodFilter,
  startDate, setStartDate,
  endDate, setEndDate
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
              {/* Date Range */}
              <div>
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-3 block">
                  {t("expense.date")}
                </label>
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-bold text-app-text-muted mb-1 block uppercase">{t("expense.start_date")}</span>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm font-bold text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-tab-active/20"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-app-text-muted mb-1 block uppercase">{t("expense.end_date")}</span>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm font-bold text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-tab-active/20"
                    />
                  </div>
                </div>
              </div>

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
                  setStartDate("");
                  setEndDate("");
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

function AddExpenseModal({ isOpen, onClose, projects, admin, initialProjectId, expenseToEdit }: any) {
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
      if (expenseToEdit) {
        setFormData({
          category: expenseToEdit.category || "",
          description: expenseToEdit.description || "",
          voucherCode: expenseToEdit.voucherCode || "",
          amount: expenseToEdit.amount ? expenseToEdit.amount.toString() : "",
          date: expenseToEdit.date || todayStr(),
          paymentMethod: expenseToEdit.paymentMethod || "cash",
          expenseScope: expenseToEdit.expenseScope || "client_update",
          destinationId: expenseToEdit.destinationId || ""
        });
      } else if (initialProjectId) {
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
  }, [isOpen, initialProjectId, expenseToEdit]);

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

      const promoVoucher = (formData.voucherCode || "").trim()
        ? (formData.voucherCode || "").trim()
        : Math.floor(1000 + Math.random() * 9000).toString();

      if (expenseToEdit) {
        const payload = {
          ...formData,
          voucherCode: (formData.voucherCode || "").trim() 
            ? (formData.voucherCode || "").trim() 
            : (expenseToEdit.voucherCode || promoVoucher),
          amount: parseFloat(formData.amount),
          destinationLabel: destLabel,
          projectId: formData.destinationId !== 'office' ? formData.destinationId : null,
          createdAt: expenseToEdit.createdAt || new Date().toISOString(),
          addedBy: expenseToEdit.addedBy || admin?.id || "unknown",
          updatedAt: new Date().toISOString()
        };
        await updateDoc(doc(db, "expenses", expenseToEdit.id), payload);
      } else {
        const payload = {
          ...formData,
          voucherCode: promoVoucher,
          amount: parseFloat(formData.amount),
          destinationLabel: destLabel,
          projectId: formData.destinationId !== 'office' ? formData.destinationId : null,
          createdAt: new Date().toISOString(),
          addedBy: admin?.id || "unknown"
        };
        await addDoc(collection(db, "expenses"), payload);
      }
      onClose();
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
          <h2 className="text-xl font-black text-app-text-primary">
            {expenseToEdit ? (t("modal.edit_expense") || "Edit Expense") : t("expense.add_btn")}
          </h2>
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
            {loading ? "..." : <><Plus size={20} /> {expenseToEdit ? (t("common.save") || "Save") : t("expense.add_btn")}</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
