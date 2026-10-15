import { DEFAULT_STYLE, newBullet, newLink, newSkill, uid } from "./ops";
import type { Entry, Resume } from "./types";

const entry = (e: Omit<Entry, "id" | "bullets"> & { bullets: string[] }): Entry => ({
  ...e,
  id: uid(),
  bullets: e.bullets.map((t) => newBullet(t)),
});

/** Seed CV, taken from Nguyen_Van_Quyen_CV_Fullstack_AI_Automation_ISB.pdf. */
export function sampleResume(): Resume {
  return {
    id: uid(),
    name: "Fullstack / AI Automation",
    updatedAt: Date.now(),
    header: {
      name: "Nguyen Van Quyen",
      headline: "Fullstack Developer Intern | AI & Automation",
      location: "Ho Chi Minh City, Vietnam",
      email: "quyendep2580@gmail.com",
      phone: "+84 378 542 127",
      links: [
        newLink("GitHub", "https://github.com/quyen244"),
        newLink("LinkedIn", "https://www.linkedin.com/in/quyền-nguyễn-văn-67b250233"),
        newLink("Portfolio", "https://my-portfolio-lovat-chi-83.vercel.app/"),
      ],
    },
    sections: [
      {
        id: uid(),
        kind: "text",
        title: "Summary",
        body:
          "Fourth-year Computer Science student building full-stack applications and practical AI automation solutions. " +
          "Experienced with Next.js, React, TypeScript, FastAPI, PostgreSQL, Ollama and n8n, integrating responsive web interfaces, " +
          "REST APIs and LLM workflows from development through testing and deployment.",
      },
      {
        id: uid(),
        kind: "entries",
        title: "Education",
        items: [
          entry({
            title: "University of Information Technology (UIT) - VNU-HCM",
            url: "",
            subtitle: "B.S. in Computer Science · GPA: 8.30/10 · Excellent Student Award, 2023-2026",
            date: "2023-2027",
            place: "Ho Chi Minh City",
            bullets: [],
          }),
        ],
      },
      {
        id: uid(),
        kind: "entries",
        title: "Projects",
        items: [
          entry({
            title: "WriteWise (EasyWriting) | AI IELTS Writing Web Platform",
            url: "https://github.com/quyen244/EasyWriting",
            subtitle: "Independent full-stack project · Next.js, TypeScript, Supabase and LLM APIs",
            date: "2026",
            place: "",
            bullets: [
              "Built a bilingual web application using **Next.js, React and TypeScript**, with authentication, IELTS writing practice, timed mock tests, progress tracking and feedback dashboards.",
              "Designed an **asynchronous scoring workflow** using PostgreSQL triggers, Supabase Edge Functions and LLM APIs, persisting grading states and model-call logs.",
              "Implemented Supabase Auth, **Row Level Security** and server-side quote verification; made band calculation deterministic and versioned model prompts.",
              "Compared scoring against **50 reference-scored essays** with approximately **0.5-band differences**; used Vitest, Playwright and GitHub Actions CI.",
            ],
          }),
          entry({
            title: "Customer Care | Data & SLA Intelligence Platform",
            url: "https://github.com/quyen244/customer-care",
            subtitle: "Independent engineering project · API integration, PostgreSQL, Airflow, n8n",
            date: "2026",
            place: "",
            bullets: [
              "Integrated CRM **REST APIs** and incremental ticket exports; implemented Python validation, quarantine and **idempotent PostgreSQL upserts**.",
              "Orchestrated an hourly Airflow pipeline with dbt transformations and **90 data tests**, building SLA/CSAT data marts and Metabase dashboards.",
              "Built **n8n workflows** for SLA, backlog and pipeline-failure alerts with deduplication and cooldown; deployed with Docker Compose.",
            ],
          }),
          entry({
            title: "CareFlow | AI Customer Support Automation",
            url: "",
            subtitle: "Independent project · Ollama, n8n and workflow integration",
            date: "2026",
            place: "",
            bullets: [
              "Built **n8n + Ollama** workflows for ticket classification, reply drafting, priority assignment and workload-based routing.",
              "Added confidence/urgency rules for **human-in-the-loop** review and defined monitoring for SLA breaches, response time and automation quality.",
            ],
          }),
          entry({
            title: "Evidence-Grounded RAG System & Evaluation",
            url: "https://github.com/quyen244/prompt-engineering-evaluation-rag",
            subtitle: "Independent project · FastAPI, local LLMs, RAG and model serving",
            date: "2026",
            place: "",
            bullets: [
              "Built evidence-grounded document QA with **FastAPI, Ollama, Qdrant**, Celery/Redis and Docker.",
              "Compared BM25, dense and hybrid retrieval on TechQA; found relevant gold documents in **20/20** questions and reached **0.953 faithfulness**.",
              "Benchmarked the end-to-end RAG path with Locust under 20 concurrent users; optimized a vLLM stack to run **41% faster** than a serialized baseline.",
            ],
          }),
        ],
      },
      {
        id: uid(),
        kind: "entries",
        title: "Research Experience",
        items: [
          entry({
            title: "Domain-Adaptive Emotion Classification for Vietnamese Gaming Livestream",
            url: "",
            subtitle: "Co-author · primary contribution: system architecture, processing and modeling",
            date: "ISWTA 2026",
            place: "Published",
            bullets: [
              "Designed domain-aware preprocessing and a Kafka/Spark pipeline with Redis and PostgreSQL; reduced OOV from **48% to below 6%** and achieved 64.0 Macro-F1 on 13,000 messages.",
              "Conducted model **ablation studies** of attention and CNN components (+2.2 / +1.5 Macro-F1).",
            ],
          }),
          entry({
            title: "VNTA-VQA | Evidence-Grounded Video Question Answering",
            url: "",
            subtitle: "",
            date: "B.S. thesis",
            place: "in progress",
            bullets: [
              "Developing an evidence-grounded Vietnamese traffic QA benchmark targeting 1,500 clips and 13,500 question-answer pairs.",
            ],
          }),
        ],
      },
      {
        id: uid(),
        kind: "skills",
        title: "Technical Skills",
        items: [
          newSkill("Frontend", "JavaScript, TypeScript, React, Next.js, HTML/CSS, Tailwind CSS"),
          newSkill(
            "Backend & Database",
            "Python, FastAPI, REST APIs, Webhooks, SQL, PostgreSQL, Supabase (Auth, RLS, Edge Functions)",
          ),
          newSkill("AI & Automation", "Ollama, n8n, LLM API Integration, RAG, Qdrant, vLLM"),
          newSkill(
            "Engineering & Testing",
            "Git/GitHub, Docker, GitHub Actions, Vitest, Playwright, Airflow, dbt, Linux, AWS (Studying)",
          ),
        ],
      },
      {
        id: uid(),
        kind: "list",
        title: "Certifications",
        items: [
          newBullet("**IELTS Academic 7.0** (C1 Advanced)"),
          newBullet("HackerRank SQL (Intermediate), 2026 · HackerRank Problem Solving (Intermediate), 2026"),
          newBullet("TensorFlow Developer Specialization, DeepLearning.AI, 2025"),
        ],
      },
      {
        id: uid(),
        kind: "list",
        title: "Activities",
        items: [newBullet("UIT AI Club, Member (2025-2026)")],
      },
    ],
    style: { ...DEFAULT_STYLE },
  };
}
