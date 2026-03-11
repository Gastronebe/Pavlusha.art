// Fixní barvy technologií pro stack strip
const techColors = {
    'HTML': '#E34F26',
    'CSS': '#1572B6',
    'JAVASCRIPT': '#F7DF1E',
    'NODE': '#339933',
    'TYPESCRIPT': '#3178C6',
    'ADOBE': '#FF0000',
    'GIT': '#F05032',
    'PHP': '#777BB4',
    'WORDPRESS': '#21759B'
};

const colors = {
    'code': '#00ffaa',
    'graphic': '#aa55ff',
    'photo': '#ffaa00'
};

export function styleDots() {
    // Stack strip dots - používají fixní barvy technologií
    const stackSpans = document.querySelectorAll('#stack-strip span');
    stackSpans.forEach(span => {
        const techName = span.innerText.trim();
        const color = techColors[techName] || '#ffffff';
        span.innerHTML = `<span class="sq-dot" style="color: ${color}; margin-right: 0.2em;">.</span>${techName}`;
    });

    // Project cards dots based on category
    const items = document.querySelectorAll('.grid-item');
    items.forEach(item => {
        const dot = item.querySelector('.sq-dot');
        if (dot) {
            if (item.classList.contains('code')) dot.style.color = colors.code;
            else if (item.classList.contains('graphic')) dot.style.color = colors.graphic;
            else if (item.classList.contains('photo')) dot.style.color = colors.photo;
        }
    });
}

export function filterWork(category) {
    const items = document.querySelectorAll('.grid-item');
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-cat') === category) {
            btn.classList.add('active');
        }
    });

    items.forEach(item => {
        if (category === 'all') {
            item.classList.remove('hidden-item');
        } else {
            if (item.classList.contains(category)) {
                item.classList.remove('hidden-item');
            } else {
                item.classList.add('hidden-item');
            }
        }
    });
}

// Při použití Vite jako module importu se event listenery definují trochu jinak
import { db } from './firebase.js';
import { collection, getDocs, orderBy, query, addDoc } from 'firebase/firestore';

window.addEventListener('DOMContentLoaded', () => {
    // Načteme data hned po startu
    loadProjects();
    loadArticles();
    loadTestimonials();
    initContactModal();

    // Propojení tlačítek filtrů
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterWork(e.target.getAttribute('data-cat'));
        });
    });
});

// Získání projektů z DB
async function loadProjects() {
    try {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const grid = document.getElementById('bento-grid');
        grid.innerHTML = ''; // Vyčistíme statické projekty

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Určení SVG ikony na základě kategorie
            let svgIcon = '';
            let catName = 'Kód';
            if (data.category === 'code') {
                svgIcon = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>';
            } else if (data.category === 'photo') {
                svgIcon = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>';
                catName = 'Foto';
            } else if (data.category === 'graphic') {
                svgIcon = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>';
                catName = 'Grafika';
            }

            // Odkaz na projekt (pouze u kódů)
            let linkIconHtml = '';
            if (data.category === 'code' && data.linkUrl) {
                const isGithub = data.linkUrl.includes('github.com');
                const svgPath = isGithub ?
                    '<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>'
                    : '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>';

                linkIconHtml = `
                <a href="${data.linkUrl}" target="_blank" class="absolute top-4 right-4 bg-zinc-800/80 hover:bg-[var(--accent)] hover:text-black p-2 rounded-full text-white transition-colors z-20">
                    <svg class="w-5 h-5" fill="${isGithub ? 'currentColor' : 'none'}" stroke="${isGithub ? 'none' : 'currentColor'}" viewBox="0 0 24 24">
                        ${svgPath}
                    </svg>
                </a>`;
            }

            // Určení zobrazení obálky (Obrázek nebo výchozí SVG)
            let imageContent = '';
            if (data.imageUrl) {
                imageContent = `<img src="${data.imageUrl}" alt="${data.title}" class="w-full h-full object-cover">`;
            } else {
                imageContent = `<div class="w-full h-full bg-zinc-800/50 flex items-center justify-center opacity-40">${svgIcon}</div>`;
            }

            // Lightbox data attributes
            const isClickableImage = data.category !== 'code' && data.imageUrl;
            const pointerClass = isClickableImage ? 'cursor-zoom-in' : '';

            const cardHtml = `
            <div class="grid-item reveal ${data.category} bento-card rounded-2xl p-6 flex flex-col group relative overflow-hidden">
                ${linkIconHtml}
                <div class="project-img-container ${pointerClass}" ${isClickableImage ? `data-lightbox-src="${data.imageUrl}" data-lightbox-title="${data.title}"` : ''}>
                    ${imageContent}
                </div>
                <div class="flex-grow mt-3">
                    <span class="text-[9px] font-bold uppercase tracking-widest mono block mb-2" style="color: ${colors[data.category]};">${catName}</span>
                    <h3 class="text-xl font-bold mb-3 project-title"><span class="sq-dot mr-1" style="color: ${colors[data.category]};">.</span>${data.title}</h3>
                    <p class="text-gray-400 text-[11px] leading-relaxed line-clamp-2">
                        ${data.desc}
                    </p>
                </div>
            </div>`;

            grid.insertAdjacentHTML('beforeend', cardHtml);
        });

        styleDots(); // Obarví tečky v stack strips nově pro js, jelikož stack strips stále máme. (Tečky pro projekty barvíme už v HTML tagu nahoře)

        // Inicializace Lightboxu
        initLightbox();

        // Reveal elementů po jejich vykreslení
        initReveal();

    } catch (e) {
        console.error("Chyba při načítání projektů: ", e);
    }
}

// Inicializace Lightbox overlaye
function initLightbox() {
    let overlay = document.getElementById('lightbox-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lightbox-overlay';
        overlay.className = 'fixed inset-0 bg-black/95 z-50 hidden flex flex-col items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm transition-opacity duration-300 opacity-0';
        overlay.innerHTML = `
            <img id="lightbox-img" src="" class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 scale-95">
            <p id="lightbox-caption" class="text-white mt-6 text-center font-bold tracking-widest uppercase mono text-sm"></p>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            overlay.classList.add('opacity-0');
            document.getElementById('lightbox-img').classList.replace('scale-100', 'scale-95');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        });
    }

    // Attach click events
    document.querySelectorAll('[data-lightbox-src]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const src = el.getAttribute('data-lightbox-src');
            const title = el.getAttribute('data-lightbox-title');

            document.getElementById('lightbox-img').src = src;
            document.getElementById('lightbox-caption').innerText = title;

            overlay.classList.remove('hidden');
            // Timeout to allow CSS transition to work
            requestAnimationFrame(() => {
                overlay.classList.remove('opacity-0');
                document.getElementById('lightbox-img').classList.replace('scale-95', 'scale-100');
            });
        });
    });
}

// Získání článků z DB
async function loadArticles() {
    try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const blogContainer = document.getElementById('blog-container');
        blogContainer.innerHTML = ''; // Vyčistíme starý statický obsah

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            const articleHtml = `
            <a href="article.html?id=${doc.id}" class="blog-row reveal py-8 flex flex-col md:flex-row md:items-center justify-between group">
                <div class="flex items-center gap-6">
                    <span class="text-[10px] mono text-gray-600">${data.date}</span>
                    <h3 class="text-xl md:text-2xl font-bold group-hover:text-white transition-colors flex items-center flex-wrap">
                        <span class="sq-dot blog-dot mr-2">.</span>${data.title}
                        <span class="text-[10px] ml-4 px-2 py-0.5 rounded border border-white/10 text-gray-400 mono uppercase tracking-widest hidden sm:inline-block">${data.category || 'Článek'}</span>
                    </h3>
                </div>
                <span class="text-[10px] mono text-gray-500 mt-2 md:mt-0 uppercase tracking-widest">${data.readTime} min čtení</span>
            </a>`;

            blogContainer.insertAdjacentHTML('beforeend', articleHtml);
        });

        // Reveal článků po jejich vykreslení
        initReveal();

    } catch (e) {
        console.error("Chyba při načítání článků: ", e);
    }
}

// Získání hodnocení (Testimonials) z DB
async function loadTestimonials() {
    try {
        const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const grid = document.getElementById('testimonials-grid');
        if (!grid) return;

        grid.innerHTML = '';

        let counter = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const delay = counter * 100;

            const tHtml = `
            <div class="bento-card reveal rounded-2xl p-6 flex flex-col justify-between" style="transition-delay: ${delay}ms">
                <div class="mb-6">
                    <svg class="w-8 h-8 text-[var(--accent)] opacity-20 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                    <p class="text-sm text-gray-300 leading-relaxed italic border-l-2 border-white/10 pl-4 py-1">"${data.text}"</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 text-[var(--accent)] font-bold mono">
                        ${data.name.charAt(0)}
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-white">${data.name}</h4>
                        <span class="text-[10px] mono uppercase text-gray-500 tracking-widest">${data.role}</span>
                    </div>
                </div>
            </div>`;

            grid.insertAdjacentHTML('beforeend', tHtml);
            counter++;
        });

        // Hiding the section if empty, or revealing items if not
        const section = document.getElementById('testimonials');
        if (querySnapshot.empty && section) {
            section.style.display = 'none';
        } else {
            initReveal();
        }

    } catch (e) {
        console.error("Chyba při načítání hodnocení: ", e);
    }
}

// Inicializace a obsluha kontaktního formuláře
function initContactModal() {
    const hireBtns = document.querySelectorAll('.open-contact-btn');
    const modal = document.getElementById('contact-modal');
    const closeBtn = document.getElementById('close-modal');
    const modalContent = document.getElementById('contact-modal-content');
    const form = document.getElementById('contact-form');

    if (!modal) return;

    // Otevření
    hireBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            requestAnimationFrame(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.replace('scale-95', 'scale-100');
            });
        });
    });

    // Zavření
    const closeModal = () => {
        modal.classList.add('opacity-0');
        modalContent.classList.replace('scale-100', 'scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            form.reset();
            document.getElementById('c-msg').classList.add('hidden');
            document.getElementById('c-err').classList.add('hidden');
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Odeslání
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('c-email').value;
        const message = document.getElementById('c-message').value;
        const submitBtn = document.getElementById('c-submit');

        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Odesílám...';
        submitBtn.disabled = true;

        try {
            await addDoc(collection(db, "messages"), {
                email,
                message,
                createdAt: new Date()
            });

            // MOŽNOST 2: Odeslání zprávy do CRM přes Webhook z adresy vytvořené v .env souboru (VITE_CRM_WEBHOOK_URL)
            const webhookUrl = import.meta.env.VITE_CRM_WEBHOOK_URL;
            if (webhookUrl) {
                try {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, message, source: 'Pavlusha.art Web' })
                    });
                } catch (webhookError) {
                    console.error("Chyba při volání CRM Webhooku:", webhookError);
                    // Záměrně neselháváme celý proces pro návštěvníka, zpráva už je ve Firebase
                }
            }

            form.reset();
            document.getElementById('c-msg').classList.remove('hidden');
            document.getElementById('c-err').classList.add('hidden');

            setTimeout(() => {
                closeModal();
            }, 3000);

        } catch (error) {
            console.error("Chyba při odesílání zprávy:", error);
            document.getElementById('c-err').classList.remove('hidden');
            document.getElementById('c-msg').classList.add('hidden');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Reveal on Scroll Inicializace
function initReveal() {
    const reveals = document.querySelectorAll('.reveal');

    if (reveals.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Pokud chceme, aby animace proběhla jen jednou, odpojíme sledování:
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1, // Spustit, když je 10% prvku vidět
        rootMargin: "0px 0px -50px 0px" // Začne animovat trošku dřív než je spodní okraj obrazovky
    });

    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
}
