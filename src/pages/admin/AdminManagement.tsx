import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types/auth";
import { Search, Edit, Shield, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { ExportMenu, ExportColumn } from "@/components/ExportMenu";

const AdminManagement = () => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    phone: ""
  });

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setAdmins(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleEditClick = (admin: User) => {
    setEditingAdmin(admin);
    setEditForm({
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "admin",
      status: admin.status || "active",
      phone: admin.phone || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAdmin) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }
    
    try {
      await updateDoc(doc(db, "users", editingAdmin.id), {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
        phone: editForm.phone
      });
      toast.success("Admin data updated successfully");
      setEditingAdmin(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update admin data");
    }
  };

  const filteredAdmins = admins.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportColumns: ExportColumn<User>[] = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Role", key: "role" },
    { header: "Phone", key: "phone" },
    { header: "Status", key: "status" }
  ];

  return (
    <div className="space-y-8 pb-12 relative">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground italic tracking-tighter uppercase">Admin Management</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Manage system administrators & permissions</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-card p-6 rounded-[2rem] border border-border items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all"
          />
        </div>
        <ExportMenu 
          data={filteredAdmins} 
          columns={exportColumns} 
          filename="Mukti_Admins_Export" 
          title="Mukti Portal - Admin Users List" 
          subtitle={`Total Admins: ${filteredAdmins.length}`}
        />
      </div>

      <div className="bg-card rounded-[3rem] border border-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Admin Profile</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contact</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Loading Admins...</div>
                  </td>
                </tr>
              ) : filteredAdmins.map(admin => (
                <tr key={admin.id} className="hover:bg-secondary/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary overflow-hidden shadow-inner">
                        {admin.photo ? <img src={admin.photo} className="h-full w-full object-cover" /> : <Shield size={24} />}
                      </div>
                      <div>
                        <div className="text-sm font-black text-foreground">{admin.name}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{admin.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-bold text-foreground">{admin.email}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{admin.phone || "No phone"}</div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${admin.status === 'suspended' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                      {admin.status === 'suspended' ? <ShieldAlert size={12} /> : <Check size={12} />}
                      {admin.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleEditClick(admin)}
                      className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shadow-sm border border-border inline-flex items-center gap-2"
                    >
                      <Edit size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEditingAdmin(null)}
              className="absolute right-6 top-6 p-2 text-muted-foreground hover:text-foreground rounded-full bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Edit Admin Data</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</label>
                  <select 
                    value={editForm.role}
                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</label>
                  <select 
                    value={editForm.status}
                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setEditingAdmin(null)}
                className="px-6 py-3 rounded-xl bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-glow hover:scale-105 active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
