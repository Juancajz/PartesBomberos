from rest_framework import viewsets
from .models import TipoEmergencia, SubTipoEmergencia, Parte, AsistenciaCarro, AsistenciaBombero
from .serializers import (
    TipoEmergenciaSerializer, 
    SubTipoEmergenciaSerializer, 
    ParteSerializer,
    AsistenciaCarroSerializer,
    AsistenciaBomberoSerializer
)

class TipoEmergenciaViewSet(viewsets.ModelViewSet):
    queryset = TipoEmergencia.objects.all().order_by('codigo')
    serializer_class = TipoEmergenciaSerializer

class SubTipoEmergenciaViewSet(viewsets.ModelViewSet):
    queryset = SubTipoEmergencia.objects.all()
    serializer_class = SubTipoEmergenciaSerializer

class ParteViewSet(viewsets.ModelViewSet):
    queryset = Parte.objects.all().order_by('-fecha_hora_emergencia')
    serializer_class = ParteSerializer

# --- Vistas Nuevas para las Asistencias ---
class AsistenciaCarroViewSet(viewsets.ModelViewSet):
    queryset = AsistenciaCarro.objects.all()
    serializer_class = AsistenciaCarroSerializer

class AsistenciaBomberoViewSet(viewsets.ModelViewSet):
    queryset = AsistenciaBombero.objects.all()
    serializer_class = AsistenciaBomberoSerializer