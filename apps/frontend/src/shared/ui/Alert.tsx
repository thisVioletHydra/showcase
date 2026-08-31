import type { ReactNode } from 'react';

import styles from './Alert.module.css';

export type AlertTone = 'success' | 'danger' | 'info';

interface AlertProps {
  tone: AlertTone;
  children: ReactNode;
}

const TONE_CLASS: Record<AlertTone, string> = {
  success: styles.success,
  danger: styles.danger,
  info: styles.info,
};

export function Alert({ tone, children }: AlertProps) {
  return (
    <div
      className={`${styles.alert} ${TONE_CLASS[tone]}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span className={styles.icon} aria-hidden />
      <div>{children}</div>
    </div>
  );
}
