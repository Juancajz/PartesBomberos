from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Bombero
from .serializers import BomberoSerializer

class BomberoViewSet(viewsets.ModelViewSet):
    # Traemos todos los bomberos activos
    queryset = Bombero.objects.filter(is_active=True).order_by('last_name')
    serializer_class = BomberoSerializer

    # --- ESTA ES LA FUNCIÓN QUE FALTABA ---
    @action(detail=False, methods=['get'])
    def me(self, request):
        # Si el usuario está logueado, devolvemos sus propios datos
        if request.user.is_authenticated:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        return Response({"error": "No autorizado"}, status=401)