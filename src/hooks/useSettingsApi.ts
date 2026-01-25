import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/domains/settings";
import { queryKeys } from "@/api/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/apiClient";
import type { DefaultMediaSetting } from "@/api/types";

export const useDefaultMedia = () =>
  useQuery({
    queryKey: queryKeys.defaultMedia,
    queryFn: settingsApi.getDefaultMedia,
    staleTime: 60_000,
  });

export const useUpdateDefaultMedia = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: string | null) => settingsApi.updateDefaultMedia(mediaId),
    onSuccess: (data, mediaId) => {
      const resolvedMediaId = data?.media_id ?? mediaId ?? null;
      const nextData: DefaultMediaSetting = {
        media_id: resolvedMediaId,
        media: data?.media ?? null,
      };
      queryClient.setQueryData(queryKeys.defaultMedia, nextData);
      void queryClient.invalidateQueries({ queryKey: queryKeys.defaultMedia });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });

      toast({
        title: resolvedMediaId ? "Default media updated" : "Default media cleared",
        description: resolvedMediaId
          ? "New default media has been saved."
          : "Default media has been removed.",
      });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Unable to update default media.";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    },
  });
};
