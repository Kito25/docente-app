# DocenteApp 📚

Aplicación móvil para docentes que digitaliza la gestión de asistencia y calificaciones en tiempo real.

Desarrollada como proyecto de tesis para la Tecnicatura en Desarrollo de Software.

---

## 📱 Funcionalidades

- **Autenticación** — Registro e inicio de sesión seguro por docente
- **Gestión de cursos** — Crear y administrar cursos con materia asignada
- **Gestión de alumnos** — Agregar alumnos a cada curso
- **Asistencia digital** — Tomar lista con un toque, detección automática de duplicados por día
- **Calificaciones** — Cargar notas con descripción, cálculo automático de promedio con indicadores visuales

---

## 🛠️ Stack tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| Frontend | React Native + Expo | Interfaz móvil Android/iOS |
| Backend | Supabase (BaaS) | API REST, autenticación, seguridad |
| Base de datos | PostgreSQL (via Supabase) | Persistencia de datos |
| Sesión local | AsyncStorage | Persistencia de sesión en el dispositivo |

---

## 🗄️ Modelo de datos

El sistema cuenta con 5 entidades principales:

- **auth_users** — Docentes registrados (manejado por Supabase Auth)
- **cursos** — Cursos creados por cada docente
- **alumnos** — Alumnos pertenecientes a un curso
- **asistencias** — Registro diario de presencia por alumno y curso
- **calificaciones** — Notas con descripción, valor numérico y fecha

### Relaciones
- Un docente puede tener muchos cursos
- Un curso puede tener muchos alumnos
- Un alumno puede tener muchas asistencias y calificaciones

---

## 🔐 Seguridad

Se implementó **Row Level Security (RLS)** en todas las tablas. Cada docente solo puede ver y modificar sus propios datos, garantizando privacidad total entre usuarios.

---

## 🚀 Cómo correr el proyecto

### Requisitos
- Node.js v22 o superior
- Expo Go instalado en el dispositivo móvil

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Kito25/docente-app.git

# Entrar a la carpeta
cd docente-app

# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar el servidor de desarrollo
npx expo start
```

Escaneá el QR con Expo Go para ver la app en tu dispositivo.

---

## 📁 Estructura del proyecto

```
docente-app/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── screens/
│   │   ├── auth/         # Login y registro
│   │   └── app/          # Pantallas principales
│   ├── navigation/       # Configuración de navegación
│   └── lib/
│       └── supabase.js   # Cliente de Supabase
├── App.js                # Punto de entrada
└── README.md
```

---

## 👨‍💻 Autor

Desarrollado por **Franco Martin** — Tecnicatura en Desarrollo de Software