import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function getGitStatus(cwd = process.cwd()) {
  try {
    // Check if git repo
    await execAsync('git rev-parse --is-inside-work-tree', { cwd });
    
    // Get branch
    const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd });
    const branch = branchOut.trim();

    // Get porcelain status
    const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd });
    const lines = statusOut.split('\n').filter(Boolean);
    const modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M ')).length;
    const added = lines.filter(l => l.startsWith('A ') || l.startsWith('?')).length;
    const deleted = lines.filter(l => l.startsWith(' D') || l.startsWith('D ')).length;

    // Get last commits
    const { stdout: logOut } = await execAsync('git log -n 5 --oneline', { cwd });
    const commits = logOut.split('\n').filter(Boolean).map(line => {
      const parts = line.split(' ');
      return {
        hash: parts[0],
        message: parts.slice(1).join(' ')
      };
    });

    return {
      isRepo: true,
      branch,
      filesCount: lines.length,
      modified,
      added,
      deleted,
      files: lines.slice(0, 15).map(l => ({
        status: l.substring(0, 2).trim(),
        path: l.substring(3).trim()
      })),
      commits
    };
  } catch (err) {
    return {
      isRepo: false,
      error: 'Not a git repository or git unavailable'
    };
  }
}
