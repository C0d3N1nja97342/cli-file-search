# 🔍 cli-file-search

A fast and colorful CLI file search tool written in TypeScript.

**Search by name · Search by content · Colorful output · .gitignore aware**

---

## Installation

```bash
# Clone the repo
git clone <repo-url>
cd nodejs-cli-file-search

# Install dependencies
npm install

# Build
npm run build

# Install globally (optional)
npm link
```

## Quick Start

```bash
# Search by file name
cli-file-search name "*.ts"
cli-file-search name "README" -d ./docs

# Search by file content
cli-file-search content "TODO" -i
cli-file-search content "import.*from" -r --include "*.ts"
```

---

## Commands

### `cli-file-search name <pattern>`

Search files by name pattern. Supports glob syntax.

```bash
cli-file-search name "*.ts"                # Find all TypeScript files
cli-file-search name "test-*" -d ./src     # Find files starting with test- under src
cli-file-search name "config" -i           # Case-insensitive search
cli-file-search name "*.json" --type dir   # Search directories only
cli-file-search name ".env" --hidden       # Include hidden files
```

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--dir <directory>` | `-d` | `.` | Directory to search |
| `--ignore-case` | `-i` | `false` | Case-insensitive matching |
| `--type <type>` | `-t` | `file` | Filter by type: `file` / `dir` / `all` |
| `--max-depth <depth>` | | `20` | Maximum search depth |
| `--hidden` | | `false` | Include hidden files |
| `--no-ignore` | | | Don't respect .gitignore |

### `cli-file-search content <keyword>`

Search file contents by keyword. Like grep, with regex support.

```bash
cli-file-search content "console.log"                    # Find files containing console.log
cli-file-search content "TODO|FIXME" -r                  # Use regular expressions
cli-file-search content "import" --include "*.ts,*.tsx"  # Search only in ts/tsx files
cli-file-search content "error" --exclude "*.log"        # Exclude .log files
cli-file-search content "function" -n 2                  # Show 2 lines of context
cli-file-search content "config" --hidden                # Include hidden files
```

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--dir <directory>` | `-d` | `.` | Directory to search |
| `--ignore-case` | `-i` | `false` | Case-insensitive matching |
| `--regex` | `-r` | `false` | Treat keyword as regular expression |
| `--include <globs>` | | `*` | File patterns to include (comma-separated) |
| `--exclude <globs>` | | | File patterns to exclude (comma-separated) |
| `--max-depth <depth>` | | `20` | Maximum search depth |
| `--hidden` | | `false` | Include hidden files |
| `--context <lines>` | `-n` | `0` | Lines of context around each match |
| `--no-ignore` | | | Don't respect .gitignore |

---

## Output Examples

### Name Search

```
  🔍 Search results for: "*.ts"
  Found 5 results

  📄 src\index.ts (3.1 KB)
  📄 src\search\contentSearch.ts (3.0 KB)
  📄 src\search\nameSearch.ts (1.9 KB)
  📄 src\ui\formatter.ts (4.3 KB)
  📄 src\utils\walker.ts (3.7 KB)
```

### Content Search

```
  🔍 Content search for: "interface"
  Found 9 matches in 4 files

  src\search\contentSearch.ts
     4 ┊
     5 │ export interface ContentSearchOptions {
     6 ┊   directory: string;

  src\search\nameSearch.ts
     6 │ export interface NameSearchOptions {
```

---

## Project Structure

```
src/
├── index.ts                  # CLI entry point & command definitions
├── search/
│   ├── nameSearch.ts         # File name search logic
│   └── contentSearch.ts      # File content search logic
├── ui/
│   └── formatter.ts          # Colorful output formatting
└── utils/
    └── walker.ts             # Directory traversal & .gitignore parsing
```

## Tech Stack

| Library | Purpose |
|---------|---------|
| [commander](https://github.com/tj/commander.js) | CLI command definitions & argument parsing |
| [chalk](https://github.com/chalk/chalk) | Terminal colored output |
| [minimatch](https://github.com/isaacs/minimatch) | Glob pattern matching |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |

## Development

```bash
npm run dev -- name "*.ts"      # Run in dev mode
npm run build                    # Compile TypeScript
npm run start -- content "test"  # Run after build
```

## Features

- ✅ Glob file name search
- ✅ Content search with regex support
- ✅ Case-insensitive matching
- ✅ Automatic .gitignore respect
- ✅ Hidden file support
- ✅ Search depth limiting
- ✅ Include/exclude file patterns
- ✅ Context line display
- ✅ Automatic binary file skipping
- ✅ Color-highlighted output
- ✅ File size display

## License

MIT
