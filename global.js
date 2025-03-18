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

            console.log('Processed Clinical Info:', window.clinicalInfo);

            // Initially display data for the first variable
            updateChart('start_option', 'chart-container');
            // Render the default graph on page load
            updateChart('start_option', 'graphicCanvas');
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }  

    // Load data when the page loads
    loadData();

    let selectedVariable = 'start_option';
    const explanationBox = document.getElementById('variable-explanation');
 
    document.getElementById('selection').addEventListener('change', (event) => {
        selectedVariable = event.target.value;
        const overlayMessage = document.getElementById('overlay-message');
        
        // Hide the overlay only if the user selects a valid option
        if (selectedVariable !== "start_option") {
            overlayMessage.style.visibility = "hidden";
        } else {
            overlayMessage.style.visibility = "visible";
        }
        updateChart(selectedVariable, 'chart-container');
        // Update the explanation text (allow HTML content for ASA)
        explanationBox.innerHTML = variableExplanations[selectedVariable] || 'Explanation not available.';
    });

    const sections = document.querySelectorAll('.text-section');
    const scrolly = document.querySelector('.scrolly'); // Select the scrolly container
    const scrollyHeight = scrolly.offsetHeight; // Get the height of scrolly
    const scrollyMidPoint = scrollyHeight / 2; // Calculate the middle point of scrolly
    let activeVariable = null;

    // Function to handle scroll and update chart/graphics
    function handleMainScroll() {
        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const scrollyRect = scrolly.getBoundingClientRect(); // Scrolly's position

            // Check if the middle of the section is in the middle of scrolly
            const sectionMidPoint = (rect.top + rect.bottom) / 2;
            const isCentered = sectionMidPoint >= scrollyRect.top + scrollyMidPoint - 100 && // Adjust margin for precision
                               sectionMidPoint <= scrollyRect.top + scrollyMidPoint + 100;

            if (isCentered) {
                const variable = section.getAttribute('data-variable');
    
                if (activeVariable !== variable) {
                    activeVariable = variable;

                    // Update chart and explanation dynamically
                    console.log(`Updating chart with variable: ${variable}`);
                    const overlayMessage = document.getElementById('overlay-message2');
        
                    // Hide the overlay only if the user selects a valid option
                    if (variable !== "start_option") {
                        overlayMessage.style.visibility = "hidden";
                    } else {
                        overlayMessage.style.visibility = "visible";
                    }

                    updateChart(variable, 'graphicCanvas');
                }
            }
        });
    }
    // Attach the scroll listener to the scroll-container
    const scrollContainer = document.querySelector('.scroll-container');
    scrollContainer.addEventListener('scroll', handleMainScroll);
});