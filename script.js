const USER = "midnights-bloom";
const REPO = "midnights.bloom-gallery";
const ROOT = "Assets";
 
const gallery = document.getElementById("gallery");
const back = document.getElementById("back");

let currentPath = ROOT;
let history = [];

let currentImages = [];
let currentImageIndex = 0;
const prevImage = document.getElementById("prevImage");
const nextImage = document.getElementById("nextImage");
const breadcrumb = document.getElementById("breadcrumb");

async function getFolder(path){
    try {
        const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${path}`;
        const res = await fetch(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
} 

function showFolders(folders){
    folders.forEach(folder => {
        const card = document.createElement("div");
        card.className = "folder";
        card.setAttribute("data-name", folder.name.toLowerCase());
        card.innerHTML = `
        <img class="folder-icon" src="./Pngs/folder.png" alt="folder">
        <div class="name">${folder.name}</div>
    `;

        card.onclick = () => {
            history.push(currentPath);
            currentPath = folder.path;
            window.location.hash = folder.path;
            loadFolder(currentPath);
        };

        gallery.appendChild(card);
    });
}

function showImages(images){
    images.forEach(image => {
        const isAvatarFolder = currentPath.toLowerCase().includes('avatars');
        const isGif = image.name.toLowerCase().endsWith('.gif') && !isAvatarFolder;
        const isCrackship = currentPath.toLowerCase().includes('crackships');
     
        const card = document.createElement("div");
        card.className = "icon";
        card.innerHTML = `
            <img class="${isGif ? 'gif-img' : ''} ${isCrackship ? 'crackship-img' : ''}" src="${image.download_url}" alt="">
            <button class="copy" title="Copier l'URL">⧉</button>
        `;
        const button = card.querySelector(".copy");
        const img = card.querySelector("img");

        img.onclick = () => {
            currentImageIndex = images.indexOf(image);
            openPreview();
        };

        button.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(image.download_url);
            button.textContent = "✓";
            setTimeout(() => {
                button.textContent = "⧉";
            }, 1000);
        };
        gallery.appendChild(card);
    });
}

async function loadFolder(path){
    gallery.innerHTML = "";

    const files = await getFolder(path);

    const folders = files.filter(f => f.type === "dir");

    // Tri strict et propre pour les dossiers du plus récent au plus ancien
    folders.sort((a, b) => {
        const numA = parseInt((a.name.match(/\d+/) || [0])[0], 10);
        const numB = parseInt((b.name.match(/\d+/) || [0])[0], 10);
        return numB - numA;
    });

    const images = files.filter(
        f => f.type === "file" && /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.name)
    );

    // Tri strict et propre pour les images
    images.sort((a, b) => {
        const numA = parseInt((a.name.match(/\d+/) || [0])[0], 10);
        const numB = parseInt((b.name.match(/\d+/) || [0])[0], 10);
        return numB - numA;
    });

    currentImages = images;

    showFolders(folders);
    showImages(images);

    if(path !== ROOT){
        back.classList.remove("hidden");
    }else{
        back.classList.add("hidden");
    }

    updateBreadcrumb(path);

    // Gestion de l'affichage du bloc de recherche (uniquement à la racine du dossier Avatars)
    const searchWrapper = document.getElementById('searchWrapper');
    const searchInput = document.getElementById('folderSearch');
    if (searchWrapper && searchInput) {
       // NOUVEAU CODE (Avatars + Crackships) :
const parts = path.split("/");
const rootFolderName = parts[1] ? parts[1].toLowerCase() : "";
const isAvatarsOrCrackships = parts.length === 2 && parts[0].toLowerCase() === "assets" && (rootFolderName === "avatars" || rootFolderName === "crackships");

if (isAvatarsOrCrackships) {
    searchWrapper.style.display = "block";
    searchInput.value = "";
    filterFolders(); // Réinitialise le filtre
} else {
    searchWrapper.style.display = "none";
}
    }
}

back.onclick = () => {
    if (history.length > 0) {
        currentPath = history.pop();
    } else {
        currentPath = ROOT;
    }
    window.location.hash = currentPath === ROOT ? "" : currentPath;
    loadFolder(currentPath);
};

const preview = document.getElementById("preview");
const previewImage = document.getElementById("previewImage");

function openPreview(){
    if(!preview || !previewImage) return;

    previewImage.src = currentImages[currentImageIndex].download_url;

    preview.classList.remove("hidden", "hide");

    requestAnimationFrame(() => {
        preview.classList.add("show");
    });
}

function hidePreview(){
    if(!preview || !previewImage) return;

    preview.classList.remove("show");
    preview.classList.add("hide");

    setTimeout(() => {
        preview.classList.add("hidden");
        preview.classList.remove("hide");
        previewImage.src = "";
    }, 250);
}

if(preview){
    preview.onclick = (e) => {
        if(e.target === preview){
            hidePreview();
        }
    };
}

prevImage.onclick = (e) => {
    e.stopPropagation();
    showImage(currentImageIndex - 1);
};

nextImage.onclick = (e) => {
    e.stopPropagation();
    showImage(currentImageIndex + 1);
};

function showImage(index){
    if(index < 0){
        index = currentImages.length - 1;
    }else if(index >= currentImages.length){
        index = 0;
    }

    currentImageIndex = index;
    previewImage.src = currentImages[currentImageIndex].download_url;
}

function updateBreadcrumb(path){
    if(!breadcrumb) return;

    const parts = path.split("/");

    if(parts[0] === ROOT){
        parts.shift();
    }

    breadcrumb.textContent = parts.length ? parts.join(" / ") : "accueil";
}

function filterFolders() {
    const input = document.getElementById('folderSearch').value.toLowerCase().trim();
    const folderCards = document.querySelectorAll('.folder');
    const isCrackshipFolder = currentPath.toLowerCase().includes('crackships');

    folderCards.forEach(card => {
        const name = card.getAttribute('data-name'); // ex: "casey & hilary" ou "michael b. jordan"
        
        let isMatch = false;

        if (isCrackshipFolder) {
            // Dans Crackships : regarde si UN des mots/prénoms commence par la recherche
            // Ex: "hilary" trouvera "Casey & Hilary" parce que le mot "Hilary" commence par "hilary"
            const words = name.split(/[\s&_]+/).filter(Boolean);
            isMatch = words.some(word => word.startsWith(input));
        } else {
            // Dans Avatars : cherche strictement au début du nom complet
            isMatch = name.startsWith(input);
        }

        if (input === "" || isMatch) {
            card.style.display = ""; 
        } else {
            card.style.display = "none"; 
        }
    });
}

async function initFromHash() {
    const hash = decodeURIComponent(window.location.hash.substring(1));
    if (!hash || !hash.toLowerCase().startsWith(ROOT.toLowerCase())) {
        loadFolder(ROOT);
        return;
    }

    const segments = hash.split("/");
    let pathAcc = segments[0];
    let foundError = false;
    
    for (let i = 1; i < segments.length; i++) {
        const files = await getFolder(pathAcc);
        const targetSegment = segments[i].toLowerCase();
        const found = files.find(f => f.type === "dir" && f.name.toLowerCase() === targetSegment);
        
        if (found) {
            pathAcc = found.path;
        } else {
            foundError = true;
            break;
        }
    }

    if (foundError) {
        currentPath = ROOT;
        window.location.hash = "";
    } else {
        currentPath = pathAcc;
    }
    
    loadFolder(currentPath);
}
                 
initFromHash();
