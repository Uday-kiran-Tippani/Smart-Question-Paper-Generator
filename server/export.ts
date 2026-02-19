
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { GeneratedPaper, Question } from "@shared/schema";

export async function generatePDF(paper: GeneratedPaper, questions: Question[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on("data", (buffer) => buffers.push(buffer));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Title
    doc.fontSize(20).text(paper.title, { align: "center" });
    doc.moveDown();
    
    // Header Info
    doc.fontSize(12).text(`Subject: ${paper.subject}`, { align: "left" });
    doc.text(`Class: ${paper.className}`, { align: "left" });
    doc.text(`Total Marks: ${paper.totalMarks}`, { align: "left" });
    doc.text(`Duration: ${paper.durationMinutes} minutes`, { align: "left" });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Group questions by section (implied by type/difficulty or just list them)
    // The prompt requested sections: A (MCQ), B (Short), C (Long)
    
    const sections = {
      "Section A: Multiple Choice Questions": questions.filter(q => q.type === "MCQ"),
      "Section B: Short Answer Questions": questions.filter(q => q.type === "Short"),
      "Section C: Long Answer Questions": questions.filter(q => q.type === "Long"),
    };

    for (const [sectionTitle, sectionQuestions] of Object.entries(sections)) {
      if (sectionQuestions.length === 0) continue;

      doc.fontSize(16).text(sectionTitle, { underline: true });
      doc.moveDown();

      sectionQuestions.forEach((q, index) => {
        doc.fontSize(12).text(`${index + 1}. ${q.content} (${q.marks} marks)`);
        
        if (q.type === "MCQ" && q.options) {
          const options = q.options as Record<string, string>;
          Object.entries(options).forEach(([key, value]) => {
            doc.fontSize(10).text(`   ${key}) ${value}`);
          });
        }
        
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    doc.end();
  });
}

export async function generateWord(paper: GeneratedPaper, questions: Question[]): Promise<Buffer> {
  const sections = {
    "Section A: Multiple Choice Questions": questions.filter(q => q.type === "MCQ"),
    "Section B: Short Answer Questions": questions.filter(q => q.type === "Short"),
    "Section C: Long Answer Questions": questions.filter(q => q.type === "Long"),
  };

  const children: (Paragraph)[] = [
    new Paragraph({
      text: paper.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Subject: ${paper.subject}`, bold: true }),
        new TextRun({ text: `\tTotal Marks: ${paper.totalMarks}\tDuration: ${paper.durationMinutes} mins` }),
      ],
    }),
    new Paragraph({ text: "" }), // Spacer
  ];

  for (const [sectionTitle, sectionQuestions] of Object.entries(sections)) {
    if (sectionQuestions.length === 0) continue;

    children.push(
      new Paragraph({
        text: sectionTitle,
        heading: HeadingLevel.HEADING_2,
      })
    );

    sectionQuestions.forEach((q, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. ${q.content}`, bold: true }),
            new TextRun({ text: ` (${q.marks} marks)` }),
          ],
        })
      );

      if (q.type === "MCQ" && q.options) {
        const options = q.options as Record<string, string>;
        Object.entries(options).forEach(([key, value]) => {
          children.push(
            new Paragraph({
              text: `   ${key}) ${value}`,
            })
          );
        });
      }
      
      children.push(new Paragraph({ text: "" })); // Spacer
    });
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  return await Packer.toBuffer(doc);
}
