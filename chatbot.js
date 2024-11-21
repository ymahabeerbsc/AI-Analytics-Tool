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
        return `${csvContext} Write Python code to answer the following question: ${question}`;
    }

    // Extract Python code from GPT response
    function extractCode(responseContent) {
        const codeStart = responseContent.indexOf("```python");
        const codeEnd = responseContent.indexOf("```", codeStart + 9);
        return codeStart !== -1 && codeEnd !== -1
            ? responseContent.slice(codeStart + 9, codeEnd).trim()
            : responseContent.trim();
    }

    // Save extracted code to the server
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
            } else {
                displayMessage(data.output, "bot");
            }
        } catch (error) {
            console.error("Error sending code to server:", error);
            displayMessage("An error occurred while saving the code.", "bot");
        }
    }

    async function handleMessageSend() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // Display user's message and clear input
        displayMessage(userMessage, "user");
        chatInput.value = "";

        // Display typing indicator
        const typingIndicator = displayTypingIndicator();

        try {
            // Build prompt and send to GPT-4 Turbo
            const prompt = buildPrompt(userMessage);
            const gptResponse = await sendMessageToGPT4Turbo(prompt);

            // Extract Python code and save to server
            const code = extractCode(gptResponse);
            await saveCodeToServer(code);

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

        messageBubble.textContent = content;
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
