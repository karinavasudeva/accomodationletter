document.getElementById('letterForm').addEventListener('submit', async (e) => {
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

        const data = await response.json();
        console.log('Received data:', data);

        // Log debug information
        if (data.debugLog) {
            console.log('Debug log:');
            data.debugLog.forEach(log => console.log(log));
        }

        if (Array.isArray(data.accommodations)) {
            document.getElementById('accommodationsList').innerHTML = '<ul>' + 
                data.accommodations.map(acc => `<li>${acc}</li>`).join('') + 
                '</ul>';
        } else {
            console.error('Accommodations data is not an array:', data.accommodations);
            document.getElementById('accommodationsList').textContent = 'Error: Accommodations data is not in the expected format.';
        }

        if (typeof data.letter === 'string') {
            document.getElementById('letterOutput').textContent = data.letter;
        } else {
            console.error('Letter data is not a string:', data.letter);
            document.getElementById('letterOutput').textContent = 'Error: Letter data is not in the expected format.';
        }
    } catch (error) {
        console.error('Detailed error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        document.getElementById('letterOutput').textContent = 'An error occurred while generating the letter.';
        document.getElementById('accommodationsList').textContent = 'An error occurred while generating accommodations.';
        alert(`An error occurred: ${error.message}`);
    }
});
