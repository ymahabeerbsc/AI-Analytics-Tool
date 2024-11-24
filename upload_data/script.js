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

document.getElementById('csv-upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const csvData = e.target.result;
        const rows = csvData.split('\n').filter(row => row.trim().length > 0);
        const headers = rows[0].split(',');
        const data = rows.slice(1).map(row => row.split(','));

        displayColumnDetails(headers, data);
    };
    reader.readAsText(file);
}

function displayColumnDetails(headers, data) {
    const columnDetails = document.getElementById('column-details');
    columnDetails.innerHTML = '';

    headers.forEach((header, colIndex) => {
        const colValues = data.map(row => row[colIndex]);
        const dataTypes = determineDataTypes(colValues);

        const columnDiv = document.createElement('div');
        columnDiv.classList.add('column-info');

        const columnName = document.createElement('h3');
        columnName.textContent = header;

        const dataTypeList = document.createElement('ul');
        dataTypes.forEach(type => {
            const listItem = document.createElement('li');
            listItem.textContent = type;
            dataTypeList.appendChild(listItem);
        });

        columnDiv.appendChild(columnName);
        columnDiv.appendChild(dataTypeList);
        columnDetails.appendChild(columnDiv);
    });
}

function determineDataTypes(values) {
    const types = new Set();
    values.forEach(value => {
        if (!isNaN(value) && value.trim() !== '') {
            types.add(Number.isInteger(+value) ? 'Integer' : 'Float');
        } else if (new Date(value).toString() !== 'Invalid Date') {
            types.add('Date');
        } else if (value.trim().length > 0) {
            types.add('String');
        } else {
            types.add('Empty');
        }
    });
    return Array.from(types);
}



