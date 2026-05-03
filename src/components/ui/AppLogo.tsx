import { Anvil } from 'lucide-react';

interface AppLogoProps {
  compact?: boolean;
}

export default function AppLogo({ compact = false }: AppLogoProps) {
  if (compact) {
    return <Anvil size={20} className="text-forge-terracotta" />;
  }

  return (
    <div className="flex items-center gap-2">
      <Anvil size={22} className="text-forge-terracotta shrink-0" />
      <span className="text-sm font-semibold text-text-primary tracking-wide">PuaForge AI</span>
    </div>
  );
}
