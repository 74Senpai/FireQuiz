import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import * as quizRepository from '../repositories/quizRepository.js';
import * as attemptAggregationService from '../services/attemptAggregationService.js';
import AppError from '../errors/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_FONT_REGULAR = 'report-regular';
const PDF_FONT_BOLD = 'report-bold';

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
      'Khong tim thay font Unicode cho xuat PDF. Hay cau hinh PDF_FONT_REGULAR_PATH va PDF_FONT_BOLD_PATH.',
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
    throw new AppError("Quiz khong ton tai", 404);
  }

  if (!user || user.id != quiz.creator_id) {
    throw new AppError("Ban khong co quyen thuc hien hanh dong nay", 403);
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

  return {
    quiz,
    rows,
  };
};

export const buildExcelReport = async (quizId, user) => {
  const { quiz, rows } = await getReportData(quizId, user);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Ket qua quiz");

  worksheet.columns = [
    { header: "Hang", key: "rank", width: 10 },
    { header: "Thi sinh", key: "full_name", width: 28 },
    { header: "Email", key: "email", width: 30 },
    { header: "Ma hoc sinh", key: "student_code", width: 14 },
    { header: "Diem", key: "score", width: 12 },
    { header: "Thoi gian", key: "duration", width: 14 },
    { header: "Dung", key: "correct_count", width: 10 },
    { header: "Sai", key: "incorrect_count", width: 10 },
    { header: "Bat dau", key: "started_at", width: 22 },
    { header: "Hoan thanh", key: "finished_at", width: 22 },
  ];

  worksheet.addRow([]);
  worksheet.mergeCells("A1:J1");
  worksheet.getCell("A1").value = `Bao cao ket qua - ${quiz.title}`;
  worksheet.getCell("A1").font = { size: 16, bold: true };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.getRow(3).values = worksheet.columns.map((column) => column.header);
  worksheet.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(3).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };

  rows.forEach((row, index) => {
    worksheet.addRow({
      rank: index + 1,
      full_name: row.full_name,
      email: row.email,
      student_code: `USER${String(row.user_id).padStart(4, "0")}`,
      score: Number(row.score ?? 0).toFixed(2),
      duration: formatDuration(row.duration_seconds),
      correct_count: row.correct_count,
      incorrect_count: row.incorrect_count,
      started_at: formatDateTime(row.started_at),
      finished_at: formatDateTime(row.finished_at),
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 3) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    }
  });

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  return {
    buffer,
    fileName: buildFileName(quiz.title, "xlsx"),
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

export const buildPdfReport = async (quizId, user) => {
  const { quiz, rows } = await getReportData(quizId, user);
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerPdfFonts(doc);

    doc.font(PDF_FONT_BOLD).fontSize(18).text(`Bao cao ket qua - ${quiz.title}`, {
      align: "center",
    });
    doc.moveDown();
    doc
      .font(PDF_FONT_REGULAR)
      .fontSize(10)
      .fillColor("#4B5563")
      .text(`Tong so bai nop: ${rows.length}`);
    doc.moveDown();

    rows.forEach((row, index) => {
      if (doc.y > 740) {
        doc.addPage();
      }

      doc
        .font(PDF_FONT_BOLD)
        .fillColor("#111827")
        .fontSize(12)
        .text(`#${index + 1} ${row.full_name}`, { continued: true })
        .font(PDF_FONT_REGULAR)
        .fontSize(10)
        .fillColor("#6B7280")
        .text(`  (${row.email})`);

      doc
        .font(PDF_FONT_REGULAR)
        .fillColor("#111827")
        .fontSize(10)
        .text(
          `Ma hoc sinh: USER${String(row.user_id).padStart(4, "0")} | Diem: ${Number(row.score ?? 0).toFixed(2)} | Thoi gian: ${formatDuration(row.duration_seconds)}`,
        );
      doc.text(
        `Dung/Sai: ${row.correct_count}/${row.incorrect_count} | Bat dau: ${formatDateTime(row.started_at)} | Hoan thanh: ${formatDateTime(row.finished_at)}`,
      );
      doc.moveDown(0.6);
      doc.strokeColor("#D1D5DB").moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.6);
    });

    doc.end();
  });

  return {
    buffer,
    fileName: buildFileName(quiz.title, "pdf"),
    contentType: "application/pdf",
  };
};
