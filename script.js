// Variabile globale
let map;
let allMarkers = [];
let allData = [];
let markerClusterGroup;

// Inițializare hartă
function initMap() {
    // Creare hartă cu centrul României
    map = L.map('map').setView([45.9432, 24.9668], 7);

    // Adăugare tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    // Inițializare cluster group
    markerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 80
    });
    map.addLayer(markerClusterGroup);

    // Încărcare date
    loadData();
}

// Funcție pentru creare iconițe custom
function createCustomIcon(type, name) {
    // Culori în funcție de tip
    const colors = {
        'Școală Gimnazială': '#3498db',
        'Liceu': '#e74c3c',
        'Grădiniță': '#f39c12',
        'Colegiu': '#9b59b6',
        'Liceu Tehnologic': '#e67e22',
        'Colegiu Național': '#8e44ad',
        'Școală': '#3498db',
        'Centrul Școlar de Educație Incluzivă': '#16a085',
        'Școală Profesională': '#27ae60',
        'Liceu Teoretic': '#c0392b',
        'Colegiu Economic': '#d35400',
        'Liceul de Arte': '#9b59b6',
        'Colegiu Național Pedagogic': '#8e44ad',
        'Grădinița cu Program Prelungit': '#f39c12',
        'Școală Primară': '#3498db',
        'Palatul Copiilor Și Elevilor': '#34495e',
        'Liceu cu program sportiv prelungit': '#e74c3c',
        'Centrul Județean de Resurse și Asistență Educațională': '#16a085',
        'Școală Profesională Specială': '#27ae60',
        'Colegiu Tehnic': '#d35400',
        'Liceu Tehnologic Agricol': '#e67e22',
        'Liceu Tehnologic de Industrie Alimentară': '#d35400',
        'Liceu Tehnologic de Industrie Alimentara': '#d35400',
        'Liceul Auto': '#e67e22',
        'Liceul Teologic Romano-Catolic': '#8e44ad',
        'Seminarul Teologic': '#8e44ad',
        'Clubul Copiilor': '#34995e',
        'Școala de Artă': '#9b59b6',
        'C.J.R.A.E.': '#16a085',
        'Centrul Școlar pentru Educație Incluzivă': '#16a085',
        'Grădinița cu Program Normal': '#f39c12',
        'Grădinița cu program normal': '#f39c12',
        'Gradinita cu Program Prelungit': '#f39c12',
        'Grădinița Program Prelungit': '#f39c12'
    };

    // Inițiale pentru iconiță
    const initials = name.split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
            background-color: ${colors[type] || '#3498db'};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            text-align: center;
            font-size: 11px;
            transition: transform 0.2s;
        ">${initials}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        tooltipAnchor: [16, 0]
    });
}

// Funcție pentru adăugare marker
function addMarker(data) {
    const { Judet, 'Nume Unități': nume, Tip, Latitudine, Longitudine } = data;
    
    if (!Latitudine || !Longitudine) return null;

    const lat = parseFloat(Latitudine);
    const lng = parseFloat(Longitudine);
    
    // Validare coordonate
    if (isNaN(lat) || isNaN(lng) || lat < 40 || lat > 50 || lng < 19 || lng > 30) {
        console.warn('Coordonate invalide:', { nume, lat, lng });
        return null;
    }

    const icon = createCustomIcon(Tip, nume);
    
    const marker = L.marker([lat, lng], { icon });
    
    // Popup cu informații detaliate
    const popupContent = `
        <div class="popup-content">
            <div class="popup-title">${nume}</div>
            <div class="popup-info">
                <span><strong>Județ:</strong></span>
                <span>${Judet}</span>
            </div>
            <div class="popup-info">
                <span><strong>Tip:</strong></span>
                <span>${Tip}</span>
            </div>
            <div class="popup-coords">
                <strong>Coordonate:</strong><br>
                Lat: ${lat.toFixed(6)}<br>
                Lng: ${lng.toFixed(6)}
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup',
        autoClose: false,
        closeOnClick: false
    });

    // Tooltip la hover
    marker.bindTooltip(nume, {
        permanent: false,
        direction: 'top',
        offset: [0, -20],
        opacity: 0.9
    });

    // Adăugare date la marker pentru filtrare
    marker.judet = Judet;
    marker.tip = Tip;
    marker.nume = nume.toLowerCase();

    return marker;
}

// Funcție pentru încărcare date din CSV
function loadData() {
    showLoading();
    
    console.log('Începem încărcarea datelor...');
    
    fetch('data/locatii.csv')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            console.log('CSV text primit:', csvText.substring(0, 200));
            
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('Rezultate parsare:', results);
                    console.log('Număr rânduri:', results.data.length);
                    
                    // Verifică dacă avem date
                    if (results.data.length === 0) {
                        console.error('CSV-ul este gol sau are format greșit');
                        hideLoading();
                        alert('Fișierul CSV este gol sau are format greșit.');
                        return;
                    }
                    
                    // Verifică prima linie
                    console.log('Prima linie:', results.data[0]);
                    
                    allData = results.data.filter(row => {
                        const lat = row.Latitudine;
                        const lng = row.Longitudine;
                        
                        // Verifică dacă coordonatele sunt valide
                        const latValid = lat && lat !== '' && !isNaN(parseFloat(lat));
                        const lngValid = lng && lng !== '' && !isNaN(parseFloat(lng));
                        
                        if (!latValid || !lngValid) {
                            console.log('Linie invalidă:', row);
                        }
                        
                        return latValid && lngValid;
                    });
                    
                    console.log(`Unități valide: ${allData.length} din ${results.data.length}`);
                    
                    if (allData.length === 0) {
                        alert('Nu s-au găsit unități cu coordonate valide. Verifică fișierul CSV.');
                        hideLoading();
                        return;
                    }
                    
                    // Adăugare marker-e
                    allData.forEach((data, index) => {
                        const marker = addMarker(data);
                        if (marker) {
                            allMarkers.push(marker);
                            markerClusterGroup.addLayer(marker);
                        }
                    });
                    
                    // Actualizare statistici
                    updateStats();
                    
                    // Populare filtre
                    populateFilters();
                    
                    // Ascundere loading
                    hideLoading();
                    
                    // Adăugare event listeners
                    addEventListeners();
                    
                    console.log(`Încărcate cu succes ${allData.length} unități de învățământ`);
                },
                error: function(error) {
                    console.error('Eroare la parsare CSV:', error);
                    hideLoading();
                    alert('Eroare la parsarea datelor. Verifică formatul CSV.');
                }
            });
        })
        .catch(error => {
            console.error('Eroare la încărcare date:', error);
            hideLoading();
            alert('Eroare la conectarea la server. Verifică calea către fișierul CSV.');
        });
}

// Funcție pentru actualizare statistici
function updateStats() {
    const totalUnitati = allData.length;
    const judeteUnice = [...new Set(allData.map(item => item.Județ))].length;
    
    document.getElementById('totalUnitati').textContent = totalUnitati;
    document.getElementById('totalJudete').textContent = judeteUnice;
    updateVisibleCount();
}

// Funcție pentru populare filtre
function populateFilters() {
    const judete = [...new Set(allData.map(item => item.Județ))].sort();
    const filterJudet = document.getElementById('filterJudet');
    
    // Golește selectul (exceptând prima opțiune)
    filterJudet.innerHTML = '<option value="">Toate județele</option>';
    
    judete.forEach(judet => {
        const option = document.createElement('option');
        option.value = judet;
        option.textContent = judet;
        filterJudet.appendChild(option);
    });
}

// Funcție pentru filtrare marker-e
function filterMarkers() {
    const judetSelectat = document.getElementById('filterJudet').value;
    const tipSelectat = document.getElementById('filterTip').value;
    const searchTerm = document.getElementById('search').value.toLowerCase();
    
    let vizibile = 0;
    
    allMarkers.forEach(marker => {
        let includeMarker = true;
        
        // Filtrare județ
        if (judetSelectat && marker.judet !== judetSelectat) {
            includeMarker = false;
        }
        
        // Filtrare tip
        if (tipSelectat && marker.tip !== tipSelectat) {
            includeMarker = false;
        }
        
        // Filtrare căutare
        if (searchTerm && !marker.nume.includes(searchTerm)) {
            includeMarker = false;
        }
        
        if (includeMarker) {
            markerClusterGroup.addLayer(marker);
            vizibile++;
        } else {
            markerClusterGroup.removeLayer(marker);
        }
    });
    
    // Actualizare număr vizibile
    document.getElementById('vizibileUnitati').textContent = vizibile;
}

// Funcție pentru resetare filtre
function resetFilters() {
    document.getElementById('filterJudet').value = '';
    document.getElementById('filterTip').value = '';
    document.getElementById('search').value = '';
    
    // Afișare toate marker-ele
    allMarkers.forEach(marker => {
        markerClusterGroup.addLayer(marker);
    });
    
    updateVisibleCount();
}

// Funcție pentru actualizare număr vizibile
function updateVisibleCount() {
    document.getElementById('vizibileUnitati').textContent = allMarkers.length;
}

// Funcție pentru afișare loading
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingDiv);
}

// Funcție pentru ascundere loading
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.remove();
    }
}

// Funcție pentru adăugare event listeners
function addEventListeners() {
    document.getElementById('filterJudet').addEventListener('change', filterMarkers);
    document.getElementById('filterTip').addEventListener('change', filterMarkers);
    document.getElementById('search').addEventListener('input', filterMarkers);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    // Căutare la apăsarea Enter
    document.getElementById('search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterMarkers();
        }
    });
    
    // Adăugare event listener pentru redimensionare hartă
    window.addEventListener('resize', function() {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    });
}

// Inițializare la încărcarea paginii
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});

// Exportă funcții pentru debugging
window.mapApp = {
    filterMarkers,
    resetFilters,
    allMarkers,
    allData,
    map
};
