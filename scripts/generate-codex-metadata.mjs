#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const REPO_SKILLS_LINK = path.join(ROOT, ".agents", "skills");
const CHECK = process.argv.includes("--check");

const DISPLAY_NAMES = {
  "ab-testing": "A/B Testing",
  "ad-creative": "Ad Creative",
  ads: "Paid Ads",
  "ai-seo": "AI SEO",
  analytics: "Marketing Analytics",
  aso: "App Store Optimization",
  "churn-prevention": "Churn Prevention",
  "co-marketing": "Co-Marketing",
  "cold-email": "Cold Email",
  "community-marketing": "Community Marketing",
  "competitor-profiling": "Competitor Profiling",
  competitors: "Competitor Content",
  "content-strategy": "Content Strategy",
  "copy-editing": "Copy Editing",
  copywriting: "Copywriting",
  cro: "Conversion Optimization",
  "customer-research": "Customer Research",
  "directory-submissions": "Directory Submissions",
  emails: "Lifecycle Emails",
  "free-tools": "Free Marketing Tools",
  image: "Marketing Images",
  "influencer-marketing": "Influencer Marketing",
  launch: "Product Launch",
  "lead-magnets": "Lead Magnets",
  "marketing-council": "Marketing Council",
  "marketing-ideas": "Marketing Ideas",
  "marketing-loops": "Marketing Loops",
  "marketing-plan": "Marketing Plan",
  "marketing-psychology": "Marketing Psychology",
  offers: "Offer Design",
  onboarding: "User Onboarding",
  paywalls: "Paywalls",
  popups: "Popups",
  pricing: "Pricing",
  "product-marketing": "Product Marketing Context",
  "programmatic-seo": "Programmatic SEO",
  prospecting: "Prospecting",
  "public-relations": "Public Relations",
  referrals: "Referral Programs",
  revops: "Revenue Operations",
  "sales-enablement": "Sales Enablement",
  schema: "Structured Data",
  "seo-audit": "SEO Audit",
  signup: "Signup Conversion",
  "site-architecture": "Site Architecture",
  sms: "SMS Marketing",
  social: "Social Content",
  video: "Marketing Video"
};

const SHORT_DESCRIPTIONS = {
  "ab-testing": "Plan reliable marketing experiments",
  "ad-creative": "Create and improve ad creative",
  ads: "Plan and optimize paid ad campaigns",
  "ai-seo": "Improve visibility in AI search",
  analytics: "Set up and audit marketing analytics",
  aso: "Improve App Store listing performance",
  "churn-prevention": "Reduce churn and recover failed payments",
  "co-marketing": "Plan practical co-marketing partnerships",
  "cold-email": "Write cold email sequences that get replies",
  "community-marketing": "Build community-led marketing programs",
  "competitor-profiling": "Research and profile competitors",
  competitors: "Create competitor comparison content",
  "content-strategy": "Plan focused, useful content strategy",
  "copy-editing": "Improve existing marketing copy",
  copywriting: "Write clear, persuasive marketing copy",
  cro: "Improve website and form conversions",
  "customer-research": "Plan and synthesize customer research",
  "directory-submissions": "Plan and track directory submissions",
  emails: "Create lifecycle email sequences",
  "free-tools": "Plan useful free tools for growth",
  image: "Create and improve marketing images",
  "influencer-marketing": "Plan creator and influencer campaigns",
  launch: "Plan product and feature launches",
  "lead-magnets": "Create lead magnets that earn attention",
  "marketing-council": "Get multiple marketing expert perspectives",
  "marketing-ideas": "Generate practical marketing ideas",
  "marketing-loops": "Design repeatable marketing loops",
  "marketing-plan": "Build a focused marketing plan",
  "marketing-psychology": "Apply behavioral science to marketing",
  offers: "Design a clear, compelling offer",
  onboarding: "Improve activation and onboarding",
  paywalls: "Improve upgrade screens and paywalls",
  popups: "Create effective popups and banners",
  pricing: "Plan pricing and packaging decisions",
  "product-marketing": "Capture product and audience context",
  "programmatic-seo": "Plan scalable SEO page programs",
  prospecting: "Find and qualify likely prospects",
  "public-relations": "Plan earned media and press outreach",
  referrals: "Build practical referral programs",
  revops: "Improve lead routing and revenue operations",
  "sales-enablement": "Create useful sales enablement assets",
  schema: "Plan and validate structured data",
  "seo-audit": "Audit and prioritize SEO problems",
  signup: "Improve signup and trial conversion",
  "site-architecture": "Plan clear website structure and navigation",
  sms: "Plan compliant SMS marketing flows",
  social: "Create focused social media content",
  video: "Plan and produce marketing videos"
};

function quoteYaml(value) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function readSkillNames() {
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(SKILLS_DIR, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

function metadataFor(name) {
  const displayName = DISPLAY_NAMES[name];
  const shortDescription = SHORT_DESCRIPTIONS[name];

  if (!displayName || !shortDescription) {
    throw new Error(`Add display metadata for new skill: ${name}`);
  }

  const action = shortDescription[0].toLowerCase() + shortDescription.slice(1);
  return [
    "interface:",
    `  display_name: ${quoteYaml(displayName)}`,
    `  short_description: ${quoteYaml(shortDescription)}`,
    `  default_prompt: ${quoteYaml(`Use $${name} to ${action}.`)}`,
    ""
  ].join("\n");
}

function ensureSkillMetadata(name, stale) {
  const metadataPath = path.join(SKILLS_DIR, name, "agents", "openai.yaml");
  const expected = metadataFor(name);
  const current = fs.existsSync(metadataPath) ? fs.readFileSync(metadataPath, "utf8") : null;

  if (current === expected) return;
  if (CHECK) {
    stale.push(path.relative(ROOT, metadataPath));
    return;
  }

  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.writeFileSync(metadataPath, expected);
}

function ensureRepoSkillLink(stale) {
  let currentTarget = null;
  try {
    currentTarget = fs.readlinkSync(REPO_SKILLS_LINK);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "EINVAL") throw error;
  }

  if (currentTarget === "../skills") return;
  if (CHECK) {
    stale.push(path.relative(ROOT, REPO_SKILLS_LINK));
    return;
  }

  fs.mkdirSync(path.dirname(REPO_SKILLS_LINK), { recursive: true });
  if (fs.existsSync(REPO_SKILLS_LINK)) {
    throw new Error(`${path.relative(ROOT, REPO_SKILLS_LINK)} exists and is not the expected symlink`);
  }
  fs.symlinkSync("../skills", REPO_SKILLS_LINK, "dir");
}

const stale = [];
const skillNames = readSkillNames();

for (const name of skillNames) {
  ensureSkillMetadata(name, stale);
}
ensureRepoSkillLink(stale);

if (stale.length > 0) {
  console.error("Codex metadata is stale:");
  for (const file of stale) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`${CHECK ? "Checked" : "Generated"} Codex metadata for ${skillNames.length} skills.`);
