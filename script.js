// =================================================================
// CÓDIGO COMPLETO E PRÉ-PREENCHIDO PARA O IMPULSO LOCAL
// VERSÃO FINAL - NÃO EDITE NADA, APENAS COPIE E COLE.
// =================================================================

const firebaseConfig = {
    apiKey: "AIzaSyASJiulMmARpo6Ec0h3eN5bj9UaEWdHfhE",
  authDomain: "zapymap.firebaseapp.com",
  projectId: "zapymap",
  storageBucket: "zapymap.firebasestorage.app",
  messagingSenderId: "517497705831",
  appId: "1:517497705831:web:2d38ba0f704d03d7928bc2"
};

const unsplashAccessKey = "CGYigQ8Iy6Vg8jIY9yQNZ62Jn5dMV9iYd4vqUIg-QR0";

try {
    const app = firebase.initializeApp(firebaseConfig);
    var auth = firebase.auth();
    var db = firebase.firestore();
    console.log("Firebase conectado com sucesso!");
} catch (e) {
    console.error("ERRO GRAVE: O objeto firebaseConfig está incorreto ou faltando.", e);
}

document.addEventListener('DOMContentLoaded', () => {

    const postTypeSelect = document.getElementById('post-type');
    const postTemplateTextarea = document.getElementById('post-template');
    const copyButton = document.getElementById('copy-button');
    const savePostButton = document.getElementById('save-post-button');
    const ideiaTexto = document.getElementById('ideia-texto');
    const novaIdeiaButton = document.getElementById('nova-ideia-button');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const imageResults = document.getElementById('image-results');
    const loadingMessage = document.getElementById('loading-message');
    const checklistItems = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    const authModal = document.getElementById('auth-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const authError = document.getElementById('auth-error');
    const userArea = document.getElementById('user-area');
    const savedPostsSection = document.getElementById('saved-posts-section');
    const savedPostsList = document.getElementById('saved-posts-list');

    let unsubscribeSavedPosts = null;

    function setupAuthListeners() {
        const openLoginBtn = document.getElementById('open-login-modal-button');
        if (openLoginBtn) openLoginBtn.addEventListener('click', () => authModal.style.display = 'flex');
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
    }

    if (closeModalButton) closeModalButton.addEventListener('click', () => authModal.style.display = 'none');
    if (window) window.addEventListener('click', (e) => e.target === authModal && (authModal.style.display = 'none'));
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginView.style.display = 'none'; registerView.style.display = 'block'; authError.textContent = ''; });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerView.style.display = 'none'; loginView.style.display = 'block'; authError.textContent = ''; });

    if (registerButton) registerButton.addEventListener('click', () => {
        const [email, password] = [registerEmailInput.value, registerPasswordInput.value];
        if (!email || !password) { authError.textContent = "Por favor, preencha todos os campos."; return; }
        auth.createUserWithEmailAndPassword(email, password).then(() => authModal.style.display = 'none').catch(err => authError.textContent = traduzirErroFirebase(err.code));
    });

    if (loginButton) loginButton.addEventListener('click', () => {
        const [email, password] = [loginEmailInput.value, loginPasswordInput.value];
        if (!email || !password) { authError.textContent = "Por favor, preencha todos os campos."; return; }
        auth.signInWithEmailAndPassword(email, password).then(() => authModal.style.display = 'none').catch(err => authError.textContent = traduzirErroFirebase(err.code));
    });

    function logout() { auth.signOut(); }

    auth.onAuthStateChanged(user => {
        if (user) {
            userArea.innerHTML = `<button id="logout-button">Sair (${user.email.split('@')[0]})</button>`;
            if (savePostButton) savePostButton.style.display = 'inline-block';
            if (savedPostsSection) savedPostsSection.style.display = 'block';
            carregarProgressoChecklist(user.uid);
            escutarPostsSalvos(user.uid);
        } else {
            userArea.innerHTML = `<button id="open-login-modal-button">Login</button>`;
            if (savePostButton) savePostButton.style.display = 'none';
            if (savedPostsSection) savedPostsSection.style.display = 'none';
            if (unsubscribeSavedPosts) unsubscribeSavedPosts();
            if (savedPostsList) savedPostsList.innerHTML = '';
        }
        setupAuthListeners();
    });
    
    function escutarPostsSalvos(userId) {
        if (unsubscribeSavedPosts) unsubscribeSavedPosts();
        unsubscribeSavedPosts = db.collection('users').doc(userId).collection('savedPosts')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                if(!savedPostsList) return;
                savedPostsList.innerHTML = '';
                if (snapshot.empty) {
                    savedPostsList.innerHTML = '<p>Você ainda não salvou nenhum post. Use o botão "Salvar Post" acima!</p>';
                    return;
                }
                snapshot.forEach(doc => {
                    const post = doc.data();
                    const postElement = document.createElement('div');
                    postElement.className = 'saved-post-item';
                    const escapedContent = post.content.replace(/"/g, '"');
                    postElement.innerHTML = `
                        <div class="saved-post-content">${post.content.replace(/\n/g, '<br>')}</div>
                        <div class="saved-post-actions">
                            <button class="use-post-button" data-content="${escapedContent}">Usar</button>
                            <button class="delete-post-button" data-id="${doc.id}">Apagar</button>
                        </div>
                    `;
                    savedPostsList.appendChild(postElement);
                });
            });
    }

    if (savedPostsList) savedPostsList.addEventListener('click', (e) => {
        const target = e.target;
        const user = auth.currentUser;
        if (!user) return;

        if (target.classList.contains('use-post-button')) {
            postTemplateTextarea.value = target.dataset.content;
            window.scrollTo(0, 0);
        }
        if (target.classList.contains('delete-post-button')) {
            if (confirm("Tem certeza que deseja apagar este post?")) {
                const postId = target.dataset.id;
                db.collection('users').doc(user.uid).collection('savedPosts').doc(postId).delete();
            }
        }
    });

    function traduzirErroFirebase(code) {
        switch (code) {
            case "auth/invalid-email": return "O formato do e-mail é inválido.";
            case "auth/weak-password": return "A senha precisa ter pelo menos 6 caracteres.";
            case "auth/email-already-in-use": return "Este e-mail já está cadastrado.";
            case "auth/user-not-found": case "auth/wrong-password": return "E-mail ou senha incorretos.";
            default: return "Ocorreu um erro. Tente novamente.";
        }
    }

    const templates = {novidade: `📢 NOVIDADE NA ÁREA! 📢\n\nAcabamos de receber [Nome do Produto ou Serviço]! Perfeito para [Benefício Principal].\n\nVenha conferir de perto e seja um dos primeiros a experimentar.\n\n#SeuNegócio #Novidade #[SuaCidade]`,oferta: `💰 OFERTA IMPERDÍVEL! 💰\n\nSó nesta semana, garanta seu/sua [Nome do Produto] com [Desconto %] de desconto! De R$ [Preço Antigo] por apenas R$ [Preço Novo].\n\nNão perca essa chance! A oferta é válida até [Data Final da Oferta].\n\n#Promoção #Desconto #SeuNegócio`,evento: `📅 VOCÊ É NOSSO CONVIDADO ESPECIAL! 📅\n\nParticipe do nosso [Nome do Evento] no dia [Data do Evento], às [Horário]. Será um momento incrível com [Breve Descrição do que vai acontecer].\n\nMarque na sua agenda e venha celebrar conosco!\n\nEndereço: [Seu Endereço]\n\n#Evento #SeuNegócio #[SuaCidade]`,dica: `💡 DICA RÁPIDA DA SEMANA 💡\n\nVocê sabia que [Fato ou Dica Interessante sobre seu nicho]?\n\nIsso pode te ajudar a [Benefício da dica]. Quer saber mais? Deixe sua pergunta nos comentários!\n\n#DicaDaSemana #Curiosidade #SeuNegócio`};
    const ideias = ["Apresente um funcionário e conte uma curiosidade sobre ele.","Mostre os bastidores da sua loja ou escritório.","Qual foi o pedido mais inusitado que já recebeu?","Crie um post de 'Verdade ou Mentira' sobre seu produto/serviço.","Compartilhe um depoimento de um cliente satisfeito.","Faça uma enquete: 'Qual desses dois produtos vocês preferem?'.","Dê uma dica rápida que não seja sobre vender, mas que ajude seu cliente.","Poste uma foto de um detalhe interessante do seu espaço de trabalho.","Conte a história de como o seu negócio começou.","Pergunte aos seus seguidores o que eles gostariam de ver em oferta."];
    
    function updateTemplate() { if (postTemplateTextarea) postTemplateTextarea.value = templates[postTypeSelect.value]; }
    function copyToClipboard() { postTemplateTextarea.select(); document.execCommand('copy'); copyButton.textContent = 'Copiado!'; setTimeout(() => { copyButton.textContent = 'Copiar Texto'; }, 2000); }
    function gerarNovaIdeia() { if (ideiaTexto) ideiaTexto.textContent = ideias[Math.floor(Math.random() * ideias.length)]; }
    
    async function buscarImagens() {
        const query = searchInput.value;
        if (!query || !unsplashAccessKey) {if(imageResults) imageResults.innerHTML = "<p>Digite um termo para buscar.</p>"; return;}
        loadingMessage.style.display = 'block';
        imageResults.innerHTML = '';
        try {
            const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=12&client_id=${unsplashAccessKey}&lang=pt`);
            const data = await response.json();
            if (data.results.length === 0) { imageResults.innerHTML = "<p>Nenhuma imagem encontrada.</p>"; }
            else { data.results.forEach(photo => { const img = document.createElement('img'); img.src = photo.urls.small; img.alt = photo.alt_description; img.onclick = () => window.open(photo.links.html, '_blank'); imageResults.appendChild(img); }); }
        } catch (error) { imageResults.innerHTML = "<p>Ocorreu um erro ao buscar imagens.</p>"; }
        finally { loadingMessage.style.display = 'none'; }
    }

    function salvarPost() {
        const postContent = postTemplateTextarea.value;
        if (!postContent.trim()) { alert("Não há nada para salvar!"); return; }
        const user = auth.currentUser;
        if (user) {
            db.collection('users').doc(user.uid).collection('savedPosts').add({
                content: postContent,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                savePostButton.textContent = 'Salvo!';
                setTimeout(() => { savePostButton.textContent = 'Salvar Post'; }, 2000);
            }).catch(error => console.error("Erro ao salvar post: ", error));
        }
    }

    function salvarProgressoChecklist(userId) {
        if (!userId) return;
        const progresso = {};
        checklistItems.forEach(item => { progresso[item.id] = item.checked; });
        localStorage.setItem(`progresso_${userId}`, JSON.stringify(progresso));
    }

    function carregarProgressoChecklist(userId) {
        if (!userId) { if(checklistItems) checklistItems.forEach(item => item.checked = false); return; }
        const progresso = JSON.parse(localStorage.getItem(`progresso_${userId}`));
        if (progresso) { checklistItems.forEach(item => { item.checked = progresso[item.id] || false; }); }
    }

    if (postTypeSelect) postTypeSelect.addEventListener('change', updateTemplate);
    if (copyButton) copyButton.addEventListener('click', copyToClipboard);
    if (savePostButton) savePostButton.addEventListener('click', salvarPost);
    if (novaIdeiaButton) novaIdeiaButton.addEventListener('click', gerarNovaIdeia);
    if (searchButton) searchButton.addEventListener('click', buscarImagens);
    if (searchInput) searchInput.addEventListener('keypress', e => e.key === 'Enter' && buscarImagens());
    if(checklistItems) checklistItems.forEach(item => item.addEventListener('change', () => auth.currentUser && salvarProgressoChecklist(auth.currentUser.uid)));

    updateTemplate();
    gerarNovaIdeia();
});