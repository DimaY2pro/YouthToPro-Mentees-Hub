import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber } from 'docx';

export type SwotResponses = Record<'strengths' | 'weaknesses' | 'opportunities' | 'threats', string[]>;

const BRAND = { navy: '#183B68', aqua: '#7EC5B3', yellow: '#F3B557' };

function formattedDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export function downloadSwotPDF(menteeName: string, careerGoal: string, responses: SwotResponses) {
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 40;
  const colW = (pageW - 2 * margin - margin / 2) / 2;
  const colGap = margin / 2;

  const drawHeader = () => {
    pdf.setFillColor(24, 59, 104);
    pdf.rect(0, 0, pageW, 60, 'F');
    pdf.setTextColor('#FFFFFF');
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('YouthToPro – SWOT Analysis', margin, 40);
  };

  const drawFooter = () => {
    const footerY = pdf.internal.pageSize.getHeight() - 40;
    pdf.setFillColor(24, 59, 104);
    pdf.rect(0, footerY, pageW, 40, 'F');
    pdf.setTextColor('#FFFFFF');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('YouthToPro | Empowering Arab Youth', margin, footerY + 25);
  };

  drawHeader();

  pdf.setFontSize(12);
  pdf.setTextColor('#000000');
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${menteeName || 'N/A'}`, margin, 90);
  pdf.text(`Career Goal: ${careerGoal || 'N/A'}`, margin, 110);

  const sectionConfig: Record<string, { title: string; hex: [number, number, number] }> = {
    strengths:     { title: 'Strengths',     hex: [126, 197, 179] },
    weaknesses:    { title: 'Weaknesses',    hex: [243, 181, 87]  },
    opportunities: { title: 'Opportunities', hex: [24, 59, 104]   },
    threats:       { title: 'Threats',       hex: [153, 153, 153] },
  };

  let currentY = 150;
  const keys = Object.keys(sectionConfig) as (keyof typeof sectionConfig)[];

  keys.forEach((key, idx) => {
    const xPos = idx % 2 === 0 ? margin : margin + colW + colGap;
    if (idx === 2) {
      drawFooter();
      pdf.addPage();
      drawHeader();
      currentY = 90;
    }

    const { title, hex } = sectionConfig[key];
    pdf.setFillColor(...hex);
    pdf.rect(xPos, currentY, colW, 24, 'F');
    pdf.setFontSize(13);
    pdf.setTextColor('#FFFFFF');
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, xPos + 10, currentY + 16);

    let y = currentY + 40;
    pdf.setFontSize(11);
    pdf.setTextColor('#000000');
    pdf.setFont('helvetica', 'normal');

    const answers = responses[key as keyof SwotResponses] || [];
    answers.forEach((ans) => {
      const text = ans?.trim() || 'N/A';
      const lines = pdf.splitTextToSize(`• ${text}`, colW - 20);
      lines.forEach((line: string) => {
        pdf.text(line, xPos + 10, y);
        y += 16;
      });
    });
  });

  drawFooter();

  const safe = (menteeName || 'User').replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`DLV04_SWOT_${safe}_${formattedDate()}.pdf`);
}

// ── DOCX ──────────────────────────────────────────────────────────────────────

export async function downloadSwotDOCX(menteeName: string, careerGoal: string, responses: SwotResponses) {
  const BASE = 'Calibri';
  const NAVY = '183B68';
  const GRAY = '808080';

  const children: Paragraph[] = [
    new Paragraph({ text: 'SWOT Analysis Report', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Name: ', bold: true, size: 22, font: BASE }),
        new TextRun({ text: menteeName || 'N/A', size: 22, font: BASE }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Career Goal: ', bold: true, size: 22, font: BASE }),
        new TextRun({ text: careerGoal || 'N/A', size: 22, font: BASE }),
      ],
      spacing: { after: 240 },
    }),
  ];

  const sections = ['strengths', 'weaknesses', 'opportunities', 'threats'] as const;
  sections.forEach((key) => {
    children.push(
      new Paragraph({
        text: key.charAt(0).toUpperCase() + key.slice(1),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );
    (responses[key] || []).forEach((ans) => {
      children.push(new Paragraph({ text: ans?.trim() || 'N/A', bullet: { level: 0 } }));
    });
  });

  const doc = new Document({
    creator: 'YouthToPro Hub',
    title: 'SWOT Analysis Report',
    sections: [{
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'YouthToPro | Empowering Arab Youth', font: BASE, size: 18, color: GRAY }),
                new TextRun({ children: ['   Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], font: BASE, size: 18, color: GRAY }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safe = (menteeName || 'User').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `DLV04_SWOT_${safe}_${formattedDate()}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
