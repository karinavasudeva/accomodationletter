document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('letterForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error('Form element not found');
    }
});

async function handleSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');
    const name = document.getElementById('name').value;
    const disability = document.getElementById('disability').value;
    const context = document.getElementById('context').value;

    console.log('Form data:', { name, disability, context });

    try {
        console.log('Sending fetch request...');
        const response = await fetch('/api/generate-letter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, disability, context })
        });

        console.log('Fetch response received:', response);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response not OK. Status:', response.status, 'Text:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        updateAccommodationsList(data.accommodations);
        updateLetterOutput(data.letter);
    } catch (error) {
        console.error('Error:', error);
        updateAccommodationsList(['An error occurred while generating accommodations.']);
        updateLetterOutput('An error occurred while generating the letter.');
        alert(`An error occurred: ${error.message}`);
    }
}

function updateAccommodationsList(accommodations) {
    const accommodationsList = document.getElementById('accommodationsList');
    if (Array.isArray(accommodations)) {
        accommodationsList.innerHTML = '<ul>' + 
            accommodations.map(acc => `<li>${acc}</li>`).join('') + 
            '</ul>';
    } else {
        accommodationsList.textContent = 'Error: Accommodations data is not in the expected format.';
    }
}

function updateLetterOutput(letter) {
    const letterOutput = document.getElementById('letterOutput');
    if (typeof letter === 'string') {
        letterOutput.textContent = letter;
    } else {
        letterOutput.textContent = 'Error: Letter data is not in the expected format.';
    }
}
