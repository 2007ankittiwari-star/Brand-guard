# 🛡️ BrandGuard
### Trust Every Claim. Verify Before You Publish.

**BrandGuard is an AI-powered content auditing platform that helps brands verify marketing claims, detect misleading information, maintain brand consistency, and optimize content before publication.**

## 🚨 The Problem
Marketing content can contain unsupported claims, misleading promises, incorrect product information, and SEO weaknesses. Manual verification is time-consuming, and publishing inaccurate content can damage customer trust.

## ✨ Key Features

- **Claim-by-Claim Verification:** Identifies individual claims and classifies potential risks with supporting evidence.
- **Web Research:** Uses Tavily search to gather relevant online sources for fact-checking.
- **Brand Alignment:** Checks content against brand facts, product information, and guidelines.
- **AI-Powered Rewriting:** Suggests safer, clearer, and more trustworthy alternatives.
- **SEO Analysis:** Evaluates keywords, search intent, content structure, headlines and CTAs, format suitability, and trustworthiness.
- **Structured Audit Reports:** Presents findings, evidence, source links, and suggested corrections.
- **Review Workflow:** Supports submitting content for review, approval decisions, and revision requests.
- **Review History & Recovery:** Helps users revisit previous audits and recover saved progress.

## ⚙️ How It Works

1. Enter the brand name, marketing draft, and any available brand facts.
2. BrandGuard researches relevant information online.
3. AI analyzes claims, brand alignment, content quality, and SEO.
4. Review the findings, evidence, and suggested improvements.
5. Revise the content and move it through the review workflow.

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| HTML, CSS, JavaScript | Frontend and interactive dashboard |
| Cloudflare Workers | Backend API |
| Google Gemini | AI-powered auditing and rewriting |
| Tavily Search API | Web research and evidence gathering |
| Firebase Hosting | Frontend deployment |

## 🏗️ Architecture

```text
User
  ↓
BrandGuard Web Dashboard
  ↓
Cloudflare Worker API
  ├── Tavily → Web Research
  └── Gemini → AI Audit & Rewriting
  ↓
Audit Report + SEO Analysis
```

## 🚀 Getting Started

**1. Clone the repository**
```bash
git clone <2007ankittiwari/brand-guard>
cd BrandGuard
```

**2. Configure backend secrets**

Set the following secrets in your Cloudflare Worker:

- `GEMINI_API_KEY`
- `TAVILY_API_KEY`

**3. Connect the frontend**

Configure the frontend to use your deployed Cloudflare Worker URL.

**Deployed Project Link**

https://brand-guard-de34a.web.app

## 🔐 Responsible AI & Security

- Uses web sources to support claim verification.
- Helps distinguish supported claims from potentially misleading ones.
- Keeps API keys in backend environment secrets rather than exposing them in frontend code.
- Provides recommendations to assist human reviewers, not replace their judgment.

## 🌟 Why BrandGuard?

BrandGuard combines **fact-checking, brand compliance, content improvement, SEO analysis, and human review** in one workflow. Instead of simply generating marketing copy, it helps teams evaluate whether that copy is accurate, credible, and ready for publication.

## 🔮 Future Scope

Potential improvements include integrations with publishing platforms, multi-users management system, automated monitoring of published claims, and expanded analytics.

## 🤝 Contributing

Contributions, ideas, and feedback are welcome. Fork the repository, create a branch, and submit a pull request.

---

**BrandGuard | Build trust before you publish.**
