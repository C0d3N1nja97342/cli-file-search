import * as fs from 'fs';
import * as path from 'path';

export interface WalkOptions {
  maxDepth?: number;
  hidden?: boolean;
  respectGitignore?: boolean;
}

interface GitignorePatterns {
  patterns: string[];
  negatedPatterns: string[];
}

/**
 * Parse a .gitignore file into include/exclude glob patterns
 */
function parseGitignore(gitignorePath: string): GitignorePatterns {
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const patterns: string[] = [];
  const negatedPatterns: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('!')) {
      negatedPatterns.push(trimmed.slice(1));
    } else {
      patterns.push(trimmed);
    }
  }

  return { patterns, negatedPatterns };
}

/**
 * Check if a file/dir name matches any gitignore pattern (simplified)
 */
function isIgnored(name: string, gitignore: GitignorePatterns): boolean {
  for (const pattern of gitignore.patterns) {
    const normalized = pattern.replace(/^\//, '');
    if (normalized.endsWith('/')) {
      // directory pattern
      if (name === normalized.slice(0, -1)) return true;
    } else {
      // simple file / glob pattern
      if (name === normalized) return true;
      if (normalized.startsWith('*.')) {
        const ext = normalized.slice(1); // e.g. "*.log" → ".log"
        if (name.endsWith(ext)) return true;
      }
    }
  }
  return false;
}

export interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  depth: number;
}

/**
 * Walk a directory tree, yielding FileEntry objects.
 * Respects .gitignore and hidden file settings.
 */
export async function* walkDir(
  root: string,
  options: WalkOptions = {}
): AsyncGenerator<FileEntry> {
  const { maxDepth = 20, hidden = false, respectGitignore = true } = options;

  async function* walk(currentPath: string, depth: number): AsyncGenerator<FileEntry> {
    if (depth > maxDepth) return;

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    } catch {
      return; // permission denied or similar
    }

    // Load .gitignore if present
    let gitignore: GitignorePatterns | null = null;
    if (respectGitignore) {
      const gitignorePath = path.join(currentPath, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        try {
          gitignore = parseGitignore(gitignorePath);
        } catch {
          // ignore parse errors
        }
      }
    }

    for (const entry of entries) {
      // Skip hidden files/dirs unless enabled
      if (!hidden && entry.name.startsWith('.')) continue;

      // Check gitignore
      if (gitignore && isIgnored(entry.name, gitignore)) continue;

      const fullPath = path.join(currentPath, entry.name);

      yield {
        path: fullPath,
        name: entry.name,
        isDirectory: entry.isDirectory(),
        depth,
      };

      // Recurse into directories
      if (entry.isDirectory()) {
        // Skip common large / irrelevant directories
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        yield* walk(fullPath, depth + 1);
      }
    }
  }

  yield* walk(path.resolve(root), 0);
}

/**
 * Read file content as string, returns null for binary files or errors.
 */
export async function readFileContent(filePath: string): Promise<string | null> {
  try {
    const buffer = await fs.promises.readFile(filePath);

    // Simple binary detection: check for null bytes in first 8KB
    const sample = buffer.subarray(0, 8192);
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0) return null; // likely binary
    }

    return buffer.toString('utf-8');
  } catch {
    return null;
  }
}
