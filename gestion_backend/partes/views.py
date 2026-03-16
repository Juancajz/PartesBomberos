from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import TipoEmergencia, SubTipoEmergencia, Parte, AsistenciaCarro, AsistenciaBombero
from carros.models import Carro
from usuarios.models import Bombero
from .serializers import (
    TipoEmergenciaSerializer, SubTipoEmergenciaSerializer, 
    ParteSerializer, AsistenciaCarroSerializer, AsistenciaBomberoSerializer
)
from django.utils import timezone
from django.db.models import Count
import datetime

# --- VIEWSETS ESTÁNDAR (CRUD BÁSICO) ---

class TipoEmergenciaViewSet(viewsets.ModelViewSet):
    queryset = TipoEmergencia.objects.all()
    serializer_class = TipoEmergenciaSerializer

class SubTipoEmergenciaViewSet(viewsets.ModelViewSet):
    queryset = SubTipoEmergencia.objects.all()
    serializer_class = SubTipoEmergenciaSerializer

class ParteViewSet(viewsets.ModelViewSet):
    queryset = Parte.objects.all().order_by('-fecha_hora_emergencia')
    serializer_class = ParteSerializer

class AsistenciaCarroViewSet(viewsets.ModelViewSet):
    queryset = AsistenciaCarro.objects.all()
    serializer_class = AsistenciaCarroSerializer

class AsistenciaBomberoViewSet(viewsets.ModelViewSet):
    queryset = AsistenciaBombero.objects.all()
    serializer_class = AsistenciaBomberoSerializer

# --- FUNCIONES PERSONALIZADAS ---
@api_view(['GET'])
def dashboard_inicio(request):
    """Devuelve las estadísticas básicas para el Dashboard"""
    total_partes = Parte.objects.count()
    partes_mes = Parte.objects.filter(fecha_hora_emergencia__month=timezone.now().month).count()
    
    # Emergencias por tipo para el gráfico
    emergencias_por_tipo = Parte.objects.values('tipo_emergencia__codigo')\
                                        .annotate(total=Count('id'))\
                                        .order_by('-total')[:5]
    
    # Top 5 voluntarios con más asistencias
    top_voluntarios = AsistenciaBombero.objects.values('bombero__first_name', 'bombero__last_name')\
                                             .annotate(asistencias=Count('id'))\
                                             .order_by('-asistencias')[:5]
                                             
    # --- LO QUE FALTABA: Las últimas 5 emergencias para la lista ---
    ultimos_partes = Parte.objects.all().order_by('-fecha_hora_emergencia')[:5]
    recientes_data = []
    for p in ultimos_partes:
        recientes_data.append({
            "id": p.id,
            "lugar": p.lugar,
            "fecha_hora_emergencia": p.fecha_hora_emergencia.isoformat(),
            "tipo_detalle": {
                "codigo": p.tipo_emergencia.codigo if p.tipo_emergencia else "S/C"
            }
        })

    # Datos de la Guardia (Ajusta esto si tienes un modelo real de guardias)
    import locale
    try:
        locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8') # Para que el mes salga en español
    except:
        pass
        
    guardia_data = {
        "compania": "Turno General", 
        "mes": timezone.now().strftime("%B %Y").capitalize()
    }
                                             
    return Response({
        'total_partes': total_partes,
        'total_mes': partes_mes, 
        'emergencias_por_tipo': list(emergencias_por_tipo),
        'top_voluntarios': list(top_voluntarios),
        'recientes': recientes_data, 
        'guardia': guardia_data
    })

# --- FUNCIONES DE DESPACHO Y CENTRAL ---

@api_view(['POST'])
def despachar_emergencia(request):
    try:
        data = request.data
        tipo_id = data.get('tipo_emergencia')
        lugar = data.get('lugar')
        carros_ids = data.get('carros_seleccionados', [])
        
        # Validamos que el tipo existe para no enviar basura
        tipo = TipoEmergencia.objects.get(id=tipo_id)
        
        # Generamos un ID único temporal para el frontend
        import time
        emergencia_id = int(time.time()) 

        return Response({
            "mensaje": "Despacho procesado",
            "emergencia_id": emergencia_id,
            "hora_despacho": datetime.datetime.now().strftime("%H:%M"),
            "codigo_texto": tipo.codigo
        }, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def obtener_emergencias_activas(request):
    """Devuelve todas las emergencias en estado BORRADOR para la columna derecha de la Central"""
    try:
        partes_activos = Parte.objects.filter(estado='BORRADOR').order_by('-fecha_hora_emergencia')
        data = []
        
        for parte in partes_activos:
            carros_ids = AsistenciaCarro.objects.filter(parte=parte).values_list('carro_id', flat=True)
            
            data.append({
                "id": parte.id,
                "tipo_emergencia": parte.tipo_emergencia.id,
                "codigo_texto": parte.tipo_emergencia.codigo,
                "lugar": parte.lugar,
                "latitud": parte.latitud,
                "longitud": parte.longitud,
                "descripcion": parte.descripcion,
                "hora": parte.fecha_hora_emergencia.strftime("%H:%M"),
                "carros": list(carros_ids),
                "responsable_edicion_id": parte.responsable_edicion.id if parte.responsable_edicion else None,
                "responsable_edicion_nombre": parte.responsable_edicion.get_full_name() if parte.responsable_edicion else "Sin asignar"
            })
            
        return Response(data, status=200)
    except Exception as e:
        print(f"Error al obtener emergencias activas: {e}")
        return Response({"error": str(e)}, status=500)

