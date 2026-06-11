from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from app.core.authentication import FirebaseAuthentication
from rest_framework import status
from app.core.firebase import db

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({'status': 'ok', 'backend': 'LexiSing Django API'})


class UserProfileView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtener perfil del usuario autenticado."""
        uid = request.auth[0] if isinstance(request.auth, tuple) else request.auth
        return Response({
            'uid': uid,
            'message': 'Perfil del usuario autenticado',
            'decoded_token': request.auth[1] if isinstance(request.auth, tuple) else {}
        })


class ConversationsListView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Listar conversaciones del usuario autenticado."""
        uid = request.auth[0] if isinstance(request.auth, tuple) else request.auth
        # En Firestore se guardan; aquí retornamos metadata/estadísticas
        return Response({
            'uid': uid,
            'message': 'Listado de conversaciones del usuario',
            'conversations': []
        })
    
    def post(self, request):
        """Crear una conversación."""
        uid = request.auth[0] if isinstance(request.auth, tuple) else request.auth
        participants = request.data.get('participants', [])
        if uid not in participants:
            participants.append(uid)
        
        return Response({
            'message': 'Conversación creada',
            'conversation': {
                'participants': participants,
                'created_by': uid,
            }
        }, status=status.HTTP_201_CREATED)
    
class UsersListView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        try:

            usuarios_ref = db.collection(
                'usuarios'
            )

            docs = usuarios_ref.stream()

            users = []

            for doc in docs:

                data = doc.to_dict()

                users.append({
                    'uid': data.get('uid'),
                    'nombre': data.get('nombre'),
                    'email': data.get('email')
                })

            return Response(
                users,
                status=200
            )

        except Exception as e:

            return Response(
                {
                    'error': str(e)
                },
                status=500
            )