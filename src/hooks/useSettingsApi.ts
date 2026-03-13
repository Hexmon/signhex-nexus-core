import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/domains/settings";
import { queryKeys } from "@/api/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/apiClient";
import type { DefaultMediaSetting, DefaultMediaVariantsSetting } from "@/api/types";

export const useDefaultMedia = () =>
  useQuery({
    queryKey: queryKeys.defaultMedia,
    queryFn: settingsApi.getDefaultMedia,
    staleTime: 60_000,
  });

export const useDefaultMediaVariants = () =>
  useQuery({
    queryKey: queryKeys.defaultMediaVariants,
    queryFn: settingsApi.getDefaultMediaVariants,
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

export const useUpdateDefaultMediaVariants = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variants: Record<string, string | null>) => settingsApi.updateDefaultMediaVariants(variants),
    onSuccess: (data) => {
      const nextData: DefaultMediaVariantsSetting = {
        global_media_id: data?.global_media_id ?? null,
        global_media: data?.global_media ?? null,
        variants: data?.variants ?? [],
      };

      queryClient.setQueryData(queryKeys.defaultMediaVariants, nextData);
      void queryClient.invalidateQueries({ queryKey: queryKeys.defaultMediaVariants });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });

      toast({
        title: "Default media variants updated",
        description: "Aspect-ratio fallback media has been saved.",
      });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Unable to update default media variants.";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    },
  });
};
