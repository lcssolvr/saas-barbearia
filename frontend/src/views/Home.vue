<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToLogin = () => {
    router.push('/login');
};

const goToMap = () => {
    alert("Em Breve");
};
</script>

<template>
    <div class="home-container">
        <header class="navbar">
            <div class="logo">💈 NaRégua</div>
            <nav>
                <button @click="goToLogin" class="nav-btn">Entrar</button>
            </nav>
        </header>

        <main class="hero">
            <div class="hero-content">
                <h1>O sistema de gestão completo para sua barbearia</h1>
                <p>Agendamentos, controle financeiro e fidelização de clientes em um só lugar. Simples, moderno e eficiente.</p>
                <div class="cta-group">
                    <button @click="goToMap" class="btn-primary">
                        📍 Visualizar Barbearias
                    </button>
                    <button @click="goToLogin" class="btn-outline">
                        Acessar Sistema
                    </button>
                </div>
            </div>
            <div class="hero-image">
                <div class="mockup">
                    <div class="mockup-content">
                        <span>📊 Dashboard</span>
                        <span>📅 Agenda</span>
                        <span>💰 Financeiro</span>
                    </div>
                </div>
            </div>
        </main>

        <section class="features">
            <div class="feature-card">
                <div class="icon">📅</div>
                <h3>Agendamento Online</h3>
                <p>Seus clientes agendam horários pelo celular, 24 horas por dia, sem te ligar.</p>
            </div>
            <div class="feature-card">
                <div class="icon">💰</div>
                <h3>Controle Financeiro</h3>
                <p>Saiba exatamente quanto sua barbearia fatura e controle comissões automaticamente.</p>
            </div>
            <div class="feature-card">
                <div class="icon">💎</div>
                <h3>Fidelização (Em Desenvolvimento)</h3>
                <p>Crie programas de pontos e faça seus clientes voltarem sempre.</p>
            </div>
        </section>

        <footer class="footer">
            <p>&copy; 2025 NaRégua. Todos os direitos reservados.</p>
        </footer>
    </div>
</template>

<style scoped>
.home-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    
}

.logo {
    font-size: 1.5rem;
    font-weight: 800;
}

.nav-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}
.nav-btn:hover { background: rgba(255,255,255,0.1); }

.hero {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 60px 40px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    gap: 40px;
}

.hero-content {
    flex: 1;
    max-width: 600px;
}

.hero-content h1 {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 20px;
    background: linear-gradient(to right, #fff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero-content p {
    font-size: 1.2rem;
    color: #cbd5e1;
    margin-bottom: 40px;
    line-height: 1.6;
}

.cta-group {
    display: flex;
    gap: 15px;
}

.btn-primary {
    background: #2563eb;
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
}
.btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); }

.btn-outline {
    background: transparent;
    border: 2px solid rgba(255,255,255,0.1);
    color: white;
    padding: 15px 30px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-outline:hover {
    border-color: #fbbf24;
    color: #fbbf24;
}

.hero-image {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.mockup {
    width: 350px;
    height: 250px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 20px;
    position: relative;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    backdrop-filter: blur(10px);
}
.mockup-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding-top: 40px;
    opacity: 0.5;
}
.mockup-content span {
    background: rgba(255,255,255,0.1);
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 0 15px;
}

.footer {
    text-align: center;
    padding: 20px;
    color: #64748b;
    font-size: 0.9rem;
    border-top: 1px solid rgba(255,255,255,0.05);
}

@media (max-width: 768px) {
    .home-container { min-height: auto; }
    .navbar { flex-direction: column; gap: 15px; padding: 15px 20px; }
    .hero { flex-direction: column; text-align: center; padding: 40px 20px; gap: 30px; }
    .hero-content h1 { font-size: 2rem; margin-bottom: 15px; }
    .hero-content p { font-size: 1rem; margin-bottom: 30px; }
    .cta-group { justify-content: center; flex-direction: column; width: 100%; gap: 15px; }
    .hero-image { display: none; } 
    .features { flex-direction: column; padding: 40px 20px; gap: 20px; }
    .feature-card { padding: 25px; }
    .feature-card .icon { font-size: 2rem; margin-bottom: 15px; }
    .btn-primary, .btn-outline { width: 100%; padding: 12px; }
}

*, *::before, *::after {
    box-sizing: border-box;
}

.features {
    display: flex;
    gap: 30px;
    padding: 60px 40px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    flex-wrap: wrap; /* Allow wrapping on intermediate screens */
}

.feature-card {
    flex: 1;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    padding: 30px;
    border-radius: 16px;
    transition: transform 0.3s;
}
.feature-card:hover { 
    background: rgba(255,255,255,0.05); 
    transform: translateY(-5px);
}

.feature-card .icon {
    font-size: 2.5rem;
    margin-bottom: 20px;
}
.feature-card h3 {
    font-size: 1.25rem;
    margin-bottom: 10px;
    color: #fff;
}
.feature-card p {
    color: #94a3b8;
    line-height: 1.6;
}
</style>
