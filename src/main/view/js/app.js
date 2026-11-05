// Lógica de la pantalla (Vue). Depende de utilidades.js y mapa.js
const { createApp } = Vue;

createApp({
  data() {
    return {
      terminales: [],
      destinos: [],
      etiquetas: {},
      coordenadas: {},
      fechas: { desde: '', hasta: '' },
      origen: 'Loja',
      destino: '',
      fecha: '',
      horas: [],
      hora: '',
      criterio: 'tiempo',
      ruta: null,
      error: '',
      buscado: false,
      cargando: false,
      cargandoHoras: false,
      horasRequestId: 0,
    };
  },

  watch: {
    origen() {
      this.cargarHoras();
    },
    destino() {
      this.cargarHoras();
    },
  },

  async mounted() {
    try {
      const r = await fetch('/api/terminales');
      if (!r.ok) throw new Error('No se pudo cargar la información de terminales');
      const datos = await r.json();
      this.terminales = datos.terminales;
      this.destinos = datos.destinos;
      this.etiquetas = datos.etiquetas || {};
      this.coordenadas = datos.coordenadas || {};
      this.fechas = datos.fechas;
      this.fecha = datos.fechas.desde; // hoy
      this.origen = datos.origen; // siempre la Terminal Terrestre de Loja
      this.destino = this.destinos.some((d) => d.terminal === 'Cariamanga')
        ? 'Cariamanga'
        : this.destinos[0]?.terminal || '';
    } catch {
      this.error = 'No se pudo conectar con el servidor.';
    }
    MapaRutas.iniciar('mapa', this.coordenadas);
  },

  methods: {
    async cargarHoras() {
      const requestId = ++this.horasRequestId;
      if (!this.origen || !this.destino || this.origen === this.destino) {
        this.horas = [];
        this.hora = '';
        this.cargandoHoras = false;
        return;
      }

      this.cargandoHoras = true;
      this.error = '';
      try {
        const params = new URLSearchParams({ origen: this.origen, destino: this.destino });
        const r = await fetch('/api/horarios?' + params);
        const datos = await r.json();
        if (requestId !== this.horasRequestId) return;
        if (!r.ok) {
          this.error = datos.error || 'No se pudieron cargar los horarios.';
          this.horas = [];
          this.hora = '';
          return;
        }
        this.horas = Array.isArray(datos.horas) ? datos.horas : [];
        if (!this.horas.includes(this.hora)) this.hora = this.horas[0] || '';
      } catch {
        if (requestId !== this.horasRequestId) return;
        this.error = 'No se pudo conectar con el servidor.';
        this.horas = [];
        this.hora = '';
      } finally {
        if (requestId === this.horasRequestId) this.cargandoHoras = false;
      }
    },

    async buscar() {
      if (!this.hora) return;
      this.error = '';
      this.ruta = null;
      this.cargando = true;
      MapaRutas.limpiar();

      const params = new URLSearchParams({
        origen: this.origen,
        destino: this.destino,
        criterio: this.criterio,
        desde: `${this.fecha}T${this.hora}:00-05:00`, // zona horaria de Ecuador
      });

      try {
        const r = await fetch('/api/ruta?' + params);
        const datos = await r.json();
        if (!r.ok) this.error = datos.error;
        else this.ruta = datos.ruta;
        this.buscado = true;
        MapaRutas.dibujarRuta(this.ruta, this.coordenadas);
      } catch {
        this.error = 'No se pudo conectar con el servidor.';
      } finally {
        this.cargando = false;
      }
    },

    horaLegible(hora) {
      return new Date(`2000-01-01T${hora}:00-05:00`).toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Guayaquil',
      });
    },
    hora12: Util.hora12,
    minutos: Util.minutos,
  },
}).mount('#app');
