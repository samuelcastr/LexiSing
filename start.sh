#!/bin/bash

# Script de inicio rápido - Fase 1 LexiSing

echo "🚀 Iniciando LexiSing - Fase 1"
echo "================================"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend
echo -e "\n${BLUE}🔧 Iniciando Backend (Django)...${NC}"
cd back_lexiSing
source .venv/bin/activate 2>/dev/null || echo "⚠️ Virtual env no encontrado. Ejecuta: python -m venv .venv"
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend en http://localhost:8000${NC}"
echo -e "${YELLOW}  PID: $BACKEND_PID${NC}"

# Frontend
echo -e "\n${BLUE}🎨 Iniciando Frontend (Angular)...${NC}"
cd ../front-lexi-sing
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend en http://localhost:4200${NC}"
echo -e "${YELLOW}  PID: $FRONTEND_PID${NC}"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✓ LexiSing iniciado correctamente${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📱 Acceso:"
echo "  Frontend:  http://localhost:4200"
echo "  Backend:   http://localhost:8000"
echo "  Admin:     http://localhost:8000/admin/"
echo ""
echo "📝 Parar servidores:"
echo "  kill $BACKEND_PID   # Backend"
echo "  kill $FRONTEND_PID  # Frontend"
echo ""
echo "📖 Ver logs:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""

# Mantener script activo
wait
