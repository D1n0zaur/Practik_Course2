// ============================================================
// 0. INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    // -----------------------------
    // DOM ELEMENTS
    // -----------------------------
    const layersBody = document.getElementById('layersBody');
    const addLayerBtn = document.getElementById('addLayerBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const searchInput = document.getElementById('materialSearch');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

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

    const searchResults = document.getElementById('searchResults');
    const searchResultsBody = document.getElementById('searchResultsBody');
    const searchMessage = document.getElementById('searchMessage');

    const API_BASE = '';
    const materialsUrl = `${API_BASE}/api/v1/materials`;
    const calculateUrl = `${API_BASE}/api/v1/walls/calculate`;

    let allMaterials = [];
    let filteredMaterials = [];
    let materialsLoaded = false;

    // ============================================================
    // 1. ЗАГРУЗКА ВСЕХ МАТЕРИАЛОВ
    // ============================================================

    async function loadAllMaterials() {
        try {
            const response = await fetch(materialsUrl);
            if (!response.ok) throw new Error('Ошибка загрузки');
            allMaterials = await response.json();
        } catch (e) {
            console.warn('⚠️ Не удалось загрузить материалы, используем запасной список.');
            allMaterials = [
                { id: 147, name: 'Кирпич силикатный', density: 1800 },
                { id: 30, name: 'Минвата каменная', density: 80 },
                { id: 145, name: 'Кирпич керамический', density: 1400 },
                { id: 159, name: 'Арматура стальная', density: 7850 },
            ];
        }
        materialsLoaded = true;
        filteredMaterials = [...allMaterials];
    }

    // ============================================================
    // 2. ПОИСК МАТЕРИАЛОВ
    // ============================================================

    async function searchMaterials(query) {
        const q = query.trim();

        if (!q) {
            searchResults.style.display = 'none';
            clearSearchBtn.style.display = 'none';
            return;
        }

        try {
            const url = `${materialsUrl}?search=${encodeURIComponent(q)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка поиска');
            const result = await response.json();
            filteredMaterials = result;
        } catch (e) {
            console.warn('⚠️ Ошибка поиска, используем локальную фильтрацию (резерв):', e);
            const lower = q.toLowerCase();
            filteredMaterials = allMaterials.filter(m =>
                m.name.toLowerCase().includes(lower) ||
                (m.density !== undefined && m.density !== null && String(m.density).includes(q))
            );
        }

        renderSearchResults(filteredMaterials);
        if (filteredMaterials.length === 0) {
            searchMessage.textContent = 'Ничего не найдено. Попробуйте изменить запрос.';
        } else {
            searchMessage.textContent = `Найдено ${filteredMaterials.length} материалов. Нажмите «Выбрать», чтобы добавить слой.`;
        }
        searchResults.style.display = 'block';
        clearSearchBtn.style.display = 'inline-block';
    }

    function renderSearchResults(materials) {
        searchResultsBody.innerHTML = '';
        materials.forEach(mat => {
            const tr = document.createElement('tr');
            const nameTd = document.createElement('td');
            nameTd.textContent = mat.name;
            const densityTd = document.createElement('td');
            densityTd.textContent = mat.density !== undefined && mat.density !== null ? mat.density : '—';
            const actionTd = document.createElement('td');
            const selectBtn = document.createElement('button');
            selectBtn.className = 'btn btn-outline-primary btn-sm';
            selectBtn.textContent = 'Выбрать';
            selectBtn.dataset.materialId = mat.id;
            selectBtn.dataset.materialName = mat.name;
            selectBtn.onclick = function() {
                const id = parseInt(this.dataset.materialId);
                const name = this.dataset.materialName;
                addLayerWithMaterial(id, name);
                // Очищаем поиск
                searchInput.value = '';
                searchResults.style.display = 'none';
                clearSearchBtn.style.display = 'none';
            };
            actionTd.appendChild(selectBtn);
            tr.appendChild(nameTd);
            tr.appendChild(densityTd);
            tr.appendChild(actionTd);
            searchResultsBody.appendChild(tr);
        });
    }

    function clearSearch() {
        searchInput.value = '';
        searchResults.style.display = 'none';
        clearSearchBtn.style.display = 'none';
        searchMessage.textContent = '';
    }

    // ============================================================
    // 3. УПРАВЛЕНИЕ СТРОКАМИ (с добавлением материала по ID)
    // ============================================================

    function addLayerWithMaterial(materialId, materialName) {
        // Убираем плейсхолдер если есть
        const placeholder = layersBody.querySelector('td[colspan]');
        if (placeholder) layersBody.innerHTML = '';

        const index = layersBody.querySelectorAll('tr').length + 1;
        const tr = document.createElement('tr');

        const tdIndex = document.createElement('td');
        tdIndex.textContent = index;

        const tdMat = document.createElement('td');
        const span = document.createElement('span');
        span.textContent = materialName;
        span.dataset.materialId = materialId;
        span.style.fontWeight = '500';
        tdMat.appendChild(span);

        // Скрытое поле для ID (для сбора данных)
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'material_id';
        hiddenInput.value = materialId;
        tdMat.appendChild(hiddenInput);

        const tdTh = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control form-control-sm';
        input.step = '0.001';
        input.min = '0';
        input.placeholder = '0.000';
        input.required = true;
        tdTh.appendChild(input);

        const tdAct = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-danger btn-sm';
        btn.textContent = '✕';
        btn.onclick = function() {
            tr.remove();
            renumber();
            if (layersBody.querySelectorAll('tr').length === 0) {
                showPlaceholder();
            }
        };
        tdAct.appendChild(btn);

        tr.append(tdIndex, tdMat, tdTh, tdAct);
        layersBody.appendChild(tr);
        // Фокусируемся на поле толщины
        input.focus();
        renumber();
    }

    // Существующая функция createRow (для кнопки "Добавить слой") - оставим её, но будем использовать выпадающий список?
    // У нас теперь вместо выпадающего списка — текстовое отображение материала, добавляемого через поиск.
    // Поэтому кнопка "Добавить слой" будет создавать строку с выпадающим списком, как раньше.
    // Это сделано для возможности ручного выбора, если поиск не используется.
    // Но мы можем объединить подходы: при добавлении через кнопку — выпадающий список.
    // При добавлении через поиск — фиксированное название.

    // Функция для создания строки с выпадающим списком (для кнопки "Добавить слой")
    function createLayerRowWithSelect(index) {
        const tr = document.createElement('tr');

        const tdIndex = document.createElement('td');
        tdIndex.textContent = index;

        const tdMat = document.createElement('td');
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm';
        // Заполняем select всеми материалами
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Выберите материал...';
        defaultOption.selected = true;
        select.appendChild(defaultOption);
        allMaterials.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name + (m.density ? ` (ρ=${m.density} кг/м³)` : '');
            select.appendChild(opt);
        });
        tdMat.appendChild(select);

        const tdTh = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control form-control-sm';
        input.step = '0.001';
        input.min = '0';
        input.placeholder = '0.000';
        tdTh.appendChild(input);

        const tdAct = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-danger btn-sm';
        btn.textContent = '✕';
        btn.onclick = function() {
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
            if (r.cells.length) {
                r.cells[0].textContent = i + 1;
            }
        });
    }

    function showPlaceholder() {
        layersBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4 small">
                    Нажмите «Добавить слой», чтобы начать
                </td>
            </tr>
        `;
    }

    // Обработчик добавления слоя (с выпадающим списком)
    addLayerBtn.addEventListener('click', function() {
        if (!materialsLoaded) {
            alert('Материалы ещё загружаются, попробуйте позже.');
            return;
        }
        const placeholder = layersBody.querySelector('td[colspan]');
        if (placeholder) layersBody.innerHTML = '';
        const newRow = createLayerRowWithSelect(layersBody.querySelectorAll('tr').length + 1);
        layersBody.appendChild(newRow);
        renumber();
    });

    // ============================================================
    // 4. ОБРАБОТЧИКИ ПОИСКА
    // ============================================================

    let searchTimeout = null;

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const value = this.value;
        searchTimeout = setTimeout(() => {
            searchMaterials(value);
        }, 300);
    });

    searchBtn.addEventListener('click', function() {
        searchMaterials(searchInput.value);
    });

    clearSearchBtn.addEventListener('click', clearSearch);

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchMaterials(this.value);
        }
    });

    // ============================================================
    // 5. СБОР ДАННЫХ (учёт обоих типов строк)
    // ============================================================

    function collect() {
        const gsop = parseFloat(gsopInput.value);
        const area = parseFloat(areaInput.value);
        const arm = parseFloat(armatureInput.value);

        if (isNaN(gsop) || gsop <= 0) {
            alert('Введите корректное значение ГСОП (положительное число).');
            return null;
        }
        if (isNaN(area) || area <= 0) {
            alert('Введите корректную площадь стен (положительное число).');
            return null;
        }
        if (isNaN(arm) || arm < 0) {
            alert('Введите массу арматуры (неотрицательное число).');
            return null;
        }

        const rows = [...layersBody.querySelectorAll('tr')];
        if (!rows.length || rows[0].querySelector('td[colspan]')) {
            alert('Добавьте хотя бы один слой стены.');
            return null;
        }

        const layers = [];
        for (const r of rows) {
            // Определяем тип строки: если есть select, берём из него, иначе из скрытого поля
            const select = r.querySelector('select');
            const hidden = r.querySelector('input[name="material_id"]');
            const input = r.querySelector('input[type="number"]');

            if (!input) continue;

            let materialId = null;
            if (select) {
                materialId = parseInt(select.value);
            } else if (hidden) {
                materialId = parseInt(hidden.value);
            }

            const thickness = parseFloat(input.value);

            if (!materialId) {
                alert('Выберите материал для всех слоёв.');
                return null;
            }
            if (isNaN(thickness) || thickness <= 0) {
                alert('Введите корректную толщину (положительное число) для всех слоёв.');
                return null;
            }

            layers.push({
                material_id: materialId,
                thickness: thickness
            });
        }

        return {
            gsop,
            area,
            armature_mass: arm,
            layers
        };
    }

    // ============================================================
    // 6. ЗАПРОС НА РАСЧЁТ
    // ============================================================

    async function calculate(data) {
        try {
            const res = await fetch(calculateUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Ошибка сервера (${res.status}): ${errorText}`);
            }
            return await res.json();
        } catch (error) {
            console.warn('⚠️ Бэкенд не отвечает, используем мок-данные.', error);
            return getMockResponse(data);
        }
    }

    function getMockResponse(data) {
        const per_layer = data.layers.map(l => {
            const mat = allMaterials.find(m => m.id === l.material_id) || { name: 'Материал (мок)', density: 1800 };
            const density = mat.density || 1800;
            const co2Factor = 0.15;
            const energyFactor = 1.4;
            const mass = l.thickness * density;
            return {
                material_name: mat.name || 'Материал (мок)',
                thickness_m: l.thickness,
                mass_kg_per_m2: mass,
                co2_kgCO2_per_m2: mass * co2Factor,
                energy_MJ_per_m2: mass * energyFactor
            };
        });

        const armMass = data.armature_mass || 0;
        per_layer.push({
            material_name: 'Арматура стальная (мок)',
            thickness_m: null,
            mass_kg_per_m2: armMass,
            co2_kgCO2_per_m2: armMass * 2.4,
            energy_MJ_per_m2: armMass * 24.2
        });

        const totalMass = per_layer.reduce((s, p) => s + p.mass_kg_per_m2, 0);
        const totalCo2 = per_layer.reduce((s, p) => s + p.co2_kgCO2_per_m2, 0);
        const totalEnergy = per_layer.reduce((s, p) => s + p.energy_MJ_per_m2, 0);

        const r0 = 2.876;
        const q = (0.024 * data.gsop) / r0;

        return {
            per_layer,
            totals: {
                mass_total: totalMass,
                co2_total: totalCo2,
                energy_total: totalEnergy
            },
            thermal: {
                r0: r0,
                q_per_m2: q,
                q_total: q * data.area
            },
            gas: {
                v_per_m2: q / (9.3 * 0.9),
                v_total: (q / (9.3 * 0.9)) * data.area
            },
            calculation_version: '1.0 (mock)'
        };
    }

    // ============================================================
    // 7. ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ
    // ============================================================

    function displayResults(res) {
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

        footerMass.textContent = res.totals.mass_total.toFixed(2);
        footerCo2.textContent = res.totals.co2_total.toFixed(2);
        footerEnergy.textContent = res.totals.energy_total.toFixed(2);

        resultR0.textContent = res.thermal.r0.toFixed(3);
        resultQPerM2.textContent = res.thermal.q_per_m2.toFixed(2);
        resultQTotal.textContent = res.thermal.q_total.toFixed(2);

        if (res.gas) {
            resultVPerM2.textContent = res.gas.v_per_m2.toFixed(3);
            resultVTotal.textContent = res.gas.v_total.toFixed(2);
        }

        calcVersion.textContent = res.calculation_version || '1.0';
    }

    // ============================================================
    // 8. КНОПКА "РАССЧИТАТЬ"
    // ============================================================

    calculateBtn.onclick = async () => {
        const data = collect();
        if (!data) return;

        calculateBtn.disabled = true;
        calculateBtn.textContent = 'Загрузка...';

        try {
            const res = await calculate(data);
            displayResults(res);
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            alert('Произошла ошибка при расчёте. Проверьте консоль.');
            console.error(e);
        } finally {
            calculateBtn.disabled = false;
            calculateBtn.textContent = 'Рассчитать';
        }
    };

    // ============================================================
    // 9. ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    await loadAllMaterials();
    showPlaceholder();
});