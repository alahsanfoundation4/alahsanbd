import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "নতুন পাসওয়ার্ড — Al Ahsan AI" },
      { name: "description", content: "Al Ahsan AI অ্যাকাউন্টের নতুন পাসওয়ার্ড সেট করুন।" },
      { property: "og:title", content: "নতুন পাসওয়ার্ড — Al Ahsan AI" },
      { property: "og:description", content: "Al Ahsan AI অ্যাকাউন্টের নতুন পাসওয়ার্ড সেট করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if ((e === "PASSWORD_RECOVERY" || e === "SIGNED_IN") && s) setReady(true);
    });
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে।");
    navigate({ to: "/chat" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold">নতুন পাসওয়ার্ড</h1>
        {!ready ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ইমেইলের রিসেট লিংক থেকে এই পেজে আসুন। লিংক যাচাই হচ্ছে…
          </p>
        ) : (
          <form onSubmit={save} className="mt-6 space-y-3">
            <Label htmlFor="npw">নতুন পাসওয়ার্ড</Label>
            <Input id="npw" type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "অপেক্ষা করুন…" : "সেভ করুন"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
