export const groundTemplateClone=""
export const utils = {
    submitForm: function() {
        const form = document.querySelector("#filter");
        form.removeEventListener("submit", this.handleSubmit);
        form.addEventListener("submit", this.handleSubmit.bind(this));

        // Ajouter le champ de type de recherche s'il n'existe pas déjà
        if (!form.querySelector('input[name="searchType"]')) {
            const searchTypeInput = document.createElement('input');
            searchTypeInput.type = 'hidden';
            searchTypeInput.name = 'searchType';
            searchTypeInput.value = 'ville'; // Valeur par défaut
            form.appendChild(searchTypeInput);
        }

        // Modifier le champ de recherche pour gérer l'autocomplétion
        const searchInput = form.querySelector('input[name="ville"]');
        if (searchInput) {
            // Ajouter un placeholder explicatif
            searchInput.placeholder = "Entrez un nom de ville ou un code postal (5 chiffres)";
            
            // Ajouter un écouteur pour détecter si c'est un code postal
            searchInput.addEventListener('input', function(e) {
                const value = e.target.value.trim();
                const searchTypeInput = form.querySelector('input[name="searchType"]');
                
                // Si c'est un code postal (5 chiffres), changer le type de recherche
                if (/^\d{5}$/.test(value)) {
                    searchTypeInput.value = 'postal';
                } else {
                    searchTypeInput.value = 'ville';
                }
            });
        }
    },

    handleSubmit: async function(event) {
        event.preventDefault();
        const form = event.target;
        const searchValue = form.ville.value.trim();
        const searchType = form.searchType.value;
        const codePostal = form.codePostal ? form.codePostal.value : null; // Stocker le code postal
        
        if (!searchValue) {
            const container = document.querySelector('#results-container .container');
            container.innerHTML = `
                <div class="notification is-warning">
                    <p>Veuillez entrer un code postal ou un nom de ville.</p>
                </div>
            `;
            return;
        }

        // Afficher un message de chargement
        const container = document.querySelector('#results-container .container');
        container.innerHTML = `
            <div class="has-text-centered">
                <div class="notification is-info">
                    <p>Recherche des sports disponibles...</p>
                </div>
            </div>
        `;

        try {
            if (searchType === 'postal') {
                // Si c'est une recherche par code postal, d'abord récupérer les villes
                const villes = await this.getVillesByCodePostal(searchValue);
                if (villes.length === 0) {
                    container.innerHTML = `
                        <div class="notification is-warning">
                            <p>Aucune ville trouvée pour ce code postal.</p>
                        </div>
                    `;
                    return;
                }
                
                // Afficher la liste des villes trouvées
                container.innerHTML = `
                    <div class="notification is-info">
                        <h4 class="title is-5">Villes trouvées pour le code postal ${searchValue}</h4>
                        <div class="buttons">
                            ${villes.map(ville => `
                                <button class="button is-primary ville-btn" data-ville="${ville}" data-cp="${searchValue}">
                                    ${ville}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;

                // Ajouter les écouteurs d'événements pour les boutons de ville
                container.querySelectorAll('.ville-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const ville = e.target.dataset.ville;
                        const cp = e.target.dataset.cp;
                        form.ville.value = ville;
                        form.searchType.value = 'ville';
                        // Stocker le code postal dans un champ caché
                        if (!form.codePostal) {
                            const cpInput = document.createElement('input');
                            cpInput.type = 'hidden';
                            cpInput.name = 'codePostal';
                            form.appendChild(cpInput);
                        }
                        form.codePostal.value = cp;
                        this.handleSubmit(event);
                    });
                });
            } else {
                // Recherche par ville avec code postal si disponible
                let searchQuery;
                if (codePostal) {
                    searchQuery = `new_name="${searchValue}" AND inst_cp="${codePostal}"`;
                } else {
                    searchQuery = `new_name LIKE "${searchValue}%"`;
                }
                console.log("Recherche pour la ville:", searchValue, "Code postal:", codePostal);
                console.log("Requête construite:", searchQuery);
                
                utils.fetchGrounds(searchQuery, 'new_name', codePostal);
            }
        } catch (error) {
            console.error("Erreur lors de la recherche:", error);
            container.innerHTML = `
                <div class="notification is-danger">
                    <p>Une erreur est survenue lors de la recherche.</p>
                    <p>Détails de l'erreur : ${error.message}</p>
                </div>
            `;
        }
    },

    getVillesByCodePostal: async function(codePostal) {
        try {
            // Vérifier que le code postal est valide
            if (!/^\d{5}$/.test(codePostal)) {
                throw new Error("Le code postal doit contenir 5 chiffres");
            }

            const searchQuery = `inst_cp="${codePostal}"`;
            const encodedQuery = encodeURIComponent(searchQuery);
            const url = `https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records?where=${encodedQuery}&select=new_name&limit=100`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                return [];
            }

            // Extraire les noms de villes uniques
            const villes = [...new Set(data.results.map(item => item.new_name))].sort();
            return villes;

        } catch (error) {
            console.error("Erreur lors de la récupération des villes:", error);
            throw error;
        }
    },

    fetchGrounds: async function(searchQuery, communeField, codePostal) {
        try {
            console.log("Requête API en cours pour:", searchQuery);
            
            // Encoder correctement la requête
            const encodedQuery = encodeURIComponent(searchQuery);
            const url = `https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records?where=${encodedQuery}&limit=100`;
            
            console.log("URL de la requête:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            console.log("Statut de la réponse:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Réponse d'erreur complète:", errorText);
                throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
            }

            const datas = await response.json();
            
            if (!datas.results || datas.results.length === 0) {
                throw new Error("Aucun résultat trouvé pour cette ville");
            }

            // Filtrer les résultats par code postal si nécessaire
            if (codePostal) {
                datas.results = datas.results.filter(item => item.inst_cp === codePostal);
                if (datas.results.length === 0) {
                    throw new Error(`Aucun équipement trouvé pour ${datas.results[0][communeField]} (${codePostal})`);
                }
            }

            // Analyser la structure des données reçues
            const firstResult = datas.results[0];
            console.log("Premier résultat:", firstResult);

            // Analyse détaillée des données
            const analyse = this.analyserDonnees(datas.results, communeField);
            
            // Afficher l'analyse dans une notification
            const container = document.querySelector('#results-container .container');
            const villeInfo = codePostal ? 
                `${datas.results[0][communeField]} (${codePostal})` : 
                datas.results[0][communeField];

            container.innerHTML = `
                <div class="notification is-info">
                    <h4 class="title is-5">Analyse des données pour ${villeInfo}</h4>
                    <p>Nombre total d'équipements trouvés : ${analyse.total}</p>
                    <p>Équipements avec coordonnées GPS : ${analyse.avecCoords} (${Math.round(analyse.avecCoords/analyse.total*100)}%)</p>
                    <p>Équipements avec informations de clubs : ${analyse.avecClubs} (${Math.round(analyse.avecClubs/analyse.total*100)}%)</p>
                    <p>Sports différents trouvés : ${analyse.sportsUniques.length}</p>
                    <p>Liste des sports : ${analyse.sportsUniques.join(', ')}</p>
                </div>
            `;

            // Continuer avec l'affichage normal
            utils.processSports(datas, communeField, codePostal);

        } catch (error) {
            console.error("Erreur détaillée:", error);
            const container = document.querySelector('#results-container .container');
            let errorMessage = "Une erreur est survenue lors de la recherche.";
            
            if (error.name === 'AbortError') {
                errorMessage = "La requête a pris trop de temps. Veuillez réessayer plus tard.";
            } else if (error.message.includes("Failed to fetch") || error.message.includes("CORS")) {
                errorMessage = "Erreur d'accès à l'API. Veuillez réessayer plus tard ou contacter le support.";
            } else if (error.message.includes("Aucun résultat trouvé")) {
                errorMessage = "Aucun équipement sportif trouvé pour cette ville. Veuillez vérifier l'orthographe.";
            } else if (error.message.includes("ODSQLError")) {
                errorMessage = "Erreur de syntaxe dans la requête. Veuillez réessayer avec un autre nom de ville.";
            } else if (error.message.includes("L'API n'est pas accessible")) {
                errorMessage = "Le service des équipements sportifs est temporairement indisponible. Veuillez réessayer plus tard.";
            }
            
            container.innerHTML = `
                <div class="notification is-danger">
                    <p>${errorMessage}</p>
                    <p>Détails de l'erreur : ${error.message}</p>
                    <p>Si le problème persiste, veuillez :</p>
                    <ul>
                        <li>Réessayer dans quelques minutes</li>
                        <li>Utiliser un autre nom de ville</li>
                        <li>Contacter le support si le problème persiste</li>
                    </ul>
                </div>
            `;
        }
    },

    analyserDonnees: function(equipements, communeField) {
        // Créer un Set pour les sports uniques
        const sportsSet = new Set();
        
        // Trouver les champs pour les coordonnées et le type de sport
        const firstEquip = equipements[0];
        const coordFields = Object.keys(firstEquip).filter(field => 
            field.toLowerCase().includes('lat') || 
            field.toLowerCase().includes('lon')
        );
        const sportField = Object.keys(firstEquip).find(field => 
            field.toLowerCase().includes('type') || 
            field.toLowerCase().includes('sport')
        );
        const clubField = Object.keys(firstEquip).find(field => 
            field.toLowerCase().includes('club') || 
            field.toLowerCase().includes('inscrit')
        );

        console.log("Champs trouvés:", {
            coordonnees: coordFields,
            sport: sportField,
            club: clubField
        });
        
        // Compter les équipements avec coordonnées
        const avecCoords = equipements.filter(equip => 
            coordFields.every(field => equip[field] && !isNaN(parseFloat(equip[field])))
        ).length;

        // Compter les équipements avec clubs
        const avecClubs = clubField ? 
            equipements.filter(equip => equip[clubField]).length : 0;

        // Collecter tous les sports uniques
        if (sportField) {
            equipements.forEach(equip => {
                if (equip[sportField]) {
                    sportsSet.add(equip[sportField]);
                }
            });
        }

        return {
            total: equipements.length,
            avecCoords,
            avecClubs,
            sportsUniques: Array.from(sportsSet).sort()
        };
    },

    processSports: function(datas, communeField, codePostal) {
        // Créer un Set pour stocker les sports uniques
        const sportsSet = new Set();
        const equipementsParSport = new Map();

        // Filtrer les résultats par code postal si nécessaire
        const results = codePostal ? 
            datas.results.filter(item => item.inst_cp === codePostal) : 
            datas.results;

        // Créer un Map pour stocker les équipements uniques par sport
        const equipementsUniques = new Map();

        // Parcourir les résultats pour extraire les sports uniques et gérer les doublons
        results.forEach(data => {
            const sportType = data.equip_type_name;
            if (sportType) {
                sportsSet.add(sportType);
                
                // Utiliser equip_numero comme clé unique
                const equipKey = data.equip_numero;
                
                if (!equipementsUniques.has(equipKey)) {
                    // Si c'est un nouvel équipement, l'ajouter
                    equipementsUniques.set(equipKey, {
                        ...data,
                        sports: new Set([sportType])
                    });
                } else {
                    // Si l'équipement existe déjà, ajouter le sport à la liste des sports
                    const equip = equipementsUniques.get(equipKey);
                    equip.sports.add(sportType);
                }
            }
        });

        // Organiser les équipements par sport
        equipementsUniques.forEach((equip, equipKey) => {
            // Pour chaque sport de l'équipement
            equip.sports.forEach(sportType => {
                if (!equipementsParSport.has(sportType)) {
                    equipementsParSport.set(sportType, []);
                }
                // Ajouter l'équipement à la liste du sport s'il n'y est pas déjà
                if (!equipementsParSport.get(sportType).some(e => e.equip_numero === equipKey)) {
                    equipementsParSport.get(sportType).push(equip);
                }
            });
        });

        // Convertir le Set en tableau et trier alphabétiquement
        const sportsList = Array.from(sportsSet).sort();

        // Afficher les résultats
        const containerPlace = document.querySelector('#results-container .container');
        const villeInfo = codePostal ? 
            `${datas.results[0][communeField]} (${codePostal})` : 
            datas.results[0][communeField];

        containerPlace.innerHTML += `
            <div class="content">
                <h3 class="title is-4">Sports disponibles à ${villeInfo}</h3>
                <div class="columns is-multiline">
                    ${sportsList.map(sport => {
                        const equipements = equipementsParSport.get(sport);
                        const equipementsUniques = [...new Set(equipements.map(e => e.equip_numero))].length;
                        
                        return `
                            <div class="column is-one-third">
                                <div class="card">
                                    <div class="card-content">
                                        <p class="title is-4">${sport}</p>
                                        <p class="subtitle is-6">
                                            ${equipementsUniques} équipement${equipementsUniques > 1 ? 's' : ''} unique${equipementsUniques > 1 ? 's' : ''} disponible${equipementsUniques > 1 ? 's' : ''}
                                        </p>
                                        <button class="button is-primary voir-plus is-fullwidth" data-sport="${sport}">
                                            <span>Voir les équipements</span>
                                            <span class="icon">
                                                <i class="fas fa-arrow-right"></i>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Ajouter les écouteurs d'événements pour les boutons
        containerPlace.querySelectorAll('.voir-plus').forEach(button => {
            button.addEventListener('click', (event) => {
                const sport = event.target.closest('.voir-plus').dataset.sport;
                const equipements = equipementsParSport.get(sport);
                // Filtrer les doublons avant d'afficher
                const equipementsUniques = Array.from(new Set(equipements.map(e => e.equip_numero)))
                    .map(numero => equipements.find(e => e.equip_numero === numero));
                this.showEquipementsList(sport, equipementsUniques);
            });
        });
    },

    showEquipementsList: function(sport, equipements) {
        const modal = document.getElementById("modal-template");
        if (!modal) {
            console.error("Modal non trouvée");
            return;
        }

        const modalTitle = modal.querySelector(".modal-card-title");
        const modalBody = modal.querySelector(".modal-card-body");
        const closeButton = modal.querySelector(".delete");
        const cancelButton = modal.querySelector(".fermer-modal");

        modalTitle.textContent = `Équipements pour ${sport}`;
        
        // Filtrer les équipements qui ont des coordonnées
        const equipementsAvecCoords = equipements.filter(equip => 
            equip.equip_coordonnees && 
            equip.equip_coordonnees.lat && 
            equip.equip_coordonnees.lon && 
            !isNaN(parseFloat(equip.equip_coordonnees.lat)) && 
            !isNaN(parseFloat(equip.equip_coordonnees.lon))
        );

        // Fonction pour extraire et formater les informations des clubs
        const extraireClubs = (equip) => {
            let clubs = [];
            try {
                // Essayer de parser les données JSON
                if (typeof equip.equip_utilisateur === 'string') {
                    // Nettoyer la chaîne avant de la parser
                    const cleanedString = equip.equip_utilisateur
                        .replace(/\\/g, '') // Enlever les backslashes
                        .replace(/^\[|\]$/g, ''); // Enlever les crochets au début et à la fin
                    
                    // Séparer les clubs s'ils sont dans un format comme "club1","club2"
                    if (cleanedString.includes('","')) {
                        clubs = cleanedString.split('","').map(club => 
                            club.replace(/^"|"$/g, '').trim() // Enlever les guillemets
                        );
                    } else {
                        // Si c'est un seul club
                        clubs = [cleanedString.replace(/^"|"$/g, '').trim()];
                    }
                } else if (Array.isArray(equip.equip_utilisateur)) {
                    // Si c'est déjà un tableau
                    clubs = equip.equip_utilisateur;
                }

                // Filtrer et nettoyer les clubs
                clubs = clubs
                    .filter(club => club && club.trim() !== '')
                    .map(club => {
                        // Nettoyer le nom du club
                        return club
                            .replace(/[\[\]"]/g, '') // Enlever les crochets et guillemets
                            .replace(/^Individuel\(s\),famille\(s\)$/i, '') // Enlever les mentions génériques
                            .trim();
                    })
                    .filter(club => club !== ''); // Enlever les chaînes vides après nettoyage

                // Si aucun club valide n'est trouvé, essayer d'autres champs
                if (clubs.length === 0) {
                    // Chercher dans d'autres champs potentiels
                    const autresChamps = [
                        equip.equip_nom,
                        equip.inst_nom,
                        equip.equip_prop_nom
                    ].filter(Boolean);

                    if (autresChamps.length > 0) {
                        clubs = autresChamps;
                    }
                }

                return clubs;
            } catch (e) {
                console.error("Erreur lors de l'extraction des clubs:", e);
                return [];
            }
        };

        // Filtrer les équipements avec des informations de clubs
        const equipementsAvecClubs = equipements.filter(equip => {
            const clubs = extraireClubs(equip);
            return clubs.length > 0;
        });

        modalBody.innerHTML = `
            <div class="content">
                <div class="tabs is-boxed mb-4">
                    <ul>
                        <li class="is-active"><a data-tab="liste">Liste des équipements</a></li>
                        <li><a data-tab="carte">Carte</a></li>
                        <li><a data-tab="clubs">Clubs</a></li>
                    </ul>
                </div>

                <div id="tab-liste" class="tab-content">
                    ${equipements.map(equip => {
                        const nom = equip.equip_nom || "Équipement sportif";
                        const adresse = equip.inst_adresse;
                        const codePostal = equip.inst_cp;
                        const commune = equip.new_name;
                        const coords = equip.equip_coordonnees;
                        const sports = Array.from(equip.sports || [equip.equip_type_name]).join(', ');

                        const adresseComplete = [
                            adresse,
                            codePostal,
                            commune
                        ].filter(Boolean).join(", ");

                        const coordonnees = coords && coords.lat && coords.lon ? 
                            `<p>
                                <strong>Coordonnées GPS:</strong><br>
                                Latitude: ${coords.lat}<br>
                                Longitude: ${coords.lon}
                                <a href="https://www.google.com/maps?q=${coords.lat},${coords.lon}" 
                                   target="_blank" rel="noopener" class="button is-small is-info ml-2">
                                    <span class="icon">
                                        <i class="fas fa-map-marker-alt"></i>
                                    </span>
                                    <span>Voir sur Google Maps</span>
                                </a>
                            </p>` : '';

                        return `
                            <div class="card mb-4">
                                <div class="card-content">
                                    <p class="title is-5">${nom}</p>
                                    <p class="subtitle is-6">${adresseComplete}</p>
                                    <p><strong>Sports pratiqués :</strong> ${sports}</p>
                                    ${coordonnees}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div id="tab-carte" class="tab-content" style="display: none;">
                    ${equipementsAvecCoords.length > 0 ? 
                        `<div id="map" style="height: 500px; width: 100%;"></div>` :
                        `<div class="notification is-warning">
                            <p>Aucune donnée de localisation disponible pour ces équipements.</p>
                        </div>`
                    }
                </div>

                <div id="tab-clubs" class="tab-content" style="display: none;">
                    ${equipementsAvecClubs.length > 0 ? 
                        equipementsAvecClubs.map(equip => {
                            const clubs = extraireClubs(equip);
                            
                            return `
                                <div class="card mb-4">
                                    <div class="card-content">
                                        <p class="title is-5">${equip.equip_nom || "Équipement sportif"}</p>
                                        <div class="content">
                                            <p class="subtitle is-6">
                                                ${equip.inst_adresse || ''} 
                                                ${equip.inst_cp || ''} 
                                                ${equip.new_name || ''}
                                            </p>
                                            <div class="box">
                                                <h6 class="title is-6">Clubs et associations :</h6>
                                                <div class="tags are-medium">
                                                    ${clubs.map(club => `
                                                        <span class="tag is-primary is-light">
                                                            ${club}
                                                        </span>
                                                    `).join('')}
                                                </div>
                                            </div>
                                            ${equip.equip_type_name ? `
                                                <div class="box">
                                                    <h6 class="title is-6">Type d'équipement :</h6>
                                                    <span class="tag is-info is-light">${equip.equip_type_name}</span>
                                                </div>
                                            ` : ''}
                                            ${equip.equip_gest_type ? `
                                                <div class="box">
                                                    <h6 class="title is-6">Gestion :</h6>
                                                    <span class="tag is-warning is-light">${equip.equip_gest_type}</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') :
                        `<div class="notification is-warning">
                            <p>Aucune information sur les clubs n'est disponible pour ces équipements.</p>
                            <p>Vous pouvez contacter la mairie ou l'office de tourisme pour plus d'informations.</p>
                        </div>`
                    }
                </div>
            </div>
        `;

        // Gestionnaires d'événements pour les onglets
        const tabs = modalBody.querySelectorAll('.tabs a');
        const tabContents = modalBody.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.dataset.tab;
                
                // Mettre à jour les onglets
                tabs.forEach(t => t.parentElement.classList.remove('is-active'));
                e.target.parentElement.classList.add('is-active');
                
                // Afficher le contenu correspondant
                tabContents.forEach(content => {
                    content.style.display = content.id === `tab-${target}` ? 'block' : 'none';
                });

                // Si on affiche la carte, l'initialiser
                if (target === 'carte') {
                    this.initializeMap(equipementsAvecCoords);
                }
            });
        });

        // Gestionnaires d'événements pour la modal
        const closeModal = () => {
            modal.classList.remove("is-active");
        };

        closeButton.onclick = closeModal;
        cancelButton.onclick = closeModal;
        modal.querySelector(".modal-background").onclick = closeModal;

        modal.classList.add("is-active");
    },

    initializeMap: function(equipements) {
        // Vérifier si Leaflet est déjà chargé
        if (typeof L === 'undefined') {
            // Charger Leaflet CSS
            const leafletCSS = document.createElement('link');
            leafletCSS.rel = 'stylesheet';
            leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
            document.head.appendChild(leafletCSS);

            // Charger Leaflet JS
            const leafletScript = document.createElement('script');
            leafletScript.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
            leafletScript.onload = () => this.createMap(equipements);
            document.head.appendChild(leafletScript);
        } else {
            this.createMap(equipements);
        }
    },

    createMap: function(equipements) {
        // Créer la carte avec les coordonnées du premier équipement
        const firstEquip = equipements[0];
        const coords = firstEquip.equip_coordonnees;
        const map = L.map('map').setView([coords.lat, coords.lon], 13);

        // Ajouter le fond de carte OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Ajouter les marqueurs pour chaque équipement
        equipements.forEach(equip => {
            const coords = equip.equip_coordonnees;
            if (coords && coords.lat && coords.lon) {
                const marker = L.marker([coords.lat, coords.lon]).addTo(map);
                
                const adresseComplete = [
                    equip.inst_adresse,
                    equip.inst_cp,
                    equip.new_name
                ].filter(Boolean).join(", ");

                const popupContent = `
                    <div class="has-text-left">
                        <p class="has-text-weight-bold">${equip.equip_nom || "Équipement sportif"}</p>
                        <p>${adresseComplete}</p>
                    </div>
                `;

                marker.bindPopup(popupContent);
            }
        });

        // Ajuster la vue pour montrer tous les marqueurs
        if (equipements.length > 1) {
            const bounds = L.latLngBounds(
                equipements
                    .filter(equip => equip.equip_coordonnees && equip.equip_coordonnees.lat && equip.equip_coordonnees.lon)
                    .map(equip => [equip.equip_coordonnees.lat, equip.equip_coordonnees.lon])
            );
            map.fitBounds(bounds);
        }
    }
}; 

// Ajouter le code pour initialiser le formulaire avec les nouveaux champs
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector("#filter");
    if (form) {
        // Ajouter le champ de type de recherche s'il n'existe pas déjà
        if (!form.querySelector('input[name="searchType"]')) {
            const searchTypeInput = document.createElement('input');
            searchTypeInput.type = 'hidden';
            searchTypeInput.name = 'searchType';
            searchTypeInput.value = 'ville'; // Valeur par défaut
            form.appendChild(searchTypeInput);
        }

        // Modifier le champ de recherche pour gérer l'autocomplétion
        const searchInput = form.querySelector('input[name="ville"]');
        if (searchInput) {
            // Ajouter un placeholder explicatif
            searchInput.placeholder = "Entrez un nom de ville ou un code postal (5 chiffres)";
            
            // Ajouter un écouteur pour détecter si c'est un code postal
            searchInput.addEventListener('input', function(e) {
                const value = e.target.value.trim();
                const searchTypeInput = form.querySelector('input[name="searchType"]');
                
                // Si c'est un code postal (5 chiffres), changer le type de recherche
                if (/^\d{5}$/.test(value)) {
                    searchTypeInput.value = 'postal';
                } else {
                    searchTypeInput.value = 'ville';
                }
            });
        }
    }
}); 
