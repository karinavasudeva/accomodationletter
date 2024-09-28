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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (Array.isArray(data.accommodations)) {
            document.getElementById('accommodationsList').innerHTML = '<ul>' + 
                data.accommodations.map(acc => `<li>${acc}</li>`).join('') + 
                '</ul>';
        } else {
            document.getElementById('accommodationsList').textContent = 'Error: Accommodations data is not in the expected format.';
        }

        if (typeof data.letter === 'string') {
            document.getElementById('letterOutput').textContent = data.letter;
        } else {
            document.getElementById('letterOutput').textContent = 'Error: Letter data is not in the expected format.';
        }
    } catch (error) {
        console.error('An error occurred:', error);
        document.getElementById('letterOutput').textContent = 'An error occurred while generating the letter.';
        document.getElementById('accommodationsList').textContent = 'An error occurred while generating accommodations.';
    }
});