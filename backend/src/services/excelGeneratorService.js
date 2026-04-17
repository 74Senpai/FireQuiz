import * as utils from '../utils/exportUtils.js';

export const setupCommonHeader = (worksheet, title, generatedBy, generatedAt, summary, quiz) => {
  worksheet.mergeCells("A1:K1");
  worksheet.getCell("A1").value = `Báo cáo kết quả bộ câu hỏi - ${title}`;
  worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: utils.REPORT_THEME.primary } };
  worksheet.getCell("A1").alignment = { horizontal: "left", vertical: "middle" };

  worksheet.mergeCells("A2:K2");
  worksheet.getCell("A2").value = "Báo cáo được định dạng để đối chiếu nhanh, lọc dữ liệu và in A4 ngang.";
  worksheet.getCell("A2").font = { size: 10, color: { argb: utils.REPORT_THEME.mutedText } };
  worksheet.getCell("A2").alignment = { horizontal: "left", vertical: "middle" };

  worksheet.getCell("A4").value = "Bộ câu hỏi";
  worksheet.getCell("B4").value = title || "--";
  worksheet.getCell("D4").value = "Người xuất";
  worksheet.getCell("E4").value = generatedBy;
  worksheet.getCell("G4").value = "Ngày xuất";
  worksheet.getCell("H4").value = utils.formatDateTime(generatedAt);
  worksheet.getCell("J4").value = "Lịch mở";
  worksheet.getCell("K4").value = utils.getScheduleText(quiz);

  worksheet.getCell("A5").value = "Tổng thí sinh";
  worksheet.getCell("B5").value = summary.totalParticipants;
  worksheet.getCell("D5").value = "Điểm trung bình";
  worksheet.getCell("E5").value = `${summary.averageScore.toFixed(2)}/${summary.gradingScale}`;
  worksheet.getCell("G5").value = "Tỷ lệ đúng";
  worksheet.getCell("H5").value = utils.formatPercentage(summary.accuracyRate);
  worksheet.getCell("J5").value = "TB thời gian";
  worksheet.getCell("K5").value = utils.formatDuration(summary.averageDurationSeconds);

  worksheet.getCell("A6").value = "Trạng thái";
  worksheet.getCell("B6").value = quiz.status || "--";
  worksheet.getCell("D6").value = "Thang điểm";
  worksheet.getCell("E6").value = `${summary.gradingScale}`;
  worksheet.getCell("G6").value = "Tổng đúng / sai";
  worksheet.getCell("H6").value = `${summary.totalCorrect} / ${summary.totalIncorrect}`;
  worksheet.getCell("J6").value = "Giới hạn";
  worksheet.getCell("K6").value = utils.formatDuration(quiz.time_limit_seconds);

  ['A4', 'D4', 'G4', 'J4', 'A5', 'D5', 'G5', 'J5', 'A6', 'D6', 'G6', 'J6'].forEach((ref) => {
    worksheet.getCell(ref).font = { bold: true, color: { argb: utils.REPORT_THEME.mutedText } };
  });

  ['A4', 'B4', 'D4', 'E4', 'G4', 'H4', 'J4', 'K4', 'A5', 'B5', 'D5', 'E5', 'G5', 'H5', 'J5', 'K5', 'A6', 'B6', 'D6', 'E6', 'G6', 'H6', 'J6', 'K6'].forEach((ref) => {
    const cell = worksheet.getCell(ref);
    cell.border = { bottom: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });
};

export const writeResultTable = (worksheet, rows, startRow, summary) => {
  rows.forEach((row, index) => {
    const totalResponses = Number(row.correct_count ?? 0) + Number(row.incorrect_count ?? 0);
    const accuracyRate = totalResponses ? Number(row.correct_count ?? 0) / totalResponses : 0;
    worksheet.addRow({
      rank: index + 1,
      full_name: row.full_name,
      email: row.email,
      student_code: `USER${String(row.user_id).padStart(4, "0")}`,
      score: Number(row.score ?? 0),
      duration: utils.formatDuration(row.duration_seconds),
      correct_count: Number(row.correct_count ?? 0),
      incorrect_count: Number(row.incorrect_count ?? 0),
      accuracy_rate: accuracyRate,
      started_at: utils.formatDateTime(row.started_at),
      finished_at: utils.formatDateTime(row.finished_at),
    });
  });

  // Styling
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= startRow) {
      const isHeader = rowNumber === startRow;
      const isAlternate = !isHeader && (rowNumber - startRow) % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } },
          left: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } },
          bottom: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } },
          right: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } },
        };
        if (!isHeader) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isAlternate ? utils.REPORT_THEME.slateSoft : "FFFFFFFF" } };
          cell.alignment = colNumber <= 4 ? { horizontal: "left", vertical: "middle" } : { horizontal: "center", vertical: "middle" };
        }
      });
    }
  });

  // Tones
  for (let rowIndex = startRow + 1; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const scoreCell = row.getCell("score");
    const scoreTone = utils.getScoreTone(Number(scoreCell.value ?? 0), summary.gradingScale);
    scoreCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: scoreTone.fill } };
    scoreCell.font = { bold: true, color: { argb: scoreTone.font } };

    const accuracyCell = row.getCell("accuracy_rate");
    const accuracyTone = utils.getAccuracyTone(Number(accuracyCell.value ?? 0) * 100);
    accuracyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: accuracyTone.fill } };
    accuracyCell.font = { bold: true, color: { argb: accuracyTone.font } };
  }
};

export const writeExcelQuestionContent = async (workbook, worksheet, questions, { showCorrect = false, showExplanation = false } = {}) => {
  let currentRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;

  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const q = questions[qIdx];
    const row = worksheet.getRow(currentRow++);
    row.getCell(1).value = `Câu ${qIdx + 1}: ${q.content}`;
    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };

    if (q.media_url && utils.isImageUrl(q.media_url)) {
      const imageBuffer = await utils.downloadMediaBuffer(q.media_url);
      if (imageBuffer) {
        try {
          const imageId = workbook.addImage({ buffer: imageBuffer, extension: q.media_url.split('.').pop().split('?')[0] || 'png' });
          worksheet.addImage(imageId, { tl: { col: 0, row: currentRow - 1 }, ext: { width: 300, height: 200 } });
          currentRow += 12; 
        } catch (e) {}
      }
    }

    if (q.type !== 'TEXT') {
      q.answers.forEach((a, aIdx) => {
        const optionRow = worksheet.getRow(currentRow++);
        const label = utils.getOptionLabel(aIdx);
        optionRow.getCell(1).value = `   ${label}. ${a.content}`;
        if (showCorrect && a.is_correct) {
          optionRow.getCell(1).font = { bold: true, color: { argb: utils.REPORT_THEME.success } };
        }
      });
    }

    if (showExplanation && q.explanation) {
      const explRow = worksheet.getRow(currentRow++);
      explRow.getCell(1).value = `   Giải thích: ${q.explanation}`;
      explRow.getCell(1).font = { italic: true, color: { argb: utils.REPORT_THEME.primary } };
    }
    currentRow++;
  }
};

export const writeInteractiveReview = (worksheet, questions) => {
  const headerRow = worksheet.getRow(1);
  headerRow.values = ["STT", "Nội dung câu hỏi", "Thí sinh chọn", "Đáp án đúng", "Kết quả", "Giải thích"];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: utils.REPORT_THEME.primary } };
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
    const correctOptions = q.answers.map((a, idx) => (a.is_correct ? utils.getOptionLabel(idx) : null)).filter(Boolean).join(", ");
    const optionsList = q.answers.map((_, idx) => utils.getOptionLabel(idx)).join(",");
    const fullContent = `${q.content}\n${q.answers.map((a, idx) => `${utils.getOptionLabel(idx)}. ${a.content}`).join("\n")}`;

    const row = worksheet.getRow(rowNumber);
    const isText = q.type === 'TEXT';
    
    row.values = {
      index: qIdx + 1,
      content: fullContent,
      selection: isText ? "[Nhập câu trả lời]" : correctOptions,
      correct: correctOptions,
      result: isText ? "TỰ ĐÁNH GIÁ" : { formula: `IF(C${rowNumber}=D${rowNumber}, "ĐÚNG", "SAI")` },
      explanation: q.explanation || "",
    };

    row.getCell("content").alignment = { wrapText: true, vertical: "top" };
    row.getCell("explanation").alignment = { wrapText: true, vertical: "top" };
    row.alignment = { vertical: "middle" };

    if (!isText) {
      row.getCell("selection").dataValidation = { type: "list", allowBlank: true, formulae: [`"${optionsList}"`], showErrorMessage: false };
      worksheet.addConditionalFormatting({
        ref: `C${rowNumber}`,
        rules: [
          { type: "expression", formulae: [`C${rowNumber}=D${rowNumber}`], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: utils.REPORT_THEME.successSoft } }, font: { color: { argb: utils.REPORT_THEME.success }, bold: true } } },
          { type: "expression", formulae: [`AND(NOT(ISBLANK(C${rowNumber})), C${rowNumber}<>D${rowNumber})`], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: utils.REPORT_THEME.dangerSoft } }, font: { color: { argb: utils.REPORT_THEME.danger }, bold: true } } },
        ],
      });
    }
  });
};

export const writeAnalyticsSheet = (worksheet, analyticsData) => {
  worksheet.columns = [
    { header: "STT", key: "index", width: 6 },
    { header: "Nội dung câu hỏi", key: "content", width: 45 },
    { header: "Loại", key: "type", width: 15 },
    { header: "Tổng lượt làm", key: "total_attempts", width: 15 },
    { header: "Số người trả lời", key: "total_responses", width: 15 },
    { header: "Số câu đúng", key: "correct_responses", width: 12 },
    { header: "Tỉ lệ đúng (%)", key: "correct_rate", width: 15, style: { numFmt: '0.00' } },
    { header: "Tỉ lệ sai (%)", key: "incorrect_rate", width: 15, style: { numFmt: '0.00' } },
  ];

  analyticsData.forEach((item, idx) => {
    worksheet.addRow({
      index: idx + 1,
      content: item.content,
      type: item.type === 'MULTI_ANSWERS' ? 'Nhiều đáp án' : 
            item.type === 'TEXT' ? 'Tự luận' : 
            item.type === 'TRUE_FALSE' ? 'Đúng/Sai' : '1 Đáp án',
      total_attempts: item.total_attempts,
      total_responses: item.total_responses,
      correct_responses: item.correct_responses,
      correct_rate: item.correct_rate,
      incorrect_rate: item.incorrect_rate,
    });
  });

  // Header Styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: utils.REPORT_THEME.primary } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  // Data Styling & Borders
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle', wrapText: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } },
          left: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } },
          bottom: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } },
          right: { style: "thin", color: { argb: utils.REPORT_THEME.slateLine } },
        };
      });

      // Conditional Formatting logic for rates
      const correctRateCell = row.getCell("correct_rate");
      const val = Number(correctRateCell.value);
      if (val < 40) {
        correctRateCell.font = { bold: true, color: { argb: utils.REPORT_THEME.danger } };
      } else if (val >= 80) {
        correctRateCell.font = { bold: true, color: { argb: utils.REPORT_THEME.success } };
      }
    }
  });
};
