import { db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const container = document.getElementById('article-container');

    if (!id) {
        container.innerHTML = '<h2 class="text-2xl font-bold text-red-500">Článek nebyl nalezen (chybí ID).</h2>';
        return;
    }

    try {
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // Převedení MD na HTML, pokud existuje marked.js
            const htmlContent = window.marked && data.content
                ? marked.parse(data.content)
                : (data.content || '<p>Žádný obsah.</p>');

            // Dynamické SEO tagy
            document.title = `${data.title} | Pavlusha.art`;

            // Vygenerování krátkého popisu z obsahu, pokud není explicitně zadán desc
            const rawText = htmlContent.replace(/<[^>]*>?/gm, ''); // odstranění HTML tagů
            const shortDesc = rawText.length > 150 ? rawText.substring(0, 147) + '...' : rawText;
            const metaDesc = data.desc || shortDesc || `${data.title} na blogu Zápisky z úlu.`;

            const metaDescriptionTag = document.querySelector('meta[name="description"]');
            if (metaDescriptionTag) metaDescriptionTag.setAttribute("content", metaDesc);

            const ogTitleTag = document.querySelector('meta[property="og:title"]');
            if (ogTitleTag) ogTitleTag.setAttribute("content", `${data.title} | Pavlusha.art`);

            const ogDescTag = document.querySelector('meta[property="og:description"]');
            if (ogDescTag) ogDescTag.setAttribute("content", metaDesc);

            container.innerHTML = `
                <div class="mb-10">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="text-xs mono text-[var(--accent)] font-bold uppercase tracking-widest">${data.date}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 mono uppercase tracking-widest hidden sm:inline-block">${data.category || 'Článek'}</span>
                        <span class="text-xs mono text-gray-500 uppercase tracking-widest">· ${data.readTime} min čtení</span>
                    </div>
                    <h1 class="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">${data.title}<span class="accent-text sq-dot">.</span></h1>
                </div>
                
                <div class="article-content text-lg font-light">
                    ${htmlContent}
                </div>
            `;
        } else {
            container.innerHTML = '<h2 class="text-2xl font-bold text-red-500">Článek neexistuje.</h2>';
        }
    } catch (e) {
        console.error("Chyba při načítání článku:", e);
        container.innerHTML = '<h2 class="text-2xl font-bold text-red-500">Nastala chyba při načítání článku z databáze.</h2>';
    }
});
