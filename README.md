# Admitted Today, Discharged When?

Unraveling the biggest factors that affect hospital stay length.

**View [Website](https://beseo.github.io/DSC106-Final-Project/)** 

## About the Project
This interactive data visualization dashboard explores the key preoperative and demographic factors influencing hospital stay lengths. Built as a practical prototype for healthcare resource management, the tool analyzes clinical data to help patients, medical professionals, and insurance companies better predict recovery timelines and allocate resources.

Using a **Random Forest Classifier**, the underlying analysis identified the **top three most important features** impacting stay duration. This web interface allows users to dynamically explore those findings and interact with the broader dataset in real-time.

## Motivation
* **Challenges in Healthcare:** The medical field frequently faces manpower shortages and inefficient resource allocation.
* **Project Aim:** Demonstrate the potential innovations that artificial intelligence (AI) and machine learning (ML) bring to clinical healthcare management.
* **Key Goal:** Predict patterns within patient data to optimize hospital operations, foster innovation, and improve patient care planning.

## Key Features
* **Scrollytelling Data Narrative:** An immersive scroll-driven exploration of the top three predictive features identified by the model: Preoperative Albumin, Colorectal Operations, and Stomach Operations.
* **Interactive Variable Explorer:** A dynamic visualization interface allowing users to select among 18 different clinical and demographic variables (e.g., BMI, ASA classification, Surgical Approach, ECG status) to see their direct impact on average hospital stay length. Tooltips provide specific case counts and ranges.
* **Custom Hospital Stay Filter & Analysis Tool:** A robust filtering tool that allows users to set specific Albumin ranges and toggle operation types. It instantly calculates the average hospital stay for the filtered cohort and renders a custom distribution chart of patient outcomes.

## Data Source
The analysis and dashboard utilize the open-source **Korean hospital dataset** provided by [VitalDB](https://vitaldb.net/dataset/). The application dynamically fetches and parses this clinical case data directly via the VitalDB API.

## Technologies Used
| Category | Technology |
| :--- | :--- |
| **Frontend Core** | Vanilla HTML5, CSS, JavaScript|
| **Data Visualization** | [Chart.js](https://www.chartjs.org/) (Interactive Bar Charts), [D3.js v7](https://d3js.org/) (Custom Distribution Charts) |
| **Data Processing** | [PapaParse](https://www.papaparse.com/) (In-browser CSV parsing and transformation) |
| **Design** | Responsive CSS Grid/Flexbox, Scrollytelling Architecture |

## Team
* Nomin Batjargal
* Max Zou
* Terran Chow
* Beomsuk Seo
