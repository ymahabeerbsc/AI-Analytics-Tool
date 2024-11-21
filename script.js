// Ensure the toggle button works for the collapsible sidebar
document.getElementById("toolbar-toggle-button").addEventListener("click", () => {
    const toolbar = document.getElementById("toolbar");
    const toggleButton = document.getElementById("toolbar-toggle-button");

    // Toggle the 'hidden' class on the toolbar
    if (toolbar.classList.contains("hidden")) {
        toolbar.classList.remove("hidden"); // Show the toolbar
        toggleButton.style.backgroundColor = "#2ec4b6"; // Add background to the toggle button
        toggleButton.style.borderRadius = "5px";
    } else {
        toolbar.classList.add("hidden"); // Hide the toolbar
        toggleButton.style.backgroundColor = "transparent"; // Remove background color
    }
});


// Redirect to the main_chat page with the message
function sendMessage() {
    const inputField = document.getElementById("chatbot-input");
    const message = encodeURIComponent(inputField.value.trim()); // URL encode the message
    if (message) {
        window.location.href = `main_chat/index.html?message=${message}`;
    }
}

document.getElementById("send-chatbot-message").addEventListener("click", sendMessage);

// Allow pressing "Enter" to send the message
document.getElementById("chatbot-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});


