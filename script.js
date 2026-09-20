/* ==========================================================
   AMRITA VIRTUAL LAB THEME - JS SCRIPT
   ========================================================== */

// Tab Switching Logic
function openTab(evt, tabId) {
    let tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }
    
    let tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].className = tabBtns[i].className.replace(" active", "");
    }
    
    document.getElementById(tabId).style.display = tabId === 'tab-simulator' ? 'flex' : 'block';
    evt.currentTarget.className += " active";

    // Re-render chart if observation tab is opened
    if(tabId === 'tab-observation' && window.updateGraph) {
        window.updateGraph();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let state = {
        material: "brass", liquid: "water",
        initialTemperature: 85, ambientTemperature: 25, currentTemperature: 25,
        coolingConstant: 0.040, elapsedTimeMinutes: 0, recordingInterval: 1,
        experimentRunning: false, isHeating: false, observations: [], nextRecordTime: 1
    };

    let simTimer = null;
    let chartInstance = null;

    // Controls
    const sliderT0 = document.getElementById("sliderT0");
    const sliderTs = document.getElementById("sliderTs");
    const lblT0 = document.getElementById("lblT0");
    const lblTs = document.getElementById("lblTs");
    const intervalSelect = document.getElementById("intervalSelect");
    const materialSelect = document.getElementById("materialSelect");
    const liquidSelect = document.getElementById("liquidSelect");

    const btnStartExperiment = document.getElementById("btnStartExperiment");
    const btnHeat = document.getElementById("btnHeat");
    const btnReset = document.getElementById("btnReset");

    const dispThermometerReading = document.getElementById("dispThermometerReading");
    const dispElapsedTime = document.getElementById("dispElapsedTime");
    const dispTempDiff = document.getElementById("dispTempDiff");
    const mercuryColumn = document.getElementById("mercuryColumn");
    const powerLamp = document.getElementById("powerLamp");

    // Event Listeners
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
        document.getElementById("calcTs").value = state.ambientTemperature;
        updateVisuals();
    });

    intervalSelect.addEventListener("change", (e) => {
        state.recordingInterval = parseFloat(e.target.value);
    });

    materialSelect.addEventListener("change", (e) => {
        const constants = { brass: 0.040, copper: 0.055, aluminium: 0.050, silver: 0.065, iron: 0.035 };
        state.material = e.target.value;
        state.coolingConstant = constants[state.material];
    });

    liquidSelect.addEventListener("change", (e) => {
        const constants = { water: 0.032, oil: 0.025, alcohol: 0.028 };
        state.liquid = e.target.value;
        state.coolingConstant = constants[state.liquid];
    });

    btnHeat.addEventListener("click", () => {
        if (state.isHeating || state.experimentRunning) return;
        state.isHeating = true;
        btnHeat.disabled = true;
        powerLamp.classList.add("active");

        let targetT = state.initialTemperature;
        let heatInterval = setInterval(() => {
            if (state.currentTemperature < targetT) {
                state.currentTemperature += 1;
                if (state.currentTemperature > targetT) state.currentTemperature = targetT;
                updateVisuals();
            } else {
                clearInterval(heatInterval);
                state.isHeating = false;
                powerLamp.classList.remove("active");
                alert("Heating complete. Click 'Start Cooling' to begin data recording.");
            }
        }, 30);
    });

    btnStartExperiment.addEventListener("click", () => {
        if (state.experimentRunning) return;
        state.experimentRunning = true;
        btnStartExperiment.disabled = true;
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
            
            updateVisuals();

            if (state.elapsedTimeMinutes >= state.nextRecordTime - 0.01) { // -0.01 for float tolerance
                recordObservationAt(parseFloat(state.elapsedTimeMinutes.toFixed(1)), state.currentTemperature);
                state.nextRecordTime += state.recordingInterval;
            }

            if (Math.abs(state.currentTemperature - Ts) < 0.1) {
                clearInterval(simTimer);
                alert("Experiment Finished. Check Observation Tab.");
            }
        }, 100);
    });

    btnReset.addEventListener("click", () => {
        clearInterval(simTimer);
        state.experimentRunning = false;
        state.isHeating = false;
        state.elapsedTimeMinutes = 0;
        state.currentTemperature = state.initialTemperature;
        state.observations = [];
        state.nextRecordTime = state.recordingInterval;

        btnStartExperiment.disabled = false;
        btnHeat.disabled = false;
        sliderT0.disabled = false;
        sliderTs.disabled = false;
        powerLamp.classList.remove("active");

        updateVisuals();
        updateObservationTable();
        if(window.updateGraph) window.updateGraph();
    });

    function updateVisuals() {
        let T = state.currentTemperature;
        let Ts = state.ambientTemperature;

        dispThermometerReading.textContent = T.toFixed(1) + " °C";
        let m = Math.floor(state.elapsedTimeMinutes);
        let s = Math.floor((state.elapsedTimeMinutes - m) * 60);
        dispElapsedTime.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        dispTempDiff.textContent = Math.max(0, T - Ts).toFixed(1) + " °C";

        let percent = ((T - 15) / (100 - 15)) * 100;
        mercuryColumn.style.height = Math.max(5, Math.min(100, percent)) + "%";
    }

    function recordObservationAt(time, temp) {
        state.observations.push({
            time: time,
            temperature: parseFloat(temp.toFixed(1)),
            ambient: state.ambientTemperature,
            diff: parseFloat((temp - state.ambientTemperature).toFixed(1))
        });
        updateObservationTable();
        if(window.updateGraph) window.updateGraph();
        updateResultSummary();
    }

    const observationBody = document.getElementById("observationBody");
    function updateObservationTable() {
        observationBody.innerHTML = "";
        if (state.observations.length === 0) {
            observationBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No data.</td></tr>`;
            return;
        }
        state.observations.forEach((obs, idx) => {
            let tr = document.createElement("tr");
            tr.innerHTML = `<td>${idx + 1}</td><td>${obs.time}</td><td>${obs.temperature}</td><td>${obs.ambient}</td><td>${obs.diff}</td>`;
            observationBody.appendChild(tr);
        });
    }

    document.getElementById("btnAddReading").addEventListener("click", () => {
        if(!state.experimentRunning && state.observations.length > 0) {
            recordObservationAt(parseFloat(state.elapsedTimeMinutes.toFixed(1)), state.currentTemperature);
        }
    });

    document.getElementById("btnClearTable").addEventListener("click", () => {
        state.observations = [];
        updateObservationTable();
        if(window.updateGraph) window.updateGraph();
    });

    // Chart
    function initChart() {
        const ctx = document.getElementById("coolingChart").getContext("2d");
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets: [
                { label: 'Experimental Data', data: [], borderColor: '#ff9900', borderWidth: 2, pointRadius: 4 },
                { label: 'Theoretical Curve', data: [], borderColor: '#003366', borderDash: [5,5], borderWidth: 2, pointRadius: 0 }
            ]},
            options: { responsive: true, maintainAspectRatio: false,
                scales: { x: { type: 'linear', title: { display: true, text: 'Time (min)' } }, y: { title: { display: true, text: 'Temp (°C)' } } }
            }
        });
    }

    window.updateGraph = function() {
        if (!chartInstance) return;
        chartInstance.data.datasets[0].data = state.observations.map(o => ({ x: o.time, y: o.temperature }));
        
        if (document.getElementById("chkTheoretical").checked && state.observations.length > 0) {
            let T0 = state.observations[0].temperature;
            let Ts = state.ambientTemperature;
            let maxT = Math.max(state.observations[state.observations.length - 1].time, 10);
            let theo = [];
            for (let t = 0; t <= maxT; t += 0.5) {
                theo.push({ x: t, y: Ts + (T0 - Ts) * Math.exp(-state.coolingConstant * t) });
            }
            chartInstance.data.datasets[1].data = theo;
            chartInstance.data.datasets[1].hidden = false;
        } else {
            chartInstance.data.datasets[1].hidden = true;
        }
        chartInstance.update();
    }
    
    document.getElementById("chkTheoretical").addEventListener("change", window.updateGraph);

    // Calculation
    document.getElementById("btnAutoFill").addEventListener("click", () => {
        if (state.observations.length < 2) return alert("Need at least 2 readings.");
        let first = state.observations[0], last = state.observations[state.observations.length - 1];
        document.getElementById("calcT1").value = first.temperature;
        document.getElementById("calcT2").value = last.temperature;
        document.getElementById("calcTs").value = first.ambient;
        document.getElementById("calct1").value = first.time;
        document.getElementById("calct2").value = last.time;
    });

    document.getElementById("btnCalculateK").addEventListener("click", () => {
        let T1 = parseFloat(document.getElementById("calcT1").value);
        let T2 = parseFloat(document.getElementById("calcT2").value);
        let Ts = parseFloat(document.getElementById("calcTs").value);
        let dt = parseFloat(document.getElementById("calct2").value) - parseFloat(document.getElementById("calct1").value);
        
        let k = (1 / dt) * Math.log((T1 - Ts) / (T2 - Ts));
        document.getElementById("displayKValue").textContent = k.toFixed(5);
        document.getElementById("resK").textContent = k.toFixed(5) + " min⁻¹";
    });

    function updateResultSummary() {
        if(state.observations.length > 0){
            document.getElementById("resT0").textContent = state.observations[0].temperature.toFixed(1) + " °C";
            document.getElementById("resTf").textContent = state.observations[state.observations.length-1].temperature.toFixed(1) + " °C";
            document.getElementById("resTs").textContent = state.ambientTemperature.toFixed(1) + " °C";
            document.getElementById("resTime").textContent = state.observations[state.observations.length-1].time.toFixed(1) + " min";
        }
    }

    // Quiz
    const quizData = [
        { q: "Newton's law of cooling is applicable when:", options: ["Temperature difference is very large", "Temperature difference is small", "Liquid is boiling", "None of these"], answer: 1 },
        { q: "The cooling curve (Temp vs Time) is a:", options: ["Straight Line", "Parabola", "Exponential curve", "Hyperbola"], answer: 2 },
        { q: "What is the unit of cooling constant (k)?", options: ["Kelvin", "min⁻¹ or sec⁻¹", "Joules", "Watts"], answer: 1 },
        { q: "If surrounding temperature increases, the rate of cooling:", options: ["Increases", "Decreases", "Remains Same", "Becomes Zero"], answer: 1 }
    ];

    const quizCont = document.getElementById("quizContainer");
    quizData.forEach((q, idx) => {
        let div = document.createElement("div");
        div.className = "quiz-q";
        div.innerHTML = `<p>Q${idx+1}. ${q.q}</p>` + q.options.map((opt, i) => `<label><input type="radio" name="q${idx}" value="${i}"> ${opt}</label>`).join('');
        quizCont.appendChild(div);
    });

    document.getElementById("btnSubmitQuiz").addEventListener("click", () => {
        let score = 0;
        quizData.forEach((q, idx) => {
            let sel = document.querySelector(`input[name="q${idx}"]:checked`);
            if (sel && parseInt(sel.value) === q.answer) score++;
        });
        document.getElementById("vivaScoreNum").textContent = score;
        document.getElementById("vivaScoreBoard").style.display = "block";
    });

    initChart();
    updateVisuals();
});
