import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getSelectedServerId } from "@/lib/apiConfig";
import type { BannerActionResponse, BannerStatus } from "@/types/api";

function ensureStatus(data: BannerStatus) {
  if (!data.success) throw new Error("Failed to load banner status");
  return data;
}

function actionError(data: BannerActionResponse, fallback: string) {
  return data.error || data.details?.error || fallback;
}

export function useBanner() {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: ["banner-status", getSelectedServerId()],
    queryFn: async () => ensureStatus(await api.banner.status()),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  // Live account count — the server's banner_count can lag after deletions.
  const usersQuery = useQuery({
    queryKey: ["banner-users", getSelectedServerId()],
    queryFn: async () => {
      const r = await api.users();
      if (r.error) return undefined;
      return (r.users ?? (Array.isArray(r["data"]) ? r["data"] : [])).length as number;
    },
    refetchInterval: 30_000,
  });

  const refreshStatus = () => queryClient.invalidateQueries({ queryKey: ["banner-status"] }).then(() => queryClient.invalidateQueries({ queryKey: ["banner-users"] }));

  const enableMutation = useMutation({
    mutationFn: api.banner.enable,
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(actionError(data, "Failed to enable banner"));
        return;
      }
      toast.success(`Banner enabled (${data.details?.users_configured ?? 0} users)`);
      void refreshStatus();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disableMutation = useMutation({
    mutationFn: api.banner.disable,
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(actionError(data, "Failed to disable banner"));
        return;
      }
      toast.success("Banner disabled");
      void refreshStatus();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const refreshMutation = useMutation({
    mutationFn: api.banner.refresh,
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(actionError(data, "Failed to refresh banner"));
        return;
      }
      toast.success(`Banner refreshed (${data.details?.users_configured ?? 0} users)`);
      void refreshStatus();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    status: statusQuery.data,
    activeUsers: usersQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    refetch: statusQuery.refetch,
    enable: enableMutation.mutate,
    disable: disableMutation.mutate,
    refresh: refreshMutation.mutate,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
    isRefreshing: refreshMutation.isPending,
  };
}