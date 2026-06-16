import * as path from 'path';
import * as fs from 'fs';
import { walkDir, FileEntry } from '../utils/walker';
import { minimatch } from 'minimatch';

export interface NameSearchOptions {
  directory: string;
  ignoreCase: boolean;
  type: 'file' | 'dir' | 'all';
  maxDepth: number;
  hidden: boolean;
  respectGitignore: boolean;
}

export interface NameSearchResult {
  filePath: string;
  fileName: string;
  isDirectory: boolean;
  size?: number;
}

export async function searchByName(
  pattern: string,
  options: NameSearchOptions
): Promise<NameSearchResult[]> {
  const results: NameSearchResult[] = [];

  for await (const entry of walkDir(options.directory, {
    maxDepth: options.maxDepth,
    hidden: options.hidden,
    respectGitignore: options.respectGitignore,
  })) {
    // Filter by type
    if (options.type === 'file' && entry.isDirectory) continue;
    if (options.type === 'dir' && !entry.isDirectory) continue;

    // Match pattern against file name (supports glob)
    const nameToMatch = options.ignoreCase ? entry.name.toLowerCase() : entry.name;
    const patternToMatch = options.ignoreCase ? pattern.toLowerCase() : pattern;

    let matched: boolean;
    // If pattern contains glob characters, use minimatch
    if (pattern.includes('*') || pattern.includes('?') || pattern.includes('[')) {
      matched = minimatch(nameToMatch, patternToMatch);
    } else {
      // Simple substring match
      matched = nameToMatch.includes(patternToMatch);
    }

    if (matched) {
      let size: number | undefined;
      if (!entry.isDirectory) {
        try {
          const stat = await fs.promises.stat(entry.path);
          size = stat.size;
        } catch {
          // ignore
        }
      }

      results.push({
        filePath: entry.path,
        fileName: entry.name,
        isDirectory: entry.isDirectory,
        size,
      });
    }
  }

  return results;
}
