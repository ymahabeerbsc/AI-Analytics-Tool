const express = require('express');
const fs = require('fs');
const { exec } = require('child_process'); // Import `exec` to run `runcode.py`
const bodyParser = require('body-parser');
const cors = require('cors'); // Optional, only if needed
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors()); // Only use if needed

// File path for chat logs
const chatLogFilePath = path.join(__dirname, 'chat_logs.json');

// Ensure the chat logs JSON file exists
if (!fs.existsSync(chatLogFilePath)) {
    fs.writeFileSync(chatLogFilePath, JSON.stringify([]), 'utf8'); // Initialize empty array
}

// Endpoint to save GPT-4 code response, run `runcode.py`, and return the output
app.post('/save-code', (req, res) => {
    const { code } = req.body;
    const codeFilePath = 'gpt_code_output.py';

    // Save the GPT-generated code to gpt_code_output.py
    fs.writeFile(codeFilePath, code, 'utf8', (err) => {
        if (err) {
            console.error("Error saving code:", err);
            return res.status(500).json({ error: 'Failed to save code', output: null });
        }
        console.log("Code saved successfully to gpt_code_output.py");

        // Run `runcode.py` and capture the output
        exec('python runcode.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing runcode.py: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute code', output: null });
            }
            if (stderr) {
                console.error(`Execution error: ${stderr}`);
                return res.status(500).json({ error: stderr.trim(), output: null });
            }

            console.log(`Execution output: ${stdout}`);

            // Check if a graph was generated
            const graphPath = path.join(__dirname, 'graph_output.png');
            if (fs.existsSync(graphPath)) {
                console.log(`Graph found at ${graphPath}`);
                // If graph exists, return it as base64
                const graphData = fs.readFileSync(graphPath, { encoding: 'base64' });
                fs.unlinkSync(graphPath); // Clean up the graph file
                return res.status(200).json({ output: `data:image/png;base64,${graphData}` });
            }

            // If no graph, return the textual output
            res.status(200).json({ output: stdout.trim() || 'No output was generated.' });
        });
    });
});

// Endpoint to save chat logs to JSON
app.post('/save-chat', (req, res) => {
    const { sessionId, sender, message, timestamp } = req.body;

    if (!sessionId || !sender || !message || !timestamp) {
        return res.status(400).json({ error: 'Invalid chat data' });
    }

    // Load existing chat logs
    let chatLogs = JSON.parse(fs.readFileSync(chatLogFilePath, 'utf8'));

    // Find or create session
    let session = chatLogs.find(log => log.session_id === sessionId);
    if (!session) {
        session = { session_id: sessionId, messages: [] };
        chatLogs.push(session);
    }

    // Append new message to the session
    session.messages.push({ sender, content: message, timestamp });

    // Save updated chat logs back to file
    fs.writeFileSync(chatLogFilePath, JSON.stringify(chatLogs, null, 2), 'utf8');

    console.log(`Chat saved: ${sessionId}, ${sender}, ${timestamp}`);
    res.status(200).json({ success: true });
});

// Endpoint to fetch chat logs
app.get('/get-chats', (req, res) => {
    if (!fs.existsSync(chatLogFilePath)) {
        return res.status(200).json([]); // Return empty array if file doesn't exist
    }

    const chatLogs = JSON.parse(fs.readFileSync(chatLogFilePath, 'utf8'));
    res.status(200).json(chatLogs);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
