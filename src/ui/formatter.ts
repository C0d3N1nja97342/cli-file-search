import chalk from 'chalk';
import * as path from 'path';
import { NameSearchResult } from '../search/nameSearch';
import { ContentSearchResult } from '../search/contentSearch';

interface FormatOptions {
  mode: 'name' | 'content';
  pattern?: string;
  keyword?: string;
}

/**
 * Format file size to human-readable string
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Truncate a line for display
 */
function truncateLine(line: string, maxLength: number = 120): string {
  if (line.length <= maxLength) return line;
  return line.slice(0, maxLength - 3) + '...';
}

/**
 * Highlight keyword in a line
 */
function highlightKeyword(line: string, keyword: string, ignoreCase: boolean): string {
  if (!keyword) return line;
  const flags = ignoreCase ? 'gi' : 'g';
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return line.replace(
    new RegExp(escaped, flags),
    (match) => chalk.bold.red(match)
  );
}

export function formatResults(
  results: NameSearchResult[] | ContentSearchResult[],
  options: FormatOptions
): void {
  if (options.mode === 'name') {
    formatNameResults(results as NameSearchResult[], options);
  } else {
    formatContentResults(results as ContentSearchResult[], options);
  }
}

function formatNameResults(results: NameSearchResult[], options: FormatOptions): void {
  const pattern = options.pattern || '';

  if (results.length === 0) {
    console.log(chalk.yellow(`\n  No files found matching "${pattern}"\n`));
    return;
  }

  console.log('');
  console.log(
    chalk.cyan('  🔍 Search results for: ') +
    chalk.bold.white(`"${pattern}"`)
  );
  console.log(chalk.gray(`  Found ${results.length} result${results.length > 1 ? 's' : ''}\n`));

  for (const result of results) {
    const icon = result.isDirectory ? chalk.blue('📁') : chalk.green('📄');
    const name = result.isDirectory
      ? chalk.bold.blue(result.fileName + '/')
      : chalk.bold.green(result.fileName);

    const relPath = path.relative('.', result.filePath);
    const dir = path.dirname(relPath);
    const dirDisplay = dir === '.' ? '' : chalk.gray(dir + path.sep);

    const sizeDisplay = result.size !== undefined
      ? chalk.gray(` (${formatSize(result.size)})`)
      : '';

    console.log(`  ${icon} ${dirDisplay}${name}${sizeDisplay}`);
  }

  console.log('');
}

function formatContentResults(results: ContentSearchResult[], options: FormatOptions): void {
  const keyword = options.keyword || '';

  if (results.length === 0) {
    console.log(chalk.yellow(`\n  No matches found for "${keyword}"\n`));
    return;
  }

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  console.log('');
  console.log(
    chalk.cyan('  🔍 Content search for: ') +
    chalk.bold.white(`"${keyword}"`)
  );
  console.log(
    chalk.gray(`  Found ${totalMatches} match${totalMatches > 1 ? 'es' : ''} in ${results.length} file${results.length > 1 ? 's' : ''}\n`)
  );

  for (const result of results) {
    const relPath = path.relative('.', result.filePath);
    console.log(`  ${chalk.bold.cyan(relPath)}`);

    for (const match of result.matches) {
      const lineNum = chalk.yellow(`${match.line}`.padStart(4));
      const separator = chalk.gray(' │ ');

      // Context before
      for (let i = 0; i < match.contextBefore.length; i++) {
        const ctxLineNum = chalk.gray(`${match.line - match.contextBefore.length + i}`.padStart(4));
        const ctxSep = chalk.gray(' ┊ ');
        console.log(`  ${ctxLineNum}${ctxSep}${chalk.gray(truncateLine(match.contextBefore[i]))}`);
      }

      // Match line
      const highlighted = highlightKeyword(
        truncateLine(match.text),
        keyword,
        true
      );
      console.log(`  ${lineNum}${separator}${highlighted}`);

      // Context after
      for (let i = 0; i < match.contextAfter.length; i++) {
        const ctxLineNum = chalk.gray(`${match.line + i + 1}`.padStart(4));
        const ctxSep = chalk.gray(' ┊ ');
        console.log(`  ${ctxLineNum}${ctxSep}${chalk.gray(truncateLine(match.contextAfter[i]))}`);
      }
    }

    console.log('');
  }
}
