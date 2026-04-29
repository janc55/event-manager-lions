import { api } from './api';

export interface BadgeData {
  firstName: string;
  lastName: string;
  badgeName?: string;
  roleTitle?: string;
  participantType: string;
  district?: string;
  registrationCode: string;
  photoUrl?: string;
  qrDataUrl: string;
}

export async function generateBadgeImage(data: BadgeData): Promise<string> {
  const SCALE = 4; // Scale for better quality (approx 300 DPI)
  const width = 153.07 * SCALE;
  const height = 240.94 * SCALE;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Helper to load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // 1. Background
  const bgImg = await loadImage(api.getFileUrl('/assets/fondo-credencial.png'));
  ctx.drawImage(bgImg, 0, 0, width, height);

  // 2. Photo
  if (data.photoUrl) {
    try {
      const photoImg = await loadImage(api.getFileUrl(data.photoUrl));
      const photoSize = 50 * SCALE;
      const photoX = 15 * SCALE;
      const photoY = height - (125 * SCALE) - photoSize; // Convert from bottom-up to top-down

      // Border frame (rounded)
      const borderPadding = 2 * SCALE;
      const r = 4 * SCALE;
      const fx = photoX - borderPadding;
      const fy = photoY - borderPadding;
      const fw = photoSize + borderPadding * 2;
      const fh = photoSize + borderPadding * 2;

      ctx.save();
      // Draw rounded rect for frame
      ctx.beginPath();
      ctx.moveTo(fx + r, fy);
      ctx.lineTo(fx + fw - r, fy);
      ctx.quadraticCurveTo(fx + fw, fy, fx + fw, fy + r);
      ctx.lineTo(fx + fw, fy + fh - r);
      ctx.quadraticCurveTo(fx + fw, fy + fh, fx + fw - r, fy + fh);
      ctx.lineTo(fx + r, fy + fh);
      ctx.quadraticCurveTo(fx, fy + fh, fx, fy + fh - r);
      ctx.lineTo(fx, fy + r);
      ctx.quadraticCurveTo(fx, fy, fx + r, fy);
      ctx.closePath();

      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#99801a'; // Gold-ish
      ctx.lineWidth = 1 * SCALE;
      ctx.stroke();

      // Clip for photo (optional, but let's keep it square inside the frame)
      ctx.drawImage(photoImg, photoX, photoY, photoSize, photoSize);
      ctx.restore();
    } catch (e) {
      console.error('Error drawing photo on canvas', e);
    }
  }

  // 3. QR Code
  try {
    const qrImg = await loadImage(data.qrDataUrl);
    const qrSize = 48 * SCALE;
    const qrX = width - qrSize - (7.1 * SCALE);
    const qrY = height - (7.1 * SCALE) - qrSize;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch (e) {
    console.error('Error drawing QR on canvas', e);
  }

  // 4. Text
  ctx.fillStyle = 'black';
  ctx.textBaseline = 'top';

  // Label
  ctx.font = `${5 * SCALE}px Helvetica, Arial, sans-serif`;
  ctx.fillText('NOMBRE DEL PARTICIPANTE', 10 * SCALE, height - (80 * SCALE));

  // Name
  const toTitleCase = (str: string) => 
    str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const rawName = data.badgeName || `${data.firstName} ${data.lastName}`;
  const displayName = `L. ${toTitleCase(rawName)}`;
  ctx.font = `bold ${11 * SCALE}px Helvetica, Arial, sans-serif`;
  ctx.fillText(displayName, 10 * SCALE, height - (80 * SCALE) + (10 * SCALE));

  // Role / District
  const roleDistrict = `${data.roleTitle || data.participantType} / ${data.district || 'Sin distrito'}`;
  ctx.font = `${5.5 * SCALE}px Helvetica, Arial, sans-serif`;
  ctx.fillText(roleDistrict, 10 * SCALE, height - (80 * SCALE) + (26 * SCALE));

  return canvas.toDataURL('image/png');
}
