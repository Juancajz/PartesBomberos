from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Bombero, GuardiaNocturna
from .serializers import BomberoSerializer, GuardiaNocturnaSerializer

class BomberoViewSet(viewsets.ModelViewSet):
    queryset = Bombero.objects.all()
    serializer_class = BomberoSerializer
    @action(detail=False, methods=['get'])
    def me(self, request):
        if request.user.is_authenticated:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        return Response({"detail": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
    
class GuardiaNocturnaViewSet(viewsets.ModelViewSet):
    queryset = GuardiaNocturna.objects.all()
    serializer_class = GuardiaNocturnaSerializer
    def get_queryset(self):
        queryset = super().get_queryset()
        mes = self.request.query_params.get('mes')
        anio = self.request.query_params.get('anio')
        if mes and anio:
            queryset = queryset.filter(fecha_inicio__month=mes, fecha_inicio__year=anio)
        return queryset
    def create(self, request, *args, **kwargs):
        fecha_dato = request.data.get('fecha') or request.data.get('fecha_inicio')
        guardia_existente = GuardiaNocturna.objects.filter(fecha_inicio=fecha_dato).first()
        if guardia_existente:
            serializer = self.get_serializer(guardia_existente, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return super().create(request, *args, **kwargs)