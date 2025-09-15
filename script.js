// Inițializare hartă
const map = L.map('map').setView([45.9432, 24.9668], 7); // Centru România

// Adăugare tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

// Stocare date și marker-e
let allMarkers = [];
let allData = [];

// Funcție pentru creare iconițe custom
function createIcon(color = '#3498db') {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

// Funcție pentru adăugare marker
function addMarker(data) {
    const { Judet, 'Nume Unități': nume, Tip, Latitudine, Longitudine } = data;
    
    if (!Latitudine || !Longitudine) return null;
    
    // Culoare în funcție de tip
    const colors = {
        'Școală Gimnazială': '#3498db',
        'Liceu': '#e74c3c',
        'Grădiniță': '#f39c12',
        'Colegiu': '#9b59b6'
    };
    
    const icon = createIcon(colors[Tip] || '#3498db');
    
    const marker = L.marker([parseFloat(Latitudine), parseFloat(Longitudine)], { icon })
        .addTo(map);
    
    // Popup cu informații
    const popupContent = `
        <div class="popup-title">${nume}</div>
        <div class="popup-info"><strong>Județ:</strong> ${Judet}</div>
        <div class="popup-info"><strong>Tip:</strong> ${Tip}</div>
        <div class="popup-info">
            <strong>Coordonate:</strong><br>
            Lat: ${Latitudine}<br>
            Lng: ${Longitudine}
        </div>
    `;
    
    marker.bindPopup(popupContent);
    
    // Adăugare date la marker pentru filtrare
    marker.judet = Judet;
    marker.tip = Tip;
    
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
                    
                    // Corectare date - procesare coordonate și reordonare coloane
                    allData = results.data.map(row => {
                        // Corectare coordonate - elimină punctele suplimentare
                        let lat = row.Latitude;
                        let lng = row.Longitude;
                        
                        // Transformă "460.623.309" în "46.0623309"
                        if (lat && typeof lat === 'string') {
                            lat = lat.replace(/\./g, '');
                            lat = lat.substring(0, 2) + '.' + lat.substring(2);
                        }
                        
                        if (lng && typeof lng === 'string') {
                            lng = lng.replace(/\./g, '');
                            lng = lng.substring(0, 2) + '.' + lng.substring(2);
                        }
                        
                        // Returnează obiectul cu structura corectă
                        return {
                            'Județ': row.Județ,
                            'Nume Unități': row['Nume Unități'],
                            'Tip': row.Tip,
                            'Latitudine': lat,
                            'Longitudine': lng
                        };
                    }).filter(row => {
                        // Verifică dacă coordonatele sunt valide
                        const lat = parseFloat(row.Latitudine);
                        const lng = parseFloat(row.Longitudine);
                        
                        return !isNaN(lat) && !isNaN(lng) && 
                               lat > 40 && lat < 50 && 
                               lng > 20 && lng < 30;
                    });
                    
                    console.log('Date corectate:', allData);
                    console.log(`Număr total de unități valide: ${allData.length}`);
                    
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
                    
                    console.log(`Încărcate ${allData.length} unități de învățământ`);
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
    const judeteUnice = [...new Set(allData.map(item => item.Judet))].length;
    
    document.getElementById('totalUnitati').textContent = totalUnitati;
    document.getElementById('totalJudete').textContent = judeteUnice;
}

// Funcție pentru populare filtre
function populateFilters() {
    const judete = [...new Set(allData.map(item => item.Judet))].sort();
    const filterJudet = document.getElementById('filterJudet');
    
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
    
    allMarkers.forEach(marker => {
        let vizibil = true;
        
        if (judetSelectat && marker.judet !== judetSelectat) {
            vizibil = false;
        }
        
        if (tipSelectat && marker.tip !== tipSelectat) {
            vizibil = false;
        }
        
        if (vizibil) {
            marker.addTo(map);
        } else {
            marker.remove();
        }
    });
}

// Event listeners pentru filtre
document.getElementById('filterJudet').addEventListener('change', filterMarkers);
document.getElementById('filterTip').addEventListener('change', filterMarkers);
function exportMap() {
    // Folosește leaflet-image plugin
    // https://github.com/mapbox/leaflet-image
}
// Încărcare date la inițializare

loadData();

