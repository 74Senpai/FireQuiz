import * as quizReportService from '../src/services/quizReportService.js';
import fs from 'fs';

async function testExport() {
  const mockUser = { id: 1, full_name: 'Test Admin', email: 'admin@test.com' };
  const quizId = 1; // Assuming quiz ID 1 exists in development DB

  try {
    console.log('Testing PDF Report (Stats)...');
    const pdfReport = await quizReportService.buildPdfReport(quizId, mockUser);
    fs.writeFileSync('test-stats.pdf', pdfReport.buffer);
    console.log('PDF Report generated.');

    console.log('Testing Excel Review...');
    const excelReview = await quizReportService.buildQuizContentExcel(quizId, mockUser, { type: 'review' });
    fs.writeFileSync('test-review.xlsx', excelReview.buffer);
    console.log('Excel Review generated.');

    console.log('Testing ZIP bundle...');
    const zipBundle = await quizReportService.bundleQuizContentZip(quizId, mockUser, { format: 'pdf', type: 'all' });
    fs.writeFileSync('test-bundle.zip', zipBundle.buffer);
    console.log('ZIP Bundle generated.');

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExport();
