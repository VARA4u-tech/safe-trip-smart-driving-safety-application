import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, UserPlus, Phone, Heart } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

const EmergencyContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState("");

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    try {
      const { error } = await supabase.from("emergency_contacts").insert([
        {
          user_id: user?.id,
          name: newName,
          phone: newPhone,
          relation: newRelation,
        },
      ]);

      if (error) throw error;

      toast.success("Contact added successfully");
      setNewName("");
      setNewPhone("");
      setNewRelation("");
      setIsAdding(false);
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to add contact");
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setContacts(contacts.filter((c) => c.id !== id));
      toast.success("Contact removed");
    } catch (error: any) {
      toast.error("Delete failed");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xs font-bold text-primary tracking-[0.3em] italic uppercase">
          Guardian Network
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity bg-primary/10 px-3 py-1 rounded-full"
        >
          {isAdding ? "Cancel" : "Add Guard"}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={addContact}
          className="card-luxe !bg-primary/5 border-primary/20 space-y-4 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                Full Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Guardian Name"
                className="w-full bg-background border border-vintage-border-outer rounded-xl px-4 py-2.5 text-sm focus:ring-1 ring-primary/30 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 00000 00000"
                className="w-full bg-background border border-vintage-border-outer rounded-xl px-4 py-2.5 text-sm focus:ring-1 ring-primary/30 outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
              Relationship (Optional)
            </label>
            <input
              type="text"
              value={newRelation}
              onChange={(e) => setNewRelation(e.target.value)}
              placeholder="e.g. Parent, Spouse, Friend"
              className="w-full bg-background border border-vintage-border-outer rounded-xl px-4 py-2.5 text-sm focus:ring-1 ring-primary/30 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Registry Guard
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Scanning secure link...
          </div>
        ) : contacts.length === 0 ? (
          <div className="card-luxe !bg-white/5 border-dashed border-primary/20 py-10 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-primary/30 mx-auto" />
            <p className="text-xs text-muted-foreground px-10">
              No emergency guardians configured. Add a contact to enable SOS
              broadcasting.
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="card-luxe flex items-center justify-between !bg-white/5 hover:!bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center bg-primary/10">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm flex items-center gap-2">
                    {contact.name}
                    {contact.relation && (
                      <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                        {contact.relation}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteContact(contact.id)}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Remove contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default EmergencyContacts;

const ShieldAlert = ({
  className,
  className_,
}: {
  className?: string;
  className_?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);
