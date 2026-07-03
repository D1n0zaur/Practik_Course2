// ============================================================
// 1. ЗАГРУЗКА СПРАВОЧНИКА МАТЕРИАЛОВ С БЭКЕНДА
// ============================================================

const API_BASE = 'http://localhost:8000'; // замени на реальный адрес, если нужно
const materialsUrl = `${API_BASE}/api/v1/materials`;
const calculateUrl = `${API_BASE}/api/v1/walls/calculate`;

let materials = [];

async function loadMaterials() {
    try {
        const response = await fetch(materialsUrl);
        if (!response.ok) throw new Error('Ошибка загрузки материалов');
        materials = await response.json();
        updateAllSelects(); // обновляем выпадающие списки
    } catch (error) {
        console.warn('⚠️ Не удалось загрузить материалы с бэкенда, используем запасные:', error);
        // Запасной список (на случай, если бэкенд недоступен)
        materials = [
            { id: 147, name: 'Кирпич силикатный (ρ=1800)' },
            { id: 30,  name: 'Минвата каменная (ρ=80)' },
            { id: 145, name: 'Кирпич керамический (ρ=1400)' },
            { id: 159, name: 'Арматура стальная' },
        ];
        updateAllSelects();
    }
}

function getMaterials() {
    return materials;
}

// Обновляет все выпадающие списки (select) в таблице слоёв
function updateAllSelects() {
    const selects = document.querySelectorAll('#layersBody select[name="material"]');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Выберите материал...';
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        materials.forEach(mat => {
            const option = document.createElement('option');
            option.value = mat.id;
            option.textContent = mat.name;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    });
}

// ============================================================
// 2. УПРАВЛЕНИЕ СЛОЯМИ
// ============================================================

const layersBody = document.getElementById('layersBody');
const addLayerBtn = document.getElementById('addLayerBtn');

function createLayerRow(index) {
    const tdNumber = document.createElement('td');
    tdNumber.textContent = index;

    const select = document.createElement('select');
    select.className = 'form-select form-select-sm';
    select.name = 'material';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Выберите материал...';
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    materials.forEach(mat => {
        const option = document.createElement('option');
        option.value = mat.id;
        option.textContent = mat.name;
        select.appendChild(option);
    });

    const tdMaterial = document.createElement('td');
    tdMaterial.appendChild(select);

    const thicknessInput = document.createElement('input');
    thicknessInput.type = 'number';
    thicknessInput.className = 'form-control form-control-sm';
    thicknessInput.placeholder = '0.000';
    thicknessInput.step = '0.001';
    thicknessInput.min = '0';
    thicknessInput.value = '';

    const tdThickness = document.createElement('td');
    tdThickness.appendChild(thicknessInput);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = '✕';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', function() {
        const row = this.closest('tr');
        row.remove();
        renumberRows();
        if (layersBody.querySelectorAll('tr').length === 0) {
            showPlaceholder();
        }
    });

    const tdAction = document.createElement('td');
    tdAction.appendChild(deleteBtn);

    const tr = document.createElement('tr');
    tr.appendChild(tdNumber);
    tr.appendChild(tdMaterial);
    tr.appendChild(tdThickness);
    tr.appendChild(tdAction);

    return tr;
}

function renumberRows() {
    const rows = layersBody.querySelectorAll('tr');
    rows.forEach((row, idx) => {
        const td = row.cells[0];
        if (td) td.textContent = idx + 1;
    });
}

function showPlaceholder() {
    const placeholderRow = document.createElement('tr');
    placeholderRow.innerHTML = `
        <td colspan="4" class="text-center text-muted py-3">
            Нажмите «Добавить слой», чтобы начать
        </td>
    `;
    layersBody.appendChild(placeholderRow);
}

addLayerBtn.addEventListener('click', function() {
    const placeholderRow = layersBody.querySelector('tr td[colspan]');
    if (placeholderRow) placeholderRow.parentElement.remove();
    const currentRows = layersBody.querySelectorAll('tr').length;
    const newIndex = currentRows + 1;
    const newRow = createLayerRow(newIndex);
    layersBody.appendChild(newRow);
});

// ============================================================
// 3. СБОР ДАННЫХ
// ============================================================

const gsopInput = document.getElementById('gsopInput');
const areaInput = document.getElementById('areaInput');
const armatureInput = document.getElementById('armatureInput');
const calculateBtn = document.getElementById('calculateBtn');

function collectFormData() {
    const gsop = parseFloat(gsopInput.value);
    const area = parseFloat(areaInput.value);
    const armatureMass = parseFloat(armatureInput.value);

    if (isNaN(gsop) || gsop <= 0) {
        alert('Введите корректное ГСОП (положительное число).');
        return null;
    }
    if (isNaN(area) || area <= 0) {
        alert('Введите корректную площадь стен (положительное число).');
        return null;
    }
    if (isNaN(armatureMass) || armatureMass < 0) {
        alert('Введите массу арматуры (неотрицательное число).');
        return null;
    }

    const rows = layersBody.querySelectorAll('tr');
    const realRows = Array.from(rows).filter(row => !row.querySelector('td[colspan]'));

    if (realRows.length === 0) {
        alert('Добавьте хотя бы один слой стены.');
        return null;
    }

    const layers = [];
    for (const row of realRows) {
        const select = row.querySelector('select[name="material"]');
        const thicknessInput = row.querySelector('input[type="number"]');
        if (!select || !thicknessInput) continue;

        const materialId = parseInt(select.value);
        const thickness = parseFloat(thicknessInput.value);

        if (!materialId) {
            alert('Выберите материал для всех слоёв.');
            return null;
        }
        if (isNaN(thickness) || thickness <= 0) {
            alert('Введите корректную толщину (положительное число) для всех слоёв.');
            return null;
        }
        layers.push({ material_id: materialId, thickness });
    }

    return {
        layers,
        armature_mass: armatureMass,
        gsop,
        area
    };
}

// ============================================================
// 4. ОТПРАВКА ЗАПРОСА И ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ
// ============================================================

const resultsSection = document.getElementById('resultsSection');
const resultBody = document.getElementById('resultBody');
const footerMass = document.getElementById('footerMass');
const footerCo2 = document.getElementById('footerCo2');
const footerEnergy = document.getElementById('footerEnergy');
const resultR0 = document.getElementById('resultR0');
const resultQPerM2 = document.getElementById('resultQPerM2');
const resultQTotal = document.getElementById('resultQTotal');
const resultVPerM2 = document.getElementById('resultVPerM2');
const resultVTotal = document.getElementById('resultVTotal');
const calcVersion = document.getElementById('calcVersion');

async function sendCalculation(data) {
    calculateBtn.disabled = true;
    calculateBtn.textContent = '⏳ Загрузка...';

    try {
        const response = await fetch(calculateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка сервера (${response.status}): ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.warn('⚠️ Бэкенд не отвечает, используем мок-данные.', error);
        return getMockResponse(data);
    } finally {
        calculateBtn.disabled = false;
        calculateBtn.textContent = '🚀 Рассчитать';
    }
}

function getMockResponse(data) {
    const perLayer = data.layers.map((layer, idx) => ({
        material_name: materials.find(m => m.id === layer.material_id)?.name || `Материал ${layer.material_id}`,
        thickness_m: layer.thickness,
        mass_kg_per_m2: +(layer.thickness * 1800).toFixed(2),
        co2_kgCO2_per_m2: +(layer.thickness * 1800 * 0.15).toFixed(2),
        energy_MJ_per_m2: +(layer.thickness * 1800 * 1.4).toFixed(2),
    }));
    // Арматура как отдельный слой
    perLayer.push({
        material_name: 'Арматура стальная',
        thickness_m: null,
        mass_kg_per_m2: data.armature_mass,
        co2_kgCO2_per_m2: +(data.armature_mass * 2.4).toFixed(2),
        energy_MJ_per_m2: +(data.armature_mass * 24.2).toFixed(2),
    });

    const totalMass = perLayer.reduce((sum, item) => sum + item.mass_kg_per_m2, 0);
    const totalCo2 = perLayer.reduce((sum, item) => sum + item.co2_kgCO2_per_m2, 0);
    const totalEnergy = perLayer.reduce((sum, item) => sum + item.energy_MJ_per_m2, 0);

    const r0 = 2.876;
    const qPerM2 = (0.024 * data.gsop) / r0;
    return {
        per_layer: perLayer,
        totals: { mass_total: totalMass, co2_total: totalCo2, energy_total: totalEnergy },
        thermal: { r0, q_per_m2: qPerM2, q_total: qPerM2 * data.area },
        gas: { v_per_m2: qPerM2 / (9.3 * 0.9), v_total: (qPerM2 / (9.3 * 0.9)) * data.area },
        calculation_version: '1.0 (mock)'
    };
}

function displayResults(result) {
    resultsSection.style.display = 'block';

    resultBody.innerHTML = '';
    result.per_layer.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.material_name}</td>
            <td>${item.mass_kg_per_m2.toFixed(2)}</td>
            <td>${item.co2_kgCO2_per_m2.toFixed(2)}</td>
            <td>${item.energy_MJ_per_m2.toFixed(2)}</td>
        `;
        resultBody.appendChild(tr);
    });

    footerMass.textContent = result.totals.mass_total.toFixed(2);
    footerCo2.textContent = result.totals.co2_total.toFixed(2);
    footerEnergy.textContent = result.totals.energy_total.toFixed(2);

    resultR0.textContent = result.thermal.r0.toFixed(3);
    resultQPerM2.textContent = result.thermal.q_per_m2.toFixed(2);
    resultQTotal.textContent = result.thermal.q_total.toFixed(2);

    resultVPerM2.textContent = result.gas.v_per_m2.toFixed(3);
    resultVTotal.textContent = result.gas.v_total.toFixed(2);

    calcVersion.textContent = result.calculation_version || '1.0';
}

calculateBtn.addEventListener('click', async function() {
    const data = collectFormData();
    if (!data) return;
    const result = await sendCalculation(data);
    if (result) {
        displayResults(result);
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
});

// ============================================================
// 5. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
    await loadMaterials();
    addLayerBtn.click();
});