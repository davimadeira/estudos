// ==================== EKKLESIA STUDY - SCRIPT COMPLETO ====================

// ==================== VARIÁVEIS GLOBAIS ====================
let db = {
    materias: [],
    conteudos: [],
    questoes: [],
    temasRedacao: []
};

let userProgress = {
    estudados: [],
    respostasQuestoes: [],
    tempoEstudoTotal: 0,
    redacoesFeitas: [],
    cronoConfig: {
        dataInicio: '2024-01-01',
        diasSemana: [1, 2, 3, 4],
        horasPorDia: 60,
        diasPorSemana: 4
    }
};

let currentUser = null;
let currentPage = 'dashboard';
let currentCronogramaDate = new Date();
let currentCronoView = 'mensal';
let currentQuestionPage = 1;
const QUESTOES_POR_PAG = 5;
let questoesFiltradas = [];
let chartEvolucao = null;

// ==================== CARREGAR DADOS ====================
async function carregarDadosJSON() {
    try {
        const response = await fetch('dados.json');
        if (!response.ok) throw new Error('Arquivo dados.json não encontrado');
        const data = await response.json();
        db = { ...db, ...data };
        console.log('✅ Dados carregados:', db.questoes.length, 'questões');
        questoesFiltradas = [...db.questoes];
    } catch (error) {
        console.error('Erro:', error);
        db.materias = ['Teologia Sistemática', 'Hermenêutica', 'História da Igreja'];
        db.conteudos = [
            { id: 1, materia: 'Teologia Sistemática', titulo: 'Introdução à Teologia', video: '#', pdf: '#', texto: 'Texto introdutório...', link: '#', assunto: 'Introdução', dificuldade: 'Fácil' },
            { id: 2, materia: 'Hermenêutica', titulo: 'Princípios de Interpretação', video: '#', pdf: '#', texto: 'Regras hermenêuticas...', link: '#', assunto: 'Métodos', dificuldade: 'Médio' }
        ];
        db.questoes = [
            { id: 1, materia: 'Teologia Sistemática', assunto: 'Introdução', pergunta: 'O que é Teologia Sistemática?', alternativas: ['Estudo de Deus', 'Estudo da Igreja', 'Estudo da Bíblia', 'Estudo do Homem'], correta: 0, banca: 'FCC', dificuldade: 'Fácil' }
        ];
        db.temasRedacao = ['O papel da igreja na sociedade atual', 'Desafios da juventude cristã'];
        questoesFiltradas = [...db.questoes];
    }
}

function carregarProgresso() {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
        const saved = localStorage.getItem(`progress_${userId}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            userProgress = {
                estudados: parsed.estudados || [],
                respostasQuestoes: parsed.respostasQuestoes || [],
                tempoEstudoTotal: parsed.tempoEstudoTotal || 0,
                redacoesFeitas: parsed.redacoesFeitas || [],
                cronoConfig: parsed.cronoConfig || { dataInicio: '2024-01-01', diasSemana: [1, 2, 3, 4], horasPorDia: 60, diasPorSemana: 4 }
            };
        }
    }
}

function salvarProgresso() {
    if (currentUser) {
        localStorage.setItem(`progress_${currentUser.uid}`, JSON.stringify(userProgress));
    }
}

// ==================== AUTENTICAÇÃO ====================
function handleUserLogin(user) {
    currentUser = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email
    };
    localStorage.setItem('currentUserId', user.uid);
    carregarProgresso();
    
    updateUIBloqueio();
    
    document.getElementById('sidebarUserName').innerText = currentUser.name;
    document.getElementById('userGreeting').innerHTML = `<i class="fas fa-smile-wink"></i> Olá, ${currentUser.name.split(' ')[0]}`;
    
    renderizarPagina('dashboard');
    setTimeout(() => alert(`Bem-vindo(a) ${currentUser.name}!`), 100);
}

function logout() {
    auth.signOut();
    currentUser = null;
    localStorage.removeItem('currentUserId');
    updateUIBloqueio();
}

function updateUIBloqueio() {
    const overlay = document.getElementById('blockOverlay');
    if (currentUser) {
        if (overlay) overlay.style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
    } else {
        if (overlay) overlay.style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    }
}

function initOverlayButtons() {
    const googleBtn = document.getElementById('blockLoginBtn');
    const emailBtn = document.getElementById('blockEmailBtn');
    
    if (googleBtn) {
        googleBtn.onclick = () => {
            auth.signInWithPopup(googleProvider)
                .then(result => handleUserLogin(result.user))
                .catch(err => alert('Erro: ' + err.message));
        };
    }
    
    if (emailBtn) {
        emailBtn.onclick = () => {
            document.getElementById('emailLoginModal').style.display = 'flex';
        };
    }
}

function initAuth() {
    const submitLoginBtn = document.getElementById('submitLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const submitRegisterBtn = document.getElementById('submitRegisterBtn');
    
    if (submitLoginBtn) {
        submitLoginBtn.onclick = async () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const result = await auth.signInWithEmailAndPassword(email, password);
                handleUserLogin(result.user);
                document.getElementById('emailLoginModal').style.display = 'none';
            } catch (err) {
                alert('Erro: ' + err.message);
            }
        };
    }
    
    if (showRegisterBtn) {
        showRegisterBtn.onclick = () => {
            document.getElementById('emailLoginModal').style.display = 'none';
            document.getElementById('registerModal').style.display = 'flex';
        };
    }
    
    if (submitRegisterBtn) {
        submitRegisterBtn.onclick = async () => {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirm = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirm) { alert('Senhas não coincidem'); return; }
            if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
                alert('Senha deve ter mínimo 8 caracteres, letras e números');
                return;
            }
            try {
                const result = await auth.createUserWithEmailAndPassword(email, password);
                await result.user.updateProfile({ displayName: name });
                handleUserLogin(result.user);
                document.getElementById('registerModal').style.display = 'none';
            } catch (err) {
                alert('Erro: ' + err.message);
            }
        };
    }
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = logout;
}

// ==================== NAVEGAÇÃO ====================
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            renderizarPagina(item.dataset.page);
            if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
        };
    });
    
    document.getElementById('themeToggle').onclick = () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('tema', document.body.classList.contains('dark') ? 'dark' : 'light');
    };
    
    document.getElementById('menuToggle').onclick = () => {
        document.getElementById('sidebar').classList.toggle('open');
    };
    
    document.getElementById('salvarPersonalizacao').onclick = salvarPersonalizacaoCrono;
}

function renderizarPagina(page) {
    currentPage = page;
    const titles = {
        dashboard: 'Dashboard',
        cronograma: 'Cronograma de Estudos',
        conteudo: 'Biblioteca de Estudos',
        questoes: 'Banco de Questões',
        redacao: 'Prática de Redação',
        estatisticas: 'Estatísticas de Desempenho'
    };
    document.getElementById('pageTitle').innerText = titles[page] || 'Plataforma';
    
    if (page === 'dashboard') renderDashboard();
    else if (page === 'cronograma') renderCronograma();
    else if (page === 'conteudo') renderConteudo();
    else if (page === 'questoes') renderQuestoesPage();
    else if (page === 'redacao') renderRedacao();
    else if (page === 'estatisticas') renderEstatisticas();
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    const total = userProgress.respostasQuestoes.length;
    const acertos = userProgress.respostasQuestoes.filter(r => r.acertou).length;
    const percent = total === 0 ? 0 : (acertos / total) * 100;
    const horas = Math.floor(userProgress.tempoEstudoTotal / 60);
    const minutos = userProgress.tempoEstudoTotal % 60;
    
    let html = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-number">${horas}h ${minutos}m</div><div>tempo estudado</div></div>
            <div class="stat-card"><div class="stat-number">${percent.toFixed(1)}%</div><div>taxa de acertos</div></div>
            <div class="stat-card"><div class="stat-number">${total}</div><div>questões respondidas</div></div>
            <div class="stat-card"><div class="stat-number">${userProgress.estudados.length}</div><div>aulas concluídas</div></div>
        </div>
        <div class="card">
            <div class="card-title"><i class="fas fa-chart-line"></i> Evolução de Acertos</div>
            <canvas id="graficoEvolucao" style="height: 250px;"></canvas>
        </div>
    `;
    document.getElementById('contentArea').innerHTML = html;
    
    const labels = [], data = [];
    let acc = 0;
    for (let i = 0; i < userProgress.respostasQuestoes.length; i++) {
        acc += userProgress.respostasQuestoes[i].acertou ? 1 : 0;
        data.push((acc / (i + 1)) * 100);
        labels.push(`Q${i + 1}`);
    }
    const ctx = document.getElementById('graficoEvolucao')?.getContext('2d');
    if (ctx) {
        if (chartEvolucao) chartEvolucao.destroy();
        chartEvolucao = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: '% Acertos', data, borderColor: '#1a4d8c', tension: 0.3 }] } });
    }
}

// ==================== CRONOGRAMA ====================
function renderCronograma() {
    const ano = currentCronogramaDate.getFullYear();
    const mes = currentCronogramaDate.getMonth();
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    let html = `
        <div class="cronograma-container">
            <div class="cronograma-header">
                <button class="month-nav" onclick="mudarMes(-1)"><i class="fas fa-chevron-left"></i></button>
                <h2>${meses[mes]} ${ano}</h2>
                <button class="month-nav" onclick="mudarMes(1)"><i class="fas fa-chevron-right"></i></button>
                <button class="month-nav" onclick="abrirPersonalizar()"><i class="fas fa-sliders-h"></i> Personalizar</button>
            </div>
            <div class="crono-view-buttons" style="margin: 1rem;">
                <button class="crono-view-btn ${currentCronoView === 'mensal' ? 'active' : ''}" onclick="mudarVisualizacao('mensal')">📅 Mensal</button>
                <button class="crono-view-btn ${currentCronoView === 'semanal' ? 'active' : ''}" onclick="mudarVisualizacao('semanal')">📆 Semanal</button>
                <button class="crono-view-btn ${currentCronoView === 'diario' ? 'active' : ''}" onclick="mudarVisualizacao('diario')">📋 Diário</button>
            </div>
            <div id="cronoVisualizacaoContainer"></div>
        </div>
    `;
    document.getElementById('contentArea').innerHTML = html;
    renderVisualizacaoCrono(currentCronoView);
}

function mudarVisualizacao(view) {
    currentCronoView = view;
    renderVisualizacaoCrono(view);
    document.querySelectorAll('.crono-view-btn').forEach(btn => btn.classList.remove('active'));
    if (view === 'mensal') document.querySelector('.crono-view-btn:first-child')?.classList.add('active');
    else if (view === 'semanal') document.querySelector('.crono-view-btn:nth-child(2)')?.classList.add('active');
    else document.querySelector('.crono-view-btn:last-child')?.classList.add('active');
}

function renderVisualizacaoCrono(view) {
    const container = document.getElementById('cronoVisualizacaoContainer');
    if (!container) return;
    
    const ano = currentCronogramaDate.getFullYear();
    const mes = currentCronogramaDate.getMonth();
    
    if (view === 'mensal') {
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);
        const diasNoMes = ultimoDia.getDate();
        const diaInicioSemana = primeiroDia.getDay();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        let html = `<div class="week-header">${diasSemana.map(d => `<div>${d}</div>`).join('')}</div><div class="cronograma-dias">`;
        let diaAtual = 1;
        for (let semana = 0; semana < 6; semana++) {
            html += `<div class="cronograma-semana">`;
            for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
                if ((semana === 0 && diaSemana < diaInicioSemana) || diaAtual > diasNoMes) {
                    html += `<div class="cronograma-dia" style="background: transparent;"></div>`;
                } else {
                    const isEstudo = userProgress.cronoConfig.diasSemana.includes(diaSemana);
                    html += `<div class="cronograma-dia"><div class="dia-numero">${diaAtual}</div>${isEstudo ? '<div style="font-size:0.7rem;">📚 Estudar</div>' : '<div style="font-size:0.7rem;">🚫 Livre</div>'}</div>`;
                    diaAtual++;
                }
            }
            html += `</div>`;
            if (diaAtual > diasNoMes) break;
        }
        html += `</div>`;
        container.innerHTML = html;
    } else if (view === 'semanal') {
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        let html = `<div class="stats-grid" style="grid-template-columns: repeat(7, 1fr);">`;
        for (let i = 0; i < 7; i++) {
            const dia = new Date(inicioSemana);
            dia.setDate(inicioSemana.getDate() + i);
            html += `<div class="stat-card"><strong>${diasSemana[i]}</strong><br>${dia.getDate()}/${dia.getMonth() + 1}<br><small>${userProgress.cronoConfig.diasSemana.includes(i) ? '📚 Estudar' : '🚫 Livre'}</small></div>`;
        }
        html += `</div>`;
        container.innerHTML = html;
    } else {
        const hoje = new Date();
        container.innerHTML = `<div class="card"><h3>📅 ${hoje.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3><div class="aulas-lista"><div class="aula-item"><i class="fas fa-book"></i> Estudo programado</div></div></div>`;
    }
}

function mudarMes(delta) {
    currentCronogramaDate.setMonth(currentCronogramaDate.getMonth() + delta);
    renderCronograma();
}

function abrirPersonalizar() {
    document.getElementById('dataInicio').value = userProgress.cronoConfig.dataInicio;
    document.getElementById('cronoDiasPorSemana').value = userProgress.cronoConfig.diasPorSemana;
    document.querySelectorAll('#diasSemanaCheckbox input').forEach(cb => cb.checked = userProgress.cronoConfig.diasSemana.includes(parseInt(cb.value)));
    document.getElementById('cronoTempoPorDia').value = userProgress.cronoConfig.horasPorDia;
    document.getElementById('personalizarModal').style.display = 'flex';
}

function salvarPersonalizacaoCrono() {
    const diasSelecionados = [];
    document.querySelectorAll('#diasSemanaCheckbox input:checked').forEach(cb => diasSelecionados.push(parseInt(cb.value)));
    const qtdDesejada = parseInt(document.getElementById('cronoDiasPorSemana').value);
    const alertDiv = document.getElementById('diasAlert');
    
    if (diasSelecionados.length !== qtdDesejada) {
        alertDiv.style.display = 'block';
        alertDiv.innerHTML = `⚠️ Você selecionou ${diasSelecionados.length} dia(s), mas precisa selecionar ${qtdDesejada} dia(s).`;
        return;
    }
    alertDiv.style.display = 'none';
    userProgress.cronoConfig = {
        dataInicio: document.getElementById('dataInicio').value,
        diasSemana: diasSelecionados,
        horasPorDia: parseInt(document.getElementById('cronoTempoPorDia').value),
        diasPorSemana: qtdDesejada
    };
    salvarProgresso();
    document.getElementById('personalizarModal').style.display = 'none';
    renderCronograma();
}

// ==================== CONTEÚDO ====================
function renderConteudo() {
    let html = `<div class="card"><div class="card-title">📚 Matérias</div><div class="materias-grid">`;
    db.materias.forEach(mat => {
        html += `<div class="materia-card" onclick="selecionarMateria('${mat}')"><i class="fas fa-graduation-cap"></i><div><strong>${mat}</strong></div></div>`;
    });
    html += `</div></div><div id="aulasContainer"></div><div id="conteudoDetalhes"></div>`;
    document.getElementById('contentArea').innerHTML = html;
}

function selecionarMateria(materia) {
    const aulas = db.conteudos.filter(c => c.materia === materia);
    document.getElementById('aulasContainer').innerHTML = `
        <div class="card"><div class="card-title">📖 Aulas de ${materia}</div>
        <div class="aulas-lista">${aulas.map(aula => `<div class="aula-item" onclick="window.open('aula.html?id=${aula.id}', '_self')"><i class="fas fa-play-circle"></i> ${aula.titulo}</div>`).join('')}</div></div>`;
}

// ==================== QUESTÕES ====================
function renderQuestoesPage() {
    const materiasOpcoes = [...new Set(db.questoes.map(q => q.materia))];
    let html = `
        <div class="card"><div class="card-title">🔍 Filtros</div>
        <div class="filters-bar"><select id="filtroMateria" class="filter-select"><option value="">Todas matérias</option>${materiasOpcoes.map(m => `<option value="${m}">${m}</option>`).join('')}</select>
        <button class="btn-primary" onclick="aplicarFiltrosQuestoes()">Filtrar</button></div></div>
        <div id="questoesLista"></div><div class="pagination" id="paginacaoQuestoes"></div>
    `;
    document.getElementById('contentArea').innerHTML = html;
    aplicarFiltrosQuestoes();
}

function aplicarFiltrosQuestoes() {
    const materia = document.getElementById('filtroMateria')?.value || '';
    questoesFiltradas = db.questoes.filter(q => !materia || q.materia === materia);
    currentQuestionPage = 1;
    renderizarListaQuestoes();
}

function renderizarListaQuestoes() {
    const start = (currentQuestionPage - 1) * QUESTOES_POR_PAG;
    const paginated = questoesFiltradas.slice(start, start + QUESTOES_POR_PAG);
    const container = document.getElementById('questoesLista');
    
    container.innerHTML = paginated.map(q => {
        const resposta = userProgress.respostasQuestoes.find(r => r.idQuestao === q.id);
        return `
            <div class="questao-card-moderno">
                <div class="questao-header"><span>Questão ${q.id}</span><div class="questao-badges"><span class="badge badge-materia">${q.materia}</span><span class="badge badge-dificuldade">${q.dificuldade || 'Médio'}</span></div></div>
                <div class="questao-enunciado">${q.pergunta}</div>
                <div class="questao-alternativas">${q.alternativas.map((alt, idx) => `<div class="alternativa-item" onclick="responderQuestao(${q.id}, ${idx})"><span class="alternativa-letra">${String.fromCharCode(65 + idx)}</span><span>${alt}</span></div>`).join('')}</div>
                <div id="feedback-${q.id}" class="questao-feedback ${resposta ? (resposta.acertou ? 'feedback-correct' : 'feedback-wrong') : ''}" style="${resposta ? '' : 'display:none'}">${resposta ? (resposta.acertou ? '✅ Correto!' : `❌ Errado! Resposta: ${q.alternativas[q.correta]}`) : ''}</div>
            </div>
        `;
    }).join('');
    
    const totalPages = Math.ceil(questoesFiltradas.length / QUESTOES_POR_PAG);
    let pagHtml = '';
    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        pagHtml += `<button class="page-btn ${i === currentQuestionPage ? 'active' : ''}" onclick="irPaginaQuestoes(${i})">${i}</button>`;
    }
    document.getElementById('paginacaoQuestoes').innerHTML = pagHtml;
}

function irPaginaQuestoes(page) { currentQuestionPage = page; renderizarListaQuestoes(); }

function responderQuestao(questaoId, alternativa) {
    const questao = db.questoes.find(q => q.id === questaoId);
    const acertou = alternativa === questao.correta;
    userProgress.respostasQuestoes.push({ idQuestao: questaoId, acertou, materia: questao.materia, data: new Date().toISOString() });
    salvarProgresso();
    renderizarListaQuestoes();
    renderDashboard();
}

// ==================== REDAÇÃO ====================
function renderRedacao() {
    let html = `<div class="card"><div class="card-title">✍️ Temas de Redação</div><div class="temas-lista">`;
    db.temasRedacao.forEach(tema => {
        html += `<div class="tema-item" onclick="abrirEditorRedacao('${tema.replace(/'/g, "\\'")}')"><span><i class="fas fa-pen"></i> ${tema}</span><span class="tema-status">📝 Disponível</span></div>`;
    });
    html += `</div></div><div id="redacaoEditor" style="display: none;"></div>`;
    document.getElementById('contentArea').innerHTML = html;
}

function abrirEditorRedacao(tema) {
    document.getElementById('redacaoEditor').innerHTML = `
        <div class="card"><div class="card-title">📝 ${tema}</div>
        <textarea id="textoRedacao" rows="12" placeholder="Escreva sua redação..." style="width: 100%;"></textarea>
        <button class="btn-primary" onclick="enviarRedacao('${tema.replace(/'/g, "\\'")}')">Enviar</button>
        <button class="btn-outline" onclick="fecharEditorRedacao()">Cancelar</button></div>
    `;
    document.getElementById('redacaoEditor').style.display = 'block';
}

function fecharEditorRedacao() { document.getElementById('redacaoEditor').style.display = 'none'; }

function enviarRedacao(tema) {
    const texto = document.getElementById('textoRedacao').value;
    if (!texto.trim()) { alert('Escreva sua redação'); return; }
    localStorage.setItem('redacao_para_enviar', JSON.stringify({ tema, texto }));
    window.open('redacao.html', '_blank');
    alert('Redação salva!');
    fecharEditorRedacao();
}

// ==================== ESTATÍSTICAS ====================
function renderEstatisticas() {
    const total = userProgress.respostasQuestoes.length;
    const acertos = userProgress.respostasQuestoes.filter(r => r.acertou).length;
    const percent = total === 0 ? 0 : (acertos / total) * 100;
    const horas = Math.floor(userProgress.tempoEstudoTotal / 60);
    const minutos = userProgress.tempoEstudoTotal % 60;
    document.getElementById('contentArea').innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-number">${total}</div><div>questões</div></div>
            <div class="stat-card"><div class="stat-number">${acertos}</div><div>acertos</div></div>
            <div class="stat-card"><div class="stat-number">${percent.toFixed(1)}%</div><div>taxa</div></div>
            <div class="stat-card"><div class="stat-number">${horas}h ${minutos}m</div><div>tempo</div></div>
        </div>
    `;
}

// ==================== INICIALIZAÇÃO ====================
window.mudarMes = mudarMes;
window.mudarVisualizacao = mudarVisualizacao;
window.abrirPersonalizar = abrirPersonalizar;
window.selecionarMateria = selecionarMateria;
window.aplicarFiltrosQuestoes = aplicarFiltrosQuestoes;
window.irPaginaQuestoes = irPaginaQuestoes;
window.responderQuestao = responderQuestao;
window.abrirEditorRedacao = abrirEditorRedacao;
window.fecharEditorRedacao = fecharEditorRedacao;
window.enviarRedacao = enviarRedacao;

async function init() {
    await carregarDadosJSON();
    carregarProgresso();
    initNavigation();
    initAuth();
    initOverlayButtons();
    
    const savedTheme = localStorage.getItem('tema');
    if (savedTheme === 'dark') document.body.classList.add('dark');
    
    updateUIBloqueio();
    
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = { uid: user.uid, name: user.displayName || user.email.split('@')[0], email: user.email };
                carregarProgresso();
                updateUIBloqueio();
                document.getElementById('sidebarUserName').innerText = currentUser.name;
                document.getElementById('userGreeting').innerHTML = `<i class="fas fa-smile-wink"></i> Olá, ${currentUser.name.split(' ')[0]}`;
                renderizarPagina('dashboard');
            }
        });
    }
}

init();
