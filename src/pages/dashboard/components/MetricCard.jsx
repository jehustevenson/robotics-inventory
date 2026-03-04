import React from "react";
import Icon from "components/AppIcon";

const MetricCard = ({ title, value, iconName, colorClass, bgClass, description }) => {
  return (
    <div
      className="bg-[var(--color-card)] rounded-[var(--radius-lg)] p-4 md:p-6 shadow-[var(--shadow-md)] border border-[var(--color-border)] flex items-start gap-4"
      role="region"
      aria-label={`${title}: ${value}`}
    >
      <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-[var(--radius-md)] flex items-center justify-center ${bgClass}`}>
        <Icon name={iconName} size={24} color="currentColor" className={colorClass} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs md:text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide font-[var(--font-caption)]">
          {title}
        </p>
        <p className={`text-2xl md:text-3xl font-bold mt-1 ${colorClass} font-[var(--font-data)]`}>
          {value}
        </p>
        {description && (
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;