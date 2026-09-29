/**
 * Lógica - Calculadora de Notas
 * Psicología Social
 */

const PESOS_UNIDADES = {
    1: 0.30,
    2: 0.35,
    3: 0.35
};

const NOTA_MINIMA_APROBATORIA = 10.5;
const STORAGE_KEY = 'notas_psicologia_v3';
const STORAGE_KEYS_ANTERIORES = ['notas_psicologia', 'notas_psicologia_v2'];

const inputs = Array.from(document.querySelectorAll('.grade-input'));
const unitSelectors = Array.from(document.querySelectorAll('.unit-selector'));
const unitPanels = Array.from(document.querySelectorAll('.unit-panel'));

const outPromedio = document.getElementById('promedio-final');
const outEstado = document.getElementById('estado');
const metaContainer = document.getElementById('meta-container');
const btnBorrar = document.getElementById('btn-borrar');

const outputsUnidad = {
    1: document.getElementById('unidad1-total'),
    2: document.getElementById('unidad2-total'),
    3: document.getElementById('unidad3-total')
};

document.addEventListener('DOMContentLoaded', () => {
    STORAGE_KEYS_ANTERIORES.forEach(clave => localStorage.removeItem(clave));
    cargarDatos();
    calcularTodo();
});

inputs.forEach(input => {
    input.addEventListener('input', event => {
        validarEntrada(event.target);
        guardarDatos();
        calcularTodo();
    });
});

unitSelectors.forEach(selector => {
    selector.addEventListener('click', () => {
        activarUnidad(selector.dataset.target);
    });
});

btnBorrar.addEventListener('click', () => {
    if (confirm('¿Deseas borrar todas tus notas?')) {
        localStorage.removeItem(STORAGE_KEY);

        inputs.forEach(input => {
            input.value = '';
        });

        activarUnidad('unidad1-panel');
        calcularTodo();
    }
});

function activarUnidad(panelId) {
    unitSelectors.forEach(selector => {
        selector.classList.toggle('active', selector.dataset.target === panelId);
    });

    unitPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === panelId);
    });
}

function validarEntrada(input) {
    const valor = parseFloat(input.value);

    if (Number.isNaN(valor)) {
        return;
    }

    if (valor < 0) {
        input.value = 0;
    }

    if (valor > 20) {
        input.value = 20;
    }
}

function guardarDatos() {
    const notas = {};

    inputs.forEach(input => {
        if (input.value !== '') {
            notas[input.id] = input.value;
        }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
}

function cargarDatos() {
    const datosGuardados = localStorage.getItem(STORAGE_KEY);

    if (!datosGuardados) {
        return;
    }

    try {
        const notasGuardadas = JSON.parse(datosGuardados);

        inputs.forEach(input => {
            if (notasGuardadas[input.id] !== undefined) {
                input.value = notasGuardadas[input.id];
            }
        });
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
    }
}

function obtenerDatosUnidad(numeroUnidad) {
    const inputsUnidad = inputs.filter(input => Number(input.dataset.unit) === numeroUnidad);

    let notaAcumulada = 0;
    let pesoIngresado = 0;
    let cantidadIngresada = 0;

    inputsUnidad.forEach(input => {
        const peso = parseFloat(input.dataset.weight);
        const valor = parseFloat(input.value);

        if (Number.isNaN(valor)) {
            return;
        }

        notaAcumulada += valor * peso;
        pesoIngresado += peso;
        cantidadIngresada += 1;
    });

    const completa = cantidadIngresada === inputsUnidad.length;

    return {
        numeroUnidad,
        inputsUnidad,
        notaAcumulada,
        pesoIngresado,
        cantidadIngresada,
        cantidadTotal: inputsUnidad.length,
        completa
    };
}

function calcularTodo() {
    const unidades = [
        obtenerDatosUnidad(1),
        obtenerDatosUnidad(2),
        obtenerDatosUnidad(3)
    ];

    unidades.forEach(unidad => {
        outputsUnidad[unidad.numeroUnidad].textContent = unidad.completa
            ? unidad.notaAcumulada.toFixed(2)
            : '--';
    });

    const todasCompletas = unidades.every(unidad => unidad.completa);

    if (!todasCompletas) {
        outPromedio.textContent = '--';
        outEstado.textContent = 'Faltan notas';
        outEstado.className = 'status';
        actualizarMetaPendiente(unidades);
        return;
    }

    const promedioFinal = unidades.reduce((acumulado, unidad) => {
        return acumulado + (unidad.notaAcumulada * PESOS_UNIDADES[unidad.numeroUnidad]);
    }, 0);

    outPromedio.textContent = promedioFinal.toFixed(2);
    actualizarEstadoFinal(promedioFinal);
    actualizarMetaFinal(promedioFinal);
}

function actualizarEstadoFinal(promedioFinal) {
    if (promedioFinal >= NOTA_MINIMA_APROBATORIA) {
        outEstado.innerHTML = '🟢 APROBADO';
        outEstado.className = 'status aprobado';
    } else {
        outEstado.innerHTML = '🔴 DESAPROBADO';
        outEstado.className = 'status desaprobado';
    }
}

function actualizarMetaPendiente(unidades) {
    const unidadPendiente = unidades.find(unidad => !unidad.completa);

    if (!unidadPendiente) {
        return;
    }

    const faltantes = unidadPendiente.cantidadTotal - unidadPendiente.cantidadIngresada;

    metaContainer.innerHTML = `Unidad ${numeroRomano(unidadPendiente.numeroUnidad)}: faltan <strong>${faltantes}</strong> ${faltantes === 1 ? 'evaluación' : 'evaluaciones'} por completar.`;
}

function actualizarMetaFinal(promedioFinal) {
    if (promedioFinal >= NOTA_MINIMA_APROBATORIA) {
        metaContainer.innerHTML = `Promedio final: <strong>${promedioFinal.toFixed(2)}</strong>. Superaste la nota mínima de 10.5.`;
    } else {
        metaContainer.innerHTML = `Promedio final: <strong>${promedioFinal.toFixed(2)}</strong>. La nota mínima aprobatoria es 10.5.`;
    }
}

function numeroRomano(numero) {
    return {
        1: 'I',
        2: 'II',
        3: 'III'
    }[numero];
}
