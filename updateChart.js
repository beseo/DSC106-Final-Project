const chartInstances = {}; // Tracks chart instances by canvas ID

// Mapping of long ECG names to shorter, more readable versions for display
const shortNameMap = {
    "Normal Sinus Rhythm": "Normal",
    "Left anterior fascicular block": "LAFB",
    "1st degree A-V block, Left bundle branch block": "1° AVB + LBBB",
    "1st degree A-V block": "1° AV Block",
    "Atrial fibrillation": "A-Fib",
    "Right bundle branch block, Left anterior fascicular block": "RBBB + LAFB",
    "Atrial fibrillation, Right bundle branch block": "A-Fib + RBBB",
    "Premature complexes, Right bundle branch block": "Premature + RBBB",
    "Atrial fibrillation with slow ventricular response": "A-Fib (Slow VR)",
    "Right bundle branch block": "RBBB",
    "Incomplete right bundle branch block": "Inc. RBBB",
    "Left anterior hemiblock": "LAHB",
    "Atrial fibrillation with rapid ventricular response": "A-Fib (Rapid VR)",
    "Premature ventricular complexes": "PVCs",
    "Left posterior fascicular block": "LPFB",
    "Incomplete left bundle branch block": "Inc. LBBB",
    "Premature atrial complexes": "PACs",
    "Premature complexes, Left bundle branch block": "Premature + LBBB",
    "A-V block with Premature atrial complexes": "AV Block + PACs",
    "Ventricular or aberrantly conducted complexes": "Aberrant Beats",
    "Atrial flutter with 2:1 A-V conduction": "A-Flutter (2:1)",
    "Premature supraventricular complexes": "PSVCs",
    "Electronic ventricular pacemaker": "V-Pacemaker",
    "Atrial or dual chamber electronic pacemaker": "Dual Pacemaker",
    "Frequent premature supraventricular complexes": "Freq. PSVCs",
    "Atrial flutter with variable A-V block": "A-Flutter (Var)",
    "Atrial fibrillation with premature ventricular, Incomplete left bundle block": "A-Fib + PVCs + Inc. LBBB",
    "Incomplete right bundle branch block, Left anterior fascicular block": "Inc. RBBB + LAFB",
    "Premature supraventricular and ventricular complexes, Right bundle branch block": "PSVCs + PVCs + RBBB",
    "1st degree A-V block with Premature supraventricular complexes, Left bundle branch block": "1° AVB + PSVCs + LBBB",
    "1st degree A-V block with Premature atrial complexes": "1° AV Block + PACs",
    "Atrial fibrillation with premature ventricular or aberrantly conducted complexes": "A-Fib + PVCs/Aberrant",
    "AV sequential or dual chamber electronic pacemaker": "Dual Pacemaker",
    "Complete right bundle branch block, occasional premature supraventricular complexes": "RBBB + Occ. PSVCs"
};

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

    const customOrders = {
        'bmi_category': ['Underweight', 'Normal', 'Overweight', 'Obese', 'Severely Obese'],
        'preop_pft': [
            'Normal',
            'Borderline obstructive',
            'Mild obstructive',
            'Moderate obstructive',
            'Severe obstructive',
            'Mild restrictive',
            'Moderate restrictive',
            'Severe restrictive',
            'Mixed or pure obstructive'
        ]
    };

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
        if (customOrders[variable]) {
            // Use custom ordering if defined for the current variable
            const orderA = customOrders[variable].indexOf(a);
            const orderB = customOrders[variable].indexOf(b);
            
            // If a category isn't in the list, push it to the end
            const valA = orderA === -1 ? 999 : orderA;
            const valB = orderB === -1 ? 999 : orderB;
            return valA - valB;
        }
        
        // Handle keys with numeric ranges or decimals for other variables
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
            labels: categories.map(cat => shortNameMap[cat] || cat),
            datasets: [{
                data: averages,
                backgroundColor: 'rgba(29, 112, 116, 0.8)', // Deep Teal
                borderColor: '#0F5B60',
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
                    displayColors: false,  // Disable the color box
                    callbacks: {
                        // show the full name at the top of the hover box
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return categories[index]; // Pulls the original long name
                        },
                        label: function(tooltipItem) {
                            const index = tooltipItem.dataIndex;
                            //Use index to get the real, unshortened category name
                            const category = categories[index]; 
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
    
    // Detailed Medical Explanations with Categories
    'optype': `The specific organ or surgical category of the operation performed.
        <ul id="list_categories">
            <li><strong>Colorectal:</strong> Surgery on the colon, rectum, or anus.</li>
            <li><strong>Stomach:</strong> Surgery involving the stomach (e.g., gastrectomy).</li>
            <li><strong>Biliary/Pancreas:</strong> Procedures on the gallbladder, bile ducts, or pancreas.</li>
            <li><strong>Vascular:</strong> Surgery on blood vessels (arteries and veins).</li>
            <li><strong>Major resection:</strong> Extensive surgical removal of tissue, organs, or tumors.</li>
            <li><strong>Breast:</strong> Surgery involving breast tissue (e.g., mastectomy, lumpectomy).</li>
            <li><strong>Minor resection:</strong> Less extensive or targeted removal of tissue.</li>
            <li><strong>Transplantation:</strong> Surgery to replace a failing organ with a healthy donor organ.</li>
            <li><strong>Hepatic:</strong> Surgery involving the liver.</li>
            <li><strong>Thyroid:</strong> Surgery to remove all or part of the thyroid gland.</li>
            <li><strong>Others:</strong> Miscellaneous procedures not falling into the primary specific categories.</li>
        </ul>`,
        
    'preop_ecg': `Preoperative Electrocardiogram (ECG) status assesses the heart's electrical activity.
        <ul id="list_categories">
            <li><strong>Normal:</strong> The healthy, standard electrical rhythm of the heart.</li>
            <li><strong>LAFB:</strong> A blockage in the anterior (front) fascicle of the left bundle branch, altering electrical flow.</li>
            <li><strong>1° AVB + LBBB:</strong> Delayed signals from the atria to the ventricles, combined with a blockage in the left ventricle's pathway.</li>
            <li><strong>1° AV Block:</strong> A minor delay in electrical conduction traveling from the top to the bottom of the heart.</li>
            <li><strong>A-Fib:</strong> An irregular, often rapid heart rhythm originating in the upper chambers (atria).</li>
            <li><strong>RBBB + LAFB:</strong> A "bifascicular block" affecting both the right bundle branch and the front half of the left bundle branch.</li>
            <li><strong>A-Fib + RBBB:</strong> Irregular atrial rhythm occurring alongside a conduction block in the right ventricle.</li>
            <li><strong>Premature + RBBB:</strong> Early extra heartbeats combined with a conduction block in the right ventricle.</li>
            <li><strong>A-Fib (Slow VR):</strong> Irregular atrial rhythm where the lower chambers (ventricles) beat abnormally slowly.</li>
            <li><strong>RBBB:</strong> A delay or blockage along the electrical pathway that stimulates the right ventricle.</li>
            <li><strong>Inc. RBBB:</strong> A partial, less severe delay in the right ventricle's electrical pathway.</li>
            <li><strong>LAHB:</strong> Another medical term for Left Anterior Fascicular Block (LAFB).</li>
            <li><strong>A-Fib (Rapid VR):</strong> Irregular atrial rhythm causing the lower chambers to beat dangerously fast.</li>
            <li><strong>PVCs:</strong> Common, early extra heartbeats originating in the lower chambers (ventricles).</li>
            <li><strong>LPFB:</strong> A rare conduction block in the posterior (back) fascicle of the left bundle branch.</li>
            <li><strong>Inc. LBBB:</strong> A partial delay in the electrical pathway supplying the left ventricle.</li>
            <li><strong>PACs:</strong> Early, extra heartbeats originating in the upper chambers (atria).</li>
            <li><strong>Premature + LBBB:</strong> Early extra heartbeats combined with a conduction block in the left ventricle.</li>
            <li><strong>AV Block + PACs:</strong> A delay in main electrical conduction combined with early upper-chamber beats.</li>
            <li><strong>Aberrant Beats:</strong> Abnormal, widened heartbeats that travel outside the heart's normal electrical pathways.</li>
            <li><strong>A-Flutter (2:1):</strong> A fast, regular atrial rhythm where exactly every second beat reaches the ventricles.</li>
            <li><strong>PSVCs:</strong> Early extra heartbeats originating anywhere above the ventricles.</li>
            <li><strong>V-Pacemaker:</strong> An implanted electronic device pacing only the lower chambers.</li>
            <li><strong>Dual Pacemaker:</strong> An implanted electronic device pacing both the upper and lower chambers.</li>
            <li><strong>Freq. PSVCs:</strong> A high frequency of early extra heartbeats originating above the ventricles.</li>
            <li><strong>A-Flutter (Var):</strong> A fast atrial rhythm with an inconsistent number of beats reaching the ventricles.</li>
            <li><strong>A-Fib + PVCs + Inc. LBBB:</strong> Irregular atrial rhythm combined with early lower-chamber beats and a partial delay in the left ventricle's electrical pathway.</li>
            <li><strong>Inc. RBBB + LAFB:</strong> A partial delay in the right ventricle's pathway combined with a blockage in the front fascicle of the left bundle branch.</li>
            <li><strong>PSVCs + PVCs + RBBB:</strong> Early extra heartbeats from both the upper and lower chambers, combined with a conduction block in the right ventricle.</li>
            <li><strong>1° AVB + PSVCs + LBBB:</strong> A minor delay in main electrical conduction combined with early upper-chamber beats and a block in the left ventricle's pathway.</li>
            <li><strong>1° AV Block + PACs:</strong> A minor delay in electrical conduction traveling from the top to the bottom of the heart, accompanied by early upper-chamber beats.</li>
            <li><strong>A-Fib + PVCs/Aberrant:</strong> Irregular atrial rhythm accompanied by early lower-chamber beats or widened, abnormally routed heartbeats.</li>
            <li><strong>Dual Pacemaker:</strong> An implanted electronic device pacing both the upper (atrial) and lower (ventricular) chambers to coordinate the heartbeat.</li>
            <li><strong>RBBB + Occ. PSVCs:</strong> A full blockage along the right ventricle's electrical pathway, accompanied by occasional early beats originating above the ventricles.</li>
        </ul>`,
        
    'preop_pft': `Preoperative Pulmonary Function Test (PFT) evaluating lung capacity and airflow.
        <ul id="list_categories">
            <li><strong>Normal:</strong> Healthy lung capacity and unobstructed airflow.</li>
            <li><strong>Obstructive (Mild, Moderate, Borderline, Severe):</strong> Conditions making it hard to exhale completely (e.g., Asthma, COPD). Severity indicates the degree of airflow limitation.</li>
            <li><strong>Restrictive (Mild, Moderate, Severe):</strong> Conditions making it hard to fully expand the lungs with air (e.g., pulmonary fibrosis). Severity indicates the degree of volume loss.</li>
            <li><strong>Mixed or pure obstructive:</strong> A combination of both obstructive and restrictive lung patterns, complicating ventilation.</li>
        </ul>`,

    'preop_alb_categ': `Preoperative Albumin levels (g/dL). Albumin is a liver protein vital for fluid balance and healing.
        <ul id="list_categories">
            <li><strong>0.0–2.4:</strong> Severely low (Severe hypoalbuminemia). High risk for delayed healing and complications.</li>
            <li><strong>2.5–3.4:</strong> Mildly to moderately low. Indicates potential malnutrition or inflammation.</li>
            <li><strong>3.5–4.9:</strong> Generally considered the normal, healthy range.</li>
            <li><strong>5.0+:</strong> Elevated levels, often indicative of dehydration.</li>
        </ul>`,
        
    'preop_hb_categ': `Preoperative Hemoglobin levels (g/dL). Hemoglobin carries oxygen in red blood cells.
        <ul id="list_categories">
            <li><strong>0.0–7.9:</strong> Severe anemia. High risk of cardiovascular complications and need for transfusions.</li>
            <li><strong>8.0–10.9:</strong> Moderate anemia. May impact surgical recovery and oxygen delivery.</li>
            <li><strong>11.0–12.9:</strong> Mild anemia to low-normal range depending on patient demographics.</li>
            <li><strong>13.0–17.0:</strong> Generally considered the normal, healthy range.</li>
            <li><strong>17.1+:</strong> Elevated levels (Polycythemia), which can increase blood viscosity and clotting risks.</li>
        </ul>`,

    'department': `Surgical departments are specialized areas within a hospital dedicated to specific types of operations.
        <ul id="list_categories">
            <li><strong>General Surgery:</strong> Includes a wide range of procedures like appendectomies or hernia repairs.</li>
            <li><strong>Gynecology:</strong> Focuses on surgeries for the female reproductive system.</li>
            <li><strong>Urology:</strong> Treats the urinary system and male reproductive organs.</li>
            <li><strong>Thoracic Surgery:</strong> Focuses on surgeries involving the chest, lungs, and esophagus.</li>
        </ul>`,
        
    'approach': `Surgical approaches are ways to perform operations based on the procedure and patient's needs.
        <ul id="list_categories">
            <li><strong>Open:</strong> Traditional method with a large incision to access the surgical area directly.</li>
            <li><strong>Robotic:</strong> Precision surgery using robotic tools controlled by the surgeon, often with small incisions.</li>
            <li><strong>Videoscopic:</strong> Minimally invasive method using small incisions and a camera (e.g., laparoscopic surgery).</li>
        </ul>`,
        
    'ane_type': `The types of anesthesia used during medical procedures.
        <ul id="list_categories">
            <li><strong>General:</strong> Induces complete unconsciousness. The patient is asleep and feels no pain.</li>
            <li><strong>Spinal:</strong> Regional anesthesia that numbs the lower half of the body by injecting medication into spinal fluid.</li>
            <li><strong>Sedationalgesia:</strong> Conscious sedation where the patient remains awake but deeply relaxed and pain-free.</li>
        </ul>`,
        
    'position': `The physical posture of the patient on the operating table, optimized for surgical access and patient safety.
        <ul id="list_categories">
            <li><strong>Supine:</strong> Lying flat on the back, face up.</li>
            <li><strong>Prone:</strong> Lying flat on the stomach, face down.</li>
            <li><strong>Lithotomy:</strong> Lying on the back with legs elevated and supported in stirrups.</li>
            <li><strong>Trendelenburg:</strong> Lying on the back with the head tilted lower than the feet.</li>
            <li><strong>Reverse Trendelenburg:</strong> Lying on the back with the head tilted higher than the feet.</li>
            <li><strong>Left/Right Lateral Decubitus:</strong> Lying on the left or right side.</li>
            <li><strong>Sitting:</strong> Patient is positioned upright or semi-upright.</li>
            <li><strong>Left/Right Kidney:</strong> A specialized side-lying position to expose the kidney area.</li>
        </ul>`,
        
    'bmi_category': `Body Mass Index (BMI) measures body weight relative to height.
        <ul id="list_categories">
            <li><strong>Underweight:</strong> BMI < 18.5.</li>
            <li><strong>Normal Weight:</strong> BMI 18.5–24.9.</li>
            <li><strong>Overweight:</strong> BMI 25–29.9.</li>
            <li><strong>Obese:</strong> BMI 30–39.9.</li>
            <li><strong>Severely Obese:</strong> BMI ≥ 40.</li>
        </ul>`,
        
    'asa': `The American Society of Anesthesiologists (ASA) Physical Status Classification System evaluates a patient's physical health before surgery.
        <ul id="list_categories">
            <li><strong>ASA 1:</strong> A normal healthy patient.</li>
            <li><strong>ASA 2:</strong> A patient with mild systemic disease.</li>
            <li><strong>ASA 3:</strong> A patient with severe systemic disease that limits activity.</li>
            <li><strong>ASA 4:</strong> A patient with life-threatening severe systemic disease.</li>
            <li><strong>ASA 5:</strong> A moribund patient who is unlikely to survive without the operation.</li>
            <li><strong>ASA 6:</strong> A declared brain-dead patient with plans for organ donation.</li>
        </ul>
        <i>Note: ASA 5 is not included in this chart as there is no patient data containing ASA 5.</i>`,

    // Brief Demographics and Yes/No Variables
    'sex': 'Patient gender (Male or Female).',
    'age_group': 'The age of the patient in years grouped into distinct demographic ranges.',
    'death_inhosp': 'Indicates whether the patient passed away during the hospital stay (Yes/No).',
    'preop_htn': 'Indicates if the patient was diagnosed with preoperative hypertension, or high blood pressure (Yes/No).',
    'preop_dm': 'Indicates if the patient was diagnosed with preoperative diabetes mellitus (Yes/No).',
    'emop': 'Indicates whether the surgery was an emergency operation rather than a scheduled procedure (Yes/No).'
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
        return "0-5 days";
    } else if (hospStayLength >= 6 && hospStayLength <= 10) {
        return "6-10 days";
    } else if (hospStayLength >= 11 && hospStayLength <= 15) {
        return "11-15 days";
    } else if (hospStayLength >= 16 && hospStayLength <= 20) {
        return "16-20 days";
    } else if (hospStayLength >= 21 && hospStayLength <= 25) {
        return "21-25 days";
    } else if (hospStayLength > 25) {
        return "25+ days";
    } else {
        return "Invalid";
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
        return "0.0-2.4";
    } else if (albuminLevel >= 2.5 && albuminLevel <= 3.4) {
        return "2.5-3.4";
    } else if (albuminLevel >= 3.5 && albuminLevel <= 4.9) {
        return "3.5-4.9";
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