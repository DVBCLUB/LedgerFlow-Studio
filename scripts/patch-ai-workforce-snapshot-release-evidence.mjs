import fs from 'node:fs';
import path from 'node:path';

const daemonPath = path.resolve('server/assistant-daemon.ts');

if (!fs.existsSync(daemonPath)) {
  throw new Error(`assistant daemon source not found: ${daemonPath}`);
}

let source = fs.readFileSync(daemonPath, 'utf8');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Cannot patch snapshot release evidence: missing ${label}`);
  source = source.replace(search, replacement);
  changed = true;
}

if (!source.includes('/api/ai-workforce/mission-snapshot-export')) {
  throw new Error('Cannot patch snapshot release evidence: snapshot export route is not present.');
}

const releaseEvidenceLine = '      releaseEvidence: body.releaseEvidence && typeof body.releaseEvidence === "object" ? body.releaseEvidence : {},';

if (!source.includes(releaseEvidenceLine)) {
  if (source.includes('      reviewNotes: [...persistedNotes, ...requestNotes],\n    });')) {
    replaceOnce(
      '      reviewNotes: [...persistedNotes, ...requestNotes],\n    });',
      `      reviewNotes: [...persistedNotes, ...requestNotes],\n${releaseEvidenceLine}\n    });`,
      'persisted review notes snapshot options anchor',
    );
  } else if (source.includes('      reviewNotes: Array.isArray(body.reviewNotes) ? body.reviewNotes : [],\n    });')) {
    replaceOnce(
      '      reviewNotes: Array.isArray(body.reviewNotes) ? body.reviewNotes : [],\n    });',
      `      reviewNotes: Array.isArray(body.reviewNotes) ? body.reviewNotes : [],\n${releaseEvidenceLine}\n    });`,
      'direct review notes snapshot options anchor',
    );
  } else {
    throw new Error('Cannot patch snapshot release evidence: snapshot options anchor not found.');
  }
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Mission Snapshot Release Evidence binding patched into assistant-daemon.');
} else {
  console.log('AI Workforce Mission Snapshot Release Evidence binding already applied.');
}
