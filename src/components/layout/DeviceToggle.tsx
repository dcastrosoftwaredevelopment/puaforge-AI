import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { type DevicePreview } from '@/atoms'
import { useDevicePreview } from '@/hooks/useDevicePreview'
import Tooltip from '@/components/ui/Tooltip'

const devices: { device: DevicePreview; icon: React.ReactNode; label: string }[] = [
  { device: 'desktop', icon: <Monitor size={14} />, label: 'Desktop' },
  { device: 'tablet', icon: <Tablet size={14} />, label: 'Tablet' },
  { device: 'mobile', icon: <Smartphone size={14} />, label: 'Mobile' },
]

export default function DeviceToggle() {
  const { device, setDevice } = useDevicePreview()

  return (
    <div className="flex items-center gap-0.5 bg-bg-tertiary rounded-lg p-0.5 border border-border-subtle">
      {devices.map(({ device: d, icon, label }) => (
        <Tooltip key={d} content={label} side="bottom" align="center">
          <button
            onClick={() => setDevice(d)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              device === d
                ? 'bg-bg-elevated text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {icon}
          </button>
        </Tooltip>
      ))}
    </div>
  )
}
