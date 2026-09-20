/* ==========================================================
   NEWTON'S LAW OF COOLING — VIRTUAL PHYSICS LAB SCRIPT
   Complete Modular Simulation Engine, Charting, Calculations & Quiz
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------------
    // 1. SIMULATION CONFIGURATION & MATERIALS
    // --------------------------------------------------------
    const MATERIALS = {
        water: { name: "Water", coolingConstant: 0.035, color: "rgba(59, 130, 246, 0.4)" },
        oil: { name: "Oil", coolingConstant: 0.025, color: "rgba(234, 179, 8, 0.4)" },
        alcohol: { name: "Alcohol", coolingConstant: 0.045, color: "rgba(14, 165, 233, 0.3)" },
        copper: { name: "Copper", coolingConstant: 0.055, color: "rgba(217, 119, 6, 0.5)" },
        aluminium: { name: "Aluminium", coolingConstant: 0.050, color: "rgba(148, 163, 184, 0.5)" },
        iron: { name: "Iron", coolingConstant: 0.040, color: "rgba(100, 116, 139, 0.5)" }
    };

    const SIMULATION_CONFIG = {
        defaultAmbientTemperature: 25,
        defaultInitialTemperature: 85,
        defaultRecordingInterval: 2
    };

    // --------------------------------------------------------
    // 2. APPLICATION STATE
    // --------------------------------------------------------
    let state = {
        selectedMaterial: "water",
        initialTemperature: 85,
        ambientTemperature: 25,
        currentTemperature: 25,
        coolingConstant: 0.035,
        elapsedTimeMinutes: 0,
        recordingInterval: 2,
        experimentRunning: false,
        experimentPaused: false,
        heatingComplete: false,
        isHeating: false,
        observations: [],
        nextRecordTime: 2
    };

    let simTimer = null;
    let chartInstance = null;

    // --------------------------------------------------------
    // 3. DOM ELEMENTS
    // --------------------------------------------------------
    const navLinks = document.getElementById("navLinks");
    const hamburger = document.getElementById("hamburger");
    const readMoreBtn = document.getElementById("readMoreBtn");
    const readMoreContent = document.getElementById("readMoreContent");

    const materialSelect = document.getElementById("materialSelect");
    const initialTempInput = document.getElementById("initialTempInput");
    const ambientTempInput = document.getElementById("ambientTempInput");
    const intervalSelect = document.getElementById("intervalSelect");
    const valT0 = document.getElementById("valT0");
    const valTs = document.getElementById("valTs");

    const btnHeat = document.getElementById("btnHeat");
    const btnStart = document.getElementById("btnStart");
    const btnPause = document.getElementById("btnPause");
    const btnResume = document.getElementById("btnResume");
    const btnReset = document.getElementById("btnReset");

    const rigStatusBanner = document.getElementById("rigStatusBanner");
    const heatFlame = document.getElementById("heatFlame");
    const liquidFillSim = document.getElementById("liquidFillSim");
    const thermoMercury = document.getElementById("thermoMercury");
    const rigTempDisplay = document.getElementById("rigTempDisplay");

    const dispTime = document.getElementById("dispTime");
    const dispTemp = document.getElementById("dispTemp");
    const dispAmbient = document.getElementById("dispAmbient");
    const dispDiff = document.getElementById("dispDiff");

    const observationBody = document.getElementById("observationBody");
    const selectAllRows = document.getElementById("selectAllRows");
    const btnAddReading = document.getElementById("btnAddReading");
    const btnDeleteSelected = document.getElementById("btnDeleteSelected");
    const btnClearTable = document.getElementById("btnClearTable");
    const btnExportCSV = document.getElementById("btnExportCSV");

    const chkTheoretical = document.getElementById("chkTheoretical");
    const btnDownloadGraph = document.getElementById("btnDownloadGraph");
    const btnClearGraph = document.getElementById("btnClearGraph");

    const btnAutoFill = document.getElementById("btnAutoFill");
    const calcT1 = document.getElementById("calcT1");
    const calcT2 = document.getElementById("calcT2");
    const calcTs = document.getElementById("calcTs");
    const calct1 = document.getElementById("calct1");
    const calct2 = document.getElementById("calct2");
    const btnCalculateK = document.getElementById("btnCalculateK");
    const displayKValue = document.getElementById("displayKValue");
    const stepFormula = document.getElementById("stepFormula");
    const stepSubstitution = document.getElementById("stepSubstitution");
    const stepResult = document.getElementById("stepResult");

    const resT0 = document.getElementById("resT0");
    const resTf = document.getElementById("resTf");
    const resTs = document.getElementById("resTs");
    const resTime = document.getElementById("resTime");
    const resObsCount = document.getElementById("resObsCount");
    const resK = document.getElementById("resK");
    const btnPrintReport = document.getElementById("btnPrintReport");

    const quizContainer = document.getElementById("quizContainer");
    const btnSubmitQuiz = document.getElementById("btnSubmitQuiz");
    const vivaScoreBoard = document.getElementById("vivaScoreBoard");
    const vivaScoreNum = document.getElementById("vivaScoreNum");
    const btnRetryQuiz = document.getElementById("btnRetryQuiz");
    const backToTop = document.getElementById("backToTop");

    // --------------------------------------------------------
    // 4. INITIALIZATION & MATHJAX / KATEX RENDERING
    // --------------------------------------------------------
    function initializeExperiment() {
        renderEquations();
        setupEventListeners();
        initChart();
        initQuiz();
        resetExperiment();
    }

    function renderEquations() {
        try {
            katex.render("\\frac{dT}{dt} = -k(T - T_s)", document.getElementById("math-diff"), { displayMode: true });
            katex.render("T(t) = T_s + (T_0 - T_s)e^{-kt}", document.getElementById("math-int"), { displayMode: true });
            katex.render("k = \\frac{1}{\\Delta t} \\ln\\left(\\frac{T_1 - T_s}{T_2 - T_s}\\right)", stepFormula, { displayMode: true });
        } catch (e) {
            console.error("KaTeX rendering error:", e);
        }
    }

    // --------------------------------------------------------
    // 5. EVENT LISTENERS SETUP
    // --------------------------------------------------------
    function setupEventListeners() {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });

        readMoreBtn.addEventListener("click", () => {
            if (readMoreContent.style.display === "none") {
                readMoreContent.style.display = "block";
                readMoreBtn.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Less Background';
            } else {
                readMoreContent.style.display = "none";
                readMoreBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Read More Background';
            }
        });

        // Material selection buttons in apparatus section
        document.querySelectorAll(".mat-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll(".mat-btn").forEach(b => b.classList.remove("active"));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add("active");
                const matKey = targetBtn.getAttribute("data-material");
                materialSelect.value = matKey;
                selectMaterial(matKey);
            });
        });

        materialSelect.addEventListener("change", (e) => {
            const matKey = e.target.value;
            document.querySelectorAll(".mat-btn").forEach(b => {
                if (b.getAttribute("data-material") === matKey) b.classList.add("active");
                else b.classList.remove("active");
            });
            selectMaterial(matKey);
        });

        initialTempInput.addEventListener("input", (e) => {
            state.initialTemperature = parseFloat(e.target.value);
            valT0.textContent = state.initialTemperature;
            if (!state.experimentRunning && !state.isHeating) {
                state.currentTemperature = state.initialTemperature;
                updateVisuals();
            }
        });

        ambientTempInput.addEventListener("input", (e) => {
            state.ambientTemperature = parseFloat(e.target.value);
            valTs.textContent = state.ambientTemperature;
            dispAmbient.textContent = state.ambientTemperature.toFixed(1) + " °C";
            calcTs.value = state.ambientTemperature;
            updateVisuals();
        });

        intervalSelect.addEventListener("change", (e) => {
            state.recordingInterval = parseInt(e.target.value);
            state.nextRecordTime = state.elapsedTimeMinutes + state.recordingInterval;
        });

        btnHeat.addEventListener("click", heatSample);
        btnStart.addEventListener("click", startExperiment);
        btnPause.addEventListener("click", pauseExperiment);
        btnResume.addEventListener("click", resumeExperiment);
        btnReset.addEventListener("click", resetExperiment);

        btnAddReading.addEventListener("click", recordObservation);
        btnDeleteSelected.addEventListener("click", deleteSelectedObservations);
        btnClearTable.addEventListener("click", clearObservationTable);
        btnExportCSV.addEventListener("click", exportCSV);

        chkTheoretical.addEventListener("change", updateGraph);
        btnDownloadGraph.addEventListener("click", downloadGraph);
        btnClearGraph.addEventListener("click", clearGraph);

        btnAutoFill.addEventListener("click", autoFillCalculation);
        btnCalculateK.addEventListener("click", calculateCoolingConstant);

        btnPrintReport.addEventListener("click", printReport);
        btnSubmitQuiz.addEventListener("click", checkQuizAnswer);
        btnRetryQuiz.addEventListener("click", initQuiz);

        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        selectAllRows.addEventListener("change", (e) => {
            const checkboxes = document.querySelectorAll(".row-checkbox");
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    // --------------------------------------------------------
    // 6. MATERIAL & SIMULATION FUNCTIONS
    // --------------------------------------------------------
    function selectMaterial(matKey) {
        if (MATERIALS[matKey]) {
            state.selectedMaterial = matKey;
            state.coolingConstant = MATERIALS[matKey].coolingConstant;
            liquidFillSim.style.backgroundColor = MATERIALS[matKey].color;
            rigStatusBanner.textContent = `Selected: ${MATERIALS[matKey].name} (k = ${state.coolingConstant} min⁻¹)`;
        }
    }

    function heatSample() {
        if (state.isHeating || state.experimentRunning) return;
        state.isHeating = true;
        btnHeat.disabled = true;
        heatFlame.classList.add("active");
        rigStatusBanner.textContent = "Heating sample to initial temperature...";

        let targetT = state.initialTemperature;
        let stepTime = 50; // ms

        let heatInterval = setInterval(() => {
            if (state.currentTemperature < targetT) {
                state.currentTemperature += 0.5;
                if (state.currentTemperature > targetT) state.currentTemperature = targetT;
                updateVisuals();
            } else {
                clearInterval(heatInterval);
                state.isHeating = false;
                heatFlame.classList.remove("active");
                btnHeat.disabled = false;
                btnStart.disabled = false;
                rigStatusBanner.textContent = "Initial temperature reached. Start the cooling experiment.";
            }
        }, stepTime);
    }

    function startExperiment() {
        if (state.experimentRunning) return;
        state.experimentRunning = true;
        state.experimentPaused = false;
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnResume.style.display = "none";
        btnHeat.disabled = true;
        initialTempInput.disabled = true;
        ambientTempInput.disabled = true;

        rigStatusBanner.textContent = "Experiment running...";

        // If table is empty, record initial reading at t = 0
        if (state.observations.length === 0) {
            recordObservationAt(0, state.initialTemperature);
            state.nextRecordTime = state.recordingInterval;
        }

        // Run simulation tick every second representing time progression
        simTimer = setInterval(() => {
            // Increment elapsed time (1 real second = 0.2 minutes for speed, or 1 minute per 5 seconds. Let's make 1 sec = 0.1 min)
            state.elapsedTimeMinutes += 0.1;

            // Calculate current temperature using Newton's Law of Cooling formula: T(t) = Ts + (T0 - Ts) * e^(-kt)
            let T0 = state.initialTemperature;
            let Ts = state.ambientTemperature;
            let k = state.coolingConstant;
            let t = state.elapsedTimeMinutes;

            state.currentTemperature = Ts + (T0 - Ts) * Math.exp(-k * t);

            // Prevent going below ambient
            if (state.currentTemperature < Ts) {
                state.currentTemperature = Ts;
            }

            updateVisuals();

            // Check if recording interval reached
            if (state.elapsedTimeMinutes >= state.nextRecordTime) {
                recordObservationAt(parseFloat(state.elapsedTimeMinutes.toFixed(1)), state.currentTemperature);
                state.nextRecordTime += state.recordingInterval;
            }

            // Stop if close to ambient
            if (Math.abs(state.currentTemperature - Ts) < 0.1) {
                pauseExperiment();
                rigStatusBanner.textContent = "Experiment completed. Temperature reached ambient.";
                generateResultSummary();
            }
        }, 100);
    }

    function pauseExperiment() {
        if (!state.experimentRunning) return;
        clearInterval(simTimer);
        state.experimentRunning = false;
        state.experimentPaused = true;
        btnPause.disabled = true;
        btnResume.style.display = "inline-flex";
        btnResume.disabled = false;
        rigStatusBanner.textContent = "Experiment paused.";
    }

    function resumeExperiment() {
        if (!state.experimentPaused) return;
        state.experimentPaused = false;
        btnResume.style.display = "none";
        btnPause.disabled = false;
        startExperiment();
    }

    function resetExperiment() {
        clearInterval(simTimer);
        state.experimentRunning = false;
        state.experimentPaused = false;
        state.heatingComplete = false;
        state.isHeating = false;
        state.elapsedTimeMinutes = 0;
        state.currentTemperature = state.initialTemperature;
        state.nextRecordTime = state.recordingInterval;
        state.observations = [];

        btnHeat.disabled = false;
        btnStart.disabled = true;
        btnPause.disabled = true;
        btnResume.style.display = "none";
        initialTempInput.disabled = false;
        ambientTempInput.disabled = false;
        heatFlame.classList.remove("active");

        rigStatusBanner.textContent = "Status: Ready to Heat";
        updateVisuals();
        updateObservationTable();
        updateGraph();
        generateResultSummary();
    }

    function updateVisuals() {
        let T = state.currentTemperature;
        let Ts = state.ambientTemperature;
        let T0 = state.initialTemperature;

        dispTemp.textContent = T.toFixed(1) + " °C";
        rigTempDisplay.textContent = T.toFixed(1) + " °C";
        dispTime.textContent = formatTime(state.elapsedTimeMinutes);
        dispDiff.textContent = Math.max(0, T - Ts).toFixed(1) + " °C";

        // Thermometer liquid height calculation (scale 15°C to 100°C)
        let percent = ((T - 15) / (100 - 15)) * 100;
        percent = Math.max(5, Math.min(100, percent));
        thermoMercury.style.height = percent + "%";
    }

    function formatTime(min) {
        let m = Math.floor(min);
        let s = Math.floor((min - m) * 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // --------------------------------------------------------
    // 7. OBSERVATION TABLE FUNCTIONS
    // --------------------------------------------------------
    function recordObservation() {
        recordObservationAt(parseFloat(state.elapsedTimeMinutes.toFixed(1)), state.currentTemperature);
    }

    function recordObservationAt(time, temp) {
        state.observations.push({
            time: time,
            temperature: parseFloat(temp.toFixed(1)),
            ambient: state.ambientTemperature,
            diff: parseFloat((temp - state.ambientTemperature).toFixed(1))
        });
        updateObservationTable();
        updateGraph();
        generateResultSummary();
    }

    function updateObservationTable() {
        observationBody.innerHTML = "";
        if (state.observations.length === 0) {
            observationBody.innerHTML = `<tr class="placeholder-row"><td colspan="6" class="text-center">No observations recorded yet. Start experiment or add readings.</td></tr>`;
            return;
        }

        state.observations.forEach((obs, index) => {
            let tr = document.createElement("tr");
            if (index === state.observations.length - 1) tr.classList.add("highlight-row");
            tr.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" data-index="${index}"></td>
                <td>${index + 1}</td>
                <td>${obs.time}</td>
                <td><input type="number" class="editable-cell" value="${obs.temperature}" data-index="${index}" step="0.1"></td>
                <td>${obs.ambient}</td>
                <td>${(obs.temperature - obs.ambient).toFixed(1)}</td>
            `;
            observationBody.appendChild(tr);
        });

        // Add event listeners for manual editing in table
        document.querySelectorAll(".editable-cell").forEach(input => {
            input.addEventListener("change", (e) => {
                let idx = parseInt(e.target.getAttribute("data-index"));
                let val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    state.observations[idx].temperature = val;
                    state.observations[idx].diff = parseFloat((val - state.observations[idx].ambient).toFixed(1));
                    updateObservationTable();
                    updateGraph();
                }
            });
        });
    }

    function deleteSelectedObservations() {
        let checkboxes = document.querySelectorAll(".row-checkbox:checked");
        let indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute("data-index")));
        state.observations = state.observations.filter((_, idx) => !indicesToDelete.includes(idx));
        updateObservationTable();
        updateGraph();
        generateResultSummary();
    }

    function clearObservationTable() {
        state.observations = [];
        updateObservationTable();
        updateGraph();
        generateResultSummary();
    }

    function exportCSV() {
        if (state.observations.length === 0) {
            alert("No observations to export.");
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,S.No.,Time (min),Temperature (deg C),Ambient Temp (deg C),Temp Difference (deg C)\n";
        state.observations.forEach((obs, idx) => {
            csvContent += `${idx + 1},${obs.time},${obs.temperature},${obs.ambient},${obs.diff}\n`;
        });

        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "newtons_law_of_cooling_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --------------------------------------------------------
    // 8. CHART.JS GRAPH FUNCTIONS
    // --------------------------------------------------------
    function initChart() {
        const ctx = document.getElementById("coolingChart").getContext("2d");
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Experimental Data',
                        data: [],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        tension: 0.1
                    },
                    {
                        label: 'Theoretical Curve',
                        data: [],
                        borderColor: '#dc2626',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Time (minutes)', font: { weight: 'bold' } }
                    },
                    y: {
                        title: { display: true, text: 'Temperature (°C)', font: { weight: 'bold' } }
                    }
                }
            }
        });
    }

    function updateGraph() {
        if (!chartInstance) return;

        let expData = state.observations.map(obs => ({ x: obs.time, y: obs.temperature }));
        chartInstance.data.datasets[0].data = expData;

        if (chkTheoretical.checked && state.observations.length > 0) {
            let T0 = state.observations[0].temperature;
            let Ts = state.ambientTemperature;
            let k = state.coolingConstant;
            let maxTime = state.observations[state.observations.length - 1].time;
            maxTime = Math.max(maxTime, 10);

            let theoData = [];
            for (let t = 0; t <= maxTime; t += 0.5) {
                let T = Ts + (T0 - Ts) * Math.exp(-k * t);
                theoData.push({ x: t, y: parseFloat(T.toFixed(2)) });
            }
            chartInstance.data.datasets[1].data = theoData;
            chartInstance.data.datasets[1].hidden = false;
        } else {
            chartInstance.data.datasets[1].data = [];
        }

        chartInstance.update();
    }

    function downloadGraph() {
        if (!chartInstance) return;
        let link = document.createElement('a');
        link.download = 'cooling_curve_graph.png';
        link.href = chartInstance.toBase64Image();
        link.click();
    }

    function clearGraph() {
        if (!chartInstance) return;
        chartInstance.data.datasets[0].data = [];
        chartInstance.data.datasets[1].data = [];
        chartInstance.update();
    }

    // --------------------------------------------------------
    // 9. CALCULATION & STEP-BY-STEP MATHEMATICS
    // --------------------------------------------------------
    function autoFillCalculation() {
        if (state.observations.length < 2) {
            alert("Please record at least two observations before using auto-fill.");
            return;
        }
        let first = state.observations[0];
        let later = state.observations[state.observations.length - 1];

        calcT1.value = first.temperature;
        calcT2.value = later.temperature;
        calcTs.value = first.ambient;
        calct1.value = first.time;
        calct2.value = later.time;

        calculateCoolingConstant();
    }

    function calculateCoolingConstant() {
        let T1 = parseFloat(calcT1.value);
        let T2 = parseFloat(calcT2.value);
        let Ts = parseFloat(calcTs.value);
        let t1 = parseFloat(calct1.value);
        let t2 = parseFloat(calct2.value);

        if (isNaN(T1) || isNaN(T2) || isNaN(Ts) || isNaN(t1) || isNaN(t2)) {
            alert("Please enter valid numeric values for all calculation fields.");
            return;
        }

        if (T1 <= Ts || T2 <= Ts) {
            alert("The object temperature must be greater than the surrounding temperature for this calculation.");
            return;
        }

        let deltaT = t2 - t1;
        if (deltaT <= 0) {
            alert("Time t2 must be greater than t1.");
            return;
        }

        let ratio = (T1 - Ts) / (T2 - Ts);
        if (ratio <= 0) {
            alert("Invalid temperature ratios for logarithmic calculation.");
            return;
        }

        let k = (1 / deltaT) * Math.log(ratio);

        displayKValue.textContent = k.toFixed(5);
        resK.textContent = k.toFixed(5) + " min⁻¹";

        // Render step-by-step
        try {
            katex.render(`\\Delta t = t_2 - t_1 = ${t2} - ${t1} = ${deltaT} \\text{ min}`, stepSubstitution, { displayMode: true });
            katex.render(`k = \\frac{1}{${deltaT}} \\ln\\left(\\frac{${T1} - ${Ts}}{${T2} - ${Ts}}\\right) = \\frac{1}{${deltaT}} \\ln\\left(${ratio.toFixed(3)}\\right) = ${k.toFixed(5)} \\text{ min}^{-1}`, stepResult, { displayMode: true });
        } catch (e) {
            console.error("KaTeX calculation step error:", e);
        }
    }

    // --------------------------------------------------------
    // 10. RESULT & REPORT GENERATION
    // --------------------------------------------------------
    function generateResultSummary() {
        let t0 = state.observations.length > 0 ? state.observations[0].temperature : state.initialTemperature;
        let tf = state.observations.length > 0 ? state.observations[state.observations.length - 1].temperature : state.currentTemperature;
        let totTime = state.observations.length > 0 ? state.observations[state.observations.length - 1].time : 0;

        resT0.textContent = t0.toFixed(1) + " °C";
        resTf.textContent = tf.toFixed(1) + " °C";
        resTs.textContent = state.ambientTemperature.toFixed(1) + " °C";
        resTime.textContent = totTime.toFixed(1) + " min";
        resObsCount.textContent = state.observations.length;
    }

    function printReport() {
        window.print();
    }

    // --------------------------------------------------------
    // 11. VIVA / SELF-EVALUATION QUIZ
    // --------------------------------------------------------
    const quizQuestions = [
        {
            q: "Newton's Law of Cooling relates the rate of cooling of a body to:",
            options: ["A. Mass of the body", "B. Temperature difference between body and surroundings", "C. Volume of the body", "D. Pressure of the surroundings"],
            answer: 1,
            explanation: "The rate of heat loss is proportional to the temperature excess (T - Ts)."
        },
        {
            q: "What is the theoretical time required for a body to reach ambient temperature according to the exponential decay formula?",
            options: ["A. Finite time", "B. Infinite time", "C. Exactly 10 minutes", "D. Zero time"],
            answer: 1,
            explanation: "Mathematically, exponential decay approaches ambient temperature asymptotically as t approaches infinity."
        },
        {
            q: "Initially, when the temperature difference is large, the cooling rate is:",
            options: ["A. Slower", "B. Zero", "C. Faster", "D. Constant"],
            answer: 2,
            explanation: "Higher thermal gradient leads to faster initial heat transfer rate."
        },
        {
            q: "What units are commonly used for the cooling constant k in this laboratory?",
            options: ["A. kg/m³", "B. Joules", "C. min⁻¹ or s⁻¹", "D. Kelvin"],
            answer: 2,
            explanation: "Since the exponent kt must be dimensionless, k has inverse time units (min⁻¹)."
        },
        {
            q: "Which law is Newton's Law of Cooling derived from as an approximation?",
            options: ["A. Stefan-Boltzmann Law", "B. Fourier's Law / Convective Heat Transfer", "C. Boyle's Law", "D. Lenz's Law"],
            answer: 1,
            explanation: "It approximates convective heat transfer and conduction under small temperature differences."
        },
        {
            q: "Why should the thermometer bulb be thoroughly immersed in the liquid?",
            options: ["A. To measure ambient temperature accurately", "B. To prevent liquid evaporation", "C. To accurately measure the true mean temperature of the liquid sample", "D. To increase heating speed"],
            answer: 2,
            explanation: "Complete immersion ensures the sensor accurately captures the sample's thermal state."
        },
        {
            q: "If the ambient temperature increases during the experiment, how will it affect the cooling curve?",
            options: ["A. The body will cool faster", "B. The temperature difference will decrease slower, altering asymptotic equilibrium", "C. No effect", "D. The liquid will boil"],
            answer: 1,
            explanation: "A changing Ts alters the thermal gradient (T - Ts), shifting equilibrium."
        },
        {
            q: "What shape does the Temperature vs Time graph exhibit for Newton's Law of Cooling?",
            options: ["A. Straight line", "B. Parabola", "C. Exponential decay curve", "D. Sinusoidal wave"],
            answer: 2,
            explanation: "The integrated equation T(t) = Ts + (T0 - Ts)e^(-kt) represents an exponential decay curve."
        }
    ];

    function initQuiz() {
        quizContainer.innerHTML = "";
        vivaScoreBoard.style.display = "none";
        quizSubmitBar.style.display = "block";

        quizQuestions.forEach((item, qIdx) => {
            let card = document.createElement("div");
            card.classList.add("quiz-question-card");
            card.innerHTML = `
                <p>Q${qIdx + 1}. ${item.q}</p>
                <div class="quiz-options">
                    ${item.options.map((opt, oIdx) => `
                        <label class="quiz-option-label">
                            <input type="radio" name="question_${qIdx}" value="${oIdx}"> ${opt}
                        </label>
                    `).join('')}
                </div>
                <div class="quiz-feedback" id="feedback_${qIdx}"></div>
            `;
            quizContainer.appendChild(card);
        });
    }

    function checkQuizAnswer() {
        let score = 0;
        quizQuestions.forEach((item, qIdx) => {
            let selected = document.querySelector(`input[name="question_${qIdx}"]:checked`);
            let feedback = document.getElementById(`feedback_${qIdx}`);
            if (selected) {
                let val = parseInt(selected.value);
                if (val === item.answer) {
                    score++;
                    feedback.textContent = `Correct! ${item.explanation}`;
                    feedback.className = "quiz-feedback correct";
                } else {
                    feedback.textContent = `Incorrect. Correct answer is ${item.options[item.answer]}. ${item.explanation}`;
                    feedback.className = "quiz-feedback incorrect";
                }
            } else {
                feedback.textContent = `Not answered. Correct answer is ${item.options[item.answer]}.`;
                feedback.className = "quiz-feedback incorrect";
            }
        });

        vivaScoreNum.textContent = score;
        vivaScoreBoard.style.display = "block";
        quizSubmitBar.style.display = "none";
        window.scrollTo({ top: vivaScoreBoard.offsetTop - 100, behavior: 'smooth' });
    }

    // Initialize upon load
    initializeExperiment();
});
