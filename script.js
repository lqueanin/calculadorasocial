/**
 * Lógica - Calculadora de Notas
 */

const NOTA_U1 = 7.10;
const PESO_U1 = 0.30;
const NOTA_U2 = 11.70;
const PESO_U2 = 0.35;
const PESO_U3 = 0.35;
const NOTA_MINIMA_APROBATORIA = 10.5;

const inputs = document.querySelectorAll('input[type="number"]');
const outU3Total = document.getElementById('unidad3-total');
const outPromedio = document.getElementById('promedio-final');
const outEstado = document.getElementById('estado');
const metaContainer = document.getElementById('meta-container');
const btnBorrar = document.getElementById('btn-borrar');

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    calcularTodo();
});

inputs.forEach(input => {
    input.addEventListener('input', (e) => {
        validarEntrada(e.target);
        guardarDatos();
        calcularTodo();
    });
});

btnBorrar.addEventListener('click', () => {
    if (confirm('¿Deseas borrar todas tus notas?')) {
        localStorage.removeItem('notas_psicologia');
        inputs.forEach(input => input.value = '');
        calcularTodo();
    }
});

function validarEntrada(input) {
    let valor = parseFloat(input.value);
    if (isNaN(valor)) return;
    if (valor < 0) input.value = 0;
    if (valor > 20) input.value = 20;
}

function guardarDatos() {
    const notas = {};
    inputs.forEach(input => {
        if (input.value !== '') notas[input.id] = input.value;
    });
    localStorage.setItem('notas_psicologia', JSON.stringify(notas));
}

function cargarDatos() {
    const notasGuardadas = JSON.parse(localStorage.getItem('notas_psicologia'));
    if (notasGuardadas) {
        inputs.forEach(input => {
            if (notasGuardadas[input.id] !== undefined) {
                input.value = notasGuardadas[input.id];
            }
        });
    }
}

function calcularTodo() {
    let puntosU3Acumulados = 0;
    let pesoU3Pendiente = 0;

    inputs.forEach(input => {
        const peso = parseFloat(input.getAttribute('data-weight'));
        const valor = parseFloat(input.value);

        if (!isNaN(valor)) {
            puntosU3Acumulados += (valor * peso);
        } else {
            pesoU3Pendiente += peso;
        }
    });

    outU3Total.textContent = puntosU3Acumulados.toFixed(2);

    const aporteU1 = NOTA_U1 * PESO_U1;
    const aporteU2 = NOTA_U2 * PESO_U2;
    const aporteU3 = puntosU3Acumulados * PESO_U3;
    const promedioActual = aporteU1 + aporteU2 + aporteU3;
    
    if (pesoU3Pendiente === 1) { 
        outPromedio.textContent = "--";
    } else {
        outPromedio.textContent = promedioActual.toFixed(2);
    }

    actualizarEstado(promedioActual, pesoU3Pendiente);
    actualizarMeta(promedioActual, pesoU3Pendiente);
}

function actualizarEstado(promedioActual, pesoU3Pendiente) {
    if (pesoU3Pendiente === 1) {
        outEstado.textContent = "Ingresa notas para calcular";
        outEstado.className = "status";
        return;
    }

    if (promedioActual >= NOTA_MINIMA_APROBATORIA) {
        outEstado.innerHTML = "🟢 APROBADO";
        outEstado.className = "status aprobado";
    } else {
        outEstado.innerHTML = "🔴 DESAPROBADO";
        outEstado.className = "status desaprobado";
    }
}

function actualizarMeta(promedioActual, pesoU3Pendiente) {
    const puntosFaltantesTotal = NOTA_MINIMA_APROBATORIA - promedioActual;

    if (puntosFaltantesTotal <= 0) {
        metaContainer.innerHTML = "🎉 <strong>¡Aprobaste!</strong> Ya superaste el 10.5";
        return;
    }

    if (pesoU3Pendiente === 0) {
        metaContainer.innerHTML = "📝 Evaluaciones completadas.";
        return;
    }

    const notaBrutaNecesariaU3 = puntosFaltantesTotal / PESO_U3; 
    const notaPromedioNecesaria = notaBrutaNecesariaU3 / pesoU3Pendiente;

    if (notaPromedioNecesaria > 20) {
        metaContainer.innerHTML = "⚠️ <strong>Matemáticamente imposible.</strong> Ni con 20 en todo logras aprobar.";
    } else {
        const inputsVacios = Array.from(inputs).filter(input => input.value === '').length;
        metaContainer.innerHTML = `Necesitas promediar <strong>${notaPromedioNecesaria.toFixed(2)}</strong> en las ${inputsVacios} notas faltantes.`;
    }
}