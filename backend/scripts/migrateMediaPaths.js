import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TABLE_CONFIGS = [
  { table: 'users', column: 'avatar_url', bucket: process.env.SUPABASE_AVATAR_BUCKET || 'user-avatars' },
  { table: 'quizzes', column: 'thumbnail_url', bucket: process.env.SUPABASE_BUCKET || 'quizzes-img' },
  { table: 'questions', column: 'media_url', bucket: process.env.SUPABASE_BUCKET || 'quizzes-img' },
  { table: 'attempt_questions', column: 'media_url', bucket: process.env.SUPABASE_BUCKET || 'quizzes-img' }
];

const extractPath = (url, bucket) => {
  if (!url || !url.startsWith('http')) return url;
  // Handle both possible search patterns in case of manual changes
  const patterns = [`/public/${bucket}/`, `/object/public/${bucket}/` ];
  for (const p of patterns) {
    if (url.includes(p)) {
      return url.split(p)[1];
    }
  }
  // Fallback: just take everything after the last slash if it looks like a supabase URL
  if (url.includes('.supabase.co/storage/v1/object/public/')) {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
  return url;
};

const runMigration = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ...(process.env.DB_SSL === 'true' && {
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    }),
  });

  console.log('🚀 Bắt đầu Migrate Media URLs sang Paths...');

  try {
    for (const config of TABLE_CONFIGS) {
      console.log(`\n📂 Đang xử lý bảng: ${config.table} (cột: ${config.column})`);
      
      const [rows] = await pool.query(`SELECT id, ${config.column} FROM ${config.table} WHERE ${config.column} IS NOT NULL AND ${config.column} LIKE 'http%'`);
      
      console.log(`Found ${rows.length} rows to update.`);

      for (const row of rows) {
        const fullUrl = row[config.column];
        const pathPart = extractPath(fullUrl, config.bucket);
        
        if (pathPart !== fullUrl) {
          await pool.query(`UPDATE ${config.table} SET ${config.column} = ? WHERE id = ?`, [pathPart, row.id]);
          console.log(`   ✅ Corrected ID ${row.id}: ${pathPart}`);
        }
      }
    }
    console.log('\n🎉 Hoàn thành migration!');
  } catch (error) {
    console.error('❌ Lỗi migration:', error);
  } finally {
    await pool.end();
  }
};

runMigration();
