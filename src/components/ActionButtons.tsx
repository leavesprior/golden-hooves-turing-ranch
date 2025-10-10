import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onAction: (action: string) => void;
  disabled?: boolean;
}

export const ActionButtons = ({ onAction, disabled = false }: ActionButtonsProps) => {
  const actions = [
    { id: 'feed', label: 'FEED ANIMALS', coins: 5 },
    { id: 'repair', label: 'REPAIR FENCE', coins: 3 },
    { id: 'rotate', label: 'ROTATE PASTURE', coins: 4 },
    { id: 'explore', label: 'EXPLORE RANCH', coins: 2 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {actions.map(action => (
        <Button
          key={action.id}
          onClick={() => onAction(action.id)}
          disabled={disabled}
          className="bg-secondary hover:bg-secondary/80 border-2 border-border text-foreground pixel-text text-xs py-6 transition-all hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50"
          style={{ textShadow: 'var(--pixel-shadow)' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span>{action.label}</span>
            <span className="text-primary text-[10px]">+{action.coins} COINS</span>
          </div>
        </Button>
      ))}
    </div>
  );
};
