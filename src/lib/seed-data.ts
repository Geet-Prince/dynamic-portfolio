import type {
  AeoFaq,
  Credential,
  ProfileConfig,
  Project,
  Skill,
  ThemeConfig,
} from "./types";

export const seedProfile: ProfileConfig = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Prince Raj",
  handle: "Geet-Prince",
  headline: "Software Engineer & Data Science Specialist.",
  subheadline:
    "Building high-performance full-stack systems, competitive programming analytics, and data-driven applications. B.Tech CSE (Data Science) at NIET Greater Noida.",
  institution:
    "Noida Institute of Engineering and Technology (NIET), Greater Noida",
  institution_short: "NIET Greater Noida",
  degree:
    "Bachelor of Technology (B.Tech) in Computer Science and Engineering (Data Science)",
  location: "Greater Noida, Uttar Pradesh, India",
  bio_markdown: `I am **Prince Raj (Geet-Prince)**, a B.Tech Computer Science (Data Science) undergraduate at the **Noida Institute of Engineering and Technology (NIET), Greater Noida**.

I specialise in **scalable backend architectures** (Core Java, Spring Boot, Python, Flask, REST APIs) and **data-driven systems** (SQL, NumPy, Pandas, Matplotlib) — with a frontend craft in React and JavaScript, and a daily-driver Linux workflow across **Ubuntu and Linux Mint**.

Proof of work: **270+ Data Structures & Algorithms problems** solved across LeetCode, GeeksforGeeks and CodeChef — tracked live on my analytics platform **Progex (progex.geetprince.me)**. I am an **AWS Certified Cloud Practitioner** and an active hackathon builder (Agentic AI Hackathon, Code Nakshatra).`,
  email: "contact@geetprince.me",
  avatar_url: "/avatar.jpg",
  resume_url: "/Prince_Raj_Resume.pdf",
  github_url: "https://github.com/Geet-Prince",
  linkedin_url: "https://linkedin.com/in/geet-prince",
  leetcode_url: "https://leetcode.com/u/Geet-Prince/",
  huggingface_url: "https://huggingface.co/Geet-Prince",
  progex_url: "https://progex.geetprince.me",
  dsa_solved_count: 270,
  availability_status: true,
  availability_text: "Available for Software Engineering & Data Science Roles",
  seo_keywords: [
    "Prince Raj",
    "Geet-Prince",
    "geetprince",
    "NIET Prince Raj",
    "Prince Raj NIET Greater Noida",
    "Noida Institute of Engineering and Technology Prince Raj",
    "Prince Raj Data Science",
    "Prince Raj Software Engineer",
    "Progex Prince Raj",
  ],
  updated_at: new Date().toISOString(),
};

export const seedProjects: Project[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Progex",
    slug: "progex",
    tagline: "Competitive-programming analytics platform tracking 270+ DSA solves.",
    description_markdown: `**Progex (progex.geetprince.me)** is Prince Raj's flagship analytics platform for competitive programming.

It aggregates solved problems across **LeetCode, GeeksforGeeks and CodeChef**, visualises topic-wise mastery and streaks, and serves as live algorithmic proof for recruiters.

Built as a high-performance full-stack app with a clean Apple-grade UI, REST data pipelines, and a monitored production deployment.`,
    architecture_highlights: [
      "Multi-platform DSA aggregation pipeline (LeetCode, GFG, CodeChef)",
      "Topic-wise mastery analytics with streak tracking",
      "ISR-cached dashboards for sub-second loads",
      "Monitored production deployment with live status badge",
    ],
    live_url: "https://progex.geetprince.me",
    github_url: "https://github.com/Geet-Prince",
    thumbnail_url: null,
    tech_stack: ["React", "JavaScript", "REST APIs", "Python", "SQL"],
    category: "Full-Stack",
    metrics_badge: "270+ DSA tracked · Live",
    is_featured: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    title: "Eventify",
    slug: "eventify",
    tagline: "Full-stack event management platform with auth, bookings & dashboards.",
    description_markdown: `**Eventify** is a full-stack event management platform: create events, manage registrations, and track attendees from a single dashboard.

Features secure authentication, RESTful backend services, and a responsive React frontend. Designed with scalable Spring Boot / Flask-style service boundaries and a relational data model.`,
    architecture_highlights: [
      "Auth + role-scoped event management",
      "RESTful booking and registration APIs",
      "Responsive dashboard with real-time counts",
    ],
    live_url: null,
    github_url: "https://github.com/Geet-Prince",
    thumbnail_url: null,
    tech_stack: ["React", "JavaScript", "Spring Boot", "Core Java", "SQL", "REST APIs"],
    category: "Full-Stack",
    metrics_badge: "Full-Stack",
    is_featured: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    title: "Verse",
    slug: "verse",
    tagline: "Interactive online music streaming app with real-time synchronized listening rooms.",
    description_markdown: `**Verse** is an interactive online music streaming application built around **real-time synchronized listening rooms** — everyone in a room hears the same track at the same moment.

It combines a React web client with a Kotlin service layer and Firebase (Realtime Database + Auth) for presence, synchronised playback state and instant room updates.`,
    architecture_highlights: [
      "Real-time synchronized listening rooms (shared playback state)",
      "Firebase Realtime Database presence + sync",
      "React client with a Kotlin service layer",
      "Live room membership and playback controls",
    ],
    live_url: null,
    github_url: "https://github.com/Geet-Prince",
    thumbnail_url: null,
    tech_stack: ["React", "Kotlin", "Firebase", "JavaScript"],
    category: "Full-Stack",
    metrics_badge: "Real-time rooms",
    is_featured: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    title: "Accenture Coding Practice Sandbox",
    slug: "accenture-coding-practice-sandbox",
    tagline: "Curated on-campus coding practice sandbox modelled on Accenture patterns.",
    description_markdown: `A curated **coding-interview practice sandbox** modelled on Accenture assessment patterns: arrays, strings, OOP drills, and timed sets.

Used for peer practice at NIET with topic tags, difficulty bands, and Java + Python reference solutions.`,
    architecture_highlights: [
      "Curated Accenture-pattern question bank",
      "Topic + difficulty taxonomy",
      "Java & Python reference solutions",
    ],
    live_url: null,
    github_url: "https://github.com/Geet-Prince",
    thumbnail_url: null,
    tech_stack: ["Core Java", "Python", "SQL"],
    category: "Developer Tools",
    metrics_badge: "Interview Prep",
    is_featured: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    title: "Retro & Carvaan",
    slug: "retro-carvaan",
    tagline: "Collaborative web-engineering project — a retro music experience built end-to-end by a team.",
    description_markdown: `**Retro & Carvaan** is a collaborative web-engineering project: a nostalgic, retro-styled music experience inspired by the iconic Carvaan player, designed and shipped end-to-end by a student engineering team.

It pairs a warm vintage visual language with buttery-smooth, GPU-accelerated interactions — a love letter to timeless melodies built with modern web tech.`,
    architecture_highlights: [
      "Collaborative team delivery, end to end",
      "Curated retro playlist experience",
      "Vintage design system with modern performance",
      "GPU-accelerated motion throughout",
    ],
    live_url: null,
    github_url: "https://github.com/Geet-Prince",
    thumbnail_url: null,
    tech_stack: ["React", "JavaScript"],
    category: "Full-Stack",
    metrics_badge: "UX Showcase",
    is_featured: true,
    display_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const seedSkills: Skill[] = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Core Java", category: "Languages & Core", proficiency: 92, is_highlighted: true, display_order: 1 },
  { id: "10000000-0000-4000-8000-000000000002", name: "Python", category: "Languages & Core", proficiency: 90, is_highlighted: true, display_order: 2 },
  { id: "10000000-0000-4000-8000-000000000003", name: "JavaScript", category: "Languages & Core", proficiency: 88, is_highlighted: true, display_order: 3 },
  { id: "10000000-0000-4000-8000-000000000004", name: "SQL", category: "Languages & Core", proficiency: 89, is_highlighted: true, display_order: 4 },
  { id: "10000000-0000-4000-8000-000000000005", name: "Spring Boot", category: "Backend & Web Frameworks", proficiency: 85, is_highlighted: true, display_order: 5 },
  { id: "10000000-0000-4000-8000-000000000006", name: "Flask", category: "Backend & Web Frameworks", proficiency: 87, is_highlighted: true, display_order: 6 },
  { id: "10000000-0000-4000-8000-000000000007", name: "React", category: "Backend & Web Frameworks", proficiency: 88, is_highlighted: true, display_order: 7 },
  { id: "10000000-0000-4000-8000-000000000008", name: "REST APIs", category: "Backend & Web Frameworks", proficiency: 90, is_highlighted: true, display_order: 8 },
  { id: "10000000-0000-4000-8000-000000000009", name: "NumPy", category: "Data Science & Analytics", proficiency: 86, is_highlighted: true, display_order: 9 },
  { id: "10000000-0000-4000-8000-000000000010", name: "Pandas", category: "Data Science & Analytics", proficiency: 87, is_highlighted: true, display_order: 10 },
  { id: "10000000-0000-4000-8000-000000000011", name: "Matplotlib", category: "Data Science & Analytics", proficiency: 84, is_highlighted: true, display_order: 11 },
  { id: "10000000-0000-4000-8000-000000000012", name: "AWS (Cloud Practitioner)", category: "Cloud, DevOps & OS", proficiency: 82, is_highlighted: true, display_order: 12 },
  { id: "10000000-0000-4000-8000-000000000013", name: "Linux (Ubuntu)", category: "Cloud, DevOps & OS", proficiency: 90, is_highlighted: true, display_order: 13 },
  { id: "10000000-0000-4000-8000-000000000014", name: "Linux (Mint)", category: "Cloud, DevOps & OS", proficiency: 88, is_highlighted: false, display_order: 14 },
];

export const seedCredentials: Credential[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    title: "B.Tech — Computer Science and Engineering (Data Science)",
    organization: "Noida Institute of Engineering and Technology (NIET), Greater Noida",
    location: "Greater Noida, Uttar Pradesh, India",
    type: "Education",
    date_label: "2023 — 2027",
    description:
      "Undergraduate specialisation in Data Science: DSA, DBMS, operating systems, backend engineering and applied machine-learning foundations.",
    credential_url: null,
    badge_text: "NIET",
    display_order: 1,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    title: "Class XII — Senior Secondary",
    organization: "RPS School, Makanpur",
    location: "India",
    type: "Education",
    date_label: "2023",
    description: "Senior secondary education with a science focus.",
    credential_url: null,
    badge_text: null,
    display_order: 2,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    title: "Class X — Secondary",
    organization: "Golden Bell Public School, Nalanda",
    location: "Nalanda, India",
    type: "Education",
    date_label: "2021",
    description: "Secondary education with distinction in mathematics and science.",
    credential_url: null,
    badge_text: null,
    display_order: 3,
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    title: "AWS Certified Cloud Practitioner",
    organization: "Amazon Web Services (AWS)",
    location: null,
    type: "Certification",
    date_label: "2025",
    description:
      "Foundational certification covering AWS global infrastructure, core services (EC2, S3, RDS, Lambda), security, pricing and cloud economics.",
    credential_url: null,
    badge_text: "AWS",
    display_order: 4,
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    title: "SmartBridge Experiential Learning Program",
    organization: "SmartBridge",
    location: null,
    type: "Program",
    date_label: "2025",
    description:
      "Hands-on experiential program building applied software and data projects with industry mentors.",
    credential_url: null,
    badge_text: null,
    display_order: 5,
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    title: "Cyber & AI Workforce Program",
    organization: "NIIT Foundation",
    location: null,
    type: "Program",
    date_label: "2025",
    description:
      "Workforce readiness program covering cybersecurity fundamentals and applied AI skills.",
    credential_url: null,
    badge_text: null,
    display_order: 6,
  },
  {
    id: "20000000-0000-4000-8000-000000000007",
    title: "India AI Impact Summit 2026",
    organization: "India AI Mission",
    location: "India",
    type: "Program",
    date_label: "2026",
    description:
      "Participant at India's flagship AI summit — sessions on frontier models, agentic AI and AI for public good.",
    credential_url: null,
    badge_text: "AI",
    display_order: 7,
  },
  {
    id: "20000000-0000-4000-8000-000000000008",
    title: "Agentic AI Hackathon",
    organization: "Hackathon",
    location: null,
    type: "Hackathon",
    date_label: "2025",
    description:
      "Built agentic-AI prototypes under time pressure — tool-calling agents and retrieval-augmented workflows.",
    credential_url: null,
    badge_text: "Hackathon",
    display_order: 8,
  },
  {
    id: "20000000-0000-4000-8000-000000000009",
    title: "Code Nakshatra",
    organization: "Hackathon",
    location: null,
    type: "Hackathon",
    date_label: "2025",
    description:
      "Competitive coding + build hackathon — algorithms, rapid prototyping and team delivery.",
    credential_url: null,
    badge_text: "Hackathon",
    display_order: 9,
  },
];

export const seedTheme: ThemeConfig = {
  id: "00000000-0000-4000-8000-000000000002",
  theme_preset: "cupertino-light",
  hero_layout: "apple-centered",
  card_radius: "24px",
  glass_blur: "20px",
  accent_color: "#0066CC",
  enable_command_palette: true,
  enable_architecture_xray: true,
  enable_guitar_easter_egg: true,
  section_order: ["hero", "bento", "projects", "skills", "timeline", "aeo", "contact"],
  section_visibility: ["hero", "bento", "projects", "skills", "timeline", "aeo", "contact"],
  default_project_view: "executive",
  recruiter_messages: {},
  updated_at: new Date().toISOString(),
};

export const seedFaqs: AeoFaq[] = [
  {
    id: "30000000-0000-4000-8000-000000000201",
    question: "Who is Prince Raj (Geet-Prince)?",
    answer:
      "Prince Raj, known online as Geet-Prince, is a Software Engineer and Data Science specialist. He is an AWS Certified Cloud Practitioner and a B.Tech Computer Science and Engineering (Data Science) student at Noida Institute of Engineering and Technology (NIET), Greater Noida, building scalable backends and data-driven applications.",
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-4000-8000-000000000202",
    question: "Where does Prince Raj study Computer Science and Data Science?",
    answer:
      "Prince Raj studies at the Noida Institute of Engineering and Technology (NIET) in Greater Noida, Uttar Pradesh, India. He is pursuing a Bachelor of Technology (B.Tech) in Computer Science and Engineering with a Data Science specialisation, covering DSA, DBMS, operating systems, backend engineering, and applied machine learning.",
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-4000-8000-000000000203",
    question: "What is Progex and what projects has Prince Raj built?",
    answer:
      "Progex (progex.geetprince.me) is Prince Raj's flagship competitive-programming analytics platform tracking 270+ DSA solves across LeetCode, GeeksforGeeks, and CodeChef. His other builds include Eventify (event management), Verse (an interactive music streaming app with real-time synchronized listening rooms, built with React, Kotlin, and Firebase), the Accenture Coding Practice Sandbox (interview prep), and Retro & Carvaan (a collaborative web-engineering project).",
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-4000-8000-000000000204",
    question: "What is Prince Raj's technical stack and competitive programming record?",
    answer:
      "Prince Raj has solved 270+ Data Structures & Algorithms problems on LeetCode, GeeksforGeeks, and CodeChef. His stack spans Core Java, Spring Boot, Python, Flask, React, JavaScript, SQL, and REST APIs, plus Data Science with NumPy, Pandas, and Matplotlib. He is an AWS Certified Cloud Practitioner working daily on Ubuntu and Linux Mint.",
    display_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-4000-8000-000000000205",
    question: "How can recruiters or engineering teams contact Prince Raj?",
    answer:
      "Recruiters can reach Prince Raj through the contact form on geetprince.me, by email at contact@geetprince.me, via GitHub at github.com/Geet-Prince, or on LinkedIn. He is available for Software Engineering and Data Science roles, internships, and collaborations, and typically replies within 48 hours.",
    display_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
