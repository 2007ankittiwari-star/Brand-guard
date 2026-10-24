# 🛡️ BrandGuard

### Making marketing claims more trustworthy with AI

Marketing content is everywhere, but not every claim is accurate. A product might be advertised with exaggerated specifications, misleading promises, or statements that don't match the brand's actual information.

**BrandGuard** is an AI-powered tool built to help identify these issues before marketing content goes public. It combines AI analysis with web research to check claims, evaluate brand alignment, and suggest improvements.

## ✨ What It Does

- 🔎 **Fact-Checking:** Checks marketing claims against information found through web research.
- 🏷️ **Brand Alignment:** Helps identify content that may not match a brand's facts or positioning.
- ✍️ **Content Improvement:** Suggests clearer, more accurate alternatives to marketing copy.
- 📚 **Evidence & Sources:** Provides source links to help users review the information behind an audit.
- ⚠️ **Claim Analysis:** Helps distinguish supported, contradicted, and unverified claims.

## ⚙️ How It Works

1. Enter the marketing content you want to review.
2. BrandGuard searches for relevant information using Tavily.
3. Google's Gemini API analyzes the content against the available evidence.
4. The tool returns an audit report with findings, sources, and suggested improvements.

AI-generated findings are intended to assist human review, not replace it. Search results can be incomplete, so important claims should still be verified.

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **AI Analysis:** Google Gemini API
- **Web Research:** Tavily API
- **Backend:** Cloudflare Workers
- **Frontend Hosting:** Firebase Hosting

## 🚀 Getting Started

To run your own instance:

1. Clone this repository.
2. Configure the frontend files and Firebase Hosting.
3. Deploy the backend as a Cloudflare Worker.
4. Add your Gemini and Tavily API keys as Cloudflare Worker secrets.
5. Configure the frontend to call your deployed Worker URL.
6. Deploy the frontend and test a complete audit.

## 🔐 Security

API keys should never be committed to a public repository. Keep Gemini and Tavily credentials in Cloudflare Worker secrets rather than exposing them in frontend JavaScript.

## 🎯 Why BrandGuard?

The goal is simple: help people create marketing content that is persuasive without sacrificing accuracy. By bringing AI analysis and web-based evidence together, BrandGuard makes it easier to spot questionable claims before they reach an audience.

---

**Built as a hackathon project** with the idea that better marketing starts with better verification.
