// Generate a unique session ID
function generateSessionId() {
    return Math.random().toString(36).substr(2, 9); // Short unique ID for session
}

// Import GPT-4 Turbo integration
async function sendMessageToGPT4Turbo(message) {
    const apiEndpoint = "https://api.openai.com/v1/chat/completions";
    const apiKey = "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";

    const payload = {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: message }],
        max_tokens: 4096,
        temperature: 0,
    };

    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error communicating with GPT-4 Turbo:", error);
        return "An error occurred while processing your message.";
    }
}

// Chatbot functionality
document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatbot-input");
    const sendButton = document.getElementById("send-chatbot-message");
    const chatDisplay = document.createElement("div");
    const sessionId = generateSessionId(); // Generate a unique session ID for this session
    let csvData = [];

    // Apply ID and class for CSS styling
    chatDisplay.id = "chat-display";
    chatDisplay.className = "chat-display";

    // Insert the chat display into the bottom container
    const bottomContainer = document.getElementById("bottom-container");
    bottomContainer.insertBefore(chatDisplay, bottomContainer.firstChild);

    // Load CSV data
    async function loadCsvData(url) {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                complete: function (results) {
                    csvData = results.data;
                    resolve();
                },
                error: function (error) {
                    console.error("Error loading CSV:", error);
                    reject(error);
                },
            });
        });
    }

    // Format CSV data for GPT prompt
    function formatCsvDataForPrompt() {
        return "I have a CSV file called CD_with_clusters_and_ranking.csv with the following columns: " +
               "Activity, Sub_Activity, Agglomerative_Cluster, Supplier, Doc_Volume, Delivery_Time, " +
               "Net_Price, Rank_Doc_Volume, Rank_Delivery_Time, Rank_Net_Price, Overall_Score_Cluster, Overall_Rank_By_Cluster, Overall_Score_SubActivity, Overall_Rank_SubActivity, Overall_Score_Activity, Overall_Rank_Activity, Overall_Rank_Global.";
    }

    // Build prompt with CSV context and user question
    function buildPrompt(question) {
        const csvContext = formatCsvDataForPrompt();
        return `${csvContext} Write a single block of Python code that loads this CSV file and answers the below question. Do not mention the words 'python', 'csv', 'column', or 'code'. The questions will only be about suppliers based on their activities (Activity consists of either the following options: Cleaning, Maintenance, Rentals) or their subactivities (Sub_Activity consists of either the following options: Blank, Civil Works, Management Services) or both. The net price is in rands. And in your analysis you may need to access the rank of a supplier by the following sorting system called Alpha: If you have neither the activity nor the subactivity, you would look at the column 'Overall_Rank_Global'; If only activity, 'Overall_Rank_Activity'; If subactivity and activity, 'Overall_Rank_SubActivity'; If subactivity and activity and cluster, 'Overall_Rank_By_Cluster' - but never mention this logic to the user, just do it. If they ask for the worst supplier or x number of worst suppliers, filter the necessary Alpha column by descending rank and then list the first or first x suppliers. If they ask for the best supplier or x number of best suppliers, filter the necessary Alpha column by ascending rank and then list the first or first x suppliers. Ensure that all code you output ends with some sort of print or display output. If they ask which suppliers they should cut to save y amount of money, step 1: filter the necessary Alpha column by descending rank, step 2: if the first supplier exceeds y then search for the next closest supplier whose net price is less than y, step 3: else sum the net prices of the top suppliers till that number is less than but does not exceed value y. If you make graphs, make sure they are detailed and informative but not too complex to interpret, and subactivity must never be graphed without activity, and clusters must never be graphed without activity and subactivity, and graphs must always contain units if there are numbers. Engage in pleasantries but you may not answer if it doesn't pertain to the dataset, and you must do analysis if it is required (no confabulation). Make sure the answer that python outputs is easily understandable, and make sure the responses are not too detailed and technical unless a technical question is asked. And make sure your response is formatted nicely in markdown. And NEVER provide a response without the answer - if you are unable to process a response, tell them to try again in a moment. Here is the question: ${question}`;
    }

    // Extract text without code
    function extractTextWithoutCode(responseContent) {
        const codePatterns = [
            { start: "```python", end: "```" },
            { start: "###python", end: "###" },
            { start: "***python", end: "***" }
        ];

        let cleanText = responseContent;

        // Remove all code blocks
        codePatterns.forEach(pattern => {
            let start = cleanText.indexOf(pattern.start);
            while (start !== -1) {
                const end = cleanText.indexOf(pattern.end, start + pattern.start.length);
                if (end !== -1) {
                    cleanText = cleanText.slice(0, start) + cleanText.slice(end + pattern.end.length);
                } else {
                    cleanText = cleanText.slice(0, start);
                }
                start = cleanText.indexOf(pattern.start);
            }
        });

        return cleanText.trim();
    }

    // Save extracted code to the server and handle response
    async function saveCodeToServer(code) {
        try {
            const response = await fetch("http://localhost:3000/save-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code }),
            });
    
            const data = await response.json();
            if (data.error) {
                displayMessage(`Error: ${data.error}`, "bot");
            } else if (data.output) {
                if (data.output.startsWith("data:image")) {
                    const botTimestamp = new Date().toISOString();
                    displayImageMessage(data.output, "bot");
                    saveChatToServer(sessionId, "bot", data.output, botTimestamp); // Save base64 image to JSON
                } else {
                    // Display text output
                    displayMarkdownMessage(data.output, "bot");
                }
            } else {
                displayMessage("No output was returned from the server.", "bot");
            }
        } catch (error) {
            console.error("Error sending code to server:", error);
            displayMessage("An error occurred while saving the code.", "bot");
        }
    }
    
    function saveChatToServer(sessionId, sender, message, timestamp) {
        fetch("http://localhost:3000/save-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId, sender, message, timestamp }),
        }).catch((error) => {
            console.error("Error saving chat to server:", error);
        });
    }
    

    async function handleMessageSend() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // Display user's message and clear input
        const timestamp = new Date().toISOString();

        displayMessage(userMessage, "user");
        saveChatToServer(sessionId, "user", userMessage, timestamp); // Save user message

        chatInput.value = "";

        // Display typing indicator
        const typingIndicator = displayTypingIndicator();

        try {
            // Build prompt and send to GPT-4 Turbo
            const prompt = buildPrompt(userMessage);
            const gptResponse = await sendMessageToGPT4Turbo(prompt);

            // Extract and display text (excluding code)
            const text = extractTextWithoutCode(gptResponse);
            const botTimestamp = new Date().toISOString();

            displayMarkdownMessage(text, "bot");
            saveChatToServer(sessionId, "bot", text, botTimestamp); // Save bot response

            // Extract and send code to the server
            const codeStart = gptResponse.indexOf("```python");
            if (codeStart !== -1) {
                const codeEnd = gptResponse.indexOf("```", codeStart + 9);
                const code = gptResponse.slice(codeStart + 9, codeEnd).trim();
                await saveCodeToServer(code);
            }

            // Remove typing indicator
            typingIndicator.remove();
        } catch (error) {
            console.error("Error processing message:", error);
            typingIndicator.remove();
            displayMessage("An error occurred. Please try again.", "bot");
        }
    }

    function displayMessage(content, sender) {
        const messageBubble = document.createElement("div");
        messageBubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";

        if (sender === "user") {
            // Use textContent for user messages (old behavior)
            messageBubble.textContent = content;
        } else {
            // Use innerHTML for bot messages to allow formatting
            messageBubble.innerHTML = `<pre>${content}</pre>`;
        }    
        chatDisplay.appendChild(messageBubble);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

        return messageBubble;
    }

    function displayMarkdownMessage(content, sender) {
        const messageBubble = document.createElement("div");
        messageBubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";

        // Render markdown to HTML
        messageBubble.innerHTML = marked.parse(content);

        chatDisplay.appendChild(messageBubble);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

        return messageBubble;
    }

    function displayImageMessage(imageSrc, sender) {
        const messageBubble = document.createElement("div");
        messageBubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";

        // Render image
        const img = document.createElement("img");
        img.src = imageSrc;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        messageBubble.appendChild(img);

        chatDisplay.appendChild(messageBubble);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

        return messageBubble;
    }

    function displayTypingIndicator() {
        const typingIndicator = document.createElement("div");
        typingIndicator.className = "typing-indicator";

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement("span");
            typingIndicator.appendChild(dot);
        }

        chatDisplay.appendChild(typingIndicator);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

        return typingIndicator;
    }

    sendButton.addEventListener("click", handleMessageSend);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleMessageSend();
        }
    });

    // Load CSV data on startup
    loadCsvData("CD_with_clusters_and_ranking.csv").catch((error) =>
        displayMessage("Error loading CSV data: " + error, "bot")
    );
});
