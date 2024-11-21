const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');  // Import `exec` to run `runcode.py`
const bodyParser = require('body-parser');
const cors = require('cors');  // Optional, only if needed

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors()); // Only use if needed

// Endpoint to save GPT-4 code response, run `runcode.py`, and return the output
app.post('/save-code', (req, res) => {
    const { code } = req.body;
    const codeFilePath = 'gpt_code_output.py';

    // Save the GPT-generated code to gpt_code_output.py
    fs.writeFile(codeFilePath, code, 'utf8', (err) => {
        if (err) {
            console.error("Error saving code:", err);
            return res.status(500).json({ error: 'Failed to save code' });
        }
        console.log("Code saved successfully to gpt_code_output.py");

        // Run `runcode.py` and capture the output
        exec('python runcode.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing runcode.py: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute code' });
            }
            if (stderr) {
                console.error(`Execution error: ${stderr}`);
                return res.status(500).json({ message: 'Generated' });
            }
            
            console.log(`Execution output: ${stdout}`);
            res.status(200).json({ output: stdout.trim() }); // Send back the result
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
