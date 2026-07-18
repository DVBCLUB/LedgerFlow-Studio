const fs = require('fs');
const readline = require('readline');

const logFilePath = 'C:\\Users\\BAO\\.gemini\\antigravity-ide\\brain\\aa84138c-d967-4096-a636-edbaa7fbbb77\\.system_generated\\logs\\transcript_full.jsonl';

async function processLog() {
    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const entry = JSON.parse(line);
            if (entry.tool_calls && entry.tool_calls.length > 0) {
                console.log(JSON.stringify(entry.tool_calls[0], null, 2));
                break;
            }
        } catch (e) {
        }
    }
}

processLog().catch(console.error);
