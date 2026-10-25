import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        throw redirect({ to: "/auth" });
      }
      return { user: data.user };
    } catch (err: any) {
      if (err && typeof err === "object" && ("to" in err || "href" in err || err.isRedirect)) {
        throw err;
      }
      console.warn("[_authenticated] Auth verification failed, redirecting to /auth:", err);
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
