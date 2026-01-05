from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Bombero, GuardiaNocturna
from .serializers import BomberoSerializer, GuardiaNocturnaSerializer

class BomberoViewSet(viewsets.ModelViewSet):
    queryset = Bombero.objects.all()
    serializer_class = BomberoSerializer

class GuardiaNocturnaViewSet(viewsets.ModelViewSet):
    queryset = GuardiaNocturna.objects.all()
    serializer_class = GuardiaNocturnaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        mes = self.request.query_params.get('mes')
        anio = self.request.query_params.get('anio')
        if mes and anio:
            queryset = queryset.filter(fecha__month=mes, fecha__year=anio)
        return queryset

    def create(self, request, *args, **kwargs):

        fecha = request.data.get('fecha')
        guardia_existente = GuardiaNocturna.objects.filter(fecha=fecha).first()
        if guardia_existente:
            serializer = self.get_serializer(guardia_existente, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Si no existe, creamos una nueva (POST normal)
            return super().create(request, *args, **kwargs)