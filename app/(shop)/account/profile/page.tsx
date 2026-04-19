"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { User } from "lucide-react";

interface ProfileData {
  id: string;
  email: string | null;
  full_name: string;
  avatar_url: string;
  role: string;
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((j) => {
        setData(j.profile as ProfileData);
        setFullName(j.profile?.full_name ?? "");
        setAvatarUrl(j.profile?.avatar_url ?? "");
      })
      .catch(() => setData(null));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved");
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted grid place-items-center overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <div className="text-sm font-medium">{data.email}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {data.role}
          </div>
        </div>
      </div>

      <label className="block text-sm">
        <span className="block mb-1">Full name</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </label>
      <label className="block text-sm">
        <span className="block mb-1">Avatar URL (optional)</span>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
