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
  const summaryY = doc.y;
  doc.roundedRect(40, summaryY, doc.page.width - 80, 50, 4).fill("#F8FAFC");
  
  doc.font(utils.PDF_FONT_BOLD).fontSize(9).fillColor("#1E293B");
  doc.text("Tổng thí sinh", 60, summaryY + 12, { width: 100 });
  doc.text("Điểm trung bình", 180, summaryY + 12, { width: 100 });
  doc.text("Tỷ lệ đúng", 300, summaryY + 12, { width: 100 });
  doc.text("TB thời gian", 420, summaryY + 12, { width: 100 });

  doc.font(utils.PDF_FONT_REGULAR).fontSize(11).fillColor("#0F172A");
  doc.text(summary.totalParticipants, 60, summaryY + 26);
  doc.text(`${summary.averageScore.toFixed(2)}/${summary.gradingScale}`, 180, summaryY + 26);
  doc.text(utils.formatPercentage(summary.accuracyRate), 300, summaryY + 26);
  doc.text(utils.formatDuration(summary.averageDurationSeconds), 420, summaryY + 26);
  
  doc.y = summaryY + 65;
};

export const drawResultRowCard = (doc, row, index, gradingScale) => {
  const totalResponses = Number(row.correct_count ?? 0) + Number(row.incorrect_count ?? 0);
  const accuracyRate = totalResponses ? (Number(row.correct_count ?? 0) * 100) / totalResponses : 0;
  const evaluations = row.evaluations || [];
  const boxesPerRow = 15;
  const evaluationRows = Math.ceil(evaluations.length / boxesPerRow);
  const evaluationSectionHeight = evaluations.length > 0 ? (evaluationRows * 16) + 8 : 0;
  const cardHeight = 54 + evaluationSectionHeight;

  if (doc.y + cardHeight > doc.page.height - 40) {
    doc.addPage();
    drawHeader(doc);
  }

  const cardTop = doc.y;
  const scoreTone = utils.getScoreTone(Number(row.score ?? 0), gradingScale);
  const scoreColor = scoreTone.font === utils.REPORT_THEME.success ? "#059669" : 
                    scoreTone.font === utils.REPORT_THEME.warning ? "#D97706" : "#DC2626";

  doc.roundedRect(40, cardTop, doc.page.width - 80, cardHeight, 4).strokeColor("#F1F5F9").lineWidth(0.5).stroke();

  doc.font(utils.PDF_FONT_BOLD).fontSize(10).fillColor("#1E293B").text(`#${index + 1} ${row.full_name}`, 50, cardTop + 8, { width: 300 });
  doc.font(utils.PDF_FONT_REGULAR).fontSize(8).fillColor("#64748B").text(`${row.email} | USER${String(row.user_id).padStart(4, "0")}`, 50, cardTop + 24);

  // Score
  doc.font(utils.PDF_FONT_BOLD).fontSize(14).fillColor(scoreColor).text(Number(row.score ?? 0).toFixed(2), doc.page.width - 120, cardTop + 10, { width: 60, align: 'right' });
  doc.font(utils.PDF_FONT_REGULAR).fontSize(8).fillColor("#94A3B8").text(`/${gradingScale}`, doc.page.width - 120, cardTop + 28, { width: 60, align: 'right' });

  // Stats
  doc.font(utils.PDF_FONT_REGULAR).fontSize(8).fillColor("#475569")
    .text(`Đúng/Sai: ${row.correct_count}/${row.incorrect_count}`, 50, cardTop + 38, { width: 120 })
    .text(`Tỉ lệ: ${utils.formatPercentage(accuracyRate)}`, 180, cardTop + 38, { width: 100 })
    .text(`Thời gian: ${utils.formatDuration(row.duration_seconds)}`, 300, cardTop + 38, { width: 100 });

  // Evaluation Grid
  if (evaluations.length > 0) {
    evaluations.forEach((evaluation, eIdx) => {
      const rIdx = Math.floor(eIdx / boxesPerRow);
      const cIdx = eIdx % boxesPerRow;
      const boxX = 50 + cIdx * 34;
      const boxY = cardTop + 52 + rIdx * 16;
      doc.roundedRect(boxX, boxY, 30, 12, 1).fillAndStroke(evaluation.is_correct ? "#F0FDF4" : "#FEF2F2", evaluation.is_correct ? "#DCFCE7" : "#FEE2E2");
      doc.font(utils.PDF_FONT_BOLD).fontSize(6).fillColor(evaluation.is_correct ? "#15803D" : "#B91C1C").text(`C${eIdx + 1}:${evaluation.is_correct ? 'Đ' : 'S'}`, boxX, boxY + 3, { width: 30, align: 'center' });
    });
  }

  doc.y = cardTop + cardHeight + 8;
};

export const drawQuestionCard = async (doc, q, index, { showCorrect = false, showExplanation = false } = {}) => {
  const estimatedHeight = q.media_url ? 200 : 100;
  if (doc.y + estimatedHeight > doc.page.height - 50) doc.addPage();

  let typeLabel = q.type === 'MULTI_ANSWERS' ? '(Nhiều đáp án)' : 
                   q.type === 'TEXT' ? '(Tự luận)' : 
                   q.type === 'TRUE_FALSE' ? '(Đúng/Sai)' : '(Một đáp án)';

  doc.font(utils.PDF_FONT_BOLD).fontSize(11).fillColor("#0F172A").text(`Câu ${index + 1}: `, { continued: true });
  doc.font(utils.PDF_FONT_REGULAR).fontSize(11).text(q.content);
  doc.font(utils.PDF_FONT_REGULAR).fontSize(8).fillColor("#94A3B8").text(typeLabel);
  doc.moveDown(0.3);

  // Handle Media
  if (q.media_url) {
    if (utils.isImageUrl(q.media_url)) {
      const imageBuffer = await utils.downloadMediaBuffer(q.media_url);
      if (imageBuffer) {
        try { doc.image(imageBuffer, { fit: [250, 150], align: 'center' }); doc.moveDown(0.5); } catch (err) {}
      }
    } else {
      const redirectUrl = utils.getMediaViewUrl(q.media_url);
      const qrBuffer = await utils.generateQRCodeBuffer(redirectUrl);
      if (qrBuffer) {
        const currentY = doc.y;
        doc.image(qrBuffer, doc.page.width - 120, currentY - 20, { width: 60 });
        doc.font(utils.PDF_FONT_REGULAR).fontSize(7).fillColor("#2563EB").text("[Quét để xem media]", doc.page.width - 125, currentY + 42, { width: 70, align: 'center' });
      }
    }
  }

  if (q.type === 'TEXT') {
    doc.moveDown(0.5);
    doc.font(utils.PDF_FONT_REGULAR).fontSize(10).fillColor("#E2E8F0");
    for (let i = 0; i < 4; i++) {
      doc.text("..................................................................................................................................................", { indent: 10 });
      doc.moveDown(0.4);
    }
  } else {
    q.answers.forEach((a, aIdx) => {
      const label = utils.getOptionLabel(aIdx);
      const isCorrect = showCorrect && a.is_correct;
      doc.font(isCorrect ? utils.PDF_FONT_BOLD : utils.PDF_FONT_REGULAR).fontSize(10).fillColor(isCorrect ? "#16A34A" : "#334155").text(`${label}. ${a.content}`, { indent: 15 });
    });
  }

  if (showExplanation && q.explanation) {
    doc.moveDown(0.2);
    doc.font(utils.PDF_FONT_REGULAR).fontSize(9).fillColor("#2563EB").text(`Giải thích: ${q.explanation}`, { indent: 15 });
  }

  doc.moveDown(1);
};

export const drawReviewQuestion = async (doc, q, index) => {
  const estimatedHeight = q.media_url ? 220 : 120;
  if (doc.y + estimatedHeight > doc.page.height - 50) doc.addPage();

  const isCorrect = q.options.every(o => o.is_correct === o.selected);
  const statusColor = isCorrect ? "#16A34A" : "#DC2626";

  doc.font(utils.PDF_FONT_BOLD).fontSize(11).fillColor("#0F172A").text(`Câu ${index + 1}: `, { continued: true });
  doc.font(utils.PDF_FONT_REGULAR).text(q.content, { continued: true });
  doc.font(utils.PDF_FONT_BOLD).fillColor(statusColor).text(` [${isCorrect ? 'ĐÚNG' : 'SAI'}]`);
  doc.moveDown(0.3);

  // Handle Media (Simplified for Review)
  if (q.media_url) {
    if (utils.isImageUrl(q.media_url)) {
      const img = await utils.downloadMediaBuffer(q.media_url);
      if (img) try { doc.image(img, { fit: [200, 120] }); doc.moveDown(0.5); } catch(e){}
    } else {
      const qr = await utils.generateQRCodeBuffer(utils.getMediaViewUrl(q.media_url));
      if (qr) {
        doc.image(qr, doc.page.width - 110, doc.y - 15, { width: 50 });
        doc.font(utils.PDF_FONT_REGULAR).fontSize(6).fillColor("#2563EB").text("[Quét để xem media]", doc.page.width - 110, doc.y, { width: 50, align: 'center' });
      }
    }
  }

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
