import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy image URLs for storage references
const IMAGES = {
  workerProfile: 'https://firebasestorage.googleapis.com/v0/b/mukti-portal-demo/o/demo_worker_profile.png?alt=media',
  customerProfile: 'https://firebasestorage.googleapis.com/v0/b/mukti-portal-demo/o/demo_customer_profile.png?alt=media',
  idCard: 'https://firebasestorage.googleapis.com/v0/b/mukti-portal-demo/o/demo_id_card.png?alt=media',
  certificate: 'https://firebasestorage.googleapis.com/v0/b/mukti-portal-demo/o/demo_certificate.png?alt=media',
};

const collections = {
  users: {},
  verifications: {},
  work_requests: {},
  verification_requests: {},
  notifications: {},
  jobs: {}
};

function generateId() {
  return faker.string.alphanumeric(20);
}

// 1. Generate core specific users
const adminId = 'admin_user_1';
collections.users[adminId] = {
  id: adminId,
  email: 'shivashankrmali483@gmail.com',
  name: 'Shiv Admin',
  role: 'admin',
  roles: ['admin'],
  phone: '9999999991',
  otpVerified: true,
  lastActive: new Date().toISOString(),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  isDemo: true,
  photo: IMAGES.workerProfile
};

const verifiedWorkerId = 'worker_user_verified';
collections.users[verifiedWorkerId] = {
  id: verifiedWorkerId,
  email: 'malishivashankr5@gmail.com',
  name: 'Shiv Verified Worker',
  role: 'worker',
  roles: ['worker'],
  phone: '9999999992',
  otpVerified: true,
  workerType: 1, // Mobile
  skill: 'Plumber',
  location: 'Mumbai, Maharashtra',
  location_coords: { lat: 19.0760, lng: 72.8777 },
  photo: IMAGES.workerProfile,
  points: 1200,
  badges: ['Top Rated', 'Verified Identity'],
  muktiScore: 95,
  trustScore: 95,
  isProfileComplete: true,
  isVerifiedByAdmin: true,
  experienceYears: 5,
  hourlyRate: 500,
  lastActive: new Date().toISOString(),
  createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  isDemo: true
};

const pendingWorkerId = 'worker_user_pending';
collections.users[pendingWorkerId] = {
  id: pendingWorkerId,
  email: 'nageshmali2006@gmail.com',
  name: 'Nagesh Pending Worker',
  role: 'worker',
  roles: ['worker'],
  phone: '9999999993',
  otpVerified: true,
  workerType: 0, // Fixed
  skill: 'Electrician',
  location: 'Pune, Maharashtra',
  photo: IMAGES.workerProfile,
  points: 50,
  badges: [],
  muktiScore: 40,
  trustScore: 40,
  isProfileComplete: true,
  isVerifiedByAdmin: false, // pending
  experienceYears: 2,
  hourlyRate: 300,
  lastActive: new Date().toISOString(),
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  isDemo: true
};

const activeCustomerId = 'customer_user_active';
collections.users[activeCustomerId] = {
  id: activeCustomerId,
  email: 'shivashankrmali5@gmail.com',
  name: 'Shiv Active Customer',
  role: 'customer',
  roles: ['customer'],
  phone: '9999999994',
  otpVerified: true,
  location: 'Mumbai, Maharashtra',
  photo: IMAGES.customerProfile,
  points: 300,
  customer_type: 0, // Individual
  lastActive: new Date().toISOString(),
  createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  isDemo: true
};

const lowActivityCustomerId = 'customer_user_low';
collections.users[lowActivityCustomerId] = {
  id: lowActivityCustomerId,
  email: 'shivashankrmaliail6@gmail.com',
  name: 'Shiv Low Activity',
  role: 'customer',
  roles: ['customer'],
  phone: '9999999995',
  otpVerified: true,
  location: 'Navi Mumbai, Maharashtra',
  photo: IMAGES.customerProfile,
  points: 10,
  customer_type: 1, // Enterprise/Business
  lastActive: new Date().toISOString(),
  createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  isDemo: true
};

const suspendedWorkerId = 'worker_user_suspended';
collections.users[suspendedWorkerId] = {
  id: suspendedWorkerId,
  email: 'shivashankrmali8@gmail.com',
  name: 'Shiv Suspended',
  role: 'worker',
  roles: ['worker'],
  phone: '9999999996',
  otpVerified: true,
  workerType: 1,
  skill: 'Carpenter',
  location: 'Mumbai, Maharashtra',
  photo: IMAGES.workerProfile,
  points: -100,
  badges: [],
  muktiScore: 10,
  trustScore: 10,
  isProfileComplete: true,
  isVerifiedByAdmin: false,
  status: 'suspended', // Or whatever flag the app uses
  experienceYears: 10,
  hourlyRate: 400,
  lastActive: new Date().toISOString(),
  createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  isDemo: true
};

const dualUserId = 'user_dual_role';
collections.users[dualUserId] = {
  id: dualUserId,
  email: 'dual_role_demo@gmail.com',
  name: 'Shiv Dual Role (Worker & Customer)',
  role: 'both',
  roles: ['worker', 'customer'],
  phone: '9999999997',
  otpVerified: true,
  workerType: 1,
  skill: 'Electrician',
  location: 'Mumbai, Maharashtra',
  photo: IMAGES.workerProfile,
  points: 400,
  badges: ['Verified Identity'],
  muktiScore: 70,
  trustScore: 70,
  isProfileComplete: true,
  isVerifiedByAdmin: true,
  customer_type: 0,
  experienceYears: 4,
  hourlyRate: 350,
  lastActive: new Date().toISOString(),
  createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  isDemo: true
};

// 2. Generate generic fake users
const fakeWorkerIds = [];
for (let i = 0; i < 20; i++) {
  const id = 'fake_worker_' + i;
  fakeWorkerIds.push(id);
  const score = faker.number.int({min: 20, max: 99});
  collections.users[id] = {
    id,
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'worker',
    roles: ['worker'],
    phone: faker.phone.number(),
    otpVerified: true,
    workerType: faker.helpers.arrayElement([0, 1]),
    skill: faker.helpers.arrayElement(['Plumber', 'Electrician', 'Carpenter', 'Mason', 'Painter', 'Cleaner']),
    location: faker.location.city() + ', ' + faker.location.state(),
    location_coords: { lat: faker.location.latitude(), lng: faker.location.longitude() },
    photo: IMAGES.workerProfile,
    points: score * 10,
    badges: score > 80 ? ['Top Rated'] : [],
    muktiScore: score,
    trustScore: score,
    isProfileComplete: true,
    isVerifiedByAdmin: score > 50,
    experienceYears: faker.number.int({min: 1, max: 15}),
    hourlyRate: faker.number.int({min: 200, max: 1000}),
    lastActive: faker.date.recent().toISOString(),
    createdAt: faker.date.past().toISOString(),
    isDemo: true
  };
}

const fakeCustomerIds = [];
for (let i = 0; i < 20; i++) {
  const id = 'fake_customer_' + i;
  fakeCustomerIds.push(id);
  collections.users[id] = {
    id,
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'customer',
    roles: ['customer'],
    phone: faker.phone.number(),
    otpVerified: true,
    location: faker.location.city() + ', ' + faker.location.state(),
    photo: IMAGES.customerProfile,
    points: faker.number.int({min: 0, max: 500}),
    customer_type: faker.helpers.arrayElement([0, 1]),
    lastActive: faker.date.recent().toISOString(),
    createdAt: faker.date.past().toISOString(),
    isDemo: true
  };
}

// 3. Generate Work Requests
const allWorkers = [verifiedWorkerId, pendingWorkerId, suspendedWorkerId, dualUserId, ...fakeWorkerIds];
const allCustomers = [activeCustomerId, lowActivityCustomerId, dualUserId, ...fakeCustomerIds];
const statuses = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected', 'Cancelled'];

// Fraud / Self-dealing specific case
const selfDealReqId = 'req_fraud_self_deal';
collections.work_requests[selfDealReqId] = {
  id: selfDealReqId,
  customerId: dualUserId,
  workerId: dualUserId, // Same user attempting to book themselves
  status: 'Flagged',
  title: 'Self Booking Fraud Attempt',
  description: 'A test case where a dual user attempts to book themselves for false rating manipulation.',
  location: 'Mumbai, Maharashtra',
  location_coords: { lat: 19.0760, lng: 72.8777 },
  date: new Date().toISOString(),
  price: 5000,
  createdAt: new Date().toISOString(),
  isDemo: true,
  isFraud: true
};

// Add explicit notification for this fraud
collections.notifications['notif_fraud_1'] = {
  id: 'notif_fraud_1',
  userId: dualUserId,
  title: 'Action Restricted',
  message: 'System flagged a self-booking attempt. You cannot accept your own work requests.',
  read: false,
  createdAt: new Date().toISOString(),
  type: 'error',
  isDemo: true
};
collections.notifications['notif_fraud_2'] = {
  id: 'notif_fraud_2',
  userId: dualUserId,
  title: 'Warning Issued',
  message: 'Repeated self-booking may result in account suspension.',
  read: false,
  createdAt: new Date().toISOString(),
  type: 'warning',
  isDemo: true
};

for (let i = 0; i < 100; i++) {
  const id = 'req_' + i;
  const status = faker.helpers.arrayElement(statuses);
  const cId = faker.helpers.arrayElement(allCustomers);
  const wId = faker.helpers.arrayElement(allWorkers);
  
  collections.work_requests[id] = {
    id,
    customerId: cId,
    workerId: wId,
    status,
    title: faker.person.jobTitle(),
    description: faker.lorem.paragraph(),
    location: faker.location.city(),
    location_coords: { lat: faker.location.latitude(), lng: faker.location.longitude() },
    date: faker.date.recent().toISOString(),
    price: faker.number.int({min: 500, max: 5000}),
    createdAt: faker.date.recent({days: 30}).toISOString(),
    isDemo: true
  };
}

// 4. Generate Verifications (Reviews / trust updates)
for (let i = 0; i < 50; i++) {
  const id = 'ver_' + i;
  const cId = faker.helpers.arrayElement(allCustomers);
  const wId = faker.helpers.arrayElement(allWorkers);
  
  collections.verifications[id] = {
    id,
    customerId: cId,
    workerId: wId,
    type: 'peer_review',
    rating: faker.number.int({min: 1, max: 5}),
    feedback: faker.lorem.sentence(),
    imageProof: IMAGES.idCard,
    muktiScoreGained: faker.number.int({min: 0, max: 10}),
    timestamp: faker.date.recent({days: 60}).toISOString(),
    status: faker.helpers.arrayElement(['approved', 'pending', 'rejected']),
    isDemo: true
  };
}

// 5. Generate Verification Requests (Worker asking for verification)
for (let i = 0; i < 30; i++) {
  const id = 'vreq_' + i;
  const cId = faker.helpers.arrayElement(allCustomers);
  const wId = faker.helpers.arrayElement(allWorkers);
  
  collections.verification_requests[id] = {
    id,
    workerId: wId,
    customerId: cId,
    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
    requestDate: faker.date.recent({days: 10}).toISOString(),
    isDemo: true
  };
}

// 6. Generate Notifications tied to generic activities
const allUsers = [...allWorkers, ...allCustomers, adminId];
for (let i = 0; i < 100; i++) {
  const id = 'notif_' + i;
  const target = faker.helpers.arrayElement(allUsers);
  const type = faker.helpers.arrayElement(['info', 'success', 'warning', 'error']);
  
  let title = '';
  let message = '';
  
  if (type === 'success') {
    title = faker.helpers.arrayElement(['Work Completed', 'Payment Received', 'Profile Verified']);
    message = 'Your recent activity has been successfully processed and recorded.';
  } else if (type === 'info') {
    title = faker.helpers.arrayElement(['New Work Request', 'Verification Pending', 'System Update']);
    message = 'You have a new update regarding your recent actions on the platform.';
  } else if (type === 'warning') {
    title = faker.helpers.arrayElement(['Low Trust Score', 'Action Required', 'Missing Documents']);
    message = 'Please review your profile to ensure all requirements are met.';
  } else {
    title = faker.helpers.arrayElement(['Request Rejected', 'Payment Failed', 'Flagged Activity']);
    message = 'An issue occurred with your recent request. Please contact support if this persists.';
  }

  collections.notifications[id] = {
    id,
    userId: target,
    title,
    message,
    read: faker.datatype.boolean(),
    createdAt: faker.date.recent({days: 5}).toISOString(),
    type,
    isDemo: true
  };
}

// 7. Generate Global Jobs
for (let i = 0; i < 20; i++) {
  const id = 'job_' + i;
  collections.jobs[id] = {
    id,
    title: faker.person.jobTitle(),
    description: faker.lorem.paragraph(),
    location: faker.location.city(),
    budget: faker.number.int({min: 1000, max: 10000}),
    postedBy: faker.helpers.arrayElement(allCustomers),
    status: faker.helpers.arrayElement(['open', 'closed', 'in_progress']),
    createdAt: faker.date.recent({days: 30}).toISOString(),
    isDemo: true
  };
}

// Write to file
const outputPath = path.join(__dirname, '..', 'firestore-demo-seed.json');
fs.writeFileSync(outputPath, JSON.stringify(collections, null, 2));

console.log(`Successfully generated demo data at ${outputPath}`);
