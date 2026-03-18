import html2canvas from 'html2canvas';

/**
 * Capture a DOM element as a canvas with high DPI.
 */
async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale: 2,            // 2x for crisp output
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
}

/**
 * Download invoice as PDF.
 */
export async function downloadInvoicePDF(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await captureElement(el);

  // Lazy-load jsPDF to avoid bundle bloat
  const { jsPDF } = await import('jspdf');

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Scale to fit A4 page (595 × 842 pts at 72dpi)
  const pdfWidth = 595;
  const pdfHeight = Math.round((imgHeight / imgWidth) * pdfWidth);

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'pt',
    format: [pdfWidth, pdfHeight],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}

/**
 * Download invoice as PNG image.
 */
export async function downloadInvoiceImage(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await captureElement(el);

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}

/**
 * Share invoice image via Web Share API (mobile) or WhatsApp fallback.
 */
export async function shareInvoiceWhatsApp(
  el: HTMLElement,
  phone: string,
  orderNumber: string
): Promise<void> {
  const canvas = await captureElement(el);

  // Try native share first (Android/iOS)
  if (navigator.share && navigator.canShare) {
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `invoice-${orderNumber}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `ইনভয়েস ${orderNumber}`,
          });
          return;
        }
      }, 'image/png');
      return;
    } catch {
      // Fall through to WhatsApp URL
    }
  }

  // Fallback: open WhatsApp with order number
  const cleaned = phone.replace(/\D/g, '');
  const msg = encodeURIComponent(`আপনার অর্ডার ${orderNumber} এর ইনভয়েস পাঠানো হলো।`);
  const wa = cleaned.startsWith('0')
    ? `880${cleaned.slice(1)}`
    : cleaned.startsWith('880')
    ? cleaned
    : `880${cleaned}`;
  window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
}

/**
 * Get invoice filename for an order.
 */
export function getInvoiceFilename(orderNumber: string, ext: 'pdf' | 'png'): string {
  return `invoice-${orderNumber}.${ext}`;
}
