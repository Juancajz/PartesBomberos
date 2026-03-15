from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets
from .models import Carro
from .serializers import CarroSerializer
from partes.models import AsistenciaCarro

class CarroViewSet(viewsets.ModelViewSet):
    queryset = Carro.objects.all().order_by('nombre')
    serializer_class = CarroSerializer

@api_view(['GET'])
def obtener_ultimo_km(request, carro_id):
    ultimo_registro = AsistenciaCarro.objects.filter(
        carro_id=carro_id
    ).order_by('-parte__fecha_hora_emergencia', '-id').first() 
    km_actual = ultimo_registro.km_llegada if ultimo_registro else 0
    print(f"Consulta KM Carro {carro_id}: Último registro ID {ultimo_registro.id if ultimo_registro else 'None'} con KM {km_actual}")
    return Response({'ultimo_km': km_actual})