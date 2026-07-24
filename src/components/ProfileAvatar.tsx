import { useProfileAvatar } from "@/lib/profile-avatars";

/**
 * Renders a user's profile photo, falling back to a gradient bubble with the
 * user's initial when there is no photo. Works for both the current user and
 * any other profile — pass `profileId` and it will look the avatar up in the
 * shared cache; you can override with an explicit `avatarUrl`.
 */
export function ProfileAvatar({
  profileId,
  avatarUrl,
  initial,
  gradient,
  size = 40,
  radius,
  className,
  fontScale = 0.42,
  ring,
}: {
  profileId?: string;
  avatarUrl?: string | null;
  initial: string;
  gradient: string;
  size?: number;
  /** Border radius in px. Defaults to fully round. */
  radius?: number;
  className?: string;
  /** Font-size multiplier for the initial fallback. */
  fontScale?: number;
  /** Optional ring color for a subtle inset ring. */
  ring?: string;
}) {
  const cached = useProfileAvatar(profileId);
  const url = avatarUrl ?? cached ?? null;
  const br = radius ?? size;
  const ringStyle = ring ? { boxShadow: `inset 0 0 0 1px ${ring}` } : undefined;
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center overflow-hidden text-white font-semibold ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: br,
        background: url ? "#000" : gradient,
        fontSize: size * fontScale,
        ...ringStyle,
      }}
    >
      {url ? (
        <img
          src={url}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{ borderRadius: br }}
        />
      ) : (
        initial
      )}
    </span>
  );
}
