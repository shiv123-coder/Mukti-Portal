import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { z } from 'zod';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import { verifyToken, requireAdmin, AuthRequest } from './middleware/auth';
import { globalErrorHandler } from './middleware/errorHandler';
import { logAdminNotification } from './utils/logger';
import { generatePdfReport, ReportData } from './utils/pdfGenerator';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8080').split(',').map(o => o.trim());

app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests, please try again later.' })
});

app.use('/api/', apiLimiter);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
app.use(express.json());

import fs from 'fs';
import path from 'path';

const LOCAL_REQUESTS_PATH = path.join(__dirname, '../data/requests.json');
const LOCAL_USERS_PATH = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'));
}

// Helper for local storage
const saveLocalRequest = (data: any) => {
  let requests = [];
  if (fs.existsSync(LOCAL_REQUESTS_PATH)) {
    requests = JSON.parse(fs.readFileSync(LOCAL_REQUESTS_PATH, 'utf-8'));
  }
  const newReq = { ...data, id: `local-${Date.now()}` };
  requests.push(newReq);
  fs.writeFileSync(LOCAL_REQUESTS_PATH, JSON.stringify(requests, null, 2));
  return newReq;
};

const getLocalRequests = () => {
  if (fs.existsSync(LOCAL_REQUESTS_PATH)) {
    return JSON.parse(fs.readFileSync(LOCAL_REQUESTS_PATH, 'utf-8'));
  }
  return [];
};

const updateLocalRequest = (requestId: string, action: string) => {
  if (fs.existsSync(LOCAL_REQUESTS_PATH)) {
    let requests = JSON.parse(fs.readFileSync(LOCAL_REQUESTS_PATH, 'utf-8'));
    requests = requests.map((r: any) => 
      r.id === requestId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
    );
    fs.writeFileSync(LOCAL_REQUESTS_PATH, JSON.stringify(requests, null, 2));
  }
};

const saveLocalUser = (userData: any) => {
  let users = [];
  if (fs.existsSync(LOCAL_USERS_PATH)) {
    users = JSON.parse(fs.readFileSync(LOCAL_USERS_PATH, 'utf-8'));
  }
  // Update if exists, otherwise add
  const idx = users.findIndex((u: any) => u.id === userData.id);
  if (idx > -1) {
    users[idx] = { ...users[idx], ...userData };
  } else {
    users.push(userData);
  }
  fs.writeFileSync(LOCAL_USERS_PATH, JSON.stringify(users, null, 2));
};

const getLocalUsers = () => {
  if (fs.existsSync(LOCAL_USERS_PATH)) {
    return JSON.parse(fs.readFileSync(LOCAL_USERS_PATH, 'utf-8'));
  }
  return [];
};

// Initialize Firebase Admin with absolute safety for local development
let db: admin.firestore.Firestore | null = null;
let isFirebaseEnabled = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let certPayload: any = null;

  if (credentialsJson) {
    try {
      certPayload = JSON.parse(credentialsJson);
    } catch (e) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
    }
  } else if (credentialsPath && fs.existsSync(credentialsPath)) {
    certPayload = credentialsPath;
  }

  if (projectId && certPayload) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(certPayload),
          projectId: projectId
        });
      }
      db = admin.firestore();
      isFirebaseEnabled = true;
      console.log('✅ Firebase Admin Initialized with Service Account');
    } catch (apiErr: any) {
      console.error('❌ Failed to initialize Firebase with credentials:', apiErr.message);
    }
  } else {
    console.warn('⚠️ Service Account missing or invalid. Backend running in LOCAL-MOCK mode.');
    console.log('   (To enable Firebase in production, set FIREBASE_SERVICE_ACCOUNT_JSON to your stringified JSON key)');
  }
} catch (err: any) {
  console.error('💥 Critical Boot Error:', err.message);
}

// --- SCHEMAS ---
const VerificationSchema = z.object({
  workerId: z.string(),
  jobId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  rating: z.number().min(1).max(5),
  review: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  deviceId: z.string(),
});

const RegisterSchema = z.object({
  id: z.string(),
  phone: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['worker', 'customer', 'admin']),
  skill: z.string().optional(),
  location: z.string().optional(),
  photo: z.string().optional(),
  workerType: z.number().optional(),
  declaredIncome: z.number().optional(),
});

// --- ROUTES ---

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Welcome to Mukti Portal API Service. The API is running.' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mukti Portal API' });
});

/**
 * Google Auth Verification Proxy
 */
app.post('/api/auth/google', async (req, res) => {
  const { accessToken, selectedRole } = req.body;
  if (!accessToken) return res.status(400).json({ error: "Missing access token" });

  try {
    const googleRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const googleUser = googleRes.data;
    const googleId = googleUser.sub;
    const email = googleUser.email;

    if (!db) return res.status(503).json({ error: "Database not connected" });
    
    let userDocData: any = null;
    let userId: string | null = null;

    const exactDoc = await db.collection('users').doc(googleId).get();
    if (exactDoc.exists) {
      userDocData = exactDoc.data();
      userId = googleId;
    } else {
      const qGoogleId = await db.collection('users').where('googleId', '==', googleId).get();
      if (!qGoogleId.empty) {
        userDocData = qGoogleId.docs[0].data();
        userId = qGoogleId.docs[0].id;
      } else {
        const qEmail = await db.collection('users').where('email', '==', email).get();
        if (!qEmail.empty) {
          userDocData = qEmail.docs[0].data();
          userId = qEmail.docs[0].id;
          await db.collection('users').doc(userId).update({ googleId });
        }
      }
    }

    const adminPhone = process.env.VITE_ADMIN_PHONE || '9370717823';
    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'shivashankrmali7@gmail.com';
    const isAdmin = email === adminEmail || userDocData?.phone === adminPhone || userDocData?.role === 'admin';

    if (isAdmin) {
      if (!userDocData || !userId) {
        userId = googleId;
        userDocData = {
          id: userId,
          role: 'admin',
          email: email,
          name: googleUser.name || 'Admin',
          googleId: googleId,
          otpVerified: true,
          isProfileComplete: true,
          status: 'verified',
          isVerifiedByAdmin: true
        };
        await db.collection('users').doc(userId as string).set(userDocData);
      } else if (userDocData.role !== 'admin') {
        await db.collection('users').doc(userId as string).update({ role: 'admin' });
        userDocData.role = 'admin';
      }
    } else {
      if (!userDocData || !userId) {
        return res.json({
          exists: false,
          onboardingRequired: true,
          googleData: {
            googleId,
            email,
            name: googleUser.name,
            picture: googleUser.picture
          }
        });
      }

      if (selectedRole && userDocData.role !== selectedRole && userDocData.role !== 'both') {
        // Upgrade account to 'both' seamlessly
        await db.collection('users').doc(userId as string).update({ role: 'both' });
        userDocData.role = 'both';
      }
    }

    const customToken = await admin.auth().createCustomToken(userId as string);

    res.json({
      exists: true,
      customToken,
      role: userDocData.role,
      user: { ...userDocData, id: userId, role: userDocData.role }
    });
  } catch (err: any) {
    console.error('Google Auth Error:', err.message);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
});

/**
 * Register Worker / User
 */
app.post('/api/worker/register', verifyToken, async (req: AuthRequest, res) => {
  const database = db;
  if (!database) return res.status(503).json({ error: "Backend database not initialized" });
  try {
    const data = RegisterSchema.parse(req.body);
    const userRef = database.collection('users').doc(data.id);
    
    const newUser = {
      ...data,
      otpVerified: true,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      muktiScore: 0,
      status: data.role === 'worker' ? 'pending' : undefined,
      isVerifiedByAdmin: data.role === 'worker' ? false : (data.role === 'admin' ? true : undefined),
    };

    await userRef.set(newUser);
    saveLocalUser(newUser);

    // Log Notification
    await logAdminNotification({
      title: `New ${data.role} Registration`,
      description: `${data.name} has registered as a ${data.role}.`,
      type: 'Users',
      priority: 'info',
      userId: data.id,
      userRole: data.role
    });

    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.get('/api/admin/users', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const allUsers = [...getLocalUsers()];

    if (db) {
      const firebaseFetch = db.collection('users')
        .get()
        .then(snapshot => {
          snapshot.docs.forEach(doc => {
            if (!allUsers.find(u => u.id === doc.id)) {
              allUsers.push({ id: doc.id, ...doc.data() });
            }
          });
        })
        .catch(err => console.warn('Firestore users fetch failed:', err.message));

      await Promise.race([
        firebaseFetch,
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    }
    
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Submit Verification
 * 1. Validate Input
 * 2. Call ML Service for Fraud Detection
 * 3. Call ML Service for NLP Analysis
 * 4. Store in Firestore
 */
app.post('/api/verify', verifyToken, async (req: AuthRequest, res) => {
  const database = db;
  if (!database) return res.status(503).json({ error: "Backend database not initialized" });
  try {
    const data = VerificationSchema.parse(req.body);
    
    // 1. Fraud Detection
    const fraudResponse = await axios.post(`${ML_SERVICE_URL}/fraud-detect`, {
      worker_id: data.workerId,
      customer_id: data.customerId,
      device_id: data.deviceId,
      location: data.location,
      timestamp: new Date().toISOString(),
    });
    
    const { risk_score, fraud_risk } = fraudResponse.data;

    // 2. NLP Analysis
    const nlpResponse = await axios.post(`${ML_SERVICE_URL}/nlp-analyze`, {
      text: data.review
    });

    const { sentiment, sentiment_label, extracted_skills, review_quality } = nlpResponse.data;

    // 3. Store in Firestore
    const verificationDoc = {
      ...data,
      fraudRisk: fraud_risk,
      riskScore: risk_score,
      sentiment: sentiment_label,
      sentimentScore: sentiment,
      skills: extracted_skills,
      qualityScore: review_quality,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await database.collection('verifications').add(verificationDoc);

    // 4. Advanced Worker Scoring Logic
    const workerRef = database.collection('users').doc(data.workerId);
    
    // Fetch all past verifications for this worker to recalculate score
    const allVerifsSnapshot = await database.collection('verifications')
      .where('workerId', '==', data.workerId)
      .get();
      
    const allVerifs = allVerifsSnapshot.docs.map(d => d.data());
    
    const count = allVerifs.length;
    const avgRating = count > 0 ? allVerifs.reduce((acc, v) => acc + (v.rating || 0), 0) / count : 0;
    const fraudPenalty = allVerifs.filter(v => v.fraudRisk === 'HIGH').length * 15;
    
    let score = 50; // Base identity score
    
    // Rating bonus/penalty
    if (count > 0) {
      if (avgRating >= 4.0) score += (avgRating - 3) * 10; // Max +20
      else if (avgRating < 3.0) score -= (3 - avgRating) * 10; // Penalty for bad rating
    }
    
    // Verification volume bonus (Max +20)
    score += Math.min(count * 2, 20);
    
    // Fraud penalty
    score -= fraudPenalty;
    
    // Bound score
    score = Math.max(0, Math.min(100, Math.round(score)));

    const scoreBreakdown = {
      baseScore: 50,
      ratingBonus: count > 0 && avgRating >= 4.0 ? Math.round((avgRating - 3) * 10) : 0,
      volumeBonus: Math.min(count * 2, 20),
      fraudPenalty,
      finalScore: score
    };

    await workerRef.update({
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      verificationsCount: count,
      muktiScore: score,
      scoreBreakdown
    });

    res.json({
      success: true,
      id: docRef.id,
      analysis: {
        fraud_risk,
        sentiment: sentiment_label,
        skills: extracted_skills
      },
      updatedScore: score,
      scoreBreakdown
    });

  } catch (err: any) {
    console.error('Verification Error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Get Worker Dashboard Data
 */
app.get('/api/worker/:id/dashboard', verifyToken, async (req: AuthRequest, res) => {
  const cacheKey = `dashboard_${req.params.id}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }
  const database = db;
  if (!database) return res.status(503).json({ error: "Backend database not initialized" });
  try {
    const workerId = req.params.id;
    const workerDoc = await database.collection('users').doc(workerId).get();
    const verificationsSnapshot = await database.collection('verifications')
      .where('workerId', '==', workerId)
      .get();

    const worker = workerDoc.exists ? workerDoc.data() : null;
    const verifications = verificationsSnapshot.docs.map(doc => doc.data());
    
    // --- 1. WORK SUMMARY ---
    const totalJobs = verifications.length;
    const activeMonths = new Set(verifications.map(v => {
      let date: Date;
      if (v.timestamp?.toDate) {
        date = v.timestamp.toDate();
      } else if (v.timestamp) {
        date = new Date(v.timestamp);
      } else {
        return "unknown"; // Handle missing timestamp
      }
      
      if (isNaN(date.getTime())) return "unknown";
      return `${date.getMonth()}-${date.getFullYear()}`;
    })).size || (totalJobs > 0 ? 1 : 0);
    
    const customerIds = verifications.map(v => v.customerId);
    const repeatCustomers = customerIds.filter((id, index) => customerIds.indexOf(id) !== index).length;

    // --- 2. PERFORMANCE INSIGHTS ---
    const avgRating = totalJobs > 0 
      ? verifications.reduce((acc, v) => acc + (v.rating || 0), 0) / totalJobs 
      : 0;
    
    // Extract top skills from NLP data in verifications
    const skillCounts: Record<string, number> = {};
    verifications.forEach(v => {
      (v.skills || []).forEach((s: string) => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill]) => skill);

    // --- 3. FINANCIAL PROFILE (INCOME ESTIMATION) ---
    let baseRate = 500; // Default
    const skillLower = (worker?.skill || "").toLowerCase();
    if (skillLower.includes('maid')) baseRate = 300;
    else if (skillLower.includes('plumber')) baseRate = 600;
    else if (skillLower.includes('electrician')) baseRate = 800;

    let adjustments = 0;
    if (avgRating > 4.5) adjustments += 50;
    if (worker?.location?.toLowerCase().includes('city') || worker?.location?.toLowerCase().includes('delhi') || worker?.location?.toLowerCase().includes('mumbai')) {
      adjustments += 100;
    }

    const perJobIncome = baseRate + adjustments;
    // For a more realistic estimate, we might want jobs per month
    const avgJobsPerMonth = activeMonths > 0 ? totalJobs / activeMonths : totalJobs;
    const realisticMonthlyIncome = avgJobsPerMonth * perJobIncome;

    // --- 4. CONFIDENCE SCORE ---
    let confidencePoints = 0;
    if (totalJobs > 10) confidencePoints += 30;
    if (activeMonths > 3) confidencePoints += 30;
    if (avgRating > 4.0) confidencePoints += 20;
    
    let confidence = "LOW";
    if (confidencePoints > 70) confidence = "HIGH";
    else if (confidencePoints > 40) confidence = "MEDIUM";

    // --- 5. LOAN ELIGIBILITY ---
    const safeEMI = realisticMonthlyIncome * 0.35;
    const minLoan = safeEMI * 12;
    const maxLoan = safeEMI * 18;

    // --- 6. TRUST & FRAUD ---
    const fraudRisk = verifications.some(v => v.fraudRisk === 'HIGH') ? 'HIGH' : (verifications.some(v => v.fraudRisk === 'MEDIUM') ? 'MEDIUM' : 'LOW');
    const muktiScore = Math.min(100, Math.max(0, (avgRating * 20) + (confidencePoints * 0.2)));

    const riskIndicators = [];
    if (verifications.some(v => v.riskScore > 0.7)) riskIndicators.push("Location inconsistency");
    if (totalJobs > 50 && activeMonths < 2) riskIndicators.push("High review frequency");

    const responseData = {
      summary: { totalJobs, activeMonths, repeatCustomers },
      performance: { avgRating: Number(avgRating.toFixed(2)), topSkills, issues: [] },
      financial: {
        incomeRange: { 
          min: Math.floor(realisticMonthlyIncome * 0.8) || 0, 
          max: Math.ceil(realisticMonthlyIncome * 1.2) || 0 
        },
        perJobIncome
      },
      confidence,
      loan: {
        safeEMI: Math.floor(safeEMI) || 0,
        range: { min: Math.floor(minLoan) || 0, max: Math.ceil(maxLoan) || 0 }
      },
      trust: {
        muktiScore: Number(muktiScore.toFixed(2)),
        fraudRisk,
        riskIndicators
      }
    };
    cache.set(cacheKey, responseData);
    res.json(responseData);

  } catch (err: any) {
    console.error(`Dashboard API Error [Worker: ${req.params.id}]:`, err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data', message: err.message });
  }
});

/**
 * Generate PDF Report (Credit-Ready)
 */
app.get('/api/worker/:id/report', verifyToken, async (req: AuthRequest, res) => {
  const database = db;
  if (!database) return res.status(503).json({ error: "Backend database not initialized" });
  try {
    const workerId = req.params.id;
    const workerDoc = await database.collection('users').doc(workerId).get();
    const verificationsSnapshot = await database.collection('verifications')
      .where('workerId', '==', workerId)
      .orderBy('timestamp', 'desc')
      .get();

    const worker = workerDoc.data();
    const verifications = verificationsSnapshot.docs.map(doc => doc.data());

    // Calculate metrics
    const totalJobs = verifications.length;
    const avgRating = totalJobs > 0 ? verifications.reduce((acc, v) => acc + (v.rating || 0), 0) / totalJobs : 0;
    const activeMonths = new Set(verifications.map(v => {
      const date = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp);
      return `${date.getMonth()}-${date.getFullYear()}`;
    })).size || (totalJobs > 0 ? 1 : 0);

    const muktiScore = worker?.muktiScore || (totalJobs > 0 ? 60 + (avgRating * 5) : 50);
    const confidence = muktiScore >= 70 ? 'HIGH' : muktiScore >= 40 ? 'MEDIUM' : 'LOW';
    const fraudRisk = verifications.some(v => v.fraudRisk === 'HIGH') ? 'HIGH' : 'LOW';

    let baseRate = 500;
    const skillLower = (worker?.skill || "").toLowerCase();
    if (skillLower.includes('maid')) baseRate = 300;
    else if (skillLower.includes('plumber')) baseRate = 600;
    else if (skillLower.includes('electrician')) baseRate = 800;

    const realisticMonthlyIncome = totalJobs > 0 ? (totalJobs / activeMonths) * baseRate : 0;
    const safeEMI = realisticMonthlyIncome * 0.35;
    
    const rid = `MKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const reportData: ReportData = {
      workerId,
      workerName: worker?.name || 'Unknown',
      phone: worker?.phone || '',
      skill: worker?.skill || 'General Worker',
      location: worker?.location || 'Unknown',
      muktiScore,
      confidence,
      totalJobs,
      activeMonths,
      avgRating,
      incomeMin: Math.floor(realisticMonthlyIncome * 0.8),
      incomeMax: Math.ceil(realisticMonthlyIncome * 1.2),
      safeEMI: Math.floor(safeEMI),
      loanMin: Math.floor(safeEMI * 12),
      loanMax: Math.ceil(safeEMI * 18),
      isVerified: worker?.isVerifiedByAdmin || false,
      fraudRisk,
      rid,
      recentJobs: verifications.map(v => ({
        date: v.timestamp?.toDate ? v.timestamp.toDate().toLocaleDateString('en-IN') : new Date(v.timestamp).toLocaleDateString('en-IN'),
        category: v.skills?.[0] || worker?.skill || 'Service',
        rating: v.rating,
        type: 'Verified'
      }))
    };

    // Save snapshot for QR code verification
    try {
      await database.collection('public_reports').doc(rid).set({
        ...reportData,
        generatedAt: new Date().toISOString(),
        computed: {
          fraudLevel: fraudRisk,
          trustStack: { otp: true, geo: true, photo: totalJobs > 0, timestamp: true, repeat: false },
          recentJobs: reportData.recentJobs
        }
      });
    } catch (err) {
      console.error('Failed to save public report snapshot:', err);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Worker_Report_${workerId}.pdf"`);
    
    generatePdfReport(reportData, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report pdf' });
  }
});

/**
 * --- VERIFICATION REQUESTS (Manual Flow) ---
 */

// 1. Create Request (Worker)
app.post('/api/worker/verify-request', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { workerId, workerName, workerPhone, workerSkill } = req.body;
    const requestDoc: any = {
      workerId,
      workerName,
      workerPhone,
      workerSkill: workerSkill || "Not Specified",
      status: "pending",
      timestamp: new Date().toISOString()
    };

    let result;
    if (db) {
      try {
        const fbDoc = { ...requestDoc, timestamp: admin.firestore.FieldValue.serverTimestamp() };
        const docRef = await db.collection('verification_requests').add(fbDoc);
        
        // Also attempt to update user status in Firestore
        try {
          await db.collection('users').doc(workerId).update({ status: 'pending' });
          console.log(`Backend updated user ${workerId} status to pending`);
          
          // Notify the worker
          await db.collection('notifications').add({
            userId: workerId,
            title: 'Verification Request Submitted',
            message: 'Your identity verification request is now under review.',
            read: false,
            type: 'info',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (uErr: any) {
          console.warn(`Backend could not update user status: ${uErr.message}`);
        }

        result = { id: docRef.id, ...requestDoc };
      } catch (err) {
        console.warn('Firestore write failed, falling back to local storage.');
        result = saveLocalRequest(requestDoc);
        
        // Even if collection write failed, we might still be able to update user doc? 
        // (Unlikely if credentials are missing, but good for completeness)
        try {
          await db?.collection('users').doc(workerId).update({ status: 'pending' });
        } catch (sErr) {}
      }
    } else {
      result = saveLocalRequest(requestDoc);
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Create Request Error:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

app.get('/api/worker/:workerId/verification-status', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { workerId } = req.params;
    let status = 'none';

    // 1. Check Local Fallback (Immediate)
    const localReqs = getLocalRequests();
    const myLocalReq = localReqs.find((r: any) => r.workerId === workerId);
    if (myLocalReq) {
      status = myLocalReq.status;
    }

    // 2. Check Firestore (Concurrent with 3s timeout)
    if (db) {
      const firebaseFetch = db.collection('verification_requests')
        .where('workerId', '==', workerId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()
        .then(snap => {
          if (!snap.empty) {
            status = snap.docs[0].data().status;
          }
        })
        .catch(err => console.warn('Worker status Firestore failed:', err.message));

      await Promise.race([
        firebaseFetch,
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    }

    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// 2. Get Pending Requests (Admin)
app.get('/api/admin/requests', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const allRequests = [...getLocalRequests()];

    if (db) {
      // Fetch Firestore concurrently with a 3s timeout
      const firebaseFetch = db.collection('verification_requests')
        .where('status', '==', 'pending')
        .orderBy('timestamp', 'desc')
        .get()
        .then(snapshot => {
          snapshot.docs.forEach(doc => {
            if (!allRequests.find(r => r.id === doc.id)) {
              allRequests.push({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : doc.data().timestamp
              });
            }
          });
        })
        .catch(err => console.warn('Firestore fetch failed:', err.message));

      // Wait max 3 seconds for Firestore, then return what we have (including local)
      await Promise.race([
        firebaseFetch,
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    }
    
    res.json(allRequests.filter(r => r.status === 'pending'));
  } catch (err) {
    console.error('Fetch Requests Error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// 3. Process Request (Admin)
app.post('/api/admin/process-request', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { requestId, workerId, action, source } = req.body; 
    console.log(`[ADMIN-ACTION] Action: ${action}, Request: ${requestId}, Worker: ${workerId}, Source: ${source}`);
    
    if (!workerId) {
      console.error('Missing workerId in request body');
      return res.status(400).json({ error: 'Missing workerId' });
    }

    const database = db;
    
    // 1. Handle Local
    if (requestId.startsWith('local-')) {
      updateLocalRequest(requestId, action);
    }

    // 2. Handle Firestore (Only if fully enabled)
    if (isFirebaseEnabled && database) {
      try {
        const userRef = database.collection('users').doc(workerId);
        const newStatus = action === 'approve' ? 'verified' : 'not verified';
        
        console.log(`[FIREBASE-ADMIN] Attempting update for user ${workerId}...`);
        
        // Update User Profile
        await userRef.update({
          status: newStatus,
          isVerifiedByAdmin: action === 'approve',
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update/Delete Request Document
        if (source === 'collection' && !requestId.startsWith('usr-') && !requestId.startsWith('local-')) {
          const requestRef = database.collection('verification_requests').doc(requestId);
          if (action === 'approve') {
            await requestRef.update({
              status: 'verified',
              processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            await requestRef.delete();
          }
        }
        console.log(`[FIREBASE-ADMIN] Successfully updated user ${workerId}`);

        // Log Notification
        await logAdminNotification({
          title: `Worker ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: `Admin processed verification for worker ${workerId}. Action: ${action.toUpperCase()}`,
          type: 'Users',
          priority: action === 'approve' ? 'success' : 'danger',
          userId: workerId,
          userRole: 'worker'
        });

        // Notify the worker
        await database.collection('notifications').add({
          userId: workerId,
          title: action === 'approve' ? 'Identity Verified ✔' : 'Verification Rejected',
          message: action === 'approve' ? 'Your identity has been verified by admin.' : 'Your verification request was rejected. Please contact support.',
          read: false,
          type: action === 'approve' ? 'success' : 'alert',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (fbErr: any) {
        console.error('[FIREBASE-ADMIN-ERROR]:', fbErr.message);
        // We DON'T throw here so the response can still return success (local only)
        // or we return a warning.
      }
    }
    
    res.json({ success: true, message: `Worker ${action === 'approve' ? 'verified' : 'rejected'} successfully (Backend Processed).` });
  } catch (err: any) {
    console.error('[CRITICAL-BACKEND-ERROR]:', err);
    res.status(500).json({ error: 'Failed to process request', details: err.message });
  }
});

// 4. Clear All Requests (Admin)
app.post('/api/admin/clear-all-requests', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // 1. Clear Local
    fs.writeFileSync(LOCAL_REQUESTS_PATH, JSON.stringify([], null, 2));

    // 2. Clear Firestore (Only if fully enabled)
    if (isFirebaseEnabled && db) {
      const snapshot = await db.collection('verification_requests').get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    res.json({ success: true, message: "All requests purged successfully" });
  } catch (err) {
    console.error('Clear All Error:', err);
    res.status(500).json({ error: 'Failed to clear requests' });
  }
});

// 5. Reset All Worker Status (Admin)
app.post('/api/admin/reset-workers-status', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Database not connected" });
    
    const snapshot = await db.collection('users').where('role', '==', 'worker').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        isVerifiedByAdmin: false,
        status: "pending" 
      });
    });
    
    await batch.commit();
    res.json({ success: true, count: snapshot.size });
  } catch (err) {
    console.error('Reset Workers Error:', err);
    res.status(500).json({ error: 'Failed to reset workers' });
  }
});

// ═══════════════════════════════════════════════════════════
//  WORK REQUESTS (Customer ↔ Worker Job Marketplace)
// ═══════════════════════════════════════════════════════════

const LOCAL_WORK_REQUESTS_PATH = path.join(__dirname, '../data/work_requests.json');

const getLocalWorkRequests = () => {
  if (fs.existsSync(LOCAL_WORK_REQUESTS_PATH)) {
    return JSON.parse(fs.readFileSync(LOCAL_WORK_REQUESTS_PATH, 'utf-8'));
  }
  return [];
};

const saveLocalWorkRequest = (data: any) => {
  const requests = getLocalWorkRequests();
  const newReq = { ...data, id: `local-wr-${Date.now()}` };
  requests.push(newReq);
  fs.writeFileSync(LOCAL_WORK_REQUESTS_PATH, JSON.stringify(requests, null, 2));
  return newReq;
};

// 1. Create Work Request (Customer)
app.post('/api/work-request', verifyToken, async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    console.log('[WORK-REQUEST] New request:', data.service, 'from', data.customerName);

    let result: any = null;

    // Try Firestore (Admin SDK bypasses security rules)
    if (isFirebaseEnabled && db) {
      try {
        const firestorePayload = {
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Remove any client-side createdAt string
        delete firestorePayload.createdAt;
        firestorePayload.createdAt = admin.firestore.FieldValue.serverTimestamp();

        const docRef = await db.collection('work_requests').add(firestorePayload);
        result = { id: docRef.id, ...data };
        console.log('✅ Work request saved to Firestore:', docRef.id);
      } catch (fbErr: any) {
        console.warn('⚠️ Firestore write failed:', fbErr.message);
      }
    }

    // Fallback: Local file storage
    if (!result) {
      result = saveLocalWorkRequest({ ...data, createdAt: new Date().toISOString() });
      console.log('✅ Work request saved locally:', result.id);
    }

    // Log Notification
    await logAdminNotification({
      title: 'New Job Posted',
      description: `${data.customerName || 'A customer'} posted a new job for ${data.service}.`,
      type: 'Jobs',
      priority: 'info',
      userId: data.customerId,
      userRole: 'customer'
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[WORK-REQUEST-ERROR]:', err.message);
    res.status(500).json({ error: 'Failed to create work request' });
  }
});

// 2. Get All Work Requests (Worker dashboard feed)
app.get('/api/work-requests', verifyToken, async (req: AuthRequest, res) => {
  try {
    const allRequests = [...getLocalWorkRequests()];

    if (isFirebaseEnabled && db) {
      try {
        const snapshot = await db.collection('work_requests')
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();

        snapshot.docs.forEach(doc => {
          if (!allRequests.find((r: any) => r.id === doc.id)) {
            const data = doc.data();
            allRequests.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || data.createdAt,
            });
          }
        });
      } catch (fbErr: any) {
        console.warn('⚠️ Firestore read failed:', fbErr.message);
      }
    }

    res.json(allRequests);
  } catch (err: any) {
    console.error('[WORK-REQUESTS-LIST-ERROR]:', err.message);
    res.status(500).json({ error: 'Failed to fetch work requests' });
  }
});

// 3. Get Single Work Request by ID (for LiveTracking fallback)
app.get('/api/work-request/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Try Firestore first
    if (isFirebaseEnabled && db && !id.startsWith('local-')) {
      try {
        const docSnap = await db.collection('work_requests').doc(id).get();
        if (docSnap.exists) {
          const data = docSnap.data()!;
          return res.json({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            acceptedAt: data.acceptedAt?.toDate?.() || data.acceptedAt,
          });
        }
      } catch (fbErr: any) {
        console.warn('⚠️ Firestore single read failed:', fbErr.message);
      }
    }

    // Fallback: local storage
    const local = getLocalWorkRequests().find((r: any) => r.id === id);
    if (local) return res.json(local);

    res.status(404).json({ error: 'Work request not found' });
  } catch (err: any) {
    console.error('[WORK-REQUEST-GET-ERROR]:', err.message);
    res.status(500).json({ error: 'Failed to fetch work request' });
  }
});

// 4. Accept / Update Work Request (Worker)
app.put('/api/work-request/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('[WORK-REQUEST-UPDATE] ID:', id, 'Data:', updateData);

    // Update in Firestore
    if (isFirebaseEnabled && db && !id.startsWith('local-')) {
      try {
        await db.collection('work_requests').doc(id).update({
          ...updateData,
          ...(updateData.status === 'Accepted' ? { acceptedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
          ...(updateData.status === 'Completed' ? { completedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
        });
        console.log('✅ Work request updated in Firestore');
      } catch (fbErr: any) {
        console.warn('⚠️ Firestore update failed:', fbErr.message);
      }
    }

    // Update locally
    if (id.startsWith('local-')) {
      const requests = getLocalWorkRequests();
      const updated = requests.map((r: any) => r.id === id ? { ...r, ...updateData } : r);
      fs.writeFileSync(LOCAL_WORK_REQUESTS_PATH, JSON.stringify(updated, null, 2));
    }

    // Log Notification if status changed
    if (updateData.status) {
      await logAdminNotification({
        title: `Job ${updateData.status}`,
        description: `Job ${id} status changed to ${updateData.status} by ${updateData.workerName || 'Worker'}.`,
        type: 'Jobs',
        priority: updateData.status === 'Completed' ? 'success' : (updateData.status === 'Accepted' || updateData.status === 'In Progress' ? 'info' : 'warning'),
        userId: updateData.workerId,
        userRole: 'worker'
      });

      // Notify the customer
      if (isFirebaseEnabled && db && !id.startsWith('local-')) {
        try {
          const docSnap = await db.collection('work_requests').doc(id).get();
          if (docSnap.exists) {
            const customerId = docSnap.data()?.customerId;
            if (customerId) {
              await db.collection('notifications').add({
                userId: customerId,
                title: `Job ${updateData.status === 'In Progress' ? 'Accepted' : updateData.status}`,
                message: `Your job request has been ${updateData.status === 'In Progress' ? 'accepted' : updateData.status.toLowerCase()} by ${updateData.workerName || 'a worker'}.`,
                read: false,
                type: updateData.status === 'Completed' ? 'success' : 'info',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        } catch (err) {
          console.warn('Failed to notify customer:', err);
        }
      }
    }

    res.json({ success: true, message: 'Work request updated' });
  } catch (err: any) {
    console.error('[WORK-REQUEST-UPDATE-ERROR]:', err.message);
    res.status(500).json({ error: 'Failed to update work request' });
  }
});

// 5. Public Report Fetch (Bypass Firestore Security Rules for unauthenticated users scanning QR)
app.get('/api/public-report/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    let worker: any = null;

    if (isFirebaseEnabled && db && !workerId.startsWith('local-')) {
      const userDoc = await db.collection('users').doc(workerId).get();
      if (userDoc.exists) {
        worker = userDoc.data();
      }
    }

    // Fallback: local user
    if (!worker) {
      const localUsers = getLocalUsers();
      worker = localUsers.find((u: any) => u.id === workerId);
    }

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    let verifications: any[] = [];
    let workRequests: any[] = [];

    // 2. Get verifications
    if (isFirebaseEnabled && db) {
      try {
        const vSnap = await db.collection('verifications')
          .where('workerId', '==', workerId)
          .orderBy('timestamp', 'desc')
          .get();
        
        verifications = vSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
          };
        });
      } catch (e) {}
    }

    // 3. Get completed work requests
    if (isFirebaseEnabled && db) {
      try {
        const wSnap = await db.collection('work_requests')
          .where('acceptedBy', '==', workerId)
          .where('status', '==', 'Completed')
          .get();
        
        workRequests = wSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            timestamp: data.completedAt?.toDate ? data.completedAt.toDate().toISOString() : data.completedAt,
            rating: data.rating || 4,
          };
        });
      } catch (e) {}
    }

    // Include local requests for fallback demo workers
    if (workRequests.length === 0) {
       const localReqs = getLocalWorkRequests();
       const localWorkerReqs = localReqs.filter((r: any) => r.acceptedBy === workerId && r.status === 'Completed');
       workRequests = localWorkerReqs.map((r: any) => ({
           ...r,
           timestamp: typeof r.completedAt === 'string' ? r.completedAt : new Date().toISOString(),
           rating: r.rating || 4
       }));
    }

    res.json({
      worker,
      verifications,
      workRequests
    });
  } catch (err: any) {
    console.error('[PUBLIC-REPORT-ERROR]:', err.message);
    res.status(500).json({ error: 'Failed to fetch public report data' });
  }
});

app.use(globalErrorHandler);

// Only listen if not running on Vercel's serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Mukti Portal API running on http://localhost:${PORT}`);
  });
}

export default app;
