import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteHeader } from '../quote/models/quote.model';
import { AuthService } from '../../app/auth.service';

@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor(private auth: AuthService) {}

  private formatCurrency(amount: number, currency: string): string {
    try {
      const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      const symbol = currency === 'INR' ? 'Rs.' : currency;
      return `${symbol} ${formatted}`;
    } catch {
      return `INR ${amount.toFixed(2)}`;
    }
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // ── Core builder — shared by preview and download ──────────────────────────
  private buildDoc(quote: QuoteHeader): jsPDF {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const currency = quote.currency || 'INR';
    const margin = 14;

    const dateStr = quote.quoteDate
      ? new Date(quote.quoteDate).toLocaleDateString('en-GB', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        })
      : '—';

    // ── Top-left: Offer To ───────────────────────────────
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Offer To', margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(quote.customerName || '—', margin, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    let offerY = 30;

    if (quote.customerEmail) {
      doc.text(quote.customerEmail, margin, offerY);
      offerY += 5;
    }

    const addressParts = [
      quote.customerAddress1,
      quote.customerAddress2,
      quote.customerCity,
      quote.customerState,
      quote.customerCountry,
    ].filter(Boolean);

    addressParts.forEach(line => {
      doc.text(line!, margin, offerY);
      offerY += 5;
    });

    // ── Top-left: Bill To (below Offer To) ───────────────
    const billToStartY = offerY + 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Bill To', margin, billToStartY);

    // ── Order Date (same line as Bill To, right-aligned) ─
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Order Date :', pageW - 60, billToStartY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(dateStr, pageW - margin, billToStartY, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(quote.customerName || '—', margin, billToStartY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    let customerY = billToStartY + 12;

    if (quote.customerEmail) {
      doc.text(quote.customerEmail, margin, customerY);
      customerY += 5;
    }

    addressParts.forEach(line => {
      doc.text(line!, margin, customerY);
      customerY += 5;
    });

    // ── Top-right: QUOTE title + meta ───────────────────
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('QUOTE', pageW - margin, 18, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(`Quote# ${quote.quoteRef || '—'}`, pageW - margin, 25, { align: 'right' });

    // ── Items Table ──────────────────────────────────────
    const tableStartY = Math.max(customerY + 6, 48);

    const rows = (quote.quoteDetails || []).map((item, i) => [
      String(i + 1),
      item.itemDesc || '',
      this.formatNumber(Number(item.itemQuantity || 0)),
      this.formatNumber(Number(item.itemUnitRate || 0)),
      this.formatNumber(Number(item.itemValue || 0)),
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Item & Description', 'Qty', 'Rate', 'Amount']],
      body: rows,
      theme: 'plain',
      headStyles: {
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      rowPageBreak: 'auto',
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const d = data.doc;
          d.setDrawColor(220, 220, 220);
          d.setLineWidth(0.3);
          d.line(
            data.cell.x, data.cell.y + data.cell.height,
            data.cell.x + data.cell.width, data.cell.y + data.cell.height
          );
        }
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
    });

    const tableEndY: number = (doc as any).lastAutoTable.finalY;

    // ── Totals ────────────────────────────────────────────
    const totalsX = pageW - margin - 80;
    const totalsY = tableEndY + 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text('Sub Total', totalsX, totalsY);
    doc.text(this.formatNumber(Number(quote.totalValue || 0)), pageW - margin, totalsY, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(totalsX, totalsY + 3, pageW - margin, totalsY + 3);

    const totalY = totalsY + 9;
    doc.setFillColor(245, 245, 245);
    doc.rect(totalsX - 2, totalY - 5, pageW - margin - totalsX + 2, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Total', totalsX, totalY);
    doc.text(this.formatCurrency(Number(quote.totalValue || 0), currency), pageW - margin, totalY, { align: 'right' });

    // ── Signature (immediately after totals) ─────────────
    const sigY = totalY + 16;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    // Text first so baseline aligns with line
    doc.text('Approved By :', margin, sigY);
    // Line starts after the text, on the same 
    const sigTextWidth = doc.getTextWidth('Authorized Signature :');
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(margin + sigTextWidth + 3, sigY, margin + sigTextWidth + 50, sigY);

    // ── Terms & Conditions (below signature) ─────────────
    if (quote.termsConditions?.trim()) {
      const tcY = sigY + 16;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Terms & Conditions', margin, tcY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(quote.termsConditions, pageW - margin * 2);
      doc.text(lines, margin, tcY + 6);
    }

    return doc;
  }

  // ── Returns a blob URL for previewing in an iframe ─────────────────────────
  getPreviewUrl(quote: QuoteHeader): string {
    return this.buildDoc(quote).output('bloburl') as unknown as string;
  }

  // ── Triggers the actual file download ─────────────────────────────────────
  generateQuotePdf(quote: QuoteHeader): void {
    this.buildDoc(quote).save(`${quote.quoteRef}.pdf`);
  }
}