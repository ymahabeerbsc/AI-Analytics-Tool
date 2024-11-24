const API_KEY = "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";

document.getElementById('csv-upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const csvData = e.target.result;
        const rows = csvData.split('\n').filter(row => row.trim().length > 0);
        const headers = rows[0].split(',');
        const data = rows.slice(1).map(row => row.split(','));

        await displayColumnDetails(headers, data);
    };
    reader.readAsText(file);
}

async function displayColumnDetails(headers, data) {
    const columnDetails = document.getElementById('column-details');
    columnDetails.innerHTML = '';

    for (const [colIndex, header] of headers.entries()) {
        const colValues = data.map(row => row[colIndex]);
        const dataTypes = determineDataTypes(colValues);
        const suggestion = await getColumnSuggestion(header, Object.keys(dataTypes));

        const columnDiv = document.createElement('div');
        columnDiv.classList.add('column-info');

        const columnName = document.createElement('h3');
        columnName.textContent = header;

        const dataTypeList = document.createElement('ul');
        Object.entries(dataTypes).forEach(([type, percentage]) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${type}: ${percentage}`;
            dataTypeList.appendChild(listItem);
        });

        const suggestionDiv = document.createElement('div');
        suggestionDiv.classList.add('suggestion');

        const suggestionText = document.createElement('p');
        suggestionText.textContent = `AI Suggestion: ${suggestion}`;
        suggestionText.classList.add('suggestion-text');

        const tickButton = document.createElement('button');
        tickButton.textContent = '✔';
        tickButton.classList.add('tick-button');
        tickButton.onclick = () => {
            alert(`Confirmed: ${suggestion}`);
        };

        const editButton = document.createElement('button');
        editButton.textContent = '✏️';
        editButton.classList.add('edit-button');
        editButton.onclick = () => {
            const userInput = prompt('Enter your own description for this column:', suggestion);
            if (userInput) {
                suggestionText.textContent = `User Suggestion: ${userInput}`;
            }
        };

        suggestionDiv.appendChild(suggestionText);
        suggestionDiv.appendChild(tickButton);
        suggestionDiv.appendChild(editButton);

        columnDiv.appendChild(columnName);
        columnDiv.appendChild(dataTypeList);
        columnDiv.appendChild(suggestionDiv);
        columnDetails.appendChild(columnDiv);
    }
}

function determineDataTypes(values) {
    const types = { Boolean: 0, Integer: 0, Float: 0, Date: 0, String: 0, Empty: 0 };
    const total = values.length;

    values.forEach(value => {
        const trimmedValue = value.trim();

        if (trimmedValue === '') {
            types.Empty++;
        } else if (["true", "false", "1", "0"].includes(trimmedValue.toLowerCase())) {
            types.Boolean++;
        } else if (!isNaN(trimmedValue)) {
            types.Integer += Number.isInteger(+trimmedValue) ? 1 : 0;
            types.Float += !Number.isInteger(+trimmedValue) ? 1 : 0;
        } else if (isValidDate(trimmedValue)) {
            types.Date++;
        } else {
            types.String++;
        }
    });

    // Convert counts to percentages
    return Object.fromEntries(
        Object.entries(types).map(([type, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return [type, `${count} (${percentage}%)`];
        })
    );
}

function isValidDate(value) {
    // Check for valid date formats using regex
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(value)) return false;

    const date = new Date(value);
    return !isNaN(date.getTime());
}

async function getColumnSuggestion(columnName, dataTypes) {
    const prompt = `The column is named "${columnName}" and contains data of types: ${dataTypes.join(', ')}. Suggest in a few words what this column might represent.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 50,
            }),
        });

        const result = await response.json();
        return result.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error fetching suggestion from GPT:", error);
        return "Unable to fetch suggestion";
    }
}
