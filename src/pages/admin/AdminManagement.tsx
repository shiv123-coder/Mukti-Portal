import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types/auth";
import { Search, Edit, Shield, Check, X, ShieldAlert, Trash2, Eye, Filter, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ExportMenu, ExportColumn } from "@/components/ExportMenu";
import { useAuth } from "@/hooks/useAuth";

const AdminManagement = () => {
  const { user: currentUser } = useAuth();
  
  const [admins, setAdmins] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<User | null>(null);
  const [deleteConfirmAdmin, setDeleteConfirmAdmin] = useState<User | null>(null);
  
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    phone: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Only fetching admins, or super_admins if applicable. 
    // Usually super_admin might also be tracked in "users" collection. We can fetch where role in ["admin", "super_admin"]
    // FireStore `in` query or just fetch all and filter, but we know "role" == "admin" is what was used. Let's fetch all users with role 'admin' or 'super_admin' if possible.
    // For safety, let's keep the original query but if there's super_admin, we should ideally fetch it. 
    // Since original only queried "admin", we'll stick to that or fetch where role in ['admin', 'super_admin'].
    const q = query(collection(db, "users"), where("role", "in", ["admin", "super_admin"]));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setAdmins(list);
      setLoading(false);
    }, (error) => {
      // fallback if `in` query fails due to index or no super_admin
      const qFallback = query(collection(db, "users"), where("role", "==", "admin"));
      onSnapshot(qFallback, (snap2) => {
        const list2 = snap2.docs.map(d => ({ id: d.id, ...d.data() } as User));
        setAdmins(list2);
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  const handleEditClick = (admin: User) => {
    setEditingAdmin(admin);
    setFormErrors({});
    setEditForm({
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "admin",
      status: admin.status || "active",
      phone: admin.phone || ""
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) errors.name = "Name is required";
    
    if (!editForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = "Invalid email format";
    }

    if (editForm.phone && !/^\+?[0-9\s\-()]{7,15}$/.test(editForm.phone)) {
      errors.phone = "Invalid phone format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editingAdmin) return;
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
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

  const handleDeleteClick = (admin: User) => {
    if (admin.id === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setDeleteConfirmAdmin(admin);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmAdmin) return;
    try {
      await deleteDoc(doc(db, "users", deleteConfirmAdmin.id));
      toast.success("Admin deleted successfully");
      setDeleteConfirmAdmin(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete admin");
    }
  };

  const handleToggleStatus = async (admin: User) => {
    if (admin.id === currentUser?.id) {
      toast.error("You cannot change your own status.");
      return;
    }
    const newStatus = admin.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, "users", admin.id), {
        status: newStatus
      });
      toast.success(`Admin ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const filteredAdmins = admins.filter(a => {
    const matchesSearch = 
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || a.role === roleFilter;
    const matchesStatus = statusFilter === "all" || (a.status || 'active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const exportColumns: ExportColumn<User>[] = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Role", key: "role" },
    { header: "Phone", key: "phone" },
    { header: "Status", key: "status" }
  ];

  return (
    <div className="space-y-8 pb-12 relative animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground italic tracking-tighter uppercase">Admin Management</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Manage system administrators & permissions</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-card p-6 rounded-[2rem] border border-border items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search admins by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-secondary rounded-xl border border-border px-3 py-1">
            <Filter size={16} className="text-muted-foreground" />
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none py-2 pr-4 appearance-none font-medium"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-secondary rounded-xl border border-border px-3 py-1">
            <Filter size={16} className="text-muted-foreground" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none py-2 pr-4 appearance-none font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <ExportMenu 
          data={filteredAdmins} 
          columns={exportColumns} 
          filename="Mukti_Admins_Export" 
          title="Mukti Portal - Admin Users List" 
          subtitle={`Total Admins: ${filteredAdmins.length}`}
        />
      </div>

      <div className="bg-card rounded-[3rem] border border-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
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
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No administrators found</div>
                  </td>
                </tr>
              ) : filteredAdmins.map(admin => {
                const isSelf = admin.id === currentUser?.id;
                
                return (
                  <tr key={admin.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center font-black text-foreground overflow-hidden shadow-inner">
                          {admin.photo ? <img src={admin.photo} className="h-full w-full object-cover" alt={admin.name} /> : <Shield size={20} className="text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="text-sm font-black text-foreground flex items-center gap-2">
                            {admin.name}
                            {isSelf && <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[8px] uppercase tracking-wider font-bold">You</span>}
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{admin.role?.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm font-medium text-foreground">{admin.email}</div>
                      <div className="text-[10px] font-medium text-muted-foreground mt-0.5">{admin.phone || "No phone provided"}</div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button 
                        onClick={() => handleToggleStatus(admin)}
                        disabled={isSelf}
                        title={isSelf ? "Cannot change own status" : "Click to toggle status"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          admin.status === 'suspended' 
                            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
                            : 'bg-success/10 text-success hover:bg-success/20'
                        } ${isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {admin.status === 'suspended' ? <ShieldAlert size={12} /> : <Check size={12} />}
                        {admin.status || 'Active'}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setViewingAdmin(admin)}
                          title="View Details"
                          className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shadow-sm border border-border"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(admin)}
                          title="Edit Admin"
                          className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shadow-sm border border-border"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(admin)}
                          disabled={isSelf}
                          title={isSelf ? "Cannot delete yourself" : "Delete Admin"}
                          className={`p-2.5 rounded-xl bg-secondary text-muted-foreground shadow-sm border border-border transition-all ${
                            isSelf ? 'opacity-50 cursor-not-allowed' : 'hover:text-destructive hover:bg-destructive/10'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal / Slide-over Drawer */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-background/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-[2.5rem] border-l sm:border border-border shadow-2xl p-8 relative flex flex-col animate-in slide-in-from-right-8 sm:zoom-in-95 duration-300 overflow-y-auto">
            <button 
              onClick={() => setEditingAdmin(null)}
              className="absolute right-6 top-6 p-2 text-muted-foreground hover:text-foreground rounded-full bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 text-foreground">Edit Admin</h3>
            
            <div className="space-y-5 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name *</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className={`w-full bg-secondary border ${formErrors.name ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'} rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-all`}
                  placeholder="e.g. John Doe"
                />
                {formErrors.name && <p className="text-[10px] text-destructive font-bold">{formErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address *</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className={`w-full bg-secondary border ${formErrors.email ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'} rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-all`}
                  placeholder="admin@example.com"
                />
                {formErrors.email && <p className="text-[10px] text-destructive font-bold">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  className={`w-full bg-secondary border ${formErrors.phone ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'} rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-all`}
                  placeholder="+1 234 567 8900"
                />
                {formErrors.phone && <p className="text-[10px] text-destructive font-bold">{formErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</label>
                <select 
                  value={editForm.role}
                  onChange={e => setEditForm({...editForm, role: e.target.value})}
                  disabled={editingAdmin.id === currentUser?.id}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all appearance-none disabled:opacity-50"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {editingAdmin.id === currentUser?.id && <p className="text-[10px] text-muted-foreground">You cannot change your own role.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Status</label>
                <select 
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                  disabled={editingAdmin.id === currentUser?.id}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all appearance-none disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3 pb-safe">
              <button 
                onClick={() => setEditingAdmin(null)}
                className="px-6 py-3 rounded-xl bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setViewingAdmin(null)}
              className="absolute right-6 top-6 p-2 text-muted-foreground hover:text-foreground rounded-full bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-3xl bg-secondary border border-border flex items-center justify-center font-black text-foreground overflow-hidden shadow-inner">
                {viewingAdmin.photo ? <img src={viewingAdmin.photo} className="h-full w-full object-cover" alt="Profile" /> : <Shield size={28} className="text-muted-foreground" />}
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">{viewingAdmin.name}</h3>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{viewingAdmin.role?.replace('_', ' ')}</div>
              </div>
            </div>
            
            <div className="space-y-6 bg-secondary/30 rounded-2xl p-6 border border-border">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Email Address</p>
                <p className="text-sm font-medium text-foreground">{viewingAdmin.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Phone Number</p>
                <p className="text-sm font-medium text-foreground">{viewingAdmin.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${viewingAdmin.status === 'suspended' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                  {viewingAdmin.status === 'suspended' ? <ShieldAlert size={12} /> : <Check size={12} />}
                  {viewingAdmin.status || 'Active'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Last Active</p>
                <p className="text-sm font-medium text-foreground">
                  {viewingAdmin.lastActive 
                    ? new Date(viewingAdmin.lastActive as any).toLocaleString() 
                    : "Unknown"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setViewingAdmin(null)}
                className="px-6 py-3 rounded-xl bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-[2.5rem] border border-destructive/30 shadow-2xl p-8 relative text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground mb-2">Delete Admin?</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Are you sure you want to delete <span className="font-bold text-foreground">{deleteConfirmAdmin.name}</span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setDeleteConfirmAdmin(null)}
                className="flex-1 px-6 py-3 rounded-xl bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
