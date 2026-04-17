import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';
import * as quizRepository from '../repositories/quizRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import * as attemptAggregationService from '../services/attemptAggregationService.js';
import AppError from '../errors/AppError.js';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Phân tách câu hỏi Tự luận (TEXT) và câu hỏi trắc nghiệm.
 * Câu tự luận luôn được dồn về cuối.
 */
const prepareQuestionsForExport = (questions, randomize = false) => {
  let sortedQuestions = [...questions];
  
  if (randomize) {
    sortedQuestions = shuffleArray(sortedQuestions).map(q => ({
      ...q,
      answers: shuffleArray(q.answers || [])
    }));
  }

  const objectiveQuestions = sortedQuestions.filter(q => q.type !== 'TEXT');
  const subjectiveQuestions = sortedQuestions.filter(q => q.type === 'TEXT');

  return [...objectiveQuestions, ...subjectiveQuestions];
};

/**
 * Tải media từ URL về Buffer.
 */
const downloadMediaBuffer = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error downloading media:', error);
    return null;
  }
};

/**
 * Tạo QR Code Buffer từ text.
 */
const generateQRCodeBuffer = async (text) => {
  try {
    return await QRCode.toBuffer(text, {
      margin: 1,
      width: 100,
      color: { dark: '#000000', light: '#ffffff' }
    });
  } catch (err) {
    console.error('QR Code error:', err);
    return null;
  }
};

/**
 * Kiểm tra xem URL có phải là ảnh không dựa vào extension.
 */
const isImageUrl = (url) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url.split('?')[0]);
};

/**
 * Lấy link Redirect cho media để QR Code và Excel sử dụng.
 */
const getMediaViewUrl = (path, bucket) => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  const encodedPath = encodeURIComponent(path);
  return `${baseUrl}/api/v1/media/view?path=${encodedPath}${bucket ? `&bucket=${bucket}` : ''}`;
};
const PDF_FONT_REGULAR = 'report-regular';
const PDF_FONT_BOLD = 'report-bold';
const EXCEL_TABLE_HEADER_ROW = 9;
const REPORT_THEME = {
  primary: 'FF1D4ED8',
  success: 'FF059669',
  successSoft: 'FFD1FAE5',
  warning: 'FFD97706',
  warningSoft: 'FFFEF3C7',
  danger: 'FFDC2626',
  dangerSoft: 'FFFEE2E2',
  slateSoft: 'FFF8FAFC',
  slateLine: 'FFE2E8F0',
  mutedText: 'FF475569',
};

const resolveExistingFontPath = (candidates) => {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const resolvedPath = path.resolve(candidate);

    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
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

  return {
    regularFontPath,
    boldFontPath,
  };
};

const registerPdfFonts = (doc) => {
  const { regularFontPath, boldFontPath } = getPdfFontPaths();

  doc.registerFont(PDF_FONT_REGULAR, regularFontPath);
  doc.registerFont(PDF_FONT_BOLD, boldFontPath);
  doc.font(PDF_FONT_REGULAR);
};

const checkQuizExistAndOwner = (quiz, user) => {
  if (!quiz) {
    throw new AppError("Bộ câu hỏi không tồn tại", 404);
  }

  if (!user || user.id != quiz.creator_id) {
    throw new AppError("Bạn không có quyền thực hiện hành động này", 403);
  }
};

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) {
    return "--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}m ${String(remainSeconds).padStart(2, "0")}s`;
};

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString("vi-VN");
};

const formatPercentage = (value) => `${Number(value || 0).toFixed(2)}%`;

const getCreatorDisplayName = (user) =>
  user?.full_name || user?.fullName || user?.email || 'Unknown';

const getScheduleText = (quiz) => {
  if (!quiz.available_from && !quiz.available_until) {
    return 'Không giới hạn';
  }

  return `${formatDateTime(quiz.available_from)} - ${formatDateTime(quiz.available_until)}`;
};

const calculateSummary = (quiz, rows) => {
  const totalParticipants = rows.length;
  const gradingScale = Number(quiz.grading_scale ?? 10);
  const totalCorrect = rows.reduce((sum, row) => sum + Number(row.correct_count ?? 0), 0);
  const totalIncorrect = rows.reduce((sum, row) => sum + Number(row.incorrect_count ?? 0), 0);
  const totalAnswered = totalCorrect + totalIncorrect;
  const averageScore = totalParticipants
    ? rows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / totalParticipants
    : 0;
  const highestScore = totalParticipants
    ? Math.max(...rows.map((row) => Number(row.score ?? 0)))
    : 0;
  const averageDurationSeconds = totalParticipants
    ? Math.round(
        rows.reduce((sum, row) => sum + Number(row.duration_seconds ?? 0), 0) /
          totalParticipants,
      )
    : 0;
  const accuracyRate = totalAnswered ? (totalCorrect * 100) / totalAnswered : 0;

  return {
    gradingScale,
    totalParticipants,
    totalCorrect,
    totalIncorrect,
    averageScore,
    highestScore,
    averageDurationSeconds,
    accuracyRate,
  };
};

const getScoreTone = (score, gradingScale) => {
  const ratio = gradingScale > 0 ? score / gradingScale : 0;

  if (ratio >= 0.8) {
    return { fill: REPORT_THEME.successSoft, font: REPORT_THEME.success };
  }

  if (ratio >= 0.5) {
    return { fill: REPORT_THEME.warningSoft, font: REPORT_THEME.warning };
  }

  return { fill: REPORT_THEME.dangerSoft, font: REPORT_THEME.danger };
};

const getAccuracyTone = (accuracy) => {
  if (accuracy >= 80) {
    return { fill: REPORT_THEME.successSoft, font: REPORT_THEME.success };
  }

  if (accuracy >= 50) {
    return { fill: REPORT_THEME.warningSoft, font: REPORT_THEME.warning };
  }

  return { fill: REPORT_THEME.dangerSoft, font: REPORT_THEME.danger };
};

const buildFileName = (title, extension) => {
  const normalizedTitle = String(title || "quiz-report")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${normalizedTitle || "quiz-report"}-report.${extension}`;
};

const getReportData = async (quizId, user) => {
  const quiz = await quizRepository.getQuizById(quizId);

  checkQuizExistAndOwner(quiz, user);

  const rows = await attemptAggregationService.getResultReportDataByQuizId(quizId);
  const generatedAt = new Date();
  const generatedBy = getCreatorDisplayName(user);
  const summary = calculateSummary(quiz, rows);

  return {
    quiz,
    rows,
    generatedAt,
    generatedBy,
    summary,
  };
};

export const buildExcelReport = async (quizId, user) => {
  const { quiz, rows, generatedAt, generatedBy, summary } = await getReportData(quizId, user);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Báo cáo kết quả");

  workbook.creator = 'FireQuiz';
  workbook.company = 'FireQuiz';
  workbook.created = generatedAt;
  workbook.modified = generatedAt;

  worksheet.columns = [
    { header: "Hạng", key: "rank", width: 10 },
    { header: "Thí sinh", key: "full_name", width: 28 },
    { header: "Email", key: "email", width: 30 },
    { header: "Mã học sinh", key: "student_code", width: 14 },
    { header: "Điểm", key: "score", width: 12, style: { numFmt: '0.00' } },
    { header: "Thời gian", key: "duration", width: 14 },
    { header: "Đúng", key: "correct_count", width: 10 },
    { header: "Sai", key: "incorrect_count", width: 10 },
    { header: "Tỷ lệ đúng", key: "accuracy_rate", width: 12, style: { numFmt: '0.00%' } },
    { header: "Bắt đầu", key: "started_at", width: 22 },
    { header: "Hoàn thành", key: "finished_at", width: 22 },
  ];

  worksheet.views = [{ state: 'frozen', ySplit: EXCEL_TABLE_HEADER_ROW, showGridLines: false }];
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.45, bottom: 0.45 },
  };

  worksheet.mergeCells("A1:K1");
  worksheet.getCell("A1").value = `Báo cáo kết quả bộ câu hỏi - ${quiz.title}`;
  worksheet.getCell("A1").font = {
    size: 18,
    bold: true,
    color: { argb: REPORT_THEME.primary },
  };
  worksheet.getCell("A1").alignment = { horizontal: "left", vertical: "middle" };

  worksheet.mergeCells("A2:K2");
  worksheet.getCell("A2").value =
    "Báo cáo được định dạng để đối chiếu nhanh, lọc dữ liệu và in A4 ngang.";
  worksheet.getCell("A2").font = { size: 10, color: { argb: REPORT_THEME.mutedText } };
  worksheet.getCell("A2").alignment = { horizontal: "left", vertical: "middle" };

  worksheet.getCell("A4").value = "Bộ câu hỏi";
  worksheet.getCell("B4").value = quiz.title || "--";
  worksheet.getCell("D4").value = "Người xuất";
  worksheet.getCell("E4").value = generatedBy;
  worksheet.getCell("G4").value = "Ngày xuất";
  worksheet.getCell("H4").value = formatDateTime(generatedAt);
  worksheet.getCell("J4").value = "Lịch mở";
  worksheet.getCell("K4").value = getScheduleText(quiz);

  worksheet.getCell("A5").value = "Tổng thí sinh";
  worksheet.getCell("B5").value = summary.totalParticipants;
  worksheet.getCell("D5").value = "Điểm trung bình";
  worksheet.getCell("E5").value = `${summary.averageScore.toFixed(2)}/${summary.gradingScale}`;
  worksheet.getCell("G5").value = "Tỷ lệ đúng";
  worksheet.getCell("H5").value = formatPercentage(summary.accuracyRate);
  worksheet.getCell("J5").value = "TB thời gian";
  worksheet.getCell("K5").value = formatDuration(summary.averageDurationSeconds);

  worksheet.getCell("A6").value = "Trạng thái";
  worksheet.getCell("B6").value = quiz.status || "--";
  worksheet.getCell("D6").value = "Thang điểm";
  worksheet.getCell("E6").value = `${summary.gradingScale}`;
  worksheet.getCell("G6").value = "Tổng đúng / sai";
  worksheet.getCell("H6").value = `${summary.totalCorrect} / ${summary.totalIncorrect}`;
  worksheet.getCell("J6").value = "Giới hạn";
  worksheet.getCell("K6").value = formatDuration(quiz.time_limit_seconds);

  ['A4', 'D4', 'G4', 'J4', 'A5', 'D5', 'G5', 'J5', 'A6', 'D6', 'G6', 'J6'].forEach((ref) => {
    const cell = worksheet.getCell(ref);
    cell.font = { bold: true, color: { argb: REPORT_THEME.mutedText } };
  });

  ['A4', 'B4', 'D4', 'E4', 'G4', 'H4', 'J4', 'K4', 'A5', 'B5', 'D5', 'E5', 'G5', 'H5', 'J5', 'K5', 'A6', 'B6', 'D6', 'E6', 'G6', 'H6', 'J6', 'K6'].forEach((ref) => {
    const cell = worksheet.getCell(ref);
    cell.border = {
      bottom: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
    };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });

  worksheet.getRow(EXCEL_TABLE_HEADER_ROW).values = worksheet.columns.map((column) => column.header);
  worksheet.getRow(EXCEL_TABLE_HEADER_ROW).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(EXCEL_TABLE_HEADER_ROW).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: REPORT_THEME.primary },
  };
  worksheet.getRow(EXCEL_TABLE_HEADER_ROW).height = 24;

  rows.forEach((row, index) => {
    const totalResponses = Number(row.correct_count ?? 0) + Number(row.incorrect_count ?? 0);
    const accuracyRate = totalResponses
      ? Number(row.correct_count ?? 0) / totalResponses
      : 0;
    worksheet.addRow({
      rank: index + 1,
      full_name: row.full_name,
      email: row.email,
      student_code: `USER${String(row.user_id).padStart(4, "0")}`,
      score: Number(row.score ?? 0),
      duration: formatDuration(row.duration_seconds),
      correct_count: Number(row.correct_count ?? 0),
      incorrect_count: Number(row.incorrect_count ?? 0),
      accuracy_rate: accuracyRate,
      started_at: formatDateTime(row.started_at),
      finished_at: formatDateTime(row.finished_at),
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= EXCEL_TABLE_HEADER_ROW) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
          left: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
          bottom: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
          right: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
        };
      });
    }
  });

  for (let rowIndex = EXCEL_TABLE_HEADER_ROW + 1; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    const isAlternate = (rowIndex - EXCEL_TABLE_HEADER_ROW) % 2 === 0;
    row.height = 22;

    row.eachCell((cell, columnNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isAlternate ? REPORT_THEME.slateSoft : "FFFFFFFF" },
      };
      cell.alignment =
        columnNumber <= 4
          ? { horizontal: "left", vertical: "middle" }
          : { horizontal: "center", vertical: "middle" };
      cell.font = { color: { argb: REPORT_THEME.slateText } };
    });

    const scoreCell = row.getCell("score");
    const scoreTone = getScoreTone(Number(scoreCell.value ?? 0), summary.gradingScale);
    scoreCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: scoreTone.fill },
    };
    scoreCell.font = { bold: true, color: { argb: scoreTone.font } };

    const accuracyCell = row.getCell("accuracy_rate");
    const accuracyTone = getAccuracyTone(Number(accuracyCell.value ?? 0) * 100);
    accuracyCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: accuracyTone.fill },
    };
    accuracyCell.font = { bold: true, color: { argb: accuracyTone.font } };
  }

  worksheet.autoFilter = {
    from: `A${EXCEL_TABLE_HEADER_ROW}`,
    to: `K${Math.max(EXCEL_TABLE_HEADER_ROW, worksheet.rowCount)}`,
  };

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  return {
    buffer,
    fileName: buildFileName(quiz.title, "xlsx"),
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

export const buildPdfReport = async (quizId, user) => {
  const { quiz, rows, generatedAt, generatedBy, summary } = await getReportData(quizId, user);
  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "portrait" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerPdfFonts(doc);
    const drawHeader = () => {
      doc
        .strokeColor("#E2E8F0")
        .lineWidth(0.5)
        .moveTo(40, 30)
        .lineTo(doc.page.width - 40, 30)
        .stroke();
      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(8)
        .fillColor("#64748B")
        .text("FireQuiz - Report", 40, 18, { width: 200, align: "left" });
      doc.y = 50;
    };

    const drawRowCard = (row, index) => {
      const totalResponses = Number(row.correct_count ?? 0) + Number(row.incorrect_count ?? 0);
      const accuracyRate = totalResponses
        ? (Number(row.correct_count ?? 0) * 100) / totalResponses
        : 0;

      const evaluations = row.evaluations || [];
      const boxesPerRow = 15;
      const evaluationRows = Math.ceil(evaluations.length / boxesPerRow);
      const evaluationSectionHeight = evaluations.length > 0 ? (evaluationRows * 16) + 8 : 0;
      const cardHeight = 54 + evaluationSectionHeight;

      if (doc.y + cardHeight > doc.page.height - 40) {
        doc.addPage();
        drawHeader();
      }

      const cardTop = doc.y;
      const scoreTone = getScoreTone(Number(row.score ?? 0), summary.gradingScale);
      const scoreColor =
        scoreTone.font === REPORT_THEME.success
          ? "#059669"
          : scoreTone.font === REPORT_THEME.warning
            ? "#D97706"
            : "#DC2626";

      // Chỉ vẽ viền mỏng, không tô nền (tránh cháy sáng)
      doc
        .roundedRect(40, cardTop, doc.page.width - 80, cardHeight, 4)
        .strokeColor("#F1F5F9")
        .lineWidth(0.5)
        .stroke();

      doc
        .font(PDF_FONT_BOLD)
        .fontSize(10)
        .fillColor("#1E293B")
        .text(`#${index + 1} ${row.full_name}`, 50, cardTop + 8, { width: 300 });
      
      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(8)
        .fillColor("#64748B")
        .text(`${row.email} | USER${String(row.user_id).padStart(4, "0")}`, 50, cardTop + 24);

      // Điểm số bên phải
      doc
        .font(PDF_FONT_BOLD)
        .fontSize(14)
        .fillColor(scoreColor)
        .text(Number(row.score ?? 0).toFixed(2), doc.page.width - 120, cardTop + 10, { width: 60, align: 'right' });
      
      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(8)
        .fillColor("#94A3B8")
        .text(`/${summary.gradingScale}`, doc.page.width - 120, cardTop + 28, { width: 60, align: 'right' });

      // Thống kê chi tiết
      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(8)
        .fillColor("#475569")
        .text(`Đúng/Sai: ${row.correct_count}/${row.incorrect_count}`, 50, cardTop + 38, { width: 120 })
        .text(`Tỉ lệ: ${formatPercentage(accuracyRate)}`, 180, cardTop + 38, { width: 100 })
        .text(`Thời gian: ${formatDuration(row.duration_seconds)}`, 300, cardTop + 38, { width: 100 });

      // Vẽ lưới kết quả chi tiết
      if (evaluations.length > 0) {
        evaluations.forEach((evaluation, eIdx) => {
          const rIdx = Math.floor(eIdx / boxesPerRow);
          const cIdx = eIdx % boxesPerRow;
          const boxX = 50 + cIdx * 34;
          const boxY = cardTop + 52 + rIdx * 16;

          doc
            .roundedRect(boxX, boxY, 30, 12, 1)
            .fillAndStroke(evaluation.is_correct ? "#F0FDF4" : "#FEF2F2", evaluation.is_correct ? "#DCFCE7" : "#FEE2E2");
          
          doc
            .font(PDF_FONT_BOLD)
            .fontSize(6)
            .fillColor(evaluation.is_correct ? "#15803D" : "#B91C1C")
            .text(`C${eIdx + 1}:${evaluation.is_correct ? 'Đ' : 'S'}`, boxX, boxY + 3, { width: 30, align: 'center' });
        });
      }

      doc.y = cardTop + cardHeight + 8;
    };

    drawHeader();

    // Tiêu đề chính
    doc.font(PDF_FONT_BOLD).fontSize(18).fillColor("#0F172A").text("Báo cáo kết quả bộ câu hỏi", { align: 'center' });
    doc.font(PDF_FONT_REGULAR).fontSize(12).fillColor("#2563EB").text(quiz.title, { align: 'center' });
    doc.moveDown(1);

    // Thông tin chung
    const infoY = doc.y;
    doc.font(PDF_FONT_REGULAR).fontSize(9).fillColor("#475569");
    doc.text(`Người xuất: ${generatedBy}`, 40, infoY);
    doc.text(`Ngày xuất: ${formatDateTime(generatedAt)}`, 40, infoY + 14);
    doc.text(`Lịch mở: ${getScheduleText(quiz)}`, 220, infoY);
    doc.text(`Giới hạn: ${formatDuration(quiz.time_limit_seconds)}`, 220, infoY + 14);
    doc.moveDown(2.5);

    // Tóm tắt chỉ số (Grid)
    const summaryY = doc.y;
    doc.roundedRect(40, summaryY, doc.page.width - 80, 50, 4).fill("#F8FAFC");
    
    doc.font(PDF_FONT_BOLD).fontSize(9).fillColor("#1E293B");
    doc.text("Tổng thí sinh", 60, summaryY + 12, { width: 100 });
    doc.text("Điểm trung bình", 180, summaryY + 12, { width: 100 });
    doc.text("Tỷ lệ đúng", 300, summaryY + 12, { width: 100 });
    doc.text("TB thời gian", 420, summaryY + 12, { width: 100 });

    doc.font(PDF_FONT_REGULAR).fontSize(11).fillColor("#0F172A");
    doc.text(summary.totalParticipants, 60, summaryY + 26);
    doc.text(`${summary.averageScore.toFixed(2)}/${summary.gradingScale}`, 180, summaryY + 26);
    doc.text(formatPercentage(summary.accuracyRate), 300, summaryY + 26);
    doc.text(formatDuration(summary.averageDurationSeconds), 420, summaryY + 26);
    
    doc.y = summaryY + 65;

    doc.font(PDF_FONT_BOLD).fontSize(11).fillColor("#1E293B").text("Chi tiết theo từng thí sinh");
    doc.moveDown(0.5);

    if (!rows.length) {
      doc.font(PDF_FONT_REGULAR).fontSize(10).fillColor("#94A3B8").text("Chưa có dữ liệu nộp bài.", { align: 'center' });
    } else {
      rows.forEach(drawRowCard);
    }

    doc.end();
  });

  return {
    buffer,
    fileName: buildFileName(quiz.title, "pdf"),
    contentType: "application/pdf",
  };
};

const getQuizContentData = async (quizId, user) => {
  const quiz = await quizRepository.getQuizById(quizId);
  checkQuizExistAndOwner(quiz, user);

  const questions = await questionRepository.getListQuestionByQuizId(quizId);
  const answers = await answerRepository.getAnswersByQuestionIds(
    questions.map((q) => q.id),
  );

  const answersByQuestionId = answers.reduce((acc, answer) => {
    if (!acc.has(answer.question_id)) acc.set(answer.question_id, []);
    acc.get(answer.question_id).push(answer);
    return acc;
  }, new Map());

  const questionsWithAnswers = questions.map((q) => ({
    ...q,
    answers: answersByQuestionId.get(q.id) || [],
  }));

  return { quiz, questions: questionsWithAnswers };
};

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getOptionLabel = (index) => String.fromCharCode(65 + index); // A, B, C, D...

const writeExcelReviewContent = (worksheet, questions) => {
  // Cấu hình Header
  const headerRow = worksheet.getRow(1);
  headerRow.values = ["STT", "Nội dung câu hỏi", "Thí sinh chọn", "Đáp án đúng", "Kết quả", "Giải thích"];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: REPORT_THEME.primary } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  worksheet.columns = [
    { key: "index", width: 6 },
    { key: "content", width: 50 },
    { key: "selection", width: 15 },
    { key: "correct", width: 15 },
    { key: "result", width: 15 },
    { key: "explanation", width: 40 },
  ];

  questions.forEach((q, qIdx) => {
    const rowNumber = qIdx + 2;
    const correctOptions = q.answers
      .map((a, idx) => (a.is_correct ? getOptionLabel(idx) : null))
      .filter(Boolean)
      .join(", ");

    const optionsList = q.answers.map((_, idx) => getOptionLabel(idx)).join(",");
    
    // Câu hỏi đầy đủ (gồm các phương án)
    const fullContent = `${q.content}\n${q.answers.map((a, idx) => `${getOptionLabel(idx)}. ${a.content}`).join("\n")}`;

    const row = worksheet.getRow(rowNumber);
    const isText = q.type === 'TEXT';
    
    row.values = {
      index: qIdx + 1,
      content: fullContent,
      selection: isText ? "[Nhập câu trả lời]" : correctOptions,
      correct: correctOptions,
      result: isText ? { formula: `""` } : { formula: `IF(C${rowNumber}=D${rowNumber}, "ĐÚNG", "SAI")` },
      explanation: q.explanation || "",
    };

    if (isText) {
      row.getCell("result").value = "TỰ ĐÁNH GIÁ";
    }

    row.getCell("content").alignment = { wrapText: true, vertical: "top" };
    row.getCell("explanation").alignment = { wrapText: true, vertical: "top" };
    row.alignment = { vertical: "middle" };

    // 1. Data Validation (Dropdown) - Chỉ cho câu không phải TEXT
    if (!isText) {
      row.getCell("selection").dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${optionsList}"`],
        showErrorMessage: false, // Để cho phép nhập MULTI (vd: A, C)
      };
    }

    // 2. Conditional Formatting (Đổi màu theo kết quả)
    if (!isText) {
      worksheet.addConditionalFormatting({
        ref: `C${rowNumber}`,
        rules: [
          {
            type: "expression",
            formulae: [`C${rowNumber}=D${rowNumber}`],
            style: {
              fill: { type: "pattern", pattern: "solid", bgColor: { argb: REPORT_THEME.successSoft } },
              font: { color: { argb: REPORT_THEME.success }, bold: true },
            },
          },
          {
            type: "expression",
            formulae: [`AND(NOT(ISBLANK(C${rowNumber})), C${rowNumber}<>D${rowNumber})`],
            style: {
              fill: { type: "pattern", pattern: "solid", bgColor: { argb: REPORT_THEME.dangerSoft } },
              font: { color: { argb: REPORT_THEME.danger }, bold: true },
            },
          },
        ],
      });
    }
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
          left: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
          bottom: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
          right: { style: "thin", color: { argb: REPORT_THEME.slateLine } },
        };
      });
    }
  });
};

const writeExcelQuestionContent = async (workbook, worksheet, questions, showCorrect = false, showExplanation = false) => {
  let currentRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;

  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const q = questions[qIdx];
    const qLabel = `Câu ${qIdx + 1}: ${q.content}`;
    const row = worksheet.getRow(currentRow++);
    row.getCell(1).value = qLabel;
    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };

    // Xử lý Media trong Excel
    if (q.media_url) {
      if (isImageUrl(q.media_url)) {
        const imageBuffer = await downloadMediaBuffer(q.media_url);
        if (imageBuffer) {
          try {
            const extension = q.media_url.split('.').pop().split('?')[0] || 'png';
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: extension,
            });
            worksheet.addImage(imageId, {
              tl: { col: 0.1, row: currentRow - 0.9 },
              ext: { width: 140, height: 100 }
            });
            worksheet.getRow(currentRow).height = 80; // Tăng chiều cao để chứa ảnh
            currentRow++;
          } catch (err) {
            console.error('Excel Image Error:', err);
          }
        }
      }
      
      // Luôn thêm link redirect để dự phòng/truy cập video
      const redirectRow = worksheet.getRow(currentRow++);
      redirectRow.getCell(1).value = {
        text: "[Xem phương tiện kĩ thuật số]",
        hyperlink: getMediaViewUrl(q.media_url),
        tooltip: 'Click để mở media'
      };
      redirectRow.getCell(1).font = { color: { argb: 'FF0000FF' }, underline: true };
    }

    if (q.type !== 'TEXT') {
      q.answers.forEach((a, aIdx) => {
        const label = getOptionLabel(aIdx);
        const optionRow = worksheet.getRow(currentRow++);
        optionRow.getCell(1).value = `${label}. ${a.content}`;
        optionRow.getCell(1).alignment = { wrapText: true };
        if (showCorrect && a.is_correct) {
          optionRow.getCell(1).font = { bold: true, color: { argb: 'FF059669' } };
        }
      });
    } else {
      const hintRow = worksheet.getRow(currentRow++);
      hintRow.getCell(1).value = "[Học sinh trả lời vào phần bên dưới]";
      hintRow.getCell(1).font = { italic: true, color: { argb: 'FF94A3B8' } };
      currentRow += 2; // Thêm khoảng trống cho tự luận
    }

    if (showExplanation && q.explanation) {
      const expRow = worksheet.getRow(currentRow++);
      expRow.getCell(1).value = `Giải thích: ${q.explanation}`;
      expRow.getCell(1).font = { italic: true, color: { argb: 'FF2563EB' } };
      expRow.getCell(1).alignment = { wrapText: true };
    }

    currentRow++; // Space between questions
  }
};

export const buildQuizContentExcel = async (quizId, user, { type = 'all', randomize = false, versionCount = 1 } = {}) => {
  const { quiz, questions: originalQuestions } = await getQuizContentData(quizId, user);
  const workbook = new ExcelJS.Workbook();

  const count = Math.max(1, Math.min(10, parseInt(versionCount)));

  for (let v = 0; v < count; v++) {
    const versionCode = 101 + v;
    const suffix = count > 1 ? ` - Mã ${versionCode}` : "";
    const questions = prepareQuestionsForExport(originalQuestions, randomize);

    // 1. Bản Đề thi
    if (type === 'all' || type === 'paper') {
      const ws = workbook.addWorksheet(`Đề thi${suffix}`);
      ws.getCell("A1").value = `ĐỀ THI: ${quiz.title}`;
      ws.getCell("A1").font = { size: 14, bold: true };
      if (count > 1) ws.getCell("C1").value = `Mã đề: ${versionCode}`;
      ws.getCell("A2").value = "Họ và tên: ........................................................... Lớp: .....................";
      ws.getRow(4).values = ["Nội dung câu hỏi"];
      ws.getRow(4).font = { bold: true };
      await writeExcelQuestionContent(workbook, ws, questions, false, false);
      ws.getColumn(1).width = 100;
    }

    // 2. Bản Đáp án
    if (type === 'all' || type === 'key') {
      const ws = workbook.addWorksheet(`Đáp án${suffix}`);
      ws.getCell("A1").value = `ĐÁP ÁN: ${quiz.title}`;
      ws.getCell("A1").font = { size: 14, bold: true };
      if (count > 1) ws.getCell("C1").value = `Mã đề: ${versionCode}`;
      ws.getRow(3).values = ["Câu", "Đáp án đúng"];
      ws.getRow(3).font = { bold: true };
      
      questions.forEach((q, i) => {
        const correctOptions = q.answers
          .map((a, idx) => (a.is_correct ? getOptionLabel(idx) : null))
          .filter(Boolean)
          .join(", ");
        ws.addRow([i + 1, correctOptions || "---"]);
      });
      ws.getColumn(1).width = 10;
      ws.getColumn(2).width = 30;
    }

    // 3. Bản Lời giải chi tiết
    if (type === 'all' || type === 'solutions') {
      const ws = workbook.addWorksheet(`Lời giải${suffix}`);
      ws.getCell("A1").value = `LỜI GIẢI CHI TIẾT: ${quiz.title}`;
      ws.getCell("A1").font = { size: 14, bold: true };
      if (count > 1) ws.getCell("C1").value = `Mã đề: ${versionCode}`;
      await writeExcelQuestionContent(workbook, ws, questions, true, true);
      ws.getColumn(1).width = 100;
    }

    // 4. Bản Ôn tập tương tác (MỚI)
    if (type === 'all' || type === 'review') {
      const ws = workbook.addWorksheet(`Ôn tập${suffix}`);
      writeExcelReviewContent(ws, questions);
    }
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  let fileSuffix = type === 'all' ? 'full-pack' : type;
  if (randomize) fileSuffix += '-randomized';
  
  return {
    buffer,
    fileName: `${buildFileName(quiz.title, "").replace("-report.", "")}-${fileSuffix}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

export const buildQuizContentPdf = async (quizId, user, { type = 'all', randomize = false, versionCount = 1 } = {}) => {
  const { quiz, questions: originalQuestions } = await getQuizContentData(quizId, user);
  const doc = new PDFDocument({ margin: 50, size: "A4", layout: "portrait" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerPdfFonts(doc);

    const drawSectionHeader = (title, versionCode = null) => {
      doc.font(PDF_FONT_BOLD).fontSize(16).fillColor("#1E293B").text(title, { align: 'center' });
      if (versionCode) {
        doc.fontSize(12).fillColor("#DC2626").text(`Mã đề: ${versionCode}`, { align: 'right' });
      }
      doc.moveDown(1);
    };

    const drawStudentHeader = () => {
      doc.font(PDF_FONT_REGULAR).fontSize(10).fillColor("#475569");
      const leftCol = 50;
      const rightCol = 320;
      const startY = doc.y;

      doc.text(`Môn học: ...........................................................`, leftCol, startY);
      doc.text(`Người tạo: ${getCreatorDisplayName(user)}`, rightCol, startY);
      
      doc.moveDown(0.5);
      doc.text(`Thời gian: ${quiz.time_limit_seconds ? Math.floor(quiz.time_limit_seconds / 60) + ' phút' : 'Không giới hạn'}`, leftCol);
      doc.text(`Lớp: ...........................................`, rightCol, doc.y - 12);

      doc.moveDown(0.5);
      doc.text("Họ và tên: ................................................................................................................................", leftCol);
      
      doc.moveDown(0.8);
      doc.strokeColor("#F1F5F9").lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(1);
    };

    const drawQuestion = async (q, index, showCorrect = false, showExplanation = false) => {
      // Ước tính chiều cao: câu hỏi (20) + đáp án (15*4) + media (nếu có)
      const estimatedHeight = q.media_url ? 200 : 100;
      if (doc.y + estimatedHeight > doc.page.height - 50) doc.addPage();

      let typeLabel = q.type === 'MULTI_ANSWERS' ? '(Nhiều đáp án)' : 
                       q.type === 'TEXT' ? '(Tự luận)' : 
                       q.type === 'TRUE_FALSE' ? '(Đúng/Sai)' : '(Một đáp án)';

      doc.font(PDF_FONT_BOLD).fontSize(11).fillColor("#0F172A").text(`Câu ${index + 1}: `, { continued: true });
      doc.font(PDF_FONT_REGULAR).fontSize(11).text(q.content);
      doc.font(PDF_FONT_REGULAR).fontSize(8).fillColor("#94A3B8").text(typeLabel);
      doc.moveDown(0.3);

      // Xử lý Media
      if (q.media_url) {
        const mediaPath = q.media_url; 
        if (isImageUrl(mediaPath)) {
          // Là ảnh -> Embed trực tiếp
          const imageBuffer = await downloadMediaBuffer(mediaPath);
          if (imageBuffer) {
            try {
              doc.image(imageBuffer, { fit: [250, 150], align: 'center' });
              doc.moveDown(0.5);
            } catch (err) {
              console.error('PDF Image Error:', err);
            }
          }
        } else {
          // Video/Audio -> QR Code
          const redirectUrl = getMediaViewUrl(mediaPath);
          const qrBuffer = await generateQRCodeBuffer(redirectUrl);
          if (qrBuffer) {
            const currentY = doc.y;
            doc.image(qrBuffer, doc.page.width - 120, currentY - 20, { width: 60 });
            doc.font(PDF_FONT_REGULAR).fontSize(7).fillColor("#2563EB")
               .text("[Quét để xem media]", doc.page.width - 125, currentY + 42, { width: 70, align: 'center' });
          }
        }
      }

      if (q.type === 'TEXT') {
        doc.moveDown(0.5);
        doc.font(PDF_FONT_REGULAR).fontSize(10).fillColor("#E2E8F0");
        for (let i = 0; i < 4; i++) {
          doc.text("..................................................................................................................................................", { indent: 10 });
          doc.moveDown(0.4);
        }
      } else {
        q.answers.forEach((a, aIdx) => {
          const label = getOptionLabel(aIdx);
          const isCorrect = showCorrect && a.is_correct;
          
          doc.font(isCorrect ? PDF_FONT_BOLD : PDF_FONT_REGULAR)
             .fontSize(10)
             .fillColor(isCorrect ? "#16A34A" : "#334155")
             .text(`${label}. ${a.content}`, { indent: 15 });
        });
      }

      if (showExplanation && q.explanation) {
        doc.moveDown(0.2);
        doc.font(PDF_FONT_REGULAR).fontSize(9).fillColor("#2563EB").text(`Giải thích: ${q.explanation}`, { indent: 15 });
      }

      doc.moveDown(1);
    };

    const run = async () => {
      const count = Math.max(1, Math.min(10, parseInt(versionCount)));
      for (let v = 0; v < count; v++) {
        const versionCode = 101 + v;
        const questions = prepareQuestionsForExport(originalQuestions, randomize);

        // 1. Bản Đề thi
        if (type === 'all' || type === 'paper') {
          drawSectionHeader(`ĐỀ THI: ${quiz.title}`, count > 1 ? versionCode : null);
          drawStudentHeader();
          for(let i=0; i<questions.length; i++) await drawQuestion(questions[i], i, false, false);
          if (v < count - 1 || type === 'all') doc.addPage();
        }

        // 2. Bản Đáp án
        if (type === 'all' || type === 'key') {
          drawSectionHeader(`ĐÁP ÁN: ${quiz.title}`, count > 1 ? versionCode : null);
          doc.font(PDF_FONT_BOLD).fontSize(10).text("Câu", 50, doc.y).text("Đáp án đúng", 100, doc.y - 12);
          doc.moveDown(0.5);
          
          questions.forEach((q, i) => {
            if (doc.y > 750) doc.addPage();
            const correctOptions = q.answers
              .map((a, idx) => (a.is_correct ? getOptionLabel(idx) : null))
              .filter(Boolean).join(", ");
            
            doc.font(PDF_FONT_REGULAR).fontSize(10).text(i + 1, 50, doc.y).text(correctOptions || "---", 100, doc.y - 12);
            doc.moveDown(0.4);
          });
          if (type === 'all' || v < count - 1) doc.addPage();
        }

        // 3. Bản Lời giải chi tiết
        if (type === 'all' || type === 'solutions') {
          drawSectionHeader(`LỜI GIẢI CHI TIẾT: ${quiz.title}`, count > 1 ? versionCode : null);
          for(let i=0; i<questions.length; i++) await drawQuestion(questions[i], i, true, true);
          if (v < count - 1) doc.addPage();
        }
      }
      doc.end();
    };

    run().catch(reject);
  });

  let fileSuffix = type === 'all' ? 'full-pack' : type;
  if (randomize) fileSuffix += '-randomized';

  return {
    buffer,
    fileName: `${buildFileName(quiz.title, "").replace("-report.", "")}-${fileSuffix}.pdf`,
    contentType: "application/pdf",
  };
};

export const bundleQuizContentZip = async (quizId, user, options) => {
  const zip = new AdmZip();
  const { quiz } = await getQuizContentData(quizId, user);
  
  // 1. File Đề thi
  const paper = await (options.format === 'pdf' 
    ? buildQuizContentPdf(quizId, user, { ...options, type: 'paper' })
    : buildQuizContentExcel(quizId, user, { ...options, type: 'paper' }));
  zip.addFile(`1-De-thi-${paper.fileName}`, paper.buffer);

  // 2. File Đáp án
  const key = await (options.format === 'pdf'
    ? buildQuizContentPdf(quizId, user, { ...options, type: 'key' })
    : buildQuizContentExcel(quizId, user, { ...options, type: 'key' }));
  zip.addFile(`2-Dap-an-${key.fileName}`, key.buffer);

  // 3. File Lời giải
  const solutions = await (options.format === 'pdf'
    ? buildQuizContentPdf(quizId, user, { ...options, type: 'solutions' })
    : buildQuizContentExcel(quizId, user, { ...options, type: 'solutions' }));
  zip.addFile(`3-Loi-giai-chi-tiet-${solutions.fileName}`, solutions.buffer);

  const buffer = zip.toBuffer();
  
  return {
    buffer,
    fileName: `${buildFileName(quiz.title, "").replace("-report.", "")}-separate-files.zip`,
    contentType: "application/zip",
  };
};
