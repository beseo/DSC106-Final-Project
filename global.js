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

        // Transform and calculate hospital stay length
        const clinicalInfo = parsedData.data.map(item => {
            // Calculate hospital stay length in days
            const hospStayLength = (parseFloat(item.dis) - parseFloat(item.adm)) / 86400;  // Convert from seconds to days
            
            return {
                ...item,
                hosp_stay: hospStayLength,  // Store hospital stay length in days
                bmi_category: getBMICategory(item.bmi),  // Calculate BMI category
                preop_alb_categ: getAlbuminCategory(item.preop_alb),  // Calculate albumin category
                preop_hb_categ: getHemoglobinRange(item.preop_hb),  // Calculate hemoglobin range
                age_group: getAgeGroup(item.age),  // Calculate age group
                optype_Colorectal: item.optype === 'Colorectal' ? "1" : "0", // Encode operation type
                optype_Stomach: item.optype === 'Stomach' ? "1" : "0",  // Encode operation type
                hosp_stay_categ: getHospitalStayCategory(hospStayLength)  // Categorize hospital stay length
            };
        });


        // Return the transformed data
        return clinicalInfo;

    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
        return []; // Return an empty array if there's an error
    }
}

function filterData(selectedAlbumin, selectedOperations, data) {
    // Filter clinical data directly using preop_alb_categ
    const filteredData = data.filter(item => {
        // Check albumin category
        const inAlbuminCategory = item.preop_alb_categ === selectedAlbumin;

        // Check operation type
        let matchesOperation = false;

        // If no operations are selected, include records where both Colorectal and Stomach are 0 (not selected)
        if (selectedOperations.length === 0) {
            matchesOperation = item.optype_Colorectal === "0" && item.optype_Stomach === "0";
        } else {
            // If operations are selected, filter based on those
            matchesOperation =
                (selectedOperations.includes("Colorectal") && item.optype_Colorectal === "1") ||
                (selectedOperations.includes("Stomach") && item.optype_Stomach === "1");
        }

        return inAlbuminCategory && matchesOperation;
    });

    console.log('After Filtering:', filteredData); // Log data after filtering
    // Calculate the average hospital stay length
    const totalStay = filteredData.reduce((sum, item) => sum + item.hosp_stay, 0);
    const averageStay = filteredData.length > 0 ? (totalStay / filteredData.length).toFixed(2) : 0;
    
    // Now, we will categorize the hospital stay into ranges (using hosp_stay_categ)
    const stayDistribution = filteredData.reduce((acc, item) => {
        const category = item.hosp_stay_categ; // Get the category for the current item
        
        // If category already exists in the accumulator, increment the count
        if (acc[category]) {
            acc[category]++;
        } else {
            // If category doesn't exist, initialize it with a count of 1
            acc[category] = 1;
        }
        
        return acc;
    }, {});

    console.log("distribution: ", stayDistribution);

    return { filteredData, averageStay, stayDistribution };
}

// function renderHospitalStayDistribution(stayDistribution) {
//     // Set the dimensions and margins for the chart
//     const margin = { top: 40, right: 40, bottom: 80, left: 60 };
//     const width = 800 - margin.left - margin.right;
//     const height = 500 - margin.top - margin.bottom;

//     // Append an SVG element to the DOM
//     const svg = d3.select("#hospitalStayChart")
//         .append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//       .append("g")
//         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
//     // Set the data for the bar chart
//     const data = Object.entries(stayDistribution).map(([category, count]) => ({
//         category,
//         count
//     }));

//     // Set the scales
//     const x = d3.scaleBand()
//         .domain(data.map(d => d.category))
//         .range([0, width])
//         .padding(0.1);

//     const y = d3.scaleLinear()
//         .domain([0, d3.max(data, d => d.count)])
//         .nice()
//         .range([height, 0]);

//     // Create the X axis
//     svg.append("g")
//         .selectAll(".x-axis")
//         .data(data)
//         .enter()
//         .append("text")
//         .attr("class", "x-axis")
//         .attr("x", d => x(d.category) + x.bandwidth() / 2)
//         .attr("y", height + 20)
//         .attr("text-anchor", "middle")
//         .text(d => d.category);

//     // Create the Y axis
//     svg.append("g")
//         .attr("class", "y-axis")
//         .call(d3.axisLeft(y));

//     // Create the bars
//     svg.selectAll(".bar")
//         .data(data)
//         .enter()
//         .append("rect")
//         .attr("class", "bar")
//         .attr("x", d => x(d.category))
//         .attr("y", d => y(d.count))
//         .attr("width", x.bandwidth())
//         .attr("height", d => height - y(d.count))
//         .attr("fill", "#69b3a2");

//         // Add x-axis label
//         svg.append('text')
//             .attr('class', 'axis-label')
//             .attr('x', width / 2)
//             .attr('y', height + margin.bottom / 1.5)
//             .style('text-anchor', 'middle')
//             .text('Hospital Stay Categories');

//         // Add the y-axis
//         svg.append('g')
//             .attr('class', 'y-axis')
//             .call(d3.axisLeft(y));

//         // Add y-axis label
//         svg.append('text')
//             .attr('class', 'axis-label')
//             .attr('transform', 'rotate(-90)')
//             .attr('x', -height / 2)
//             .attr('y', -margin.left / 1.5)
//             .style('text-anchor', 'middle')
//             .text('Number of Patients');

//         // Add chart title
//         svg.append('text')
//             .attr('class', 'title')
//             .attr('x', width / 2)
//             .attr('y', -margin.top / 2)
//             .text('Hospital Stay Distribution');
// }

function renderHospitalStayDistribution(stayDistribution) {
    // Define the correct order for hospital stay categories
    const stayCategoriesOrder = ["0–5 days", "6–10 days", "11–15 days", "16–20 days", "21–25 days", "25+ days"];

    // Convert the stayDistribution object into an array and sort it
    const sortedData = stayCategoriesOrder.map(category => ({
        category,
        count: stayDistribution[category] || 0 // Use 0 if the category has no data
    }));

    // Set the dimensions and margins for the chart
    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Append an SVG element to the DOM
    const svg = d3.select("#hospitalStayChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Define the correct order of the categories
    const categoryOrder = ['0-5 days', '6-10 days', '11-15 days', '16-20 days', '21-25 days', '25+ days'];

    // Ensure that every category in categoryOrder is included in the result, even with a count of 0
    categoryOrder.forEach(category => {
        if (!stayDistribution[category]) {
            stayDistribution[category] = 0;
        }
    });

    const data = Object.entries(stayDistribution).map(([category, count]) => ({
        category,
        count
    })).sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

    // Set the scales
    const x = d3.scaleBand()
        .domain(stayCategoriesOrder) // Use the predefined order for the x-axis
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(sortedData, d => d.count)])
        .nice()
        .range([height, 0]);

    // Create the X axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("text-anchor", "middle");

    // Create the Y axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Create the bars
    // Create the bars
    const bars = svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.category))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#69b3a2");

        // Add x-axis label
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom / 1.5)
            .style('text-anchor', 'middle')
            .text('Hospital Stay Categories');

    // Add y-axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left / 1.5)
        .style('text-anchor', 'middle')
        .text('Number of Patients');

        // Add chart title
        svg.append('text')
            .attr('class', 'title')
            .attr('x', width / 2)  // Center the title horizontally
            .attr('y', -margin.top / 2)  // Position the title above the chart
            .style('text-anchor', 'middle')  // Ensure the text is centered horizontally
            .text('Hospital Stay Distribution')
            .style('font-weight', 'bold') ;

}


document.addEventListener('DOMContentLoaded', async () => {
    const data = await loadData();

    if (data.length > 0) {
        // Pass the data to update charts or perform other actions
        console.log('Loaded Data:', data);
        updateChart('start_option', 'chart-container', data);
        updateChart('start_option', 'graphicCanvas', data);
    } else {
        console.error('No data was loaded.');
    }

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
        updateChart(selectedVariable, 'chart-container', data);
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

                    updateChart(variable, 'graphicCanvas', data);
                }
            }
        });
    }
    // Attach the scroll listener to the scroll-container
    const scrollContainer = document.querySelector('.scroll-container');
    scrollContainer.addEventListener('scroll', handleMainScroll);

    document.getElementById('filter-button').addEventListener('click', () => {
        const selectedAlbumin = document.getElementById('albumin-category').value;
        const selectedOperations = [];
        if (document.getElementById('colorectal-checkbox').checked) {
            selectedOperations.push("Colorectal");
        }
        if (document.getElementById('stomach-checkbox').checked) {
            selectedOperations.push("Stomach");
        }
        if (selectedAlbumin === 'start') {
            alert('Please select an albumin range.');
            return; // Prevent filtering from proceeding
        }

        // Filter data and calculate average hospital stay
        const { filteredData, averageStay, stayDistribution } = filterData(selectedAlbumin, selectedOperations, data);
        // Display the result
        const resultDiv = document.getElementById('result');
        if (filteredData.length > 0) {
            resultDiv.innerHTML = `<strong>Average Hospital Stay:</strong> ${averageStay} days (${filteredData.length} record(s) found)`;
        } else {
            resultDiv.innerHTML = `<strong>No matching records found.</strong>`;
        }

        // Clear the existing chart before rendering a new one
        d3.select("#hospitalStayChart").select("svg").remove();

        // Render the hospital stay distribution chart
        renderHospitalStayDistribution(stayDistribution);
        });

});

