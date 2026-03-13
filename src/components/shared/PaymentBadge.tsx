import type { PaymentStatus } from '../../types';
import { useTranslation } from '../../i18n';
import { PAYMENT_STATUS_CLASSES } from '../../utils/constants';

interface PaymentBadgeProps {
  status: PaymentStatus;
}

export default function PaymentBadge({ status }: PaymentBadgeProps) {
  const { t } = useTranslation();

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PAYMENT_STATUS_CLASSES[status]}`}>
      {t.payment[status]}
    </span>
  );
}
