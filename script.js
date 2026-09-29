/**
 * Lógica - Calculadora de Notas
 * Psicología Social
 */

const PESO_U1 = 0.30;
const PESO_U2 = 0.35;
const PESO_U3 = 0.35;
const NOTA_MINIMA_APROBATORIA = 10.5;
const STORAGE_KEY = 'notas_psicologia_v2';
const STORAGE_KEY_ANTERIOR = 'notas_psicologia';

const inputU1 = document.getElementById('unidad1');
const inputU2 = document.getElementById('unidad2');
const inputsU3 = Array.from(document.querySelectorAll('.u3-input'));
const inputs = Array.from(document.querySelectorAll('input[type="number"]'));

const outU3Total = document.getElementById('unidad3-total');
const outPromedio = document.getElementById('promedio-final');
const outEstado = document.getElementById('estado');
const metaContainer = document.getElementById('meta-container');
const btnBorrar = document.getElementById('btn-borrar');

document.addEventListener('DOMContentLoaded', () => {
    // La versión anterior tenía notas precargadas/guardadas solo para Unidad III.
    // Se elimina esa clave para que esta nueva versión comience vacía.
    localStorage.removeItem(STORAGE_KEY_ANTERIOR);

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

btnBorrar.addEventListener('click', () => {
    if (confirm('¿Deseas borrar todas tus notas?')) {
        localStorage.removeItem(STORAGE_KEY);
        inputs.forEach(input => {
            input.value = '';
        });
        calcularTodo();
    }
});

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

function obtenerDatosUnidad3() {
    let notaAcumulada = 0;
    let pesoPendiente = 0;
    let cantidadIngresada = 0;

    inputsU3.forEach(input => {
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
        notaAcumulada,
        pesoPendiente,
        cantidadIngresada
    };
}

function calcularTodo() {
    const notaU1 = parseFloat(inputU1.value);
    const notaU2 = parseFloat(inputU2.value);
    const unidad3 = obtenerDatosUnidad3();

    outU3Total.textContent = unidad3.cantidadIngresada === 0
        ? '--'
        : unidad3.notaAcumulada.toFixed(2);

    const faltaU1 = Number.isNaN(notaU1);
    const faltaU2 = Number.isNaN(notaU2);

    if (faltaU1 || faltaU2) {
        outPromedio.textContent = '--';
        actualizarEstadoIncompleto(faltaU1, faltaU2);
        actualizarMetaSinUnidadesBase(faltaU1, faltaU2);
        return;
    }

    const aporteU1 = notaU1 * PESO_U1;
    const aporteU2 = notaU2 * PESO_U2;
    const aporteU3 = unidad3.notaAcumulada * PESO_U3;
    const promedioCalculado = aporteU1 + aporteU2 + aporteU3;

    if (unidad3.pesoPendiente > 0.0001) {
        outPromedio.textContent = '--';
        outEstado.textContent = 'Faltan notas de Unidad III';
        outEstado.className = 'status';
    } else {
        outPromedio.textContent = promedioCalculado.toFixed(2);
        actualizarEstadoFinal(promedioCalculado);
    }

    actualizarMeta(notaU1, notaU2, unidad3, promedioCalculado);
}

function actualizarEstadoIncompleto(faltaU1, faltaU2) {
    if (faltaU1 && faltaU2) {
        outEstado.textContent = 'Ingresa Unidad I y II';
    } else if (faltaU1) {
        outEstado.textContent = 'Ingresa Unidad I';
    } else {
        outEstado.textContent = 'Ingresa Unidad II';
    }

    outEstado.className = 'status';
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

function actualizarMetaSinUnidadesBase(faltaU1, faltaU2) {
    if (faltaU1 && faltaU2) {
        metaContainer.textContent = 'Ingresa los promedios de las Unidades I y II para calcular cuánto necesitas en la Unidad III.';
    } else if (faltaU1) {
        metaContainer.textContent = 'Ingresa el promedio de la Unidad I para continuar con el cálculo.';
    } else {
        metaContainer.textContent = 'Ingresa el promedio de la Unidad II para continuar con el cálculo.';
    }
}

function actualizarMeta(notaU1, notaU2, unidad3, promedioCalculado) {
    if (unidad3.pesoPendiente <= 0.0001) {
        metaContainer.textContent = '📝 Todas las evaluaciones están completas.';
        return;
    }

    const puntosFaltantes = NOTA_MINIMA_APROBATORIA - promedioCalculado;

    if (puntosFaltantes <= 0) {
        metaContainer.innerHTML = '🎉 <strong>Ya alcanzaste el mínimo para aprobar.</strong> Incluso dejando en 0 las evaluaciones pendientes mantendrías al menos 10.5.';
        return;
    }

    const aporteDisponiblePendiente = PESO_U3 * unidad3.pesoPendiente;
    const notaNecesariaEnPendientes = puntosFaltantes / aporteDisponiblePendiente;
    const cantidadPendiente = inputsU3.filter(input => input.value === '').length;

    if (notaNecesariaEnPendientes > 20) {
        metaContainer.innerHTML = '⚠️ <strong>Con las notas actuales no es posible llegar a 10.5</strong>, aun obteniendo 20 en todas las evaluaciones pendientes.';
        return;
    }

    metaContainer.innerHTML = `Necesitas aproximadamente <strong>${notaNecesariaEnPendientes.toFixed(2)}</strong> en cada una de las ${cantidadPendiente} evaluaciones pendientes para llegar a 10.5.`;
}
