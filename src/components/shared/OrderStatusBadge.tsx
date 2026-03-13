import type { OrderStatus } from '../../types';
import { useTranslation } from '../../i18n';
import { STATUS_BG_CLASSES } from '../../utils/constants';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export default function OrderStatusBadge({ status, size = 'sm' }: OrderStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${STATUS_BG_CLASSES[status]} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
    >
      {t.status[status]}
    </span>
  );
}
