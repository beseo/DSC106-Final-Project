document.addEventListener('DOMContentLoaded', () => {
    // Function to load and parse CSV data from the API
    async function loadData() {
        try {
            const response = await fetch('https://api.vitaldb.net/cases');
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            const csvData = await response.text();
            const parsedData = Papa.parse(csvData, { header: true });

            // Log the parsed data to the console
            console.log('Fetched Data:', parsedData.data);

            // Store the data for later use and calculate hospital stay length
            window.clinicalInfo = parsedData.data.map(item => ({
                ...item,
                hosp_stay: (parseFloat(item.dis) - parseFloat(item.adm)) / 86400, // Calculate hospital stay length in days
                bmi_category: getBMICategory(item.bmi), // Calculate BMI category) 
                preop_alb_categ: getAlbuminCategory(item.preop_alb), // Calculate albumin category
                preop_hb_categ: getHemoglobinRange(item.preop_hb) // Calculate hemoglobin range
            }));

            // Initially display data for the first variable
            updateChart('asa');
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

    const variableToFullName = {
        'department': 'Department',
        'approach': 'Surgical Approach',
        'ane_type': 'Anesthesia Type',
        'sex': 'Gender',
        'position': 'Surgical Position',
        'death_inhosp': 'In-Hospital Death',
        'preop_ecg': 'Preoperative ECG',
        'optype': 'Operation Type',
        'preop_pft': 'Preoperative Pulmonary Function',
        'preop_htn': 'Preoperative Hypertension',
        'preop_dm': 'Preoperative Diabetes',
        'bmi_category': 'BMI',
        'age': 'Age',
        'asa': 'ASA Classification',
        'emop': 'Emergency Operation',
        'preop_alb_categ': 'Preoperative Albumin (g/dL)',
        'preop_hb_categ': 'Preoperative Hemoglobin (g/dL)',
    };

    function getBMICategory(bmi) {
        if (bmi < 18.5) {
            return "Underweight";
        } else if (bmi < 25) {
            return "Normal";
        } else if (bmi < 30) {
            return "Overweight";
        } else if (bmi < 40) {
            return "Obese";
        } else if (bmi >= 40) {
            return "Severely Obese";
        }
    }

    function getAlbuminCategory(albuminLevel) {
        if (albuminLevel >= 0.0 && albuminLevel <= 0.9) {
            return "0.0–0.9";
        } else if (albuminLevel >= 1.0 && albuminLevel <= 1.9) {
            return "1.0–1.9";
        } else if (albuminLevel >= 2.0 && albuminLevel <= 2.9) {
            return "2.0–2.9";
        } else if (albuminLevel >= 3.0 && albuminLevel <= 3.9) {
            return "3.0–3.9";
        } else if (albuminLevel >= 4.0 && albuminLevel <= 4.9) {
            return "4.0–4.9";
        } else if (albuminLevel >= 5.0 && albuminLevel <= 5.9) {
            return "5.0+";
        }
    }

    function getHemoglobinRange(hemoglobinLevel) {
        if (hemoglobinLevel < 8.0) {
            return "0.0–7.9";
        } else if (hemoglobinLevel >= 8.0 && hemoglobinLevel <= 10.9) {
            return "8.0–10.9";
        } else if (hemoglobinLevel >= 11.0 && hemoglobinLevel <= 12.9) {
            return "11.0–12.9";
        } else if (hemoglobinLevel >= 13.0 && hemoglobinLevel <= 17.0) {
            return "13.0–17.0";
        } else if (hemoglobinLevel > 17.0) {
            return "17.1+";
        }
    }    
        
    
    // Function to update the bar chart based on the selected variable
    function updateChart(variable) {
        const data = window.clinicalInfo;

        // Filter out records with undefined values for the selected variable
        const filteredData = data.filter(item => item[variable] !== undefined && item[variable] !== null && item[variable] !== '');

        const groupedData = {};

        // Group data by the selected variable and calculate the average hospital stay length
        filteredData.forEach(item => {
            const key = item[variable];
            if (!groupedData[key]) {
                groupedData[key] = { totalStay: 0, count: 0 };
            }
            groupedData[key].totalStay += item.hosp_stay;
            groupedData[key].count += 1;
        });

        const categories = Object.keys(groupedData).map(key => {
            // Handle 0 and 1 as Yes/No, and 'm' and 'f' as Male/Female
            if (variable === 'sex') {
                return key === 'M' ? 'Male' : (key === 'F' ? 'Female' : key);
            } else if (variable != 'asa') {
                if (key === '1') {
                    return 'Yes';
                } else if (key === '0') {
                    return 'No';
                }
                return key;
            } else {
                return key;
            }
        }).sort();

        const averages = categories.map(category => {
            // Get the average stay for each category
            const key = category === 'Male' ? 'M' :
                        category === 'Female' ? 'F' :
                        category === 'Yes' ? '1' :
                        category === 'No' ? '0' : category;
            const averageStay = groupedData[key].totalStay / groupedData[key].count;
            // Round to the nearest whole number
            return parseFloat(averageStay.toFixed(1));
        });

        // Create the bar chart using Chart.js
        const ctx = document.getElementById('chart-container').getContext('2d');
        if (window.myChart) {
            window.myChart.destroy();
        }
        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    data: averages,
                    backgroundColor: 'rgba(33, 145, 140, 0.6)',
                    borderColor: 'rgba(33, 145, 140, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Average Length of Hospital Stay by ${variableToFullName[variable]}`,
                        font: {
                            size: 18,
                            weight: 'bold',
                        },
                        padding: {
                            top: 20,
                            bottom: 20,
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        callbacks: {
                            label: function(tooltipItem) {
                                const category = tooltipItem.label;
                                const averageStay = tooltipItem.raw;
                                
                                const key = category === 'Male' ? 'M' :
                                            category === 'Female' ? 'F' :
                                            category === 'Yes' ? '1' :
                                            category === 'No' ? '0' : category;
                    
                                const count = groupedData[key].count;
                                const maxStay = Math.max(...filteredData.filter(item => item[variable] === key).map(item => item.hosp_stay));
                                const minStay = Math.min(...filteredData.filter(item => item[variable] === key).map(item => item.hosp_stay));
                                const percentage = ((count / filteredData.length) * 100).toFixed(1);
                                // Return the label text without the color box
                                return [
                                    `Average Stay: ${averageStay} days`,
                                    `Range: ${minStay} - ${maxStay} days`,
                                    `Cases: ${count} (${percentage}% of total)`
                                ];
                            }
                        },
                        // Disable the color box
                        displayColors: false
                    }
                    
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hospital Stay Length (days)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: variableToFullName[variable],
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    }

    // Add event listener to the dropdown menu
    const dropdown = document.getElementById('selection');
    dropdown.addEventListener('change', (event) => {
        const selectedVariable = event.target.value;
        updateChart(selectedVariable);
    });

    // Load data when the page loads
    loadData();
});