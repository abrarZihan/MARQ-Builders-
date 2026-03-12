import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import { BDT, BDTshort, ac, initials, uid, todayStr, cn, genClientId } from "../lib/utils";
import { FG, ConfirmDelete, ClientAvatar, PassCell } from "./Shared";
import { Trash2, Eye, EyeOff, Edit2, Camera } from "lucide-react";

export function ClientInfoPage({ clients, allClients, onUpdate, onAddBulk, onAddSingle, onDelete, projectId }: any) {
  const [search, setSearch] = useState("");
  const [editClient, setEditClient] = useState<any>(null);
  const [viewClient, setViewClient] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [importSheet, setImportSheet] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = clients.filter((c: any) => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q) || c.phone?.includes(q) || c.nid?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const wb = XLSX.read(e.target?.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const importResults: any[] = [];
      const mapped = rows.map((r: any, i: number) => {
        const usedKeys = new Set<string>();
        const get = (targetKeys: string[]) => {
          for (const k of targetKeys) {
            const foundKey = Object.keys(r).find(rk => {
              const normalized = rk.toLowerCase().replace(/[\s_]/g, "");
              return normalized === k || normalized.includes(k);
            });
            if (foundKey && r[foundKey]) {
              usedKeys.add(foundKey);
              return String(r[foundKey]);
            }
          }
          return "";
        };

        const phone = get(["phone", "mobile", "contact", "cell", "number"]);
        const id = get(["customerid", "clientid", "id", "sl", "serial"]) || phone || genClientId([...allClients, ...importResults]);
        
        const client: any = {
          id,
          name: get(["customername", "name", "fullname", "clientname"]),
          fatherHusband: get(["father", "husband", "parent", "guardian"]),
          birthDate: get(["birth", "dob", "dateofbirth"]),
          phone,
          email: get(["email", "mail", "gmail"]),
          nid: get(["nid", "nationalid", "national"]),
          plot: get(["plot", "flat", "unit", "apartment", "plotno", "flatno"]),
          totalAmount: parseFloat(get(["totalamount", "amount", "price", "total", "value"])) || 0,
          password: "1234",
          photo: "",
          projectId,
          remarks: "",
          _row: i + 2
        };

        // Collect all other columns into remarks
        const otherInfo: string[] = [];
        Object.keys(r).forEach(key => {
          if (!usedKeys.has(key) && r[key]) {
            otherInfo.push(`${key}: ${r[key]}`);
          }
        });
        if (otherInfo.length > 0) {
          client.remarks = otherInfo.join(" | ");
        }

        if (client.name) importResults.push(client);
        return client;
      }).filter(r => r.name);
      setImportData(mapped);
      setImportSheet(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const newTpl = {
    __new: true, id: genClientId(allClients), name: "", fatherHusband: "", birthDate: "",
    phone: "", email: "", nid: "", plot: "", totalAmount: "", photo: "", projectId, password: "1234", remarks: ""
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">ক্লাইন্ট তথ্য</h1>
          <p className="text-xs font-medium text-slate-500">{clients.length}জন</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm" 
            onClick={() => fileRef.current?.click()}
          >
            📥 Import
          </button>
          <button 
            className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm" 
            onClick={() => setEditClient(newTpl)}
          >
            + ক্লাইন্ট
          </button>
        </div>
      </div>
      
      <input 
        ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" 
        onChange={e => { if (e.target.files?.[0]) parseFile(e.target.files[0]); e.target.value = ""; }} 
      />
      
      <input 
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all mb-4" 
        placeholder="নাম, আইডি, ফোন বা NID..." 
        value={search} onChange={e => setSearch(e.target.value)} 
      />
      
      <div className="overflow-x-auto overflow-y-auto max-h-[60vh] rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="bg-slate-900 text-white p-3 text-center w-10 font-bold border-r border-white/10">SL</th>
              <th className="bg-slate-900 text-white p-3 w-12 font-bold border-r border-white/10">Photo</th>
              <th className="bg-slate-900 text-white p-3 text-left font-bold border-r border-white/10">Customer ID</th>
              <th className="bg-slate-900 text-white p-3 text-left font-bold border-r border-white/10">Name</th>
              <th className="bg-slate-900 text-white p-3 text-left font-bold border-r border-white/10">Father/Husband</th>
              <th className="bg-slate-900 text-white p-3 text-left font-bold border-r border-white/10">Birth Date</th>
              <th className="bg-slate-900 text-white p-3 text-left font-bold border-r border-white/10">Phone (Username)</th>
              <th className="bg-slate-900 text-white p-3 text-left font-bold border-r border-white/10">Password</th>
              <th className="bg-slate-900 text-white p-3 text-left font-bold border-r border-white/10">Email</th>
              <th className="bg-slate-900 text-white p-3 text-left font-bold border-r border-white/10">NID</th>
              <th className="bg-slate-900 text-white p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="text-center py-12 text-slate-400 font-bold">কোনো ক্লাইন্ট নেই</td></tr>
            )}
            {filtered.map((c: any, i: number) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <td className="p-3 text-center text-slate-400 font-medium">{i + 1}</td>
                <td className="p-3"><ClientAvatar client={c} size={34} /></td>
                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded-md font-mono text-[10px] font-bold text-slate-600">{c.id}</span></td>
                <td className="p-3 font-bold text-slate-900">{c.name || "—"}</td>
                <td className="p-3 text-slate-500 font-medium">{c.fatherHusband || "—"}</td>
                <td className="p-3 text-slate-500 font-medium whitespace-nowrap">{c.birthDate || "—"}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900">{c.phone || "—"}</span>
                    <span className="text-[9px] text-slate-400 font-bold tracking-wider">USERNAME</span>
                  </div>
                </td>
                <td className="p-3"><PassCell value={c.password || "1234"} /></td>
                <td className="p-3 text-blue-600 font-medium">{c.email || "—"}</td>
                <td className="p-3"><span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-mono text-[10px] font-bold">{c.nid || "—"}</span></td>
                <td className="p-3">
                  <div className="flex gap-1.5 justify-center">
                    <button className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors" onClick={() => setViewClient(c)}><Eye size={14} /></button>
                    <button className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors" onClick={() => setEditClient({ ...c })}><Edit2 size={14} /></button>
                    <button className="w-7 h-7 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-200 transition-colors" onClick={() => setDeleteTarget(c)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
        <span className="font-bold">🔐 Username = Phone · Default Password = 1234</span> · ID change করলে সব payment data migrate হয়
      </div>

      <AnimatePresence>
        {viewClient && <ClientDetailSheet client={viewClient} onClose={() => setViewClient(null)} onEdit={(c: any) => { setViewClient(null); setEditClient({ ...c }); }} />}
        {editClient && <ClientEditSheet client={editClient} allClients={allClients} onSave={(c: any, oldId: string) => { if (c.__new) { onAddSingle(c); } else { onUpdate(c, oldId); } setEditClient(null); }} onClose={() => setEditClient(null)} />}
        {importSheet && importData && <ImportPreviewSheet data={importData} onConfirm={() => { onAddBulk(importData); setImportSheet(false); setImportData(null); }} onClose={() => { setImportSheet(false); setImportData(null); }} />}
        {deleteTarget && <ConfirmDelete message={<><b>{deleteTarget.name}</b> ({deleteTarget.id}) মুছে যাবে।</>} onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function ClientDetailSheet({ client, onClose, onEdit }: any) {
  const [showPass, setShowPass] = useState(false);
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[400] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
        
        <div className="flex items-center gap-4 mb-6">
          <ClientAvatar client={client} size={64} />
          <div>
            <div className="text-xl font-black text-slate-900">{client.name}</div>
            <div className="text-sm font-medium text-slate-500 mt-1">{client.phone} · {client.plot}</div>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          {[
            ["Customer ID", client.id], ["নাম", client.name], ["পিতা/স্বামী", client.fatherHusband], 
            ["জন্ম", client.birthDate], ["Phone", client.phone], ["Email", client.email], 
            ["NID", client.nid], ["প্লট", client.plot], ["মোট মূল্য", BDT(client.totalAmount)],
            ["মন্তব্য (Remarks)", client.remarks]
          ].map(([l, v]) => (
            <div key={l} className="flex items-center py-2 border-b border-slate-100 last:border-0">
              <span className="text-xs font-bold text-slate-400 w-32 shrink-0">{l}</span>
              <span className="text-sm font-bold text-slate-900 flex-1">{v || "—"}</span>
            </div>
          ))}
          <div className="flex items-center py-2 border-b border-slate-100 last:border-0">
            <span className="text-xs font-bold text-slate-400 w-32 shrink-0">Password</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold tracking-widest text-slate-900">{showPass ? client.password : "••••••"}</span>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2" onClick={() => onEdit(client)}><Edit2 size={16} /> Edit</button>
          <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>বন্ধ</button>
        </div>
      </motion.div>
    </div>
  );
}

function ClientEditSheet({ client, allClients, onSave, onClose }: any) {
  const isNew = !!client.__new;
  const originalId = client.id;
  const [f, setF] = useState({ ...client });
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);
  const [preview, setPreview] = useState(client.photo || "");
  const [showPass, setShowPass] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  
  const s = (k: string, v: string) => {
    setF((p: any) => {
      const next = { ...p, [k]: v };
      // If it's a new client, phone is being updated, and ID hasn't been manually edited
      if (isNew && k === "phone" && !idManuallyEdited) {
        next.id = v || client.id; // Fallback to original generated ID if phone is cleared
      }
      return next;
    });
  };

  const handleIdChange = (v: string) => {
    setIdManuallyEdited(true);
    s("id", v);
  };
  
  const handlePhoto = (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); 
    r.onload = ev => { setPreview(ev.target?.result as string); s("photo", ev.target?.result as string); }; 
    r.readAsDataURL(file);
  };
  
  const idChanged = !isNew && f.id !== originalId;
  
  const submit = () => {
    if (!f.name) { alert("নাম আবশ্যিক"); return; }
    if (!f.id) { alert("ID আবশ্যিক"); return; }
    if (isNew && allClients.find((c: any) => c.id === f.id)) { alert("এই ID আছে"); return; }
    if (!isNew && idChanged && allClients.find((c: any) => c.id === f.id && c.id !== originalId)) { alert("এই ID দিয়ে আরেকজন ক্লাইন্ট আছে"); return; }
    onSave({ ...f, totalAmount: parseFloat(f.totalAmount) || 0, password: f.password || "1234" }, originalId);
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
        <div className="text-xl font-black text-slate-900 mb-6">{isNew ? "নতুন ক্লাইন্ট" : "ক্লাইন্ট আপডেট"}</div>
        
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-slate-50 shrink-0 hover:bg-slate-100 transition-colors" 
            onClick={() => photoRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <>
                <Camera size={20} className="text-slate-400 mb-1" />
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ছবি</div>
              </>
            )}
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">{f.name || "নাম নেই"}</div>
            <div className="text-xs text-slate-500 font-medium">{f.id}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FG label="Customer ID">
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={f.id} onChange={e => handleIdChange(e.target.value)} />
            </FG>
            {idChanged && <div className="text-[10px] bg-indigo-50 text-indigo-700 rounded-lg p-2 -mt-2 mb-4 font-bold border border-indigo-100">🔄 <b>{originalId}</b> → <b>{f.id}</b><br/>সব payment migrate হবে</div>}
          </div>
          <FG label="প্লট">
            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={f.plot || ""} onChange={e => s("plot", e.target.value)} />
          </FG>
        </div>
        
        <FG label="নাম"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={f.name || ""} onChange={e => s("name", e.target.value)} /></FG>
        <FG label="পিতা/স্বামীর নাম"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={f.fatherHusband || ""} onChange={e => s("fatherHusband", e.target.value)} /></FG>
        
        <div className="grid grid-cols-2 gap-4">
          <FG label="জন্ম তারিখ"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="date" value={f.birthDate || ""} onChange={e => s("birthDate", e.target.value)} /></FG>
          <FG label="Phone"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={f.phone || ""} onChange={e => s("phone", e.target.value)} /></FG>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FG label="Email"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="email" value={f.email || ""} onChange={e => s("email", e.target.value)} /></FG>
          <FG label="NID"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" value={f.nid || ""} onChange={e => s("nid", e.target.value)} /></FG>
        </div>

        <FG label="মন্তব্য (Remarks)">
          <textarea 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[80px]" 
            value={f.remarks || ""} 
            onChange={e => s("remarks", e.target.value)} 
            placeholder="অতিরিক্ত তথ্য এখানে লিখুন..."
          />
        </FG>
        
        <div className="grid grid-cols-2 gap-4">
          <FG label="মোট মূল্য (৳)"><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" type="number" value={f.totalAmount || ""} onChange={e => s("totalAmount", e.target.value)} /></FG>
          <FG label="Password">
            <div className="relative">
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all pr-10" type={showPass ? "text" : "password"} value={f.password || ""} onChange={e => s("password", e.target.value)} />
              <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">{showPass ? "🙈" : "👁️"}</button>
            </div>
          </FG>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" onClick={submit}>{isNew ? "যোগ করুন" : "আপডেট করুন"}</button>
          <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>বাতিল</button>
        </div>
      </motion.div>
    </div>
  );
}

function ImportPreviewSheet({ data, onConfirm, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[400] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-safe max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
        <div className="text-xl font-black text-slate-900 mb-6">📥 Import প্রিভিউ — {data.length}টি ক্লাইন্ট</div>
        
        <div className="overflow-x-auto mb-4 border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-left">
                <th className="p-2 border-b border-slate-200">Row</th>
                <th className="p-2 border-b border-slate-200">ID</th>
                <th className="p-2 border-b border-slate-200">নাম</th>
                <th className="p-2 border-b border-slate-200">Phone</th>
                <th className="p-2 border-b border-slate-200">অতিরিক্ত (Remarks)</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 15).map((r: any, i: number) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="p-2 text-slate-400 font-medium">{r._row}</td>
                  <td className="p-2"><span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold text-slate-600">{r.id}</span></td>
                  <td className="p-2 font-bold text-slate-900">{r.name || <span className="text-rose-500">খালি</span>}</td>
                  <td className="p-2 text-slate-500 font-medium">{r.phone || "—"}</td>
                  <td className="p-2 text-[10px] text-slate-400 italic truncate max-w-[100px]">{r.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.length > 15 && <div className="text-xs text-slate-400 font-bold text-center mb-4">...আরো {data.length - 15}টি</div>}
        
        <div className="flex gap-3">
          <button className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors" onClick={onConfirm}>✓ Import ({data.length}টি)</button>
          <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>বাতিল</button>
        </div>
      </motion.div>
    </div>
  );
}
