from django.db import models
from usuarios.models import Bombero
from carros.models import Carro

# --- 1. MODELOS AUXILIARES (TIPOS) ---
class TipoEmergencia(models.Model):
    codigo = models.CharField(max_length=10, unique=True)
    descripcion = models.CharField(max_length=255)
    def __str__(self): return f"{self.codigo} - {self.descripcion}"

class SubTipoEmergencia(models.Model):
    tipo_padre = models.ForeignKey(TipoEmergencia, on_delete=models.CASCADE, related_name='subtipos')
    codigo_subtipo = models.CharField(max_length=10)
    descripcion = models.CharField(max_length=255)
    def __str__(self): return f"{self.tipo_padre.codigo} {self.codigo_subtipo} - {self.descripcion}"

# --- 2. MODELO PRINCIPAL (PARTE) ---
class Parte(models.Model):
    fecha_hora_emergencia = models.DateTimeField()
    lugar = models.CharField(max_length=255)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)
    # Relaciones
    tipo_emergencia = models.ForeignKey(TipoEmergencia, on_delete=models.PROTECT)
    subtipo_emergencia = models.ForeignKey(SubTipoEmergencia, on_delete=models.PROTECT, null=True, blank=True)
    
    # Responsables
    quien_anoto = models.ForeignKey(Bombero, on_delete=models.SET_NULL, null=True, related_name='partes_anotados')
    jefe_a_cargo = models.ForeignKey(Bombero, on_delete=models.SET_NULL, null=True, related_name='partes_a_cargo')
    
    # Datos Personas
    afectado_rut = models.CharField(max_length=20, blank=True, null=True)
    afectado_nombre = models.CharField(max_length=255, blank=True, null=True)
    afectado_telefono = models.CharField(max_length=20, blank=True, null=True)
    denunciante_rut = models.CharField(max_length=20, blank=True, null=True)
    denunciante_nombre = models.CharField(max_length=255, blank=True, null=True)

    # Datos Vehículo
    vehiculo_patente = models.CharField(max_length=20, blank=True, null=True)
    vehiculo_marca = models.CharField(max_length=50, blank=True, null=True)
    vehiculo_modelo = models.CharField(max_length=50, blank=True, null=True)
    vehiculo_color = models.CharField(max_length=30, blank=True, null=True)
    vehiculo_tipo = models.CharField(max_length=50, blank=True, null=True)

    descripcion = models.TextField()
    hora_extincion = models.TimeField(null=True, blank=True)

    #Estado
    ESTADOS_PARTE = [
        ('BORRADOR', 'Borrador'),
        ('REVISION', 'En Revisión'),
        ('CERRADO', 'Cerrado / Aprobado'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADOS_PARTE, default='BORRADOR')

    # Snapshots
    jefe_a_cargo_rango = models.CharField(max_length=100, blank=True, null=True)
    jefe_a_cargo_compania = models.CharField(max_length=50, blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.jefe_a_cargo:
            self.jefe_a_cargo_rango = self.jefe_a_cargo.rango
            self.jefe_a_cargo_compania = self.jefe_a_cargo.compania
        super().save(*args, **kwargs)

    def __str__(self):
        fecha_formateada = self.fecha_hora_emergencia.strftime('%d-%m-%Y')
        return f"Parte en {self.lugar} - {fecha_formateada}"

# --- 3. ASISTENCIA CARROS ---
class AsistenciaCarro(models.Model):
    parte = models.ForeignKey(Parte, on_delete=models.CASCADE, related_name='asistencias_carros')
    carro = models.ForeignKey(Carro, on_delete=models.PROTECT)
    conductor = models.ForeignKey(Bombero, on_delete=models.SET_NULL, null=True, related_name='conducciones')
    conductor_rango = models.CharField(max_length=100, blank=True, null=True)
    conductor_compania = models.CharField(max_length=50, blank=True, null=True)

    hora_salida_cuartel = models.TimeField(null=True, blank=True)
    hora_llegada_emergencia = models.TimeField(null=True, blank=True)
    hora_retirada_emergencia = models.TimeField(null=True, blank=True)
    hora_llegada_cuartel = models.TimeField(null=True, blank=True)
    km_salida = models.IntegerField(default=0)
    km_llegada = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if self.conductor:
            self.conductor_rango = self.conductor.rango
            self.conductor_compania = self.conductor.compania
        super().save(*args, **kwargs)
        
    def __str__(self): return f"Carro {self.carro.nombre}"

# --- 4. ASISTENCIA PERSONAL ---
class AsistenciaBombero(models.Model):
    parte = models.ForeignKey(Parte, on_delete=models.CASCADE, related_name='asistencias_bomberos')
    bombero = models.ForeignKey(Bombero, on_delete=models.CASCADE)
    rango = models.CharField(max_length=100, blank=True, null=True)
    compania = models.CharField(max_length=50, blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.bombero:
            self.rango = self.bombero.rango
            self.compania = self.bombero.compania
        super().save(*args, **kwargs)

    def __str__(self): return f"{self.bombero} en {self.parte}"

# --- 5. APOYO EXTERNO (NUEVO) ---
class ApoyoExterno(models.Model):
    parte = models.ForeignKey(Parte, on_delete=models.CASCADE, related_name='apoyos_externos')
    institucion = models.CharField(max_length=50) # SAMU, CARABINEROS...
    a_cargo = models.CharField(max_length=100, blank=True, null=True)
    patente = models.CharField(max_length=50, blank=True, null=True)
    cantidad = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.institucion} en Parte {self.parte.id}"