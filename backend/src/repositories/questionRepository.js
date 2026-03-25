import pool from '../db/db.js';

export const create = async (data) => {
  const { content, type, quizId } = data;
 
  console.log(`info: in questionRepository.js:6 content: ${content}, type: ${type}, quizId: ${quizId}`);
  const sql = "INSERT INTO questions(content, type, quiz_id) VALUES (?, ?, ?);";
  const [row] = await pool.execute(sql, [content, type, quizId]);
  return row.insertId;
};

export const findQuestionById = async (id) => {
  const sql = "SELECT * FROM questions WHERE id = ?;";
  const [row] = await pool.execute(sql, [id]);
  return row[0] || null;
};

export const changeType = async (id, type) => {
  const sql = "UPDATE questions SET type = COALESCE(?, type) WHERE id = ?;";

  await pool.execute(sql, [type ?? null, id]);
};

export const changeContent = async (id, content) => {
  const sql = "UPDATE questions SET content = COALESCE(?, content) WHERE id = ?;";

  await pool.execute(sql, [content ?? null, id]);
};

export const getListQuestionByQuizId = async (id) => {
  const sql = "SELECT * FROM questions WHERE quiz_id = ?;";

  const [row] = await pool.execute(sql, [id]);
  return row;
};

export const deleteQuestionById = async (id) => {
  const sql = "DELETE FROM questions WHERE id = ?;";

  await pool.execute(sql, [id]);
};

/**
 * Lấy thống kê chi tiết cho từng câu hỏi của một quiz.
 *
 * Query này được tối ưu để thực hiện tất cả các phép tính toán
 * và tổng hợp ở phía database, giảm tải cho application server.
 * Nó trả về một set dữ liệu đầy đủ để dựng lên giao diện thống kê.
 *
 * @param {number} quizId - ID của quiz cần lấy thống kê.
 * @returns {Promise<Array<object>>} Mảng các object, mỗi object chứa:
 *   - question_id, question_content
 *   - total_responses: Tổng số lượt trả lời cho câu hỏi này
 *   - correct_responses: Số lượt trả lời đúng
 *   - option_id, option_content, is_correct
 *   - selection_count: Số lượt thí sinh đã chọn phương án này
 */
export const getQuestionAnalytics = async (quizId) => {
  const sql = `
    WITH quiz_attempt_totals AS (
      SELECT
        COUNT(*) AS total_attempts,
        SUM(CASE WHEN finished_at IS NOT NULL THEN 1 ELSE 0 END) AS submitted_attempts
      FROM quiz_attempts
      WHERE quiz_id = ?
    ),
    question_catalog AS (
      SELECT
        q.id AS question_id,
        q.content AS question_content,
        q.type AS question_type,
        ROW_NUMBER() OVER (ORDER BY q.id) AS question_order
      FROM questions q
      WHERE q.quiz_id = ?
        AND q.type IN ('ANANSWER', 'MULTI_ANSWERS')
    ),
    option_catalog AS (
      SELECT
        a.id AS option_id,
        a.question_id,
        a.content AS option_content,
        a.is_correct,
        ROW_NUMBER() OVER (PARTITION BY a.question_id ORDER BY a.id) AS option_order
      FROM answers a
      INNER JOIN question_catalog qc ON qc.question_id = a.question_id
    ),
    attempt_question_rows AS (
      SELECT
        aq.id AS attempt_question_id,
        aq.quiz_attempt_id,
        aq.type AS question_type,
        ROW_NUMBER() OVER (PARTITION BY aq.quiz_attempt_id ORDER BY aq.id) AS question_order
      FROM attempt_questions aq
      INNER JOIN quiz_attempts qa
        ON qa.id = aq.quiz_attempt_id
       AND qa.quiz_id = ?
       AND qa.finished_at IS NOT NULL
    ),
    mapped_attempt_questions AS (
      SELECT
        qc.question_id,
        qc.question_content,
        qc.question_type,
        aqr.attempt_question_id,
        aqr.quiz_attempt_id
      FROM question_catalog qc
      LEFT JOIN attempt_question_rows aqr
        ON aqr.question_order = qc.question_order
       AND aqr.question_type = qc.question_type
    ),
    attempt_option_rows AS (
      SELECT
        ao.id AS attempt_option_id,
        ao.attempt_question_id,
        ROW_NUMBER() OVER (PARTITION BY ao.attempt_question_id ORDER BY ao.id) AS option_order
      FROM attempt_options ao
    ),
    mapped_attempt_options AS (
      SELECT
        maq.question_id,
        maq.attempt_question_id,
        oc.option_id,
        oc.option_content,
        oc.is_correct,
        aor.attempt_option_id
      FROM mapped_attempt_questions maq
      LEFT JOIN option_catalog oc ON oc.question_id = maq.question_id
      LEFT JOIN attempt_option_rows aor
        ON aor.attempt_question_id = maq.attempt_question_id
       AND aor.option_order = oc.option_order
    ),
    option_attempt_flags AS (
      SELECT
        mao.question_id,
        mao.attempt_question_id,
        mao.option_id,
        mao.option_content,
        mao.is_correct,
        COUNT(aa.id) AS selection_count
      FROM mapped_attempt_options mao
      LEFT JOIN attempt_answers aa ON aa.attempt_option_id = mao.attempt_option_id
      GROUP BY
        mao.question_id,
        mao.attempt_question_id,
        mao.option_id,
        mao.option_content,
        mao.is_correct
    ),
    attempt_question_summary AS (
      SELECT
        maq.question_id,
        maq.attempt_question_id,
        COUNT(DISTINCT maq.quiz_attempt_id) AS exposure_count,
        SUM(CASE WHEN COALESCE(oaf.selection_count, 0) > 0 THEN 1 ELSE 0 END) AS selected_option_count,
        SUM(CASE WHEN COALESCE(oaf.is_correct, 0) = 1 THEN 1 ELSE 0 END) AS correct_option_count,
        SUM(
          CASE
            WHEN COALESCE(oaf.is_correct, 0) = 1 AND COALESCE(oaf.selection_count, 0) > 0 THEN 1
            ELSE 0
          END
        ) AS selected_correct_option_count,
        SUM(
          CASE
            WHEN COALESCE(oaf.is_correct, 0) = 0 AND COALESCE(oaf.selection_count, 0) > 0 THEN 1
            ELSE 0
          END
        ) AS selected_incorrect_option_count
      FROM mapped_attempt_questions maq
      LEFT JOIN option_attempt_flags oaf
        ON oaf.question_id = maq.question_id
       AND oaf.attempt_question_id = maq.attempt_question_id
      GROUP BY maq.question_id, maq.attempt_question_id
    ),
    question_summary AS (
      SELECT
        qc.question_id,
        qc.question_content,
        qc.question_type,
        qt.total_attempts,
        qt.submitted_attempts,
        COUNT(aqs.attempt_question_id) AS exposure_count,
        SUM(CASE WHEN COALESCE(aqs.selected_option_count, 0) > 0 THEN 1 ELSE 0 END) AS response_count,
        SUM(
          CASE
            WHEN qc.question_type = 'ANANSWER'
             AND COALESCE(aqs.selected_option_count, 0) = 1
             AND COALESCE(aqs.selected_correct_option_count, 0) = 1
             AND COALESCE(aqs.selected_incorrect_option_count, 0) = 0
            THEN 1
            WHEN qc.question_type = 'MULTI_ANSWERS'
             AND COALESCE(aqs.selected_option_count, 0) > 0
             AND COALESCE(aqs.selected_correct_option_count, 0) = COALESCE(aqs.correct_option_count, 0)
             AND COALESCE(aqs.selected_incorrect_option_count, 0) = 0
             AND COALESCE(aqs.selected_option_count, 0) = COALESCE(aqs.correct_option_count, 0)
            THEN 1
            ELSE 0
          END
        ) AS correct_count
      FROM question_catalog qc
      CROSS JOIN quiz_attempt_totals qt
      LEFT JOIN attempt_question_summary aqs ON aqs.question_id = qc.question_id
      GROUP BY
        qc.question_id,
        qc.question_content,
        qc.question_type,
        qt.total_attempts,
        qt.submitted_attempts
    )
    SELECT
      qs.question_id,
      qs.question_content,
      qs.question_type,
      qs.total_attempts,
      qs.submitted_attempts,
      qs.exposure_count,
      qs.response_count,
      qs.correct_count,
      GREATEST(qs.response_count - qs.correct_count, 0) AS incorrect_count,
      GREATEST(qs.exposure_count - qs.response_count, 0) AS skipped_count,
      oc.option_id,
      oc.option_content,
      oc.is_correct,
      COALESCE(SUM(oaf.selection_count), 0) AS selection_count
    FROM question_summary qs
    LEFT JOIN option_catalog oc ON oc.question_id = qs.question_id
    LEFT JOIN option_attempt_flags oaf
      ON oaf.question_id = qs.question_id
     AND oaf.option_id = oc.option_id
    GROUP BY
      qs.question_id,
      qs.question_content,
      qs.question_type,
      qs.total_attempts,
      qs.submitted_attempts,
      qs.exposure_count,
      qs.response_count,
      qs.correct_count,
      oc.option_id,
      oc.option_content,
      oc.is_correct
    ORDER BY qs.question_id, oc.option_id;
  `;

  const [rows] = await pool.execute(sql, [quizId, quizId, quizId]);
  return rows;
};
