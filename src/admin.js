import { db, auth, provider } from './firebase.js';
import { collection, addDoc, updateDoc, doc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Vercel Web Analytics
import { inject } from '@vercel/analytics';

// Inject Vercel Analytics
inject();
const ALLOWED_EMAIL = 'vyhlidkavseruby@gmail.com';

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    const loginPanel = document.getElementById('login-panel');
    const adminPanel = document.getElementById('admin-panel');
    const userEmailSpan = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
        if (user.email === ALLOWED_EMAIL) {
            // Správný uživatel
            loginPanel.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            userEmailSpan.textContent = user.email;
            userEmailSpan.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');

            // Načtení dat pro editaci
            loadAdminProjects();
            loadAdminArticles();
            loadAdminMessages();
            loadAdminTestimonials();
        } else {
            // Špatný e-mail - odhlásit
            alert(`Přístup odepřen. Účet ${user.email} nemá oprávnění k administraci.`);
            signOut(auth);
        }
    } else {
        // Nikdo není přihlášen
        loginPanel.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        userEmailSpan.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
});

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Chyba při přihlášení:", error);
        alert("Chyba při přihlášení: " + error.message);
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});

// Tab switching
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.style.display = 'none');

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        document.getElementById(targetId).style.display = 'block';
    });
});

// Zobrazování URL pole jen pro kategorii Kód
const pCat = document.getElementById('p-category');
const pUrlGroup = document.getElementById('p-url-group');
if (pCat && pUrlGroup) {
    pCat.addEventListener('change', (e) => {
        if (e.target.value === 'code') {
            pUrlGroup.classList.remove('hidden');
        } else {
            pUrlGroup.classList.add('hidden');
        }
    });
}

// Projekt Add / Edit
const projForm = document.getElementById('project-form');
projForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pid = document.getElementById('p-id').value;
    const title = document.getElementById('p-title').value;
    const desc = document.getElementById('p-desc').value;
    const category = document.getElementById('p-category').value;
    const linkUrl = document.getElementById('p-linkUrl').value;
    const imageFile = document.getElementById('p-image').files[0];

    // Změna textu tlačítka na loading
    const submitBtn = document.getElementById('p-submit-btn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = pid ? 'Aktualizuji...' : 'Nahrávám obrázek...';
    submitBtn.disabled = true;

    try {
        let imageUrl = '';
        if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);

            // Klíč získáváme z proměnné prostředí, nikoliv přímo z kódu
            const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Chyba při nahrávání na ImgBB.");

            const data = await response.json();
            imageUrl = data.data.url;
            submitBtn.innerText = 'Ukládám do DB...';
        }

        const projectData = {
            title,
            desc,
            category,
            linkUrl: category === 'code' ? linkUrl : ''
        };
        if (imageUrl) projectData.imageUrl = imageUrl;

        if (pid) {
            await updateDoc(doc(db, "projects", pid), projectData);
            document.getElementById('p-msg').innerText = "Reference upravena.";
        } else {
            projectData.createdAt = new Date();
            await addDoc(collection(db, "projects"), projectData);
            document.getElementById('p-msg').innerText = "Reference uložena.";
        }

        resetProjectForm();
        loadAdminProjects();

        const msg = document.getElementById('p-msg');
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 3000);

    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Chyba při ukládání do DB: " + e.message);
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

function resetProjectForm() {
    projForm.reset();
    document.getElementById('p-id').value = '';
    document.getElementById('p-submit-btn').innerText = 'Uložit referenci';
    document.getElementById('p-cancel-btn').classList.add('hidden');
    document.getElementById('p-url-group').classList.add('hidden');
}

document.getElementById('p-cancel-btn').addEventListener('click', resetProjectForm);

async function loadAdminProjects() {
    const list = document.getElementById('p-list');
    list.innerHTML = '<p class="text-[10px] mono text-gray-500 py-2">Načítám...</p>';
    try {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-zinc-800/30 p-3 mb-2 rounded border border-white/5";
            div.innerHTML = `
                <div class="truncate mr-4 flex-grow">
                    <span class="text-xs uppercase mono text-[var(--accent)] mr-2">${data.category}</span>
                    <span class="font-bold text-sm text-white">${data.title}</span>
                </div>
                <div class="flex gap-4">
                    <button class="text-xs text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-widest mono edit-btn">Upravit</button>
                    <button class="text-xs text-red-500 hover:text-red-400 transition-colors uppercase font-bold tracking-widest mono del-btn">Smazat</button>
                </div>
            `;
            list.appendChild(div);

            div.querySelector('.edit-btn').addEventListener('click', () => {
                document.getElementById('p-id').value = d.id;
                document.getElementById('p-title').value = data.title;
                document.getElementById('p-desc').value = data.desc;
                document.getElementById('p-category').value = data.category;
                document.getElementById('p-linkUrl').value = data.linkUrl || '';

                if (data.category === 'code') {
                    document.getElementById('p-url-group').classList.remove('hidden');
                } else {
                    document.getElementById('p-url-group').classList.add('hidden');
                }

                document.getElementById('p-submit-btn').innerText = "Uložit změny";
                document.getElementById('p-cancel-btn').classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            div.querySelector('.del-btn').addEventListener('click', async () => {
                if (confirm('Opravdu chcete smazat projekt: ' + data.title + '?')) {
                    await deleteDoc(doc(db, "projects", d.id));
                    loadAdminProjects();
                }
            });
        });
        if (snap.empty) list.innerHTML = '<p class="text-[10px] mono text-gray-500 py-2">Žádné reference.</p>';
    } catch (e) { console.error(e); }
}

// Article Add / Edit
const artForm = document.getElementById('article-form');
artForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const aid = document.getElementById('a-id').value;
    const title = document.getElementById('a-title').value;
    const readTime = document.getElementById('a-readTime').value;
    const date = document.getElementById('a-date').value;
    const category = document.getElementById('a-category').value;
    const content = document.getElementById('a-content').value;

    const submitBtn = document.getElementById('a-submit-btn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Ukládám článek...';
    submitBtn.disabled = true;

    try {
        const articleData = {
            title,
            readTime: parseInt(readTime),
            date,
            category,
            content
        };

        if (aid) {
            await updateDoc(doc(db, "articles", aid), articleData);
            document.getElementById('a-msg').innerText = "Článek upraven.";
        } else {
            articleData.createdAt = new Date();
            await addDoc(collection(db, "articles"), articleData);
            document.getElementById('a-msg').innerText = "Článek uložen.";
        }

        resetArticleForm();
        loadAdminArticles();

        const msg = document.getElementById('a-msg');
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 3000);

    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Chyba při ukládání do DB: " + e.message);
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

function resetArticleForm() {
    artForm.reset();
    document.getElementById('a-id').value = '';
    document.getElementById('a-submit-btn').innerText = 'Uložit článek';
    document.getElementById('a-cancel-btn').classList.add('hidden');
}

document.getElementById('a-cancel-btn').addEventListener('click', resetArticleForm);

async function loadAdminArticles() {
    const list = document.getElementById('a-list');
    list.innerHTML = '<p class="text-[10px] mono text-gray-500 py-2">Načítám...</p>';
    try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-zinc-800/30 p-3 mb-2 rounded border border-white/5";
            div.innerHTML = `
                <div class="truncate mr-4 flex-grow">
                    <span class="text-xs uppercase mono text-gray-500 mr-2">${data.date}</span>
                    <span class="font-bold text-sm text-white">${data.title}</span>
                    <span class="text-[10px] ml-2 px-2 py-0.5 rounded bg-zinc-700 text-gray-300 mono">${data.category || 'Neznámá'}</span>
                </div>
                <div class="flex gap-4">
                    <button class="text-xs text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-widest mono edit-btn">Upravit</button>
                    <button class="text-xs text-red-500 hover:text-red-400 transition-colors uppercase font-bold tracking-widest mono del-btn">Smazat</button>
                </div>
            `;
            list.appendChild(div);

            div.querySelector('.edit-btn').addEventListener('click', () => {
                document.getElementById('a-id').value = d.id;
                document.getElementById('a-title').value = data.title;
                document.getElementById('a-readTime').value = data.readTime;
                document.getElementById('a-date').value = data.date;
                if (data.category) document.getElementById('a-category').value = data.category;
                document.getElementById('a-content').value = data.content;
                document.getElementById('a-content').value = data.content;

                document.getElementById('a-submit-btn').innerText = "Uložit změny";
                document.getElementById('a-cancel-btn').classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            div.querySelector('.del-btn').addEventListener('click', async () => {
                if (confirm('Opravdu chcete smazat článek: ' + data.title + '?')) {
                    await deleteDoc(doc(db, "articles", d.id));
                    loadAdminArticles();
                }
            });
        });
        if (snap.empty) list.innerHTML = '<p class="text-[10px] mono text-gray-500 py-2">Žádné články.</p>';
    } catch (e) { console.error(e); }
}

async function loadAdminMessages() {
    const list = document.getElementById('m-list');
    list.innerHTML = '<p class="text-[10px] mono text-gray-500 py-2">Načítám zprávy...</p>';
    try {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const div = document.createElement('div');
            div.className = "bg-zinc-800/30 p-4 mb-3 rounded border border-white/5 relative group";

            let dateStr = "Neznámé datum";
            if (data.createdAt) {
                const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                dateStr = dateObj.toLocaleString('cs-CZ');
            }

            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-xs uppercase mono text-[var(--accent)] mr-2 font-bold">${data.email || 'Bez e-mailu'}</span>
                        <span class="text-[10px] mono text-gray-500">${dateStr}</span>
                    </div>
                    <button class="text-xs text-red-500 hover:text-red-400 transition-colors uppercase font-bold tracking-widest mono del-btn opacity-0 group-hover:opacity-100">Smazat</button>
                </div>
                <p class="text-sm text-gray-300 whitespace-pre-wrap">${data.message || ''}</p>
            `;
            list.appendChild(div);

            div.querySelector('.del-btn').addEventListener('click', async () => {
                if (confirm('Opravdu chcete tuto zprávu trvale smazat?')) {
                    await deleteDoc(doc(db, "messages", d.id));
                    loadAdminMessages();
                }
            });
        });
        if (snap.empty) list.innerHTML = '<p class="text-[10px] mono text-gray-500 py-2">Nemáte žádné nové zprávy.</p>';
    } catch (e) { console.error(e); }
}

// Call initial data loads
loadAdminProjects();
loadAdminArticles();
loadAdminMessages();
loadAdminTestimonials();


// ============================================
// HODNOCENÍ (TESTIMONIALS)
// ============================================

const testForm = document.getElementById('testimonial-form');
if (testForm) {
    testForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tId = document.getElementById('t-id').value;
        const name = document.getElementById('t-name').value;
        const role = document.getElementById('t-role').value;
        const text = document.getElementById('t-text').value;

        const submitBtn = document.getElementById('t-submit-btn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Ukládám hodnocení...';
        submitBtn.disabled = true;

        try {
            if (tId) {
                await updateDoc(doc(db, "testimonials", tId), {
                    name,
                    role,
                    text
                });
            } else {
                await addDoc(collection(db, "testimonials"), {
                    name,
                    role,
                    text,
                    createdAt: new Date()
                });
            }

            resetTestimonialForm();
            loadAdminTestimonials();

            const msg = document.getElementById('t-msg');
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('hidden'), 3000);

        } catch (e) {
            console.error("Chyba při ukládání hodnocení: ", e);
            alert("Chyba: " + e.message);
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

function resetTestimonialForm() {
    if (testForm) testForm.reset();
    document.getElementById('t-id').value = '';
    document.getElementById('t-submit-btn').innerText = 'Uložit hodnocení';
    document.getElementById('t-cancel-btn').classList.add('hidden');
}

const tCancel = document.getElementById('t-cancel-btn');
if (tCancel) tCancel.addEventListener('click', resetTestimonialForm);

async function loadAdminTestimonials() {
    const list = document.getElementById('t-list');
    if (!list) return;
    list.innerHTML = '<p class="text-[10px] mono text-gray-500 py-2">Načítám hodnocení...</p>';

    try {
        const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-zinc-800/30 p-3 mb-2 rounded border border-white/5";
            div.innerHTML = `
                <div class="truncate mr-4 flex-grow">
                    <span class="font-bold text-sm text-white">${data.name}</span>
                    <span class="text-xs uppercase mono text-gray-500 ml-2">${data.role}</span>
                </div>
                <div class="flex gap-4">
                    <button class="text-xs text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-widest mono edit-btn">Upravit</button>
                    <button class="text-xs text-red-500 hover:text-red-400 transition-colors uppercase font-bold tracking-widest mono del-btn">Smazat</button>
                </div>
            `;
            list.appendChild(div);

            div.querySelector('.edit-btn').addEventListener('click', () => {
                document.getElementById('t-id').value = d.id;
                document.getElementById('t-name').value = data.name;
                document.getElementById('t-role').value = data.role;
                document.getElementById('t-text').value = data.text;

                document.getElementById('t-submit-btn').innerText = "Uložit změny";
                document.getElementById('t-cancel-btn').classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            div.querySelector('.del-btn').addEventListener('click', async () => {
                if (confirm('Opravdu chcete smazat hodnocení od: ' + data.name + '?')) {
                    await deleteDoc(doc(db, "testimonials", d.id));
                    loadAdminTestimonials();
                }
            });
        });
        if (snap.empty) list.innerHTML = '<p class="text-[10px] mono text-gray-500 py-2">Zatím nemáte žádná hodnocení.</p>';
    } catch (e) { console.error(e); }
}
