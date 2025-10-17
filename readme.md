# Projeto Móvel (Titulo do projeto) 

Projeto da disciplina de programação de dispositivos móveis com ReactNative + Expo (Android)

Orientador: Prof. Luiz Gustavo Turatti

A solução compartilhada neste repositório consiste no desenvolvimento de uma plataforma para ...

## Equipe do projeto

202402360231 - Guilherme Proton Silva dos Santos 

Matrícula - NomeCompleto2

Matrícula - NomeCompleto3

## Sumário

1. Requisitos
2. Configuração de acesso aos dados
3. Estrutura do projeto
4. Instale os requisitos do projeto
5. Executando o projeto
6. Telas do projeto

A ordem dos itens do sumário pode e deve ser ajustada para melhor entendimento sobre o seu projeto

Lembre-se que todas as instruções presentes neste arquivo devem permitir que outra pessoa seja capaz de clonar o repositório público e seguir os passos para utilizar o projeto


## 🔧 Requisitos:

- NodeJS LTS versão X.Y.Z

- React Native versão X.Y.Z

- ExpoGo (link googlePlayStore) / (link applePlayStore)

- Banco de dados: QUAL??? Por exemplo: SQLite. Especificar as tabelas criadas e utilizadas

### 🗃️ Tabela 'usuarios' com os seguintes campos:
```
id: UUID or int (primary key)
timestamp: timestamp
nomeCompleto: text (nullable)
telefone: text (nullable)
email: text (nullable)
```

## 🔐 Configuração de acesso ao banco de dados
```
DATABASE_URL=https://backend_do_seu_projeto.com
DATABASE_KEY=chave_de_acesso
```

## 📁 Estrutura do projeto:
```
nomeDoProjeto/
├── apresentacao
│   ├── apresentacao.pdf
│   └── apresentacao.pptx
├── backend
│   ├── src
│   ├── .gitignore
│   ├── readme.md
│   └── ...demais arquivos
├── documentacao
│   ├── 01_cartaDeApresentacao.pdf
│   ├── 02_cartaDeAutorizacao.pdf
│   ├── 03_declaracaoDeUsoDeDadosPublicos.pdf
│   ├── 04_roteiroDeExtensao.pdf
│   └── documentacao.md
├── frontend
│   ├── assets
│   ├── src
│   ├── .gitignore
│   ├── package.json
│   ├── readme.md
│   └── ...demais arquivos
├── video
│   ├── apresentacao.gif
│   ├── apresentacao.mkv
│   ├── apresentacao.mp4
│   └── video.txt  O conteúdo deste arquivo deve ser o local público onde está o vídeo caso tenha mais de 10MB
└── readme.md  Este arquivo é uma visão geral do projeto e não precisa ser idêntico a este arquivo
```

## 📦 Instale os requisitos do projeto:

Instruções para instalação em um computador com Windows 11

Caso não tenha o chocolatey instalado, inicie o preparo do sistema abrindo um terminar do powershell com privilégio de administrador

```
PS> Set-ExecutionPolicy AllSigned

PS> Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

PS> choco --version
```

Com o chocolatey instalado, continuamos com a instalação dos requisitos do projeto

```
PS> choco install nodejs-lts -y

PS> choco install openjdk17 -y

PS> choco install nvm -y
```

## 🚀 Execute o projeto:

```
npx expo start
```

## Telas do projeto

Capture todas as telas do projeto e identifique-as

Tela 1: login

Tela 2: criacao de usuario

Tela 3: recuperacao de senha

Tela 4: tela inicial

...e assim por diante
