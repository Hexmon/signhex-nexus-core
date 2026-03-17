type MediaLike = {
  id?: string | null;
  name?: string | null;
  filename?: string | null;
  display_name?: string | null;
};

const trimToUndefined = (value?: string | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const deriveDisplayNameFromFilename = (filename: string) => {
  const basename = filename
    .split(/[\\/]/)
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return basename && basename.length > 0 ? basename : filename;
};

export const resolveMediaDisplayName = (media?: MediaLike | null) =>
  trimToUndefined(media?.display_name) ??
  trimToUndefined(media?.name) ??
  trimToUndefined(media?.filename) ??
  trimToUndefined(media?.id) ??
  "Untitled media";

export const resolveMediaFilename = (media?: MediaLike | null) =>
  trimToUndefined(media?.filename) ?? trimToUndefined(media?.name) ?? trimToUndefined(media?.id) ?? "file";
