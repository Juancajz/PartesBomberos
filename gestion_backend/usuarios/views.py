from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated 
from .models import Bombero
from .serializers import BomberoSerializer
from .permissions import PermisoGestionPersonal 

class BomberoViewSet(viewsets.ModelViewSet):
    
    queryset = Bombero.objects.filter(is_active=True).order_by('last_name')
    serializer_class = BomberoSerializer
    permission_classes = [PermisoGestionPersonal] 

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):

        if request.user.is_authenticated:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        return Response({"error": "No autorizado"}, status=401)