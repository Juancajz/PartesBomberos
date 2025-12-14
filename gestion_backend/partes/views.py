from rest_framework import viewsets
from .models import TipoEmergencia, SubTipoEmergencia, Parte, AsistenciaCarro, AsistenciaBombero
from .serializers import (
    TipoEmergenciaSerializer, 
    SubTipoEmergenciaSerializer, 
    ParteSerializer,
    AsistenciaCarroSerializer,
    AsistenciaBomberoSerializer
)
from usuarios.permissions import PermisoPartes, PermisoMasterData 

class TipoEmergenciaViewSet(viewsets.ModelViewSet):
    queryset = TipoEmergencia.objects.all().order_by('codigo') 
    serializer_class = TipoEmergenciaSerializer
    permission_classes = [PermisoMasterData]

class SubTipoEmergenciaViewSet(viewsets.ModelViewSet):
    queryset = SubTipoEmergencia.objects.all()
    serializer_class = SubTipoEmergenciaSerializer
    permission_classes = [PermisoMasterData]

class ParteViewSet(viewsets.ModelViewSet):
    queryset = Parte.objects.all().order_by('-fecha_hora_emergencia')
    serializer_class = ParteSerializer
    permission_classes = [PermisoPartes]

class AsistenciaCarroViewSet(viewsets.ModelViewSet):
    queryset = AsistenciaCarro.objects.all()
    serializer_class = AsistenciaCarroSerializer
    permission_classes = [PermisoPartes]

class AsistenciaBomberoViewSet(viewsets.ModelViewSet):
    queryset = AsistenciaBombero.objects.all()
    serializer_class = AsistenciaBomberoSerializer
    permission_classes = [PermisoPartes]