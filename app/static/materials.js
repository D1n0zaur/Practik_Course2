document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('materialSearch');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearchBtn');
    const tableBody = document.getElementById('materialsTableBody');

    const API_BASE = '';
    const materialsUrl = `${API_BASE}/api/v1/materials`;

    let searchTimeout = null;

    function renderMaterials(materials) {
        tableBody.innerHTML = '';
        if (materials.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Материалы не найдены
                    </td>
                </tr>
            `;
            return;
        }

        materials.forEach(mat => {
            const tr = document.createElement('tr');
            // Используем правильные имена полей из API-ответа
            tr.innerHTML = `
                <td>${mat.id}</td>
                <td>${mat.name}</td>
                <td>${mat.density !== null && mat.density !== undefined ? mat.density : '—'}</td>
                <td>${mat.lambda !== null && mat.lambda !== undefined ? mat.lambda : '—'}</td>
                <td>${mat.co2_factor !== null && mat.co2_factor !== undefined ? mat.co2_factor : '—'}</td>
                <td>${mat.energy_factor !== null && mat.energy_factor !== undefined ? mat.energy_factor : '—'}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    async function searchMaterials(query) {
        const q = query.trim();
        if (!q) {
            window.location.href = '/materials';
            return;
        }

        try {
            const url = `${materialsUrl}?search=${encodeURIComponent(q)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка поиска');
            const result = await response.json();
            renderMaterials(result);
            clearBtn.style.display = 'inline-block';
        } catch (e) {
            console.warn('⚠️ Ошибка поиска:', e);
            alert('Не удалось выполнить поиск. Попробуйте позже.');
        }
    }

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const value = this.value;
        searchTimeout = setTimeout(() => {
            if (value.trim() === '') {
                clearSearch();
            } else {
                searchMaterials(value);
            }
        }, 300);
    });

    searchBtn.addEventListener('click', function() {
        const value = searchInput.value.trim();
        if (value) {
            searchMaterials(value);
        } else {
            clearSearch();
        }
    });

    clearBtn.addEventListener('click', clearSearch);

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = this.value.trim();
            if (value) {
                searchMaterials(value);
            } else {
                clearSearch();
            }
        }
    });

    function clearSearch() {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        window.location.href = '/materials';
    }
});