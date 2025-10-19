import fs from "fs";
import path from "path";
import {
  type PortfolioConfig,
  PortfolioConfigSchema,
} from "@/types/portfolio-schema";
import PortfolioParser from "./parser";
import { cacheConfigAssets } from "@/utils/cacheConfigImages";
import { revalidatePath } from "next/cache";

const DEFAULT_CONFIG_FILE = "data/portfolio-config.example.json";
const CONFIG_PATH =
  process.env.PORTFOLIO_CONFIG_PATH ??
  path.resolve(process.cwd(), DEFAULT_CONFIG_FILE);

const BASE64_CONFIG_ENV = process.env.PORTFOLIO_CONFIG_BASE64;

let _cachedConfig: PortfolioConfig | null = null;

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

export async function loadConfigWithCachingImages(): Promise<PortfolioConfig> {
  const raw = await readRawConfigAsync(CONFIG_PATH);
  const parsed = JSON.parse(raw);
  const validated = PortfolioConfigSchema.parse(parsed);
  return await cacheConfigAssets(validated);
}

type loadConfigSyncParams = {
  readCached?: boolean;
  enableCaching?: boolean;
};

export function loadConfigSync({
  readCached,
  enableCaching,
}: loadConfigSyncParams): PortfolioConfig {
  if (_cachedConfig && readCached) return _cachedConfig;

  const raw = readRawConfig(CONFIG_PATH);
  const parsed = JSON.parse(raw);
  const validated = PortfolioConfigSchema.parse(parsed);

  return validated;
}

export function invalidateConfigCache(): void {
  _cachedConfig = null;
  revalidatePath("/");
}

export function getParser(config: PortfolioConfig): PortfolioParser {
  return new PortfolioParser(config);
}
