// Variabile globale
let map;
let allMarkers = [];
let allData = [];
let markerClusterGroup;

// Lista oficială a județelor din România
const JUDETE_OFICIALE = [
    'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brașov', 'Brăila', 'Buzău',
    'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj',
    'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt',
    'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vâlcea', 'Vaslui',
    'Vrancea', 'București'
];

// Funcție pentru normalizare nume județ
function normalizeJudet(judet) {
    if (!judet) return '';
    
    // Corectăm greșelile evidente înainte de normalizare
    const corrections = {
        'Saru Mare': 'Satu Mare',
        'Dimbovita': 'Dâmbovița',
        'Argeş': 'Argeș',
        'Botoşani': 'Botoșani',
        'Constanţa': 'Constanța',
        'Iaşi': 'Iași',
        'Salaj': 'Sălaj',
        'bucuresti': 'București',
        'bucurești': 'București',
        'sector': 'București'
    };
    
    // Aplicăm corecțiile dacă există
    const judetCorectat = corrections[judet] || judet;
    
    return judetCorectat;
}

// Funcție pentru comparare județe
function comparaJudete() {
    const judeteDinDate = [...new Set(allData.map(item => normalizeJudet(item.Judet)))];
    
    console.log('=== ANALIZĂ JUDEȚE ===');
    console.log('Județe oficiale (42):', JUDETE_OFICIALE.length, JUDETE_OFICIALE);
    console.log('Județe din date:', judeteDinDate.length, judeteDinDate);
    
    // Găsim județele care sunt în date dar nu sunt oficiale
    const judeteIncorecte = judeteDinDate.filter(judet => !JUDETE_OFICIALE.includes(judet));
    
    // Găsim județele oficiale care lipsesc din date
    const judeteLipsa = JUDETE_OFICIALE.filter(judet => !judeteDinDate.includes(judet));
    
    console.log('Județe incorecte (din date dar nu sunt oficiale):', judeteIncorecte);
    console.log('Județe lipsă (oficiale dar nu sunt în date):', judeteLipsa);
    
    return {
        judeteDinDate,
        judeteIncorecte,
        judeteLipsa
    };
}

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
        'Liceu de Arte': '#9b59b6',
        'Colegiu Național Pedagogic': '#8e44ad',
        'Grădinița cu Program Prelungit': '#f39c12',
        'Școală Primară': '#3498db',
        'Palatul Copiilor Și Elevilor': '#34495e',
        'Liceu cu program sportiv prelungit': '#e74c3c',
        'Centrul Județean de Resurse și Asistență Educațională': '#16a085',
        'Școală Profesională Specială': '#27ae60',
        'Colegiul Tehnic': '#d35400',
        'Liceu Tehnologic Agricol': '#e67e22',
        'Liceu Tehnologic de Industrie Alimentară': '#d35400',
        'Liceu Tehnologic de Industrie Alimentara': '#d35400',
        'Liceu Auto': '#e67e22',
        'Liceu Teologic Romano-Catolic': '#8e44ad',
        'Seminarul Teologic': '#8e44ad',
        'Clubul Copiilor': '#34495e',
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
    const { Judet, 'Nume Unitati': nume, Tip, Latitudine, Longitudine } = data;
    
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
                <span>${normalizeJudet(Judet)}</span>
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
                    
                    // Filtrare date valide
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

// Funcție pentru actualizare statistici (cu normalizare și detalii)
function updateStats() {
    const totalUnitati = allData.length;
    const judeteNormalize = allData.map(item => normalizeJudet(item.Judet));
    const judeteUnice = [...new Set(judeteNormalize)];
    const numarJudeteDinDate = judeteUnice.length;
    const numarTotalJudete = JUDETE_OFICIALE.length;
    
    // Găsim județele lipsă
    const judeteLipsa = JUDETE_OFICIALE.filter(judet => !judeteUnice.includes(judet));
    
    console.log('Județe normalizate:', judeteUnice);
    console.log('Număr județe unice:', numarJudeteDinDate);
    console.log('Județe lipsă:', judeteLipsa);
    
    // Afișăm frecvența județelor normalizate
    const frecventaJudeteNormalize = {};
    judeteNormalize.forEach(judet => {
        frecventaJudeteNormalize[judet] = (frecventaJudeteNormalize[judet] || 0) + 1;
    });
    console.log('Frecvența județelor (după normalizare):', frecventaJudeteNormalize);
    
    // Actualizăm elementele din card-uri
    document.querySelector('#stats .stat-card:nth-child(1) .stat-content p').textContent = totalUnitati;
    
    // Afișăm numărul de județe din date și totalul
    const judeteElement = document.querySelector('#stats .stat-card:nth-child(2) .stat-content p');
    judeteElement.textContent = `${numarJudeteDinDate}/${numarTotalJudete}`;
    
    // Adăugăm tooltip informativ
    let tooltipText = `Datele acoperă ${numarJudeteDinDate} din cele ${numarTotalJudete} județe ale României`;
    if (judeteLipsa.length > 0) {
        tooltipText += `\n\nJudețe lipsă din date:\n${judeteLipsa.join(', ')}`;
    }
    judeteElement.setAttribute('title', tooltipText);
    judeteElement.style.cursor = 'help';
    judeteElement.style.borderBottom = '1px dotted #999';
    
    // Actualizăm numărul de unități vizibile
    document.querySelector('#stats .stat-card:nth-child(3) .stat-content p').textContent = allMarkers.length;
    
    // Adăugăm un element pentru județele lipsă dacă nu există
    let judeteLipsaElement = document.getElementById('judeteLipsa');
    if (!judeteLipsaElement) {
        judeteLipsaElement = document.createElement('div');
        judeteLipsaElement.id = 'judeteLipsa';
        judeteLipsaElement.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            font-size: 14px;
            color: #856404;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        // Îl adăugăm după secțiunea de statistici
        const statsSection = document.getElementById('stats');
        if (statsSection) {
            statsSection.parentNode.insertBefore(judeteLipsaElement, statsSection.nextSibling);
        }
    }
    
    // Afișăm județele lipsă
    if (judeteLipsa.length > 0) {
        judeteLipsaElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 18px;">⚠️</span>
                <strong>Atenție: Lipsesc ${judeteLipsa.length} județe din date:</strong>
            </div>
            <div style="color: #d63031; font-weight: 500;">${judeteLipsa.join(', ')}</div>
        `;
        judeteLipsaElement.style.display = 'block';
    } else {
        judeteLipsaElement.style.display = 'none';
    }
}

// Funcție pentru populare filtre
function populateFilters() {
    const judete = [...new Set(allData.map(item => normalizeJudet(item.Judet)))].sort();
    const tipuri = [...new Set(allData.map(item => item.Tip))].sort();
    
    const filterJudet = document.getElementById('filterJudet');
    const filterTip = document.getElementById('filterTip');
    
    // Golește selectul (exceptând prima opțiune)
    filterJudet.innerHTML = '<option value="">Toate județele</option>';
    filterTip.innerHTML = '<option value="">Toate tipurile</option>';
    
    judete.forEach(judet => {
        const option = document.createElement('option');
        option.value = judet;
        option.textContent = judet;
        filterJudet.appendChild(option);
    });
    
    tipuri.forEach(tip => {
        const option = document.createElement('option');
        option.value = tip;
        option.textContent = tip;
        filterTip.appendChild(option);
    });
}

// Funcție pentru filtrare marker-e
function filterMarkers() {
    const judetSelectat = document.getElementById('filterJudet').value;
    const tipSelectat = document.getElementById('filterTip').value;
    const searchTerm = document.getElementById('search').value.toLowerCase();
    
    let vizibile = 0;
    
    // Șterge toți marker-ele din cluster
    markerClusterGroup.clearLayers();
    
    allMarkers.forEach(marker => {
        let includeMarker = true;
        
        // Filtrare județ (cu normalizare)
        if (judetSelectat && normalizeJudet(marker.judet) !== judetSelectat) {
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
        }
    });
    
    // Actualizare număr vizibile
    document.querySelector('#stats .stat-card:nth-child(3) .stat-content p').textContent = vizibile;
}

// Funcție pentru resetare filtre
function resetFilters() {
    document.getElementById('filterJudet').value = '';
    document.getElementById('filterTip').value = '';
    document.getElementById('search').value = '';
    
    // Afișare toate marker-ele
    markerClusterGroup.clearLayers();
    allMarkers.forEach(marker => {
        markerClusterGroup.addLayer(marker);
    });
    
    // Actualizare număr vizibile
    document.querySelector('#stats .stat-card:nth-child(3) .stat-content p').textContent = allMarkers.length;
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
    map,
    normalizeJudet,
    comparaJudete
};
