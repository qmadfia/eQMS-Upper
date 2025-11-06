// ===========================================
// 1. Deklarasi Variabel Global dan DOM References (Modifikasi)
// ===========================================
// --- IMPOR DATABASE DARI FILE TERPISAH ---
// Pastikan path './databasemodel.js' sudah benar sesuai lokasi file Anda.
import { styleModelDatabase } from './databasemodel.js';

let totalInspected = 0;
// Variabel lama ini masih berguna untuk tampilan UI, tapi tidak untuk kalkulasi final
let totalReworkLeft = 0;
let totalReworkRight = 0;
let totalReworkPairs = 0;
let defectCounts = {}; 

// --- VARIABEL BARU UNTUK POLA MULTIPLE DEFECT ---
let selectedDefects = []; 
let currentInspectionPairs = []; 

// --- VARIABEL BARU UNTUK LOGIKA REWORK AKURAT ---
// Menyimpan array dari posisi rework untuk setiap item R-Grade
// Contoh: [['PAIRS', 'LEFT'], ['LEFT'], ['RIGHT'], ['PAIRS']]
let reworkLog = [];

// --- MODIFIKASI DIMULAI ---
// Variabel baru untuk melacak posisi rework yang sudah dipakai dalam satu siklus inspeksi
let usedReworkPositionsThisCycle = [];

// --- MODIFIKASI BARU: Variabel untuk limit dinamis ---
let currentInspectionLimit = 0;
// --- MODIFIKASI SELESAI ---
// ---------------------------------------------

const qtyInspectOutputs = {
    'a-grade': 0,
    'r-grade': 0,
    'b-grade': 0,
    'c-grade': 0
};

// Referensi Elemen DOM Utama - Akan diisi di initApp
let outputElements = {};
let fttOutput;
let qtyInspectOutput;
let leftCounter;
let rightCounter;
let pairsCounter;
let summaryContainer;
let redoRateOutput;
let qtySampleSetInput;
let defectButtons;
let reworkButtons;
let gradeInputButtons;
let ncvsSelect;
let auditorSelect;
let modelNameInput;
let styleNumberInput;

// Data mapping Auditor ke NCVS
const auditorNcvsMap = {
    "Elita": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "201", "202", "203", "204", "207", "210"],
    "Puji": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "201", "202", "203", "204", "207", "210"],
    "Muadaroh": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "201", "202", "203", "204", "207", "210"],
    "Yaffie": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116"],
    "Inda": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "201", "202", "203", "204", "207", "210"],
    "Inggit": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "201", "202", "203", "204", "207", "210"],
    "Yusuf": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "201", "202", "203", "204", "207", "210"],
    "Anin": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "201", "202", "203", "204", "207", "210"],
    "Karima": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "201", "202", "203", "204", "207", "210"]
};

// Kunci localStorage
const USED_NCVS_STORAGE_KEY = 'usedNcvsPerDay';
const STORAGE_KEYS = {
    FORM_DATA: 'qms_form_data',
    DEFECT_COUNTS: 'qms_defect_counts',
    QTY_OUTPUTS: 'qms_qty_outputs',
    REWORK_COUNTERS: 'qms_rework_counters',
    STATE_VARIABLES: 'qms_state_variables',
    QTY_SAMPLE_SET: 'qtySampleSet'
};

// ===========================================
// 2. Fungsi localStorage Komprehensif (Modifikasi)
// ===========================================

function saveToLocalStorage() {
    try {
        const formData = {
            auditor: auditorSelect ? auditorSelect.value : '',
            ncvs: ncvsSelect ? ncvsSelect.value : '',
            modelName: document.getElementById("model-name") ? document.getElementById("model-name").value : '',
            styleNumber: document.getElementById("style-number") ? document.getElementById("style-number").value : ''
        };
        localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formData));
        localStorage.setItem(STORAGE_KEYS.DEFECT_COUNTS, JSON.stringify(defectCounts));
        localStorage.setItem(STORAGE_KEYS.QTY_OUTPUTS, JSON.stringify(qtyInspectOutputs));

        const reworkCounters = {
            left: totalReworkLeft,
            right: totalReworkRight,
            pairs: totalReworkPairs
        };
        localStorage.setItem(STORAGE_KEYS.REWORK_COUNTERS, JSON.stringify(reworkCounters));

        const stateVariables = {
            selectedDefects: selectedDefects,
            currentInspectionPairs: currentInspectionPairs,
            totalInspected: totalInspected,
            reworkLog: reworkLog,
            usedReworkPositionsThisCycle: usedReworkPositionsThisCycle
        };
        localStorage.setItem(STORAGE_KEYS.STATE_VARIABLES, JSON.stringify(stateVariables));

    } catch (error) {
        console.error("Error saat menyimpan data ke localStorage:", error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedFormData = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
        if (savedFormData) {
            const formData = JSON.parse(savedFormData);
            if (auditorSelect) auditorSelect.value = formData.auditor || '';
            if (ncvsSelect) {
                updateNcvsOptions(formData.auditor || '');
                ncvsSelect.value = formData.ncvs || '';
            }
            if (document.getElementById("model-name")) document.getElementById("model-name").value = formData.modelName || '';
            if (document.getElementById("style-number")) document.getElementById("style-number").value = formData.styleNumber || '';
        }

        const savedDefectCounts = localStorage.getItem(STORAGE_KEYS.DEFECT_COUNTS);
        if (savedDefectCounts) {
            defectCounts = JSON.parse(savedDefectCounts);
        }

        const savedQtyOutputs = localStorage.getItem(STORAGE_KEYS.QTY_OUTPUTS);
        if (savedQtyOutputs) {
            const qtyData = JSON.parse(savedQtyOutputs);
            for (const grade in qtyData) {
                qtyInspectOutputs[grade] = qtyData[grade];
            }
        }

        const savedReworkCounters = localStorage.getItem(STORAGE_KEYS.REWORK_COUNTERS);
        if (savedReworkCounters) {
            const reworkData = JSON.parse(savedReworkCounters);
            totalReworkLeft = reworkData.left || 0;
            totalReworkRight = reworkData.right || 0;
            totalReworkPairs = reworkData.pairs || 0;
        }

        const savedStateVariables = localStorage.getItem(STORAGE_KEYS.STATE_VARIABLES);
        if (savedStateVariables) {
            const stateData = JSON.parse(savedStateVariables);
            selectedDefects = stateData.selectedDefects || [];
            currentInspectionPairs = stateData.currentInspectionPairs || [];
            totalInspected = stateData.totalInspected || 0;
            reworkLog = stateData.reworkLog || [];
            usedReworkPositionsThisCycle = stateData.usedReworkPositionsThisCycle || [];
        }
        
        // Memuat Qty Sample Set
        const savedQtySampleSet = localStorage.getItem(STORAGE_KEYS.QTY_SAMPLE_SET);
        if (qtySampleSetInput && savedQtySampleSet) {
            qtySampleSetInput.value = parseInt(savedQtySampleSet, 10) >= 0 ? savedQtySampleSet : '0';
            currentInspectionLimit = parseInt(savedQtySampleSet, 10) || 0;
        }
        
        // Update semua tampilan berdasarkan data yang dimuat
        updateAllDisplays();
        updateButtonStatesFromLoadedData();

    } catch (error) {
        console.error("Error saat memuat data dari localStorage:", error);
        resetAllFields();
    }
}

function updateAllDisplays() {
    // Update counter grade
    for (const grade in qtyInspectOutputs) {
        if (outputElements[grade]) {
            outputElements[grade].textContent = qtyInspectOutputs[grade];
        }
    }
    // Update rework counters
    if (leftCounter) leftCounter.textContent = totalReworkLeft;
    if (rightCounter) rightCounter.textContent = totalReworkRight;
    if (pairsCounter) pairsCounter.textContent = totalReworkPairs;
    
    // Update summary dan statistik utama
    updateDefectSummaryDisplay();
    updateTotalQtyInspect();
}

function updateButtonStatesFromLoadedData() {
    // Reset semua highlight dan state
    defectButtons.forEach(btn => btn.classList.remove('active'));
    
    // Highlight defect yang sedang dipilih dari data yang di-load
    selectedDefects.forEach(defectName => {
        const button = Array.from(defectButtons).find(btn => (btn.dataset.defect || btn.textContent.trim()) === defectName);
        if (button) {
            button.classList.add('active');
        }
    });

    // Atur status Rework Section
    const enableRework = selectedDefects.length > 0;
    toggleButtonGroup(reworkButtons, enableRework);
    
    // Panggil fungsi baru untuk menonaktifkan tombol rework yang sudah digunakan dari data yang dimuat
    updateReworkButtonStates();

    // Atur status Qty Section (R/B/C) sesuai aturan baru
    updateQtySectionState();
}

function clearLocalStorageExceptQtySampleSet() {
    try {
        localStorage.removeItem(STORAGE_KEYS.FORM_DATA);
        localStorage.removeItem(STORAGE_KEYS.DEFECT_COUNTS);
        localStorage.removeItem(STORAGE_KEYS.QTY_OUTPUTS);
        localStorage.removeItem(STORAGE_KEYS.REWORK_COUNTERS);
        localStorage.removeItem(STORAGE_KEYS.STATE_VARIABLES);
        console.log("localStorage dibersihkan (kecuali qty sample set)");
    } catch (error) {
        console.error("Error saat membersihkan localStorage:", error);
    }
}

// ===========================================
// 3. Fungsi Pembantu: Mengatur Status Tombol (Modifikasi)
// ===========================================

// Fungsi untuk mengaktifkan/menonaktifkan sekelompok tombol
function toggleButtonGroup(buttons, enable) {
    buttons.forEach(button => {
        if (!button.dataset.forceDisabled) {
            button.disabled = !enable;
            button.classList.toggle('inactive', !enable);
        }
        
        // Hapus highlight 'active' saat dinonaktifkan
        if (!enable) {
            button.classList.remove('active');
        }
    });
}

// ===========================================
// FUNGSI PEMBANTU BARU: Menonaktifkan Tombol Rework Individual
// ===========================================
function updateReworkButtonStates() {
    reworkButtons.forEach(button => {
        const position = button.id.replace('rework-', '').toUpperCase();
        
        // Cek apakah posisi ini sudah digunakan dalam siklus saat ini
        if (usedReworkPositionsThisCycle.includes(position)) {
            button.disabled = true;
            button.classList.add('inactive');
            button.dataset.forceDisabled = 'true'; 
        } else {
            delete button.dataset.forceDisabled;
            if (!button.disabled) {
                button.classList.remove('inactive');
            }
        }
    });
}

// ===========================================
// FUNGSI PEMBANTU BARU: Mengontrol Status Tombol A-Grade
// ===========================================
function updateAGradeButtonState() {
    const aGradeButton = Array.from(gradeInputButtons).find(btn => btn.classList.contains('a-grade'));
    if (!aGradeButton) return;

    const shouldBeDisabled = selectedDefects.length > 0 || currentInspectionPairs.length > 0;

    aGradeButton.disabled = shouldBeDisabled;
    aGradeButton.classList.toggle('inactive', shouldBeDisabled);
}

// ===========================================
// FUNGSI BARU: Mengatur Status Tombol Berdasarkan Qty Sample Set Limit
// ===========================================
function updateButtonStatesBasedOnLimit() {
    const hasReachedLimit = totalInspected >= currentInspectionLimit && currentInspectionLimit > 0;
    
    if (hasReachedLimit) {
        // Nonaktifkan semua tombol input
        toggleButtonGroup(defectButtons, false);
        toggleButtonGroup(reworkButtons, false);
        toggleButtonGroup(gradeInputButtons, false);
        
        // Hapus highlight aktif
        defectButtons.forEach(btn => btn.classList.remove('active'));
        reworkButtons.forEach(btn => btn.classList.remove('active'));
        gradeInputButtons.forEach(btn => btn.classList.remove('active'));
        
        console.log(`Limit inspeksi ${currentInspectionLimit} tercapai. Input dinonaktifkan.`);
    } else if (currentInspectionLimit > 0) {
        // Jika belum mencapai limit, aktifkan kembali tombol sesuai state normal
        // Hanya jalankan jika sedang tidak dalam proses inspeksi
        if (selectedDefects.length === 0 && currentInspectionPairs.length === 0) {
            initButtonStates();
        }
    }
}

// ===========================================
// 4. Fungsi Utama: Inisialisasi Status Tombol (Modifikasi)
// ===========================================
function initButtonStates() {
    console.log("Mengatur status tombol ke kondisi awal siklus...");

    // Reset variabel state untuk siklus baru
    selectedDefects = [];
    currentInspectionPairs = [];
    usedReworkPositionsThisCycle = [];

    // Reset tampilan visual tombol
    defectButtons.forEach(btn => btn.classList.remove('active'));
    
    // Aktifkan semua tombol defect
    toggleButtonGroup(defectButtons, true);

    updateAGradeButtonState();
    updateReworkButtonStates(); 
    toggleButtonGroup(reworkButtons, false); 
    updateQtySectionState(); 
    
    // Cek batas inspeksi menggunakan currentInspectionLimit
    if (totalInspected >= currentInspectionLimit && currentInspectionLimit > 0) {
        toggleButtonGroup(defectButtons, false);
        toggleButtonGroup(gradeInputButtons, false);
        console.log(`Batas inspeksi ${currentInspectionLimit} tercapai. Input dinonaktifkan.`);
    }
}

// ===========================================
// 5. Update Qty Counters (Left, Right, Pairs) (Modifikasi)
// ===========================================
function updateQuantity(counterId) {
    const counterElement = document.getElementById(counterId);
    if (!counterElement) {
        console.error("Elemen counter tidak ditemukan:", counterId);
        return;
    }
    let currentValue = parseInt(counterElement.textContent) || 0;
    currentValue++;
    counterElement.textContent = currentValue;

    if (counterId === 'left-counter') {
        totalReworkLeft = currentValue;
    } else if (counterId === 'pairs-counter') {
        totalReworkPairs = currentValue;
    } else if (counterId === 'right-counter') {
        totalReworkRight = currentValue;
    }
    
    updateRedoRate();
    saveToLocalStorage();
}

// ===========================================
// 6. Update FTT dan Redo Rate (MODIFIKASI FINAL v2)
// ===========================================
function updateFTT() {
    if (!fttOutput) return;

    const processedReworks = getProcessedReworkCounts();
    const calculatedTotalRework = processedReworks.calculatedTotal;

    const totalBGrade = qtyInspectOutputs['b-grade'] || 0;
    const totalCGrade = qtyInspectOutputs['c-grade'] || 0;

    const fttValue = totalInspected > 0 ? ((totalInspected - (calculatedTotalRework + totalBGrade + totalCGrade)) / totalInspected) * 100 : 0;
    fttOutput.textContent = `${Math.max(0, fttValue).toFixed(2)}%`; 

    if (fttValue >= 92) {
        fttOutput.className = 'counter high-ftt';
    } else if (fttValue >= 80) {
        fttOutput.className = 'counter medium-ftt';
    } else {
        fttOutput.className = 'counter low-ftt';
    }
}

function updateRedoRate() {
    if (!redoRateOutput) return;

    const processedReworks = getProcessedReworkCounts();
    const calculatedTotalRework = processedReworks.calculatedTotal;

    const redoRateValue = totalInspected !== 0 ? (calculatedTotalRework / totalInspected) * 100 : 0;
    redoRateOutput.textContent = `${redoRateValue.toFixed(2)}%`;
}

// ===========================================
// FUNGSI PEMBANTU BARU: Memproses & Memisahkan Tipe Rework (REVISI TOTAL)
// ===========================================
function getProcessedReworkCounts() {
    let finalReworkPairs = 0;
    let finalReworkKiri = 0;
    let finalReworkKanan = 0;
    let calculatedTotal = 0;

    for (const reworkPositions of reworkLog) {
        const hasPairs = reworkPositions.includes('PAIRS');
        const hasLeft = reworkPositions.includes('LEFT');
        const hasRight = reworkPositions.includes('RIGHT');

        if (hasPairs) {
            calculatedTotal += 1;
            finalReworkPairs += 1;
        } else if (hasLeft && hasRight) {
            calculatedTotal += 1;
            finalReworkPairs += 1;
        } else if (hasLeft) {
            calculatedTotal += 0.5;
            finalReworkKiri += 1;
        } else if (hasRight) {
            calculatedTotal += 0.5;
            finalReworkKanan += 1;
        }
    }

    return {
        finalReworkPairs,
        finalReworkKiri,
        finalReworkKanan,
        calculatedTotal
    };
}

// ===========================================
// 7. Update Total Qty Inspect (termasuk FTT dan Redo Rate) (Perbaikan)
// ===========================================
function updateTotalQtyInspect() {
    let total = 0;
    for (const category in qtyInspectOutputs) {
        total += qtyInspectOutputs[category];
    }
    if (qtyInspectOutput) {
        qtyInspectOutput.textContent = total;
    }
    totalInspected = total;
    updateFTT();
    updateRedoRate();
    saveToLocalStorage();

    // Gunakan fungsi baru untuk mengecek limit
    updateButtonStatesBasedOnLimit();
}

// ===========================================
// 8. Menambahkan Defect ke Summary List (Logika Baru)
// ===========================================
function addAllDefectsToSummary(finalGrade) {
    if (currentInspectionPairs.length === 0 || !finalGrade) {
        console.warn("addDefectsToSummary: Tidak ada pasangan defect/posisi untuk dicatat.");
        return;
    }

    currentInspectionPairs.forEach(pair => {
        const { type, position } = pair;

        if (!defectCounts[type]) {
            defectCounts[type] = { "LEFT": {}, "PAIRS": {}, "RIGHT": {} };
        }
        if (!defectCounts[type][position]) {
            defectCounts[type][position] = {};
        }
        if (!defectCounts[type][position][finalGrade]) {
            defectCounts[type][position][finalGrade] = 0;
        }

        defectCounts[type][position][finalGrade]++;
    });

    console.log("defectCounts diupdate:", JSON.stringify(defectCounts));
    saveToLocalStorage();
}

// ===========================================
// 9. Menampilkan Summary Defect
// ===========================================
function updateDefectSummaryDisplay() {
    if (!summaryContainer) return;

    summaryContainer.innerHTML = '';
    const gradeOrder = ["r-grade", "b-grade", "c-grade"];
    const positionOrder = ["LEFT", "PAIRS", "RIGHT"];

    const summaryItems = [];

    for (const defectType in defectCounts) {
        for (const position of positionOrder) {
            if (defectCounts[defectType][position]) {
                for (const displayGrade of gradeOrder) {
                    if (defectCounts[defectType][position][displayGrade] && defectCounts[defectType][position][displayGrade] > 0) {
                        const count = defectCounts[defectType][position][displayGrade];
                        let gradeLabel = '';

                        if (displayGrade === 'r-grade') {
                            gradeLabel = 'REWORK';
                        } else if (displayGrade === 'b-grade') {
                            gradeLabel = 'B-GRADE';
                        } else if (displayGrade === 'c-grade') {
                            gradeLabel = 'C-GRADE';
                        }

                        const item = document.createElement('div');
                        item.className = 'summary-item';
                        item.innerHTML = `
                            <div class="defect-col">${defectType}</div>
                            <div class="position-col">${position}</div>
                            <div class="level-col">${gradeLabel} <span class="count">${count}</span></div>
                        `;
                        summaryItems.push({
                            defectType: defectType,
                            grade: displayGrade,
                            position: position,
                            element: item
                        });
                    }
                }
            }
        }
    }

    summaryItems.sort((a, b) => {
        if (a.defectType < b.defectType) return -1;
        if (a.defectType > b.defectType) return 1;
        const gradeOrderIndexA = gradeOrder.indexOf(a.grade);
        const gradeOrderIndexB = gradeOrder.indexOf(b.grade);
        if (gradeOrderIndexA < gradeOrderIndexB) return -1;
        if (gradeOrderIndexA > gradeOrderIndexB) return 1;
        const positionOrderIndexA = positionOrder.indexOf(a.position);
        const positionOrderIndexB = positionOrder.indexOf(b.position);
        if (positionOrderIndexA < positionOrderIndexB) return -1;
        if (positionOrderIndexA > positionOrderIndexB) return 1;
        return 0;
    });

    summaryItems.forEach(itemData => {
        summaryContainer.appendChild(itemData.element);
    });
}

// ===========================================
// 10. Event Handlers untuk Tombol (LOGIKA INTI BARU)
// ===========================================

// --- FUNGSI PEMBANTU BARU UNTUK MENGONTROL QTY SECTION ---
function updateQtySectionState() {
    const enable = selectedDefects.length === 0 && currentInspectionPairs.length > 0;
    
    gradeInputButtons.forEach(btn => {
        if (!btn.classList.contains('a-grade')) {
            btn.disabled = !enable;
            btn.classList.toggle('inactive', !enable);
        }
    });
}

// Handler untuk klik tombol Defect Menu Item
function handleDefectClick(button) {
    const defectName = button.dataset.defect || button.textContent.trim();
    const index = selectedDefects.indexOf(defectName);

    if (index > -1) {
        selectedDefects.splice(index, 1);
        button.classList.remove('active');
    } else {
        selectedDefects.push(defectName);
        button.classList.add('active');
    }

    const enableRework = selectedDefects.length > 0;
    toggleButtonGroup(reworkButtons, enableRework);

    if(enableRework) {
        updateReworkButtonStates();
    }

    updateQtySectionState();
    updateAGradeButtonState();
    saveToLocalStorage();
}

// Handler untuk klik tombol Rework Section
function handleReworkClick(button) {
    if (button.disabled) {
        console.log("Tombol rework ini tidak dapat digunakan saat ini.");
        return;
    }

    const reworkPosition = button.id.replace('rework-', '').toUpperCase();
    
    if (selectedDefects.length === 0) return;
    
    usedReworkPositionsThisCycle.push(reworkPosition);

    updateQuantity(button.id.replace('rework-', '') + '-counter');

    selectedDefects.forEach(defectName => {
        currentInspectionPairs.push({ type: defectName, position: reworkPosition });
    });

    selectedDefects = [];
    defectButtons.forEach(btn => btn.classList.remove('active'));

    updateReworkButtonStates();
    toggleButtonGroup(reworkButtons, false);    
    
    updateQtySectionState();
    updateAGradeButtonState();
    saveToLocalStorage();
}

// Handler untuk klik tombol Qty Section (A, R, B, C Grade)
function handleGradeClick(button) {
    const gradeCategory = Array.from(button.classList).find(cls => cls.endsWith('-grade'));
    if (!gradeCategory) return;

    if (gradeCategory === 'b-grade' || gradeCategory === 'c-grade') {
        showConfirmationPopup(gradeCategory, () => {
            processGradeClick(button, gradeCategory);
        });
        return;
    }

    processGradeClick(button, gradeCategory);
}

// --- FUNGSI BARU: Fungsi pembantu untuk memproses klik grade setelah konfirmasi ---
function processGradeClick(button, gradeCategory) {
    if (gradeCategory === 'r-grade' && currentInspectionPairs.length > 0) {
        const reworkPositionsForItem = [...new Set(currentInspectionPairs.map(pair => pair.position))];
        
        if (reworkPositionsForItem.length > 0) {
            reworkLog.push(reworkPositionsForItem);
            console.log("Rework Log diupdate:", reworkLog);
        }
    }

    qtyInspectOutputs[gradeCategory]++;
    
    updateAllDisplays();  
    
    if (gradeCategory !== 'a-grade') {
        addAllDefectsToSummary(gradeCategory);
    }
    
    updateDefectSummaryDisplay(); 
    saveToLocalStorage();
    
    setTimeout(() => {
        initButtonStates();
    }, 150);
}

// --- FUNGSI BARU: Menampilkan Pop-up Konfirmasi ---
function showConfirmationPopup(grade, onConfirmCallback) {
    const confirmationText = `Apakah Anda menemukan defect ${grade.toUpperCase()}?`;

    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'confirmation-overlay';

    const popupContent = document.createElement('div');
    popupContent.className = 'confirmation-content';

    const message = document.createElement('p');
    message.textContent = confirmationText;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'confirmation-buttons';

    const backButton = document.createElement('button');
    backButton.textContent = 'Kembali';
    backButton.className = 'button-back';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'YA';
    confirmButton.className = 'button-confirm';

    buttonContainer.appendChild(backButton);
    buttonContainer.appendChild(confirmButton);

    popupContent.appendChild(message);
    popupContent.appendChild(buttonContainer);
    popupOverlay.appendChild(popupContent);

    document.body.appendChild(popupOverlay);

    backButton.addEventListener('click', () => {
        document.body.removeChild(popupOverlay);
        console.log("Aksi dibatalkan oleh pengguna.");
    });

    confirmButton.addEventListener('click', () => {
        document.body.removeChild(popupOverlay);
        onConfirmCallback();
    });
}

// ===========================================
// 11. Validasi Input dan Simpan Data (MODIFIKASI FINAL v3 - dengan Lazy Loading)
// ===========================================
async function saveData() {
    console.log("Memulai proses simpan data...");

    const loadingOverlay = document.getElementById('loading-overlay');

    if (!validateInputs() || !validateQtySampleSet()) {
        console.log("Validasi dasar gagal. Penyimpanan dibatalkan.");
        return;
    }

    const processedReworks = getProcessedReworkCounts();
    const { finalReworkPairs, finalReworkKiri, finalReworkKanan, calculatedTotal } = processedReworks;

    const totalDefectCount = Object.values(defectCounts).reduce((sum, positions) =>
        sum + Object.values(positions).reduce((posSum, grades) =>
            posSum + Object.values(grades).reduce((gradeSum, count) => gradeSum + count, 0),
        0),
    0);

    if (totalDefectCount < calculatedTotal) {
        alert("Peringatan: Total defect yang tercatat (" + totalDefectCount + ") lebih rendah dari total unit rework terhitung (" + calculatedTotal.toFixed(2) + "). Harap pastikan semua data sudah benar.");
        console.log("Validasi gagal: Total defect < total rework terhitung.");
    }
    
    const fttValueText = fttOutput ? fttOutput.innerText.replace("%", "").trim() : "0";
    const finalFtt = parseFloat(fttValueText) / 100;

    const redoRateValueText = redoRateOutput ? redoRateOutput.innerText.replace("%", "").trim() : "0";
    const finalRedoRate = parseFloat(redoRateValueText) / 100;

    const defectsToSend = [];
    for (const defectType in defectCounts) {
        for (const position in defectCounts[defectType]) {
            for (const grade in defectCounts[defectType][position]) {
                const count = defectCounts[defectType][position][grade];
                if (count > 0) {
                    defectsToSend.push({
                        type: defectType,
                        position: position,
                        level: grade,
                        count: count
                    });
                }
            }
        }
    }

    const dataToSend = {
        timestamp: new Date().toISOString(),
        auditor: document.getElementById("auditor").value,
        ncvs: document.getElementById("ncvs").value,
        modelName: document.getElementById("model-name").value,
        styleNumber: document.getElementById("style-number").value,
        qtyInspect: totalInspected,
        ftt: finalFtt,
        redoRate: finalRedoRate,
        "a-grade": qtyInspectOutputs['a-grade'],
        "b-grade": qtyInspectOutputs['b-grade'],
        "c-grade": qtyInspectOutputs['c-grade'],
        reworkKiri: finalReworkKiri,
        reworkKanan: finalReworkKanan,
        reworkPairs: finalReworkPairs,
        defects: defectsToSend,
    };

    console.log("Data yang akan dikirim (setelah diproses):", JSON.stringify(dataToSend, null, 2));

    const saveButton = document.querySelector(".save-button");
    saveButton.disabled = true;
    saveButton.textContent = "MENYIMPAN...";

    if (loadingOverlay) {
        loadingOverlay.classList.add('visible');
    }

    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbyci5w5xeGAPaSLFEXRt3l0wnURZVfGcNhX4niQd8DrJNX5b5hUasOaVAvNEsNUQdDCow/exec", {
            method: "POST",
            body: JSON.stringify(dataToSend),
        });
        const resultText = await response.text();
        console.log("Respons server:", resultText);
        alert(resultText);

        if (response.ok && resultText.toLowerCase().includes("berhasil")) {
            markNcvsAsUsed(auditorSelect.value, ncvsSelect.value);
            updateNcvsOptions(auditorSelect.value);
            resetAllFields();
        } 
    } catch (error) {
        console.error("Error saat mengirim data:", error);
        alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('visible');
        }

        saveButton.disabled = false;
        saveButton.textContent = "SIMPAN";
    }
}

// ===========================================
// 12. Validasi Input Form (dari dokumen kedua)
// ===========================================
function validateInputs() {
    const auditor = auditorSelect.value.trim();
    const ncvs = ncvsSelect.value.trim();
    const modelName = document.getElementById("model-name").value.trim();
    const styleNumberInput = document.getElementById("style-number");
    const styleNumber = styleNumberInput.value.trim();

    if (!auditor || auditor === "") {
        alert("Harap isi semua form dasar (Auditor, NCVS, Model, Style Number) sebelum menyimpan data!");
        return false;
    }
    if (!ncvs || ncvs === "") {
        alert("Harap isi semua form dasar (Auditor, NCVS, Model, Style Number) sebelum menyimpan data!");
        return false;
    }

    if (!modelName || !styleNumber) {
        alert("Harap isi semua form dasar (Auditor, NCVS, Model, Style Number) sebelum menyimpan data!");
        return false;
    }

    const styleNumberPattern = /^[a-zA-Z0-9]{6}-[a-zA-Z0-9]{3}$/;
    if (!styleNumberPattern.test(styleNumber)) {
        alert("Format Style Number tidak sesuai. Contoh: AH1567-100 atau 767688-001");
        styleNumberInput.classList.add('invalid-input');
        return false;
    } else {
        styleNumberInput.classList.remove('invalid-input');
    }
    return true;
}

// ===========================================
// 13. Validasi Defect sebelum Simpan
// ===========================================
function validateDefects() {
    let hasDefectRecorded = false;
    for (const defectType in defectCounts) {
        for (const position in defectCounts[defectType]) {
            for (const grade in defectCounts[defectType][position]) {
                if (defectCounts[defectType][position][grade] > 0) {
                    hasDefectRecorded = true;
                    break;
                }
            }
            if (hasDefectRecorded) break;
        }
        if (hasDefectRecorded) break;
    }

    const hasRBCGradeInput = qtyInspectOutputs['r-grade'] > 0 || qtyInspectOutputs['b-grade'] > 0 || qtyInspectOutputs['c-grade'] > 0;

    if (hasRBCGradeInput && !hasDefectRecorded) {
        alert("Jika ada item Rework, B-Grade, atau C-Grade, harap pastikan setidaknya ada satu defect yang tercatat sebelum menyimpan data!");
        return false;
    }
    return true;
}

// ===========================================
// 14. Validasi Qty Sample Set
// ===========================================
function validateQtySampleSet() {
    if (!qtySampleSetInput) {
        console.error("Elemen qty-sample-set tidak ditemukan!");
        return false;
    }

    const qtySampleSetValue = parseInt(qtySampleSetInput.value, 10);

    if (isNaN(qtySampleSetValue) || qtySampleSetValue <= 0) {
        alert("Harap masukkan Jumlah Qty Sample Set yang valid dan lebih dari 0.");
        return false;
    }

    const currentTotalInspect = totalInspected;

    if (currentTotalInspect !== qtySampleSetValue) {
        alert(`Jumlah total Qty Inspect (${currentTotalInspect}) harus sama dengan Qty Sample Set (${qtySampleSetValue}).`);
        return false;
    }

    return true;
}

// ===========================================
// 15. Reset Semua Field Setelah Simpan (Modifikasi)
// ===========================================
function resetAllFields() {
    console.log("Memulai proses reset semua field dan data internal...");
    
    if (auditorSelect) auditorSelect.value = "";
    updateNcvsOptions("");
    document.getElementById("model-name").value = "";
    const styleNumberInput = document.getElementById("style-number");
    if (styleNumberInput) {
        styleNumberInput.value = "";
        styleNumberInput.classList.remove('invalid-input');
    }
    
    if (modelNameInput) {
        modelNameInput.value = "";
        modelNameInput.disabled = false;
    }

    for (const categoryKey in qtyInspectOutputs) {
        qtyInspectOutputs[categoryKey] = 0;
    }
    defectCounts = {};
    totalInspected = 0;
    totalReworkLeft = 0;
    totalReworkRight = 0;
    totalReworkPairs = 0;
    
    selectedDefects = [];
    currentInspectionPairs = [];
    reworkLog = [];
    
    currentInspectionLimit = qtySampleSetInput ? parseInt(qtySampleSetInput.value, 10) || 0 : 0;

    updateAllDisplays();
    
    if (summaryContainer) {
        summaryContainer.innerHTML = "";
    }

    initButtonStates(); 
    clearLocalStorageExceptQtySampleSet();
    
    console.log("Semua field dan data internal telah berhasil direset.");
}

// ===========================================
// FUNGSI BARU: Auto-fill Model Name berdasarkan Style Number
// ===========================================
function autoFillModelName() {
    if (!styleNumberInput || !modelNameInput) {
        console.error("Elemen Style Number atau Model Name tidak ditemukan.");
        return;
    }

    const enteredStyleNumber = styleNumberInput.value.trim().toUpperCase();
    
    const matchedModel = styleModelDatabase[enteredStyleNumber];

    if (matchedModel) {
        modelNameInput.value = matchedModel;
        modelNameInput.disabled = true;
    } else {
        modelNameInput.value = "";
        modelNameInput.disabled = false;
    }
}

// ===========================================
// 16. Inisialisasi Aplikasi dan Event Listeners (Dilengkapi dengan loadFromLocalStorage)
// ===========================================
function initApp() {
    console.log("Menginisialisasi aplikasi dengan alur yang diperbarui...");

    outputElements = {
        'a-grade': document.getElementById('a-grade-counter'),
        'r-grade': document.getElementById('r-grade-counter'),
        'b-grade': document.getElementById('b-grade-counter'),
        'c-grade': document.getElementById('c-grade-counter')
    };
    fttOutput = document.getElementById('fttOutput');
    qtyInspectOutput = document.getElementById('qtyInspectOutput');
    leftCounter = document.getElementById('left-counter');
    rightCounter = document.getElementById('right-counter');
    pairsCounter = document.getElementById('pairs-counter');
    summaryContainer = document.getElementById('summary-list');
    redoRateOutput = document.getElementById('redoRateOutput');
    qtySampleSetInput = document.getElementById('qty-sample-set');

    defectButtons = document.querySelectorAll('.defect-button');
    reworkButtons = document.querySelectorAll('.rework-button');
    gradeInputButtons = document.querySelectorAll('.input-button');

    auditorSelect = document.getElementById('auditor');
    ncvsSelect = document.getElementById('ncvs');

    if (auditorSelect) {
        auditorSelect.addEventListener('change', (event) => {
            const selectedAuditor = event.target.value;
            updateNcvsOptions(selectedAuditor);
            saveToLocalStorage();
        });
    }
// Event listener untuk dropdown NCVS (existing code)
if (ncvsSelect) {
    ncvsSelect.addEventListener('change', () => {
        saveToLocalStorage();
    });
    
    // --- TAMBAHKAN CODE BARU INI ---
    // Event listener untuk menampilkan notifikasi saat NCVS yang sudah diinput dipilih
    ncvsSelect.addEventListener('change', () => {
        const selectedNcvs = ncvsSelect.value;
        const selectedAuditor = auditorSelect ? auditorSelect.value : '';
        
        if (selectedNcvs && selectedAuditor) {
            // Dapatkan data NCVS yang sudah digunakan untuk auditor ini pada hari ini
            const usedNcvsForToday = getUsedNcvsData();
            const usedNcvsBySelectedAuditor = usedNcvsForToday[selectedAuditor] || [];
            
            // Cek apakah NCVS yang dipilih sudah digunakan oleh auditor ini
            if (usedNcvsBySelectedAuditor.includes(selectedNcvs)) {
                alert(`Perhatian: NCVS ${selectedNcvs} telah diinput oleh ${selectedAuditor} pada hari ini.`);
            }
        }
    });
    // --- AKHIR CODE BARU ---
}

    modelNameInput = document.getElementById("model-name");
    styleNumberInput = document.getElementById("style-number");

    if (modelNameInput) {
        modelNameInput.addEventListener('input', saveToLocalStorage);
    }
    
    if (styleNumberInput) {
        styleNumberInput.addEventListener('input', () => {
            saveToLocalStorage();
            autoFillModelName();
        });
    }

    defectButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleDefectClick(button);
            button.classList.add('active-feedback');
            setTimeout(() => button.classList.remove('active-feedback'), 200);
        });
    });

    reworkButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleReworkClick(button);
            button.classList.add('active-feedback');
            setTimeout(() => button.classList.remove('active-feedback'), 200);
        });
    });

    gradeInputButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleGradeClick(button);
            button.classList.add('active-feedback');
            setTimeout(() => button.classList.remove('active-feedback'), 200);
        });
    });

    const saveButton = document.querySelector(".save-button");
    if (saveButton) {
        saveButton.addEventListener("click", saveData);
    }

    if (qtySampleSetInput) {
        let storedQty = localStorage.getItem('qtySampleSet');
        let qtySampleSetValue;

        if (storedQty && !isNaN(parseInt(storedQty, 10)) && parseInt(storedQty, 10) >= 0) {
            qtySampleSetValue = parseInt(storedQty, 10);
        } else {
            qtySampleSetValue = 0;
        }

        qtySampleSetInput.value = qtySampleSetValue;
        currentInspectionLimit = qtySampleSetValue;

        qtySampleSetInput.addEventListener('change', () => {
            let newQty = parseInt(qtySampleSetInput.value, 10);
            
            if (isNaN(newQty) || newQty < 0) {
                alert("Qty Sample Set tidak boleh kurang dari 0.");
                qtySampleSetInput.value = currentInspectionLimit;
                return;
            }
            
            if (newQty < totalInspected) {
                alert(`Qty Sample Set tidak bisa lebih rendah dari Qty Inspect saat ini (${totalInspected}).`);
                qtySampleSetInput.value = currentInspectionLimit;
                return;
            }
            
            currentInspectionLimit = newQty;
            localStorage.setItem('qtySampleSet', newQty);
            
            updateButtonStatesBasedOnLimit();
            saveToLocalStorage();
            
            console.log(`Qty Sample Set diubah menjadi: ${currentInspectionLimit}`);
        });
    }

    const statisticButton = document.querySelector('.statistic-button');

    if (statisticButton) {
        statisticButton.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    loadFromLocalStorage();

    if (!activeDefectType && !activeReworkPosition && !currentSelectedGrade) {
        initButtonStates();
    }
    
    updateTotalQtyInspect();

    updateNcvsOptions(auditorSelect ? auditorSelect.value : '');

    console.log("Aplikasi berhasil diinisialisasi sepenuhnya dengan localStorage.");
}

document.addEventListener('DOMContentLoaded', initApp);

// ===========================================
// 17. Fungsi NCVS Conditional & Coloring
// ===========================================

function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getUsedNcvsData() {
    const storedData = localStorage.getItem(USED_NCVS_STORAGE_KEY);
    let usedNcvsPerDay = {};

    if (storedData) {
        try {
            usedNcvsPerDay = JSON.parse(storedData);
        } catch (e) {
            console.error("Error parsing used NCVS data from localStorage:", e);
            usedNcvsPerDay = {};
        }
    }

    const todayDate = getTodayDateString();

    // Reset data jika tanggal di localStorage bukan hari ini
    if (!usedNcvsPerDay[todayDate]) {
        usedNcvsPerDay = {
            [todayDate]: {}
        };
        localStorage.setItem(USED_NCVS_STORAGE_KEY, JSON.stringify(usedNcvsPerDay));
    }

    return usedNcvsPerDay[todayDate];
}

function markNcvsAsUsed(auditor, ncvs) {
    if (!auditor || !ncvs) return;

    const todayDate = getTodayDateString();
    let usedNcvsForToday = getUsedNcvsData();

    if (!usedNcvsForToday[auditor]) {
        usedNcvsForToday[auditor] = [];
    }

    // Pastikan NCVS belum ada di daftar sebelum menambahkannya
    if (!usedNcvsForToday[auditor].includes(ncvs)) {
        usedNcvsForToday[auditor].push(ncvs);
    }

    // Simpan kembali data yang diperbarui ke localStorage
    const allUsedNcvsData = JSON.parse(localStorage.getItem(USED_NCVS_STORAGE_KEY) || '{}');
    allUsedNcvsData[todayDate] = usedNcvsForToday;
    localStorage.setItem(USED_NCVS_STORAGE_KEY, JSON.stringify(allUsedNcvsData));
}

function updateNcvsOptions(selectedAuditor) {
    ncvsSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Pilih NCVS";
    ncvsSelect.appendChild(defaultOption);

    // --- MODIFIKASI DIMULAI ---
    // Dapatkan data NCVS yang sudah digunakan untuk auditor yang dipilih pada hari ini
    const usedNcvsForToday = getUsedNcvsData();
    const usedNcvsBySelectedAuditor = usedNcvsForToday[selectedAuditor] || [];
    // --- MODIFIKASI SELESAI ---

    if (selectedAuditor && auditorNcvsMap[selectedAuditor]) {
        const ncvsList = auditorNcvsMap[selectedAuditor];
        ncvsList.forEach(ncvs => {
            const option = document.createElement('option');
            option.value = ncvs;
            
            // --- MODIFIKASI DIMULAI ---
            // Cek apakah NCVS ini sudah digunakan oleh auditor yang dipilih
            const isUsedByThisAuditor = usedNcvsBySelectedAuditor.includes(ncvs);
            
            if (isUsedByThisAuditor) {
                // Tambahkan keterangan dalam kurung
                option.textContent = `${ncvs} (NCVS telah diinput)`;
                // Tetap tambahkan class untuk styling warna merah (untuk device yang support)
                option.classList.add('used-ncvs');
            } else {
                option.textContent = ncvs;
            }
            // --- MODIFIKASI SELESAI ---

            ncvsSelect.appendChild(option);
        });
        ncvsSelect.disabled = false;
    } else {
        ncvsSelect.disabled = true;
        defaultOption.textContent = "Pilih NCVS (pilih Auditor dahulu)";
    }
    ncvsSelect.value = "";
}

// ===========================================
// 18. Announcement Logic
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    const announcements = [
        { 
            date: "06-03-2025", 
            text: `E-QMS kini hadir dalam versi web sebagai upgrade dari sistem berbasis Google Spreadsheet, menawarkan kemudahan input bagi auditor, akurasi data yang lebih baik, serta mengurangi risiko human error maupun kendala teknis pada sistem lama. Implementasi E-QMS Web App merupakan bagian dari komitmen kami dalam digitalisasi proses mutu, sejalan dengan visi untuk menciptakan operasional yang agile, data-driven, dan berkelanjutan.

Apabila terdapat kendala teknis, silakan hubungi nomor berikut: 088972745194.`
        },
        {  
            date: "06-30-2025",
            text: `🛠️ FTT Sampling App Update v.2025.06

🎨 Tampilan & UI
1. Memperbaiki warna menu grade-defect yang secara fungsi aktif namun secara visual terlihat tidak aktif
2. Memperbarui ukuran frame antar section
3. Menambahkan highlight pada defect yang dipilih
4. Menambahkan tombol menu untuk dashboard data statistik
5. Mengimplementasikan overlay loading

🧩 Logika Inspeksi & Validasi
1. Membuat pola inspeksi untuk multi-defect dan multi-position
2. Mengembangkan logika pencegah double-click pada fitur defect position
3. Membuat logika agar setiap inspeksi hanya boleh berisi satu pairs defect position
4. Mengaktifkan pilihan grade-defect hanya jika defect position diklik
5. Menonaktifkan opsi A-grade ketika defect ditemukan
6. Membuat logika agar saat memilih B/C-grade, posisi defect tidak disimpan ke bagian rework
7. Membuat logika agar jumlah B/C-grade tidak memengaruhi perhitungan rework rate
8. Menambahkan validasi bahwa jumlah inspeksi tidak boleh melebihi 50/24

🔢 Counter, Grade, dan Nilai
1. Menambahkan nilai hitung ke masing-masing counter grade
2. Mengubah nilai counter defect-left dan defect-right menjadi 0.5
3. Menyesuaikan formula perhitungan FTT dan rework rate dengan pola nilai defect position yang baru

📦 Data Handling & Penyimpanan
1. Memastikan seluruh data input tersimpan dengan benar di localStorage
2. Mengimplementasikan validasi localStorage agar data tetap tersimpan meski browser ditutup atau di-refresh
3. Mengoptimasi keamanan dan volume data input API
4. Mengoptimasi batas permintaan (request limits) pada Vercel
5. Menerapkan rate limiting pada Vercel Functions
6. Menyimpan nilai yang tepat untuk Rework Left, Right, dan Pairs ke dalam database`
        },
        {  
            date: "07-31-2025", 
            text: `🛠️ FTT Sampling App Update v.2025.07 – Dashboard Enhancement & Maintenance

📊 Statistical Dashboard Upgrade
1. Menambahkan filter: Start/End Date, Auditor, NCVS, Model, Style Number
2. Mengimplementasikan bar, pie, dan line chart untuk FTT, defect, dan grade
3. Menampilkan Avg. FTT, Rework Rate, dan A-Grade Ratio (%, 2 desimal)
4. Menyesuaikan label, axis, dan format tanggal pada chart
5. Membatasi jumlah data point dan menambahkan opsi rentang waktu dinamis

📄 Full Inspection Data
1. Menambahkan fitur sort, filter, dan quick filter
2. Merapikan struktur, alignment, dan default view tabel

⚙️ Functional & UI Maintenance
1. Memformat seluruh metrik ke persen, presisi 2 desimal
2. Menyempurnakan spacing antar section dan konsistensi judul
3. Menambahkan input validation saat user mengakses menu B-Grade atau C-Grade
4. Menambahkan fitur auto-fill pada field model name berdasarkan input style number

🧱 Code Structure & Integration
1. Modularisasi HTML, CSS, JS untuk maintainability
2. Menghubungkan dashboard ke halaman utama aplikasi
3. Menambahkan tombol "Back to Main Page"
4. Optimasi load data dan refactor script untuk performa lebih baik`
        },
    ];
    let currentAnnouncementIndex = 0;
    let viewedAnnouncements = JSON.parse(localStorage.getItem('viewedAnnouncements')) || [];
    const announcementPopup = document.getElementById('announcement-popup');
    const announcementDateElement = document.getElementById('date-text');
    const announcementTextElement = document.getElementById('announcement-text');
    const announcementButton = document.getElementById('announcement-button');
    const closeButton = document.querySelector('#announcement-popup .close-button');
    const prevButton = document.getElementById('prev-announcement');
    const nextButton = document.getElementById('next-announcement');

    function showAnnouncement(index) {
        if (!announcementPopup || !announcementDateElement || !announcementTextElement || announcements.length === 0) return;

        currentAnnouncementIndex = index;
        announcementDateElement.textContent = announcements[index].date;
        announcementTextElement.innerHTML = announcements[index].text.replace(/\n/g, '<br>'); 
        announcementPopup.style.display = 'block';

        const announcementIdentifier = `${announcements[index].date}-${announcements[index].text.substring(0, 20)}`;
        if (!viewedAnnouncements.includes(announcementIdentifier)) {
            viewedAnnouncements.push(announcementIdentifier);
            localStorage.setItem('viewedAnnouncements', JSON.stringify(viewedAnnouncements));
        }
    }

    function closeAnnouncement() {
        if (announcementPopup) announcementPopup.style.display = 'none';
    }

    function nextAnnouncement() {
        if (announcements.length === 0) return;
        const nextIndex = (currentAnnouncementIndex + 1) % announcements.length;
        showAnnouncement(nextIndex);
    }

    function prevAnnouncement() {
        if (announcements.length === 0) return;
        const prevIndex = (currentAnnouncementIndex - 1 + announcements.length) % announcements.length;
        showAnnouncement(prevIndex);
    }

    if (announcementButton) {
        announcementButton.addEventListener('click', () => {
            if (announcements.length > 0) showAnnouncement(currentAnnouncementIndex);
        });
    }
    if (closeButton) closeButton.addEventListener('click', closeAnnouncement);
    if (prevButton) prevButton.addEventListener('click', prevAnnouncement);
    if (nextButton) nextButton.addEventListener('click', nextAnnouncement);

    if (announcements.length > 0) {
        let firstUnreadIndex = -1;
        for (let i = 0; i < announcements.length; i++) {
            const announcementIdentifier = `${announcements[i].date}-${announcements[i].text.substring(0, 20)}`;
            if (!viewedAnnouncements.includes(announcementIdentifier)) {
                firstUnreadIndex = i;
                break;
            }
        }
        if (firstUnreadIndex !== -1) {
            showAnnouncement(firstUnreadIndex);
        } else {
            currentAnnouncementIndex = announcements.length - 1;
        }
    }
});


