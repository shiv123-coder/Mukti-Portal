import React from 'react';
import { ShieldCheck, MapPin, Database, Lock, Eye } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-primary mb-4 tracking-tighter uppercase">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Effective Date: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-12">
          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <Database className="text-primary" /> 1. Data Collection
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To provide our decentralized trust network, we collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Identity Information:</strong> Full name, phone number, and professional skills provided during registration.</li>
              <li><strong>Verification Data:</strong> Data used for the Trust Stack, including photo verification and timestamp records.</li>
              <li><strong>Usage Data:</strong> Application interactions, jobs accepted, reviews submitted, and search queries.</li>
            </ul>
          </section>

          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <MapPin className="text-primary" /> 2. Location Data
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Location access is a core component of the Mukti Portal verification process. We collect background and precise GPS location data during active jobs to verify "Geo-location matching" between customers and workers. This data is strictly used for calculating the fraud risk level and trust score. You can revoke location permissions at any time through your device settings, but doing so may severely impact your Trust Score and ability to accept jobs.
            </p>
          </section>

          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <Eye className="text-primary" /> 3. Data Usage and Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your data to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Facilitate connections between customers and workers.</li>
              <li>Calculate and maintain the dynamic Mukti Score.</li>
              <li>Generate the "Worker Trust & Verification Report" which is publicly accessible via your QR code or unique report URL.</li>
              <li>Detect and prevent fraud on the platform.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not sell your personal data to third-party marketers. Your public profile and aggregated work statistics are visible to prospective customers and anyone holding your Trust Report URL.
            </p>
          </section>

          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <Lock className="text-primary" /> 4. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement robust security measures to protect your personal information, including Firebase Authentication, secure server endpoints, and structured Firestore security rules. However, no digital platform can guarantee 100% security. You are responsible for keeping your login credentials confidential.
            </p>
          </section>

          <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
            <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3 tracking-tight">
              <ShieldCheck className="text-primary" /> 5. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to request access to, correction of, or deletion of your personal data. Please note that deleting your account will permanently erase your verified work history and Mukti Score, and this action cannot be undone. To exercise these rights, please contact our support team.
            </p>
          </section>
        </div>

        <div className="mt-16 text-center pb-12 border-t border-border/50 pt-8">
          <p className="text-muted-foreground font-bold">For privacy concerns, contact privacy@muktiportal.in</p>
        </div>
      </div>
    </div>
  );
}
