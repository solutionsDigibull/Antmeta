"use client";

interface UserAvatarProps {
  name: string;
  size?: number;
}

export function UserAvatar({ name, size = 30 }: UserAvatarProps) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2);
  return (
    <div
      className="rounded-full bg-gradient-to-br from-am-secondary to-am-primary flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
