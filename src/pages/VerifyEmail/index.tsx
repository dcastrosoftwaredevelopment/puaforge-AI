import { useResendCooldown } from '@/hooks/useResendCooldown'
import VerifyEmailCard from './components/VerifyEmailCard'

export default function VerifyEmail() {
  const { cooldown, resendState, handleResend } = useResendCooldown()

  const email = sessionStorage.getItem('verify_email') ?? ''
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, '•') + c)

  return (
    <div className="h-screen w-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8 text-2xl font-semibold">
          <span className="text-vibe-blue">PuaForge</span>
          <span className="text-forge-terracotta">AI</span>
        </div>
        <VerifyEmailCard
          maskedEmail={maskedEmail}
          email={email}
          cooldown={cooldown}
          resendState={resendState}
          handleResend={handleResend}
        />
      </div>
    </div>
  )
}
