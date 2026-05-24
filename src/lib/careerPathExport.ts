import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { CareerPathDraft, CPStageData } from './firebase';

function cell(
  text: string,
  opts: { bold?: boolean; bg?: string; color?: string; size?: number } = {},
): TableCell {
  return new TableCell({
    shading: opts.bg ? { fill: opts.bg } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: 'Calibri',
            size: opts.size ?? 20,
            bold: opts.bold,
            color: opts.color ?? '000000',
          }),
        ],
      }),
    ],
  });
}

function bulletCell(items: string[], bg?: string): TableCell {
  return new TableCell({
    shading: bg ? { fill: bg } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    children: items.filter(Boolean).map(
      (item) =>
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: item, font: 'Calibri', size: 20 })],
        }),
    ),
  });
}

function headerCell(text: string, bg: string): TableCell {
  return new TableCell({
    shading: { fill: bg },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: bg },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: bg },
      left: { style: BorderStyle.SINGLE, size: 1, color: bg },
      right: { style: BorderStyle.SINGLE, size: 1, color: bg },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, font: 'Calibri', size: 22, bold: true, color: 'FFFFFF' })],
      }),
    ],
  });
}

function rowLabelCell(label: string): TableCell {
  return new TableCell({
    shading: { fill: 'EFF6FF' },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: label, font: 'Calibri', size: 20, bold: true })],
      }),
    ],
  });
}

function para(text: string, opts: { bold?: boolean; size?: number; color?: string; spaceAfter?: number } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: opts.spaceAfter ?? 160 },
    children: [
      new TextRun({
        text,
        font: 'Calibri',
        size: opts.size ?? 22,
        bold: opts.bold,
        color: opts.color ?? '000000',
      }),
    ],
  });
}

function buildRoadmapTable(stages: CareerPathDraft['stages']): Table {
  const stageKeys: Array<keyof typeof stages> = ['entry', 'emerging', 'experienced', 'leadership'];
  const stageLabels = ['Entry Level', 'Emerging Professional', 'Experienced Professional', 'Leadership & Influence'];
  const stageBgs = ['7EC5B3', 'F3B557', '183B68', 'C9A227'];

  const getStage = (key: keyof typeof stages): CPStageData => stages[key];

  const headerRow = new TableRow({
    children: [
      headerCell('Category', '374151'),
      ...stageKeys.map((_, i) => headerCell(stageLabels[i], stageBgs[i])),
    ],
  });

  const rows: [string, (s: CPStageData) => string | string[]][] = [
    ['Role / Job Title', (s) => s.roleTitle],
    ['What the Role Entails', (s) => s.roleDescription],
    ['Expectations & Milestones', (s) => s.milestones],
    ['Skills to Develop', (s) => s.skills],
    ['Education & Certifications', (s) => s.certifications],
    ['Professional Communities', (s) => s.communities],
    ['Target Companies', (s) => s.targetCompanies],
  ];

  const dataRows = rows.map(([label, getter]) =>
    new TableRow({
      children: [
        rowLabelCell(label),
        ...stageKeys.map((key) => {
          const val = getter(getStage(key));
          return Array.isArray(val)
            ? bulletCell(val)
            : cell(val);
        }),
      ],
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

export async function generateCareerPathDocx(data: CareerPathDraft): Promise<Blob> {
  const stageKeys: Array<keyof typeof data.stages> = ['entry', 'emerging', 'experienced', 'leadership'];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children: [
          // Header
          new Paragraph({
            spacing: { after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '183B68' } },
            children: [
              new TextRun({ text: 'YouthToPro Mentees Hub — Career Path Roadmap', font: 'Calibri', size: 28, bold: true, color: '183B68' }),
            ],
          }),
          para(''),
          // Personal info block
          para(`Name: ${data.fullName}`, { bold: true }),
          para(`Mentor: ${data.mentorName || '—'}`),
          para(`University: ${data.universityGradYear}`),
          para(`Degree: ${data.degreeMajor}`),
          para(''),
          para(`Career Direction: ${data.careerTitle}`, { bold: true }),
          para(`Vision: "${data.careerVision}"`, { color: '374151' }),
          para(''),
          para(`Generated: ${new Date().toLocaleDateString('en-GB')}`, { size: 18, color: '6B7280' }),
          para(''),
          // Roadmap table
          para('Career Roadmap', { bold: true, size: 26, color: '183B68', spaceAfter: 120 }),
          buildRoadmapTable(data.stages),
          para(''),
          // Network & Mentors
          para('Network & Mentors', { bold: true, size: 24, color: '183B68', spaceAfter: 120 }),
          ...data.networkMentors.filter(Boolean).map((n) =>
            new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: n, font: 'Calibri', size: 22 })] }),
          ),
          para(''),
          // Mentor Comments
          para('Mentor Comments', { bold: true, size: 24, color: '183B68', spaceAfter: 120 }),
          para(data.mentorComments || '(No mentor comments yet)', { color: '6B7280' }),
          data.mentorFeedbackDate ? para(`Date: ${data.mentorFeedbackDate}`, { size: 20, color: '6B7280' }) : para(''),
          para(''),
          // Personal Notes
          ...(data.personalNotes ? [
            para('Personal Notes', { bold: true, size: 24, color: '183B68', spaceAfter: 120 }),
            para(data.personalNotes, { color: '374151' }),
            para(''),
          ] : []),
          // Reflections
          ...([
            ['What is the most important piece of advice your mentor gave you?', data.reflections.reflection1],
            ['What will you change in your roadmap based on your mentor\'s feedback?', data.reflections.reflection2],
            ['What is your next action step after this conversation?', data.reflections.reflection3],
          ].filter(([, ans]) => ans).flatMap(([q, ans]) => [
            para(q as string, { bold: true, size: 20, color: '183B68', spaceAfter: 80 }),
            para(ans as string, { size: 20, color: '374151' }),
            para(''),
          ])),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function downloadCareerPathDocx(blob: Blob, fullName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = fullName.trim().replace(/\s+/g, '_') || 'Mentee';
  a.download = `YouthToPro_CareerPath_${name}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
