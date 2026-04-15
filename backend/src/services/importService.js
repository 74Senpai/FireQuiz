import ExcelJS from 'exceljs';
import logger from '../utils/logger.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import { getQuizById } from '../repositories/quizRepository.js';
import AppError from '../errors/AppError.js';

const ALLOWED_TYPES = ['ANANSWER', 'MULTI_ANSWERS', 'TRUE_FALSE', 'TEXT'];
const MIN_OPTIONS = 3;
const MAX_OPTIONS = 10;

/**
 * Validate 1 row Excel, trả về object hợp lệ hoặc throw error
 */
const validateRow = (row, index) => {
  const rowNum = index + 2; // +2 vì Row 1 là header
  const errors = [];

  const content = row.question?.toString().trim();
  const type = row.type?.toString().trim().toUpperCase();
  const correctOptionsRaw = row.correct_options?.toString().trim();
  const explanation = row.explanation?.toString().trim() || null;

  if (!content) errors.push('Thiếu nội dung câu hỏi');
  if (!type) errors.push('Thiếu loại câu hỏi');
  else if (!ALLOWED_TYPES.includes(type)) errors.push(`Loại không hợp lệ: "${type}"`);

  if (errors.length > 0) {
    return { valid: false, rowNum, errors };
  }

  // Gom các options (bỏ qua ô trống)
  const options = [];
  for (let i = 1; i <= MAX_OPTIONS; i++) {
    const opt = row[`option${i}`]?.toString().trim();
    if (opt) options.push(opt);
  }

  // Validate theo loại
  if (type === 'TEXT') {
    return { valid: true, rowNum, data: { content, type, explanation, answers: [] } };
  }

  if (type === 'TRUE_FALSE') {
    if (options.length !== 2) {
      errors.push('TRUE_FALSE phải có đúng 2 options (TRUE và FALSE)');
    }
    const correctIdx = parseInt(correctOptionsRaw);
    if (isNaN(correctIdx) || correctIdx < 1 || correctIdx > 2) {
      errors.push('correct_options của TRUE_FALSE phải là 1 hoặc 2');
    }
    if (errors.length > 0) return { valid: false, rowNum, errors };

    const answers = options.map((content, i) => ({
      content,
      isCorrect: i + 1 === correctIdx,
    }));
    return { valid: true, rowNum, data: { content, type, explanation, answers } };
  }

  // ANANSWER / MULTI_ANSWERS
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    errors.push(`Số options phải từ ${MIN_OPTIONS} đến ${MAX_OPTIONS} (hiện có: ${options.length})`);
  }

  const correctIndices = (correctOptionsRaw || '')
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n));

  if (correctIndices.length === 0) {
    errors.push('Thiếu correct_options');
  }

  if (type === 'ANANSWER' && correctIndices.length !== 1) {
    errors.push('ANANSWER chỉ được có 1 đáp án đúng');
  }

  if (errors.length > 0) return { valid: false, rowNum, errors };

  const answers = options.map((content, i) => ({
    content,
    isCorrect: correctIndices.includes(i + 1),
  }));

  return { valid: true, rowNum, data: { content, type, explanation, answers } };
};

/**
 * Parse buffer Excel, bỏ qua Row 1 (header), trả về { valid[], invalid[] }
 */
export const parseExcelBuffer = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError('File Excel không có sheet nào', 400);

  // Đọc header từ Row 1
  const headerRow = sheet.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    headers.push(cell.value?.toString().trim().toLowerCase() || null);
  });

  const valid = [];
  const invalid = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // bỏ header

    // Map cells vào object theo header
    const rowData = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) rowData[header] = cell.value;
    });

    // Bỏ qua row rỗng hoàn toàn
    if (!rowData.question && !rowData.type) return;

    const result = validateRow(rowData, rowNumber - 1);
    if (result.valid) {
      valid.push(result.data);
    } else {
      invalid.push({ rowNum: result.rowNum, errors: result.errors });
    }
  });

  return { valid, invalid };
};

/**
 * Lưu hàng loạt câu hỏi vào DB
 */
export const bulkCreateQuestions = async (quizId, validRows) => {
  const results = { success: 0, failed: 0 };

  for (const row of validRows) {
    try {
      const questionId = await questionRepository.create({
        content: row.content,
        type: row.type,
        quizId,
        explanation: row.explanation,
      });

      if (row.answers && row.answers.length > 0) {
        await Promise.all(
          row.answers.map(ans =>
            answerRepository.createAnswer({
              content: ans.content,
              isCorrect: ans.isCorrect,
              questionId,
            })
          )
        );
      }
      results.success++;
    } catch (err) {
      results.failed++;
      logger.error(`importService.js - Error importing row: ${row.content} - ${err.message}`);
    }
  }

  return results;
};

/**
 * Sinh file Excel mẫu với 4 row ví dụ (1 mỗi loại)
 */
export const generateTemplateBuffer = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Questions');

  // Định nghĩa cột
  sheet.columns = [
    { header: 'question', key: 'question', width: 40 },
    { header: 'type', key: 'type', width: 16 },
    { header: 'correct_options', key: 'correct_options', width: 18 },
    { header: 'explanation', key: 'explanation', width: 30 },
    ...Array.from({ length: MAX_OPTIONS }, (_, i) => ({
      header: `option${i + 1}`,
      key: `option${i + 1}`,
      width: 20,
    })),
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 22;

  // Row mẫu
  const examples = [
    {
      question: 'Thủ đô của Việt Nam là?',
      type: 'ANANSWER',
      correct_options: '1',
      explanation: 'Hà Nội là thủ đô của Việt Nam từ năm 1945.',
      option1: 'Hà Nội',
      option2: 'TP.HCM',
      option3: 'Đà Nẵng',
      option4: 'Huế',
    },
    {
      question: 'Những ngôn ngữ nào là ngôn ngữ lập trình?',
      type: 'MULTI_ANSWERS',
      correct_options: '1,3',
      explanation: 'HTML và CSS là ngôn ngữ đánh dấu và định dạng, không phải ngôn ngữ lập trình.',
      option1: 'JavaScript',
      option2: 'HTML',
      option3: 'Python',
      option4: 'CSS',
    },
    {
      question: 'Trái Đất quay quanh Mặt Trời đúng không?',
      type: 'TRUE_FALSE',
      correct_options: '1',
      explanation: 'Đây là sự thật hiển nhiên (thuyết nhật tâm).',
      option1: 'TRUE',
      option2: 'FALSE',
    },
    {
      question: 'Hãy mô tả ngắn gọn về HTTP là gì?',
      type: 'TEXT',
      correct_options: '',
      explanation: 'HTTP là giao thức truyền tải siêu văn bản...',
    },
  ];

  examples.forEach((ex, i) => {
    const row = sheet.addRow(ex);
    // Màu xen kẽ cho dễ đọc
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: i % 2 === 0 ? 'FFF5F3FF' : 'FFFFFFFF' },
    };
  });

  // Thêm comment hướng dẫn vào header
  sheet.getCell('B1').note = 'Giá trị hợp lệ: ANANSWER | MULTI_ANSWERS | TRUE_FALSE | TEXT';
  sheet.getCell('C1').note = 'Số thứ tự đáp án đúng, phân cách bằng dấu phẩy (vd: 1 hoặc 1,3)';

  // Freeze row đầu
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Xuất buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
