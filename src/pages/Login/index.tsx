import { useLoginForm } from '@/hooks/useLoginForm';
import LoginCard from './components/LoginCard';

export default function Login() {
  const formProps = useLoginForm();

  return (
    <div className="h-screen w-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8 text-2xl font-semibold">
          <span className="text-vibe-blue">PuaForge</span>
          <span className="text-forge-terracotta">AI</span>
        </div>
        <LoginCard {...formProps} />
      </div>
    </div>
  );
}
