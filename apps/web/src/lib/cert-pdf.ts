// A4 landscape sertifika — Canvas API, sıfır bağımlılık (QR external API)

export function qrImageUrl(data: string, size = 240) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(data)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function downloadCertPdf(cert: {
  userName: string;
  courseTitle: string;
  category: string;
  level: string;
  issuedAt: string;
  number: string;
  verifyUrl: string;
}) {
  const W = 1122; // A4 landscape ~96dpi
  const H = 794;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Inner border
  ctx.strokeStyle = "#c4b5fd";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Top accent bar
  ctx.fillStyle = "#7c3aed";
  ctx.fillRect(20, 20, W - 40, 6);

  // Header — EduCell
  ctx.fillStyle = "#7c3aed";
  ctx.font = "bold 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("EduCell", W / 2, 110);

  // Subtitle
  ctx.fillStyle = "#6b7280";
  ctx.font = "16px Georgia, serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("BAŞARI SERTİFİKASI", W / 2, 148);

  // Divider
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 168);
  ctx.lineTo(W - 200, 168);
  ctx.stroke();

  // "Bu sertifika..."
  ctx.fillStyle = "#9ca3af";
  ctx.font = "18px Georgia, serif";
  ctx.letterSpacing = "0px";
  ctx.fillText("Bu sertifika,", W / 2, 220);

  // Name
  ctx.fillStyle = "#111827";
  ctx.font = "bold 56px Georgia, serif";
  ctx.fillText(cert.userName, W / 2, 300);

  // "adlı kişiye..."
  ctx.fillStyle = "#9ca3af";
  ctx.font = "18px Georgia, serif";
  ctx.fillText("adlı kişinin aşağıdaki kursu başarıyla tamamladığını onaylar:", W / 2, 348);

  // Course title
  ctx.fillStyle = "#7c3aed";
  ctx.font = "bold 36px Georgia, serif";
  ctx.fillText(cert.courseTitle, W / 2, 418);

  // Meta
  ctx.fillStyle = "#6b7280";
  ctx.font = "16px Georgia, serif";
  ctx.fillText(`${cert.category} · ${cert.level}`, W / 2, 460);

  // Divider
  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(200, 490);
  ctx.lineTo(W - 200, 490);
  ctx.stroke();

  // Date + Number row
  ctx.fillStyle = "#374151";
  ctx.font = "14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Veriliş: ${new Date(cert.issuedAt).toLocaleDateString("tr-TR")}`, 100, 540);

  ctx.textAlign = "right";
  ctx.fillText(`Sertifika No: ${cert.number}`, W - 100, 540);

  // QR code (right side)
  try {
    const qr = await loadImage(qrImageUrl(cert.verifyUrl, 240));
    const qrSize = 120;
    const qrX = W - 100 - qrSize;
    const qrY = 580;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
    ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Karekod ile doğrula", qrX + qrSize / 2, qrY + qrSize + 16);
  } catch {
    // QR yüklenemezse sessiz geç
  }

  // Verify URL
  ctx.fillStyle = "#9ca3af";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Doğrulama: ${cert.verifyUrl}`, W / 2, 575);

  // Seal circle (left side)
  const sx = 180, sy = 660, sr = 55;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fillStyle = "#7c3aed";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(sx, sy, sr - 6, 0, Math.PI * 2);
  ctx.strokeStyle = "#c4b5fd";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("✓", sx, sy - 4);
  ctx.font = "10px Georgia, serif";
  ctx.fillText("ONAYLANDI", sx, sy + 14);

  // Bottom bar
  ctx.fillStyle = "#7c3aed";
  ctx.fillRect(20, H - 26, W - 40, 6);

  // Export as PNG then trigger download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EduCell-Sertifika-${cert.number}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
