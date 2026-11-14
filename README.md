 
# 💰 Parcela Fácil

**Organize suas compras, acompanhe suas parcelas e tenha mais controle sobre sua vida financeira.**

O **Parcela Fácil** é uma aplicação web desenvolvida para facilitar o gerenciamento de compras parceladas e o acompanhamento financeiro. A proposta é oferecer uma experiência simples e intuitiva para registrar compras, visualizar informações e organizar compromissos financeiros em um só lugar.

🔗 **Acesse a aplicação: https://parcela-facil-five.vercel.app/

---

## 📌 Sobre o projeto

O Parcela Fácil surgiu com a ideia de desenvolver uma solução que ajude as pessoas a acompanhar suas compras parceladas e organizar melhor suas informações financeiras.

Além do gerenciamento de compras, o projeto também conta com recursos de inteligência artificial para auxiliar na leitura e extração de informações de comprovantes e documentos.

O desenvolvimento envolveu a integração entre frontend, backend, autenticação, banco de dados e serviços de IA.

## ✨ Funcionalidades

- 🔐 **Autenticação de usuários:** cadastro e login.
- 🛒 **Gerenciamento de compras:** registro e organização de compras.
- 💳 **Controle de parcelas:** acompanhamento das compras parceladas.
- 📊 **Organização financeira:** visualização e acompanhamento das informações cadastradas.
- 🤖 **Leitura inteligente de documentos:** utilização de IA para auxiliar na extração de informações de comprovantes e notas fiscais.
- ☁️ **Aplicação online:** projeto publicado e acessível pela web.

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| React | Construção da interface |
| TypeScript | Tipagem e organização do código |
| Vite | Ferramenta de desenvolvimento e build |
| Node.js | Ambiente de execução do backend |
| Express | Criação das rotas e serviços backend |
| Supabase | Autenticação e banco de dados |
| Google Gemini AI | Processamento inteligente de documentos |
| Tailwind CSS | Estilização da interface |
| Git e GitHub | Versionamento e hospedagem do código |
| Vercel | Deploy da aplicação |

## ⚙️ Como executar o projeto localmente

### 1. Clone o repositório

```bash
git clone https://github.com/Diego260807/Parcela-Facil.git
```

### 2. Entre na pasta

```bash
cd Parcela-Facil
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure as variáveis de ambiente

Crie um arquivo chamado `.env` na raiz do projeto e configure as variáveis necessárias:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase
GEMINI_API_KEY=sua_chave_da_api_gemini
```

**Importante:** nunca compartilhe ou envie suas chaves secretas para o GitHub. Utilize valores próprios no seu ambiente local e configure os segredos de produção diretamente na plataforma de hospedagem.

### 5. Execute a aplicação

```bash
npm run dev
```

## 🏗️ Estrutura geral

O projeto utiliza uma arquitetura com frontend e backend:

- **Frontend:** interface desenvolvida com React, TypeScript e Vite.
- **Backend:** serviços e rotas desenvolvidos com Node.js e Express.
- **Autenticação e dados:** integração com Supabase.
- **Inteligência artificial:** integração com Google Gemini para leitura de documentos.

## 🔒 Segurança

O projeto utiliza autenticação para proteger o acesso dos usuários e variáveis de ambiente para manter credenciais fora do código-fonte.

As chaves privadas devem permanecer exclusivamente no ambiente seguro do servidor.

## 🚀 Deploy

A aplicação está publicada utilizando a plataforma Vercel.

🔗 **Aplicação online: https://parcela-facil-five.vercel.app/

## 👨‍💻 Desenvolvedor

**Diego Oliveira**

Estudante de Engenharia de Software, interessado em desenvolvimento de software, Java, tecnologia e soluções que resolvem problemas do dia a dia.

- GitHub: [Diego260807](https://github.com/Diego260807)
- LinkedIn: [Diego Oliveira](https://www.linkedin.com/in/diego-oliveira-dev07/)

