export default function UserAvatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <span className="w-5 h-5 rounded-full bg-forge-terracotta/20 text-forge-terracotta text-[10px] font-semibold flex items-center justify-center shrink-0">
      {initials}
    </span>
  )
}
