import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Palette,
  Power,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBanner } from "@/hooks/useBanner";
import { cn } from "@/lib/utils";

export function DynamicBannerCard() {
  const {
    status,
    isLoading,
    isError,
    refetch,
    enable,
    disable,
    refresh,
    isEnabling,
    isDisabling,
    isRefreshing,
  } = useBanner();

  if (isLoading) {
    return (
      <section className="surface animate-pulse p-5" aria-label="Loading Dynamic SSH Banner">
        <div className="h-6 w-44 rounded bg-muted" />
        <div className="mt-5 h-24 rounded-lg bg-muted/60" />
      </section>
    );
  }

  if (isError || !status) {
    return (
      <section className="surface border-destructive/30 p-5">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="size-5" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-semibold">Dynamic SSH Banner</h2>
            <p className="text-sm">Failed to load banner status.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw /> Retry
          </Button>
        </div>
      </section>
    );
  }

  const enabled = status.enabled;
  const busy = isEnabling || isDisabling || isRefreshing;

  return (
    <section className={cn("surface animate-fade-in p-5", enabled && "border-success/50")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground", enabled && "bg-success/15 text-success")}>
            <Palette className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display font-semibold">Dynamic SSH Banner</h2>
            <p className="text-xs text-muted-foreground">Live stats for every SSH account</p>
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground", enabled && "border-success/40 bg-success/10 text-success")}>
          {enabled ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
          {enabled ? "ENABLED" : "DISABLED"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-secondary/45 p-3">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-3.5 text-primary" /> Banners</p>
          <p className="mt-1 font-display text-xl font-bold">{status.banner_count}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/45 p-3">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Palette className="size-3.5 text-admin" /> Config</p>
          <p className={cn("mt-1 text-sm font-bold text-destructive", status.config_exists && "text-success")}>
            {status.config_exists ? "Active" : "Missing"}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
        {enabled
          ? "Banners update automatically with live sessions, bandwidth, and account status."
          : "Enable dynamic banners for current SSH users and every newly created account."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {enabled ? (
          <Button variant="destructive" className="min-w-32 flex-1" disabled={busy} onClick={() => disable()}>
            {isDisabling ? <Loader2 className="animate-spin" /> : <Power />} Disable
          </Button>
        ) : (
          <Button className="min-w-32 flex-1" disabled={busy} onClick={() => enable()}>
            {isEnabling ? <Loader2 className="animate-spin" /> : <Power />} Enable
          </Button>
        )}
        <Button variant="outline" disabled={busy || !enabled} onClick={() => refresh()}>
          <RefreshCw className={cn(isRefreshing && "animate-spin")} /> Refresh
        </Button>
      </div>
    </section>
  );
}

export default DynamicBannerCard;