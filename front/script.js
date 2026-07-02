// ============================================================
// 1. СПРАВОЧНИК МАТЕРИАЛОВ (временный)
// ============================================================
const materials = [
    { id: 147, name: 'Кирпич силикатный (ρ=1800 кг/м³)' },
    { id: 30,  name: 'Минвата каменная (ρ=80 кг/м³)' },
    { id: 145, name: 'Кирпич керамический (ρ=1400 кг/м³)' },
    { id: 159, name: 'Арматура стальная (сетка)' },
];

function getMaterials() {
    return materials;
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

    const mats = getMaterials();
    mats.forEach(mat => {
        const option = document.createElement('option');
        option.value = mat.id;
        option.textContent = mat.name;
        select.appendChild(option);
    });

    const tdMaterial = document.createElement('td');
    tdMaterial.appendChild(select);

    // Поле толщины — type="number"
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
        if (td) {
            td.textContent = idx + 1;
        }
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
    if (placeholderRow) {
        placeholderRow.parentElement.remove();
    }
    const currentRows = layersBody.querySelectorAll('tr').length;
    const newIndex = currentRows + 1;
    const newRow = createLayerRow(newIndex);
    layersBody.appendChild(newRow);
});

document.addEventListener('DOMContentLoaded', function() {
    addLayerBtn.click();
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
        alert('Пожалуйста, введите корректное значение ГСОП (положительное число).');
        return null;
    }
    if (isNaN(area) || area <= 0) {
        alert('Пожалуйста, введите корректную площадь стен (положительное число).');
        return null;
    }
    if (isNaN(armatureMass) || armatureMass < 0) {
        alert('Пожалуйста, введите массу арматуры (неотрицательное число).');
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
            alert('Пожалуйста, выберите материал для всех слоёв.');
            return null;
        }
        if (isNaN(thickness) || thickness <= 0) {
            alert('Пожалуйста, введите корректную толщину (положительное число) для всех слоёв.');
            return null;
        }

        layers.push({
            material_id: materialId,
            thickness: thickness
        });
    }

    return {
        layers: layers,
        armature_mass: armatureMass,
        gsop: gsop,
        area: area
    };
}

calculateBtn.addEventListener('click', function() {
    const data = collectFormData();
    if (data) {
        console.log('📦 Данные для отправки:', JSON.stringify(data, null, 2));
        alert('Данные собраны! Проверьте консоль (F12).');
    }
});