import { asyncHandler } from '../untils/asyncHandler.js';
import * as importService from '../services/importService.js';
import { getQuizById } from '../repositories/quizRepository.js';
import AppError from '../errors/AppError.js';

/**
 * GET /quiz/:id/import-excel/template
 * Trả về file Excel mẫu để người dùng download
 */
export const downloadTemplate = asyncHandler(async (req, res) => {
  const buffer = await importService.generateTemplateBuffer();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="firequiz_question_template.xlsx"'
  );

  return res.status(200).send(buffer);
});

/**
 * POST /quiz/:id/import-excel
 * Upload file .xlsx, parse và lưu câu hỏi vào DB
 */
export const importQuestionsFromExcel = asyncHandler(async (req, res) => {
  const quizId = req.params.id;
  const user = req.user;

  if (!req.file) {
    throw new AppError('Vui lòng upload file .xlsx', 400);
  }

  // Kiểm tra quiz tồn tại và owner
  const quiz = await getQuizById(quizId);
  if (!quiz) throw new AppError('Quiz không tồn tại', 404);
  if (quiz.creator_id != user.id) {
    throw new AppError('Bạn không có quyền import câu hỏi vào quiz này', 403);
  }

  // Parse file Excel
  const { valid, invalid } = await importService.parseExcelBuffer(req.file.buffer);

  if (valid.length === 0) {
    return res.status(400).json({
      message: 'Không có câu hỏi hợp lệ nào trong file',
      invalid,
    });
  }

  // Lưu hàng loạt
  const results = await importService.bulkCreateQuestions(quizId, valid);

  return res.status(200).json({
    message: `Import hoàn tất: ${results.success} câu thành công, ${results.failed + invalid.length} câu lỗi`,
    success: results.success,
    failed: results.failed + invalid.length,
    parseErrors: invalid,
  });
});
