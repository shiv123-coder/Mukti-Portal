import PDFDocument from 'pdfkit';
import { Response } from 'express';
import crypto from 'crypto';

export interface ReportData {
  workerId: string;
  workerName: string;
  phone: string;
  skill: string;
  location: string;
  muktiScore: number;
  confidence: string;
  totalJobs: number;
  activeMonths: number;
  avgRating: number;
  incomeMin: number;
  incomeMax: number;
  safeEMI: number;
  loanMin: number;
  loanMax: number;
  isVerified: boolean;
  repeatCustomers?: number;
  fraudRisk?: string;
  recentJobs?: any[];
  rid: string;
}

export const generatePdfReport = (data: ReportData, res: Response) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe the PDF directly to the response
  doc.pipe(res);

  // Colors
  const colors = {
    primary: '#0B3D91',
    secondary: '#F97316',
    textDark: '#0F172A',
    textMuted: '#64748B',
    success: '#059669',
    danger: '#DC2626',
    warning: '#CA8A04'
  };

  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // --- HEADER ---
  doc.rect(0, 0, doc.page.width, 80).fill(colors.primary);
  doc.rect(0, 80, doc.page.width, 5).fill(colors.secondary);

  doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('Mukti Portal', 50, 30);
  doc.fontSize(10).font('Helvetica').text('Worker Trust & Verification Report', 50, 60);

  doc.fontSize(10).text(`Report ID: ${data.rid}`, doc.page.width - 200, 30, { align: 'right' });
  doc.text(`Generated: ${dateStr} ${timeStr}`, doc.page.width - 200, 45, { align: 'right' });

  let y = 110;

  // --- PROFILE SECTION ---
  doc.fillColor(colors.textDark).fontSize(16).font('Helvetica-Bold').text('1. Worker Profile', 50, y);
  y += 25;
  doc.fontSize(12).font('Helvetica').text(`Name: ${data.workerName || 'N/A'}`);
  y += 20;
  const maskedPhone = data.phone ? `**** **** ${data.phone.slice(-4)}` : 'N/A';
  doc.text(`Phone (Masked): ${maskedPhone}`, 50, y);
  doc.text(`Skill: ${data.skill || 'General'}`, 300, y);
  y += 20;
  doc.text(`Location: ${data.location || 'N/A'}`, 50, y);
  
  if (data.isVerified) {
    doc.fillColor(colors.success).font('Helvetica-Bold').text('STATUS: VERIFIED', 300, y);
  }

  y += 40;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).lineWidth(1).strokeColor('#E2E8F0').stroke();
  y += 20;

  // --- TRUST SCORE SECTION ---
  doc.fillColor(colors.textDark).fontSize(16).font('Helvetica-Bold').text('2. Trust & Confidence', 50, y);
  y += 30;

  doc.fontSize(10).fillColor(colors.textMuted).text('MUKTI TRUST SCORE', 50, y);
  doc.fontSize(10).text('BANK CONFIDENCE', 250, y);
  doc.fontSize(10).text('FRAUD RISK', 420, y);
  
  y += 15;
  const scoreColor = data.muktiScore >= 70 ? colors.success : data.muktiScore >= 40 ? colors.warning : colors.danger;
  doc.fontSize(24).fillColor(scoreColor).text(`${Math.round(data.muktiScore)}/100`, 50, y);
  
  const confColor = data.confidence === 'HIGH' ? colors.success : data.confidence === 'MEDIUM' ? colors.warning : colors.danger;
  doc.fillColor(confColor).text(data.confidence, 250, y);

  const fraudColor = data.fraudRisk === 'LOW' ? colors.success : data.fraudRisk === 'MEDIUM' ? colors.warning : colors.danger;
  doc.fillColor(fraudColor).text(data.fraudRisk || 'LOW', 420, y);

  y += 40;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  y += 20;

  // --- WORK STATS SECTION ---
  doc.fillColor(colors.textDark).fontSize(16).font('Helvetica-Bold').text('3. Work Statistics', 50, y);
  y += 30;

  doc.fontSize(10).fillColor(colors.textMuted).text('TOTAL JOBS', 50, y);
  doc.fontSize(10).text('AVG RATING', 200, y);
  doc.fontSize(10).text('ACTIVE MONTHS', 350, y);
  
  y += 15;
  doc.fontSize(18).fillColor(colors.textDark).font('Helvetica-Bold').text(`${data.totalJobs}`, 50, y);
  doc.fillColor(colors.warning).text(`${data.avgRating.toFixed(1)}/5.0`, 200, y);
  doc.fillColor(colors.textDark).text(`${data.activeMonths}`, 350, y);

  y += 40;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  y += 20;

  // --- FINANCIAL PROFILE SECTION ---
  doc.fillColor(colors.textDark).fontSize(16).font('Helvetica-Bold').text('4. Financial Profile (Estimates)', 50, y);
  y += 30;

  doc.fontSize(10).fillColor(colors.textMuted).text('VERIFIED MONTHLY INCOME RANGE', 50, y);
  doc.fontSize(10).text('CREDIT READY (SAFE EMI)', 350, y);
  
  y += 15;
  doc.fontSize(16).fillColor(colors.textDark).font('Helvetica-Bold').text(`INR ${data.incomeMin.toLocaleString()} - ${data.incomeMax.toLocaleString()}`, 50, y);
  doc.fillColor(colors.success).text(`INR ${data.safeEMI.toLocaleString()}/mo`, 350, y);

  y += 40;
  
  // --- JOB HISTORY ---
  doc.addPage();
  doc.fillColor(colors.textDark).fontSize(16).font('Helvetica-Bold').text('5. Verified Work History (Recent)', 50, 50);
  
  let histY = 90;
  doc.fontSize(10).fillColor(colors.primary).text('DATE', 50, histY);
  doc.text('CATEGORY', 150, histY);
  doc.text('RATING', 300, histY);
  doc.text('STATUS', 450, histY);
  
  histY += 15;
  doc.moveTo(50, histY).lineTo(doc.page.width - 50, histY).strokeColor(colors.primary).lineWidth(2).stroke();
  histY += 15;

  if (data.recentJobs && data.recentJobs.length > 0) {
    data.recentJobs.slice(0, 15).forEach(job => {
      doc.fontSize(10).fillColor(colors.textDark).font('Helvetica');
      doc.text(job.date || 'N/A', 50, histY);
      doc.text(job.category || 'Service', 150, histY);
      
      const r = Math.round(job.rating || 0);
      let stars = '';
      for (let i = 0; i < 5; i++) stars += i < r ? '★' : '☆';
      doc.fillColor(colors.warning).text(stars, 300, histY);
      
      doc.fillColor(colors.success).font('Helvetica-Bold').text('VERIFIED', 450, histY);
      
      histY += 20;
      doc.moveTo(50, histY).lineTo(doc.page.width - 50, histY).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
      histY += 15;
    });
  } else {
    doc.fillColor(colors.textMuted).font('Helvetica-Oblique').text('No verified jobs found.', 50, histY);
  }

  // --- FOOTER ---
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(colors.textMuted).font('Helvetica');
    doc.text(
      `Mukti Portal Digital Trust Report | Confidental | Page ${i + 1} of ${pages.count}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }

  doc.end();
};
