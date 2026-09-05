import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from app.core.authentication import FirebaseAuthentication
from .serializers import TextFormalizeSerializer
from .services import GroqService

logger = logging.getLogger(__name__)


class TextFormalizeView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            if not request.auth:
                return Response(
                    {'detail': 'Autenticación requerida.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            serializer = TextFormalizeSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            gestos = serializer.validated_data['gestos']
            contexto = serializer.validated_data['contexto']

            uid = request.auth.get('uid', 'unknown') if isinstance(request.auth, dict) else str(request.auth)
            logger.info('Formalización solicitada por %s: %s', uid, gestos)

            service = GroqService()
            resultado = service.formalizar(gestos, contexto)

            return Response({
                'texto_formal': resultado['texto'],
                'gestos_originales': gestos,
                'fuente': resultado['fuente'],
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception('Error en TextFormalizeView')
            gestos_fallback = []
            if hasattr(serializer, 'validated_data'):
                gestos_fallback = serializer.validated_data.get('gestos', [])
            texto_fallback = ' '.join(gestos_fallback) if gestos_fallback else ''
            return Response({
                'texto_formal': texto_fallback,
                'gestos_originales': gestos_fallback,
                'fuente': 'fallback',
                'error': str(e),
            }, status=status.HTTP_200_OK)
