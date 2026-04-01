import React, { useState, useCallback } from "react";
import { jsPDF } from "jspdf";

export interface DocConfig {
  title: string;
  content: string;
  type?: "pdf" | "txt" | "csv";
}

/**
 * Parse document blocks from AI message content.
 * Primary format: plain markdown with first line as title
 * Fallback: JSON format
 */
export function parseDocumentBlocks(content: string): { text: string; docs: DocConfig[] } {
  const docs: DocConfig[] = [];
  const cleaned = content.replace(/```document\s*([\s\S]*?)```/g, (_, raw) => {
    const trimmed = raw.trim();
    if (trimmed.length < 10) return "";

    // Check if it starts with JSON-like { — try to parse as JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("{{")) {
      // Strip double braces if present
      let jsonStr = trimmed.replace(/^\{\{/, "{").replace(/\}\}$/, "}");
      try {
        const config = JSON.parse(jsonStr);
        if (config.title && config.content) {
          // Convert escaped \n to real newlines
          const docContent = config.content.replace(/\\n/g, "\n");
          docs.push({ title: config.title, content: docContent, type: config.type || "pdf" });
          return `\n<!--doc-${docs.length - 1}-->\n`;
        }
      } catch {
        // JSON parse failed — try extracting fields manually
        const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]+)"/);
        const contentMatch = jsonStr.match(/"content"\s*:\s*"([\s\S]+)"\s*[,}]/);
        if (titleMatch && contentMatch) {
          const docContent = contentMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
          docs.push({ title: titleMatch[1], content: docContent.trim(), type: "pdf" });
          return `\n<!--doc-${docs.length - 1}-->\n`;
        }
      }
    }

    // Primary format: plain markdown — first line is title, rest is content
    const lines = trimmed.split("\n");
    const titleLine = lines[0].replace(/^#+\s*/, "").trim();
    const title = titleLine.length > 2 ? titleLine : "Document";
    const body = lines.slice(1).join("\n").trim();
    const docContent = body || trimmed;

    if (docContent.length > 20) {
      docs.push({ title, content: docContent, type: "pdf" });
      return `\n<!--doc-${docs.length - 1}-->\n`;
    }

    return "";
  });
  return { text: cleaned, docs };
}

function generatePDF(doc: DocConfig): Blob {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 25;

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(30, 30, 30);
  const titleLines = pdf.splitTextToSize(doc.title, maxWidth);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 8 + 5;

  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Content — parse markdown-like formatting
  const lines = doc.content.split("\n");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 50);

  for (const line of lines) {
    // Check if we need a new page
    if (y > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      y = 20;
    }

    const trimmed = line.trim();

    // Heading 1
    if (trimmed.startsWith("# ")) {
      y += 4;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(30, 30, 30);
      const wrapped = pdf.splitTextToSize(trimmed.replace(/^# /, ""), maxWidth);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 7 + 3;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      continue;
    }

    // Heading 2
    if (trimmed.startsWith("## ")) {
      y += 3;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(40, 40, 40);
      const wrapped = pdf.splitTextToSize(trimmed.replace(/^## /, ""), maxWidth);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 6 + 3;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      continue;
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      y += 2;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      const wrapped = pdf.splitTextToSize(trimmed.replace(/^### /, ""), maxWidth);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 5 + 2;
      pdf.setFont("helvetica", "normal");
      continue;
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const bulletText = trimmed.replace(/^[-*] /, "");
      const clean = bulletText.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      const wrapped = pdf.splitTextToSize(clean, maxWidth - 8);
      pdf.text("\u2022", margin + 2, y);
      pdf.text(wrapped, margin + 8, y);
      y += wrapped.length * 5 + 1.5;
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
    if (numMatch) {
      const clean = numMatch[2].replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      const wrapped = pdf.splitTextToSize(clean, maxWidth - 10);
      pdf.text(`${numMatch[1]}.`, margin + 2, y);
      pdf.text(wrapped, margin + 10, y);
      y += wrapped.length * 5 + 1.5;
      continue;
    }

    // Empty line
    if (!trimmed) {
      y += 3;
      continue;
    }

    // Normal paragraph — strip markdown bold/italic
    const clean = trimmed.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
    const wrapped = pdf.splitTextToSize(clean, maxWidth);
    pdf.text(wrapped, margin, y);
    y += wrapped.length * 5 + 1.5;
  }

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated by Time Tracker Pro AI  |  Page ${i} of ${pageCount}`, margin, pdf.internal.pageSize.getHeight() - 10);
  }

  return pdf.output("blob");
}

function generateTxt(doc: DocConfig): Blob {
  const clean = doc.content.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
  return new Blob([`${doc.title}\n${"=".repeat(doc.title.length)}\n\n${clean}`], { type: "text/plain" });
}

function generateCSV(doc: DocConfig): Blob {
  return new Blob([doc.content], { type: "text/csv" });
}

const AIDocument: React.FC<{ config: DocConfig }> = ({ config }) => {
  const [generating, setGenerating] = useState(false);

  const handleDownload = useCallback(() => {
    setGenerating(true);
    try {
      let blob: Blob;
      let ext: string;

      if (config.type === "csv") {
        blob = generateCSV(config);
        ext = "csv";
      } else if (config.type === "txt") {
        blob = generateTxt(config);
        ext = "txt";
      } else {
        blob = generatePDF(config);
        ext = "pdf";
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Document generation failed:", e);
    }
    setGenerating(false);
  }, [config]);

  const typeLabel = config.type === "csv" ? "CSV" : config.type === "txt" ? "TXT" : "PDF";
  const typeColor = config.type === "csv" ? "text-green-600 bg-green-50 border-green-200" : config.type === "txt" ? "text-slate-600 bg-slate-50 border-slate-200" : "text-red-600 bg-red-50 border-red-200";
  const previewLines = config.content.split("\n").filter(l => l.trim()).slice(0, 4);

  return (
    <div className="my-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-xs ${typeColor}`}>
          {typeLabel}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{config.title}</p>
          <p className="text-[10px] text-slate-400">{typeLabel} Document  •  Ready to download</p>
        </div>
        <button onClick={handleDownload} disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {generating ? "Generating..." : `Download ${typeLabel}`}
        </button>
      </div>
      {/* Preview */}
      <div className="px-4 py-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 font-mono leading-relaxed">
          {previewLines.map((line, i) => (
            <p key={i} className="truncate">{line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^#+\s*/, "")}</p>
          ))}
          {config.content.split("\n").length > 4 && (
            <p className="text-slate-400 italic">... and {config.content.split("\n").length - 4} more lines</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDocument;
