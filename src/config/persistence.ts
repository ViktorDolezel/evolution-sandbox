import type { SimulationConfig } from './types';
import { getDefaultConfig } from './defaults';
import { validateConfig, mergeWithDefaults } from './validation';

export interface ConfigFile {
  version: string;
  name: string;
  description: string;
  config: Partial<SimulationConfig>;
  exportedAt: string;
}

const CONFIG_VERSION = '1.0';

export function exportConfig(
  config: SimulationConfig,
  name: string = 'Custom Configuration',
  description: string = ''
): string {
  const configFile: ConfigFile = {
    version: CONFIG_VERSION,
    name,
    description,
    config,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(configFile, null, 2);
}

export interface ImportResult {
  success: boolean;
  config?: SimulationConfig;
  warnings: string[];
  errors: string[];
  name?: string;
  description?: string;
}

export function importConfig(json: string): ImportResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return {
      success: false,
      errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`],
      warnings: [],
    };
  }

  // Validate structure
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      errors: ['Config file must be an object'],
      warnings: [],
    };
  }

  const file = parsed as Record<string, unknown>;

  // Check version
  if (file.version && file.version !== CONFIG_VERSION) {
    warnings.push(`Config version mismatch: expected ${CONFIG_VERSION}, got ${file.version}`);
  }

  // Extract config
  let configData = file.config;
  if (!configData) {
    // Maybe the user pasted just the config object without wrapper
    if ('world' in file || 'entities' in file || 'reproduction' in file) {
      configData = file;
      warnings.push('Config file appears to be a raw config object, not a wrapped export');
    } else {
      return {
        success: false,
        errors: ['Config file missing "config" property'],
        warnings,
      };
    }
  }

  // Merge with defaults to fill any missing values
  const mergedConfig = mergeWithDefaults(configData as Partial<SimulationConfig>);

  // Validate
  const validationResult = validateConfig(mergedConfig);

  return {
    success: validationResult.valid || validationResult.errors.length === 0,
    config: validationResult.clampedConfig,
    warnings: [...warnings, ...validationResult.warnings],
    errors: [...errors, ...validationResult.errors],
    name: typeof file.name === 'string' ? file.name : undefined,
    description: typeof file.description === 'string' ? file.description : undefined,
  };
}

export function downloadConfigFile(
  config: SimulationConfig,
  filename: string = 'evolution-sandbox-config.json'
): void {
  const json = exportConfig(config);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function promptConfigUpload(): Promise<ImportResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const text = await file.text();
        const result = importConfig(text);
        resolve(result);
      } catch (e) {
        resolve({
          success: false,
          errors: [`Failed to read file: ${e instanceof Error ? e.message : 'Unknown error'}`],
          warnings: [],
        });
      }
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}
