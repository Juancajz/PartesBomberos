from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Carro
from .serializers import CarroSerializer

class CarroViewSet(viewsets.ModelViewSet):
    queryset = Carro.objects.all().order_by('nombre')
    serializer_class = CarroSerializer