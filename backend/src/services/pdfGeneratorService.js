import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AppError from '../errors/AppError.js';
import * as utils from '../utils/exportUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveExistingFontPath = (candidates) => {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolvedPath = path.resolve(candidate);
    if (fs.existsSync(resolvedPath)) return resolvedPath;
  }
  return null;
};

const getPdfFontPaths = () => {
  const regularFontPath = resolveExistingFontPath([
    process.env.PDF_FONT_REGULAR_PATH,
    path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf'),
    path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf'),
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    'C:/Windows/Fonts/tahoma.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    '/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
  ]);

  const boldFontPath = resolveExistingFontPath([
    process.env.PDF_FONT_BOLD_PATH,
    path.join(__dirname, '../assets/fonts/NotoSans-Bold.ttf'),
    path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf'),
    'C:/Windows/Fonts/arialbd.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    'C:/Windows/Fonts/tahomabd.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
    '/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  ]);

  if (!regularFontPath || !boldFontPath) {
    throw new AppError(
      'Không tìm thấy phông chữ Unicode để xuất PDF. Hãy cấu hình PDF_FONT_REGULAR_PATH và PDF_FONT_BOLD_PATH.',
      500,
    );
  }

  return { regularFontPath, boldFontPath };
};

export const registerFonts = (doc) => {
  const { regularFontPath, boldFontPath } = getPdfFontPaths();
  doc.registerFont(utils.PDF_FONT_REGULAR, regularFontPath);
  doc.registerFont(utils.PDF_FONT_BOLD, boldFontPath);
  doc.font(utils.PDF_FONT_REGULAR);
};

export const drawHeader = (doc, title = "FireQuiz - Report") => {
  doc
    .strokeColor("#E2E8F0")
    .lineWidth(0.5)
    .moveTo(40, 30)
    .lineTo(doc.page.width - 40, 30)
    .stroke();
  doc
    .font(utils.PDF_FONT_REGULAR)
    .fontSize(8)
    .fillColor("#64748B")
    .text(title, 40, 18, { width: 200, align: "left" });
  doc.y = 50;
};

export const drawSummaryGrid = (doc, summary) => {
  const MARGIN = 40;
  const CONTENT_W = doc.page.width - MARGIN * 2;
  const COL_COUNT = 4;
  const COL_W = CONTENT_W / COL_COUNT;
  const summaryY = doc.y;
  const CARD_H = 60;

  doc.roundedRect(MARGIN, summaryY, CONTENT_W, CARD_H, 4).fill("#F8FAFC");

  const columns = [
    { label: "Tổng thí sinh",    value: String(summary.totalParticipants) },
    { label: "Điểm trung bình",  value: `${summary.averageScore.toFixed(2)}/${summary.gradingScale}` },
    { label: "Tỷ lệ đúng",      value: utils.formatPercentage(summary.accuracyRate) },
    { label: "TB thời gian",     value: utils.formatDuration(summary.averageDurationSeconds) },
  ];

  columns.forEach(({ label, value }, i) => {
    const colX = MARGIN + i * COL_W + 12;

    // Divider between columns (except the first)
    if (i > 0) {
      doc.strokeColor("#E2E8F0").lineWidth(0.5)
         .moveTo(MARGIN + i * COL_W, summaryY + 10)
         .lineTo(MARGIN + i * COL_W, summaryY + CARD_H - 10)
         .stroke();
    }

    doc.font(utils.PDF_FONT_BOLD).fontSize(8).fillColor("#64748B")
       .text(label, colX, summaryY + 12, { width: COL_W - 16 });

    doc.font(utils.PDF_FONT_BOLD).fontSize(13).fillColor("#0F172A")
       .text(value, colX, summaryY + 27, { width: COL_W - 16 });
  });

  doc.y = summaryY + CARD_H + 10;
};

export const drawResultRowCard = (doc, row, index, gradingScale) => {
  const totalResponses = Number(row.correct_count ?? 0) + Number(row.incorrect_count ?? 0);
  const accuracyRate = totalResponses ? (Number(row.correct_count ?? 0) * 100) / totalResponses : 0;
  const evaluations = row.evaluations || [];

  // A4 content width = 595 - 80 = 515px, left margin = 40
  const MARGIN = 40;
  const CONTENT_W = doc.page.width - MARGIN * 2;

  // Estimate height: header row (40) + stats row (20) + eval grid + padding
  const evCols = 10;
  const evRows = evaluations.length > 0 ? Math.ceil(evaluations.length / evCols) : 0;
  const evHeight = evRows > 0 ? evRows * 14 + 10 : 0;
  const cardHeight = 72 + evHeight;

  if (doc.y + cardHeight > doc.page.height - 50) {
    doc.addPage();
    drawHeader(doc);
  }

  const cardTop = doc.y;
  const scoreTone = utils.getScoreTone(Number(row.score ?? 0), gradingScale);
  const scoreColor = scoreTone.font === utils.REPORT_THEME.success ? "#059669"
                   : scoreTone.font === utils.REPORT_THEME.warning  ? "#D97706"
                   : "#DC2626";

  // Card border (thin, matches drawSummaryGrid style)
  doc.roundedRect(MARGIN, cardTop, CONTENT_W, cardHeight, 4)
     .strokeColor("#E2E8F0").lineWidth(0.5).stroke();

  // ── Row 1: Name + Score ──────────────────────────────────────
  const nameX   = MARGIN + 12;
  const scoreX  = MARGIN + CONTENT_W - 90; // right-align score block

  doc.font(utils.PDF_FONT_BOLD).fontSize(10).fillColor("#1E293B")
     .text(`#${index + 1}  ${row.full_name}`, nameX, cardTop + 10, { width: scoreX - nameX - 8 });

  doc.font(utils.PDF_FONT_BOLD).fontSize(13).fillColor(scoreColor)
     .text(Number(row.score ?? 0).toFixed(2), scoreX, cardTop + 8, { width: 78, align: 'right' });

  // ── Row 2: Email + metadata ──────────────────────────────────
  doc.font(utils.PDF_FONT_REGULAR).fontSize(8).fillColor("#64748B")
     .text(`${row.email}  ·  ID: USER${String(row.user_id).padStart(4, "0")}`, nameX, cardTop + 25, { width: scoreX - nameX - 8 });

  doc.font(utils.PDF_FONT_REGULAR).fontSize(8).fillColor("#94A3B8")
     .text(`/${gradingScale}`, scoreX, cardTop + 24, { width: 78, align: 'right' });

  // ── Row 3: Stats bar ─────────────────────────────────────────
  const statsY = cardTop + 42;
  doc.strokeColor("#F1F5F9").lineWidth(0.5)
     .moveTo(MARGIN, statsY).lineTo(MARGIN + CONTENT_W, statsY).stroke();

  doc.font(utils.PDF_FONT_REGULAR).fontSize(8).fillColor("#475569");
  const colW = CONTENT_W / 4;
  [
    `✓ Đúng: ${row.correct_count ?? 0}`,
    `✗ Sai: ${row.incorrect_count ?? 0}`,
    `≈ Tỉ lệ: ${utils.formatPercentage(accuracyRate)}`,
    `⏱ ${utils.formatDuration(row.duration_seconds)}`,
  ].forEach((label, i) => {
    doc.text(label, MARGIN + 12 + i * colW, statsY + 6, { width: colW - 8 });
  });

  // ── Row 4: Evaluation text grid ──────────────────────────────
  if (evaluations.length > 0) {
    const gridY = cardTop + 62;
    doc.strokeColor("#F1F5F9").lineWidth(0.5)
       .moveTo(MARGIN, gridY).lineTo(MARGIN + CONTENT_W, gridY).stroke();

    evaluations.forEach((ev, eIdx) => {
      const col = eIdx % evCols;
      const row2 = Math.floor(eIdx / evCols);
      const cellW = CONTENT_W / evCols;
      const cellX = MARGIN + col * cellW;
      const cellY = gridY + 3 + row2 * 14;

      doc.font(utils.PDF_FONT_BOLD).fontSize(6.5)
         .fillColor(ev.is_correct ? "#15803D" : "#B91C1C")
         .text(`C${eIdx + 1}:${ev.is_correct ? 'Đ' : 'S'}`, cellX + 2, cellY, { width: cellW - 4, align: 'center' });
    });
  }

  doc.y = cardTop + cardHeight + 8;
};

export const drawQuestionCard = async (doc, q, index, { showCorrect = false, showExplanation = false } = {}, imageBuffer = null) => {
  const estimatedHeight = q.media_url ? 250 : 120;
  if (doc.y + estimatedHeight > doc.page.height - 50) doc.addPage();

  const startY = doc.y;

  // 1. Header: Câu [X]: [Nội dung] [QR + Link nếu là audio/video]
  doc.font(utils.PDF_FONT_BOLD).fontSize(11).fillColor("#0F172A").text(`Câu ${index + 1}: `, { continued: true });
  doc.font(utils.PDF_FONT_REGULAR).fontSize(11).text(q.content, { continued: !!q.media_url });

  if (q.media_url) {
    const redirectUrl = utils.getMediaViewUrl(q.media_url);
    const qrBuffer = await utils.generateQRCodeBuffer(redirectUrl);
    if (qrBuffer) {
      const qrSize = 50;
      const xPos = doc.page.width - 100;
      const yPos = startY; // Sát lề trên của câu hỏi
      doc.image(qrBuffer, xPos, yPos, { width: qrSize });
      doc.font(utils.PDF_FONT_REGULAR).fontSize(7).fillColor("#2563EB").text("Click để xem", xPos, yPos + qrSize + 2, { 
        width: qrSize, 
        align: 'center', 
        link: redirectUrl,
        underline: true 
      });
    }
    doc.text("", { continued: false }); // Reset continued
  }

  doc.moveDown(0.5);

  // 2. Hình ảnh nếu có (Nằm dưới câu hỏi)
  if (imageBuffer) {
    try {
      doc.image(imageBuffer, { fit: [350, 200], align: 'center' });
      doc.moveDown(0.8);
    } catch (err) {}
  }

  // 3. Loại câu hỏi
  let typeLabel = q.type === 'MULTI_ANSWERS' ? '[Chọn nhiều đáp án]' : 
                   q.type === 'TEXT' ? '[Tự luận]' : 
                   q.type === 'TRUE_FALSE' ? '[Chọn Đúng/Sai]' : '[Chọn 1 đáp án]';

  doc.font(utils.PDF_FONT_BOLD).fontSize(9).fillColor("#64748B").text(typeLabel);
  doc.moveDown(0.5);

  // 4. Lựa chọn (Nếu không phải Tự luận)
  if (q.type !== 'TEXT') {
    q.answers.forEach((a, aIdx) => {
      const label = utils.getOptionLabel(aIdx);
      const isCorrect = showCorrect && a.is_correct;
      doc.font(isCorrect ? utils.PDF_FONT_BOLD : utils.PDF_FONT_REGULAR)
         .fontSize(10)
         .fillColor(isCorrect ? "#16A34A" : "#334155")
         .text(`${label}. ${a.content}`, { indent: 15 });
    });
  }

  if (showExplanation && q.explanation) {
    doc.moveDown(0.5);
    doc.font(utils.PDF_FONT_BOLD).fontSize(9).fillColor("#2563EB").text(`Giải thích: `, { indent: 15, continued: true });
    doc.font(utils.PDF_FONT_REGULAR).text(q.explanation);
  }

  doc.moveDown(1.5);
};

export const drawReviewQuestion = async (doc, q, index, imageBuffer = null) => {
  const estimatedHeight = q.media_url ? 250 : 120;
  if (doc.y + estimatedHeight > doc.page.height - 50) doc.addPage();

  const startY = doc.y;
  const isCorrect = q.options.every(o => o.is_correct === o.selected);
  const statusColor = isCorrect ? "#16A34A" : "#DC2626";

  // 1. Header: Câu [X]: [Nội dung] [ĐÚNG/SAI] [QR + Link]
  doc.font(utils.PDF_FONT_BOLD).fontSize(11).fillColor("#0F172A").text(`Câu ${index + 1}: `, { continued: true });
  doc.font(utils.PDF_FONT_REGULAR).text(q.content, { continued: true });
  doc.font(utils.PDF_FONT_BOLD).fillColor(statusColor).text(` [${isCorrect ? 'ĐÚNG' : 'SAI'}]`, { continued: !!q.media_url });

  if (q.media_url) {
    const redirectUrl = utils.getMediaViewUrl(q.media_url);
    const qr = await utils.generateQRCodeBuffer(redirectUrl);
    if (qr) {
      const qrSize = 50;
      const xPos = doc.page.width - 110;
      const qrY = startY;
      doc.image(qr, xPos, qrY, { width: qrSize });
      doc.font(utils.PDF_FONT_REGULAR).fontSize(6).fillColor("#2563EB").text("Click để xem", xPos, qrY + qrSize + 2, { 
        width: qrSize, 
        align: 'center',
        link: redirectUrl,
        underline: true
      });
    }
    doc.text("", { continued: false });
  }

  doc.moveDown(0.5);

  // 2. Hình ảnh nếu có (Nằm dưới câu hỏi)
  if (imageBuffer) {
    try {
      doc.image(imageBuffer, { fit: [250, 150], align: 'center' });
      doc.moveDown(0.8);
    } catch (err) {}
  }

  // 3. Lựa chọn & Kết quả
  q.options.forEach((opt, oIdx) => {
    const label = utils.getOptionLabel(oIdx);
    const userPicked = opt.selected;
    const correctFlag = opt.is_correct;
    let color = "#334155";
    let prefix = "";
    if (correctFlag) { color = "#166534"; prefix = "[ĐÚNG] "; }
    else if (userPicked && !correctFlag) { color = "#991B1B"; prefix = "[SAI] "; }

    doc.font(userPicked || correctFlag ? utils.PDF_FONT_BOLD : utils.PDF_FONT_REGULAR).fontSize(10).fillColor(color).text(`${prefix}${label}. ${opt.content}`, { indent: 15 });
    if (userPicked) doc.font(utils.PDF_FONT_BOLD).fontSize(8).fillColor(color).text("   (Lựa chọn của bạn)", { indent: 15 });
  });

  if (q.explanation) {
    doc.moveDown(0.3);
    doc.font(utils.PDF_FONT_BOLD).fontSize(9).fillColor("#2563EB").text(`Giải thích: `, { indent: 15, continued: true });
    doc.font(utils.PDF_FONT_REGULAR).text(q.explanation);
  }

  doc.moveDown(1.5);
};

export const drawSubmissionSlip = async (doc, attempt, user, questions) => {
  registerFonts(doc);
  
  // Header
  doc.font(utils.PDF_FONT_BOLD).fontSize(20).fillColor("#1E293B").text("PHIẾU KẾT QUẢ LÀM BÀI", { align: 'center' });
  doc.fontSize(12).fillColor("#64748B").text("FireQuiz - Hệ thống kiểm tra trực tuyến", { align: 'center' });
  doc.moveDown(1.5);

  // Divider
  doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
  doc.moveDown(1);

  // Student & Quiz Info
  const infoY = doc.y;
  doc.font(utils.PDF_FONT_BOLD).fontSize(10).fillColor("#475569");
  doc.text("THÔNG TIN THÍ SINH", 50, infoY);
  doc.font(utils.PDF_FONT_REGULAR).fillColor("#1E293B");
  doc.text(`Họ tên: ${user.full_name || 'N/A'}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Thời gian nộp: ${utils.formatDateTime(attempt.finished_at)}`);

  doc.font(utils.PDF_FONT_BOLD).fillColor("#475569").text("THÔNG TIN BÀI THI", 300, infoY);
  doc.font(utils.PDF_FONT_REGULAR).fillColor("#1E293B");
  doc.text(`Tên Quiz: ${attempt.quiz_title}`, 300);
  doc.text(`Thời gian làm: ${utils.formatDuration(attempt.duration_seconds)}`, 300);
  doc.text(`Vi phạm Tab: ${attempt.tab_violations || 0} lần`, 300);
  
  doc.moveDown(2);

  // Score Badge (Text-based)
  const scoreY = doc.y;
  doc.roundedRect(50, scoreY, doc.page.width - 100, 60, 4).fill("#F8FAFC");
  doc.font(utils.PDF_FONT_BOLD).fontSize(12).fillColor("#64748B").text("ĐIỂM SỐ CUỐI CÙNG", 70, scoreY + 15);
  doc.font(utils.PDF_FONT_BOLD).fontSize(24).fillColor("#2563EB").text(`${Number(attempt.score).toFixed(2)}`, 70, scoreY + 30, { continued: true });
  doc.fontSize(12).fillColor("#94A3B8").text(` / ${attempt.grading_scale || 10}`);
  
  doc.moveDown(3);

  // Answer Grid Header
  doc.font(utils.PDF_FONT_BOLD).fontSize(11).fillColor("#1E293B").text("BẢNG TỔNG HỢP ĐÁP ÁN");
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colX = [60, 110, 420];

  // Header Row
  doc.font(utils.PDF_FONT_BOLD).fontSize(9).fillColor("#64748B");
  doc.text("STT", colX[0], tableTop);
  doc.text("Lựa chọn của bạn", colX[1], tableTop);
  doc.text("Kết quả", colX[2], tableTop);
  
  doc.strokeColor("#CBD5E1").lineWidth(0.5).moveTo(50, tableTop + 14).lineTo(doc.page.width - 50, tableTop + 14).stroke();

  let currentY = tableTop + 20;

  questions.forEach((q, idx) => {
    if (currentY > doc.page.height - 60) {
      doc.addPage();
      drawHeader(doc, `Tiếp tục: ${attempt.quiz_title}`);
      currentY = 70;
    }

    const selections = q.options
      .map((o, oIdx) => (o.selected ? utils.getOptionLabel(oIdx) : null))
      .filter(Boolean)
      .join(", ") || "[Bỏ trống]";
    
    const isCorrect = q.options.every(o => o.is_correct === o.selected);

    doc.font(utils.PDF_FONT_REGULAR).fontSize(9).fillColor("#334155");
    doc.text(`${idx + 1}`, colX[0], currentY);
    doc.text(selections, colX[1], currentY);
    
    doc.font(utils.PDF_FONT_BOLD).fillColor(isCorrect ? "#16A34A" : "#DC2626");
    doc.text(isCorrect ? "ĐÚNG" : "SAI", colX[2], currentY);

    currentY += 18;
  });

  // Footer
  doc.font(utils.PDF_FONT_REGULAR).fontSize(8).fillColor("#94A3B8").text(
    `Bản xác thực điện tử bởi FireQuiz Platform. Mã định danh: ATTEMPT-${attempt.id}`,
    50,
    doc.page.height - 40,
    { align: 'center' }
  );
};
