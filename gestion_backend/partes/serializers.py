from rest_framework import serializers
from .models import TipoEmergencia, SubTipoEmergencia, Parte, AsistenciaCarro, AsistenciaBombero, ApoyoExterno
from usuarios.serializers import BomberoSerializer
from carros.serializers import CarroSerializer
from usuarios.models import Bombero
from carros.models import Carro

# --- 1. SERIALIZERS HIJOS (Deben ir PRIMERO) ---

class TipoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta: model = TipoEmergencia; fields = '__all__'

class SubTipoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta: model = SubTipoEmergencia; fields = '__all__'

class AsistenciaBomberoSerializer(serializers.ModelSerializer):
    bombero_detalle = BomberoSerializer(source='bombero', read_only=True)
    class Meta: model = AsistenciaBombero; fields = '__all__'

class AsistenciaCarroSerializer(serializers.ModelSerializer):
    carro_detalle = CarroSerializer(source='carro', read_only=True)
    conductor_detalle = BomberoSerializer(source='conductor', read_only=True)
    class Meta: model = AsistenciaCarro; fields = '__all__'

class ApoyoExternoSerializer(serializers.ModelSerializer):
    class Meta: model = ApoyoExterno; fields = '__all__'

# --- 2. SERIALIZER PRINCIPAL ---

class ParteSerializer(serializers.ModelSerializer):
    # LECTURA (Nested Serializers)
    asistencias_carros = AsistenciaCarroSerializer(many=True, read_only=True)
    asistencias_bomberos = AsistenciaBomberoSerializer(many=True, read_only=True)
    apoyos_externos = ApoyoExternoSerializer(many=True, read_only=True) 
    
    tipo_detalle = TipoEmergenciaSerializer(source='tipo_emergencia', read_only=True)
    subtipo_detalle = SubTipoEmergenciaSerializer(source='subtipo_emergencia', read_only=True)
    
    jefe_nombre = serializers.SerializerMethodField()
    anotador_nombre = serializers.SerializerMethodField()

    # ESCRITURA
    carros_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    bomberos_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    apoyo_externo = serializers.DictField(write_only=True, required=False) 

    subtipo_emergencia = serializers.PrimaryKeyRelatedField(queryset=SubTipoEmergencia.objects.all(), required=False, allow_null=True)
    hora_extincion = serializers.TimeField(required=False, allow_null=True)

    maquinista_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    km_salida = serializers.IntegerField(write_only=True, required=False, default=0)
    km_llegada = serializers.IntegerField(write_only=True, required=False, default=0)
    
    hora_salida_cuartel = serializers.TimeField(write_only=True, required=False, allow_null=True)
    hora_llegada_emergencia = serializers.TimeField(write_only=True, required=False, allow_null=True)
    hora_control_emergencia = serializers.TimeField(write_only=True, required=False, allow_null=True)
    hora_termino_emergencia = serializers.TimeField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Parte
        fields = '__all__'

    # MÉTODOS SEGUROS PARA NOMBRES
    def get_jefe_nombre(self, obj):
        try:
            if obj.jefe_a_cargo:
                return obj.jefe_a_cargo.get_full_name() or obj.jefe_a_cargo.username
        except: return "Error Usuario"
        return "Sin registro"

    def get_anotador_nombre(self, obj):
        try:
            if obj.quien_anoto:
                return obj.quien_anoto.get_full_name() or obj.quien_anoto.username
        except: return "Error Usuario"
        return "Sin registro"

    # GUARDADO
    def create(self, validated_data):
        # 1. Extraer datos extra
        carros_ids = validated_data.pop('carros_ids', [])
        bomberos_ids = validated_data.pop('bomberos_ids', []) # Lista manual (botones)
        apoyo_externo_data = validated_data.pop('apoyo_externo', {})
        
        maquinista_id = validated_data.pop('maquinista_id', None)
        km_salida = validated_data.pop('km_salida', 0)
        km_llegada = validated_data.pop('km_llegada', 0)
        
        h_salida = validated_data.pop('hora_salida_cuartel', None)
        h_llegada = validated_data.pop('hora_llegada_emergencia', None)
        h_control = validated_data.pop('hora_control_emergencia', None)
        h_termino = validated_data.pop('hora_termino_emergencia', None)

        # 2. Crear Parte
        parte = Parte.objects.create(**validated_data)

        # 3. Guardar Apoyo Externo
        if apoyo_externo_data:
            for institucion, datos in apoyo_externo_data.items():
                if datos.get('activo'):
                    ApoyoExterno.objects.create(
                        parte=parte,
                        institucion=institucion.upper(),
                        a_cargo=datos.get('a_cargo'),
                        patente=datos.get('patente'),
                        cantidad=int(datos.get('cantidad') or 0)
                    )

        # 4. Asistencias Carros
        for carro_id in carros_ids:
            AsistenciaCarro.objects.create(
                parte=parte,
                carro_id=carro_id,
                conductor_id=maquinista_id,
                km_salida=km_salida,
                km_llegada=km_llegada,
                hora_salida_cuartel=h_salida,
                hora_llegada_emergencia=h_llegada,
                hora_retirada_emergencia=h_control,
                hora_llegada_cuartel=h_termino
            )

        # --- AQUÍ ESTÁ LA MAGIA NUEVA ---
        # 5. Unificar lista de bomberos (Manual + Roles Clave)
        todos_los_bomberos = set(bomberos_ids) # Usamos 'set' para evitar duplicados

        # Agregamos automáticamente a los roles clave si existen
        if parte.jefe_a_cargo:
            todos_los_bomberos.add(parte.jefe_a_cargo.id)
        
        if parte.quien_anoto:
            todos_los_bomberos.add(parte.quien_anoto.id)

        if maquinista_id:
            todos_los_bomberos.add(maquinista_id)

        # 6. Guardar Asistencia Bomberos (Ahora incluye a todos)
        for bombero_id in todos_los_bomberos:
            AsistenciaBombero.objects.create(parte=parte, bombero_id=bombero_id)

        return parte