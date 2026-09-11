import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// O Aspire escolhe a porta do front-end e a informa em PORT, mas o Vite nao le PORT por
// conta propria (o default dele e 5173). Os dois campos de server saem do MESMO valor
// parseado, de proposito: se derivarem de expressoes diferentes, um PORT invalido levaria
// o Vite para 5173 com strictPort ligado, prendendo o servidor na porta errada.
const portaDoAspire = Number(process.env.PORT)
const portaValida = Number.isInteger(portaDoAspire) && portaDoAspire > 0

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // Com porta valida do Aspire, strictPort liga: e melhor falhar alto do que o Vite
    // migrar de porta e desalinhar do link anunciado no dashboard. Sem PORT (ou com PORT
    // invalido), cai em 5173 com strictPort desligado — o comportamento de hoje.
    port: portaValida ? portaDoAspire : 5173,
    strictPort: portaValida,
  },
})
