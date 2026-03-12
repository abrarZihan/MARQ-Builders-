import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import { 
  INIT_ADMINS, SP, SC, SD, SPA, SE, INIT_LOGS, 
  STATUS, STATUS_LABEL, EXP_CATS, ACTION_META 
} from "./lib/data";
import { 
  BDT, BDTshort, uid, todayStr, tsNow, fmtTs, genClientId, 
  clientPaidForDef, cellStatus, ac, initials, cn 
} from "./lib/utils";
import { 
  Badge, PBar, FG, ClientAvatar, PassCell, ConfirmDelete, 
  Drawer, BottomBar, Login, ForceChangePw 
} from "./components/Shared";
import { AuditLogPage, LogRow } from "./components/Admin";
import { AdminProfile, AdminManagePage } from "./components/AdminPages";
import { ProjectDetail } from "./components/ProjectDetail";
import { ClientInstallments, ClientReceipts, ClientExpenses, ClientProfile } from "./components/ClientPages";
import { Eye, EyeOff, ShieldPlus, KeyRound, Trash2, ShieldMinus, Building2, Wallet, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { CategoryIcon, CategoryColor } from "./components/Shared";

// --- Components that were in App.tsx ---

function PendingApprovals({ payments, clients, instDefs, projects, onApprove, onReject }: any) {
  const pending = payments.filter((p: any) => p.status === "pending");
  if (pending.length === 0) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
      <CheckCircle2 size={24} className="text-emerald-600" />
      <span className="text-sm font-bold text-emerald-700">কোনো pending payment নেই</span>
    </div>
  );
  return (
    <div className="mb-6">
      <div className="text-sm font-extrabold text-rose-600 mb-3 flex items-center gap-2">
        <span className="bg-rose-100 text-rose-600 rounded-full px-2.5 py-0.5 text-xs">{pending.length}</span>
        Pending Approval
      </div>
      {pending.map((p: any) => {
        const client = clients.find((c: any) => c.id === p.clientId);
        const def = instDefs.find((d: any) => d.id === p.instDefId);
        const prj = projects.find((pr: any) => pr.id === client?.projectId);
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            key={p.id} 
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-3"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-extrabold text-slate-900">{client?.name || p.clientId}</div>
                <div className="text-xs text-slate-500 mt-0.5">{prj?.name} · {def?.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.date}{p.note && ` · ${p.note}`}</div>
              </div>
              <div className="text-xl font-black text-amber-700">{BDT(p.amount)}</div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-emerald-100 text-emerald-700 font-bold py-2.5 rounded-xl hover:bg-emerald-200 transition-colors text-sm flex items-center justify-center gap-2" onClick={() => onApprove(p.id)}><CheckCircle2 size={16} /> Approve</button>
              <button className="flex-1 bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl hover:bg-rose-200 transition-colors text-sm flex items-center justify-center gap-2" onClick={() => onReject(p.id)}><XCircle size={16} /> Reject</button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function FinancialSummary({ projects, clients, instDefs, payments, expenses }: any) {
  const approvedPays = payments.filter((p: any) => p.status === "approved");
  const pendingPays = payments.filter((p: any) => p.status === "pending");
  const totalExpected = clients.reduce((s: number, c: any) => {
    const defs = instDefs.filter((d: any) => d.projectId === c.projectId);
    return s + defs.reduce((ds: number, d: any) => ds + d.targetAmount, 0);
  }, 0);
  const totalCollected = approvedPays.reduce((s: number, p: any) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalPending = pendingPays.reduce((s: number, p: any) => s + p.amount, 0);
  const totalDue = Math.max(0, totalExpected - totalCollected);
  const netProfit = totalCollected - totalExpenses;
  const collectPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <h1 className="text-xl font-black text-slate-900">আর্থিক সারসংক্ষেপ</h1>
        </div>
        <p className="text-xs font-medium text-slate-500">সামগ্রিক আর্থিক বিশ্লেষণ</p>
      </div>
      
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 mb-4 text-white shadow-xl">
        <div className="text-xs text-slate-400 font-bold mb-1 tracking-wider">NET PROFIT / LOSS</div>
        <div className={cn("text-4xl font-black tracking-tighter", netProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
          {netProfit >= 0 ? "+" : ""}{BDT(netProfit)}
        </div>
        <div className="text-xs text-slate-400 mt-2 font-medium">আদায় মাইনাস ব্যয়</div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">মোট প্রত্যাশিত</div>
          <div className="text-lg font-black text-slate-900 mt-1">{BDTshort(totalExpected)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">মোট আদায়</div>
          <div className="text-lg font-black text-emerald-600 mt-1">{BDTshort(totalCollected)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">মোট বাকি</div>
          <div className="text-lg font-black text-rose-600 mt-1">{BDTshort(totalDue)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">মোট ব্যয়</div>
          <div className="text-lg font-black text-violet-600 mt-1">{BDTshort(totalExpenses)}</div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-slate-900">আদায়ের অগ্রগতি</span>
          <span className="text-lg font-black text-blue-600">{collectPct}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
          <motion.div 
            initial={{ width: 0 }} animate={{ width: `${collectPct}%` }} 
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full" 
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>আদায়: {BDT(totalCollected)}</span>
          <span>বাকি: {BDT(totalDue)}</span>
        </div>
        {totalPending > 0 && (
          <div className="mt-4 text-xs text-amber-700 font-bold bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-center gap-2">
            <Clock size={14} /> Pending approval: {BDT(totalPending)}
          </div>
        )}
      </div>
      
      <div className="text-lg font-black text-slate-900 mb-4">প্রজেক্টভিত্তিক বিশ্লেষণ</div>
      
      {projects.map((prj: any, idx: number) => {
        const prjClients = clients.filter((c: any) => c.projectId === prj.id);
        const prjDefs = instDefs.filter((d: any) => d.projectId === prj.id);
        const prjExpenses = expenses.filter((e: any) => e.projectId === prj.id);
        const prjPays = approvedPays.filter((p: any) => prjClients.find((c: any) => c.id === p.clientId));
        
        const expected = prjClients.reduce((s: number, c: any) => s + prjDefs.reduce((ds: number, d: any) => ds + d.targetAmount, 0), 0);
        const collected = prjPays.reduce((s: number, p: any) => s + p.amount, 0);
        const spent = prjExpenses.reduce((s: number, e: any) => s + e.amount, 0);
        const due = Math.max(0, expected - collected);
        const net = collected - spent;
        const pct = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;
        
        const color = ac(prj.id);
        const catMap: Record<string, number> = {};
        prjExpenses.forEach((e: any) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
        const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
        
        return (
          <div key={prj.id} className="bg-white rounded-2xl border border-slate-200 p-5 mb-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: color }} />
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-base font-black text-slate-900">{prj.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{prjClients.length}জন client · {prjDefs.length}টি কিস্তি</div>
              </div>
              <span className={cn("text-sm font-black", net >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {net >= 0 ? "+" : ""}{BDTshort(net)}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-emerald-50 rounded-xl p-2.5">
                <div className="text-[9px] text-slate-500 font-bold uppercase">আদায়</div>
                <div className="text-sm font-black text-emerald-700 mt-0.5">{BDTshort(collected)}</div>
              </div>
              <div className="bg-rose-50 rounded-xl p-2.5">
                <div className="text-[9px] text-slate-500 font-bold uppercase">বাকি</div>
                <div className="text-sm font-black text-rose-700 mt-0.5">{BDTshort(due)}</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-2.5">
                <div className="text-[9px] text-slate-500 font-bold uppercase">ব্যয়</div>
                <div className="text-sm font-black text-violet-700 mt-0.5">{BDTshort(spent)}</div>
              </div>
            </div>
            
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xs text-slate-500 font-medium">আদায়ের অগ্রগতি</span>
              <span className="text-xs font-black" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ backgroundColor: color }} />
            </div>
            
            {topCats.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">TOP EXPENSES</div>
                {topCats.map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between items-center text-xs mb-1.5 text-slate-600">
                    <span className="font-medium flex items-center gap-1.5">
                      <div className={cn("w-5 h-5 rounded-md flex items-center justify-center", CategoryColor(cat))}>
                        <CategoryIcon category={cat} size={12} />
                      </div>
                      {cat}
                    </span>
                    <span className="font-bold text-slate-900">{BDT(amt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

function AdminHome({ projects, clients, payments, instDefs, expenses, onSelect, onAddProject, onDeleteProject, isSuperAdmin, onApprovePayment, onRejectPayment }: any) {
  const [addModal, setAddModal] = useState(false);
  const [delProject, setDelProject] = useState<any>(null);
  const [view, setView] = useState("projects");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  
  const allCollected = payments.filter((p: any) => p.status === "approved").reduce((s: number, p: any) => s + p.amount, 0);
  const pendingCount = payments.filter((p: any) => p.status === "pending").length;
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">MARQ Builders</h1>
          <p className="text-sm font-medium text-slate-500">{projects.length}টি প্রজেক্ট</p>
        </div>
        <button 
          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm" 
          onClick={() => setAddModal(true)}
        >
          + প্রজেক্ট
        </button>
      </div>
      
      <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6">
        <button 
          className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2", view === "projects" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")} 
          onClick={() => setView("projects")}
        >
          <Building2 size={16} /> প্রজেক্টসমূহ
        </button>
        <button 
          className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2", view === "financial" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")} 
          onClick={() => setView("financial")}
        >
          <Wallet size={16} /> Financial Summary
        </button>
      </div>
      
      {view === "financial" && <FinancialSummary projects={projects} clients={clients} instDefs={instDefs} payments={payments} expenses={expenses} />}
      
      {view === "projects" && (
        <>
          {isSuperAdmin && <PendingApprovals payments={payments} clients={clients} instDefs={instDefs} projects={projects} onApprove={onApprovePayment} onReject={onRejectPayment} />}
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                <Building2 size={20} />
              </div>
              <div className="text-xs text-slate-500 font-bold mb-1">মোট প্রজেক্ট</div>
              <div className="text-xl font-black text-slate-900">{projects.length}টি</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-center">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                <Wallet size={20} />
              </div>
              <div className="text-xs text-slate-500 font-bold mb-1">মোট আদায়</div>
              <div className="text-xl font-black text-slate-900">{BDTshort(allCollected)}</div>
            </div>
          </div>
          
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex justify-between items-center">
              <span className="text-sm font-bold text-amber-700 flex items-center gap-2"><Clock size={16} /> {pendingCount}টি payment pending</span>
              {!isSuperAdmin && <span className="text-xs font-medium text-amber-600">Super Admin approve করবেন</span>}
            </div>
          )}
          
          <div className="space-y-3">
            {projects.map((prj: any) => {
              const prjClients = clients.filter((c: any) => c.projectId === prj.id);
              const prjPaid = payments.filter((p: any) => p.status === "approved" && prjClients.find((c: any) => c.id === p.clientId)).reduce((s: number, p: any) => s + p.amount, 0);
              const color = ac(prj.id);
              
              return (
                <motion.div 
                  whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.95 }}
                  key={prj.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer shadow-sm hover:shadow-md transition-all" 
                  onClick={() => onSelect(prj.id)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20", color }}>
                      <Building2 size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-black text-slate-900 truncate">{prj.name}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">{prj.description}</div>
                    </div>
                    <div className="text-slate-300 flex items-center justify-center w-6 h-6">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: color + "15", color }}>{prjClients.length}জন</span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">{BDTshort(prjPaid)}</span>
                    </div>
                    <button 
                      className="text-rose-500 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" 
                      onClick={e => { e.stopPropagation(); setDelProject(prj); }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
      
      <AnimatePresence>
        {addModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={() => setAddModal(false)}>
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe" 
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="text-xl font-black text-slate-900 mb-6">নতুন প্রজেক্ট</div>
              <FG label="নাম">
                <input 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" 
                  placeholder="যেমন: MARQ Skyline" 
                  value={newName} onChange={e => setNewName(e.target.value)} 
                />
              </FG>
              <FG label="বিবরণ">
                <input 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" 
                  value={newDesc} onChange={e => setNewDesc(e.target.value)} 
                />
              </FG>
              <button 
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors mt-2" 
                onClick={() => {
                  if (newName.trim()) {
                    onAddProject({ id: uid("PRJ-"), name: newName.trim(), description: newDesc.trim() });
                    setAddModal(false); setNewName(""); setNewDesc("");
                  }
                }}
              >
                যোগ করুন
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {delProject && (
          <ConfirmDelete 
            message={<><b>{delProject.name}</b> এবং সব ক্লাইন্ট, কিস্তি ও ব্যয় মুছে যাবে।</>} 
            onConfirm={() => { onDeleteProject(delProject.id); setDelProject(null); }} 
            onClose={() => setDelProject(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ROOT APP COMPONENT
export default function App() {
  const [auth, setAuth] = useState<any>(null);
  const [page, setPage] = useState("home");
  const [projects, setProjects] = useState(SP);
  const [clients, setClients] = useState(SC);
  const [instDefs, setInstDefs] = useState(SD);
  const [payments, setPayments] = useState(SPA);
  const [expenses, setExpenses] = useState(SE);
  const [admins, setAdmins] = useState(INIT_ADMINS);
  const [logs, setLogs] = useState(INIT_LOGS);
  const [drawer, setDrawer] = useState(false);
  const [selProject, setSelProject] = useState<string | null>(null);
  const [forceChangePw, setForceChangePw] = useState(false);

  const addLog = (adminUser: any, action: string, target: string, detail: string, projectId: string | null = null) => {
    setLogs(prev => [{ id: uid("LOG"), adminId: adminUser.id, adminName: adminUser.name, action, target, detail: detail || "", projectId, ts: tsNow() }, ...prev]);
  };

  const login = (role: string, user: any) => {
    setAuth({ role, user });
    if (role === "admin" && user.isTemp) { setForceChangePw(true); return; }
    setPage(role === "admin" ? "home" : "installments");
  };
  
  const logout = () => { setAuth(null); setPage("home"); setSelProject(null); setForceChangePw(false); };

  const isSuperAdmin = auth?.user?.role === "superadmin";
  const adminUser = auth?.role === "admin" ? auth.user : null;

  // Client CRUD
  const updateClient = (c: any, oldId: string) => {
    setClients(x => x.map(cl => cl.id === (oldId || c.id) ? c : cl));
    if (oldId && oldId !== c.id) {
      setPayments(x => x.map(p => p.clientId === oldId ? { ...p, clientId: c.id } : p));
      addLog(adminUser, "client_id_change", `${oldId} → ${c.id}`, `${c.name} এর ID পরিবর্তন`, c.projectId);
    } else {
      addLog(adminUser, "client_edit", `${c.id} - ${c.name}`, "তথ্য আপডেট", c.projectId);
    }
    if (auth?.role === "client" && auth.user?.id === (oldId || c.id)) setAuth((a: any) => ({ ...a, user: c }));
  };
  
  const addClient = (c: any) => {
    if (clients.find(cl => cl.id === c.id)) { alert("এই ID আছে"); return; }
    setClients(x => [...x, c]);
    addLog(adminUser, "client_add", `${c.id} - ${c.name}`, "নতুন ক্লাইন্ট", c.projectId);
  };
  
  const deleteClient = (id: string) => {
    const c = clients.find(cl => cl.id === id);
    setClients(x => x.filter(cl => cl.id !== id));
    if (c) addLog(adminUser, "client_delete", `${c.id} - ${c.name}`, "মুছে ফেলা হয়েছে", c.projectId);
  };
  
  const addBulkClients = (bulk: any[]) => {
    setClients(prev => { 
      const map = new Map(prev.map(c => [c.id, c])); 
      bulk.forEach(c => map.set(c.id, { ...((map.get(c.id) as any) || {}), ...c })); 
      return Array.from(map.values()); 
    });
    addLog(adminUser, "client_add", `${bulk.length}জন ক্লাইন্ট`, "Bulk import");
  };

  // Project CRUD
  const addProject = (p: any) => { setProjects(x => [...x, p]); addLog(adminUser, "project_add", p.name, "নতুন প্রজেক্ট"); };
  const deleteProject = (id: string) => {
    const prj = projects.find(p => p.id === id);
    const ids = clients.filter(c => c.projectId === id).map(c => c.id);
    setProjects(x => x.filter(p => p.id !== id));
    setClients(x => x.filter(c => c.projectId !== id));
    setInstDefs(x => x.filter(d => d.projectId !== id));
    setExpenses(x => x.filter(e => e.projectId !== id));
    setPayments(x => x.filter(p => !ids.includes(p.clientId)));
    if (prj) addLog(adminUser, "project_delete", prj.name, "মুছে ফেলা হয়েছে");
  };

  // InstDef CRUD
  const addInstDef = (d: any) => {
    setInstDefs(x => [...x, d]);
    const prj = projects.find(p => p.id === d.projectId);
    addLog(adminUser, "instdef_add", d.title, `${prj?.name || ""} · ৳${d.targetAmount}`, d.projectId);
  };
  const deleteInstDef = (id: string, projectId: string) => {
    const d = instDefs.find(x => x.id === id);
    setInstDefs(x => x.filter(x => x.id !== id));
    if (d) addLog(adminUser, "instdef_delete", d.title, "কিস্তি কলাম মুছে ফেলা হয়েছে", projectId);
  };

  // Payment CRUD
  const addPayment = (p: any) => {
    setPayments(x => [...x, p]);
    const c = clients.find(cl => cl.id === p.clientId);
    const d = instDefs.find(di => di.id === p.instDefId);
    const action = p.status === "approved" ? "payment_add" : "payment_pending";
    addLog(adminUser, action, `${c?.id} - ${c?.name}`, `${BDT(p.amount)} — ${d?.title}${p.status === "pending" ? " (pending)" : ""}`, c?.projectId);
  };
  const deletePayment = (id: string) => {
    const p = payments.find(x => x.id === id);
    setPayments(x => x.filter(x => x.id !== id));
    if (p) {
      const c = clients.find(cl => cl.id === p.clientId);
      const d = instDefs.find(di => di.id === p.instDefId);
      addLog(adminUser, "payment_delete", `${c?.name || p.clientId}`, `${BDT(p.amount)} — ${d?.title}`, c?.projectId);
    }
  };
  const approvePayment = (id: string) => {
    const p = payments.find(x => x.id === id);
    setPayments(x => x.map(pay => pay.id === id ? { ...pay, status: "approved", approvedBy: adminUser.id } : pay));
    if (p) {
      const c = clients.find(cl => cl.id === p.clientId);
      const d = instDefs.find(di => di.id === p.instDefId);
      addLog(adminUser, "payment_approved", `${c?.name || p.clientId}`, `${BDT(p.amount)} — ${d?.title}`, c?.projectId);
    }
  };
  const rejectPayment = (id: string) => {
    const p = payments.find(x => x.id === id);
    setPayments(x => x.filter(pay => pay.id !== id));
    if (p) {
      const c = clients.find(cl => cl.id === p.clientId);
      const d = instDefs.find(di => di.id === p.instDefId);
      addLog(adminUser, "payment_rejected", `${c?.name || p.clientId}`, `${BDT(p.amount)} — ${d?.title}`, c?.projectId);
    }
  };

  // Expense CRUD
  const addExpense = (e: any) => {
    setExpenses(x => [...x, e]);
    const prj = projects.find(p => p.id === e.projectId);
    addLog(adminUser, "expense_add", prj?.name || e.projectId, `${e.category} · ${BDT(e.amount)}`, e.projectId);
  };
  const deleteExpense = (id: string) => {
    const e = expenses.find(x => x.id === id);
    setExpenses(x => x.filter(x => x.id !== id));
    if (e) addLog(adminUser, "expense_delete", e.category, BDT(e.amount), e.projectId);
  };

  // Admin CRUD
  const addAdmin = (adm: any) => { setAdmins(x => [...x, adm]); addLog(adminUser, "admin_add", adm.name, `@${adm.username}`); };
  const removeAdmin = (id: string) => { const adm = admins.find(a => a.id === id); setAdmins(x => x.filter(a => a.id !== id)); if (adm) addLog(adminUser, "admin_remove", adm.name, `@${adm.username}`); };
  const resetAdminPw = (id: string, tempPw: string) => { const adm = admins.find(a => a.id === id); setAdmins(x => x.map(a => a.id === id ? { ...a, password: tempPw, isTemp: true } : a)); if (adm) addLog(adminUser, "admin_reset_pw", adm.name, "Temporary password সেট"); };
  const updateAdminSelf = (updated: any) => { setAdmins(x => x.map(a => a.id === updated.id ? updated : a)); setAuth((a: any) => ({ ...a, user: updated })); addLog(updated, "pw_change", updated.name, "নিজের password পরিবর্তন"); };

  if (!auth) return <Login clients={clients} admins={admins} onLogin={login} />;
  const { role, user } = auth;

  if (forceChangePw && role === "admin") return (
    <ForceChangePw admin={user} onDone={(newPw: string, changed: boolean) => {
      const updated = { ...user, password: newPw, isTemp: false };
      setAdmins(x => x.map(a => a.id === user.id ? updated : a));
      setAuth((a: any) => ({ ...a, user: updated }));
      if (changed) addLog(updated, "pw_change", updated.name, "প্রথম login এ password পরিবর্তন");
      setForceChangePw(false); setPage("home");
    }} />
  );

  const curProject = selProject ? projects.find(p => p.id === selProject) : null;
  const PAGE_TITLES: Record<string, string> = { home: "প্রজেক্টসমূহ", log: "Activity Log", admins: "Admin ম্যানেজমেন্ট", profile: "প্রোফাইল", installments: "আমার কিস্তি", receipts: "রিসিপ্টসমূহ", expenses: "প্রজেক্ট ব্যয়" };
  const topTitle = curProject ? curProject.name : (PAGE_TITLES[page] || "");
  const pendingCount = payments.filter((p: any) => p.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 flex items-center px-4 gap-3 z-[100] shadow-md">
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg text-white tracking-tight">MARQ <span className="text-slate-400 font-bold">Builders</span></div>
          <div className="text-[11px] text-slate-400 font-bold tracking-wider uppercase truncate">{topTitle}</div>
        </div>
        {isSuperAdmin && pendingCount > 0 && (
          <div className="bg-rose-500 text-white rounded-full px-3 py-1 text-xs font-black shadow-sm flex items-center gap-1.5">
            <Clock size={12} /> {pendingCount}
          </div>
        )}
        <button 
          className="w-10 h-10 bg-white/10 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-colors" 
          onClick={() => setDrawer(true)}
        >
          <span className="w-5 h-0.5 bg-slate-300 rounded-full" />
          <span className="w-5 h-0.5 bg-slate-300 rounded-full" />
          <span className="w-5 h-0.5 bg-slate-300 rounded-full" />
        </button>
      </div>

      <Drawer 
        role={role} page={selProject ? "project" : page} setPage={(p: string) => { setPage(p); setSelProject(null); }} 
        user={user} onLogout={logout} open={drawer} onClose={() => setDrawer(false)} 
        isSuperAdmin={isSuperAdmin} pendingCount={pendingCount} 
      />

      <main className="pt-20 px-4 pb-24 max-w-4xl mx-auto">
        {role === "admin" && !selProject && page === "home" && (
          <AdminHome 
            projects={projects} clients={clients} payments={payments} instDefs={instDefs} expenses={expenses} 
            onSelect={(id: string) => setSelProject(id)} onAddProject={addProject} onDeleteProject={deleteProject} 
            isSuperAdmin={isSuperAdmin} onApprovePayment={approvePayment} onRejectPayment={rejectPayment} 
          />
        )}
        {role === "admin" && !selProject && page === "log" && <AuditLogPage logs={logs} projects={projects} />}
        
        {/* Placeholders for other components to avoid token limits, I will implement them in the next steps */}
        {role === "admin" && !selProject && page === "profile" && <AdminProfile adminUser={adminUser} onUpdate={(u: any) => { setAdmins(x => x.map(a => a.id === u.id ? u : a)); setAuth({ ...auth, user: u }); addLog(adminUser, "update", "Admin", `Updated own profile`); }} />}
        {role === "admin" && !selProject && page === "admins" && isSuperAdmin && <AdminManagePage admins={admins} onAdd={(a: any) => { setAdmins([...admins, a]); addLog(adminUser, "create", "Admin", `Added admin ${a.name}`); }} onUpdate={(a: any) => { setAdmins(x => x.map(ad => ad.id === a.id ? a : ad)); addLog(adminUser, "update", "Admin", `Updated admin ${a.name}`); }} onDelete={(id: string) => { setAdmins(x => x.filter(a => a.id !== id)); addLog(adminUser, "delete", "Admin", `Deleted admin ${id}`); }} />}
        {role === "admin" && selProject && curProject && (
          <ProjectDetail 
            project={curProject} clients={clients} allClients={clients} instDefs={instDefs} payments={payments} expenses={expenses} logs={logs} isSuperAdmin={isSuperAdmin}
            onBack={() => setSelProject(null)}
            onAddDef={(d: any) => { setInstDefs([...instDefs, d]); addLog(adminUser, "create", "Installment", `Added installment ${d.title}`, curProject.id); }}
            onDeleteInstDef={(id: string) => { setInstDefs(x => x.filter(d => d.id !== id)); addLog(adminUser, "delete", "Installment", `Deleted installment`, curProject.id); }}
            onAddPayment={(p: any) => { setPayments([...payments, p]); addLog(adminUser, "create", "Payment", `Recorded payment of ${BDT(p.amount)}`, curProject.id); }}
            onDeletePayment={(id: string) => { setPayments(x => x.filter(p => p.id !== id)); addLog(adminUser, "delete", "Payment", `Deleted payment`, curProject.id); }}
            onAddExpense={(e: any) => { setExpenses([...expenses, e]); addLog(adminUser, "create", "Expense", `Added expense ${BDT(e.amount)} for ${e.category}`, curProject.id); }}
            onDeleteExpense={(id: string) => { setExpenses(x => x.filter(e => e.id !== id)); addLog(adminUser, "delete", "Expense", `Deleted expense`, curProject.id); }}
            onUpdateClient={updateClient} onAddBulkClients={addBulkClients} onAddClient={addClient} onDeleteClient={deleteClient}
          />
        )}
        
        {role === "client" && page === "installments" && <ClientInstallments client={auth.user} instDefs={instDefs} payments={payments} />}
        {role === "client" && page === "receipts" && <ClientReceipts client={auth.user} instDefs={instDefs} payments={payments} />}
        {role === "client" && page === "expenses" && <ClientExpenses client={auth.user} expenses={expenses} />}
        {role === "client" && page === "profile" && <ClientProfile client={auth.user} onUpdateClient={(c: any) => { updateClient(c, c.id); setAuth({ ...auth, user: c }); }} />}
      </main>

      <BottomBar role={role} page={page} setPage={setPage} />
    </div>
  );
}
