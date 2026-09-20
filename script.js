/* ==========================================================
   NEWTON'S LAW OF COOLING — ADVANCED SCRIPT ENGINE
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    let state = {
        material: "brass",
        liquid: "water",
        initialTemperature: 85,
        ambientTemperature: 25,
        currentTemperature: 25,
        coolingConstant: 0.040,
        elapsedTimeMinutes: 0,
        recordingInterval: 1,
        experimentRunning: false,
        experimentPaused: false,
        isHeating: false,
        observations: [],
        nextRecordTime: 1
    };

    let simTimer = null;
    let chartInstance = null;

    // DOM Elements
    const materialSelect = document.getElementById("materialSelect");
    const liquidSelect = document.getElementById("liquidSelect");
    const sliderT0 = document.getElementById("sliderT0");
    const sliderTs = document.getElementById("sliderTs");
    const lblT0 = document.getElementById("lblT0");
    const lblTs = document.getElementById("lblTs");
    const intervalSelect = document.getElementById("intervalSelect");

    const btnStartExperiment = document.getElementById("btnStartExperiment");
    const btnHeat = document.getElementById("btnHeat");
    const btnReset = document.getElementById("btnReset");
    const btnPause = document.getElementById("btnPause");
    const btnResume = document.getElementById("btnResume");

    const powerLamp = document.getElementById("powerLamp");
    const boilerLiquid = document.getElementById("boilerLiquid");
    const mercuryColumn = document.getElementById("mercuryColumn");
    const dispThermometerReading = document.getElementById("dispThermometerReading");
    const dispElapsedTime = document.getElementById("dispElapsedTime");
    const dispTempDiff = document.getElementById("dispTempDiff");

    const observationBody = document.getElementById("observationBody");
    const selectAllRows = document.getElementById("selectAllRows");
    const btnAddReading = document.getElementById("btnAddReading");
    const btnDeleteSelected = document.getElementById("btnDeleteSelected");
    const btnClearTable = document.getElementById("btnClearTable");
    const btnExportCSV = document.getElementById("btnExportCSV");

    const chkTheoretical = document.getElementById("chkTheoretical");
    const btnDownloadGraph = document.getElementById("btnDownloadGraph");

    const btnAutoFill = document.getElementById("btnAutoFill");
    const calcT1 = document.getElementById("calcT1");
    const calcT2 = document.getElementById("calcT2");
    const calcTs = document.getElementById("calcTs");
    const calct1 = document.getElementById("calct1");
    const calct2 = document.getElementById("calct2");
    const btnCalculateK = document.getElementById("btnCalculateK");
    const displayKValue = document.getElementById("displayKValue");

    const resT0 = document.getElementById("resT0");
    const resTf = document.getElementById("resTf");
    const resTs = document.getElementById("resTs");
    const resTime = document.getElementById("resTime");
    const resK = document.getElementById("resK");
    const btnPrintReport = document.getElementById("btnPrintReport");

    // Accordions
    document.querySelectorAll(".panel-header").forEach(header => {
        header.addEventListener("click", () => {
            let body = header.nextElementSibling;
            body.style.display = body.style.display === "none" ? "flex" : "none";
        });
    });

    // Event Listeners for controls
    sliderT0.addEventListener("input", (e) => {
        state.initialTemperature = parseFloat(e.target.value);
        lblT0.textContent = state.initialTemperature;
        if (!state.experimentRunning && !state.isHeating) {
            state.currentTemperature = state.initialTemperature;
            updateVisuals();
        }
    });

    sliderTs.addEventListener("input", (e) => {
        state.ambientTemperature = parseFloat(e.target.value);
        lblTs.textContent = state.ambientTemperature;
        calcTs.value = state.ambientTemperature;
        updateVisuals();
    });

    intervalSelect.addEventListener("change", (e) => {
        state.recordingInterval = parseFloat(e.target.value);
        state.nextRecordTime = state.elapsedTimeMinutes + state.recordingInterval;
    });

    materialSelect.addEventListener("change", (e) => {
        state.material = e.target.value;
        setMaterialConstant();
    });

    liquidSelect.addEventListener("change", (e) => {
        state.liquid = e.target.value;
        setLiquidConstant();
    });

    function setMaterialConstant() {
        const constants = { brass: 0.040, copper: 0.055, aluminium: 0.050, silver: 0.065, iron: 0.035 };
        state.coolingConstant = constants[state.material] || 0.040;
    }

    function setLiquidConstant() {
        const constants = { water: 0.032, oil: 0.025, alcohol: 0.028 };
        state.coolingConstant = constants[state.liquid] || 0.032;
    }

    btnHeat.addEventListener("click", startHeating);
    btnStartExperiment.addEventListener("click", startCoolingExperiment);
    btnPause.addEventListener("click", pauseExperiment);
    btnResume.addEventListener("click", resumeExperiment);
    btnReset.addEventListener("click", resetExperiment);

    btnAddReading.addEventListener("click", recordObservation);
    btnDeleteSelected.addEventListener("click", deleteSelectedObservations);
    btnClearTable.addEventListener("click", clearObservationTable);
    btnExportCSV.addEventListener("click", exportCSV);

    chkTheoretical.addEventListener("change", updateGraph);
    btnDownloadGraph.addEventListener("click", downloadGraph);
    btnAutoFill.addEventListener("click", autoFillCalculation);
    btnCalculateK.addEventListener("click", calculateConstantK);
    btnPrintReport.addEventListener("click", () => window.print());

    selectAllRows.addEventListener("change", (e) => {
        document.querySelectorAll(".row-checkbox").forEach(cb => cb.checked = e.target.checked);
    });

    function startHeating() {
        if (state.isHeating || state.experimentRunning) return;
        state.isHeating = true;
        btnHeat.disabled = true;
        powerLamp.classList.add("active");

        let targetT = state.initialTemperature;
        let heatInterval = setInterval(() => {
            if (state.currentTemperature < targetT) {
                state.currentTemperature += 0.5;
                if (state.currentTemperature > targetT) state.currentTemperature = targetT;
                updateVisuals();
            } else {
                clearInterval(heatInterval);
                state.isHeating = false;
                powerLamp.classList.remove("active");
                btnHeat.disabled = false;
                alert("Initial temperature reached successfully. You can now start the cooling experiment.");
            }
        }, 50);
    }

    function startCoolingExperiment() {
        if (state.experimentRunning) return;
        state.experimentRunning = true;
        state.experimentPaused = false;
        btnStartExperiment.disabled = true;
        btnPause.disabled = false;
        btnResume.style.display = "none";
        sliderT0.disabled = true;
        sliderTs.disabled = true;

        if (state.observations.length === 0) {
            recordObservationAt(0, state.initialTemperature);
            state.nextRecordTime = state.recordingInterval;
        }

        simTimer = setInterval(() => {
            state.elapsedTimeMinutes += 0.1;
            let T0 = state.initialTemperature;
            let Ts = state.ambientTemperature;
            let k = state.coolingConstant;
            let t = state.elapsedTimeMinutes;

            state.currentTemperature = Ts + (T0 - Ts) * Math.exp(-k * t);
            if (state.currentTemperature < Ts) state.currentTemperature = Ts;

            updateVisuals();

            if (state.elapsedTimeMinutes >= state.nextRecordTime) {
                recordObservationAt(parseFloat(state.elapsedTimeMinutes.toFixed(1)), state.currentTemperature);
                state.nextRecordTime += state.recordingInterval;
            }

            if (Math.abs(state.currentTemperature - Ts) < 0.1) {
                pauseExperiment();
                alert("Experiment completed. Liquid temperature has reached ambient temperature.");
            }
        }, 100);
    }

    function pauseExperiment() {
        if (!state.experimentRunning) return;
        clearInterval(simTimer);
        state.experimentRunning = false;
        state.experimentPaused = true;
        btnPause.disabled = true;
        btnResume.style.display = "inline-block";
        btnResume.disabled = false;
    }

    function resumeExperiment() {
        if (!state.experimentPaused) return;
        state.experimentPaused = false;
        btnResume.style.display = "none";
        btnPause.disabled = false;
        startCoolingExperiment();
    }

    function resetExperiment() {
        clearInterval(simTimer);
        state.experimentRunning = false;
        state.experimentPaused = false;
        state.isHeating = false;
        state.elapsedTimeMinutes = 0;
        state.currentTemperature = state.initialTemperature;
        state.nextRecordTime = state.recordingInterval;
        state.observations = [];

        btnStartExperiment.disabled = false;
        btnHeat.disabled = false;
        btnPause.disabled = true;
        btnResume.style.display = "none";
        sliderT0.disabled = false;
        sliderTs.disabled = false;
        powerLamp.classList.remove("active");

        updateVisuals();
        updateObservationTable();
        updateGraph();
        updateResultSummary();
    }

    function updateVisuals() {
        let T = state.currentTemperature;
        let Ts = state.ambientTemperature;

        dispThermometerReading.textContent = T.toFixed(1) + " °C";
        dispElapsedTime.textContent = formatTime(state.elapsedTimeMinutes);
        dispTempDiff.textContent = Math.max(0, T - Ts).toFixed(1) + " °C";

        let percent = ((T - 15) / (100 - 15)) * 100;
        percent = Math.max(5, Math.min(100, percent));
        mercuryColumn.style.height = percent + "%";
    }

    function formatTime(min) {
        let m = Math.floor(min);
        let s = Math.floor((min - m) * 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

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
        updateResultSummary();
    }

    function updateObservationTable() {
        observationBody.innerHTML = "";
        if (state.observations.length === 0) {
            observationBody.innerHTML = `<tr class="empty-row"><td colspan="6" class="text-center">No observations recorded yet. Start experiment to generate data automatically.</td></tr>`;
            return;
        }

        state.observations.forEach((obs, idx) => {
            let tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" data-index="${idx}"></td>
                <td>${idx + 1}</td>
                <td>${obs.time}</td>
                <td><input type="number" class="classic-input" value="${obs.temperature}" data-index="${idx}" style="width:75px;" step="0.1"></td>
                <td>${obs.ambient}</td>
                <td>${obs.diff}</td>
            `;
            observationBody.appendChild(tr);
        });

        document.querySelectorAll(".classic-input[data-index]").forEach(input => {
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
        let checked = document.querySelectorAll(".row-checkbox:checked");
        let indices = Array.from(checked).map(cb => parseInt(cb.getAttribute("data-index")));
        state.observations = state.observations.filter((_, idx) => !indices.includes(idx));
        updateObservationTable();
        updateGraph();
        updateResultSummary();
    }

    function clearObservationTable() {
        state.observations = [];
        updateObservationTable();
        updateGraph();
        updateResultSummary();
    }

    function exportCSV() {
        if (state.observations.length === 0) {
            alert("No observations available to export.");
            return;
        }
        let csv = "S.No,Time(min),Temperature(deg C),AmbientTemp(deg C),TempDiff(deg C)\n";
        state.observations.forEach((o, i) => {
            csv += `${i+1},${o.time},${o.temperature},${o.ambient},${o.diff}\n`;
        });
        let blob = new Blob([csv], { type: 'text/csv' });
        let link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'newtons_cooling_data.csv';
        link.click();
    }

    // Chart.js Setup
    function initChart() {
        const ctx = document.getElementById("coolingChart").getContext("2d");
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    { label: 'Experimental Data Points', data: [], borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 2, pointRadius: 4 },
                    { label: 'Theoretical Curve', data: [], borderColor: '#dc2626', borderDash: [5,5], borderWidth: 2, pointRadius: 0 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'Time t (minutes)' } },
                    y: { title: { display: true, text: 'Temperature T (°C)' } }
                }
            }
        });
    }

    function updateGraph() {
        if (!chartInstance) return;
        let exp = state.observations.map(o => ({ x: o.time, y: o.temperature }));
        chartInstance.data.datasets[0].data = exp;

        if (chkTheoretical.checked && state.observations.length > 0) {
            let T0 = state.observations[0].temperature;
            let Ts = state.ambientTemperature;
            let k = state.coolingConstant;
            let maxT = state.observations[state.observations.length - 1].time;
            maxT = Math.max(maxT, 10);

            let theo = [];
            for (let t = 0; t <= maxT; t += 0.5) {
                let T = Ts + (T0 - Ts) * Math.exp(-k * t);
                theo.push({ x: t, y: parseFloat(T.toFixed(2)) });
            }
            chartInstance.data.datasets[1].data = theo;
            chartInstance.data.datasets[1].hidden = false;
        } else {
            chartInstance.data.datasets[1].data = [];
        }
        chartInstance.update();
    }

    function downloadGraph() {
        if (!chartInstance) return;
        let link = document.createElement('a');
        link.download = 'cooling_graph.png';
        link.href = chartInstance.toBase64Image();
        link.click();
    }

    function autoFillCalculation() {
        if (state.observations.length < 2) {
            alert("Record at least two observations in the table first.");
            return;
        }
        let first = state.observations[0];
        let later = state.observations[state.observations.length - 1];
        calcT1.value = first.temperature;
        calcT2.value = later.temperature;
        calcTs.value = first.ambient;
        calct1.value = first.time;
        calct2.value = later.time;
        calculateConstantK();
    }

    function calculateConstantK() {
        let T1 = parseFloat(calcT1.value);
        let T2 = parseFloat(calcT2.value);
        let Ts = parseFloat(calcTs.value);
        let t1 = parseFloat(calct1.value);
        let t2 = parseFloat(calct2.value);

        if (isNaN(T1) || isNaN(T2) || isNaN(Ts) || isNaN(t1) || isNaN(t2)) {
            alert("Please enter valid numeric values for calculation.");
            return;
        }
        let dt = t2 - t1;
        if (dt <= 0) {
            alert("Time t2 must be greater than t1.");
            return;
        }
        let ratio = (T1 - Ts) / (T2 - Ts);
        if (ratio <= 0) {
            alert("Invalid temperature range for logarithmic calculation.");
            return;
        }
        let k = (1 / dt) * Math.log(ratio);
        displayKValue.textContent = k.toFixed(5);
        resK.textContent = k.toFixed(5) + " min^-1";
    }

    function updateResultSummary() {
        let t0 = state.observations.length > 0 ? state.observations[0].temperature : state.initialTemperature;
        let tf = state.observations.length > 0 ? state.observations[state.observations.length - 1].temperature : state.currentTemperature;
        let totTime = state.observations.length > 0 ? state.observations[state.observations.length - 1].time : 0;

        resT0.textContent = t0.toFixed(1) + " °C";
        resTf.textContent = tf.toFixed(1) + " °C";
        resTs.textContent = state.ambientTemperature.toFixed(1) + " °C";
        resTime.textContent = totTime.toFixed(1) + " min";
    }

    // Quiz
    const quizData = [
        { q: "Newton's law of cooling states that rate of heat loss is proportional to:", options: ["Absolute temperature", "Temperature difference with surroundings", "Volume of body", "Pressure"], answer: 1 },
        { q: "What is the theoretical time required for a body to reach ambient temperature?", options: ["Finite time", "Infinite time", "Zero time", "Exactly 10 minutes"], answer: 1 },
        { q: "Initially, the rate of cooling of a hot liquid is:", options: ["Maximum / Fast", "Minimum / Slow", "Zero", "Constant"], answer: 0 },
        { q: "What are the standard SI-derived units of cooling constant k in this experiment?", options: ["kg/m^3", "Joules", "min^-1", "Kelvin"], answer: 2 }
    ];

    function initQuiz() {
        const container = document.getElementById("quizContainer");
        container.innerHTML = "";
        quizData.forEach((q, idx) => {
            let card = document.createElement("div");
            card.classList.add("quiz-question-card");
            card.innerHTML = `
                <p>Q${idx+1}. ${q.q}</p>
                <div class="quiz-options">
                    ${q.options.map((opt, oIdx) => `<label><input type="radio" name="q_${idx}" value="${oIdx}"> ${opt}</label>`).join('')}
                </div>
                <div class="quiz-feedback" id="q_feedback_${idx}"></div>
            `;
            container.appendChild(card);
        });
    }

    document.getElementById("btnSubmitQuiz").addEventListener("click", () => {
        let score = 0;
        quizData.forEach((q, idx) => {
            let selected = document.querySelector(`input[name="q_${idx}"]:checked`);
            let feedback = document.getElementById(`q_feedback_${idx}`);
            if (selected && parseInt(selected.value) === q.answer) {
                score++;
                feedback.textContent = "Correct!";
                feedback.className = "quiz-feedback correct";
            } else {
                feedback.textContent = `Incorrect. Correct answer is: ${q.options[q.answer]}`;
                feedback.className = "quiz-feedback incorrect";
            }
        });
        document.getElementById("vivaScoreNum").textContent = score;
        document.getElementById("vivaScoreBoard").style.display = "block";
        document.getElementById("quizSubmitBar").style.display = "none";
    });

    document.getElementById("btnRetryQuiz").addEventListener("click", () => {
        document.getElementById("vivaScoreBoard").style.display = "none";
        document.getElementById("quizSubmitBar").style.display = "block";
        initQuiz();
    });

    // Initialize
    initChart();
    initQuiz();
    resetExperiment();
});
