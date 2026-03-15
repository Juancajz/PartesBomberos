from rest_framework import serializers
from .models import TipoEmergencia, SubTipoEmergencia, Parte, AsistenciaCarro, AsistenciaBombero, ApoyoExterno
from usuarios.serializers import BomberoSerializer
from carros.serializers import CarroSerializer
from usuarios.models import Bombero
from carros.models import Carro

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

class ParteSerializer(serializers.ModelSerializer):
    asistencias_carros = AsistenciaCarroSerializer(many=True, read_only=True)
    asistencias_bomberos = AsistenciaBomberoSerializer(many=True, read_only=True)
    apoyos_externos = ApoyoExternoSerializer(many=True, read_only=True) 
    tipo_detalle = TipoEmergenciaSerializer(source='tipo_emergencia', read_only=True)
    subtipo_detalle = SubTipoEmergenciaSerializer(source='subtipo_emergencia', read_only=True)
    
    jefe_nombre = serializers.SerializerMethodField()
    anotador_nombre = serializers.SerializerMethodField()

    # Campos Virtuales para recibir datos
    carros_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    detalle_carros = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    bomberos_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    apoyo_externo = serializers.DictField(write_only=True, required=False) 

    # AQUÍ ESTABA EL ERROR 1: Faltaba avisarle a DRF que recibiríamos estas horas
    hora_salida_cuartel = serializers.TimeField(write_only=True, required=False, allow_null=True)
    hora_llegada_emergencia = serializers.TimeField(write_only=True, required=False, allow_null=True)
    hora_control_emergencia = serializers.TimeField(write_only=True, required=False, allow_null=True)
    hora_llegada_cuartel = serializers.TimeField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Parte
        fields = '__all__'

    # AQUÍ ESTABA EL ERROR 2: Si no tiene nombre_completo, mostramos el username
    def get_jefe_nombre(self, obj):
        if not obj.jefe_a_cargo: return "Sin registro"
        nombre = obj.jefe_a_cargo.get_full_name()
        return nombre if nombre and nombre.strip() else obj.jefe_a_cargo.username

    def get_anotador_nombre(self, obj):
        if not obj.quien_anoto: return "Sin registro"
        nombre = obj.quien_anoto.get_full_name()
        return nombre if nombre and nombre.strip() else obj.quien_anoto.username

    def create(self, validated_data):
        # 1. Extraemos los campos virtuales
        detalle_carros = validated_data.pop('detalle_carros', [])
        bomberos_ids = validated_data.pop('bomberos_ids', [])
        apoyo_externo_data = validated_data.pop('apoyo_externo', {})
        
        # Extraemos las horas para asignarlas a los carros
        h_salida = validated_data.pop('hora_salida_cuartel', None)
        h_llegada = validated_data.pop('hora_llegada_emergencia', None)
        h_control = validated_data.pop('hora_control_emergencia', None)
        h_termino = validated_data.pop('hora_llegada_cuartel', None)

        # 2. Crear Parte
        parte = Parte.objects.create(**validated_data)

        # 3. Guardar Apoyo Externo
        for inst, datos in apoyo_externo_data.items():
            if isinstance(datos, dict) and datos.get('activo'):
                ApoyoExterno.objects.create(
                    parte=parte,
                    institucion=inst.upper(),
                    a_cargo=datos.get('a_cargo', ''),
                    patente=datos.get('patente', ''),
                    cantidad=int(datos.get('cantidad') or 0)
                )

        # 4. Asistencia Carros y unificación de Bomberos
        # Usamos set() para evitar duplicados si alguien está a cargo y también marcado en asistencia
        lista_final_bomberos = set([int(b) for b in bomberos_ids]) 
        
        if parte.jefe_a_cargo: lista_final_bomberos.add(parte.jefe_a_cargo.id)
        if parte.quien_anoto: lista_final_bomberos.add(parte.quien_anoto.id)

        for item in detalle_carros:
            c_id = item.get('conductor_id')
            if c_id: lista_final_bomberos.add(int(c_id))

            AsistenciaCarro.objects.create(
                parte=parte,
                carro_id=item.get('carro_id'),
                conductor_id=c_id if c_id else None,
                km_salida=int(item.get('km_salida') or 0),
                km_llegada=int(item.get('km_llegada') or 0),
                hora_salida_cuartel=item.get('hora_salida') or h_salida,
                hora_llegada_emergencia=item.get('hora_llegada') or h_llegada,
                hora_retirada_emergencia=item.get('hora_control') or h_control,
                hora_llegada_cuartel=item.get('hora_termino') or h_termino
            )

        # 5. Guardar Asistencia Personal Definitiva
        for b_id in lista_final_bomberos:
            if b_id: 
                AsistenciaBombero.objects.create(parte=parte, bombero_id=b_id)

        return parte