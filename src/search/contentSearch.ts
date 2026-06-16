import * as path from 'path';
import { walkDir, readFileContent } from '../utils/walker';
import { minimatch } from 'minimatch';

export interface ContentSearchOptions {
  directory: string;
  ignoreCase: boolean;
  useRegex: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  maxDepth: number;
  hidden: boolean;
  contextLines: number;
  respectGitignore: boolean;
}

export interface ContentMatch {
  line: number;
  column: number;
  text: string;
  contextBefore: string[];
  contextAfter: string[];
}

export interface ContentSearchResult {
  filePath: string;
  fileName: string;
  matches: ContentMatch[];
}

export async function searchByContent(
  keyword: string,
  options: ContentSearchOptions
): Promise<ContentSearchResult[]> {
  const results: ContentSearchResult[] = [];

  // Compile regex if needed
  let regex: RegExp | null = null;
  if (options.useRegex) {
    try {
      regex = new RegExp(keyword, options.ignoreCase ? 'gi' : 'g');
    } catch (err: any) {
      throw new Error(`Invalid regular expression: ${err.message}`);
    }
  }

  for await (const entry of walkDir(options.directory, {
    maxDepth: options.maxDepth,
    hidden: options.hidden,
    respectGitignore: options.respectGitignore,
  })) {
    // Only search files
    if (entry.isDirectory) continue;

    // Check include patterns
    const included = options.includePatterns.some(
      (p) => p === '*' || minimatch(entry.name, p)
    );
    if (!included) continue;

    // Check exclude patterns
    const excluded = options.excludePatterns.some(
      (p) => p && minimatch(entry.name, p)
    );
    if (excluded) continue;

    // Read file content
    const content = await readFileContent(entry.path);
    if (content === null) continue; // binary or unreadable

    const lines = content.split('\n');
    const matches: ContentMatch[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let matchFound = false;
      let column = -1;

      if (options.useRegex && regex) {
        const testRegex = new RegExp(regex.source, regex.flags);
        const m = testRegex.exec(line);
        if (m) {
          matchFound = true;
          column = m.index + 1;
        }
      } else {
        const haystack = options.ignoreCase ? line.toLowerCase() : line;
        const needle = options.ignoreCase ? keyword.toLowerCase() : keyword;
        const idx = haystack.indexOf(needle);
        if (idx !== -1) {
          matchFound = true;
          column = idx + 1;
        }
      }

      if (matchFound) {
        matches.push({
          line: i + 1,
          column,
          text: line,
          contextBefore: lines.slice(
            Math.max(0, i - options.contextLines),
            i
          ),
          contextAfter: lines.slice(
            i + 1,
            i + 1 + options.contextLines
          ),
        });
      }
    }

    if (matches.length > 0) {
      results.push({
        filePath: entry.path,
        fileName: entry.name,
        matches,
      });
    }
  }

  return results;
}
