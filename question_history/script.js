// Ensure the toggle button works for the collapsible sidebar
document.getElementById("toolbar-toggle-button").addEventListener("click", () => {
    const toolbar = document.getElementById("toolbar");
    const toggleButton = document.getElementById("toolbar-toggle-button");

    // Toggle the 'hidden' class on the toolbar
    toolbar.classList.toggle("hidden");

    // Update toggle button styles
    if (toolbar.classList.contains("hidden")) {
        toggleButton.style.backgroundColor = "transparent"; // Remove background color
    } else {
        toggleButton.style.backgroundColor = "#2ec4b6"; // Add background to the toggle button
        toggleButton.style.borderRadius = "5px";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const chatLogsContainer = document.getElementById("chat-logs");

    // Function to fetch chat logs from the server
    async function fetchChatLogs() {
        try {
            const response = await fetch("http://localhost:3000/get-chats"); // Server endpoint to fetch chats
            if (!response.ok) {
                throw new Error(`Failed to fetch chat logs: ${response.statusText}`);
            }
            const chatLogs = await response.json(); // Parse JSON response
            displayChatLogs(chatLogs);
        } catch (error) {
            console.error("Error fetching chat logs:", error);
            chatLogsContainer.innerHTML = `<p class="error">Unable to load chat logs. Please try again later.</p>`;
        }
    }

    // Function to display chat logs
    function displayChatLogs(chatLogs) {
        if (!chatLogs.length) {
            chatLogsContainer.innerHTML = `<p>No chat logs available.</p>`;
            return;
        }

        chatLogs.forEach(session => {
            const sessionDiv = document.createElement("div");
            sessionDiv.className = "session";

            const sessionHeader = document.createElement("h2");
            sessionHeader.textContent = `Session ID: ${session.session_id}`;
            sessionDiv.appendChild(sessionHeader);

            session.messages.forEach(message => {
                const messageDiv = document.createElement("div");
                messageDiv.className = message.sender === "user" ? "message user" : "message bot";

                // Display message content (text or image)
                if (message.content.startsWith("data:image")) {
                    const img = document.createElement("img");
                    img.src = message.content; // Base64 image
                    img.alt = "Graph";
                    img.style.maxWidth = "100%";
                    img.style.borderRadius = "8px";
                    messageDiv.appendChild(img);
                } else {
                    const text = document.createElement("p");
                    text.textContent = message.content;
                    messageDiv.appendChild(text);
                }

                // Add timestamp
                const timestamp = document.createElement("span");
                timestamp.className = "timestamp";
                timestamp.textContent = new Date(message.timestamp).toLocaleString();
                messageDiv.appendChild(timestamp);

                sessionDiv.appendChild(messageDiv);
            });

            chatLogsContainer.appendChild(sessionDiv);
        });
    }

    // Fetch and display chat logs on page load
    fetchChatLogs();
});



