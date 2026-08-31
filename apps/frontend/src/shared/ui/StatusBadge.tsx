import type { StatusTone } from '#/shared/lib/orderStatus';

import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}

const TONE_CLASS: Record<StatusTone, string> = {
  pending: styles.pending,
  progress: styles.progress,
  success: styles.success,
  danger: styles.danger,
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${TONE_CLASS[tone]}`}>
      <span className={styles.dot} aria-hidden />
      {label}
    </span>
  );
}
