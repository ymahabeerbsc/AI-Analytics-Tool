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

// Retrieve the message from the URL and send it like a regular chat
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");

    if (message) {
        // Prepopulate the input field with the message
        const inputField = document.getElementById("chatbot-input");
        inputField.value = decodeURIComponent(message); // Decode the message from the URL

        // Trigger the "input" event to ensure any input listeners are activated
        inputField.dispatchEvent(new Event("input", { bubbles: true }));

        // Simulate a click on the send button after the input field is populated
        setTimeout(() => {
            document.getElementById("send-chatbot-message").click();
        }, 0);
    }
});


