import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import AdmZip from 'adm-zip';
import pool from '../db/db.js';
import * as quizRepository from '../repositories/quizRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import * as attemptAggregationService from '../services/attemptAggregationService.js';
import AppError from '../errors/AppError.js';
import * as utils from '../utils/exportUtils.js';
import * as pdfGenerator from '../services/pdfGeneratorService.js';
import * as excelGenerator from '../services/excelGeneratorService.js';

/**
 * Access Control Helpers (Business Logic)
 */
const checkQuizExistAndOwner = (quiz, user) => {
  if (!quiz) throw new AppError("Bộ câu hỏi không tồn tại", 404);
  if (!user || user.id != quiz.creator_id) throw new AppError("Bạn không có quyền thực hiện hành động này", 403);
};

const checkHasExportAccess = async (quiz, user) => {
  if (!quiz) throw new AppError("Bộ câu hỏi không tồn tại", 404);
  if (!user) throw new AppError("Yêu cầu đăng nhập", 401);
  if (user.id == quiz.creator_id) return true;

  const [attempts] = await pool.execute(
    'SELECT id FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? AND finished_at IS NOT NULL LIMIT 1',
    [quiz.id, user.id]
  );
  if (attempts.length === 0) throw new AppError("Bạn không có quyền xuất dữ liệu cho Quiz này", 403);
  return true;
};

/**
 * Data Fetching Helpers
 */
const getReportData = async (quizId, user) => {
  const quiz = await quizRepository.getQuizById(quizId);
  checkQuizExistAndOwner(quiz, user);
  const rows = await attemptAggregationService.getResultReportDataByQuizId(quizId);
  return {
    quiz,
    rows,
    generatedAt: new Date(),
    generatedBy: utils.getCreatorDisplayName(user),
    summary: utils.calculateSummary(quiz, rows),
  };
};

const getQuizContentData = async (quizId, user, isParticipantScan = false) => {
  const quiz = await quizRepository.getQuizById(quizId);
  if (isParticipantScan) await checkHasExportAccess(quiz, user);
  else checkQuizExistAndOwner(quiz, user);

  const questions = await questionRepository.getListQuestionByQuizId(quizId);
  const answers = await answerRepository.getAnswersByQuestionIds(questions.map((q) => q.id));
  const answersByQuestionId = answers.reduce((acc, answer) => {
    if (!acc.has(answer.question_id)) acc.set(answer.question_id, []);
    acc.get(answer.question_id).push(answer);
    return acc;
  }, new Map());

  return { 
    quiz, 
    questions: questions.map((q) => ({ ...q, answers: answersByQuestionId.get(q.id) || [] })) 
  };
};

/**
 * PUBLIC EXPORT METHODS - EXCEL
 */
export const buildExcelReport = async (quizId, user, options = {}) => {
  const { quiz, rows, generatedAt, generatedBy, summary } = await getReportData(quizId, user);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Báo cáo kết quả");
  
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
  worksheet.views = [{ state: 'frozen', ySplit: 9, showGridLines: false }];

  excelGenerator.setupCommonHeader(worksheet, quiz.title, generatedBy, generatedAt, summary, quiz);
  excelGenerator.writeResultTable(worksheet, rows, 9, summary);

  if (options.advanced) {
    const analyticsData = await attemptAggregationService.getQuestionAnalyticsDataByQuizId(quizId);
    const analyticsSheet = workbook.addWorksheet("Phân tích chi tiết");
    excelGenerator.writeAnalyticsSheet(analyticsSheet, analyticsData);
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    buffer,
    fileName: utils.buildFileName(`${quiz.title}-report${options.advanced ? '-ADV' : ''}`, "xlsx"),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

export const buildQuizContentExcel = async (quizId, user, { type = 'all', randomize = false, versionCount = 1, isParticipant = false } = {}) => {
  const { quiz, questions: originalQuestions } = await getQuizContentData(quizId, user, isParticipant);
  const workbook = new ExcelJS.Workbook();
  const count = Math.max(1, Math.min(10, parseInt(versionCount)));

  for (let v = 0; v < count; v++) {
    const versionCode = 101 + v;
    const suffix = count > 1 ? ` - Mã ${versionCode}` : "";
    const questions = utils.prepareQuestionsForExport(originalQuestions, randomize);

    if (type === 'all' || type === 'paper') {
      const ws = workbook.addWorksheet(`Đề thi${suffix}`);
      ws.getCell("A1").value = `ĐỀ THI: ${quiz.title}`;
      ws.getCell("A1").font = { size: 14, bold: true };
      await excelGenerator.writeExcelQuestionContent(workbook, ws, questions, { showCorrect: false, showExplanation: false });
      ws.getColumn(1).width = 100;
    }

    if (type === 'all' || type === 'solutions') {
      const ws = workbook.addWorksheet(`Lời giải${suffix}`);
      ws.getCell("A1").value = `LỜI GIẢI CHI TIẾT: ${quiz.title}`;
      ws.getCell("A1").font = { size: 14, bold: true };
      await excelGenerator.writeExcelQuestionContent(workbook, ws, questions, { showCorrect: true, showExplanation: true });
      ws.getColumn(1).width = 100;
    }

    if (type === 'all' || type === 'review') {
      const ws = workbook.addWorksheet(`Ôn tập${suffix}`);
      excelGenerator.writeInteractiveReview(ws, questions);
    }
  }

  return {
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    fileName: utils.buildFileName(`${quiz.title}-${type}`, "xlsx"),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

/**
 * PUBLIC EXPORT METHODS - PDF
 */
export const buildPdfReport = async (quizId, user) => {
  const { quiz, rows, generatedAt, generatedBy, summary } = await getReportData(quizId, user);
  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "portrait" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    pdfGenerator.registerFonts(doc);
    pdfGenerator.drawHeader(doc);

    doc.font(utils.PDF_FONT_BOLD).fontSize(18).fillColor("#0F172A").text("Báo cáo kết quả bộ câu hỏi", { align: 'center' });
    doc.font(utils.PDF_FONT_REGULAR).fontSize(12).fillColor("#2563EB").text(quiz.title, { align: 'center' });
    doc.moveDown(1);

    const infoY = doc.y;
    doc.font(utils.PDF_FONT_REGULAR).fontSize(9).fillColor("#475569");
    doc.text(`Người xuất: ${generatedBy}`, 40, infoY);
    doc.text(`Ngày xuất: ${utils.formatDateTime(generatedAt)}`, 40, infoY + 14);
    doc.text(`Lịch mở: ${utils.getScheduleText(quiz)}`, 220, infoY);
    doc.text(`Giới hạn: ${utils.formatDuration(quiz.time_limit_seconds)}`, 220, infoY + 14);
    doc.moveDown(2.5);

    pdfGenerator.drawSummaryGrid(doc, summary);
    doc.font(utils.PDF_FONT_BOLD).fontSize(11).fillColor("#1E293B").text("Chi tiết theo từng thí sinh");
    doc.moveDown(0.5);

    if (!rows.length) {
      doc.font(utils.PDF_FONT_REGULAR).fontSize(10).fillColor("#94A3B8").text("Chưa có dữ liệu nộp bài.", { align: 'center' });
    } else {
      rows.forEach((row, i) => pdfGenerator.drawResultRowCard(doc, row, i, summary.gradingScale));
    }
    doc.end();
  });

  return { buffer, fileName: utils.buildFileName(quiz.title, "pdf"), contentType: "application/pdf" };
};

export const buildQuizContentPdf = async (quizId, user, { type = 'all', randomize = false, versionCount = 1, isParticipant = false } = {}) => {
  const { quiz, questions: originalQuestions } = await getQuizContentData(quizId, user, isParticipant);
  const doc = new PDFDocument({ margin: 50, size: "A4", layout: "portrait" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    pdfGenerator.registerFonts(doc);

    const run = async () => {
      const count = Math.max(1, Math.min(10, parseInt(versionCount)));
      for (let v = 0; v < count; v++) {
        const questions = utils.prepareQuestionsForExport(originalQuestions, randomize);
        if (type === 'all' || type === 'paper' || type === 'key') {
          const isKey = type === 'key';
          pdfGenerator.drawHeader(doc, isKey ? `ĐÁP ÁN: ${quiz.title}` : `ĐỀ THI: ${quiz.title}`);
          for(let i=0; i<questions.length; i++) await pdfGenerator.drawQuestionCard(doc, questions[i], i, { showCorrect: isKey });
          if (v < count - 1 || type === 'all') doc.addPage();
        }
        if (type === 'all' || type === 'solutions') {
          pdfGenerator.drawHeader(doc, `LỜI GIẢI CHI TIẾT: ${quiz.title}`);
          for(let i=0; i<questions.length; i++) await pdfGenerator.drawQuestionCard(doc, questions[i], i, { showCorrect: true, showExplanation: true });
          if (v < count - 1) doc.addPage();
        }
      }
      doc.end();
    };
    run().catch(reject);
  });

  return { buffer, fileName: utils.buildFileName(`${quiz.title}-${type}`, "pdf"), contentType: "application/pdf" };
};

/**
 * ATTEMPT REVIEW EXPORTS
 */
export const buildAttemptReviewPdf = async (attemptId, user) => {
  const { getMyAttemptReviewDetail } = await import('./attemptService.js');
  const { attempt, questions } = await getMyAttemptReviewDetail(user, attemptId);
  const doc = new PDFDocument({ margin: 50, size: "A4", layout: "portrait" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    pdfGenerator.registerFonts(doc);
    doc.font(utils.PDF_FONT_BOLD).fontSize(18).fillColor("#1E293B").text("TÀI LIỆU ÔN TẬP CÁ NHÂN", { align: 'center' });
    doc.fontSize(12).fillColor("#2563EB").text(attempt.quiz_title, { align: 'center' });
    doc.moveDown(1.5);

    doc.font(utils.PDF_FONT_BOLD).fontSize(10).fillColor("#475569");
    doc.text(`Người thực hiện: ${user.full_name || user.email}`);
    doc.text(`Điểm số: ${attempt.score}`);
    doc.text(`Thời gian: ${utils.formatDateTime(attempt.finished_at)}`);
    doc.moveDown(1);
    doc.strokeColor("#E2E8F0").lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(1.5);

    const drawAll = async () => {
      for(let i=0; i<questions.length; i++) await pdfGenerator.drawReviewQuestion(doc, questions[i], i);
      doc.end();
    };
    drawAll().catch(reject);
  });

  return { buffer, fileName: utils.buildFileName(`review-${attempt.quiz_title}`, "pdf"), contentType: "application/pdf" };
};

export const buildAttemptReviewSlipPdf = async (attemptId, user) => {
  const { getMyAttemptReviewDetail } = await import('./attemptService.js');
  const { attempt, questions } = await getMyAttemptReviewDetail(user, attemptId);
  const doc = new PDFDocument({ margin: 50, size: "A4", layout: "portrait" });
  const chunks = [];

  const buffer = await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    pdfGenerator.drawSubmissionSlip(doc, attempt, user, questions).then(() => doc.end()).catch(reject);
  });

  return { buffer, fileName: utils.buildFileName(`slip-${attempt.quiz_title}`, "pdf"), contentType: "application/pdf" };
};

export const buildAttemptReviewExcel = async (attemptId, user) => {
  const { getMyAttemptReviewDetail } = await import('./attemptService.js');
  const { attempt, questions } = await getMyAttemptReviewDetail(user, attemptId);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Ôn tập chi tiết");

  excelGenerator.writeInteractiveReview(worksheet, questions);

  return {
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    fileName: utils.buildFileName(`review-${attempt.quiz_title}`, "xlsx"),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

/**
 * ZIP BUNDLING
 */
export const bundleQuizContentZip = async (quizId, user, options) => {
  const zip = new AdmZip();
  const { quiz } = await getQuizContentData(quizId, user, options.isParticipant);
  
  const formats = [
    { type: 'paper', name: '1-De-thi' },
    { type: 'key', name: '2-Dap-an' },
    { type: 'solutions', name: '3-Loi-giai-chi-tiet' }
  ];

  const results = await Promise.all(
    formats.map(f => options.format === 'pdf'
      ? buildQuizContentPdf(quizId, user, { ...options, type: f.type })
      : buildQuizContentExcel(quizId, user, { ...options, type: f.type }))
  );

  results.forEach((res, i) => zip.addFile(`${formats[i].name}-${res.fileName}`, res.buffer));

  return {
    buffer: zip.toBuffer(),
    fileName: utils.buildFileName(`${quiz.title}-full-pack`, "zip"),
    contentType: "application/zip",
  };
};
