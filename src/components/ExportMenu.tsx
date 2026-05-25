import React, { useState } from "react";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export interface ExportColumn<T = any> {
  header: string;
  key: string | ((row: T) => string | number);
}

interface ExportMenuProps<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title?: string;
  subtitle?: string;
}

export function ExportMenu<T>({ data, columns, filename, title, subtitle }: ExportMenuProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (data.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    setIsExporting(true);
    try {
      // Use setTimeout to allow UI to update to loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
      const rows = data.map(row => {
        return columns.map(col => {
          let val = typeof col.key === 'function' ? col.key(row) : (row as any)[col.key];
          if (val === null || val === undefined) val = '';
          const strVal = String(val).replace(/"/g, '""');
          return `"${strVal}"`;
        }).join(',');
      });
      
      // UTF-8 BOM for Excel compatibility
      const BOM = "\uFEFF";
      const csvContent = BOM + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeFilename = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', safeFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exported successfully");
    } catch (err) {
      console.error("CSV Export Error:", err);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Use setTimeout to allow UI to update to loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      const orientation = columns.length > 5 ? 'landscape' : 'portrait';
      const doc = new jsPDF(orientation);
      
      const displayTitle = title || filename;
      const displaySubtitle = subtitle || `Generated on ${new Date().toLocaleString()}`;
      
      // -- HEADER BRANDING --
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("MUKTI PORTAL", 14, 15);
      
      // -- TITLE SECTION --
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(displayTitle, 14, 40);
      
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(displaySubtitle, 14, 47);

      // -- EMPTY STATE HANDLING --
      if (data.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text("No data available for the selected criteria.", 14, 65);
        doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Empty PDF report generated");
        return;
      }

      // -- TABLE RENDERING --
      const tableCols = columns.map(c => c.header);
      const tableRows = data.map(row => {
        return columns.map(col => {
          let val = typeof col.key === 'function' ? col.key(row) : (row as any)[col.key];
          return val === null || val === undefined ? '' : String(val);
        });
      });

      autoTable(doc, {
        head: [tableCols],
        body: tableRows,
        startY: 55,
        theme: 'grid',
        styles: { 
          fontSize: 8, 
          cellPadding: 4,
          font: 'helvetica',
          textColor: [51, 65, 85], // slate-700
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [248, 250, 252], // slate-50
          textColor: [15, 23, 42], // slate-900
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [203, 213, 225] // slate-300
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        didDrawPage: (data) => {
          // -- FOOTER --
          const pageCount = doc.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(
            `Page ${data.pageNumber} • Mukti Portal Enterprise Report`,
            data.settings.margin.left,
            pageHeight - 10
          );
        }
      });

      const safeFilename = `${filename}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(safeFilename);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isExporting}>
        <button className="h-12 px-6 rounded-xl bg-primary border border-primary/20 flex items-center gap-3 text-[10px] font-black text-primary-foreground uppercase tracking-widest hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg shadow-primary-glow disabled:opacity-50 disabled:cursor-not-allowed">
          {isExporting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Download size={16} /> Export
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-1">
        <DropdownMenuItem 
          onClick={handleExportCSV}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80 cursor-pointer focus:bg-secondary rounded-lg outline-none transition-colors disabled:opacity-50"
        >
          <Table size={16} className="text-primary" /> Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80 cursor-pointer focus:bg-secondary rounded-lg outline-none transition-colors disabled:opacity-50"
        >
          <FileText size={16} className="text-rose-500" /> Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
