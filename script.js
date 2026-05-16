import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBp3rJEijmUl3UjMwDcjhG3swDS6KP0AR0",
    authDomain: "lumora-ui.firebaseapp.com",
    projectId: "lumora-ui",
    storageBucket: "lumora-ui.firebasestorage.app",
    messagingSenderId: "1035959513471",
    appId: "1:1035959513471:web:92c9c57e368c710788ea4a",
    measurementId: "G-6X4DE8KSJS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const element = document.getElementById("element");
const distanceInput = document.getElementById("distance");
const blurInput = document.getElementById("blur");
const intensityInput = document.getElementById("intensity");
const cssOutput = document.getElementById("css-output");
const colorPicker = document.getElementById("color-picker");
const colorValue = document.getElementById("color-value");

const labelDistance = document.getElementById("label-distance");
const labelBlur = document.getElementById("label-blur");
const labelIntensity = document.getElementById("label-intensity");

const themeBtn = document.getElementById("theme-btn");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");
const saveHistoryBtn = document.getElementById("save-history-btn");
const historyList = document.getElementById("history-list");

let currentRadius = 40;
let savedStyles = [];

function updateRadius(val) {
    currentRadius = val;
    update();
}

window.updateRadius = updateRadius;

function update() {
    const selectedColor = colorPicker.value;
    const dist = distanceInput.value;
    const blur = blurInput.value;
    const intensity = intensityInput.value;

    document.documentElement.style.setProperty("--bg-color", selectedColor);

    colorValue.innerText = selectedColor;

    labelDistance.innerText = `${dist}px`;
    labelBlur.innerText = `${blur}px`;
    labelIntensity.innerText = intensity;

    const darkShadow = `rgba(80, 90, 110, ${intensity})`;
    const lightShadow = `rgba(255, 255, 255, 0.75)`;

    const shadowStr = `${dist}px ${dist}px ${blur}px ${darkShadow}, 
-${dist}px -${dist}px ${blur}px ${lightShadow}`;

    element.style.borderRadius = `${currentRadius}px`;
    element.style.boxShadow = shadowStr;
    element.style.background = selectedColor;

    cssOutput.textContent = `border-radius: ${currentRadius}px;
background: ${selectedColor};
box-shadow: ${shadowStr};`;
}

window.applyPreset = function(type) {
    const currentColor = colorPicker.value;

    if (type === "minimal") {
        distanceInput.value = 12;
        blurInput.value = 28;
        intensityInput.value = 0.12;
        currentRadius = 20;
    }

    if (type === "soft") {
        distanceInput.value = 20;
        blurInput.value = 40;
        intensityInput.value = 0.15;
        currentRadius = 40;
    }

    if (type === "intense") {
        distanceInput.value = 35;
        blurInput.value = 70;
        intensityInput.value = 0.35;
        currentRadius = 55;
    }

    colorPicker.value = currentColor;
    update();
};

function toggleTheme() {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeBtn.innerText = "☀️";
        colorPicker.value = "#1f2430";
    } else {
        themeBtn.innerText = "🌙";
        colorPicker.value = "#d6d6d6";
    }

    update();
}

function downloadCSS() {
    const fileContent = `.lumora-element {
${cssOutput.textContent}
}`;

    const blob = new Blob([fileContent], { type: "text/css" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "lumora-style.css";
    link.click();

    URL.revokeObjectURL(url);
}

async function saveToHistory() {
    const style = {
        color: colorPicker.value,
        distance: distanceInput.value,
        blur: blurInput.value,
        intensity: intensityInput.value,
        radius: currentRadius,
        createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, "styles"), style);

    await loadHistory();
}

async function loadHistory() {
    historyList.innerHTML = "";
    savedStyles = [];

    const querySnapshot = await getDocs(collection(db, "styles"));

    querySnapshot.forEach((doc) => {
        const style = doc.data();

        savedStyles.push({
            color: style.color,
            distance: style.distance,
            blur: style.blur,
            intensity: style.intensity,
            radius: style.radius
        });
    });

    if (savedStyles.length === 0) {
        historyList.innerHTML = '<p style="font-size: 0.85rem; opacity: 0.7;">Nenhum estilo salvo ainda.</p>';
        return;
    }

    savedStyles.forEach((style, index) => {
        const item = document.createElement("div");
        item.classList.add("history-item");

        item.innerHTML = `
            <span>
                ${style.color} | ${style.distance}px | ${style.blur}px | R:${style.radius}px
            </span>
            <button class="use-history-btn" data-index="${index}">Usar</button>
        `;

        historyList.appendChild(item);
    });

    document.querySelectorAll(".use-history-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const index = button.getAttribute("data-index");
            useHistoryStyle(index);
        });
    });
}

function useHistoryStyle(index) {
    const style = savedStyles[index];

    colorPicker.value = style.color;
    distanceInput.value = style.distance;
    blurInput.value = style.blur;
    intensityInput.value = style.intensity;
    currentRadius = style.radius;

    update();
}

[distanceInput, blurInput, intensityInput, colorPicker].forEach((input) => {
    input.addEventListener("input", update);
});

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(cssOutput.textContent);

    const originalText = copyBtn.innerText;
    copyBtn.innerText = "Copiado!";

    setTimeout(() => {
        copyBtn.innerText = originalText;
    }, 1500);
});

downloadBtn.addEventListener("click", downloadCSS);
saveHistoryBtn.addEventListener("click", saveToHistory);
themeBtn.addEventListener("click", toggleTheme);

update();
loadHistory();
