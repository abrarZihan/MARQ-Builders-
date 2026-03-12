import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BDT, BDTshort, ac, initials, uid, todayStr, cn } from "../lib/utils";
import { FG, ConfirmDelete } from "./Shared";
import { Eye, EyeOff, ShieldPlus, KeyRound, Trash2, ShieldMinus } from "lucide-react";

export function AdminProfile({ admin, onUpdate }: any) {
  const [old, setOld] = useState("");
  const [nw, setNw] = useState("");
  const [conf, setConf] = useState("");
  const [showO, setShowO] = useState(false);
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState<any>(null);
  
  const color = admin.role === "superadmin" ? "#f59e0b" : ac(admin.id);
  
  const save = () => {
    setMsg(null);
    if (!old) return setMsg({ t: "e", v: "বর্তমান পাসওয়ার্ড লিখুন" });
    if (old !== admin.password) return setMsg({ t: "e", v: "বর্তমান পাসওয়ার্ড ভুল" });
    if (!nw || nw.length < 4) return setMsg({ t: "e", v: "কমপক্ষে ৪ অক্ষর" });
    if (nw !== conf) return setMsg({ t: "e", v: "নতুন পাসওয়ার্ড মিলছে না" });
    onUpdate({ ...admin, password: nw, isTemp: false });
    setOld(""); setNw(""); setConf("");
    setMsg({ t: "s", v: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div 
            style={{ backgroundColor: color + "20", color }} 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0"
          >
            {initials(admin.name)}
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{admin.name}</div>
            <div className="text-sm font-bold text-slate-500 mt-1">@{admin.username}</div>
            <span className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold inline-block mt-3",
              admin.role === "superadmin" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            )}>
              {admin.role === "superadmin" ? "Super Admin" : "Admin"}
            </span>
          </div>
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
          পাসওয়ার্ড পরিবর্তন করুন
        </button>
      </div>
    </motion.div>
  );
}

export function AdminManagePage({ admins, onAdd, onRemove, onResetPw, currentAdminId }: any) {
  const [addModal, setAddModal] = useState(false);
  const [resetTarget, setReset] = useState<any>(null);
  const [delTarget, setDel] = useState<any>(null);
  const [tempPw, setTempPw] = useState("");
  const [newF, setNewF] = useState({ name: "", username: "", password: "" });
  
  const s = (k: string, v: string) => setNewF(p => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Admin ম্যানেজমেন্ট</h1>
          <p className="text-xs font-medium text-slate-500">{admins.length}জন Admin</p>
        </div>
        <button 
          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2" 
          onClick={() => setAddModal(true)}
        >
          <ShieldPlus size={18} />
          Admin যোগ
        </button>
      </div>

      <div className="space-y-3">
        {admins.map((adm: any) => {
          const isSelf = adm.id === currentAdminId;
          const isSuper = adm.role === "superadmin";
          const color = isSuper ? "#f59e0b" : ac(adm.id);
          
          return (
            <div key={adm.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
              <div 
                style={{ backgroundColor: color + "20", color }} 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
              >
                {initials(adm.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-base font-extrabold text-slate-900">{adm.name}</span>
                  {isSelf && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">আপনি</span>}
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold",
                    isSuper ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {isSuper ? "Super Admin" : "Admin"}
                  </span>
                  {adm.isTemp && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-600">Temp PW</span>}
                </div>
                <div className="text-xs font-bold text-slate-400">@{adm.username}</div>
              </div>
              {!isSuper && (
                <div className="flex gap-2">
                  <button 
                    className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-100 transition-colors" 
                    onClick={() => { setReset(adm); setTempPw(""); }}
                  >
                    <KeyRound size={18} />
                  </button>
                  {!isSelf && (
                    <button 
                      className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors" 
                      onClick={() => setDel(adm)}
                    >
                      <ShieldMinus size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
              <div className="text-xl font-black text-slate-900 mb-6">নতুন Admin যোগ</div>
              
              <FG label="পূর্ণ নাম">
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={newF.name} onChange={e => s("name", e.target.value)} />
              </FG>
              <div className="grid grid-cols-2 gap-4">
                <FG label="Username">
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={newF.username} onChange={e => s("username", e.target.value)} />
                </FG>
                <FG label="Temp Password">
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={newF.password} onChange={e => s("password", e.target.value)} />
                </FG>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" 
                  onClick={() => {
                    if (!newF.name || !newF.username || !newF.password) { alert("সব তথ্য দিন"); return; }
                    onAdd({ id: uid("adm-"), name: newF.name, username: newF.username, password: newF.password, role: "admin", isTemp: true });
                    setAddModal(false); setNewF({ name: "", username: "", password: "" });
                  }}
                >
                  যোগ করুন
                </button>
                <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={() => setAddModal(false)}>বাতিল</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetTarget && (
          <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={() => setReset(null)}>
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe" 
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="text-xl font-black text-slate-900 mb-6">Password Reset — {resetTarget.name}</div>
              
              <FG label="নতুন Temporary Password">
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={tempPw} onChange={e => setTempPw(e.target.value)} />
              </FG>
              
              <div className="flex gap-3 mt-4">
                <button 
                  className="flex-1 bg-orange-100 text-orange-700 font-bold py-3.5 rounded-xl hover:bg-orange-200 transition-colors" 
                  onClick={() => {
                    if (!tempPw) { alert("পাসওয়ার্ড লিখুন"); return; }
                    onResetPw(resetTarget.id, tempPw);
                    setReset(null);
                  }}
                >
                  Reset করুন
                </button>
                <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={() => setReset(null)}>বাতিল</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {delTarget && (
          <ConfirmDelete 
            message={<><b>{delTarget.name}</b> (@{delTarget.username}) কে remove করবেন?</>} 
            onConfirm={() => { onRemove(delTarget.id); setDel(null); }} 
            onClose={() => setDel(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
