# Voice PPT

### Apresente PDFs usando voz, gestos ou teclado

**Voice PPT** é uma aplicação web para apresentações em PDF que permite avançar e voltar slides sem tocar no computador.

O projeto combina reconhecimento de voz do navegador com reconhecimento de gestos por visão computacional. A ideia é simples: durante uma aula, palestra ou apresentação, o apresentador pode continuar se movimentando enquanto controla os slides de forma natural.

**Demo:** https://voice-ppt-kappa.vercel.app

## Principais recursos

- upload de apresentações em PDF;
- navegação por comandos de voz em português;
- navegação por gestos capturados pela webcam;
- atalhos de teclado como fallback;
- modo tela cheia;
- preview opcional da câmera;
- renderização de PDF diretamente no navegador;
- proteção contra comandos repetidos e falsos positivos;
- fallback de processamento de gestos de GPU para CPU.

## Comandos

### Voz

Exemplos reconhecidos para avançar:

- próximo / próxima;
- passar;
- avançar;
- frente;
- segue.

Exemplos para voltar:

- voltar;
- anterior;
- trás / atrás.

O reconhecimento usa correspondência por palavras completas para reduzir falsos acionamentos.

### Gestos

Com MediaPipe:

- **Open Palm** → próximo slide;
- **Closed Fist** → slide anterior.

Um gesto precisa aparecer em múltiplos frames consecutivos e superar o limite mínimo de confiança antes de gerar um comando.

## Stack

- **React 19**
- **TypeScript**
- **Vite**
- **PDF.js**
- **MediaPipe Tasks Vision**
- **Web Speech API / SpeechRecognition**
- **Motion**
- **Tailwind CSS**
- **Lucide React**

## Arquitetura do controle

```text
              ┌─ Voz ─────────────┐
              │                   │
PDF → Viewer ←┼─ Gestos ──────────┼→ NEXT / PREV
              │                   │
              └─ Teclado ─────────┘
```

Os três mecanismos convergem para a mesma função de navegação. Isso mantém o componente de apresentação independente do tipo de entrada utilizado.

## Tratamento de confiabilidade

Reconhecimento contínuo de voz e visão em tempo real geram ruído. O projeto inclui algumas decisões específicas para lidar com isso:

- cooldown entre comandos de voz;
- reinicialização controlada do reconhecedor de fala;
- análise das alternativas fornecidas pelo mecanismo de reconhecimento;
- exigência de frames consecutivos para confirmar gestos;
- limiar mínimo de confiança;
- fallback automático de MediaPipe GPU → CPU;
- limpeza da câmera e dos recursos quando o componente é encerrado.

## Executar localmente

```bash
git clone https://github.com/rodrigoniskier/voice_ppt.git
cd voice_ppt
npm install
npm run dev
```

Validação de tipos:

```bash
npm run lint
```

Build:

```bash
npm run build
```

## Compatibilidade

O controle por voz depende da implementação de `SpeechRecognition` do navegador. Chrome e Edge tendem a oferecer a melhor compatibilidade.

O controle por gestos exige acesso à câmera e carrega os recursos necessários do MediaPipe.

## Por que este projeto está no portfólio

Voice PPT demonstra integração de **APIs nativas do navegador, processamento de PDF, reconhecimento de voz e visão computacional no frontend**, com atenção a estado, latência e tolerância a falsos comandos.

---

Desenvolvido por [Rodrigo Niskier](https://github.com/rodrigoniskier).
