#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const errors = [];

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s/.test(line)) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function validatePlugin() {
  const manifestPath = path.join(ROOT, ".codex-plugin", "plugin.json");
  if (!fs.existsSync(manifestPath)) {
    errors.push("Missing .codex-plugin/plugin.json");
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const field of ["name", "version", "description", "skills", "interface"]) {
    if (!manifest[field]) errors.push(`Plugin manifest is missing ${field}`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) {
    errors.push("Plugin version must use x.y.z semantic versioning");
  }
  if (manifest.skills !== "./skills/") {
    errors.push('Plugin skills path must be "./skills/"');
  }
  for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category"]) {
    if (!manifest.interface?.[field]) errors.push(`Plugin interface is missing ${field}`);
  }
}

function validateSkills() {
  const skillDirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(SKILLS_DIR, entry.name, "SKILL.md")))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of skillDirs) {
    const skillPath = path.join(SKILLS_DIR, entry.name, "SKILL.md");
    const content = fs.readFileSync(skillPath, "utf8");
    const frontmatter = parseFrontmatter(content);
    const lineCount = content.split(/\r?\n/).length;

    if (frontmatter.name !== entry.name) {
      errors.push(`${entry.name}: frontmatter name does not match the folder`);
    }
    if (!frontmatter.description || frontmatter.description.length > 1024) {
      errors.push(`${entry.name}: description must be 1 to 1,024 characters`);
    }
    if (lineCount > 500) {
      errors.push(`${entry.name}: SKILL.md has ${lineCount} lines, maximum is 500`);
    }

    const openaiYaml = path.join(SKILLS_DIR, entry.name, "agents", "openai.yaml");
    if (!fs.existsSync(openaiYaml)) {
      errors.push(`${entry.name}: missing agents/openai.yaml`);
    } else {
      const yaml = fs.readFileSync(openaiYaml, "utf8");
      const shortMatch = yaml.match(/short_description:\s*"([^"]+)"/);
      if (!yaml.includes(`$${entry.name}`)) {
        errors.push(`${entry.name}: default_prompt must mention $${entry.name}`);
      }
      if (!shortMatch || shortMatch[1].length < 25 || shortMatch[1].length > 64) {
        errors.push(`${entry.name}: short_description must be 25 to 64 characters`);
      }
    }
  }

  const repoSkillLink = path.join(ROOT, ".agents", "skills");
  try {
    if (fs.readlinkSync(repoSkillLink) !== "../skills") {
      errors.push(".agents/skills must point to ../skills");
    }
  } catch {
    errors.push(".agents/skills must be a symlink to ../skills");
  }

  return skillDirs.length;
}

function validateAgents() {
  const agentsDir = path.join(ROOT, ".codex", "agents");
  const agentFiles = fs.readdirSync(agentsDir).filter((file) => file.endsWith(".toml"));
  for (const file of agentFiles) {
    const content = fs.readFileSync(path.join(agentsDir, file), "utf8");
    for (const field of ["name", "description", "developer_instructions"]) {
      if (!new RegExp(`^${field}\\s*=`, "m").test(content)) {
        errors.push(`${file}: missing ${field}`);
      }
    }
  }
  if (agentFiles.length === 0) errors.push("No project agents found");
  return agentFiles.length;
}

const metadataCheck = spawnSync(
  process.execPath,
  [path.join(ROOT, "scripts", "generate-codex-metadata.mjs"), "--check"],
  { cwd: ROOT, encoding: "utf8" }
);
if (metadataCheck.status !== 0) {
  errors.push(metadataCheck.stderr.trim() || "Codex metadata check failed");
}

validatePlugin();
const skillCount = validateSkills();
const agentCount = validateAgents();

if (errors.length > 0) {
  console.error("Codex validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Codex validation passed: ${skillCount} skills and ${agentCount} project agents.`);
