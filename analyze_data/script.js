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

// Collapse or expand the bottom container
document.getElementById("collapse-chatbar").addEventListener("click", () => {
    const bottomContainer = document.getElementById("bottom-container");
    const caretButton = document.getElementById("collapse-chatbar");

    // Toggle the 'visible' class
    bottomContainer.classList.toggle("visible");

    // Update button icon based on the state
    caretButton.innerHTML = bottomContainer.classList.contains("visible") ? "⮝" : "⮟";
});



