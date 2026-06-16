#!/usr/bin/env node

import { program } from 'commander';
import { searchByName } from './search/nameSearch';
import { searchByContent } from './search/contentSearch';
import { formatResults } from './ui/formatter';
import chalk from 'chalk';

program
  .name('cli-file-search')
  .description('🔍 A fast and colorful CLI file search tool')
  .version('1.0.0');

// ─── Search by file name ─────────────────────────────────────────
program
  .command('name <pattern>')
  .description('Search files by name pattern (supports glob syntax)')
  .option('-d, --dir <directory>', 'Search directory', '.')
  .option('-i, --ignore-case', 'Case-insensitive matching', false)
  .option('-t, --type <type>', 'Filter by type: file | dir | all', 'file')
  .option('--max-depth <depth>', 'Maximum search depth', '20')
  .option('--hidden', 'Include hidden files/directories', false)
  .option('--no-ignore', 'Do not respect .gitignore', false)
  .action(async (pattern, options) => {
    try {
      const results = await searchByName(pattern, {
        directory: options.dir,
        ignoreCase: options.ignoreCase,
        type: options.type,
        maxDepth: parseInt(options.maxDepth, 10),
        hidden: options.hidden,
        respectGitignore: options.ignore !== false,
      });
      formatResults(results, { mode: 'name', pattern });
    } catch (err: any) {
      console.error(chalk.red(`\n  ✖ Error: ${err.message}\n`));
      process.exit(1);
    }
  });

// ─── Search by file content ──────────────────────────────────────
program
  .command('content <keyword>')
  .description('Search file contents by keyword (like grep)')
  .option('-d, --dir <directory>', 'Search directory', '.')
  .option('-i, --ignore-case', 'Case-insensitive matching', false)
  .option('-r, --regex', 'Treat keyword as regular expression', false)
  .option('--include <globs>', 'File patterns to include (comma-separated)', '*')
  .option('--exclude <globs>', 'File patterns to exclude (comma-separated)', '')
  .option('--max-depth <depth>', 'Maximum search depth', '20')
  .option('--hidden', 'Include hidden files', false)
  .option('-n, --context <lines>', 'Lines of context around match', '0')
  .option('--no-ignore', 'Do not respect .gitignore', false)
  .action(async (keyword, options) => {
    try {
      const results = await searchByContent(keyword, {
        directory: options.dir,
        ignoreCase: options.ignoreCase,
        useRegex: options.regex,
        includePatterns: options.include.split(',').map((s: string) => s.trim()),
        excludePatterns: options.exclude ? options.exclude.split(',').map((s: string) => s.trim()) : [],
        maxDepth: parseInt(options.maxDepth, 10),
        hidden: options.hidden,
        contextLines: parseInt(options.context, 10),
        respectGitignore: options.ignore !== false,
      });
      formatResults(results, { mode: 'content', keyword });
    } catch (err: any) {
      console.error(chalk.red(`\n  ✖ Error: ${err.message}\n`));
      process.exit(1);
    }
  });

program.parse();
