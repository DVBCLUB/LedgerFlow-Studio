const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFilePath = 'C:\\Users\\BAO\\.gemini\\antigravity-ide\\brain\\aa84138c-d967-4096-a636-edbaa7fbbb77\\.system_generated\\logs\\transcript_full.jsonl';
const workspacePath = 'd:\\CODE\\LedgerFlow-Studio';

async function processLog() {
    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const fileContents = {};
    let count = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const entry = JSON.parse(line);
            if (entry.tool_calls) {
                for (const call of entry.tool_calls) {
                    const args = call.args;
                    if (!args) continue;
                    
                    if (call.name === 'write_to_file' || call.name === 'default_api:write_to_file') {
                        if (args.TargetFile && args.CodeContent) {
                            fileContents[args.TargetFile] = args.CodeContent;
                            count++;
                        }
                    } else if (call.name === 'replace_file_content' || call.name === 'default_api:replace_file_content') {
                        if (args.TargetFile && args.ReplacementContent !== undefined && args.StartLine && args.EndLine) {
                            const currentContent = fileContents[args.TargetFile];
                            if (currentContent) {
                                const lines = currentContent.split('\n');
                                const newLines = args.ReplacementContent.split('\n');
                                lines.splice(args.StartLine - 1, args.EndLine - args.StartLine + 1, ...newLines);
                                fileContents[args.TargetFile] = lines.join('\n');
                                count++;
                            }
                        }
                    } else if (call.name === 'multi_replace_file_content' || call.name === 'default_api:multi_replace_file_content') {
                        if (args.TargetFile && args.ReplacementChunks) {
                            let currentContent = fileContents[args.TargetFile];
                            if (currentContent) {
                                const chunks = [...args.ReplacementChunks].sort((a, b) => b.StartLine - a.StartLine);
                                for (const chunk of chunks) {
                                    const lines = currentContent.split('\n');
                                    const newLines = chunk.ReplacementContent.split('\n');
                                    lines.splice(chunk.StartLine - 1, chunk.EndLine - chunk.StartLine + 1, ...newLines);
                                    currentContent = lines.join('\n');
                                }
                                fileContents[args.TargetFile] = currentContent;
                                count++;
                            }
                        }
                    }
                }
            }
        } catch (e) {}
    }

    console.log(`Processed ${count} write/replace actions.`);

    const filesToRecover = [
        "server/services/aiWorkforceWorldClassReadiness.ts",
        "src/modules/ai-nhan-su/WorldClassReadinessPanel.tsx",
        "server/services/openClawWebRobotOperator.ts",
        "src/modules/ai-nhan-su/OpenClawWebRobotPanel.tsx",
        "server/services/aiWorkforceMissionTraceLedger.ts",
        "server/services/aiWorkforceRoleEvaluationSuite.ts",
        "server/services/aiWorkforceRuntimeStore.ts",
        "server/services/webAiReliability.ts",
        "server/services/webAiScheduler.ts",
        "server/services/agentToolIds.ts",
        "server/services/accountingRoutes.ts",
        "src/modules/ai-nhan-su/AIOperationsCenter.tsx",
        "server/assistant-daemon.ts",
        "src/modules/ai-nhan-su/RobotLabPanel.tsx",
        "server/services/robotConnector.ts",
        "server/services/auditLog.ts",
        "src/modules/ai-nhan-su/AIWorkforceMissionTrace.tsx",
        "src/utils/assistantApi.ts",
        "src/modules/ai-nhan-su/ai-assistant/WebAISchedulerPanel.tsx"
    ];

    let recovered = 0;
    for (const file of filesToRecover) {
        const absolutePath = path.join(workspacePath, file).replace(/\\/g, '\\\\');
        const contentKey = Object.keys(fileContents).find(k => 
            k.toLowerCase() === absolutePath.toLowerCase() || 
            k.toLowerCase() === path.join(workspacePath, file).toLowerCase() ||
            k.toLowerCase() === file.toLowerCase() ||
            k.toLowerCase().endsWith(file.toLowerCase())
        );
        
        if (contentKey) {
            const destPath = path.join(workspacePath, file);
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.writeFileSync(destPath, fileContents[contentKey]);
            console.log(`Recovered: ${file}`);
            recovered++;
        } else {
            console.log(`Missing: ${file}`);
        }
    }
    console.log(`Successfully recovered ${recovered} files!`);
}

processLog().catch(console.error);
