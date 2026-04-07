import PDFDocument from "pdfkit";
import { GeneratedPaper, GeneratedQuestion } from "@shared/schema";

export async function generatePDF(paper: GeneratedPaper, questions: GeneratedQuestion[], subjectName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", (buffer) => buffers.push(buffer));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // College Header (Placeholder)
    doc.fontSize(22).font('Helvetica-Bold').text("XYZ Engineering College", { align: "center" });
    doc.fontSize(12).font('Helvetica').text("Autonomous Institution", { align: "center" });
    doc.moveDown(1.5);

    // Title & Exam Type
    doc.fontSize(18).font('Helvetica-Bold').text(paper.title, { align: "center" });
    doc.fontSize(14).text(`EXAM: ${paper.examType.replace("-", " ")}`, { align: "center" });
    doc.moveDown();

    // Header Info Grid
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Subject: `, 50, doc.y, { continued: true }).font('Helvetica').text(subjectName);

    doc.font('Helvetica-Bold').text(`Total Marks: `, 50, doc.y, { continued: true }).font('Helvetica').text(`${paper.totalMarks}   `, { continued: true })
      .font('Helvetica-Bold').text(`Duration: `, { continued: true }).font('Helvetica').text(`${paper.durationMinutes} minutes`);

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(2);

    // Questions
    doc.fontSize(12).font('Helvetica');

    if (!questions || questions.length === 0) {
      if (paper.generatedContent) {
        doc.font('Courier').fontSize(10).text(paper.generatedContent, { lineGap: 4 });
      } else {
        doc.font('Helvetica-Oblique').text("No content available for this paper.");
      }
    } else {
      questions.forEach((q, index) => {
        // Question number
        doc.font('Helvetica-Bold').text(`Q${index + 1}. `, { continued: true });

        // Question text and marks
        doc.font('Helvetica').text(`${q.questionText} `, { continued: true });
        doc.font('Helvetica-Oblique').text(`[${q.marks}M]`);

        doc.moveDown(1);
      });
    }

    doc.end();
  });
}
