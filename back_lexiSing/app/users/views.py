from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from app.core.authentication import FirebaseAuthentication
class UserProfileView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request): return Response({'uid': request.auth.get('uid','unknown') if isinstance(request.auth,dict) else str(request.auth)})
class UsersListView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request): return Response({'usuarios': []})
class HealthCheckView(APIView):
    permission_classes = []
    def get(self, request): return Response({'status': 'ok', 'service': 'LexiSing Backend'})
