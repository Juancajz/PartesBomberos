from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Material
from .serializers import MaterialSerializer
# Importamos Carro para poder buscarlo
from carros.models import Carro

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by('categoria', 'nombre')
    serializer_class = MaterialSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['carro', 'categoria', 'estado']

    # --- AQUÍ DEFINIMOS LAS LISTAS PREDEFINIDAS ---
    PAUTAS_ESTANDAR = {
        'BOMBA': [
            {'nombre': 'Manguera 70mm', 'categoria': 'AGUA', 'cantidad': 10, 'ubicacion': 'Cama Baja'},
            {'nombre': 'Manguera 50mm', 'categoria': 'AGUA', 'cantidad': 8, 'ubicacion': 'Cajoneras'},
            {'nombre': 'Pitón Protek', 'categoria': 'AGUA', 'cantidad': 2, 'ubicacion': 'Cajonera 1'},
            {'nombre': 'Hacha Bombero', 'categoria': 'HERRAMIENTAS', 'cantidad': 2, 'ubicacion': 'Cabina'},
            {'nombre': 'Equipo ERA', 'categoria': 'EPP', 'cantidad': 4, 'ubicacion': 'Cabina'},
            {'nombre': 'Radio Portátil', 'categoria': 'COMUNICACION', 'cantidad': 4, 'ubicacion': 'Cabina'},
        ],
        'RESCATE': [
            {'nombre': 'Equipo Hidráulico (Holmatro)', 'categoria': 'RESCATE', 'cantidad': 1, 'ubicacion': 'Cajonera 1'},
            {'nombre': 'Tabla Espinal', 'categoria': 'TRAUMA', 'cantidad': 2, 'ubicacion': 'Techo'},
            {'nombre': 'Collar Cervical', 'categoria': 'TRAUMA', 'cantidad': 5, 'ubicacion': 'Bolso Médico'},
            {'nombre': 'Halligan', 'categoria': 'HERRAMIENTAS', 'cantidad': 1, 'ubicacion': 'Cajonera 2'},
            {'nombre': 'Conos de Seguridad', 'categoria': 'HERRAMIENTAS', 'cantidad': 6, 'ubicacion': 'Techo'},
        ],
        'FORESTAL': [
            {'nombre': 'McLeod', 'categoria': 'HERRAMIENTAS', 'cantidad': 4, 'ubicacion': 'Techo/Caja'},
            {'nombre': 'Gorgui', 'categoria': 'HERRAMIENTAS', 'cantidad': 2, 'ubicacion': 'Caja Herramientas'},
            {'nombre': 'Batefuegos', 'categoria': 'HERRAMIENTAS', 'cantidad': 4, 'ubicacion': 'Techo'},
            {'nombre': 'Bomba de Espalda', 'categoria': 'AGUA', 'cantidad': 2, 'ubicacion': 'Cabina'},
            {'nombre': 'Manguera Forestal 38mm', 'categoria': 'AGUA', 'cantidad': 10, 'ubicacion': 'Cajoneras'},
            {'nombre': 'Motosierra', 'categoria': 'HERRAMIENTAS', 'cantidad': 1, 'ubicacion': 'Bandeja Deslizable'},
        ]
    }

    # --- ESTA ES LA NUEVA ACCIÓN ---
    @action(detail=False, methods=['post'])
    def cargar_pauta(self, request):
        carro_id = request.data.get('carro_id')
        tipo_pauta = request.data.get('tipo_pauta') # Ej: 'BOMBA' o 'RESCATE'

        try:
            carro = Carro.objects.get(id=carro_id)
        except Carro.DoesNotExist:
            return Response({'error': 'Carro no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        lista_items = self.PAUTAS_ESTANDAR.get(tipo_pauta)
        if not lista_items:
            return Response({'error': 'Tipo de pauta no válido'}, status=status.HTTP_400_BAD_REQUEST)

        # Crear los objetos
        nuevos_materiales = []
        for item in lista_items:
            nuevos_materiales.append(Material(
                carro=carro,
                nombre=item['nombre'],
                categoria=item['categoria'],
                cantidad=item['cantidad'],
                ubicacion=item['ubicacion'],
                estado='OPERATIVO'
            ))
        
        # Guardarlos todos de una vez (más eficiente)
        Material.objects.bulk_create(nuevos_materiales)

        return Response({'status': 'success', 'mensaje': f'Se agregaron {len(nuevos_materiales)} ítems al carro.'})