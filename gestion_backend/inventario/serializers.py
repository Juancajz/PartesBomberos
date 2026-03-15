from rest_framework import serializers
from .models import Material

class MaterialSerializer(serializers.ModelSerializer):
    nombre_carro = serializers.ReadOnlyField(source='carro.identificacion')

    class Meta:
        model = Material
        fields = '__all__'