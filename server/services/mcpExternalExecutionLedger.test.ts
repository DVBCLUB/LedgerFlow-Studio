import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import test from 'node:test';
import { claimMCPExternalExecution, clearMCPExternalExecutionLedgerForTest, resolveMCPExternalExecution } from './mcpExternalExecutionLedger.ts';
test('external execution ledger deduplicates reviewed input and rejects key reuse for changed input', async (t) => {
 const dir=await fs.promises.mkdtemp(path.join(os.tmpdir(),'ledgerflow-mcp-ledger-')); const old=process.env.MCP_EXTERNAL_EXECUTION_LEDGER_FILE; process.env.MCP_EXTERNAL_EXECUTION_LEDGER_FILE=path.join(dir,'ledger.json'); await clearMCPExternalExecutionLedgerForTest(); t.after(async()=>{if(old===undefined) delete process.env.MCP_EXTERNAL_EXECUTION_LEDGER_FILE; else process.env.MCP_EXTERNAL_EXECUTION_LEDGER_FILE=old; await fs.promises.rm(dir,{recursive:true,force:true});});
 const input={idempotencyKey:'invoice-2026-0001',fingerprint:'a'.repeat(64),serverId:'crm',toolName:'create_invoice'}; assert.equal((await claimMCPExternalExecution(input)).claimed,true); assert.equal((await claimMCPExternalExecution(input)).claimed,false); await assert.rejects(()=>claimMCPExternalExecution({...input,fingerprint:'b'.repeat(64)}),/different reviewed input/); assert.equal((await resolveMCPExternalExecution(input.idempotencyKey,{result:{externalId:'x1'}})).status,'completed');
});
