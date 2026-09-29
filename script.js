/**
 * Calculadora de notas - Psicología Social
 */

const PESOS_UNIDADES = {
    1: 0.30,
    2: 0.35,
    3: 0.35
};

const NOTA_MINIMA_APROBATORIA = 10.5;
const STORAGE_KEY = 'notas_psicologia_v3';

const inputs = Array.from(document.querySelectorAll('.grade-input'));
const unitSelectors = Array.from(document.querySelectorAll('.unit-selector'));
const unitPanels = Array.from(document.querySelectorAll('.unit-panel'));
const carousel = document.getElementById('units-carousel');

const outPromedio = document.getElementById('promedio-final');
const promedioLabel = document.getElementById('promedio-label');
const outEstado = document.getElementById('estado');
const metaContainer = document.getElementById('meta-container');
const btnBorrar = document.getElementById('btn-borrar');

const outputsUnidad = {
    1: document.getElementById('unidad1-total'),
    2: document.getElementById('unidad2-total'),
    3: document.getElementById('unidad3-total')
};

let scrollFrame = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    calcularTodo();
    marcarUnidadActiva(1);
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
        irAUnidad(Number(selector.dataset.unit));
    });
});

carousel.addEventListener('scroll', () => {
    if (scrollFrame) {
        cancelAnimationFrame(scrollFrame);
    }

    scrollFrame = requestAnimationFrame(() => {
        const ancho = carousel.clientWidth;

        if (!ancho) {
            return;
        }

        const unidadVisible = Math.min(
            3,
            Math.max(1, Math.round(carousel.scrollLeft / ancho) + 1)
        );

        marcarUnidadActiva(unidadVisible);
    });
}, { passive: true });

window.addEventListener('resize', () => {
    const activa = Number(
        document.querySelector('.unit-selector.active')?.dataset.unit || 1
    );

    irAUnidad(activa, false);
});

btnBorrar.addEventListener('click', () => {
    if (!confirm('¿Deseas borrar todas tus notas?')) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);

    inputs.forEach(input => {
        input.value = '';
    });

    calcularTodo();
    irAUnidad(1);
});

function irAUnidad(numeroUnidad, animar = true) {
    const panel = document.querySelector(
        `.unit-panel[data-unit-panel="${numeroUnidad}"]`
    );

    if (!panel) {
        return;
    }

    carousel.scrollTo({
        left: (numeroUnidad - 1) * carousel.clientWidth,
        behavior: animar ? 'smooth' : 'auto'
    });

    marcarUnidadActiva(numeroUnidad);
}

function marcarUnidadActiva(numeroUnidad) {
    unitSelectors.forEach(selector => {
        selector.classList.toggle(
            'active',
            Number(selector.dataset.unit) === numeroUnidad
        );
    });
}

function validarEntrada(input) {
    const valor = parseFloat(input.value);

    if (Number.isNaN(valor)) {
        return;
    }

    if (valor < 0) {
        input.value = 0;
    } else if (valor > 20) {
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
    const panel = document.querySelector(
        `.unit-panel[data-unit-panel="${numeroUnidad}"]`
    );

    const inputsUnidad = panel
        ? Array.from(panel.querySelectorAll('.grade-input'))
        : [];

    let notaAcumulada = 0;
    let pesoPendiente = 0;
    let cantidadIngresada = 0;

    inputsUnidad.forEach(input => {
        const peso = parseFloat(input.dataset.weight);
        const valor = parseFloat(input.value);

        if (Number.isNaN(valor)) {
            pesoPendiente += peso;
            return;
        }

        notaAcumulada += valor * peso;
        cantidadIngresada += 1;
    });

    return {
        numeroUnidad,
        notaAcumulada,
        pesoPendiente,
        cantidadIngresada,
        cantidadTotal: inputsUnidad.length,
        completa: cantidadIngresada === inputsUnidad.length
    };
}

function calcularTodo() {
    const unidades = [1, 2, 3].map(obtenerDatosUnidad);

    unidades.forEach(unidad => {
        outputsUnidad[unidad.numeroUnidad].textContent =
            unidad.cantidadIngresada === 0
                ? '--'
                : unidad.notaAcumulada.toFixed(2);
    });

    const cantidadTotalIngresada = unidades.reduce(
        (total, unidad) => total + unidad.cantidadIngresada,
        0
    );

    const promedioAcumulado = unidades.reduce(
        (total, unidad) =>
            total + unidad.notaAcumulada * PESOS_UNIDADES[unidad.numeroUnidad],
        0
    );

    const todasCompletas = unidades.every(unidad => unidad.completa);

    if (cantidadTotalIngresada === 0) {
        promedioLabel.textContent = 'Promedio acumulado';
        outPromedio.textContent = '--';
        outEstado.textContent = 'Ingresa tus notas';
        outEstado.className = 'status';
        metaContainer.textContent =
            'Completa tus evaluaciones. Cada unidad se calculará de forma independiente.';
        return;
    }

    outPromedio.textContent = promedioAcumulado.toFixed(2);

    if (todasCompletas) {
        promedioLabel.textContent = 'Promedio final';
        actualizarEstadoFinal(promedioAcumulado);
        actualizarMetaFinal(promedioAcumulado);
        return;
    }

    promedioLabel.textContent = 'Promedio acumulado';
    outEstado.textContent = 'EN PROGRESO';
    outEstado.className = 'status progreso';
    actualizarMetaPendiente(unidades, promedioAcumulado);
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

function actualizarMetaPendiente(unidades, promedioAcumulado) {
    let cantidadPendiente = 0;
    let pesoPendienteCurso = 0;

    unidades.forEach(unidad => {
        const panel = document.querySelector(
            `.unit-panel[data-unit-panel="${unidad.numeroUnidad}"]`
        );

        if (!panel) {
            return;
        }

        panel.querySelectorAll('.grade-input').forEach(input => {
            if (input.value !== '') {
                return;
            }

            cantidadPendiente += 1;
            pesoPendienteCurso +=
                parseFloat(input.dataset.weight) *
                PESOS_UNIDADES[unidad.numeroUnidad];
        });
    });

    const puntosFaltantes =
        NOTA_MINIMA_APROBATORIA - promedioAcumulado;

    if (puntosFaltantes <= 0) {
        metaContainer.innerHTML =
            'Con lo registrado ya acumulas al menos <strong>10.5</strong>. Aún faltan evaluaciones por completar.';
        return;
    }

    if (pesoPendienteCurso <= 0) {
        return;
    }

    const notaNecesaria = puntosFaltantes / pesoPendienteCurso;

    if (notaNecesaria > 20) {
        metaContainer.innerHTML =
            'Con las notas actuales, aun sacando <strong>20</strong> en todo lo pendiente, no se alcanzaría 10.5.';
        return;
    }

    metaContainer.innerHTML =
        `Necesitas promediar <strong>${notaNecesaria.toFixed(2)}</strong> en las ${cantidadPendiente} notas faltantes para llegar a 10.5.`;
}

function actualizarMetaFinal(promedioFinal) {
    if (promedioFinal >= NOTA_MINIMA_APROBATORIA) {
        metaContainer.innerHTML =
            `Promedio final: <strong>${promedioFinal.toFixed(2)}</strong>. Superaste la nota mínima de 10.5.`;
    } else {
        metaContainer.innerHTML =
            `Promedio final: <strong>${promedioFinal.toFixed(2)}</strong>. La nota mínima aprobatoria es 10.5.`;
    }
}
