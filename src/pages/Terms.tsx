import React from 'react';
import { Shield, BookOpen, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-primary mb-4 tracking-tighter uppercase">Terms of Service</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-12">
          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <BookOpen className="text-primary" /> 1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Mukti Portal ("the Platform"), you agree to be bound by these Terms of Service. Mukti Portal provides a decentralized, community-verified trust network for informal sector workers and customers. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <Shield className="text-primary" /> 2. User Accounts & Responsibilities
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <CheckCircle2 className="text-success shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-bold text-foreground">Worker Accounts</h3>
                  <p className="text-muted-foreground leading-relaxed">Workers must provide accurate personal, skill, and location information. Falsifying identity or skills will result in immediate termination and a permanent ban from the Platform.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="text-success shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-bold text-foreground">Customer Accounts</h3>
                  <p className="text-muted-foreground leading-relaxed">Customers are responsible for providing a safe working environment and accurate job descriptions. You agree to leave fair, honest reviews based strictly on the work performed.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <FileText className="text-primary" /> 3. Worker Verification & Trust Scores
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Mukti Score is an algorithmic calculation based on:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Peer-to-peer job ratings and reviews.</li>
              <li>Verification history (OTP, Geo-location, and Photo matching).</li>
              <li>Consistency and volume of work over time.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 italic">
              Mukti Portal acts as an information aggregator and does not independently guarantee the quality or safety of any worker. The Trust Score is for informational and reputational purposes only.
            </p>
          </section>

          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <AlertCircle className="text-destructive" /> 4. Limitations of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Mukti Portal is a technology platform connecting independent workers with customers. We do not employ the workers. We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Any damages, injuries, or losses occurring during a job.</li>
              <li>Disputes regarding payment or quality of service.</li>
              <li>Inaccuracies in user-provided identity data, despite our verification efforts.</li>
            </ul>
          </section>

          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <BookOpen className="text-primary" /> 5. Modifications to the Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or discontinue the Platform at any time. We will provide notice of significant changes to these Terms via the Platform. Continued use of the Platform after such changes constitutes acceptance of the new Terms.
            </p>
          </section>
        </div>

        <div className="mt-16 text-center pb-12 border-t border-border/50 pt-8">
          <p className="text-muted-foreground font-bold">For any questions regarding these Terms, please contact support@muktiportal.in</p>
        </div>
      </div>
    </div>
  );
}
