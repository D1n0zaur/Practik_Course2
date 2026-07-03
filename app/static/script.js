// ============================================================
// 0. INIT (ВСЁ ВНУТРИ DOMContentLoaded)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    // -----------------------------
    // DOM ELEMENTS
    // -----------------------------
    const layersBody = document.getElementById('layersBody');
    const addLayerBtn = document.getElementById('addLayerBtn');
    const calculateBtn = document.getElementById('calculateBtn');

    const gsopInput = document.getElementById('gsopInput');
    const areaInput = document.getElementById('areaInput');
    const armatureInput = document.getElementById('armatureInput');

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

    const API_BASE = '';
    const materialsUrl = `${API_BASE}/api/v1/materials`;
    const calculateUrl = `${API_BASE}/api/v1/walls/calculate`;

    let materials = [];

    // ============================================================
    // 1. MATERIALS
    // ============================================================

    async function loadMaterials() {
        try {
            const response = await fetch(materialsUrl);
            if (!response.ok) throw new Error('Ошибка загрузки материалов');
            materials = await response.json();
        } catch (e) {
            materials = [
                { id: 147, name: 'Кирпич силикатный (ρ=1800)' },
                { id: 30, name: 'Минвата каменная (ρ=80)' },
                { id: 145, name: 'Кирпич керамический (ρ=1400)' },
                { id: 159, name: 'Арматура стальная' },
            ];
        }
    }

    function updateSelect(select) {
        const current = select.value;
        select.innerHTML = `<option value="">Выберите материал...</option>`;
        materials.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name;
            select.appendChild(opt);
        });
        select.value = current;
    }

    // ============================================================
    // 2. ROWS
    // ============================================================

    function createRow(index) {
        const tr = document.createElement('tr');

        const tdIndex = document.createElement('td');
        tdIndex.textContent = index;

        const tdMat = document.createElement('td');
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm';
        updateSelect(select);
        tdMat.appendChild(select);

        const tdTh = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control form-control-sm';
        input.step = '0.001';
        tdTh.appendChild(input);

        const tdAct = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-danger btn-sm';
        btn.textContent = '✕';

        btn.onclick = () => {
            tr.remove();
            renumber();
            if (layersBody.querySelectorAll('tr').length === 0) {
                showPlaceholder();
            }
        };

        tdAct.appendChild(btn);

        tr.append(tdIndex, tdMat, tdTh, tdAct);
        return tr;
    }

    function renumber() {
        [...layersBody.querySelectorAll('tr')].forEach((r, i) => {
            r.cells[0].textContent = i + 1;
        });
    }

    function showPlaceholder() {
        layersBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    Нажмите «Добавить слой»
                </td>
            </tr>
        `;
    }

    addLayerBtn.addEventListener('click', () => {
        const placeholder = layersBody.querySelector('td[colspan]');
        if (placeholder) layersBody.innerHTML = '';

        const row = createRow(layersBody.querySelectorAll('tr').length + 1);
        layersBody.appendChild(row);
    });

    // ============================================================
    // 3. COLLECT DATA
    // ============================================================

    function collect() {
        const gsop = +gsopInput.value;
        const area = +areaInput.value;
        const arm = +armatureInput.value;

        const rows = [...layersBody.querySelectorAll('tr')];

        if (!rows.length || rows[0].querySelector('td[colspan]')) {
            alert('Добавьте слои');
            return null;
        }

        const layers = [];

        for (const r of rows) {
            const mat = r.querySelector('select').value;
            const th = +r.querySelector('input').value;

            if (!mat || th <= 0) {
                alert('Заполните все слои');
                return null;
            }

            layers.push({
                material_id: +mat,
                thickness: th
            });
        }

        return { gsop, area, armature_mass: arm, layers };
    }

    // ============================================================
    // 4. REQUEST
    // ============================================================

    async function calculate(data) {
        try {
            const res = await fetch(calculateUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error();
            return await res.json();
        } catch {
            return mock(data);
        }
    }

    function mock(data) {
        const per_layer = data.layers.map(l => ({
            material_name: 'Материал',
            thickness_m: l.thickness,
            mass_kg_per_m2: l.thickness * 1800,
            co2_kgCO2_per_m2: l.thickness * 300,
            energy_MJ_per_m2: l.thickness * 2500
        }));

        const r0 = 2.87;
        const q = (0.024 * data.gsop) / r0;

        return {
            per_layer,
            totals: {
                mass_total: 1,
                co2_total: 1,
                energy_total: 1
            },
            thermal: {
                r0,
                q_per_m2: q,
                q_total: q * data.area
            },
            gas: {
                v_per_m2: 0,
                v_total: 0
            },
            calculation_version: 'mock'
        };
    }

    // ============================================================
    // 5. DISPLAY
    // ============================================================

    function show(res) {
        resultsSection.style.display = 'block';
        resultBody.innerHTML = '';

        res.per_layer.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${p.material_name}</td>
                <td>${p.mass_kg_per_m2.toFixed(2)}</td>
                <td>${p.co2_kgCO2_per_m2.toFixed(2)}</td>
                <td>${p.energy_MJ_per_m2.toFixed(2)}</td>
            `;
            resultBody.appendChild(tr);
        });

        footerMass.textContent = res.totals.mass_total;
        footerCo2.textContent = res.totals.co2_total;
        footerEnergy.textContent = res.totals.energy_total;

        resultR0.textContent = res.thermal.r0;
        resultQPerM2.textContent = res.thermal.q_per_m2;
        resultQTotal.textContent = res.thermal.q_total;
    }

    calculateBtn.onclick = async () => {
        const data = collect();
        if (!data) return;

        const res = await calculate(data);
        show(res);
    };

    // ============================================================
    // INIT
    // ============================================================

    await loadMaterials();
    showPlaceholder();
});