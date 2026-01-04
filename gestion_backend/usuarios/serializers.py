from rest_framework import serializers
from .models import Bombero

class BomberoSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    rango_texto = serializers.SerializerMethodField()
    compania_texto = serializers.SerializerMethodField()

    class Meta:
        model = Bombero
        # --- AGREGAMOS: email, fecha_nacimiento, fecha_ingreso ---
        fields = [
            'id', 'username', 'password', 'first_name', 'last_name','nombre_completo', 'rut', 'email', 'fecha_nacimiento', 
            'fecha_ingreso','foto','rango', 'rango_texto', 'compania', 'compania_texto', 'is_staff', 'is_active','telefono', 
            'direccion', 'contacto_emergencia_nombre', 'contacto_emergencia_telefono','grupo_sanguineo', 'alergias', 
            'enfermedades_cronicas', 'talla_polera', 'talla_pantalon', 'talla_calzado'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'rut': {'required': False, 'allow_blank': True}
        }

    def validate_rut(self, value):
        if not value: return None
        return value

    def get_nombre_completo(self, obj):
        try:
            nombre = obj.get_full_name()
            return nombre if nombre and nombre.strip() else obj.username
        except: return "Usuario Desconocido"

    def get_rango_texto(self, obj):
        try: return obj.get_rango_display() or "Sin Rango"
        except: return "Rango Error"

    def get_compania_texto(self, obj):
        try: return obj.get_compania_display() or "Sin Compañía"
        except: return "Cía Error"

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password: instance.set_password(password)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password: instance.set_password(password)
        instance.save()
        return instance