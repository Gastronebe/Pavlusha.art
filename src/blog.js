import { db } from './firebase.js';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

// Vercel Web Analytics
import { inject } from '@vercel/analytics';

// Inject Vercel Analytics
inject();

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const blogContainer = document.getElementById('blog-container');
        blogContainer.innerHTML = '';

        if (querySnapshot.empty) {
            blogContainer.innerHTML = '<p class="text-sm text-gray-400">Zatím nejsou publikovány žádné články.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            const articleHtml = `
            <a href="article.html?id=${doc.id}" class="blog-row py-8 flex flex-col md:flex-row md:items-center justify-between group">
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

    } catch (e) {
        console.error("Chyba při načítání článků: ", e);
        const blogContainer = document.getElementById('blog-container');
        blogContainer.innerHTML = '<p class="text-sm text-red-500">Chyba při stahování dat ze serveru.</p>';
    }
});
