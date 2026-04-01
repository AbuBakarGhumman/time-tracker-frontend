export interface ChartConfig {
  type: "line" | "bar" | "area" | "pie";
  title?: string;
  data: Record<string, any>[];
  xKey: string;
  yKeys: { key: string; color?: string; label?: string }[];
}

/**
 * Parse chart-data code blocks from markdown content.
 * Handles various newline formats and whitespace from streaming.
 */
export function parseChartBlocks(content: string): { text: string; charts: ChartConfig[] } {
  const charts: ChartConfig[] = [];
  const cleaned = content.replace(/```chart-data\s*([\s\S]*?)```/g, (_, rawJson) => {
    try {
      const jsonStr = rawJson.trim().replace(/\n/g, "");
      const config = JSON.parse(jsonStr);
      if (config.data && Array.isArray(config.data) && config.xKey && config.yKeys) {
        charts.push(config);
        return `\n<!--chart-${charts.length - 1}-->\n`;
      }
    } catch (e) {
      console.warn("Failed to parse chart-data block:", e);
    }
    return "";
  });
  return { text: cleaned, charts };
}
