import fs from "fs";
import path from "path";
import {
  PortfolioConfigSchema,
  type PortfolioConfig,
} from "@/types/portfolio-schema";
import PortfolioParser from "./parser";
import { cacheConfigAssets } from "@/utils/cacheConfigImages";

const DEFAULT_CONFIG_FILE = "data/portfolio-config.example.json";
const CONFIG_PATH =
  process.env.PORTFOLIO_CONFIG_PATH ??
  path.resolve(process.cwd(), DEFAULT_CONFIG_FILE);

const BASE64_CONFIG_ENV = process.env.PORTFOLIO_CONFIG_BASE64;

let _cachedConfig: PortfolioConfig | null = null;
let _cachedParser: PortfolioParser | null = null;

function readRawConfig(filePath: string): string {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8");
  }
  if (BASE64_CONFIG_ENV) {
    try {
      return Buffer.from(BASE64_CONFIG_ENV, "base64").toString("utf-8");
    } catch (err) {
      throw new Error("Failed to decode base64 portfolio config");
    }
  }
  throw new Error(`Portfolio config not found at ${filePath}`);
}

async function readRawConfigAsync(filePath: string): Promise<string> {
  if (
    await fs.promises
      .stat(filePath)
      .then(() => true)
      .catch(() => false)
  ) {
    return fs.promises.readFile(filePath, "utf-8");
  }
  if (BASE64_CONFIG_ENV) {
    try {
      return Buffer.from(BASE64_CONFIG_ENV, "base64").toString("utf-8");
    } catch (err) {
      throw new Error("Failed to decode base64 portfolio config");
    }
  }
  throw new Error(`Portfolio config not found at ${filePath}`);
}

export async function loadConfigWithCachedImages(): Promise<PortfolioConfig> {
  if (_cachedConfig) return _cachedConfig;

  const raw = await readRawConfigAsync(CONFIG_PATH);
  const parsed = JSON.parse(raw);
  const validated = PortfolioConfigSchema.parse(parsed);

  const cached = await cacheConfigAssets(validated);

  _cachedConfig = cached;
  _cachedParser = new PortfolioParser(cached);

  return cached;
}

export function loadConfigSync(): PortfolioConfig {
  if (_cachedConfig) return _cachedConfig;

  const raw = readRawConfig(CONFIG_PATH);
  const parsed = JSON.parse(raw);
  const validated = PortfolioConfigSchema.parse(parsed);

  _cachedParser = new PortfolioParser(validated);

  return validated;
}

export function getParser(): PortfolioParser {
  if (!_cachedParser) {
    _cachedParser = new PortfolioParser(
      _cachedConfig ? _cachedConfig : loadConfigSync(),
    );
  }
  return _cachedParser;
}
