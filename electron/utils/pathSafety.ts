// Utility: Path traversal validation
// Returns true if the given path is safe (does not escape the base directory)
import path from 'path';

export function isPathSafe(baseDir: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget.startsWith(resolvedBase + path.sep);
}
