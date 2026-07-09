/** Capture the whole chat (header + all messages) and download as PNG or PDF. */
export async function exportChat(mode: 'png' | 'pdf', filename: string): Promise<void> {
  const screen = document.querySelector('.screen') as HTMLElement | null;
  const phone = document.querySelector('.phone') as HTMLElement | null;
  const body = document.querySelector('.wa-body') as HTMLElement | null;
  if (!screen || !phone || !body) throw new Error('Open a chat first.');

  const html2canvas = (await import('html2canvas')).default;

  // temporarily remove the phone scaling and expand the chat to its full height
  const prev = {
    transform: phone.style.transform,
    screenH: screen.style.height,
    bodyH: body.style.height,
    bodyOv: body.style.overflow,
  };
  phone.style.transform = 'none';
  screen.style.height = 'auto';
  body.style.height = 'auto';
  body.style.overflow = 'visible';

  try {
    const canvas = await html2canvas(screen, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
    const safe = (filename || 'chat').replace(/[^a-z0-9._-]+/gi, '_');
    if (mode === 'png') {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${safe}.png`;
      a.click();
    } else {
      const { jsPDF } = await import('jspdf');
      const w = canvas.width, h = canvas.height;
      const pdf = new jsPDF({ orientation: h >= w ? 'p' : 'l', unit: 'px', format: [w, h] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      pdf.save(`${safe}.pdf`);
    }
  } finally {
    phone.style.transform = prev.transform;
    screen.style.height = prev.screenH;
    body.style.height = prev.bodyH;
    body.style.overflow = prev.bodyOv;
  }
}
