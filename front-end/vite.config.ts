import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // O Aspire escolhe a porta do front-end e a informa em PORT, mas o Vite nao le PORT
    // por conta propria (o default dele e 5173). strictPort so quando o Aspire manda a
    // porta: e melhor falhar alto do que o Vite migrar de porta e desalinhar do link
    // anunciado no dashboard. Fora do Aspire, o comportamento de hoje e preservado.
    port: Number(process.env.PORT) || 5173,
    strictPort: Boolean(process.env.PORT),
  },
})
