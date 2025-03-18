const chartInstances = {}; // Tracks chart instances by canvas ID

// Function to update the bar chart based on the selected variable
function updateChart(variable, container, data) {
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

    const customOrder = ['Underweight', 'Normal', 'Overweight', 'Obese', 'Severely Obese'];

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
    }).sort((a, b) => {
        if (variable === 'bmi_category') {
            // Define the custom order for BMI categories
            return customOrder.indexOf(a) - customOrder.indexOf(b);
        }
        // Handle keys with numeric ranges or decimals
        const parseKey = (key) => {
            const start = parseFloat(key.split('-')[0]) || parseFloat(key); // Extract or parse the first number
            return start;
        };
        const startA = parseKey(a);
        const startB = parseKey(b);
        return startA - startB; // Sort numerically, including decimals
    });
    
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

    const canvas = document.getElementById(container);

    // Destroy the existing chart on the same canvas, if it exists
    if (chartInstances[container]) {
        chartInstances[container].destroy();
    }
    // Create the bar chart using Chart.js
    const ctx = canvas.getContext('2d');

    chartInstances[container] = new Chart(ctx, {
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
            maintainAspectRatio: false, // Prevent aspect ratio locking
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: (variable === 'start_option')
                        ? "Average Length of Hospital Stay"
                        :`Average Length of Hospital Stay by ${variableToFullName[variable]}`,
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

    // Update the explanation box
    const explanationBox = document.getElementById('variable-explanation');
    if (container === 'chart-container') {
        explanationBox.textContent = variableExplanations[variable] || 'Explanation not available.';
    } 
}

const variableExplanations = {
    'start_option': 'Select a variable to see its explanation here.',
    'department': `Surgical departments are specialized areas within a hospital dedicated to specific types of operations.
        <ul id="list_categories">
            <li><strong>General Surgery:</strong> Includes a wide range of procedures like appendectomies or hernia repairs.</li>
            <li><strong>Gynecology:</strong> Focuses on surgeries for the female reproductive system (e.g., hysterectomy).</li>
            <li><strong>Urology:</strong> Treats the urinary system and male reproductive organs (e.g., kidney stones, prostate surgery).</li>
            <li><strong>Thoracic Surgery:</strong> Focuses on surgeries involving the chest, including the lungs, esophagus, and chest wall (e.g., lung cancer removal). </li>
        </ul>`,
    'approach': `Surgical approaches are ways to perform operations based on the procedure and patient's needs.
        <ul id="list_categories">
            <li><strong>Open:</strong> Traditional method with a large incision to access the surgical area directly.</li>
            <li><strong>Robotic:</strong> Precision surgery using robotic tools controlled by the surgeon, often with small incisions.</li>
            <li><strong>Videoscopic:</strong> Minimally invasive method using small incisions and a camera for visualization (e.g., laparoscopic surgery).</li>
        </ul>`,
    'ane_type': `The types of anesthesia used furing medical procedures.
        <ul id="list_categories">
            <li><strong>General:</strong> Induces complete unconsciousness. The patient is asleep and feels no pain during surgery. Used for major operations like heart or abdominal surgeries.</li>
            <li><strong>Spinal:</strong> Regional anesthesia that numbs the lower half of the body by injecting medication into spinal fluid. Used for procedures like cesarean sections or knee replacements.</li>
            <li><strong>Sedationalgesia:</strong> Conscious sedation where the patient remains awake but deeply relaxed and pain-free. Used for minimally invasive procedures like endoscopies or dental work.</li>
        </ul>`,
    'sex': 'Patient gender: Male or Female.',
    'position': 'Surgical position during the operation (e.g., Supine, Prone).',
    'death_inhosp': 'Indicates whether the patient passed away during the hospital stay (Yes/No).',
    'preop_ecg': 'Preoperative ECG status (e.g., Normal, Abnormal).',
    'optype': 'The types of operation performed.',
    'preop_pft': 'Preoperative pulmonary function test status (e.g., Normal, Reduced).',
    'preop_htn': 'Indicates if the patient had preoperative hypertension (Yes/No).',
    'preop_dm': 'Indicates if the patient had preoperative diabetes mellitus (Yes/No).',
    'bmi_category': `Body Mass Index (BMI) measures body weight relative to height.
        <ul id="list_categories">
            <li><strong>Underweight:</strong> BMI < 18.5. May indicate insufficient weight for good health.</li>
            <li><strong>Normal Weight:</strong> BMI 18.5–24.9. Considered healthy and lowers health risks.</li>
            <li><strong>Overweight:</strong> BMI 25–29.9. Higher weight, increasing risk of health issues.</li>
            <li><strong>Obese:</strong> BMI 30–39.9. High body fat with significant health risks.</li>
            <li><strong>Severely Obese:</strong> BMI ≥ 40. Very high body fat with serious health concerns.</li>
        </ul>`,
    'age_group': 'The age of the patient in years ranging from 0.3 to 94 years old.',
    'asa': `The American Society of Anesthesiologists (ASA) Physical Status Classification System evaluates a patient's physical health before surgery.
        <ul id="list_categories">
            <li><strong>ASA 1:</strong> A normal healthy patient.</li>
            <li><strong>ASA 2:</strong> A patient with mild systemic disease (e.g., controlled high blood pressure).</li>
            <li><strong>ASA 3:</strong> A patient with severe systemic disease that limits activity.</li>
            <li><strong>ASA 4:</strong> A patient with life-threatening severe systemic disease.</li>
            <li><strong>ASA 5:</strong> A moribund patient who is unlikely to survive without the operation.</li>
            <li><strong>ASA 6:</strong> A declared brain-dead patient with plans for organ donation.</li>
        </ul>
        <i>Note: ASA 5 is not included in this chart as there is no patient data containing ASA 5.</i>`,
    'emop': 'Whether the surgery was an emergency operation (Yes/No).',
    'preop_alb_categ': 'Preoperative Albumin levels categorized by range (e.g., 0.0–0.9, 1.0–1.9).',
    'preop_hb_categ': 'Preoperative Hemoglobin levels categorized by range (e.g., 0.0–7.9, 8.0–10.9).',
};


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
    'age_group': 'Age',
    'asa': 'ASA Classification',
    'emop': 'Emergency Operation',
    'preop_alb_categ': 'Preoperative Albumin (g/dL)',
    'preop_hb_categ': 'Preoperative Hemoglobin (g/dL)',
    'optype_Colorectal': 'Operation Type (Colorectal)',
    'optype_Stomach': 'Operation Type (Stomach)'
};

function getHospitalStayCategory(hospStayLength) {
    if (hospStayLength >= 0 && hospStayLength <= 5) {
        return "0–5 days";
    } else if (hospStayLength >= 6 && hospStayLength <= 10) {
        return "6–10 days";
    } else if (hospStayLength >= 11 && hospStayLength <= 15) {
        return "11–15 days";
    } else if (hospStayLength >= 16 && hospStayLength <= 20) {
        return "16–20 days";
    } else if (hospStayLength >= 21 && hospStayLength <= 25) {
        return "21–25 days";
    } else if (hospStayLength > 25) {
        return "25+ days";
    } else {
        return "Invalid stay length";
    }
}

function getAgeGroup(age) {
    if (age < 13) {
        return "0-12";
    } else if (age < 21) {
        return "13-20";
    } else if (age < 36) {
        return "21-35";
    } else if (age < 51) {
        return "36-50";
    } else if (age < 66) {
        return "51-65";
    } else if (age > 65) {
        return "66+";
    }
}    

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
    if (albuminLevel < 2.5) {
        return "0.0–2.4";
    } else if (albuminLevel >= 2.5 && albuminLevel <= 3.4) {
        return "2.5–3.4";
    } else if (albuminLevel >= 3.5 && albuminLevel <= 4.9) {
        return "3.5–4.9";
    } else if (albuminLevel >= 5.0) {
        return "5.0+";
    } else {
        return "Invalid range";
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