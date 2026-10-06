# Comanda Digital 📱

Um sistema moderno e responsivo de gestão de comandas, cardápio digital e estoque, desenvolvido especialmente para atender operações de bares, espetinhos e conveniências com agilidade.

## 🚀 Funcionalidades

- **Controle de Mesas e Comandas:** Abertura, adição de itens e fechamento rápido de contas.
- **Cardápio Digital Integrado:** Acesso direto via QR Code dinâmico que pode ser escaneado pelo cliente na mesa.
- **Gestão de Estoque Inteligente:** Alertas visuais para produtos com estoque baixo ou esgotado.
- **Dashboard Financeiro:** Visão rápida do faturamento, mesas abertas, mesas fechadas e produtos mais vendidos com filtro por período.
- **Controle de Acessos (Admin vs Atendente):** Contas de atendimento restritas à gestão de comandas, enquanto administradores gerenciam produtos, categorias e caixa.
- **PWA (Progressive Web App):** Permite a instalação do sistema no celular como se fosse um aplicativo nativo.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React + Vite, TailwindCSS (para estilização rápida e moderna).
- **Backend:** Django Rest Framework (DRF), Python 3.
- **Banco de Dados:** SQLite (padrão, configurado para rápido deploy e testes).

## 💻 Como Rodar o Projeto Localmente

Certifique-se de ter o **Python** (3.10+) e o **Node.js** instalados em sua máquina.

### 1. Configurando o Backend (Django)

No terminal, na raiz do projeto, crie o ambiente virtual, instale as dependências e inicie o servidor:

```bash
# Crie e ative o ambiente virtual
python -m venv venv
.\venv\Scripts\activate  # No Windows
# source venv/bin/activate  # No Linux/Mac

# Instale as dependências
pip install -r requirements.txt

# Faça as migrações do banco de dados (se for a primeira vez)
python manage.py migrate

# Crie um superusuário (admin) para ter acesso completo
python manage.py createsuperuser

# Rode o servidor exposto para a rede local (acessível pelo celular)
python manage.py runserver 0.0.0.0:8000
```

### 2. Configurando o Frontend (React + Vite)

Abra um novo terminal e entre na pasta `frontend`:

```bash
cd frontend

# Instale as dependências do Node
npm install

# Inicie o servidor frontend exposto para a rede local
npm run dev -- --host
```

### 3. Acesso à Aplicação
- **No PC:** Abra o navegador em `http://localhost:5173`.
- **No Celular (PWA):** Certifique-se de que o celular está na mesma rede Wi-Fi que o PC, e acesse `http://SEU_IP_LOCAL:5173`. Você pode adicionar a aplicação à sua Tela Inicial para utilizá-la em modo App.

---
*Desenvolvido para automatizar e encantar o cliente desde o pedido até o fechamento.*
