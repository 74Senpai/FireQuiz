import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import * as quizRepository from '../repositories/quizRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import * as attemptAggregationService from '../services/attemptAggregationService.js';
import AppError from '../errors/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_FONT_REGULAR = 'report-regular';
const PDF_FONT_BOLD = 'report-bold';
const EXCEL_TABLE_HEADER_ROW = 9;
const REPORT_THEME = {
  primary: 'FF1D4ED8',
  primarySoft: 'FFDBEAFE',
  success: 'FF059669',
  successSoft: 'FFD1FAE5',
  warning: 'FFD97706',
  warningSoft: 'FFFEF3C7',
  danger: 'FFDC2626',
  dangerSoft: 'FFFEE2E2',
  slateSoft: 'FFF8FAFC',
  slateLine: 'FFE2E8F0',
  slateText: 'FF0F172A',
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
  const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerPdfFonts(doc);
    const drawHeader = () => {
      doc
        .strokeColor("#E2E8F0")
        .lineWidth(1)
        .moveTo(36, 28)
        .lineTo(doc.page.width - 36, 28)
        .stroke();
      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(9)
        .fillColor("#475569")
        .text("FireQuiz - Báo cáo kết quả bộ câu hỏi", 36, 14, {
          width: 260,
          align: "left",
        });
      doc.y = 46;
    };

    const drawRowCard = (row, index) => {
      const totalResponses = Number(row.correct_count ?? 0) + Number(row.incorrect_count ?? 0);
      const accuracyRate = totalResponses
        ? (Number(row.correct_count ?? 0) * 100) / totalResponses
        : 0;

      if (doc.y > 505) {
        doc.addPage();
        drawHeader();
      }

      const cardTop = doc.y;
      const cardHeight = 64;
      const scoreTone = getScoreTone(Number(row.score ?? 0), summary.gradingScale);
      const scoreColor =
        scoreTone.font === REPORT_THEME.success
          ? "#059669"
          : scoreTone.font === REPORT_THEME.warning
            ? "#D97706"
            : "#DC2626";

      doc
        .roundedRect(36, cardTop, doc.page.width - 72, cardHeight, 8)
        .fillAndStroke(index % 2 === 0 ? "#FFFFFF" : "#F8FAFC", "#E2E8F0");

      doc
        .font(PDF_FONT_BOLD)
        .fontSize(11)
        .fillColor("#0F172A")
        .text(`#${index + 1} ${row.full_name}`, 50, cardTop + 10, {
          width: 240,
          align: "left",
        });
      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(9)
        .fillColor("#475569")
        .text(row.email, 50, cardTop + 28, {
          width: 240,
          align: "left",
        });
      doc
        .text(`Mã học sinh: USER${String(row.user_id).padStart(4, "0")}`, 50, cardTop + 42, {
          width: 240,
          align: "left",
        });

      doc
        .font(PDF_FONT_BOLD)
        .fontSize(16)
        .fillColor(scoreColor)
        .text(Number(row.score ?? 0).toFixed(2), 310, cardTop + 16, {
          width: 70,
          align: "center",
        });
      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(8)
        .fillColor("#475569")
        .text(`/${summary.gradingScale}`, 310, cardTop + 36, {
          width: 70,
          align: "center",
        });

      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(9)
        .fillColor("#0F172A")
        .text(`Dung/Sai: ${row.correct_count}/${row.incorrect_count}`, 410, cardTop + 14, {
          width: 130,
          align: "left",
        });
      doc.text(`Tỷ lệ đúng: ${formatPercentage(accuracyRate)}`, 410, cardTop + 32, {
        width: 130,
        align: "left",
      });

      doc.text(`Thời gian: ${formatDuration(row.duration_seconds)}`, 570, cardTop + 14, {
        width: 180,
        align: "left",
      });
      doc.text(`Hoàn thành: ${formatDateTime(row.finished_at)}`, 570, cardTop + 32, {
        width: 180,
        align: "left",
      });

      doc.y = cardTop + cardHeight + 10;
    };

    drawHeader();

    doc.font(PDF_FONT_BOLD).fontSize(20).fillColor("#0F172A").text("Báo cáo kết quả bộ câu hỏi");
    doc.font(PDF_FONT_REGULAR).fontSize(14).fillColor("#1D4ED8").text(quiz.title);
    doc.moveDown(0.6);
    doc.font(PDF_FONT_REGULAR).fontSize(10).fillColor("#475569");
    doc.text(`Người xuất: ${generatedBy}`);
    doc.text(`Ngày xuất: ${formatDateTime(generatedAt)}`);
    doc.text(`Lịch mở: ${getScheduleText(quiz)}`);
    doc.text(`Thời gian giới hạn: ${formatDuration(quiz.time_limit_seconds)}`);
    doc.moveDown(0.8);

    doc
      .roundedRect(36, doc.y, doc.page.width - 72, 58, 8)
      .fillAndStroke("#F8FAFC", "#E2E8F0");
    const summaryTop = doc.y + 12;
    doc
      .font(PDF_FONT_BOLD)
      .fontSize(10)
      .fillColor("#0F172A")
      .text(`Tổng thí sinh: ${summary.totalParticipants}`, 52, summaryTop, { width: 160 })
      .text(`Điểm trung bình: ${summary.averageScore.toFixed(2)}/${summary.gradingScale}`, 220, summaryTop, { width: 180 })
      .text(`Tỷ lệ đúng: ${formatPercentage(summary.accuracyRate)}`, 430, summaryTop, { width: 130 })
      .text(`TB thời gian: ${formatDuration(summary.averageDurationSeconds)}`, 580, summaryTop, { width: 160 });
    doc
      .font(PDF_FONT_REGULAR)
      .fontSize(9)
      .fillColor("#475569")
      .text(`Tổng đúng / sai: ${summary.totalCorrect} / ${summary.totalIncorrect}`, 52, summaryTop + 22, { width: 220 })
      .text(`Điểm cao nhất: ${summary.highestScore.toFixed(2)}/${summary.gradingScale}`, 320, summaryTop + 22, { width: 220 });
    doc.y += 74;

    doc.font(PDF_FONT_BOLD).fontSize(12).fillColor("#0F172A").text("Chi tiết thí sinh");
    doc.moveDown(0.4);

    if (!rows.length) {
      doc
        .roundedRect(36, doc.y, doc.page.width - 72, 54, 8)
        .fillAndStroke("#F8FAFC", "#E2E8F0");
      doc
        .font(PDF_FONT_REGULAR)
        .fontSize(10)
        .fillColor("#475569")
        .text("Chưa có dữ liệu nộp bài để xuất báo cáo.", 52, doc.y + 18);
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

const writeExcelQuestionContent = (worksheet, questions, showCorrect = false, showExplanation = false) => {
  let currentRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;

  questions.forEach((q, qIdx) => {
    const qLabel = `Câu ${qIdx + 1}: ${q.content}`;
    const row = worksheet.getRow(currentRow++);
    row.getCell(1).value = qLabel;
    row.getCell(1).font = { bold: true };

    q.answers.forEach((a, aIdx) => {
      const label = getOptionLabel(aIdx);
      const optionRow = worksheet.getRow(currentRow++);
      optionRow.getCell(1).value = `${label}. ${a.content}`;
      if (showCorrect && a.is_correct) {
        optionRow.getCell(1).font = { bold: true, color: { argb: REPORT_THEME.success } };
      }
    });

    if (showExplanation && q.explanation) {
      const expRow = worksheet.getRow(currentRow++);
      expRow.getCell(1).value = `Giải thích: ${q.explanation}`;
      expRow.getCell(1).font = { italic: true, color: { argb: REPORT_THEME.primary } };
    }

    currentRow++; // Space between questions
  });
};

export const buildQuizContentExcel = async (quizId, user, { type = 'all', randomize = false, versionCount = 1 } = {}) => {
  const { quiz, questions: originalQuestions } = await getQuizContentData(quizId, user);
  const workbook = new ExcelJS.Workbook();

  const count = Math.max(1, Math.min(10, parseInt(versionCount)));

  for (let v = 0; v < count; v++) {
    const versionCode = 101 + v;
    const suffix = count > 1 ? ` - Mã ${versionCode}` : "";
    
    let questions = originalQuestions;
    if (randomize) {
      questions = shuffleArray(originalQuestions).map(q => ({
        ...q,
        answers: shuffleArray(q.answers)
      }));
    }

    // 1. Bản Đề thi
    if (type === 'all' || type === 'paper') {
      const ws = workbook.addWorksheet(`Đề thi${suffix}`);
      ws.getCell("A1").value = `ĐỀ THI: ${quiz.title}`;
      ws.getCell("A1").font = { size: 14, bold: true };
      if (count > 1) ws.getCell("C1").value = `Mã đề: ${versionCode}`;
      ws.getCell("A2").value = "Họ và tên: ........................................................... Lớp: .....................";
      ws.getRow(4).values = ["Nội dung câu hỏi"];
      writeExcelQuestionContent(ws, questions, false, false);
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
        ws.addRow([i + 1, correctOptions]);
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
      writeExcelQuestionContent(ws, questions, true, true);
      ws.getColumn(1).width = 100;
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
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerPdfFonts(doc);

    const drawSectionHeader = (title, versionCode = null) => {
      doc.font(PDF_FONT_BOLD).fontSize(16).fillColor(REPORT_THEME.primary).text(title, { align: 'center' });
      if (versionCode) {
        doc.fontSize(12).fillColor(REPORT_THEME.danger).text(`Mã đề: ${versionCode}`, { align: 'right' });
      }
      doc.moveDown(1);
    };

    const drawStudentHeader = () => {
      doc.font(PDF_FONT_REGULAR).fontSize(11).fillColor(REPORT_THEME.slateText);
      doc.text("Họ và tên: ........................................................... Lớp: .....................", { align: 'left' });
      doc.text(`Ngày thi: ....../....../20......`, { align: 'left' });
      doc.moveDown(1.5);
    };

    const drawQuestion = (q, index, showCorrect = false, showExplanation = false) => {
      if (doc.y > 680) doc.addPage();

      doc.font(PDF_FONT_BOLD).fontSize(11).fillColor("#0F172A").text(`Câu ${index + 1}: ${q.content}`);
      doc.moveDown(0.3);

      q.answers.forEach((a, aIdx) => {
        const label = getOptionLabel(aIdx);
        const isCorrect = showCorrect && a.is_correct;
        
        doc.font(isCorrect ? PDF_FONT_BOLD : PDF_FONT_REGULAR)
           .fontSize(10)
           .fillColor(isCorrect ? "#059669" : "#475569")
           .text(`${label}. ${a.content}`, { indent: 20 });
      });

      if (showExplanation && q.explanation) {
        doc.moveDown(0.2);
        doc.font(PDF_FONT_REGULAR).fontSize(9).fillColor("#1D4ED8").text(`Giải thích: ${q.explanation}`, { indent: 20 });
      }

      doc.moveDown(1);
    };

    const count = Math.max(1, Math.min(10, parseInt(versionCount)));

    for (let v = 0; v < count; v++) {
      const versionCode = 101 + v;
      let questions = originalQuestions;
      if (randomize) {
        questions = shuffleArray(originalQuestions).map(q => ({
          ...q,
          answers: shuffleArray(q.answers)
        }));
      }

      // 1. Bản Đề thi
      if (type === 'all' || type === 'paper') {
        drawSectionHeader(`ĐỀ THI: ${quiz.title}`, count > 1 ? versionCode : null);
        drawStudentHeader();
        questions.forEach((q, i) => drawQuestion(q, i, false, false));
        doc.addPage();
      }

      // 2. Bản Đáp án
      if (type === 'all' || type === 'key') {
        drawSectionHeader(`ĐÁP ÁN: ${quiz.title}`, count > 1 ? versionCode : null);
        const tableTop = doc.y;
        doc.font(PDF_FONT_BOLD).fontSize(10).text("Câu", 50, tableTop).text("Đáp án đúng", 100, tableTop);
        doc.moveDown(0.5);
        
        questions.forEach((q, i) => {
          if (doc.y > 750) doc.addPage();
          const correctOptions = q.answers
            .map((a, idx) => (a.is_correct ? getOptionLabel(idx) : null))
            .filter(Boolean)
            .join(", ");
          
          const y = doc.y;
          doc.font(PDF_FONT_REGULAR).fontSize(10).text(i + 1, 50, y).text(correctOptions, 100, y);
          doc.moveDown(0.5);
        });
        doc.addPage();
      }

      // 3. Bản Lời giải chi tiết
      if (type === 'all' || type === 'solutions') {
        drawSectionHeader(`LỜI GIẢI CHI TIẾT: ${quiz.title}`, count > 1 ? versionCode : null);
        questions.forEach((q, i) => drawQuestion(q, i, true, true));
        if (v < count - 1) doc.addPage();
      }
    }

    doc.end();
  });

  let fileSuffix = type === 'all' ? 'full-pack' : type;
  if (randomize) fileSuffix += '-randomized';

  return {
    buffer,
    fileName: `${buildFileName(quiz.title, "").replace("-report.", "")}-${fileSuffix}.pdf`,
    contentType: "application/pdf",
  };
};
