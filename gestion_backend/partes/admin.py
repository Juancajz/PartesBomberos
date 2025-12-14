from django.contrib import admin
from .models import TipoEmergencia, SubTipoEmergencia, Parte, AsistenciaCarro, AsistenciaBombero, ApoyoExterno

# =========================================================
# 1. CONFIGURACIÓN PARA VER DENTRO DEL PARTE (INLINES)
# =========================================================

class AsistenciaCarroInline(admin.TabularInline):
    model = AsistenciaCarro
    extra = 0
    verbose_name = "Carro"
    verbose_name_plural = "Carros en esta emergencia"

class AsistenciaBomberoInline(admin.TabularInline):
    model = AsistenciaBombero
    extra = 0
    verbose_name = "Voluntario"
    verbose_name_plural = "Lista de Asistencia"
    # raw_id_fields = ('bombero',) # Descomentar si tienes muchísimos bomberos

class ApoyoExternoInline(admin.TabularInline):
    model = ApoyoExterno
    extra = 0
    verbose_name = "Institución"
    verbose_name_plural = "Apoyo Externo"

# =========================================================
# 2. CONFIGURACIÓN DEL PARTE PRINCIPAL
# =========================================================

@admin.register(Parte)
class ParteAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_hora_emergencia', 'tipo_emergencia', 'lugar', 'jefe_a_cargo')
    list_filter = ('tipo_emergencia', 'fecha_hora_emergencia')
    search_fields = ('lugar', 'descripcion')
    date_hierarchy = 'fecha_hora_emergencia'
    
    # Aquí incrustamos las tablas dentro del parte
    inlines = [AsistenciaCarroInline, AsistenciaBomberoInline, ApoyoExternoInline]

# =========================================================
# 3. CONFIGURACIÓN PARA VER EN EL MENÚ PRINCIPAL (STANDALONE)
# =========================================================

@admin.register(AsistenciaBombero)
class AsistenciaBomberoAdmin(admin.ModelAdmin):
    # Esta es la vista tipo "Excel" para buscar asistencias específicas
    list_display = ('get_bombero', 'compania', 'get_parte_fecha', 'get_parte_lugar')
    list_filter = ('compania', 'bombero', 'parte__fecha_hora_emergencia')
    search_fields = ('bombero__first_name', 'bombero__last_name')

    @admin.display(description='Bombero')
    def get_bombero(self, obj): return f"{obj.bombero.first_name} {obj.bombero.last_name}"
    
    @admin.display(description='Fecha')
    def get_parte_fecha(self, obj): return obj.parte.fecha_hora_emergencia
    
    @admin.display(description='Lugar')
    def get_parte_lugar(self, obj): return obj.parte.lugar

@admin.register(AsistenciaCarro)
class AsistenciaCarroAdmin(admin.ModelAdmin):
    list_display = ('carro', 'get_conductor', 'km_salida', 'km_llegada')
    list_filter = ('carro',)

    @admin.display(description='Conductor')
    def get_conductor(self, obj): 
        return f"{obj.conductor.first_name} {obj.conductor.last_name}" if obj.conductor else "-"

@admin.register(ApoyoExterno)
class ApoyoExternoAdmin(admin.ModelAdmin):
    list_display = ('institucion', 'a_cargo', 'patente', 'get_parte')
    list_filter = ('institucion',)
    
    @admin.display(description='Emergencia')
    def get_parte(self, obj): return f"Parte #{obj.parte.id}"

# =========================================================
# 4. OTROS REGISTROS
# =========================================================
admin.site.register(TipoEmergencia)
admin.site.register(SubTipoEmergencia)