document.addEventListener('DOMContentLoaded', () => {
    // Function to load and parse CSV data from the API
    async function loadData() {
        try {
            const response = await fetch('https://api.vitaldb.net/cases');
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            const csvData = await response.text();
            const parsedData = Papa.parse(csvData, { 
                header: true, 
                skipEmptyLines: true 
            });

            // Log the parsed data to the console
            console.log('Fetched Data:', parsedData.data);

            // Store the data for later use and calculate hospital stay length
            window.clinicalInfo = parsedData.data.map(item => ({
                ...item,
                hosp_stay: (parseFloat(item.dis) - parseFloat(item.adm)) / 86400, // Calculate hospital stay length in days
                bmi_category: getBMICategory(item.bmi), // Calculate BMI category) 
                preop_alb_categ: getAlbuminCategory(item.preop_alb), // Calculate albumin category
                preop_hb_categ: getHemoglobinRange(item.preop_hb), // Calculate hemoglobin range
                age_group: getAgeGroup(item.age),
                optype_Colorectal: item.optype === 'Colorectal' ? "1" : "0", // Encode operation type
                optype_Stomach: item.optype === 'Stomach' ? "1" : "0"    // Encode operation type
            }));

            // Initially display data for the first variable
            updateChart('start_option', 'chart-container');
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }  
        
    document.getElementById('selection').addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        const overlayMessage = document.getElementById('overlay-message');
        
        // Hide the overlay only if the user selects a valid option
        if (selectedValue !== "start_option") {
            overlayMessage.style.visibility = "hidden";
        } else {
            overlayMessage.style.visibility = "visible";
        }
    });

    // Update explanation dynamically based on the selected variable
    document.getElementById('selection').addEventListener('change', (event) => {
        const selectedVariable = event.target.value;
        updateChart(selectedVariable, 'chart-container');
        const explanationBox = document.getElementById('variable-explanation');

        // Update the explanation text (allow HTML content for ASA)
        explanationBox.innerHTML = variableExplanations[selectedVariable] || 'Explanation not available.';
    });

    // Load data when the page loads
    loadData();
});