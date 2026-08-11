const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFilePath = 'C:\\Users\\BAO\\.gemini\\antigravity-ide\\brain\\aa84138c-d967-4096-a636-edbaa7fbbb77\\.system_generated\\logs\\transcript_full.jsonl';

async function processLog() {
    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const keys = new Set();
    const actions = {};

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const entry = JSON.parse(line);
            if (entry.tool_calls) {
                for (const call of entry.tool_calls) {
                    const args = call.arguments;
                    if (args && args.TargetFile) {
                        keys.add(args.TargetFile);
                        if (!actions[args.TargetFile]) actions[args.TargetFile] = [];
                        actions[args.TargetFile].push(call.name);
                    }
                }
            }
        } catch (e) {
        }
    }
    console.log("Keys found:");
    for (const key of keys) {
        console.log(`${key} - actions: ${actions[key].join(', ')}`);
    }
}

processLog().catch(console.error);
