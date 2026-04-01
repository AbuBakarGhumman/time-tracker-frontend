import jsPDF from "jspdf";
import { formatHoursAsHoursMinutes } from "./dateUtils";

// ── Constants ────────────────────────────────────────────────────────────────

const BRAND_COLOR: [number, number, number] = [59, 130, 246]; // blue-500
const BRAND_DARK: [number, number, number] = [30, 64, 175]; // blue-800
const TEXT_PRIMARY: [number, number, number] = [15, 23, 42]; // slate-900
const TEXT_SECONDARY: [number, number, number] = [100, 116, 139]; // slate-500
const TEXT_MUTED: [number, number, number] = [148, 163, 184]; // slate-400
const BG_HEADER: [number, number, number] = [241, 245, 249]; // slate-100
const BORDER_COLOR: [number, number, number] = [226, 232, 240]; // slate-200
const GREEN: [number, number, number] = [16, 185, 129];
const RED: [number, number, number] = [239, 68, 68];
const ORANGE: [number, number, number] = [245, 158, 11];
const PURPLE: [number, number, number] = [139, 92, 246];

const PAGE_MARGIN = 20;
const LINE_HEIGHT = 6;

// ── Helper Class ─────────────────────────────────────────────────────────────

interface ReportBranding {
  brandName?: string;
  logoUrl?: string;
  accentColor?: string; // hex e.g. "#3b82f6"
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function darkenRgb(rgb: [number, number, number], factor: number = 0.5): [number, number, number] {
  return [
    Math.round(rgb[0] * factor),
    Math.round(rgb[1] * factor),
    Math.round(rgb[2] * factor),
  ];
}

class ReportPdfBuilder {
  private pdf: jsPDF;
  private y: number = PAGE_MARGIN;
  private pageWidth: number;
  private contentWidth: number;
  private pageHeight: number;
  private branding: ReportBranding;
  private accentRgb: [number, number, number];
  private accentDark: [number, number, number];

  constructor(orientation: "portrait" | "landscape" = "portrait", branding?: ReportBranding) {
    this.pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - PAGE_MARGIN * 2;
    this.branding = branding || {};
    this.accentRgb = this.branding.accentColor ? hexToRgb(this.branding.accentColor) : BRAND_COLOR;
    this.accentDark = darkenRgb(this.accentRgb, 0.5);
  }

  private get brandName(): string {
    return this.branding.brandName || "Time Tracker Pro";
  }

  // ── Page Management ──────────────────────────────────────────────────────

  private checkPageBreak(requiredSpace: number = 20) {
    if (this.y + requiredSpace > this.pageHeight - 20) {
      this.addPageFooter();
      this.pdf.addPage();
      this.y = PAGE_MARGIN;
      return true;
    }
    return false;
  }

  private addPageFooter() {
    const pageCount = this.pdf.getNumberOfPages();
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...TEXT_MUTED);
    this.pdf.text(
      `Page ${pageCount}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: "center" }
    );
    this.pdf.text(
      this.brandName,
      PAGE_MARGIN,
      this.pageHeight - 10
    );
    this.pdf.text(
      new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      this.pageWidth - PAGE_MARGIN,
      this.pageHeight - 10,
      { align: "right" }
    );
  }

  // ── Drawing Primitives ───────────────────────────────────────────────────

  private drawReportHeader(
    title: string,
    dateRange: string,
    filters: { project?: string; billable?: string }
  ) {
    // Header band with accent color
    this.pdf.setFillColor(...this.accentRgb);
    this.pdf.rect(0, 0, this.pageWidth, 35, "F");

    // Darker overlay on left portion
    this.pdf.setFillColor(...this.accentDark);
    this.pdf.rect(0, 0, this.pageWidth * 0.4, 35, "F");

    // Title
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(20);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text(title, PAGE_MARGIN, 16);

    // Subtitle line
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(220, 230, 255);

    let subtitle = `Period: ${dateRange}`;
    if (filters.project && filters.project !== "All Projects") {
      subtitle += `  |  Project: ${filters.project}`;
    }
    if (filters.billable && filters.billable !== "All") {
      subtitle += `  |  ${filters.billable}`;
    }
    this.pdf.text(subtitle, PAGE_MARGIN, 26);

    // Brand name (top-right)
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(180, 200, 255);
    this.pdf.text(this.brandName, this.pageWidth - PAGE_MARGIN, 16, { align: "right" });

    this.y = 45;
  }

  private drawSectionTitle(title: string) {
    this.checkPageBreak(15);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(13);
    this.pdf.setTextColor(...this.accentDark);
    this.pdf.text(title, PAGE_MARGIN, this.y);
    this.y += 2;

    // Underline with accent color
    this.pdf.setDrawColor(...this.accentRgb);
    this.pdf.setLineWidth(0.8);
    this.pdf.line(PAGE_MARGIN, this.y, PAGE_MARGIN + 50, this.y);
    this.y += 8;
  }

  private drawStatGrid(stats: Array<{ label: string; value: string; subtitle?: string }>, cols: number = 4) {
    const cellWidth = this.contentWidth / cols;
    const cellHeight = 20;

    for (let i = 0; i < stats.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      if (col === 0 && row > 0) {
        this.y += cellHeight + 4;
        this.checkPageBreak(cellHeight + 4);
      }

      const x = PAGE_MARGIN + col * cellWidth;
      const yStart = this.y;

      // Card background
      this.pdf.setFillColor(248, 250, 252);
      this.pdf.setDrawColor(...BORDER_COLOR);
      this.pdf.roundedRect(x + 1, yStart, cellWidth - 3, cellHeight, 2, 2, "FD");

      // Label
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(...TEXT_SECONDARY);
      this.pdf.text(stats[i].label.toUpperCase(), x + 4, yStart + 5.5);

      // Value
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(...TEXT_PRIMARY);
      this.pdf.text(String(stats[i].value), x + 4, yStart + 13);

      // Subtitle
      if (stats[i].subtitle) {
        this.pdf.setFont("helvetica", "normal");
        this.pdf.setFontSize(6.5);
        this.pdf.setTextColor(...TEXT_MUTED);
        this.pdf.text(stats[i].subtitle!, x + 4, yStart + 17.5);
      }
    }

    const totalRows = Math.ceil(stats.length / cols);
    this.y += cellHeight * totalRows + 4 * (totalRows - 1) + 8;
  }

  private drawTable(
    headers: string[],
    rows: string[][],
    colWidths?: number[],
    options?: {
      cellColors?: Array<Array<[number, number, number] | null>>;
    }
  ) {
    const widths = colWidths || headers.map(() => this.contentWidth / headers.length);
    const rowHeight = 7;
    const headerHeight = 8;

    this.checkPageBreak(headerHeight + rowHeight * 2);

    // Header
    this.pdf.setFillColor(...BG_HEADER);
    this.pdf.setDrawColor(...BORDER_COLOR);
    this.pdf.rect(PAGE_MARGIN, this.y, this.contentWidth, headerHeight, "FD");

    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(...TEXT_SECONDARY);

    let xOffset = PAGE_MARGIN + 3;
    headers.forEach((header, i) => {
      this.pdf.text(header.toUpperCase(), xOffset, this.y + 5.5);
      xOffset += widths[i];
    });

    this.y += headerHeight;

    // Rows
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(8);

    rows.forEach((row, rowIdx) => {
      this.checkPageBreak(rowHeight);

      // Alternating row bg
      if (rowIdx % 2 === 0) {
        this.pdf.setFillColor(255, 255, 255);
      } else {
        this.pdf.setFillColor(249, 250, 251);
      }
      this.pdf.rect(PAGE_MARGIN, this.y, this.contentWidth, rowHeight, "F");

      // Bottom border
      this.pdf.setDrawColor(...BORDER_COLOR);
      this.pdf.setLineWidth(0.2);
      this.pdf.line(PAGE_MARGIN, this.y + rowHeight, PAGE_MARGIN + this.contentWidth, this.y + rowHeight);

      xOffset = PAGE_MARGIN + 3;
      row.forEach((cell, colIdx) => {
        // Apply custom color if provided
        if (options?.cellColors?.[rowIdx]?.[colIdx]) {
          this.pdf.setTextColor(...options.cellColors[rowIdx][colIdx]!);
        } else {
          this.pdf.setTextColor(...TEXT_PRIMARY);
        }
        // Truncate long text
        const maxWidth = widths[colIdx] - 4;
        let text = cell;
        while (this.pdf.getTextWidth(text) > maxWidth && text.length > 3) {
          text = text.slice(0, -4) + "...";
        }
        this.pdf.text(text, xOffset, this.y + 5);
        xOffset += widths[colIdx];
      });

      this.y += rowHeight;
    });

    this.y += 6;
  }

  private drawKeyValue(label: string, value: string) {
    this.checkPageBreak(LINE_HEIGHT);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...TEXT_SECONDARY);
    this.pdf.text(`${label}:`, PAGE_MARGIN, this.y);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(...TEXT_PRIMARY);
    this.pdf.text(value, PAGE_MARGIN + 55, this.y);
    this.y += LINE_HEIGHT;
  }

  private addSpace(mm: number = 4) {
    this.y += mm;
  }

  // ── Chart Drawing ──────────────────────────────────────────────────────

  private drawPieChart(
    data: Array<{ label: string; value: number; color: [number, number, number] }>,
    title: string,
    x: number,
    y: number,
    radius: number = 25
  ) {
    const cx = x + radius + 5;
    const cy = y + radius + 5;
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return;

    let startAngle = -Math.PI / 2;

    data.forEach((slice) => {
      const sliceAngle = (slice.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      // Draw filled arc using small triangle segments
      this.pdf.setFillColor(...slice.color);
      const steps = Math.max(Math.ceil(sliceAngle / 0.05), 2);
      for (let i = 0; i < steps; i++) {
        const a1 = startAngle + (sliceAngle * i) / steps;
        const a2 = startAngle + (sliceAngle * (i + 1)) / steps;
        this.pdf.triangle(
          cx, cy,
          cx + radius * Math.cos(a1), cy + radius * Math.sin(a1),
          cx + radius * Math.cos(a2), cy + radius * Math.sin(a2),
          "F"
        );
      }

      startAngle = endAngle;
    });

    // Legend
    const legendX = cx + radius + 12;
    let legendY = y + 8;
    this.pdf.setFontSize(7);

    data.forEach((slice) => {
      if (slice.value === 0) return;
      this.pdf.setFillColor(...slice.color);
      this.pdf.rect(legendX, legendY - 2.5, 4, 4, "F");
      this.pdf.setTextColor(...TEXT_PRIMARY);
      this.pdf.setFont("helvetica", "normal");
      const pct = total > 0 ? ((slice.value / total) * 100).toFixed(0) : "0";
      this.pdf.text(`${slice.label} (${pct}%)`, legendX + 6, legendY + 0.5);
      legendY += 6;
    });

    // Title
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...BRAND_DARK);
    this.pdf.text(title, x, y - 2);
  }

  private drawBarChart(
    data: Array<{ label: string; value: number; color?: [number, number, number] }>,
    title: string,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      defaultColor?: [number, number, number];
      stacked?: Array<{ key: string; color: [number, number, number] }>;
      stackedData?: Array<Record<string, number>>;
    }
  ) {
    const { x, y, width, height, defaultColor = BRAND_COLOR } = options;

    // Title
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...BRAND_DARK);
    this.pdf.text(title, x, y - 2);

    if (data.length === 0) return;

    const chartX = x + 12;
    const chartW = width - 14;
    const chartH = height - 12;
    const chartY = y;

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const barWidth = Math.min((chartW / data.length) * 0.7, 12);
    const gap = chartW / data.length;

    // Y-axis line
    this.pdf.setDrawColor(...BORDER_COLOR);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(chartX, chartY, chartX, chartY + chartH);
    // X-axis line
    this.pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    // Y-axis labels (3 ticks)
    this.pdf.setFontSize(6);
    this.pdf.setTextColor(...TEXT_MUTED);
    for (let i = 0; i <= 2; i++) {
      const val = (maxVal * (2 - i)) / 2;
      const tickY = chartY + (chartH * i) / 2;
      this.pdf.text(val.toFixed(1), x, tickY + 1.5);
      this.pdf.setDrawColor(240, 240, 240);
      this.pdf.line(chartX, tickY, chartX + chartW, tickY);
    }

    // Bars
    data.forEach((d, i) => {
      const barH = (d.value / maxVal) * chartH;
      const bx = chartX + i * gap + (gap - barWidth) / 2;
      const by = chartY + chartH - barH;

      this.pdf.setFillColor(...(d.color || defaultColor));
      this.pdf.roundedRect(bx, by, barWidth, barH, 1, 1, "F");

      // X-axis label
      this.pdf.setFontSize(5.5);
      this.pdf.setTextColor(...TEXT_MUTED);
      const labelText = d.label.length > 6 ? d.label.slice(0, 5) + ".." : d.label;
      this.pdf.text(labelText, bx + barWidth / 2, chartY + chartH + 4, { align: "center" });
    });
  }

  private drawLineChart(
    data: Array<{ label: string; value: number }>,
    title: string,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      lineColor?: [number, number, number];
      fillColor?: [number, number, number];
      referenceLine?: number;
    }
  ) {
    const { x, y, width, height, lineColor = BRAND_COLOR, fillColor, referenceLine } = options;

    // Title
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...BRAND_DARK);
    this.pdf.text(title, x, y - 2);

    if (data.length < 2) return;

    const chartX = x + 12;
    const chartW = width - 14;
    const chartH = height - 12;
    const chartY = y;

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const stepX = chartW / (data.length - 1);

    // Axes
    this.pdf.setDrawColor(...BORDER_COLOR);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(chartX, chartY, chartX, chartY + chartH);
    this.pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    // Y-axis labels
    this.pdf.setFontSize(6);
    this.pdf.setTextColor(...TEXT_MUTED);
    for (let i = 0; i <= 2; i++) {
      const val = (maxVal * (2 - i)) / 2;
      const tickY = chartY + (chartH * i) / 2;
      this.pdf.text(val.toFixed(1), x, tickY + 1.5);
      this.pdf.setDrawColor(240, 240, 240);
      this.pdf.line(chartX, tickY, chartX + chartW, tickY);
    }

    // Reference line
    if (referenceLine !== undefined && referenceLine <= maxVal) {
      const refY = chartY + chartH - (referenceLine / maxVal) * chartH;
      this.pdf.setDrawColor(...RED);
      this.pdf.setLineWidth(0.3);
      const dashLen = 2;
      for (let dx = chartX; dx < chartX + chartW; dx += dashLen * 2) {
        this.pdf.line(dx, refY, Math.min(dx + dashLen, chartX + chartW), refY);
      }
    }

    // Compute points
    const points = data.map((d, i) => ({
      px: chartX + i * stepX,
      py: chartY + chartH - (d.value / maxVal) * chartH,
    }));

    // Fill area under line
    if (fillColor) {
      this.pdf.setFillColor(...fillColor);
      for (let i = 0; i < points.length - 1; i++) {
        this.pdf.triangle(
          points[i].px, points[i].py,
          points[i + 1].px, points[i + 1].py,
          points[i].px, chartY + chartH,
          "F"
        );
        this.pdf.triangle(
          points[i + 1].px, points[i + 1].py,
          points[i + 1].px, chartY + chartH,
          points[i].px, chartY + chartH,
          "F"
        );
      }
    }

    // Draw line
    this.pdf.setDrawColor(...lineColor);
    this.pdf.setLineWidth(0.6);
    for (let i = 0; i < points.length - 1; i++) {
      this.pdf.line(points[i].px, points[i].py, points[i + 1].px, points[i + 1].py);
    }

    // Dots
    points.forEach((p) => {
      this.pdf.setFillColor(...lineColor);
      this.pdf.circle(p.px, p.py, 1, "F");
    });

    // X-axis labels (show every nth to avoid overlap)
    const showEvery = Math.max(1, Math.ceil(data.length / 8));
    this.pdf.setFontSize(5.5);
    this.pdf.setTextColor(...TEXT_MUTED);
    data.forEach((d, i) => {
      if (i % showEvery !== 0 && i !== data.length - 1) return;
      const labelText = d.label.length > 6 ? d.label.slice(0, 5) + ".." : d.label;
      this.pdf.text(labelText, points[i].px, chartY + chartH + 4, { align: "center" });
    });
  }

  private drawChartRow(
    charts: Array<() => void>,
    chartHeight: number = 55
  ) {
    this.checkPageBreak(chartHeight + 10);
    charts.forEach((drawFn) => drawFn());
    this.y += chartHeight + 10;
  }

  // ── Report Builders ──────────────────────────────────────────────────────

  generateAttendanceReport(
    data: any,
    dateRange: string,
    filters: { project?: string; billable?: string }
  ) {
    this.drawReportHeader("Attendance Report", dateRange, filters);

    // Summary Stats
    this.drawSectionTitle("Summary");
    this.drawStatGrid([
      { label: "Working Days", value: String(data.total_working_days) },
      { label: "Present Days", value: String(data.present_days), subtitle: `${((data.present_days / data.total_working_days) * 100 || 0).toFixed(1)}%` },
      { label: "Absent Days", value: String(data.absent_days), subtitle: `${((data.absent_days / data.total_working_days) * 100 || 0).toFixed(1)}%` },
      { label: "Late Arrivals", value: String(data.late_arrivals) },
      { label: "Total Hours", value: formatHoursAsHoursMinutes(data.total_working_hours), subtitle: `Avg: ${formatHoursAsHoursMinutes(data.average_daily_hours)}/day` },
      { label: "Longest Streak", value: `${data.longest_present_streak} days` },
      { label: "Overtime", value: formatHoursAsHoursMinutes(data.overtime_hours), subtitle: "Above 9h/day" },
      { label: "Undertime", value: formatHoursAsHoursMinutes(data.undertime_hours), subtitle: "Below 9h/day" },
    ]);

    // Charts
    this.drawSectionTitle("Visual Overview");
    this.checkPageBreak(65);
    const chartY = this.y;

    // Attendance pie
    this.drawPieChart(
      [
        { label: "Present", value: data.present_days, color: GREEN },
        { label: "Absent", value: data.absent_days, color: RED },
      ],
      "Attendance",
      PAGE_MARGIN, chartY, 22
    );

    // Punctuality pie
    const onTimePct = Math.round(data.on_time_percentage);
    this.drawPieChart(
      [
        { label: "On Time", value: onTimePct, color: GREEN },
        { label: "Late", value: 100 - onTimePct, color: ORANGE },
      ],
      "Punctuality",
      PAGE_MARGIN + 75, chartY, 22
    );

    // Daily hours bar chart
    const presentDays = (data.daily_breakdown || []).filter((d: any) => d.present);
    if (presentDays.length > 0) {
      this.drawBarChart(
        presentDays.slice(-14).map((d: any) => ({
          label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: d.hours,
        })),
        "Daily Hours",
        { x: PAGE_MARGIN, y: chartY + 58, width: this.contentWidth, height: 45 }
      );
      this.y = chartY + 58 + 45 + 8;
    } else {
      this.y = chartY + 58;
    }

    // Key Metrics
    this.drawSectionTitle("Key Metrics");
    this.drawKeyValue("On-Time Rate", `${data.on_time_percentage.toFixed(1)}%`);
    this.drawKeyValue("Avg Check-in Time", data.avg_checkin_time || "—");
    this.drawKeyValue("Avg Check-out Time", data.avg_checkout_time || "—");
    this.drawKeyValue("Early Departures", String(data.early_departures));
    this.addSpace(6);

    // Daily Breakdown Table
    if (data.daily_breakdown && data.daily_breakdown.length > 0) {
      this.drawSectionTitle("Daily Breakdown");

      const headers = ["Date", "Status", "Check-in", "Check-out", "Hours", "Punctuality", "Overtime"];
      const widths = [30, 20, 22, 22, 22, 25, 25];
      const rows: string[][] = [];
      const cellColors: Array<Array<[number, number, number] | null>> = [];

      // Show most recent first
      const breakdown = [...data.daily_breakdown].reverse();
      breakdown.forEach((day: any) => {
        const dateStr = new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const rowColors: Array<[number, number, number] | null> = [null, null, null, null, null, null, null];

        if (day.present) {
          rowColors[1] = GREEN;
          rowColors[5] = day.is_late ? ORANGE : GREEN;
          rowColors[6] = day.is_overtime ? GREEN : null;
          rows.push([
            dateStr,
            "Present",
            day.checkin_time || "—",
            day.checkout_time || "—",
            formatHoursAsHoursMinutes(day.hours),
            day.is_late ? "Late" : "On Time",
            day.is_overtime ? "Yes" : "No",
          ]);
        } else {
          rowColors[1] = RED;
          rows.push([dateStr, "Absent", "—", "—", "—", "—", "—"]);
        }
        cellColors.push(rowColors);
      });

      this.drawTable(headers, rows, widths, { cellColors });
    }

    this.finalize();
  }

  generateWorkReport(
    data: any[],
    dateRange: string,
    filters: { project?: string; billable?: string }
  ) {
    this.drawReportHeader("Work Report", dateRange, filters);

    // Compute totals
    const totalHours = data.reduce((s, r) => s + r.total_hours, 0);
    const totalBillable = data.reduce((s, r) => s + r.billable_hours, 0);
    const totalNonBillable = data.reduce((s, r) => s + r.non_billable_hours, 0);
    const totalTasks = data.reduce((s, r) => s + r.tasks_completed, 0);
    const daysWorked = data.filter((r) => r.total_hours > 0).length;

    this.drawSectionTitle("Summary");
    this.drawStatGrid([
      { label: "Total Hours", value: formatHoursAsHoursMinutes(totalHours) },
      { label: "Billable Hours", value: formatHoursAsHoursMinutes(totalBillable), subtitle: `${totalHours > 0 ? ((totalBillable / totalHours) * 100).toFixed(0) : 0}% billable` },
      { label: "Non-Billable", value: formatHoursAsHoursMinutes(totalNonBillable) },
      { label: "Tasks Completed", value: String(totalTasks), subtitle: `Avg: ${daysWorked > 0 ? (totalTasks / daysWorked).toFixed(1) : 0}/day` },
      { label: "Days Worked", value: String(daysWorked), subtitle: `Avg: ${daysWorked > 0 ? formatHoursAsHoursMinutes(totalHours / daysWorked) : "0h"}/day` },
    ], 5);

    // Charts
    this.drawSectionTitle("Visual Overview");
    this.checkPageBreak(65);
    const wChartY = this.y;

    // Billable pie
    this.drawPieChart(
      [
        { label: "Billable", value: totalBillable, color: GREEN },
        { label: "Non-Billable", value: totalNonBillable, color: ORANGE },
      ].filter((d) => d.value > 0),
      "Billable Split",
      PAGE_MARGIN, wChartY, 22
    );

    // Daily hours bar chart
    const workingDays = data.filter((r) => r.total_hours > 0);
    if (workingDays.length > 0) {
      this.drawBarChart(
        workingDays.slice(-14).map((r) => ({
          label: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: r.total_hours,
        })),
        "Daily Work Hours",
        { x: PAGE_MARGIN + 80, y: wChartY, width: this.contentWidth - 80, height: 50 }
      );
    }
    this.y = wChartY + 58;

    // Tasks trend line chart
    if (workingDays.length > 1) {
      this.checkPageBreak(55);
      this.drawLineChart(
        workingDays.slice(-14).map((r) => ({
          label: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: r.tasks_completed,
        })),
        "Tasks Completed Trend",
        { x: PAGE_MARGIN, y: this.y, width: this.contentWidth, height: 45, lineColor: PURPLE, fillColor: [139, 92, 246] as [number, number, number] }
      );
      this.y += 55;
    }

    // Daily Table
    this.drawSectionTitle("Daily Breakdown");

    const headers = ["Date", "Total Hours", "Billable", "Non-Billable", "Tasks", "Top Project"];
    const widths = [32, 26, 26, 26, 20, 40];
    const rows: string[][] = [];

    [...data].reverse().forEach((report: any) => {
      const dateStr = new Date(report.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const topProject = report.projects?.length > 0 ? report.projects[0].project_name : "—";
      rows.push([
        dateStr,
        formatHoursAsHoursMinutes(report.total_hours),
        formatHoursAsHoursMinutes(report.billable_hours),
        formatHoursAsHoursMinutes(report.non_billable_hours),
        String(report.tasks_completed),
        topProject,
      ]);
    });

    this.drawTable(headers, rows, widths);

    this.finalize();
  }

  generateProjectReport(
    data: any,
    dateRange: string,
    filters: { project?: string; billable?: string }
  ) {
    this.drawReportHeader("Projects Report", dateRange, filters);

    const { projects, total_hours, total_billable_hours, total_projects } = data;

    this.drawSectionTitle("Summary");
    this.drawStatGrid([
      { label: "Total Projects", value: String(total_projects) },
      { label: "Total Hours", value: formatHoursAsHoursMinutes(total_hours) },
      { label: "Billable Hours", value: formatHoursAsHoursMinutes(total_billable_hours), subtitle: `${total_hours > 0 ? ((total_billable_hours / total_hours) * 100).toFixed(0) : 0}% billable` },
      { label: "Avg Per Project", value: formatHoursAsHoursMinutes(total_projects > 0 ? total_hours / total_projects : 0) },
    ]);

    // Charts
    if (projects.length > 0) {
      this.drawSectionTitle("Visual Overview");
      this.checkPageBreak(65);
      const pChartY = this.y;

      // Project distribution pie
      const pieColors: Array<[number, number, number]> = [
        [59, 130, 246], [239, 68, 68], [16, 185, 129], [245, 158, 11],
        [139, 92, 246], [6, 182, 212], [249, 115, 22], [236, 72, 153],
      ];
      this.drawPieChart(
        projects.slice(0, 8).map((p: any, i: number) => ({
          label: p.name,
          value: p.hours,
          color: pieColors[i % pieColors.length],
        })),
        "Time Distribution",
        PAGE_MARGIN, pChartY, 22
      );

      // Hours bar chart
      this.drawBarChart(
        projects.slice(0, 10).map((p: any, i: number) => ({
          label: p.name,
          value: p.hours,
          color: pieColors[i % pieColors.length],
        })),
        "Hours by Project",
        { x: PAGE_MARGIN + 80, y: pChartY, width: this.contentWidth - 80, height: 50 }
      );
      this.y = pChartY + 58;
    }

    // Project Details Table
    this.drawSectionTitle("Project Details");

    const headers = ["Project", "Total Hours", "Billable", "Entries", "Tasks", "Completed", "Share"];
    const widths = [38, 24, 24, 20, 20, 24, 20];
    const rows: string[][] = [];

    projects.forEach((p: any) => {
      const share = total_hours > 0 ? ((p.hours / total_hours) * 100).toFixed(1) + "%" : "0%";
      rows.push([
        p.name,
        formatHoursAsHoursMinutes(p.hours),
        formatHoursAsHoursMinutes(p.billable_hours),
        String(p.entry_count),
        String(p.task_count),
        String(p.completed_task_count),
        share,
      ]);
    });

    this.drawTable(headers, rows, widths);

    this.finalize();
  }

  generateTasksReport(
    data: any,
    dateRange: string,
    filters: { project?: string; billable?: string }
  ) {
    this.drawReportHeader("Tasks Report", dateRange, filters);

    this.drawSectionTitle("Summary");
    this.drawStatGrid([
      { label: "Total Tasks", value: String(data.total_tasks) },
      { label: "Completed", value: String(data.completed_tasks), subtitle: `${data.completion_rate.toFixed(0)}% rate` },
      { label: "Overdue", value: String(data.overdue_tasks) },
      { label: "Created (Range)", value: String(data.tasks_created_in_range) },
      { label: "Done (Range)", value: String(data.tasks_completed_in_range) },
    ], 5);

    // Charts
    this.drawSectionTitle("Visual Overview");
    this.checkPageBreak(65);
    const tChartY = this.y;

    // Completion pie
    this.drawPieChart(
      [
        { label: "Completed", value: data.completed_tasks, color: GREEN },
        { label: "Pending", value: data.total_tasks - data.completed_tasks, color: [226, 232, 240] as [number, number, number] },
        ...(data.overdue_tasks > 0 ? [{ label: "Overdue", value: data.overdue_tasks, color: RED }] : []),
      ].filter((d) => d.value > 0),
      "Completion Status",
      PAGE_MARGIN, tChartY, 22
    );

    // Priority bar chart
    if (data.tasks_by_priority?.length > 0) {
      const prioColors: Record<string, [number, number, number]> = { high: RED, medium: ORANGE, low: GREEN };
      this.drawBarChart(
        data.tasks_by_priority.map((p: any) => ({
          label: p.priority,
          value: p.count,
          color: prioColors[p.priority] || BRAND_COLOR,
        })),
        "By Priority",
        { x: PAGE_MARGIN + 80, y: tChartY, width: 45, height: 50 }
      );
    }

    // Velocity line chart
    if (data.weekly_velocity?.length > 1) {
      this.drawLineChart(
        data.weekly_velocity.map((w: any) => ({
          label: new Date(w.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: w.tasks_completed,
        })),
        "Weekly Velocity",
        { x: PAGE_MARGIN + 130, y: tChartY, width: this.contentWidth - 130, height: 50, lineColor: PURPLE, fillColor: [139, 92, 246] as [number, number, number] }
      );
    }
    this.y = tChartY + 58;

    // Priority Breakdown
    if (data.tasks_by_priority?.length > 0) {
      this.drawSectionTitle("Tasks by Priority");
      const headers = ["Priority", "Total", "Completed", "Pending", "Completion Rate"];
      const widths = [30, 30, 30, 30, 50];
      const rows = data.tasks_by_priority.map((p: any) => [
        p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
        String(p.count),
        String(p.completed),
        String(p.count - p.completed),
        p.count > 0 ? `${((p.completed / p.count) * 100).toFixed(0)}%` : "0%",
      ]);
      this.drawTable(headers, rows, widths);
    }

    // Column Distribution
    if (data.tasks_by_column_type?.length > 0) {
      this.drawSectionTitle("Tasks by Column");
      const headers = ["Column", "Type", "Count"];
      const widths = [60, 50, 60];
      const rows = data.tasks_by_column_type.map((c: any) => [
        c.column_name,
        c.column_type.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
        String(c.count),
      ]);
      this.drawTable(headers, rows, widths);
    }

    // Weekly Velocity
    if (data.weekly_velocity?.length > 0) {
      this.drawSectionTitle("Weekly Velocity");
      const headers = ["Week Starting", "Tasks Completed"];
      const widths = [85, 85];
      const rows = data.weekly_velocity.map((w: any) => [
        new Date(w.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        String(w.tasks_completed),
      ]);
      this.drawTable(headers, rows, widths);
    }

    // Projects Summary
    if (data.projects_summary?.length > 0) {
      this.drawSectionTitle("Tasks by Project");
      const headers = ["Project", "Total", "Completed", "Overdue", "Completion Rate"];
      const widths = [45, 25, 30, 25, 45];
      const rows = data.projects_summary.map((p: any) => [
        p.project_name,
        String(p.total_tasks),
        String(p.completed),
        String(p.overdue),
        p.total_tasks > 0 ? `${((p.completed / p.total_tasks) * 100).toFixed(0)}%` : "0%",
      ]);
      this.drawTable(headers, rows, widths);
    }

    this.finalize();
  }

  generateProductivityReport(
    data: any,
    dateRange: string,
    filters: { project?: string; billable?: string }
  ) {
    this.drawReportHeader("Productivity Report", dateRange, filters);

    this.drawSectionTitle("Summary");
    this.drawStatGrid([
      { label: "Total Entries", value: String(data.total_entries), subtitle: `${data.daily_avg_entries} avg/day` },
      { label: "Total Hours", value: formatHoursAsHoursMinutes(data.total_hours), subtitle: `${formatHoursAsHoursMinutes(data.daily_avg_hours)} avg/day` },
      { label: "Billable Ratio", value: `${data.billable_ratio.toFixed(0)}%`, subtitle: `${formatHoursAsHoursMinutes(data.billable_hours)} billable` },
      { label: "Avg Entry Duration", value: formatHoursAsHoursMinutes(data.avg_entry_duration), subtitle: `Longest: ${formatHoursAsHoursMinutes(data.longest_entry_hours)}` },
    ]);

    // Charts
    this.drawSectionTitle("Visual Overview");
    this.checkPageBreak(65);
    const prChartY = this.y;

    // Billable pie
    this.drawPieChart(
      [
        { label: "Billable", value: data.billable_hours, color: GREEN },
        { label: "Non-Billable", value: data.non_billable_hours, color: ORANGE },
      ].filter((d) => d.value > 0),
      "Billable Split",
      PAGE_MARGIN, prChartY, 22
    );

    // Category pie
    if (data.categories?.length > 0) {
      const catColors: Array<[number, number, number]> = [
        [59, 130, 246], [239, 68, 68], [16, 185, 129], [245, 158, 11],
        [139, 92, 246], [6, 182, 212], [249, 115, 22], [236, 72, 153],
      ];
      this.drawPieChart(
        data.categories.slice(0, 6).map((c: any, i: number) => ({
          label: c.category,
          value: c.hours,
          color: catColors[i % catColors.length],
        })),
        "By Category",
        PAGE_MARGIN + 75, prChartY, 22
      );
    }
    this.y = prChartY + 58;

    // Peak hours bar chart
    if (data.peak_hours?.length > 0) {
      this.checkPageBreak(55);
      const peakData = data.peak_hours.filter((p: any) => p.hours > 0);
      if (peakData.length > 0) {
        this.drawBarChart(
          peakData.map((p: any) => ({
            label: `${String(p.hour).padStart(2, "0")}:00`,
            value: p.hours,
            color: [99, 102, 241] as [number, number, number],
          })),
          "Peak Working Hours",
          { x: PAGE_MARGIN, y: this.y, width: this.contentWidth, height: 45 }
        );
        this.y += 55;
      }
    }

    // Time Breakdown
    this.drawSectionTitle("Time Breakdown");
    this.drawKeyValue("Billable Hours", formatHoursAsHoursMinutes(data.billable_hours));
    this.drawKeyValue("Non-Billable Hours", formatHoursAsHoursMinutes(data.non_billable_hours));
    this.drawKeyValue("Shortest Entry", formatHoursAsHoursMinutes(data.shortest_entry_hours));
    this.drawKeyValue("Longest Entry", formatHoursAsHoursMinutes(data.longest_entry_hours));
    this.addSpace(6);

    // Category Breakdown
    if (data.categories?.length > 0) {
      this.drawSectionTitle("Category Breakdown");
      const headers = ["Category", "Hours", "Entries", "Share"];
      const widths = [50, 40, 40, 40];
      const rows = data.categories.map((c: any) => [
        c.category,
        formatHoursAsHoursMinutes(c.hours),
        String(c.entry_count),
        `${c.percentage.toFixed(1)}%`,
      ]);
      this.drawTable(headers, rows, widths);
    }

    // Peak Hours
    if (data.peak_hours?.length > 0) {
      this.drawSectionTitle("Peak Working Hours");
      const headers = ["Hour", "Total Hours", "Entries"];
      const widths = [57, 57, 56];
      const rows = data.peak_hours
        .filter((p: any) => p.hours > 0)
        .map((p: any) => [
          `${String(p.hour).padStart(2, "0")}:00 - ${String(p.hour).padStart(2, "0")}:59`,
          formatHoursAsHoursMinutes(p.hours),
          String(p.entry_count),
        ]);
      this.drawTable(headers, rows, widths);
    }

    this.finalize();
  }

  // ── Finalize & Save ──────────────────────────────────────────────────────

  private finalize() {
    // Add footer to all pages
    const totalPages = this.pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(...TEXT_MUTED);
      this.pdf.text(
        `Page ${i} of ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: "center" }
      );
      this.pdf.text(this.brandName, PAGE_MARGIN, this.pageHeight - 10);
      this.pdf.text(
        `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        this.pageWidth - PAGE_MARGIN,
        this.pageHeight - 10,
        { align: "right" }
      );
    }
  }

  save(fileName: string) {
    this.pdf.save(fileName);
  }
}

// ── Export Function ──────────────────────────────────────────────────────────

export function generateReportPdf(
  reportType: string,
  data: any,
  options: {
    startDate: string;
    endDate: string;
    projectName?: string;
    billableLabel?: string;
    branding?: ReportBranding;
  }
) {
  const builder = new ReportPdfBuilder("portrait", options.branding);
  const dateRange = `${formatDateForPdf(options.startDate)} — ${formatDateForPdf(options.endDate)}`;
  const filters = {
    project: options.projectName || "All Projects",
    billable: options.billableLabel || "All",
  };

  const projectSlug = (options.projectName || "all-projects")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  switch (reportType) {
    case "attendance":
      builder.generateAttendanceReport(data, dateRange, filters);
      break;
    case "work":
      builder.generateWorkReport(data, dateRange, filters);
      break;
    case "projects":
      builder.generateProjectReport(data, dateRange, filters);
      break;
    case "tasks":
      builder.generateTasksReport(data, dateRange, filters);
      break;
    case "productivity":
      builder.generateProductivityReport(data, dateRange, filters);
      break;
    default:
      return;
  }

  builder.save(`${reportType}-report_${projectSlug}_${options.startDate}_${options.endDate}.pdf`);
}

function formatDateForPdf(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
