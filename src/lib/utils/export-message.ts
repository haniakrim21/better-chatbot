import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export const exportMessageAsPDF = (
  content: string,
  filename: string = "message.pdf",
) => {
  const doc = new jsPDF();

  // Split text to fit page width
  const splitText = doc.splitTextToSize(content, 180);

  doc.text(splitText, 15, 15);
  doc.save(filename);
};

export const exportMessageAsDOCX = (
  content: string,
  filename: string = "message.docx",
) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun(content)],
          }),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, filename);
  });
};
