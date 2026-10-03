// Mock datasets for the frontend-only ("no database") demo mode.
//
// These datasets power `mockApiAdapter.js`, which is installed as the Axios
// adapter when mocks are enabled (see src/api/client.js). With VITE_USE_MOCKS=true
// the whole portal runs without the backend or a DATABASE_URL.
//
// Everything here is plain, serialisable data. The adapter clones it into an
// in-memory store at startup so create/update/delete actions behave like the
// real API for the duration of the browser session.

// --- Education Corner assets ----------------------------------------------
// Real bundled images from src/content, one per item, so the Education Corner
// renders exactly like the live site and no two cards share the same picture.
import thumbBenefits from '../content/education Web/Thumbnail/BenefitsOfFamilyPlanningThumbnail.png';
import thumbImplantation from '../content/education Web/Thumbnail/FertilityAndImplantationThumbnail.png';
import thumbLAM from '../content/education Web/Thumbnail/LAMThumbnail.png';
import thumbStandardDays from '../content/education Web/Thumbnail/StandardDaysMethodThumbnail.png';
import thumbCondom from '../content/education Web/Thumbnail/CondomThumbnail.png';
import diagramImplantation from '../content/education Web/Diagram/FertilityandImplantationDiagram.png';
import diagramInjectable from '../content/education Web/Diagram/InjectableContraceptiveDiagram.png';
import diagramJointFertility from '../content/education Web/Diagram/FertilityAwarenessJointFertilityDiagram.png';
import diagramCondom from '../content/education Web/Diagram/CondomDiagram.png';
import diagramIUD from '../content/education Web/Diagram/IUDDiagram.png';

// Brochure / booklet pages. Each booklet uses its own folder so the covers and
// the page carousel never repeat an image.
import bookletRisks1 from '../content/education Booklets/Mayroon Bang Dapat Katakutan Sa Family Planning/B1IMG1.jpg';
import bookletRisks2 from '../content/education Booklets/Mayroon Bang Dapat Katakutan Sa Family Planning/B1IMG2.jpg';
import bookletRisks3 from '../content/education Booklets/Mayroon Bang Dapat Katakutan Sa Family Planning/B1IMG3.JPG';
import bookletTeen1 from '../content/education Booklets/Pregnancy Among Adolescents/B5IMG1.JPG';
import bookletTeen2 from '../content/education Booklets/Pregnancy Among Adolescents/B5IMG2.JPG';
import bookletTeen3 from '../content/education Booklets/Pregnancy Among Adolescents/B5IMG3.JPG';
import bookletWait1 from '../content/education Booklets/Hindi Pa Handang Magbuntis/B3IMG1.JPG';
import bookletWait2 from '../content/education Booklets/Hindi Pa Handang Magbuntis/B3IMG2.JPG';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

// ISO timestamp offset from today, in days (negative = past).
const iso = (offsetDays = 0, hours = 9) => {
  const d = new Date(NOW + offsetDays * DAY);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
};

// YYYY-MM-DD offset from today, in days.
const dateOnly = (offsetDays = 0) => new Date(NOW + offsetDays * DAY).toISOString().slice(0, 10);

// --- Item factories -------------------------------------------------------
// These keep the datasets below declarative and short while guaranteeing every
// row has the same shape the UI reads.

const newsItem = (id, title, content, offsetDays, extra = {}) => ({
  id,
  title,
  content,
  imageUrl: '',
  isPublished: true,
  createdById: 1,
  createdAt: iso(offsetDays),
  ...extra
});

const faqItem = (id, topic, question, answer) => ({ id, topic, question, answer });

// Calendar entry. `offsetDays` drives both the date and the start/end hours, so
// past / today / future entries all stay in the right relative position.
const calendarEvent = (
  id,
  type,
  title,
  description,
  offsetDays,
  startHour,
  endHour,
  status,
  extra = {}
) => ({
  id,
  title,
  type,
  description,
  details: '',
  location: null,
  lead: null,
  date: dateOnly(offsetDays),
  startDate: iso(offsetDays, startHour),
  endDate: iso(offsetDays, endHour),
  start_time: `${String(startHour).padStart(2, '0')}:00`,
  end_time: `${String(endHour).padStart(2, '0')}:00`,
  status,
  counselor: null,
  counselorID: null,
  counselor_name: null,
  barangay: null,
  userID: null,
  ...extra
});

const feedbackItem = (id, full_name, barangay, message, status, offsetDays, email, contact) => ({
  id,
  full_name,
  email: email || `${full_name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  contact_number: contact,
  barangay,
  message,
  status,
  created_at: iso(offsetDays)
});

const clientSatisfaction = (id, client_type, service_availed, sex, age, offsetDays, suggestions) => ({
  id,
  client_type,
  date: dateOnly(offsetDays),
  region_of_residence: 'Region I',
  sex,
  age,
  service_availed,
  suggestions,
  email: '',
  created_at: iso(offsetDays)
});

const appointment = (id, service_slug, citizen_full_name, barangay, status, offsetDays, requestedInDays) => ({
  id,
  service_slug,
  citizen_full_name,
  citizen_contact_number: `0915${String(1000000 + Number(String(id).replace(/\D/g, '') || 0)).slice(0, 7)}`,
  citizen_email: `${citizen_full_name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  requested_date: iso(requestedInDays),
  barangay,
  status,
  created_at: iso(offsetDays)
});

const fpBooking = (id, status, full_name, barangay, age, sex, requestedInDays, reason, offsetDays) => ({
  id,
  status,
  full_name,
  contact_number: '09151231231',
  age,
  sex,
  barangay,
  preferredDate: iso(requestedInDays),
  preferred_date: iso(requestedInDays),
  reason,
  created_at: iso(offsetDays)
});

const counselor = (id, counselor_name, email, contact_number, isActive) => ({
  counselorID: id,
  id,
  counselor_name,
  name: counselor_name,
  email,
  contact_number,
  isActive
});

const fileTask = (id, taskTitle, description, barangay, officerName, status, dueInDays, offsetDays, submitted) => ({
  id,
  taskTitle,
  description,
  submitUntil: iso(dueInDays, 23),
  status,
  barangay,
  officerName,
  submittedAt: submitted ? iso(offsetDays) : null,
  supabaseLink: submitted ? `https://example.com/mock/${id}.pdf` : null,
  fileName: submitted ? `${id}.pdf` : null,
  createdAt: iso(offsetDays)
});

const pmoSchedule = (id, offsetDays, startHour, endHour, counselorId, counselorName, status, details) => ({
  id,
  date: dateOnly(offsetDays),
  start_time: `${String(startHour).padStart(2, '0')}:00:00`,
  end_time: `${String(endHour).padStart(2, '0')}:00:00`,
  description: 'Municipal Hall - PMO Room',
  details: details || '',
  counselor: counselorId,
  counselor_name: counselorName,
  status
});

const pmoQuestion = (questionID, question_text, question_type, parent_question_id, sort_order, is_invisible = false) => ({
  questionID,
  question_text,
  question_type,
  parent_question_id,
  sort_order,
  is_invisible
});

// ---------------------------------------------------------------------------
// Accounts / authentication
// ---------------------------------------------------------------------------
// Demo credentials (username / password) for the login modal when mocks are on.
export const mockAuthUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
    fullName: 'System Administrator',
    email: 'admin@sanfabian.gov.ph',
    contactNumber: '0915-811-2320',
    barangay: ''
  },
  {
    id: 2,
    username: 'officer',
    password: 'officer123',
    role: 'Barangay Officer',
    fullName: 'Maria Barangay Officer',
    email: 'officer@sanfabian.gov.ph',
    contactNumber: '09151234567',
    barangay: 'Poblacion'
  },
  {
    id: 3,
    username: 'user',
    password: 'user123',
    role: 'User',
    fullName: 'Juan Dela Cruz',
    email: 'juan@example.com',
    contactNumber: '09159876543',
    barangay: ''
  }
];

// Account directory used by the admin Accounts page. `account` builds the shape
// AccountsAdmin reads (fullName / username / email / contactNumber / role /
// barangay / isActive), including the 09xxxxxxxxx contact format it validates.
const account = (id, username, role, fullName, barangay, isActive, offsetDays) => ({
  id,
  username,
  role,
  fullName,
  email: `${username}@sanfabian.gov.ph`,
  contactNumber: `0915${String(1000000 + id).slice(0, 7)}`,
  contact: `0915${String(1000000 + id).slice(0, 7)}`,
  barangay,
  isActive,
  createdAt: iso(offsetDays)
});

export const mockUsers = [
  // The three sign-in accounts, minus their passwords.
  ...mockAuthUsers.map(({ password, ...u }) => ({
    ...u,
    contact: u.contactNumber,
    isActive: true,
    createdAt: iso(-40)
  })),
  account(4, 'officer2', 'Barangay Officer', 'Pedro Ramos', 'Longos', true, -20),
  account(5, 'officer3', 'Barangay Officer', 'Ana Reyes', 'Mabilao', false, -10),
  account(6, 'officer4', 'Barangay Officer', 'Liza Mendoza', 'Alacan', true, -18),
  account(7, 'officer5', 'Barangay Officer', 'Carlo Aquino', 'Tocok', true, -25),
  account(8, 'officer6', 'Barangay Officer', 'Grace Tolentino', 'Binday', false, -30),
  account(9, 'officer7', 'Barangay Officer', 'Rodel Sanchez', 'Nibaliw East', true, -34),
  account(10, 'user2', 'User', 'Melissa Agbayani', '', true, -15),
  account(11, 'user3', 'User', 'Jomar Pangilinan', '', true, -22),
  account(12, 'admin2', 'Admin', 'Marisol Fernandez', '', true, -45),
  account(13, 'user4', 'User', 'Krystle Uy', '', false, -50)
];

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------
// The home page "News & Announcements" list shows published items newest-first,
// so the offsets below span roughly two months. The last item is archived so the
// admin News page's Show Archived toggle has something to reveal.
export const mockNews = [
  newsItem(
    'mock-news-1',
    'Barangay Family Planning Drive',
    'The Municipal Population Office is preparing mobile counseling sessions and information booths for residents this week. Barangay officers will assist clients who cannot visit the office in person.',
    -2
  ),
  newsItem(
    'mock-news-2',
    'Adolescent Health Orientation',
    'Youth services and referral pathways are now open for registration this month. Sessions are held at the Population Office and cover adolescent health, mental health, and responsible relationships.',
    -5
  ),
  newsItem(
    'mock-news-3',
    'Usapan-Series Kicks Off in Poblacion',
    'Barangay-led discussions on responsible parenthood begin this weekend at the barangay hall. All residents are welcome and no registration fee is required.',
    -9
  ),
  newsItem(
    'mock-news-4',
    'Free Pre-Marriage Orientation Slots',
    'Limited slots are available for the upcoming Pre-Marriage Orientation and Counseling (PMOC) session. Couples planning to apply for a marriage license are encouraged to register early.',
    -13
  ),
  newsItem(
    'mock-news-5',
    'Demographic Data Collection Update',
    'Barangay-level population profiling for the current year is ongoing. Barangay officers will submit their consolidated household data to the Population Office this month.',
    -17
  ),
  newsItem(
    'mock-news-6',
    'IEC Campaign on Birth Spacing',
    'An information, education and communication campaign on birth spacing and healthy timing of pregnancy is being rolled out across schools and health units.',
    -22
  ),
  newsItem(
    'mock-news-7',
    'AHDP Peer Education Training',
    'The Adolescent Health and Development Program conducted a peer education training for youth leaders in the municipality.',
    -28
  ),
  newsItem(
    'mock-news-8',
    'Community Health Caravan in Longos',
    'A mobile health and population awareness caravan served residents of Longos, providing free health screening and family planning counseling.',
    -33
  ),
  newsItem(
    'mock-news-9',
    'Population Office Hours Advisory',
    'The Municipal Population Office will be open from 8:00 AM to 5:00 PM on weekdays. Please bring a valid ID when availing of services.',
    -38
  ),
  newsItem(
    'mock-news-10',
    'New Usapan-Series Barangay Added',
    'Two additional barangays have been added to the Usapan-Series schedule for the current quarter, extending the forum to more communities.',
    -44
  ),
  newsItem(
    'mock-news-11',
    'Maternal Health Week Recap',
    'Thanks to everyone who joined our maternal health activities. Prenental care reminders and nutrition guidance remain available at the Population Office.',
    -52
  ),
  newsItem(
    'mock-news-12',
    'Advisory: Extended Office Hours (archived)',
    'This advisory has been archived and is no longer displayed on the public site.',
    -60,
    { isPublished: false }
  )
];

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------
export const mockFaqItems = [
  faqItem(
    1,
    'Pills Effectivity',
    'Are family planning pills effective?',
    'Pills can be very effective in helping prevent pregnancy when taken correctly and consistently. Their effect depends on regular use and on a person\u2019s health situation, so counseling with a trained provider is important before starting or changing a method (CPD, n.d.; DOH, n.d.).'
  ),
  faqItem(
    2,
    'Pills Effectivity',
    'Do pills protect against HIV or other sexually transmitted infections (STIs)?',
    'Pills do not protect against HIV or other sexually transmitted infections. They are designed to help prevent pregnancy. A health provider can explain options for protection and how to combine methods safely when appropriate (DOH, n.d.).'
  ),
  faqItem(
    3,
    'Pills Effectivity',
    'What should I do if I miss a pill?',
    'Take the missed pill as soon as you remember it and continue with the regular schedule. Asking a provider about emergency contraception options is recommended if unprotected intercourse occurred. Missing pills can reduce protection, so it is best to seek guidance on reminders and daily use (DOH, n.d.).'
  ),
  faqItem(
    4,
    'Requirements for Orientation & Counseling',
    'Do I need to attend an orientation or counseling before using a family planning method?',
    'National policies encourage counseling so that every client understands available methods and can make an informed and voluntary choice. Orientation is recommended before starting, changing, or stopping a method (CPD, n.d.; DOH, n.d.).'
  ),
  faqItem(
    5,
    'Requirements for Orientation & Counseling',
    'Is counseling available in the local language?',
    'Yes. Counseling can be delivered in Filipino or English, and barangay officers may assist clients who need help understanding the materials. The Population Office also coordinates with health units for referrals when needed (CPD, n.d.).'
  ),
  faqItem(
    6,
    'Contraceptives: What to Use and When to Use',
    'How do I know which contraceptive method is right for me?',
    'The suitable method depends on your health, age, future plans for having children, and personal or religious beliefs. A trained provider can help you review the options and support you in choosing what fits your situation (CPD, n.d.; DOH, n.d.).'
  ),
  faqItem(
    7,
    'Contraceptives: What to Use and When to Use',
    'Can adolescents use contraceptives?',
    'Adolescents can receive information and counseling on how to avoid early and unintended pregnancy as part of adolescent health and youth development programs. Any method use should follow national policies and clinical guidelines, with careful counseling to support informed and voluntary decisions (CPD, n.d.; DOH, n.d.).'
  ),
  faqItem(
    8,
    'Contraceptives: What to Use and When to Use',
    'Where can I get family planning services?',
    'Services are available at the Municipal Population Office and through participating health units and barangay health workers. The Population Office can also refer clients to appropriate facilities for methods or services it does not directly provide (DOH, n.d.).'
  ),
  faqItem(
    9,
    'Single but Seeking Family Planning',
    'Can I ask for family planning counseling even if I am not married?',
    'Yes. Information and counseling are available for anyone who needs to understand how to protect their health and plan their future. Services are guided by respect for the rights and dignity of every client (CPD, n.d.; DOH, n.d.).'
  ),
  faqItem(
    10,
    'Single but Seeking Family Planning',
    'Will my questions be kept confidential if I am single and ask about family planning?',
    'Health and population offices follow confidentiality and data privacy rules. Personal information shared during counseling should only be accessed by authorized staff. Clients are encouraged to ask about how their information will be handled (DOH, n.d.).'
  ),
  faqItem(
    11,
    'Pre-Marriage Orientation',
    'Who is required to attend Pre-Marriage Orientation and Counseling?',
    'Couples applying for a marriage license are required to complete the PMOC program before the license can be issued. Sessions cover family planning, legal rights, financial planning, and conflict management (Local Civil Code as amended).'
  ),
  faqItem(
    12,
    'Pre-Marriage Orientation',
    'How long does a PMOC session take and what should I bring?',
    'The session is typically a half-day to a full-day program. Couples should bring a valid ID, proof of address, and their marriage license application details. Please arrive at least fifteen minutes before the scheduled start time.'
  ),
  faqItem(
    13,
    'Usapan-Series',
    'What is the Usapan-Series and how do I join?',
    'Usapan-Series are facilitated group discussions in barangays on responsible parenthood, family planning, teen health, couples communication, and community outreach. Any resident may attend; schedules are posted on the portal calendar.'
  ),
  faqItem(
    14,
    'Usapan-Series',
    'Do barangay officers handle resident requests?',
    'Yes. Barangay officers help residents request Usapan-Series sessions and PMO bookings, especially for clients without reliable internet access. Requests are submitted through the portal or the barangay hall.'
  )
];

// ---------------------------------------------------------------------------
// Calendar / events (single feed serving the public calendar and the admin
// announcements, PMO schedules and Usapan request panels).
// ---------------------------------------------------------------------------
export const mockCalendarEventsFull = [
  // --- Event / Activity ---
  calendarEvent(
    'mock-event-1',
    'Event/Activity',
    'Health Caravan',
    'A mobile health and population awareness campaign in the barangay hall grounds.',
    3, 9, 12,
    'Scheduled',
    { location: 'Barangay Hall Grounds', lead: 'Population Office' }
  ),
  calendarEvent(
    'mock-event-2',
    'Event/Activity',
    'Barangay Officers Coordination',
    'Monthly coordination meeting for barangay officers.',
    -5, 13, 16,
    'Completed',
    { location: 'Municipal Hall - Conference Room', lead: 'Population Office' }
  ),
  calendarEvent(
    'mock-event-6',
    'Event/Activity',
    'Population Awareness Week',
    'IEC activities, poster-making contest and open forum for students.',
    8, 8, 17,
    'Scheduled',
    { location: 'Municipal Gym', lead: 'Population Office' }
  ),
  calendarEvent(
    'mock-event-7',
    'Event/Activity',
    'IEC Campaign: Birth Spacing',
    'Community information campaign on birth spacing and healthy pregnancy timing.',
    12, 9, 12,
    'Scheduled',
    { location: 'Barangay Hall Grounds', lead: 'Population Office' }
  ),
  calendarEvent(
    'mock-event-8',
    'Event/Activity',
    'Health Caravan (cancelled)',
    'This caravan was cancelled due to weather advisories.',
    -9, 8, 12,
    'Cancelled',
    { location: 'Longos Basketball Court', lead: 'Population Office' }
  ),
  calendarEvent(
    'mock-event-9',
    'Event/Activity',
    'Usapan-Series Orientation for Barangays',
    'Orientation for barangay officers on facilitating Usapan-Series sessions.',
    -16, 13, 16,
    'Completed',
    { location: 'Municipal Hall - Conference Room', lead: 'Population Office' }
  ),

  // --- Pre-Marriage Orientation ---
  calendarEvent(
    'mock-event-3',
    'Pre-Marriage Orientation',
    'PMO Counseling Session',
    'Pre-Marriage Orientation and Counseling for registered couples.',
    6, 8, 11,
    'Scheduled',
    {
      details: 'Please bring a valid ID and arrive 15 minutes before the session.',
      location: 'Population Office',
      counselor: 'Maria Barangay Officer',
      counselorID: 1,
      counselor_name: 'Maria Barangay Officer'
    }
  ),
  calendarEvent(
    'mock-event-10',
    'Pre-Marriage Orientation',
    'PMO Counseling Session (Batch 2)',
    'Second batch of registered couples for the current month.',
    13, 13, 16,
    'Scheduled',
    {
      details: '',
      location: 'Population Office',
      counselor: 'Pedro Ramos',
      counselorID: 2,
      counselor_name: 'Pedro Ramos'
    }
  ),
  calendarEvent(
    'mock-event-11',
    'Pre-Marriage Orientation',
    'PMO Counseling Session (completed)',
    'Completed PMO batch for last month.',
    -11, 8, 11,
    'Completed',
    {
      details: '',
      location: 'Population Office',
      counselor: 'Maria Barangay Officer',
      counselorID: 1,
      counselor_name: 'Maria Barangay Officer'
    }
  ),

  // --- Usapan-Series ---
  calendarEvent(
    'mock-event-4',
    'Usapan-Series',
    'Usapan-Series: Poblacion',
    'Facilitated discussion on responsible parenthood for Poblacion residents.',
    9, 9, 11,
    'Scheduled',
    { location: 'Poblacion Barangay Hall', barangay: 'Poblacion' }
  ),
  calendarEvent(
    'mock-event-5',
    'Usapan-Series',
    'Usapan-Series: Longos',
    'Barangay-led Usapan session requested by the Longos barangay council.',
    14, 13, 15,
    'Pending',
    { location: 'Longos', barangay: 'Longos', userID: 4 }
  ),
  calendarEvent(
    'mock-event-12',
    'Usapan-Series',
    'Usapan-Series: Alacan',
    'Request from Alacan for a teen health session.',
    5, 15, 17,
    'Pending',
    { location: 'Alacan', barangay: 'Alacan', userID: 6 }
  ),
  calendarEvent(
    'mock-event-13',
    'Usapan-Series',
    'Usapan-Series: Mabilao',
    'Facilitated discussion on family planning access for Mabilao residents.',
    -7, 9, 11,
    'Completed',
    { location: 'Mabilao Barangay Hall', barangay: 'Mabilao' }
  ),
  calendarEvent(
    'mock-event-14',
    'Usapan-Series',
    'Usapan-Series: Tocok',
    'Request from Tocok for couples communication topics.',
    18, 13, 15,
    'Pending',
    { location: 'Tocok', barangay: 'Tocok', userID: 7 }
  )
];

// Announcements feed used by the /announcements endpoint.
export const mockAnnouncements = [
  {
    id: 'mock-ann-1',
    title: 'Health Caravan',
    description: 'A mobile health and population awareness campaign in the barangay hall grounds.',
    lead: 'Population Office',
    date: dateOnly(3),
    startTime: '09:00',
    endTime: '12:00',
    location: 'Barangay Hall Grounds',
    status: 'Scheduled'
  },
  {
    id: 'mock-ann-2',
    title: 'PMO Counseling Session',
    description: 'A walk-in counseling session for couples preparing for family planning decisions.',
    lead: 'Population Office',
    date: dateOnly(6),
    startTime: '08:00',
    endTime: '10:00',
    location: 'Population Office',
    status: 'Scheduled'
  },
  {
    id: 'mock-ann-3',
    title: 'Population Awareness Week',
    description: 'IEC activities, poster-making contest and open forum for students.',
    lead: 'Population Office',
    date: dateOnly(8),
    startTime: '08:00',
    endTime: '17:00',
    location: 'Municipal Gym',
    status: 'Scheduled'
  },
  {
    id: 'mock-ann-4',
    title: 'Usapan-Series: Poblacion',
    description: 'Barangay-led discussion on responsible parenthood for Poblacion residents.',
    lead: 'Barangay Council',
    date: dateOnly(9),
    startTime: '09:00',
    endTime: '11:00',
    location: 'Poblacion Barangay Hall',
    status: 'Scheduled'
  },
  {
    id: 'mock-ann-5',
    title: 'Barangay Officers Coordination',
    description: 'Monthly coordination meeting for barangay officers.',
    lead: 'Population Office',
    date: dateOnly(-5),
    startTime: '13:00',
    endTime: '16:00',
    location: 'Municipal Hall - Conference Room',
    status: 'Completed'
  },
  {
    id: 'mock-ann-6',
    title: 'IEC Campaign: Birth Spacing',
    description: 'Community information campaign on birth spacing and healthy pregnancy timing.',
    lead: 'Population Office',
    date: dateOnly(12),
    startTime: '09:00',
    endTime: '12:00',
    location: 'Barangay Hall Grounds',
    status: 'Scheduled'
  }
];

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
export const mockFeedback = [
  feedbackItem('mock-feedback-1', 'Maria Santos', 'Poblacion', 'The materials were clear and the staff were very accommodating.', 'NEW', -1, 'maria@example.com', '09151234567'),
  feedbackItem('mock-feedback-2', 'Juan Dela Cruz', 'Longos', 'I would appreciate more weekend counseling sessions.', 'REVIEWED', -4, 'juan@example.com', '09159876543'),
  feedbackItem('mock-feedback-3', 'Andrea Lim', 'Mabilao', 'Thank you for the quick response to my inquiry about family planning.', 'NEW', -9, 'andrea@example.com', '09150001111'),
  feedbackItem('mock-feedback-4', 'Ricardo Belen', 'Alacan', 'The Usapan-Series in our barangay was very helpful for our youth.', 'READ', -13, 'ricardo@example.com', '09152223344'),
  feedbackItem('mock-feedback-5', 'Elena Aquino', 'Tocok', 'Please post the PMOC schedule earlier so couples can plan ahead.', 'NEW', -16, 'elena@example.com', '09154445566'),
  feedbackItem('mock-feedback-6', 'Miguel Yumul', 'Nibaliw East', 'Is there a way to request a home visit for an elderly client?', 'REVIEWED', -21, 'miguel@example.com', '09156667788'),
  feedbackItem('mock-feedback-7', 'Cristina Bala', 'Binday', 'The health caravan was well organized. More frequent schedules please.', 'READ', -27, 'cristina@example.com', '09157778899'),
  feedbackItem('mock-feedback-8', 'Dennis Corpuz', 'Poblacion', 'The website is easy to navigate and the FAQs answered most of my questions.', 'NEW', -34, 'dennis@example.com', '09158889900')
];

export const mockClientSatisfactionFeedback = [
  clientSatisfaction('mock-cs-1', 'Internal', 'Pre-Marriage Orientation', 'Female', 28, -3, 'Very informative session. Maybe add more examples.'),
  clientSatisfaction('mock-cs-2', 'External', 'Usapan-Series', 'Male', 32, -7, 'The facilitators were approachable and patient with questions.'),
  clientSatisfaction('mock-cs-3', 'Internal', 'Family Planning', 'Female', 35, -11, 'Quick and confidential. The counselor explained the options clearly.'),
  clientSatisfaction('mock-cs-4', 'External', 'Adolescent Health Program', 'Female', 17, -15, 'Friendly and non-judgmental. I learned a lot about my health.'),
  clientSatisfaction('mock-cs-5', 'Internal', 'Pre-Marriage Orientation', 'Male', 30, -19, 'Useful topics. The budget planning session was especially helpful.'),
  clientSatisfaction('mock-cs-6', 'External', 'Population Profiling', 'Male', 45, -24, 'The barangay visit was efficient and the staff were polite.')
];

// ---------------------------------------------------------------------------
// Appointments (Usapan / Pre-Marriage requests shown to admins)
// ---------------------------------------------------------------------------
export const mockAppointments = [
  appointment('mock-appointment-1', 'pre-marriage-orientation', 'Angela Morado', 'Poblacion', 'PENDING', -1, 5),
  appointment('mock-appointment-2', 'usapan-series', 'Ramon Flores', 'Longos', 'APPROVED', -3, 10),
  appointment('mock-appointment-3', 'usapan-series', 'Liza Mercado', 'Mabilao', 'PENDING', -2, 12),
  appointment('mock-appointment-4', 'usapan-series', 'Cristina Bala', 'Binday', 'PENDING', -5, 7),
  appointment('mock-appointment-5', 'pre-marriage-orientation', 'Dennis Corpuz', 'Alacan', 'APPROVED', -8, 4),
  appointment('mock-appointment-6', 'usapan-series', 'Elena Aquino', 'Tocok', 'CANCELLED', -12, -2),
  appointment('mock-appointment-7', 'usapan-series', 'Ricardo Belen', 'Nibaliw East', 'COMPLETED', -18, -6)
];

// ---------------------------------------------------------------------------
// Family Planning bookings
// ---------------------------------------------------------------------------
export const mockFamilyPlanningBookings = [
  fpBooking('mock-fp-1', 'PENDING', 'Rosa Dela Cruz', 'Poblacion', 24, 'Female', 4, 'Wants to learn about available family planning methods.', -1),
  fpBooking('mock-fp-2', 'APPROVED', 'Mark Villanueva', 'Longos', 29, 'Male', 2, 'Follow-up consultation.', -5),
  fpBooking('mock-fp-3', 'PENDING', 'Nena Bautista', 'Mabilao', 35, 'Female', 8, 'Requests a home visit for counselling.', -2),
  fpBooking('mock-fp-4', 'APPROVED', 'Marites Cruz', 'Alacan', 27, 'Female', 6, 'Wants to start a modern contraceptive method.', -9),
  fpBooking('mock-fp-5', 'REJECTED', 'Joel Pangilinan', 'Tocok', 41, 'Male', 1, 'Requested a home visit outside the service area.', -14),
  fpBooking('mock-fp-6', 'PENDING', 'Rhea Sampang', 'Binday', 22, 'Female', 9, 'First pregnancy and wants counseling on birth spacing.', -3),
  fpBooking('mock-fp-7', 'CANCELLED', 'Carlo Aquino', 'Nibaliw East', 33, 'Male', 3, 'Rescheduled to a later date by the client.', -11),
  fpBooking('mock-fp-8', 'APPROVED', 'Gloria Mendoza', 'Sagud-Bahley', 30, 'Female', 11, 'Pre-marriage counseling for a couple.', -20)
];

// ---------------------------------------------------------------------------
// Counselors
// ---------------------------------------------------------------------------
export const mockCounselors = [
  counselor(1, 'Maria Barangay Officer', 'officer@sanfabian.gov.ph', '09151234567', true),
  counselor(2, 'Pedro Ramos', 'pedro@sanfabian.gov.ph', '09150000004', true),
  counselor(3, 'Ana Reyes', 'ana@sanfabian.gov.ph', '09150000005', false),
  counselor(4, 'Liza Mendoza', 'liza@sanfabian.gov.ph', '09150000006', true),
  counselor(5, 'Carlo Aquino', 'carlo@sanfabian.gov.ph', '09150000007', false)
];

// ---------------------------------------------------------------------------
// Organization hierarchy & main office (Contact page)
// ---------------------------------------------------------------------------
export const mockHierarchy = [
  { id: 1, name: 'Hon. Mayor (Municipality of San Fabian)', position: 'Mayor' },
  { id: 2, name: 'Hon. Vice Mayor (Municipality of San Fabian)', position: 'Vice Mayor' },
  { id: 3, name: 'Population Office Head', position: 'Population Office Head' },
  { id: 4, name: 'Population Office Staff', position: 'Population Office Staff' },
  { id: 5, name: 'Bessie Disu (Alacan)', position: 'Barangay Representative' },
  { id: 6, name: 'Pedro Ramos (Longos)', position: 'Barangay Representative' },
  { id: 7, name: 'Ana Reyes (Mabilao)', position: 'Barangay Representative' }
];

export const mockMainOffice = {
  id: 1,
  officeName: 'Municipal Population Office',
  officeHead: 'Population Office Head',
  address: 'Municipal Hall, San Fabian, Pangasinan',
  contactNumber: '0915-811-2320',
  email: 'sanfabian.munpopcom@gmail.com',
  description:
    'The Municipal Population Office delivers population and development programs for the residents of San Fabian, Pangasinan.',
  imageUrl: ''
};

// ---------------------------------------------------------------------------
// Education Corner: web content + booklets
// ---------------------------------------------------------------------------
export const mockEducationWeb = [
  {
    id: 'mock-web-1',
    title: 'Basics of Family Planning',
    label: 'Family Planning',
    overview: 'A quick overview of family planning methods, how to access services, and where to seek advice.',
    purpose: 'Help residents understand the range of family planning options available to them.',
    benefits: ['Informed choice of method', 'Better birth spacing', 'Improved maternal health'],
    limitations: ['Requires counseling before use', 'Effectiveness depends on correct use'],
    limitationsOrNotes: 'Consult a trained provider before starting any method.',
    youtubeVideoUrl: '',
    videoUrl: '',
    imageThumbnailUrl: thumbBenefits,
    imageUrl: thumbBenefits,
    visualImageUrl: diagramImplantation,
    isPublished: true,
    displayOrder: 1,
    createdAt: iso(-30)
  },
  {
    id: 'mock-web-2',
    title: 'Maternal Health Checklist',
    label: 'Maternal Health',
    overview: 'A checklist of prenatal care milestones, recommended consultations, and nutrition guidance.',
    purpose: 'Support healthy pregnancies through timely prenatal care.',
    benefits: ['Early detection of risks', 'Healthier pregnancies'],
    limitations: ['Does not replace professional medical advice'],
    limitationsOrNotes: '',
    youtubeVideoUrl: '',
    videoUrl: '',
    imageThumbnailUrl: thumbImplantation,
    imageUrl: thumbImplantation,
    visualImageUrl: diagramInjectable,
    isPublished: true,
    displayOrder: 2,
    createdAt: iso(-25)
  },
  {
    id: 'mock-web-3',
    title: 'Responsible Parenthood and Family Development',
    label: 'RPFP',
    overview: 'Guidance on raising healthy, responsible children and supporting a couple\u2019s shared responsibilities.',
    purpose: 'Strengthen parenting roles and family wellbeing.',
    benefits: ['Stronger parent-child bonds', 'Better household budgeting'],
    limitations: [],
    limitationsOrNotes: '',
    youtubeVideoUrl: '',
    videoUrl: '',
    imageThumbnailUrl: thumbLAM,
    imageUrl: thumbLAM,
    visualImageUrl: diagramJointFertility,
    isPublished: true,
    displayOrder: 3,
    createdAt: iso(-40)
  },
  {
    id: 'mock-web-4',
    title: 'Adolescent Health and Development Program',
    label: 'AHDP',
    overview: 'Age-appropriate health education for adolescents covering puberty, mental health, and peer pressure.',
    purpose: 'Help young people make informed and healthy decisions.',
    benefits: ['Better health awareness', 'Reduced risk of early pregnancy'],
    limitations: ['Facilitators must be trained youth workers'],
    limitationsOrNotes: 'Sessions are open to adolescents with parental consent where required.',
    youtubeVideoUrl: '',
    videoUrl: '',
    imageThumbnailUrl: thumbStandardDays,
    imageUrl: thumbStandardDays,
    visualImageUrl: diagramCondom,
    isPublished: true,
    displayOrder: 4,
    createdAt: iso(-35)
  },
  {
    id: 'mock-web-5',
    title: 'Population Awareness and IEC Materials',
    label: 'IEC',
    overview: 'Posters, tarpaulin texts and flyers on population and development used in barangay activities.',
    purpose: 'Spread accurate population information across communities.',
    benefits: ['Wider community reach', 'Consistent messaging'],
    limitations: [],
    limitationsOrNotes: '',
    youtubeVideoUrl: '',
    videoUrl: '',
    imageThumbnailUrl: thumbCondom,
    imageUrl: thumbCondom,
    visualImageUrl: diagramIUD,
    isPublished: true,
    displayOrder: 5,
    createdAt: iso(-18)
  }
];

// Key concepts referenced by the web content detail pages.
export const mockEducationWebKeyConcepts = [
  {
    id: 'mock-kc-1',
    webId: 'mock-web-1',
    conceptTitle: 'What is family planning?',
    conceptDescription:
      'Family planning lets individuals and couples decide freely on the number and spacing of their children.\n- Access to information and services\n- Voluntary and informed choice'
  },
  {
    id: 'mock-kc-2',
    webId: 'mock-web-1',
    conceptTitle: 'Where to get help',
    conceptDescription: 'Visit the Municipal Population Office or your nearest health facility for counseling.'
  },
  {
    id: 'mock-kc-3',
    webId: 'mock-web-1',
    conceptTitle: 'Commonly used methods',
    conceptDescription:
      'Modern methods include pills, condoms, injectables, intrauterine devices (IUDs) and implants.\n- Long-acting methods require less daily effort\n- Some methods also help prevent STIs'
  },
  {
    id: 'mock-kc-4',
    webId: 'mock-web-2',
    conceptTitle: 'Prenatal visit schedule',
    conceptDescription:
      'The first prenatal visit should happen as early as possible in pregnancy.\n- Monthly visits in the first four months\n- More frequent visits later in pregnancy'
  },
  {
    id: 'mock-kc-5',
    webId: 'mock-web-4',
    conceptTitle: 'What adolescents should know',
    conceptDescription:
      'Adolescents can access health information and counseling.\n- Menstrual health and hygiene\n- Consent and healthy relationships'
  },
  {
    id: 'mock-kc-6',
    webId: 'mock-web-3',
    conceptTitle: 'Shared parenting responsibilities',
    conceptDescription:
      'Partners should share household work and child care.\n- Discuss finances openly before a child is born\n- Make decisions together'
  }
];

export const mockBooklets = [
  {
    id: 'mock-booklet-1',
    title: 'Family Planning Methods Brochure',
    imageThumbnailUrl: bookletRisks1,
    imageUrl: bookletRisks1,
    brochureContentNumber: 1,
    isPublished: true,
    displayOrder: 1,
    createdAt: iso(-28),
    pages: [
      { id: 'mock-page-1', bookletId: 'mock-booklet-1', pageNumber: 1, imageUrl: bookletRisks1 },
      { id: 'mock-page-2', bookletId: 'mock-booklet-1', pageNumber: 2, imageUrl: bookletRisks2 },
      { id: 'mock-page-3', bookletId: 'mock-booklet-1', pageNumber: 3, imageUrl: bookletRisks3 }
    ]
  },
  {
    id: 'mock-booklet-2',
    title: 'Adolescent Health Factsheet',
    imageThumbnailUrl: bookletTeen1,
    imageUrl: bookletTeen1,
    brochureContentNumber: 1,
    isPublished: true,
    displayOrder: 2,
    createdAt: iso(-22),
    pages: [
      { id: 'mock-page-4', bookletId: 'mock-booklet-2', pageNumber: 1, imageUrl: bookletTeen1 },
      { id: 'mock-page-5', bookletId: 'mock-booklet-2', pageNumber: 2, imageUrl: bookletTeen2 },
      { id: 'mock-page-6', bookletId: 'mock-booklet-2', pageNumber: 3, imageUrl: bookletTeen3 }
    ]
  },
  {
    id: 'mock-booklet-3',
    title: 'Maternal and Child Health Guide',
    imageThumbnailUrl: bookletWait1,
    imageUrl: bookletWait1,
    brochureContentNumber: 1,
    isPublished: true,
    displayOrder: 3,
    createdAt: iso(-15),
    pages: [
      { id: 'mock-page-7', bookletId: 'mock-booklet-3', pageNumber: 1, imageUrl: bookletWait1 },
      { id: 'mock-page-8', bookletId: 'mock-booklet-3', pageNumber: 2, imageUrl: bookletWait2 }
    ]
  }
];

// ---------------------------------------------------------------------------
// File tasks (admin document reports + officer submissions)
// ---------------------------------------------------------------------------
export const mockFileTasks = [
  fileTask('mock-filetask-1', 'Quarterly Barangay Population Report', 'Submit the population report for the current quarter.', 'Poblacion', 'Maria Barangay Officer', 'OVERDUE', -3, -20, false),
  fileTask('mock-filetask-2', 'Accomplishment Report', 'Upload the latest accomplishment report for your barangay.', 'Longos', 'Pedro Ramos', 'PENDING', 10, -6, false),
  fileTask('mock-filetask-3', 'Usapan Attendance Sheet', 'Upload the signed attendance sheet for the Usapan-Series session.', 'Poblacion', 'Maria Barangay Officer', 'SUBMITTED', 5, -12, true),
  fileTask('mock-filetask-4', 'Family Planning Referral Log', 'Submit the log of residents referred to family planning services.', 'Mabilao', 'Ana Reyes', 'OVERDUE', -1, -25, false),
  fileTask('mock-filetask-5', 'Barangay Health Profile', 'Update your barangay health profile for the current year.', 'Alacan', 'Liza Mendoza', 'PENDING', 18, -3, false),
  fileTask('mock-filetask-6', 'IEC Distribution Report', 'Report the number of IEC materials distributed in your barangay.', 'Tocok', 'Carlo Aquino', 'SUBMITTED', 2, -10, true)
];

// ---------------------------------------------------------------------------
// Pre-Marriage Orientation (PMO) schedules & questionnaire
// ---------------------------------------------------------------------------
export const mockPmoSchedules = [
  pmoSchedule(1, 6, 8, 11, 1, 'Maria Barangay Officer', 'Scheduled', 'Registration starts at 07:45 AM.'),
  pmoSchedule(2, 13, 13, 16, 2, 'Pedro Ramos', 'Scheduled', 'Afternoon batch for registered couples.'),
  pmoSchedule(3, 20, 8, 11, 1, 'Maria Barangay Officer', 'Scheduled', ''),
  pmoSchedule(4, 27, 13, 16, 4, 'Liza Mendoza', 'Scheduled', ''),
  pmoSchedule(5, -7, 8, 11, 1, 'Maria Barangay Officer', 'Completed', ''),
  pmoSchedule(6, -14, 13, 16, 2, 'Pedro Ramos', 'Cancelled', 'Cancelled due to a scheduling conflict.')
];

export const mockPmoQuestionnaire = [
  pmoQuestion(1, 'What is your understanding of responsible parenthood?', 'Standalone', null, 1),
  pmoQuestion(2, 'Are you currently using a family planning method?', 'Filler', null, 2),
  pmoQuestion(3, 'If yes, which method are you using?', 'Sub-question', 2, 3),
  pmoQuestion(4, 'Do you feel ready to start a family?', 'Filler', null, 4),
  pmoQuestion(5, 'What do you hope to learn from this program?', 'Standalone', null, 5),
  pmoQuestion(6, 'How do you both handle disagreements?', 'Filler', null, 6),
  pmoQuestion(7, 'Who usually manages the household finances?', 'Filler', null, 7),
  pmoQuestion(8, 'Is there anything else you would like us to know?', 'Standalone', null, 8),
  pmoQuestion(9, 'Couple reference number (internal use only)', 'Standalone', null, 0, true)
];

// PMO questionnaire answers (one row per couple).
export const mockPmoAnswers = [
  {
    coupleID: 1,
    created_at: iso(-8),
    referenceNumber: 'PMO-2026-0001',
    husband_name: 'Ramon Flores',
    wife_name: 'Angela Morado',
    answers: [
      {
        questionID: 1,
        question_text: 'What is your understanding of responsible parenthood?',
        question_type: 'Standalone',
        isHusband: true,
        answer: 'It means providing for and guiding our children.',
        reason: 'We want to be prepared before starting a family.'
      },
      {
        questionID: 1,
        question_text: 'What is your understanding of responsible parenthood?',
        question_type: 'Standalone',
        isHusband: false,
        answer: 'Planning and caring for our family together.',
        reason: ''
      },
      {
        questionID: 2,
        question_text: 'Are you currently using a family planning method?',
        question_type: 'Filler',
        isHusband: true,
        answer: 'No',
        reason: 'We plan to start after the wedding.'
      },
      {
        questionID: 2,
        question_text: 'Are you currently using a family planning method?',
        question_type: 'Filler',
        isHusband: false,
        answer: 'No',
        reason: ''
      }
    ]
  },
  {
    coupleID: 2,
    created_at: iso(-15),
    referenceNumber: 'PMO-2026-0002',
    husband_name: 'Mark Villanueva',
    wife_name: 'Rosa Dela Cruz',
    answers: [
      {
        questionID: 1,
        question_text: 'What is your understanding of responsible parenthood?',
        question_type: 'Standalone',
        isHusband: true,
        answer: 'Raising children with good values and enough resources.',
        reason: 'We attended this to learn how to prepare financially.'
      },
      {
        questionID: 1,
        question_text: 'What is your understanding of responsible parenthood?',
        question_type: 'Standalone',
        isHusband: false,
        answer: 'Balancing work, family and health.',
        reason: ''
      }
    ]
  },
  {
    coupleID: 3,
    created_at: iso(-26),
    referenceNumber: 'PMO-2026-0003',
    husband_name: 'Dennis Corpuz',
    wife_name: 'Marites Cruz',
    answers: [
      {
        questionID: 1,
        question_text: 'What is your understanding of responsible parenthood?',
        question_type: 'Standalone',
        isHusband: true,
        answer: 'Being able to support a child emotionally and financially.',
        reason: ''
      },
      {
        questionID: 1,
        question_text: 'What is your understanding of responsible parenthood?',
        question_type: 'Standalone',
        isHusband: false,
        answer: 'Sharing responsibilities equally as partners.',
        reason: 'We want a healthy relationship for our child.'
      }
    ]
  }
];

// PMO appointments shown in the admin appointments table.
export const mockPmoAppointments = [
  {
    appointmentID: 1,
    id: 1,
    status: 'PENDING',
    referenceNumber: 'PMO-2026-0001',
    scheduleDate: dateOnly(6),
    scheduleStartTime: '08:00:00',
    scheduleEndTime: '11:00:00',
    counselor: 1,
    counselor_name: 'Maria Barangay Officer',
    husband_name: 'Ramon Flores',
    wife_name: 'Angela Morado',
    contact_number: '09151112222',
    created_at: iso(-1)
  },
  {
    appointmentID: 2,
    id: 2,
    status: 'APPROVED',
    referenceNumber: 'PMO-2026-0002',
    scheduleDate: dateOnly(13),
    scheduleStartTime: '13:00:00',
    scheduleEndTime: '16:00:00',
    counselor: 2,
    counselor_name: 'Pedro Ramos',
    husband_name: 'Mark Villanueva',
    wife_name: 'Rosa Dela Cruz',
    contact_number: '09159879879',
    created_at: iso(-5)
  },
  {
    appointmentID: 3,
    id: 3,
    status: 'PENDING',
    referenceNumber: 'PMO-2026-0003',
    scheduleDate: dateOnly(20),
    scheduleStartTime: '08:00:00',
    scheduleEndTime: '11:00:00',
    counselor: 1,
    counselor_name: 'Maria Barangay Officer',
    husband_name: 'Dennis Corpuz',
    wife_name: 'Marites Cruz',
    contact_number: '09152223344',
    created_at: iso(-3)
  },
  {
    appointmentID: 4,
    id: 4,
    status: 'APPROVED',
    referenceNumber: 'PMO-2026-0004',
    scheduleDate: dateOnly(-7),
    scheduleStartTime: '08:00:00',
    scheduleEndTime: '11:00:00',
    counselor: 1,
    counselor_name: 'Maria Barangay Officer',
    husband_name: 'Joel Pangilinan',
    wife_name: 'Rhea Sampang',
    contact_number: '09154445566',
    created_at: iso(-14)
  }
];

// SMS delivery logs.
export const mockPmoSmsLogs = [
  {
    id: 'mock-sms-1',
    recipient: '09151112222',
    message: 'Your PMO appointment has been received. Reference: PMO-2026-0001.',
    eventType: 'submitted',
    status: 'SENT',
    errorMessage: null,
    createdAt: iso(-1)
  },
  {
    id: 'mock-sms-2',
    recipient: '09159879879',
    message: 'Your PMO appointment has been approved.',
    eventType: 'accepted',
    status: 'FAILED',
    errorMessage: 'Insufficient balance',
    createdAt: iso(-2)
  },
  {
    id: 'mock-sms-3',
    recipient: '09152223344',
    message: 'Reminder: your PMO session is scheduled. Reference: PMO-2026-0003.',
    eventType: 'reminder',
    status: 'SENT',
    errorMessage: null,
    createdAt: iso(-4)
  },
  {
    id: 'mock-sms-4',
    recipient: '09154445566',
    message: 'Your PMO appointment has been approved.',
    eventType: 'accepted',
    status: 'SENT',
    errorMessage: null,
    createdAt: iso(-6)
  },
  {
    id: 'mock-sms-5',
    recipient: '09157778899',
    message: 'Your request was rejected. Please contact the Population Office.',
    eventType: 'rejected',
    status: 'FAILED',
    errorMessage: 'Invalid number',
    createdAt: iso(-9)
  },
  {
    id: 'mock-sms-6',
    recipient: '09158889900',
    message: 'Thank you for completing the client satisfaction survey.',
    eventType: 'survey',
    status: 'SENT',
    errorMessage: null,
    createdAt: iso(-12)
  }
];

// ---------------------------------------------------------------------------
// Analytics (admin dashboards)
//
// Derived from the datasets above so the dashboard numbers always agree with the
// tables shown next to them.
// ---------------------------------------------------------------------------

// "YYYY-MM-01" bucket for an ISO date, which is what the charts group by.
const monthOf = (value) => {
  const s = String(value || '');
  return s.length >= 7 ? `${s.slice(0, 7)}-01` : null;
};

const yearOf = (value) => {
  const s = String(value || '');
  return s.length >= 4 ? s.slice(0, 4) : null;
};

const countBy = (rows, keyFn) =>
  rows.reduce((acc, row) => {
    const key = keyFn(row);
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const countRowsBy = (rows, keyFn) =>
  Object.entries(countBy(rows, keyFn))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ month: key, count }));

const countRowsByYear = (rows, keyFn) =>
  Object.entries(countBy(rows, keyFn))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

const statusCounts = (rows, statuses) =>
  statuses.map((status) => ({
    status,
    count: rows.filter((r) => String(r.status || '').toUpperCase() === status.toUpperCase()).length
  }));

export const mockUsersAnalytics = {
  totalUsers: mockUsers.length,
  accountsPerBarangay: Object.entries(
    mockUsers.reduce((acc, u) => {
      if (u.barangay) acc[u.barangay] = (acc[u.barangay] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count || a.barangay.localeCompare(b.barangay)),
  usersMonthly: countRowsBy(mockUsers, (u) => monthOf(u.createdAt))
};

export const mockFeedbackAnalytics = {
  totalFeedback: mockFeedback.length,
  feedbackMonthly: countRowsBy(mockFeedback, (f) => monthOf(f.created_at)),
  clientFeedbackMonthly: countRowsBy(mockClientSatisfactionFeedback, (f) => monthOf(f.date)),
  feedbackByBarangayMonthly: mockFeedback.map((f) => ({
    month: monthOf(f.created_at),
    barangay: f.barangay,
    count: 1
  }))
};

export const mockFamilyPlanningAnalytics = {
  monthly: countRowsBy(mockFamilyPlanningBookings, (b) => monthOf(b.created_at)),
  statusCounts: statusCounts(mockFamilyPlanningBookings, [
    'Pending',
    'Approved',
    'Rejected',
    'Cancelled'
  ])
};

export const mockPmoAnalytics = {
  schedulesMonthly: countRowsBy(mockPmoSchedules, (s) => monthOf(s.date)),
  appointmentsMonthly: countRowsBy(mockPmoAppointments, (a) => monthOf(a.scheduleDate)),
  schedulesYearly: countRowsByYear(mockPmoSchedules, (s) => yearOf(s.date)),
  appointmentsYearly: countRowsByYear(mockPmoAppointments, (a) => yearOf(a.scheduleDate)),
  appointmentStatusCounts: statusCounts(mockPmoAppointments, [
    'Pending',
    'Approved',
    'Rejected',
    'Cancelled'
  ]),
  scheduleStatusCounts: statusCounts(mockPmoSchedules, ['Scheduled', 'Completed', 'Cancelled'])
};

// ---------------------------------------------------------------------------
// Site-wide search results
// ---------------------------------------------------------------------------
export const mockSearchResults = [
  { title: 'Pre-Marriage Orientation & Counseling', snippet: 'Schedules and booking for PMOC.', href: '/services/pre-marriage-orientation', type: 'Service' },
  { title: 'Usapan Series', snippet: 'Barangay sessions on responsible parenthood.', href: '/services/usapan-series', type: 'Service' },
  { title: 'Family Planning', snippet: 'Learn about available family planning methods.', href: '/services/rpfp', type: 'Service' },
  { title: 'Adolescent Health and Development Program', snippet: 'Youth programs on teen health and empowerment.', href: '/services/ahdp', type: 'Service' },
  { title: 'Population Awareness & IEC Activities', snippet: 'Community education campaigns and materials.', href: '/services/iec', type: 'Service' },
  { title: 'Demographic Data Collection', snippet: 'Assistance with population data collection and profiling.', href: '/services/population-profiling', type: 'Service' },
  { title: 'Support During Community Events', snippet: 'LGU caravans and mobile population education support.', href: '/services/community-events', type: 'Service' },
  { title: 'Other Assistance', snippet: 'Referral-based assistance depending on arrangements.', href: '/services/other-assistance', type: 'Service' },
  { title: 'Health Caravan', snippet: 'A mobile health and population awareness campaign.', href: '/news/mock-news-1', type: 'Announcement' },
  { title: 'Population Awareness Week', snippet: 'IEC activities, poster contest and open forum for students.', href: '/news/mock-news-6', type: 'Announcement' },
  { title: 'Calendar of Activities', snippet: 'View upcoming schedules, activities, and events.', href: '/calendar', type: 'Page' },
  { title: 'Education Corner', snippet: 'Learning materials and educational content.', href: '/education', type: 'Page' },
  { title: 'FAQs', snippet: 'Frequently asked questions on family planning.', href: '/faqs', type: 'Page' },
  { title: 'Contact the Municipal Population Office', snippet: 'Reach the Population Office and our staff.', href: '/contact', type: 'Page' }
];

// ---------------------------------------------------------------------------
// Services catalog (mirrors the /services endpoint shape). The slugs match the
// routes in App.jsx so the Services page can link to each detail page.
// ---------------------------------------------------------------------------
export const mockServicesList = [
  { id: 1, name: 'Pre-Marriage Orientation', slug: 'pre-marriage-orientation', description: 'Orientation session and counseling for couples planning to get married.', isActive: true },
  { id: 2, name: 'Usapan-Series', slug: 'usapan-series', description: 'Facilitated discussion series for barangay-led population and development topics.', isActive: true },
  { id: 3, name: 'Family Planning', slug: 'rpfp', description: 'Seminars on responsible parenthood for couples, parents, and youth.', isActive: true },
  { id: 4, name: 'Adolescent Health and Development Program', slug: 'ahdp', description: 'Youth-centered programs for teen pregnancy prevention education and youth empowerment.', isActive: true },
  { id: 5, name: 'Population Awareness & IEC Activities', slug: 'iec', description: 'Community education campaigns and distribution of flyers, posters and tarpaulins.', isActive: true },
  { id: 6, name: 'Demographic Data Collection & Population Profiling', slug: 'population-profiling', description: 'Assistance in collecting population data and maintaining demographic records.', isActive: true },
  { id: 7, name: 'Support During Community Events', slug: 'community-events', description: 'Population office support for LGU caravans and community events.', isActive: true },
  { id: 8, name: 'Other Assistance', slug: 'other-assistance', description: 'Referral-based assistance depending on municipal arrangements.', isActive: false }
];
