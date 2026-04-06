import pool from '../db/db.js';

export const createQuiz = async (data) => {
  const {
    title,
    creatorId,
    description,
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = data;

  const sql = `
    INSERT INTO quizzes
    (title, creator_id, description, grading_scale, time_limit_seconds, available_from, available_until, max_attempts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [
    title,
    creatorId,
    description ?? null,
    gradingScale ?? null,
    timeLimitSeconds ?? null,
    availableFrom ?? null,
    availableUntil ?? null,
    maxAttempts ?? null
  ]);

  return result.insertId;
};

export const getQuizById = async (id) => {
  const sql = "SELECT * FROM quizzes WHERE id = ? AND status != 'DELETED';";
  const [quiz] = await pool.execute(sql, [id]);
  return quiz[0] || null;
}

// Chú thích (BE): Hàm lấy Quiz bằng mã PIN (code) phục vụ chức năng tham gia Quiz
export const getQuizByCode = async (code) => {
  const sql = "SELECT * FROM quizzes WHERE quiz_code = ? AND status != 'DELETED';";
  const [quiz] = await pool.execute(sql, [code]);
  return quiz[0] || null;
}

export const setStatus = async (id, status) => {
  const sql = "UPDATE quizzes SET status = ? WHERE id = ?;";
  await pool.execute(sql, [status, id]);
}

export const updateQuizSettings = async (id, data) => {
  const {
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = data;

  const sql = `
    UPDATE quizzes
    SET grading_scale = COALESCE(?, grading_scale),
        time_limit_seconds = COALESCE(?, time_limit_seconds),
        available_from = COALESCE(?, available_from),
        available_until = COALESCE(?, available_until),
        max_attempts = COALESCE(?, max_attempts)
    WHERE id = ?
  `;

  await pool.execute(sql, [
    gradingScale ?? null,
    timeLimitSeconds ?? null,
    availableFrom ?? null,
    availableUntil ?? null,
    maxAttempts ?? null,
    id
  ]);
};

export const updateQuizInfo = async (id, data) => {
  const { title, description } = data;

  const sql = `
    UPDATE quizzes
    SET title = COALESCE(?, title), description = COALESCE(?, description)
    WHERE id = ?
  `;

  await pool.execute(sql, [title ?? null, description ?? null, id]);
};

export const getListQuizByUserId = async (id) => {
  const sql = "SELECT * FROM quizzes WHERE creator_id = ? AND status != 'DELETED';";

  const [row] = await pool.execute(sql, [id]);
  return row;
};

export const softDelete = async (id) => {
  const sql = "UPDATE quizzes SET status = 'DELETED' WHERE id = ? AND status != 'DELETED';";
  await pool.execute(sql, [id]);
};

export const hardDelete = async (id) => {
  const sql = "DELETE FROM quizzes WHERE id = ? AND status != 'DELETED';";
  await pool.execute(sql, [id]);
};

export const setQuizCode = async (id, code) => {
  // code = null để xóa mã PIN
  const sql = "UPDATE quizzes SET quiz_code = ? WHERE id = ?;";
  await pool.execute(sql, [code ?? null, id]);
};

export const findByQuizCode = async (code) => {
  const sql = "SELECT id FROM quizzes WHERE quiz_code = ? AND status != 'DELETED' LIMIT 1;";
  const [rows] = await pool.execute(sql, [code]);
  return rows[0] || null;
};

/** Khung giờ mở — dùng trong WHERE (repository chỉ biểu diễn dữ liệu). */
const SQL_OPEN_WINDOW = `
  (available_from IS NULL OR available_from <= NOW())
  AND (available_until IS NULL OR available_until >= NOW())
`;

const SQL_HAS_SCHEDULE = `NOT (available_from IS NULL AND available_until IS NULL)`;

export const updatePromoteToPublicBySchedule = async (conn) => {
  await conn.execute(`
    UPDATE quizzes
    SET status = 'PUBLIC'
    WHERE status != 'PUBLIC'
      AND status != 'DELETED'
      AND (${SQL_HAS_SCHEDULE})
      AND (${SQL_OPEN_WINDOW})
  `);
};

export const updateDemotePublicPastAvailableUntil = async (conn) => {
  await conn.execute(`
    UPDATE quizzes
    SET status = 'PRIVATE'
    WHERE status = 'PUBLIC'
      AND available_until IS NOT NULL
      AND available_until < NOW()
  `);
};

export const countPublicOpenQuizzes = async (conn) => {
  const [countRows] = await conn.execute(
    `SELECT COUNT(*) AS total FROM quizzes
     WHERE status = 'PUBLIC'
       AND (${SQL_OPEN_WINDOW})`,
  );
  const total = countRows[0]?.total ?? 0;
  return Number(total) || 0;
};

export const findPublicOpenQuizzes = async (conn, { limit, offset }) => {
  const [rows] = await conn.execute(
    `SELECT * FROM quizzes
     WHERE status = 'PUBLIC'
       AND (${SQL_OPEN_WINDOW})
     ORDER BY id DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
  );
  return rows;
};

export const getPublicQuizzes = async () => {
  const sql = `
    SELECT * FROM quizzes 
    WHERE status = 'PUBLIC' 
      AND (available_from IS NULL OR available_from <= NOW())
      AND (available_until IS NULL OR available_until > NOW()) 
    ORDER BY created_at DESC;
  `;
  const [rows] = await pool.execute(sql);
  return rows;
};
