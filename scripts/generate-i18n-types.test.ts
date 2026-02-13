/**
 * Unit tests for i18n type generation script
 * 
 * Tests the key extraction, validation, and type generation logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the functions we need to test
// Since the script uses top-level execution, we'll need to extract the logic

interface TranslationMap {
  [key: string]: string | TranslationMap;
}

function extractKeys(obj: TranslationMap, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      keys.push(fullKey);
    } else if (typeof value === 'object' && value !== null) {
      keys.push(...extractKeys(value, fullKey));
    }
  }
  
  return keys.sort();
}

function validateKeys(hrKeys: string[], enKeys: string[]): void {
  const hrSet = new Set(hrKeys);
  const enSet = new Set(enKeys);
  
  const missingInEn = hrKeys.filter(k => !enSet.has(k));
  const missingInHr = enKeys.filter(k => !hrSet.has(k));
  
  if (missingInEn.length > 0) {
    throw new Error(
      `Missing keys in en.json:\n  ${missingInEn.join('\n  ')}`
    );
  }
  
  if (missingInHr.length > 0) {
    throw new Error(
      `Missing keys in hr.json:\n  ${missingInHr.join('\n  ')}`
    );
  }
}

describe('i18n Type Generation', () => {
  describe('extractKeys', () => {
    it('should extract keys from flat object', () => {
      const obj = {
        key1: 'value1',
        key2: 'value2'
      };
      
      const keys = extractKeys(obj);
      expect(keys).toEqual(['key1', 'key2']);
    });

    it('should extract keys from nested object with dot notation', () => {
      const obj = {
        auth: {
          title: 'Title',
          error: 'Error'
        },
        common: {
          loading: 'Loading'
        }
      };
      
      const keys = extractKeys(obj);
      expect(keys).toEqual([
        'auth.error',
        'auth.title',
        'common.loading'
      ]);
    });

    it('should extract keys from deeply nested object', () => {
      const obj = {
        level1: {
          level2: {
            level3: 'value'
          }
        }
      };
      
      const keys = extractKeys(obj);
      expect(keys).toEqual(['level1.level2.level3']);
    });

    it('should sort keys alphabetically', () => {
      const obj = {
        zebra: 'z',
        apple: 'a',
        banana: 'b'
      };
      
      const keys = extractKeys(obj);
      expect(keys).toEqual(['apple', 'banana', 'zebra']);
    });

    it('should handle empty object', () => {
      const obj = {};
      const keys = extractKeys(obj);
      expect(keys).toEqual([]);
    });
  });

  describe('validateKeys', () => {
    it('should not throw when keys match', () => {
      const hrKeys = ['auth.title', 'auth.error', 'common.loading'];
      const enKeys = ['auth.title', 'auth.error', 'common.loading'];
      
      expect(() => validateKeys(hrKeys, enKeys)).not.toThrow();
    });

    it('should throw when keys are missing in en.json', () => {
      const hrKeys = ['auth.title', 'auth.error', 'common.loading'];
      const enKeys = ['auth.title', 'common.loading'];
      
      expect(() => validateKeys(hrKeys, enKeys)).toThrow('Missing keys in en.json');
      expect(() => validateKeys(hrKeys, enKeys)).toThrow('auth.error');
    });

    it('should throw when keys are missing in hr.json', () => {
      const hrKeys = ['auth.title', 'common.loading'];
      const enKeys = ['auth.title', 'auth.error', 'common.loading'];
      
      expect(() => validateKeys(hrKeys, enKeys)).toThrow('Missing keys in hr.json');
      expect(() => validateKeys(hrKeys, enKeys)).toThrow('auth.error');
    });

    it('should handle empty arrays', () => {
      const hrKeys: string[] = [];
      const enKeys: string[] = [];
      
      expect(() => validateKeys(hrKeys, enKeys)).not.toThrow();
    });
  });

  describe('Integration with actual translation files', () => {
    it('should successfully read and validate actual translation files', () => {
      const projectRoot = path.resolve(__dirname, '..');
      const hrPath = path.join(projectRoot, 'public', 'locales', 'hr.json');
      const enPath = path.join(projectRoot, 'public', 'locales', 'en.json');
      
      // Read files
      const hrContent = fs.readFileSync(hrPath, 'utf-8');
      const enContent = fs.readFileSync(enPath, 'utf-8');
      
      // Parse JSON
      const hrTranslations = JSON.parse(hrContent);
      const enTranslations = JSON.parse(enContent);
      
      // Extract keys
      const hrKeys = extractKeys(hrTranslations);
      const enKeys = extractKeys(enTranslations);
      
      // Should have keys
      expect(hrKeys.length).toBeGreaterThan(0);
      expect(enKeys.length).toBeGreaterThan(0);
      
      // Keys should match
      expect(() => validateKeys(hrKeys, enKeys)).not.toThrow();
      
      // Should have same number of keys
      expect(hrKeys.length).toBe(enKeys.length);
    });

    it('should verify generated types file exists and is valid TypeScript', () => {
      const projectRoot = path.resolve(__dirname, '..');
      const typesPath = path.join(projectRoot, 'src', 'i18n', 'types.ts');
      
      // File should exist
      expect(fs.existsSync(typesPath)).toBe(true);
      
      // Read content
      const content = fs.readFileSync(typesPath, 'utf-8');
      
      // Should contain TranslationKey type
      expect(content).toContain('export type TranslationKey');
      
      // Should contain some actual keys
      expect(content).toContain('auth.title');
      expect(content).toContain('common.loading');
      
      // Should have warning comment
      expect(content).toContain('DO NOT EDIT MANUALLY');
    });
  });
});
