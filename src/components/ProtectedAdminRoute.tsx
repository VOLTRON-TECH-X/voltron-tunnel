import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isAdminLoggedIn } from "@/lib/admin";
import LoadingSpinner from "./LoadingSpinner";

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setState("ok");
    } else {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [navigate]);

  if (state !== "ok") {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoadingSpinner label="Verifying admin session…" />
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedAdminRoute;
