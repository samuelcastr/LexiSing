# proyecto_lexiSing

## Estructura del repositorio

- `back_lexiSing/` - Backend con Django y Django REST Framework
- `front_lexiSing/` - Frontend con Angular

## Convenciones de Git

### Ramas

- `main` - rama de producción estable
- `develop` - rama de integración para desarrollo diario
- `feature/<nombre>` - nuevas funcionalidades o mejoras
- `bugfix/<nombre>` - corrección de errores
- `hotfix/<nombre>` - arreglos urgentes en producción
- `<cielo>` - arreglos urgentes en producción
- `<beickert>` - arreglos urgentes en producción
- `<juan>` - arreglos urgentes en producción
- `<samuel>` - arreglos urgentes en producción

#### Ejemplos`

- `feature/login-usuario`
- `bugfix/corregir-inicio-sesion`
- `hotfix/ajuste-deploy`

### Commits

Usar mensajes claros y en español.

Formato recomendado:

```text
<tipo>(<alcance>): <descripción corta>

<descripción más detallada opcional>
```

Tipos permitidos:

- `feat` - nueva funcionalidad
- `fix` - corrección de bug
- `docs` - documentación
- `style` - formato/correcciones menores sin cambio lógico
- `refactor` - refactorización sin cambio de comportamiento
- `test` - pruebas
- `chore` - tareas de mantenimiento

Ejemplos:

- `feat(auth): agregar login con JWT`
- `fix(api): corregir endpoint de usuarios`
- `docs: actualizar README global`

### Pull Requests / Merge Requests

- Cada PR debe tener título claro y descripción del cambio.
- Referenciar issue o ticket si aplica.
- Revisar al menos 1 compañero antes de merge.
- No hacer merge directo a `main` sin aprobación.
- `develop` debe ser la rama base para la mayoría de PRs.

## Responsables del equipo

- Beickert Torres
- Cielo Rodríguez
- Juan Riveros
- Samuel Castro

## Buenas prácticas

- Trabajar siempre desde una rama de tipo `feature/` o `bugfix/`.
- Mantener commits pequeños y enfocados.
- Actualizar la rama `develop` antes de abrir un PR.
- Usar `git pull --rebase` cuando corresponda para evitar merges innecesarios.
- Documentar los cambios importantes en los README locales de `back_lexiSing` y `front_lexiSing` si aplica.

## Cómo empezar

### Backend

```bash
cd back_lexiSing
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd front_lexiSing
npm install
ng serve
```

## Verificar el proyecto

Para un compañero o docente que quiera comprobar el proyecto:

1. Clonar el repositorio y abrir el proyecto:
   ```bash
git clone <url-del-repositorio>
cd proyecto_lexiSing
```
2. Correr el backend:
   ```bash
cd back_lexiSing
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
3. Abrir el backend en el navegador o usar `curl`:
   ```bash
curl -sSf http://127.0.0.1:8000/api/health/
```
4. Correr el frontend en otra terminal:
   ```bash
cd front_lexiSing
npm install
ng serve
```
5. Verificar la aplicación en el navegador:
   - Backend: `http://127.0.0.1:8000/`
   - Frontend: `http://localhost:4200/`

> Nota: Si el servidor Django muestra migraciones pendientes, ejecutar `python manage.py migrate` antes de levantarlo.
