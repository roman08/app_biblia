# 📖 Biblia App

Webapp moderna para leer, meditar y estudiar la Palabra de Dios. Incluye lector bíblico (RVR1960), planes de lectura, notas personales, estadísticas y compartir versículos.

## ✨ Funcionalidades

- 📖 **Lector bíblico** con Reina Valera 1960
- 🎯 **Planes de lectura** con progreso persistente
- 📝 **Notas y resaltados** por versículo
- 🔐 **Autenticación** con Google y GitHub
- 🌅 **Versículo del día** (determinístico por fecha)
- 📊 **Estadísticas y racha** de lectura
- 🖼️ **Compartir versículos** con generador de imágenes
- 🌙 **Modo oscuro** con detección del sistema
- 🎯 **Modo lectura enfocado** para inmersión total
- ⌨️ **Atajos de teclado** para navegación rápida
- 🔠 **Ajuste de tamaño de fuente** persistente
- 📱 **PWA instalable** con soporte offline

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| **Next.js** | 16.3.6 | Framework principal (App Router) |
| **React** | 19.2.8 | Librería de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 4.x | Estilos utilitarios |
| **shadcn/ui** | 4.21.0 | Componentes de UI |
| **Base UI** | 1.8.0 | Primitivos headless |
| **Supabase** | 2.117.1 | Auth + PostgreSQL |
| **lucide-react** | 0.468.0 | Iconos |
| **next-pwa** | 10.2.9 | Soporte PWA |
| **Midvash API** | — | Texto bíblico (RVR1960) |

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js** `20.x` o superior ([descargar](https://nodejs.org/))
- **npm** `10.x` o superior (viene con Node.js)
- **Git** ([descargar](https://git-scm.com/))
- **Cuenta en Supabase** ([registrarse gratis](https://supabase.com/))
- **Cuenta en Google Cloud** (para OAuth con Google)
- **Cuenta en GitHub** (para OAuth con GitHub)

### Verificar versiones instaladas

```bash
node --version   # Debe ser v20.x o superior
npm --version    # Debe ser 10.x o superior
git --version    # Cualquier versión reciente