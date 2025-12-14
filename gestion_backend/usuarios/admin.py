from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Bombero
from datetime import date

@admin.register(Bombero)
class BomberoAdmin(UserAdmin):
    list_display = ('username', 'first_name', 'last_name', 'rango', 'compania', 'calcular_edad', 'is_active')
    list_filter = ('compania', 'rango', 'is_staff', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'rut')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {
            'fields': (
                'first_name', 'last_name', 'rut', 'email', 
                'fecha_nacimiento', 'calcular_edad' 
            )
        }),
        ('Datos Institucionales', {
            'fields': (
                'rango', 'compania', 'fecha_ingreso', 
                'is_staff', 'is_active'
            )
        }),
        ('Contacto y Emergencia', {
            'fields': (
                'telefono', 'direccion', 
                'contacto_emergencia_nombre', 'contacto_emergencia_telefono'
            )
        }),
        ('Datos Médicos', {
            'fields': (
                'grupo_sanguineo', 'alergias', 'enfermedades_cronicas'
            )
        }),
        ('Logística (Tallas)', {
            'fields': (
                'talla_polera', 'talla_pantalon', 'talla_calzado'
            )
        }),
        ('Permisos Avanzados', {
            'classes': ('collapse',),
            'fields': ('groups', 'user_permissions', 'last_login', 'date_joined'),
        }),
    )
    
    readonly_fields = ('calcular_edad', 'last_login', 'date_joined')

    def calcular_edad(self, obj):
        if obj.fecha_nacimiento:
            today = date.today()
            return today.year - obj.fecha_nacimiento.year - ((today.month, today.day) < (obj.fecha_nacimiento.month, obj.fecha_nacimiento.day))
        return "-"
    
    calcular_edad.short_description = 'Edad' # Título de la columna