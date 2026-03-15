from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Material
from .serializers import MaterialSerializer
from carros.models import Carro
from usuarios.permissions import PermisoInventarioCRUD 
class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by('categoria', 'nombre')
    serializer_class = MaterialSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['carro', 'categoria', 'estado']
    
    permission_classes = [PermisoInventarioCRUD]

    # --- AQUÍ DEFINIMOS LAS LISTAS PREDEFINIDAS ---
    PAUTAS_ESTANDAR = {
        # En lugar de 'BOMBA', usamos el nombre real del carro
        'B-1': [
            {'nombre': 'Manguera 70mm', 'categoria': 'AGUA', 'cantidad': 10, 'ubicacion': 'Cama Baja'},
            {'nombre': 'Pitón Protek', 'categoria': 'AGUA', 'cantidad': 2, 'ubicacion': 'Cajonera 1'},
            # ... más cosas exclusivas del B-1 ...
        ],
        'B-2': [
            {'nombre': 'Manguera 50mm', 'categoria': 'AGUA', 'cantidad': 15, 'ubicacion': 'Cajoneras'},
            {'nombre': 'Hacha', 'categoria': 'HERRAMIENTAS', 'cantidad': 1, 'ubicacion': 'Cabina'},
            # ... cosas que solo lleva el B-2 ...
        ],
        'R-1': [
            {'nombre': 'Holmatro', 'categoria': 'RESCATE', 'cantidad': 1, 'ubicacion': 'Cajonera 1'},
            # ... inventario de rescate ...
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

        lista_items = self.PAUTAS_ESTANDAR.get(carro.nombre)
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