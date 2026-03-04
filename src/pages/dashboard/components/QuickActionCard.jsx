import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";

const QuickActionCard = ({ title, description, iconName, route, variant }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-[var(--color-card)] rounded-[var(--radius-lg)] p-4 md:p-5 border border-[var(--color-border)] shadow-[var(--shadow-sm)] flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-muted)] flex items-center justify-center flex-shrink-0">
          <Icon name={iconName} size={20} color="var(--color-primary)" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[var(--color-foreground)]">{title}</p>
          <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">{description}</p>
        </div>
      </div>
      <Button variant={variant || "outline"} size="sm" onClick={() => navigate(route)} iconName="ArrowRight" iconPosition="right">
        Go to {title}
      </Button>
    </div>
  );
};

export default QuickActionCard;