import { Icon } from '@iconify/react';

export default function FullLogo() {
  return (
    <div className="flex items-center gap-2.5" aria-label="WhatsAPI">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
        <Icon icon="solar:chat-round-call-bold" width={22} />
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">Whats<span className="text-primary">API</span></span>
    </div>
  );
}
