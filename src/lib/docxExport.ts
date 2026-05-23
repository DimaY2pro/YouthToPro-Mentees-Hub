import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

export interface LOIExportData {
  date: string;
  fullName: string;
  program: string;
  university: string;
  cityCountry: string;
  graduationMonth: string;
  graduationYear: string;
  enjoyed: string;
  challenging: string;
  industry: string;
  preferredLocations: string;
  careerGoals: string;
  skills: string;
  challenges: string[];
  expectations: string[];
  availability: string;
  mobile: string;
  whatsapp: string;
  email: string;
  polishedText?: string | null;
}

function bodyPara(text: string, options?: { bold?: boolean; italic?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }): Paragraph {
  return new Paragraph({
    alignment: options?.align ?? AlignmentType.LEFT,
    spacing: { after: 200, line: 276 },
    children: [
      new TextRun({
        text,
        font: 'Calibri',
        size: 22,
        bold: options?.bold,
        italics: options?.italic,
      }),
    ],
  });
}

function bulletPara(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, font: 'Calibri', size: 22 })],
  });
}

function buildParagraphs(data: LOIExportData): Paragraph[] {
  const bullets = (items: string[]) => items.filter(Boolean).map(bulletPara);

  return [
    bodyPara(data.date, { align: AlignmentType.RIGHT }),
    bodyPara(''),
    bodyPara('Dear Mentor,', { italic: true }),
    bodyPara(''),
    bodyPara(
      `My name is ${data.fullName} and I am studying ${data.program} at ${data.university} in ${data.cityCountry} and my expected graduation is in ${data.graduationMonth} ${data.graduationYear}. I am very excited to work with you through the YouthToProfessionals mentoring program and I hope this letter will give you a good idea about who I am and how I can benefit from your professional and life experience.`,
    ),
    bodyPara(''),
    bodyPara(
      `During my time at university, I enjoyed ${data.enjoyed}. What I found to be challenging/less enjoyable was ${data.challenging}.`,
    ),
    bodyPara(''),
    bodyPara(
      `My industry of choice is ${data.industry}, ideally in ${data.preferredLocations}. As I think of my future career, my goals are ${data.careerGoals}. I feel that ${data.skills} will support me in being successful in this line of work.`,
    ),
    bodyPara(''),
    bodyPara('However, I foresee the following challenges which I need your help with:'),
    ...bullets(data.challenges),
    bodyPara(''),
    bodyPara('I am looking for a mentor who can:'),
    ...bullets(data.expectations),
    bodyPara(''),
    bodyPara(
      `I thank you in advance for the time you intend to invest with me and my intention is to show up fully to make this time well-worth your effort! I am available to meet ${data.availability}.`,
    ),
    bodyPara('Please find below my contact details:'),
    bodyPara(''),
  ];
}

function buildContactTable(data: LOIExportData): Table {
  const headerCell = (text: string) =>
    new TableCell({
      width: { size: 33, type: WidthType.PERCENTAGE },
      shading: { fill: '183B68', color: 'FFFFFF' },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '183B68' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '183B68' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '183B68' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '183B68' },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, font: 'Calibri', size: 22, bold: true, color: 'FFFFFF' })],
        }),
      ],
    });

  const valueCell = (text: string) =>
    new TableCell({
      width: { size: 33, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, font: 'Calibri', size: 22 })],
        }),
      ],
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell('Mobile'), headerCell('WhatsApp'), headerCell('Email')] }),
      new TableRow({ children: [valueCell(data.mobile), valueCell(data.whatsapp), valueCell(data.email)] }),
    ],
  });
}

function buildFromPolished(data: LOIExportData, polished: string): Paragraph[] {
  return polished.split('\n').map((line) => bodyPara(line));
}

export async function generateLOIDocx(data: LOIExportData): Promise<Blob> {
  const nameParts = data.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Mentee';
  const lastName = nameParts.slice(1).join('_') || '';

  const bodyParagraphs = data.polishedText
    ? buildFromPolished(data, data.polishedText)
    : buildParagraphs(data);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Mentee Letter of Intent',
                font: 'Calibri',
                size: 24,
                bold: true,
                color: '183B68',
              }),
            ],
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '183B68' },
            },
          }),
          ...bodyParagraphs,
          buildContactTable(data),
          bodyPara(''),
          bodyPara('Best regards,'),
          bodyPara(''),
          new Paragraph({
            children: [
              new TextRun({ text: data.fullName, font: 'Calibri', size: 22, bold: true }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export function downloadDocx(blob: Blob, firstName: string, lastName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `YouthToPro_Letter_of_Intent_${firstName}${lastName ? '_' + lastName : ''}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
